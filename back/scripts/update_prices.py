#!/usr/bin/env python3

import os
import sys
import logging
import threading
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
# Configuration via environment variables (US 3.2)
# ---------------------------------------------------------------------------
def get_config() -> dict:
    """Read optional configuration from environment variables. US 3.2"""
    tickers_override_raw = os.environ.get("TICKERS_OVERRIDE", "").strip()
    tickers_override = (
        [t.strip().upper() for t in tickers_override_raw.split(",") if t.strip()]
        if tickers_override_raw
        else None
    )

    fetch_timeout = int(os.environ.get("FETCH_TIMEOUT", "30"))  # US 3.2

    if tickers_override:
        logger.info(
            "US 3.2 — TICKERS_OVERRIDE is set; will process: %s", tickers_override
        )
    if fetch_timeout != 30:
        logger.info("US 3.2 — FETCH_TIMEOUT set to %d seconds.", fetch_timeout)

    return {
        "tickers_override": tickers_override,
        "fetch_timeout": fetch_timeout,
    }


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
def fetch_prices_batch(tickers: list[str], timeout: int) -> dict[str, float]:
    """
    Try to fetch all prices in a single yf.download() call with a thread-based timeout.
    Returns a dict {ticker: price} for successfully fetched tickers.
    US 3.2 — timeout parameter controls how long to wait for the batch download.
    """
    if not tickers:
        return {}

    logger.info("Fetching prices in batch for: %s", tickers)
    result: dict[str, float] = {}
    exc_holder: list[Exception] = []

    def _download():
        try:
            import yfinance as yf  # re-import inside thread for isolation
            data = yf.download(tickers, period="1d", auto_adjust=True, progress=False)
            if data.empty:
                logger.warning("yf.download returned empty DataFrame.")
                return

            close = data["Close"]

            if len(tickers) == 1:
                ticker = tickers[0]
                last = close.dropna()
                if not last.empty:
                    result[ticker] = float(last.iloc[-1])
                return

            for ticker in tickers:
                if ticker in close.columns:
                    series = close[ticker].dropna()
                    if not series.empty:
                        result[ticker] = float(series.iloc[-1])
        except Exception as exc:
            exc_holder.append(exc)

    thread = threading.Thread(target=_download, daemon=True)
    thread.start()
    thread.join(timeout=timeout)  # US 3.2 — respect FETCH_TIMEOUT

    if thread.is_alive():
        logger.warning(
            "Batch download timed out after %d seconds — will fall back per-ticker.", timeout
        )
        return {}

    if exc_holder:
        logger.error(
            "Batch download failed: %s — will fall back per-ticker.", exc_holder[0]
        )
        return {}

    return result


def fetch_price_single(ticker: str, timeout: int) -> float | None:
    """
    Fallback: fetch the last price for a single ticker using fast_info.
    Returns the price as a float, or None on failure.
    US 3.2 — timeout limits how long we wait for a single ticker.
    """
    result: list[float | None] = [None]
    exc_holder: list[Exception] = []

    def _fetch():
        try:
            info = yf.Ticker(ticker).fast_info
            price = info.get("lastPrice") or info.get("last_price")
            if price is not None:
                result[0] = float(price)
            else:
                logger.warning("[%s] fast_info returned no price.", ticker)
        except Exception as exc:
            exc_holder.append(exc)

    thread = threading.Thread(target=_fetch, daemon=True)
    thread.start()
    thread.join(timeout=timeout)  # US 3.2 — respect FETCH_TIMEOUT

    if thread.is_alive():
        logger.error("[%s] Single fetch timed out after %d seconds.", ticker, timeout)
        return None

    if exc_holder:
        logger.error("[%s] fast_info fetch failed: %s", ticker, exc_holder[0])
        return None

    return result[0]


# ---------------------------------------------------------------------------
# Main batch logic
# ---------------------------------------------------------------------------
def run_batch(conn, tickers: list[str], config: dict) -> tuple[int, int]:
    """
    Update prices for all tickers.
    Returns (success_count, error_count).
    US 3.2 — exit code 0 even if individual tickers fail; only sys.exit(1) on fatal errors.
    """
    if not tickers:
        logger.info("No tickers to process. Exiting.")
        return 0, 0

    fetch_timeout = config["fetch_timeout"]
    batch_prices = fetch_prices_batch(tickers, fetch_timeout)

    success_count = 0
    error_count = 0
    now = datetime.now(timezone.utc)

    for ticker in tickers:
        price = batch_prices.get(ticker)

        if price is None:
            logger.info(
                "[%s] Not in batch result, trying single fetch fallback…", ticker
            )
            price = fetch_price_single(ticker, fetch_timeout)

        if price is None:
            # US 3.2 — Per-ticker failure: log as ERROR but do NOT exit(1)
            logger.error(
                "[%s] Could not retrieve price from any source. Skipping.", ticker
            )
            # US 3.3 — Emit structured per-ticker detail for NestJS to parse
            print(
                f"TICKER_DETAIL: ticker={ticker} status=ERROR error=Could not retrieve price",
                flush=True,
            )
            error_count += 1
            continue

        try:
            upsert_stock_price(conn, ticker, price, now)
            # US 3.2 — Clear SUCCESS log per ticker
            logger.info("[%s] SUCCESS — Updated price: %.4f", ticker, price)
            # US 3.3 — Emit structured per-ticker detail for NestJS to parse
            print(
                f"TICKER_DETAIL: ticker={ticker} status=SUCCESS price={price:.4f}",
                flush=True,
            )
            success_count += 1
        except Exception as exc:
            # US 3.2 — Per-ticker DB failure: log but do NOT exit(1)
            logger.error("[%s] ERROR — DB upsert failed: %s. Skipping.", ticker, exc)
            print(
                f"TICKER_DETAIL: ticker={ticker} status=ERROR error=DB upsert failed: {exc}",
                flush=True,
            )
            error_count += 1

    return success_count, error_count


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main():
    logger.info("=== Stock price batch update started ===")  # US 3.1
    config = get_config()  # US 3.2
    conn = None
    try:
        conn = get_db_connection()

        # US 3.2 — Use TICKERS_OVERRIDE if set, otherwise query DB
        if config["tickers_override"]:
            tickers = config["tickers_override"]
            logger.info(
                "US 3.2 — Using TICKERS_OVERRIDE: %d ticker(s): %s",
                len(tickers),
                tickers,
            )
        else:
            tickers = get_unique_tickers(conn)

        success, errors = run_batch(conn, tickers, config)
        logger.info(
            "=== Batch complete — %d updated, %d failed ===", success, errors
        )
        # US 3.1 — Structured output line parsed by NestJS PricesService
        print(
            f"BATCH_RESULT: tickersProcessed={success + errors} "
            f"success={success} errors={errors}",
            flush=True,
        )
        # US 3.2 — Exit 0 even if some tickers failed individually
        sys.exit(0)
    except SystemExit:
        raise
    except Exception as exc:
        # US 3.2 — Only critical global errors produce a non-zero exit code
        logger.critical("Fatal error during batch: %s", exc, exc_info=True)
        sys.exit(1)
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    main()
