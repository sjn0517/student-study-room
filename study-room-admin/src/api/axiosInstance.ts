// src/api/axiosInstance.ts
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getLocalStorage } from '@/utils/storage'

// 创建 axios 实例
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000', // json-server 默认端口
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = getLocalStorage('token', '')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：直接返回 response.data
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          break
        case 403:
          ElMessage.error('没有权限访问此资源')
          break
        case 404:
          // json-server 返回 404 时静默处理（数据不存在）
          break
        default:
          ElMessage.error(`请求失败: ${error.response.data?.message || error.message}`)
      }
    } else if (error.request) {
      ElMessage.error('网络异常，请检查后端服务是否已启动（运行 npm run server）')
    } else {
      ElMessage.error(`请求错误: ${error.message}`)
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
