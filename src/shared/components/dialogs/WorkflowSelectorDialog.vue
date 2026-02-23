<template>
	<div class="dialog-overlay" @click.self="$emit('close')">
		<div class="dialog-container">
			<div class="dialog-header">
				<h3>选择流程</h3>
				<button class="btn-close" @click="$emit('close')">×</button>
			</div>

			<div class="dialog-body">
				<div v-if="workflows.length === 0" class="empty-state">
					<p>暂无已保存的流程</p>
					<p class="hint">请先在流程编辑器中创建并保存流程</p>
				</div>

				<div v-else class="workflow-list">
					<div
						v-for="workflow in workflows"
						:key="workflow.id"
						class="workflow-item"
						:class="{ selected: selectedWorkflow?.id === workflow.id }"
						@click="selectWorkflowItem(workflow)"
					>
						<div class="workflow-info">
							<div class="workflow-name">{{ workflow.name }}</div>
							<div class="workflow-meta">
								<span class="workflow-id">ID: {{ workflow.id }}</span>
								<span class="workflow-date">{{ formatDate(workflow.createdAt) }}</span>
							</div>
						</div>
						<div class="workflow-actions">
							<button
								class="btn-icon"
								@click.stop="previewWorkflow(workflow)"
								title="预览"
							>
								<Eye class="icon-svg" />
							</button>
						</div>
					</div>
				</div>
			</div>

			<div class="dialog-footer">
				<button class="btn-secondary" @click="$emit('close')">取消</button>
				<button
					class="btn-primary"
					:disabled="!selectedWorkflow"
					@click="handleConfirm"
				>
					确定
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Eye } from 'lucide-vue-next'

interface Workflow {
	id: string
	name: string
	data: any
	createdAt: number
	updatedAt?: number
}

interface Emits {
	(e: 'close'): void
	(e: 'select', workflow: Workflow): void
}

const emit = defineEmits<Emits>()

const workflows = ref<Workflow[]>([])
const selectedWorkflow = ref<Workflow | null>(null)

// 加载已保存的流程列表
const loadWorkflows = () => {
	try {
		const stored = localStorage.getItem('saved-workflows')
		if (stored) {
			workflows.value = JSON.parse(stored)
		}
	} catch (error) {
		console.error('加载流程列表失败:', error)
	}
}

// 选择流程
const selectWorkflowItem = (workflow: Workflow) => {
	selectedWorkflow.value = workflow
}

// 预览流程
const previewWorkflow = (workflow: Workflow) => {
	// TODO: 实现流程预览功能
}

// 确认选择
const handleConfirm = () => {
	if (selectedWorkflow.value) {
		emit('select', selectedWorkflow.value)
	}
}

// 格式化日期
const formatDate = (timestamp: number) => {
	const date = new Date(timestamp)
	return date.toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	})
}

onMounted(() => {
	loadWorkflows()
})
</script>

<style scoped>
.dialog-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
}

.dialog-container {
	width: 600px;
	max-height: 80vh;
	background: #1e293b;
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.dialog-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px 24px;
	border-bottom: 1px solid #334155;
}

.dialog-header h3 {
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
	font-size: 24px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
}

.btn-close:hover {
	background: #334155;
	color: #e2e8f0;
}

.dialog-body {
	flex: 1;
	overflow-y: auto;
	padding: 20px 24px;
}

.empty-state {
	text-align: center;
	padding: 40px 20px;
	color: #64748b;
}

.empty-state p {
	margin: 8px 0;
	font-size: 14px;
}

.empty-state .hint {
	font-size: 12px;
	color: #475569;
}

.workflow-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.workflow-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px;
	background: #0f172a;
	border: 2px solid #334155;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s;
}

.workflow-item:hover {
	border-color: #3b82f6;
	background: #1e293b;
}

.workflow-item.selected {
	border-color: #10b981;
	background: rgba(16, 185, 129, 0.1);
}

.workflow-info {
	flex: 1;
}

.workflow-name {
	font-size: 15px;
	font-weight: 500;
	color: #e2e8f0;
	margin-bottom: 6px;
}

.workflow-meta {
	display: flex;
	gap: 12px;
	font-size: 12px;
	color: #64748b;
}

.workflow-id {
	color: #94a3b8;
}

.workflow-date {
	color: #64748b;
}

.workflow-actions {
	display: flex;
	gap: 8px;
}

.btn-icon {
	width: 32px;
	height: 32px;
	background: transparent;
	border: 1px solid #334155;
	border-radius: 4px;
	cursor: pointer;
	font-size: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
}

.btn-icon:hover {
	background: #334155;
	border-color: #3b82f6;
}

.dialog-footer {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding: 16px 24px;
	border-top: 1px solid #334155;
}

.btn-secondary,
.btn-primary {
	padding: 8px 16px;
	border-radius: 4px;
	font-size: 14px;
	cursor: pointer;
	transition: all 0.2s;
}

.btn-secondary {
	background: transparent;
	border: 1px solid #475569;
	color: #e2e8f0;
}

.btn-secondary:hover {
	background: #334155;
	border-color: #64748b;
}

.btn-primary {
	background: #10b981;
	border: 1px solid #10b981;
	color: #fff;
}

.btn-primary:hover {
	background: #059669;
	border-color: #059669;
}

.btn-primary:disabled {
	background: #334155;
	border-color: #334155;
	color: #64748b;
	cursor: not-allowed;
}
</style>
