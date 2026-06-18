const API = 'http://localhost:3000';

export async function apiRegister(email: string, password: string): Promise<void> {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, confirmPassword: password }),
  });

  if (!res.ok && res.status !== 400 && res.status !== 409) {
    throw new Error(`register failed: ${res.status}`);
  }
}

export async function apiLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  const data = await res.json() as { token?: string; access_token?: string };
  const token = data.token ?? data.access_token;
  if (!token) throw new Error('login: no token in response');
  return token;
}

export async function apiBuy(
  token: string,
  ticker: string,
  quantity: number,
  date = '2026-01-01',
): Promise<void> {
  const res = await fetch(`${API}/portfolio/buy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ticker, quantity, date }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(`buy failed: ${err.message ?? res.status}`);
  }
}