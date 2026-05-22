#!/usr/bin/env python3
"""
US 3.1 — Batch Stock Price Updater
------------------------------------
Fetches the latest closing price for every unique ticker across all users'
portfolios and watchlists using yfinance, then upserts the result into the
StockPrice table.

Usage:
    python3 update_prices.py

Environment variables:
    DATABASE_URL  — PostgreSQL connection string (same one used by NestJS/Prisma)
                    Format: postgres://user:password@host:port/dbname
"""

import os
import sys
import logging
from datetime import datetime, timezone
from urllib.parse import urlparse

import psycopg2
import yfinance as yf

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("update_prices")


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
def get_db_connection():
    """Parse DATABASE_URL and return a psycopg2 connection."""
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        logger.error("DATABASE_URL environment variable is not set.")
        sys.exit(1)

    parsed = urlparse(database_url)
    conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        dbname=parsed.path.lstrip("/"),
        user=parsed.username,
        password=parsed.password,
    )
    return conn


def get_unique_tickers(conn) -> list[str]:
    """Return a deduplicated list of all tickers in portfolios + watchlists."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT DISTINCT ticker FROM "PortfolioItem"
            UNION
            SELECT DISTINCT ticker FROM "WatchlistItem"
            """
        )
        rows = cur.fetchall()
    tickers = [row[0] for row in rows]
    logger.info("Found %d unique ticker(s) to update: %s", len(tickers), tickers)
    return tickers


def upsert_stock_price(conn, ticker: str, price: float, updated_at: datetime):
    """Insert or update a StockPrice row for the given ticker."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "StockPrice" (ticker, price, "updatedAt")
            VALUES (%s, %s, %s)
            ON CONFLICT (ticker)
            DO UPDATE SET price = EXCLUDED.price, "updatedAt" = EXCLUDED."updatedAt"
            """,
            (ticker, price, updated_at),
        )
    conn.commit()


# ---------------------------------------------------------------------------
# Price fetching
# ---------------------------------------------------------------------------
def fetch_prices_batch(tickers: list[str]) -> dict[str, float]:
    """
    Try to fetch all prices in a single yf.download() call.
    Returns a dict {ticker: price} for successfully fetched tickers.
    """
    if not tickers:
        return {}

    logger.info("Fetching prices in batch for: %s", tickers)
    try:
        data = yf.download(tickers, period="1d", auto_adjust=True, progress=False)
        prices: dict[str, float] = {}

        if data.empty:
            logger.warning("yf.download returned empty DataFrame.")
            return {}

        close = data["Close"]

        if len(tickers) == 1:
            ticker = tickers[0]
            last = close.dropna()
            if not last.empty:
                prices[ticker] = float(last.iloc[-1])
            return prices

        for ticker in tickers:
            if ticker in close.columns:
                series = close[ticker].dropna()
                if not series.empty:
                    prices[ticker] = float(series.iloc[-1])

        return prices
    except Exception as exc:
        logger.error("Batch download failed: %s — will fall back per-ticker.", exc)
        return {}


def fetch_price_single(ticker: str) -> float | None:
    """
    Fallback: fetch the last price for a single ticker using fast_info.
    Returns the price as a float, or None on failure.
    """
    try:
        info = yf.Ticker(ticker).fast_info
        price = info.get("lastPrice") or info.get("last_price")
        if price is not None:
            return float(price)
        logger.warning("[%s] fast_info returned no price.", ticker)
        return None
    except Exception as exc:
        logger.error("[%s] fast_info fetch failed: %s", ticker, exc)
        return None


# ---------------------------------------------------------------------------
# Main batch logic
# ---------------------------------------------------------------------------
def run_batch(conn, tickers: list[str]) -> tuple[int, int]:
    """
    Update prices for all tickers.
    Returns (success_count, error_count).
    """
    if not tickers:
        logger.info("No tickers to process. Exiting.")
        return 0, 0

    batch_prices = fetch_prices_batch(tickers)

    success_count = 0
    error_count = 0
    now = datetime.now(timezone.utc)

    for ticker in tickers:
        price = batch_prices.get(ticker)

        if price is None:
            logger.info(
                "[%s] Not in batch result, trying single fetch fallback…", ticker
            )
            price = fetch_price_single(ticker)

        if price is None:
            logger.error(
                "[%s] Could not retrieve price from any source. Skipping.", ticker
            )
            error_count += 1
            continue

        try:
            upsert_stock_price(conn, ticker, price, now)
            logger.info("[%s] Updated price: %.4f", ticker, price)
            success_count += 1
        except Exception as exc:
            logger.error("[%s] DB upsert failed: %s. Skipping.", ticker, exc)
            error_count += 1

    return success_count, error_count


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main():
    logger.info("=== Stock price batch update started ===")
    conn = None
    try:
        conn = get_db_connection()
        tickers = get_unique_tickers(conn)
        success, errors = run_batch(conn, tickers)
        logger.info(
            "=== Batch complete — %d updated, %d failed ===", success, errors
        )
        print(
            f"BATCH_RESULT: tickersProcessed={success + errors} "
            f"success={success} errors={errors}",
            flush=True,
        )
    except SystemExit:
        raise
    except Exception as exc:
        logger.critical("Fatal error during batch: %s", exc, exc_info=True)
        sys.exit(1)
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    main()
