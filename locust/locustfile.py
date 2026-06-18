"""
Escenario A — Load Test

Valida que el sistema cumple SLOs bajo carga normal esperada.

Ejecutar:
  locust -f locustfile.py --host=http://localhost:3000
"""

from locust import LoadTestShape

from workflows.active_trader import ActiveTrader
from workflows.portfolio_viewer import PortfolioViewer
from workflows.researcher import Researcher

# Necesario para que Locust registre los usuarios
__all__ = [PortfolioViewer, Researcher, ActiveTrader]


class ScenarioAShape(LoadTestShape):
    """
    Fase 1 (0–60s):   ramp-up hasta 20 usuarios a 2/s.
    Fase 2 (60–180s): steady-state de 2 minutos.
    """

    stages = [
        {"duration": 60,  "users": 20, "spawn_rate": 2},
        {"duration": 180, "users": 20, "spawn_rate": 20},
    ]

    def tick(self):
        run_time = self.get_run_time()
        for stage in self.stages:
            if run_time < stage["duration"]:
                return stage["users"], stage["spawn_rate"]
        return None
