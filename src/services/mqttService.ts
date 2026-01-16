/**
 * MQTT 服务模块
 * 负责 MQTT 连接管理和数据接收
 */

import mqtt, { MqttClient } from 'mqtt'

/**
 * MQTT 配置接口
 */
export interface MqttConfig {
  /** 服务器地址 */
  broker: string
  /** 客户端ID（可选，自动生成） */
  clientId?: string
  /** 订阅主题 */
  topic: string
  /** 用户名（可选） */
  username?: string
  /** 密码（可选） */
  password?: string
  /** 数据路径（用于解析嵌套数据，例如：value） */
  dataPath?: string
  /** 启用状态 */
  enabled?: boolean
  /** 错误重试次数 */
  retryCount?: number
}

/**
 * 设备点位数据接口
 */
export interface DevicePointData {
  /** 点位 ID */
  id: string
  /** 点位名称 */
  name?: string
  /** 点位编码 */
  code?: string
  /** 数据类型 */
  dataType?: 'boolean' | 'number' | 'string'
  /** 访问权限 */
  accessMode?: 'read' | 'write' | 'readWrite'
  /** 点位值 */
  value: any
  /** 数据质量 */
  quality?: 'good' | 'bad' | 'uncertain'
  /** 时间戳 */
  timestamp?: string
  /** 单位 */
  unit?: string
  /** 是否启用 */
  enabled?: boolean
  /** 精度 */
  precision?: number
}

/**
 * 设备数据接口
 */
export interface DeviceData {
  /** 设备ID */
  id: string
  /** 设备名称 */
  name?: string
  /** 点位数据 */
  points: DevicePointData[]
}

/**
 * MQTT 服务类
 */
export class MqttService {
  private client: MqttClient | null = null
  private config: MqttConfig | null = null
  private onDataCallback: ((data: DeviceData) => void) | null = null
  private onErrorCallback: ((error: Error) => void) | null = null
  private onStatusChangeCallback: ((connected: boolean) => void) | null = null
  private isConnected = false

  /**
   * 连接 MQTT 服务器
   */
  connect(config: MqttConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!config.enabled) {
        reject(new Error('MQTT 连接未启用'))
        return
      }

      this.config = config

      // 处理浏览器环境下的 MQTT 地址
      let brokerUrl = config.broker
      console.log('[MQTT] 原始 broker 地址:', brokerUrl)
      
      // 如果是 mqtt:// 协议，在浏览器中需要转换为 ws:// 或 wss://
      if (brokerUrl.startsWith('mqtt://')) {
        // 提取主机名
        const host = brokerUrl.replace('mqtt://', '')
        // 对于 EMQX 公共服务器，使用 WebSocket 端口
        if (host.includes('broker.emqx.io')) {
          brokerUrl = `ws://broker.emqx.io:8083/mqtt`
        } else {
          // 其他服务器，尝试使用默认 WebSocket 端口
          brokerUrl = `ws://${host}:8083/mqtt`
        }
        console.log('[MQTT] 协议转换: mqtt:// → WebSocket，目标地址:', brokerUrl)
      } else if (brokerUrl.startsWith('mqtts://')) {
        const host = brokerUrl.replace('mqtts://', '')
        if (host.includes('broker.emqx.io')) {
          brokerUrl = `wss://broker.emqx.io:8084/mqtt`
        } else {
          brokerUrl = `wss://${host}:8084/mqtt`
        }
        console.log('[MQTT] 协议转换: mqtts:// → WebSocket Secure，目标地址:', brokerUrl)
      } else if (!brokerUrl.startsWith('ws://') && !brokerUrl.startsWith('wss://')) {
        // 如果没有协议前缀，默认使用 ws://
        brokerUrl = `ws://${brokerUrl}:8083/mqtt`
        console.log('[MQTT] 添加默认协议和端口，目标地址:', brokerUrl)
      } else {
        console.log('[MQTT] 使用原始 WebSocket 地址:', brokerUrl)
      }

      // 连接选项
      const options: mqtt.IClientOptions = {
        clientId: config.clientId || `scada_${Math.random().toString(16).substring(2, 8)}`,
        clean: true,
        reconnectPeriod: 0,  // 禁用自动重连，由我们手动控制
        connectTimeout: 30 * 1000,  // MQTT 客户端连接超时（30秒）
        keepalive: 60  // 心跳间隔（60秒）
      }

