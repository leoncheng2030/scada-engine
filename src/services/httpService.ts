/**
 * HTTP 轮询服务模块
 * 负责 HTTP 轮询原始数据接收
 */

/**
 * HTTP 配置接口
 */
export interface HttpConfig {
  /** 接口地址 */
  url: string
  /** 请求方法 */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** 轮询间隔(ms) */
  pollInterval?: number
  /** 请求头 */
  headers?: Record<string, string>
  /** 请求体（POST/PUT） */
  body?: any
  /** 数据路径（用于解析嵌套数据） */
  dataPath?: string
  /** 启用状态 */
  enabled?: boolean
  /** 超时时间(ms) */
  timeout?: number
}

/**
 * HTTP 轮询服务类
 */
export class HttpService {
  private config: HttpConfig | null = null
  private onDataCallback: ((data: any) => void) | null = null
  private onErrorCallback: ((error: Error) => void) | null = null
  private onStatusChangeCallback: ((connected: boolean) => void) | null = null
  private intervalId: number | null = null
  private isPolling = false
  private abortController: AbortController | null = null

  /**
   * 启动轮询
   */
  async start(config: HttpConfig): Promise<void> {
    if (!config.enabled) {
      throw new Error('HTTP 轮询未启用')
    }

    if (!config.url) {
      throw new Error('HTTP URL 未配置')
    }

    this.config = config
    this.isPolling = true

    // 立即执行一次
    await this.poll()

    // 启动定时轮询
    const interval = config.pollInterval || 5000
    this.intervalId = window.setInterval(() => {
      this.poll()
    }, interval)

    console.log(`[HTTP] 启动轮询: ${config.url}, 间隔: ${interval}ms`)
  }

  /**
   * 执行轮询请求
   */
  private async poll(): Promise<void> {
    if (!this.config || !this.isPolling) return

    try {
      // 创建 AbortController 用于超时控制
      this.abortController = new AbortController()
      const timeout = this.config.timeout || 30000

      const timeoutId = setTimeout(() => {
        this.abortController?.abort()
      }, timeout)

      // 构建请求选项
      const options: RequestInit = {
        method: this.config.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers
        },
        signal: this.abortController.signal
      }

      // 添加请求体（POST/PUT）
      if (this.config.body && (this.config.method === 'POST' || this.config.method === 'PUT')) {
        options.body = typeof this.config.body === 'string'
          ? this.config.body
          : JSON.stringify(this.config.body)
      }

      // 发送请求
      const response = await fetch(this.config.url, options)
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const rawData = await response.json()

      // 处理数据路径
      let actualData = rawData
      if (this.config.dataPath) {
        const paths = this.config.dataPath.split('.')
        for (const path of paths) {
          actualData = actualData?.[path]
          if (!actualData) break
        }
      }

      // 直接传递原始数据，不做解析
      // 支持数组或单个数据
      if (this.onDataCallback) {
        if (Array.isArray(actualData)) {
          actualData.forEach((item: any) => {
            if (item) this.onDataCallback!(item)
          })
        } else if (actualData) {
          this.onDataCallback(actualData)
        }
      }

      // 更新状态
      this.onStatusChangeCallback?.(true)

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.error('[HTTP] 请求超时')
      } else {
        console.error('[HTTP] 轮询错误:', error)
      }

      // 更新状态
      this.onStatusChangeCallback?.(false)

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
   * 停止轮询
   */
  stop(): void {
    console.log('[HTTP] 停止轮询')

    this.isPolling = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  /**
   * 获取轮询状态
   */
  getPollingStatus(): boolean {
    return this.isPolling
  }

  /**
   * 获取当前配置
   */
  getConfig(): HttpConfig | null {
    return this.config
  }
  /**
   * 更新请求头
   */
  updateHeaders(headers: Record<string, string>): void {
    if (!this.config) return

    this.config.headers = {
      ...this.config.headers,
      ...headers
    }

    console.log('[HTTP] 更新请求头:', headers)
  }
}

/**
 * 创建 HTTP 服务实例
 */
export function createHttpService(): HttpService {
  return new HttpService()
}
