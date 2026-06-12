import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'token';

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function getRoleFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
}
