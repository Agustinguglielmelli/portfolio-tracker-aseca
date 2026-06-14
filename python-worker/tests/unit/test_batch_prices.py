import threading
from unittest.mock import MagicMock, patch
import pytest
import app.update_prices as update_prices
from app.update_prices import run_batch
from helpers import _make_conn

def test_successful_ticker_update_persists_price():
    conn, cur = _make_conn()

    import pandas as pd

    df_stub = pd.DataFrame({"Close": [190.50]})

    with patch.object(update_prices.yf, "download", return_value=df_stub), \
         patch("app.update_prices.upsert_stock_price") as mock_upsert:

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

def test_failed_ticker_continues_processing_remaining():
    conn, cur = _make_conn()

    with patch.object(update_prices.yf, "download") as mock_download, \
         patch("app.update_prices.yf.Ticker") as mock_ticker, \
         patch("app.update_prices.upsert_stock_price") as mock_upsert:

        import pandas as pd
        mock_download.return_value = pd.DataFrame()

        aapl_info = {"lastPrice": 155.00}
        msft_info = {"lastPrice": None, "last_price": None}

        def _ticker_side_effect(sym):
            t = MagicMock()
            t.fast_info = aapl_info if sym == "AAPL" else msft_info
            return t

        mock_ticker.side_effect = _ticker_side_effect

        config = {"fetch_timeout": 30}
        success, errors, details = run_batch(conn, ["AAPL", "MSFT"], config)

    assert success == 1
    assert errors == 1
    mock_upsert.assert_called_once()
    assert mock_upsert.call_args[0][1] == "AAPL"
    msft_detail = next(d for d in details if d["ticker"] == "MSFT")
    assert "error" in msft_detail

def test_yfinance_timeout_does_not_interrupt_batch():
    tickers = ["AAPL", "MSFT"]

    def _slow_download(*args, **kwargs):
        threading.Event().wait(5)

    conn, _ = _make_conn()

    with patch.object(update_prices.yf, "download", side_effect=_slow_download), \
         patch.object(update_prices.yf, "Ticker") as mock_ticker, \
         patch("app.update_prices.upsert_stock_price") as mock_upsert:
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

def test_nan_price_is_skipped():
    conn, cur = _make_conn()
    import pandas as pd
    df_stub = pd.DataFrame({"Close": [float("nan")]})
    with patch.object(update_prices.yf, "download", return_value=df_stub), \
         patch("app.update_prices.fetch_price_single", return_value=None), \
         patch("app.update_prices.upsert_stock_price") as mock_upsert:
        success, errors, details = run_batch(conn, ["AAPL"], {"fetch_timeout": 30})
    assert success == 0
    assert errors == 1
    mock_upsert.assert_not_called()
    assert "error" in details[0]

def test_zero_price_is_skipped():
    conn, cur = _make_conn()
    import pandas as pd
    df_stub = pd.DataFrame({"Close": [0.0]})
    with patch.object(update_prices.yf, "download", return_value=df_stub), \
         patch("app.update_prices.fetch_price_single", return_value=None), \
         patch("app.update_prices.upsert_stock_price") as mock_upsert:
        success, errors, details = run_batch(conn, ["AAPL"], {"fetch_timeout": 30})
    assert success == 0
    assert errors == 1
    mock_upsert.assert_not_called()
    assert "error" in details[0]

def test_negative_price_is_skipped():
    conn, cur = _make_conn()
    import pandas as pd
    df_stub = pd.DataFrame({"Close": [-12.50]})
    with patch.object(update_prices.yf, "download", return_value=df_stub), \
         patch("app.update_prices.fetch_price_single", return_value=None), \
         patch("app.update_prices.upsert_stock_price") as mock_upsert:
        success, errors, details = run_batch(conn, ["AAPL"], {"fetch_timeout": 30})
    assert success == 0
    assert errors == 1
    mock_upsert.assert_not_called()
    assert "error" in details[0]

def test_fast_info_empty_dict_is_handled():
    conn, cur = _make_conn()
    with patch.object(update_prices.yf, "download", return_value=None), \
         patch.object(update_prices.yf, "Ticker") as mock_ticker, \
         patch("app.update_prices.upsert_stock_price") as mock_upsert:
        ticker_mock = MagicMock()
        ticker_mock.fast_info = {}
        mock_ticker.return_value = ticker_mock
        success, errors, details = run_batch(conn, ["AAPL"], {"fetch_timeout": 30})
    assert success == 0
    assert errors == 1
    mock_upsert.assert_not_called()

def test_fast_info_none_is_handled():
    conn, cur = _make_conn()
    with patch.object(update_prices.yf, "download", return_value=None), \
         patch.object(update_prices.yf, "Ticker") as mock_ticker, \
         patch("app.update_prices.upsert_stock_price") as mock_upsert:
        ticker_mock = MagicMock()
        ticker_mock.fast_info = None
        mock_ticker.return_value = ticker_mock
        success, errors, details = run_batch(conn, ["AAPL"], {"fetch_timeout": 30})
    assert success == 0
    assert errors == 1
    mock_upsert.assert_not_called()

def test_fast_info_object_missing_get_is_handled():
    conn, cur = _make_conn()
    with patch.object(update_prices.yf, "download", return_value=None), \
         patch.object(update_prices.yf, "Ticker") as mock_ticker, \
         patch("app.update_prices.upsert_stock_price") as mock_upsert:
        ticker_mock = MagicMock()
        ticker_mock.fast_info = object()
        mock_ticker.return_value = ticker_mock
        success, errors, details = run_batch(conn, ["AAPL"], {"fetch_timeout": 30})
    assert success == 0
    assert errors == 1
    mock_upsert.assert_not_called()

def test_empty_tickers_returns_safely():
    conn, cur = _make_conn()
    success, errors, details = run_batch(conn, [], {"fetch_timeout": 30})
    assert success == 0
    assert errors == 0
    assert details == []

def test_duplicate_tickers_are_deduplicated():
    conn, cur = _make_conn()
    import pandas as pd
    df_stub = pd.DataFrame({"Close": [150.0]})
    with patch.object(update_prices.yf, "download", return_value=df_stub), \
         patch("app.update_prices.upsert_stock_price") as mock_upsert:
        success, errors, details = run_batch(conn, ["AAPL", "AAPL", "AAPL"], {"fetch_timeout": 30})
    assert success == 1
    assert errors == 0
    assert len(details) == 1
    assert mock_upsert.call_count == 1
