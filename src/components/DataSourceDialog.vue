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
						<div 
							v-if="dataSources.length === 0" 
							class="empty-hint"
						>
							暂无数据源
						</div>

						<div
							v-for="ds in dataSources"
							:key="ds.id"
							:class="['datasource-item', { active: selectedDataSource?.id === ds.id }]"
							@click="selectDataSource(ds)"
						>
							<div class="datasource-header">
								<div class="datasource-info">
									<span class="datasource-name">{{ ds.name }}</span>
									<span class="datasource-type">{{ ds.type }}</span>
								</div>
								<span 
									:class="['status-dot', ds.status?.connected ? 'connected' : 'disconnected']"
									:title="ds.status?.connected ? '已连接' : '未连接'"
								></span>
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
								<button 
									v-if="!isAddingNew" 
									class="btn-secondary" 
									@click="handleDelete"
								>
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
								<h5>基本信息</h5>
								
								<div class="form-item">
									<label>名称</label>
									<input 
										v-model="formData.name" 
										type="text" 
										placeholder="例如：主机房 MQTT"
									/>
								</div>

								<div class="form-item">
									<label>类型</label>
									<select v-model="formData.type" :disabled="!isAddingNew">
										<option value="MQTT">MQTT</option>
										<option value="WebSocket">WebSocket</option>
										<option value="HTTP">HTTP</option>
										<option value="SSE">SSE</option>
									</select>
								</div>

								<div class="form-item">
									<label>启用</label>
									<label class="switch">
										<input type="checkbox" v-model="formData.enabled" />
										<span class="slider"></span>
									</label>
								</div>
							</div>

							<!-- MQTT 配置 -->
							<div v-if="formData.type === 'MQTT'" class="form-section">
								<h5>MQTT 配置</h5>

								<div class="form-item">
									<label>Broker 地址</label>
									<input 
										v-model="formData.config.broker" 
										type="text" 
										placeholder="mqtt://broker.emqx.io 或 ws://broker.emqx.io:8083/mqtt"
									/>
									<span class="form-hint">💡 浏览器会自动转换为 WebSocket，EMQX 公共服务器使用 8083 端口</span>
								</div>

								<div class="form-item">
									<label>订阅主题</label>
									<input 
										v-model="formData.config.topic" 
										type="text" 
										placeholder="/devices/+/data"
									/>
								</div>

								<div class="form-item">
									<label>客户端 ID</label>
									<input 
										v-model="formData.config.clientId" 
										type="text" 
										placeholder="自动生成"
									/>
								</div>

								<div class="form-item">
									<label>用户名</label>
									<input 
										v-model="formData.config.username" 
										type="text" 
										placeholder="可选"
									/>
								</div>

								<div class="form-item">
									<label>密码</label>
									<input 
										v-model="formData.config.password" 
										type="password" 
										placeholder="可选"
									/>
								</div>
							</div>

							<!-- WebSocket 配置 -->
							<div v-if="formData.type === 'WebSocket'" class="form-section">
								<h5>WebSocket 配置</h5>

								<div class="form-item">
									<label>服务地址</label>
									<input 
										v-model="formData.config.wsUrl" 
										type="text" 
										placeholder="ws://localhost:8080"
									/>
								</div>
							</div>

						<!-- HTTP 配置 -->
							<div v-if="formData.type === 'HTTP'" class="form-section">
								<h5>HTTP 配置</h5>

								<div class="form-item">
									<label>接口地址</label>
									<input 
										v-model="formData.config.url" 
										type="text" 
										placeholder="https://api.example.com/data"
									/>
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
									<input 
										v-model.number="formData.config.pollInterval" 
										type="number" 
										min="1000"
										step="1000"
									/>
								</div>

								<div class="form-item">
									<div class="header-label-row">
										<label>请求头 (Headers)</label>
										<button class="btn-icon-add" @click="addHeader" title="添加请求头">
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<line x1="12" y1="5" x2="12" y2="19"></line>
												<line x1="5" y1="12" x2="19" y2="12"></line>
											</svg>
											添加
										</button>
									</div>
									
									<div class="headers-list">
										<div v-if="httpHeaders.length === 0" class="empty-headers">
											暂无自定义请求头
										</div>
										<div 
											v-for="(header, index) in httpHeaders" 
											:key="index"
											class="header-item"
										>
											<input 
												v-model="header.key" 
												type="text" 
												placeholder="Key"
												class="header-input key-input"
											/>
											<div class="separator">:</div>
											<input 
												v-model="header.value" 
												type="text" 
												placeholder="Value"
												class="header-input value-input"
											/>
											<button class="btn-icon-remove" @click="removeHeader(index)" title="删除">
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
													<polyline points="3 6 5 6 21 6"></polyline>
													<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
												</svg>
											</button>
										</div>
									</div>
								</div>
							</div>

							<!-- SSE 配置 -->
							<div v-if="formData.type === 'SSE'" class="form-section">
								<h5>SSE 配置</h5>

								<div class="form-item">
									<label>服务地址</label>
									<input 
										v-model="formData.config.sseUrl" 
										type="text" 
										placeholder="https://api.example.com/events"
									/>
								</div>

								<div class="form-item">
									<label>事件类型</label>
									<input 
										v-model="formData.config.eventType" 
										type="text" 
										placeholder="留空表示所有事件"
									/>
								</div>
							</div>

							<!-- 设备列表 -->
							<div v-if="selectedDataSource && selectedDataSource.devices.length > 0" class="form-section">
								<h5>已接收设备</h5>
								<div class="device-list">
									<div 
										v-for="device in selectedDataSource.devices" 
										:key="device.id"
										class="device-item"
									>
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
										<span :class="['status-badge', selectedDataSource.status.connected ? 'connected' : 'disconnected']">
											{{ selectedDataSource.status.connected ? '已连接' : '未连接' }}
										</span>
									</div>
									<div v-if="selectedDataSource.status.lastUpdate" class="status-row">
										<span>最后更新：</span>
										<span class="status-value">{{ formatTime(selectedDataSource.status.lastUpdate) }}</span>
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
		sseUrl: '',
		eventType: '',
		headers: {}
	}
})

