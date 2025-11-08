import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // 将 @ 映射到 src 目录
    },
    extensions: ['.js', '.ts', '.json', '.vue']
  },
  server: {
    proxy: {
      // 代理 MinerU API 请求
      '/api/mineru': {
        target: 'https://mineru.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/mineru/, '/api/v4'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('代理请求:', req.method, req.url);
          });
        }
      }
    }
  }
});
