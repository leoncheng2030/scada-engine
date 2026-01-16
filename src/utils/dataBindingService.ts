/**
 * 数据绑定服务（新架构）
 * 
 * 核心流程：
 * 1. 后端按组件定义的点位格式返回数据: { liquid_level: 75.5, temperature: 28.3, ... }
 * 2. 根据绑定配置获取点位数据: liquid_level → 75.5
 * 3. 应用值映射转换: 75.5 → 根据mapping配置转换
 * 4. 更新组件属性: level = 转换后的值
 */

import type { Graph, Node } from '@antv/x6'
import { dataSourceManager } from '../services/dataSourceManager'
import { MappingType, type BindingConfig, type MappingConfig } from '../types/binding'

/**
 * 数据绑定服务类
 */
export class DataBindingService {
  private graph: Graph | null = null
  private dataCallbackRegistered = false

  /**
   * 设置 Graph 实例
   */
  setGraph(graph: Graph | null) {
    this.graph = graph
    
    // 设置后自动初始化数据绑定
    if (graph && !this.dataCallbackRegistered) {
      this.initDataBinding()
    }
  }

  /**
   * 初始化数据绑定监听
   */
  private initDataBinding(): void {
    if (this.dataCallbackRegistered) return
    
    console.log('[DataBindingService] 初始化数据绑定监听')
    
    // 监听数据源数据更新
    dataSourceManager.onData((dataSourceId: string, rawData: any) => {
      this.handleDataUpdate(dataSourceId, rawData)
    })
    
    this.dataCallbackRegistered = true
  }

  /**
   * 处理数据源更新
   */
  private handleDataUpdate(dataSourceId: string, rawData: any): void {
    if (!this.graph) {
      console.warn('[DataBindingService] Graph 未初始化')
      return
    }
      
    // 遍历所有节点，查找绑定了该数据源的节点
    const nodes = this.graph.getNodes()
      
    nodes.forEach(node => {
      this.updateNodeData(node, dataSourceId, rawData)
    })
  }

  /**
   * 更新单个节点的数据
   */
  private updateNodeData(node: Node, dataSourceId: string, rawData: any): boolean {
    const nodeData = node.getData()
    
    // 检查节点是否有数据绑定配置
    if (!nodeData?.dataBinding || nodeData.dataBinding.dataSourceId !== dataSourceId) {
      return false
    }
    
    // 检查是否有绑定列表
    if (!nodeData.bindings || !Array.isArray(nodeData.bindings) || nodeData.bindings.length === 0) {
      return false
    }
    
    // 处理该节点的所有绑定
    let hasUpdates = false
    const updates: Record<string, any> = {}
    
    nodeData.bindings.forEach((binding: BindingConfig) => {
      // 跳过禁用的绑定
      if (!binding.enabled && binding.enabled !== undefined) return
      
      // 跳过无效的绑定（缺少点位ID或目标属性）
      if (!binding.devicePointId || !binding.targetProperty) {
        return
      }
      
      try {
        // 步骤1：获取点位数据
        const pointValue = this.extractPointValue(rawData, binding.devicePointId)
        if (pointValue === undefined || pointValue === null) {
          // 静默跳过，不打印警告（可能是数据还未到达）
          return
        }
        
        // 步骤2：应用值映射转换
        const mappedValue = this.applyValueMapping(pointValue, binding.mapping)
        
        // 步骤3：更新目标属性
        updates[binding.targetProperty] = mappedValue
        hasUpdates = true
      } catch (error) {
        console.error('[DataBindingService] 绑定处理错误:', error, binding)
      }
    })
    
    // 如果有更新，应用到节点
    if (hasUpdates) {
      this.applyUpdatesToNode(node, updates)
      return true
    }
    
    return false
  }

