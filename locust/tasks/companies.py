import random

from locust import task

SEARCH_TERMS = ["Apple", "Microsoft", "Tesla", "Google", "Amazon"]


class CompanyTasksMixin:
    @task(3)
    def search_companies(self):
        query = random.choice(SEARCH_TERMS)
        self.client.get(
            f"/companies/search?q={query}",
            headers=self._auth_headers,
            name="/companies/search [GET]",
        )
