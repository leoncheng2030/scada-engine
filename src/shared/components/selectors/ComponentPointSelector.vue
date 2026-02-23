<template>
	<!-- 遮罩层 -->
	<div v-if="visible" class="modal-overlay" @click="handleClose">
		<div class="modal-container" @click.stop>
			<!-- 弹窗头部 -->
			<div class="modal-header">
				<h3>选择组件点位</h3>
				<button class="btn-close" @click="handleClose">✕</button>
			</div>
			
			<!-- 弹窗内容 -->
			<div class="point-selector">
				<!-- 点位列表 -->
				<div class="point-list-panel">
					<div class="panel-header">
						<h4>点位列表</h4>
						<span class="point-count">{{ componentPoints.length }}</span>
					</div>
					<div class="search-box">
						<input 
							v-model="pointSearchQuery" 
							type="text" 
							placeholder="搜索点位..."
							class="search-input"
						/>
					</div>
					<div class="point-list">
						<div v-if="filteredPoints.length === 0" class="empty-hint">
							暂无点位
						</div>
						<div
							v-else
							v-for="point in filteredPoints"
							:key="point.id"
							:class="['point-item', { 
								active: selectedPointId === point.id
							}]"
							@click="selectPoint(point)"
						>
							<div class="point-info">
								<div class="point-name">
									{{ point.name }}
									<span v-if="point.required" class="required-badge">必需</span>
								</div>
								<div class="point-meta">
									<span class="point-code">{{ point.id }}</span>
									<span v-if="point.unit" class="point-unit">{{ point.unit }}</span>
									<span class="point-type">{{ getDataTypeLabel(point.dataType) }}</span>
								</div>
								<div v-if="point.description" class="point-description">
									{{ point.description }}
								</div>
								<div v-if="point.range" class="point-range">
									范围: {{ point.range.min !== undefined ? point.range.min : '-' }} ~ {{ point.range.max !== undefined ? point.range.max : '-' }}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<!-- 弹窗底部 -->
			<div class="modal-footer">
				<button class="btn-cancel" @click="handleClose">取消</button>
				<button 
					class="btn-confirm" 
					:disabled="!selectedPointId"
					@click="handleConfirm"
				>
					确定
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ComponentPoint } from '../../../scada-components/types'

const props = defineProps<{
	visible: boolean              // 是否显示弹窗
	modelValue?: string           // 当前选中的点位ID
	componentPoints: ComponentPoint[]  // 组件预定义的点位列表
}>()

const emit = defineEmits<{
	'update:visible': [value: boolean]
	'update:modelValue': [value: string]
	'confirm': [pointId: string, point: ComponentPoint]  // 返回点位ID和点位对象
}>()

const selectedPointId = ref<string>('')  // 当前选中的点位ID
const pointSearchQuery = ref('')

// 初始化选中状态
watch(() => props.modelValue, (newValue) => {
	if (newValue) {
		selectedPointId.value = newValue
	}
}, { immediate: true })

// 过滤点位
const filteredPoints = computed(() => {
	if (!pointSearchQuery.value) return props.componentPoints || []
	
	const query = pointSearchQuery.value.toLowerCase()
	return (props.componentPoints || []).filter(point =>
		point.name?.toLowerCase().includes(query) ||
		point.id?.toLowerCase().includes(query) ||
		point.description?.toLowerCase().includes(query)
	)
})

// 选择点位
const selectPoint = (point: ComponentPoint) => {
	selectedPointId.value = point.id
}

// 关闭弹窗
const handleClose = () => {
	emit('update:visible', false)
}

// 确认选择
const handleConfirm = () => {
	if (!selectedPointId.value) return
	
	// 查找选中的点位
	const selected = props.componentPoints.find(p => p.id === selectedPointId.value)
	if (!selected) return
	
	emit('update:modelValue', selectedPointId.value)
	emit('confirm', selectedPointId.value, selected)
	emit('update:visible', false)
}

// 获取数据类型标签
const getDataTypeLabel = (type: string) => {
	const labels: Record<string, string> = {
		boolean: '布尔',
		number: '数值',
		string: '字符',
		json: 'JSON'
	}
	return labels[type] || type
}
</script>

