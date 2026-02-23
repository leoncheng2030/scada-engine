<template>
	<div>
		<!-- 遮罩层 -->
		<div v-if="visible" class="menu-overlay" @click="$emit('close')"></div>
		
		<!-- 添加节点菜单 -->
		<div 
			v-if="visible" 
			class="add-node-menu"
			:style="{
				left: position.x + 'px',
				top: position.y + 'px'
			}"
		>
			<div class="menu-header">
				<span>选择节点类型</span>
				<button class="btn-close" @click="$emit('close')">×</button>
			</div>
			<div class="menu-list">
				<div 
					v-for="nodeType in filteredNodeTypes" 
					:key="nodeType.type"
					class="menu-item"
					@click="handleSelect(nodeType)"
				>
					<div class="menu-item-icon" :class="`node-icon-${nodeType.type}`">
						{{ nodeType.icon }}
					</div>
					<div class="menu-item-info">
						<div class="menu-item-name">{{ nodeType.name }}</div>
						<div class="menu-item-desc">{{ nodeType.description }}</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface NodeType {
	type: string
	name: string
	icon: string
	description: string
	color: string
}

interface Props {
	visible: boolean
	position: { x: number; y: number }
	nodeTypes: NodeType[]
}

interface Emits {
	(e: 'close'): void
	(e: 'select', nodeType: NodeType): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 过滤掉开始和结束节点
const filteredNodeTypes = computed(() => {
	return props.nodeTypes.filter(t => t.type !== 'start' && t.type !== 'end')
})

const handleSelect = (nodeType: NodeType) => {
	emit('select', nodeType)
}
</script>

<style scoped>
.menu-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.3);
	z-index: 999;
}

.add-node-menu {
	position: fixed;
	z-index: 1000;
	background: #1e293b;
	border: 1px solid #334155;
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	min-width: 280px;
	max-width: 320px;
}

.menu-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	border-bottom: 1px solid #334155;
	color: #e2e8f0;
	font-size: 14px;
	font-weight: 600;
}

.btn-close {
	width: 24px;
	height: 24px;
	background: transparent;
	border: none;
	color: #94a3b8;
	font-size: 20px;
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

.menu-list {
	padding: 8px;
}

.menu-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 12px;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s;
}

.menu-item:hover {
	background: #334155;
}

.menu-item-icon {
	width: 36px;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 6px;
	font-size: 18px;
	flex-shrink: 0;
}

.node-icon-getProperty { background: rgba(24, 144, 255, 0.1); }
.node-icon-setProperty { background: rgba(19, 194, 194, 0.1); }
.node-icon-condition { background: rgba(250, 173, 20, 0.1); }
.node-icon-httpRequest { background: rgba(114, 46, 209, 0.1); }
.node-icon-customCode { background: rgba(235, 47, 150, 0.1); }
.node-icon-timer { background: rgba(82, 196, 26, 0.1); }
.node-icon-clearTimer { background: rgba(255, 77, 79, 0.1); }

.menu-item-info {
	flex: 1;
}

.menu-item-name {
	font-size: 14px;
	color: #e2e8f0;
	font-weight: 500;
}

.menu-item-desc {
	font-size: 12px;
	color: #94a3b8;
	margin-top: 2px;
}
</style>
