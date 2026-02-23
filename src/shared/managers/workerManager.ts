/**
 * Worker 管理器
 * 管理 WebWorker 生命周期和消息通信
 */

import type { WorkerMessage, WorkerResponse } from '../../workers/dataProcessor.worker'
import { WorkerMessageType } from '../../workers/dataProcessor.worker'

interface PendingTask {
  resolve: (result: any) => void
  reject: (error: Error) => void
  timeout: number
}

export class WorkerManager {
  private worker: Worker | null = null
  private pendingTasks = new Map<string, PendingTask>()
  private messageIdCounter = 0
  private readonly TASK_TIMEOUT = 5000 // 5秒超时

  /**
   * 初始化 Worker
   */
  init(): void {
    if (this.worker) return

    try {
      // 在库模式下不初始化 Worker，由上层应用自行处理
      // 如果需要使用 Worker，请在业务代码中手动创建
      console.warn('[WorkerManager] Worker 未初始化，将使用主线程处理数据')
    } catch (error) {
      console.error('[WorkerManager] Worker 初始化失败:', error)
      console.warn('[WorkerManager] 将使用主线程处理数据')
    }
  }

  /**
   * 处理 Worker 消息
   */
  private handleMessage = (event: MessageEvent<WorkerResponse>): void => {
    const { id, type, result, error } = event.data

    const task = this.pendingTasks.get(id)
    if (!task) return

    // 清除超时定时器
    clearTimeout(task.timeout)
    this.pendingTasks.delete(id)

    if (type === WorkerMessageType.ERROR || error) {
      task.reject(new Error(error || '未知错误'))
    } else {
      task.resolve(result)
    }
  }

  /**
   * 处理 Worker 错误
   */
  private handleError = (error: ErrorEvent): void => {
    console.error('[WorkerManager] Worker 错误:', error)

    // 拒绝所有待处理任务
    this.pendingTasks.forEach(task => {
      clearTimeout(task.timeout)
      task.reject(new Error('Worker 执行错误'))
    })
    this.pendingTasks.clear()
  }

  /**
   * 发送消息到 Worker
   */
  private sendMessage<T>(type: WorkerMessageType, payload: any): Promise<T> {
    return new Promise((resolve, reject) => {
      // 如果 Worker 未初始化,回退到主线程
      if (!this.worker) {
        console.warn('[WorkerManager] Worker 不可用,使用主线程处理')
        resolve(this.fallbackProcess(type, payload))
        return
      }

      const id = `task_${++this.messageIdCounter}`

      // 设置超时
      const timeout = window.setTimeout(() => {
        this.pendingTasks.delete(id)
        reject(new Error(`任务超时: ${type}`))
      }, this.TASK_TIMEOUT)

      // 记录待处理任务
      this.pendingTasks.set(id, { resolve, reject, timeout })

      // 发送消息
      const message: WorkerMessage = { id, type, payload }
      this.worker.postMessage(message)
    })
  }

  /**
   * 主线程回退处理
   */
  private fallbackProcess(type: WorkerMessageType, payload: any): any {
    // 简化的主线程实现
    switch (type) {
      case WorkerMessageType.PARSE_DEVICE_DATA:
        return payload // 直接返回

      case WorkerMessageType.TRANSFORM_BINDING_DATA:
        return [] // 返回空数组

      case WorkerMessageType.BATCH_CALCULATE:
        return []

      default:
        return null
    }
  }

  /**
   * 解析设备数据
   */
  async parseDeviceData(rawData: any): Promise<any> {
    return this.sendMessage(WorkerMessageType.PARSE_DEVICE_DATA, rawData)
  }

  /**
   * 转换绑定数据
   */
  async transformBindingData(bindings: any[], deviceData: any): Promise<any[]> {
    return this.sendMessage(WorkerMessageType.TRANSFORM_BINDING_DATA, {
      bindings,
      deviceData
    })
  }

  /**
   * 批量计算
   */
  async batchCalculate(calculations: Array<{ type: string; params: any }>): Promise<any[]> {
    return this.sendMessage(WorkerMessageType.BATCH_CALCULATE, { calculations })
  }

  /**
   * 获取 Worker 状态
   */
  getStatus(): {
    isActive: boolean
    pendingTasks: number
  } {
    return {
      isActive: this.worker !== null,
      pendingTasks: this.pendingTasks.size
    }
  }

  /**
   * 终止 Worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }

    // 拒绝所有待处理任务
    this.pendingTasks.forEach(task => {
      clearTimeout(task.timeout)
      task.reject(new Error('Worker 已终止'))
    })
    this.pendingTasks.clear()

    console.log('[WorkerManager] Worker 已终止')
  }
}

// 导出单例
export const workerManager = new WorkerManager()

// 自动初始化
if (typeof window !== 'undefined') {
  workerManager.init()
}

// 开发模式调试
if (import.meta.env.DEV) {
  ;(window as any).__workerManager__ = workerManager
  console.log('💡 开发模式: 可通过 window.__workerManager__ 访问 Worker 管理器')
}
