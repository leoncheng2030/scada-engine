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
			@data-source="handleDataSource"
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
				:is-collapsed="leftPanelCollapsed"
				@update:collapsed="leftPanelCollapsed = $event"
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
				:device-data="mergedDeviceData"
				:is-collapsed="rightPanelCollapsed"
				@update:collapsed="rightPanelCollapsed = $event"
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
		
		<!-- 数据源管理对话框（仅编辑模式） -->
		<DataSourceDialog
			v-if="showDataSourceDialog && !props.previewMode"
			:data-sources="dataSources"
			@close="showDataSourceDialog = false"
			@add="handleAddDataSource"
			@save="handleSaveDataSource"
			@delete="handleDeleteDataSource"
		/>
		
		<!-- 右键菜单（仅编辑模式） -->
		<ContextMenu
			v-if="!props.previewMode"
			v-model:visible="contextMenu.visible"
			:position="contextMenu.position"
			:menu-items="contextMenu.items"
			@menu-click="handleContextMenuClick"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
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
import DataSourceDialog from './DataSourceDialog.vue'
import ContextMenu from './ContextMenu.vue'
import type { MenuItem } from './ContextMenu.vue'
import { componentRegistry, canvasConfigManager } from '../scada-components'
import {
	saveToLocal,
	loadFromLocal,
	removeFromLocal,
	STORAGE_KEYS,
	showMessage,
	formatTimestamp,
	getCurrentTimestamp,
	graphOperations,
	nodeOperations,
	edgeOperations,
	canvasDataHandler,
	dataBindingService,
	graphEventManager,
	canvasConfigWatcher
} from '../utils'
import { animationEngine } from '../utils/animationEngine'
import { dataSourceManager, type DataSource } from '../services/dataSourceManager'

// 明确组件选项
defineOptions({
	name: 'ScadaCanvas',
	inheritAttrs: true
})

// 定义接口类型
interface CustomFooterConfig {
	copyright?: string
	license?: string
	contact?: string
}

interface ScadaCanvasProps {
	authCode?: string // 软件授权码
	customFooter?: CustomFooterConfig // 自定义 Footer 配置
	previewMode?: boolean // 预览模式
	onSave?: (() => void) | (() => Promise<void>) // 自定义保存回调
	deviceData?: any // 设备数据
	dataSource?: any // 数据源配置
}

const props = withDefaults(defineProps<ScadaCanvasProps>(), {
	authCode: '',
	customFooter: undefined,
	previewMode: false,
	onSave: undefined,
	deviceData: () => ({}),
	dataSource: () => ({})
})

// 定义 emit 事件
const emit = defineEmits(['preview'])

const canvasAreaRef = ref<any>(null)
const selectedNode = ref<any>(null)
const selectedEdge = ref<any>(null)
const selectedNodesCount = ref<number>(0) // 选中节点数量
const fileInputRef = ref<HTMLInputElement | null>(null)
const showWorkflowDialog = ref(false)
const showDataSourceDialog = ref(false)  // 数据源管理对话框
const leftPanelCollapsed = ref(false)  // 左侧面板折叠状态
const rightPanelCollapsed = ref(false) // 右侧面板折叠状态
let graph: Graph | null = null

// 右键菜单状态
const contextMenu = ref<{
	visible: boolean
	position: { x: number; y: number }
	items: MenuItem[]
	targetCell: any
}>({
	visible: false,
	position: { x: 0, y: 0 },
	items: [],
	targetCell: null
})

// 数据源列表
const dataSources = ref<DataSource[]>([])

// 合并外部和数据源的 deviceData
const mergedDeviceData = computed(() => {
	// 优先使用外部传入的 deviceData
	if (props.deviceData && Object.keys(props.deviceData).length > 0) {
		return props.deviceData
	}
	
	// 否则使用数据源管理器中的数据
	const devices = dataSourceManager.getAllDevices().map(item => ({
		...item.device,
		_dataSourceId: item.dataSourceId,
		_dataSourceName: item.dataSourceName
	}))
	
	return { devices }
})

