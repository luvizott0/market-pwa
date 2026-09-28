import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'

import App from './App.vue'
import router from './router'

// Auto-register service worker for PWA
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nova versão do Market PWA disponível.')
  },
  onOfflineReady() {
    console.log('Market PWA pronto para uso offline.')
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
