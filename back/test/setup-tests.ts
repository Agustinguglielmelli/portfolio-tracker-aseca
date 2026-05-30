import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be defined for tests');
}
