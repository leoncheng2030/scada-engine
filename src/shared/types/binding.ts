/**
 * 数据绑定和映射配置类型定义
 */

/**
 * 映射类型
 */
export enum MappingType {
  DIRECT = 'direct',       // 直接映射
  BOOLEAN = 'boolean',     // 布尔映射
  RANGE = 'range',         // 范围映射
  ENUM = 'enum'            // 枚举映射
}

/**
 * 值类型（与点位数据类型对应）
 */
export enum ValueType {
  BOOLEAN = 'boolean',     // 布尔型
  NUMBER = 'number',       // 数值型
  STRING = 'string'        // 字符串型
}

/**
 * 范围映射规则
 */
export interface RangeRule {
  /** 最小值（包含） */
  min: number
  /** 最大值（包含） */
  max: number
  /** 映射值 */
  value: any
  /** 标签（可选） */
  label?: string
  /** 单位（可选） */
  unit?: string
}

/**
 * 映射配置
 */
export interface MappingConfig {
  /** 映射类型 */
  type: MappingType
  
  /** 值类型（必填） */
  valueType: ValueType
  
  /** 布尔映射 - true时的值 */
  trueValue?: any
  /** 布尔映射 - false时的值 */
  falseValue?: any
  
  /** 范围映射 - 规则列表 */
  rangeRules?: RangeRule[]
  
  /** 枚举映射 - 键值对 */
  enumMappings?: Record<string, any>
  
  /** 保留原始值的单位（可选） */
  keepOriginalUnit?: boolean
  /** 自定义单位（可选，会覆盖点位单位） */
  customUnit?: string
}

/**
 * 绑定配置
 */
export interface BindingConfig {
  /** 绑定ID */
  id?: string
  /** 设备点位ID（格式: deviceId:pointId） */
  devicePointId?: string
  /** 目标节点属性 */
  targetProperty?: string
  /** 映射配置 */
  mapping?: MappingConfig
  /** 是否启用 */
  enabled?: boolean
}

/**
 * 应用映射规则，将点位值转换为目标值
 */
export function applyMapping(value: any, mapping: MappingConfig): any {
  if (!mapping) return value
  
  switch (mapping.type) {
    case MappingType.DIRECT:
      // 直接映射，不做转换
      return value
      
    case MappingType.BOOLEAN:
      // 布尔映射
      return value ? (mapping.trueValue ?? true) : (mapping.falseValue ?? false)
      
    case MappingType.RANGE:
      // 范围映射
      if (!mapping.rangeRules || typeof value !== 'number') return value
      for (const rule of mapping.rangeRules) {
        if (value >= rule.min && value <= rule.max) {
          return rule.value
        }
      }
      return value // 未匹配任何规则，返回原值
      
    case MappingType.ENUM:
      // 枚举映射
      if (!mapping.enumMappings) return value
      const key = String(value)
      return mapping.enumMappings[key] ?? value
      
    default:
      return value
  }
}
