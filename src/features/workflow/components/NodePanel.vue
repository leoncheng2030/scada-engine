<template>
	<div class="node-panel">
		<h3>节点库</h3>
		<div class="node-list">
			<div 
				v-for="nodeType in nodeTypes" 
				:key="nodeType.type"
				class="node-item"
				@mousedown="handleMouseDown($event, nodeType)"
			>
				<div class="node-icon" :class="`node-icon-${nodeType.type}`">
					{{ nodeType.icon }}
				</div>
				<div class="node-info">
					<div class="node-type-name">{{ nodeType.name }}</div>
					<div class="node-type-desc">{{ nodeType.description }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
interface NodeType {
	type: string
	name: string
	icon: string
	description: string
	color: string
}

interface Props {
	nodeTypes: NodeType[]
}

interface Emits {
	(e: 'drag-start', event: MouseEvent, nodeType: NodeType): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleMouseDown = (event: MouseEvent, nodeType: NodeType) => {
	emit('drag-start', event, nodeType)
}
</script>

<style scoped>
.node-panel {
	width: 240px;
	background: #1e293b;
	border-right: 1px solid #334155;
	display: flex;
	flex-direction: column;
}

.node-panel h3 {
	margin: 0;
	padding: 16px;
	font-size: 14px;
	font-weight: 600;
	color: #e2e8f0;
	border-bottom: 1px solid #334155;
}

.node-list {
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 12px;
	overflow-y: auto;
}

.node-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 6px;
	cursor: move;
	transition: all 0.2s;
}

.node-item:hover {
	border-color: #3b82f6;
	box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.node-icon {
	width: 36px;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(59, 130, 246, 0.1);
	border-radius: 6px;
	font-size: 18px;
}

.node-icon-start { background: rgba(82, 196, 26, 0.1); }
.node-icon-end { background: rgba(255, 77, 79, 0.1); }
.node-icon-getProperty { background: rgba(24, 144, 255, 0.1); }
.node-icon-setProperty { background: rgba(19, 194, 194, 0.1); }
.node-icon-condition { background: rgba(250, 173, 20, 0.1); }
.node-icon-httpRequest { background: rgba(114, 46, 209, 0.1); }
.node-icon-customCode { background: rgba(235, 47, 150, 0.1); }
.node-icon-timer { background: rgba(82, 196, 26, 0.1); }
.node-icon-clearTimer { background: rgba(255, 77, 79, 0.1); }

.node-info {
	flex: 1;
}

.node-type-name {
	font-size: 14px;
	color: #e2e8f0;
	font-weight: 500;
}

.node-type-desc {
	font-size: 12px;
	color: #94a3b8;
	margin-top: 2px;
}
</style>
