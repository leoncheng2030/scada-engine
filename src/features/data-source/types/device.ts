/**
 * 设备点位数据结构定义
 */

/**
 * 点位数据类型
 */
export enum PointDataType {
  BOOLEAN = 'boolean',     // 布尔值
  NUMBER = 'number',       // 数值
  STRING = 'string'        // 字符串
}

/**
 * 点位访问权限
 */
export enum PointAccessMode {
  READ = 'read',           // 只读
  WRITE = 'write',         // 只写
  READ_WRITE = 'readWrite' // 读写
}

/**
 * 设备点位
 */
export interface DevicePoint {
  /** 点位ID */
  id: string
  /** 点位名称 */
  name: string
  /** 点位编码（设备内部地址） */
  code: string
  /** 点位描述 */
  description?: string
  /** 数据类型 */
  dataType: PointDataType
  /** 访问权限 */
  accessMode: PointAccessMode
  /** 当前值 */
  value?: any
  /** 单位 */
  unit?: string
  /** 最小值 */
  minValue?: number
  /** 最大值 */
  maxValue?: number
  /** 精度（小数位数） */
  precision?: number
  /** 是否启用 */
  enabled?: boolean
  /** 更新时间 */
  updateTime?: string
  /** 质量戳（good/bad/uncertain） */
  quality?: 'good' | 'bad' | 'uncertain'
}

/**
 * 设备状态
 */
export enum DeviceStatus {
  ONLINE = 'online',       // 在线
  OFFLINE = 'offline',     // 离线
  ERROR = 'error',         // 故障
  MAINTENANCE = 'maintenance' // 维护中
}

/**
 * 设备类型
 */
export enum DeviceType {
  PLC = 'plc',             // PLC设备
  SENSOR = 'sensor',       // 传感器
  ACTUATOR = 'actuator',   // 执行器
  METER = 'meter',         // 仪表
  CAMERA = 'camera',       // 摄像头
  OTHER = 'other'          // 其他
}

/**
 * 设备
 */
export interface Device {
  /** 设备ID */
  id: string
  /** 设备名称 */
  name: string
  /** 设备编码 */
  code: string
  /** 设备类型 */
  type: DeviceType
  /** 设备描述 */
  description?: string
  /** 设备状态 */
  status: DeviceStatus
  /** 设备IP地址 */
  ipAddress?: string
  /** 设备端口 */
  port?: number
  /** 通信协议 */
  protocol?: string
  /** 点位列表 */
  points: DevicePoint[]
  /** 是否启用 */
  enabled?: boolean
  /** 创建时间 */
  createTime?: string
  /** 更新时间 */
  updateTime?: string
  /** 标签 */
  tags?: string[]
  /** 扩展属性 */
  properties?: Record<string, any>
}

/**
 * 设备列表
 */
export interface DeviceList {
  /** 设备列表 */
  devices: Device[]
  /** 总数 */
  total: number
}

/**
 * 点位值更新事件
 */
export interface PointValueUpdate {
  /** 设备ID */
  deviceId: string
  /** 点位ID */
  pointId: string
  /** 新值 */
  value: any
  /** 更新时间 */
  timestamp: string
  /** 质量戳 */
  quality: 'good' | 'bad' | 'uncertain'
}
