<template>
	<div class="tab-pane">
		<!-- 基础信息 -->
		<div class="property-section">
			<h4>基础信息</h4>
			<div class="property-item-inline">
				<label>组件名称</label>
				<input 
					type="text" 
					:value="selectedNode.getData()?.componentName || ''"
					@input="$emit('update-component-name', $event)"
					placeholder="请输入组件名称"
				/>
			</div>
			<div class="property-item-inline">
				<label>ID</label>
				<input type="text" :value="selectedNode.id" disabled />
			</div>
			<div class="property-item-inline">
				<label>类型</label>
				<input type="text" :value="selectedNode.shape" disabled />
			</div>
		</div>

		<!-- 位置和尺寸 -->
		<div class="property-section">
			<h4>位置和尺寸</h4>
			<div class="property-row">
				<div class="property-item">
					<label>X</label>
					<input type="number" :value="nodePosition.x" @input="$emit('update-position', 'x', $event)" />
				</div>
				<div class="property-item">
					<label>Y</label>
					<input type="number" :value="nodePosition.y" @input="$emit('update-position', 'y', $event)" />
				</div>
			</div>
			<div class="property-row">
				<div class="property-item">
					<label>宽度</label>
					<input type="number" :value="nodeSize.width" @input="$emit('update-size', 'width', $event)" />
				</div>
				<div class="property-item">
					<label>高度</label>
					<input type="number" :value="nodeSize.height" @input="$emit('update-size', 'height', $event)" />
				</div>
			</div>
		</div>

		<!-- 样式 -->
		<div class="property-section">
			<h4>样式</h4>
			<div class="property-item-inline">
				<label>初始文本</label>
				<input 
					type="text" 
					:value="nodeAttrs?.text?.text || nodeAttrs?.label?.text || selectedNode.getProp('label') || ''" 
					@input="$emit('update-label', $event)" 
					placeholder="设置默认显示文本" 
				/>
			</div>
			<div class="property-item-inline">
				<label>填充颜色</label>
				<div class="color-input-wrapper">
					<input 
						type="color" 
						:value="normalizeColorValue(nodeAttrs?.body?.fill) || '#3b82f6'" 
						@input="$emit('update-fill', $event)" 
					/>
					<span class="color-value">{{ nodeAttrs?.body?.fill || '#3b82f6' }}</span>
				</div>
			</div>
			<div class="property-item-inline">
				<label>边框颜色</label>
				<div class="color-input-wrapper">
					<input 
						type="color" 
						:value="normalizeColorValue(nodeAttrs?.body?.stroke) || '#2563eb'" 
						@input="$emit('update-stroke', $event)" 
					/>
					<span class="color-value">{{ nodeAttrs?.body?.stroke || '#2563eb' }}</span>
				</div>
			</div>
			<div class="property-item-inline">
				<label>边框宽度</label>
				<input
					type="number"
					min="0"
					max="10"
					:value="nodeAttrs?.body?.strokeWidth || 2"
					@input="$emit('update-stroke-width', $event)"
				/>
			</div>
			<div class="property-item-inline">
				<label>透明度</label>
				<input
					type="number"
					min="0"
					max="1"
					step="0.1"
					:value="nodeAttrs?.body?.opacity !== undefined ? nodeAttrs.body.opacity : 1"
					@input="$emit('update-opacity', $event)"
				/>
			</div>
		</div>

		<!-- 动态属性 -->
		<div v-if="dynamicProps.length > 0" class="property-section">
			<h4>组件属性</h4>
			<div v-for="prop in dynamicProps" :key="prop.key" class="property-item-inline">
				<label>
					{{ prop.label }}
					<span v-if="prop.description" class="property-hint">{{ prop.description }}</span>
				</label>
				
				<!-- 文本输入 -->
				<input
					v-if="prop.type === 'text'"
					type="text"
					:value="getPropValue(prop)"
					@input="updateDynamicProp(prop, $event)"
					:placeholder="prop.defaultValue"
				/>
				
				<!-- 数字输入 -->
				<input
					v-else-if="prop.type === 'number'"
					type="number"
					:value="getPropValue(prop)"
					@input="updateDynamicProp(prop, $event)"
					:min="prop.min"
					:max="prop.max"
					:step="prop.step"
				/>
				
				<!-- 颜色选择 -->
				<div v-else-if="prop.type === 'color'" class="color-input-wrapper">
					<input
						type="color"
						:value="normalizeColorValue(getPropValue(prop))"
						@input="updateDynamicProp(prop, $event)"
					/>
					<span class="color-value">{{ getPropValue(prop) }}</span>
				</div>
				
				<!-- 布尔值选择 -->
				<div v-else-if="prop.type === 'boolean'" class="checkbox-wrapper">
					<input
						type="checkbox"
						:checked="getPropValue(prop)"
						@change="updateDynamicProp(prop, $event)"
					/>
					<span class="checkbox-label">{{ getPropValue(prop) ? '是' : '否' }}</span>
				</div>
				
				<!-- 下拉选择 -->
				<select
					v-else-if="prop.type === 'select'"
					:value="getPropValue(prop)"
					@change="updateDynamicProp(prop, $event)"
				>
					<option v-for="option in prop.options" :key="option.value" :value="option.value">
						{{ option.label }}
					</option>
				</select>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Node } from '@antv/x6'

