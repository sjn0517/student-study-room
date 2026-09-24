// src/types/user.ts
export interface User {
  id: number
  username: string
  email?: string
  phone?: string
  role: 'user' | 'admin'
  avatar?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserInfo extends User {
  permissions: string[]
}

export interface LoginDto {
  username: string
  password: string
  rememberMe?: boolean
}

export interface RegisterDto {
  username: string
  password: string
  email?: string
  phone?: string
}

export interface UpdateUserDto {
  username?: string
  email?: string
  phone?: string
  avatar?: string
}