import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { faker } from '@faker-js/faker';
import 'dotenv/config';

// 1. Initialize PostgreSQL Connection Pool & Adapter (Required for Prisma 7)
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. Instantiate Prisma Client with the database driver adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database with mock enterprise records...');

  const countries = ['PL', 'DE', 'FR', 'GB', 'US'];
  const customers = [];

  // Create 100 Mock Customers
  for (let i = 0; i < 100; i++) {
    const customer = await prisma.customer.create({
      data: {
        email: faker.internet.email(),
        country: countries[Math.floor(Math.random() * countries.length)],
      },
    });
    customers.push(customer);
  }

  // Create 5000 Mock Orders distributed over the past year
  for (let i = 0; i < 5000; i++) {
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    await prisma.order.create({
      data: {
        customerId: randomCustomer.id,
        amount: faker.number.float({ min: 10, max: 1500, fractionDigits: 2 }),
        currency: 'PLN',
        status: 'PAID',
        createdAt: faker.date.past({ years: 1 }),
      },
    });
  }

  console.log('Seeding process complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Gracefully close the connection pool and client
    await prisma.$disconnect();
    await pool.end();
  });