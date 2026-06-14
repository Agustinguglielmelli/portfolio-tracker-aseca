from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app

client = TestClient(app)

def test_health_check_api():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_update_prices_api(db_connection):
    mocked_prices = {
        "INT_TEST1": 150.0,
        "INT_TEST2": 200.0
    }
    
    with patch("app.update_prices.fetch_prices_batch", return_value=mocked_prices):
        response = client.post("/api/update-prices")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == 2
        assert data["errors"] == 0
        assert data["tickersProcessed"] == 2
        
        tickers = [detail["ticker"] for detail in data["details"]]
        assert "INT_TEST1" in tickers
        assert "INT_TEST2" in tickers
        
        with db_connection.cursor() as cur:
            cur.execute("""SELECT ticker, price FROM "StockPrice" WHERE ticker IN ('INT_TEST1', 'INT_TEST2') ORDER BY ticker;""")
            rows = cur.fetchall()
            
            assert len(rows) == 2
            assert rows[0][0] == "INT_TEST1"
            assert rows[0][1] == 150.0
            assert rows[1][0] == "INT_TEST2"
            assert rows[1][1] == 200.0

def test_update_prices_api_internal_error():
    with patch("app.main.get_db_connection", side_effect=Exception("DB Connection Failed")):
        response = client.post("/api/update-prices")
        assert response.status_code == 500
        assert "Fatal error" in response.json()["detail"]
