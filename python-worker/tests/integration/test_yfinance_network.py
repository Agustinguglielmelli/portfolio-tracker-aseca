from app.update_prices import fetch_prices_batch

def test_real_yfinance_network_integration_success():
    prices = fetch_prices_batch(["AAPL", "MSFT"], timeout=30)
    
    assert "AAPL" in prices
    assert "MSFT" in prices
    assert prices["AAPL"] > 0
    assert prices["MSFT"] > 0

def test_real_yfinance_network_integration_invalid_ticker():
    prices = fetch_prices_batch(["FakeTickerXYZ123"], timeout=30)
    assert "FakeTickerXYZ123" not in prices

def test_real_yfinance_network_integration_mixed_batch():
    prices = fetch_prices_batch(["AAPL", "INVALID_XYZ_999"], timeout=30)
    
    assert "AAPL" in prices
    assert prices["AAPL"] > 0
    assert "INVALID_XYZ_999" not in prices
