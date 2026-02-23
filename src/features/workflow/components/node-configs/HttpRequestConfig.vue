<template>
	<div class="node-config">
		<div class="config-group">
			<label>请求URL</label>
			<input 
				v-model="config.url" 
				type="text" 
				placeholder="请输入请求URL"
				@input="handleUpdate"
			/>
		</div>
		<div class="config-group">
			<label>请求方法</label>
			<select v-model="config.method" @change="handleUpdate">
				<option value="GET">GET</option>
				<option value="POST">POST</option>
				<option value="PUT">PUT</option>
				<option value="DELETE">DELETE</option>
			</select>
		</div>
		<div class="config-group">
			<label>请求头 (JSON格式)</label>
			<textarea 
				v-model="headersText" 
				rows="3"
				placeholder='{"Content-Type": "application/json"}'
				@input="handleHeadersUpdate"
			/>
		</div>
		<div class="config-group">
			<label>请求体</label>
			<textarea 
				v-model="config.body" 
				rows="4"
				placeholder="请输入请求体内容"
				@input="handleUpdate"
			/>
		</div>
		<div class="config-group">
			<label>输出变量</label>
			<input 
				v-model="config.outputVariable" 
				type="text" 
				placeholder="请输入输出变量名"
				@input="handleUpdate"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { HttpRequestNodeConfig } from '../../types/node'

interface Props {
	modelValue: Partial<HttpRequestNodeConfig>
}

interface Emits {
	(e: 'update:modelValue', value: Partial<HttpRequestNodeConfig>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const config = reactive<Partial<HttpRequestNodeConfig>>({
	url: props.modelValue.url || '',
	method: props.modelValue.method || 'GET',
	headers: props.modelValue.headers || {},
	body: props.modelValue.body || '',
	outputVariable: props.modelValue.outputVariable || ''
})

const headersText = ref(JSON.stringify(config.headers, null, 2))

const handleUpdate = () => {
	emit('update:modelValue', { ...config })
}

const handleHeadersUpdate = () => {
	try {
		config.headers = JSON.parse(headersText.value)
		handleUpdate()
	} catch (e) {
		// 忽略 JSON 解析错误
	}
}

watch(() => props.modelValue.headers, (newHeaders) => {
	if (newHeaders) {
		headersText.value = JSON.stringify(newHeaders, null, 2)
	}
})
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
.config-group textarea,
.config-group select {
	padding: 8px 12px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 13px;
}

.config-group input:focus,
.config-group textarea:focus,
.config-group select:focus {
	outline: none;
	border-color: #3b82f6;
}

.config-group textarea {
	resize: vertical;
	font-family: 'Consolas', 'Monaco', monospace;
}
</style>
