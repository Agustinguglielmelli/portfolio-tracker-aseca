import { defineConfig } from 'cypress';
import { Client } from 'pg';

const DB_URL = 'postgres://postgres:password@localhost:5433/integration_test_db';

async function getClient() {
    const client = new Client({ connectionString: DB_URL });
    await client.connect();
    return client;
}

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:3001',
        supportFile: 'cypress/support/e2e.ts',
        specPattern: 'cypress/e2e/**/*.cy.ts',
        viewportWidth: 1280,
        viewportHeight: 720,
        setupNodeEvents(on) {
            on('task', {
                async 'db:deleteUser'(email: string) {
                    const client = await getClient();
                    await client.query('DELETE FROM "transactions" WHERE "userId" = (SELECT id FROM "User" WHERE email = $1)', [email]);
                    await client.query('DELETE FROM "User" WHERE email = $1', [email]);
                    await client.end();
                    return null;
                },

                async 'db:deleteUserTransactions'(email: string) {
                    const client = await getClient();
                    await client.query('DELETE FROM "transactions" WHERE "userId" = (SELECT id FROM "User" WHERE email = $1)', [email]);
                    await client.end();
                    return null;
                },

                async 'db:upsertStockPrice'({ ticker, price }: { ticker: string; price: number }) {
                    const client = await getClient();
                    await client.query(
                        'INSERT INTO "StockPrice" (ticker, price, "updatedAt") VALUES ($1, $2, NOW()) ON CONFLICT (ticker) DO UPDATE SET price = $2, "updatedAt" = NOW()',
                        [ticker, price]
                    );
                    await client.end();
                    return null;
                },
            });
        },
    },
});
