import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { loadData } from './store/data.js'
import './assets/global.css'

async function bootstrap() {
  await loadData()
  createApp(App).use(router).mount('#app')
}

bootstrap()
