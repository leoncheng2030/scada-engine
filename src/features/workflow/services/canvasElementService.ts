/**
 * 画布图元服务
 * 用于从组态设计器获取图元信息
 */

import type { Graph } from '@antv/x6'
import type { ElementInfo } from '../types/element'
import { componentRegistry } from '@/scada-components/registry'

/**
 * 画布图元服务类
 */
class CanvasElementService {
	private graph: Graph | null = null

	/**
	 * 设置画布实例
	 */
	setGraph(graph: Graph | null) {
		this.graph = graph
	}

	/**
	 * 获取画布所有图元
	 */
	async getElements(): Promise<ElementInfo[]> {
		if (!this.graph) {
			console.warn('画布实例未初始化')
			return []
		}

		const nodes = this.graph.getNodes()
		const elements = await Promise.all(nodes.map(async node => {
			const data = node.getData() || {}
			const componentType = data.type || node.shape
			const componentConfig = await componentRegistry.getComponent(componentType)

			// 获取图元属性列表
			const properties = this.getElementProperties(node, componentConfig)

			return {
				id: node.id,
				// 优先使用用户设置的组件名称
				name: data.componentName || node.getAttrByPath('label/text') || `图元_${node.id.slice(0, 8)}`,
				type: componentConfig?.metadata.name || componentType,
				icon: componentConfig?.metadata.icon || '📦',
				properties
			}
		}))
		
		return elements
	}

	/**
	 * 获取图元的可配置属性列表（仅返回组件 props 中定义的属性）
	 */
	private getElementProperties(_node: any, componentConfig: any): Array<{ key: string; label: string }> {
		const properties: Array<{ key: string; label: string }> = []
		const addedKeys = new Set<string>()

		// 仅从组件配置中获取属性
		if (componentConfig?.props) {
			componentConfig.props.forEach((prop: any) => {
				// 提取属性路径的最后一段作为属性名
				const pathParts = prop.path.split('.')
				const propertyKey = pathParts[pathParts.length - 1]
				if (propertyKey && !addedKeys.has(propertyKey)) {
					properties.push({
						key: propertyKey,
						label: prop.label || propertyKey // 使用配置中的标签，如果没有则使用key
					})
					addedKeys.add(propertyKey)
				}
			})
		}

		return properties
	}

	/**
	 * 根据ID获取图元
	 */
	async getElementById(id: string): Promise<ElementInfo | null> {
		const elements = await this.getElements()
		return elements.find(el => el.id === id) || null
	}

	/**
	 * 搜索图元
	 */
	async searchElements(keyword: string): Promise<ElementInfo[]> {
		const elements = await this.getElements()
		const lowerKeyword = keyword.toLowerCase()

		return elements.filter(el =>
			el.name.toLowerCase().includes(lowerKeyword) ||
			el.id.toLowerCase().includes(lowerKeyword) ||
			el.type.toLowerCase().includes(lowerKeyword)
		)
	}
}

// 导出单例
export const canvasElementService = new CanvasElementService()
