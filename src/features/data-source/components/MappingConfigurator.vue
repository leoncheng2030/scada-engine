<template>
	<!-- 遮罩层 -->
	<div v-if="visible" class="modal-overlay" @click="handleClose">
		<div class="modal-container" @click.stop>
			<!-- 弹窗头部 -->
			<div class="modal-header">
				<h3>值映射配置</h3>
				<button class="btn-close" @click="handleClose">✕</button>
			</div>
			
			<!-- 弹窗内容 -->
			<div class="mapping-configurator">
				<!-- 值类型选择 -->
				<div class="config-item">
					<label>值类型 <span class="required">*</span></label>
					<select v-model="localMapping.valueType" @change="handleValueTypeChange">
						<option value="">请选择值类型</option>
						<option value="boolean">布尔型 (true/false)</option>
						<option value="number">数值型 (123, 45.6)</option>
						<option value="string">字符串型 ("abc")</option>
					</select>
					<div v-if="!localMapping.valueType" class="field-hint error">
						值类型为必填项
					</div>
					<div v-else class="field-hint">
						{{ getValueTypeHint(localMapping.valueType) }}
					</div>
				</div>
				
				<!-- 映射类型选择 -->
				<div class="config-item">
					<label>映射类型 <span class="required">*</span></label>
					<select v-model="localMapping.type" @change="handleTypeChange">
						<option value="">请选择映射类型</option>
						<option value="direct">直接映射（无转换）</option>
						<option value="boolean">布尔映射</option>
						<option value="range">范围映射</option>
						<option value="enum">枚举映射</option>
					</select>
					<div v-if="!localMapping.type" class="field-hint error">
						映射类型为必填项
					</div>
					<div v-else class="field-hint">
						{{ getMappingTypeHint(localMapping.type) }}
					</div>
				</div>

				<!-- 单位配置（仅数值型显示） -->
				<div v-if="localMapping.valueType === 'number'" class="config-item">
					<label>单位配置</label>
					<div class="unit-config">
						<label class="checkbox-label">
							<input 
								type="checkbox" 
								v-model="localMapping.keepOriginalUnit"
								@change="emitUpdate"
							/>
							保留点位原始单位
						</label>
						<div v-if="!localMapping.keepOriginalUnit" class="custom-unit">
							<input 
								v-model="localMapping.customUnit" 
								type="text" 
								placeholder="自定义单位，如: °C, MPa, %"
								@input="emitUpdate"
							/>
						</div>
					</div>
				</div>

				<!-- 布尔映射配置 -->
				<div v-if="localMapping.type === 'boolean'" class="mapping-details">
			<div class="config-item">
				<label>True 时的值</label>
				<input 
					v-model="localMapping.trueValue" 
					type="text" 
					placeholder="例如: 运行、#00ff00"
					@input="emitUpdate"
				/>
			</div>
			<div class="config-item">
				<label>False 时的值</label>
				<input 
					v-model="localMapping.falseValue" 
					type="text" 
					placeholder="例如: 停止、#ff0000"
					@input="emitUpdate"
				/>
			</div>
		</div>

		<!-- 范围映射配置 -->
		<div v-if="localMapping.type === 'range'" class="mapping-details">
			<div class="range-rules">
				<div 
					v-for="(rule, index) in localMapping.rangeRules" 
					:key="index"
					class="range-rule"
				>
					<input 
						v-model.number="rule.min" 
						type="number" 
						placeholder="最小值"
						@input="emitUpdate"
					/>
					<span class="range-separator">~</span>
					<input 
						v-model.number="rule.max" 
						type="number" 
						placeholder="最大值"
						@input="emitUpdate"
					/>
					<span class="range-arrow">→</span>
					<input 
						v-model="rule.value" 
						type="text" 
						placeholder="映射值"
						@input="emitUpdate"
					/>
					<button 
						class="btn-remove-rule" 
						@click="removeRangeRule(index)"
						title="删除规则"
					>
						✕
					</button>
				</div>
			</div>
			<button class="btn-add-rule" @click="addRangeRule">
				+ 添加范围规则
			</button>
		</div>

		<!-- 枚举映射配置 -->
		<div v-if="localMapping.type === 'enum'" class="mapping-details">
			<div class="enum-mappings">
				<div 
					v-for="(_, key, index) in localMapping.enumMappings" 
					:key="index"
					class="enum-mapping"
				>
					<input 
						:value="key"
						type="text" 
						placeholder="原始值"
						@input="updateEnumKey($event, key)"
					/>
					<span class="enum-arrow">→</span>
					<input 
						v-model="localMapping.enumMappings![key]" 
						type="text" 
						placeholder="映射值"
						@input="emitUpdate"
					/>
					<button 
						class="btn-remove-rule" 
						@click="removeEnumMapping(key)"
						title="删除映射"
					>
						✕
					</button>
				</div>
			</div>
			<button class="btn-add-rule" @click="addEnumMapping">
				+ 添加枚举映射
			</button>
		</div>

		<!-- 映射预览 -->
		<div v-if="localMapping.type !== 'direct'" class="mapping-preview">
			<label>映射预览</label>
			<div class="preview-content">
				<template v-if="localMapping.type === 'boolean'">
					<div class="preview-item">
						<span class="preview-input">true</span>
						<span class="preview-arrow">→</span>
						<span class="preview-output">{{ localMapping.trueValue || 'true' }}</span>
					</div>
					<div class="preview-item">
						<span class="preview-input">false</span>
						<span class="preview-arrow">→</span>
						<span class="preview-output">{{ localMapping.falseValue || 'false' }}</span>
					</div>
				</template>
				<template v-else-if="localMapping.type === 'range'">
					<div 
						v-for="(rule, index) in localMapping.rangeRules" 
						:key="index"
						class="preview-item"
					>
						<span class="preview-input">[{{ rule.min }} ~ {{ rule.max }}]</span>
						<span class="preview-arrow">→</span>
						<span class="preview-output">{{ rule.value }}</span>
					</div>
				</template>
				<template v-else-if="localMapping.type === 'enum'">
					<div 
						v-for="(value, key) in localMapping.enumMappings" 
						:key="key"
						class="preview-item"
					>
						<span class="preview-input">{{ key }}</span>
						<span class="preview-arrow">→</span>
						<span class="preview-output">{{ value }}</span>
					</div>
				</template>
			</div>
		</div>
	</div>
			<!-- 弹窗底部 -->
			<div class="modal-footer">
				<button class="btn-cancel" @click="handleClose">取消</button>
				<button class="btn-confirm" @click="handleConfirm">确定</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { MappingType, ValueType, type MappingConfig } from '../../../shared/types/binding'
	
