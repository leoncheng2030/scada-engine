/**
 * 节点属性操作工具函数
 * 用于处理节点属性的获取、设置等操作
 */

/**
 * 获取嵌套对象的值
 * @param obj 对象
 * @param path 路径，使用.分隔，如 'a.b.c'
 * @returns 属性值
 */
export const getNestedValue = (obj: any, path: string): any => {
  const keys = path.split('.')
  let current = obj
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      return undefined
    }
  }
  return current
}

/**
 * 设置嵌套对象的值
 * @param obj 对象
 * @param path 路径，使用.分隔，如 'a.b.c'
 * @param value 要设置的值
 */
export const setNestedValue = (obj: any, path: string, value: any): void => {
  const keys = path.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {}
    }
    current = current[keys[i]]
  }
  current[keys[keys.length - 1]] = value
}

/**
 * 根据 props 配置获取节点属性值
 * @param node X6 节点
 * @param propertyKey 属性键（在 props 中定义的 key）
 * @returns 属性值
 */
export const getNodePropertyValue = (node: any, propertyKey: string): any => {
  const nodeData = node.getData()
  const propConfig = nodeData?.props?.find((p: any) => p.key === propertyKey)
  
  if (!propConfig || !propConfig.path) {
    return undefined
  }
  
  const pathParts = propConfig.path.split('.')
  
  if (pathParts[0] === 'attrs') {
    const attrPath = pathParts.slice(1).join('/')
    return node.attr(attrPath)
  } else if (pathParts[0] === 'data') {
    const dataKey = pathParts.slice(1).join('.')
    return getNestedValue(node.getData(), dataKey)
  }
  
  return undefined
}

/**
 * 根据 props 配置设置节点属性值
 * @param node X6 节点
 * @param propertyKey 属性键（在 props 中定义的 key）
 * @param value 要设置的值
 * @returns 是否设置成功
 */
export const setNodePropertyValue = (node: any, propertyKey: string, value: any): boolean => {
  const nodeData = node.getData()
  const propConfig = nodeData?.props?.find((p: any) => p.key === propertyKey)
  
  if (!propConfig || !propConfig.path) {
    console.warn(`未找到属性配置: ${propertyKey}`)
    return false
  }
  
  const pathParts = propConfig.path.split('.')
  
  if (pathParts[0] === 'attrs') {
    // X6 属性路径，使用 / 分隔
    const attrPath = pathParts.slice(1).join('/')
    node.setAttrByPath(attrPath, value)
    console.log(`属性已更改: ${propertyKey} (${attrPath}) = ${value}`)
    return true
  } else if (pathParts[0] === 'data') {
    // data 属性路径
    const dataKey = pathParts.slice(1).join('.')
    const currentData = node.getData() || {}
    setNestedValue(currentData, dataKey, value)
    node.setData(currentData)
    console.log(`数据已更改: ${propertyKey} (${dataKey}) = ${value}`)
    return true
  } else {
    console.warn(`未知的属性路径类型: ${propConfig.path}`)
    return false
  }
}
