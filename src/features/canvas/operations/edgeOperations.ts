/**
 * 边操作工具类
 * 负责边的动画、更新、删除等操作
 */

import type { Graph, Edge } from '@antv/x6'
import { applyEdgeAnimation as applyEdgeAnimationUtil, type EdgeAnimationConfig } from '../../../shared/utils/edgeAnimationUtils'

export type { EdgeAnimationConfig }

/**
 * 边操作工具类
 */
export class EdgeOperations {
  private graph: Graph | null = null

  /**
   * 设置 Graph 实例
   */
  setGraph(graph: Graph | null) {
    this.graph = graph
  }

  /**
   * 应用边动画（委托给公共工具函数）
   */
  applyEdgeAnimation(edge: Edge, animation: EdgeAnimationConfig): void {
    applyEdgeAnimationUtil(edge, animation)
  }

  /**
   * 更新边属性
   */
  updateEdge(edge: Edge, updates: any): void {
    if (!edge) return
    
    // 如果需要更改 shape，需要删除旧边并创建新边
    if (updates.shape && updates.shape !== edge.shape) {
      if (!this.graph) return
      
      // 保存当前边的信息
      const source = edge.getSourceCell()
      const target = edge.getTargetCell()
      const sourcePortId = edge.getSourcePortId()
      const targetPortId = edge.getTargetPortId()
      const edgeData = edge.getData()
      const router = edge.getRouter()
      const connector = edge.getConnector()
      
      if (!source || !target) return
      
      // 删除旧边
      this.graph.removeEdge(edge.id)
      
      // 创建新边
      const newEdge = this.graph.addEdge({
        shape: updates.shape,
        source: { cell: source.id, port: sourcePortId },
        target: { cell: target.id, port: targetPortId },
        attrs: updates.attrs || {},
        data: updates.data || edgeData,
        router: router,
        connector: connector,
        zIndex: 0
      })
      
      // 选中新边
      this.graph.select(newEdge)
      
      // 如果有动画配置，应用动画
      if (updates.animation || edgeData?.animation) {
        this.applyEdgeAnimation(newEdge, updates.animation || edgeData.animation)
      }
      
      return
    }
    
    // 更新属性
    if (updates.attrs) {
      // 调试日志：记录更新前的状态
      const beforeAttrs = edge.getAttrs()
      if (import.meta.env.DEV) {
        console.log('[EdgeOperations] 更新边属性 - 更新前:', {
          id: edge.id,
          shape: edge.shape,
          before: {
            shadowWidth: beforeAttrs.shadow?.strokeWidth,
            shadowColor: beforeAttrs.shadow?.stroke,
            lineWidth: beforeAttrs.line?.strokeWidth,
            lineColor: beforeAttrs.line?.stroke,
            highlightWidth: beforeAttrs.highlight?.strokeWidth,
            highlightColor: beforeAttrs.highlight?.stroke
          },
          updates: updates.attrs
        })
      }
      
      Object.keys(updates.attrs).forEach(key => {
        const attrValue = updates.attrs[key]
        if (typeof attrValue === 'object') {
          Object.keys(attrValue).forEach(subKey => {
            edge.attr(`${key}/${subKey}`, attrValue[subKey])
          })
        } else {
          edge.attr(key, attrValue)
        }
      })
      
      // 更新边属性后无需重新应用选中效果（因为选中不改变样式）
      const currentAttrs = edge.getAttrs()
      const newData = Object.assign({}, edge.data, { originalAttrs: currentAttrs })
      edge.setData(newData)
      
      if (import.meta.env.DEV) {
        console.log('[EdgeOperations] 更新边属性完成，无需重新应用选中样式')
      }
    }
    
    // 更新路由
    if (updates.router) {
      edge.setRouter(updates.router)
    }
    
    // 更新连接器
    if (updates.connector) {
      edge.setConnector(updates.connector)
    }
    
    // 更新动画配置
    if (updates.animation) {
      this.applyEdgeAnimation(edge, updates.animation)
    }
    
    // 更新data
    if (updates.data) {
      edge.setData(Object.assign({}, edge.data, updates.data))
    }
  }

  /**
   * 删除边
   */
  deleteEdge(edgeId: string): boolean {
    if (!this.graph) return false
    
    try {
      this.graph.removeEdge(edgeId)
      return true
    } catch (error) {
      console.error('删除边失败:', error)
      return false
    }
  }

  /**
   * 获取边
   */
  getEdgeById(edgeId: string): Edge | null {
    if (!this.graph) return null
    const cell = this.graph.getCellById(edgeId)
    if (!cell || !cell.isEdge()) return null
    return cell as Edge
  }

  /**
   * 获取所有边
   */
  getAllEdges(): Array<{
    id: string
    source: string
    target: string
    data: any
  }> {
    if (!this.graph) return []
    return this.graph.getEdges().map(edge => ({
      id: edge.id,
      source: edge.getSourceCellId(),
      target: edge.getTargetCellId(),
      data: edge.getData()
    }))
  }

  /**
   * 应用选中样式
   */
  applySelectedStyle(edge: Edge): void {
    if (!edge) return
    
    // 保存原始样式
    const originalAttrs = edge.getAttrs()
    edge.data = { ...edge.data, originalAttrs }
    
    // 应用选中样式：只改变颜色，不改变粗细
    edge.attr('line/stroke', '#3b82f6') // 蓝色高亮
  }

  /**
   * 恢复原始样式
   */
  restoreOriginalStyle(edge: Edge): void {
    if (!edge || !edge.data?.originalAttrs) return
    
    const originalAttrs = edge.data.originalAttrs
    edge.attr('line/stroke', originalAttrs.line?.stroke || '#10b981')
  }

  /**
   * 恢复所有边的动画（用于加载画布数据后）
   */
  restoreAllEdgeAnimations(): void {
    if (!this.graph) return
    
    this.graph.getEdges().forEach((edge: Edge) => {
      const edgeData = edge.getData()
      if (edgeData?.animation?.enabled) {
        this.applyEdgeAnimation(edge, edgeData.animation)
      }
    })
  }
}

// 导出单例
export const edgeOperations = new EdgeOperations()
