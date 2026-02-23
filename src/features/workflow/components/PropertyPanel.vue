<template>
	<div class="property-panel">
		<h3>属性配置</h3>
		<div v-if="selectedCell" class="property-content">
			<!-- 节点基础信息 -->
			<div class="property-group">
				<label>节点名称</label>
				<input 
					:value="selectedCell.label" 
					type="text" 
					placeholder="输入节点名称"
					@input="handleLabelChange"
				/>
			</div>
			<div class="property-group">
				<label>节点类型</label>
				<input 
					:value="selectedCell.nodeType" 
					type="text" 
					readonly
					disabled
				/>
			</div>
			
			<!-- 分割线 -->
			<div v-if="currentConfigComponent" class="divider"></div>
			
			<!-- 动态加载节点配置组件 -->
			<component 
				v-if="currentConfigComponent"
				:is="currentConfigComponent"
				v-model="nodeConfig"
				@update:modelValue="handleConfigUpdate"
			/>
		</div>
		<div v-else class="property-empty">
			<div class="empty-text">选择节点以配置属性</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch, provide } from 'vue'
import { getNodeConfigComponent } from '../config/nodeConfigRegistry'
import type { NodeConfig } from '../types/node'

interface SelectedCell {
	label: string
	nodeType: string
	cell: any
}

interface Props {
	selectedCell: SelectedCell | null
}

interface Emits {
	(e: 'update:label', value: string): void
	(e: 'update:config', value: Partial<NodeConfig>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 获取 graph 实例
const getGraph = () => {
	return props.selectedCell?.cell?.model?.graph || null
}

// 提供 graph 获取函数给子组件
provide('getGraph', getGraph)

// 节点配置数据
const nodeConfig = ref<Partial<NodeConfig>>({})

// 动态获取当前节点的配置组件
const currentConfigComponent = computed(() => {
	if (!props.selectedCell) return null
	return getNodeConfigComponent(props.selectedCell.nodeType)
})

// 监听节点切换，重置配置
watch(() => props.selectedCell, (newCell) => {
	if (newCell?.cell) {
		// 从 cell 中获取已保存的配置
		const cellData = newCell.cell.getData()
		nodeConfig.value = cellData?.config || {}
	} else {
		nodeConfig.value = {}
	}
}, { immediate: true })

const handleLabelChange = (event: Event) => {
	const target = event.target as HTMLInputElement
	emit('update:label', target.value)
}

const handleConfigUpdate = (config: Partial<NodeConfig>) => {
	nodeConfig.value = config
	// 保存配置到 cell 的 data 中
	if (props.selectedCell?.cell) {
		const currentData = props.selectedCell.cell.getData() || {}
		props.selectedCell.cell.setData({
			...currentData,
			config: config
		})
		
		// 如果是条件节点，更新端口
		if (props.selectedCell.nodeType === 'condition' && (config as any).branches) {
			updateConditionPorts((config as any).branches)
		}
	}
	emit('update:config', config)
}

// 更新条件节点的端口
const updateConditionPorts = (branches: any[]) => {
	if (!props.selectedCell?.cell) return
	
	const node = props.selectedCell.cell
	const graph = node.model?.graph
	if (!graph) return
	
	// 保存现有的输出连线信息
	const existingEdges: any[] = []
	const connectedEdges = graph.getConnectedEdges(node, { outgoing: true })
	connectedEdges.forEach((edge: any) => {
		const sourcePortId = edge.getSourcePortId()
		const targetCell = edge.getTargetCell()
		const targetPortId = edge.getTargetPortId()
		if (sourcePortId && targetCell) {
			existingEdges.push({
				sourcePortId,
				targetCell,
				targetPortId
			})
		}
	})
	
	// 获取第一条输出连线的目标节点（如果存在）
	const firstTarget = existingEdges.length > 0 ? existingEdges[0].targetCell : null
	const firstTargetPort = existingEdges.length > 0 ? existingEdges[0].targetPortId : 'port-in'
	
	// 清除所有输出端口和连线
	const ports = node.getPorts()
	ports.forEach((port: any) => {
		if (port.group === 'out') {
			node.removePort(port.id)
		}
	})
	
	// 计算节点高度：端口间距30px，最小高度60px
	const PORT_SPACING = 30 // 端口之间的垂直间距
	const MIN_HEIGHT = 60 // 最小节点高度
	const portCount = Math.max(branches.length, 1) // 至少1个端口
	const calculatedHeight = Math.max(MIN_HEIGHT, portCount * PORT_SPACING)
	
	// 调整节点大小和位置（保持中心点不变）
	const currentSize = node.size()
	const currentPosition = node.position()
	const heightDiff = calculatedHeight - currentSize.height
	
	// 如果高度发生变化，向上移动高度差的一半，使节点从中心向上下扩展
	if (heightDiff !== 0) {
		node.position(currentPosition.x, currentPosition.y - heightDiff / 2)
	}
	
	// 设置新的高度
	node.resize(currentSize.width, calculatedHeight)
	
	// 根据分支数量添加新端口
	branches.forEach((branch: any, index: number) => {
		node.addPort({
			id: `port-out-${index}`,
			group: 'out',
			attrs: {
				circle: {
					r: 5,
					magnet: true,
					stroke: '#34d399',
					strokeWidth: 2,
					fill: '#1e293b',
				},
				portLabel: {
					text: branch.label || `分支${index + 1}`,
					fontSize: 10,
					fill: '#94a3b8',
				}
			}
		})
	})
	
	// 使用 setTimeout 确保端口完全渲染后再创建连线
	setTimeout(() => {
		if (firstTarget) {
			branches.forEach((branch: any, index: number) => {
				graph.addEdge({
					source: { cell: node, port: `port-out-${index}` },
					target: { cell: firstTarget, port: firstTargetPort },
					labels: [
						{
							attrs: {
								label: {
									text: branch.label || `分支${index + 1}`,
									fill: '#e2e8f0',
									fontSize: 12,
								},
								rect: {
									fill: '#334155',
									stroke: '#34d399',
									strokeWidth: 1,
									rx: 4,
									ry: 4,
								},
							},
							position: 0.5,
						},
					],
				})
			})
		}
	}, 100) // 延迟100ms确保端口渲染完成
}
</script>

<style scoped>
.property-panel {
	width: 300px;
	background: #1e293b;
	border-left: 1px solid #334155;
	display: flex;
	flex-direction: column;
}

.property-panel h3 {
	margin: 0;
	padding: 16px;
	font-size: 14px;
	font-weight: 600;
	color: #e2e8f0;
	border-bottom: 1px solid #334155;
}

.property-content {
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	overflow-y: auto;
}

.property-group {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.property-group label {
	font-size: 13px;
	color: #94a3b8;
}

.property-group input,
.property-group textarea,
.property-group select {
	padding: 8px 12px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 13px;
}

.property-group input:focus,
.property-group textarea:focus,
.property-group select:focus {
	outline: none;
	border-color: #3b82f6;
}

.property-group input:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.property-empty {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #64748b;
	font-size: 13px;
}

.divider {
	height: 1px;
	background: #334155;
	margin: 8px 0;
}
</style>