interface NodePosition {
	x: number
	y: number
}

interface NodeSize {
	width: number
	height: number
}

const props = defineProps<{
	selectedNode: Node
	nodePosition: NodePosition
	nodeSize: NodeSize
	nodeAttrs: any
}>()

const emit = defineEmits<{
	'update-position': [axis: 'x' | 'y', event: Event]
	'update-size': [dimension: 'width' | 'height', event: Event]
	'update-label': [event: Event]
	'update-fill': [event: Event]
	'update-stroke': [event: Event]
	'update-stroke-width': [event: Event]
	'update-opacity': [event: Event]
	'update-component-name': [event: Event]
	'update-dynamic-prop': [path: string, value: any]
}>()

// 获取动态属性列表（从 data.props 中获取，过滤掉已在固定区域显示的）
const dynamicProps = computed(() => {
	if (!props.selectedNode?.data?.props) return []
	
	// 过滤掉已经在固定区域显示的属性
	const excludeKeys = ['label', 'fill', 'stroke', 'strokeWidth', 'opacity']
	
	return props.selectedNode.data.props.filter((prop: any) => 
		!excludeKeys.includes(prop.key)
	)
})

// 获取属性值
const getPropValue = (prop: any) => {
	if (!prop.path) return prop.defaultValue
	
	// 根据 path 获取值，例如 "data.animation.type"
	const pathParts = prop.path.split('.')
	let value: any = props.selectedNode
	
	for (const part of pathParts) {
		if (value && typeof value === 'object') {
			value = value[part]
		} else {
			return prop.defaultValue
		}
	}
	
	return value !== undefined ? value : prop.defaultValue
}

// 标准化颜色值（将 transparent 转换为有效的十六进制颜色）
const normalizeColorValue = (colorValue: any): string => {
	if (!colorValue || colorValue === 'transparent') {
		return '#000000' // input[type=color] 不支持 transparent，使用黑色作为占位
	}
	// 确保返回十六进制格式
	if (typeof colorValue === 'string' && colorValue.startsWith('#')) {
		return colorValue
	}
	return '#000000' // 其他无效格式也返回黑色
}

// 更新动态属性
const updateDynamicProp = (prop: any, event: Event) => {
	const target = event.target as HTMLInputElement | HTMLSelectElement
	let value: any
	
	// 根据类型解析值
	if (prop.type === 'number') {
		value = Number(target.value)
	} else if (prop.type === 'boolean') {
		value = (target as HTMLInputElement).checked
	} else if (prop.type === 'select') {
		// select 类型需要根据原始 options 中的类型来转换
		const selectedOption = prop.options?.find((opt: any) => String(opt.value) === target.value)
		value = selectedOption ? selectedOption.value : target.value
	} else {
		value = target.value
	}
	
	// 发送更新事件
	emit('update-dynamic-prop', prop.path, value)
}
</script>

