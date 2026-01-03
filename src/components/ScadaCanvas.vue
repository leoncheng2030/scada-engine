<!--
/**
 * Copyright (c) 2025 leoncheng
 * 
 * This source code is licensed under the proprietary license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 * @author leoncheng
 * @email nywqs@outlook.com
 */
-->
<template>
	<div class="scada-layout" data-scada-theme="dark">
		<!-- 编辑模式下显示 Header -->
		<Header
			v-if="!props.previewMode"
			:selected-nodes-count="selectedNodesCount"
			@save="handleSave"
			@import="handleImport"
			@workflow="handleWorkflow"
			@preview="handlePreview"
			@export="handleExport"
			@zoom-in="zoomIn"
			@zoom-out="zoomOut"
			@clear-all="clearAll"
			@align-left="alignLeft"
			@align-center="alignCenter"
			@align-right="alignRight"
			@align-top="alignTop"
			@align-middle="alignMiddle"
			@align-bottom="alignBottom"
			@distribute-horizontal="distributeHorizontal"
			@distribute-vertical="distributeVertical"
		/>

		<!-- 隐藏的文件输入框，用于导入 -->
		<input
			v-if="!props.previewMode"
			ref="fileInputRef"
			type="file"
			accept=".json"
			style="display: none"
			@change="handleFileSelect"
		/>

		<!-- 主体区域 -->
		<div class="scada-canvas-container">
			<!-- 左侧组件库（仅编辑模式） -->
			<ComponentLibrary
				v-if="!props.previewMode"
				@add-component="handleAddNode"
			/>

			<!-- 中间画布区域 -->
			<CanvasArea
				ref="canvasAreaRef"
			/>

			<!-- 右侧属性面板（仅编辑模式） -->
			<PropertyPanel
				v-if="!props.previewMode"
				ref="propertyPanelRef"
				:selected-node="selectedNode"
				:selected-edge="selectedEdge"
				@update-node="handleUpdateNode"
				@delete-node="handleDeleteNode"
				@update-edge="handleUpdateEdge"
				@delete-edge="handleDeleteEdge"
			/>
		</div>
		
		<!-- 底部 -->
		<Footer :auth-code="authCode" :custom-footer="customFooter" />
		
		<!-- 流程编排弹窗（仅编辑模式） -->
		<WorkflowDialog 
			v-if="!props.previewMode"
			v-model:visible="showWorkflowDialog"
			:scada-graph="graph"
			@close="showWorkflowDialog = false"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Graph } from '@antv/x6'
import { Selection } from '@antv/x6-plugin-selection'
import { Snapline } from '@antv/x6-plugin-snapline'
import { register } from '@antv/x6-vue-shape'
import Header from './Header.vue'
import ComponentLibrary from './ComponentLibrary.vue'
import CanvasArea from './CanvasArea.vue'
import PropertyPanel from './PropertyPanel.vue'
import Footer from './Footer.vue'
import WorkflowDialog from '../views/workflow/WorkflowDialog.vue'
import EChartsGauge from '../scada-components/iot/EChartsGauge.vue'
import { componentRegistry, canvasConfigManager } from '../scada-components'
import {
	saveToSession,
	loadFromSession,
	removeFromSession,
	STORAGE_KEYS,
	exportToJSON,
	showMessage,
	randomPosition,
	formatTimestamp,
	getCurrentTimestamp
} from '../utils'
import { animationEngine } from '../utils/animationEngine'

// 明确组件选项
defineOptions({
	name: 'ScadaCanvas',
	inheritAttrs: true
})

// 导出接口供外部使用
export interface CustomFooterConfig {
	copyright?: string
	license?: string
	contact?: string
}

export interface ScadaCanvasProps {
	authCode?: string // 软件授权码
	customFooter?: CustomFooterConfig // 自定义 Footer 配置
	previewMode?: boolean // 预览模式
	onSave?: () => void | Promise<void> // 自定义保存回调
}

const props = withDefaults(defineProps<ScadaCanvasProps>(), {
	authCode: '',
	customFooter: undefined,
	previewMode: false,
	onSave: undefined
})

// 定义 emit 事件
const emit = defineEmits(['preview'])

const canvasAreaRef = ref<any>(null)
const selectedNode = ref<any>(null)
const selectedEdge = ref<any>(null)
const selectedNodesCount = ref<number>(0) // 选中节点数量
const fileInputRef = ref<HTMLInputElement | null>(null)
const showWorkflowDialog = ref(false)
let graph: Graph | null = null

