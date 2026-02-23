<template>
	<aside class="component-library" :class="{ collapsed: isCollapsed }">
		<button class="collapse-btn" @click="toggleCollapse" :title="isCollapsed ? '展开组件库' : '折叠组件库'">
			<span class="collapse-icon">◀</span>
		</button>
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

			<!-- 图表组件 -->
			<div class="component-section" v-if="chartComponents.length > 0">
				<div class="section-header" @click="toggleSection('chart')">
					<h4 class="section-title">图表组件</h4>
					<span class="toggle-icon" :class="{ collapsed: collapsedSections.chart }">▼</span>
				</div>
				<div class="component-grid" v-show="!collapsedSections.chart">
					<div 
						v-for="component in chartComponents"
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
import { computed, reactive, onMounted, onBeforeUnmount, ref } from 'vue'
import { componentRegistry } from '../../scada-components'
import type { ComponentConfig } from '../../scada-components'

interface Props {
	isCollapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	isCollapsed: false
})

const emit = defineEmits<{
	addComponent: [type: string]
	'update:collapsed': [value: boolean]
}>()

const toggleCollapse = () => {
	emit('update:collapsed', !props.isCollapsed)
}

// 折叠状态
const collapsedSections = reactive({
	basic: false,
	chart: false,
	iot: false
})

// 切换分组折叠状态
const toggleSection = (section: 'basic' | 'chart' | 'iot') => {
	collapsedSections[section] = !collapsedSections[section]
}

// 强制刷新标记
const refreshKey = ref(0)

// 定时器 ID
let intervalId: ReturnType<typeof setInterval> | undefined

// 从注册表获取组件
const basicComponents = computed(() => {
	refreshKey.value // 依赖刷新标记
	return componentRegistry.getComponentsByCategory('basic')
})

const chartComponents = computed(() => {
	refreshKey.value // 依赖刷新标记
	return componentRegistry.getComponentsByCategory('chart')
})

const iotComponents = computed(() => {
	refreshKey.value // 依赖刷新标记
	return componentRegistry.getComponentsByCategory('iot')
})

const handleAddComponent = (component: ComponentConfig) => {
	emit('addComponent', component.metadata.id)
}

// 在组件挂载时预加载所有组件
onMounted(async () => {
	try {
		await componentRegistry.preloadAllComponents()
		// 强制刷新计算属性
		refreshKey.value++
	} catch (error) {
		console.error('[组件库] 预加载组件失败:', error)
	}
	
	// 监听组件注册表变化，自动刷新
	// 每隔 500ms 检查一次组件数量是否变化
	let lastComponentCount = Object.keys(componentRegistry.getAllComponents()).length
	const checkInterval = setInterval(() => {
		const currentCount = Object.keys(componentRegistry.getAllComponents()).length
		if (currentCount !== lastComponentCount) {
			lastComponentCount = currentCount
			refreshKey.value++
			if (import.meta.env.DEV) {
				console.log(`[组件库] 检测到新组件，已刷新，当前数量: ${currentCount}`)
			}
		}
	}, 500)
	
	// 存储定时器 ID 供销毁时清理
	intervalId = checkInterval
})

// 在 setup 顶层注册 onBeforeUnmount
onBeforeUnmount(() => {
	if (intervalId) {
		clearInterval(intervalId)
	}
})
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
	position: relative;
	transition: width 0.3s ease, margin-left 0.3s ease;
}

.component-library.collapsed {
	width: 0;
	margin-left: 0;
	border-right: none;
	overflow: visible; /* 改为 visible 让按钮可见 */
}

.collapse-btn {
	position: absolute;
	top: 50%;
	right: -12px;
	transform: translateY(-50%);
	width: 24px;
	height: 48px;
	background: #1e293b;
	border: 1px solid #0f3460;
	border-left: none;
	border-radius: 0 6px 6px 0;
	cursor: pointer;
	z-index: 10;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
	opacity: 1;
	visibility: visible;
}

/* 折叠状态下按钮位置调整 */
.component-library.collapsed .collapse-btn {
	right: -24px; /* 折叠后按钮向右偏移 */
}

.collapse-btn:hover {
	background: #334155;
	right: -14px;
}

.collapse-icon {
	font-size: 12px;
	color: #94a3b8;
	transition: transform 0.3s;
}

.component-library.collapsed .collapse-icon {
	transform: rotate(180deg);
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
