/**
 * SCADA 组件系统类型定义
 */

import type { ComponentDataAdapter } from '../types/dataAdapter'

/**
 * 属性配置类型
 */
export type PropType = 'text' | 'number' | 'color' | 'boolean' | 'select' | 'slider'

/**
 * 属性配置项
 */
export interface ComponentProp {
  key: string                    // 属性键
  label: string                  // 属性标签
  type: PropType                 // 属性类型
  path: string                   // 属性路径 (如: 'attrs.body.fill')
  defaultValue?: any             // 默认值
  min?: number                   // 最小值 (number类型)
  max?: number                   // 最大值 (number类型)
  step?: number                  // 步长 (number类型)
  options?: Array<{ label: string, value: any }>  // 选项 (select类型)
  description?: string           // 属性描述
  bindable?: boolean             // 是否可作为数据绑定/事件配置的目标属性 (默认true,动画属性应设为false)
}

/**
 * 组件分类
 */
export type ComponentCategory = 'basic' | 'iot' | 'chart' | 'custom'

/**
 * 组件元数据
 */
export interface ComponentMetadata {
  id: string                     // 组件唯一标识
  name: string                   // 组件名称
  category: ComponentCategory    // 组件分类
  icon: string                   // 组件图标
  description?: string           // 组件描述
  version?: string               // 组件版本
  author?: string                // 组件作者
}

/**
 * X6 节点属性
 */
export interface NodeAttrs {
  body?: Record<string, any>     // 节点主体样式
  label?: Record<string, any>    // 节点标签样式
  [key: string]: any             // 其他自定义属性
}

/**
 * 组件数据
 */
export interface ComponentData {
  type: string                   // 组件类型
  deviceId?: string              // 设备ID (IoT组件)
  property?: string              // 设备属性 (IoT组件)
  [key: string]: any             // 其他自定义数据
}

/**
 * 组件点位定义（组件预定义的数据点）
 */
export interface ComponentPoint {
	/** 点位ID（组件内部标识） */
	id: string
	/** 点位名称 */
	name: string
	/** 点位描述 */
	description?: string
	/** 数据类型 */
	dataType: 'boolean' | 'number' | 'string' | 'json'
	/** 单位 */
	unit?: string
	/** 默认值 */
	defaultValue?: any
	/** 是否必需 */
	required?: boolean
	/** 数值范围（仅number类型） */
	range?: {
		min?: number
		max?: number
	}
}

/**
 * 组件配置
 */
export interface ComponentConfig {
  metadata: ComponentMetadata    // 组件元数据
  shape: string                  // X6 图形类型
  width: number                  // 默认宽度
  height: number                 // 默认高度
  label: string                  // 默认标签
  attrs: NodeAttrs               // 默认节点属性
  data?: ComponentData           // 默认组件数据
  ports?: any                    // X6接线桩配置
  props: ComponentProp[]         // 属性配置列表
  component?: any                // Vue 组件实例（可选，用于 Vue Shape 注册）
  dataAdapter?: ComponentDataAdapter  // 数据适配器（可选，用于数据绑定）
  points?: ComponentPoint[]      // 组件点位定义（组件需要的数据点）
}

/**
 * 组件注册表
 */
export type ComponentRegistry = Record<string, ComponentConfig>

/**
 * 公共动画属性配置
 * 可以在任何组件中复用
 */
export const COMMON_ANIMATION_PROPS: ComponentProp[] = [
  {
    key: 'animationEnabled',
    label: '启用动画',
    type: 'boolean',
    path: 'data.animation.enabled',
    defaultValue: false,
    description: '是否启用动画效果',
    bindable: true  // 动画属性不应出现在目标属性中
  },
  {
    key: 'animationType',
    label: '动画类型',
    type: 'select',
    path: 'data.animation.type',
    defaultValue: 'none',
    options: [
      { label: '无动画', value: 'none' },
      { label: '闪烁', value: 'blink' },
      { label: '缩放', value: 'scale' },
      { label: '旋转', value: 'rotate' },
      { label: '浮动', value: 'float' },
      { label: '脉冲', value: 'pulse' }
    ],
    description: '组件动画效果类型',
    bindable: false  // 动画属性不应出现在目标属性中
  },
  {
    key: 'animationDuration',
    label: '动画时长(ms)',
    type: 'number',
    path: 'data.animation.duration',
    defaultValue: 1000,
    min: 100,
    max: 5000,
    step: 100,
    description: '动画完成一次所需时间',
    bindable: false  // 动画属性不应出现在目标属性中
  },
  {
    key: 'animationLoop',
    label: '循环播放',
    type: 'boolean',
    path: 'data.animation.loop',
    defaultValue: true,
    description: '是否循环播放动画',
    bindable: false  // 动画属性不应出现在目标属性中
  }
]
