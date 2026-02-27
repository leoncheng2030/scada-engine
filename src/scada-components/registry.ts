/**
 * Copyright (c) 2025 leoncheng
 * 
 * This source code is licensed under the proprietary license found in the
 * LICENSE file in the root directory of this source tree.
 * 
 * @author leoncheng
 * @email nywqs@outlook.com
 */

import type { ComponentRegistry, ComponentConfig, ComponentCategory } from './types'
import * as IoTComponents from './chart'
import { register } from '@antv/x6-vue-shape'
import { reactive } from 'vue'

// 组件懒加载配置
type ComponentLoader = () => Promise<{ default: ComponentConfig }>

interface LazyComponentEntry {
  config?: ComponentConfig
  loader?: ComponentLoader
  loading: boolean
  loaded: boolean
}

/**
 * 组件注册表
 */
class ComponentRegistryManager {
  private registry: ComponentRegistry = reactive({})
  private lazyRegistry = new Map<string, LazyComponentEntry>()
  private loadingPromises = new Map<string, Promise<ComponentConfig>>()

  constructor() {
    this.registerDefaultComponents()
    this.registerLazyComponents()
  }

  /**
   * 注册默认组件(立即加载)
   */
  private registerDefaultComponents() {
    // 基础组件（rect/circle/text）由 SVG 示例加载，见 loadExampleSvgComponents
    // IoT 组件（light/switch/valve/tank 等）也由 SVG 示例加载
    // 所有 3D 工业组件已迁移为 SVG，删除 industrial-3d 系列

    // ECharts 组件(立即加载)
    this.register(IoTComponents.EChartsGaugeComponent)
    this.register(IoTComponents.EChartsLineComponent)
  }
  
  /**
   * 注册懒加载组件（零配置 - 基于约定自动发现）
   * 约定：所有 iot/industrial-* 目录下的 index.ts 文件自动注册为懒加载组件
   * 策略：延迟加载 - 首次请求组件时才加载整个模块，并注册模块内的所有组件
   */
  private registerLazyComponents() {
    // 使用 Vite 的 import.meta.glob 扫描所有符合约定的模块文件
    // eager: false 表示返回 import 函数，不立即加载
    const lazyModuleLoaders = import.meta.glob('./iot/industrial-*/index.ts', { eager: false })
    
    // 为每个模块创建一个延迟加载的标记
    Object.entries(lazyModuleLoaders).forEach(([modulePath, importFn]) => {
      const moduleKey = `__module__${modulePath}`
      
      // 注册模块级别的懒加载
      this.lazyRegistry.set(moduleKey, {
        loader: async () => {
          const module = await importFn() as any
          
          // 加载后，自动提取并注册模块中的所有组件
          Object.values(module).forEach((exported: any) => {
            if (exported && typeof exported === 'object' && exported.metadata) {
              const component = exported as ComponentConfig
              const id = component.metadata.id
              
              // 直接注册到主注册表
              if (!this.registry[id]) {
                this.registry[id] = component
                this.registerVueShape(component)
              }
            }
          })
          
          return { default: {} as ComponentConfig }
        },
        loading: false,
        loaded: false
      })
    })
  }

  /**
   * 注册 Vue Shape 到 X6
   */
  private registerVueShape(config: ComponentConfig): void {
    // 只注册包含 component 字段的组件（Vue Shape）
    if (config.component) {
      try {
        register({
          shape: config.shape,
          width: config.width,
          height: config.height,
          component: config.component,
          ports: config.ports
        })
      } catch (error) {
        // 忽略重复注册错误
        // X6 内部会抛出重复注册的警告
      }
    }
  }

  getRegistry(): ComponentRegistry {
    return this.registry;
  }
  
  /**
   * 注册组件
   */
  register(config: ComponentConfig): void {
    const { id } = config.metadata
    
    if (this.registry[id]) {
      console.warn(`组件 ${id} 已存在,将被覆盖`)
    }

    this.registry[id] = config
    
    // 自动注册 Vue Shape（如果有）
    this.registerVueShape(config)
  }
  
  /**
   * 注册懒加载组件
   */
  registerLazy(id: string, loader: ComponentLoader): void {
    if (this.lazyRegistry.has(id)) {
      console.warn(`懒加载组件 ${id} 已存在,将被覆盖`)
    }
    
    this.lazyRegistry.set(id, {
      loader,
      loading: false,
      loaded: false
    })
  }

  /**
   * 批量注册组件
   */
  registerBatch(configs: ComponentConfig[]): void {
    configs.forEach(config => this.register(config))
  }

  /**
   * 获取组件配置(支持懒加载)
   */
  async getComponent(id: string): Promise<ComponentConfig | undefined> {
    // 先查找已加载的组件
    if (this.registry[id]) {
      return this.registry[id]
    }
    
    // 查找懒加载组件
    const lazyEntry = this.lazyRegistry.get(id)
    if (lazyEntry) {
      return this.loadComponent(id, lazyEntry)
    }
    
    return undefined
  }
  
  /**
   * 同步获取组件(仅已加载的)
   */
  getComponentSync(id: string): ComponentConfig | undefined {
    return this.registry[id]
  }
  