onMounted(() => {
	if (!canvasAreaRef.value?.containerRef) return

	// 获取画布配置
	const canvasConfig = canvasConfigManager.getConfig()

	// 注册支持流动动画的边
	Graph.registerEdge('animated-edge', {
		inherit: 'edge',
		markup: [
			{
				tagName: 'path',
				selector: 'line',
				attrs: {
					fill: 'none'
				}
			},
			{
				tagName: 'path',
				selector: 'wrap',
				attrs: {
					fill: 'none',
					stroke: 'transparent',
					strokeWidth: 20
				}
			},
			{
				tagName: 'circle',
				selector: 'circle'
			}
		],
		attrs: {
			line: {
				connection: true,
				stroke: '#10b981',
				strokeWidth: 2,
				targetMarker: {
					name: 'block',
					width: 8,
					height: 6
				}
			},
			wrap: {
				connection: true,
				strokeLinecap: 'round',
				strokeLinejoin: 'round'
			}
		}
	}, true)

	// 注册 ECharts Vue 组件节点
	register({
		shape: 'echarts-vue',
		width: 300,
		height: 300,
		component: EChartsGauge,
		ports: {
			groups: {
				top: {
					position: 'top',
					attrs: {
						circle: {
							r: 4,
							magnet: true,
							stroke: '#31d0c6',
							strokeWidth: 2,
							fill: '#fff'
						}
					}
				},
				right: {
					position: 'right',
					attrs: {
						circle: {
							r: 4,
							magnet: true,
							stroke: '#31d0c6',
							strokeWidth: 2,
							fill: '#fff'
						}
					}
				},
				bottom: {
					position: 'bottom',
					attrs: {
						circle: {
							r: 4,
							magnet: true,
							stroke: '#31d0c6',
							strokeWidth: 2,
							fill: '#fff'
						}
					}
				},
				left: {
					position: 'left',
					attrs: {
						circle: {
							r: 4,
							magnet: true,
							stroke: '#31d0c6',
							strokeWidth: 2,
							fill: '#fff'
						}
					}
				}
			},
			items: [
				{ id: 'port-top', group: 'top' },
				{ id: 'port-right', group: 'right' },
				{ id: 'port-bottom', group: 'bottom' },
				{ id: 'port-left', group: 'left' }
			]
		}
	})
	
	console.log('[Vue Shape] ECharts Vue 组件节点注册成功')

	// 初始化 X6 画布
	const container = canvasAreaRef.value.containerRef
	
	// 使用配置中的画布尺寸
	const canvasWidth = canvasConfig.size.width
	const canvasHeight = canvasConfig.size.height
	
	// 设置容器尺寸和缩放
	const updateContainerTransform = (scale: number) => {
		// 设置容器的基础尺寸
		container.style.width = `${canvasWidth}px`
		container.style.height = `${canvasHeight}px`
		// 使用 transform 缩放
		container.style.transform = `scale(${scale})`
		container.style.transformOrigin = 'center center'
	}
	
	// 应用初始缩放
	updateContainerTransform(canvasConfig.zoom.scale)
	
	// 创建画布实例
	graph = new Graph({
		container: container,
		// 使用配置中的画布尺寸
		width: canvasWidth,
		height: canvasHeight,
		background: canvasConfig.background.image ? {
			color: canvasConfig.background.color || '#1e293b',
			image: canvasConfig.background.image,
			size: canvasConfig.background.size || 'cover',
			repeat: canvasConfig.background.repeat || 'no-repeat',
			position: 'center'
		} : {
			color: canvasConfig.background.color || '#1e293b'
		},
		grid: canvasConfig.grid.enabled ? {
			size: canvasConfig.grid.size,
			visible: true,
			type: canvasConfig.grid.type || 'dot',
			args: {
				color: canvasConfig.grid.color || '#475569',
				thickness: 1
			}
		} : false,
		// 启用节点交互（预览模式下禁止编辑）
		interacting: {
			nodeMovable: !props.previewMode // 预览模式不允许移动节点
		},
		panning: {
			enabled: true,
			modifiers: 'shift'
		},
		mousewheel: {
			enabled: true,
			modifiers: ['ctrl', 'meta']
		},
		connecting: {
			router: {
				name: 'orth',
				args: {
					padding: 10
				}
			},
			connector: {
				name: 'rounded',
				args: {
					radius: 8
				}
			},
			snap: canvasConfig.magnetism.enabled ? {
				radius: canvasConfig.magnetism.threshold || 10
			} : false,
			allowBlank: false,
			allowLoop: false,
			allowNode: false,
			allowEdge: false,
			highlight: true,
			// 创建连线时的样式
			createEdge() {
				return graph!.createEdge({
					shape: 'animated-edge',
					zIndex: 0
				})
			},
			validateConnection({ targetMagnet }) {
				return !!targetMagnet
			}
		}
	})

	// 使用插件:选择插件（仅编辑模式）
	if (!props.previewMode) {
		graph.use(
			new Selection({
				enabled: true,
				movable: true, // 允许选中的节点移动
				rubberband: true, // 启用框选
				showNodeSelectionBox: false, // 不显示选择框
				showEdgeSelectionBox: false, // 不显示默认的边选择框（使用自定义样式）
				multiple: true, // 多选模式
				pointerEvents: 'none' // 不阻止鼠标事件
			})
		)
	}

	// 使用插件：对齐参考线
	if (canvasConfig.guides.enabled) {
		graph.use(
			new Snapline({
				enabled: true,
				sharp: true,
				clean: true
			})
		)
	}

	// 不需要再应用初始缩放，因为容器已经根据 scale 调整了尺寸

	// 尝试恢复之前保存的画布数据（仅编辑模式）
	if (!props.previewMode) {
		const savedCanvasData = loadFromSession(STORAGE_KEYS.SCADA_EDITOR_DATA)
		if (savedCanvasData?.cells?.length > 0) {
			try {
				// 清理可能损坏的数据
				const cleanedCells = savedCanvasData.cells.map((cell: any) => {
					if (cell.position && typeof cell.position === 'object') {
						// 确保 position 是有效的坐标对象
						if (typeof cell.position.x !== 'number' || typeof cell.position.y !== 'number') {
							cell.position = { x: 100, y: 100 }
						}
					}
					// 修正连线路由算法：将 manhattan 改为 orth
					if (cell.shape === 'edge' || cell.shape === 'animated-edge') {
						if (cell.router === 'manhattan' || cell.router?.name === 'manhattan') {
							cell.router = {
								name: 'orth',
								args: {
									padding: 10
								}
							}
						}
					}
					return cell
				})
				graph.fromJSON({ cells: cleanedCells })
				
				// 恢复后，对所有启用了动画的连线应用动画
				graph.getEdges().forEach((edge: any) => {
					const edgeData = edge.getData()
					if (edgeData?.animation?.enabled) {
						applyEdgeAnimation(edge, edgeData.animation)
					}
				})
			} catch (error) {
				console.error('恢复画布数据失败，清空缓存:', error)
				// 清空损坏的数据
				sessionStorage.removeItem(STORAGE_KEYS.SCADA_EDITOR_DATA)
			}
		}
	}

	// 监听 Selection 插件的选中变化事件
	graph.on('selection:changed', ({ selected }: any) => {
		// 统计选中的节点数量
		const selectedNodes = selected ? selected.filter((cell: any) => cell.isNode()) : []
		selectedNodesCount.value = selectedNodes.length
		
		if (selected && selected.length > 0) {
			const cell = selected[0]
			// 判断是节点还是连线
			if (cell.isNode()) {
				selectedNode.value = cell
				selectedEdge.value = null
			} else if (cell.isEdge()) {
				// 选中连线，应用高亮样式
				selectedEdge.value = cell
				selectedNode.value = null
				// 保存原始样式
				const originalAttrs = cell.getAttrs()
				cell.data = { ...cell.data, originalAttrs }
				// 应用选中样式：只改变颜色，不改变粗细
				cell.attr('line/stroke', '#3b82f6') // 蓝色高亮
			}
		} else {
			// 取消选中，恢复连线原始样式
			if (selectedEdge.value && selectedEdge.value.data?.originalAttrs) {
				const originalAttrs = selectedEdge.value.data.originalAttrs
				selectedEdge.value.attr('line/stroke', originalAttrs.line?.stroke || '#10b981')
			}
			selectedNode.value = null
			selectedEdge.value = null
		}
	})
	
	// 监听连线点击事件
	graph.on('edge:click', ({ edge }: any) => {
		// 选中连线 - 使用 Selection 插件选中
		graph!.select(edge)
	})
	
	// 监听画布点击，取消连线选中
	graph.on('blank:click', () => {
		selectedEdge.value = null
		selectedNode.value = null
	})
	
	// 监听节点移动事件 - 实时更新属性面板
	graph.on('node:change:position', () => {
		// 节点位置改变时，Vue 的 watch 会自动处理更新
	})

	// 监听节点尺寸变化事件
	graph.on('node:change:size', () => {
		// 节点尺寸改变时,Vue 的 watch 会自动处理更新
	})
	
	// 监听节点数据变化 - 检测动画配置变化并启动动画
	graph.on('node:change:data', ({ node }: any) => {
		const nodeData = node.getData()
		if (nodeData.animation) {
			// 检查是否启用动画
			if (nodeData.animation.enabled === true) {
				const animationConfig = {
					type: nodeData.animation.type || 'none',
					duration: nodeData.animation.duration || 1000,
					loop: nodeData.animation.loop !== false
				}
				// 启动或更新动画
				animationEngine.startAnimation(node, animationConfig)
			} else {
				// 如果禁用了动画，停止动画
				animationEngine.stopAnimation(node.id)
			}
		}
	})
	
	// 监听连线数据变化 - 检测动画配置变化并应用动画
	graph.on('edge:change:data', ({ edge }: any) => {
		const edgeData = edge.getData()
		if (edgeData?.animation) {
			applyEdgeAnimation(edge, edgeData.animation)
		}
	})

	// 监听键盘事件 - Delete 键删除节点或连线
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Delete' && graph) {
			if (selectedNode.value) {
				// 删除节点
				const nodeId = selectedNode.value.id
				// 停止动画
				animationEngine.stopAnimation(nodeId)
				graph.removeNode(nodeId)
				selectedNode.value = null
			} else if (selectedEdge.value) {
				// 删除连线
				const edgeId = selectedEdge.value.id
				graph.removeEdge(edgeId)
				selectedEdge.value = null
			}
		}
	}
	document.addEventListener('keydown', handleKeyDown)

	// 清理监听器
	onUnmounted(() => {
		document.removeEventListener('keydown', handleKeyDown)
	})
})