// 自动计算适合的缩放比例（保持宽高比）
const calculateFitScale = () => {
	const canvasArea = canvasAreaRef.value?.containerRef?.parentElement
	if (!canvasArea) return 1
	
	const canvasConfig = canvasConfigManager.getConfig()
	const canvasWidth = canvasConfig.size.width
	const canvasHeight = canvasConfig.size.height
	
	const areaWidth = canvasArea.clientWidth
	const areaHeight = canvasArea.clientHeight
	
	// 留出一些边距（40px）
	const padding = 40
	const availableWidth = areaWidth - padding
	const availableHeight = areaHeight - padding
	
	// 计算画布的宽高比
	const canvasRatio = canvasWidth / canvasHeight
	
	// 计算可用区域的宽高比
	const availableRatio = availableWidth / availableHeight
	
	// 根据宽高比决定是以宽度还是高度为基准进行缩放
	let autoScale
	let scaleBy
	if (canvasRatio > availableRatio) {
		// 画布更宽（如 16:9 画布 vs 正方形容器），以宽度为基准
		autoScale = availableWidth / canvasWidth
		scaleBy = 'width'
	} else {
		// 画布更高（如 16:9 画布 vs 竖向容器），以高度为基准
		autoScale = availableHeight / canvasHeight
		scaleBy = 'height'
	}
	
	// 最大不超过1（100%），避免画布被放大
	const finalScale = Math.min(autoScale, 1)
	return finalScale
}

// 计算容器的实际显示尺寸（根据可用空间和宽高比）
const calculateContainerSize = (): { width: number; height: number; canvasWidth: number; canvasHeight: number } | null => {
	if (!canvasAreaRef.value?.containerRef) return null
	
	const canvasConfig = canvasConfigManager.getConfig()
	const canvasWidth = canvasConfig.size.width
	const canvasHeight = canvasConfig.size.height
	const canvasRatio = canvasWidth / canvasHeight
	
	const canvasArea = canvasAreaRef.value.containerRef.parentElement
	if (!canvasArea) return null
	
	const areaWidth = canvasArea.clientWidth
	const areaHeight = canvasArea.clientHeight
	const padding = 40
	const availableWidth = areaWidth - padding
	const availableHeight = areaHeight - padding
	const availableRatio = availableWidth / availableHeight
	
	// 根据宽高比计算最佳显示尺寸
	let displayWidth, displayHeight
	if (canvasRatio > availableRatio) {
		// 画布更宽，以可用宽度为基准
		displayWidth = availableWidth
		displayHeight = availableWidth / canvasRatio
	} else {
		// 画布更高，以可用高度为基准
		displayHeight = availableHeight
		displayWidth = availableHeight * canvasRatio
	}
	
	// 确保不超过逻辑尺寸
	displayWidth = Math.min(displayWidth, canvasWidth)
	displayHeight = Math.min(displayHeight, canvasHeight)

	return { width: displayWidth, height: displayHeight, canvasWidth, canvasHeight }
}

// 设置容器尺寸并应用 X6 缩放
const updateContainerTransform = () => {
	if (!graph || !canvasAreaRef.value?.containerRef) return
	
	const container = canvasAreaRef.value.containerRef
	const sizeData = calculateContainerSize()
	if (!sizeData) return
	
	const { width: displayWidth, height: displayHeight, canvasWidth } = sizeData
	// 注意：canvasHeight 包含在 sizeData 中但此处不需要单独使用
	
	// 设置容器的实际尺寸（而不是固定 1920x1080）
	container.style.width = `${displayWidth}px`
	container.style.height = `${displayHeight}px`
	
	// 不使用 CSS transform，避免框选不同步
	// container.style.transform = `scale(${scale})`
	
	// 使用 X6 内置缩放（等 graph 创建后再应用）
	if (graph) {
		// 计算 X6 缩放比例：显示尺寸 / 逻辑尺寸
		const x6Scale = displayWidth / canvasWidth
		graph.scale(x6Scale, x6Scale)
		graph.centerContent()
		
		// 同步更新配置中的缩放值
		canvasConfigManager.updateByPath('zoom.scale', Number(x6Scale.toFixed(2)))
	}
}

