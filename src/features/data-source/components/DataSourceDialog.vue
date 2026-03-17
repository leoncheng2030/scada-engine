<template>
	<div class="dialog-overlay" @click.self="handleClose">
		<div class="dialog-container">
			<div class="dialog-header">
				<h3>数据源管理</h3>
				<button class="btn-close" @click="handleClose">✕</button>
			</div>

			<div class="dialog-body">
				<!-- 左侧：数据源列表 -->
				<div class="datasource-list-panel">
					<div class="panel-header">
						<span>数据源列表</span>
						<button class="btn-add" @click="handleAddNew">+ 添加</button>
					</div>

					<div class="datasource-list">
						<div v-if="dataSources.length === 0" class="empty-hint">
							暂无数据源
						</div>

						<div v-for="ds in dataSources" :key="ds.id"
							:class="['datasource-item', { active: selectedDataSource?.id === ds.id }]"
							@click="selectDataSource(ds)">
							<div class="datasource-header">
								<div class="datasource-info">
									<span class="datasource-name">{{ ds.name }}</span>
									<span class="datasource-type">{{ ds.type }}</span>
								</div>
								<span :class="['status-dot', ds.status?.connected ? 'connected' : 'disconnected']"
									:title="ds.status?.connected ? '已连接' : '未连接'"></span>
							</div>
							<div class="datasource-meta">
								<span class="device-count">{{ ds.devices.length }} 个设备</span>
							</div>
						</div>
					</div>
				</div>

				<!-- 右侧：数据源详情 -->
				<div class="datasource-detail-panel">
					<div v-if="!selectedDataSource && !isAddingNew" class="empty-state">
						<p>请选择左侧数据源查看详情</p>
					</div>

					<div v-else class="detail-content">
						<div class="detail-header">
							<h4>{{ isAddingNew ? '新建数据源' : '数据源详情' }}</h4>
							<div class="detail-actions">
								<button v-if="!isAddingNew" class="btn-secondary" @click="handleDelete">
									删除
								</button>
								<button class="btn-primary" @click="handleSave">
									{{ isAddingNew ? '创建' : '保存' }}
								</button>
							</div>
						</div>

						<div class="detail-form">
							<!-- 基本信息 -->
							<div class="form-section">
								<!-- 协议类型提示（置顶） -->
								<div class="form-hint protocol-hint">
									<template v-if="formData.type === 'MQTT'">
										💡 适用于：多设备数据采集、主题订阅、QoS 保证（浏览器会自动使用 WebSocket 连接）
									</template>
									<template v-else-if="formData.type === 'WebSocket'">
										💡 适用于：自定义 WebSocket 服务、实时数据推送
									</template>
									<template v-else-if="formData.type === 'HTTP'">
										💡 适用于：RESTful API、定时查询数据
									</template>
									<template v-else-if="formData.type === 'SSE'">
										💡 适用于：服务器主动推送、事件流
									</template>
								</div>

								<div class="form-item">
									<label>协议类型</label>
									<select v-model="formData.type" :disabled="!isAddingNew">
										<option value="MQTT">MQTT - 工业 IoT 设备接入（推荐）</option>
										<option value="WebSocket">WebSocket - 自定义实时数据</option>
										<option value="HTTP">HTTP - 定时轮询接口</option>
										<option value="SSE">SSE - 服务器推送事件</option>
									</select>
								</div>
								<div class="form-item">
									<label>名称</label>
									<input v-model="formData.name" type="text" placeholder="例如：主机房 MQTT" />
								</div>
								<!-- 启用开关默认隐藏，新建数据源默认启用 -->
							</div>

							<!-- MQTT 配置 -->
							<div v-if="formData.type === 'MQTT'" class="form-section">
								<div class="form-item">
									<label class="form-item-label">Broker 地址</label>
									<input v-model="formData.config.broker" type="text"
										placeholder="mqtt://broker.emqx.io 或 ws://broker.emqx.io:8083/mqtt" />

								</div>

								<div class="form-item">
									<label>订阅主题</label>
									<input v-model="formData.config.topic" type="text" placeholder="/devices/+/data" />
								</div>

								<div class="form-item">
									<label>客户端 ID</label>
									<input v-model="formData.config.clientId" type="text" placeholder="自动生成" />
								</div>

								<div class="form-item">
									<label>用户名</label>
									<input v-model="formData.config.username" type="text" placeholder="可选" />
								</div>

								<div class="form-item">
									<label>密码</label>
									<input v-model="formData.config.password" type="password" placeholder="可选" />
								</div>
							</div>

							<!-- WebSocket 配置 -->
							<div v-if="formData.type === 'WebSocket'" class="form-section">
								<div class="form-item">
									<label>服务地址</label>
									<input v-model="formData.config.wsUrl" type="text"
										placeholder="ws://localhost:8080" />
								</div>
							</div>

							<!-- HTTP 配置 -->
							<div v-if="formData.type === 'HTTP'" class="form-section">
								<div class="form-item">
									<label>接口地址</label>
									<input v-model="formData.config.url" type="text"
										placeholder="https://api.example.com/data" />
								</div>

								<div class="form-item">
									<label>请求方法</label>
									<select v-model="formData.config.method">
										<option value="GET">GET</option>
										<option value="POST">POST</option>
									</select>
								</div>

								<div class="form-item">
									<label>轮询间隔 (ms)</label>
									<input v-model.number="formData.config.pollInterval" type="number" min="1000"
										step="1000" />
								</div>

								<div class="form-item">
									<label>自动采集设备ID</label>
									<div class="switch-wrapper">
										<label class="switch">
											<input type="checkbox" v-model="formData.config.autoCollectDeviceIds" />
											<span class="slider"></span>
										</label>
										<span class="switch-hint">开启后自动扫描画布节点，将设备ID作为POST请求体发送</span>
									</div>
								</div>

								<div class="form-item">
									<label>请求头 (Headers)</label>
																
									<div class="headers-container">
										<div class="headers-list">
											<div v-if="httpHeaders.length === 0" class="empty-headers">
												暂无自定义请求头
											</div>
											<div v-for="(header, index) in httpHeaders" :key="index" class="header-item">
												<input v-model="header.key" type="text" placeholder="Key"
													class="header-input key-input" @input="syncHeadersToConfig" />
												<div class="separator">:</div>
												<input v-model="header.value" type="text" placeholder="Value"
													class="header-input value-input" @input="syncHeadersToConfig" />
												<button class="btn-icon-remove" @click="removeHeader(index)" type="button"
													title="删除">
													<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
														stroke="currentColor" stroke-width="2" stroke-linecap="round"
														stroke-linejoin="round">
														<polyline points="3 6 5 6 21 6"></polyline>
														<path
															d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
														</path>
													</svg>
												</button>
											</div>
										</div>
																	
										<button class="btn-icon-add" @click="addHeader" type="button" title="添加请求头">
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
												stroke="currentColor" stroke-width="2" stroke-linecap="round"
												stroke-linejoin="round">
												<line x1="12" y1="5" x2="12" y2="19"></line>
												<line x1="5" y1="12" x2="19" y2="12"></line>
											</svg>
											添加请求头
										</button>
									</div>
								</div>

								<div class="form-item">
									<label>请求体</label>
									<textarea v-model="formData.config.body" rows="3" placeholder="POST/PUT方法的请求体" />
								</div>
							</div>

							<!-- SSE 配置 -->
							<div v-if="formData.type === 'SSE'" class="form-section">
								<div class="form-item">
									<label>服务地址</label>
									<input v-model="formData.config.sseUrl" type="text"
										placeholder="https://api.example.com/events" />
								</div>

								<div class="form-item">
									<label>事件类型</label>
									<input v-model="formData.config.eventType" type="text" placeholder="留空表示所有事件" />
								</div>
							</div>

							<!-- 设备列表 -->
							<div v-if="selectedDataSource && selectedDataSource.devices.length > 0"
								class="form-section">
								<h5>已接收设备</h5>
								<div class="device-list">
									<div v-for="device in selectedDataSource.devices" :key="device.id"
										class="device-item">
										<div class="device-info">
											<span class="device-name">{{ device.name }}</span>
											<span class="device-id">{{ device.id }}</span>
										</div>
										<span class="point-count">{{ device.points.length }} 个点位</span>
									</div>
								</div>
							</div>

							<!-- 连接状态 -->
							<div v-if="selectedDataSource?.status" class="form-section">
								<h5>连接状态</h5>
								<div class="status-info">
									<div class="status-row">
										<span>状态：</span>
										<span
											:class="['status-badge', selectedDataSource.status.connected ? 'connected' : 'disconnected']">
											{{ selectedDataSource.status.connected ? '已连接' : '未连接' }}
										</span>
									</div>
									<div v-if="selectedDataSource.status.lastUpdate" class="status-row">
										<span>最后更新：</span>
										<span class="status-value">{{ formatTime(selectedDataSource.status.lastUpdate)
											}}</span>
									</div>
									<div v-if="selectedDataSource.status.error" class="status-row error">
										<span>错误：</span>
										<span class="status-value">{{ selectedDataSource.status.error }}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DataSource } from '../services/dataSourceManager'

