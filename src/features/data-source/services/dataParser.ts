/**
 * 数据解析工具
 * 提供通用的数据格式解析和转换功能
 */

/**
 * 设备数据接口
 */
export interface DeviceData {
  id: string
  name: string
  points: Array<{
    id: string
    name?: string
    value: any
    quality?: 'good' | 'bad' | 'uncertain'
    timestamp?: string
    unit?: string
    dataType?: 'number' | 'boolean' | 'string'
  }>
}

/**
 * 数据解析器类
 */
export class DataParser {
  /**
   * 自动解析设备数据（支持多种格式）
   * @param data 原始数据
   * @param defaultDeviceId 默认设备ID（用于简化点位数组格式）
   * @param defaultDeviceName 默认设备名称（用于简化点位数组格式）
   */
  static parseDeviceData(data: any, defaultDeviceId?: string, defaultDeviceName?: string): DeviceData | null {
    if (!data) return null

    // 格式1: 简化点位数组 [{ id, value }, ...]（优先支持）
    if (this.isSimplifiedPointsArray(data)) {
      return this.parseSimplifiedPointsArray(data, defaultDeviceId, defaultDeviceName)
    }

    // 格式2: 标准格式 { id/deviceId, name/deviceName, points: [...] }
    if (this.isStandardFormat(data)) {
      return this.parseStandardFormat(data)
    }

    // 格式3: 单点位格式 { deviceId, pointId, value }
    if (this.isSinglePointFormat(data)) {
      return this.parseSinglePointFormat(data)
    }

    // 格式4: 扁平化格式 { deviceId, prop1: value1, prop2: value2 }
    if (this.isFlatFormat(data)) {
      return this.parseFlatFormat(data)
    }

    // 格式5: 嵌套设备格式 { device: { id, data: {...} } }
    if (this.isNestedFormat(data)) {
      return this.parseNestedFormat(data)
    }

    console.warn('[DataParser] 无法识别的数据格式:', data)
    return null
  }

  /**
   * 检查是否为简化点位数组格式
   */
  private static isSimplifiedPointsArray(data: any): boolean {
    return (
      Array.isArray(data) &&
      data.length > 0 &&
      data[0].id !== undefined &&
      data[0].value !== undefined &&
      !data[0].points // 排除设备数组格式
    )
  }

  /**
   * 解析简化点位数组格式
   */
  private static parseSimplifiedPointsArray(
    data: any[],
    defaultDeviceId?: string,
    defaultDeviceName?: string
  ): DeviceData {
    return {
      id: defaultDeviceId || 'default-device',
      name: defaultDeviceName || 'Default Device',
      points: data.map((point: any) => ({
        id: point.id || point.pointId,
        name: point.name || point.pointName || point.id || point.pointId,
        value: point.value,
        quality: point.quality || 'good',
        timestamp: point.timestamp || new Date().toISOString(),
        unit: point.unit,
        dataType: point.dataType || this.inferDataType(point.value)
      }))
    }
  }

  /**
   * 检查是否为标准格式
   */
  private static isStandardFormat(data: any): boolean {
    return (
      (data.id || data.deviceId) &&
      Array.isArray(data.points) &&
      data.points.length > 0
    )
  }

  /**
   * 解析标准格式
   */
  private static parseStandardFormat(data: any): DeviceData {
    return {
      id: data.id || data.deviceId,
      name: data.name || data.deviceName || data.id || data.deviceId,
      points: data.points.map((p: any) => ({
        id: p.id || p.pointId,
        name: p.name || p.pointName || p.id || p.pointId,
        value: p.value,
        quality: p.quality || 'good',
        timestamp: p.timestamp || new Date().toISOString(),
        unit: p.unit,
        dataType: p.dataType || this.inferDataType(p.value)
      }))
    }
  }

  /**
   * 检查是否为单点位格式
   */
  private static isSinglePointFormat(data: any): boolean {
    return (
      (data.deviceId || data.id) &&
      (data.pointId || data.point) &&
      data.value !== undefined
    )
  }

  /**
   * 解析单点位格式
   */
  private static parseSinglePointFormat(data: any): DeviceData {
    const deviceId = data.deviceId || data.id
    const pointId = data.pointId || data.point
    
    return {
      id: deviceId,
      name: data.deviceName || deviceId,
      points: [{
        id: pointId,
        name: data.pointName || pointId,
        value: data.value,
        quality: data.quality || 'good',
        timestamp: data.timestamp || new Date().toISOString(),
        unit: data.unit,
        dataType: data.dataType || this.inferDataType(data.value)
      }]
    }
  }

  /**
   * 检查是否为扁平化格式
   */
  private static isFlatFormat(data: any): boolean {
    const hasDeviceId = data.deviceId || data.id
    const hasDataProperties = Object.keys(data).some(key => 
      !['deviceId', 'id', 'deviceName', 'name', 'timestamp'].includes(key)
    )
    return hasDeviceId && hasDataProperties
  }

