/**
 * 统一动画调度器
 * 解决多个组件独立使用 requestAnimationFrame 导致的性能问题
 * 
 * 优势:
 * 1. 统一时间步进,避免动画不同步
 * 2. 减少 RAF 调用次数,降低浏览器开销
 * 3. 集中管理所有动画,便于调试和性能监控
 * 4. 支持动画暂停/恢复/销毁
 */

export interface AnimationTask {
  id: string
  callback: (deltaTime: number, currentTime: number) => void
  enabled: boolean
  lastTime: number
}

class AnimationScheduler {
  private tasks: Map<string, AnimationTask> = new Map()
  private rafId: number | null = null
  private isRunning: boolean = false
  private lastFrameTime: number = 0
  private frameCount: number = 0
  private fpsUpdateTime: number = 0
  private currentFps: number = 0

  /**
   * 注册动画任务
   * @param id 唯一标识符(通常使用组件 nodeId)
   * @param callback 动画回调函数 (deltaTime: 距上次调用的毫秒数, currentTime: 当前时间戳)
   */
  register(id: string, callback: (deltaTime: number, currentTime: number) => void): void {
    const task: AnimationTask = {
      id,
      callback,
      enabled: true,
      lastTime: performance.now()
    }
    
    this.tasks.set(id, task)
    
    console.log(`[AnimationScheduler] 注册动画任务: ${id}, 当前任务数: ${this.tasks.size}`)
    
    // 如果是第一个任务,启动调度器
    if (!this.isRunning) {
      this.start()
    }
  }

  /**
   * 注销动画任务
   * @param id 任务标识符
   */
  unregister(id: string): void {
    if (this.tasks.delete(id)) {
      console.log(`[AnimationScheduler] 注销动画任务: ${id}, 剩余任务数: ${this.tasks.size}`)
    }
    
    // 如果没有任务了,停止调度器
    if (this.tasks.size === 0) {
      this.stop()
    }
  }

  /**
   * 启用/禁用特定任务
   * @param id 任务标识符
   * @param enabled 是否启用
   */
  setEnabled(id: string, enabled: boolean): void {
    const task = this.tasks.get(id)
    if (task) {
      task.enabled = enabled
      // 重置时间戳,避免大的 deltaTime 跳变
      if (enabled) {
        task.lastTime = performance.now()
      }
    }
  }

  /**
   * 启动调度器
   */
  private start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.lastFrameTime = performance.now()
    this.fpsUpdateTime = this.lastFrameTime
    this.frameCount = 0
    
    console.log('[AnimationScheduler] 🎬 启动调度器')
    
    this.tick()
  }

  /**
   * 停止调度器
   */
  private stop(): void {
    if (!this.isRunning) return
    
    this.isRunning = false
    
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    
    console.log('[AnimationScheduler] ⏹️ 停止调度器')
  }

  /**
   * 动画帧循环
   */
  private tick = (): void => {
    if (!this.isRunning) return
    
    const currentTime = performance.now()
    
    // 计算 FPS (每秒更新一次)
    this.frameCount++
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (currentTime - this.fpsUpdateTime))
      this.frameCount = 0
      this.fpsUpdateTime = currentTime
    }
    
    // 执行所有启用的任务
    this.tasks.forEach((task) => {
      if (!task.enabled) return
      
      try {
        const deltaTime = currentTime - task.lastTime
        task.callback(deltaTime, currentTime)
        task.lastTime = currentTime
      } catch (error) {
        console.error(`[AnimationScheduler] 任务执行错误: ${task.id}`, error)
      }
    })
    
    // 调度下一帧
    this.rafId = requestAnimationFrame(this.tick)
  }

  /**
   * 获取当前 FPS
   */
  getFps(): number {
    return this.currentFps
  }

  /**
   * 获取活跃任务数量
   */
  getActiveTaskCount(): number {
    let count = 0
    this.tasks.forEach(task => {
      if (task.enabled) count++
    })
    return count
  }

  /**
   * 暂停所有动画
   */
  pauseAll(): void {
    this.tasks.forEach(task => {
      task.enabled = false
    })
    console.log('[AnimationScheduler] ⏸️ 暂停所有动画')
  }

  /**
   * 恢复所有动画
   */
  resumeAll(): void {
    const currentTime = performance.now()
    this.tasks.forEach(task => {
      task.enabled = true
      task.lastTime = currentTime // 重置时间避免跳变
    })
    console.log('[AnimationScheduler] ▶️ 恢复所有动画')
  }

  /**
   * 清除所有任务并停止调度器
   */
  destroy(): void {
    console.log('[AnimationScheduler] 🗑️ 销毁调度器')
    this.stop()
    this.tasks.clear()
  }

  /**
   * 获取调度器状态(用于调试)
   */
  getStatus(): {
    isRunning: boolean
    taskCount: number
    activeTaskCount: number
    fps: number
  } {
    return {
      isRunning: this.isRunning,
      taskCount: this.tasks.size,
      activeTaskCount: this.getActiveTaskCount(),
      fps: this.currentFps
    }
  }
}

// 导出单例
export const animationScheduler = new AnimationScheduler()

// 开发模式下暴露到全局,方便调试
if (import.meta.env.DEV) {
  ;(window as any).__animationScheduler__ = animationScheduler
  console.log('💡 开发模式: 可通过 window.__animationScheduler__ 访问调度器')
}
