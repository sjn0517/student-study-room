// src/api/violation.ts
import axiosInstance from './axiosInstance'
import type { Violation } from '@/stores/useBookingStore'

/**
 * 获取违规列表
 * json-server 直接返回数组，包装成 { list, total }
 */
export const getViolations = async (params?: {
  page?: number
  pageSize?: number
  status?: string
}): Promise<{ list: Violation[]; total: number }> => {
  const queryParams: Record<string, any> = {}
  if (params?.status) queryParams.status = params.status

  const data = await axiosInstance.get<Violation[]>('/violations', { params: queryParams })
  const list = Array.isArray(data) ? data : []
  return { list, total: list.length }
}

// 创建违规记录
export const createViolation = (data: Partial<Violation>) => {
  return axiosInstance.post<Violation>('/violations', {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'pending'
  })
}

// 更新违规记录
export const updateViolation = (id: number, data: Partial<Violation>) => {
  return axiosInstance.patch<Violation>(`/violations/${id}`, {
    ...data,
    updatedAt: new Date().toISOString()
  })
}

// 删除违规记录
export const deleteViolation = (id: number) => {
  return axiosInstance.delete(`/violations/${id}`)
}
