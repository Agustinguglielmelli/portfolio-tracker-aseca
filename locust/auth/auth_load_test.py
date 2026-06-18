import uuid
from locust import HttpUser, task, between

class AuthLoadUser(HttpUser):
    wait_time = between(1, 3)

    @task(1)
    def register_and_login(self):
        email = f"load_{uuid.uuid4().hex[:8]}@test.com"
        password = "LoadPassword123!"

        with self.client.post(
            "/auth/register",
            json={"email": email, "password": password, "confirmPassword": password},
            name="/auth/register",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 201):
                resp.success()
            else:
                resp.failure(f"Register failed: {resp.status_code} — {resp.text[:200]}")

        with self.client.post(
            "/auth/login",
            json={"email": email, "password": password},
            name="/auth/login",
            catch_response=True,
        ) as resp:
            if resp.status_code in (200, 201):
                resp.success()
            else:
                resp.failure(f"Login failed: {resp.status_code} — {resp.text[:200]}")
