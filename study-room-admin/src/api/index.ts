// src/api/index.ts
// 统一导出所有 API
export * from './booking'
export * from './auth'
export * from './seat'
export * from './violation'
export * from './notice'

// 导出 axios 实例
export { default as axiosInstance } from './axiosInstance'