<template>
	<div class="canvas-config-panel">
		<div class="panel-header">
			<h3>画布配置</h3>
		</div>

		<div class="panel-content">
			<!-- 基础配置 -->
			<div class="config-section">
				<h4 class="section-title">基础配置</h4>
				
				<!-- 画布尺寸 -->
				<div class="config-item">
					<label>画布尺寸</label>
					<select 
						v-model="canvasConfig.size.preset" 
						@change="handleSizePresetChange"
						class="config-select"
					>
						<option value="1920*1080">1920*1080</option>
						<option value="1366*768">1366*768</option>
						<option value="1280*720">1280*720</option>
						<option value="800*600">800*600</option>
						<option value="custom">自定义</option>
					</select>
				</div>
				
				<!-- 自定义宽度 -->
				<div class="config-item" v-if="canvasConfig.size.preset === 'custom'">
					<label>宽度</label>
					<div class="number-input-group">
						<button @click="adjustSize('width', -100)" class="adjust-btn">-</button>
						<input 
							type="number" 
							v-model.number="customWidth"
							@change="handleCustomSizeChange"
							:min="800"
							:max="7680"
							class="config-number"
						/>
						<button @click="adjustSize('width', 100)" class="adjust-btn">+</button>
					</div>
				</div>
				
				<!-- 自定义高度 -->
				<div class="config-item" v-if="canvasConfig.size.preset === 'custom'">
					<label>高度</label>
					<div class="number-input-group">
						<button @click="adjustSize('height', -100)" class="adjust-btn">-</button>
						<input 
							type="number" 
							v-model.number="customHeight"
							@change="handleCustomSizeChange"
							:min="600"
							:max="4320"
							class="config-number"
						/>
						<button @click="adjustSize('height', 100)" class="adjust-btn">+</button>
					</div>
				</div>
			</div>

			<!-- 变换配置 -->
			<div class="config-section">
				<h4 class="section-title">变换</h4>
				
				<!-- 缩放倍数 -->
				<div class="config-item">
					<label>缩放倍数</label>
					<div class="slider-group">
						<input 
							type="range" 
							v-model.number="canvasConfig.zoom.scale"
							:min="0.1"
							:max="5"
							:step="0.1"
							class="config-slider"
						/>
						<span class="value-display">{{ canvasConfig.zoom.scale.toFixed(1) }}</span>
					</div>
				</div>

				<!-- X轴偏移 -->
				<div class="config-item">
					<label>画布X轴偏移</label>
					<div class="number-input-group">
						<button @click="adjustOffset('x', -10)" class="adjust-btn">-</button>
						<input 
							type="number" 
							v-model.number="canvasConfig.offset.x"
							class="config-number"
						/>
						<button @click="adjustOffset('x', 10)" class="adjust-btn">+</button>
					</div>
				</div>

				<!-- Y轴偏移 -->
				<div class="config-item">
					<label>画布Y轴偏移</label>
					<div class="number-input-group">
						<button @click="adjustOffset('y', -10)" class="adjust-btn">-</button>
						<input 
							type="number" 
							v-model.number="canvasConfig.offset.y"
							class="config-number"
						/>
						<button @click="adjustOffset('y', 10)" class="adjust-btn">+</button>
					</div>
				</div>
			</div>

			<!-- 背景配置 -->
			<div class="config-section">
				<h4 class="section-title">背景</h4>
				
				<!-- 背景颜色 -->
				<div class="config-item">
					<label>背景颜色</label>
					<input 
						type="color" 
						v-model="canvasConfig.background.color"
						class="config-color"
					/>
				</div>

				<!-- 背景图片 -->
				<div class="config-item">
					<label>背景图片</label>
					<div class="image-upload">
						<input 
							type="file" 
							accept="image/*"
							@change="handleImageUpload"
							ref="fileInput"
							style="display: none"
						/>
						<button @click="triggerFileInput" class="upload-btn">
							<span>📄</span>
						</button>
						<button 
							v-if="canvasConfig.background.image" 
							@click="clearBackgroundImage" 
							class="clear-btn"
							title="清除背景图"
						>
							✕
						</button>
					</div>
				</div>

				<!-- 背景大小 -->
				<div class="config-item">
					<label>背景大小</label>
					<select v-model="canvasConfig.background.size" class="config-select">
						<option value="origin">原始</option>
						<option value="contain">包含</option>
						<option value="cover">覆盖</option>
						<option value="stretch">拉伸</option>
					</select>
				</div>

				<!-- 图像重复 -->
				<div class="config-item">
					<label>图像重复</label>
					<select v-model="canvasConfig.background.repeat" class="config-select">
						<option value="repeat">重复</option>
						<option value="repeat-x">X轴重复</option>
						<option value="repeat-y">Y轴重复</option>
						<option value="no-repeat">不重复</option>
					</select>
				</div>
			</div>

			<!-- 辅助配置 -->
			<div class="config-section">
				<h4 class="section-title">辅助</h4>
				
				<!-- 吸附 -->
				<div class="config-item">
					<label>吸附</label>
					<label class="switch">
						<input type="checkbox" v-model="canvasConfig.magnetism.enabled" />
						<span class="slider"></span>
					</label>
				</div>

				<!-- 网格 -->
				<div class="config-item">
					<label>网格</label>
					<label class="switch">
						<input type="checkbox" v-model="canvasConfig.grid.enabled" />
						<span class="slider"></span>
					</label>
				</div>

				<!-- 网格对齐 -->
				<div class="config-item">
					<label>网格对齐</label>
					<label class="switch">
						<input type="checkbox" v-model="canvasConfig.snap.enabled" />
						<span class="slider"></span>
					</label>
				</div>

				<!-- 网格大小 -->
				<div class="config-item" v-if="canvasConfig.grid.enabled">
					<label>网格大小</label>
					<div class="number-input-group">
						<button @click="adjustGridSize(-5)" class="adjust-btn">-</button>
						<input 
							type="number" 
							v-model.number="canvasConfig.grid.size"
							:min="5"
							:max="50"
							class="config-number"
						/>
						<button @click="adjustGridSize(5)" class="adjust-btn">+</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { canvasConfigManager, sizePresetMap } from '../scada-components'

