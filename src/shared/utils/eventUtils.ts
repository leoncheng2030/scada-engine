/**
 * 事件处理工具函数
 * 用于处理节点事件的条件检查和动作执行
 */

import { getNodePropertyValue, setNodePropertyValue } from './nodePropertyUtils'

/**
 * 检查事件触发条件
 * @param node X6 节点
 * @param event 事件配置
 * @returns 条件是否满足
 */
export const checkEventCondition = (node: any, event: any): boolean => {
  // 如果是 always，直接返回true
  if (event.conditionType === 'always') {
    return true
  }
  
  // 如果有condition字段，检查属性值
  if (event.condition && event.condition.attribute) {
    const currentValue = getNodePropertyValue(node, event.condition.attribute)
    const matched = currentValue === event.condition.value
    console.log(`条件检查: ${event.condition.attribute} = ${currentValue}, 期望: ${event.condition.value}, 结果: ${matched}`)
    return matched
  }
  
  return false
}

/**
 * 执行属性变更动作
 * @param node X6 节点
 * @param params 动作参数
 */
export const executeAttributeChange = (node: any, params: any): void => {
  if (!params?.attributeGroups) return
  
  params.attributeGroups.forEach((group: any) => {
    const targetNode = group.target === 'current' ? node : null
    if (targetNode) {
      setNodePropertyValue(targetNode, group.property, group.value)
    }
  })
}

/**
 * 执行自定义代码动作
 * @param node X6 节点
 * @param event 事件配置
 * @param params 动作参数
 */
export const executeCustomCode = (node: any, event: any, params: any): void => {
  if (!params?.code) return
  
  try {
    // eslint-disable-next-line no-new-func
    const func = new Function('node', 'event', params.code)
    func(node, event)
  } catch (error) {
    console.error('自定义代码执行失败:', error)
  }
}

/**
 * 执行调用流程动作
 * @param node X6 节点
 * @param event 事件配置
 * @param params 动作参数
 */
export const executeCallProcess = (node: any, _event: any, params: any): void => {
  if (!params?.processId || !params?.processData) {
    console.error('流程配置不完整:', params)
    return
  }
  
  try {
    console.log('开始执行流程:', params.processName || params.processId)
    
    // 解析传入参数
    let processParams: any = {}
    if (params.processParams) {
      try {
        processParams = JSON.parse(params.processParams)
      } catch (e) {
        console.error('流程参数解析失败:', e)
      }
    }
    
    // TODO: 实现流程执行引擎
    // 这里需要根据 params.processData 中的流程图数据，
    // 逐个执行流程节点，处理条件分支、循环等逻辑
    console.log('流程数据:', params.processData)
    console.log('传入参数:', processParams)
    
    // 发布流程执行事件
    const workflowEvent = new CustomEvent('workflow-execute', {
      detail: {
        processId: params.processId,
        processName: params.processName,
        processData: params.processData,
        params: processParams,
        triggerNode: node
      }
    })
    window.dispatchEvent(workflowEvent)
    
  } catch (error) {
    console.error('流程执行失败:', error)
  }
}

/**
 * 执行事件动作
 * @param node X6 节点
 * @param event 事件配置
 */
export const executeEvent = (node: any, event: any): void => {
  if (!event.action) return

  console.log('执行事件动作:', event.action, event.params)

  switch (event.action) {
    case 'attributeChange':
      executeAttributeChange(node, event.params)
      break

    case 'customCode':
      executeCustomCode(node, event, event.params)
      break

    case 'callProcess':
      executeCallProcess(node, event, event.params)
      break

    default:
      console.warn('未知的事件动作:', event.action)
  }
}

/**
 * 为节点注册事件监听器
 * @param graph X6 Graph 实例
 * @param node X6 节点
 */
export const registerNodeEvents = (graph: any, node: any): void => {
  const nodeData = node.getData()
  if (!nodeData?.events || !Array.isArray(nodeData.events)) return

  // 遍历所有事件配置，注册监听器
  nodeData.events.forEach((event: any) => {
    const eventType = event.type
    
    // 根据事件类型注册监听器
    switch (eventType) {
      case 'click':
      case 'dblclick':
      case 'mouseenter':
      case 'mouseleave':
        // 鼠标事件：直接监听 X6 节点事件
        graph.on(`node:${eventType}`, ({ node: eventNode }: any) => {
          if (eventNode.id === node.id) {
            console.log(`触发 ${eventType} 事件:`, event)
            if (checkEventCondition(eventNode, event)) {
              executeEvent(eventNode, event)
            }
          }
        })
        break
      
      case 'change':
        // 值变化事件：监听属性变化
        graph.on('node:change:attrs', ({ node: eventNode }: any) => {
          if (eventNode.id === node.id) {
            console.log(`检查 change 事件:`, event)
            if (checkEventCondition(eventNode, event)) {
              console.log(`条件满足，触发 change 事件:`, event)
              executeEvent(eventNode, event)
            }
          }
        })
        break
      
      case 'input':
        // 输入事件：监听数据变化
        graph.on('node:change:data', ({ node: eventNode }: any) => {
          if (eventNode.id === node.id) {
            console.log(`触发 input 事件:`, event)
            if (checkEventCondition(eventNode, event)) {
              executeEvent(eventNode, event)
            }
          }
        })
        break
      
      // focus 和 blur 事件在预览模式下不适用，因为节点不可编辑
      case 'focus':
      case 'blur':
        console.warn(`事件类型 ${eventType} 在预览模式下不支持`)
        break
      
      default:
        console.warn(`未知的事件类型: ${eventType}`)
    }
  })
}
