"""
test_update_prices.py
=====================
Comprehensive test suite for back/scripts/update_prices.py.

Coverage:
    US 3.1 — Batch price fetching and DB upsert
    US 3.2 — Configuration via env-vars, timeout handling, exit-code contract

All external I/O (yfinance, psycopg2, sys.exit) is mocked so that no real
network or database connections are made during the test run.
"""

import os
import sys
import types
import threading
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch, call, PropertyMock

import pytest

# ---------------------------------------------------------------------------
# Path setup — make "back/scripts/" importable from this subdirectory
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# ---------------------------------------------------------------------------
# Stub yfinance and psycopg2 BEFORE importing update_prices so that the
# module-level "import yfinance as yf" and "import psycopg2" resolve to mocks.
# ---------------------------------------------------------------------------
_yf_stub = MagicMock(name="yfinance_stub")
sys.modules.setdefault("yfinance", _yf_stub)

_psycopg2_stub = MagicMock(name="psycopg2_stub")
sys.modules.setdefault("psycopg2", _psycopg2_stub)

import update_prices  # noqa: E402  (must come after path + stub setup)
from update_prices import (  # noqa: E402
    get_config,
    get_unique_tickers,
    upsert_stock_price,
    fetch_prices_batch,
    fetch_price_single,
    run_batch,
    main,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_conn(fetchall_return=None):
    """Return a mock psycopg2 connection with a cursor that returns rows."""
    conn = MagicMock(name="conn")
    cur = MagicMock(name="cursor")
    cur.fetchall.return_value = fetchall_return or []
    # Support the context manager protocol used by "with conn.cursor() as cur:"
    conn.cursor.return_value.__enter__ = MagicMock(return_value=cur)
    conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    return conn, cur


def _make_dataframe_stub(ticker_prices: dict):
    """
    Build a minimal pandas-free DataFrame stub whose ['Close'] slice
    behaves like a real multi-column DataFrame for the tickers given.
    """
    import pandas as pd

    if not ticker_prices:
        # empty DataFrame
        df = pd.DataFrame()
        df.empty = True  # attribute already true for empty DF
        return df

    close_data = {t: [p] for t, p in ticker_prices.items()}
    close_df = pd.DataFrame(close_data)
    outer = MagicMock(name="download_result")
    outer.empty = False
    outer.__getitem__ = MagicMock(return_value=close_df)
    return outer


# ---------------------------------------------------------------------------
# ─────────────────────────  US 3.1 — Unit Tests  ──────────────────────────
# ---------------------------------------------------------------------------


class TestSuccessfulTickerUpdate:
    """US 3.1 — A valid ticker must be fetched and persisted to the DB."""

    def test_successful_ticker_update_persists_price(self):  # US 3.1
        """
        Mock yf.download returning AAPL close price 190.50.
        Assert upsert_stock_price is called with the correct args and
        that run_batch returns success_count=1, error_count=0.
        """
        conn, cur = _make_conn()

        import pandas as pd

        close_series = pd.Series([190.50], name="AAPL")
        close_df = MagicMock(name="close_df")
        close_df.columns = ["AAPL"]
        close_df.__contains__ = MagicMock(return_value=True)
        close_df.__getitem__ = MagicMock(return_value=close_series.dropna())

        df_stub = MagicMock(name="download_df")
        df_stub.empty = False
        df_stub.__getitem__ = MagicMock(return_value=close_df)

        with patch("update_prices.yf") as mock_yf, \
             patch("update_prices.upsert_stock_price") as mock_upsert:

            mock_yf.download.return_value = df_stub

            config = {"fetch_timeout": 30}
            success, errors = run_batch(conn, ["AAPL"], config)

        assert success == 1  # US 3.1
        assert errors == 0   # US 3.1
        mock_upsert.assert_called_once()
        args = mock_upsert.call_args[0]
        assert args[0] is conn
        assert args[1] == "AAPL"
        assert abs(args[2] - 190.50) < 1e-3


class TestFailedTickerContinues:
    """US 3.1 — A failing ticker must not interrupt remaining tickers."""

    def test_failed_ticker_continues_processing_remaining(self):  # US 3.1
        """
        Batch returns empty (both tickers miss batch).
        fast_info: AAPL returns 155.00, MSFT returns None.
        Expected: AAPL upserted (success=1), MSFT skipped (errors=1).
        No exception raised.
        """
        conn, cur = _make_conn()

        # Empty batch result → both tickers fall through to single fetch
        with patch("update_prices.yf") as mock_yf, \
             patch("update_prices.upsert_stock_price") as mock_upsert:

            # Batch download returns empty DataFrame
            empty_df = MagicMock(name="empty_df")
            empty_df.empty = True
            mock_yf.download.return_value = empty_df

            # Single-fetch via fast_info
            aapl_info = {"lastPrice": 155.00}
            msft_info = {"lastPrice": None, "last_price": None}

            def _ticker_side_effect(sym):
                t = MagicMock()
                t.fast_info = aapl_info if sym == "AAPL" else msft_info
                return t

            mock_yf.Ticker.side_effect = _ticker_side_effect

            config = {"fetch_timeout": 30}
            success, errors = run_batch(conn, ["AAPL", "MSFT"], config)  # US 3.1

        assert success == 1   # US 3.1
        assert errors == 1    # US 3.1
        mock_upsert.assert_called_once()
        assert mock_upsert.call_args[0][1] == "AAPL"


class TestYfinanceTimeoutDoesNotInterruptBatch:
    """US 3.1 — A yfinance timeout must not raise; run_batch still returns."""

    def test_yfinance_timeout_does_not_interrupt_batch(self):  # US 3.1
        """
        fetch_prices_batch times out (thread stays alive beyond fetch_timeout=1).
        All tickers then go to single-fetch which also times out.
        run_batch must return (0, N) with no exception.
        """
        tickers = ["AAPL", "MSFT"]

        def _slow_download(*args, **kwargs):
            # Block longer than fetch_timeout=1 so the thread times out
            threading.Event().wait(5)

        def _slow_single(*args, **kwargs):
            threading.Event().wait(5)

        conn, _ = _make_conn()

        with patch("update_prices.yf") as mock_yf, \
             patch("update_prices.upsert_stock_price") as mock_upsert:

            mock_yf.download.side_effect = _slow_download

            ticker_mock = MagicMock()
            ticker_mock.fast_info = {}
            # fast_info.get always returns None (no price)
            ticker_mock.fast_info = MagicMock()
            ticker_mock.fast_info.get.return_value = None
            mock_yf.Ticker.return_value = ticker_mock

            config = {"fetch_timeout": 1}  # Very short so thread truly times out
            # Should NOT raise any exception  # US 3.1
            success, errors = run_batch(conn, tickers, config)

        assert success == 0                # US 3.1
        assert errors == len(tickers)     # US 3.1
        mock_upsert.assert_not_called()


# ---------------------------------------------------------------------------
# ─────────────────────────  US 3.2 — Unit Tests  ──────────────────────────
# ---------------------------------------------------------------------------


class TestGetConfigEnvVars:
    """US 3.2 — get_config must correctly read and parse env variables."""

    def test_get_config_reads_tickers_override_env_var(self, monkeypatch):  # US 3.2
        """TICKERS_OVERRIDE='AAPL,MSFT' → tickers_override == ['AAPL', 'MSFT']."""
        monkeypatch.setenv("TICKERS_OVERRIDE", "AAPL,MSFT")
        monkeypatch.delenv("FETCH_TIMEOUT", raising=False)

        cfg = get_config()  # US 3.2

        assert cfg["tickers_override"] == ["AAPL", "MSFT"]

    def test_get_config_reads_fetch_timeout_env_var(self, monkeypatch):  # US 3.2
        """FETCH_TIMEOUT='10' → fetch_timeout == 10 (int)."""
        monkeypatch.delenv("TICKERS_OVERRIDE", raising=False)
        monkeypatch.setenv("FETCH_TIMEOUT", "10")

        cfg = get_config()  # US 3.2

        assert cfg["fetch_timeout"] == 10
        assert isinstance(cfg["fetch_timeout"], int)

    def test_get_config_defaults_when_env_vars_absent(self, monkeypatch):  # US 3.2
        """No env vars → tickers_override is None, fetch_timeout == 30."""
        monkeypatch.delenv("TICKERS_OVERRIDE", raising=False)
        monkeypatch.delenv("FETCH_TIMEOUT", raising=False)

        cfg = get_config()  # US 3.2

        assert cfg["tickers_override"] is None
        assert cfg["fetch_timeout"] == 30


class TestExitCodes:
    """US 3.2 — Exit-code contract: 0 on per-ticker failure, 1 on missing DB URL."""

    def test_exit_code_zero_on_partial_ticker_failure(self, monkeypatch):  # US 3.2
        """
        One ticker fails to fetch price from any source.
        main() must still call sys.exit(0) (partial failure is non-fatal).
        """
        monkeypatch.setenv("DATABASE_URL", "postgres://u:p@localhost:5432/db")
        monkeypatch.setenv("TICKERS_OVERRIDE", "BADFAIL")
        monkeypatch.delenv("FETCH_TIMEOUT", raising=False)

        conn_mock = MagicMock(name="conn")
        cur_mock = MagicMock(name="cur")
        cur_mock.fetchall.return_value = []
        conn_mock.cursor.return_value.__enter__ = MagicMock(return_value=cur_mock)
        conn_mock.cursor.return_value.__exit__ = MagicMock(return_value=False)

        with patch("update_prices.psycopg2") as mock_pg, \
             patch("update_prices.yf") as mock_yf:

            mock_pg.connect.return_value = conn_mock

            empty_df = MagicMock()
            empty_df.empty = True
            mock_yf.download.return_value = empty_df

            ticker_mock = MagicMock()
            ticker_mock.fast_info = MagicMock()
            ticker_mock.fast_info.get.return_value = None
            mock_yf.Ticker.return_value = ticker_mock

            with pytest.raises(SystemExit) as exc_info:  # US 3.2
                main()

        assert exc_info.value.code == 0  # US 3.2

    def test_exit_code_nonzero_on_missing_database_url(self, monkeypatch):  # US 3.2
        """DATABASE_URL absent → get_db_connection calls sys.exit(1)."""
        monkeypatch.delenv("DATABASE_URL", raising=False)
        monkeypatch.delenv("TICKERS_OVERRIDE", raising=False)

        with pytest.raises(SystemExit) as exc_info:  # US 3.2
            main()

        assert exc_info.value.code == 1  # US 3.2


# ---------------------------------------------------------------------------
# ──────────────────  US 3.1 & 3.2 — Integration Tests  ───────────────────
# ---------------------------------------------------------------------------


class TestUpsertSQLContract:
    """US 3.1 / US 3.2 — upsert_stock_price must use the correct SQL and commit."""

    def test_upsert_uses_correct_sql_and_values(self):  # US 3.1
        """
        Call upsert_stock_price directly.
        Assert the SQL targets 'StockPrice', uses ON CONFLICT, and that
        conn.commit() is called exactly once.
        """
        conn, cur = _make_conn()
        now = datetime(2025, 1, 15, 12, 0, 0, tzinfo=timezone.utc)

        upsert_stock_price(conn, "AAPL", 190.50, now)  # US 3.1

        assert cur.execute.called
        sql_arg = cur.execute.call_args[0][0]
        params_arg = cur.execute.call_args[0][1]

        assert "StockPrice" in sql_arg          # US 3.1 — correct table
        assert "ON CONFLICT" in sql_arg         # US 3.1 — upsert semantics
        assert "INSERT" in sql_arg              # US 3.1
        assert params_arg[0] == "AAPL"          # US 3.1 — ticker column
        assert abs(params_arg[1] - 190.50) < 1e-3  # US 3.1 — price column
        assert params_arg[2] == now             # US 3.1 — updatedAt column
        conn.commit.assert_called_once()        # US 3.1 — must commit


class TestGetUniqueTickers:
    """US 3.1 — get_unique_tickers must UNION both tables and return a clean list."""

    def test_get_unique_tickers_unions_portfolio_and_watchlist(self):  # US 3.1
        """
        cursor.fetchall returns [('AAPL',), ('MSFT',)].
        Asserts the SQL uses UNION and references both PortfolioItem and
        WatchlistItem, and that the returned list is ['AAPL', 'MSFT'].
        """
        conn, cur = _make_conn(fetchall_return=[("AAPL",), ("MSFT",)])

        result = get_unique_tickers(conn)  # US 3.1

        assert result == ["AAPL", "MSFT"]  # US 3.1

        sql_arg = cur.execute.call_args[0][0]
        assert "UNION" in sql_arg.upper()           # US 3.1 — deduplication
        assert "PortfolioItem" in sql_arg           # US 3.1 — first table
        assert "WatchlistItem" in sql_arg           # US 3.1 — second table


class TestTickersOverrideSkipsDBQuery:
    """US 3.2 — TICKERS_OVERRIDE must bypass get_unique_tickers entirely."""

    def test_tickers_override_skips_db_query(self, monkeypatch):  # US 3.2
        """
        Set TICKERS_OVERRIDE='GOOGL'.
        Run main() and verify get_unique_tickers is never called and
        only GOOGL is processed.
        """
        monkeypatch.setenv("DATABASE_URL", "postgres://u:p@localhost:5432/db")
        monkeypatch.setenv("TICKERS_OVERRIDE", "GOOGL")
        monkeypatch.delenv("FETCH_TIMEOUT", raising=False)

        conn_mock = MagicMock(name="conn")
        cur_mock = MagicMock(name="cur")
        conn_mock.cursor.return_value.__enter__ = MagicMock(return_value=cur_mock)
        conn_mock.cursor.return_value.__exit__ = MagicMock(return_value=False)

        processed_tickers: list = []

        def _fake_run_batch(conn, tickers, config):
            processed_tickers.extend(tickers)
            return len(tickers), 0  # all success

        with patch("update_prices.psycopg2") as mock_pg, \
             patch("update_prices.get_unique_tickers") as mock_get_tickers, \
             patch("update_prices.run_batch", side_effect=_fake_run_batch):

            mock_pg.connect.return_value = conn_mock

            with pytest.raises(SystemExit) as exc_info:  # US 3.2
                main()

        assert exc_info.value.code == 0          # US 3.2 — clean exit
        mock_get_tickers.assert_not_called()      # US 3.2 — DB query skipped
        assert processed_tickers == ["GOOGL"]     # US 3.2 — only override ticker
