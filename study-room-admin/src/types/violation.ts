// src/types/violation.ts
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

export interface CreateViolationDto {
  seatNumber: string
  userName: string
  userId: string
  type: '超时占用' | '噪音干扰' | '物品占座' | '设备损坏' | '其他'
  description: string
}

export interface UpdateViolationDto {
  status?: 'pending' | 'processed'
  processedBy?: string
  processedNote?: string
}