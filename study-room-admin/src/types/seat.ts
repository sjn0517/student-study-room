// src/types/seat.ts
export interface Seat {
  id: number
  number: string
  area: string
  status: 'idle' | 'occupied' | 'maintenance'
  features: string[]
  currentUser?: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CreateSeatDto {
  number: string
  area: string
  status?: 'idle' | 'occupied' | 'maintenance'
  features?: string[]
  description?: string
}

export interface UpdateSeatDto {
  number?: string
  area?: string
  status?: 'idle' | 'occupied' | 'maintenance'
  features?: string[]
  description?: string
  currentUser?: string
}