<template>
	<div class="compact-data-binding">
		<!-- 数据源选择 -->
		<div class="compact-row">
			<label>数据源</label>
			<select :value="selectedDataSourceId" @change="handleDataSourceChange" class="compact-select">
				<option value="">无</option>
				<option 
					v-for="ds in dataSources" 
					:key="ds.id" 
					:value="ds.id"
				>
					{{ ds.name }} ({{ ds.type.toUpperCase() }})
				</option>
			</select>
			<span v-if="selectedDataSourceId" :class="['status-dot', currentDataSource?.status?.connected ? 'connected' : 'disconnected']" :title="currentDataSource?.status?.connected ? '已连接' : '未连接'"></span>
		</div>
		
		<!-- 组件点位信息 -->
		<div v-if="componentPoints.length > 0" class="component-points">
			<div class="points-header" @click="isPointsExpanded = !isPointsExpanded">
				<div class="points-header-left">
					<span class="collapse-icon">{{ isPointsExpanded ? '▼' : '▶' }}</span>
					<span class="points-title">📊 组件数据点位</span>
				</div>
				<div class="points-header-right">
					<span class="points-count">{{ componentPoints.length }} 个</span>
					<div v-if="isPointsExpanded" class="display-mode-toggle" @click.stop>
						<button 
							:class="['mode-btn', { active: displayMode === 'list' }]"
							@click="displayMode = 'list'"
							title="列表模式"
						>
							📋
						</button>
						<button 
							:class="['mode-btn', { active: displayMode === 'json' }]"
							@click="displayMode = 'json'"
							title="JSON模式"
						>
							{ }
						</button>
					</div>
				</div> 
			</div>
			
			<!-- 列表模式 -->
			<div v-show="isPointsExpanded && displayMode === 'list'" class="points-list">
				<div v-for="point in componentPoints" :key="point.id" class="point-item">
					<div class="point-main">
						<span class="point-name">{{ point.name }}</span>
						<span class="point-id">{{ point.id }}</span>
					</div>
					<div class="point-meta">
						<span class="point-type">{{ point.dataType }}</span>
						<span v-if="point.unit" class="point-unit">{{ point.unit }}</span>
						<span v-if="point.required" class="point-required">必需</span>
					</div>
				</div>
			</div>
			
			<!-- JSON模式 -->
			<div v-show="isPointsExpanded && displayMode === 'json'" class="json-example">
				<div class="json-header">
					<span class="json-title">📝 后端数据格式示例</span>
				</div>
				<pre class="json-code">{{ jsonExample }}</pre>
			</div>
			
			<div v-show="isPointsExpanded" class="points-tip">
				ℹ️ {{ displayMode === 'list' ? '点击右上JSON按钮查看数据格式示例' : '后端应返回包含上述点位ID的JSON数据' }}
			</div>
		</div>
		
		<div v-else-if="!componentPoints || componentPoints.length === 0" class="compact-hint warning">
			⚠️ 该组件没有定义数据点位，无法进行数据绑定
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Node } from '@antv/x6'
import { dataSourceManager } from '../services/dataSourceManager'
import { componentRegistry } from '../scada-components/registry'
import type { ComponentPoint } from '../scada-components/types'

interface Props {
	selectedNode: Node
}

const props = defineProps<Props>()

const emit = defineEmits<{
	'update-data-source': [config: { dataSourceId: string }]
}>()

// 获取所有数据源
const dataSources = computed(() => dataSourceManager.getAllDataSources())

// 当前选择的数据源ID
const selectedDataSourceId = ref<string>('')

// 点位列表是否展开
const isPointsExpanded = ref(false)

// 显示模式：'list' | 'json'
const displayMode = ref<'list' | 'json'>('list')

// 生成JSON示例（数据源返回的点位数组格式）
const jsonExample = computed(() => {
	if (!componentPoints.value || componentPoints.value.length === 0) return '[]'
	
	// 生成点位数据数组
	const pointsData = componentPoints.value.map(point => {
		let value: any
		if (point.dataType === 'boolean') {
			value = point.defaultValue ?? false
		} else if (point.dataType === 'number') {
			value = point.defaultValue ?? (point.range ? point.range.min : 0)
		} else if (point.dataType === 'string') {
			value = point.defaultValue ?? ''
		} else if (point.dataType === 'json') {
			value = point.defaultValue ?? []
		} else {
			value = null
		}
		
		return {
			id: point.id,
			value: value
		}
	})
	
	// 数据源只返回点位数组
	return JSON.stringify(pointsData, null, 2)
})

// 当前数据源
const currentDataSource = computed(() => {
	if (!selectedDataSourceId.value) return null
	return dataSourceManager.getDataSource(selectedDataSourceId.value)
})

// 获取组件的点位定义
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

// 从节点数据初始化
watch(() => props.selectedNode, (node) => {
	if (node) {
		const nodeData = node.getData()
		if (nodeData?.dataBinding) {
			selectedDataSourceId.value = nodeData.dataBinding.dataSourceId || ''
		} else {
			selectedDataSourceId.value = ''
		}
	}
}, { immediate: true })

// 处理数据源变化
const handleDataSourceChange = (event: Event) => {
	const value = (event.target as HTMLSelectElement).value
	selectedDataSourceId.value = value
	emitUpdate()
}

// 发送更新事件
const emitUpdate = () => {
	emit('update-data-source', {
		dataSourceId: selectedDataSourceId.value
	})
}
</script>

