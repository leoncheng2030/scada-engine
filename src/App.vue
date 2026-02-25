<template>
	<div class="app">
		<!-- 预览模式 -->
		<Preview v-if="isPreviewMode" />
		<!-- 编辑模式 -->
		<ScadaCanvas ref="canvasRef" v-else @preview="handlePreview" />
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ScadaCanvas from './features/canvas/components/ScadaCanvas.vue'
import Preview from './features/preview/Preview.vue'

// 检查是否为预览模式
const isPreviewMode = ref(false)

onMounted(() => {
	// 通过 URL 参数判断是否为预览模式
	const urlParams = new URLSearchParams(window.location.search)
	isPreviewMode.value = urlParams.get('mode') === 'preview'
})

// 预览处理
const handlePreview = () => {
	// 从 localStorage 读取画布配置，获取画布尺寸
	try {
		const savedData = localStorage.getItem('scada-canvas-data')
		let width = 1920
		let height = 1080
		
		if (savedData) {
			const data = JSON.parse(savedData)
			if (data.config?.width && data.config?.height) {
				width = data.config.width
				height = data.config.height
			}
		}
		
		// 在新窗口打开预览模式，使用画布配置的尺寸
		const previewUrl = `${window.location.origin}${window.location.pathname}?mode=preview`
		window.open(previewUrl, '_blank', `width=${width},height=${height}`)
	} catch (error) {
		console.error('读取画布配置失败:', error)
		// 失败时使用默认尺寸
		const previewUrl = `${window.location.origin}${window.location.pathname}?mode=preview`
		window.open(previewUrl, '_blank', 'width=1920,height=1080')
	}
}
</script>

<style scoped>
.app {
	width: 100%;
	height: 100%;
	overflow: hidden;
	margin: 0;
	padding: 0;
}
</style>
