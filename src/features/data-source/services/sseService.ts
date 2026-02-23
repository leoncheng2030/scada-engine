/**
 * SSE (Server-Sent Events) 服务模块
 * 负责 SSE 连接管理和原始数据接收
 */

/**
 * SSE 配置接口
 */
export interface SseConfig {
  /** SSE 服务地址 */
  url: string
  /** 事件类型（默认 'message'） */
  eventType?: string
  /** 数据路径（用于解析嵌套数据） */
  dataPath?: string
  /** 启用状态 */
  enabled?: boolean
  /** 自动重连 */
  autoReconnect?: boolean
  /** 重连延迟(ms) */
  reconnectDelay?: number
  /** 请求头（用于认证等） */
  withCredentials?: boolean
}

/**
 * SSE 服务类
 */
export class SseService {
  private eventSource: EventSource | null = null
  private config: SseConfig | null = null
  private onDataCallback: ((data: any) => void) | null = null
  private onErrorCallback: ((error: Error) => void) | null = null
  private onStatusChangeCallback: ((connected: boolean) => void) | null = null
  private isConnected = false
  private reconnectTimer: number | null = null

  /**
   * 连接 SSE 服务器
   */
  connect(config: SseConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!config.enabled) {
        reject(new Error('SSE 连接未启用'))
        return
      }

      if (!config.url) {
        reject(new Error('SSE URL 未配置'))
        return
      }

      this.config = config

      try {
        // 创建 EventSource
        const options: EventSourceInit = {}
        if (config.withCredentials) {
          options.withCredentials = true
        }

        this.eventSource = new EventSource(config.url, options)

        // 连接成功
        this.eventSource.onopen = () => {
          console.log(`[SSE] 连接成功: ${config.url}`)
          this.isConnected = true
          this.onStatusChangeCallback?.(true)
          
          // 清除重连定时器
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
          }
          
          resolve()
        }

        // 监听默认消息事件
        this.eventSource.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        // 监听自定义事件类型
        const eventType = config.eventType || 'message'
        if (eventType && eventType !== 'message') {
          this.eventSource.addEventListener(eventType, (event: any) => {
            this.handleMessage(event.data)
          })
        }

        // 连接错误
        this.eventSource.onerror = (error) => {
          console.error('[SSE] 连接错误:', error)
          this.isConnected = false
          this.onStatusChangeCallback?.(false)

          // 关闭连接
          this.eventSource?.close()

          if (this.onErrorCallback) {
            this.onErrorCallback(new Error('SSE 连接错误'))
          }

          // 自动重连
          if (config.autoReconnect !== false && config.enabled) {
            const delay = config.reconnectDelay || 5000
            console.log(`[SSE] ${delay}ms 后尝试重连...`)
            
            this.reconnectTimer = window.setTimeout(() => {
              if (config.enabled) {
                this.connect(config).catch(console.error)
              }
            }, delay)
          }
        }

      } catch (error) {
        console.error('[SSE] 创建连接失败:', error)
        reject(error)
      }
    })
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: string): void {
    try {
      const rawData = JSON.parse(data)

      // 处理数据路径
      let actualData = rawData
      if (this.config?.dataPath) {
        const paths = this.config.dataPath.split('.')
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
      console.error('[SSE] 消息解析失败:', error)
      if (this.onErrorCallback) {
        this.onErrorCallback(error as Error)
      }
    }
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

    if (this.eventSource) {
      console.log('[SSE] 断开连接')
      this.eventSource.close()
      this.eventSource = null
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
  getConfig(): SseConfig | null {
    return this.config
  }

  /**
   * 获取 EventSource readyState
   */
  getReadyState(): number {
    return this.eventSource?.readyState ?? EventSource.CLOSED
  }
}

/**
 * 创建 SSE 服务实例
 */
export function createSseService(): SseService {
  return new SseService()
}
