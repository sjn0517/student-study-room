// src/utils/dict.ts
/**
 * 业务字典与展示文案统一出口
 *
 * 拆分组件后，多个面板/对话框都需要"状态 → 文案 / 标签颜色"的映射，
 * 这里集中维护一份，避免每个组件各写一遍。
 */

/* ====================== 日期格式化（本地化展示） ====================== */

/** 日期：2025-05-20 */
export const formatDateCN = (dateStr?: string): string => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

/** 日期时间：2025/5/20 10:30:00 */
export const formatDateTimeCN = (dateStr?: string): string => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

/* ====================== 预约状态 ====================== */

const BOOKING_STATUS_TYPE: Record<string, string> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'danger',
  completed: 'info'
}

const BOOKING_STATUS_TEXT: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  cancelled: '已取消',
  completed: '已完成'
}

export const getBookingStatusType = (status: string): string =>
  BOOKING_STATUS_TYPE[status] || 'info'

export const getBookingStatusText = (status: string): string =>
  BOOKING_STATUS_TEXT[status] || status

/** 预约状态下拉选项 */
export const BOOKING_STATUS_OPTIONS = [
  { label: '待处理', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '已取消', value: 'cancelled' },
  { label: '已完成', value: 'completed' }
]

/* ====================== 座位状态 ====================== */

const SEAT_STATUS_TYPE: Record<string, string> = {
  idle: 'success',
  available: 'success',
  occupied: 'danger',
  maintenance: 'warning'
}

const SEAT_STATUS_TEXT: Record<string, string> = {
  idle: '可用',
  available: '可用',
  occupied: '占用中',
  maintenance: '维修中'
}

export const getSeatStatusType = (status: string): string =>
  SEAT_STATUS_TYPE[status] || 'info'

export const getSeatStatusText = (status: string): string =>
  SEAT_STATUS_TEXT[status] || status

/** 座位区域选项 */
export const SEAT_AREA_OPTIONS = ['靠窗区', '中间区', '后排区', 'VIP区']

/** 座位设施选项 */
export const SEAT_FEATURE_OPTIONS = ['插座', '台灯', '储物柜', '白板', '投影仪', '隐私帘']

/** 座位状态下拉选项 */
export const SEAT_STATUS_OPTIONS = [
  { label: '可用', value: 'idle' },
  { label: '占用', value: 'occupied' },
  { label: '维修', value: 'maintenance' }
]

/* ====================== 违规类型与状态 ====================== */

const VIOLATION_TYPE_TAG: Record<string, string> = {
  超时占用: 'danger',
  噪音干扰: 'warning',
  物品占座: 'info',
  设备损坏: 'warning',
  其他: 'info'
}

export const getViolationTypeTag = (type: string): string =>
  VIOLATION_TYPE_TAG[type] || 'info'

export const getViolationStatusType = (status: string): string =>
  status === 'processed' ? 'success' : 'warning'

export const getViolationStatusText = (status: string): string =>
  status === 'processed' ? '已处理' : '待处理'

/** 违规类型选项 */
export const VIOLATION_TYPE_OPTIONS = ['超时占用', '噪音干扰', '物品占座', '设备损坏', '其他']

/* ====================== 通知类型 / 优先级 / 状态 ====================== */

const NOTICE_TYPE_TAG: Record<string, string> = {
  system: 'info',
  maintenance: 'warning',
  activity: 'success',
  urgent: 'danger'
}

const NOTICE_TYPE_TEXT: Record<string, string> = {
  system: '系统',
  maintenance: '维护',
  activity: '活动',
  urgent: '紧急'
}

export const getNoticeTypeTag = (type: string): string =>
  NOTICE_TYPE_TAG[type] || 'info'

export const getNoticeTypeText = (type: string): string =>
  NOTICE_TYPE_TEXT[type] || '系统'

export const getNoticeStatusType = (status: string): string =>
  status === 'active' ? 'success' : 'info'

export const getNoticeStatusText = (status: string): string =>
  status === 'active' ? '生效中' : '已过期'

/** 通知类型选项 */
export const NOTICE_TYPE_OPTIONS = [
  { label: '系统通知', value: 'system' },
  { label: '维护通知', value: 'maintenance' },
  { label: '活动通知', value: 'activity' },
  { label: '紧急通知', value: 'urgent' }
]

/** 通知优先级选项 */
export const NOTICE_PRIORITY_OPTIONS = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
]
