<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

interface ReportTask {
  id: string
  year: number
  scopeRegion: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  progress: number
  fileKey: string | null
  createdAt: string
}

const YEAR_OPTIONS = [
  { label: '2026', value: 2026 },
  { label: '2025', value: 2025 },
  { label: '2024', value: 2024 },
]

const REGION_OPTIONS = [
  { label: '🌍 Worldwide', value: 'GLOBAL' },
  { label: 'Poland', value: 'PL' },
  { label: 'Germany', value: 'DE' },
  { label: 'France', value: 'FR' },
  { label: 'Netherlands', value: 'NL' },
  { label: 'Spain', value: 'ES' },
  { label: 'Czechia', value: 'CZ' },
  { label: 'United Kingdom', value: 'GB' },
  { label: 'United States', value: 'US' },
]

const REGION_LABELS: Record<string, string> = Object.fromEntries(
  REGION_OPTIONS.map((o) => [o.value, o.label]),
)

const year = ref(2025)
const scopeRegion = ref('GLOBAL')
const currentTask = ref<ReportTask | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const pollingInterval = ref<number | null>(null)

const history = ref<ReportTask[]>([])
const historyLoading = ref(false)

const STATUS_SEVERITY: Record<ReportTask['status'], string> = {
  PENDING: 'warn',
  PROCESSING: 'info',
  COMPLETED: 'success',
  FAILED: 'danger',
}

const loadHistory = async () => {
  historyLoading.value = true
  try {
    const response = await axios.get<ReportTask[]>(`${API_URL}/api/reports`)
    history.value = response.data
  } catch (error) {
    console.error('Failed to load report history', error)
  } finally {
    historyLoading.value = false
  }
}

const generateReport = async () => {
  errorMessage.value = null
  isLoading.value = true

  try {
    const response = await axios.post<ReportTask>(`${API_URL}/api/reports`, {
      year: year.value,
      scopeRegion: scopeRegion.value,
    })
    currentTask.value = response.data
    await loadHistory()
    startPolling(currentTask.value.id)
  } catch (error) {
    console.error('Failed to start report', error)
    isLoading.value = false
    errorMessage.value = 'Nie udało się uruchomić generowania raportu. Czy API działa?'
  }
}

const downloadReport = (task: ReportTask) => {
  window.open(`${API_URL}/api/reports/${task.id}/download`, '_blank')
}

const startPolling = (taskId: string) => {
  pollingInterval.value = window.setInterval(async () => {
    try {
      const response = await axios.get<ReportTask>(`${API_URL}/api/reports/${taskId}`)
      currentTask.value = response.data
      const idx = history.value.findIndex((t) => t.id === taskId)
      if (idx !== -1) history.value[idx] = response.data

      if (response.data.status === 'COMPLETED' || response.data.status === 'FAILED') {
        stopPolling()
        isLoading.value = false
      }
    } catch (error) {
      console.error('Failed to fetch status', error)
      stopPolling()
      isLoading.value = false
    }
  }, 2000)
}

const stopPolling = () => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}

onMounted(loadHistory)
onUnmounted(stopPolling)
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Raporty</h1>
        <p>Generowanie raportów PDF w tle (Redis + Worker + S3)</p>
      </div>
    </header>

    <div class="grid">
      <section class="card">
        <h2>Silnik raportów</h2>
        <p class="card-sub">Zadanie trafia do kolejki Redis, worker generuje PDF i zapisuje go w MinIO (S3).</p>

        <div class="field-row">
          <div class="field">
            <label for="year">Rok</label>
            <Select
              id="year"
              v-model="year"
              :options="YEAR_OPTIONS"
              option-label="label"
              option-value="value"
              fluid
            />
          </div>
          <div class="field">
            <label for="region">Region</label>
            <Select
              id="region"
              v-model="scopeRegion"
              :options="REGION_OPTIONS"
              option-label="label"
              option-value="value"
              fluid
            />
          </div>
        </div>

        <Button
          label="Generuj raport PDF"
          icon="pi pi-download"
          :loading="isLoading"
          :disabled="isLoading"
          fluid
          @click="generateReport"
        />

        <Message v-if="errorMessage" severity="error" class="error-message">
          {{ errorMessage }}
        </Message>

        <div v-if="currentTask" class="current-task">
          <div class="current-task-row">
            <span>Status</span>
            <Tag :value="currentTask.status" :severity="STATUS_SEVERITY[currentTask.status]" />
          </div>
          <ProgressBar :value="currentTask.progress" style="height: 18px" />
          <Button
            v-if="currentTask.status === 'COMPLETED'"
            label="Pobierz PDF"
            icon="pi pi-file-pdf"
            severity="success"
            outlined
            fluid
            @click="downloadReport(currentTask)"
          />
        </div>
      </section>

      <section class="card">
        <h2>Historia zadań</h2>
        <table class="history-table">
          <thead>
            <tr>
              <th>ID zadania</th>
              <th>Rok</th>
              <th>Region</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in history" :key="task.id">
              <td class="mono">{{ task.id.slice(0, 8) }}</td>
              <td>{{ task.year }}</td>
              <td>{{ REGION_LABELS[task.scopeRegion] ?? task.scopeRegion }}</td>
              <td><Tag :value="task.status" :severity="STATUS_SEVERITY[task.status]" /></td>
            </tr>
            <tr v-if="!historyLoading && history.length === 0">
              <td colspan="4" class="empty">Brak wygenerowanych raportów</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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
  grid-template-columns: 1fr 1.3fr;
  gap: 20px;
  align-items: start;
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

.field-row {
  display: flex;
  gap: 14px;
  margin-bottom: 18px;
}
.field-row .field {
  flex: 1;
  margin-bottom: 0;
}

.field {
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #8b8898;
}

.error-message {
  margin-top: 14px;
}

.current-task {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #f0eef7;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.current-task-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #625f70;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}
.history-table th {
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9b98a8;
  padding: 8px 10px;
  border-bottom: 1px solid #ece9f5;
}
.history-table td {
  padding: 12px 10px;
  font-size: 13.5px;
  color: #33303f;
  border-bottom: 1px solid #f4f2fa;
}
.history-table .mono {
  font-family: ui-monospace, monospace;
  font-size: 12.5px;
  color: #625f70;
}
.history-table .empty {
  text-align: center;
  color: #a7a4b4;
  padding: 24px 10px;
}
</style>
