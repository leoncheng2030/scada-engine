<template>
	<div class="workflow-editor">
		<!-- 头部工具栏 -->
		<WorkflowToolbar
			:show-close="showClose"
			@clear="handleClear"
			@validate="handleValidate"
			@save="handleSave"
			@close="$emit('close')"
		/>

		<!-- 主体区域 -->
		<div class="editor-main">
			<!-- 中间画布区域 -->
			<div class="canvas-area">
				<div id="workflow-container" ref="containerRef"></div>
			</div>

			<!-- 右侧属性面板 -->
			<PropertyPanel
				:selected-cell="selectedCell"
				@update:label="updateNodeLabel"
			/>
		</div>

		<!-- 添加节点菜单 -->
		<AddNodeMenu
			:visible="showAddNodeMenu"
			:position="addNodeMenuPosition"
			:node-types="nodeTypes"
			@close="showAddNodeMenu = false"
			@select="handleAddNode"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, provide } from 'vue'
import { Graph, Shape } from '@antv/x6'
import { Selection } from '@antv/x6-plugin-selection'
import PropertyPanel from './components/PropertyPanel.vue'
import WorkflowToolbar from './components/WorkflowToolbar.vue'
import AddNodeMenu from './components/AddNodeMenu.vue'
import { canvasElementService } from './services/canvasElementService'
import type { Graph as X6Graph } from '@antv/x6'

// 定义 Props
interface Props {
	// 组态设计器的画布实例（可选）
	scadaGraph?: X6Graph | null
	// 是否显示关闭按钮（全屏弹窗模式）
	showClose?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	scadaGraph: null,
	showClose: false
})

// 定义 Emits
interface Emits {
	(e: 'close'): void
}

defineEmits<Emits>() // emit 由 template 中的 @close 使用

// 节点类型定义
interface NodeType {
	type: string
	name: string
	icon: string
	description: string
	color: string
}

// 节点类型列表
const nodeTypes = ref<NodeType[]>([
	{ type: 'start', name: '开始', icon: '▶', description: '流程起点', color: '#52c41a' },
	{ type: 'end', name: '结束', icon: '⏹', description: '流程终点', color: '#ff4d4f' },
	{ type: 'getProperty', name: '获取图元属性', icon: '📥', description: '获取图元的属性值', color: '#1890ff' },
	{ type: 'setProperty', name: '设置图元属性', icon: '📤', description: '设置图元的属性值', color: '#13c2c2' },
	{ type: 'condition', name: '条件节点', icon: '◆', description: '条件分支判断', color: '#faad14' },
	{ type: 'httpRequest', name: 'http请求', icon: '🌐', description: 'HTTP网络请求', color: '#722ed1' },
	{ type: 'customCode', name: '自定义代码', icon: '💻', description: '执行自定义JavaScript代码', color: '#eb2f96' },
	{ type: 'timer', name: '定时器节点', icon: '⏰', description: '设置定时执行', color: '#52c41a' },
	{ type: 'clearTimer', name: '清除定时器', icon: '🗑', description: '清除定时器', color: '#ff4d4f' }
])

// 容器引用
const containerRef = ref<HTMLElement>()

// X6 图实例
let graph: Graph | null = null

// 如果有组态画布实例，设置到服务中
if (props.scadaGraph) {
	canvasElementService.setGraph(props.scadaGraph)
}

// 通过 provide 向子组件提供画布服务
provide('canvasElementService', canvasElementService)

// 选中的单元格
const selectedCell = ref<any>(null)

// 添加节点菜单显示状态
const showAddNodeMenu = ref(false)
const addNodeMenuPosition = ref({ x: 0, y: 0 })
let currentEdge: any = null

