/**
 * Canvas 分层渲染管理器
 * 将画布分为多层,优化渲染性能
 * 
 * 图层架构:
 * - 背景层(Background): 网格、背景图片 - 静态,很少更新
 * - 静态层(Static): 不变的节点和连线 - 较少更新
 * - 动画层(Animation): 动画节点 - 高频更新
 * - 交互层(Interaction): 选择框、连线预览 - 用户交互时更新
 * - 高亮层(Highlight): 悬停高亮效果 - 最频繁更新
 */

import type { Graph, Node, Edge } from '@antv/x6'

export enum CanvasLayer {
  BACKGROUND = 'background',
  STATIC = 'static',
  ANIMATION = 'animation',
  INTERACTION = 'interaction',
  HIGHLIGHT = 'highlight'
}

interface LayerConfig {
  zIndex: number
  updateFrequency: 'static' | 'low' | 'medium' | 'high'
  enabled: boolean
}

const DEFAULT_LAYER_CONFIG: Record<CanvasLayer, LayerConfig> = {
  [CanvasLayer.BACKGROUND]: {
    zIndex: 0,
    updateFrequency: 'static',
    enabled: true
  },
  [CanvasLayer.STATIC]: {
    zIndex: 1,
    updateFrequency: 'low',
    enabled: true
  },
  [CanvasLayer.ANIMATION]: {
    zIndex: 2,
    updateFrequency: 'high',
    enabled: true
  },
  [CanvasLayer.INTERACTION]: {
    zIndex: 3,
    updateFrequency: 'medium',
    enabled: true
  },
  [CanvasLayer.HIGHLIGHT]: {
    zIndex: 4,
    updateFrequency: 'high',
    enabled: true
  }
}

export class CanvasLayerManager {
  private graph: Graph | null = null
  private layers = new Map<CanvasLayer, HTMLCanvasElement>()
  private layerConfig = { ...DEFAULT_LAYER_CONFIG }
  private containerElement: HTMLElement | null = null
  
  // 脏标记 - 标记哪些层需要重绘
  private dirtyLayers = new Set<CanvasLayer>()
  private renderScheduled = false
  
  // 节点分类缓存
  private staticNodes = new Set<string>()
  private animationNodes = new Set<string>()

  /**
   * 初始化分层系统
   */
  init(graph: Graph, container: HTMLElement): void {
    this.graph = graph
    this.containerElement = container
    
    // 创建各图层 Canvas
    Object.values(CanvasLayer).forEach(layer => {
      this.createLayer(layer as CanvasLayer)
    })
    
    // 监听 Graph 事件
    this.attachEventListeners()
    
    console.log('[CanvasLayerManager] 分层渲染已启用')
    
    // 初始渲染
    this.markDirty(CanvasLayer.BACKGROUND)
    this.markDirty(CanvasLayer.STATIC)
    this.scheduleRender()
  }

  /**
   * 创建图层 Canvas
   */
  private createLayer(layer: CanvasLayer): void {
    const canvas = document.createElement('canvas')
    const config = this.layerConfig[layer]
    
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = String(config.zIndex)
    
    // 设置 Canvas 尺寸
    if (this.containerElement) {
      const rect = this.containerElement.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }
    
    this.layers.set(layer, canvas)
    
    // 添加到容器
    if (this.containerElement) {
      this.containerElement.appendChild(canvas)
    }
  }

  /**
   * 附加事件监听器
   */
  private attachEventListeners(): void {
    if (!this.graph) return
    
    // 节点变化
    this.graph.on('node:added', () => this.markDirty(CanvasLayer.STATIC))
    this.graph.on('node:removed', () => this.markDirty(CanvasLayer.STATIC))
    this.graph.on('node:change:position', () => this.markDirty(CanvasLayer.STATIC))
    this.graph.on('node:change:size', () => this.markDirty(CanvasLayer.STATIC))
    
    // 连线变化
    this.graph.on('edge:added', () => this.markDirty(CanvasLayer.STATIC))
    this.graph.on('edge:removed', () => this.markDirty(CanvasLayer.STATIC))
    
    // 画布变换
    this.graph.on('translate', () => {
      this.markDirty(CanvasLayer.STATIC)
      this.markDirty(CanvasLayer.ANIMATION)
    })
    this.graph.on('scale', () => {
      this.markDirty(CanvasLayer.STATIC)
      this.markDirty(CanvasLayer.ANIMATION)
    })
    
    // 选择变化
    this.graph.on('selection:changed', () => this.markDirty(CanvasLayer.INTERACTION))
    
    // 鼠标悬停
    this.graph.on('node:mouseenter', () => this.markDirty(CanvasLayer.HIGHLIGHT))
    this.graph.on('node:mouseleave', () => this.markDirty(CanvasLayer.HIGHLIGHT))
  }

