import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { faker } from '@faker-js/faker';
import 'dotenv/config';

// 1. Initialize PostgreSQL Connection Pool & Adapter
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. Instantiate Prisma Client with the database driver adapter
const prisma = new PrismaClient({ adapter });

const COUNTRIES = ['PL', 'DE', 'FR', 'GB', 'US'] as const;
const CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP'] as const;
const STATUSES = ['PAID', 'REFUNDED', 'FAILED'] as const;

async function main() {
  console.log('🌱 Seeding database with mock enterprise records...');

  // ── Customers ──────────────────────────────────────────────
  console.log('👤 Creating 100 customers...');

  const customers = await Promise.all(
    Array.from({ length: 100 }, () =>
      prisma.customer.create({
        data: {
          email: faker.internet.email(),
          country: faker.helpers.arrayElement(COUNTRIES),
        },
      }),
    ),
  );

  console.log(`✅ Created ${customers.length} customers`);

  // ── Orders ─────────────────────────────────────────────────
  console.log('🛒 Creating 5000 orders...');

  // Build all 5000 in batches of 100 so the DB isn't hammered
  const BATCH_SIZE = 100;
  const TOTAL_ORDERS = 5000;
  let created = 0;

  for (let batch = 0; batch < TOTAL_ORDERS / BATCH_SIZE; batch++) {
    await Promise.all(
      Array.from({ length: BATCH_SIZE }, () => {
        const customer = faker.helpers.arrayElement(customers);

        return prisma.order.create({
          data: {
            // ✅ Required unique field — generate a realistic transaction ID
            transactionId: `txn_${faker.string.alphanumeric(16)}`,
            customerId: customer.id,
            amount: faker.number.float({
              min: 10,
              max: 1500,
              fractionDigits: 2,
            }),
            currency: faker.helpers.arrayElement(CURRENCIES),
            status: faker.helpers.arrayElement(STATUSES),
            createdAt: faker.date.past({ years: 1 }),
          },
        });
      }),
    );

    created += BATCH_SIZE;
    console.log(`   ... ${created}/${TOTAL_ORDERS} orders created`);
  }

  console.log(`✅ Created ${TOTAL_ORDERS} orders`);
  console.log('\n🏁 Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
