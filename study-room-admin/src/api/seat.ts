// src/api/seat.ts
import axiosInstance from './axiosInstance'
import type { Seat } from '@/stores/useBookingStore'

// 获取座位列表
export const getSeats = async (params?: { area?: string; status?: string }): Promise<Seat[]> => {
  const queryParams: Record<string, any> = {}
  if (params?.area) queryParams.area = params.area
  if (params?.status) queryParams.status = params.status

  const data = await axiosInstance.get<Seat[]>('/seats', { params: queryParams })
  return Array.isArray(data) ? data : []
}

// 创建座位
export const createSeat = (data: Partial<Seat>) => {
  return axiosInstance.post<Seat>('/seats', {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
}

// 更新座位
export const updateSeat = (id: number, data: Partial<Seat>) => {
  return axiosInstance.patch<Seat>(`/seats/${id}`, {
    ...data,
    updatedAt: new Date().toISOString()
  })
}

// 删除座位
export const deleteSeat = (id: number) => {
  return axiosInstance.delete(`/seats/${id}`)
}

/**
 * 获取座位统计
 * json-server 不支持 /seats/stats，改为前端计算
 */
export const getSeatStats = async (): Promise<{
  total: number
  available: number
  occupied: number
  maintenance: number
}> => {
  const seats = await getSeats()
  return {
    total: seats.length,
    available: seats.filter(s => s.status === 'idle').length,
    occupied: seats.filter(s => s.status === 'occupied').length,
    maintenance: seats.filter(s => s.status === 'maintenance').length
  }
}