onUnmounted(() => {
	if (graph) {
		// 清空所有动画
		animationEngine.clearAll()
		
		// 在销毁前保存画布数据
		const canvasData = {
			cells: graph.toJSON().cells
		}
		saveToSession(STORAGE_KEYS.SCADA_EDITOR_DATA, canvasData)
		
		graph.dispose()
	}
})

// 监听画布配置变化
watch(
	() => canvasConfigManager.getConfig(),
	(config) => {
		if (!graph) return

		// 更新背景颜色
		if (config.background.image) {
			// 有背景图片时
			graph.drawBackground({
				color: config.background.color || '#1e293b',
				image: config.background.image,
				size: config.background.size || 'cover',
				repeat: config.background.repeat || 'no-repeat',
				position: 'center'
			})
		} else {
			// 无背景图片时
			graph.drawBackground({ color: config.background.color || '#1e293b' })
		}

		// 更新容器缩放
		const container = canvasAreaRef.value?.containerRef
		if (container) {
			// 使用 transform 缩放
			container.style.transform = `scale(${config.zoom.scale})`
			container.style.transformOrigin = 'center center'
			// 更新 Graph 尺寸
			graph.resize(config.size.width, config.size.height)
			// 同时更新容器基础尺寸
			container.style.width = `${config.size.width}px`
			container.style.height = `${config.size.height}px`
		}

		// 更新网格
		if (config.grid.enabled) {
			graph.drawGrid({
				type: config.grid.type || 'dot',
				args: {
					color: config.grid.color || '#475569',  // 使用明显的网格颜色
					thickness: 1
				}
			})
			graph.showGrid()
		} else {
			graph.hideGrid()
		}

		// 更新网格大小
		if (config.grid.enabled && config.grid.size) {
			graph.setGridSize(config.grid.size)
		}

		// 更新偏移
		graph.translate(config.offset.x, config.offset.y)

		// 更新吸附和参考线需要重新创建 Graph，这里只提示
	},
	{ deep: true }
)

