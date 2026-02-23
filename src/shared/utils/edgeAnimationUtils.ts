/**
 * 边动画工具函数
 * 提供统一的边动画应用逻辑，确保编辑模式和预览模式效果一致
 */

import type { Edge } from '@antv/x6'

/**
 * 边动画配置接口
 */
export interface EdgeAnimationConfig {
  enabled: boolean
  duration?: number
  type?: string
}

/**
 * 应用边动画
 * @param edge X6 边对象
 * @param animation 动画配置
 */
export function applyEdgeAnimation(edge: Edge, animation: EdgeAnimationConfig): void {
  // 安全检查：确保 edge 存在且是有效对象
  if (!edge || typeof edge.attr !== 'function') {
    console.warn('[EdgeAnimation] edge 对象无效', edge)
    return
  }
  
  if (!animation || !animation.enabled) {
    // 关闭动画
    edge.attr('line/strokeDasharray', undefined)
    // 移除光点
    edge.attr('circle', undefined)
    if (typeof edge.stopTransition === 'function') {
      edge.stopTransition('attrs/circle/atConnectionRatio')
    }
    return
  }
  
  // 使用光点流动动画
  const duration = animation.duration || 2000 // 默认2秒
  
  // 获取line层的strokeWidth，作为小球的半径
  const lineWidth = Number(edge.attr('line/strokeWidth')) || 4
  const circleRadius = Math.max(lineWidth * 0.6, 3) // 小球半径 = line宽度的 60%，最小 3px
  
  // 设置光点样式（更加明显）
  edge.attr('circle', {
    r: circleRadius,
    atConnectionRatio: 0,
    fill: {
      type: 'radialGradient',
      stops: [
        { offset: '0%', color: '#FFFFFF' },      // 中心白色
        { offset: '50%', color: '#FFF59D' },     // 淡黄色
        { offset: '100%', color: edge.attr('line/stroke') || '#10b981' }
      ]
    },
    stroke: '#FFFFFF',              // 白色边框，更明显
    strokeWidth: 1.5,               // 边框稍宽一些
    opacity: 0.95                   // 轻微透明
  })
  
  // 开始动画
  const startAnimation = () => {
    edge.attr('circle/atConnectionRatio', 0, { silent: true })
    edge.transition('attrs/circle/atConnectionRatio', 1, {
      delay: 0,
      duration: duration,
      timing: 'linear',
      complete: () => {
        // 循环动画
        startAnimation()
      }
    })
  }
  startAnimation()
}
