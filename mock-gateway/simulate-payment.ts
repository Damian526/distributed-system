import { faker } from "@faker-js/faker";
import axios from "axios";

interface MockPaymentPayload {
  transactionId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  productName: string;
}

const SUPPORTED_CURRENCIES = ["PLN", "EUR", "USD", "GBP"] as const;

async function triggerWebhook(
  index: number,
  customerEmail: string,
): Promise<void> {
  const payload: MockPaymentPayload = {
    transactionId: `txn_${faker.string.alphanumeric(16)}`,
    amount: faker.number.float({ min: 10, max: 5000, fractionDigits: 2 }),
    currency: faker.helpers.arrayElement(SUPPORTED_CURRENCIES),
    customerEmail,
    productName: faker.commerce.productName(),
  };

  console.log(`[${index}] Sending...`, payload);

  try {
    const response = await axios.post(
      "http://localhost:3000/api/webhooks",
      payload,
    );
    console.log(`✅ [${index}] Accepted:`, response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `❌ [${index}] Failed — status: ${error.response?.status}`,
        error.response?.data,
      );
    } else {
      console.error(`❌ [${index}] Network error:`, error);
    }
  }
}

async function runSimulation(count: number, delayMs: number): Promise<void> {
  console.log(`🚀 Firing ${count} payments, ${delayMs}ms apart\n`);

  for (let i = 1; i <= count; i++) {
    const customerEmail = faker.internet.email();
    await triggerWebhook(i, customerEmail);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  console.log("\n🏁 Done.");
}

runSimulation(5, 500);
