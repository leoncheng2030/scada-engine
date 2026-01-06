<template>
	<div class="preview-container">
		<!-- 画布容器 -->
		<div class="preview-canvas-wrapper">
			<div ref="canvasContainer" class="preview-canvas"></div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

import { Graph } from '@antv/x6'
import { registerNodeEvents } from '../../utils/eventUtils'
import { loadFromSession, removeFromSession, STORAGE_KEYS } from '../../utils/storageUtils'
import { animationEngine } from '../../utils/animationEngine'

// 导入所有组件以确保它们被注册
import '../../scada-components/basic'
import '../../scada-components/iot'

const canvasContainer = ref<HTMLElement | null>(null)
let graph: Graph | null = null

// 从路由参数或 sessionStorage 获取画布数据
const loadCanvasData = () => {
	return loadFromSession(STORAGE_KEYS.SCADA_PREVIEW_DATA)
}

onMounted(() => {
	if (!canvasContainer.value) return

	const canvasData = loadCanvasData()
	if (!canvasData) {
		console.error('没有找到预览数据')
		return
	}

	// 初始化预览画布
	graph = new Graph({
		container: canvasContainer.value,
		width: canvasData.config?.width || 1200,
		height: canvasData.config?.height || 800,
		background: canvasData.config?.background || {
			color: '#1e293b'
		},
		grid: canvasData.config?.grid || false,
		// 启用点击交互，但禁用编辑功能
		interacting: {
			nodeMovable: false,      // 禁止节点移动
			edgeMovable: false,      // 禁止边移动
			edgeLabelMovable: false, // 禁止边标签移动
			arrowheadMovable: false, // 禁止箭头移动
			vertexMovable: false,    // 禁止顶点移动
			vertexAddable: false,    // 禁止添加顶点
			vertexDeletable: false,  // 禁止删除顶点
		},
		// 禁用平移
		panning: false,
		// 禁用鼠标滚轮
		mousewheel: false,
	})

	// 添加事件处理 - 统一处理所有事件类型
	// 为所有节点注册事件
	if (canvasData.cells) {
		graph.fromJSON(canvasData.cells)
		
		// 获取所有节点并注册事件和动画
		const nodes = graph.getNodes()
		nodes.forEach(node => {
			// 注册节点事件
			registerNodeEvents(graph, node)
			
			// 启动节点动画(如果配置了动画且启用)
			const nodeData = node.getData()
			if (nodeData && nodeData.animation && nodeData.animation.enabled === true) {
				const animationConfig = {
					type: nodeData.animation.type || 'none',
					duration: nodeData.animation.duration || 1000,
					loop: nodeData.animation.loop !== false
				}
				// 启动动画
				animationEngine.startAnimation(node, animationConfig)
			}
		})
	}

	console.log('预览模式已加载', canvasData)
})

onUnmounted(() => {
	// 清空所有动画
	animationEngine.clearAll()
	
	if (graph) {
		graph.dispose()
	}
	// 清除预览数据
	removeFromSession(STORAGE_KEYS.SCADA_PREVIEW_DATA)
})


</script>

<style scoped>
.preview-container {
	width: 100%;
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #0f172a;
	overflow: hidden;
}

.preview-header {
	height: 60px;
	background: #16213e;
	display: flex;
	align-items: center;
	padding: 0 24px;
	border-bottom: 1px solid #334155;
	flex-shrink: 0;
}

.preview-info {
	display: flex;
	align-items: center;
	gap: 16px;
}

.preview-info h2 {
	font-size: 18px;
	font-weight: 600;
	margin: 0;
	color: #e2e8f0;
}

.tip {
	font-size: 13px;
	color: #94a3b8;
}



.preview-canvas-wrapper {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	overflow: auto;
}

.preview-canvas {
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
	border-radius: 8px;
	overflow: hidden;
}
</style>
