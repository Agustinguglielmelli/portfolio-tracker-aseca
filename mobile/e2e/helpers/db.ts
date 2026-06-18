import { Client } from 'pg';

const DB_URL =
  process.env.DATABASE_URL ??
  'postgres://postgres:password@localhost:5433/integration_test_db';

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function dbDeleteUserTransactions(email: string): Promise<void> {
  await withClient((c) =>
    c.query(
      `DELETE FROM transactions
       WHERE "userId" = (SELECT id FROM "User" WHERE email = $1)`,
      [email],
    ),
  );
}

export async function dbDeleteUserWatchlist(email: string): Promise<void> {
  await withClient((c) =>
    c.query(
      `DELETE FROM "WatchlistItem"
       WHERE "userId" = (SELECT id FROM "User" WHERE email = $1)`,
      [email],
    ),
  );
}

export async function dbUpsertStockPrice(ticker: string, price: number): Promise<void> {
  await withClient((c) =>
    c.query(
      `INSERT INTO "StockPrice" (ticker, price, "updatedAt")
       VALUES ($1, $2, NOW())
       ON CONFLICT (ticker)
       DO UPDATE SET price = $2, "updatedAt" = NOW()`,
      [ticker, price],
    ),
  );
}

export async function dbDeleteUser(email: string): Promise<void> {
  await withClient(async (c) => {
    await c.query(
      `DELETE FROM transactions
       WHERE "userId" = (SELECT id FROM "User" WHERE email = $1)`,
      [email],
    );
    await c.query(
      `DELETE FROM "WatchlistItem"
       WHERE "userId" = (SELECT id FROM "User" WHERE email = $1)`,
      [email],
    );
    await c.query(`DELETE FROM "User" WHERE email = $1`, [email]);
  });
}
