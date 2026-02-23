<template>
	<div class="node-config">
		<div class="config-group">
			<label>时间间隔</label>
			<input 
				v-model.number="config.interval" 
				type="number" 
				min="1"
				placeholder="请输入时间间隔"
				@input="handleUpdate"
			/>
		</div>
		<div class="config-group">
			<label>时间单位</label>
			<select v-model="config.unit" @change="handleUpdate">
				<option value="ms">毫秒 (ms)</option>
				<option value="s">秒 (s)</option>
				<option value="m">分钟 (m)</option>
				<option value="h">小时 (h)</option>
			</select>
		</div>
	</div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { TimerNodeConfig } from '../../types/node'

interface Props {
	modelValue: Partial<TimerNodeConfig>
}

interface Emits {
	(e: 'update:modelValue', value: Partial<TimerNodeConfig>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const config = reactive<Partial<TimerNodeConfig>>({
	interval: props.modelValue.interval || 1000,
	unit: props.modelValue.unit || 'ms'
})

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
</style>