  /**
   * 加载懒加载组件
   */
  private async loadComponent(id: string, entry: LazyComponentEntry): Promise<ComponentConfig | undefined> {
    // 如果已加载,直接返回
    if (entry.loaded && entry.config) {
      return entry.config
    }
    
    // 如果正在加载,等待加载完成
    if (entry.loading) {
      const promise = this.loadingPromises.get(id)
      if (promise) {
        return promise
      }
    }
    
    // 开始加载
    entry.loading = true
    
    const loadPromise = (async () => {
      try {
        if (!entry.loader) {
          throw new Error(`组件 ${id} 没有 loader`)
        }
        
        const module = await entry.loader()
        const config = module.default
        
        // 保存到注册表
        entry.config = config
        entry.loaded = true
        entry.loading = false
        this.registry[id] = config
        
        // 懒加载组件也需要注册 Vue Shape
        this.registerVueShape(config)
        
        this.loadingPromises.delete(id)
        
        return config
      } catch (error) {
        entry.loading = false
        this.loadingPromises.delete(id)
        console.error(`[懒加载] 组件 ${id} 加载失败:`, error)
        throw error
      }
    })()
    
    this.loadingPromises.set(id, loadPromise)
    
    return loadPromise
  }
  
  /**
   * 预加载组件
   */
  async preloadComponent(id: string): Promise<boolean> {
    const lazyEntry = this.lazyRegistry.get(id)
    if (!lazyEntry || lazyEntry.loaded) {
      return false
    }
    
    try {
      await this.loadComponent(id, lazyEntry)
      return true
    } catch (error) {
      return false
    }
  }
  
  /**
   * 批量预加载组件
   */
  async preloadComponents(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => this.preloadComponent(id)))
  }
  
  /**
   * 预加载所有组件
   * 包括模块级别的懒加载（以 __module__ 开头）
   */
  async preloadAllComponents(): Promise<void> {
    const lazyKeys = Array.from(this.lazyRegistry.keys())
    
    // 分离模块级别和组件级别的懒加载
    const moduleKeys = lazyKeys.filter(key => key.startsWith('__module__'))
    const componentKeys = lazyKeys.filter(key => !key.startsWith('__module__'))
    
    // 先加载所有模块（会自动注册模块内的组件）
    await Promise.all(
      moduleKeys.map(async (key) => {
        const entry = this.lazyRegistry.get(key)
        if (entry && !entry.loaded) {
          try {
            await entry.loader!()
            entry.loaded = true
          } catch (error) {
            console.error(`[预加载] 模块 ${key} 加载失败:`, error)
          }
        }
      })
    )
    
    // 再加载剩余的组件级别懒加载
    await this.preloadComponents(componentKeys)
  }

  /**
   * 通过shape获取组件配置
   */
  getComponentByShape(shape: string): ComponentConfig | undefined {
    return Object.values(this.registry).find(config => config.shape === shape)
  }

  /**
   * 获取所有组件(仅已加载)
   */
  getAllComponents(): ComponentRegistry {
    return { ...this.registry }
  }
  
  /**
   * 获取所有组件ID(包括未加载)
   */
  getAllComponentIds(): string[] {
    const loadedIds = Object.keys(this.registry)
    const lazyIds = Array.from(this.lazyRegistry.keys())
    return [...new Set([...loadedIds, ...lazyIds])]
  }

  /**
   * 按分类获取组件
   */
  getComponentsByCategory(category: ComponentCategory): ComponentConfig[] {
    return Object.values(this.registry).filter(
      config => config.metadata.category === category
    )
  }

  /**
   * 获取组件列表
   */
  getComponentList(): ComponentConfig[] {
    return Object.values(this.registry)
  }

  /**
   * 检查组件是否存在
   */
  hasComponent(id: string): boolean {
    return id in this.registry
  }

  /**
   * 注销组件
   */
  unregister(id: string): boolean {
    if (this.registry[id]) {
      delete this.registry[id]
      return true
    }
    console.warn(`组件 ${id} 不存在`)
    return false
  }

  /**
   * 获取组件数量
   */
  getCount(): number {
    return Object.keys(this.registry).length + this.lazyRegistry.size
  }
  
  /**
   * 获取已加载组件数量
   */
  getLoadedCount(): number {
    return Object.keys(this.registry).length
  }
  
  /**
   * 获取懒加载统计
   */
  getLazyLoadStats(): {
    total: number
    loaded: number
    pending: number
    loadRate: string
  } {
    const total = this.lazyRegistry.size
    const loaded = Array.from(this.lazyRegistry.values()).filter(e => e.loaded).length
    const pending = total - loaded
    const loadRate = total > 0 ? ((loaded / total) * 100).toFixed(1) : '0.0'
    
    return { total, loaded, pending, loadRate: `${loadRate}%` }
  }

  /**
   * 清空注册表
   */
  clear(): void {
    this.registry = reactive({})
  }

  /**
   * 按分类获取组件
   */
  getComponentsByCustomCategory(): Map<string | undefined, ComponentConfig[]> {
    let componentCategoryMap: Map<string, ComponentConfig[]> = new Map();

    for (let i in this.registry) {
      let custom_category_name = this.registry[i].metadata.custom_category_name;
      if (custom_category_name == undefined) {
        continue
      }
      let category = this.registry[i].metadata.category;
      if (category != 'custom') {
        continue
      }
      let componentCategoryList = componentCategoryMap.get(custom_category_name)
      if (!componentCategoryList) {
        componentCategoryMap.set(custom_category_name, [])
      }
      componentCategoryMap.get(custom_category_name)?.push(this.registry[i])
    }

    return componentCategoryMap
  }
}

// 导出单例
export const componentRegistry = new ComponentRegistryManager()

// 导出类型和接口
export type { ComponentConfig, ComponentRegistry, ComponentCategory }
export * from './types'
