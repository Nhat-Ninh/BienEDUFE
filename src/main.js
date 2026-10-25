import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import CSS
import './style.css'
// Import KaTeX CSS để hiển thị công thức toán học
import 'katex/dist/katex.min.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