const canvasConfig = computed(() => canvasConfigManager.getConfig())
const fileInput = ref<HTMLInputElement>()

// 自定义尺寸
const customWidth = ref(canvasConfig.value.size.width)
const customHeight = ref(canvasConfig.value.size.height)

const handleSizePresetChange = () => {
	const preset = canvasConfig.value.size.preset
	if (preset === 'custom') {
		// 切换到自定义时，使用当前尺寸
		customWidth.value = canvasConfig.value.size.width
		customHeight.value = canvasConfig.value.size.height
	} else if (preset && preset in sizePresetMap) {
		const { width, height } = sizePresetMap[preset]
		canvasConfigManager.setSize(width, height, preset)
	}
}

const handleCustomSizeChange = () => {
	if (canvasConfig.value.size.preset === 'custom') {
		canvasConfigManager.setSize(customWidth.value, customHeight.value, 'custom')
	}
}

const adjustSize = (dimension: 'width' | 'height', delta: number) => {
	if (dimension === 'width') {
		customWidth.value = Math.max(800, Math.min(7680, customWidth.value + delta))
	} else {
		customHeight.value = Math.max(600, Math.min(4320, customHeight.value + delta))
	}
	handleCustomSizeChange()
}

const adjustOffset = (axis: 'x' | 'y', delta: number) => {
	const current = canvasConfig.value.offset[axis]
	canvasConfigManager.setOffset(
		axis === 'x' ? current + delta : canvasConfig.value.offset.x,
		axis === 'y' ? current + delta : canvasConfig.value.offset.y
	)
}

const adjustGridSize = (delta: number) => {
	const newSize = Math.max(5, Math.min(50, canvasConfig.value.grid.size + delta))
	canvasConfigManager.setGridSize(newSize)
}

// 背景图片功能
const triggerFileInput = () => {
	fileInput.value?.click()
}

const handleImageUpload = (event: Event) => {
	const target = event.target as HTMLInputElement
	const file = target.files?.[0]
	if (file) {
		const reader = new FileReader()
		reader.onload = (e) => {
			const imageUrl = e.target?.result as string
			canvasConfigManager.updateByPath('background.image', imageUrl)
		}
		reader.readAsDataURL(file)
	}
}

const clearBackgroundImage = () => {
	canvasConfigManager.updateByPath('background.image', '')
	if (fileInput.value) {
		fileInput.value.value = ''
	}
}
</script>

