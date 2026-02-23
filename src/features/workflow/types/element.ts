/**
 * 画布图元类型定义
 */

/**
 * 图元信息
 */
export interface ElementInfo {
	id: string
	name: string
	type: string
	icon: string
	properties: Array<{ key: string; label: string }>
}