<style scoped>
/* 紧凑布局 */
.compact-data-binding {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 0;
}

.compact-row {
	display: flex;
	align-items: center;
	gap: 8px;
}

.compact-row label {
	flex-shrink: 0;
	width: 70px;
	font-size: 11px;
	color: #cbd5e1;
	font-weight: 500;
}

.compact-select {
	flex: 1;
	min-width: 0;
	padding: 6px 10px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 12px;
	transition: all 0.2s;
}

.compact-select:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 状态点 */
.status-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	flex-shrink: 0;
	cursor: help;
}

.status-dot.connected {
	background: #22c55e;
	box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

.status-dot.disconnected {
	background: #ef4444;
	box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
}

/* 组件点位信息 */
.component-points {
	background: rgba(59, 130, 246, 0.05);
	border: 1px solid rgba(59, 130, 246, 0.2);
	border-radius: 6px;
	overflow: hidden;
}

.points-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px 12px;
	background: rgba(59, 130, 246, 0.1);
	border-bottom: 1px solid rgba(59, 130, 246, 0.2);
	cursor: pointer;
	transition: background 0.2s;
}

.points-header:hover {
	background: rgba(59, 130, 246, 0.15);
}

.points-header-left {
	display: flex;
	align-items: center;
	gap: 8px;
}

.points-header-right {
	display: flex;
	align-items: center;
	gap: 8px;
}

.display-mode-toggle {
	display: flex;
	gap: 4px;
	padding: 2px;
	background: rgba(15, 23, 42, 0.5);
	border-radius: 4px;
}

.mode-btn {
	padding: 4px 8px;
	background: transparent;
	border: none;
	border-radius: 3px;
	color: #94a3b8;
	font-size: 11px;
	cursor: pointer;
	transition: all 0.2s;
	min-width: 32px;
}

.mode-btn:hover {
	background: rgba(59, 130, 246, 0.2);
	color: #e2e8f0;
}

.mode-btn.active {
	background: #3b82f6;
	color: #fff;
	font-weight: 500;
}

.collapse-icon {
	font-size: 10px;
	color: #94a3b8;
	transition: transform 0.2s;
}

.points-title {
	font-size: 12px;
	font-weight: 600;
	color: #e2e8f0;
}

.points-count {
	font-size: 10px;
	padding: 2px 8px;
	background: rgba(59, 130, 246, 0.3);
	border-radius: 10px;
	color: #60a5fa;
	font-weight: 600;
}

.points-list {
	max-height: 200px;
	overflow-y: auto;
	padding: 8px;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.point-item {
	padding: 8px 10px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	transition: all 0.2s;
}

.point-item:hover {
	border-color: #3b82f6;
	background: rgba(59, 130, 246, 0.05);
}

.point-main {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 4px;
}

.point-name {
	font-size: 12px;
	font-weight: 500;
	color: #e2e8f0;
}

.point-id {
	font-size: 10px;
	font-family: monospace;
	color: #94a3b8;
	background: #1e293b;
	padding: 2px 6px;
	border-radius: 3px;
}

.point-meta {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 10px;
}

.point-type {
	color: #60a5fa;
	background: rgba(59, 130, 246, 0.1);
	padding: 2px 6px;
	border-radius: 3px;
}

.point-unit {
	color: #a78bfa;
}

.point-required {
	color: #f87171;
	background: rgba(239, 68, 68, 0.1);
	padding: 2px 6px;
	border-radius: 3px;
}

/* JSON示例 */
.json-example {
	margin: 8px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	overflow: hidden;
}

.json-header {
	padding: 6px 10px;
	background: #1e293b;
	border-bottom: 1px solid #334155;
}

.json-title {
	font-size: 11px;
	font-weight: 500;
	color: #cbd5e1;
}

.json-code {
	margin: 0;
	padding: 10px;
	font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
	font-size: 11px;
	line-height: 1.5;
	color: #10b981;
	white-space: pre;
	overflow-x: auto;
}

.json-code::-webkit-scrollbar {
	height: 4px;
}

.json-code::-webkit-scrollbar-track {
	background: transparent;
}

.json-code::-webkit-scrollbar-thumb {
	background: #334155;
	border-radius: 2px;
}

.json-code::-webkit-scrollbar-thumb:hover {
	background: #475569;
}

.points-tip {
	padding: 8px 12px;
	background: rgba(59, 130, 246, 0.08);
	border-top: 1px solid rgba(59, 130, 246, 0.15);
	font-size: 10px;
	color: #94a3b8;
	text-align: center;
}

/* 提示信息 */
.compact-hint {
	padding: 8px 12px;
	background: rgba(59, 130, 246, 0.1);
	border: 1px solid rgba(59, 130, 246, 0.2);
	border-radius: 4px;
	font-size: 11px;
	color: #94a3b8;
	text-align: center;
}

.compact-hint.warning {
	background: rgba(245, 158, 11, 0.1);
	border-color: rgba(245, 158, 11, 0.3);
	color: #fbbf24;
}

/* 滚动条 */
.points-list::-webkit-scrollbar {
	width: 4px;
}

.points-list::-webkit-scrollbar-track {
	background: transparent;
}

.points-list::-webkit-scrollbar-thumb {
	background: #334155;
	border-radius: 2px;
}

.points-list::-webkit-scrollbar-thumb:hover {
	background: #475569;
}
</style>
