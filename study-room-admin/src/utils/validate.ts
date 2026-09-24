// src/utils/validate.ts
/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns 是否为有效邮箱
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证手机号格式
 * @param phone 手机号
 * @returns 是否为有效手机号
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 验证身份证号格式
 * @param idCard 身份证号
 * @returns 是否为有效身份证号
 */
export function validateIdCard(idCard: string): boolean {
  const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return idCardRegex.test(idCard)
}

/**
 * 验证密码强度
 * @param password 密码
 * @returns 密码强度（1-4级）
 */
export function validatePasswordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0
  
  let score = 0
  
  // 长度检查
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  
  // 包含小写字母
  if (/[a-z]/.test(password)) score++
  
  // 包含大写字母
  if (/[A-Z]/.test(password)) score++
  
  // 包含数字
  if (/\d/.test(password)) score++
  
  // 包含特殊字符
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++
  
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4
}

/**
 * 验证 URL 格式
 * @param url URL
 * @returns 是否为有效 URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证是否为空
 * @param value 值
 * @returns 是否为空
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  if (typeof value === 'object' && Object.keys(value).length === 0) return true
  return false
}

/**
 * 验证是否为数字
 * @param value 值
 * @returns 是否为数字
 */
export function isNumber(value: any): boolean {
  if (value === null || value === undefined) return false
  return !isNaN(Number(value))
}

/**
 * 验证是否为整数
 * @param value 值
 * @returns 是否为整数
 */
export function isInteger(value: any): boolean {
  if (!isNumber(value)) return false
  return Number.isInteger(Number(value))
}

/**
 * 验证是否为正数
 * @param value 值
 * @returns 是否为正数
 */
export function isPositive(value: any): boolean {
  if (!isNumber(value)) return false
  return Number(value) > 0
}
