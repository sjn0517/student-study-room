import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 必须引入 path

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 重点在这里：设置 @ 指向 src 目录
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '127.0.0.1', // 建议用这个，避免 localhost 解析问题
    port: 5174,
  }
})