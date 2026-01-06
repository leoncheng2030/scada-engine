<template>
	<aside class="component-library">
		<div class="library-header">
			<h3>组件库</h3>
		</div>

		<div class="library-content">
			<!-- 基础组件 -->
			<div class="component-section" v-if="basicComponents.length > 0">
				<div class="section-header" @click="toggleSection('basic')">
					<h4 class="section-title">基础组件</h4>
					<span class="toggle-icon" :class="{ collapsed: collapsedSections.basic }">▼</span>
				</div>
				<div class="component-grid" v-show="!collapsedSections.basic">
					<div 
						v-for="component in basicComponents"
						:key="component.metadata.id"
						class="component-item" 
						@click="handleAddComponent(component)" 
						:title="component.metadata.description || component.metadata.name"
					>
						<span class="component-icon">{{ component.metadata.icon }}</span>
						<span class="component-name">{{ component.metadata.name }}</span>
					</div>
				</div>
			</div>

			<!-- IoT组件 -->
			<div class="component-section" v-if="iotComponents.length > 0">
				<div class="section-header" @click="toggleSection('iot')">
					<h4 class="section-title">IoT组件</h4>
					<span class="toggle-icon" :class="{ collapsed: collapsedSections.iot }">▼</span>
				</div>
				<div class="component-grid" v-show="!collapsedSections.iot">
					<div 
						v-for="component in iotComponents"
						:key="component.metadata.id"
						class="component-item" 
						@click="handleAddComponent(component)" 
						:title="component.metadata.description || component.metadata.name"
					>
						<span class="component-icon">{{ component.metadata.icon }}</span>
						<span class="component-name">{{ component.metadata.name }}</span>
					</div>
				</div>
			</div>
		</div>
	</aside>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { componentRegistry } from '../scada-components'
import type { ComponentConfig } from '../scada-components'

const emit = defineEmits<{
	addComponent: [type: string]
}>()

// 折叠状态
const collapsedSections = reactive({
	basic: false,
	iot: false
})

// 切换分组折叠状态
const toggleSection = (section: 'basic' | 'iot') => {
	collapsedSections[section] = !collapsedSections[section]
}

// 从注册表获取组件
const basicComponents = computed(() => 
	componentRegistry.getComponentsByCategory('basic')
)

const iotComponents = computed(() => 
	componentRegistry.getComponentsByCategory('iot')
)

const handleAddComponent = (component: ComponentConfig) => {
	emit('addComponent', component.metadata.id)
}
</script>

<style scoped>
.component-library {
	width: 260px;
	height: 100%;
	background: #1e293b;
	border-right: 1px solid #0f3460;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.library-header {
	padding: 16px;
	line-height: 50px;
	text-align: center;
	border-bottom: 1px solid #0f3460;
}

.library-header h3 {
	margin: 0;
	font-size: 16px;
	font-weight: 600;
	color: #e2e8f0;
}

.library-content {
	flex: 1;
	overflow-y: auto;
	padding: 16px;
}

.component-section {
	margin-bottom: 24px;
}

.component-section:last-child {
	margin-bottom: 0;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
	cursor: pointer;
	user-select: none;
	padding: 4px 0;
	transition: all 0.2s;
}

.section-header:hover {
	opacity: 0.8;
}

.section-title {
	font-size: 13px;
	color: #94a3b8;
	margin: 0;
	font-weight: 600;
}

.toggle-icon {
	font-size: 10px;
	color: #94a3b8;
	transition: transform 0.2s;
}

.toggle-icon.collapsed {
	transform: rotate(-90deg);
}

.component-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 8px;
	margin-bottom: 12px;
}

.component-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	padding: 12px 6px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s;
}

.component-item:hover {
	background: #1e3a5f;
	border-color: #3b82f6;
	transform: translateY(-2px);
	box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.component-item:active {
	transform: translateY(0);
}

.component-icon {
	font-size: 20px;
	color: #e2e8f0;
}

.component-name {
	font-size: 11px;
	color: #cbd5e1;
	font-weight: 500;
	text-align: center;
	line-height: 1.2;
}

/* 滚动条样式 - 与全局统一 */
.library-content::-webkit-scrollbar {
	width: 8px;
}

.library-content::-webkit-scrollbar-track {
	background: #0f172a;
	border-radius: 4px;
}

.library-content::-webkit-scrollbar-thumb {
	background: linear-gradient(180deg, #475569, #334155);
	border-radius: 4px;
	border: 2px solid #0f172a;
	transition: background 0.2s;
}

.library-content::-webkit-scrollbar-thumb:hover {
	background: linear-gradient(180deg, #3b82f6, #2563eb);
}

.library-content::-webkit-scrollbar-corner {
	background: #0f172a;
}
</style>
