/**
 * 流程编排相关类型定义
 */

/**
 * 流程节点类型
 */
export enum WorkflowNodeType {
  START = 'start',           // 开始节点
  END = 'end',               // 结束节点
  CONDITION = 'condition',   // 条件判断
  ACTION = 'action',         // 执行动作
  DELAY = 'delay',           // 延时节点
  LOOP = 'loop',             // 循环节点
  PARALLEL = 'parallel',     // 并行节点
  MERGE = 'merge'            // 合并节点
}

/**
 * 条件运算符
 */
export enum ConditionOperator {
  EQUAL = '==',              // 等于
  NOT_EQUAL = '!=',          // 不等于
  GREATER = '>',             // 大于
  GREATER_EQUAL = '>=',      // 大于等于
  LESS = '<',                // 小于
  LESS_EQUAL = '<=',         // 小于等于
  CONTAINS = 'contains',     // 包含
  NOT_CONTAINS = 'not_contains' // 不包含
}

/**
 * 动作类型
 */
export enum ActionType {
  SET_POINT = 'setPoint',           // 设置点位值
  TRIGGER_EVENT = 'triggerEvent',   // 触发事件
  SEND_ALARM = 'sendAlarm',         // 发送告警
  CALL_API = 'callApi',             // 调用API
  EXECUTE_SCRIPT = 'executeScript'  // 执行脚本
}

/**
 * 条件配置
 */
export interface ConditionConfig {
  /** 左操作数（设备点位ID或变量） */
  leftOperand: string
  /** 运算符 */
  operator: ConditionOperator
  /** 右操作数（值或设备点位ID） */
  rightOperand: string | number | boolean
  /** 逻辑关系（用于多条件组合） */
  logic?: 'AND' | 'OR'
}

/**
 * 动作配置
 */
export interface ActionConfig {
  /** 动作类型 */
  type: ActionType
  /** 目标设备点位ID */
  targetPointId?: string
  /** 设置的值 */
  value?: any
  /** API地址 */
  apiUrl?: string
  /** 请求方法 */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** 请求参数 */
  params?: Record<string, any>
  /** 脚本代码 */
  script?: string
  /** 告警内容 */
  alarmMessage?: string
  /** 告警级别 */
  alarmLevel?: 'info' | 'warning' | 'error' | 'critical'
}

/**
 * 流程节点
 */
export interface WorkflowNode {
  /** 节点ID */
  id: string
  /** 节点类型 */
  type: WorkflowNodeType
  /** 节点名称 */
  name: string
  /** 节点描述 */
  description?: string
  /** 节点位置 */
  position: {
    x: number
    y: number
  }
  /** 条件配置（条件节点） */
  conditions?: ConditionConfig[]
  /** 动作配置（动作节点） */
  actions?: ActionConfig[]
  /** 延时时间（延时节点，单位：毫秒） */
  delay?: number
  /** 循环次数（循环节点） */
  loopCount?: number
  /** 循环条件（循环节点） */
  loopCondition?: ConditionConfig
  /** 是否启用 */
  enabled?: boolean
  /** 自定义数据 */
  data?: Record<string, any>
}

/**
 * 流程连线
 */
export interface WorkflowEdge {
  /** 连线ID */
  id: string
  /** 源节点ID */
  source: string
  /** 目标节点ID */
  target: string
  /** 源节点输出端口 */
  sourceHandle?: string
  /** 目标节点输入端口 */
  targetHandle?: string
  /** 连线标签（如：true/false分支） */
  label?: string
  /** 连线类型 */
  type?: 'default' | 'success' | 'fail' | 'always'
  /** 是否启用 */
  enabled?: boolean
}

/**
 * 流程配置
 */
export interface WorkflowConfig {
  /** 流程ID */
  id: string
  /** 流程名称 */
  name: string
  /** 流程描述 */
  description?: string
  /** 流程节点列表 */
  nodes: WorkflowNode[]
  /** 流程连线列表 */
  edges: WorkflowEdge[]
  /** 是否启用 */
  enabled?: boolean
  /** 触发方式 */
  trigger?: {
    /** 触发类型（manual手动、schedule定时、event事件） */
    type: 'manual' | 'schedule' | 'event'
    /** 定时表达式（cron） */
    cron?: string
    /** 事件源（设备点位ID） */
    eventSource?: string
    /** 事件条件 */
    eventCondition?: ConditionConfig
  }
  /** 创建时间 */
  createTime?: string
  /** 更新时间 */
  updateTime?: string
  /** 创建者 */
  creator?: string
}

/**
 * 流程执行记录
 */
export interface WorkflowExecutionLog {
  /** 执行ID */
  id: string
  /** 流程ID */
  workflowId: string
  /** 流程名称 */
  workflowName: string
  /** 开始时间 */
  startTime: string
  /** 结束时间 */
  endTime?: string
  /** 执行状态 */
  status: 'running' | 'success' | 'failed' | 'cancelled'
  /** 当前执行节点ID */
  currentNodeId?: string
  /** 执行结果 */
  result?: any
  /** 错误信息 */
  error?: string
  /** 节点执行详情 */
  nodeExecutions?: {
    nodeId: string
    nodeName: string
    startTime: string
    endTime?: string
    status: 'success' | 'failed' | 'skipped'
    result?: any
    error?: string
  }[]
}
