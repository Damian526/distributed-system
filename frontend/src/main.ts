import { createApp } from 'vue'
import App from './App.vue'

// Import PrimeVue and a beautiful default theme (Aura)
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'

// Import the specific components we will use
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'

const app = createApp(App)

// Configure PrimeVue
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})

// Register components globally so we can use them anywhere
app.component('Button', Button)
app.component('Card', Card)
app.component('ProgressBar', ProgressBar)
app.component('Message', Message)
app.component('Tabs', Tabs)
app.component('TabList', TabList)
app.component('Tab', Tab)
app.component('TabPanels', TabPanels)
app.component('TabPanel', TabPanel)
app.component('InputText', InputText)
app.component('InputNumber', InputNumber)
app.component('Select', Select)

app.mount('#app')