  /**
   * 从原始数据中提取点位值
   * 
   * @param rawData 原始数据（后端返回的JSON）
   * @param pointId 点位ID（如 "liquid_level"）
   * @returns 点位值
   */
  private extractPointValue(rawData: any, pointId: string | undefined): any {
    if (!pointId || !rawData) return undefined
    
    // 格式1：简化点位数组 [{ id, value }, ...]（优先支持）
    if (Array.isArray(rawData)) {
      const point = rawData.find((p: any) => p.id === pointId)
      if (point && point.value !== undefined) {
        return point.value
      }
    }
    
    // 格式2：直接扩展对象 { liquid_level: 75.5, temperature: 28.3, ... }
    if (rawData[pointId] !== undefined) {
      return rawData[pointId]
    }
    
    // 格式3：嵌套结构 { devices: [{ points: [{ id: "value", value: 75.5 }] }] }
    if (rawData.devices && Array.isArray(rawData.devices)) {
      // 遍历所有设备
      for (const device of rawData.devices) {
        if (device.points && Array.isArray(device.points)) {
          // 遍历设备的所有点位
          for (const point of device.points) {
            if (point.id === pointId) {
              return point.value
            }
          }
        }
      }
    }
    
    return undefined
  }

  /**
   * 应用值映射转换
   * 
   * @param value 原始值
   * @param mapping 映射配置
   * @returns 转换后的值
   */
  private applyValueMapping(value: any, mapping: MappingConfig | undefined): any {
    if (!mapping || mapping.type === MappingType.DIRECT) {
      return value
    }
    
    try {
      switch (mapping.type) {
        case MappingType.BOOLEAN:
          return this.applyBooleanMapping(value, mapping)
        
        case MappingType.RANGE:
          return this.applyRangeMapping(value, mapping)
        
        case MappingType.ENUM:
          return this.applyEnumMapping(value, mapping)
        
        default:
          console.warn(`[DataBindingService] 未知的映射类型: ${mapping.type}`)
          return value
      }
    } catch (error) {
      console.error('[DataBindingService] 值映射错误:', error, { value, mapping })
      return value
    }
  }

  /**
   * 布尔映射
   */
  private applyBooleanMapping(value: any, mapping: MappingConfig): any {
    const boolValue = Boolean(value)
    return boolValue ? mapping.trueValue : mapping.falseValue
  }

  /**
   * 范围映射
   */
  private applyRangeMapping(value: any, mapping: MappingConfig): any {
    const numValue = Number(value)
    if (isNaN(numValue)) return value
    
    // 检查范围规则
    if (mapping.rangeRules && Array.isArray(mapping.rangeRules)) {
      for (const rule of mapping.rangeRules) {
        const min = rule.min !== undefined ? Number(rule.min) : -Infinity
        const max = rule.max !== undefined ? Number(rule.max) : Infinity
        
        if (numValue >= min && numValue <= max) {
          return rule.value  // 使用 value 而不是 output
        }
      }
    }
    
    return value
  }

  /**
   * 枚举映射
   */
  private applyEnumMapping(value: any, mapping: MappingConfig): any {
    if (!mapping.enumMappings) return value
    
    const strValue = String(value)
    return mapping.enumMappings[strValue] !== undefined 
      ? mapping.enumMappings[strValue] 
      : value
  }

  /**
   * 应用更新到节点
   */
  private applyUpdatesToNode(node: Node, updates: Record<string, any>): void {
    const nodeData = node.getData()
    
    // 更新 data 对象中的属性
    const newData = {
      ...nodeData,
      ...updates
    }
    
    // 更新节点数据
    node.setData(newData, { overwrite: true })
    
    // 触发变更事件（用于响应式更新）
    node.trigger('change:data', { current: newData, previous: nodeData })
  }

  /**
   * 获取节点的绑定配置
   */
  getNodeBindings(nodeId: string): BindingConfig[] {
    if (!this.graph) return []
    
    const node = this.graph.getCellById(nodeId) as Node
    if (!node || !node.isNode()) return []
    
    const nodeData = node.getData()
    return nodeData?.bindings || []
  }

  /**
   * 更新节点的绑定配置
   */
  updateNodeBindings(nodeId: string, bindings: BindingConfig[]): boolean {
    if (!this.graph) return false
    
    const node = this.graph.getCellById(nodeId) as Node
    if (!node || !node.isNode()) return false
    
    const nodeData = node.getData()
    node.setData({
      ...nodeData,
      bindings
    })
    
    console.log(`[DataBindingService] 更新节点 ${nodeId} 的绑定配置:`, bindings)
    
    return true
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.graph = null
    this.dataCallbackRegistered = false
    console.log('[DataBindingService] 服务已销毁')
  }
}

// 导出单例
export const dataBindingService = new DataBindingService()
