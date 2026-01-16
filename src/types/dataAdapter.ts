/**
 * 组件数据适配器类型定义
 * 负责将原始数据转换为组件需要的格式
 */

/**
 * 数据提取器函数类型
 * 用于从原始数据中提取需要的值
 */
export type DataExtractor = (rawData: any) => any

/**
 * 数据转换器函数类型
 * 用于将提取的数据转换为组件需要的格式
 */
export type DataTransformer = (value: any, componentConfig?: any) => any

/**
 * 数据验证器函数类型
 * 用于验证数据格式是否符合组件要求
 */
export type DataValidator = (value: any) => boolean

/**
 * 组件数据适配器配置
 */
export interface ComponentDataAdapter {
  /**
   * 数据转换函数（必需）
   * 将提取的数据转换为组件需要的格式
   * 
   * @param value - 从原始数据中提取的值
   * @param componentConfig - 组件的配置（可选）
   * @returns 组件需要的数据格式
   * 
   * @example
   * // 数值转仪表盘格式
   * transform: (value, config) => ({
   *   value: Number(value),
   *   min: config.min || 0,
   *   max: config.max || 100
   * })
   */
  transform: DataTransformer

  /**
   * 数据验证函数（可选）
   * 验证数据是否符合要求
   * 
   * @param value - 需要验证的值
   * @returns 验证是否通过
   * 
   * @example
   * validate: (value) => typeof value === 'number'
   */
  validate?: DataValidator

  /**
   * 默认值（可选）
   * 当数据为空或验证失败时使用
   */
  defaultValue?: any

  /**
   * 错误处理函数（可选）
   * 当转换失败时调用
   */
  onError?: (error: Error, value: any) => any
}

/**
 * 数据绑定配置（增强版）
 */
export interface DataBindingConfig {
  /**
   * 数据源 ID
   */
  dataSourceId: string

  /**
   * 目标属性（组件的哪个属性）
   */
  targetProperty: string

  /**
   * 数据路径（JSONPath 或点分隔路径）
   * 用于从原始数据中提取值
   * 
   * @example
   * 'temperature'
   * 'sensors[0].data.temp'
   * 'payload.devices.find(d => d.id === "001").value'
   */
  dataPath?: string

  /**
   * 自定义数据提取器
   * 当 dataPath 不够灵活时使用
   */
  extractor?: DataExtractor

  /**
   * 映射配置（保留向后兼容）
   */
  mapping?: MappingConfig

  /**
   * 是否启用
   */
  enabled?: boolean
}

/**
 * 映射配置（保留向后兼容）
 */
export interface MappingConfig {
  type: 'direct' | 'boolean' | 'range' | 'enum' | 'custom'
  trueValue?: any
  falseValue?: any
  rangeRules?: Array<{ min: number; max: number; value: any }>
  enumMappings?: Record<string, any>
  customFunction?: string
}

/**
 * 数据适配器工具类
 */
export class DataAdapterUtils {
  /**
   * 从原始数据中提取值（使用数据路径）
   * 
   * @param rawData - 原始数据
   * @param dataPath - 数据路径（点分隔或数组索引）
   * @returns 提取的值
   * 
   * @example
   * extractByPath({ a: { b: { c: 1 } } }, 'a.b.c') // 返回 1
   * extractByPath({ arr: [1, 2, 3] }, 'arr[1]') // 返回 2
   */
  static extractByPath(rawData: any, dataPath: string): any {
    if (!dataPath || !rawData) return rawData

    try {
      // 处理数组索引 arr[0] -> arr.0
      const normalizedPath = dataPath.replace(/\[(\d+)\]/g, '.$1')
      
      // 分割路径
      const keys = normalizedPath.split('.')
      
      let result = rawData
      for (const key of keys) {
        if (result === null || result === undefined) {
          return undefined
        }
        result = result[key]
      }
      
      return result
    } catch (error) {
      console.error('[DataAdapter] 数据路径提取失败:', dataPath, error)
      return undefined
    }
  }

  /**
   * 使用提取器从原始数据中提取值
   * 
   * @param rawData - 原始数据
   * @param extractor - 提取器函数
   * @returns 提取的值
   */
  static extractByFunction(rawData: any, extractor: DataExtractor): any {
    try {
      return extractor(rawData)
    } catch (error) {
      console.error('[DataAdapter] 提取器执行失败:', error)
      return undefined
    }
  }