onMounted(() => {
	if (!canvasAreaRef.value?.containerRef) return

	// 获取画布配置
	const canvasConfig = canvasConfigManager.getConfig()

	// 响应式处理：小屏幕时默认折叠侧边栏
	const handlePanelResize = () => {
		const width = window.innerWidth
		if (width < 1024) {
			// 小屏幕：自动折叠两侧面板
			leftPanelCollapsed.value = true
			rightPanelCollapsed.value = true
		} else if (width < 1440) {
			// 中等屏幕：只折叠左侧面板
			leftPanelCollapsed.value = true
			rightPanelCollapsed.value = false
		}
		// 大屏幕：保持当前状态
	}

	// 初始化时检查屏幕尺寸
	handlePanelResize()

	// 监听窗口大小变化
	window.addEventListener('resize', handlePanelResize)

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
					stroke: 'rgba(0,0,0,0)',
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

	// ========== 动态注册 Vue 组件 ==========
	// 遍历组件注册表，自动注册所有包含 Vue 组件的配置
	const allComponents = componentRegistry.getAllComponents()
	Object.values(allComponents).forEach((config) => {
		// 只注册包含 component 字段的组件（Vue Shape）
		if (config.component) {
			register({
				shape: config.shape,
				width: config.width,
				height: config.height,
				component: config.component,
				ports: config.ports
			})
		}
	})

	// 初始化 X6 画布
	const container = canvasAreaRef.value.containerRef
	
	// 使用配置中的画布尺寸作为逻辑尺寸
	const canvasWidth = canvasConfig.size.width
	const canvasHeight = canvasConfig.size.height
	
	// 计算初始缩放比例（稍后应用）
	const initialScale = calculateFitScale()
	console.log('🎬 [Canvas Init] 初始化画布', {
		initialScale,
		canvasSize: { width: canvasWidth, height: canvasHeight },
		containerElement: canvasAreaRef.value?.containerRef
	})
	// 不立即应用缩放，等待 graph 创建后
	// updateContainerTransform(initialScale)
	
	// 监听窗口大小变化，自动调整容器尺寸
	const handleResize = () => {
		updateContainerTransform() // 自动计算尺寸
	}
	
	window.addEventListener('resize', handleResize)
	
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
		console.log('🎯 [Selection Plugin] 初始化框选插件')
		
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
		
		// 监听框选事件
		graph.on('selection:changed', ({ selected }) => {
			console.log('✅ [Selection] 选中变化:', selected.length, '个元素')
		})
		
		// 添加鼠标事件监听（调试用）
		let isRubberbanding = false
		graph.on('blank:mousedown', (args) => {
			isRubberbanding = true
			const { e, x, y } = args
			console.log('🖱️ [Rubberband Start]', {
				clientX: e.clientX,
				clientY: e.clientY,
				graphX: x,
				graphY: y,
				containerTransform: container.style.transform,
				containerRect: container.getBoundingClientRect()
			})
		})
		
		graph.on('blank:mousemove', (args) => {
			if (isRubberbanding) {
				const { e, x, y } = args
				console.log('🖱️ [Rubberband Move]', {
					clientX: e.clientX,
					clientY: e.clientY,
					graphX: x,
					graphY: y
				})
			}
		})
		
		graph.on('blank:mouseup', () => {
			if (isRubberbanding) {
				isRubberbanding = false
				console.log('🖱️ [Rubberband End]')
			}
		})
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

	// 现在应用初始容器尺寸（graph 已创建）
	// 使用 nextTick 确保侧边栏已完全渲染
	Promise.resolve().then(() => {
		setTimeout(() => {
			updateContainerTransform() // 自动计算尺寸
		}, 100) // 延迟100ms确保DOM完全渲染
	})

	// ========== 初始化工具类 ==========
	graphOperations.setGraph(graph)
	nodeOperations.setGraph(graph)
	edgeOperations.setGraph(graph)
	canvasDataHandler.setGraph(graph)
	// 初始化数据绑定监听（setGraph 会自动调用 initDataBinding）
	dataBindingService.setGraph(graph)

	// ========== 初始化配置监听器 ==========
	canvasConfigWatcher.initialize(graph, canvasAreaRef, calculateFitScale, () => {
		updateContainerTransform()
	})

	// 尝试恢复之前保存的画布数据（仅编辑模式）
	if (!props.previewMode) {
		const savedCanvasData = loadFromLocal(STORAGE_KEYS.SCADA_EDITOR_DATA)
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
				removeFromLocal(STORAGE_KEYS.SCADA_EDITOR_DATA)
			}
		}
		
		// 从 localStorage 恢复数据源配置（持久化存储）
		try {
			const savedDataSources = localStorage.getItem('scada-data-sources')
			if (savedDataSources) {
				const dataSourcesConfig = JSON.parse(savedDataSources)
				if (Array.isArray(dataSourcesConfig) && dataSourcesConfig.length > 0) {
					// 添加数据源到管理器
					dataSourcesConfig.forEach((dsConfig: any) => {
						const newDataSource: DataSource = {
							id: dsConfig.id,
							name: dsConfig.name,
							type: dsConfig.type,
							enabled: dsConfig.enabled !== false, // 默认启用，除非明确设置为 false
							config: dsConfig.config,
							devices: [],
							status: { connected: false } // 初始为 false，连接成功后会自动更新
						}
						// addDataSource 会自动触发连接（如果 enabled=true）
						dataSourceManager.addDataSource(newDataSource)
					})
					
					// 立即更新一次，显示初始状态
					dataSources.value = dataSourceManager.getAllDataSources()
				}
			}
		} catch (error) {
			console.error('[恢复数据源失败:', error)
		}
	}

	// ========== 初始化事件管理器 ==========
	graphEventManager.initialize(graph, {
		selectedNode,
		selectedEdge,
		selectedNodesCount,
		contextMenu,
		applyEdgeAnimation
	})

	// 清理监听器
	onUnmounted(() => {
		graphEventManager.destroy()
		window.removeEventListener('resize', handleResize)
		window.removeEventListener('resize', handlePanelResize)
	})
})

