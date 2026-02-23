/**
 * 文件操作工具函数
 * 用于文件的导入导出、下载等操作
 */

/**
 * 导出数据为 JSON 文件
 * @param data 要导出的数据对象
 * @param filename 文件名（不含扩展名）
 * @returns 是否导出成功
 */
export const exportToJSON = (data: any, filename: string): boolean => {
  try {
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = `${filename}.json`
    link.click()
    
    // 清理
    URL.revokeObjectURL(url)
    
    return true
  } catch (error) {
    console.error('导出 JSON 文件失败:', error)
    return false
  }
}

/**
 * 从 JSON 文件导入数据
 * @param file 文件对象
 * @returns Promise，成功返回数据对象，失败返回 null
 */
export const importFromJSON = <T = any>(file: File): Promise<T | null> => {
  return new Promise((resolve) => {
    // 验证文件类型
    if (!file.name.endsWith('.json')) {
      console.error('不是有效的 JSON 文件')
      resolve(null)
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content) as T
        resolve(data)
      } catch (error) {
        console.error('解析 JSON 文件失败:', error)
        resolve(null)
      }
    }
    
    reader.onerror = () => {
      console.error('读取文件失败')
      resolve(null)
    }
    
    reader.readAsText(file)
  })
}

/**
 * 下载文本文件
 * @param content 文本内容
 * @param filename 文件名
 * @param mimeType MIME 类型，默认为 text/plain
 */
export const downloadTextFile = (
  content: string,
  filename: string,
  mimeType: string = 'text/plain;charset=utf-8'
): void => {
  try {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = filename
    link.click()
    
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('下载文件失败:', error)
  }
}

/**
 * 触发文件选择对话框
 * @param accept 接受的文件类型，如 '.json'
 * @param multiple 是否允许多选
 * @returns Promise，返回选中的文件列表
 */
export const selectFiles = (
  accept: string = '*',
  multiple: boolean = false
): Promise<FileList | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = multiple
    
    input.onchange = () => {
      resolve(input.files)
    }
    
    input.oncancel = () => {
      resolve(null)
    }
    
    input.click()
  })
}

/**
 * 读取文件内容为文本
 * @param file 文件对象
 * @returns Promise，返回文件文本内容
 */
export const readFileAsText = (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }
    
    reader.onerror = () => {
      console.error('读取文件失败')
      resolve(null)
    }
    
    reader.readAsText(file)
  })
}

/**
 * 读取文件内容为 Data URL
 * @param file 文件对象
 * @returns Promise，返回 Data URL
 */
export const readFileAsDataURL = (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }
    
    reader.onerror = () => {
      console.error('读取文件失败')
      resolve(null)
    }
    
    reader.readAsDataURL(file)
  })
}
