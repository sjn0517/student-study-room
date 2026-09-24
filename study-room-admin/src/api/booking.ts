// src/api/booking.ts
import axiosInstance from './axiosInstance'
import type { Booking } from '@/stores/useBookingStore'

/**
 * 获取预约列表
 * json-server 直接返回数组，这里统一包装成 { list, total } 格式
 */
export const getBookings = async (params?: {
  page?: number
  pageSize?: number
  status?: string
  startDate?: string
  endDate?: string
  search?: string
}): Promise<{ list: Booking[]; total: number; page: number; pageSize: number }> => {
  // json-server 支持 _page/_limit 分页，以及按字段过滤
  const queryParams: Record<string, any> = {}
  if (params?.status) queryParams.status = params.status

  const data = await axiosInstance.get<Booking[]>('/bookings', { params: queryParams })
  const list = Array.isArray(data) ? data : []
  return {
    list,
    total: list.length,
    page: params?.page || 1,
    pageSize: params?.pageSize || 20
  }
}

// 获取单个预约
export const getBookingById = (id: number) => {
  return axiosInstance.get<Booking>(`/bookings/${id}`)
}

// 创建预约（持久化到 db.json）
export const createBooking = (data: Partial<Booking>) => {
  return axiosInstance.post<Booking>('/bookings', {
    ...data,
    createdTime: new Date().toISOString(),
    status: data.status || 'pending'
  })
}

// 更新预约
export const updateBooking = (id: number, data: Partial<Booking>) => {
  return axiosInstance.patch<Booking>(`/bookings/${id}`, {
    ...data,
    updatedTime: new Date().toISOString()
  })
}

// 删除预约
export const deleteBooking = (id: number) => {
  return axiosInstance.delete(`/bookings/${id}`)
}

// 批量更新状态（json-server 不支持批量接口，逐条更新）
export const batchUpdateBookingStatus = async (ids: number[], status: string) => {
  const promises = ids.map(id =>
    axiosInstance.patch<Booking>(`/bookings/${id}`, {
      status,
      updatedTime: new Date().toISOString()
    })
  )
  return Promise.all(promises)
}
