from datetime import datetime, timezone
import pytest
import psycopg2
from unittest.mock import patch, MagicMock
import app.update_prices as update_prices
from app.update_prices import upsert_stock_price, get_unique_tickers, run_batch
from helpers import _make_conn

def test_upsert_uses_correct_sql_and_values():
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

def test_get_unique_tickers_unions_portfolio_and_watchlist():
    conn, cur = _make_conn(fetchall_return=[("AAPL",), ("MSFT",)])

    result = get_unique_tickers(conn)

    assert result == ["AAPL", "MSFT"]

    sql_arg = cur.execute.call_args[0][0]
    assert "UNION" in sql_arg.upper()
    assert "PortfolioItem" in sql_arg
    assert "WatchlistItem" in sql_arg

def test_database_failure_aborts_batch():
    conn, cur = _make_conn()
    tickers = ["AAPL", "MSFT"]
    config = {"fetch_timeout": 30}

    with patch("app.update_prices.fetch_prices_batch", return_value={"AAPL": 150.0, "MSFT": 200.0}), \
         patch("app.update_prices.upsert_stock_price", side_effect=psycopg2.DatabaseError("Connection lost")) as mock_upsert:
        
        with pytest.raises(psycopg2.DatabaseError):
            run_batch(conn, tickers, config)
        
        assert mock_upsert.call_count == 1
        conn.rollback.assert_called_once()

def test_non_db_exception_continues_batch():
    conn, cur = _make_conn()
    tickers = ["AAPL", "MSFT"]
    config = {"fetch_timeout": 30}

    def _upsert_side_effect(conn, ticker, price, now):
        if ticker == "AAPL":
            raise ValueError("Invalid format")
        return

    with patch("app.update_prices.fetch_prices_batch", return_value={"AAPL": 150.0, "MSFT": 200.0}), \
         patch("app.update_prices.upsert_stock_price", side_effect=_upsert_side_effect) as mock_upsert:
        
        success, errors, details = run_batch(conn, tickers, config)
        
        assert success == 1
        assert errors == 1
        assert mock_upsert.call_count == 2
        conn.rollback.assert_not_called()
