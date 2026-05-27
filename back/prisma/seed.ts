import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// US 3.1 — Seed script: creates the default Admin user on database initialization
async function main() {
  console.log('Seeding database...');

  // US 3.1 — Check if admin already exists to make seed idempotent
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@tracker.com' },
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
    console.log('Email: admin@tracker.com');
    console.log('Password: admin123');
  }

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