onUnmounted(() => {
	// 断开所有数据源连接
	dataSourceManager.disconnectAll()
	
	if (graph) {
		// 清空所有动画
		animationEngine.clearAll()
		
		// 在销毁前保存画布数据
		const canvasData = {
			cells: graph.toJSON().cells,
			// 保存数据源配置
			dataSources: dataSourceManager.getAllDataSources().map(ds => ({
				id: ds.id,
				name: ds.name,
				type: ds.type,
				enabled: ds.enabled,
				config: ds.config
			}))
		}
		saveToLocal(STORAGE_KEYS.SCADA_EDITOR_DATA, canvasData)
		
		graph.dispose()
	}
})

// 监听画布配置变化（使用 canvasConfigWatcher）
watch(
	() => canvasConfigManager.getConfig(),
	() => canvasConfigWatcher.applyConfigChanges(),
	{ deep: true }
)

// 监听侧边栏展开/收起状态，自动调整画布尺寸
watch([leftPanelCollapsed, rightPanelCollapsed], () => {
	// 延迟执行，等待侧边栏动画完成（CSS transition 0.3s）
	setTimeout(() => {
		if (graph) {
			updateContainerTransform()
		}
	}, 350) // 稍微大于 CSS transition 时间
})

// 添加节点（根据类型）
const handleAddNode = (type: string) => {
	const node = nodeOperations.addNode(type)
	if (node && graph) {
		// 先取消所有选中，再选中新添加的节点
		graph.cleanSelection()
		graph.select(node)
		
		// 自动保存到 localStorage
		saveToLocal(STORAGE_KEYS.SCADA_EDITOR_DATA, graph.toJSON())
	}
}

// 更新节点属性
const handleUpdateNode = (data: any) => {
	if (!selectedNode.value) return
	nodeOperations.updateNode(selectedNode.value, data)
	// 自动保存到 localStorage
	if (graph) {
		saveToLocal(STORAGE_KEYS.SCADA_EDITOR_DATA, graph.toJSON())
	}
}

// 删除节点
const handleDeleteNode = () => {
	if (!selectedNode.value || !graph) return
	const nodeId = selectedNode.value.id
	nodeOperations.deleteNode(nodeId)
	selectedNode.value = null
	// 自动保存到 localStorage
	saveToLocal(STORAGE_KEYS.SCADA_EDITOR_DATA, graph.toJSON())
}

// 更新连线属性
const handleUpdateEdge = (data: any) => {
	if (!selectedEdge.value) return
	edgeOperations.updateEdge(selectedEdge.value, data)
}

// 删除连线
const handleDeleteEdge = () => {
	if (!selectedEdge.value) return
	edgeOperations.deleteEdge(selectedEdge.value.id)
	selectedEdge.value = null
}

