/**
 * 通用工具函数
 * 包含ID生成、消息提示等常用功能
 */

/**
 * 生成唯一ID
 * @param prefix 前缀，默认为空
 * @returns 唯一ID字符串
 */
export const generateUniqueId = (prefix: string = ''): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 11)
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`
}

/**
 * 生成事件ID
 * @returns 事件ID
 */
export const generateEventId = (): string => {
  return generateUniqueId('evt')
}

/**
 * 生成节点ID
 * @returns 节点ID
 */
export const generateNodeId = (): string => {
  return generateUniqueId('node')
}

/**
 * 防抖函数
 * @param func 要执行的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * 节流函数
 * @param func 要执行的函数
 * @param limit 时间限制（毫秒）
 * @returns 节流后的函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * 深拷贝对象
 * @param obj 要拷贝的对象
 * @returns 拷贝后的对象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch (error) {
    console.error('深拷贝失败:', error)
    return obj
  }
}

/**
 * 格式化时间戳
 * @param timestamp 时间戳（毫秒）
 * @param format 格式字符串，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的时间字符串
 */
export const formatTimestamp = (
  timestamp: number,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string => {
  const date = new Date(timestamp)
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 获取当前时间戳
 * @returns 当前时间戳（毫秒）
 */
export const getCurrentTimestamp = (): number => {
  return Date.now()
}

/**
 * 生成随机数
 * @param min 最小值
 * @param max 最大值
 * @returns 随机数
 */
export const randomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 生成随机位置
 * @param offsetX X偏移量，默认50
 * @param offsetY Y偏移量，默认50
 * @param rangeX X范围，默认400
 * @param rangeY Y范围，默认300
 * @returns 位置对象 {x, y}
 */
export const randomPosition = (
  offsetX: number = 50,
  offsetY: number = 50,
  rangeX: number = 400,
  rangeY: number = 300
): { x: number; y: number } => {
  return {
    x: Math.random() * rangeX + offsetX,
    y: Math.random() * rangeY + offsetY
  }
}

/**
 * 判断对象是否为空
 * @param obj 对象
 * @returns 是否为空
 */
export const isEmpty = (obj: any): boolean => {
  if (obj === null || obj === undefined) return true
  if (Array.isArray(obj)) return obj.length === 0
  if (typeof obj === 'object') return Object.keys(obj).length === 0
  if (typeof obj === 'string') return obj.trim().length === 0
  return false
}

/**
 * 延迟执行
 * @param ms 延迟时间（毫秒）
 * @returns Promise
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
