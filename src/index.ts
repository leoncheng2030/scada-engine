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
import ScadaCanvas from './components/ScadaCanvas.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import Header from './components/Header.vue'
import ComponentLibrary from './components/ComponentLibrary.vue'
import CanvasConfigPanel from './components/CanvasConfigPanel.vue'
import BindingCard from './components/BindingCard.vue'
import EventCard from './components/EventCard.vue'
import BasicPropertiesTab from './components/BasicPropertiesTab.vue'
import AttributeConfigDialog from './components/AttributeConfigDialog.vue'
import CustomCodeDialog from './components/CustomCodeDialog.vue'

// 预览视图（仅独立运行时使用，库模式不导出）
// import PreviewView from './views/preview/PreviewView.vue'
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
  saveToSession,
  loadFromSession,
  removeFromSession,
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
export { animationEngine } from './utils/animationEngine'

// 导出设备点位相关类型
export type {
	Device,
	DevicePoint,
	DeviceList,
	PointValueUpdate
} from './types/device'

// 导出设备点位相关枚举
export {
	DeviceStatus,
	DeviceType,
	PointDataType,
	PointAccessMode
} from './types/device'

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
  /** 保存画布数据到 sessionStorage */
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
  // PreviewView, // 仅独立运行时使用，库模式不导出
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
  // PreviewView, // 仅独立运行时使用，库模式不导出
}

// 安装函数 - 支持 app.use() 方式注册
export const install = (app: App) => {
  Object.entries(components).forEach(([name, component]) => {
    app.component(name, component)
  })
}

// 默认导出
export default {
  install,
  version: '1.0.0',
}
