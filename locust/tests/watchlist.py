import random

from locust import task

TICKERS = ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN", "NVDA", "META"]


class WatchlistTasksMixin:
    @task(4)
    def get_watchlist(self):
        self.client.get(
            "/watchlist",
            headers=self._auth_headers,
            name="/watchlist [GET]",
        )

    @task(2)
    def add_to_watchlist(self):
        ticker = random.choice(TICKERS)

        with self.client.post(
            "/watchlist",
            json={"ticker": ticker},
            headers=self._auth_headers,
            name="/watchlist [POST]",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 201, 409):
                resp.success()
            else:
                resp.failure(f"Watchlist add failed: {resp.status_code} — {resp.text[:200]}")