<style scoped>
.tab-pane {
	animation: fadeIn 0.2s;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(-4px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.property-section {
	margin-bottom: 16px;
}

.property-section h4 {
	font-size: 12px;
	color: #94a3b8;
	margin-bottom: 8px;
	font-weight: 600;
}

.property-item {
	margin-bottom: 12px;
}

/* 单行显示样式 - label 和控件在同一行 */
.property-item-inline {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 8px;
}

/* 当内容是checkbox时，调整布局 */
.property-item-inline:has(.checkbox-wrapper) {
	justify-content: flex-start;
}

.property-item-inline label {
	flex-shrink: 0;
	width: 70px;
	font-size: 11px;
	color: #cbd5e1;
	margin-bottom: 0;
}

.property-item-inline input,
.property-item-inline select {
	flex: 1;
	min-width: 0;
	padding: 6px 10px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 12px;
	transition: all 0.2s;
}

/* checkbox-wrapper 不拉伸，只占据内容宽度 */
.property-item-inline .checkbox-wrapper {
	flex: 0 0 auto;
}

.property-item-inline input:focus,
.property-item-inline select:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.property-item-inline input:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.property-item-inline .color-input-wrapper {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 6px;
}

.property-item-inline .color-input-wrapper input[type="color"] {
	width: 40px;
	height: 28px;
	padding: 2px;
	border: 1px solid #334155;
	border-radius: 4px;
	background: #0f172a;
	cursor: pointer;
	transition: all 0.2s;
}

.property-item-inline .color-input-wrapper .color-value {
	flex: 1;
	min-width: 0;
	font-size: 11px;
	color: #94a3b8;
	font-family: monospace;
}

.property-item-inline .checkbox-wrapper {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 0;
}

.property-item label {
	display: block;
	font-size: 12px;
	color: #cbd5e1;
	margin-bottom: 6px;
}

.property-item input {
	width: 100%;
	padding: 8px 12px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 13px;
	transition: all 0.2s;
}

.property-item input:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.property-item input:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.property-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}

/* 颜色选择器样式 */
.color-input-wrapper {
	display: flex;
	align-items: center;
	gap: 8px;
}

.color-input-wrapper input[type="color"] {
	width: 50px;
	height: 36px;
	padding: 2px;
	border: 1px solid #334155;
	border-radius: 4px;
	background: #0f172a;
	cursor: pointer;
	transition: all 0.2s;
}

.color-input-wrapper input[type="color"]:hover {
	border-color: #3b82f6;
}

.color-input-wrapper input[type="color"]::-webkit-color-swatch-wrapper {
	padding: 0;
}

.color-input-wrapper input[type="color"]::-webkit-color-swatch {
	border: none;
	border-radius: 2px;
}

.color-value {
	flex: 1;
	font-size: 12px;
	color: #94a3b8;
	font-family: monospace;
}

/* 复选框样式 */
.checkbox-wrapper {
	display: inline-flex;
	align-items: center;
	gap: 6px;
}

.checkbox-wrapper input[type="checkbox"] {
	width: 16px;
	height: 16px;
	cursor: pointer;
	accent-color: #3b82f6;
	pointer-events: auto !important;
	-webkit-appearance: auto !important;
	-moz-appearance: auto !important;
	appearance: auto !important;
	opacity: 1 !important;
	z-index: 1 !important;
	position: relative !important;
	flex-shrink: 0;
}

.checkbox-label {
	font-size: 12px;
	color: #cbd5e1;
	white-space: nowrap;
}

/* 下拉选择框样式 */
select {
	width: 100%;
	padding: 8px 12px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 13px;
	cursor: pointer;
	transition: all 0.2s;
}

select:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

select option {
	background: #0f172a;
	color: #e2e8f0;
}

/* 属性提示样式 */
.property-hint {
	display: block;
	font-size: 11px;
	color: #64748b;
	margin-top: 2px;
	font-weight: normal;
}
</style>
