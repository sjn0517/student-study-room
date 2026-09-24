// src/api/auth.ts
import axiosInstance from './axiosInstance'
import type { LoginDto, RegisterDto, User, UserInfo } from '@/types/user'

// 登录
export const login = (data: LoginDto) => {
  return axiosInstance.post<{
    token: string
    user: User
  }>('/auth/login', data)
}

// 注册
export const register = (data: RegisterDto) => {
  return axiosInstance.post('/auth/register', data)
}

// 获取当前用户信息
export const getCurrentUser = () => {
  return axiosInstance.get<UserInfo>('/auth/me')
}

// 刷新 token
export const refreshToken = () => {
  return axiosInstance.post<{ token: string }>('/auth/refresh')
}

// 退出登录
export const logout = () => {
  return axiosInstance.post('/auth/logout')
}

// 修改密码
export const changePassword = (data: { oldPassword: string; newPassword: string }) => {
  return axiosInstance.post('/auth/change-password', data)
}