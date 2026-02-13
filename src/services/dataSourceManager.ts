/**
 * 数据源管理服务
 * 统一管理多个数据源连接（MQTT、WebSocket、HTTP等）
 */

import { ref, reactive } from 'vue'
import { createMqttService, type MqttConfig } from './mqttService'
import { createWebSocketService, type WebSocketConfig } from './websocketService'
import { createHttpService, type HttpConfig } from './httpService'
import { createSseService, type SseConfig } from './sseService'
import { DataParser } from './dataParser'

// 数据源类型定义
export interface DataSource {
  id: string
  name: string
  type: 'MQTT' | 'WebSocket' | 'HTTP' | 'SSE'
  enabled: boolean
  config: {
    // MQTT
    broker?: string
    topic?: string
    clientId?: string
    username?: string
    password?: string
    // WebSocket
    wsUrl?: string
    // HTTP
    url?: string
    method?: string
    pollInterval?: number
    headers?: Record<string, string>
    // SSE
    sseUrl?: string
    eventType?: string
    // 通用
    dataPath?: string
    retryCount?: number
    // 自定义解析器（可选）
    customParser?: (data: any) => any
  }
  status?: {
    connected: boolean
    lastUpdate?: string
    error?: string
  }
  devices: Array<{
    id: string
    name: string
    points: Array<{
      id: string
      value: any
      quality?: string
      timestamp?: string
    }>
  }>
}

// 数据源管理器类
export class DataSourceManager {
  private dataSources = reactive<Map<string, DataSource>>(new Map())
  private connections = new Map<string, any>() // 存储实际的连接实例
  private onDataCallbacks: Array<(dataSourceId: string, deviceData: any) => void> = []
  private globalHttpHeaders: Record<string, string> = {}


  /**
   * 添加数据源
   */
  addDataSource(dataSource: DataSource): void {
    this.dataSources.set(dataSource.id, dataSource)

    // 如果启用，立即连接
    if (dataSource.enabled) {
      this.connectDataSource(dataSource.id)
    }
  }

  /**
   * 更新数据源
   */
  updateDataSource(id: string, updates: Partial<DataSource>): void {
    const dataSource = this.dataSources.get(id)
    if (!dataSource) return

    // 更新数据源配置
    Object.assign(dataSource, updates)

    // 如果配置变化，重新连接
    if (updates.config || updates.enabled !== undefined) {
      this.reconnectDataSource(id)
    }
  }

  /**
   * 删除数据源
   */
  removeDataSource(id: string): void {
    this.disconnectDataSource(id)
    this.dataSources.delete(id)
  }

  /**
   * 获取数据源
   */
  getDataSource(id: string): DataSource | undefined {
    return this.dataSources.get(id)
  }

  /**
   * 获取所有数据源
   */
  getAllDataSources(): DataSource[] {
    return Array.from(this.dataSources.values())
  }

  /**
   * 获取所有设备（来自所有数据源）
   */
  getAllDevices(): Array<{ dataSourceId: string; dataSourceName: string; device: any }> {
    const devices: Array<{ dataSourceId: string; dataSourceName: string; device: any }> = []

    this.dataSources.forEach((dataSource) => {
      dataSource.devices.forEach((device) => {
        devices.push({
          dataSourceId: dataSource.id,
          dataSourceName: dataSource.name,
          device
        })
      })
    })

    return devices
  }

  /**
   * 连接数据源
   */
  private async connectDataSource(id: string): Promise<void> {
    const dataSource = this.dataSources.get(id)
    if (!dataSource) return

    try {
      // 先断开已有连接
      this.disconnectDataSource(id)

      // 根据类型创建连接
      switch (dataSource.type) {
        case 'MQTT':
          await this.connectMqtt(id, dataSource)
          break
        case 'WebSocket':
          await this.connectWebSocket(id, dataSource)
          break
        case 'HTTP':
          await this.connectHttp(id, dataSource)
          break
        case 'SSE':
          await this.connectSSE(id, dataSource)
          break
      }

      // 注意：不再在这里直接设置 connected=true
      // 状态会通过 onStatusChange 回调自动更新
    } catch (error) {
      console.error(`[DataSource] 连接失败: ${dataSource.name}`, error)
      if (dataSource.status) {
        dataSource.status.connected = false
        dataSource.status.error = (error as Error).message
      }
    }
  }

  /**
   * 断开数据源连接
   */
  private disconnectDataSource(id: string): void {
    const connection = this.connections.get(id)
    if (!connection) return

    // 根据类型断开连接
    const dataSource = this.dataSources.get(id)
    if (!dataSource) return

    try {
      if (dataSource.type === 'MQTT') {
        connection.disconnect()
      } else if (dataSource.type === 'WebSocket') {
        connection.disconnect()
      } else if (dataSource.type === 'HTTP') {
        connection.stop()
      } else if (dataSource.type === 'SSE') {
        connection.disconnect()
      }
    } catch (error) {
      console.error(`[DataSource] 断开连接失败:`, error)
    }

    this.connections.delete(id)

    // 更新状态
    if (dataSource.status) {
      dataSource.status.connected = false
    }
  }