// 注册自定义节点
const registerNodes = () => {
	nodeTypes.value.forEach((nodeType) => {
		// 基础节点配置
		const nodeConfig: any = {
			inherit: 'rect',
			width: 150,
			height: 60,
			markup: [
				{
					tagName: 'rect',
					selector: 'body',
				},
				{
					tagName: 'text',
					selector: 'icon',
				},
				{
					tagName: 'text',
					selector: 'label',
				},
			],
			attrs: {
				body: {
					strokeWidth: 1,
					stroke: nodeType.color,
					fill: '#ffffff',
					rx: 6,
					ry: 6,
				},
				icon: {
					text: nodeType.icon,
					fontSize: 24,
					fill: nodeType.color,
					refX: 20,
					refY: '50%',
					textAnchor: 'middle',
					textVerticalAnchor: 'middle',
				},
				label: {
					text: nodeType.name,
					fontSize: 14,
					fill: '#333333',
					refX: 75,
					refY: '50%',
					textAnchor: 'middle',
					textVerticalAnchor: 'middle',
				}
			},
			ports: {
				groups: {
					in: {
						position: 'left',
						attrs: {
							circle: {
								r: 5,
								magnet: true,
								stroke: '#10b981',
								strokeWidth: 2,
								fill: '#1e293b',
							},
						},
					},
					out: {
						position: {
							name: 'right',
						},
						attrs: {
							circle: {
								r: 5,
								magnet: true,
								stroke: '#10b981',
								strokeWidth: 2,
								fill: '#1e293b',
							},
							portLabel: {
								fontSize: 10,
								fill: '#94a3b8',
							},
						},
						markup: [
							{
								tagName: 'circle',
								selector: 'circle',
							},
							{
								tagName: 'text',
								selector: 'portLabel',
							},
						],
						label: {
							position: {
								name: 'right',
								args: { x: 10, y: 0 },
							},
						},
					},
				},
				items: [], // 默认为空，根据节点类型后续添加
			},
			data: {
				nodeType: nodeType.type,
			},
		}
		
		// 根据节点类型配置端口
		if (nodeType.type === 'start') {
			// 开始节点：只有出口
			nodeConfig.ports.items = [
				{ id: 'port-out', group: 'out' },
			]
		} else if (nodeType.type === 'end') {
			// 结束节点：只有入口
			nodeConfig.ports.items = [
				{ id: 'port-in', group: 'in' },
			]
		} else if (nodeType.type === 'condition') {
			// 条件节点：1个入口，2个出口（True/False）
			nodeConfig.ports.items = [
				{ id: 'port-in', group: 'in' },
				{ id: 'port-out-0', group: 'out', args: { text: 'True' } },
				{ id: 'port-out-1', group: 'out', args: { text: 'False' } },
			]
		} else {
			// 其他节点：有入口和出口
			nodeConfig.ports.items = [
				{ id: 'port-in', group: 'in' },
				{ id: 'port-out', group: 'out' },
			]
		}

		Graph.registerNode(nodeType.type, nodeConfig, true)
	})
}

