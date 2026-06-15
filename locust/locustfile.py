from locust import HttpUser, between, events

from tasks.auth import LOCUST_PASSWORD, login, register, unique_email
from tasks.companies import CompanyTasksMixin
from tasks.portfolio import PortfolioTasksMixin
from tasks.prices import PriceTasksMixin
from tasks.watchlist import WatchlistTasksMixin


class PortfolioUser(
    PortfolioTasksMixin,
    WatchlistTasksMixin,
    CompanyTasksMixin,
    PriceTasksMixin,
    HttpUser,
):
    wait_time = between(1, 3)

    def on_start(self):
        self._email = unique_email()
        self._token: str | None = None
        self._bought_tickers: list[str] = []

        register(self, self._email, LOCUST_PASSWORD)
        self._token = login(self, self._email, LOCUST_PASSWORD)

    @property
    def _auth_headers(self) -> dict:
        if not self._token:
            return {}
        return {"Authorization": f"Bearer {self._token}"}


@events.quitting.add_listener
def on_quitting(environment, **kwargs):
    if environment.stats.total.fail_ratio > 0.05:
        print(f"\n⚠️  Tasa de fallos: {environment.stats.total.fail_ratio:.1%} — supera el umbral del 5%.")
        environment.process_exit_code = 1
    else:
        print(f"\n✅ Prueba completada. Tasa de fallos: {environment.stats.total.fail_ratio:.1%}")
