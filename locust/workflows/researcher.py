import random

from locust import HttpUser, constant, task

COMPANIES = [
    ("Apple", "AAPL"),
    ("Microsoft", "MSFT"),
    ("Tesla", "TSLA"),
    ("Google", "GOOGL"),
    ("Amazon", "AMZN"),
    ("Meta", "META"),
    ("Netflix", "NFLX"),
]


class Researcher(HttpUser):
    """
    WF-2: Usuario que investiga empresas vía EDGAR.
    Cada ciclo genera 4 requests a EDGAR.
    El wait_time de 3s es deliberado: con 7 usuarios corriendo este workflow
    se generan ~9.3 req/s hacia EDGAR, sin superar el límite de 10 req/s.
    """

    weight = 35
    wait_time = constant(3)

    @task
    def research_company(self):
        query, ticker = random.choice(COMPANIES)

        self.client.get(f"/companies/search?q={query}", name="/companies/search [GET]")
        self.client.get(f"/companies/{ticker}/metrics", name="/companies/:ticker/metrics [GET]")
        self.client.get(f"/companies/{ticker}/filings", name="/companies/:ticker/filings [GET]")
        self.client.get(f"/companies/{ticker}/historical-metrics", name="/companies/:ticker/historical-metrics [GET]")
