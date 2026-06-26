import { faker } from "@faker-js/faker";

// 1. Define the exact structure your API expects.
// This matches the WebhookPayloadDto we created in the API.
interface MockPaymentPayload {
  transactionId: string;
  amount: number;
  currency: string;
}

async function triggerWebhook() {
  // 2. Generate random, realistic payment data using Faker.
  const payload: MockPaymentPayload = {
    transactionId: `txn_${faker.string.alphanumeric(16)}`,
    amount: faker.number.float({ min: 10, max: 5000, fractionDigits: 2 }),
    currency: "PLN",
  };

  console.log("⏳ Sending mock webhook to API...", payload);

  try {
    // 3. Send a POST request to your local API using the native Node fetch API.
    const response = await fetch("http://localhost:3000/api/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // 4. Check if the API accepted the payload.
    if (response.ok) {
      const result = await response.json();
      console.log("✅ Success! API Response:", result);
    } else {
      console.error(`❌ Failed! API returned status: ${response.status}`);
      const errorText = await response.text();
      console.error("Error details:", errorText);
    }
  } catch (error) {
    // 5. Catch network errors (e.g., if you forgot to start the API server).
    console.error(
      "❌ Network Error: Could not reach the API. Is it running?",
      error,
    );
  }
}

// 6. Execute the function.
triggerWebhook();
