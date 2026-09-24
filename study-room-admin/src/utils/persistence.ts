// src/utils/persistence.ts
import { ref, watch } from 'vue'
import { getLocalStorage, setLocalStorage, removeLocalStorage } from './storage'

/**
 * 创建响应式状态，自动持久化到 localStorage
 * @param key 存储键名
 * @param defaultValue 默认值
 * @returns 响应式 ref
 */
export function usePersistentState<T>(key: string, defaultValue: T) {
  const storedValue = getLocalStorage<T>(key, defaultValue)
  const state = ref<T>(storedValue)
  
  // 监听变化，自动保存
  watch(
    state,
    (newValue) => {
      setLocalStorage(key, newValue)
    },
    { deep: true }
  )
  
  return state
}

/**
 * 重置持久化状态
 * @param key 存储键名
 */
export function resetPersistentState(key: string) {
  removeLocalStorage(key)
}