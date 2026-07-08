import { createApp } from 'vue'
import App from './App.vue'

// Import PrimeVue and a beautiful default theme (Aura)
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'

// Import the specific components we will use
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Tag from 'primevue/tag'

const app = createApp(App)

// Configure PrimeVue
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})

// Register components globally so we can use them anywhere
app.component('Button', Button)
app.component('ProgressBar', ProgressBar)
app.component('Message', Message)
app.component('InputText', InputText)
app.component('InputNumber', InputNumber)
app.component('Select', Select)
app.component('Tag', Tag)

app.mount('#app')
