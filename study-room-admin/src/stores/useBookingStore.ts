// src/stores/useBookingStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  batchUpdateBookingStatus
} from '@/api/booking'
import {
  getSeats,
  createSeat,
  updateSeat,
  deleteSeat,
  getSeatStats
} from '@/api/seat'
import {
  getViolations,
  createViolation,
  updateViolation,
  deleteViolation
} from '@/api/violation'
import {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice
} from '@/api/notice'
import { showError } from '@/utils/message'

// 定义类型
export interface Seat {
  id: number
  number: string
  area: string
  status: 'idle' | 'occupied' | 'maintenance'
  features?: string[]
  currentUser?: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface Booking {
  id: number
  seatNumber: string
  area: string
  userName: string
  userId: string
  phone: string
  date: string
  startTime: string
  endTime: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  createdTime: string
  note?: string
  updatedTime?: string
  cancelledReason?: string
  cancelledBy?: string
  cancelledTime?: string
}

export interface Violation {
  id: number
  seatNumber: string
  userName: string
  userId: string
  type: '超时占用' | '噪音干扰' | '物品占座' | '设备损坏' | '其他'
  description: string
  status: 'pending' | 'processed'
  processedBy?: string
  processedAt?: string
  processedNote?: string
  createdAt: string
  updatedAt: string
}

export interface Notice {
  id: number
  type: 'system' | 'maintenance' | 'activity' | 'urgent'
  priority: 'high' | 'medium' | 'low'
  title: string
  content: string
  status: 'active' | 'expired'
  expireTime?: string
  isRead?: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export const useBookingStore = defineStore('booking', () => {
  // --- 1. 数据状态 ---
  const seats = ref<Seat[]>([])
  const bookings = ref<Booking[]>([])
  const violations = ref<Violation[]>([])
  const notices = ref<Notice[]>([])
  
  // 加载状态
  const loading = ref({
    seats: false,
    bookings: false,
    violations: false,
    notices: false
  })

  // 统计信息
  const seatStats = ref({
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0
  })

  // --- 2. 计算属性 ---
  const totalSeats = computed(() => seats.value.length)
  const occupiedSeatsCount = computed(() => seats.value.filter(s => s.status === 'occupied').length)
  const availableSeatsCount = computed(() => seats.value.filter(s => s.status === 'idle').length)
  const maintenanceSeatsCount = computed(() => seats.value.filter(s => s.status === 'maintenance').length)
  
  const getActiveBookings = computed(() => bookings.value.filter(b => b.status === 'confirmed'))
  const getPendingBookings = computed(() => bookings.value.filter(b => b.status === 'pending'))
  const pendingViolationsCount = computed(() => violations.value.filter(v => v.status === 'pending').length)
  const processedViolationsCount = computed(() => violations.value.filter(v => v.status === 'processed').length)
  const activeNotices = computed(() => notices.value.filter(n => n.status === 'active'))

  // 最新预约
  const getAllBookings = computed(() => {
    return [...bookings.value].sort((a, b) => 
      new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
    )
  })

  // --- 3. 座位管理方法 ---
  const fetchSeats = async (params?: { area?: string; status?: string }) => {
    loading.value.seats = true
    try {
      const res = await getSeats(params)
      seats.value = res
    } catch (error) {
      showError('获取座位列表失败')
      throw error
    } finally {
      loading.value.seats = false
    }
  }

  const addSeat = async (data: Partial<Seat>) => {
    try {
      const res = await createSeat(data)
      seats.value.push(res)
      await fetchSeatStats()
      return res
    } catch (error) {
      showError('添加座位失败')
      throw error
    }
  }

  const updateSeatData = async (id: number, data: Partial<Seat>) => {
    try {
      const res = await updateSeat(id, data)
      const index = seats.value.findIndex(s => s.id === id)
      if (index !== -1) {
        seats.value[index] = { ...seats.value[index], ...res }
      }
      await fetchSeatStats()
      return res
    } catch (error) {
      showError('更新座位失败')
      throw error
    }
  }

  const removeSeat = async (id: number) => {
    try {
      await deleteSeat(id)
      seats.value = seats.value.filter(s => s.id !== id)
      await fetchSeatStats()
    } catch (error) {
      showError('删除座位失败')
      throw error
    }
  }

  const fetchSeatStats = async () => {
    try {
      const stats = await getSeatStats()
      seatStats.value = stats
    } catch (error) {
      console.error('获取座位统计失败:', error)
    }
  }

  // --- 4. 预约管理方法 ---
  const fetchBookings = async (params?: {
    page?: number
    pageSize?: number
    status?: string
    startDate?: string
    endDate?: string
    search?: string
  }) => {
    loading.value.bookings = true
    try {
      const res = await getBookings(params)
      bookings.value = res.list
      return res
    } catch (error) {
      showError('获取预约列表失败')
      throw error
    } finally {
      loading.value.bookings = false
    }
  }

  const addBooking = async (data: Partial<Booking>) => {
    try {
      const res = await createBooking(data)
      bookings.value.push(res)
      return res
    } catch (error) {
      showError('创建预约失败')
      throw error
    }
  }

  const updateBookingData = async (id: number, data: Partial<Booking>) => {
    try {
      const res = await updateBooking(id, data)
      const index = bookings.value.findIndex(b => b.id === id)
      if (index !== -1) {
        bookings.value[index] = { ...bookings.value[index], ...res }
      }
      return res
    } catch (error) {
      showError('更新预约失败')
      throw error
    }
  }

  const removeBooking = async (id: number) => {
    try {
      await deleteBooking(id)
      bookings.value = bookings.value.filter(b => b.id !== id)
    } catch (error) {
      showError('删除预约失败')
      throw error
    }
  }

  const batchUpdateStatus = async (ids: number[], status: string) => {
    try {
      await batchUpdateBookingStatus(ids, status)
      // 更新本地数据
      ids.forEach(id => {
        const index = bookings.value.findIndex(b => b.id === id)
        if (index !== -1) {
          bookings.value[index].status = status as Booking['status']
        }
      })
    } catch (error) {
      showError('批量更新状态失败')
      throw error
    }
  }

  // --- 5. 违规处理方法 ---
  const fetchViolations = async (params?: { page?: number; pageSize?: number; status?: string }) => {
    loading.value.violations = true
    try {
      const res = await getViolations(params)
      violations.value = res.list
      return res
    } catch (error) {
      showError('获取违规列表失败')
      throw error
    } finally {
      loading.value.violations = false
    }
  }

  const addViolation = async (data: Partial<Violation>) => {
    try {
      const res = await createViolation(data)
      violations.value.push(res)
      return res
    } catch (error) {
      showError('添加违规记录失败')
      throw error
    }
  }

  const processViolation = async (id: number, processedBy: string, note?: string) => {
    try {
      const res = await updateViolation(id, {
        status: 'processed',
        processedBy,
        processedNote: note,
        processedAt: new Date().toISOString()
      })
      const index = violations.value.findIndex(v => v.id === id)
      if (index !== -1) {
        violations.value[index] = res
      }
      return res
    } catch (error) {
      showError('处理违规失败')
      throw error
    }
  }

  const removeViolation = async (id: number) => {
    try {
      await deleteViolation(id)
      violations.value = violations.value.filter(v => v.id !== id)
    } catch (error) {
      showError('删除违规记录失败')
      throw error
    }
  }

  // --- 6. 通知管理方法 ---
  const fetchNotices = async (params?: { page?: number; pageSize?: number; type?: string }) => {
    loading.value.notices = true
    try {
      const res = await getNotices(params)
      notices.value = res.list
      return res
    } catch (error) {
      showError('获取通知列表失败')
      throw error
    } finally {
      loading.value.notices = false
    }
  }

  const addNotice = async (data: Partial<Notice>) => {
    try {
      const res = await createNotice(data)
      notices.value.push(res)
      return res
    } catch (error) {
      showError('发布通知失败')
      throw error
    }
  }

  const updateNoticeData = async (id: number, data: Partial<Notice>) => {
    try {
      const res = await updateNotice(id, data)
      const index = notices.value.findIndex(n => n.id === id)
      if (index !== -1) {
        notices.value[index] = res
      }
      return res
    } catch (error) {
      showError('更新通知失败')
      throw error
    }
  }

  const removeNotice = async (id: number) => {
    try {
      await deleteNotice(id)
      notices.value = notices.value.filter(n => n.id !== id)
    } catch (error) {
      showError('删除通知失败')
      throw error
    }
  }

  // --- 7. 初始化方法 ---
  const initializeData = async () => {
    try {
      await Promise.all([
        fetchSeats(),
        fetchBookings(),
        fetchViolations(),
        fetchNotices(),
        fetchSeatStats()
      ])
    } catch (error) {
      console.error('初始化数据失败:', error)
    }
  }

  return {
    // 状态
    seats,
    bookings,
    violations,
    notices,
    loading,
    seatStats,
    
    // 计算属性
    totalSeats,
    occupiedSeatsCount,
    availableSeatsCount,
    maintenanceSeatsCount,
    getActiveBookings,
    getPendingBookings,
    pendingViolationsCount,
    processedViolationsCount,
    activeNotices,
    getAllBookings,
    
    // 座位方法
    fetchSeats,
    addSeat,
    updateSeat: updateSeatData,
    removeSeat,
    fetchSeatStats,
    
    // 预约方法
    fetchBookings,
    addBooking,
    updateBooking: updateBookingData,
    removeBooking,
    batchUpdateStatus,
    
    // 违规方法
    fetchViolations,
    addViolation,
    processViolation,
    removeViolation,
    
    // 通知方法
    fetchNotices,
    addNotice,
    updateNotice: updateNoticeData,
    removeNotice,
    
    // 初始化
    initializeData
  }
})