// 计数器，用于生成唯一名称
const componentCounters = ref<Record<string, number>>({})

// 生成组件默认名称
const generateComponentName = (componentType: string, componentName: string): string => {
	if (!componentCounters.value[componentType]) {
		componentCounters.value[componentType] = 0
	}
	componentCounters.value[componentType]++
	return `${componentName}_${componentCounters.value[componentType]}`
}

// 添加节点（根据类型）
const handleAddNode = (type: string) => {
	if (!graph) return

	const config = componentRegistry.getComponent(type)
	if (!config) {
		console.error(`未找到组件配置: ${type}`)
		return
	}

	// 生成默认名称
	const defaultName = generateComponentName(type, config.metadata.name)

	// 初始化默认动画配置
	const defaultAnimation = {
		enabled: false,  // 默认禁用动画，用户需要手动启用
		type: 'none',
		duration: 1000,
		loop: true
	}

	// 生成随机位置
	const position = randomPosition(50, 50, 400, 300)

	const nodeConfig: any = {
		x: position.x,
		y: position.y,
		shape: config.shape,
		width: config.width,
		height: config.height,
		label: config.label,
		attrs: config.attrs,
		ports: config.ports,  // 添加接线桩配置
		data: {
			...config.data,
			componentType: type,
			componentName: defaultName,  // 添加默认名称
			props: config.props,
			animation: defaultAnimation,  // 添加默认动画配置
			// 保存原始样式用于恢复选中效果
			originalStroke: config.attrs?.body?.stroke || '#2563eb',
			originalStrokeWidth: config.attrs?.body?.strokeWidth || 2
		}
	}

	const node = graph.addNode(nodeConfig)
	console.log('[Node] 添加节点:', config.shape, node.id, nodeConfig)
	
	// 先取消所有选中，再选中新添加的节点
	graph.cleanSelection()
	graph.select(node)
}

// 更新节点属性
const handleUpdateNode = (data: any) => {
	if (!selectedNode.value) return
	
	// 使用 attr() 方法单独设置属性，避免覆盖其他属性
	if (data.attrs) {
		// 遍历属性，逐个设置
		Object.keys(data.attrs).forEach(key => {
			const attrValue = data.attrs[key]
			if (typeof attrValue === 'object') {
				// 如果是对象，遍历子属性
				Object.keys(attrValue).forEach(subKey => {
					selectedNode.value!.attr(`${key}/${subKey}`, attrValue[subKey])
				})
			} else {
				selectedNode.value!.attr(key, attrValue)
			}
		})
	}
	
	// 验证并设置 position
	if (data.position) {
		if (typeof data.position.x === 'number' && typeof data.position.y === 'number') {
			selectedNode.value.setPosition(data.position)
		} else {
			console.error('position 数据格式错误:', data.position)
		}
	}
	
	// 验证并设置 size
	if (data.size) {
		if (typeof data.size.width === 'number' && typeof data.size.height === 'number') {
			selectedNode.value.setSize(data.size)
		} else {
			console.error('size 数据格式错误:', data.size)
		}
	}
	
	// 更新 data 时，不要包含 position 和 size
	if (data.data) {
		// 从 data.data 中移除 position 和 size 字段（如果存在）
		const cleanedData = { ...data.data }
		delete cleanedData.position
		delete cleanedData.size
		// 使用 store.set 完全替换 data
		selectedNode.value.store.set('data', cleanedData)
	}
}

// 删除节点
const handleDeleteNode = () => {
	if (!selectedNode.value || !graph) return
	const nodeId = selectedNode.value.id
	// 停止动画
	animationEngine.stopAnimation(nodeId)
	graph.removeNode(nodeId)
	selectedNode.value = null
}

// 更新连线属性
const handleUpdateEdge = (data: any) => {
	if (!selectedEdge.value) return
	
	// 更新属性
	if (data.attrs) {
		Object.keys(data.attrs).forEach(key => {
			const attrValue = data.attrs[key]
			if (typeof attrValue === 'object') {
				// 如果是对象，遍历子属性
				Object.keys(attrValue).forEach(subKey => {
					selectedEdge.value!.attr(`${key}/${subKey}`, attrValue[subKey])
					// 更新保存的原始样式
					if (selectedEdge.value!.data?.originalAttrs?.[key]) {
						selectedEdge.value!.data.originalAttrs[key][subKey] = attrValue[subKey]
					}
				})
			} else {
				selectedEdge.value!.attr(key, attrValue)
			}
		})
		
		// 重新应用选中高亮效果（只改变颜色）
		const currentAttrs = selectedEdge.value.getAttrs()
		selectedEdge.value.data = { ...selectedEdge.value.data, originalAttrs: currentAttrs }
		selectedEdge.value.attr('line/stroke', '#3b82f6')
	}
	
	// 更新路由
	if (data.router) {
		selectedEdge.value.setRouter(data.router)
	}
	
	// 更新连接器
	if (data.connector) {
		selectedEdge.value.setConnector(data.connector)
	}
	
	// 更新动画配置
	if (data.animation) {
		applyEdgeAnimation(selectedEdge.value, data.animation)
	}
	
	// 更新data
	if (data.data) {
		selectedEdge.value.setData({ ...selectedEdge.value.data, ...data.data })
	}
}

