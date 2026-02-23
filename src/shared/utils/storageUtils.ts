/**
 * 存储工具函数
 * 统一使用 localStorage 进行数据持久化
 */

/**
 * LocalStorage 键名常量
 */
export const STORAGE_KEYS = {
  SCADA_EDITOR_DATA: 'scada_editor_data', // 画布编辑数据
} as const

/**
 * 保存数据到 localStorage
 * @param key 键名
 * @param data 数据对象
 * @returns 是否保存成功
 */
export const saveToLocal = <T = any>(key: string, data: T): boolean => {
  try {
    const jsonStr = JSON.stringify(data)
    localStorage.setItem(key, jsonStr)
    return true
  } catch (error) {
    console.error(`保存到 localStorage 失败 [${key}]:`, error)
    return false
  }
}

/**
 * 从 localStorage 读取数据
 * @param key 键名
 * @returns 数据对象，失败返回 null
 */
export const loadFromLocal = <T = any>(key: string): T | null => {
  try {
    const jsonStr = localStorage.getItem(key)
    if (!jsonStr) return null
    return JSON.parse(jsonStr) as T
  } catch (error) {
    console.error(`从 localStorage 读取失败 [${key}]:`, error)
    return null
  }
}

/**
 * 从 localStorage 删除数据
 * @param key 键名
 */
export const removeFromLocal = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`从 localStorage 删除失败 [${key}]:`, error)
  }
}

/**
 * 清空 localStorage
 */
export const clearLocal = (): void => {
  try {
    localStorage.clear()
  } catch (error) {
    console.error('清空 localStorage 失败:', error)
  }
}
