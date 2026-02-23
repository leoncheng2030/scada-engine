<template>
	<div v-if="visible" class="workflow-dialog-overlay">
		<div class="workflow-dialog">
			<!-- 流程编辑器主体 -->
			<WorkflowEditor 
				:scada-graph="scadaGraph"
				:show-close="true"
				@close="handleClose"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import WorkflowEditor from './WorkflowEditor.vue'
import type { Graph } from '@antv/x6'

interface Props {
	visible: boolean
	scadaGraph?: Graph | null
}

interface Emits {
	(e: 'update:visible', value: boolean): void
	(e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
	scadaGraph: null
})

const emit = defineEmits<Emits>()

// 监听 visible 变化，处理 body 滚动
watch(() => props.visible, (newVal) => {
	if (newVal) {
		document.body.style.overflow = 'hidden'
	} else {
		document.body.style.overflow = ''
	}
})

const handleClose = () => {
	emit('update:visible', false)
	emit('close')
}

// 按 ESC 键关闭
const handleKeydown = (e: KeyboardEvent) => {
	if (e.key === 'Escape' && props.visible) {
		handleClose()
	}
}

// 添加键盘事件监听
if (typeof window !== 'undefined') {
	window.addEventListener('keydown', handleKeydown)
}
</script>

<style scoped>
.workflow-dialog-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.8);
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
}

.workflow-dialog {
	width: 100vw;
	height: 100vh;
	background: #0f172a;
	overflow: hidden;
}
</style>
