<template>
	<div class="dialog-overlay" @click.self="$emit('close')">
		<div class="dialog-content dialog-large">
			<div class="dialog-header">
				<h3>自定义代码配置</h3>
				<button class="btn-close" @click="$emit('close')">×</button>
			</div>
			
			<div class="dialog-body dialog-body-split">
				<!-- 左侧：代码编辑器 -->
				<div class="code-editor-section">
					<div class="section-header">
						<label>JavaScript代码</label>
						<button class="btn-test" @click="testCustomCode">测试执行</button>
					</div>
					<textarea
						:value="code"
						@input="$emit('update:code', ($event.target as HTMLTextAreaElement).value)"
						placeholder="function execute(node) {&#10;    // 修改节点填充颜色为红色&#10;    node.attr('body/fill', '#ff0000');&#10;    &#10;    // 修改节点文本内容&#10;    node.attr('text/text', '已点击');&#10;    &#10;    // 获取当前节点位置&#10;    const pos = node.getPosition();&#10;    console.log('X:', pos.x, 'Y:', pos.y);&#10;}"
						class="code-textarea code-textarea-full"
					></textarea>
				</div>
				
				<!-- 右侧：组件预览 -->
				<div class="code-preview-section">
					<div class="section-header">
						<label>组件预览</label>
						<div class="preview-status">
							<span v-if="executionResult?.success" class="status-success">✓ 执行成功</span>
							<span v-else-if="executionResult?.error" class="status-error">✗ 执行失败</span>
						</div>
					</div>
					<div class="preview-canvas">
						<div v-if="!executionResult" class="preview-empty">
							点击"测试执行"按钮查看组件预览效果
						</div>
						<div v-else-if="executionResult.error" class="preview-error-box">
							<div class="error-title">错误信息：</div>
							<div class="error-message">{{ executionResult.error }}</div>
						</div>
						<div v-else class="preview-node-container">
							<!-- 这里显示组件的实时预览 -->
							<div ref="previewContainer" class="node-preview"></div>
							
							<!-- 控制台输出 -->
							<div v-if="executionResult.logs.length > 0" class="console-output">
								<div class="console-title">控制台输出：</div>
								<div class="console-logs">
									<div v-for="(log, index) in executionResult.logs" :key="index" class="log-item">
										{{ log }}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<div class="dialog-footer">
				<button class="btn-cancel" @click="$emit('close')">取消</button>
				<button class="btn-confirm" @click="$emit('save')">确定</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { Node } from '@antv/x6'
import { Graph } from '@antv/x6'

interface ExecutionResult {
	success: boolean
	logs: string[]
	result?: any
	error?: string
}

const props = defineProps<{
	code: string
	selectedNode: Node | null
}>()

defineEmits<{
	'update:code': [value: string]
	'close': []
	'save': []
}>() // emit 由 template 中使用

const previewContainer = ref<HTMLElement | null>(null)
const executionResult = ref<ExecutionResult | null>(null)
let previewGraph: Graph | null = null
let previewNode: Node | null = null

// 默认示例代码
const DEFAULT_CODE = `function execute(node) {
    // 修改节点填充颜色为红色
    node.attr('body/fill', '#ff0000');
    
    // 修改节点文本内容
    node.attr('text/text', '已点击');
    
    // 获取当前节点位置
    const pos = node.getPosition();
    console.log('X:', pos.x, 'Y:', pos.y);
}`