interface Props {
	dataSources: DataSource[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
	close: []
	save: [dataSource: DataSource]
	delete: [id: string]
	add: [dataSource: Omit<DataSource, 'id' | 'devices' | 'status'>]
}>()

const selectedDataSource = ref<DataSource | null>(null)
const isAddingNew = ref(false)
const httpHeaders = ref<Array<{ key: string; value: string }>>([])

const formData = ref<any>({
	name: '',
	type: 'MQTT',
	enabled: true,
	config: {
		broker: '',
		topic: '',
		clientId: '',
		username: '',
		password: '',
		wsUrl: '',
		url: '',
		method: 'GET',
		pollInterval: 5000,
		headers: {},
		body: '',
		autoCollectDeviceIds: false,
		sseUrl: '',
		eventType: ''
	}
})

const selectDataSource = (ds: DataSource) => {
	selectedDataSource.value = ds
	isAddingNew.value = false

	// 填充表单数据
	formData.value = {
		name: ds.name,
		type: ds.type,
		enabled: ds.enabled,
		config: { ...ds.config }
	}

	// 初始化HTTP headers列表
	if (ds.type === 'HTTP' && ds.config.headers) {
		httpHeaders.value = Object.entries(ds.config.headers).map(([key, value]) => ({
			key,
			value: String(value)
		}))
	} else {
		httpHeaders.value = []
	}
}

const handleAddNew = () => {
	selectedDataSource.value = null
	isAddingNew.value = true
	httpHeaders.value = []

	// 重置表单
	formData.value = {
		name: '',
		type: 'MQTT',
		enabled: true,
		config: {
			broker: 'mqtt://broker.emqx.io',
			topic: '/devices/+/data',
			clientId: 'scada_' + Date.now(),
			username: '',
			password: '',
			headers: {},
			autoCollectDeviceIds: false
		}
	}
}

const handleSave = () => {
	if (!formData.value.name) {
		alert('请输入数据源名称')
		return
	}

	// 保存前强制同步 headers 到 config
	if (formData.value.type === 'HTTP') {
		syncHeadersToConfig()
	}

	if (isAddingNew.value) {
		// 新建数据源
		emit('add', {
			name: formData.value.name,
			type: formData.value.type,
			enabled: formData.value.enabled,
			config: formData.value.config
		})
		isAddingNew.value = false
	} else if (selectedDataSource.value) {
		// 更新数据源
		emit('save', {
			...selectedDataSource.value,
			name: formData.value.name,
			type: formData.value.type,
			enabled: formData.value.enabled,
			config: formData.value.config
		})
	}
}

const handleDelete = () => {
	if (selectedDataSource.value && confirm(`确定要删除数据源"${selectedDataSource.value.name}"吗？`)) {
		emit('delete', selectedDataSource.value.id)
		selectedDataSource.value = null
		isAddingNew.value = false
	}
}

const handleClose = () => {
	emit('close')
}

const formatTime = (isoString: string) => {
	const date = new Date(isoString)
	return date.toLocaleString('zh-CN')
}

// 添加请求头
const addHeader = () => {
	httpHeaders.value.push({ key: '', value: '' })
}

// 删除请求头
const removeHeader = (index: number) => {
	httpHeaders.value.splice(index, 1)
	syncHeadersToConfig()
}

// 同步headers列表到config
const syncHeadersToConfig = () => {
	const headers: Record<string, string> = {}
	httpHeaders.value.forEach(header => {
		if (header.key.trim()) {
			headers[header.key.trim()] = header.value
		}
	})
	formData.value.config.headers = headers
}
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
	animation: fadeIn 0.2s;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}

	to {
		opacity: 1;
	}
}

