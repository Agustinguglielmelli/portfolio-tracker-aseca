import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(__dirname, '..', '.env.test'),
  override: !process.env.CI,
});

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be defined for integration/e2e tests.');
}

if (!process.env.DATABASE_URL.includes('integration_test_db')) {
  throw new Error(
    `Integration/e2e tests must use integration_test_db, got: ${process.env.DATABASE_URL}`,
  );
}
