from locust import task


class PriceTasksMixin:
    @task(2)
    def get_last_price_update(self):
        self.client.get(
            "/prices/last-update",
            headers=self._auth_headers,
            name="/prices/last-update [GET]",
        )
