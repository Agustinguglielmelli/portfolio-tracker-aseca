import uuid

LOCUST_PASSWORD = "Locust@1234"


def unique_email() -> str:
    return f"locust_{uuid.uuid4().hex[:8]}@test.com"


def register(user, email: str, password: str) -> None:
    with user.client.post(
        "/auth/register",
        json={"email": email, "password": password, "confirmPassword": password},
        name="/auth/register [setup]",
        catch_response=True,
    ) as resp:
        if resp.status_code not in (200, 201):
            resp.failure(f"Register failed: {resp.status_code} — {resp.text[:200]}")


def login(user, email: str, password: str) -> str | None:
    with user.client.post(
        "/auth/login",
        json={"email": email, "password": password},
        name="/auth/login [setup]",
        catch_response=True,
    ) as resp:
        if resp.status_code == 200:
            data = resp.json()
            token = data.get("access_token") or data.get("token")
            if token:
                return token
            resp.failure(f"No token in response: {resp.text[:200]}")
        else:
            resp.failure(f"Login failed: {resp.status_code} — {resp.text[:200]}")
    return None