// 处理右键菜单点击
const handleContextMenuClick = (key: string) => {
	if (!graph) return
	
	const targetCell = contextMenu.value.targetCell
	
	switch (key) {
		case 'delete':
			if (targetCell) {
				if (targetCell.isNode()) {
					// 删除节点
					nodeOperations.deleteNode(targetCell.id)
					if (selectedNode.value?.id === targetCell.id) {
						selectedNode.value = null
					}
				} else if (targetCell.isEdge()) {
					// 删除连线
					edgeOperations.deleteEdge(targetCell.id)
					if (selectedEdge.value?.id === targetCell.id) {
						selectedEdge.value = null
					}
				}
				// 自动保存到 localStorage（永久保存）
				canvasDataHandler.saveToLocal()
			}
			break
			
		case 'copy':
			if (targetCell?.isNode()) {
				// 复制节点
				const clonedNode = nodeOperations.cloneNode(targetCell)
				if (clonedNode && graph) {
					graph.cleanSelection()
					graph.select(clonedNode)
					// 自动保存到 localStorage
					canvasDataHandler.saveToLocal()
				}
			}
			break
			
		case 'to-front':
			if (targetCell) {
				targetCell.toFront()
				// 自动保存到 localStorage
				canvasDataHandler.saveToLocal()
			}
			break
			
		case 'to-back':
			if (targetCell) {
				targetCell.toBack()
				// 自动保存到 localStorage
				canvasDataHandler.saveToLocal()
			}
			break
			
		case 'select-all':
			graph.select(graph.getNodes())
			break
			
		case 'clear-all':
			clearAll()
			break
	}
}

// 应用连线动画（使用工具类）
const applyEdgeAnimation = (edge: any, animation: any) => {
	edgeOperations.applyEdgeAnimation(edge, animation)
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
		// 清除 localStorage 中的缓存数据
		canvasDataHandler.clearCache()
		showMessage('画布已清空', 'success')
	}
}

// 放大
const zoomIn = () => graphOperations.zoomIn()

// 缩小
const zoomOut = () => graphOperations.zoomOut()

// 左对齐
const alignLeft = () => graphOperations.alignLeft()

// 水平居中
const alignCenter = () => graphOperations.alignCenter()

// 右对齐
const alignRight = () => graphOperations.alignRight()

// 顶部对齐
const alignTop = () => graphOperations.alignTop()

// 垂直居中
const alignMiddle = () => graphOperations.alignMiddle()

// 底部对齐
const alignBottom = () => graphOperations.alignBottom()

// 横向分布
const distributeHorizontal = () => graphOperations.distributeHorizontal()

// 纵向分布
const distributeVertical = () => graphOperations.distributeVertical()

