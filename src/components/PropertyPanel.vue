<template>
	<div class="property-panel" :class="{ collapsed: isCollapsed }">
		<button class="collapse-btn" @click="toggleCollapse" :title="isCollapsed ? '展开属性面板' : '折叠属性面板'">
			<span class="collapse-icon">▶</span>
		</button>
		<!-- 画布配置 -->
		<CanvasConfigPanel v-if="!selectedNode && !selectedEdge" />

		<!-- 连线属性 -->
		<div v-else-if="selectedEdge" class="properties">
			<h3 class="panel-title">连线属性</h3>
			<EdgePropertiesTab
				:selected-edge="selectedEdge"
				@update-edge="handleUpdateEdge"
				@delete-edge="handleDeleteEdge"
			/>
		</div>

		<!-- 节点属性 -->
		<div v-else-if="selectedNode" class="properties">
			<h3 class="panel-title">节点属性</h3>

			<!-- Tab 切换 -->
			<div class="tabs">
				<button
					:class="['tab-btn', { active: activeTab === 'basic' }]"
					@click="activeTab = 'basic'"
				>
					基础
				</button>
				<button
					:class="['tab-btn', { active: activeTab === 'binding' }]"
					@click="activeTab = 'binding'"
				>
					数据绑定
				</button>
				<button
					:class="['tab-btn', { active: activeTab === 'event' }]"
					@click="activeTab = 'event'"
				>
					事件
				</button>
			</div>

			<!-- Tab 内容 -->
			<div class="tab-content">
				<!-- 基础 Tab -->
				<BasicPropertiesTab
					v-show="activeTab === 'basic'"
					:selected-node="selectedNode"
					:node-position="nodePosition"
					:node-size="nodeSize"
					:node-attrs="nodeAttrs"
					@update-position="updatePosition"
					@update-size="updateSize"
					@update-label="updateLabel"
					@update-fill="updateFill"
					@update-stroke="updateStroke"
					@update-stroke-width="updateStrokeWidth"
					@update-opacity="updateOpacity"
					@update-component-name="updateComponentName"
					@update-dynamic-prop="updateDynamicProp"
				/>

				<!-- 数据绑定 Tab -->
				<div v-show="activeTab === 'binding'" class="tab-pane">
					<!-- 数据源选择区域 -->
					<DataPropertiesTab
						:selected-node="selectedNode"
						@update-data-source="updateDataSource"
					/>
					
					<!-- 分割线 -->
					<div class="divider"></div>
					
					<!-- 点位绑定区域 -->
					<div class="property-section">
						<div class="section-header">
							<h4>点位映射</h4>
							<button class="btn-add" @click="addBinding">+ 添加映射</button>
						</div>
						
						<div v-if="bindingList.length === 0" class="empty-hint">
							<span>暂无点位映射，请先选择设备后点击上方按钮添加</span>
						</div>

						<!-- 表格式布局 -->
						<div v-else class="binding-table">
							<!-- 表头 -->
							<div class="binding-table-header">
								<div class="binding-col-point">组件点位</div>
								<div class="binding-col-property">目标属性</div>
								<div class="binding-col-mapping">值映射</div>
								<div class="binding-col-actions">操作</div>
							</div>
							
							<!-- 表体 -->
							<div class="binding-table-body">
								<BindingCard
									v-for="(binding, index) in bindingList"
									:key="index"
									:binding="binding"
									:index="index"
									:is-collapsed="isBindingCollapsed(index)"
									:node-properties="getNodeProperties()"
									:component-points="componentPoints"
									@toggle-collapse="toggleBindingCollapse(index)"
									@remove="removeBinding(index)"
									@update-field="(field, e) => updateBindingField(index, field, e)"
								/>
							</div>
						</div>
					</div>
				</div>
				
				<!-- 事件 Tab -->
				<div v-show="activeTab === 'event'" class="tab-pane">
					<div class="property-section">
						<div class="section-header">
							<h4>节点事件</h4>
							<button class="btn-add" @click="addEvent">+ 添加事件</button>
						</div>
						
						<div v-if="eventList.length === 0" class="empty-hint">
							<span>暂无事件，点击上方按钮添加</span>
						</div>

						<div class="event-list">
							<EventCard
								v-for="(event, index) in eventList"
								:key="index"
								:event="event"
								:index="index"
								:is-collapsed="isEventCollapsed(index)"
								:node-properties="getNodeProperties()"
								@toggle-collapse="toggleEventCollapse(index)"
								@remove="removeEvent(index)"
								@update-field="(field, e) => updateEventField(index, field, e)"
								@update-condition="(field, e) => updateEventCondition(index, field, e)"
								@update-params="(field, e) => updateEventParams(index, field, e)"
								@open-attribute-config="openAttributeConfig(index)"
								@open-custom-code="openCustomCodeConfig(index)"
								@open-workflow-selector="openWorkflowSelector(index)"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	
	<!-- 属性配置弹窗 -->
	<AttributeConfigDialog
		v-if="showAttributeDialog"
		:attribute-groups="attributeGroups"
		:node-properties="getNodeProperties()"
		@close="closeAttributeDialog"
		@save="saveAttributeConfig"
		@add-group="addAttributeGroup"
		@remove-group="removeAttributeGroup"
		@update-group="updateAttributeGroup"
	/>
	
	<!-- 自定义代码配置弹窗 -->
	<CustomCodeDialog
		v-if="showCustomCodeDialog"
		v-model:code="customCode"
		:selected-node="selectedNode"
		@close="closeCustomCodeDialog"
		@save="saveCustomCodeConfig"
	/>
	
	<!-- 流程选择弹窗 -->
	<WorkflowSelectorDialog
		v-if="showWorkflowSelectorDialog"
		@close="closeWorkflowSelector"
		@select="selectWorkflow"
	/>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { Node, Edge } from '@antv/x6'
