/**
 * 画布数据处理工具类
 * 负责画布数据的导入、导出、保存、清理等操作
 */

import type { Graph } from '@antv/x6'
import { canvasConfigManager } from '../../../scada-components/canvas'
import { saveToLocal, loadFromLocal, removeFromLocal, STORAGE_KEYS } from '../../../shared/utils/storageUtils'
import { formatTimestamp, getCurrentTimestamp } from '../../../shared/utils/commonUtils'
import { showMessage } from '../../../shared/utils/messageUtils'
import { dataSourceManager } from '../../data-source/services/dataSourceManager'

/**
 * 画布数据接口
 */
export interface CanvasData {
  version?: string
  timestamp?: string
  config?: any
  cells: any[]
  nodes?: any[]
  edges?: any[]
  dataSources?: any[]
  workflows?: any[]
}

/**
 * 画布数据处理类
 */
export class CanvasDataHandler {
  private graph: Graph | null = null

  /**
   * 设置 Graph 实例
   */
  setGraph(graph: Graph | null) {
    this.graph = graph
  }

  /**
   * 保存画布数据到 localStorage
   */
  saveToLocal(): boolean {
    if (!this.graph) return false
    
    try {
      const canvasData: CanvasData = {
        cells: this.graph.toJSON().cells,
        // 保存数据源配置
        dataSources: dataSourceManager.getAllDataSources().map(ds => ({
          id: ds.id,
          name: ds.name,
          type: ds.type,
          enabled: ds.enabled,
          config: ds.config
        }))
      }
      
      saveToLocal(STORAGE_KEYS.SCADA_EDITOR_DATA, canvasData)
      return true
    } catch (error) {
      console.error('保存画布数据失败:', error)
      return false
    }
  }

  /**
   * 从 localStorage 加载画布数据
   */
  loadFromLocal(onEdgeAnimationRestore?: (edge: any) => void): boolean {
    if (!this.graph) return false
    
    try {
      const savedCanvasData = loadFromLocal<CanvasData>(STORAGE_KEYS.SCADA_EDITOR_DATA)
      if (!savedCanvasData?.cells?.length) return false
      
      // 清理可能损坏的数据
      const cleanedCells = this.cleanCellsData(savedCanvasData.cells)
      this.graph.fromJSON({ cells: cleanedCells })
      
      // 恢复边动画
      if (onEdgeAnimationRestore) {
        this.graph.getEdges().forEach((edge: any) => {
          const edgeData = edge.getData()
          if (edgeData?.animation?.enabled) {
            onEdgeAnimationRestore(edge)
          }
        })
      }
      
      return true
    } catch (error) {
      console.error('恢复画布数据失败，清空缓存:', error)
      removeFromLocal(STORAGE_KEYS.SCADA_EDITOR_DATA)
      return false
    }
  }

  /**
   * 清理单元格数据（修复损坏的数据）
   */
  private cleanCellsData(cells: any[]): any[] {
    return cells.map((cell: any) => {
      // 确保 position 是有效的坐标对象
      if (cell.position && typeof cell.position === 'object') {
        if (typeof cell.position.x !== 'number' || typeof cell.position.y !== 'number') {
          cell.position = { x: 100, y: 100 }
        }
      }
      
      // 修正连线路由算法：将 manhattan 改为 orth
      if (cell.shape === 'edge' || cell.shape === 'animated-edge') {
        if (cell.router === 'manhattan' || cell.router?.name === 'manhattan') {
          cell.router = {
            name: 'orth',
            args: {
              padding: 10
            }
          }
        }
      }
      
      return cell
    })
  }

  /**
   * 导出完整的画布数据（包含配置、节点、边、数据源等）
   */
  exportData(): CanvasData | null {
    if (!this.graph) return null
    
    try {
      const exportData: CanvasData = {
        version: '1.0.0',
        timestamp: formatTimestamp(getCurrentTimestamp()),
        config: {
          size: canvasConfigManager.getConfig().size,
          background: canvasConfigManager.getConfig().background,
          grid: canvasConfigManager.getConfig().grid,
          guides: canvasConfigManager.getConfig().guides,
          magnetism: canvasConfigManager.getConfig().magnetism,
          zoom: canvasConfigManager.getConfig().zoom
        },
        cells: this.graph.toJSON().cells,
        nodes: this.graph.getNodes().map(node => ({
          id: node.id,
          type: node.shape,
          position: node.getPosition(),
          size: node.getSize(),
          label: node.attr('label/text'),
          data: node.getData()
        })),
        edges: this.graph.getEdges().map(edge => ({
          id: edge.id,
          source: edge.getSourceCellId(),
          target: edge.getTargetCellId()
        })),
        dataSources: dataSourceManager.getAllDataSources().map(ds => ({
          id: ds.id,
          name: ds.name,
          type: ds.type,
          enabled: ds.enabled,
          config: ds.config
        })),
        workflows: []
      }
      
      // 收集被引用的流程
      exportData.workflows = this.collectReferencedWorkflows()
      
      return exportData
    } catch (error) {
      console.error('导出数据失败:', error)
      return null
    }
  }

  /**
   * 收集所有被引用的流程
   */
  private collectReferencedWorkflows(): any[] {
    if (!this.graph) return []
    
    // 收集所有节点中引用的流程ID
    const referencedWorkflowIds = new Set<string>()
    this.graph.getNodes().forEach(node => {
      const nodeData = node.getData()
      if (nodeData?.events && Array.isArray(nodeData.events)) {
        nodeData.events.forEach((event: any) => {
          if (event.action === 'callProcess' && event.params?.processId) {
            referencedWorkflowIds.add(event.params.processId)
          }
        })
      }
    })
    
    // 从localStorage加载被引用的流程数据
    if (referencedWorkflowIds.size === 0) return []
    
    try {
      const stored = localStorage.getItem('saved-workflows')
      if (stored) {
        const allWorkflows = JSON.parse(stored)
        return allWorkflows.filter((wf: any) => referencedWorkflowIds.has(wf.id))
      }
    } catch (error) {
      console.error('加载流程数据失败:', error)
    }
    
    return []
  }

