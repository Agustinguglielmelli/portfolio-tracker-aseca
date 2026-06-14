from __future__ import annotations

import logging
import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.update_prices import (
    get_config,
    get_db_connection,
    get_unique_tickers,
    run_batch,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("python-worker")

app = FastAPI(
    title="Portfolio Tracker — Python Worker",
    description="Microservice responsible for fetching and persisting stock prices.",
    version="1.0.0",
)


class TickerDetail(BaseModel):
    ticker: str
    price: Optional[float] = None
    error: Optional[str] = None


class UpdatePricesResponse(BaseModel):
    tickersProcessed: int
    success: int
    errors: int
    details: list[TickerDetail]


@app.get("/health", tags=["ops"])
def health_check():
    return {"status": "ok"}


@app.post("/api/update-prices", response_model=UpdatePricesResponse, tags=["prices"])
def update_prices():
    logger.info("=== POST /api/update-prices — batch started ===")
    config = get_config()

    conn = None
    try:
        conn = get_db_connection()

        if config["tickers_override"]:
            tickers = config["tickers_override"]
            logger.info("Using TICKERS_OVERRIDE: %s", tickers)
        else:
            tickers = get_unique_tickers(conn)

        success, errors, details = run_batch(conn, tickers, config)

        logger.info(
            "=== Batch complete — %d updated, %d failed ===", success, errors
        )

        return UpdatePricesResponse(
            tickersProcessed=success + errors,
            success=success,
            errors=errors,
            details=details,
        )

    except Exception as exc:
        logger.critical("Fatal error during batch: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Fatal error during price update: {exc}")

    finally:
        if conn:
            conn.close()
