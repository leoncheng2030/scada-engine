/**
 * 节点操作工具类
 * 负责节点的增删改查、选择等操作
 */

import type { Graph, Node } from '@antv/x6'
import { componentRegistry } from '../scada-components'
import { randomPosition } from './commonUtils'
import { animationEngine } from './animationEngine'

/**
 * 节点操作工具类
 */
export class NodeOperations {
  private graph: Graph | null = null
  private componentCounters: Record<string, number> = {}

  /**
   * 设置 Graph 实例
   */
  setGraph(graph: Graph | null) {
    this.graph = graph
  }

  /**
   * 生成组件默认名称
   */
  generateComponentName(componentType: string, componentName: string): string {
    if (!this.componentCounters[componentType]) {
      this.componentCounters[componentType] = 0
    }
    this.componentCounters[componentType]++
    return `${componentName}_${this.componentCounters[componentType]}`
  }

  /**
   * 添加节点
   */
  addNode(type: string, position?: { x: number; y: number }): Node | null {
    if (!this.graph) return null

    const config = componentRegistry.getComponent(type)
    if (!config) {
      console.error(`未找到组件配置: ${type}`)
      return null
    }

    // 生成默认名称
    const defaultName = this.generateComponentName(type, config.metadata.name)

    // 初始化默认动画配置
    const defaultAnimation = {
      enabled: false,
      type: 'none',
      duration: 1000,
      loop: true
    }

    // 生成随机位置或使用指定位置
    const nodePosition = position || randomPosition(50, 50, 400, 300)

    const nodeConfig: any = {
      x: nodePosition.x,
      y: nodePosition.y,
      shape: config.shape,
      width: config.width,
      height: config.height,
      label: config.label,
      attrs: config.attrs,
      ports: config.ports,
      data: {
        ...config.data,
        componentType: type,
        componentName: defaultName,
        props: config.props,
        animation: defaultAnimation,
        originalStroke: config.attrs?.body?.stroke || '#2563eb',
        originalStrokeWidth: config.attrs?.body?.strokeWidth || 2
      }
    }

    const node = this.graph.addNode(nodeConfig)
    console.log('[Node] 添加节点:', config.shape, node.id, nodeConfig)
    
    return node
  }

  /**
   * 更新节点属性
   */
  updateNode(node: Node, updates: any): void {
    if (!node) return
    
    // 更新 attrs
    if (updates.attrs) {
      Object.keys(updates.attrs).forEach(key => {
        const attrValue = updates.attrs[key]
        if (typeof attrValue === 'object') {
          Object.keys(attrValue).forEach(subKey => {
            node.attr(`${key}/${subKey}`, attrValue[subKey])
          })
        } else {
          node.attr(key, attrValue)
        }
      })
    }
    
    // 更新 position
    if (updates.position) {
      if (typeof updates.position.x === 'number' && typeof updates.position.y === 'number') {
        node.setPosition(updates.position)
      } else {
        console.error('position 数据格式错误:', updates.position)
      }
    }
    
    // 更新 size
    if (updates.size) {
      if (typeof updates.size.width === 'number' && typeof updates.size.height === 'number') {
        node.setSize(updates.size)
      } else {
        console.error('size 数据格式错误:', updates.size)
      }
    }
    
    // 更新 data
    if (updates.data) {
      const cleanedData = { ...updates.data }
      delete cleanedData.position
      delete cleanedData.size
      node.setData(cleanedData)
    }
  }

  /**
   * 删除节点
   */
  deleteNode(nodeId: string): boolean {
    if (!this.graph) return false
    
    // 停止动画
    animationEngine.stopAnimation(nodeId)
    
    try {
      this.graph.removeNode(nodeId)
      return true
    } catch (error) {
      console.error('删除节点失败:', error)
      return false
    }
  }

  /**
   * 选中节点
   */
  selectNode(nodeId: string): boolean {
    if (!this.graph) return false
    const node = this.graph.getCellById(nodeId)
    if (node) {
      this.graph.select(node)
      return true
    }
    return false
  }

  /**
   * 获取节点
   */
  getNodeById(nodeId: string): Node | null {
    if (!this.graph) return null
    const cell = this.graph.getCellById(nodeId)
    if (!cell || !cell.isNode()) return null
    return cell as Node
  }

  /**
   * 获取所有节点
   */
  getAllNodes(): Array<{
    id: string
    type: string
    position: { x: number; y: number }
    size: { width: number; height: number }
    label: string
    data: any
  }> {
    if (!this.graph) return []
    return this.graph.getNodes().map(node => ({
      id: node.id,
      type: node.shape,
      position: node.getPosition(),
      size: node.getSize(),
      label: node.attr('label/text'),
      data: node.getData()
    }))
  }

  /**
   * 复制节点
   */
  cloneNode(node: Node, offset: { x: number; y: number } = { x: 20, y: 20 }): Node | null {
    if (!this.graph) return null
    
    try {
      const clonedNode = node.clone()
      clonedNode.translate(offset.x, offset.y)
      this.graph.addNode(clonedNode)
      return clonedNode
    } catch (error) {
      console.error('复制节点失败:', error)
      return null
    }
  }

  /**
   * 批量删除节点
   */
  deleteNodes(nodeIds: string[]): number {
    if (!this.graph) return 0
    
    let deletedCount = 0
    nodeIds.forEach(nodeId => {
      if (this.deleteNode(nodeId)) {
        deletedCount++
      }
    })
    
    return deletedCount
  }

  /**
   * 节点置于顶层
   */
  bringToFront(nodeId: string): void {
    const node = this.getNodeById(nodeId)
    if (node) {
      node.toFront()
    }
  }

  /**
   * 节点置于底层
   */
  sendToBack(nodeId: string): void {
    const node = this.getNodeById(nodeId)
    if (node) {
      node.toBack()
    }
  }
}

// 导出单例
export const nodeOperations = new NodeOperations()