      // 添加认证信息（仅当提供了用户名时）
      // EMQX 公共服务器支持匿名访问，不需要认证
      if (config.username && config.username.trim()) {
        options.username = config.username
        console.log('[MQTT] 使用认证，用户名:', config.username)
      } else {
        console.log('[MQTT] 使用匿名连接')
      }
      
      if (config.password && config.password.trim()) {
        options.password = config.password
        console.log('[MQTT] 密码已设置')
      }

      console.log('[MQTT] 完整连接配置:', {
        brokerUrl,
        clientId: options.clientId,
        username: options.username || '无',
        hasPassword: !!(options.password),
        topic: config.topic
      })

      try {
        // 创建 MQTT 客户端
        this.client = mqtt.connect(brokerUrl, options)

        // 设置连接超时（15秒，适应网络波动）
        const connectTimeout = setTimeout(() => {
          reject(new Error('MQTT 连接超时'))
          if (this.client) {
            this.client.end(true)
          }
        }, 15000)

        // 连接成功
        this.client.on('connect', (connack) => {
          clearTimeout(connectTimeout)
          this.isConnected = true
          
          // 通知状态变化
          if (this.onStatusChangeCallback) {
            this.onStatusChangeCallback(true)
          }
          
          // 订阅主题
          if (this.client && config.topic) {
            this.client.subscribe(config.topic, (err) => {
              if (err) {
                console.error('[MQTT] 订阅失败:', err)
                reject(err)
              } else {
                console.log(`[MQTT] 订阅主题成功: ${config.topic}`)
                resolve()
              }
            })
          } else {
            resolve()
          }
        })

        // 接收消息
        this.client.on('message', (topic, payload) => {
          try {
            const message = payload.toString()
            
            // 解析 JSON 数据
            const data = JSON.parse(message)
            
            // 处理数据路径
            let actualData = data
            if (config.dataPath) {
              const paths = config.dataPath.split('.')
              for (const path of paths) {
                actualData = actualData?.[path]
              }
            }
            
            // 直接传递原始数据，不做解析
            if (this.onDataCallback && actualData) {
              this.onDataCallback(actualData)
            }
          } catch (error) {
            console.error('[MQTT] 消息解析失败:', error)
            if (this.onErrorCallback) {
              this.onErrorCallback(error as Error)
            }
          }
        })

        // 连接错误
        this.client.on('error', (error) => {
          clearTimeout(connectTimeout)
          console.error('[MQTT] 连接错误:', error.message)
          this.isConnected = false
          
          // 通知状态变化
          if (this.onStatusChangeCallback) {
            this.onStatusChangeCallback(false)
          }
          
          if (this.onErrorCallback) {
            this.onErrorCallback(error)
          }
          
          reject(error)
        })

        // 连接断开
        this.client.on('close', () => {
          clearTimeout(connectTimeout)
          this.isConnected = false
          
          // 通知状态变化
          if (this.onStatusChangeCallback) {
            this.onStatusChangeCallback(false)
          }
        })

        // 离线事件
        this.client.on('offline', () => {
          // 静默处理
        })

        // 结束事件
        this.client.on('end', () => {
          // 静默处理
        })

      } catch (error) {
        console.error('[MQTT] 创建客户端失败:', error)
        reject(error)
      }
    })
  }

  /**
   * 设置数据接收回调
   */
  onData(callback: (data: DeviceData) => void): void {
    this.onDataCallback = callback
  }

  /**
   * 设置错误回调
   */
  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback
  }

  /**
   * 设置连接状态变化回调
   */
  onStatusChange(callback: (connected: boolean) => void): void {
    this.onStatusChangeCallback = callback
  }

  /**
   * 发布消息
   */
  publish(topic: string, message: string | object): void {
    if (!this.client || !this.isConnected) {
      console.warn('[MQTT] 未连接，无法发布消息')
      return
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message)
    this.client.publish(topic, payload, (error) => {
      if (error) {
        console.error('[MQTT] 消息发布失败:', error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.client) {
      try {
        // 移除所有事件监听器
        this.client.removeAllListeners()
        // 强制关闭，不等待
        this.client.end(true)
      } catch (error) {
        console.warn('[MQTT] 断开连接时出错:', error)
      }
      
      this.client = null
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
  getConfig(): MqttConfig | null {
    return this.config
  }
}

/**
 * 创建 MQTT 服务实例
 */
export function createMqttService(): MqttService {
  return new MqttService()
}
