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
import * as BasicComponents from './basic'
import * as IoTComponents from './iot'

/**
 * 组件注册表
 */
class ComponentRegistryManager {
  private registry: ComponentRegistry = {}

  constructor() {
    this.registerDefaultComponents()
  }

  /**
   * 注册默认组件
   */
  private registerDefaultComponents() {
    // 注册基础组件
    this.register(BasicComponents.RectComponent)
    this.register(BasicComponents.CircleComponent)
    this.register(BasicComponents.TextComponent)

    // 注册IoT组件
    this.register(IoTComponents.LightComponent)
    this.register(IoTComponents.SwitchComponent)
    this.register(IoTComponents.EChartsGaugeComponent)
    this.register(IoTComponents.EChartsLineComponent)
    // 3D仿真工业组件
    this.register(IoTComponents.Motor3DComponent)
    this.register(IoTComponents.Valve3DComponent)
    this.register(IoTComponents.Tank3DComponent)
    this.register(IoTComponents.Pump3DComponent)
    // 3D仿真扩展组件
    this.register(IoTComponents.Conveyor3DComponent)
    this.register(IoTComponents.AlarmLight3DComponent)
    this.register(IoTComponents.TemperatureSensor3DComponent)
    this.register(IoTComponents.Cylinder3DComponent)
    // 3D仿真流体组件
    this.register(IoTComponents.Pipe3DComponent)
    this.register(IoTComponents.Filter3DComponent)
    this.register(IoTComponents.HeatExchanger3DComponent)
    this.register(IoTComponents.Tee3DComponent)
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
  }

  /**
   * 批量注册组件
   */
  registerBatch(configs: ComponentConfig[]): void {
    configs.forEach(config => this.register(config))
  }

  /**
   * 获取组件配置
   */
  getComponent(id: string): ComponentConfig | undefined {
    return this.registry[id]
  }

  /**
   * 通过shape获取组件配置
   */
  getComponentByShape(shape: string): ComponentConfig | undefined {
    return Object.values(this.registry).find(config => config.shape === shape)
  }

  /**
   * 获取所有组件
   */
  getAllComponents(): ComponentRegistry {
    return { ...this.registry }
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
    return Object.keys(this.registry).length
  }

  /**
   * 清空注册表
   */
  clear(): void {
    this.registry = {}
  }
}

// 导出单例
export const componentRegistry = new ComponentRegistryManager()

// 导出类型和接口
export type { ComponentConfig, ComponentRegistry, ComponentCategory }
export * from './types'