.dialog-container {
	width: 90%;
	max-width: 1200px;
	height: 80%;
	max-height: 800px;
	background: #1e293b;
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	animation: slideUp 0.3s;
}

@keyframes slideUp {
	from {
		transform: translateY(20px);
		opacity: 0;
	}

	to {
		transform: translateY(0);
		opacity: 1;
	}
}

.dialog-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 20px;
	border-bottom: 1px solid #334155;
}

.dialog-header h3 {
	margin: 0;
	font-size: 18px;
	color: #e2e8f0;
	font-weight: 600;
}

.btn-close {
	width: 32px;
	height: 32px;
	background: transparent;
	border: none;
	color: #94a3b8;
	font-size: 20px;
	cursor: pointer;
	border-radius: 4px;
	transition: all 0.2s;
}

.btn-close:hover {
	background: #334155;
	color: #e2e8f0;
}

.dialog-body {
	flex: 1;
	display: flex;
	overflow: hidden;
}

/* 左侧数据源列表 */
.datasource-list-panel {
	width: 300px;
	border-right: 1px solid #334155;
	display: flex;
	flex-direction: column;
	background: #0f172a;
}

.panel-header {
	padding: 16px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1px solid #334155;
}

.panel-header span {
	font-size: 14px;
	color: #cbd5e1;
	font-weight: 600;
}