const props = defineProps<{
	visible: boolean
	modelValue?: MappingConfig
}>()

const emit = defineEmits<{
	'update:visible': [value: boolean]
	'update:modelValue': [value: MappingConfig]
	'confirm': [value: MappingConfig]
}>()

// 本地映射配置
const localMapping = ref<MappingConfig>(props.modelValue || {
	type: '' as any,  // 默认未选择，强制用户选择
	valueType: '' as any  // 默认未选择，强制用户选择
})

// 监听外部变化
watch(() => props.modelValue, (newVal) => {
	if (newVal) {
		localMapping.value = { ...newVal }
	}
}, { deep: true })

// 值类型变化
const handleValueTypeChange = () => {
	// 根据值类型智能推荐映射类型（仅在未选择时）
	if (!localMapping.value.type) {
		if (localMapping.value.valueType === ValueType.BOOLEAN) {
			localMapping.value.type = MappingType.BOOLEAN
		} else if (localMapping.value.valueType === ValueType.NUMBER) {
			localMapping.value.type = MappingType.RANGE
		} else {
			localMapping.value.type = MappingType.DIRECT
		}
	}
	
	// 非数值型时清除单位配置
	if (localMapping.value.valueType !== ValueType.NUMBER) {
		delete localMapping.value.keepOriginalUnit
		delete localMapping.value.customUnit
	}
	
	emitUpdate()
}

// 获取值类型提示
const getValueTypeHint = (type: string) => {
	const hints: Record<string, string> = {
		boolean: '适用于开关状态、是否判断等场景',
		number: '适用于温度、压力、流量等数值型数据',
		string: '适用于文本、状态码等字符型数据'
	}
	return hints[type] || ''
}

// 获取映射类型提示
const getMappingTypeHint = (type: string) => {
	const hints: Record<string, string> = {
		direct: '不做任何转换，直接使用原始值',
		boolean: '根据 true/false 转换为不同的值',
		range: '根据数值范围转换为对应值',
		enum: '根据枚举键值对转换'
	}
	return hints[type] || ''
}
const handleTypeChange = () => {
	// 清空其他类型的配置，但保留valueType
	const currentValueType = localMapping.value.valueType
	localMapping.value = {
		type: localMapping.value.type,
		valueType: currentValueType
	}
	
	// 初始化默认值
	if (localMapping.value.type === MappingType.RANGE) {
		localMapping.value.rangeRules = []
	} else if (localMapping.value.type === MappingType.ENUM) {
		localMapping.value.enumMappings = {}
	}
	
	emitUpdate()
}

// 添加范围规则
const addRangeRule = () => {
	if (!localMapping.value.rangeRules) {
		localMapping.value.rangeRules = []
	}
	localMapping.value.rangeRules.push({
		min: 0,
		max: 100,
		value: ''
	})
	emitUpdate()
}

// 删除范围规则
const removeRangeRule = (index: number) => {
	localMapping.value.rangeRules?.splice(index, 1)
	emitUpdate()
}

