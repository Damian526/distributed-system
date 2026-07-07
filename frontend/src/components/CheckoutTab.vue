<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

interface CheckoutSession {
  url: string
}

const productName = ref('Premium Plan')
const amount = ref(49.99)
const currency = ref('usd')
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

const currencyOptions = [
  { label: 'USD', value: 'usd' },
  { label: 'EUR', value: 'eur' },
  { label: 'PLN', value: 'pln' },
]

const startCheckout = async () => {
  errorMessage.value = null
  isLoading.value = true

  try {
    const response = await axios.post<CheckoutSession>(`${API_URL}/api/checkout`, {
      productName: productName.value,
      amount: amount.value,
      currency: currency.value,
    })
    // Przekierowanie na prawdziwą stronę płatności Stripe
    window.location.href = response.data.url
  } catch (error) {
    console.error('Checkout failed', error)
    errorMessage.value = 'Nie udało się utworzyć sesji płatności. Czy API działa?'
    isLoading.value = false
  }
}
</script>

<template>
  <div class="checkout-tab">
    <p class="intro">Symulacja zakupu produktu przez Stripe Checkout.</p>

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
  </div>
</template>

<style scoped>
.checkout-tab {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 0.5rem;
}
.intro {
  color: #666;
  margin: 0;
  font-size: 14px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.field label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}
.error-message {
  margin: 0;
}
</style>