.btn-add {
	padding: 6px 12px;
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

.datasource-list {
	flex: 1;
	overflow-y: auto;
	padding: 8px;
}

.datasource-item {
	padding: 12px;
	margin-bottom: 8px;
	background: #1e293b;
	border: 1px solid #334155;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s;
}

.datasource-item:hover {
	background: #334155;
	border-color: #475569;
}

.datasource-item.active {
	background: #1e3a5f;
	border-color: #3b82f6;
}

.datasource-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
}

.datasource-info {
	display: flex;
	align-items: center;
	gap: 8px;
	flex: 1;
	min-width: 0;
}

.datasource-name {
	font-size: 14px;
	color: #e2e8f0;
	font-weight: 500;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.datasource-type {
	padding: 2px 8px;
	background: #334155;
	color: #94a3b8;
	font-size: 11px;
	border-radius: 4px;
	flex-shrink: 0;
}

.status-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	flex-shrink: 0;
}

.status-dot.connected {
	background: #22c55e;
	box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

.status-dot.disconnected {
	background: #ef4444;
}

.datasource-meta {
	font-size: 12px;
	color: #64748b;
}

.empty-hint {
	padding: 32px;
	text-align: center;
	color: #64748b;
	font-size: 13px;
}

/* 右侧详情面板 */
.datasource-detail-panel {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.empty-state {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #64748b;
}

.detail-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.detail-header {
	padding: 16px 24px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1px solid #334155;
}

.detail-header h4 {
	margin: 0;
	font-size: 16px;
	color: #e2e8f0;
	font-weight: 600;
}

.detail-actions {
	display: flex;
	gap: 8px;
}

.btn-primary,
.btn-secondary {
	padding: 8px 16px;
	border: none;
	border-radius: 4px;
	font-size: 13px;
	cursor: pointer;
	transition: all 0.2s;
	font-weight: 500;
}

.btn-primary {
	background: #3b82f6;
	color: white;
}

.btn-primary:hover {
	background: #2563eb;
}

.btn-secondary {
	background: #dc2626;
	color: white;
}

.btn-secondary:hover {
	background: #b91c1c;
}

.detail-form {
	flex: 1;
	overflow-y: auto;
	padding: 24px;
}

.form-section {
	margin-bottom: 32px;
}

.form-section h5 {
	margin: 0 0 16px 0;
	font-size: 14px;
	color: #94a3b8;
	font-weight: 600;
}

.form-item {
	margin-bottom: 16px;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: flex-start;
	gap: 8px;
}

.form-item label {
	display: block;
	width: 100px;
	font-size: 13px;
	color: #cbd5e1;
}

.form-item input[type="text"],
.form-item input[type="password"],
.form-item input[type="number"],
.form-item textarea,
.form-item select {
	flex: 1;
	padding: 10px 12px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 13px;
	transition: all 0.2s;
	resize: vertical;
}

.form-item input:focus,
.form-item textarea:focus,
.form-item select:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.form-item input::placeholder,
.form-item textarea::placeholder {
	color: #64748b;
}

.form-hint {
	display: block;
	margin-top: 6px;
	float: left;
	font-size: 11px;
	color: #64748b;
	line-height: 1.4;
}

/* 协议类型提示 */
.protocol-hint {
	margin-top: 0;
	margin-bottom: 16px;
	padding: 12px 16px;
	background: rgba(59, 130, 246, 0.1);
	border-left: 3px solid #3b82f6;
	border-radius: 4px;
	font-size: 13px;
	color: #94a3b8;
	line-height: 1.6;
	float: none;
}

/* Header键值对列表 */
.headers-container {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 0;
}

.btn-icon-add {
	display: flex;
	width: 100%;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 10px 16px;
	background: transparent;
	color: #3b82f6;
	border: 1px dashed #3b82f6;
	border-radius: 4px;
	font-size: 13px;
	cursor: pointer;
	transition: all 0.2s;
}

.btn-icon-add:hover {
	background: rgba(59, 130, 246, 0.1);
	border-color: #2563eb;
	color: #2563eb;
}

.headers-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
	max-height: 240px;
	overflow-y: auto;
	padding: 2px;
	margin-bottom: 12px;
}

.empty-headers {
	padding: 24px;
	text-align: center;
	color: #64748b;
	font-size: 12px;
	background: #0f172a;
	border: 1px dashed #334155;
	border-radius: 4px;
}

.header-item {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	transition: all 0.2s;
}

.header-item:hover {
	background: #1e293b;
	border-color: #475569;
}

.header-input {
	padding: 6px 10px;
	background: #1e293b;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 12px;
	transition: all 0.2s;
}

.header-input:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.header-input::placeholder {
	color: #64748b;
}

.key-input {
	flex: 0 0 140px;
}

.value-input {
	flex: 1;
	min-width: 0;
}

.separator {
	color: #64748b;
	font-size: 14px;
	font-weight: 500;
	flex-shrink: 0;
}

.btn-icon-remove {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	padding: 0;
	background: transparent;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #94a3b8;
	cursor: pointer;
	transition: all 0.2s;
	flex-shrink: 0;
}

.btn-icon-remove:hover {
	background: #dc2626;
	border-color: #dc2626;
	color: white;
}

.form-item select:disabled {
	opacity: 0.5;
	cursor: not-allowed;
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

.switch input:checked+.slider {
	background-color: #3b82f6;
}

.switch input:checked+.slider:before {
	transform: translateX(24px);
}

.switch-wrapper {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 12px;
}

.switch-hint {
	font-size: 12px;
	color: #64748b;
	line-height: 1.4;
}

/* 设备列表 */
.device-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.device-item {
	padding: 12px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.device-info {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.device-name {
	font-size: 13px;
	color: #e2e8f0;
	font-weight: 500;
}

.device-id {
	font-size: 11px;
	color: #64748b;
}

.point-count {
	font-size: 12px;
	color: #94a3b8;
}

/* 状态信息 */
.status-info {
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	padding: 16px;
}

.status-row {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 12px;
	font-size: 13px;
}

.status-row:last-child {
	margin-bottom: 0;
}

.status-row span:first-child {
	color: #94a3b8;
	min-width: 80px;
}

.status-value {
	color: #cbd5e1;
}

.status-badge {
	padding: 4px 12px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 500;
}

.status-badge.connected {
	background: rgba(34, 197, 94, 0.2);
	color: #22c55e;
}

.status-badge.disconnected {
	background: rgba(239, 68, 68, 0.2);
	color: #ef4444;
}

.status-row.error {
	color: #ef4444;
}

/* 滚动条 */
.datasource-list::-webkit-scrollbar,
.detail-form::-webkit-scrollbar {
	width: 6px;
}

.datasource-list::-webkit-scrollbar-track,
.detail-form::-webkit-scrollbar-track {
	background: transparent;
}

.datasource-list::-webkit-scrollbar-thumb,
.detail-form::-webkit-scrollbar-thumb {
	background: #475569;
	border-radius: 3px;
}

.datasource-list::-webkit-scrollbar-thumb:hover,
.detail-form::-webkit-scrollbar-thumb:hover {
	background: #64748b;
}
</style>
