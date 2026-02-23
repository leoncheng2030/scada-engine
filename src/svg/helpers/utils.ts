/**
 * SVG 组件系统工具函数
 */

import { svgLoader } from '../core/loader'
import type { AnimationTemplateType } from '../core/types'

/**
 * 从目录批量加载示例 SVG 组件
 */
export async function loadExampleSvgComponents(): Promise<void> {
  if (import.meta.env.DEV) {
    console.log('[SVG Utils] 开始加载示例 SVG 组件...')
  }
  
  try {
    // 使用 Vite 的 import.meta.glob 加载示例文件
    const svgFiles = import.meta.glob('../examples/*.svg', { query: '?raw', import: 'default', eager: true })
    
    let loadedCount = 0
    const failedFiles: string[] = []
    
    for (const [path, content] of Object.entries(svgFiles)) {
      const fileName = path.split('/').pop() || 'unknown.svg'
      if (import.meta.env.DEV) {
        console.log(`[SVG Utils] 正在加载: ${fileName}`)
      }
      
      const success = svgLoader.loadFromString(content as string, fileName)
      if (success) {
        loadedCount++
        if (import.meta.env.DEV) {
          console.log(`[SVG Utils] ✅ ${fileName} 加载成功`)
        }
      } else {
        failedFiles.push(fileName)
        if (import.meta.env.DEV) {
          console.error(`[SVG Utils] ❌ ${fileName} 加载失败`)
        }
      }
    }
    
    if (import.meta.env.DEV) {
      console.log(`[SVG Utils] ✅ 示例组件加载完成: ${loadedCount} 个成功，${failedFiles.length} 个失败`)
      if (failedFiles.length > 0) {
        console.log('[SVG Utils] 失败的文件:', failedFiles)
      }
    } else if (loadedCount > 0) {
      console.log(`[SCADA Engine] ✅ 已加载 ${loadedCount} 个 SVG 组件`)
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[SVG Utils] 加载示例组件失败:', error)
    } else {
      console.warn('[SCADA Engine] SVG 组件加载失败，请手动调用 loadExampleSvgComponents()')
    }
  }
}

/**
 * 获取动画模板的友好名称
 */
export function getAnimationTemplateName(templateType: AnimationTemplateType): string {
  const names: Record<AnimationTemplateType, string> = {
    'opening-rotate': '开度 → 旋转',
    'level-height': '液位 → 高度',
    'status-color': '状态 → 颜色',
    'value-position': '数值 → 位置',
    'speed-flow': '速度 → 流动',
    'value-opacity': '数值 → 透明度',
    'value-text': '文本内容',
    'custom': '自定义'
  }
  return names[templateType] || templateType
}

/**
 * 获取动画模板的描述
 */
export function getAnimationTemplateDescription(templateType: AnimationTemplateType): string {
  const descriptions: Record<AnimationTemplateType, string> = {
    'opening-rotate': '根据开度值（0~1）旋转元素，适合阀门手柄、旋钮等',
    'level-height': '根据液位值动态调整高度，适合储罐、水箱、进度条等',
    'status-color': '根据状态值改变颜色，适合指示灯、状态标记等',
    'value-position': '根据数值移动元素位置，适合滑块、指针等',
    'speed-flow': '根据速度值产生流动动画，适合管道流体等',
    'value-opacity': '根据数值改变透明度，适合渐显渐隐效果',
    'value-text': '根据数据直接显示文本内容',
    'custom': '自定义动画逻辑'
  }
  return descriptions[templateType] || '未知动画类型'
}

/**
 * 创建默认的动画模板参数
 */
export function createDefaultTemplateParams(templateType: AnimationTemplateType): any {
  switch (templateType) {
    case 'opening-rotate':
      return {
        type: 'opening-rotate',
        inputRange: { min: 0, max: 1 },
        outputRange: { min: 0, max: 90 },
        origin: 'center'
      }
    
    case 'level-height':
      return {
        type: 'level-height',
        inputRange: { min: 0, max: 100 },
        direction: 'bottom-up'
      }
    
    case 'status-color':
      return {
        type: 'status-color',
        colorMap: {
          '0': '#ef4444',
          '1': '#10b981'
        },
        defaultColor: '#94a3b8',
        applyTo: 'fill'
      }
    
    case 'value-position':
      return {
        type: 'value-position',
        inputRange: { min: 0, max: 1 },
        movement: {
          axis: 'x',
          distance: 50
        }
      }
    
    case 'speed-flow':
      return {
        type: 'speed-flow',
        inputRange: { min: 0, max: 100 },
        speedRange: { min: 0, max: 50 },
        dashLength: 10
      }
    
    case 'value-opacity':
      return {
        type: 'value-opacity',
        inputRange: { min: 0, max: 1 },
        outputRange: { min: 0, max: 1 }
      }
    
    default:
      return {}
  }
}

/**
 * 验证内部动画配置
 */
export function validateInternalAnimation(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!config.id) {
    errors.push('缺少动画 ID')
  }
  
  if (!config.partId) {
    errors.push('缺少部件 ID')
  }
  
  if (!config.driverProperty) {
    errors.push('缺少驱动字段')
  }
  
  if (!config.templateType) {
    errors.push('缺少动画模板类型')
  }
  
  if (!config.templateParams) {
    errors.push('缺少模板参数')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
