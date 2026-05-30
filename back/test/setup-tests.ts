import path from 'node:path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '..', '.env') });

if (!process.env.DATABASE_TEST_URL) {
  throw new Error(
    'DATABASE_TEST_URL must be defined to run integration/e2e tests safely.',
  );
}

process.env.DATABASE_URL = process.env.DATABASE_TEST_URL;
