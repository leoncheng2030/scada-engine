<template>
	<div class="edge-properties-tab">
		<div class="property-section">
			<h4 class="section-title">线条样式</h4>
			
			<!-- 边类型选择 -->
			<div class="property-item">
				<label class="property-label">边类型</label>
				<select 
					class="property-select"
					:value="getEdgeShape()"
					@change="updateEdgeShape"
				>
					<option value="animated-edge">普通线条</option>
					<option value="pipeline-edge">管道样式</option>
				</select>
			</div>
			
			<!-- 管道内径（仅管道样式显示） -->
			<div v-if="getEdgeShape() === 'pipeline-edge'" class="property-item">
				<label class="property-label">管道内径</label>
				<div class="number-input-wrapper">
					<input 
						type="number" 
						class="property-input"
						min="2"
						max="30"
						step="1"
						:value="getPipelineDiameter()"
						@input="updatePipelineDiameter"
					/>
					<span class="input-unit">px</span>
				</div>
				<div class="property-hint">调整管道的粗细，影响所有层的宽度</div>
			</div>
			
			<!-- 线条颜色 -->
			<div class="property-item">
				<label class="property-label">线条颜色</label>
				<div class="color-input-wrapper">
					<input 
						type="color" 
						class="color-input"
						:value="edgeAttrs.line?.stroke || '#10b981'"
						@input="updateStroke"
					/>
					<input 
						type="text" 
						class="color-text"
						:value="edgeAttrs.line?.stroke || '#10b981'"
						@input="updateStroke"
					/>
				</div>
			</div>

			<!-- 线条粗细（普通线条时显示） -->
			<div v-if="getEdgeShape() === 'animated-edge'" class="property-item">
				<label class="property-label">线条粗细</label>
				<div class="number-input-wrapper">
					<input 
						type="number" 
						class="property-input"
						min="1"
						max="20"
						step="1"
						:value="edgeAttrs.line?.strokeWidth || 2"
						@input="updateStrokeWidth"
					/>
					<span class="input-unit">px</span>
				</div>
			</div>

			<!-- 线条样式 -->
			<div class="property-item">
				<label class="property-label">线条样式</label>
				<select 
					class="property-select"
					:value="getStrokeDasharray()"
					@change="updateStrokeDasharray"
				>
					<option value="none">实线</option>
					<option value="5,5">虚线</option>
					<option value="2,2">点线</option>
					<option value="10,5,2,5">点划线</option>
				</select>
			</div>

			<!-- 透明度 -->
			<div class="property-item">
				<label class="property-label">透明度</label>
				<div class="slider-wrapper">
					<input 
						type="range" 
						class="property-slider"
						min="0"
						max="1"
						step="0.1"
						:value="edgeAttrs.line?.opacity !== undefined ? edgeAttrs.line.opacity : 1"
						@input="updateOpacity"
					/>
					<span class="slider-value">{{ getOpacityPercent() }}%</span>
				</div>
			</div>

			<!-- 流动动画 -->
			<div class="property-item">
				<label class="property-label">流动动画</label>
				<select 
					class="property-select"
					:value="getAnimationEnabled()"
					@change="updateAnimationEnabled"
				>
					<option value="false">关闭</option>
					<option value="true">开启</option>
				</select>
			</div>

			<!-- 动画速度 -->
			<div v-if="getAnimationEnabled() === 'true'" class="property-item">
				<label class="property-label">动画速度</label>
				<div class="number-input-wrapper">
					<input 
						type="number" 
						class="property-input"
						min="0.5"
						max="10"
						step="0.5"
						:value="getAnimationDuration()"
						@input="updateAnimationDuration"
					/>
					<span class="input-unit">秒</span>
				</div>
			</div>
		</div>

		<div class="property-section">
			<h4 class="section-title">箭头样式</h4>
			
			<!-- 起点箭头 -->
			<div class="property-item">
				<label class="property-label">起点箭头</label>
				<select 
					class="property-select"
					:value="getMarkerType('source')"
					@change="updateSourceMarker"
				>
					<option value="none">无</option>
					<option value="block">实心箭头</option>
					<option value="classic">经典箭头</option>
					<option value="diamond">菱形</option>
					<option value="circle">圆形</option>
				</select>
			</div>

			<!-- 终点箭头 -->
			<div class="property-item">
				<label class="property-label">终点箭头</label>
				<select 
					class="property-select"
					:value="getMarkerType('target')"
					@change="updateTargetMarker"
				>
					<option value="none">无</option>
					<option value="block">实心箭头</option>
					<option value="classic">经典箭头</option>
					<option value="diamond">菱形</option>
					<option value="circle">圆形</option>
				</select>
			</div>
		</div>

		<div class="property-section">
			<h4 class="section-title">连接器</h4>
			
			<!-- 路由方式 -->
			<div class="property-item">
				<label class="property-label">路由方式</label>
				<select 
					class="property-select"
					:value="selectedEdge?.getRouter()?.name || 'manhattan'"
					@change="updateRouter"
				>
					<option value="manhattan">曼哈顿</option>
					<option value="orth">正交</option>
					<option value="normal">直线</option>
				</select>
			</div>

			<!-- 连接器类型 -->
			<div class="property-item">
				<label class="property-label">连接器类型</label>
				<select 
					class="property-select"
					:value="selectedEdge?.getConnector()?.name || 'rounded'"
					@change="updateConnector"
				>
					<option value="rounded">圆角</option>
					<option value="smooth">平滑</option>
					<option value="normal">普通</option>
				</select>
			</div>
		</div>

		<!-- 删除按钮 -->
		<div class="property-section">
			<button class="delete-btn" @click="handleDelete">
				删除连线
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Edge } from '@antv/x6'

