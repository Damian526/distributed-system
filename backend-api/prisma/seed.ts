import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
  path: path.resolve(
    process.cwd(),
    `.env.${process.env.NODE_ENV || 'development'}`,
  ),
});

// 1. Initialize PostgreSQL Connection Pool & Adapter
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. Instantiate Prisma Client with the database driver adapter
const prisma = new PrismaClient({ adapter });

// ── Realistic reference data ─────────────────────────────────
// Country weights: a PL-based SaaS selling mostly at home + EU/US
const COUNTRY_WEIGHTS = [
  { value: 'PL', weight: 40 },
  { value: 'DE', weight: 18 },
  { value: 'GB', weight: 12 },
  { value: 'US', weight: 12 },
  { value: 'FR', weight: 8 },
  { value: 'NL', weight: 4 },
  { value: 'ES', weight: 3 },
  { value: 'CZ', weight: 3 },
];

// Currency follows the customer's country, like real payments do
const COUNTRY_CURRENCY: Record<string, string> = {
  PL: 'PLN',
  DE: 'EUR',
  FR: 'EUR',
  NL: 'EUR',
  ES: 'EUR',
  CZ: 'EUR',
  GB: 'GBP',
  US: 'USD',
};

// Fixed product catalog with real price points (not random noise)
const PRODUCTS = [
  { name: 'Starter Plan (Monthly)', price: 9.99, weight: 25 },
  { name: 'Premium Plan (Monthly)', price: 49.99, weight: 30 },
  { name: 'Business Plan (Monthly)', price: 99.99, weight: 15 },
  { name: 'Enterprise Plan (Monthly)', price: 299.0, weight: 5 },
  { name: 'Premium Plan (Annual)', price: 499.0, weight: 10 },
  { name: 'Business Plan (Annual)', price: 999.0, weight: 6 },
  { name: 'Extra Seats Pack (5)', price: 29.99, weight: 5 },
  { name: 'Priority Support Add-on', price: 19.99, weight: 3 },
  { name: 'Custom Report Credits (100)', price: 149.0, weight: 1 },
];

// Real-world outcome distribution: overwhelmingly paid
const STATUS_WEIGHTS = [
  { value: 'PAID' as const, weight: 91 },
  { value: 'REFUNDED' as const, weight: 5 },
  { value: 'FAILED' as const, weight: 4 },
];

// Monthly seasonality multipliers (Jan..Dec): Q4 spike, summer dip
const SEASONALITY = [0.9, 0.85, 1.0, 1.0, 0.95, 0.8, 0.7, 0.75, 1.05, 1.15, 1.4, 1.45];

function randomOrderDate(): Date {
  // Orders span the last ~2.5 years (2024 → mid-2026),
  // weighted by month so charts show a realistic seasonal curve.
  const year = faker.helpers.weightedArrayElement([
    { value: 2024, weight: 25 },
    { value: 2025, weight: 45 }, // richest year — reports default to 2025
    { value: 2026, weight: 30 },
  ]);
  const maxMonth = year === 2026 ? 6 : 11; // 2026 only has data up to July
  let month: number;
  do {
    month = faker.number.int({ min: 0, max: maxMonth });
  } while (Math.random() > SEASONALITY[month] / 1.45); // rejection-sample seasonality

  const day = faker.number.int({ min: 1, max: 28 });
  const hour = faker.number.int({ min: 6, max: 23 }); // people buy during the day
  return new Date(Date.UTC(year, month, day, hour, faker.number.int({ min: 0, max: 59 })));
}

async function main() {
  console.log('🌱 Seeding database with realistic e-commerce records...');

  // ── Customers ──────────────────────────────────────────────
  const CUSTOMER_COUNT = 300;
  console.log(`👤 Creating ${CUSTOMER_COUNT} customers...`);

  const customers = await Promise.all(
    Array.from({ length: CUSTOMER_COUNT }, () => {
      const country = faker.helpers.weightedArrayElement(COUNTRY_WEIGHTS);
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      return prisma.customer.create({
        data: {
          // Email derived from the real name, like actual signups
          email: faker.internet
            .email({ firstName, lastName, provider: faker.helpers.arrayElement(['gmail.com', 'outlook.com', 'yahoo.com', 'proton.me', 'wp.pl', 'onet.pl']) })
            .toLowerCase(),
          firstName,
          lastName,
          country,
          city: faker.location.city(),
          createdAt: faker.date.between({
            from: '2023-06-01T00:00:00Z',
            to: '2026-06-01T00:00:00Z',
          }),
        },
      });
    }),
  );
  console.log(`✅ Created ${customers.length} customers`);

  // ── Orders ─────────────────────────────────────────────────
  // Pareto-ish: some customers are heavy repeat buyers, most order a few times
  const TOTAL_ORDERS = 8000;
  const BATCH_SIZE = 200;
  console.log(`🛒 Creating ${TOTAL_ORDERS} orders...`);

  // Give each customer a "loyalty weight" so order counts follow a long tail
  const weightedCustomers = customers.map((c) => ({
    value: c,
    weight: Math.ceil(Math.pow(Math.random(), 2) * 10) || 1,
  }));

  let created = 0;
  for (let batch = 0; batch < TOTAL_ORDERS / BATCH_SIZE; batch++) {
    await Promise.all(
      Array.from({ length: BATCH_SIZE }, () => {
        const customer = faker.helpers.weightedArrayElement(weightedCustomers);
        const product = faker.helpers.weightedArrayElement(
          PRODUCTS.map((p) => ({ value: p, weight: p.weight })),
        );
        const orderDate = randomOrderDate();

        return prisma.order.create({
          data: {
            transactionId: `pi_${faker.string.alphanumeric(24)}`, // Stripe-style PaymentIntent id
            customerId: customer.id,
            amount: product.price,
            currency: COUNTRY_CURRENCY[customer.country] ?? 'USD',
            status: faker.helpers.weightedArrayElement(STATUS_WEIGHTS),
            productName: product.name,
            createdAt: orderDate,
          },
        });
      }),
    );

    created += BATCH_SIZE;
    if (created % 1000 === 0) {
      console.log(`   ... ${created}/${TOTAL_ORDERS} orders created`);
    }
  }

  console.log(`✅ Created ${TOTAL_ORDERS} orders`);

  // ── Summary ────────────────────────────────────────────────
  const [customerTotal, orderTotal, paidTotal] = await Promise.all([
    prisma.customer.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PAID' } }),
  ]);
  console.log('\n📊 Database now contains:');
  console.log(`   Customers: ${customerTotal}`);
  console.log(`   Orders:    ${orderTotal} (${paidTotal} PAID)`);
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
