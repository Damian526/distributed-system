<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import axios from 'axios';

// 1. STRICT TYPESCRIPT: We define exactly what the backend gives us
interface ReportTask {
  id: string;
  year: number;
  scopeRegion: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  filePath: string | null;
}

// 2. THE MEMORY (State): Variables that update the screen automatically
const currentTask = ref<ReportTask | null>(null);
const isLoading = ref<boolean>(false);
const pollingInterval = ref<number | null>(null);

// 3. THE TRIGGER: Clicking the "Generate Report" button
const generateReport = async () => {
  isLoading.value = true;

  try {
    // We send the request to your NestJS API (The Receptionist)
    const response = await axios.post<ReportTask>('http://localhost:3000/api/reports', {
      year: 2025,
      scopeRegion: 'PL'
    });

    // Save the ticket ID we got back
    currentTask.value = response.data;
    
    // Start repeatedly calling the API to check the progress
    startPolling(currentTask.value.id);

  } catch (error) {
    console.error("Failed to start report", error);
    isLoading.value = false;
  }
};

// 4. THE POLLING: Repeatedly calling the API
const startPolling = (taskId: string) => {
  // Call the API every 2 seconds (2000 milliseconds)
  pollingInterval.value = window.setInterval(async () => {
    try {
      const response = await axios.get<ReportTask>(`http://localhost:3000/api/reports/${taskId}`);
      currentTask.value = response.data;

      // If the worker finishes or fails, STOP calling the API!
      if (currentTask.value.status === 'COMPLETED' || currentTask.value.status === 'FAILED') {
        stopPolling();
        isLoading.value = false;
      }
    } catch (error) {
      console.error("Failed to fetch status", error);
      stopPolling();
    }
  }, 2000);
};

// Stops the repeating timer
const stopPolling = () => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
};

// Best Practice: If the user closes the page, stop the timer so we don't leak memory
onUnmounted(() => {
  stopPolling();
});
</script>

<template>
  <div class="dashboard-layout">
    
    <Card style="width: 40rem; padding: 1rem; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      
      <template #title>
        <h2>📊 E-Commerce Financial Reports</h2>
      </template>
      
      <template #content>
        <p>Request an intensive PDF report from the background analytics engine.</p>

        <Button 
          label="Generate 2025 PDF Report" 
          icon="pi pi-file-pdf" 
          @click="generateReport" 
          :loading="isLoading && currentTask?.progress === 0"
          :disabled="isLoading"
          style="margin-top: 1rem; margin-bottom: 2rem;"
        />

        <div v-if="currentTask">
          <hr style="margin-bottom: 1.5rem; opacity: 0.2;" />
          
          <h3>System Status: <strong>{{ currentTask.status }}</strong></h3>
          
          <ProgressBar :value="currentTask.progress" style="height: 24px; margin-top: 1rem;">
             {{ currentTask.progress }}%
          </ProgressBar>

          <div v-if="currentTask.status === 'COMPLETED'" style="margin-top: 1.5rem;">
             <Message severity="success">PDF successfully generated!</Message>
             <Button label="Download PDF" icon="pi pi-download" severity="success" outlined />
          </div>

        </div>
      </template>
    </Card>

  </div>
</template>

<style scoped>
/* Standard, simple CSS (No Tailwind) */
.dashboard-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f4f4f9;
  font-family: Arial, sans-serif;
}
h2 {
  margin: 0;
  color: #333;
}
h3 {
  color: #555;
  margin: 0;
}
</style>