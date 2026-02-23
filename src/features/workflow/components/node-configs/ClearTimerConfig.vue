<template>
	<div class="node-config">
		<div class="config-group">
			<label>选择定时器节点</label>
			<select v-model="config.timerId" @change="handleUpdate">
				<option value="">请选择要清除的定时器</option>
				<option 
					v-for="timer in timerNodes" 
					:key="timer.id" 
					:value="timer.id"
				>
					{{ timer.label }}
				</option>
			</select>
		</div>
		<div v-if="timerNodes.length === 0" class="timer-hint warning">
			<p>提示：当前流程中没有定时器节点</p>
		</div>
		<div v-else class="timer-hint">
			<p>提示：选择要清除的定时器节点</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, inject, watch } from 'vue'
import type { ClearTimerNodeConfig } from '../../types/node'

interface Props {
	modelValue: Partial<ClearTimerNodeConfig>
}

interface Emits {
	(e: 'update:modelValue', value: Partial<ClearTimerNodeConfig>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const config = reactive<Partial<ClearTimerNodeConfig>>({
	timerId: props.modelValue.timerId || ''
})

// 定时器节点列表
interface TimerNode {
	id: string
	label: string
}

const timerNodes = ref<TimerNode[]>([])

// 从父组件注入 getGraph 函数
const getGraph = inject<() => any>('getGraph')

// 获取所有定时器节点
const getTimerNodes = (): TimerNode[] => {
	if (!getGraph) return []
	
	const graph = getGraph()
	if (!graph) return []
	
	const nodes = graph.getNodes()
	const timers: TimerNode[] = []
	
	nodes.forEach((node: any) => {
		const nodeData = node.getData()
		if (nodeData?.nodeType === 'timer') {
			const label = node.getAttrByPath('label/text') || '定时器'
			timers.push({
				id: node.id,
				label: label
			})
		}
	})
	
	return timers
}

onMounted(() => {
	timerNodes.value = getTimerNodes()
})

// 监听配置变化，刷新定时器列表
watch(() => props.modelValue, () => {
	timerNodes.value = getTimerNodes()
}, { deep: true })

const handleUpdate = () => {
	emit('update:modelValue', { ...config })
}
</script>

<style scoped>
.node-config {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.config-group {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.config-group label {
	font-size: 13px;
	color: #94a3b8;
}

.config-group input,
.config-group select {
	padding: 8px 12px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 13px;
}

.config-group input:focus,
.config-group select:focus {
	outline: none;
	border-color: #3b82f6;
}

.timer-hint {
	padding: 12px;
	background: rgba(250, 173, 20, 0.1);
	border-left: 3px solid #faad14;
	border-radius: 4px;
}

.timer-hint p {
	margin: 0;
	font-size: 12px;
	color: #94a3b8;
}
.timer-hint.warning {
	background: rgba(239, 68, 68, 0.1);
	border-left-color: #ef4444;
}
</style>
