<template>
	<div class="node-config">
		<div class="config-group">
			<label>数据来源节点</label>
			<select v-model="config.sourceNodeId" @change="handleUpdate">
				<option value="">请选择数据来源节点</option>
				<option value="prev">上一个节点</option>
			</select>
		</div>
		<div class="config-group">
			<label>数据类型</label>
			<select v-model="config.dataType" @change="handleDataTypeChange">
				<option value="boolean">布尔类型</option>
				<option value="number">数字类型</option>
				<option value="string">字符串类型</option>
				<option value="any">自定义</option>
			</select>
		</div>
		
		<!-- 分支配置区域 -->
		<div class="branches-section">
			<div class="section-header">
				<label>条件分支</label>
				<button class="btn-add" @click="addBranch">添加分支</button>
			</div>
			
			<div class="branch-list">
				<div 
					v-for="(branch, index) in config.branches" 
					:key="branch.id"
					class="branch-item"
				>
					<div class="branch-header">
						<span class="branch-number">分支 {{ index + 1 }}</span>
						<button 
							v-if="!branch.isDefault && config.branches && config.branches.length > 1"
							class="btn-remove" 
							@click="removeBranch(index)"
						>×</button>
					</div>
					
					<div v-if="!branch.isDefault" class="branch-config">
						<div class="config-row">
							<label>分支标签</label>
							<input 
								v-model="branch.label" 
								type="text" 
								placeholder="如: >10, =A, True"
								@input="handleUpdate"
							/>
						</div>
						<div v-if="config.dataType !== 'boolean'" class="config-row">
							<label>运算符</label>
							<select v-model="branch.operator" @change="handleUpdate">
								<option value="eq">等于 (==)</option>
								<option value="ne">不等于 (!=)</option>
								<option value="gt">大于 (>)</option>
								<option value="gte">大于等于 (>=)</option>
								<option value="lt">小于 (<)</option>
								<option value="lte">小于等于 (<=)</option>
								<option value="contains">包含</option>
								<option value="notContains">不包含</option>
							</select>
						</div>
						<div v-if="config.dataType !== 'boolean'" class="config-row">
							<label>比较值</label>
							<input 
								v-model="branch.value" 
								:type="config.dataType === 'number' ? 'number' : 'text'"
								placeholder="请输入比较值"
								@input="handleUpdate"
							/>
						</div>
					</div>
					
					<div v-else class="default-branch-label">
						默认分支（其他情况）
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { ConditionNodeConfig, ConditionBranch } from '../../types/node'

interface Props {
	modelValue: Partial<ConditionNodeConfig>
}

interface Emits {
	(e: 'update:modelValue', value: Partial<ConditionNodeConfig>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 生成分支ID
const generateBranchId = () => `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// 初始化配置
const initBranches = (): ConditionBranch[] => {
	if (props.modelValue.branches && props.modelValue.branches.length > 0) {
		return props.modelValue.branches
	}
	
	// 根据数据类型初始化默认分支
	const dataType = props.modelValue.dataType || 'boolean'
	
	if (dataType === 'boolean') {
		return [
			{ id: generateBranchId(), label: 'True', value: true },
			{ id: generateBranchId(), label: 'False', value: false, isDefault: true }
		]
	}
	
	return [
		{ id: generateBranchId(), label: '分支1', operator: 'eq', value: '' },
		{ id: generateBranchId(), label: '默认', isDefault: true }
	]
}

const config = reactive<Partial<ConditionNodeConfig>>({
	sourceNodeId: props.modelValue.sourceNodeId || 'prev',
	dataType: props.modelValue.dataType || 'boolean',
	branches: initBranches()
})

const handleUpdate = () => {
	emit('update:modelValue', { ...config })
}

// 数据类型变化时重置分支
const handleDataTypeChange = () => {
	if (config.dataType === 'boolean') {
		config.branches = [
			{ id: generateBranchId(), label: 'True', value: true },
			{ id: generateBranchId(), label: 'False', value: false, isDefault: true }
		]
	} else {
		config.branches = [
			{ id: generateBranchId(), label: '分支1', operator: 'eq', value: '' },
			{ id: generateBranchId(), label: '默认', isDefault: true }
		]
	}
	handleUpdate()
}

// 添加分支
const addBranch = () => {
	const newBranch: ConditionBranch = {
		id: generateBranchId(),
		label: `分支${config.branches!.length}`,
		operator: 'eq',
		value: ''
	}
	
	// 插入到默认分支之前
	const defaultIndex = config.branches!.findIndex(b => b.isDefault)
	if (defaultIndex > -1) {
		config.branches!.splice(defaultIndex, 0, newBranch)
	} else {
		config.branches!.push(newBranch)
	}
	
	handleUpdate()
}

// 删除分支
const removeBranch = (index: number) => {
	if (config.branches!.length > 2) { // 至少保留一个条件分支和一个默认分支
		config.branches!.splice(index, 1)
		handleUpdate()
	}
}
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

/* 分支配置区域 */
.branches-section {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.section-header label {
	font-size: 13px;
	color: #94a3b8;
	font-weight: 500;
}

.btn-add {
	padding: 4px 12px;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 4px;
	font-size: 12px;
	cursor: pointer;
	transition: all 0.2s;
}

.btn-add:hover {
	background: #2563eb;
}

.branch-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.branch-item {
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 6px;
	padding: 12px;
}

.branch-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.branch-number {
	font-size: 12px;
	color: #3b82f6;
	font-weight: 500;
}

.btn-remove {
	width: 20px;
	height: 20px;
	background: #ef4444;
	color: white;
	border: none;
	border-radius: 50%;
	font-size: 16px;
	line-height: 1;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;
}

.btn-remove:hover {
	background: #dc2626;
}

.branch-config {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.config-row {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.config-row label {
	font-size: 12px;
	color: #94a3b8;
}

.config-row input,
.config-row select {
	padding: 6px 10px;
	background: #1e293b;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 12px;
}

.config-row input:focus,
.config-row select:focus {
	outline: none;
	border-color: #3b82f6;
}

.default-branch-label {
	font-size: 12px;
	color: #94a3b8;
	text-align: center;
	padding: 8px;
	background: #1e293b;
	border-radius: 4px;
}
</style>
