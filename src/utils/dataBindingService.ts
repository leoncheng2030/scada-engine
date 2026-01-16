/**
 * 数据绑定服务
 * 负责数据源与组件之间的绑定、映射、同步等逻辑
 */

import type { Graph } from '@antv/x6'
import { dataSourceManager } from '../services/dataSourceManager'

/**
 * 映射配置接口
 */
interface MappingConfig {
  type: 'direct' | 'boolean' | 'range' | 'enum'
  trueValue?: any
  falseValue?: any
  rangeRules?: Array<{ min: number; max: number; value: any }>
  enumMappings?: Record<string, any>
}

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
  }

  /**
   * 初始化数据绑定监听
   */
  initDataBinding(): void {
    if (this.dataCallbackRegistered) return
    
    // 监听数据源数据更新，自动同步到绑定的组件
    dataSourceManager.onData((dataSourceId: string, deviceData: any) => {
      this.syncDataToNodes(dataSourceId, deviceData)
    })
    
    this.dataCallbackRegistered = true
  }

  /**
   * 同步数据到节点
   */
  private syncDataToNodes(dataSourceId: string, deviceData: any): void {
    if (!this.graph) return
    
    // 遍历所有节点，查找绑定了该设备的节点
    const nodes = this.graph.getNodes()
    nodes.forEach(node => {
      const nodeData = node.getData()
      if (!nodeData || !nodeData.dataBinding) return
      
      // 检查是否绑定了该数据源和设备
      if (
        nodeData.dataBinding.dataSourceId === dataSourceId &&
        nodeData.dataBinding.deviceId === deviceData.id
      ) {
        this.updateNodeFromDeviceData(node, nodeData, deviceData)
      }
    })
  }

  /**
   * 根据设备数据更新节点
   */
  private updateNodeFromDeviceData(node: any, nodeData: any, deviceData: any): void {
    // 检查是否有点位绑定
    if (!nodeData.bindings || !Array.isArray(nodeData.bindings)) return
    
    let updated = false
    
    // 遍历所有绑定
    nodeData.bindings.forEach((binding: any) => {
      if (!binding.devicePointId) return
      
      // 解析 devicePointId (deviceId:pointId 格式)
      const parts = binding.devicePointId.split(':')
      const pointId = parts.length === 2 ? parts[1] : binding.devicePointId
      
      // 查找对应的点位数据
      const point = deviceData.points?.find((p: any) => p.id === pointId)
      if (!point || point.value === undefined) return
      
      // 应用映射（如果有）
      let mappedValue = point.value
      if (binding.mapping) {
        mappedValue = this.applyMapping(point.value, binding.mapping)
      }
      
      // 更新节点属性
      if (binding.targetProperty === 'value') {
        nodeData.value = mappedValue
        updated = true
      } else {
        nodeData[binding.targetProperty] = mappedValue
        updated = true
      }
    })
    
    // 如果有更新，触发节点数据更新
    if (updated) {
      // 创建新对象以确保引用变化
      const newData = JSON.parse(JSON.stringify(nodeData))
      node.setData(newData, { overwrite: true })
      
      // 手动触发 X6 的 change:data 事件
      node.trigger('change:data', { current: newData, previous: nodeData })
    }
  }

  /**
   * 应用映射规则
   */
  private applyMapping(value: any, mapping: MappingConfig): any {
    if (!mapping || mapping.type === 'direct') {
      return value
    }
    
    switch (mapping.type) {
      case 'boolean':
        return value ? (mapping.trueValue ?? true) : (mapping.falseValue ?? false)
      
      case 'range':
        if (mapping.rangeRules && Array.isArray(mapping.rangeRules)) {
          for (const rule of mapping.rangeRules) {
            const numValue = Number(value)
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
      
      default:
        return value
    }
  }

  /**
   * 手动更新设备数据（用于外部传入的设备数据）
   */
  updateDeviceData(deviceData: any): void {
    if (!this.graph || !deviceData?.devices) return
    
    deviceData.devices.forEach((device: any) => {
      device.points?.forEach((point: any) => {
        // 遍历画布上的所有节点，查找与设备点位绑定的节点
        this.graph!.getNodes().forEach((node: any) => {
          const nodeData = node.getData()
          // 检查节点是否有绑定配置
          if (nodeData?.bindings) {
            Object.entries(nodeData.bindings).forEach(([attribute, binding]: [string, any]) => {
              if (binding.deviceId === device.id && binding.dataPoint === point.id) {
                // 更新节点的相应属性
                const value = point.value
                
                // 特殊处理文本节点
                if (attribute === 'attrs/text/text') {
                  node.attr('text/text', value)
                }
                // 特殊处理颜色节点
                else if (attribute === 'attrs/body/fill') {
                  node.attr('body/fill', value)
                }
                // 其他属性更新
                else {
                  // 根据绑定的属性路径更新节点
                  const keys = attribute.split('.')
                  let target: any = node
                  for (let i = 0; i < keys.length - 1; i++) {
                    target = target[keys[i]]
                  }
                  const lastKey = keys[keys.length - 1]
                  if (target && lastKey) {
                    target[lastKey] = value
                  }
                }
              }
            })
          }
        })
      })
    })
  }

  /**
   * 获取节点的绑定配置
   */
  getNodeBindings(nodeId: string): any[] {
    if (!this.graph) return []
    
    const node = this.graph.getCellById(nodeId)
    if (!node || !node.isNode()) return []
    
    const nodeData = node.getData()
    return nodeData?.bindings || []
  }

  /**
   * 更新节点的绑定配置
   */
  updateNodeBindings(nodeId: string, bindings: any[]): boolean {
    if (!this.graph) return false
    
    const node = this.graph.getCellById(nodeId)
    if (!node || !node.isNode()) return false
    
    const nodeData = node.getData()
    node.setData({
      ...nodeData,
      bindings
    })
    
    return true
  }
}

// 导出单例
export const dataBindingService = new DataBindingService()