// 添加枚举映射
const addEnumMapping = () => {
	if (!localMapping.value.enumMappings) {
		localMapping.value.enumMappings = {}
	}
	const newKey = `key_${Object.keys(localMapping.value.enumMappings).length + 1}`
	localMapping.value.enumMappings[newKey] = ''
	emitUpdate()
}

// 删除枚举映射
const removeEnumMapping = (key: string) => {
	if (localMapping.value.enumMappings) {
		delete localMapping.value.enumMappings[key]
		emitUpdate()
	}
}

// 更新枚举键
const updateEnumKey = (event: Event, oldKey: string) => {
	const newKey = (event.target as HTMLInputElement).value
	if (!localMapping.value.enumMappings || newKey === oldKey) return
	
	const value = localMapping.value.enumMappings[oldKey]
	delete localMapping.value.enumMappings[oldKey]
	localMapping.value.enumMappings[newKey] = value
	emitUpdate()
}

// 触发更新
const emitUpdate = () => {
	// 弹窗模式下不立即触发更新，等点击确定时再更新
}

// 关闭弹窗
const handleClose = () => {
	emit('update:visible', false)
}

// 确认配置
const handleConfirm = () => {
	// 校验值类型必填
	if (!localMapping.value.valueType) {
		alert('请选择值类型！')
		return
	}
	
	// 校验映射类型必填
	if (!localMapping.value.type) {
		alert('请选择映射类型！')
		return
	}
	
	emit('update:modelValue', { ...localMapping.value })
	emit('confirm', { ...localMapping.value })
	emit('update:visible', false)
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
	width: 600px;
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

.mapping-configurator {
	max-height: 60vh;
	overflow-y: auto;
	padding: 20px 24px;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.config-item {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.config-item label {
	font-size: 12px;
	color: #cbd5e1;
	font-weight: 500;
}

.required {
	color: #ef4444;
	margin-left: 2px;
}

.field-hint {
	font-size: 11px;
	color: #64748b;
	margin-top: 4px;
	line-height: 1.4;
}

.field-hint.error {
	color: #ef4444;
}

.config-item select,
.config-item input {
	width: 100%;
	padding: 8px 12px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 13px;
	transition: all 0.2s;
}

.config-item select:focus,
.config-item input:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 单位配置 */
.unit-config {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.checkbox-label {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 13px;
	color: #cbd5e1;
	cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
	width: auto;
	cursor: pointer;
}

.custom-unit {
	margin-left: 24px;
}

.custom-unit input {
	width: 100%;
	padding: 8px 12px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 13px;
	transition: all 0.2s;
}

.custom-unit input:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 映射详情 */
.mapping-details {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 12px;
	background: #0f172a;
	border-radius: 4px;
}

/* 范围规则 */
.range-rules,
.enum-mappings {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.range-rule,
.enum-mapping {
	display: flex;
	align-items: center;
	gap: 8px;
}

.range-rule input,
.enum-mapping input {
	flex: 1;
	padding: 6px 10px;
	background: #1e293b;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 12px;
}

.range-rule input:first-child,
.range-rule input:nth-child(3) {
	max-width: 80px;
}

.range-separator,
.range-arrow,
.enum-arrow {
	color: #64748b;
	font-size: 14px;
	flex-shrink: 0;
}

.btn-remove-rule {
	width: 24px;
	height: 24px;
	background: transparent;
	border: 1px solid #475569;
	border-radius: 4px;
	color: #94a3b8;
	cursor: pointer;
	font-size: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
	flex-shrink: 0;
}

.btn-remove-rule:hover {
	background: #ef4444;
	border-color: #ef4444;
	color: #fff;
}

.btn-add-rule {
	padding: 8px 16px;
	background: #334155;
	border: 1px dashed #475569;
	border-radius: 4px;
	color: #94a3b8;
	font-size: 12px;
	cursor: pointer;
	transition: all 0.2s;
}

.btn-add-rule:hover {
	background: #3b82f6;
	border-color: #3b82f6;
	color: #fff;
	border-style: solid;
}

/* 映射预览 */
.mapping-preview {
	padding: 12px;
	background: #0f172a;
	border-radius: 4px;
}

.mapping-preview label {
	display: block;
	font-size: 12px;
	color: #94a3b8;
	margin-bottom: 8px;
}

.preview-content {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.preview-item {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 10px;
	background: #1e293b;
	border-radius: 4px;
	font-size: 12px;
}

.preview-input {
	color: #94a3b8;
	font-family: monospace;
}

.preview-arrow {
	color: #64748b;
	font-size: 12px;
}

.preview-output {
	color: #3b82f6;
	font-weight: 500;
}

/* 滚动条样式 */
.mapping-configurator::-webkit-scrollbar {
	width: 6px;
}

.mapping-configurator::-webkit-scrollbar-track {
	background: #0f172a;
}

.mapping-configurator::-webkit-scrollbar-thumb {
	background: #334155;
	border-radius: 3px;
}

.mapping-configurator::-webkit-scrollbar-thumb:hover {
	background: #475569;
}
</style>