import type { BindingConfig as StandardBindingConfig } from '../types/binding'
import type { ComponentPoint } from '../scada-components/types'
import CanvasConfigPanel from './CanvasConfigPanel.vue'
import BasicPropertiesTab from './BasicPropertiesTab.vue'
import DataPropertiesTab from './DataPropertiesTab.vue'
import EdgePropertiesTab from './EdgePropertiesTab.vue'
import EventCard from './EventCard.vue'
import BindingCard from './BindingCard.vue'
import AttributeConfigDialog from './AttributeConfigDialog.vue'
import CustomCodeDialog from './CustomCodeDialog.vue'
import WorkflowSelectorDialog from './WorkflowSelectorDialog.vue'
import { generateEventId } from '../utils'
import { dataSourceManager } from '../services/dataSourceManager'
import { componentRegistry } from '../scada-components/registry'

interface Props {
	selectedNode: Node | null
	selectedEdge: Edge | null
	deviceData?: any // 设备数据
	isCollapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	isCollapsed: false
})

const emit = defineEmits<{
	updateNode: [data: any]
	deleteNode: []
	updateEdge: [data: any]
	deleteEdge: []
	'update:collapsed': [value: boolean]
}>()

const toggleCollapse = () => {
	emit('update:collapsed', !props.isCollapsed)
}

// 当前激活的 tab
const activeTab = ref<'basic' | 'data' | 'binding' | 'event'>('basic')

// 事件列表
interface EventConfig {
	id?: string // 事件唯一ID
	name?: string // 事件名称
	type: string // 事件类型: click, dblclick, mouseenter, etc.
	conditionType: string // 触发条件类型: always, expression, dataCompare, stateMatch
	triggerRule?: string // 触发规则: always, condition
	condition?: {
		expression?: string
		dataSource?: string
		operator?: string
		targetValue?: string
		stateValue?: string
		targetType?: string
		shape?: string
		attribute?: string
		value?: string
	}
	action: string // 执行动作: navigate, control, script, etc.
	params?: {
		url?: string
		command?: string
		script?: string
		attrName?: string
		attrValue?: string
		data?: string
		code?: string
		processId?: string
		processName?: string
		processParams?: string
		attributeGroups?: Array<{
			target: string
			property: string
			value: string
		}>
	}
}

