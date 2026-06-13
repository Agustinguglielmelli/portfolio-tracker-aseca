import os
import sys
import logging
import threading
from datetime import datetime, timezone
from urllib.parse import urlparse

import psycopg2
import yfinance as yf

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("update_prices")


def get_config() -> dict:
    tickers_override_raw = os.environ.get("TICKERS_OVERRIDE", "").strip()
    tickers_override = (
        [t.strip().upper() for t in tickers_override_raw.split(",") if t.strip()]
        if tickers_override_raw
        else None
    )

    fetch_timeout = int(os.environ.get("FETCH_TIMEOUT", "30"))

    if tickers_override:
        logger.info("TICKERS_OVERRIDE is set; will process: %s", tickers_override)
    if fetch_timeout != 30:
        logger.info("FETCH_TIMEOUT set to %d seconds.", fetch_timeout)

    return {
        "tickers_override": tickers_override,
        "fetch_timeout": fetch_timeout,
    }


def get_db_connection():
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


def fetch_prices_batch(tickers: list[str], timeout: int) -> dict[str, float]:
    if not tickers:
        return {}

    logger.info("Fetching prices in batch for: %s", tickers)
    result: dict[str, float] = {}
    exc_holder: list[Exception] = []

    def _download():
        try:
            import yfinance as yf
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
    thread.join(timeout=timeout)

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
    thread.join(timeout=timeout)

    if thread.is_alive():
        logger.error("[%s] Single fetch timed out after %d seconds.", ticker, timeout)
        return None

    if exc_holder:
        logger.error("[%s] fast_info fetch failed: %s", ticker, exc_holder[0])
        return None

    return result[0]


def run_batch(conn, tickers: list[str], config: dict) -> tuple[int, int, list[dict]]:
    if not tickers:
        logger.info("No tickers to process.")
        return 0, 0, []

    fetch_timeout = config["fetch_timeout"]
    batch_prices = fetch_prices_batch(tickers, fetch_timeout)

    success_count = 0
    error_count = 0
    details: list[dict] = []
    now = datetime.now(timezone.utc)

    for ticker in tickers:
        price = batch_prices.get(ticker)

        if price is None:
            logger.info("[%s] Not in batch result, trying single fetch fallback…", ticker)
            price = fetch_price_single(ticker, fetch_timeout)

        if price is None:
            logger.error("[%s] Could not retrieve price from any source. Skipping.", ticker)
            details.append({"ticker": ticker, "error": "Could not retrieve price"})
            error_count += 1
            continue

        try:
            upsert_stock_price(conn, ticker, price, now)
            logger.info("[%s] SUCCESS — Updated price: %.4f", ticker, price)
            details.append({"ticker": ticker, "price": round(price, 4)})
            success_count += 1
        except Exception as exc:
            logger.error("[%s] ERROR — DB upsert failed: %s. Skipping.", ticker, exc)
            details.append({"ticker": ticker, "error": f"DB upsert failed: {exc}"})
            error_count += 1

    return success_count, error_count, details
