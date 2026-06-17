import random

from locust import task

TICKERS = ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN", "NVDA", "META"]
TRADE_DATE = "2024-01-15T00:00:00.000Z"


class PortfolioTasksMixin:
    @task(5)
    def get_portfolio(self):
        self.client.get(
            "/portfolio",
            headers=self._auth_headers,
            name="/portfolio [GET]",
        )

    @task(3)
    def get_transactions(self):
        self.client.get(
            "/portfolio/transactions",
            headers=self._auth_headers,
            name="/portfolio/transactions [GET]",
        )

    @task(2)
    def buy_stock(self):
        ticker = random.choice(TICKERS)
        quantity = round(random.uniform(1, 10), 2)

        with self.client.post(
            "/portfolio/buy",
            json={"ticker": ticker, "quantity": quantity, "date": TRADE_DATE},
            headers=self._auth_headers,
            name="/portfolio/buy [POST]",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 201):
                self._bought_tickers.append(ticker)
                resp.success()
            elif resp.status_code == 400:
                resp.success()
            else:
                resp.failure(f"Buy failed: {resp.status_code} — {resp.text[:200]}")

    @task(1)
    def sell_stock(self):
        if not self._bought_tickers:
            self.buy_stock()
            return

        ticker = random.choice(self._bought_tickers)

        with self.client.post(
            "/portfolio/sell",
            json={"ticker": ticker, "quantity": 1, "date": TRADE_DATE},
            headers=self._auth_headers,
            name="/portfolio/sell [POST]",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 201, 400):
                resp.success()
            else:
                resp.failure(f"Sell failed: {resp.status_code} — {resp.text[:200]}")
