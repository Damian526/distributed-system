<script setup lang="ts">
import { ref } from 'vue'
import ReportsPage from './components/ReportsPage.vue'
import CheckoutPage from './components/CheckoutPage.vue'

type TabKey = 'reports' | 'checkout'

// Stripe redirects back to /checkout/success or /checkout/cancel — land on the Checkout tab, not the default one
const returningFromStripe = window.location.pathname.startsWith('/checkout/')
const activeTab = ref<TabKey>(returningFromStripe ? 'checkout' : 'reports')

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'reports', label: 'Raporty', icon: 'pi pi-chart-bar' },
  { key: 'checkout', label: 'Checkout', icon: 'pi pi-credit-card' },
]
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">S</div>
        <div>
          <div class="brand-name">SaaS Analytics</div>
          <div class="brand-sub">distributed-system</div>
        </div>
      </div>

      <nav class="nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="nav-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <i :class="tab.icon" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>
    </aside>

    <main class="content">
      <ReportsPage v-if="activeTab === 'reports'" />
      <CheckoutPage v-else />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
  background: #f6f6fa;
  font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: #14131c;
  color: #e5e4ec;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 6px;
}
.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: #6d5bf9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 15px;
  color: white;
  flex-shrink: 0;
}
.brand-name {
  font-weight: 700;
  font-size: 14px;
  color: #fff;
}
.brand-sub {
  font-size: 11px;
  color: #8b899c;
  margin-top: 1px;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: #a7a5b8;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s ease, color 0.12s ease;
}
.nav-item:hover {
  background: #1d1c28;
  color: #e5e4ec;
}
.nav-item.active {
  background: #6d5bf9;
  color: #fff;
}
.nav-item i {
  font-size: 14px;
  width: 16px;
}

.content {
  flex: 1;
  min-width: 0;
  padding: 32px 40px;
}
</style>
