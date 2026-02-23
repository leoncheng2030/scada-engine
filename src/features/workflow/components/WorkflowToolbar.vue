<template>
	<div class="toolbar">
		<div class="toolbar-left">
			<h2>流程编排</h2>
		</div>
		<div class="toolbar-right">
			<button class="btn-secondary" @click="$emit('clear')">清空</button>
			<button class="btn-secondary" @click="$emit('validate')">验证</button>
			<button class="btn-primary" @click="$emit('save')">保存</button>
			<button v-if="showClose" class="btn-close" @click="$emit('close')" title="关闭">
				<span class="close-icon">×</span>
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
interface Props {
	showClose?: boolean
}

interface Emits {
	(e: 'clear'): void
	(e: 'validate'): void
	(e: 'save'): void
	(e: 'close'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
.toolbar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 24px;
	background: #1e293b;
	border-bottom: 1px solid #334155;
}

.toolbar-left {
	display: flex;
	align-items: center;
	gap: 24px;
}

.toolbar-left h2 {
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: #e2e8f0;
}

.toolbar-right {
	display: flex;
	gap: 12px;
}

.btn-secondary,
.btn-primary {
	padding: 8px 16px;
	border: none;
	border-radius: 4px;
	font-size: 14px;
	cursor: pointer;
	transition: all 0.2s;
}

.btn-secondary {
	background: #334155;
	color: #e2e8f0;
}

.btn-secondary:hover {
	background: #475569;
}

.btn-primary {
	background: #3b82f6;
	color: white;
}

.btn-primary:hover {
	background: #2563eb;
}

.btn-close {
	width: 36px;
	height: 36px;
	padding: 0;
	background: transparent;
	border: 1px solid #475569;
	border-radius: 4px;
	color: #94a3b8;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
	margin-left: 8px;
}

.btn-close:hover {
	background: #475569;
	border-color: #64748b;
	color: #e2e8f0;
}

.close-icon {
	font-size: 24px;
	line-height: 1;
}
</style>
