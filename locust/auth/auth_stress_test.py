import math
import uuid
from locust import HttpUser, task, between, LoadTestShape

class AuthStressUser(HttpUser):
    wait_time = between(1, 2)

    @task(1)
    def register_and_login(self):
        email = f"stress_{uuid.uuid4().hex[:8]}@test.com"
        password = "StressPassword123!"

        with self.client.post(
            "/auth/register",
            json={"email": email, "password": password, "confirmPassword": password},
            name="/auth/register",
            catch_response=True,
        ) as resp:
            if resp.status_code not in (200, 201):
                resp.failure(f"Register failed: {resp.status_code} — {resp.text[:200]}")

        with self.client.post(
            "/auth/login",
            json={"email": email, "password": password},
            name="/auth/login",
            catch_response=True,
        ) as resp:
            if resp.status_code not in (200, 201):
                resp.failure(f"Login failed: {resp.status_code} — {resp.text[:200]}")

class StepLoadShape(LoadTestShape):
    step_time = 30
    step_load = 50
    spawn_rate = 10
    time_limit = 300

    def tick(self):
        run_time = self.get_run_time()
        if run_time > self.time_limit:
            return None

        current_step = math.floor(run_time / self.step_time) + 1
        return (current_step * self.step_load, self.spawn_rate)
