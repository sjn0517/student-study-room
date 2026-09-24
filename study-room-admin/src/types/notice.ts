// src/types/notice.ts
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

export interface CreateNoticeDto {
  type: 'system' | 'maintenance' | 'activity' | 'urgent'
  priority: 'high' | 'medium' | 'low'
  title: string
  content: string
  expireTime?: string
}

export interface UpdateNoticeDto {
  type?: 'system' | 'maintenance' | 'activity' | 'urgent'
  priority?: 'high' | 'medium' | 'low'
  title?: string
  content?: string
  status?: 'active' | 'expired'
  expireTime?: string
}