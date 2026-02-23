<template>
	<header class="scada-header">
		<!-- 左侧区域插槽,支持自定义 logo 和版本信息 -->
		<div class="header-left">
			<slot name="left">
				<!-- 默认内容 -->
				<h1 class="logo">SCADA 组态引擎</h1>
				<span class="version">v{{ version }}</span>
			</slot>
		</div>
		<!-- 画布操作组 - 居中 -->
		<div class="header-center">
			<div class="toolbar-container">
				<div class="tool-group">
					<button class="toolbar-btn" @click="emit('zoomIn')" title="放大">
						<ZoomIn class="icon-svg" />
					</button>
					<button class="toolbar-btn" @click="emit('zoomOut')" title="缩小">
						<ZoomOut class="icon-svg" />
					</button>
					<button class="toolbar-btn" @click="emit('clearAll')" title="清空画布">
						<Trash2 class="icon-svg" />
					</button>
				</div>
								
				<!-- 分隔线 -->
				<div v-if="props.selectedNodesCount >= 2" class="divider"></div>
							
				<!-- 对齐工具 -->
				<div v-if="props.selectedNodesCount >= 2" class="tool-group">
					<button class="toolbar-btn" @click="emit('alignLeft')" title="左对齐">
						<AlignStartHorizontal class="icon-svg" />
					</button>
					<button class="toolbar-btn" @click="emit('alignCenter')" title="水平居中">
						<AlignHorizontalJustifyCenter class="icon-svg" />
					</button>
					<button class="toolbar-btn" @click="emit('alignRight')" title="右对齐">
						<AlignEndHorizontal class="icon-svg" />
					</button>
					<button class="toolbar-btn" @click="emit('alignTop')" title="顶部对齐">
						<AlignStartVertical class="icon-svg" />
					</button>
					<button class="toolbar-btn" @click="emit('alignMiddle')" title="垂直居中">
						<AlignCenterVertical class="icon-svg" />
					</button>
					<button class="toolbar-btn" @click="emit('alignBottom')" title="底部对齐">
						<AlignEndVertical class="icon-svg" />
					</button>
				</div>
									
				<!-- 分隔线 -->
				<div v-if="props.selectedNodesCount >= 3" class="divider"></div>
									
				<!-- 分布工具 -->
				<div v-if="props.selectedNodesCount >= 3" class="tool-group">
					<button class="toolbar-btn" @click="emit('distributeHorizontal')" title="横向分布">
						<AlignHorizontalSpaceAround class="icon-svg" />
					</button>
					<button class="toolbar-btn" @click="emit('distributeVertical')" title="纵向分布">
						<AlignVerticalSpaceAround class="icon-svg" />
					</button>
				</div>
			</div>
		</div>
		
		<!-- 文件操作组 - 靠右 -->
		<div class="header-right">
			<div class="tool-group">
				<button class="header-btn" @click="emit('dataSource')" title="数据源管理">
					<Database class="icon-svg" />
					<span>数据源</span>
				</button>
				<button class="header-btn" @click="emit('workflow')" title="流程编排">
					<Workflow class="icon-svg" />
					<span>流程编排</span>
				</button>
				<button class="header-btn" @click="emit('import')" title="导入">
					<FolderOpen class="icon-svg" />
					<span>导入</span>
				</button>
				<button class="header-btn" @click="emit('export')" title="导出">
					<Download class="icon-svg" />
					<span>导出</span>
				</button>
				<button class="header-btn" @click="emit('preview')" title="预览">
					<Eye class="icon-svg" />
					<span>预览</span>
				</button>
				<button class="header-btn" @click="emit('save')" title="保存">
					<Save class="icon-svg" />
					<span>保存</span>
				</button>
					
			</div>
		</div>
	</header>
</template>

<script setup lang="ts">
import packageInfo from '../../../package.json'
import {
	AlignStartHorizontal,
	AlignHorizontalJustifyCenter,
	AlignEndHorizontal,
	AlignStartVertical,
	AlignCenterVertical,
	AlignEndVertical,
	AlignHorizontalSpaceAround,
	AlignVerticalSpaceAround,
	Trash2,
	Database,
	Workflow,
	FolderOpen,
	Download,
	Eye,
	Save,
	ZoomIn,
	ZoomOut
} from 'lucide-vue-next'

// 从 package.json 获取版本号
const version = packageInfo.version

interface Props {
	selectedNodesCount?: number
}

const props = withDefaults(defineProps<Props>(), {
	selectedNodesCount: 0
})

const emit = defineEmits<{
	save: []
	import: []
	workflow: []
	preview: []
	export: []
	dataSource: []  // 数据源管理
	zoomIn: []
	zoomOut: []
	clearAll: []
	alignLeft: []
	alignCenter: []
	alignRight: []
	alignTop: []
	alignMiddle: []
	alignBottom: []
	distributeHorizontal: []
	distributeVertical: []
}>()
</script>

<style scoped>
.scada-header {
	height: 60px;
	background: #16213e;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 32px;
	border-bottom: 1px solid #0f3460;
	gap: 24px;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 12px;
	flex-shrink: 0;
}

.logo {
	font-size: 20px;
	font-weight: 600;
	margin: 0;
	color: #e2e8f0;
}

.version {
	font-size: 12px;
	color: #64748b;
	padding: 2px 8px;
	background: #0f172a;
	border-radius: 4px;
}

.header-center {
	flex: 1;
	display: flex;
	justify-content: center;
	align-items: center;
	min-width: 0;
}

.toolbar-container {
	display: flex;
	align-items: center;
	gap: 0;
	background: #0f172a;
	padding: 4px 8px;
	border-radius: 8px;
	border: 1px solid #334155;
}

.header-right {
	display: flex;
	align-items: center;
	gap: 12px;
	flex-shrink: 0;
}

.tool-group {
	display: flex;
	align-items: center;
	gap: 6px;
}

.header-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	background: #0f172a;
	color: #e2e8f0;
	border: 1px solid #334155;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s;
	font-size: 13px;
}

.header-btn:hover {
	background: #1e3a5f;
	border-color: #3b82f6;
	transform: translateY(-1px);
}

.header-btn .icon-svg {
	width: 16px;
	height: 16px;
	display: block;
}

.tip {
	font-size: 13px;
	color: #94a3b8;
}

.divider {
	width: 1px;
	height: 28px;
	background: #334155;
	margin: 0 8px;
	flex-shrink: 0;
}

.toolbar-btn {
	width: 34px;
	height: 34px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	color: #e2e8f0;
	border: 1px solid transparent;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s;
	font-size: 16px;
	flex-shrink: 0;
}

.toolbar-btn:hover {
	background: #1e293b;
	border-color: #3b82f6;
}

.toolbar-btn .icon-svg {
	width: 18px;
	height: 18px;
	display: block;
}

.canvas-info {
	display: flex;
	align-items: center;
	gap: 16px;
}

.info-text {
	font-size: 12px;
	color: #64748b;
}
</style>
