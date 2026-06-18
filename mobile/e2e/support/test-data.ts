import { apiLogin, apiRegister, apiBuy } from '../helpers/api';
import { dbDeleteUser, dbDeleteUserTransactions, dbDeleteUserWatchlist, dbUpsertStockPrice } from '../helpers/db';

export async function setupTestUser(
  email: string,
  password: string,
  prices: Record<string, number> = { AAPL: 150 },
): Promise<void> {
  await dbDeleteUser(email);
  await apiRegister(email, password);
  for (const [ticker, price] of Object.entries(prices)) {
    await dbUpsertStockPrice(ticker, price);
  }
}

export async function resetTransactions(email: string): Promise<void> {
  await dbDeleteUserTransactions(email);
}

export async function resetWatchlist(email: string): Promise<void> {
  await dbDeleteUserWatchlist(email);
}

export async function buyViaApi(
  email: string,
  password: string,
  ticker: string,
  quantity: number,
): Promise<void> {
  const token = await apiLogin(email, password);
  await apiBuy(token, ticker, quantity);
}
