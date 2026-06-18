import random

from locust import HttpUser, between, task

from common.auth import LOCUST_PASSWORD, login, register, unique_email

TICKERS = ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN", "NVDA", "META"]
TRADE_DATE = "2024-01-15T00:00:00.000Z"


class ActiveTrader(HttpUser):
    """
    WF-3: Usuario que opera activamente (compra y vende).
    Introduce escrituras concurrentes con lógica FIFO sobre la DB.
    """

    weight = 15
    wait_time = between(2, 5)

    def on_start(self):
        email = unique_email()
        register(self, email, LOCUST_PASSWORD)
        token = login(self, email, LOCUST_PASSWORD)
        self._headers = {"Authorization": f"Bearer {token}"} if token else {}
        self._last_ticker = None

    @task
    def trade(self):
        ticker = random.choice(TICKERS)

        self.client.get("/portfolio", headers=self._headers, name="/portfolio [GET]")

        with self.client.post(
            "/portfolio/buy",
            json={"ticker": ticker, "quantity": round(random.uniform(1, 5), 2), "date": TRADE_DATE},
            headers=self._headers,
            name="/portfolio/buy [POST]",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 201):
                self._last_ticker = ticker
                resp.success()
            elif resp.status_code == 400:
                resp.success()
            else:
                resp.failure(f"Buy failed: {resp.status_code}")

        self.client.get("/portfolio", headers=self._headers, name="/portfolio [GET]")

        if self._last_ticker:
            with self.client.post(
                "/portfolio/sell",
                json={"ticker": self._last_ticker, "quantity": 1, "date": TRADE_DATE},
                headers=self._headers,
                name="/portfolio/sell [POST]",
                catch_response=True,
            ) as resp:
                if resp.status_code in (200, 201, 400):
                    resp.success()
                else:
                    resp.failure(f"Sell failed: {resp.status_code}")

        self.client.get("/portfolio", headers=self._headers, name="/portfolio [GET]")
