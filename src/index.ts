/**
 * Copyright (c) 2025 leoncheng
 * 
 * This source code is licensed under the proprietary license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 * @author leoncheng
 * @email nywqs@outlook.com
 */

// SCADA Engine 库入口文件
import type { App } from 'vue'
import type { Graph } from '@antv/x6'

// 核心组件
import ScadaCanvas from './features/canvas/components/ScadaCanvas.vue'
import PropertyPanel from './features/property-panel/PropertyPanel.vue'
import Header from './shared/components/Header.vue'
import ComponentLibrary from './shared/components/ComponentLibrary.vue'
import CanvasConfigPanel from './features/canvas/components/CanvasConfigPanel.vue'
import BindingCard from './features/property-panel/cards/BindingCard.vue'
import EventCard from './features/property-panel/cards/EventCard.vue'
import BasicPropertiesTab from './features/property-panel/tabs/BasicPropertiesTab.vue'
import AttributeConfigDialog from './shared/components/dialogs/AttributeConfigDialog.vue'
import CustomCodeDialog from './shared/components/dialogs/CustomCodeDialog.vue'
import Preview from './features/preview/Preview.vue'


// 全局样式（库模式下也需要打包输出）
import './style.css'

// SCADA 组件系统
export * from './scada-components'

// 额外导出组件注册系统，方便用户自定义组件
export { componentRegistry } from './scada-components/registry'
export type { 
  ComponentConfig,
  ComponentRegistry,
  ComponentCategory,
  ComponentMetadata,
  ComponentProp,
  ComponentData,
  NodeAttrs,
  PropType
} from './scada-components/types'

// 导出画布配置管理器
export { canvasConfigManager } from './scada-components/canvas'
export type {
  CanvasConfig,
  CanvasConfigItem,
  CanvasSizePreset,
  BackgroundSize,
  BackgroundRepeat
} from './scada-components/canvas'

// 导出工具函数，供用户使用
export {
  // 消息提示
  showMessage,
  // 存储工具
  saveToLocal,
  loadFromLocal,
  removeFromLocal,
  STORAGE_KEYS,
  // 文件操作
  exportToJSON,
  // 通用工具
  randomPosition,
  formatTimestamp,
  getCurrentTimestamp,
  generateUniqueId,
  generateEventId,
  generateNodeId
} from './utils'

// 导出动画引擎
export { animationEngine } from './shared/animation/animationEngine'

// 导出事件处理工具
export { registerNodeEvents } from './shared/utils/eventUtils'

// 导出 SVG 组件加载工具
// loadExampleSvgComponents 由应用自动加载，不静态导出以避免打包冲突
export { svgLoader } from './svg/core/loader'
export type { SVGLoader } from './svg/core/loader'

// 导出设备点位相关类型
export type {
	Device,
	DevicePoint,
	DeviceList,
	PointValueUpdate
} from './features/data-source/types/device'

// 导出设备点位相关柚举
export {
	DeviceStatus,
	DeviceType,
	PointDataType,
	PointAccessMode
} from './features/data-source/types/device'

// 类型定义
export interface EventConfig {
  id?: string
  name?: string
  type: string
  conditionType?: string
  condition?: {
    attribute?: string
    operator?: string
    value?: any
  }
  action: string
  params?: Record<string, any>
}

export interface BindingConfig {
  id?: string
  type: string
  deviceId?: string
  dataPoint?: string
  attribute?: string
  eventId?: string
  transform?: string
}

/**
 * ScadaCanvas 组件暴露的 API 类型定义
 */
export interface ScadaCanvasExposed {
  // === 文件操作 ===
  /** 保存画布数据到 localStorage */
  save: () => void
  /** 触发文件选择，导入 JSON 数据 */
  import: () => void
  /** 导出画布数据为 JSON 文件 */
  export: () => void
  
  // === 视图操作 ===
  /** 跳转到预览页面 */
  preview: () => void
  /** 打开流程编排弹窗 */
  workflow: () => void
  
  // === 画布操作 ===
  /** 放大画布 */
  zoomIn: () => void
  /** 缩小画布 */
  zoomOut: () => void
  /** 清空画布所有元素 */
  clearAll: () => void
  
  // === 节点操作 ===
  /** 添加节点 */
  addNode: (type: string) => void
  /** 更新节点 */
  updateNode: (data: any) => void
  /** 删除当前选中的节点 */
  deleteNode: () => void
  /** 获取当前选中的节点 */
  getSelectedNode: () => any
  /** 选中节点 */
  selectNode: (nodeId: string) => boolean
  /** 取消选中 */
  clearSelection: () => void
  
  // === 数据访问 ===
  /** 获取 X6 Graph 实例 */
  getGraph: () => Graph | null
  /** 获取画布完整数据 */
  getCanvasData: () => CanvasData | null
  /** 加载画布数据 */
  loadCanvasData: (data: any) => boolean
  /** 获取所有节点 */
  getAllNodes: () => NodeData[]
  /** 根据ID获取节点 */
  getNodeById: (nodeId: string) => NodeData | null
  
  // === 画布配置 ===
  /** 获取画布配置管理器 */
  getConfigManager: () => any
  /** 更新画布配置 */
  updateCanvasConfig: (config: any) => void
  /** 设置画布缩放 */
  setZoom: (scale: number) => void
  /** 设置画布大小 */
  setCanvasSize: (width: number, height: number) => void
  /** 设置背景颜色 */
  setBackgroundColor: (color: string) => void
  
  // === 动画控制 ===
  /** 获取动画引擎 */
  getAnimationEngine: () => any
}

/**
 * 节点数据结构
 */
export interface NodeData {
  id: string
  type: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  label: string
  data: any
}

/**
 * 画布数据结构
 */
export interface CanvasData {
  /** 版本号 */
  version: string
  /** 时间戳 */
  timestamp: string
  /** 画布配置 */
  config: any
  /** X6 画布元素 */
  cells: any[]
  /** 节点数据 */
  nodes: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    size: { width: number; height: number }
    label: string
    data: any
  }>
  /** 连线数据 */
  edges: Array<{
    id: string
    source: string
    target: string
  }>
}

// 组件列表
const components = {
  ScadaCanvas,
  PropertyPanel,
  Header,
  ComponentLibrary,
  CanvasConfigPanel,
  BindingCard,
  EventCard,
  BasicPropertiesTab,
  AttributeConfigDialog,
  CustomCodeDialog,
  Preview,
}

// 导出单个组件
export {
  ScadaCanvas,
  PropertyPanel,
  Header,
  ComponentLibrary,
  CanvasConfigPanel,
  BindingCard,
  EventCard,
  BasicPropertiesTab,
  AttributeConfigDialog,
  CustomCodeDialog,
  Preview,
}

// 安装函数 - 支持 app.use() 方式注册
export const install = (app: App) => {
  // 注册所有组件
  Object.entries(components).forEach(([name, component]) => {
    app.component(name, component)
  })
  
  // 自动加载 SVG 示例组件（异步，不阻塞应用启动）
  if (typeof window !== 'undefined') {
    import('./svg/helpers/utils').then(({ loadExampleSvgComponents }) => {
      loadExampleSvgComponents().catch(err => {
        // 静默失败，不影响应用运行
        if (import.meta.env.DEV) {
          console.warn('[SCADA Engine] SVG 组件自动加载失败:', err)
        }
      })
    })
  }
}

// 默认导出
export default {
  install,
  version: '1.0.0',
}