const testCustomCode = async () => {
	if (!props.selectedNode) {
		executionResult.value = {
			success: false,
			logs: [],
			error: '没有选中的节点'
		}
		return
	}
	
	// 获取graph对象
	const graph = props.selectedNode.model?.graph
	if (!graph) {
		executionResult.value = {
			success: false,
			logs: [],
			error: '无法获取画布对象'
		}
		return
	}
	
	// 先设置一个初始状态，让预览区域渲染出来
	executionResult.value = {
		success: true,
		logs: [],
		result: undefined
	}
	
	const logs: string[] = []
	const originalConsoleLog = console.log
	
	try {
		// 等待DOM渲染完成后初始化预览画布
		await nextTick()
		await initPreviewGraph()
		
		if (!previewNode || !previewGraph) {
			executionResult.value = {
				success: false,
				logs: [],
				error: '预览画布初始化失败'
			}
			return
		}
		
		// 拦截console.log
		console.log = (...args: any[]) => {
			logs.push(args.map(arg => 
				typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
			).join(' '))
			originalConsoleLog(...args)
		}
		
		// 执行代码
		// 检查代码是否已经是完整函数定义
		let codeToExecute = props.code.trim()
		if (codeToExecute.startsWith('function')) {
			// 如果是完整函数定义，需要先定义函数再调用
			codeToExecute = `${codeToExecute}; execute(node, graph, event);`
		}
		
		const func = new Function('node', 'graph', 'event', codeToExecute)
		
		// 使用原始节点执行代码（获取属性），但将修改应用到预览节点
		// 创建一个代理对象，读取操作访问原始节点，写入操作应用到预览节点
		const nodeProxy = new Proxy(props.selectedNode, {
			get(target, prop) {
				// 如果是 attr 方法，需要特殊处理
				if (prop === 'attr') {
					return function(...args: any[]) {
						if (args.length === 1) {
							// 读取属性，从原始节点读取
							return target.attr(args[0])
						} else {
							// 设置属性，应用到预览节点
							if (previewNode) {
								return previewNode.attr(args[0], args[1])
							}
							return undefined
						}
					}
				}
				// 其他属性和方法从原始节点获取
				return target[prop as keyof typeof target]
			}
		})
		
		const result = func(nodeProxy, graph, {})
		
		// 强制刷新视图
		if (previewNode && previewGraph) {
			// 触发重绘
			previewNode.removeTools()
			// 强制更新视图
			previewGraph.drawBackground()
			// 触发change事件
			previewNode.toJSON()
		}
		
		executionResult.value = {
			success: true,
			logs,
			result: result !== undefined ? (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)) : undefined
		}
	} catch (error: any) {
		executionResult.value = {
			success: false,
			logs,
			error: error.message || String(error)
		}
	} finally {
		// 恢复console.log
		console.log = originalConsoleLog
	}
}

const initPreviewGraph = async () => {
	if (!previewContainer.value || !props.selectedNode) {
		return
	}
	
	// 等待容器渲染
	await nextTick()
	
	// 检查容器尺寸
	const containerWidth = previewContainer.value.clientWidth
	const containerHeight = previewContainer.value.clientHeight
	
	if (containerWidth === 0 || containerHeight === 0) {
		return
	}
	
	// 清空容器
	previewContainer.value.innerHTML = ''
	
	// 销毁旧的graph
	if (previewGraph) {
		previewGraph.dispose()
		previewGraph = null
		previewNode = null
	}
	
	// 创建新的预览graph
	previewGraph = new Graph({
		container: previewContainer.value,
		width: containerWidth,
		height: Math.max(containerHeight - 100, 300), // 预留空间给控制台输出，最小300px
		background: {
			color: '#0f172a'
		},
		grid: {
			size: 10,
			visible: true,
			type: 'dot',
			args: {
				color: '#1e293b',
				thickness: 1
			}
		},
		interacting: false // 预览模式不允许交互
	})
	
	// 克隆当前节点
	const nodeData = props.selectedNode.toJSON()
	
	// 创建预览节点
	try {
		previewNode = previewGraph.addNode({
			...nodeData,
			position: {
				x: containerWidth / 2 - (nodeData.size?.width || 100) / 2,
				y: 100
			}
		})
	} catch (error) {
		console.error('添加预览节点失败:', error)
	}
}

defineExpose({
	previewContainer,
	DEFAULT_CODE
})
</script>

<style scoped>
@import '../../styles/components/CustomCodeDialog.css';
</style>
