import os
import sys
import threading
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))

_yf_stub = MagicMock(name="yfinance_stub")
sys.modules.setdefault("yfinance", _yf_stub)

_psycopg2_stub = MagicMock(name="psycopg2_stub")
sys.modules.setdefault("psycopg2", _psycopg2_stub)

import update_prices
from update_prices import (
    get_config,
    get_unique_tickers,
    upsert_stock_price,
    fetch_prices_batch,
    fetch_price_single,
    run_batch,
)


def _make_conn(fetchall_return=None):
    conn = MagicMock(name="conn")
    cur = MagicMock(name="cursor")
    cur.fetchall.return_value = fetchall_return or []
    conn.cursor.return_value.__enter__ = MagicMock(return_value=cur)
    conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    return conn, cur


def _make_dataframe_stub(ticker_prices: dict):
    import pandas as pd

    if not ticker_prices:
        df = pd.DataFrame()
        df.empty = True
        return df

    close_data = {t: [p] for t, p in ticker_prices.items()}
    close_df = pd.DataFrame(close_data)
    outer = MagicMock(name="download_result")
    outer.empty = False
    outer.__getitem__ = MagicMock(return_value=close_df)
    return outer


class TestSuccessfulTickerUpdate:

    def test_successful_ticker_update_persists_price(self):
        conn, cur = _make_conn()

        import pandas as pd

        df_stub = pd.DataFrame({"Close": [190.50]})

        with patch.object(update_prices.yf, "download", return_value=df_stub), \
             patch("update_prices.upsert_stock_price") as mock_upsert:

            config = {"fetch_timeout": 30}
            success, errors, details = run_batch(conn, ["AAPL"], config)

        assert success == 1
        assert errors == 0
        mock_upsert.assert_called_once()
        args = mock_upsert.call_args[0]
        assert args[0] is conn
        assert args[1] == "AAPL"
        assert abs(args[2] - 190.50) < 1e-3
        assert len(details) == 1
        assert details[0]["ticker"] == "AAPL"
        assert abs(details[0]["price"] - 190.50) < 1e-3


class TestFailedTickerContinues:

    def test_failed_ticker_continues_processing_remaining(self):
        conn, cur = _make_conn()

        with patch.object(update_prices.yf, "download") as mock_download, \
             patch.object(update_prices.yf.Ticker, "side_effect") as mock_ticker_se, \
             patch("update_prices.upsert_stock_price") as mock_upsert:

            import pandas as pd
            mock_download.return_value = pd.DataFrame()

            aapl_info = {"lastPrice": 155.00}
            msft_info = {"lastPrice": None, "last_price": None}

            def _ticker_side_effect(sym):
                t = MagicMock()
                t.fast_info = aapl_info if sym == "AAPL" else msft_info
                return t

            update_prices.yf.Ticker.side_effect = _ticker_side_effect

            config = {"fetch_timeout": 30}
            success, errors, details = run_batch(conn, ["AAPL", "MSFT"], config)

        assert success == 1
        assert errors == 1
        mock_upsert.assert_called_once()
        assert mock_upsert.call_args[0][1] == "AAPL"
        msft_detail = next(d for d in details if d["ticker"] == "MSFT")
        assert "error" in msft_detail


class TestYfinanceTimeoutDoesNotInterruptBatch:

    def test_yfinance_timeout_does_not_interrupt_batch(self):
        tickers = ["AAPL", "MSFT"]

        def _slow_download(*args, **kwargs):
            threading.Event().wait(5)

        conn, _ = _make_conn()

        with patch.object(update_prices.yf, "download", side_effect=_slow_download), \
             patch.object(update_prices.yf, "Ticker") as mock_ticker, \
             patch("update_prices.upsert_stock_price") as mock_upsert:
            ticker_mock = MagicMock()
            ticker_mock.fast_info = MagicMock()
            ticker_mock.fast_info.get.return_value = None
            mock_ticker.return_value = ticker_mock

            config = {"fetch_timeout": 1}
            success, errors, details = run_batch(conn, tickers, config)

        assert success == 0
        assert errors == len(tickers)
        mock_upsert.assert_not_called()
        assert len(details) == len(tickers)
        assert all("error" in d for d in details)


class TestGetConfigEnvVars:

    def test_get_config_reads_tickers_override_env_var(self, monkeypatch):
        monkeypatch.setenv("TICKERS_OVERRIDE", "AAPL,MSFT")
        monkeypatch.delenv("FETCH_TIMEOUT", raising=False)

        cfg = get_config()

        assert cfg["tickers_override"] == ["AAPL", "MSFT"]

    def test_get_config_reads_fetch_timeout_env_var(self, monkeypatch):
        monkeypatch.delenv("TICKERS_OVERRIDE", raising=False)
        monkeypatch.setenv("FETCH_TIMEOUT", "10")

        cfg = get_config()

        assert cfg["fetch_timeout"] == 10
        assert isinstance(cfg["fetch_timeout"], int)

    def test_get_config_defaults_when_env_vars_absent(self, monkeypatch):
        monkeypatch.delenv("TICKERS_OVERRIDE", raising=False)
        monkeypatch.delenv("FETCH_TIMEOUT", raising=False)

        cfg = get_config()

        assert cfg["tickers_override"] is None
        assert cfg["fetch_timeout"] == 30


class TestExitCodes:

    def test_exit_code_nonzero_on_missing_database_url(self, monkeypatch):
        monkeypatch.delenv("DATABASE_URL", raising=False)

        with pytest.raises(SystemExit) as exc_info:
            from update_prices import get_db_connection
            get_db_connection()

        assert exc_info.value.code == 1


class TestUpsertSQLContract:

    def test_upsert_uses_correct_sql_and_values(self):
        conn, cur = _make_conn()
        now = datetime(2025, 1, 15, 12, 0, 0, tzinfo=timezone.utc)

        upsert_stock_price(conn, "AAPL", 190.50, now)

        assert cur.execute.called
        sql_arg = cur.execute.call_args[0][0]
        params_arg = cur.execute.call_args[0][1]

        assert "StockPrice" in sql_arg
        assert "ON CONFLICT" in sql_arg
        assert "INSERT" in sql_arg
        assert params_arg[0] == "AAPL"
        assert abs(params_arg[1] - 190.50) < 1e-3
        assert params_arg[2] == now
        conn.commit.assert_called_once()


class TestGetUniqueTickers:

    def test_get_unique_tickers_unions_portfolio_and_watchlist(self):
        conn, cur = _make_conn(fetchall_return=[("AAPL",), ("MSFT",)])

        result = get_unique_tickers(conn)

        assert result == ["AAPL", "MSFT"]

        sql_arg = cur.execute.call_args[0][0]
        assert "UNION" in sql_arg.upper()
        assert "PortfolioItem" in sql_arg
        assert "WatchlistItem" in sql_arg


class TestTickersOverrideSkipsDBQuery:

    def test_tickers_override_skips_db_query(self, monkeypatch):
        monkeypatch.setenv("DATABASE_URL", "postgres://u:p@localhost:5432/db")
        monkeypatch.setenv("TICKERS_OVERRIDE", "GOOGL")
        monkeypatch.delenv("FETCH_TIMEOUT", raising=False)

        cfg = get_config()

        assert cfg["tickers_override"] == ["GOOGL"]
