<template>
	<div class="dialog-overlay" @click.self="$emit('close')">
		<div class="dialog-content">
			<div class="dialog-header">
				<h3>事件属性更改配置</h3>
				<button class="btn-close" @click="$emit('close')">×</button>
			</div>
			
			<div class="dialog-body">
				<!-- 新增一组按钮 -->
				<button class="btn-add-group" @click="$emit('add-group')">新增一组</button>
				
				<!-- 属性配置列表 -->
				<div v-for="(group, index) in attributeGroups" :key="index" class="attribute-group">
					<div class="group-row">
						<!-- 目标属性 -->
						<div class="group-field">
							<label>目标属性</label>
							<select :value="group.property" @change="updateGroup(index, 'property', $event)">
								<option value="">选择目标属性</option>
								<option v-for="prop in nodeProperties" :key="prop.key" :value="prop.key">
									{{ prop.label }}
								</option>
							</select>
						</div>
						
						<!-- 期望值 -->
						<div class="group-field group-field-value">
							<label>期望值</label>
							
							<!-- 文本类型 -->
							<input
								v-if="!group.property || getPropertyType(group.property) === 'text'"
								:value="group.value"
								type="text"
								@input="updateGroup(index, 'value', $event)"
								placeholder="输入值"
							/>
							
							<!-- 数字类型 -->
							<input
								v-else-if="getPropertyType(group.property) === 'number'"
								:value="group.value"
								type="number"
								@input="updateGroup(index, 'value', $event)"
								placeholder="输入数字"
							/>
							
							<!-- 颜色类型 -->
							<div v-else-if="getPropertyType(group.property) === 'color'" class="color-input-wrapper">
								<input
									:value="group.value"
									type="color"
									@input="updateGroup(index, 'value', $event)"
								/>
								<span class="color-value">{{ group.value || '#000000' }}</span>
							</div>
							
							<!-- 布尔类型 -->
							<select
								v-else-if="getPropertyType(group.property) === 'boolean'"
								:value="group.value"
								@change="updateGroup(index, 'value', $event)"
							>
								<option value="true">是</option>
								<option value="false">否</option>
							</select>
						</div>
						
						<!-- 删除按钮 -->
						<button class="btn-delete-group" @click="$emit('remove-group', index)" title="删除">
							<Trash2 class="icon-svg" />
						</button>
					</div>
				</div>
				
				<div v-if="attributeGroups.length === 0" class="empty-hint">
					请点击"新增一组"按钮添加属性配置
				</div>
			</div>
			
			<div class="dialog-footer">
				<button class="btn-cancel" @click="$emit('close')">取消</button>
				<button class="btn-confirm" @click="handleSave">确定</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'

interface AttributeGroup {
	target: string
	property: string
	value: string
}

interface NodeProperty {
	key: string
	label: string
	type: string
}

const props = defineProps<{
	attributeGroups: AttributeGroup[]
	nodeProperties: NodeProperty[]
}>()

const emit = defineEmits<{
	'close': []
	'save': []
	'add-group': []
	'remove-group': [index: number]
	'update-group': [index: number, field: keyof AttributeGroup, value: string]
}>()

const getPropertyType = (key: string): string => {
	const prop = props.nodeProperties.find(p => p.key === key)
	return prop?.type || 'text'
}

const updateGroup = (index: number, field: keyof AttributeGroup, event: Event) => {
	const value = (event.target as HTMLInputElement | HTMLSelectElement).value
	emit('update-group', index, field, value)
}

const handleSave = () => {
	// 验证每组都有属性
	for (const group of props.attributeGroups) {
		if (!group.property) {
			alert('请为每组配置选择目标属性')
			return
		}
	}
	emit('save')
}
</script>

<style scoped>
/* 弹窗样式 */
.dialog-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	animation: fadeIn 0.2s;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

.dialog-content {
	background: #1e293b;
	border-radius: 8px;
	width: 90%;
	max-width: 800px;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
	animation: slideUp 0.3s;
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

.dialog-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px 24px;
	border-bottom: 1px solid #334155;
}

.dialog-header h3 {
	font-size: 18px;
	font-weight: 600;
	color: #e2e8f0;
	margin: 0;
}

.btn-close {
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	border: none;
	color: #94a3b8;
	font-size: 24px;
	cursor: pointer;
	border-radius: 4px;
	transition: all 0.2s;
}

.btn-close:hover {
	background: #334155;
	color: #e2e8f0;
}

.dialog-body {
	padding: 24px;
	max-height: 60vh;
	overflow-y: auto;
}

.btn-add-group {
	width: 100%;
	padding: 10px 16px;
	background: #1e293b;
	border: 1px dashed #475569;
	border-radius: 4px;
	color: #94a3b8;
	cursor: pointer;
	font-size: 14px;
	transition: all 0.2s;
	margin-bottom: 16px;
}

.btn-add-group:hover {
	background: #334155;
	border-color: #3b82f6;
	color: #e2e8f0;
}

.attribute-group {
	margin-bottom: 12px;
	padding: 16px;
	background: #0f172a;
	border-radius: 4px;
	border: 1px solid #334155;
}

.group-row {
	display: grid;
	grid-template-columns: 1.5fr 2fr auto;
	gap: 12px;
	align-items: end;
}

.group-field {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.group-field label {
	font-size: 12px;
	color: #94a3b8;
	font-weight: 500;
}

.group-field input,
.group-field select {
	width: 100%;
	padding: 8px 12px;
	background: #1e293b;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 13px;
	transition: all 0.2s;
}

.group-field input:focus,
.group-field select:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.group-field-value .color-input-wrapper {
	display: flex;
	align-items: center;
	gap: 8px;
}

.group-field-value .color-input-wrapper input[type="color"] {
	width: 60px;
	height: 36px;
}

.color-value {
	flex: 1;
	font-size: 12px;
	color: #94a3b8;
	font-family: monospace;
}

.btn-delete-group {
	width: 36px;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	border: 1px solid #475569;
	border-radius: 4px;
	color: #94a3b8;
	cursor: pointer;
	font-size: 18px;
	transition: all 0.2s;
}

.btn-delete-group:hover {
	background: #ef4444;
	border-color: #ef4444;
	color: #fff;
}

.empty-hint {
	font-size: 12px;
	color: #64748b;
	text-align: center;
	padding: 16px;
	background: #0f172a;
	border-radius: 4px;
	margin-bottom: 12px;
}

.dialog-footer {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding: 16px 24px;
	border-top: 1px solid #334155;
}

.btn-cancel,
.btn-confirm {
	padding: 8px 20px;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
}

.btn-cancel {
	background: transparent;
	border: 1px solid #475569;
	color: #cbd5e1;
}

.btn-cancel:hover {
	background: #334155;
}

.btn-confirm {
	background: #3b82f6;
	border: 1px solid #3b82f6;
	color: #fff;
}

.btn-confirm:hover {
	background: #2563eb;
	border-color: #2563eb;
}
</style>