  /**
   * 应用数据适配器
   * 
   * @param value - 提取的值
   * @param adapter - 数据适配器
   * @param componentConfig - 组件配置
   * @returns 转换后的值
   */
  static applyAdapter(
    value: any, 
    adapter: ComponentDataAdapter | undefined, 
    componentConfig?: any
  ): any {
    if (!adapter) {
      return value // 没有适配器，直接返回原值
    }

    try {
      // 验证数据
      if (adapter.validate && !adapter.validate(value)) {
        console.warn('[DataAdapter] 数据验证失败:', value)
        return adapter.defaultValue !== undefined ? adapter.defaultValue : value
      }

      // 转换数据
      return adapter.transform(value, componentConfig)
    } catch (error) {
      console.error('[DataAdapter] 数据转换失败:', error)
      
      // 调用错误处理
      if (adapter.onError) {
        return adapter.onError(error as Error, value)
      }
      
      // 返回默认值
      return adapter.defaultValue !== undefined ? adapter.defaultValue : value
    }
  }

  /**
   * 应用旧版映射配置（向后兼容）
   */
  static applyMapping(value: any, mapping: MappingConfig | undefined): any {
    if (!mapping || mapping.type === 'direct') {
      return value
    }

    switch (mapping.type) {
      case 'boolean':
        return value ? (mapping.trueValue ?? true) : (mapping.falseValue ?? false)

      case 'range':
        if (mapping.rangeRules && Array.isArray(mapping.rangeRules)) {
          const numValue = Number(value)
          for (const rule of mapping.rangeRules) {
            if (numValue >= rule.min && numValue <= rule.max) {
              return rule.value
            }
          }
        }
        return value

      case 'enum':
        if (mapping.enumMappings) {
          return mapping.enumMappings[String(value)] ?? value
        }
        return value

      case 'custom':
        if (mapping.customFunction) {
          try {
            // eslint-disable-next-line no-new-func
            const fn = new Function('value', mapping.customFunction)
            return fn(value)
          } catch (error) {
            console.error('[DataAdapter] 自定义映射函数执行失败:', error)
            return value
          }
        }
        return value

      default:
        return value
    }
  }
}

/**
 * 预设的数据适配器
 */
export const PresetDataAdapters = {
  /**
   * 直传适配器（不做任何转换）
   */
  passthrough: {
    transform: (value: any) => value
  } as ComponentDataAdapter,

  /**
   * 数值适配器（转换为数字）
   */
  number: {
    transform: (value: any) => Number(value),
    validate: (value: any) => !isNaN(Number(value)),
    defaultValue: 0
  } as ComponentDataAdapter,

  /**
   * 字符串适配器
   */
  string: {
    transform: (value: any) => String(value),
    defaultValue: ''
  } as ComponentDataAdapter,

  /**
   * 布尔适配器
   */
  boolean: {
    transform: (value: any) => Boolean(value),
    defaultValue: false
  } as ComponentDataAdapter,

  /**
   * 百分比适配器（0-1 转换为 0-100）
   */
  percentage: {
    transform: (value: any) => Number(value) * 100,
    validate: (value: any) => !isNaN(Number(value)),
    defaultValue: 0
  } as ComponentDataAdapter,

  /**
   * 仪表盘适配器
   */
  gauge: {
    transform: (value: any, config?: any) => {
      const numValue = Number(value)
      return {
        value: numValue,
        min: config?.min ?? 0,
        max: config?.max ?? 100
      }
    },
    validate: (value: any) => !isNaN(Number(value)),
    defaultValue: { value: 0, min: 0, max: 100 }
  } as ComponentDataAdapter,

  /**
   * 颜色映射适配器
   */
  colorMap: {
    transform: (value: any, config?: any) => {
      const numValue = Number(value)
      const ranges = config?.colorRanges || []
      
      for (const range of ranges) {
        if (numValue >= range.min && numValue <= range.max) {
          return range.color
        }
      }
      
      return config?.defaultColor || '#000000'
    },
    validate: (value: any) => !isNaN(Number(value))
  } as ComponentDataAdapter
}
