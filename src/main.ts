import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import { loadExampleSvgComponents } from './svg/helpers/utils'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// 先加载 SVG 组件，再挂载应用
loadExampleSvgComponents().then(() => {
  console.log('[App] SVG 组件已加载')
  app.mount('#app')
}).catch(error => {
  console.error('[App] 加载 SVG 组件失败:', error)
  app.mount('#app')
})