// 初始化 X6 画布
const initGraph = () => {
	if (!containerRef.value) return

	// 注册节点
	registerNodes()

	// 创建画布
	graph = new Graph({
		container: containerRef.value,
		width: containerRef.value.clientWidth,
		height: containerRef.value.clientHeight,
		grid: {
			size: 10,
			visible: true,
			type: 'dot',
			args: {
				color: '#333',
				thickness: 1,
			},
		},
		panning: {
			enabled: true,
			modifiers: 'shift',
		},
		mousewheel: {
			enabled: true,
			modifiers: ['ctrl', 'meta'],
		},
		connecting: {
			router: 'manhattan',
			connector: {
				name: 'rounded',
				args: {
					radius: 8,
				},
			},
			anchor: 'center',
			connectionPoint: 'anchor',
			snap: {
				radius: 20,
			},
			allowBlank: false,
			allowLoop: false,
			allowNode: false,
			createEdge() {
				return new Shape.Edge({
					attrs: {
						line: {
							stroke: '#64748b',
							strokeWidth: 3,
							targetMarker: {
								name: 'block',
								width: 12,
								height: 8,
								fill: '#64748b',
							},
						},
					},
					zIndex: 0,
				})
			},
			validateConnection({ targetMagnet }) {
				return !!targetMagnet
			},
		},
		highlighting: {
			magnetAvailable: {
				name: 'stroke',
				args: {
					attrs: {
						fill: '#34d399',
						stroke: '#34d399',
					},
				},
			},
		},
	})
	
	// 使用 Selection 插件
	graph.use(
		new Selection({
			enabled: true,
			rubberband: false,
			showNodeSelectionBox: true,
			showEdgeSelectionBox: true,
			multiple: true,
			movable: true,
			strict: false,
		})
	)

	// 监听键盘事件
	const handleKeyDown = (e: KeyboardEvent) => {
		console.log('键盘事件触发:', e.key, 'selectedCell存在:', !!selectedCell.value)
		if (e.key === 'Delete' || e.key === 'Backspace') {
			if (!graph) {
				console.log('graph不存在，无法删除')
				return
			}
			
			// 优先使用我们自己维护的selectedCell
			if (selectedCell.value?.cell) {
				e.preventDefault()
				const nodeToDelete = selectedCell.value.cell
				console.log('删除选中的节点:', selectedCell.value.label)
				
				// 获取该节点的所有入边和出边
				const incomingEdges = graph.getIncomingEdges(nodeToDelete)
				const outgoingEdges = graph.getOutgoingEdges(nodeToDelete)
				
				// 如果有入边和出边，自动连接前后节点
				if (incomingEdges && incomingEdges.length > 0 && outgoingEdges && outgoingEdges.length > 0) {
					incomingEdges.forEach(inEdge => {
						const sourceCell = inEdge.getSourceCell()
						const sourcePort = inEdge.getSourcePortId()
						
						outgoingEdges.forEach(outEdge => {
							const targetCell = outEdge.getTargetCell()
							const targetPort = outEdge.getTargetPortId()
							
							// 创建新的连线
							if (sourceCell && targetCell && graph) {
								graph.addEdge({
									source: { cell: sourceCell, port: sourcePort },
									target: { cell: targetCell, port: targetPort },
								})
								console.log('已连接前后节点')
							}
						})
					})
				}
				
				// 删除节点
				graph.removeCells([nodeToDelete])
				selectedCell.value = null
				console.log('已删除节点')
				return
			}
			
			// 备用方案：使用X6的选中
			const cells = graph.getSelectedCells()
			console.log('选中的cells数量:', cells.length, cells)
			if (cells.length) {
				e.preventDefault()
				graph.removeCells(cells)
				console.log('已删除cells')
			} else {
				console.log('没有选中的cells')
			}
		}
	}
	document.addEventListener('keydown', handleKeyDown)

// 监听节点点击事件
graph.on('node:click', ({ node }) => {
	const label = node.getAttrByPath('label/text') || ''
	const nodeType = node.getData()?.nodeType || node.shape || ''
	selectedCell.value = {
		label: label,
		nodeType: nodeType,
		cell: node,
	}
	console.log('节点已点击，保存到selectedCell:', label)
})

// 监听画布点击事件，取消选择
graph.on('blank:click', () => {
	selectedCell.value = null
	// 取消所有选中
	if (graph) {
		graph.cleanSelection()
	}
})

	// 监听边的鼠标进入事件，显示工具
	graph.on('edge:mouseenter', ({ edge }) => {
		// 高亮连线为亮绿色
		edge.setAttrs({
			line: {
				stroke: '#10b981',
				strokeWidth: 4,
			},
		})
		
		// 添加添加节点按钮工具
		edge.addTools([
			{
				name: 'button',
				args: {
					markup: [
						{
							tagName: 'circle',
							selector: 'button',
							attrs: {
								r: 12,
								stroke: '#10b981',
								strokeWidth: 2,
								fill: '#1e293b',
								cursor: 'pointer',
							},
						},
						{
							tagName: 'path',
							selector: 'icon',
							attrs: {
								d: 'M -5 0 L 5 0 M 0 -5 L 0 5',
								stroke: '#10b981',
								strokeWidth: 2,
								fill: 'none',
								pointerEvents: 'none',
							},
						},
					],
					distance: 0.5,
					onClick: ({ e, view }: { e: MouseEvent; view: any }) => {
						const edge = view.cell
						currentEdge = edge
						showAddNodeMenu.value = true
						addNodeMenuPosition.value = { x: e.clientX, y: e.clientY }
					},
				},
			},
			{
				name: 'vertices',
			},
		])
	})
	
	// 监听边的鼠标离开事件，隐藏工具
	graph.on('edge:mouseleave', ({ edge }) => {
		// 恢复原始样式
		edge.setAttrs({
			line: {
				stroke: '#64748b',
				strokeWidth: 3,
			},
		})
		
		// 移除工具
		edge.removeTools()
	})
	
	// 监听边的连接完成事件
	graph.on('edge:connected', ({ isNew, edge }) => {
		if (isNew) {
			// 设置连线样式为灰色
			edge.setAttrs({
				line: {
					stroke: '#64748b',
					strokeWidth: 3,
				},
			})
		}
	})
		
	// 监听节点选中事件,用于后续删除
	graph.on('node:selected', ({ node }) => {
		node.toFront()
	})
		
	// 监听边选中事件,用于后续删除
	graph.on('edge:selected', ({ edge }) => {
			edge.toFront()
		})

	// 创建默认节点和连线
	initDefaultWorkflow()
}