  /**
   * 标记图层为脏(需要重绘)
   */
  markDirty(layer: CanvasLayer): void {
    this.dirtyLayers.add(layer)
    this.scheduleRender()
  }

  /**
   * 调度渲染
   */
  private scheduleRender(): void {
    if (this.renderScheduled) return
    
    this.renderScheduled = true
    requestAnimationFrame(() => {
      this.render()
      this.renderScheduled = false
    })
  }

  /**
   * 渲染所有脏图层
   */
  private render(): void {
    const startTime = performance.now()
    let renderedLayers = 0
    
    this.dirtyLayers.forEach(layer => {
      if (this.renderLayer(layer)) {
        renderedLayers++
      }
    })
    
    this.dirtyLayers.clear()
    
    const duration = performance.now() - startTime
    if (duration > 16 && renderedLayers > 0) {
      console.warn(
        `[CanvasLayerManager] 渲染 ${renderedLayers} 层耗时 ${duration.toFixed(2)}ms`
      )
    }
  }

  /**
   * 渲染单个图层
   */
  private renderLayer(layer: CanvasLayer): boolean {
    const canvas = this.layers.get(layer)
    if (!canvas || !this.layerConfig[layer].enabled) {
      return false
    }
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 根据图层类型渲染不同内容
    switch (layer) {
      case CanvasLayer.BACKGROUND:
        this.renderBackground(ctx, canvas)
        break
        
      case CanvasLayer.STATIC:
        this.renderStatic(ctx, canvas)
        break
        
      case CanvasLayer.ANIMATION:
        this.renderAnimation(ctx, canvas)
        break
        
      case CanvasLayer.INTERACTION:
        this.renderInteraction(ctx, canvas)
        break
        
      case CanvasLayer.HIGHLIGHT:
        this.renderHighlight(ctx, canvas)
        break
    }
    
    return true
  }

  /**
   * 渲染背景层
   */
  private renderBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // 示例:绘制网格
    const gridSize = 20
    const scale = window.devicePixelRatio
    
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    
    for (let x = 0; x < canvas.width; x += gridSize * scale) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    
    for (let y = 0; y < canvas.height; y += gridSize * scale) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
  }

  /**
   * 渲染静态层
   */
  private renderStatic(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // 注意:这里只是示例框架
    // 实际渲染需要访问 X6 的渲染 API 或自定义渲染逻辑
    // 因为 X6 自身已经使用 SVG 渲染,这里主要用于性能监控和优化标记
    
    if (!this.graph) return
    
    const nodes = this.graph.getNodes()
    nodes.forEach(node => {
      if (!this.animationNodes.has(node.id)) {
        // 绘制静态节点的简化表示(实际由 X6 渲染)
        // 这里只是标记为已处理
        this.staticNodes.add(node.id)
      }
    })
  }

  /**
   * 渲染动画层
   */
  private renderAnimation(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    if (!this.graph) return
    
    // 仅渲染有动画的节点
    this.animationNodes.forEach(nodeId => {
      const node = this.graph?.getCellById(nodeId) as Node
      if (node) {
        // 实际渲染由 X6 处理,这里只做标记
      }
    })
  }

  /**
   * 渲染交互层
   */
  private renderInteraction(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // 绘制选择框、连线预览等交互元素
  }

  /**
   * 渲染高亮层
   */
  private renderHighlight(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // 绘制悬停高亮效果
  }

  /**
   * 标记节点为动画节点
   */
  markAsAnimation(nodeId: string): void {
    this.animationNodes.add(nodeId)
    this.staticNodes.delete(nodeId)
    this.markDirty(CanvasLayer.ANIMATION)
  }

  /**
   * 标记节点为静态节点
   */
  markAsStatic(nodeId: string): void {
    this.staticNodes.add(nodeId)
    this.animationNodes.delete(nodeId)
    this.markDirty(CanvasLayer.STATIC)
  }

  /**
   * 获取性能统计
   */
  getStats(): {
    staticNodes: number
    animationNodes: number
    dirtyLayers: number
  } {
    return {
      staticNodes: this.staticNodes.size,
      animationNodes: this.animationNodes.size,
      dirtyLayers: this.dirtyLayers.size
    }
  }

  /**
   * 销毁分层系统
   */
  destroy(): void {
    // 移除所有图层
    this.layers.forEach(canvas => {
      canvas.remove()
    })
    
    this.layers.clear()
    this.dirtyLayers.clear()
    this.staticNodes.clear()
    this.animationNodes.clear()
    
    this.graph = null
    this.containerElement = null
    
    console.log('[CanvasLayerManager] 分层渲染已销毁')
  }
}

// 导出单例
export const canvasLayerManager = new CanvasLayerManager()

// 开发模式调试
if (import.meta.env.DEV) {
  ;(window as any).__canvasLayerManager__ = canvasLayerManager
  console.log('💡 开发模式: 可通过 window.__canvasLayerManager__ 访问分层渲染管理器')
}