const eventList = ref<EventConfig[]>([])
const collapsedEvents = ref<Set<number>>(new Set())

// 绑定列表 - 使用标准类型
const bindingList = ref<StandardBindingConfig[]>([])
const collapsedBindings = ref<Set<number>>(new Set())

// 获取组件的点位定义（用于 BindingCard）
const componentPoints = computed<ComponentPoint[]>(() => {
	if (!props.selectedNode) return []
	
	// 直接使用 shape 查找组件配置
	const shape = props.selectedNode.shape
	if (!shape) return []
	
	// 从组件注册表获取组件配置
	const componentConfig = componentRegistry.getComponentByShape(shape)
	if (!componentConfig || !componentConfig.points) return []
	
	return componentConfig.points
})

// 监听选中节点变化，加载事件配置
watch(() => props.selectedNode, (node) => {
	if (node?.data?.events) {
		const events = JSON.parse(JSON.stringify(node.data.events))
		// 确保每个事件都有ID
		events.forEach((event: EventConfig) => {
			if (!event.id) {
				event.id = generateId()
			}
		})
		eventList.value = events
	} else {
		eventList.value = []
	}
	// 重置折叠状态
	collapsedEvents.value.clear()
	
	// 加载绑定配置
	if (node?.data?.bindings) {
		bindingList.value = JSON.parse(JSON.stringify(node.data.bindings))
	} else {
		bindingList.value = []
	}
	collapsedBindings.value.clear()
}, { immediate: true })

// 创建一个更新计数器，用于强制重新计算 computed 属性
const positionUpdateCounter = ref(0)
const sizeUpdateCounter = ref(0)

// 监听节点位置和尺寸的变化
let positionCheckInterval: any = null
let lastPosition = { x: 0, y: 0 }
let lastSize = { width: 0, height: 0 }

watch(() => props.selectedNode, (node) => {
	// 清除之前的轮询
	if (positionCheckInterval) {
		clearInterval(positionCheckInterval)
		positionCheckInterval = null
	}
	
	if (node) {
		// 初始化位置和尺寸，添加数据验证
		const pos = node.getPosition()
		const size = node.getSize()
		
		// 验证数据格式
		if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
			lastPosition = pos
		} else {
			lastPosition = { x: 0, y: 0 }
			console.warn('节点位置数据异常:', pos)
		}
		
		if (size && typeof size.width === 'number' && typeof size.height === 'number') {
			lastSize = size
		} else {
			lastSize = { width: 0, height: 0 }
			console.warn('节点尺寸数据异常:', size)
		}
		
		// 定期检查节点位置和尺寸是否变化
		positionCheckInterval = setInterval(() => {
			if (props.selectedNode) {
				const currentPos = props.selectedNode.getPosition()
				const currentSize = props.selectedNode.getSize()
				
				// 验证并检查位置是否变化
				if (currentPos && typeof currentPos.x === 'number' && typeof currentPos.y === 'number') {
					if (currentPos.x !== lastPosition.x || currentPos.y !== lastPosition.y) {
						lastPosition = currentPos
						positionUpdateCounter.value++
					}
				}
				
				// 验证并检查尺寸是否变化
				if (currentSize && typeof currentSize.width === 'number' && typeof currentSize.height === 'number') {
					if (currentSize.width !== lastSize.width || currentSize.height !== lastSize.height) {
						lastSize = currentSize
						sizeUpdateCounter.value++
					}
				}
			}
		}, 50) // 每 50ms 检查一次
	}
})

// 组件销毁时清理轮询
onUnmounted(() => {
	if (positionCheckInterval) {
		clearInterval(positionCheckInterval)
	}
})

// 使用 computed 获取节点属性，确保响应式更新
const nodePosition = computed(() => {
	// 依赖 positionUpdateCounter 来触发重新计算
	positionUpdateCounter.value
	const pos = props.selectedNode?.getPosition() || { x: 0, y: 0 }
	return pos
})