// 初始化默认流程
const initDefaultWorkflow = () => {
	if (!graph) return

	// 创建开始节点
	const startNode = graph.addNode({
		shape: 'start',
		x: 100,
		y: 200,
		label: '开始',
		data: {
			nodeType: 'start'
		}
	})

	// 创建结束节点
	const endNode = graph.addNode({
		shape: 'end',
		x: 500,
		y: 200,
		label: '结束',
		data: {
			nodeType: 'end'
		}
	})

	// 创建连线
	graph.addEdge({
		source: { cell: startNode, port: 'port-out' },
		target: { cell: endNode, port: 'port-in' },
	})
}

// 更新节点标签
const updateNodeLabel = (value: string) => {
	if (selectedCell.value?.cell) {
		selectedCell.value.label = value
		selectedCell.value.cell.setAttrByPath('label/text', value)
	}
}

// 添加节点到连线中间
const handleAddNode = (nodeType: NodeType) => {
	if (!graph || !currentEdge) return
	
	// 获取源节点和目标节点
	const source = currentEdge.getSourceCell()
	const target = currentEdge.getTargetCell()
	
	if (!source || !target) return
	
	// 计算新节点位置（在两个节点中间）
	const sourcePos = source.position()
	const targetPos = target.position()
	const x = (sourcePos.x + targetPos.x) / 2
	const y = (sourcePos.y + targetPos.y) / 2
	
	// 创建新节点
	const newNode = graph.addNode({
		shape: nodeType.type,
		x: x,
		y: y,
		label: nodeType.name,
		data: {
			nodeType: nodeType.type
		}
	})
	
	// 删除原来的边
	currentEdge.remove()
	
	// 创建新的边：源节点 -> 新节点
	graph.addEdge({
		source: { cell: source, port: 'port-out' },
		target: { cell: newNode, port: 'port-in' },
	})
	
	// 创建新的边:新节点 -> 目标节点
	// 对于条件节点,需要为所有输出端口创建连线
	if (nodeType.type === 'condition') {
		// 条件节点默认有2个输出端口,都连接到目标节点
		graph.addEdge({
			source: { cell: newNode, port: 'port-out-0' },
			target: { cell: target, port: 'port-in' },
			labels: [
				{
					attrs: {
						label: {
							text: 'True',
							fill: '#e2e8f0',
							fontSize: 12,
						},
						rect: {
							fill: '#334155',
							stroke: '#64748b',
							strokeWidth: 1,
							rx: 4,
							ry: 4,
						},
					},
					position: 0.5,
				},
			],
		})
		graph.addEdge({
			source: { cell: newNode, port: 'port-out-1' },
			target: { cell: target, port: 'port-in' },
			labels: [
				{
					attrs: {
						label: {
							text: 'False',
							fill: '#e2e8f0',
							fontSize: 12,
						},
						rect: {
							fill: '#334155',
							stroke: '#64748b',
							strokeWidth: 1,
							rx: 4,
							ry: 4,
						},
					},
					position: 0.5,
				},
			],
		})
	} else {
		// 其他节点使用单一输出端口
		graph.addEdge({
			source: { cell: newNode, port: 'port-out' },
			target: { cell: target, port: 'port-in' },
		})
	}
	
	// 关闭菜单
	showAddNodeMenu.value = false
	currentEdge = null
}

// 清空画布
const handleClear = () => {
	if (graph) {
		graph.clearCells()
	}
}

