import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// 样式文件
import 'element-plus/dist/index.css'
import './styles/index.scss'

// 全局组件
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import DictTag from '@/components/DictTag/index.vue'

// 全局指令
import directives from '@/directives'

// 字典工具
import { useDict } from '@/utils/dict'

// 进度条
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// 配置进度条
NProgress.configure({ 
  showSpinner: false,
  minimum: 0.2,
  speed: 500
})

const app = createApp(App)
const pinia = createPinia()

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册全局组件
app.component('dict-tag', DictTag)

// 注册全局指令
app.use(directives)

// 添加全局属性
app.config.globalProperties.useDict = useDict

app.use(pinia)
app.use(router)

app.mount('#app')