// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件
import HomeView from '@/views/HomeView.vue'
import BookingView from '@/views/BookingView.vue'
import AdminView from '@/views/AdminView.vue'



// 定义路由
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/booking',
    name: 'booking',
    component: BookingView
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminView
  }
]

// 创建路由器实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router