<style scoped>
/* 遮罩层 */
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

/* 弹窗容器 */
.modal-container {
	width: 500px;
	max-width: 90vw;
	max-height: 85vh;
	background: #0f172a;
	border-radius: 8px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	display: flex;
	flex-direction: column;
	animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* 弹窗头部 */
.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px 24px;
	border-bottom: 1px solid #334155;
}

.modal-header h3 {
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: #e2e8f0;
}

.btn-close {
	width: 32px;
	height: 32px;
	background: transparent;
	border: none;
	border-radius: 4px;
	color: #94a3b8;
	font-size: 20px;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;
}

.btn-close:hover {
	background: #1e293b;
	color: #e2e8f0;
}

/* 选择器主体 */
.point-selector {
	height: 500px;
	padding: 16px 24px;
	overflow: hidden;
}

/* 弹窗底部 */
.modal-footer {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding: 16px 24px;
	border-top: 1px solid #334155;
}

.btn-cancel,
.btn-confirm {
	padding: 8px 24px;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	border: none;
}

.btn-cancel {
	background: #1e293b;
	color: #e2e8f0;
}

.btn-cancel:hover {
	background: #334155;
}

.btn-confirm {
	background: #3b82f6;
	color: #fff;
}

.btn-confirm:hover {
	background: #2563eb;
}

.btn-confirm:disabled {
	background: #334155;
	color: #64748b;
	cursor: not-allowed;
}

/* 面板通用样式 */
.point-list-panel {
	display: flex;
	flex-direction: column;
	background: #1e293b;
	border: 1px solid #334155;
	border-radius: 6px;
	overflow: hidden;
	height: 100%;
}

.panel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	background: #334155;
	border-bottom: 1px solid #475569;
}

.panel-header h4 {
	margin: 0;
	font-size: 14px;
	font-weight: 600;
	color: #e2e8f0;
}

.point-count {
	font-size: 12px;
	color: #94a3b8;
	background: #1e293b;
	padding: 2px 8px;
	border-radius: 10px;
}

/* 搜索框 */
.search-box {
	padding: 12px 16px;
	border-bottom: 1px solid #334155;
}

.search-input {
	width: 100%;
	padding: 8px 12px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 13px;
	transition: all 0.2s;
}

.search-input:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input::placeholder {
	color: #64748b;
}

/* 列表容器 */
.point-list {
	flex: 1;
	overflow-y: auto;
	padding: 8px;
}

/* 点位项 */
.point-item {
	padding: 12px;
	margin-bottom: 4px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	cursor: pointer;
	transition: all 0.2s;
}

.point-item:hover {
	background: #1e293b;
	border-color: #3b82f6;
}

.point-item.active {
	background: rgba(59, 130, 246, 0.1);
	border-color: #3b82f6;
}

.point-item.disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.point-info {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.point-name {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 13px;
	font-weight: 500;
	color: #e2e8f0;
}

.required-badge {
	font-size: 10px;
	padding: 2px 6px;
	border-radius: 3px;
	background: rgba(239, 68, 68, 0.2);
	color: #f87171;
	font-weight: 400;
}

.point-meta {
	display: flex;
	gap: 12px;
	font-size: 11px;
	color: #94a3b8;
}

.point-code {
	font-family: monospace;
}

.point-unit {
	color: #3b82f6;
}

.point-type {
	background: #334155;
	padding: 2px 6px;
	border-radius: 3px;
}

.point-description {
	font-size: 11px;
	color: #94a3b8;
	line-height: 1.4;
}

.point-range {
	font-size: 11px;
	color: #94a3b8;
}

/* 空状态 */
.empty-hint {
	text-align: center;
	padding: 40px 20px;
	color: #64748b;
	font-size: 13px;
}

/* 滚动条样式 */
.point-list::-webkit-scrollbar {
	width: 6px;
}

.point-list::-webkit-scrollbar-track {
	background: #0f172a;
}

.point-list::-webkit-scrollbar-thumb {
	background: #334155;
	border-radius: 3px;
}

.point-list::-webkit-scrollbar-thumb:hover {
	background: #475569;
}
</style>
