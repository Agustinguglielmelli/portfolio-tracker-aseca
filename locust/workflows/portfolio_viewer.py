from locust import HttpUser, between, task

from common.auth import LOCUST_PASSWORD, login, register, unique_email


class PortfolioViewer(HttpUser):
    """
    WF-1: Usuario típico que revisa su portfolio.
    Carga 100% interna, sin llamadas a EDGAR.
    """

    weight = 50
    wait_time = between(1, 3)

    def on_start(self):
        email = unique_email()
        register(self, email, LOCUST_PASSWORD)
        token = login(self, email, LOCUST_PASSWORD)
        self._headers = {"Authorization": f"Bearer {token}"} if token else {}

    @task
    def view_portfolio(self):
        self.client.get("/portfolio", headers=self._headers, name="/portfolio [GET]")
        self.client.get("/portfolio/transactions", headers=self._headers, name="/portfolio/transactions [GET]")
        self.client.get("/prices/last-update", headers=self._headers, name="/prices/last-update [GET]")
