import os
import pytest
import psycopg2
from urllib.parse import urlparse

TEST_DB_URL = os.environ.get("DATABASE_TEST_URL", "postgres://postgres:password@localhost:5433/integration_test_db")

def db_connection():
    parsed = urlparse(TEST_DB_URL)
    try:
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            dbname=parsed.path.lstrip("/"),
            user=parsed.username,
            password=parsed.password,
            connect_timeout=3
        )
    except psycopg2.OperationalError:
        pytest.skip("Integration test database is not running.")
    
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS "StockPrice" (
                "ticker" VARCHAR(255) PRIMARY KEY,
                "price" DOUBLE PRECISION NOT NULL,
                "updatedAt" TIMESTAMP NOT NULL
            );
        """)
        cur.execute("""DELETE FROM "StockPrice" WHERE ticker LIKE 'INT_%';""")
    conn.commit()
    
    yield conn
    
    with conn.cursor() as cur:
        cur.execute("""DELETE FROM "StockPrice" WHERE ticker LIKE 'INT_%';""")
    conn.commit()
    conn.close()


def set_env_vars(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", TEST_DB_URL)
    monkeypatch.setenv("TICKERS_OVERRIDE", "INT_TEST1,INT_TEST2")
    monkeypatch.setenv("FETCH_TIMEOUT", "30")
