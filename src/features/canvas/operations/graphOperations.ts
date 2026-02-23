/**
 * X6 画布操作工具类
 * 负责画布的对齐、分布、缩放等操作
 */

import type { Graph, Node } from '@antv/x6'
import { showMessage } from '../../../shared/utils/messageUtils'
import { canvasConfigManager } from '../../../scada-components/canvas'

/**
 * 画布操作工具类
 */
export class GraphOperations {
  private graph: Graph | null = null

  /**
   * 设置 Graph 实例
   */
  setGraph(graph: Graph | null) {
    this.graph = graph
  }

  /**
   * 获取 Graph 实例
   */
  getGraph(): Graph | null {
    return this.graph
  }

  /**
   * 放大画布
   */
  zoomIn(): void {
    if (!this.graph) return
    const currentScale = canvasConfigManager.getConfig().zoom.scale
    const newScale = Math.min(5, currentScale + 0.1)
    canvasConfigManager.setZoom(newScale)
  }

  /**
   * 缩小画布
   */
  zoomOut(): void {
    if (!this.graph) return
    const currentScale = canvasConfigManager.getConfig().zoom.scale
    const newScale = Math.max(0.1, currentScale - 0.1)
    canvasConfigManager.setZoom(newScale)
  }

  /**
   * 设置缩放比例
   */
  setZoom(scale: number): void {
    if (!this.graph) return
    const clampedScale = Math.max(0.1, Math.min(5, scale))
    canvasConfigManager.setZoom(clampedScale)
  }

  /**
   * 清空画布
   */
  clearAll(onConfirm?: () => void): void {
    if (!this.graph) return
    if (confirm('确定要清空画布吗？')) {
      this.graph.clearCells()
      onConfirm?.()
      showMessage('画布已清空', 'success')
    }
  }

  /**
   * 获取选中的节点列表
   */
  private getSelectedNodes(): Node[] {
    if (!this.graph) return []
    return this.graph.getSelectedCells().filter(cell => cell.isNode()) as Node[]
  }

  /**
   * 验证选中节点数量
   */
  private validateSelection(minCount: number, message: string): Node[] | null {
    const selectedNodes = this.getSelectedNodes()
    if (selectedNodes.length < minCount) {
      showMessage(message, 'warning')
      return null
    }
    return selectedNodes
  }

  /**
   * 左对齐
   */
  alignLeft(): void {
    const nodes = this.validateSelection(2, '请选择至少两个节点')
    if (!nodes) return

    const minX = Math.min(...nodes.map(node => node.getPosition().x))
    nodes.forEach(node => {
      node.setPosition({ x: minX, y: node.getPosition().y })
    })
  }

  /**
   * 水平居中对齐
   */
  alignCenter(): void {
    const nodes = this.validateSelection(2, '请选择至少两个节点')
    if (!nodes) return

    const centerXs = nodes.map(node => node.getPosition().x + node.getSize().width / 2)
    const avgCenterX = centerXs.reduce((sum, x) => sum + x, 0) / centerXs.length
    
    nodes.forEach(node => {
      const newX = avgCenterX - node.getSize().width / 2
      node.setPosition({ x: newX, y: node.getPosition().y })
    })
  }

  /**
   * 右对齐
   */
  alignRight(): void {
    const nodes = this.validateSelection(2, '请选择至少两个节点')
    if (!nodes) return

    const maxRight = Math.max(...nodes.map(node => node.getPosition().x + node.getSize().width))
    nodes.forEach(node => {
      const newX = maxRight - node.getSize().width
      node.setPosition({ x: newX, y: node.getPosition().y })
    })
  }

  /**
   * 顶部对齐
   */
  alignTop(): void {
    const nodes = this.validateSelection(2, '请选择至少两个节点')
    if (!nodes) return

    const minY = Math.min(...nodes.map(node => node.getPosition().y))
    nodes.forEach(node => {
      node.setPosition({ x: node.getPosition().x, y: minY })
    })
  }

  /**
   * 垂直居中对齐
   */
  alignMiddle(): void {
    const nodes = this.validateSelection(2, '请选择至少两个节点')
    if (!nodes) return

    const centerYs = nodes.map(node => node.getPosition().y + node.getSize().height / 2)
    const avgCenterY = centerYs.reduce((sum, y) => sum + y, 0) / centerYs.length
    
    nodes.forEach(node => {
      const newY = avgCenterY - node.getSize().height / 2
      node.setPosition({ x: node.getPosition().x, y: newY })
    })
  }

  /**
   * 底部对齐
   */
  alignBottom(): void {
    const nodes = this.validateSelection(2, '请选择至少两个节点')
    if (!nodes) return

    const maxBottom = Math.max(...nodes.map(node => node.getPosition().y + node.getSize().height))
    nodes.forEach(node => {
      const newY = maxBottom - node.getSize().height
      node.setPosition({ x: node.getPosition().x, y: newY })
    })
  }

  /**
   * 横向分布
   */
  distributeHorizontal(): void {
    const nodes = this.validateSelection(3, '请选择至少三个节点')
    if (!nodes) return

    // 按X坐标排序
    const sorted = nodes.sort((a, b) => a.getPosition().x - b.getPosition().x)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const totalWidth = last.getPosition().x - first.getPosition().x
    const gap = totalWidth / (sorted.length - 1)
    
    sorted.forEach((node, index) => {
      if (index === 0 || index === sorted.length - 1) return // 保持首尾不动
      const newX = first.getPosition().x + gap * index
      node.setPosition({ x: newX, y: node.getPosition().y })
    })
  }

  /**
   * 纵向分布
   */
  distributeVertical(): void {
    const nodes = this.validateSelection(3, '请选择至少三个节点')
    if (!nodes) return

    // 按Y坐标排序
    const sorted = nodes.sort((a, b) => a.getPosition().y - b.getPosition().y)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const totalHeight = last.getPosition().y - first.getPosition().y
    const gap = totalHeight / (sorted.length - 1)
    
    sorted.forEach((node, index) => {
      if (index === 0 || index === sorted.length - 1) return // 保持首尾不动
      const newY = first.getPosition().y + gap * index
      node.setPosition({ x: node.getPosition().x, y: newY })
    })
  }

  /**
   * 全选节点
   */
  selectAll(): void {
    if (!this.graph) return
    this.graph.select(this.graph.getNodes())
  }

  /**
   * 清除选择
   */
  clearSelection(): void {
    if (!this.graph) return
    this.graph.unselect(this.graph.getSelectedCells())
  }

  /**
   * 计算适合的缩放比例
   */
  calculateFitScale(containerWidth: number, containerHeight: number): number {
    const canvasConfig = canvasConfigManager.getConfig()
    const canvasWidth = canvasConfig.size.width
    const canvasHeight = canvasConfig.size.height
    
    // 留出一些边距（40px）
    const padding = 40
    const availableWidth = containerWidth - padding
    const availableHeight = containerHeight - padding
    
    // 计算宽度和高度的缩放比例
    const scaleX = availableWidth / canvasWidth
    const scaleY = availableHeight / canvasHeight
    
    // 取较小的比例，确保画布完全可见
    return Math.min(scaleX, scaleY, 1) // 最大不超过1（100%）
  }
}

// 导出单例
export const graphOperations = new GraphOperations()
