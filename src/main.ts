import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import router from './router'; // 确保路由文件被正确引入

const app = createApp(App);

// 全局状态管理（目录重构相关）
const pinia = createPinia();

app.use(pinia);
app.use(ElementPlus);
app.use(router); // 注册路由
app.mount('#app');
