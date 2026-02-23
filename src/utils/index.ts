/**
 * 工具函数统一导出
 * 便于其他模块使用
 * 
 * 注意：许多工具已移动到新的模块结构
 * - 共享工具 -> shared/utils/
 * - 共享管理器 -> shared/managers/
 * - 动画系统 -> shared/animation/
 * - Canvas操作 -> features/canvas/
 */

// === 从 shared 重新导出 ===
// 共享工具
export * from '../shared/utils/nodePropertyUtils'
export * from '../shared/utils/eventUtils'
export * from '../shared/utils/storageUtils'
export * from '../shared/utils/fileUtils'
export * from '../shared/utils/commonUtils'
export * from '../shared/utils/messageUtils'

// 共享管理器
export * from '../shared/managers/eventManager'
export * from '../shared/managers/contextMenuManager'
export * from '../shared/managers/workerManager'

// 动画系统
export * from '../shared/animation/animationScheduler'

// === 从 features/canvas 重新导出 ===
export * from '../features/canvas/operations/graphOperations'
export * from '../features/canvas/operations/nodeOperations'
export * from '../features/canvas/operations/edgeOperations'
// dataHandler 由事件管理器动态导入，不在此静态导出以避免打包冲突
export * from '../features/canvas/managers/configWatcher'
export * from '../features/canvas/managers/layerManager'

// === 从 features/data-source 重新导出 ===
export * from '../features/data-source/services/dataBindingService'

// === 保留在 utils 中的文件 ===
export * from './viewportCulling'
export * from './dracoLoader'
export * from './authCrypto'
