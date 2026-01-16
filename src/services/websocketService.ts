/**
 * WebSocket 服务模块
 * 负责 WebSocket 连接管理和原始数据接收
 */

/**
 * WebSocket 配置接口
 */
export interface WebSocketConfig {
  /** WebSocket 服务地址 */
  url: string
  /** 数据路径（用于解析嵌套数据） */
  dataPath?: string
  /** 启用状态 */
  enabled?: boolean
  /** 自动重连 */
  autoReconnect?: boolean
  /** 重连延迟(ms) */
  reconnectDelay?: number
}

/**
 * WebSocket 服务类
 */
export class WebSocketService {
  private ws: WebSocket | null = null
  private config: WebSocketConfig | null = null
  private onDataCallback: ((data: any) => void) | null = null
  private onErrorCallback: ((error: Error) => void) | null = null
  private onStatusChangeCallback: ((connected: boolean) => void) | null = null
  private isConnected = false
  private reconnectTimer: number | null = null

  /**
   * 连接 WebSocket 服务器
   */
  connect(config: WebSocketConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!config.enabled) {
        reject(new Error('WebSocket 连接未启用'))
        return
      }

      if (!config.url) {
        reject(new Error('WebSocket URL 未配置'))
        return
      }

      this.config = config

      try {
        this.ws = new WebSocket(config.url)

        // 连接成功
        this.ws.onopen = () => {
          console.log(`[WebSocket] 连接成功: ${config.url}`)
          this.isConnected = true
          this.onStatusChangeCallback?.(true)
          
          // 清除重连定时器
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
          }
          
          resolve()
        }

        // 接收消息
        this.ws.onmessage = (event) => {
          try {
            const rawData = JSON.parse(event.data)
            
            // 处理数据路径
            let actualData = rawData
            if (config.dataPath) {
              const paths = config.dataPath.split('.')
              for (const path of paths) {
                actualData = actualData?.[path]
                if (!actualData) break
              }
            }

            // 直接传递原始数据，不做解析
            if (this.onDataCallback && actualData) {
              this.onDataCallback(actualData)
            }
          } catch (error) {
            console.error('[WebSocket] 消息解析失败:', error)
            if (this.onErrorCallback) {
              this.onErrorCallback(error as Error)
            }
          }
        }

        // 连接错误
        this.ws.onerror = (error) => {
          console.error('[WebSocket] 连接错误:', error)
          this.isConnected = false
          this.onStatusChangeCallback?.(false)
          
          if (this.onErrorCallback) {
            this.onErrorCallback(new Error('WebSocket 连接错误'))
          }
          
          reject(new Error('WebSocket 连接错误'))
        }

        // 连接关闭
        this.ws.onclose = (event) => {
          console.log(`[WebSocket] 连接关闭: ${event.code} ${event.reason}`)
          this.isConnected = false
          this.onStatusChangeCallback?.(false)

          // 自动重连
          if (config.autoReconnect !== false && config.enabled) {
            const delay = config.reconnectDelay || 5000
            console.log(`[WebSocket] ${delay}ms 后尝试重连...`)
            
            this.reconnectTimer = window.setTimeout(() => {
              if (config.enabled) {
                this.connect(config).catch(console.error)
              }
            }, delay)
          }
        }

      } catch (error) {
        console.error('[WebSocket] 创建连接失败:', error)
        reject(error)
      }
    })
  }

  /**
   * 发送消息
   */
  send(data: any): void {
    if (!this.ws || !this.isConnected) {
      console.warn('[WebSocket] 未连接，无法发送消息')
      return
    }

    const message = typeof data === 'string' ? data : JSON.stringify(data)
    this.ws.send(message)
  }

  /**
   * 设置数据接收回调
   */
  onData(callback: (data: any) => void): void {
    this.onDataCallback = callback
  }

  /**
   * 设置错误回调
   */
  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback
  }

  /**
   * 设置状态变化回调
   */
  onStatusChange(callback: (connected: boolean) => void): void {
    this.onStatusChangeCallback = callback
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      console.log('[WebSocket] 断开连接')
      this.ws.close()
      this.ws = null
      this.isConnected = false
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * 获取当前配置
   */
  getConfig(): WebSocketConfig | null {
    return this.config
  }
}

/**
 * 创建 WebSocket 服务实例
 */
export function createWebSocketService(): WebSocketService {
  return new WebSocketService()
}
