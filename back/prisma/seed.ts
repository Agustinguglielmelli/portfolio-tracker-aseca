import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// US 3.1 — Seed script: creates the default Admin user on database initialization
// Also seeds StockPrice entries used by Locust load tests and initial buy/sell operations.
async function main() {
  console.log('Seeding database...');

  // US 3.1 — Check if admin already exists to make seed idempotent
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@admin.com' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists. Skipping creation.');
  } else {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    // US 3.1 — Create admin user with ADMIN role
    const admin = await prisma.user.create({
      data: {
        email: 'admin@admin.com',
        password: hashedPassword,
        role: 'ADMIN', // US 3.1
      },
    });
    console.log(`Created admin user with ID: ${admin.id}`);
    console.log('Email: admin@admin.com');
    console.log('Password: admin123');
  }

  // Seed stock prices so buy/sell operations work out of the box.
  // The python-worker batch will overwrite these with live prices on its next run.
  const stockPrices = [
    { ticker: 'AAPL',  price: 189.30 },
    { ticker: 'MSFT',  price: 415.50 },
    { ticker: 'GOOGL', price: 175.80 },
    { ticker: 'TSLA',  price: 245.60 },
    { ticker: 'AMZN',  price: 198.40 },
    { ticker: 'NVDA',  price: 875.20 },
    { ticker: 'META',  price: 530.10 },
  ];

  for (const { ticker, price } of stockPrices) {
    await prisma.stockPrice.upsert({
      where: { ticker },
      update: {},          // Don't overwrite if already set by the batch worker
      create: { ticker, price, updatedAt: new Date() },
    });
  }
  console.log(`Seeded ${stockPrices.length} stock prices.`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
