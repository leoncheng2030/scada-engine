<!--
/**
 * Copyright (c) 2025 leoncheng
 * 
 * This source code is licensed under the proprietary license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 * @author leoncheng
 * @email nywqs@outlook.com
 */
-->
<template>
	<!-- 使用 teleport 到 body 最外层 -->
	<teleport to="body">
		<div
			v-if="visible"
			ref="menuRef"
			class="scada-context-menu"
			:style="menuStyle"
			@click.stop
			@contextmenu.prevent
		>
			<div
				v-for="item in menuItems"
				:key="item.key"
				:class="[
					'scada-context-menu-item',
					{ 'disabled': item.disabled, 'divider': item.divider }
				]"
				:style="getItemStyle(item)"
				@click="handleMenuClick(item)"
			>
				<template v-if="!item.divider">
					<span v-if="item.icon" class="scada-menu-icon">{{ item.icon }}</span>
					<span class="scada-menu-text">{{ item.label }}</span>
					<span v-if="item.hotkey" class="scada-menu-hotkey">{{ item.hotkey }}</span>
				</template>
			</div>
		</div>
	</teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export interface MenuItem {
	key: string
	label?: string
	icon?: string
	hotkey?: string
	disabled?: boolean
	divider?: boolean
	onClick?: () => void
}

interface Props {
	visible: boolean
	position: { x: number; y: number }
	menuItems: MenuItem[]
}

const props = withDefaults(defineProps<Props>(), {
	visible: false,
	position: () => ({ x: 0, y: 0 }),
	menuItems: () => []
})

const emit = defineEmits<{
	'update:visible': [value: boolean]
	'menu-click': [key: string]
}>()

const menuRef = ref<HTMLDivElement>()

// 计算菜单样式
const menuStyle = computed(() => {
	// 使用内联样式确保优先级最高，直接设置所有样式
	return {
		position: 'fixed' as const,
		left: props.position.x + 'px',
		top: props.position.y + 'px',
		zIndex: 99999,
		background: '#1f1f1f',
		border: '1px solid #3c3c3c',
		borderRadius: '4px',
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
		minWidth: '180px',
		padding: '6px 0',
		userSelect: 'none' as const,
		pointerEvents: 'auto' as const,
		margin: '0',
		boxSizing: 'border-box' as const,
		color: '#fff',
		fontSize: '13px'
	}
})

// 计算菜单项样式
const getItemStyle = (item: MenuItem) => {
	if (item.divider) {
		return {
			height: '1px',
			margin: '4px 8px',
			padding: '0',
			backgroundColor: '#3c3c3c',
			border: 'none'
		}
	}
	return {
		display: 'flex',
		alignItems: 'center',
		padding: '6px 12px',
		fontSize: '13px',
		color: item.disabled ? '#666666' : '#fff',
		cursor: item.disabled ? 'not-allowed' : 'pointer',
		margin: '0',
		border: 'none',
		lineHeight: '1.2',
		minHeight: '28px',
		backgroundColor: 'transparent'
	}
}

// 处理菜单项点击
const handleMenuClick = (item: MenuItem) => {
	if (item.disabled || item.divider) return
	
	emit('menu-click', item.key)
	item.onClick?.()
	emit('update:visible', false)
}

// 点击外部关闭菜单
const handleClickOutside = (e: MouseEvent) => {
	if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
		emit('update:visible', false)
	}
}

// 调整菜单位置，防止超出视口（简化版）
const adjustPosition = () => {
	// 目前直接使用传入的位置，不自动调整
}

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
	if (newVal) {
		setTimeout(adjustPosition, 0)
		// 缩短延迟时间到 50ms
		setTimeout(() => {
			document.addEventListener('click', handleClickOutside, true) // 使用捕获阶段
			document.addEventListener('contextmenu', handleClickOutside, true)
		}, 50)
	} else {
		document.removeEventListener('click', handleClickOutside, true)
		document.removeEventListener('contextmenu', handleClickOutside, true)
	}
})

onUnmounted(() => {
	document.removeEventListener('click', handleClickOutside, true)
	document.removeEventListener('contextmenu', handleClickOutside, true)
})
</script>

<style>
/* 不使用 scoped，确保右键菜单样式全局生效 */
.scada-context-menu {
	/* 基础样式 - 使用 !important 确保优先级 */
	background: #1f1f1f !important;
	border: 1px solid #3c3c3c !important;
	border-radius: 4px !important;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
	min-width: 180px !important;
	padding: 4px 0 !important;
	user-select: none !important;
	pointer-events: auto !important;
	/* 确保不继承其他样式 */
	margin: 0 !important;
	box-sizing: border-box !important;
	/* 设置文字颜色，让子元素继承 */
	color: #fff !important;
	font-size: 13px !important;
}

.scada-context-menu-item {
	display: flex !important;
	align-items: center !important;
	padding: 10px 16px !important;
	font-size: 13px !important;
	color: #fff !important;
	cursor: pointer !important;
	transition: background-color 0.15s !important;
	margin: 0 !important;
	border: none !important;
	box-sizing: border-box !important;
	line-height: 1.5 !important;
	min-height: 36px !important;
}

.scada-context-menu-item:hover:not(.disabled):not(.divider) {
	background-color: #2a2a2a !important;
	color: #ffffff !important;
}

.scada-context-menu-item.disabled {
	color: #666666 !important;
	cursor: not-allowed !important;
}

.scada-context-menu-item.divider {
	height: 1px !important;
	margin: 6px 8px !important;
	padding: 0 !important;
	background-color: #3c3c3c !important;
	cursor: default !important;
	min-height: auto !important;
}

.scada-menu-icon {
	margin-right: 12px !important;
	font-size: 16px !important;
	flex-shrink: 0 !important;
	width: 18px !important;
	text-align: center !important;
	display: inline-block !important;
}

.scada-menu-text {
	flex: 1 !important;
	font-size: 13px !important;
}

.scada-menu-hotkey {
	margin-left: 24px !important;
	font-size: 11px !important;
	color: #888888 !important;
	flex-shrink: 0 !important;
	opacity: 0.8 !important;
}

/* 过渡动画 */
.context-menu-fade-enter-active,
.context-menu-fade-leave-active {
	transition: opacity 0.15s, transform 0.15s;
}

.context-menu-fade-enter-from {
	opacity: 0;
	transform: scale(0.95) translateY(-5px);
}

.context-menu-fade-leave-to {
	opacity: 0;
	transform: scale(0.95);
}
</style>