const nodeSize = computed(() => {
	// 依赖 sizeUpdateCounter 来触发重新计算
	sizeUpdateCounter.value
	const size = props.selectedNode?.getSize() || { width: 0, height: 0 }
	return size
})

const nodeAttrs = computed(() => {
	const attrs = props.selectedNode?.getAttrs() || {}
	return attrs
})

const updatePosition = (axis: 'x' | 'y', event: Event) => {
	const value = Number((event.target as HTMLInputElement).value)
	const currentPos = props.selectedNode!.getPosition()
	const position = axis === 'x' ? { x: value, y: currentPos.y } : { x: currentPos.x, y: value }
	emit('updateNode', { position })
}

const updateSize = (dimension: 'width' | 'height', event: Event) => {
	const value = Number((event.target as HTMLInputElement).value)
	const currentSize = props.selectedNode!.getSize()
	const size = dimension === 'width' ? { width: value, height: currentSize.height } : { width: currentSize.width, height: value }
	emit('updateNode', { size })
}

const updateLabel = (event: Event) => {
	const value = (event.target as HTMLInputElement).value
	// 尝试更新 text.text 和 label.text
	emit('updateNode', { attrs: { text: { text: value }, label: { text: value } } })
}

const updateFill = (event: Event) => {
	const value = (event.target as HTMLInputElement).value
	emit('updateNode', { attrs: { body: { fill: value } } })
}

const updateStroke = (event: Event) => {
	const value = (event.target as HTMLInputElement).value
	emit('updateNode', { attrs: { body: { stroke: value } } })
}

const updateStrokeWidth = (event: Event) => {
	const value = Number((event.target as HTMLInputElement).value)
	emit('updateNode', { attrs: { body: { strokeWidth: value } } })
}

const updateOpacity = (event: Event) => {
	const value = Number((event.target as HTMLInputElement).value)
	emit('updateNode', { attrs: { body: { opacity: value } } })
}

// 更新组件名称
const updateComponentName = (event: Event) => {
	const value = (event.target as HTMLInputElement).value
	const data = { ...props.selectedNode!.data, componentName: value }
	emit('updateNode', { data })
}

// 更新动态属性（根据 path 更新嵌套属性）
const updateDynamicProp = (path: string, value: any) => {
	if (!props.selectedNode) return
	
	// 解析 path，例如 "data.animation.type"
	const pathParts = path.split('.')
	
	// 如果 path 以 "attrs." 开头，使用 attrs 更新
	if (pathParts[0] === 'attrs') {
		const attrPath = pathParts.slice(1).join('/')
		emit('updateNode', { attrs: { [attrPath]: value } })
	} 
	// 如果 path 以 "data." 开头，更新 data
	else if (pathParts[0] === 'data') {
		// 构建嵌套对象
		const newData = JSON.parse(JSON.stringify(props.selectedNode.data || {}))
		
		// 根据 path 设置值
		let current: any = newData
		for (let i = 1; i < pathParts.length - 1; i++) {
			const part = pathParts[i]
			if (!current[part]) {
				current[part] = {}
			}
			current = current[part]
		}
		current[pathParts[pathParts.length - 1]] = value
		
		console.log('[PropertyPanel] 更新属性:', path, '=', value)
		console.log('[PropertyPanel] 节点类型:', props.selectedNode.shape)
		
		// 特殊处理：ECharts 仪表盘预设切换
		// 只更新 presetId，不合并预设配置到 data
		// 让 Vue 组件根据 presetId 自己应用配置
		if (path === 'data.presetId' && props.selectedNode.shape === 'echarts-vue') {
			console.log('[PropertyPanel] 检测到预设切换，只更新 presetId')
			// 不需要在这里合并配置，Vue 组件会自己处理
		}
		
		emit('updateNode', { data: newData })
	}
}

// 更新数据源配置
const updateDataSource = (config: { dataSourceId: string }) => {
	if (!props.selectedNode) return
	
	const data = { 
		...props.selectedNode.data, 
		dataBinding: config  // 使用 dataBinding 字段
	}
	emit('updateNode', { data })
}

