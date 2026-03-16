import 'core-js/features/array/at'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/global.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
npm run build
cp -r dist/* ../
cd ..
git add .
git commit -m "添加兼容性补丁"
git push


