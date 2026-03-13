/**
 * SVG 组件类型定义
 * 支持外部数据驱动的内部局部动画
 */

/**
 * 动画模板类型（预设的业务语义动画）
 */
export enum AnimationTemplateType {
  /** 开度 → 旋转 (0~1 → 0~90°) */
  OPENING_ROTATE = 'opening-rotate',
  /** 液位 → 高度 (0~100 → 填充高度) */
  LEVEL_HEIGHT = 'level-height',
  /** 状态 → 颜色 (枚举/布尔 → 颜色映射) */
  STATUS_COLOR = 'status-color',
  /** 数值 → 位置 (0~1 → 滑块位移) */
  VALUE_POSITION = 'value-position',
  /** 速度 → 流动 (0~100 → stroke-dashoffset 动画速度) */
  SPEED_FLOW = 'speed-flow',
  /** 透明度映射 (0~1 → opacity) */
  VALUE_OPACITY = 'value-opacity',
  /** 字符串 → 文本内容 (直接显示) */
  VALUE_TEXT = 'value-text',
  /** 自定义 (用户完全自定义) */
  CUSTOM = 'custom'
}

/**
 * 内部 SVG 部件定义
 */
export interface SVGPart {
  /** 部件 ID（对应 SVG 中的 id 属性） */
  id: string
  /** 部件名称（可读） */
  name?: string
  /** SVG 元素类型 */
  elementType?: 'g' | 'rect' | 'circle' | 'path' | 'polygon' | 'text' | 'line'
  /** 部件描述 */
  description?: string
}

/**
 * 内部动画配置
 */