// 验证流程（返回验证结果）
const validateWorkflow = (): { errors: string[]; warnings: string[] } => {
	if (!graph) {
		console.log('画布不存在')
		return { errors: ['画布不存在'], warnings: [] }
	}
	
	const errors: string[] = []
	const warnings: string[] = []
	
	const nodes = graph.getNodes()
	
	// 1. 检查是否有开始节点
	const startNodes = nodes.filter(node => node.getData()?.nodeType === 'start')
	if (startNodes.length === 0) {
		errors.push('流程中缺少开始节点')
	} else if (startNodes.length > 1) {
		warnings.push('流程中有多个开始节点')
	}
	
	// 2. 检查是否有结束节点
	const endNodes = nodes.filter(node => node.getData()?.nodeType === 'end')
	if (endNodes.length === 0) {
		warnings.push('流程中缺少结束节点')
	}
	
	// 3. 检查节点配置完整性
	nodes.forEach(node => {
		const nodeData = node.getData()
		const nodeType = nodeData?.nodeType
		const config = nodeData?.config || {}
		const label = node.getAttrByPath('label/text') || '未命名节点'
		
		if (nodeType === 'getProperty' || nodeType === 'setProperty') {
			if (!config.elementId) {
				errors.push(`节点「${label}」未配置图元`)
			}
			if (!config.propertyName) {
				errors.push(`节点「${label}」未配置属性`)
			}
			if (nodeType === 'setProperty' && !config.value) {
				warnings.push(`节点「${label}」未配置属性值`)
			}
		}
		
		if (nodeType === 'httpRequest') {
			if (!config.url) {
				errors.push(`节点「${label}」未配置请求URL`)
			}
		}
		
		if (nodeType === 'condition') {
			if (!config.branches || config.branches.length === 0) {
				errors.push(`节点「${label}」未配置条件分支`)
			}
		}
		
		if (nodeType === 'timer') {
			if (!config.interval || config.interval <= 0) {
				errors.push(`节点「${label}」未配置有效的时间间隔`)
			}
		}
		
		if (nodeType === 'clearTimer') {
			if (!config.timerId) {
				errors.push(`节点「${label}」未选择定时器`)
			}
		}
		
		if (nodeType === 'customCode') {
			if (!config.code) {
				warnings.push(`节点「${label}」未编写代码`)
			}
		}
	})
	
	// 4. 检查节点连接
	nodes.forEach(node => {
		const nodeType = node.getData()?.nodeType
		const label = node.getAttrByPath('label/text') || '未命名节点'
		
		// 开始节点必须有输出
		if (nodeType === 'start' && graph) {
			const outgoing = graph.getOutgoingEdges(node)
			if (!outgoing || outgoing.length === 0) {
				errors.push(`开始节点「${label}」没有连接到下一个节点`)
			}
		}
		
		// 结束节点不能有输出
		if (nodeType === 'end' && graph) {
			const outgoing = graph.getOutgoingEdges(node)
			if (outgoing && outgoing.length > 0) {
				warnings.push(`结束节点「${label}」不应该有输出连线`)
			}
		}
		
		// 其他节点检查输入输出
		if (nodeType !== 'start' && nodeType !== 'end' && graph) {
			const incoming = graph.getIncomingEdges(node)
			const outgoing = graph.getOutgoingEdges(node)
			
			if (!incoming || incoming.length === 0) {
				warnings.push(`节点「${label}」没有输入连线`)
			}
			
			if (nodeType !== 'clearTimer' && (!outgoing || outgoing.length === 0)) {
				warnings.push(`节点「${label}」没有输出连线`)
			}
		}
	})
	
	// 5. 检查孤立节点
	if (graph) {
		nodes.forEach(node => {
			const incoming = graph!.getIncomingEdges(node)
			const outgoing = graph!.getOutgoingEdges(node)
			const nodeType = node.getData()?.nodeType
			const label = node.getAttrByPath('label/text') || '未命名节点'
			
			if (nodeType !== 'start' && (!incoming || incoming.length === 0) && (!outgoing || outgoing.length === 0)) {
				warnings.push(`节点「${label}」是孤立节点`)
			}
		})
	}
	
	return { errors, warnings }
}

// 验证流程（显示结果）
const handleValidate = () => {
	const { errors, warnings } = validateWorkflow()
	
	// 显示验证结果
	if (errors.length === 0 && warnings.length === 0) {
		alert('✓ 流程验证通过！')
		console.log('流程验证通过')
	} else {
		let message = ''
		
		if (errors.length > 0) {
			message += '错误：\n' + errors.map(e => '  • ' + e).join('\n')
		}
		
		if (warnings.length > 0) {
			if (message) message += '\n\n'
			message += '警告：\n' + warnings.map(w => '  • ' + w).join('\n')
		}
		
		alert(message)
		console.log('验证结果:', { errors, warnings })
	}
}