  /**
   * 导入画布数据
   */
  importData(
    importData: CanvasData,
    onEdgeAnimationRestore?: (edge: any) => void
  ): boolean {
    if (!this.graph) return false
    
    try {
      // 验证数据结构
      if (!importData.cells) {
        showMessage('无效的JSON文件格式', 'error')
        return false
      }
      
      if (!confirm('导入将清空当前画布,是否继续?')) {
        return false
      }
      
      // 清空当前画布
      this.graph.clearCells()
      
      // 加载导入的数据
      this.graph.fromJSON({ cells: importData.cells })
      
      // 导入后，对所有启用了动画的连线应用动画
      if (onEdgeAnimationRestore) {
        this.graph.getEdges().forEach((edge: any) => {
          const edgeData = edge.getData()
          if (edgeData?.animation?.enabled) {
            onEdgeAnimationRestore(edge)
          }
        })
      }
      
      // 如果有配置信息，应用配置
      if (importData.config) {
        canvasConfigManager.updateConfig(importData.config)
      }
      
      // 导入数据源配置
      this.importDataSources(importData.dataSources)
      
      // 导入流程数据
      const workflowResult = this.importWorkflows(importData.workflows)
      
      // 显示导入结果
      if (workflowResult.imported > 0 || workflowResult.updated > 0) {
        showMessage(
          `导入成功 画布已加载，流程: 新增${workflowResult.imported}个，更新${workflowResult.updated}个`,
          'success'
        )
      } else {
        showMessage('导入成功', 'success')
      }
      
      return true
    } catch (error) {
      console.error('导入失败', error)
      showMessage('导入失败，JSON格式错误', 'error')
      return false
    }
  }

  /**
   * 导入数据源配置
   */
  private importDataSources(dataSources?: any[]): void {
    if (!dataSources || !Array.isArray(dataSources)) return
    
    // 清空现有数据源
    dataSourceManager.disconnectAll()
    dataSourceManager.getAllDataSources().forEach(ds => {
      dataSourceManager.removeDataSource(ds.id)
    })
    
    // 添加导入的数据源
    dataSources.forEach((dsConfig: any) => {
      const newDataSource = {
        id: dsConfig.id,
        name: dsConfig.name,
        type: dsConfig.type,
        enabled: dsConfig.enabled,
        config: dsConfig.config,
        devices: [],
        status: { connected: false }
      }
      dataSourceManager.addDataSource(newDataSource)
    })
    
    console.log(`[CanvasDataHandler] 已导入 ${dataSources.length} 个数据源`)
  }

  /**
   * 导入流程数据
   */
  private importWorkflows(workflows?: any[]): { imported: number; updated: number } {
    if (!workflows || !Array.isArray(workflows) || workflows.length === 0) {
      return { imported: 0, updated: 0 }
    }
    
    try {
      const stored = localStorage.getItem('saved-workflows')
      const existingWorkflows = stored ? JSON.parse(stored) : []
      
      let importedCount = 0
      let updatedCount = 0
      
      // 合并流程数据
      workflows.forEach((newWf: any) => {
        const existIndex = existingWorkflows.findIndex((wf: any) => wf.id === newWf.id)
        if (existIndex >= 0) {
          // 更新现有流程
          existingWorkflows[existIndex] = {
            ...newWf,
            updatedAt: Date.now()
          }
          updatedCount++
        } else {
          // 添加新流程
          existingWorkflows.push(newWf)
          importedCount++
        }
      })
      
      // 保存回 localStorage
      localStorage.setItem('saved-workflows', JSON.stringify(existingWorkflows))
      
      return { imported: importedCount, updated: updatedCount }
    } catch (error) {
      console.error('导入流程数据失败:', error)
      showMessage('画布导入成功, 但流程数据导入失败', 'warning')
      return { imported: 0, updated: 0 }
    }
  }

  /**
   * 导出为 JSON 文件
   */
  exportToFile(filename?: string): string | null {
    const exportData = this.exportData()
    if (!exportData) return null
    
    try {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const finalFilename = filename || `scada-export-${Date.now()}.json`
      link.href = url
      link.download = finalFilename
      link.click()
      URL.revokeObjectURL(url)
      
      return finalFilename
    } catch (error) {
      console.error('导出文件失败:', error)
      return null
    }
  }

  /**
   * 清除画布数据缓存
   */
  clearCache(): void {
    removeFromLocal(STORAGE_KEYS.SCADA_EDITOR_DATA)
  }

  /**
   * 获取画布完整数据（不包含workflows）
   */
  getCanvasData(): CanvasData | null {
    if (!this.graph) return null
    
    return {
      version: '1.0.0',
      timestamp: formatTimestamp(getCurrentTimestamp()),
      config: canvasConfigManager.getConfig(),
      cells: this.graph.toJSON().cells,
      nodes: this.graph.getNodes().map(node => ({
        id: node.id,
        type: node.shape,
        position: node.getPosition(),
        size: node.getSize(),
        label: node.attr('label/text'),
        data: node.getData()
      })),
      edges: this.graph.getEdges().map(edge => ({
        id: edge.id,
        source: edge.getSourceCellId(),
        target: edge.getTargetCellId()
      }))
    }
  }
}

// 导出单例
export const canvasDataHandler = new CanvasDataHandler()