export interface InternalAnimationConfig {
  /** 动画 ID */
  id: string
  /** 目标 SVG 部件 ID */
  partId: string
  /** 驱动字段（node.data 中的字段名） */
  driverProperty: string
  /** 动画模板类型 */
  templateType: AnimationTemplateType
  /** 模板参数（根据不同模板有不同结构） */
  templateParams?: AnimationTemplateParams
  /** 是否启用 */
  enabled?: boolean
  /** 过渡时长（ms） */
  transitionDuration?: number
  /** 缓动函数 */
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

/**
 * 动画模板参数（联合类型）
 */
export type AnimationTemplateParams = 
  | OpeningRotateParams
  | LevelHeightParams
  | StatusColorParams
  | ValuePositionParams
  | SpeedFlowParams
  | ValueOpacityParams
  | ValueTextParams
  | CustomParams

/**
 * 开度 → 旋转 参数
 */
export interface OpeningRotateParams {
  type: AnimationTemplateType.OPENING_ROTATE
  /** 输入范围 */
  inputRange: { min: number; max: number }
  /** 输出角度范围（度） */
  outputRange: { min: number; max: number }
  /** 旋转中心 */
  origin?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | string
}

/**
 * 液位 → 高度 参数
 */
export interface LevelHeightParams {
  type: AnimationTemplateType.LEVEL_HEIGHT
  /** 输入范围 */
  inputRange: { min: number; max: number }
  /** 填充方向 */
  direction?: 'bottom-up' | 'top-down' | 'left-right' | 'right-left'
  /** 容器高度/宽度（默认使用元素自身尺寸） */
  containerSize?: number
}

/**
 * 状态 → 颜色 参数
 */
export interface StatusColorParams {
  type: AnimationTemplateType.STATUS_COLOR
  /** 颜色映射表 */
  colorMap: Record<string | number, string>
  /** 默认颜色 */
  defaultColor?: string
  /** 应用到的属性 */
  applyTo?: 'fill' | 'stroke' | 'both'
}

/**
 * 数值 → 位置 参数
 */
export interface ValuePositionParams {
  type: AnimationTemplateType.VALUE_POSITION
  /** 输入范围 */
  inputRange: { min: number; max: number }
  /** 移动方向和距离 */
  movement: {
    axis: 'x' | 'y'
    distance: number // 单位：px
  }
}

/**
 * 速度 → 流动 参数
 */
export interface SpeedFlowParams {
  type: AnimationTemplateType.SPEED_FLOW
  /** 输入范围 */
  inputRange: { min: number; max: number }
  /** 流动速度范围（px/s） */
  speedRange: { min: number; max: number }
  /** 虚线图案长度 */
  dashLength?: number
}

/**
 * 透明度 参数
 */
export interface ValueOpacityParams {
  type: AnimationTemplateType.VALUE_OPACITY
  /** 输入范围 */
  inputRange: { min: number; max: number }
  /** 输出透明度范围 */
  outputRange: { min: number; max: number }
}

/**
 * 字符串 → 文本内容 参数
 */
export interface ValueTextParams {
  type: AnimationTemplateType.VALUE_TEXT
  /** 默认文本（空值时显示） */
  defaultText?: string
}

/**
 * 自定义参数
 */
export interface CustomParams {
  type: AnimationTemplateType.CUSTOM
  /** 自定义映射函数（序列化的函数体） */
  mappingFunction?: string
  /** 其他自定义配置 */
  [key: string]: any
}

/**
 * SVG 组件元数据（扩展标准 ComponentMetadata）
 */
export interface SVGComponentMetadata {
  /** 组件 ID */
  id: string
  /** 组件名称 */
  name: string
  /** 组件分类 */
  category: 'basic' | 'iot' | 'chart' | 'custom'
  /** 图标 */
  icon: string
  /** 描述 */
  description?: string
  /** 版本 */
  version?: string
  /** 作者 */
  author?: string
  /** 自定义组件分类名称（category 为 custom 时生效） */
  custom_category_name?: string
  /** 图标类型：icon（默认 emoji）或 img（图片 URL） */
  iconType?: string
  /** SVG 来源信息 */
  svgSource?: {
    /** 原始文件名 */
    fileName?: string
    /** 上传时间 */
    uploadTime?: string
  }
}

/**
 * SVG 组件配置（完整）
 */
export interface SVGComponentConfig {
  /** 元数据 */
  metadata: SVGComponentMetadata
  /** 组件尺寸 */
  size: {
    width: number
    height: number
  }
  /** SVG 内容（清理后的 SVG 字符串，去除 metadata 标签） */
  svgContent: string
  /** 内部部件列表（自动提取 part-* 的元素） */
  parts: SVGPart[]
  /** 内部动画配置（可由组态工程师配置） */
  internalAnimations?: InternalAnimationConfig[]
  /** 默认数据（包含默认驱动字段） */
  defaultData?: Record<string, any>
  /** 预设绑定（官方组件可提供） */
  presetBindings?: Array<{
    partId: string
    /** 驱动字段英文名（用于 data.xxx 字段） */
    suggestedDriverProperty: string
    suggestedTemplate: AnimationTemplateType
    suggestedParams?: AnimationTemplateParams
    /** 可选：属性中文名称，用于属性面板显示 */
    label?: string
    /** 可选：字段值类型，用于属性编辑器渲染 */
    valueType?: 'number' | 'boolean' | 'string' | 'color'
    /** 如果是布尔型，可配置备选值列表（如 0/1, open/closed 等） */
    booleanOptions?: Array<{
      value: string | number | boolean
      label: string
    }>
  }>
  /** 接线柱配置（从 SVG 文件的 metadata 中读取） */
  ports?: Array<{
    id: string
    group: 'top' | 'bottom' | 'left' | 'right'
    args?: {
      x?: number | string
      y?: number | string
    }
  }>
}

/**
 * SVG 文件元数据格式（在 SVG 的 <metadata> 中）
 */
export interface SVGFileMetadata {
  /** 组件元数据 */
  component: {
    id: string
    name: string
    category?: string
    icon?: string
    description?: string
    version?: string
    author?: string
  }
  /** 默认尺寸 */
  size?: {
    width: number
    height: number
  }
  /** 预设绑定（可选，官方组件提供） */
  presetBindings?: Array<{
    partId: string
    /** 驱动字段英文名（用于 data.xxx 字段） */
    suggestedDriverProperty: string
    suggestedTemplate: AnimationTemplateType
    suggestedParams?: any
    /** 可选：属性中文名称，用于属性面板显示 */
    label?: string
    /** 可选：字段值类型，用于属性编辑器渲染 */
    valueType?: 'number' | 'boolean' | 'string' | 'color'
    /** 如果是布尔型，可配置备选值列表（如 0/1, open/closed 等） */
    booleanOptions?: Array<{
      value: string | number | boolean
      label: string
    }>
  }>
  /** 接线柱配置（可选） */
  ports?: Array<{
    /** 接线柱 ID */
    id: string
    /** 位置组 */
    group: 'top' | 'bottom' | 'left' | 'right'
    /** 自定义位置（可选，覆盖 group 的默认位置） */
    args?: {
      x?: number | string
      y?: number | string
    }
  }>
}
