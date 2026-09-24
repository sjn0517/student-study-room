// src/utils/format.ts
import dayjs from 'dayjs'

/**
 * 格式化日期
 * @param date 日期字符串或 Date 对象
 * @param format 格式，默认为 'YYYY-MM-DD'
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD'): string {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * 格式化日期时间
 * @param date 日期字符串或 Date 对象
 * @param format 格式，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(date: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * 格式化时间
 * @param time 时间字符串
 * @param format 格式，默认为 'HH:mm'
 * @returns 格式化后的时间字符串
 */
export function formatTime(time: string, format: string = 'HH:mm'): string {
  if (!time) return ''
  return dayjs(`2000-01-01 ${time}`).format(format)
}

/**
 * 格式化数字，添加千分位
 * @param num 数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number): string {
  if (num === undefined || num === null) return ''
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化时长（秒转时分秒）
 * @param seconds 秒数
 * @returns 格式化后的时长字符串
 */
export function formatDuration(seconds: number): string {
  if (!seconds) return '0秒'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  const parts = []
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0) parts.push(`${minutes}分钟`)
  if (secs > 0) parts.push(`${secs}秒`)
  
  return parts.join('') || '0秒'
}

/**
 * 获取相对时间（如：3分钟前）
 * @param date 日期字符串或 Date 对象
 * @returns 相对时间字符串
 */
export function getRelativeTime(date: string | Date): string {
  if (!date) return ''
  
  const now = dayjs()
  const target = dayjs(date)
  const diff = now.diff(target, 'second')
  
  if (diff < 60) return `${diff}秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`
  if (diff < 31104000) return `${Math.floor(diff / 2592000)}个月前`
  return `${Math.floor(diff / 31104000)}年前`
}