interface Props {
	selectedEdge: Edge | null
}

interface Emits {
	(e: 'updateEdge', updates: any): void
	(e: 'deleteEdge'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 获取边的属性
const edgeAttrs = computed(() => {
	return props.selectedEdge?.getAttrs() || {}
})

// 获取当前边类型
const getEdgeShape = () => {
	return props.selectedEdge?.shape || 'animated-edge'
}

// 更新边类型
const updateEdgeShape = (event: Event) => {
	const value = (event.target as HTMLSelectElement).value
	if (!props.selectedEdge) return
	
	// 获取当前边的数据
	const edgeData = props.selectedEdge.getData()
	const currentAttrs = props.selectedEdge.getAttrs()
	
	// 根据新类型设置默认样式
	let newAttrs = { ...currentAttrs }
	if (value === 'pipeline-edge') {
		// 管道样式：设置特殊的多层样式
		newAttrs = {
			shadow: {
				connection: true,
				stroke: '#1e293b',
				strokeWidth: 10,
				strokeLinecap: 'round',
				strokeLinejoin: 'round'
			},
			line: {
				...currentAttrs.line,
				stroke: currentAttrs.line?.stroke || '#475569',
				strokeWidth: 8,
				strokeLinecap: 'round',
				strokeLinejoin: 'round'
			},
			highlight: {
				connection: true,
				stroke: '#94a3b8',
				strokeWidth: 3,
				strokeLinecap: 'round',
				strokeLinejoin: 'round'
			}
		}
	} else if (value === 'animated-edge') {
		// 普通线条：移除额外的层
		newAttrs = {
			line: {
				...currentAttrs.line,
				stroke: currentAttrs.line?.stroke || '#10b981',
				strokeWidth: currentAttrs.line?.strokeWidth || 2
			}
		}
	}
	
	// 更新边的 shape 和 attrs
	emit('updateEdge', {
		shape: value,
		attrs: newAttrs,
		data: edgeData
	})
}

// 获取管道内径（基于主管道的 strokeWidth）
const getPipelineDiameter = () => {
	if (!props.selectedEdge || props.selectedEdge.shape !== 'pipeline-edge') {
		return 8 // 默认值
	}
	return edgeAttrs.value.line?.strokeWidth || 8
}

// 更新管道内径（同时调整所有层的宽度）
const updatePipelineDiameter = (event: Event) => {
	const diameter = Number((event.target as HTMLInputElement).value)
	if (!props.selectedEdge || props.selectedEdge.shape !== 'pipeline-edge') return
	
	// 根据内径计算各层宽度
	// 阴影层（shadow）：保持固定宽度，不随内径变化
	// 主管道（line）= 内径
	// 高光层（highlight）= 内径 * 0.375
	const lineWidth = diameter*0.5
	const highlightWidth = Math.max(2, diameter * 0.375)
	
	emit('updateEdge', {
		attrs: {
			line: {
				strokeWidth: lineWidth
			},
			highlight: {
				strokeWidth: highlightWidth
			},
		}
	})
}

// 更新线条颜色
const updateStroke = (event: Event) => {
	const value = (event.target as HTMLInputElement).value
	emit('updateEdge', { 
		attrs: { 
			line: { 
				stroke: value 
			} 
		} 
	})
}

// 更新线条粗细
const updateStrokeWidth = (event: Event) => {
	const value = Number((event.target as HTMLInputElement).value)
	emit('updateEdge', { 
		attrs: { 
			line: { 
				strokeWidth: value 
			} 
		} 
	})
}

// 获取当前线条样式
const getStrokeDasharray = () => {
	const dasharray = edgeAttrs.value.line?.strokeDasharray
	if (!dasharray) return 'none'
	if (dasharray === '5,5') return '5,5'
	if (dasharray === '2,2') return '2,2'
	if (dasharray === '10,5,2,5') return '10,5,2,5'
	return 'none'
}

// 更新线条样式
const updateStrokeDasharray = (event: Event) => {
	const value = (event.target as HTMLSelectElement).value
	emit('updateEdge', { 
		attrs: { 
			line: { 
				strokeDasharray: value === 'none' ? undefined : value
			} 
		} 
	})
}

// 更新透明度
const updateOpacity = (event: Event) => {
	const value = Number((event.target as HTMLInputElement).value)
	emit('updateEdge', { 
		attrs: { 
			line: { 
				opacity: value 
			} 
		} 
	})
}

// 获取箭头类型
const getMarkerType = (position: 'source' | 'target') => {
	const marker = edgeAttrs.value.line?.[`${position}Marker`]
	if (!marker || typeof marker !== 'object' || !(marker as any).name) return 'none'
	return (marker as any).name
}

// 获取透明度百分比
const getOpacityPercent = () => {
	const opacity = edgeAttrs.value.line?.opacity
	const value = opacity !== undefined && typeof opacity === 'number' ? opacity : 1
	return (value * 100).toFixed(0)
}

// 更新起点箭头
const updateSourceMarker = (event: Event) => {
	const value = (event.target as HTMLSelectElement).value
	const marker = value === 'none' ? undefined : { name: value, width: 8, height: 6 }
	emit('updateEdge', { 
		attrs: { 
			line: { 
				sourceMarker: marker
			} 
		} 
	})
}

// 更新终点箭头
const updateTargetMarker = (event: Event) => {
	const value = (event.target as HTMLSelectElement).value
	const marker = value === 'none' ? undefined : { name: value, width: 8, height: 6 }
	emit('updateEdge', { 
		attrs: { 
			line: { 
				targetMarker: marker
			} 
		} 
	})
}

// 更新路由方式
const updateRouter = (event: Event) => {
	const value = (event.target as HTMLSelectElement).value
	emit('updateEdge', { router: value })
}

// 更新连接器类型
const updateConnector = (event: Event) => {
	const value = (event.target as HTMLSelectElement).value
	const args = value === 'rounded' ? { radius: 8 } : undefined
	emit('updateEdge', { connector: { name: value, args } })
}

// 删除连线
const handleDelete = () => {
	emit('deleteEdge')
}

// 获取动画是否启用
const getAnimationEnabled = () => {
	const animation = props.selectedEdge?.data?.animation
	return animation?.enabled ? 'true' : 'false'
}

// 获取动画时长（秒）
const getAnimationDuration = () => {
	const animation = props.selectedEdge?.data?.animation
	return animation?.duration ? animation.duration / 1000 : 2
}

// 更新动画开关
const updateAnimationEnabled = (event: Event) => {
	const enabled = (event.target as HTMLSelectElement).value === 'true'
	
	if (!enabled) {
		// 关闭动画
		emit('updateEdge', { 
			data: { animation: { enabled: false } },
			animation: { enabled: false }
		})
	} else {
		// 开启动画，使用默认时长2秒
		const duration = getAnimationDuration() * 1000
		emit('updateEdge', { 
			data: { animation: { enabled: true, duration } },
			animation: { enabled: true, duration }
		})
	}
}

// 更新动画时长
const updateAnimationDuration = (event: Event) => {
	const seconds = Number((event.target as HTMLInputElement).value)
	const duration = seconds * 1000 // 转换为毫秒
	
	emit('updateEdge', { 
		data: { animation: { enabled: true, duration } },
		animation: { enabled: true, duration }
	})
}
</script>

<style scoped>
.edge-properties-tab {
	padding: 0;
}

.property-section {
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid #334155;
}

.property-section:last-child {
	border-bottom: none;
	margin-bottom: 0;
}

.section-title {
	font-size: 13px;
	font-weight: 600;
	color: #e2e8f0;
	margin: 0 0 12px 0;
	padding: 0;
}

.property-item {
	margin-bottom: 12px;
}

.property-item:last-child {
	margin-bottom: 0;
}

.property-label {
	display: block;
	font-size: 12px;
	color: #94a3b8;
	margin-bottom: 6px;
	font-weight: 500;
}

.color-input-wrapper {
	display: flex;
	gap: 8px;
	align-items: center;
}

.color-input {
	width: 40px;
	height: 32px;
	border: 1px solid #475569;
	border-radius: 4px;
	cursor: pointer;
	background: #1e293b;
	padding: 2px;
}

.color-input::-webkit-color-swatch-wrapper {
	padding: 0;
}

.color-input::-webkit-color-swatch {
	border: none;
	border-radius: 2px;
}

.color-text {
	flex: 1;
	height: 32px;
	background: #1e293b;
	border: 1px solid #475569;
	border-radius: 4px;
	padding: 0 12px;
	color: #e2e8f0;
	font-size: 12px;
	font-family: 'Consolas', monospace;
}

.color-text:focus {
	outline: none;
	border-color: #3b82f6;
}

.number-input-wrapper {
	display: flex;
	align-items: center;
	gap: 8px;
}

.property-input {
	flex: 1;
	height: 32px;
	background: #1e293b;
	border: 1px solid #475569;
	border-radius: 4px;
	padding: 0 12px;
	color: #e2e8f0;
	font-size: 12px;
}

.property-input:focus {
	outline: none;
	border-color: #3b82f6;
}

.input-unit {
	font-size: 12px;
	color: #64748b;
	min-width: 24px;
}

.property-hint {
	font-size: 11px;
	color: #64748b;
	margin-top: 4px;
	line-height: 1.4;
}

.property-select {
	width: 100%;
	height: 32px;
	background: #1e293b;
	border: 1px solid #475569;
	border-radius: 4px;
	padding: 0 12px;
	color: #e2e8f0;
	font-size: 12px;
	cursor: pointer;
}

.property-select:focus {
	outline: none;
	border-color: #3b82f6;
}

.slider-wrapper {
	display: flex;
	align-items: center;
	gap: 12px;
}

.property-slider {
	flex: 1;
	height: 4px;
	background: #334155;
	border-radius: 2px;
	outline: none;
	-webkit-appearance: none;
	appearance: none;
}

.property-slider::-webkit-slider-thumb {
	-webkit-appearance: none;
	width: 14px;
	height: 14px;
	background: #3b82f6;
	border-radius: 50%;
	cursor: pointer;
}

.property-slider::-moz-range-thumb {
	width: 14px;
	height: 14px;
	background: #3b82f6;
	border-radius: 50%;
	border: none;
	cursor: pointer;
}

.slider-value {
	font-size: 12px;
	color: #94a3b8;
	min-width: 40px;
	text-align: right;
}

.delete-btn {
	width: 100%;
	height: 36px;
	background: #dc2626;
	border: none;
	border-radius: 4px;
	color: #fff;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
}

.delete-btn:hover {
	background: #b91c1c;
}

.delete-btn:active {
	transform: scale(0.98);
}
</style>
