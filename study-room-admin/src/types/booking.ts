// src/types/booking.ts
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

export interface CreateBookingDto {
  seatNumber: string
  area: string
  userName: string
  userId: string
  phone: string
  date: string
  startTime: string
  endTime: string
  note?: string
}

export interface UpdateBookingDto {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  note?: string
  cancelledReason?: string
  cancelledBy?: string
}