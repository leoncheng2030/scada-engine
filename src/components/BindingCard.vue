<template>
	<!-- 表格行样式 -->
	<div class="binding-row">
		<!-- 点位列 - 两行显示 -->
		<div class="binding-col-point" @click="showSelector = true">
			<div v-if="selectedPointInfo" class="cell-content-vertical">
				<span class="point-name">{{ selectedPointInfo.pointName }}</span>
				<span class="point-id">{{ selectedPointInfo.pointId }}</span>
			</div>
			<span v-else class="cell-placeholder">选择点位</span>
		</div>
		
		<!-- 属性列 -->
		<div class="binding-col-property">
			<select 
				class="table-select" 
				:value="binding.targetProperty || ''" 
				@change="$emit('update-field', 'targetProperty', $event)"
			>
				<option value="">选择属性</option>
				<option v-for="prop in nodeProperties" :key="prop.key" :value="prop.key">
					{{ prop.label }}
				</option>
			</select>
		</div>
		
		<!-- 映射列 -->
		<div class="binding-col-mapping" @click="showMappingConfig = true">
			<span v-if="localMapping.type !== 'direct'" class="mapping-label">
				{{ getMappingTypeLabel(localMapping.type) }}
			</span>
			<span v-else class="cell-placeholder">直接映射</span>
		</div>
		
		<!-- 操作列 -->
		<div class="binding-col-actions">
			<button class="btn-delete" @click="$emit('remove')" title="删除">🗑</button>
		</div>
		
		<!-- 组件点位选择弹窗 -->
		<ComponentPointSelector
			v-model:visible="showSelector"
			v-model="pointIdValue"
			:component-points="componentPoints"
			@confirm="handlePointSelect"
		/>
		
		<!-- 映射配置弹窗 -->
		<MappingConfigurator 
			v-model:visible="showMappingConfig"
			v-model="localMapping"
			@confirm="handleMappingUpdate"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import ComponentPointSelector from './ComponentPointSelector.vue'
import MappingConfigurator from './MappingConfigurator.vue'
import type { ComponentPoint } from '../scada-components/types'
import { MappingType, ValueType, type BindingConfig, type MappingConfig } from '../types/binding'

interface NodeProperty {
	key: string
	label: string
	type: string
}

const props = defineProps<{
	binding: BindingConfig
	index: number
	isCollapsed: boolean
	nodeProperties: NodeProperty[]
	componentPoints: ComponentPoint[]  // 组件预定义的点位列表
}>()

const emit = defineEmits<{
	'toggle-collapse': []
	'remove': []
	'update-field': [field: string, event: Event]
}>()

// 绑定值（存储组件点位ID）
const pointIdValue = ref('')
const showSelector = ref(false)
const showMappingConfig = ref(false)
const localMapping = ref<MappingConfig>(props.binding.mapping || { 
	type: MappingType.DIRECT,
	valueType: ValueType.NUMBER
})

// 初始化时加载 pointId
if (props.binding.devicePointId) {
	pointIdValue.value = props.binding.devicePointId  // 直接使用点位ID
}

// 监听外部变化
watch(() => props.binding.devicePointId, (newVal) => {
	if (newVal) {
		pointIdValue.value = newVal  // 直接使用点位ID
	} else {
		pointIdValue.value = ''
	}
})

watch(() => props.binding.mapping, (newVal) => {
	if (newVal) {
		localMapping.value = newVal
	}
}, { deep: true })

// 解析选中的点位信息（用于显示）
const selectedPointInfo = computed(() => {
	if (!pointIdValue.value) return null
	
	// 从组件点位列表中查找
	const point = props.componentPoints.find(p => p.id === pointIdValue.value)
	if (!point) return null
	
	return {
		pointId: point.id,
		pointName: point.name,
		dataType: point.dataType,
		pointUnit: point.unit
	}
})

// 处理点位选择
const handlePointSelect = (pointId: string, point: ComponentPoint) => {
	// pointId 就是组件点位ID
	const event = new Event('change')
	Object.defineProperty(event, 'target', {
		value: { value: pointId },
		writable: false
	})
	emit('update-field', 'devicePointId', event)
	
	console.log('选择了组件点位:', {
		pointId,
		pointName: point.name,
		dataType: point.dataType
	})
}

// 处理映射配置更新
const handleMappingUpdate = (mapping: MappingConfig) => {
	const event = new Event('change')
	Object.defineProperty(event, 'target', {
		value: { value: mapping },
		writable: false
	})
	emit('update-field', 'mapping', event)
}

// 获取映射类型标签
const getMappingTypeLabel = (type: string) => {
	const labels: Record<string, string> = {
		direct: '直接映射',
		boolean: '布尔映射',
		range: '范围映射',
		enum: '枚举映射'
	}
	return labels[type] || type
}
</script>

<style scoped>
/* 表格行样式 */
.binding-row {
	display: flex;
	align-items: center;
	background: #0f172a;
	border-bottom: 1px solid #1e293b;
	transition: background 0.2s;
	min-height: 48px;
	padding: 4px 0;
}

.binding-row:hover {
	background: #1e293b;
}

/* 列宽度 */
.binding-col-point {
	flex: 1;
	min-width: 70px;
	padding: 4px 8px;
	cursor: pointer;
	transition: all 0.2s;
}

.binding-col-point:hover {
	background: rgba(59, 130, 246, 0.1);
}

.binding-col-property {
	flex: 1.5;
	min-width: 90px;
	padding: 4px 10px;
}

.binding-col-mapping {
	flex: 1.2;
	min-width: 80px;
	padding: 4px 8px;
	cursor: pointer;
	transition: all 0.2s;
}

.binding-col-mapping:hover {
	background: rgba(59, 130, 246, 0.1);
}

.binding-col-actions {
	width: 40px;
	flex-shrink: 0;
	text-align: center;
	padding: 4px;
}

/* 单元格内容 - 垂直布局 */
.cell-content-vertical {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.point-name {
	color: #e2e8f0;
	font-size: 11px;
	font-weight: 500;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.point-id {
	font-family: monospace;
	font-size: 9px;
	color: #64748b;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.cell-placeholder {
	color: #64748b;
	font-size: 11px;
}

.mapping-label {
	color: #e2e8f0;
	font-size: 11px;
	font-weight: 500;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

/* 下拉选择框 */
.table-select {
	width: 100%;
	padding: 4px 6px;
	background: transparent;
	border: 1px solid #334155;
	border-radius: 3px;
	color: #e2e8f0;
	font-size: 11px;
	transition: all 0.2s;
}

.table-select:hover {
	border-color: #3b82f6;
}

.table-select:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.table-select option {
	background: #0f172a;
	color: #e2e8f0;
}

/* 删除按钮 */
.btn-delete {
	width: 24px;
	height: 24px;
	background: transparent;
	border: 1px solid #475569;
	border-radius: 3px;
	color: #94a3b8;
	cursor: pointer;
	font-size: 14px;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto;
}

.btn-delete:hover {
	background: #ef4444;
	border-color: #ef4444;
	color: #fff;
}
</style>