// 头部操作
const handleSave = async () => {
	if (!graph) {
		showMessage('画布未初始化', 'error')
		return
	}
	
	try {
		// 如果有自定义保存回调，优先使用
		if (props.onSave) {
			const result = props.onSave()
			if (result instanceof Promise) {
				await result
			}
			return
		}
		
		// 默认下载 JSON 文件（使用 canvasDataHandler）
		const filename = canvasDataHandler.exportToFile(`scada-canvas-${new Date().getTime()}.json`)
		if (filename) {
			showMessage('保存成功', 'success')
		} else {
			showMessage('保存失败', 'error')
		}
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
			
			// 使用 canvasDataHandler 导入数据
			const success = canvasDataHandler.importData(importData, (edge: any) => {
				const edgeData = edge.getData()
				if (edgeData?.animation?.enabled) {
					applyEdgeAnimation(edge, edgeData.animation)
				}
			})
			
			// 导入成功后更新数据源列表
			if (success) {
				dataSources.value = dataSourceManager.getAllDataSources()
			}
			
			// 清空文件选择,允许重复导入同一文件
			if (fileInputRef.value) {
				fileInputRef.value.value = ''
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
	if (!graph) {
		showMessage('画布未初始化', 'error')
		return
	}
	
	// 触发预览事件，由父组件处理
	// 父组件可以通过 getCanvasData() 获取画布数据
	emit('preview')
}

const handleWorkflow = () => {
	// 打开流程编排弹窗
	showWorkflowDialog.value = true
}

// 数据源管理
const handleDataSource = () => {
	// 打开数据源管理对话框
	showDataSourceDialog.value = true
	// 同步数据源列表
	dataSources.value = dataSourceManager.getAllDataSources()
	
	// 定时刷新状态
	const statusInterval = setInterval(() => {
		if (!showDataSourceDialog.value) {
			clearInterval(statusInterval)
			return
		}
		dataSources.value = dataSourceManager.getAllDataSources()
	}, 1000)
}

// 保存数据源配置到 localStorage
const saveDataSourcesToLocalStorage = () => {
	try {
		const dataSourcesConfig = dataSourceManager.getAllDataSources().map(ds => ({
			id: ds.id,
			name: ds.name,
			type: ds.type,
			enabled: ds.enabled,
			config: ds.config
		}))
		localStorage.setItem('scada-data-sources', JSON.stringify(dataSourcesConfig))
	} catch (error) {
		console.error('保存数据源失败:', error)
	}
}

const handleAddDataSource = (config: Omit<DataSource, 'id' | 'devices' | 'status'>) => {
	const newDataSource: DataSource = {
		id: 'ds_' + Date.now(),
		...config,
		devices: [],
		status: { connected: false }
	}
	
	dataSourceManager.addDataSource(newDataSource)
	
	// 延迟一下刷新，等待连接建立
	setTimeout(() => {
		dataSources.value = dataSourceManager.getAllDataSources()
		// 保存到 localStorage
		saveDataSourcesToLocalStorage()
	}, 1000)
	
	showMessage(`数据源 "${newDataSource.name}" 创建成功`, 'success')
}

const handleSaveDataSource = (dataSource: DataSource) => {
	dataSourceManager.updateDataSource(dataSource.id, dataSource)
	dataSources.value = dataSourceManager.getAllDataSources()
	// 保存到 localStorage
	saveDataSourcesToLocalStorage()
	showMessage(`数据源 "${dataSource.name}" 更新成功`, 'success')
}

const handleDeleteDataSource = (id: string) => {
	const ds = dataSourceManager.getDataSource(id)
	dataSourceManager.removeDataSource(id)
	dataSources.value = dataSourceManager.getAllDataSources()
	// 保存到 localStorage
	saveDataSourcesToLocalStorage()
	showMessage(`数据源 "${ds?.name}" 已删除`, 'success')
}

const handleExport = () => {
	if (!graph) {
		showMessage('画布未初始化', 'error')
		return
	}
	
	try {
		// 使用 canvasDataHandler 导出数据
		const filename = canvasDataHandler.exportToFile('scada-export.json')
		
		if (filename) {
			showMessage(`已导出为 ${filename}`, 'success')
		} else {
			showMessage('导出失败', 'error')
		}
	} catch (error) {
		console.error('导出失败', error)
		showMessage('导出失败，请查看控制台', 'error')
	}
}

// 暴露核心方法给外部使用
defineExpose({
	// === 文件操作 ===
	/** 保存画布数据到 localStorage */
	save: handleSave,
	/** 触发文件选择，导入 JSON 数据 */
	importFile: handleImport,
	/** 导出画布数据为 JSON 文件 */
	exportFile: handleExport,
	
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
	
	// === 数据集成 ===
	/** 更新设备数据 */
	updateDeviceData: (deviceData: any) => {
		// 更新节点上的设备数据
		if (graph && deviceData?.devices) {
			deviceData.devices.forEach((device: any) => {
				device.points?.forEach((point: any) => {
					// 遍历画布上的所有节点，查找与设备点位绑定的节点
					if (graph) {
						graph.getNodes().forEach((node: any) => {
							const nodeData = node.getData()
							// 检查节点是否有绑定配置
							if (nodeData?.bindings) {
								Object.entries(nodeData.bindings).forEach(([attribute, binding]: [string, any]) => {
									if (binding.deviceId === device.id && binding.dataPoint === point.id) {
										// 更新节点的相应属性
										const value = point.value
																
										// 特殊处理文本节点
										if (attribute === 'attrs/text/text') {
											node.attr('text/text', value)
										}
										// 特殊处理颜色节点
										else if (attribute === 'attrs/body/fill') {
											node.attr('body/fill', value)
										}
										// 其他属性更新
										else {
											// 根据绑定的属性路径更新节点
											const keys = attribute.split('.')
											let target: any = node
											for (let i = 0; i < keys.length - 1; i++) {
												target = target[keys[i]]
											}
											const lastKey = keys[keys.length - 1]
											if (target && lastKey) {
												target[lastKey] = value
											}
										}
									}
								})
							}
						})
					}
				})
			})
		}
	},
	
	// === 动画控制 ===
	/** 获取动画引擎 */
	getAnimationEngine: () => animationEngine
})
</script>

<style scoped>
.scada-layout {
	width: 100%;
	height: 100vh;
	max-height: 100vh;
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
