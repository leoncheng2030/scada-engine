<template>
	<div class="node-config">
		<div class="config-group">
			<label>图元选择</label>
			<div class="element-selector">
				<input 
					v-model="selectedElementName" 
					type="text" 
					placeholder="点击选择按钮从画布中选择图元"
					readonly
				/>
				<button class="btn-select" @click="selectElementFromCanvas">
					选择图元
				</button>
			</div>
		</div>
		<div class="config-group">
			<label>属性选择</label>
			<select v-model="config.propertyName" @change="handleUpdate" :disabled="!config.elementId">
				<option value="">请先选择图元</option>
				<option v-for="prop in availableProperties" :key="prop.key" :value="prop.key">
					{{ prop.label }}
				</option>
			</select>
		</div>
	</div>
	
	<!-- 图元选择器 -->
	<ElementSelector
		:visible="showSelector"
		:elements="canvasElements"
		@close="showSelector = false"
		@select="handleElementSelected"
	/>
</template>

<script setup lang="ts">
import { reactive, ref, computed, inject, onMounted } from 'vue'
import type { GetPropertyNodeConfig } from '../../types/node'
import ElementSelector from '../ElementSelector.vue'
import type { ElementInfo } from '../../types/element'
import type { canvasElementService as CanvasElementServiceType } from '../../services/canvasElementService'

interface Props {
	modelValue: Partial<GetPropertyNodeConfig>
}

interface Emits {
	(e: 'update:modelValue', value: Partial<GetPropertyNodeConfig>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const config = reactive<Partial<GetPropertyNodeConfig>>({
	elementId: props.modelValue.elementId || '',
	propertyName: props.modelValue.propertyName || ''
})

const selectedElementName = ref('')
const showSelector = ref(false)
const canvasElements = ref<ElementInfo[]>([])

// 注入画布元素服务
const canvasElementService = inject<typeof CanvasElementServiceType>('canvasElementService')

// 可用属性列表（根据选中的图元动态获取）
const availableProperties = computed(() => {
	if (!config.elementId) return []
	// 从选中的图元获取属性列表
	const element = canvasElements.value.find(el => el.id === config.elementId)
	return element?.properties || []
})

const handleUpdate = () => {
	emit('update:modelValue', { ...config })
}

// 从画布中选择图元
const selectElementFromCanvas = async () => {
	// 刷新画布图元列表
	if (canvasElementService) {
		canvasElements.value = await canvasElementService.getElements()
	}
	showSelector.value = true
}

// 处理图元选择
const handleElementSelected = (element: ElementInfo) => {
	config.elementId = element.id
	selectedElementName.value = element.name
	// 清空之前选择的属性
	config.propertyName = ''
	handleUpdate()
}

// 初始化
onMounted(async () => {
	// 从画布服务获取图元列表
	if (canvasElementService) {
		canvasElements.value = await canvasElementService.getElements()
	}
	
	// 如果已有 elementId，恢复 elementName
	if (config.elementId) {
		const element = canvasElements.value.find(el => el.id === config.elementId)
		if (element) {
			selectedElementName.value = element.name
		}
	}
})
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

.element-selector {
	display: flex;
	gap: 8px;
}

.element-selector input {
	flex: 1;
	padding: 8px 12px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 13px;
	cursor: not-allowed;
}

.btn-select {
	padding: 8px 16px;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 4px;
	font-size: 13px;
	cursor: pointer;
	transition: all 0.2s;
	white-space: nowrap;
}

.btn-select:hover {
	background: #2563eb;
}

.element-info {
	font-size: 12px;
	color: #10b981;
	margin-top: -4px;
}

.config-group input,
.config-group textarea,
.config-group select {
	padding: 8px 12px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 13px;
}

.config-group input:focus,
.config-group textarea:focus,
.config-group select:focus {
	outline: none;
	border-color: #3b82f6;
}
</style>
