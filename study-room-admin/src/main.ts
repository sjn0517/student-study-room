import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus' // 👈 1. 引入 Element Plus
import 'element-plus/dist/index.css' // 👈 2. 引入样式
import App from './App.vue'
import router from './router'

const app = createApp(App)

// 👇 3. 注册 Pinia
const pinia = createPinia()
app.use(pinia)

// 👇 4. 注册 Element Plus (必须在 router 之前或之后都可以，但通常放在一起)
app.use(ElementPlus)

// 👇 5. 注册路由
app.use(router)

app.mount('#app')