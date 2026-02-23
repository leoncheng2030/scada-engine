/**
 * 消息提示工具函数
 * 统一管理消息提示、确认对话框等
 */

export type MessageType = 'success' | 'error' | 'warning' | 'info'

/**
 * 显示提示消息
 * @param message 消息内容
 * @param type 消息类型
 * @param duration 显示时长（毫秒），默认3000
 */
export const showMessage = (
  message: string,
  type: MessageType = 'info',
  duration: number = 3000
): void => {
  const toast = document.createElement('div')
  toast.className = `scada-toast scada-toast-${type}`
  toast.textContent = message
  
  // 添加样式
  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '10000',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    maxWidth: '80%',
    wordBreak: 'break-word',
    opacity: '0',
    transition: 'opacity 0.3s ease, transform 0.3s ease'
  })
  
  // 根据类型设置颜色
  const colors = {
    success: { bg: '#10b981', text: '#fff' },
    error: { bg: '#ef4444', text: '#fff' },
    warning: { bg: '#f59e0b', text: '#fff' },
    info: { bg: '#3b82f6', text: '#fff' }
  }
  
  const color = colors[type]
  toast.style.backgroundColor = color.bg
  toast.style.color = color.text
  
  document.body.appendChild(toast)
  
  // 使用 requestAnimationFrame 触发动画
  requestAnimationFrame(() => {
    toast.style.opacity = '1'
  })
  
  // 自动移除
  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast)
      }
    }, 300)
  }, duration)
}

/**
 * 显示成功消息
 * @param message 消息内容
 * @param duration 显示时长（毫秒）
 */
export const showSuccess = (message: string, duration?: number): void => {
  showMessage(message, 'success', duration)
}

/**
 * 显示错误消息
 * @param message 消息内容
 * @param duration 显示时长（毫秒）
 */
export const showError = (message: string, duration?: number): void => {
  showMessage(message, 'error', duration)
}

/**
 * 显示警告消息
 * @param message 消息内容
 * @param duration 显示时长（毫秒）
 */
export const showWarning = (message: string, duration?: number): void => {
  showMessage(message, 'warning', duration)
}

/**
 * 显示信息消息
 * @param message 消息内容
 * @param duration 显示时长（毫秒）
 */
export const showInfo = (message: string, duration?: number): void => {
  showMessage(message, 'info', duration)
}

/**
 * 显示确认对话框
 * @param message 提示消息
 * @param title 对话框标题
 * @returns Promise<boolean> 用户确认返回true，取消返回false
 */
export const showConfirm = (
  message: string,
  title: string = '确认'
): Promise<boolean> => {
  return new Promise((resolve) => {
    const result = window.confirm(`${title}\n\n${message}`)
    resolve(result)
  })
}

/**
 * 显示输入对话框
 * @param message 提示消息
 * @param defaultValue 默认值
 * @returns Promise<string | null> 用户输入的值，取消返回null
 */
export const showPrompt = (
  message: string,
  defaultValue: string = ''
): Promise<string | null> => {
  return new Promise((resolve) => {
    const result = window.prompt(message, defaultValue)
    resolve(result)
  })
}

/**
 * 显示加载提示
 * @param message 加载消息
 * @returns 返回关闭函数
 */
export const showLoading = (message: string = '加载中...'): (() => void) => {
  const overlay = document.createElement('div')
  overlay.className = 'scada-loading-overlay'
  
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '10001'
  })
  
  const content = document.createElement('div')
  Object.assign(content.style, {
    padding: '20px 40px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#333'
  })
  content.textContent = message
  
  overlay.appendChild(content)
  document.body.appendChild(overlay)
  
  // 返回关闭函数
  return () => {
    if (overlay.parentNode) {
      document.body.removeChild(overlay)
    }
  }
}
