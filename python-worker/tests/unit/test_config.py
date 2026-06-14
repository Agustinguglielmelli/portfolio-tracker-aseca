import pytest
import app.update_prices as update_prices
from unittest.mock import patch
from app.update_prices import get_config, run_batch
from helpers import _make_conn

def test_get_config_reads_tickers_override_env_var(monkeypatch):
    monkeypatch.setenv("TICKERS_OVERRIDE", "AAPL,MSFT")
    monkeypatch.delenv("FETCH_TIMEOUT", raising=False)

    cfg = get_config()

    assert cfg["tickers_override"] == ["AAPL", "MSFT"]

def test_get_config_reads_fetch_timeout_env_var(monkeypatch):
    monkeypatch.delenv("TICKERS_OVERRIDE", raising=False)
    monkeypatch.setenv("FETCH_TIMEOUT", "10")

    cfg = get_config()

    assert cfg["fetch_timeout"] == 10
    assert isinstance(cfg["fetch_timeout"], int)

def test_get_config_defaults_when_env_vars_absent(monkeypatch):
    monkeypatch.delenv("TICKERS_OVERRIDE", raising=False)
    monkeypatch.delenv("FETCH_TIMEOUT", raising=False)

    cfg = get_config()

    assert cfg["tickers_override"] is None
    assert cfg["fetch_timeout"] == 30

def test_exit_code_nonzero_on_missing_database_url(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with pytest.raises(SystemExit) as exc_info:
        from app.update_prices import get_db_connection
        get_db_connection()

    assert exc_info.value.code == 1

def test_tickers_override_skips_db_query(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgres://u:p@localhost:5432/db")
    monkeypatch.setenv("TICKERS_OVERRIDE", "GOOGL")
    monkeypatch.delenv("FETCH_TIMEOUT", raising=False)

    cfg = get_config()

    assert cfg["tickers_override"] == ["GOOGL"]

def test_run_batch_fallback_timeout_missing_or_invalid():
    conn, cur = _make_conn()
    with patch("app.update_prices.fetch_prices_batch", return_value={}) as mock_fetch:
        run_batch(conn, ["AAPL"], {})
        mock_fetch.assert_called_once_with(["AAPL"], 30)

def test_run_batch_fallback_timeout_zero():
    conn, cur = _make_conn()
    with patch("app.update_prices.fetch_prices_batch", return_value={}) as mock_fetch:
        run_batch(conn, ["AAPL"], {"fetch_timeout": 0})
        mock_fetch.assert_called_once_with(["AAPL"], 30)

def test_run_batch_fallback_timeout_negative():
    conn, cur = _make_conn()
    with patch("app.update_prices.fetch_prices_batch", return_value={}) as mock_fetch:
        run_batch(conn, ["AAPL"], {"fetch_timeout": -5})
        mock_fetch.assert_called_once_with(["AAPL"], 30)
