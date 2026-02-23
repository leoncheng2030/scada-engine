<template>
	<!-- 使用与编辑模式完全相同的主题，画布尺寸使用配置值 -->
	<div class="scada-layout" data-scada-theme="dark" :style="layoutStyle">
		<div 
			class="canvas-container" 
			ref="canvasContainer"
			:style="containerStyle"
		>
			<!-- 空状态提示 -->
			<div v-if="!hasData" class="empty-state">
				<div class="empty-icon">📭</div>
				<div class="empty-text">暂无内容</div>
				<div class="empty-hint">请先在编辑模式下添加组件并保存</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Graph } from '@antv/x6'
import { register } from '@antv/x6-vue-shape'
import * as ScadaComponents from '../../scada-components'
import type { ComponentConfig } from '../../scada-components/types'
import { applyEdgeAnimation } from '../../shared/utils/edgeAnimationUtils'

const canvasContainer = ref<HTMLElement>()
const hasData = ref(false)
const canvasConfig = ref<any>({
	width: 1920,
	height: 1080,
	background: {
		color: '#1e293b'
	}
})

let graph: Graph | null = null

// 动态计算样式，使用配置的画布尺寸
const layoutStyle = computed(() => ({
	width: `${canvasConfig.value.width}px`,
	height: `${canvasConfig.value.height}px`
}))

const containerStyle = computed(() => ({
	width: `${canvasConfig.value.width}px`,
	height: `${canvasConfig.value.height}px`
}))

onMounted(async () => {
	if (!canvasContainer.value) return
	
	// 预加载所有组件,确保组件已注册
	await ScadaComponents.componentRegistry.preloadAllComponents()
	console.log('组件预加载完成')
	
	// 注册所有 Vue Shape
	const allComponents = ScadaComponents.componentRegistry.getAllComponents()
	Object.values(allComponents).forEach((config) => {
		const componentConfig = config as ComponentConfig
		if (componentConfig.component) {
			try {
				register({
					shape: componentConfig.shape,
					width: componentConfig.width,
					height: componentConfig.height,
					component: componentConfig.component,
					ports: componentConfig.ports
				})
			} catch (error) {
				// 忽略重复注册错误
			}
		}
	})
	
	// 注册支持流动动画的边
	Graph.registerEdge('animated-edge', {
		inherit: 'edge',
		markup: [
			{
				tagName: 'path',
				selector: 'line',
				attrs: {
					fill: 'none'
				}
			},
			{
				tagName: 'path',
				selector: 'wrap',
				attrs: {
					fill: 'none',
					stroke: 'rgba(0,0,0,0)',
					strokeWidth: 20
				}
			},
			{
				tagName: 'circle',
				selector: 'circle'
			}
		],
		attrs: {
			line: {
				connection: true,
				stroke: '#10b981',
				strokeWidth: 2,
				targetMarker: {
					name: 'block',
					width: 8,
					height: 6
				}
			},
			wrap: {
				connection: true,
				strokeLinecap: 'round',
				strokeLinejoin: 'round'
			}
		}
	}, true)
	
	// 注册管道样式的边（具有立体感的管道效果）
	Graph.registerEdge('pipeline-edge', {
		inherit: 'edge',
		markup: [
			{
				tagName: 'path',
				selector: 'shadow',
				attrs: {
					fill: 'none'
				}
			},
			{
				tagName: 'path',
				selector: 'line',
				attrs: {
					fill: 'none'
				}
			},
			{
				tagName: 'path',
				selector: 'highlight',
				attrs: {
					fill: 'none'
				}
			},
			{
				tagName: 'path',
				selector: 'wrap',
				attrs: {
					fill: 'none',
					stroke: 'rgba(0,0,0,0)',
					strokeWidth: 20
				}
			},
			{
				tagName: 'circle',
				selector: 'circle'
			}
		],
		attrs: {
			shadow: {
				connection: true,
				stroke: '#1e293b',
				strokeWidth: 10,
				strokeLinecap: 'butt',
				strokeLinejoin: 'miter'
			},
			line: {
				connection: true,
				stroke: '#475569',
				strokeWidth: 8,
				strokeLinecap: 'butt',
				strokeLinejoin: 'miter',
				targetMarker: {
					name: 'block',
					width: 10,
					height: 8,
					fill: '#475569'
				}
			},
			highlight: {
				connection: true,
				stroke: '#94a3b8',
				strokeWidth: 3,
				strokeLinecap: 'butt',
				strokeLinejoin: 'miter',
				strokeDasharray: '0',
				strokeDashoffset: 0
			},
			wrap: {
				connection: true,
				strokeLinecap: 'butt',
				strokeLinejoin: 'miter'
			}
		}
	}, true)
	
	// 加载画布数据
	loadCanvasData()
})