// 保存流程
const handleSave = () => {
	if (!graph) return
	
	// 先验证流程
	const { errors, warnings } = validateWorkflow()
	
	// 如果有错误，不允许保存
	if (errors.length > 0) {
		let message = '流程验证失败，无法保存！\n\n'
		message += '错误：\n' + errors.map(e => '  • ' + e).join('\n')
		
		if (warnings.length > 0) {
			message += '\n\n警告：\n' + warnings.map(w => '  • ' + w).join('\n')
		}
		
		alert(message)
		return
	}
	
	// 如果有警告，提示用户是否继续
	if (warnings.length > 0) {
		let message = '流程存在以下警告：\n\n'
		message += warnings.map(w => '  • ' + w).join('\n')
		message += '\n\n是否继续保存？'
		
		if (!confirm(message)) {
			return
		}
	}
	
	// 弹出输入框，让用户输入流程名称
	const workflowName = prompt('请输入流程名称:', '未命名流程')
	
	if (!workflowName || !workflowName.trim()) {
		// 用户取消或未输入
		return
	}
	
	const data = graph.toJSON()
	
	// 添加详细节点信息，确保保存所有配置
	const nodes = graph.getNodes().map(node => ({
		id: node.id,
		shape: node.shape,
		position: node.getPosition(),
		size: node.getSize(),
		attrs: node.getAttrs(),
		data: node.getData() // 关键：保存节点的data数据，包含所有配置
	}))
	
	const edges = graph.getEdges().map(edge => ({
		id: edge.id,
		source: edge.getSourceCellId(),
		target: edge.getTargetCellId(),
		attrs: edge.getAttrs(),
		data: edge.getData()
	}))
	
	// 生成流程ID（如果是新流程）
	const workflowId = 'workflow_' + Date.now()
	
	const workflow = {
		id: workflowId,
		name: workflowName.trim(),
		data: {
			...data, // 保留原始数据结构
			nodes, // 覆盖为详细节点数据
			edges  // 覆盖为详细连线数据
		},
		createdAt: Date.now(),
		updatedAt: Date.now()
	}
	
	try {
		// 从 localStorage 中获取已保存的流程列表
		const stored = localStorage.getItem('saved-workflows')
		const workflows = stored ? JSON.parse(stored) : []
		
		// 添加新流程
		workflows.push(workflow)
		
		// 保存回 localStorage
		localStorage.setItem('saved-workflows', JSON.stringify(workflows))
		
		alert('✓ 流程保存成功！')
		console.log('流程已保存:', workflow)
	} catch (error) {
		console.error('保存流程失败:', error)
		alert('保存失败，请重试')
	}
}

// 组件挂载
onMounted(() => {
	initGraph()
	
	// 监听窗口尺寸变化
	window.addEventListener('resize', handleResize)
})

// 处理窗口尺寸变化
const handleResize = () => {
	if (!graph || !containerRef.value) return
	
	// 调整画布尺寸以适应容器
	graph.resize(containerRef.value.clientWidth, containerRef.value.clientHeight)
}

// 组件销毁
onBeforeUnmount(() => {
	// 移除窗口尺寸变化监听
	window.removeEventListener('resize', handleResize)
	
	// 移除键盘事件监听
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Delete' || e.key === 'Backspace') {
			if (!graph) return
			const cells = graph.getSelectedCells()
			if (cells.length) {
				e.preventDefault()
				graph.removeCells(cells)
				if (selectedCell.value && cells.includes(selectedCell.value.cell)) {
					selectedCell.value = null
				}
			}
		}
	}
	document.removeEventListener('keydown', handleKeyDown)
	
	if (graph) {
		graph.dispose()
	}
})
</script>

<style scoped>
.workflow-editor {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: #0f172a;
	color: #e2e8f0;
}

/* 主体区域 */
.editor-main {
	display: flex;
	flex: 1;
	overflow: hidden;
}

/* 画布区域 */
.canvas-area {
	flex: 1;
	position: relative;
	overflow: hidden;
	background: #0f172a;
}

#workflow-container {
	width: 100%;
	height: 100%;
}
</style>
