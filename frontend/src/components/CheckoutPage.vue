<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

interface CheckoutSession {
  url: string
}

interface OrderRow {
  id: string
  transactionId: string
  productName: string
  amount: string
  currency: string
  status: 'PAID' | 'REFUNDED' | 'FAILED'
  createdAt: string
}

const productName = ref('Premium Plan')
const amount = ref(49.99)
const currency = ref('usd')
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

const orders = ref<OrderRow[]>([])
const ordersLoading = ref(false)

const currencyOptions = [
  { label: 'USD', value: 'usd' },
  { label: 'EUR', value: 'eur' },
  { label: 'PLN', value: 'pln' },
]

const STATUS_SEVERITY: Record<OrderRow['status'], string> = {
  PAID: 'success',
  REFUNDED: 'warn',
  FAILED: 'danger',
}

const loadOrders = async () => {
  ordersLoading.value = true
  try {
    const response = await axios.get<OrderRow[]>(`${API_URL}/api/orders`)
    orders.value = response.data
  } catch (error) {
    console.error('Failed to load recent orders', error)
  } finally {
    ordersLoading.value = false
  }
}

const startCheckout = async () => {
  errorMessage.value = null
  isLoading.value = true

  try {
    const response = await axios.post<CheckoutSession>(`${API_URL}/api/checkout`, {
      productName: productName.value,
      amount: amount.value,
      currency: currency.value,
    })
    window.location.href = response.data.url
  } catch (error) {
    console.error('Checkout failed', error)
    errorMessage.value = 'Nie udało się utworzyć sesji płatności. Czy API działa?'
    isLoading.value = false
  }
}

onMounted(loadOrders)
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Checkout</h1>
        <p>Płatności, webhooki i transakcje z bramki</p>
      </div>
    </header>

    <div class="grid">
      <section class="card">
        <h2>Nowa płatność</h2>
        <p class="card-sub">Symulacja zakupu przez Stripe Checkout — <code>POST /api/checkout</code></p>

        <div class="field">
          <label for="productName">Nazwa produktu</label>
          <InputText id="productName" v-model="productName" fluid />
        </div>
        <div class="field">
          <label for="amount">Kwota</label>
          <InputNumber
            id="amount"
            v-model="amount"
            mode="decimal"
            :min-fraction-digits="2"
            :max-fraction-digits="2"
            fluid
          />
        </div>
        <div class="field">
          <label for="currency">Waluta</label>
          <Select
            id="currency"
            v-model="currency"
            :options="currencyOptions"
            option-label="label"
            option-value="value"
            fluid
          />
        </div>

        <Message v-if="errorMessage" severity="error" class="error-message">
          {{ errorMessage }}
        </Message>

        <Button
          label="Przejdź do płatności"
          icon="pi pi-credit-card"
          :loading="isLoading"
          :disabled="isLoading"
          fluid
          @click="startCheckout"
        />
      </section>

      <section class="card summary-card">
        <div class="summary-badge">
          <span class="dot" /> Powered by Stripe · Tryb testowy
        </div>
        <div class="summary-product">{{ productName || 'Produkt' }}</div>
        <div class="summary-amount">
          {{ amount.toFixed(2) }} <span>{{ currency.toUpperCase() }}</span>
        </div>
        <div class="summary-total-row">
          <span>Do zapłaty</span>
          <strong>{{ amount.toFixed(2) }} {{ currency.toUpperCase() }}</strong>
        </div>
      </section>
    </div>

    <section class="card table-card">
      <h2>Ostatnie transakcje</h2>
      <table class="orders-table">
        <thead>
          <tr>
            <th>Transakcja</th>
            <th>Produkt</th>
            <th>Kwota</th>
            <th>Waluta</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td class="mono">{{ order.transactionId.slice(0, 16) }}</td>
            <td>{{ order.productName }}</td>
            <td>{{ Number(order.amount).toFixed(2) }}</td>
            <td>{{ order.currency }}</td>
            <td><Tag :value="order.status" :severity="STATUS_SEVERITY[order.status]" /></td>
          </tr>
          <tr v-if="!ordersLoading && orders.length === 0">
            <td colspan="5" class="empty">Brak transakcji</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 24px;
}
.page-header h1 {
  font-size: 24px;
  font-weight: 800;
  color: #1e1b2e;
  margin: 0;
}
.page-header p {
  color: #77748a;
  font-size: 13.5px;
  margin-top: 4px;
}

.grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 20px;
  align-items: start;
  margin-bottom: 20px;
}

.card {
  background: #fff;
  border: 1px solid #ece9f5;
  border-radius: 14px;
  padding: 22px 24px;
  box-shadow: 0 1px 3px rgba(30, 27, 46, 0.05);
}
.card h2 {
  font-size: 16px;
  font-weight: 700;
  color: #1e1b2e;
  margin: 0 0 6px;
}
.card-sub {
  font-size: 13px;
  color: #8b8898;
  margin: 0 0 18px;
}
.card-sub code {
  background: #f5f3ff;
  color: #6d5bf9;
  padding: 2px 6px;
  border-radius: 5px;
  font-size: 12px;
}

.field {
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 12.5px;
  font-weight: 600;
  color: #625f70;
}

.error-message {
  margin-bottom: 14px;
}

.summary-card {
  background: #14131c;
  border: none;
  color: #e5e4ec;
}
.summary-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #a7a5b8;
  margin-bottom: 20px;
}
.summary-badge .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #6d5bf9;
}
.summary-product {
  font-size: 14px;
  color: #a7a5b8;
  margin-bottom: 6px;
}
.summary-amount {
  font-size: 34px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 24px;
}
.summary-amount span {
  font-size: 16px;
  font-weight: 600;
  color: #a7a5b8;
}
.summary-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #2a2937;
  font-size: 14px;
}
.summary-total-row strong {
  font-size: 17px;
}

.table-card h2 {
  margin-bottom: 14px;
}
.orders-table {
  width: 100%;
  border-collapse: collapse;
}
.orders-table th {
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9b98a8;
  padding: 8px 10px;
  border-bottom: 1px solid #ece9f5;
}
.orders-table td {
  padding: 12px 10px;
  font-size: 13.5px;
  color: #33303f;
  border-bottom: 1px solid #f4f2fa;
}
.orders-table .mono {
  font-family: ui-monospace, monospace;
  font-size: 12.5px;
  color: #625f70;
}
.orders-table .empty {
  text-align: center;
  color: #a7a4b4;
  padding: 24px 10px;
}
</style>