const loadCanvasData = () => {
	try {
		const savedData = localStorage.getItem('scada-canvas-data')
		if (!savedData) {
			console.warn('localStorage 中没有找到画布数据')
			return
		}
		
		const data = JSON.parse(savedData)
		console.log('加载的原始数据:', data)
		
		// 加载画布配置
		if (data.config) {
			canvasConfig.value = {
				...canvasConfig.value,
				...data.config
			}
			console.log('画布配置:', canvasConfig.value)
		}
		
		// 创建 X6 画布实例
		if (!canvasContainer.value) return
		
		graph = new Graph({
			container: canvasContainer.value,
			width: canvasConfig.value.width,
			height: canvasConfig.value.height,
			background: canvasConfig.value.background.image ? {
				color: canvasConfig.value.background.color || '#1e293b',
				image: canvasConfig.value.background.image,
				size: canvasConfig.value.background.size || 'cover',
				repeat: canvasConfig.value.background.repeat || 'no-repeat',
				position: 'center'
			} : {
				color: canvasConfig.value.background.color || '#1e293b'
			},
			grid: canvasConfig.value.grid?.enabled ? {
				size: canvasConfig.value.grid.size,
				visible: true,
				type: canvasConfig.value.grid.type || 'dot',
				args: {
					color: canvasConfig.value.grid.color || '#475569',
					thickness: 1
				}
			} : false,
			// 预览模式：禁用所有交互
			interacting: false,
			panning: false,
			mousewheel: false
		})
		
		// 清洗和验证 cells 数据
		if (data.cells && data.cells.length > 0) {
			console.log('🔍 完整的 cells 数据:', data.cells)
			
			// 验证每个 cell是否有 shape
			const validCells = data.cells.filter((cell: any, index: number) => {
				if (!cell.shape) {
					console.error(`Cell ${index} 缺少 shape 字段:`, cell)
					return false
				}
				console.log(`Cell ${index}:`, cell)
				return true
			})
			
			if (validCells.length === 0) {
				console.error('所有 cells 都缺少 shape 字段')
				return
			}
			
			graph.fromJSON({ cells: validCells })
			hasData.value = true
			console.log('画布数据加载成功，节点数:', graph.getNodes().length, '连线数:', graph.getEdges().length)
			
			// 恢复后，对所有启用了动画的连线应用动画
			graph.getEdges().forEach((edge: any) => {
				const edgeData = edge.getData()
				if (edgeData?.animation?.enabled) {
					applyEdgeAnimation(edge, edgeData.animation)
				}
			})
		}
	} catch (error) {
		console.error('加载画布数据失败:', error)
	}
}
</script>

<style scoped>
/* 预览模式：使用编辑模式的主题，画布尺寸由配置决定 */

/* 主容器 - 尺寸由 JS 动态设置（通过 layoutStyle） */
.scada-layout {
	display: flex;
	background: #0f172a;
	overflow: hidden;
}

/* 画布容器 - 尺寸由 JS 动态设置（通过 containerStyle） */
.canvas-container {
	position: relative;
	/* 预览模式：去掉编辑模式的边框和阴影 */
}

/* 空状态提示 */
.empty-state {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	text-align: center;
	color: #64748b;
}

.empty-icon {
	font-size: 64px;
	margin-bottom: 16px;
}

.empty-text {
	font-size: 18px;
	font-weight: 600;
	color: #94a3b8;
	margin-bottom: 8px;
}

.empty-hint {
	font-size: 14px;
	color: #64748b;
}
</style>
