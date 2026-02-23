// 节点类型枚举
export enum NodeTypeEnum {
	START = 'start',
	END = 'end',
	GET_PROPERTY = 'getProperty',
	SET_PROPERTY = 'setProperty',
	CONDITION = 'condition',
	HTTP_REQUEST = 'httpRequest',
	CUSTOM_CODE = 'customCode',
	TIMER = 'timer',
	CLEAR_TIMER = 'clearTimer'
}

// 节点基础类型
export interface NodeType {
	type: string
	name: string
	icon: string
	description: string
	color: string
}

// 节点配置基类
export interface BaseNodeConfig {
	id: string
	name: string
	type: NodeTypeEnum
}

// 获取图元属性节点配置
export interface GetPropertyNodeConfig extends BaseNodeConfig {
	type: NodeTypeEnum.GET_PROPERTY
	elementId: string
	propertyName: string
	outputVariable: string
}

// 设置图元属性节点配置
export interface SetPropertyNodeConfig extends BaseNodeConfig {
	type: NodeTypeEnum.SET_PROPERTY
	elementId: string
	propertyName: string
	value: string | number
}

// 条件分支定义
export interface ConditionBranch {
	id: string // 分支唯一ID
	label: string // 分支显示标签，如 "True"、">10"、"=A" 等
	operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'notContains' // 运算符
	value?: string | number | boolean // 比较值
	isDefault?: boolean // 是否为默认分支
}

// 条件节点配置
export interface ConditionNodeConfig extends BaseNodeConfig {
	type: NodeTypeEnum.CONDITION
	sourceNodeId: string // 数据来源节点ID
	dataType: 'boolean' | 'number' | 'string' | 'any' // 数据类型
	branches: ConditionBranch[] // 条件分支列表
}

// HTTP请求节点配置
export interface HttpRequestNodeConfig extends BaseNodeConfig {
	type: NodeTypeEnum.HTTP_REQUEST
	url: string
	method: 'GET' | 'POST' | 'PUT' | 'DELETE'
	headers: Record<string, string>
	body?: string
	outputVariable: string
}

// 自定义代码节点配置
export interface CustomCodeNodeConfig extends BaseNodeConfig {
	type: NodeTypeEnum.CUSTOM_CODE
	code: string
}

// 定时器节点配置
export interface TimerNodeConfig extends BaseNodeConfig {
	type: NodeTypeEnum.TIMER
	interval: number
	unit: 'ms' | 's' | 'm' | 'h'
}

// 清除定时器节点配置
export interface ClearTimerNodeConfig extends BaseNodeConfig {
	type: NodeTypeEnum.CLEAR_TIMER
	timerId: string
}

// 节点配置联合类型
export type NodeConfig =
	| GetPropertyNodeConfig
	| SetPropertyNodeConfig
	| ConditionNodeConfig
	| HttpRequestNodeConfig
	| CustomCodeNodeConfig
	| TimerNodeConfig
	| ClearTimerNodeConfig