// 生成唯一ID
const generateId = generateEventId

// 添加事件
const addEvent = () => {
	const newEvent: EventConfig = {
		id: generateId(), // 生成唯一ID
		name: '',
		type: 'click',
		conditionType: 'always',
		action: 'attributeChange',  // 默认选择"更改属性"
		params: {}
	}
	eventList.value.push(newEvent)
	saveEvents()
}

// 删除事件
const removeEvent = (index: number) => {
	eventList.value.splice(index, 1)
	saveEvents()
}

// 更新事件字段
const updateEventField = (index: number, field: string, event: Event) => {
	const value = (event.target as HTMLSelectElement).value
	eventList.value[index][field as keyof EventConfig] = value as any
	saveEvents()
}

// 更新事件条件
const updateEventCondition = (index: number, field: string, event: Event) => {
	const target = event.target as HTMLInputElement | HTMLSelectElement
	const value = target.value
	if (!eventList.value[index].condition) {
		eventList.value[index].condition = {}
	}
	(eventList.value[index].condition as any)[field] = value
	saveEvents()
}

// 更新事件参数
const updateEventParams = (index: number, field: string, event: Event) => {
	const target = event.target as HTMLInputElement | HTMLTextAreaElement
	const value = target.value
	if (!eventList.value[index].params) {
		eventList.value[index].params = {}
	}
	(eventList.value[index].params as any)[field] = value
	saveEvents()
}

// 保存事件配置到节点
const saveEvents = () => {
	// 确保每个事件都有ID
	eventList.value.forEach(event => {
		if (!event.id) {
			event.id = generateId()
		}
	})
	
	const data = { ...props.selectedNode!.data, events: eventList.value }
	emit('updateNode', { data })
}

// 切换事件折叠状态
const toggleEventCollapse = (index: number) => {
	if (collapsedEvents.value.has(index)) {
		collapsedEvents.value.delete(index)
	} else {
		collapsedEvents.value.add(index)
	}
}

// 判断事件是否折叠
const isEventCollapsed = (index: number) => {
	return collapsedEvents.value.has(index)
}

// 绑定操作函数
// 添加绑定
const addBinding = () => {
	const newBinding: StandardBindingConfig = {
		devicePointId: '',
		targetProperty: '',
		enabled: true
	}
	bindingList.value.push(newBinding)
	saveBindings()
}

// 删除绑定
const removeBinding = (index: number) => {
	bindingList.value.splice(index, 1)
	saveBindings()
}

// 更新绑定字段
const updateBindingField = (index: number, field: string, event: Event) => {
	const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
	const value = target.value
	;(bindingList.value[index] as any)[field] = value
	saveBindings()
}

// 保存绑定配置到节点
const saveBindings = () => {
	const data = { ...props.selectedNode!.data, bindings: bindingList.value }
	emit('updateNode', { data })
}

// 切换绑定折叠状态
const toggleBindingCollapse = (index: number) => {
	if (collapsedBindings.value.has(index)) {
		collapsedBindings.value.delete(index)
	} else {
		collapsedBindings.value.add(index)
	}
}

// 判断绑定是否折叠
const isBindingCollapsed = (index: number) => {
	return collapsedBindings.value.has(index)
}

// 打开属性配置弹窗
const showAttributeDialog = ref(false)
const currentEventIndex = ref(-1)

interface AttributeGroup {
	target: string
	property: string
	value: string
}

const attributeGroups = ref<AttributeGroup[]>([])

const openAttributeConfig = (index: number) => {
	currentEventIndex.value = index
	// 如果已经配置过，加载现有配置
	const event = eventList.value[index]
	if (event.params?.attributeGroups && Array.isArray(event.params.attributeGroups)) {
		attributeGroups.value = JSON.parse(JSON.stringify(event.params.attributeGroups))
	} else {
		// 默认添加一组
		attributeGroups.value = [{
			target: 'current',
			property: '',
			value: ''
		}]
	}
	showAttributeDialog.value = true
}