// 删除连线
const handleDeleteEdge = () => {
	if (!selectedEdge.value || !graph) return
	graph.removeEdge(selectedEdge.value.id)
	selectedEdge.value = null
}

// 应用连线动画
const applyEdgeAnimation = (edge: any, animation: any) => {
	// 安全检查：确保 edge 存在且是有效对象
	if (!edge || typeof edge.attr !== 'function') {
		console.warn('applyEdgeAnimation: edge 对象无效', edge)
		return
	}
	
	if (!animation || !animation.enabled) {
		// 关闭动画
		edge.attr('line/strokeDasharray', undefined)
		if (typeof edge.removeAttr === 'function') {
			edge.removeAttr('line/class')
		}
		// 移除光点
		edge.attr('circle', undefined)
		if (typeof edge.stopTransition === 'function') {
			edge.stopTransition('attrs/circle/atConnectionRatio')
		}
		return
	}
	
	// 使用光点流动动画
	const duration = animation.duration || 2000 // 默认2秒
	
	// 设置光点样式
	edge.attr('circle', {
		r: 4,
		atConnectionRatio: 0,
		fill: {
			type: 'radialGradient',
			stops: [
				{ offset: '0%', color: '#FFF' },
				{ offset: '100%', color: edge.attr('line/stroke') || '#10b981' }
			]
		},
		stroke: edge.attr('line/stroke') || '#10b981',
		strokeWidth: 1
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

// 清空画布
const clearAll = () => {
	if (!graph) return
	if (confirm('确定要清空画布吗？')) {
		// 清空所有动画
		animationEngine.clearAll()
		// 清空画布元素
		graph.clearCells()
		// 清除选中节点
		selectedNode.value = null
		// 清除 sessionStorage 中的缓存数据
		removeFromSession(STORAGE_KEYS.SCADA_EDITOR_DATA)
	}
}

// 放大
const zoomIn = () => {
	if (!graph) return
	const currentScale = canvasConfigManager.getConfig().zoom.scale
	const newScale = Math.min(5, currentScale + 0.1)
	canvasConfigManager.setZoom(newScale)
}

// 缩小
const zoomOut = () => {
	if (!graph) return
	const currentScale = canvasConfigManager.getConfig().zoom.scale
	const newScale = Math.max(0.1, currentScale - 0.1)
	canvasConfigManager.setZoom(newScale)
}

// 左对齐
const alignLeft = () => {
	if (!graph) return
	const selectedCells = graph.getSelectedCells().filter(cell => cell.isNode())
	if (selectedCells.length < 2) {
		showMessage('请选择至少两个节点', 'warning')
		return
	}
	const minX = Math.min(...selectedCells.map(node => node.getPosition().x))
	selectedCells.forEach(node => {
		node.setPosition({ x: minX, y: node.getPosition().y })
	})
}

// 水平居中
const alignCenter = () => {
	if (!graph) return
	const selectedCells = graph.getSelectedCells().filter(cell => cell.isNode())
	if (selectedCells.length < 2) {
		showMessage('请选择至少两个节点', 'warning')
		return
	}
	const centerXs = selectedCells.map(node => node.getPosition().x + node.getSize().width / 2)
	const avgCenterX = centerXs.reduce((sum, x) => sum + x, 0) / centerXs.length
	selectedCells.forEach(node => {
		const newX = avgCenterX - node.getSize().width / 2
		node.setPosition({ x: newX, y: node.getPosition().y })
	})
}

// 右对齐
const alignRight = () => {
	if (!graph) return
	const selectedCells = graph.getSelectedCells().filter(cell => cell.isNode())
	if (selectedCells.length < 2) {
		showMessage('请选择至少两个节点', 'warning')
		return
	}
	const maxRight = Math.max(...selectedCells.map(node => node.getPosition().x + node.getSize().width))
	selectedCells.forEach(node => {
		const newX = maxRight - node.getSize().width
		node.setPosition({ x: newX, y: node.getPosition().y })
	})
}

// 顶部对齐
const alignTop = () => {
	if (!graph) return
	const selectedCells = graph.getSelectedCells().filter(cell => cell.isNode())
	if (selectedCells.length < 2) {
		showMessage('请选择至少两个节点', 'warning')
		return
	}
	const minY = Math.min(...selectedCells.map(node => node.getPosition().y))
	selectedCells.forEach(node => {
		node.setPosition({ x: node.getPosition().x, y: minY })
	})
}

// 垂直居中
const alignMiddle = () => {
	if (!graph) return
	const selectedCells = graph.getSelectedCells().filter(cell => cell.isNode())
	if (selectedCells.length < 2) {
		showMessage('请选择至少两个节点', 'warning')
		return
	}
	const centerYs = selectedCells.map(node => node.getPosition().y + node.getSize().height / 2)
	const avgCenterY = centerYs.reduce((sum, y) => sum + y, 0) / centerYs.length
	selectedCells.forEach(node => {
		const newY = avgCenterY - node.getSize().height / 2
		node.setPosition({ x: node.getPosition().x, y: newY })
	})
}

// 底部对齐
const alignBottom = () => {
	if (!graph) return
	const selectedCells = graph.getSelectedCells().filter(cell => cell.isNode())
	if (selectedCells.length < 2) {
		showMessage('请选择至少两个节点', 'warning')
		return
	}
	const maxBottom = Math.max(...selectedCells.map(node => node.getPosition().y + node.getSize().height))
	selectedCells.forEach(node => {
		const newY = maxBottom - node.getSize().height
		node.setPosition({ x: node.getPosition().x, y: newY })
	})
}

// 横向分布
const distributeHorizontal = () => {
	if (!graph) return
	const selectedCells = graph.getSelectedCells().filter(cell => cell.isNode())
	if (selectedCells.length < 3) {
		showMessage('请选择至少三个节点', 'warning')
		return
	}
	// 按X坐标排序
	const sorted = selectedCells.sort((a, b) => a.getPosition().x - b.getPosition().x)
	const first = sorted[0]
	const last = sorted[sorted.length - 1]
	const totalWidth = last.getPosition().x - first.getPosition().x
	const gap = totalWidth / (sorted.length - 1)
	
	sorted.forEach((node, index) => {
		if (index === 0 || index === sorted.length - 1) return // 保持首尾不动
		const newX = first.getPosition().x + gap * index
		node.setPosition({ x: newX, y: node.getPosition().y })
	})
}

// 纵向分布
const distributeVertical = () => {
	if (!graph) return
	const selectedCells = graph.getSelectedCells().filter(cell => cell.isNode())
	if (selectedCells.length < 3) {
		showMessage('请选择至少三个节点', 'warning')
		return
	}
	// 按Y坐标排序
	const sorted = selectedCells.sort((a, b) => a.getPosition().y - b.getPosition().y)
	const first = sorted[0]
	const last = sorted[sorted.length - 1]
	const totalHeight = last.getPosition().y - first.getPosition().y
	const gap = totalHeight / (sorted.length - 1)
	
	sorted.forEach((node, index) => {
		if (index === 0 || index === sorted.length - 1) return // 保持首尾不动
		const newY = first.getPosition().y + gap * index
		node.setPosition({ x: node.getPosition().x, y: newY })
	})
}

// 头部操作
const handleSave = async () => {
	if (!graph) {
		showMessage('画布未初始化', 'error')
		return
	}
	
	try {
		console.log('[ScadaCanvas] handleSave 被调用')
		console.log('[ScadaCanvas] props.onSave:', props.onSave)
		
		// 如果有自定义保存回调，优先使用
		if (props.onSave) {
			console.log('[ScadaCanvas] 调用自定义 onSave 回调')
			await props.onSave()
			console.log('[ScadaCanvas] 自定义 onSave 回调执行完成')
			return
		}
		
		console.log('[ScadaCanvas] 没有自定义回调，执行默认下载')
		// 默认下载 JSON 文件
		const scadaData = {
			version: '1.0.0',
			timestamp: new Date().toISOString(),
			config: {
				size: canvasConfigManager.getConfig().size,
				background: canvasConfigManager.getConfig().background,
				grid: canvasConfigManager.getConfig().grid,
				guides: canvasConfigManager.getConfig().guides,
				magnetism: canvasConfigManager.getConfig().magnetism,
				zoom: canvasConfigManager.getConfig().zoom
			},
			cells: graph.toJSON().cells
		}
		
		// 下载为 JSON 文件
		const blob = new Blob([JSON.stringify(scadaData, null, 2)], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		const filename = `scada-canvas-${new Date().getTime()}.json`
		link.href = url
		link.download = filename
		link.click()
		URL.revokeObjectURL(url)
		
		showMessage('保存成功', 'success')
	} catch (error) {
		console.error('保存失败', error)
		showMessage('保存失败，请查看控制台', 'error')
	}
}

// 导入功能
const handleImport = () => {
	// 触发文件选择
	if (fileInputRef.value) {
		fileInputRef.value.click()
	}
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
	const target = event.target as HTMLInputElement
	const file = target.files?.[0]
	
	if (!file) {
		showMessage('请选择文件', 'error')
		return
	}
	
	const reader = new FileReader()
	reader.onload = (e) => {
		try {
			const importData = JSON.parse(e.target?.result as string)
			
			// 验证数据结构
			if (!importData.cells) {
				showMessage('无效的JSON文件格式', 'error')
				return
			}
			
			if (!confirm('导入将清空当前画布,是否继续?')) {
				return
			}
			
			// 清空当前画布
			if (graph) {
				graph.clearCells()
				
				// 加载导入的数据
				graph.fromJSON({ cells: importData.cells })
				
				// 导入后，对所有启用了动画的连线应用动画
				graph.getEdges().forEach((edge: any) => {
					const edgeData = edge.getData()
					if (edgeData?.animation?.enabled) {
						applyEdgeAnimation(edge, edgeData.animation)
					}
				})
				
				// 如果有配置信息，应用配置
				if (importData.config) {
					canvasConfigManager.updateConfig(importData.config)
				}
				
				// 导入流程数据
				if (importData.workflows && Array.isArray(importData.workflows) && importData.workflows.length > 0) {
					try {
						const stored = localStorage.getItem('saved-workflows')
						const existingWorkflows = stored ? JSON.parse(stored) : []
						
						let importedCount = 0
						let updatedCount = 0
						
						// 合并流程数据
						importData.workflows.forEach((newWf: any) => {
							const existIndex = existingWorkflows.findIndex((wf: any) => wf.id === newWf.id)
							if (existIndex >= 0) {
								// 更新现有流程
								existingWorkflows[existIndex] = {
									...newWf,
									updatedAt: Date.now()
								}
								updatedCount++
							} else {
								// 添加新流程
								existingWorkflows.push(newWf)
								importedCount++
							}
						})
						
						// 保存回 localStorage
						localStorage.setItem('saved-workflows', JSON.stringify(existingWorkflows))
												
						showMessage(`导入成功 画布已加载，流程: 新增${importedCount}个，更新${updatedCount}个`, 'success')
					} catch (error) {
						console.error('导入流程数据失败:', error)
						showMessage('画布导入成功, 但流程数据导入失败', 'warning')
					}
				} else {
					showMessage('导入成功', 'success')
				}
				
				// 清空文件选择,允许重复导入同一文件
				if (fileInputRef.value) {
					fileInputRef.value.value = ''
				}
			}
		} catch (error) {
			console.error('导入失败', error)
			showMessage('导入失败，JSON格式错误', 'error')
			// 清空文件选择
			if (fileInputRef.value) {
				fileInputRef.value.value = ''
			}
		}
	}
	
	reader.readAsText(file)
}

const handlePreview = () => {
	console.log('🎬 [ScadaCanvas] handlePreview 被调用')
	if (!graph) {
		console.error('⚠️ [ScadaCanvas] graph 不存在')
		return
	}
	
	// 获取画布数据
	const canvasData = {
		cells: graph.toJSON().cells,
		config: {
			width: canvasConfigManager.getConfig().size.width,
			height: canvasConfigManager.getConfig().size.height,
			background: canvasConfigManager.getConfig().background,
			grid: canvasConfigManager.getConfig().grid
		}
	}
	
	// 将数据存储到 sessionStorage
	saveToSession(STORAGE_KEYS.SCADA_PREVIEW_DATA, canvasData)
	console.log('✅ [ScadaCanvas] 数据已保存到 sessionStorage')
	
	// 触发预览事件，由父组件处理路由跳转
	console.log('📤 [ScadaCanvas] 即将触发 preview 事件')
	emit('preview')
	console.log('✅ [ScadaCanvas] preview 事件已触发')
}

const handleWorkflow = () => {
	// 打开流程编排弹窗
	showWorkflowDialog.value = true
}

const handleExport = () => {
	if (!graph) {
		showMessage('画布未初始化', 'error')
		return
	}
	
	try {
		// 获取画布数据
		const exportData = {
			version: '1.0.0',
			timestamp: formatTimestamp(getCurrentTimestamp()),
			config: {
				size: canvasConfigManager.getConfig().size,
				background: canvasConfigManager.getConfig().background,
				grid: canvasConfigManager.getConfig().grid,
				guides: canvasConfigManager.getConfig().guides,
				magnetism: canvasConfigManager.getConfig().magnetism,
				zoom: canvasConfigManager.getConfig().zoom
			},
			cells: graph.toJSON().cells,
			nodes: graph.getNodes().map(node => ({
				id: node.id,
				type: node.shape,
				position: node.getPosition(),
				size: node.getSize(),
				label: node.attr('label/text'),
				data: node.getData()
			})),
			edges: graph.getEdges().map(edge => ({
				id: edge.id,
				source: edge.getSourceCellId(),
				target: edge.getTargetCellId()
			})),
			workflows: [] // 收集所有被引用的流程
		}
		
		// 收集所有节点中引用的流程ID
		const referencedWorkflowIds = new Set<string>()
		graph.getNodes().forEach(node => {
			const nodeData = node.getData()
			// 检查事件配置中是否引用了流程
			if (nodeData?.events && Array.isArray(nodeData.events)) {
				nodeData.events.forEach((event: any) => {
					if (event.action === 'callProcess' && event.params?.processId) {
						referencedWorkflowIds.add(event.params.processId)
					}
				})
			}
		})
		
		// 从localStorage加载被引用的流程数据
		if (referencedWorkflowIds.size > 0) {
			try {
				const stored = localStorage.getItem('saved-workflows')
				if (stored) {
					const allWorkflows = JSON.parse(stored)
					// 只打包被引用的流程
					exportData.workflows = allWorkflows.filter((wf: any) => 
						referencedWorkflowIds.has(wf.id)
					)
				}
			} catch (error) {
				console.error('加载流程数据失败:', error)
			}
		}
		
		const filename = exportToJSON(exportData, 'scada-export')
		
		showMessage(`已导出为 ${filename}`, 'success')
	} catch (error) {
		console.error('导出失败', error)
		showMessage('导出失败，请查看控制台', 'error')
	}
}

// 暴露核心方法给外部使用
defineExpose({
	// === 文件操作 ===
	/** 保存画布数据到 sessionStorage */
	save: handleSave,
	/** 触发文件选择，导入 JSON 数据 */
	import: handleImport,
	/** 导出画布数据为 JSON 文件 */
	export: handleExport,
	
	// === 视图操作 ===
	/** 跳转到预览页面 */
	preview: handlePreview,
	/** 打开流程编排弹窗 */
	workflow: handleWorkflow,
	
	// === 画布操作 ===
	/** 放大画布 */
	zoomIn,
	/** 缩小画布 */
	zoomOut,
	/** 清空画布所有元素 */
	clearAll,
	
	// === 对齐和分布 ===
	/** 左对齐选中节点 */
	alignLeft,
	/** 水平居中选中节点 */
	alignCenter,
	/** 右对齐选中节点 */
	alignRight,
	/** 顶部对齐选中节点 */
	alignTop,
	/** 垂直居中选中节点 */
	alignMiddle,
	/** 底部对齐选中节点 */
	alignBottom,
	/** 横向分布选中节点 */
	distributeHorizontal,
	/** 纵向分布选中节点 */
	distributeVertical,
	
	// === 节点操作 ===
	/** 添加节点 */
	addNode: handleAddNode,
	/** 更新节点 */
	updateNode: handleUpdateNode,
	/** 删除节点 */
	deleteNode: handleDeleteNode,
	/** 获取当前选中的节点 */
	getSelectedNode: () => selectedNode.value,
	/** 选中节点 */
	selectNode: (nodeId: string) => {
		if (!graph) return false
		const node = graph.getCellById(nodeId)
		if (node) {
			graph.select(node)
			return true
		}
		return false
	},
	/** 取消选中 */
	clearSelection: () => {
		if (!graph) return
		graph.unselect(graph.getSelectedCells())
		selectedNode.value = null
	},
	
	// === 数据访问 ===
	/** 获取 X6 Graph 实例 */
	getGraph: () => graph,
	/** 获取画布完整数据 */
	getCanvasData: () => {
		if (!graph) return null
		return {
			version: '1.0.0',
			timestamp: formatTimestamp(getCurrentTimestamp()),
			config: canvasConfigManager.getConfig(),
			cells: graph.toJSON().cells,
			nodes: graph.getNodes().map(node => ({
				id: node.id,
				type: node.shape,
				position: node.getPosition(),
				size: node.getSize(),
				label: node.attr('label/text'),
				data: node.getData()
			})),
			edges: graph.getEdges().map(edge => ({
				id: edge.id,
				source: edge.getSourceCellId(),
				target: edge.getTargetCellId()
			}))
		}
	},
	/** 加载画布数据 */
	loadCanvasData: (data: any) => {
		if (!graph) return false
		try {
			graph.clearCells()
			graph.fromJSON({ cells: data.cells })
			if (data.config) {
				canvasConfigManager.updateConfig(data.config)
			}
			
			// 加载后，对所有启用了动画的连线应用动画
			graph.getEdges().forEach((edge: any) => {
				const edgeData = edge.getData()
				if (edgeData?.animation?.enabled) {
					applyEdgeAnimation(edge, edgeData.animation)
				}
			})
			
			return true
		} catch (error) {
			console.error('加载画布数据失败:', error)
			return false
		}
	},
	/** 获取所有节点 */
	getAllNodes: () => {
		if (!graph) return []
		return graph.getNodes().map(node => ({
			id: node.id,
			type: node.shape,
			position: node.getPosition(),
			size: node.getSize(),
			label: node.attr('label/text'),
			data: node.getData()
		}))
	},
	/** 根据ID获取节点 */
	getNodeById: (nodeId: string) => {
		if (!graph) return null
		const cell = graph.getCellById(nodeId)
		if (!cell || !cell.isNode()) return null
		const node = cell as any
		return {
			id: node.id,
			type: node.shape,
			position: node.getPosition(),
			size: node.getSize(),
			label: node.attr('label/text'),
			data: node.getData()
		}
	},
	
	// === 画布配置 ===
	/** 获取画布配置管理器 */
	getConfigManager: () => canvasConfigManager,
	/** 更新画布配置 */
	updateCanvasConfig: (config: any) => {
		canvasConfigManager.updateConfig(config)
	},
	/** 设置画布缩放 */
	setZoom: (scale: number) => {
		canvasConfigManager.setZoom(scale)
	},
	/** 设置画布大小 */
	setCanvasSize: (width: number, height: number) => {
		canvasConfigManager.updateSize({ width, height })
	},
	/** 设置背景颜色 */
	setBackgroundColor: (color: string) => {
		canvasConfigManager.updateBackground({ color })
	},
	
	// === 动画控制 ===
	/** 获取动画引擎 */
	getAnimationEngine: () => animationEngine
})
</script>

<style scoped>
.scada-layout {
	width: 100%;
	height: 100%;
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background: #1a1a2e;
}

.scada-canvas-container {
	flex: 1;
	display: flex;
	background: #0f172a;
	overflow: hidden;
	min-height: 0;
}

/* X6 选中样式增强 - 不改变边框,使用外部轮廓 */
:deep(.x6-node-selected) {
	/* 外部轮廓 */
	outline: 2px solid #3b82f6;
	outline-offset: 2px;
	/* 外部光晕 */
	box-shadow: 
		0 0 0 4px rgba(59, 130, 246, 0.15),
		0 0 12px rgba(59, 130, 246, 0.3);
	/* 平滑过渡 */
	transition: outline 0.15s ease, box-shadow 0.15s ease;
}

/* 不改变节点自身的边框样式 */
:deep(.x6-node-selected rect),
:deep(.x6-node-selected circle),
:deep(.x6-node-selected ellipse) {
	/* 保持原有边框不变 */
	filter: brightness(1.05);
}

/* 提示消息样式 */
:global(.scada-toast) {
	position: fixed;
	top: 20px;
	left: 50%;
	transform: translateX(-50%) translateY(-100px);
	padding: 12px 24px;
	border-radius: 6px;
	color: #fff;
	font-size: 14px;
	font-weight: 500;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	z-index: 9999;
	opacity: 0;
	transition: all 0.3s ease;
	pointer-events: none;
}

:global(.scada-toast.show) {
	transform: translateX(-50%) translateY(0);
	opacity: 1;
}

:global(.scada-toast-success) {
	background: linear-gradient(135deg, #10b981, #059669);
}

:global(.scada-toast-error) {
	background: linear-gradient(135deg, #ef4444, #dc2626);
}

:global(.scada-toast-warning) {
	background: linear-gradient(135deg, #f59e0b, #d97706);
}

/* 连线流动动画 */
@keyframes edge-flow {
	0% {
		stroke-dashoffset: 0;
	}
	100% {
		stroke-dashoffset: -100;
	}
}

/* 全局样式，应用到X6连线上 */
:deep(.x6-edge path) {
	transition: stroke 0.3s ease, stroke-width 0.3s ease;
}

/* 慢速流动 */
:deep(.edge-flow-slow) {
	animation: edge-flow 4s linear infinite;
}

/* 正常速度流动 */
:deep(.edge-flow-normal) {
	animation: edge-flow 2s linear infinite;
}

/* 快速流动 */
:deep(.edge-flow-fast) {
	animation: edge-flow 1s linear infinite;
}
</style>
