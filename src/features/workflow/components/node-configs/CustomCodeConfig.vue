<template>
	<div class="node-config">
		<div class="config-group">
			<label>JavaScript代码</label>
			<textarea 
				v-model="config.code" 
				rows="10"
				placeholder="请输入JavaScript代码"
				@input="handleUpdate"
			/>
		</div>
		<div class="code-hint">
			<p>提示：</p>
			<ul>
				<li>可以使用 context 对象访问上下文变量</li>
				<li>使用 return 返回结果</li>
			</ul>
		</div>
	</div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { CustomCodeNodeConfig } from '../../types/node'

interface Props {
	modelValue: Partial<CustomCodeNodeConfig>
}

interface Emits {
	(e: 'update:modelValue', value: Partial<CustomCodeNodeConfig>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const config = reactive<Partial<CustomCodeNodeConfig>>({
	code: props.modelValue.code || ''
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

.config-group textarea {
	padding: 8px 12px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 13px;
	resize: vertical;
	font-family: 'Consolas', 'Monaco', monospace;
}

.config-group textarea:focus {
	outline: none;
	border-color: #3b82f6;
}

.code-hint {
	padding: 12px;
	background: rgba(59, 130, 246, 0.1);
	border-left: 3px solid #3b82f6;
	border-radius: 4px;
}

.code-hint p {
	margin: 0 0 8px 0;
	font-size: 13px;
	color: #94a3b8;
	font-weight: 500;
}

.code-hint ul {
	margin: 0;
	padding-left: 20px;
}

.code-hint li {
	font-size: 12px;
	color: #64748b;
	margin-bottom: 4px;
}
</style>