const closeAttributeDialog = () => {
	showAttributeDialog.value = false
}

const addAttributeGroup = () => {
	attributeGroups.value.push({
		target: 'current',
		property: '',
		value: ''
	})
}

const removeAttributeGroup = (index: number) => {
	attributeGroups.value.splice(index, 1)
}

const updateAttributeGroup = (index: number, field: 'target' | 'property' | 'value', value: string) => {
	attributeGroups.value[index][field] = value
}

const saveAttributeConfig = () => {
	// 验证每组都有属性
	for (const group of attributeGroups.value) {
		if (!group.property) {
			alert('请为每组配置选择目标属性')
			return
		}
	}
	
	// 保存属性配置到事件
	if (!eventList.value[currentEventIndex.value].params) {
		eventList.value[currentEventIndex.value].params = {}
	}
	eventList.value[currentEventIndex.value].params!.attributeGroups = JSON.parse(JSON.stringify(attributeGroups.value))
	
	saveEvents()
	closeAttributeDialog()
}

// 自定义代码配置弹窗
const showCustomCodeDialog = ref(false)
const customCode = ref('')
const currentCodeEventIndex = ref(-1)

const openCustomCodeConfig = (index: number) => {
	currentCodeEventIndex.value = index
	const event = eventList.value[index]
	customCode.value = event.params?.code || ''
	showCustomCodeDialog.value = true
}

const closeCustomCodeDialog = () => {
	showCustomCodeDialog.value = false
}

const saveCustomCodeConfig = () => {
	// 保存代码到事件
	if (!eventList.value[currentCodeEventIndex.value].params) {
		eventList.value[currentCodeEventIndex.value].params = {}
	}
	eventList.value[currentCodeEventIndex.value].params!.code = customCode.value
	
	saveEvents()
	closeCustomCodeDialog()
}

// 流程选择弹窗
const showWorkflowSelectorDialog = ref(false)
const currentWorkflowEventIndex = ref(-1)

const openWorkflowSelector = (index: number) => {
	currentWorkflowEventIndex.value = index
	showWorkflowSelectorDialog.value = true
}

const closeWorkflowSelector = () => {
	showWorkflowSelectorDialog.value = false
}

const selectWorkflow = (workflow: { id: string; name: string; data: any }) => {
	// 保存选中的流程到事件
	if (!eventList.value[currentWorkflowEventIndex.value].params) {
		eventList.value[currentWorkflowEventIndex.value].params = {}
	}
	const params = eventList.value[currentWorkflowEventIndex.value].params as any
	params.processId = workflow.id
	params.processName = workflow.name
	params.processData = workflow.data
	
	saveEvents()
	closeWorkflowSelector()
}

// 获取当前节点的可配置属性列表（从节点的 data.props 中获取）
// 过滤掉 bindable === false 的属性（如动画属性）
const getNodeProperties = () => {
	if (!props.selectedNode) return []
	
	const properties: Array<{ key: string; label: string; type: string }> = []
	
	// 只从节点的 data.props 中获取属性配置
	if (props.selectedNode.data?.props && Array.isArray(props.selectedNode.data.props)) {
		props.selectedNode.data.props.forEach((prop: any) => {
			// 过滤掉 bindable === false 的属性（默认为 true）
			if (prop.bindable !== false) {
				properties.push({
					key: prop.key,
					label: prop.label,
					type: prop.type || 'text'
				})
			}
		})
	}
	
	return properties
}

// 根据 deviceId 获取设备名称
const getDeviceName = (deviceId?: string) => {
	if (!deviceId || !props.deviceData?.devices) return undefined
	
	const device = props.deviceData.devices.find((d: any) => d.id === deviceId)
	return device?.name
}

// Edge 相关方法
const handleUpdateEdge = (updates: any) => {
	emit('updateEdge', updates)
}

const handleDeleteEdge = () => {
	emit('deleteEdge')
}

</script>

<style scoped>
@import '../styles/components/PropertyPanel.css';
</style>