// HTTP Headers 临时状态
const httpHeaders = ref<{ key: string; value: string }[]>([])

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

	// 填充 headers
	httpHeaders.value = []
	if (ds.config.headers) {
		Object.entries(ds.config.headers).forEach(([key, value]) => {
			httpHeaders.value.push({ key, value: String(value) })
		})
	}
}

const handleAddNew = () => {
	selectedDataSource.value = null
	isAddingNew.value = true
	
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
			headers: {}
		}
	}
	httpHeaders.value = []
}

const handleSave = () => {
	if (!formData.value.name) {
		alert('请输入数据源名称')
		return
	}

	// 处理 headers
	const headers: Record<string, string> = {}
	httpHeaders.value.forEach(h => {
		if (h.key) {
			headers[h.key] = h.value
		}
	})
	formData.value.config.headers = headers

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

const addHeader = () => {
	httpHeaders.value.push({ key: '', value: '' })
}

const removeHeader = (index: number) => {
	httpHeaders.value.splice(index, 1)
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
	from { opacity: 0; }
	to { opacity: 1; }
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
	padding: 20px 24px;
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

/* Headers List Styles */
.header-label-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
}

.header-label-row label {
	margin-bottom: 0;
}

.btn-icon-add {
	display: flex;
	align-items: center;
	gap: 4px;
	background: transparent;
	border: 1px solid #3b82f6;
	color: #3b82f6;
	font-size: 12px;
	cursor: pointer;
	padding: 4px 8px;
	border-radius: 4px;
	transition: all 0.2s;
}

.btn-icon-add:hover {
	background: rgba(59, 130, 246, 0.1);
}

.btn-icon-add svg {
	width: 12px;
	height: 12px;
}

.headers-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
	background: #162035;
	padding: 8px;
	border-radius: 4px;
	border: 1px solid #334155;
}

.header-item {
	display: flex;
	gap: 8px;
	align-items: center;
}

.header-input {
	background: #0f172a !important;
	border: 1px solid #334155 !important;
	font-size: 12px !important;
	padding: 6px 8px !important;
	height: 28px;
}

.header-input:focus {
	border-color: #3b82f6 !important;
}

.key-input {
	flex: 1;
	min-width: 0;
}

.value-input {
	flex: 1.5;
	min-width: 0;
}

.separator {
	color: #64748b;
	font-weight: bold;
}

.btn-icon-remove {
	background: transparent;
	border: none;
	color: #64748b;
	cursor: pointer;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;
	transition: all 0.2s;
	flex-shrink: 0;
}

.btn-icon-remove:hover {
	background: rgba(239, 68, 68, 0.1);
	color: #ef4444;
}

.empty-headers {
	padding: 16px;
	text-align: center;
	color: #64748b;
	font-size: 12px;
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

.btn-primary, .btn-secondary {
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
}

.form-item label {
	display: block;
	margin-bottom: 8px;
	font-size: 13px;
	color: #cbd5e1;
}

.form-item input[type="text"],
.form-item input[type="password"],
.form-item input[type="number"],
.form-item select {
	width: 100%;
	padding: 10px 12px;
	background: #0f172a;
	border: 1px solid #334155;
	border-radius: 4px;
	color: #e2e8f0;
	font-size: 13px;
	transition: all 0.2s;
}

.form-item input:focus,
.form-item select:focus {
	outline: none;
	border-color: #3b82f6;
	box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.form-item input::placeholder {
	color: #64748b;
}

.form-hint {
	display: block;
	margin-top: 6px;
	font-size: 11px;
	color: #64748b;
	line-height: 1.4;
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

.switch input:checked + .slider {
	background-color: #3b82f6;
}

.switch input:checked + .slider:before {
	transform: translateX(24px);
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
	background: #1e293b;
	padding: 2px 6px;
	border-radius: 4px;
}

/* 状态信息 */
.status-info {
	background: #0f172a;
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
