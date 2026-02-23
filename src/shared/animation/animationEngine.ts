/**
 * 动画执行引擎
 * 负责处理组件的各种动画效果
 */

export type AnimationType = 'none' | 'blink' | 'scale' | 'rotate' | 'float' | 'pulse'

export interface AnimationConfig {
  type: AnimationType
  duration: number
  loop: boolean
}

/**
 * 动画管理器
 */
class AnimationEngine {
  public animations: Map<string, any> = new Map()

  /**
   * 启动节点动画
   * @param node X6 节点
   * @param config 动画配置
   */
  startAnimation(node: any, config: AnimationConfig) {
    if (!node || config.type === 'none') {
      return
    }

    // 停止已存在的动画
    this.stopAnimation(node.id)

    const animationId = node.id
    let animation: any = null

    switch (config.type) {
      case 'blink':
        animation = this.createBlinkAnimation(node, config)
        break
      case 'scale':
        animation = this.createScaleAnimation(node, config)
        break
      case 'rotate':
        animation = this.createRotateAnimation(node, config)
        break
      case 'float':
        animation = this.createFloatAnimation(node, config)
        break
      case 'pulse':
        animation = this.createPulseAnimation(node, config)
        break
    }

    if (animation) {
      this.animations.set(animationId, animation)
    }
  }

  /**
   * 停止节点动画
   * @param nodeId 节点ID
   */
  stopAnimation(nodeId: string) {
    const animation = this.animations.get(nodeId)
    if (animation) {
      if (animation.stop) {
        animation.stop()
      }
      if (animation.intervalId) {
        clearInterval(animation.intervalId)
      }
      this.animations.delete(nodeId)
    }
  }

  /**
   * 创建闪烁动画
   */
  public createBlinkAnimation(node: any, config: AnimationConfig) {
    const originalOpacity = node.getAttrByPath('body/opacity') || 1
    let visible = true

    const intervalId = setInterval(() => {
      visible = !visible
      node.setAttrByPath('body/opacity', visible ? originalOpacity : 0.2)
      
      if (!config.loop) {
        clearInterval(intervalId)
        node.setAttrByPath('body/opacity', originalOpacity)
      }
    }, config.duration / 2)

    return {
      intervalId,
      stop: () => {
        clearInterval(intervalId)
        node.setAttrByPath('body/opacity', originalOpacity)
      }
    }
  }

  /**
   * 创建缩放动画
   */
  public createScaleAnimation(node: any, config: AnimationConfig) {
    const originalSize = node.getSize()
    let growing = true
    const scaleStep = 0.05
    let currentScale = 1

    const intervalId = setInterval(() => {
      if (growing) {
        currentScale += scaleStep
        if (currentScale >= 1.2) {
          growing = false
        }
      } else {
        currentScale -= scaleStep
        if (currentScale <= 0.8) {
          growing = true
        }
      }

      node.resize(
        originalSize.width * currentScale,
        originalSize.height * currentScale
      )

      if (!config.loop && currentScale >= 0.99 && currentScale <= 1.01) {
        clearInterval(intervalId)
        node.resize(originalSize.width, originalSize.height)
      }
    }, config.duration / 20)

    return {
      intervalId,
      stop: () => {
        clearInterval(intervalId)
        node.resize(originalSize.width, originalSize.height)
      }
    }
  }

  /**
   * 创建旋转动画
   */
  public createRotateAnimation(node: any, config: AnimationConfig) {
    let angle = 0
    const step = 360 / (config.duration / 50)

    const intervalId = setInterval(() => {
      angle = (angle + step) % 360
      node.rotate(angle, { absolute: true })

      if (!config.loop && angle >= 360) {
        clearInterval(intervalId)
        node.rotate(0, { absolute: true })
      }
    }, 50)

    return {
      intervalId,
      stop: () => {
        clearInterval(intervalId)
        node.rotate(0, { absolute: true })
      }
    }
  }

  /**
   * 创建浮动动画
   */
  public createFloatAnimation(node: any, config: AnimationConfig) {
    const originalPosition = node.position()
    let movingUp = true
    const moveStep = 2
    let currentY = originalPosition.y

    const intervalId = setInterval(() => {
      if (movingUp) {
        currentY -= moveStep
        if (currentY <= originalPosition.y - 10) {
          movingUp = false
        }
      } else {
        currentY += moveStep
        if (currentY >= originalPosition.y + 10) {
          movingUp = true
        }
      }

      node.position(originalPosition.x, currentY)

      if (!config.loop && Math.abs(currentY - originalPosition.y) < 1) {
        clearInterval(intervalId)
        node.position(originalPosition.x, originalPosition.y)
      }
    }, config.duration / 40)

    return {
      intervalId,
      stop: () => {
        clearInterval(intervalId)
        node.position(originalPosition.x, originalPosition.y)
      }
    }
  }

  /**
   * 创建脉冲动画
   */
  public createPulseAnimation(node: any, config: AnimationConfig) {
    const originalFill = node.getAttrByPath('body/fill')
    const originalStroke = node.getAttrByPath('body/stroke')
    let intensity = 0
    let increasing = true

    const intervalId = setInterval(() => {
      if (increasing) {
        intensity += 0.1
        if (intensity >= 1) {
          increasing = false
        }
      } else {
        intensity -= 0.1
        if (intensity <= 0) {
          increasing = true
        }
      }

      // 调整亮度
      node.setAttrByPath('body/opacity', 0.5 + intensity * 0.5)

      if (!config.loop && intensity <= 0.05) {
        clearInterval(intervalId)
        node.setAttrByPath('body/fill', originalFill)
        node.setAttrByPath('body/stroke', originalStroke)
        node.setAttrByPath('body/opacity', 1)
      }
    }, config.duration / 20)

    return {
      intervalId,
      stop: () => {
        clearInterval(intervalId)
        node.setAttrByPath('body/fill', originalFill)
        node.setAttrByPath('body/stroke', originalStroke)
        node.setAttrByPath('body/opacity', 1)
      }
    }
  }

  /**
   * 清除所有动画
   */
  clearAll() {
    this.animations.forEach((_, nodeId) => {
      this.stopAnimation(nodeId)
    })
    this.animations.clear()
  }
}

// 导出单例
export const animationEngine = new AnimationEngine()
