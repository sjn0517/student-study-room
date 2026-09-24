// src/utils/message.ts
import { ElMessage, ElMessageBox } from 'element-plus'

export const showError = (message: string, duration: number = 3000) => {
  ElMessage({
    message,
    type: 'error',
    duration,
  })
}

export const showSuccess = (message: string, duration: number = 3000) => {
  ElMessage({
    message,
    type: 'success',
    duration,
  })
}

export const showConfirm = async (
  message: string,
  title: string = '提示',
  options: any = {}
): Promise<boolean> => {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      ...options,
    })
    return true
  } catch {
    return false
  }
}