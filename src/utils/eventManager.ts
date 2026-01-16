/**
 * Graph 事件管理器
 * 统一管理所有画布事件监听器
 */

import type { Graph, Node, Edge } from '@antv/x6'
import type { Ref } from 'vue'
import { animationEngine } from './animationEngine'
import { contextMenuManager } from './contextMenuManager'
import type { MenuItem } from '../components/ContextMenu.vue'

/**
 * 事件管理器配置
 */
export interface EventManagerConfig {
  // 状态引用
  selectedNode: Ref<any>
  selectedEdge: Ref<any>
  selectedNodesCount: Ref<number>
  contextMenu: Ref<{
    visible: boolean
    position: { x: number; y: number }
    items: MenuItem[]
    targetCell: any
  }>
  
  // 回调函数
  applyEdgeAnimation?: (edge: any, animation: any) => void
}

/**
 * Graph 事件管理器类
 */
export class GraphEventManager {
  private graph: Graph | null = null
  private config: EventManagerConfig | null = null
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null

  /**
   * 初始化事件管理器
   */
  initialize(graph: Graph, config: EventManagerConfig): void {
    this.graph = graph
    this.config = config
    
    // 注册所有事件监听器
    this.registerSelectionEvents()
    this.registerClickEvents()
    this.registerChangeEvents()
    this.registerContextMenuEvents()
    this.registerKeyboardEvents()
  }

  /**
   * 注册选择相关事件
   */
  private registerSelectionEvents(): void {
    if (!this.graph || !this.config) return
    
    const { selectedNode, selectedEdge, selectedNodesCount } = this.config
    
    // 监听 Selection 插件的选中变化事件
    this.graph.on('selection:changed', ({ selected }: any) => {
      // 统计选中的节点数量
      const selectedNodes = selected ? selected.filter((cell: any) => cell.isNode()) : []
      selectedNodesCount.value = selectedNodes.length
      
      if (selected && selected.length > 0) {
        const cell = selected[0]
        // 判断是节点还是连线
        if (cell.isNode()) {
          selectedNode.value = cell
          selectedEdge.value = null
        } else if (cell.isEdge()) {
          // 选中连线，应用高亮样式
          selectedEdge.value = cell
          selectedNode.value = null
          // 保存原始样式
          const originalAttrs = cell.getAttrs()
          cell.data = { ...cell.data, originalAttrs }
          // 应用选中样式：只改变颜色，不改变粗细
          cell.attr('line/stroke', '#3b82f6') // 蓝色高亮
        }
      } else {
        // 取消选中，恢复连线原始样式
        if (selectedEdge.value && selectedEdge.value.data?.originalAttrs) {
          const originalAttrs = selectedEdge.value.data.originalAttrs
          selectedEdge.value.attr('line/stroke', originalAttrs.line?.stroke || '#10b981')
        }
        selectedNode.value = null
        selectedEdge.value = null
      }
    })
  }

  /**
   * 注册点击相关事件
   */
  private registerClickEvents(): void {
    if (!this.graph || !this.config) return
    
    const { selectedNode, selectedEdge } = this.config
    
    // 监听连线点击事件
    this.graph.on('edge:click', ({ edge }: any) => {
      // 选中连线 - 使用 Selection 插件选中
      this.graph!.select(edge)
    })
    
    // 监听画布点击，取消连线选中
    this.graph.on('blank:click', () => {
      selectedEdge.value = null
      selectedNode.value = null
    })
  }

  /**
   * 注册变化监听事件
   */
  private registerChangeEvents(): void {
    if (!this.graph || !this.config) return
    
    // 监听节点移动事件
    this.graph.on('node:change:position', () => {
      // 节点位置改变时，Vue 的 watch 会自动处理更新
    })

    // 监听节点尺寸变化事件
    this.graph.on('node:change:size', () => {
      // 节点尺寸改变时,Vue 的 watch 会自动处理更新
    })
    
    // 监听节点数据变化 - 检测动画配置变化并启动动画
    this.graph.on('node:change:data', ({ node }: any) => {
      const nodeData = node.getData()
      if (nodeData.animation) {
        // 检查是否启用动画
        if (nodeData.animation.enabled === true) {
          const animationConfig = {
            type: nodeData.animation.type || 'none',
            duration: nodeData.animation.duration || 1000,
            loop: nodeData.animation.loop !== false
          }
          // 启动或更新动画
          animationEngine.startAnimation(node, animationConfig)
        } else {
          // 如果禁用了动画，停止动画
          animationEngine.stopAnimation(node.id)
        }
      }
    })
    
    // 监听连线数据变化 - 检测动画配置变化并应用动画
    this.graph.on('edge:change:data', ({ edge }: any) => {
      const edgeData = edge.getData()
      if (edgeData?.animation && this.config?.applyEdgeAnimation) {
        this.config.applyEdgeAnimation(edge, edgeData.animation)
      }
    })
  }

  /**
   * 注册右键菜单事件
   */
  private registerContextMenuEvents(): void {
    if (!this.graph || !this.config) return
    
    const { contextMenu } = this.config
    
    // 监听右键菜单事件
    this.graph.on('cell:contextmenu', ({ e, cell }: any) => {
      e.preventDefault()
      
      // 保存目标元素
      contextMenu.value.targetCell = cell
      
      // 设置菜单位置
      contextMenu.value.position = { x: e.clientX, y: e.clientY }
      
      // 根据元素类型生成菜单项（使用 contextMenuManager）
      if (cell.isNode()) {
        contextMenu.value.items = contextMenuManager.getNodeMenuItems()
      } else if (cell.isEdge()) {
        contextMenu.value.items = contextMenuManager.getEdgeMenuItems()
      }
      
      contextMenu.value.visible = true
    })
    
    // 监听画布右键菜单，显示画布操作菜单
    this.graph.on('blank:contextmenu', ({ e }: any) => {
      e.preventDefault()
      
      contextMenu.value.targetCell = null
      contextMenu.value.position = { x: e.clientX, y: e.clientY }
      contextMenu.value.items = contextMenuManager.getCanvasMenuItems()
      contextMenu.value.visible = true
    })
  }

  /**
   * 注册键盘事件
   */
  private registerKeyboardEvents(): void {
    if (!this.graph || !this.config) return
    
    const { selectedNode, selectedEdge } = this.config
    const graph = this.graph
    
    // 监听键盘事件 - Delete 键删除节点或连线
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && graph) {
        if (selectedNode.value) {
          // 删除节点
          const nodeId = selectedNode.value.id
          // 停止动画
          animationEngine.stopAnimation(nodeId)
          graph.removeNode(nodeId)
          selectedNode.value = null
        } else if (selectedEdge.value) {
          // 删除连线
          const edgeId = selectedEdge.value.id
          graph.removeEdge(edgeId)
          selectedEdge.value = null
        }
      }
    }
    
    document.addEventListener('keydown', this.keydownHandler)
  }

  /**
   * 销毁事件管理器，清理所有监听器
   */
  destroy(): void {
    // 移除键盘事件监听器
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler)
      this.keydownHandler = null
    }
    
    // Graph 的事件监听器会随着 graph.dispose() 自动清理
    this.graph = null
    this.config = null
  }
}

/**
 * 导出事件管理器单例
 */
export const graphEventManager = new GraphEventManager()