  /**
   * 解析扁平化格式
   */
  private static parseFlatFormat(data: any): DeviceData {
    const deviceId = data.deviceId || data.id
    const points: DeviceData['points'] = []

    const excludeKeys = ['deviceId', 'id', 'deviceName', 'name', 'timestamp']
    
    for (const key in data) {
      if (!excludeKeys.includes(key)) {
        points.push({
          id: key,
          name: key,
          value: data[key],
          quality: 'good',
          timestamp: data.timestamp || new Date().toISOString(),
          dataType: this.inferDataType(data[key])
        })
      }
    }

    return {
      id: deviceId,
      name: data.deviceName || data.name || deviceId,
      points
    }
  }

  /**
   * 检查是否为嵌套格式
   */
  private static isNestedFormat(data: any): boolean {
    return data.device && (data.device.id || data.device.deviceId)
  }

  /**
   * 解析嵌套格式
   */
  private static parseNestedFormat(data: any): DeviceData | null {
    const device = data.device
    if (!device) return null

    // 递归解析内部设备数据
    if (device.data || device.points) {
      return this.parseDeviceData({
        ...device.data,
        deviceId: device.id || device.deviceId,
        deviceName: device.name || device.deviceName,
        points: device.points
      })
    }

    return this.parseDeviceData(device)
  }

  /**
   * 推断数据类型
   */
  private static inferDataType(value: any): 'number' | 'boolean' | 'string' {
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    return 'string'
  }

  /**
   * 创建自定义解析器
   * @param mappingConfig 字段映射配置
   * @returns 解析函数
   */
  static createCustomParser(mappingConfig: {
    deviceId: string | ((data: any) => string)
    deviceName?: string | ((data: any) => string)
    points: string | ((data: any) => any[])
    pointId?: string | ((data: any, point: any) => string)
    pointValue?: string | ((data: any, point: any) => any)
  }): (data: any) => DeviceData {
    return (data: any) => {
      // 提取设备ID
      const deviceId = typeof mappingConfig.deviceId === 'function'
        ? mappingConfig.deviceId(data)
        : this.getValueByPath(data, mappingConfig.deviceId)

      // 提取设备名称
      const deviceName = mappingConfig.deviceName
        ? (typeof mappingConfig.deviceName === 'function'
            ? mappingConfig.deviceName(data)
            : this.getValueByPath(data, mappingConfig.deviceName))
        : deviceId

      // 提取点位数组
      let pointsData = typeof mappingConfig.points === 'function'
        ? mappingConfig.points(data)
        : this.getValueByPath(data, mappingConfig.points)

      if (!Array.isArray(pointsData)) {
        pointsData = [pointsData]
      }

      // 解析点位
      const points = pointsData.map((point: any) => {
        const pointId = mappingConfig.pointId
          ? (typeof mappingConfig.pointId === 'function'
              ? mappingConfig.pointId(data, point)
              : this.getValueByPath(point, mappingConfig.pointId))
          : (point.id || point.pointId)

        const pointValue = mappingConfig.pointValue
          ? (typeof mappingConfig.pointValue === 'function'
              ? mappingConfig.pointValue(data, point)
              : this.getValueByPath(point, mappingConfig.pointValue))
          : point.value

        return {
          id: pointId,
          name: point.name || pointId,
          value: pointValue,
          quality: point.quality || 'good',
          timestamp: point.timestamp || new Date().toISOString(),
          unit: point.unit,
          dataType: this.inferDataType(pointValue)
        }
      })

      return {
        id: deviceId,
        name: deviceName,
        points
      }
    }
  }

  /**
   * 通过路径获取值
   */
  private static getValueByPath(obj: any, path: string): any {
    if (!path) return obj
    
    const keys = path.split('.')
    let value = obj
    
    for (const key of keys) {
      if (value === null || value === undefined) return undefined
      value = value[key]
    }
    
    return value
  }
}

/**
 * 常用解析器预设
 */
export const ParserPresets = {
  /**
   * 物联网平台标准格式
   */
  iotPlatform: DataParser.createCustomParser({
    deviceId: 'deviceInfo.id',
    deviceName: 'deviceInfo.name',
    points: 'telemetry',
    pointId: (_, point) => point.key,
    pointValue: (_, point) => point.value
  }),

  /**
   * Modbus 格式
   */
  modbus: DataParser.createCustomParser({
    deviceId: 'slaveId',
    deviceName: 'slaveName',
    points: 'registers',
    pointId: (_, point) => `reg_${point.address}`,
    pointValue: (_, point) => point.value
  }),

  /**
   * OPC UA 格式
   */
  opcua: DataParser.createCustomParser({
    deviceId: 'nodeId',
    deviceName: 'displayName',
    points: 'values',
    pointId: (_, point) => point.browseName,
    pointValue: (_, point) => point.value.value
  })
}

// 导出默认解析器
export const defaultParser = DataParser.parseDeviceData.bind(DataParser)
