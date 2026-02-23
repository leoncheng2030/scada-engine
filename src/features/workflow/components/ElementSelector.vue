<template>
	<div v-if="visible" class="element-selector-overlay" @click="handleClose">
		<div class="element-selector-dialog" @click.stop>
			<div class="dialog-header">
				<h3>选择图元</h3>
				<button class="btn-close" @click="handleClose">×</button>
			</div>
			
			<div class="dialog-body">
				<!-- 搜索框 -->
				<div class="search-box">
					<input 
						v-model="searchText" 
						type="text" 
						placeholder="搜索图元名称或ID..."
					/>
				</div>
				
				<!-- 图元列表 -->
				<div class="element-list">
					<div 
						v-for="element in filteredElements" 
						:key="element.id"
						class="element-item"
						:class="{ active: selectedElement?.id === element.id }"
						@click="selectElement(element)"
					>
						<div class="element-icon">
							{{ element.icon }}
						</div>
						<div class="element-info">
							<div class="element-name">{{ element.name }}</div>
							<div class="element-type">{{ element.type }}</div>
						</div>
						<div v-if="selectedElement?.id === element.id" class="element-check">
							✓
						</div>
					</div>
					
					<div v-if="filteredElements.length === 0" class="empty-state">
						<p>未找到图元</p>
						<p class="empty-hint">请尝试其他搜索关键词</p>
					</div>
				</div>
			</div>
			
			<div class="dialog-footer">
				<button class="btn-secondary" @click="handleClose">取消</button>
				<button class="btn-primary" :disabled="!selectedElement" @click="handleConfirm">
					确定
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ElementInfo } from '../types/element'

interface Props {
	visible: boolean
	elements?: ElementInfo[]
}

interface Emits {
	(e: 'close'): void
	(e: 'select', element: ElementInfo): void
}

const props = withDefaults(defineProps<Props>(), {
	elements: () => []
})

const emit = defineEmits<Emits>()

const searchText = ref('')
const selectedElement = ref<ElementInfo | null>(null)

// 过滤图元列表
const filteredElements = computed(() => {
	if (!searchText.value) return props.elements
	
	const keyword = searchText.value.toLowerCase()
	return props.elements.filter(element => 
		element.name.toLowerCase().includes(keyword) ||
		element.id.toLowerCase().includes(keyword) ||
		element.type.toLowerCase().includes(keyword)
	)
})

const selectElement = (element: ElementInfo) => {
	selectedElement.value = element
}

const handleClose = () => {
	searchText.value = ''
	selectedElement.value = null
	emit('close')
}

const handleConfirm = () => {
	if (selectedElement.value) {
		emit('select', selectedElement.value)
		handleClose()
	}
}
</script>

<style scoped>
.element-selector-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2000;
}

.element-selector-dialog {
	width: 600px;
	max-height: 80vh;
	background: #1e293b;
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.dialog-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 20px;
	border-bottom: 1px solid #334155;
}

.dialog-header h3 {
	margin: 0;
	font-size: 16px;
	font-weight: 600;
	color: #e2e8f0;
}

.btn-close {
	width: 28px;
	height: 28px;
	background: transparent;
	border: none;
	color: #94a3b8;
	font-size: 24px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;
	transition: all 0.2s;
}

.btn-close:hover {
	background: #334155;
	color: #e2e8f0;
}

.dialog-body {
	flex: 1;
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	overflow: hidden;
}

.search-box input {
	width: 100%;
	padding: 10px 14px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 6px;
	color: #e2e8f0;
	font-size: 14px;
}

.search-box input:focus {
	outline: none;
	border-color: #3b82f6;
}

.element-list {
	flex: 1;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.element-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	background: #0f172a;
	border: 2px solid #334155;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s;
}

.element-item:hover {
	border-color: #3b82f6;
	background: #1e293b;
}

.element-item.active {
	border-color: #3b82f6;
	background: rgba(59, 130, 246, 0.1);
}

.element-icon {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(59, 130, 246, 0.1);
	border-radius: 6px;
	font-size: 20px;
	flex-shrink: 0;
}

.element-info {
	flex: 1;
}

.element-name {
	font-size: 14px;
	font-weight: 500;
	color: #e2e8f0;
	margin-bottom: 4px;
}

.element-type {
	font-size: 12px;
	color: #94a3b8;
}

.element-check {
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #3b82f6;
	border-radius: 50%;
	color: white;
	font-size: 14px;
	font-weight: bold;
}

.empty-state {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	color: #64748b;
	padding: 40px 20px;
}

.empty-state p {
	margin: 0;
	font-size: 14px;
}

.empty-hint {
	margin-top: 8px;
	font-size: 12px;
	color: #475569;
}

.dialog-footer {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding: 16px 20px;
	border-top: 1px solid #334155;
}

.btn-secondary,
.btn-primary {
	padding: 8px 20px;
	border: none;
	border-radius: 6px;
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

.btn-primary:disabled {
	background: #475569;
	cursor: not-allowed;
	opacity: 0.5;
}
</style>
