import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

let dracoLoader: DRACOLoader | null = null

export function getDracoLoader(): DRACOLoader {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader()
    // 本地 Draco 解码器文件目录，使用 three 默认的 gltf 子目录结构
    // 对应路径: public/draco/gltf/draco_decoder.js 等
    dracoLoader.setDecoderPath('/draco/gltf/')
    dracoLoader.preload()
  }
  return dracoLoader
}