<style scoped>
.canvas-config-panel {
	width: 100%;
	height: 100%;
	background: #1e293b;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.panel-header {
	padding: 16px;
	border-bottom: 1px solid #0f3460;
}

.panel-header h3 {
	margin: 0;
	font-size: 16px;
	font-weight: 600;
	color: #e2e8f0;
}

.panel-content {
	flex: 1;
	overflow-y: auto;
	padding: 16px;
}

.config-section {
	margin-bottom: 24px;
}

.config-section:last-child {
	margin-bottom: 0;
}

.section-title {
	font-size: 13px;
	color: #94a3b8;
	margin: 0 0 12px 0;
	font-weight: 600;
}

.config-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
}

.config-item label {
	font-size: 13px;
	color: #cbd5e1;
	flex-shrink: 0;
}

.config-select {
	width: 160px;
	padding: 6px 12px;
	background: #0f172a;
	color: #e2e8f0;
	border: 1px solid #334155;
	border-radius: 4px;
	font-size: 13px;
}

.config-number {
	width: 80px;
	padding: 6px 12px;
	background: #0f172a;
	color: #e2e8f0;
	border: 1px solid #334155;
	border-radius: 4px;
	text-align: center;
	font-size: 13px;
}

.config-color {
	width: 50px;
	height: 32px;
	border: 1px solid #334155;
	border-radius: 4px;
	cursor: pointer;
	background: #0f172a;
}

.slider-group {
	display: flex;
	align-items: center;
	gap: 8px;
	flex: 1;
	max-width: 160px;
}

.config-slider {
	flex: 1;
}

.value-display {
	font-size: 12px;
	color: #94a3b8;
	min-width: 30px;
	text-align: right;
}

.number-input-group {
	display: flex;
	gap: 4px;
}

.adjust-btn {
	width: 32px;
	height: 32px;
	background: #0f172a;
	color: #e2e8f0;
	border: 1px solid #334155;
	border-radius: 4px;
	cursor: pointer;
	transition: all 0.2s;
	font-size: 14px;
}

.adjust-btn:hover {
	background: #1e3a5f;
	border-color: #3b82f6;
}

.upload-btn {
	width: 50px;
	height: 32px;
	background: #0f172a;
	color: #e2e8f0;
	border: 1px solid #334155;
	border-radius: 4px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	transition: all 0.2s;
}

.upload-btn:hover {
	background: #1e3a5f;
	border-color: #3b82f6;
}

.image-upload {
	display: flex;
	gap: 8px;
}

.clear-btn {
	width: 32px;
	height: 32px;
	background: #dc2626;
	color: #fff;
	border: 1px solid #991b1b;
	border-radius: 4px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
	transition: all 0.2s;
}

.clear-btn:hover {
	background: #b91c1c;
	border-color: #7f1d1d;
}

/* Toggle Switch */
.switch {
	position: relative;
	display: inline-block;
	width: 48px;
	height: 24px;
}

.switch input {
	opacity: 0;
	width: 0;
	height: 0;
}

.switch .slider {
	position: absolute;
	cursor: pointer;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #475569;
	transition: 0.3s;
	border-radius: 24px;
}

.switch .slider:before {
	position: absolute;
	content: "";
	height: 18px;
	width: 18px;
	left: 3px;
	bottom: 3px;
	background-color: white;
	transition: 0.3s;
	border-radius: 50%;
}

.switch input:checked + .slider {
	background-color: #3b82f6;
}

.switch input:checked + .slider:before {
	transform: translateX(24px);
}

/* 滚动条样式 - 与全局统一 */
.panel-content::-webkit-scrollbar {
	width: 8px;
}

.panel-content::-webkit-scrollbar-track {
	background: #0f172a;
	border-radius: 4px;
}

.panel-content::-webkit-scrollbar-thumb {
	background: linear-gradient(180deg, #475569, #334155);
	border-radius: 4px;
	border: 2px solid #0f172a;
	transition: background 0.2s;
}

.panel-content::-webkit-scrollbar-thumb:hover {
	background: linear-gradient(180deg, #3b82f6, #2563eb);
}

.panel-content::-webkit-scrollbar-corner {
	background: #0f172a;
}
</style>