  /**
   * 重新连接数据源
   */
  private async reconnectDataSource(id: string): Promise<void> {
    const dataSource = this.dataSources.get(id)
    if (!dataSource) return

    if (dataSource.enabled) {
      await this.connectDataSource(id)
    } else {
      this.disconnectDataSource(id)
    }
  }

  /**
   * 连接 MQTT
   */
  private async connectMqtt(id: string, dataSource: DataSource): Promise<void> {
    const mqttService = createMqttService()

    // 设置数据接收回调
    mqttService.onData((deviceData) => {
      this.handleDeviceData(id, deviceData)
    })

    // 设置错误回调
    mqttService.onError((error) => {
      console.error(`[MQTT] 数据源 ${dataSource.name} 错误:`, error)
      if (dataSource.status) {
        dataSource.status.error = error.message
        dataSource.status.connected = false
      }
    })

    // 设置状态变化回调
    mqttService.onStatusChange((connected) => {
      if (dataSource.status) {
        dataSource.status.connected = connected
        if (connected) {
          dataSource.status.error = undefined
        }
      }
    })

    // 连接
    const config: MqttConfig = {
      broker: dataSource.config.broker || '',
      topic: dataSource.config.topic || '',
      clientId: dataSource.config.clientId,
      username: dataSource.config.username,
      password: dataSource.config.password,
      dataPath: dataSource.config.dataPath,
      enabled: true,
      retryCount: dataSource.config.retryCount || 3
    }

    await mqttService.connect(config)
    this.connections.set(id, mqttService)
  }

  /**
   * 连接 WebSocket
   */
  private async connectWebSocket(id: string, dataSource: DataSource): Promise<void> {
    const wsService = createWebSocketService()

    // 设置数据接收回调
    wsService.onData((deviceData) => {
      this.handleDeviceData(id, deviceData)
    })

    // 设置错误回调
    wsService.onError((error) => {
      console.error(`[WebSocket] 数据源 ${dataSource.name} 错误:`, error)
      if (dataSource.status) {
        dataSource.status.error = error.message
      }
    })

    // 设置状态变化回调
    wsService.onStatusChange((connected) => {
      if (dataSource.status) {
        dataSource.status.connected = connected
      }
    })

    // 连接
    const config: WebSocketConfig = {
      url: dataSource.config.wsUrl || '',
      dataPath: dataSource.config.dataPath,
      enabled: true,
      autoReconnect: true,
      reconnectDelay: 5000
    }

    await wsService.connect(config)
    this.connections.set(id, wsService)
  }

  /**
   * 连接 HTTP
   */
  private async connectHttp(id: string, dataSource: DataSource): Promise<void> {
    const httpService = createHttpService()

    // 设置数据接收回调
    httpService.onData((deviceData) => {
      this.handleDeviceData(id, deviceData)
    })

    // 设置错误回调
    httpService.onError((error) => {
      console.error(`[HTTP] 数据源 ${dataSource.name} 错误:`, error)
      if (dataSource.status) {
        dataSource.status.error = error.message
        dataSource.status.connected = false
      }
    })

    // 设置状态变化回调
    httpService.onStatusChange((connected) => {
      if (dataSource.status) {
        dataSource.status.connected = connected
      }
    })

    // 启动轮询
    const config: HttpConfig = {
      url: dataSource.config.url || '',
      method: dataSource.config.method as any || 'GET',
      pollInterval: dataSource.config.pollInterval || 5000,
      headers: {
        ...this.globalHttpHeaders,
        ...dataSource.config.headers
      },
      dataPath: dataSource.config.dataPath,
      enabled: true
    }

    await httpService.start(config)
    this.connections.set(id, httpService)
  }

  /**
   * 连接 SSE
   */
  private async connectSSE(id: string, dataSource: DataSource): Promise<void> {
    const sseService = createSseService()

    // 设置数据接收回调
    sseService.onData((deviceData) => {
      this.handleDeviceData(id, deviceData)
    })

    // 设置错误回调
    sseService.onError((error) => {
      console.error(`[SSE] 数据源 ${dataSource.name} 错误:`, error)
      if (dataSource.status) {
        dataSource.status.error = error.message
      }
    })

    // 设置状态变化回调
    sseService.onStatusChange((connected) => {
      if (dataSource.status) {
        dataSource.status.connected = connected
      }
    })

    // 连接
    const config: SseConfig = {
      url: dataSource.config.sseUrl || '',
      eventType: dataSource.config.eventType || 'message',
      dataPath: dataSource.config.dataPath,
      enabled: true,
      autoReconnect: true,
      reconnectDelay: 5000
    }

    await sseService.connect(config)
    this.connections.set(id, sseService)
  }

