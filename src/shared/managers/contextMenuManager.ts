/**
 * 右键菜单管理器
 * 负责生成不同场景下的右键菜单项
 */

import type { MenuItem } from '../components/ContextMenu.vue'

/**
 * 右键菜单管理器类
 */
export class ContextMenuManager {
  /**
   * 生成节点右键菜单
   */
  getNodeMenuItems(): MenuItem[] {
    return [
      { key: 'delete', label: '删除', icon: '❌', hotkey: 'Delete' },
      { key: 'copy', label: '复制', icon: '📋', hotkey: 'Ctrl+C' },
      { key: 'divider1', divider: true },
      { key: 'to-front', label: '置于顶层', icon: '⬆️' },
      { key: 'to-back', label: '置于底层', icon: '⬇️' }
    ]
  }

  /**
   * 生成连线右键菜单
   */
  getEdgeMenuItems(): MenuItem[] {
    return [
      { key: 'delete', label: '删除', icon: '❌', hotkey: 'Delete' },
      { key: 'divider1', divider: true },
      { key: 'to-front', label: '置于顶层', icon: '⬆️' },
      { key: 'to-back', label: '置于底层', icon: '⬇️' }
    ]
  }

  /**
   * 生成画布右键菜单
   */
  getCanvasMenuItems(): MenuItem[] {
    return [
      { key: 'paste', label: '粘贴', icon: '📋', hotkey: 'Ctrl+V', disabled: true },
      { key: 'divider1', divider: true },
      { key: 'select-all', label: '全选', icon: '✅', hotkey: 'Ctrl+A' },
      { key: 'clear-all', label: '清空画布', icon: '🗑️' }
    ]
  }

  /**
   * 根据目标类型获取菜单项
   */
  getMenuItems(target: 'node' | 'edge' | 'canvas'): MenuItem[] {
    switch (target) {
      case 'node':
        return this.getNodeMenuItems()
      case 'edge':
        return this.getEdgeMenuItems()
      case 'canvas':
        return this.getCanvasMenuItems()
      default:
        return []
    }
  }
}

/**
 * 导出右键菜单管理器单例
 */
export const contextMenuManager = new ContextMenuManager()
