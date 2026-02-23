<template>
	<div class="canvas-area">
		<div ref="containerRef" class="canvas-container"></div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const containerRef = ref<HTMLElement>()

defineExpose({
	containerRef
})
</script>

<style scoped>
.canvas-area {
	flex: 1;
	display: flex;
	align-items: flex-start; /* 改为center会导致滚动问题 */
	justify-content: flex-start; /* 改为center会导致滚动问题 */
	background: #0f172a;
	overflow: auto; /* 允许滚动 */
	position: relative;
	padding: 20px; /* 留出一些边距 */
}

.canvas-container {
	position: relative;
	/* 尺寸由 JS 动态设置 */
	border: 2px solid #334155;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	transition: transform 0.2s ease;
}

/* 滚动条样式 - 与全局统一 */
.canvas-area::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

.canvas-area::-webkit-scrollbar-track {
	background: #0f172a;
	border-radius: 4px;
}

.canvas-area::-webkit-scrollbar-thumb {
	background: linear-gradient(180deg, #475569, #334155);
	border-radius: 4px;
	border: 2px solid #0f172a;
	transition: background 0.2s;
}

.canvas-area::-webkit-scrollbar-thumb:hover {
	background: linear-gradient(180deg, #3b82f6, #2563eb);
}

.canvas-area::-webkit-scrollbar-corner {
	background: #0f172a;
}
</style>
