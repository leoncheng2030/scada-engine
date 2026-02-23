import { Component } from 'vue'
import { NodeTypeEnum } from '../types/node'
import GetPropertyConfig from '../components/node-configs/GetPropertyConfig.vue'
import SetPropertyConfig from '../components/node-configs/SetPropertyConfig.vue'
import ConditionConfig from '../components/node-configs/ConditionConfig.vue'
import HttpRequestConfig from '../components/node-configs/HttpRequestConfig.vue'
import CustomCodeConfig from '../components/node-configs/CustomCodeConfig.vue'
import TimerConfig from '../components/node-configs/TimerConfig.vue'
import ClearTimerConfig from '../components/node-configs/ClearTimerConfig.vue'

// 节点配置组件注册表
export const nodeConfigRegistry: Record<string, Component> = {
	[NodeTypeEnum.GET_PROPERTY]: GetPropertyConfig,
	[NodeTypeEnum.SET_PROPERTY]: SetPropertyConfig,
	[NodeTypeEnum.CONDITION]: ConditionConfig,
	[NodeTypeEnum.HTTP_REQUEST]: HttpRequestConfig,
	[NodeTypeEnum.CUSTOM_CODE]: CustomCodeConfig,
	[NodeTypeEnum.TIMER]: TimerConfig,
	[NodeTypeEnum.CLEAR_TIMER]: ClearTimerConfig
}

// 获取节点配置组件
export function getNodeConfigComponent(nodeType: string): Component | null {
	return nodeConfigRegistry[nodeType] || null
}

// 检查节点类型是否有配置组件
export function hasNodeConfigComponent(nodeType: string): boolean {
	return nodeType in nodeConfigRegistry
}
