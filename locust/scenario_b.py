from locust import LoadTestShape

from workflows.active_trader import ActiveTrader
from workflows.portfolio_viewer import PortfolioViewer

__all__ = [PortfolioViewer, ActiveTrader]


class ScenarioBShape(LoadTestShape):
    stages = [
        {"duration":  30, "users":  50, "spawn_rate": 50},
        {"duration":  60, "users": 100, "spawn_rate": 50},
        {"duration":  90, "users": 150, "spawn_rate": 50},
        {"duration": 120, "users": 200, "spawn_rate": 50},
        {"duration": 150, "users": 250, "spawn_rate": 50},
        {"duration": 180, "users": 300, "spawn_rate": 50},
        {"duration": 210, "users": 350, "spawn_rate": 50},
        {"duration": 240, "users": 400, "spawn_rate": 50},
        {"duration": 270, "users": 450, "spawn_rate": 50},
        {"duration": 300, "users": 500, "spawn_rate": 50},
    ]

    def tick(self):
        run_time = self.get_run_time()
        for stage in self.stages:
            if run_time < stage["duration"]:
                return stage["users"], stage["spawn_rate"]
        return None
