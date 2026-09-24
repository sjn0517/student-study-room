// src/types/index.ts
// 统一导出所有类型
export * from './booking'
export * from './seat'
export * from './user'
export * from './violation'
export * from './notice'
export * from './response'

// 常用工具类型
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type ValueOf<T> = T[keyof T]
export type Dictionary<T> = Record<string, T>