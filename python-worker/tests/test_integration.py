import sys
import pytest
def test_real_yfinance_network_integration_success(monkeypatch):
    yf_mock = sys.modules.pop("yfinance", None)
    try:
        import yfinance as real_yf
        import app.update_prices as update_prices
        
        monkeypatch.setattr(update_prices, "yf", real_yf)
        
        prices = update_prices.fetch_prices_batch(["AAPL", "MSFT"], timeout=30)
        
        assert "AAPL" in prices
        assert "MSFT" in prices
        assert prices["AAPL"] > 0
        assert prices["MSFT"] > 0
    finally:
        if yf_mock:
            sys.modules["yfinance"] = yf_mock

def test_real_yfinance_network_integration_invalid_ticker(monkeypatch):
    yf_mock = sys.modules.pop("yfinance", None)
    try:
        import yfinance as real_yf
        import app.update_prices as update_prices
        
        monkeypatch.setattr(update_prices, "yf", real_yf)
        
        prices = update_prices.fetch_prices_batch(["FakeTickerXYZ123"], timeout=30)
        
        assert "FakeTickerXYZ123" not in prices
    finally:
        if yf_mock:
            sys.modules["yfinance"] = yf_mock

def test_real_yfinance_network_integration_mixed_batch(monkeypatch):
    yf_mock = sys.modules.pop("yfinance", None)
    try:
        import yfinance as real_yf
        import app.update_prices as update_prices
        
        monkeypatch.setattr(update_prices, "yf", real_yf)
        
        prices = update_prices.fetch_prices_batch(["AAPL", "INVALID_XYZ_999"], timeout=30)
        
        assert "AAPL" in prices
        assert prices["AAPL"] > 0
        
        assert "INVALID_XYZ_999" not in prices
    finally:
        if yf_mock:
            sys.modules["yfinance"] = yf_mock