  /**
   * 处理接收到的原始数据
   * 解析并更新设备列表，然后传递给回调
   */
  private handleDeviceData(dataSourceId: string, rawData: any): void {
    const dataSource = this.dataSources.get(dataSourceId)
    if (!dataSource) return

    // 更新最后更新时间
    if (dataSource.status) {
      dataSource.status.lastUpdate = new Date().toISOString()
    }

    // 解析设备数据，更新到 dataSource.devices
    this.parseAndUpdateDevices(dataSource, rawData)

    // 直接触发回调，传递原始数据
    this.onDataCallbacks.forEach((callback) => {
      callback(dataSourceId, rawData)
    })
  }

  /**
   * 解析并更新设备列表
   */
  private parseAndUpdateDevices(dataSource: DataSource, rawData: any): void {
    try {
      // 如果有自定义解析器，使用它
      let parsedData = rawData
      if (dataSource.config.customParser) {
        parsedData = dataSource.config.customParser(rawData)
      }

      // 优先判断：多设备格式 { devices: [...] }
      if (parsedData && Array.isArray(parsedData.devices)) {
        const parsedDevices: any[] = []

        for (const device of parsedData.devices) {
          const deviceData = DataParser.parseDeviceData(
            device,
            device.id || device.deviceId || `device-${parsedDevices.length}`,
            device.name || device.deviceName
          )

          if (deviceData) {
            parsedDevices.push({
              id: deviceData.id,
              name: deviceData.name,
              points: deviceData.points.map((point: any) => ({
                id: point.id,
                name: point.name || point.id,
                code: point.code || point.id,
                value: point.value,
                unit: point.unit || '',
                dataType: point.dataType || 'number',
                accessMode: 'read',
                quality: point.quality,
                timestamp: point.timestamp
              }))
            })
          }
        }

        if (parsedDevices.length > 0) {
          dataSource.devices = parsedDevices
          return
        }
      }

      // 设备数组格式: [{ id, name, points }, ...]
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        const parsedDevices: any[] = []

        for (const device of parsedData) {
          const deviceData = DataParser.parseDeviceData(
            device,
            device.id || device.deviceId || `device-${parsedDevices.length}`,
            device.name || device.deviceName
          )

          if (deviceData) {
            parsedDevices.push({
              id: deviceData.id,
              name: deviceData.name,
              points: deviceData.points.map((point: any) => ({
                id: point.id,
                name: point.name || point.id,
                code: point.code || point.id,
                value: point.value,
                unit: point.unit || '',
                dataType: point.dataType || 'number',
                accessMode: 'read',
                quality: point.quality,
                timestamp: point.timestamp
              }))
            })
          }
        }

        if (parsedDevices.length > 0) {
          dataSource.devices = parsedDevices
          return
        }
      }

      // 最后尝试：单设备数据（使用 DataParser）
      const deviceData = DataParser.parseDeviceData(
        parsedData,
        'default-device', // 默认设备ID
        dataSource.name    // 使用数据源名称作为设备名称
      )

      if (deviceData) {
        // 单设备格式
        dataSource.devices = [{
          id: deviceData.id,
          name: deviceData.name,
          points: deviceData.points.map((point: any) => ({
            id: point.id,
            name: point.name || point.id,
            code: point.code || point.id,
            value: point.value,
            unit: point.unit || '',
            dataType: point.dataType || 'number',
            accessMode: 'read',
            quality: point.quality,
            timestamp: point.timestamp
          }))
        }]

        return
      }

      console.warn(`[DataSourceManager] 数据源 "${dataSource.name}" 接收到不支持的数据格式:`, parsedData)
      console.warn('[DataSourceManager] 支持的格式:')
      console.warn('  1. 简化点位数组: [{ id, value }, ...]')
      console.warn('  2. 单设备格式: { id, name, points: [...] }')
      console.warn('  3. 多设备格式: { devices: [{ id, name, points: [...] }] }')
    } catch (error) {
      console.error(`[DataSourceManager] 解析数据源 "${dataSource.name}" 的数据失败:`, error)
    }
  }

  /**
   * 注册数据接收回调
   */
  onData(callback: (dataSourceId: string, deviceData: any) => void): void {
    this.onDataCallbacks.push(callback)
  }

  /**
   * 断开所有连接
   */
  disconnectAll(): void {
    this.dataSources.forEach((_, id) => {
      this.disconnectDataSource(id)
    })
  }

  /**
   * 获取数据源状态
   */
  getDataSourceStatus(id: string): { connected: boolean } | null {
    const dataSource = this.dataSources.get(id)
    return dataSource?.status || null
  }

  /**
   * 设置全局 HTTP 头
   * @param headers HTTP 头对象
   */
  setGlobalHttpHeaders(headers: Record<string, string>): void {
    this.globalHttpHeaders = {
      ...this.globalHttpHeaders,
      ...headers
    }

    // 更新所有活跃的 HTTP 连接
    this.connections.forEach((connection, id) => {
      const dataSource = this.dataSources.get(id)
      if (dataSource && dataSource.type === 'HTTP') {
        // connection 是 HttpService 实例
        if (typeof connection.updateHeaders === 'function') {
          connection.updateHeaders(headers)
        }
      }
    })
  }
}

// 导出单例
export const dataSourceManager = new DataSourceManager()
