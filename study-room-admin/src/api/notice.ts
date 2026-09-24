// src/api/notice.ts
import axiosInstance from './axiosInstance'
import type { Notice } from '@/stores/useBookingStore'

/**
 * 获取通知列表
 * json-server 直接返回数组，包装成 { list, total }
 */
export const getNotices = async (params?: {
  page?: number
  pageSize?: number
  type?: string
}): Promise<{ list: Notice[]; total: number }> => {
  const queryParams: Record<string, any> = {}
  if (params?.type) queryParams.type = params.type

  const data = await axiosInstance.get<Notice[]>('/notices', { params: queryParams })
  const list = Array.isArray(data) ? data : []
  return { list, total: list.length }
}

// 创建通知
export const createNotice = (data: Partial<Notice>) => {
  return axiosInstance.post<Notice>('/notices', {
    ...data,
    status: 'active',
    isRead: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
}

// 更新通知
export const updateNotice = (id: number, data: Partial<Notice>) => {
  return axiosInstance.patch<Notice>(`/notices/${id}`, {
    ...data,
    updatedAt: new Date().toISOString()
  })
}

// 删除通知
export const deleteNotice = (id: number) => {
  return axiosInstance.delete(`/notices/${id}`)
}
