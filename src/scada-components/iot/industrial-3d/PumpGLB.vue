<template>
  <div
    ref="containerRef"
    class="pump-glb-container"
    :style="{ width: `${width}px`, height: `${height}px` }"
  >
    <div class="pump-glb-info">
      <span class="pump-glb-state">
        {{ isRunning ? '运行中' : '已停止' }}
      </span>
      <span class="pump-glb-speed">
        {{ speed.toFixed(0) }} rpm
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { getDracoLoader } from '@/utils/dracoLoader'

interface Props {
  node?: any
}

const props = defineProps<Props>()

// 尺寸由 X6 节点大小驱动
const width = ref(200)
const height = ref(200)

// 数据驱动状态
const isRunning = ref(false)
const speed = ref(2900)

const containerRef = ref<HTMLElement>()

const getData = () => {
  if (!props.node) return {}
  const nodeData = props.node.getData ? props.node.getData() : props.node.data || {}
  return nodeData
}

const updateComponentData = () => {
  const data = getData()

  width.value = props.node?.size?.width || 200
  height.value = props.node?.size?.height || 200

  isRunning.value = data.state === 'running' || data.state === true
  speed.value = typeof data.speed === 'number' ? data.speed : 2900
}

// Three.js 对象
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let pumpModel: THREE.Object3D | null = null
let mixer: THREE.AnimationMixer | null = null
const actions: Record<string, THREE.AnimationAction> = {}
let animationId = 0
const clock = new THREE.Clock()

const initThree = () => {
  if (!containerRef.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0f172a)

  const aspect = width.value / height.value
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)
  camera.position.set(0, 2, 6)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  })
  renderer.setSize(width.value, height.value)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  containerRef.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 10, 5)
  directionalLight.castShadow = true
  scene.add(directionalLight)
}

const createPlaceholderModel = () => {
  const group = new THREE.Group()

  const baseGeom = new THREE.BoxGeometry(3.5, 0.3, 1.5)
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1f2933,
    metalness: 0.2,
    roughness: 0.7
  })
  const baseMesh = new THREE.Mesh(baseGeom, baseMat)
  baseMesh.position.set(0, -1.2, 0)
  baseMesh.castShadow = true
  baseMesh.receiveShadow = true
  group.add(baseMesh)

  const bodyGeom = new THREE.CylinderGeometry(1, 1, 2.4, 32)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    metalness: 0.4,
    roughness: 0.4
  })
  const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat)
  bodyMesh.rotation.z = Math.PI / 2
  bodyMesh.castShadow = true
  bodyMesh.receiveShadow = true
  group.add(bodyMesh)

  const shaftGeom = new THREE.CylinderGeometry(0.12, 0.12, 1.0, 16)
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    metalness: 0.8,
    roughness: 0.2
  })
  const shaftMesh = new THREE.Mesh(shaftGeom, shaftMat)
  shaftMesh.rotation.z = Math.PI / 2
  shaftMesh.position.set(1.7, 0, 0)
  shaftMesh.castShadow = true
  shaftMesh.receiveShadow = true
  group.add(shaftMesh)

  const headGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 24)
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    metalness: 0.7,
    roughness: 0.3
  })
  const headMesh = new THREE.Mesh(headGeom, headMat)
  headMesh.rotation.z = Math.PI / 2
  headMesh.position.set(2.1, 0, 0)
  headMesh.castShadow = true
  headMesh.receiveShadow = true
  group.add(headMesh)

  const box = new THREE.Box3().setFromObject(group)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  group.position.sub(center)

  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const targetSize = 3
  const scale = targetSize / maxDim
  group.scale.setScalar(scale)

  pumpModel = group
  scene.add(group)
}

const loadModel = () => {
  const data = getData()
  const modelUrl = typeof data.modelUrl === 'string' && data.modelUrl.trim().length > 0
    ? data.modelUrl.trim()
    : ''

  if (!modelUrl) {
    createPlaceholderModel()
    return
  }

  const loader = new GLTFLoader()
  loader.setDRACOLoader(getDracoLoader())

  loader.load(
    modelUrl,
    (gltf) => {
      pumpModel = gltf.scene

      pumpModel.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.isMesh) {
          mesh.castShadow = true
          mesh.receiveShadow = true
        }
      })

      // 模型居中并缩放到合适大小，方便观察
      const box = new THREE.Box3().setFromObject(pumpModel)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      pumpModel.position.sub(center)

      const maxDim = Math.max(size.x, size.y, size.z) || 1
      const targetSize = 3
      const scale = targetSize / maxDim
      pumpModel.scale.setScalar(scale)

      scene.add(pumpModel)

      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(pumpModel)
        gltf.animations.forEach((clip) => {
          actions[clip.name] = mixer!.clipAction(clip)
        })
        updateAnimationByState()
        updateAnimationBySpeed()
      }
    },
    undefined,
    (error) => {
      console.error('Pump GLB model load failed:', error)
      if (!pumpModel) {
        createPlaceholderModel()
      }
    }
  )
}

const findAction = (names: string[]): THREE.AnimationAction | undefined => {
  for (const name of names) {
    if (actions[name]) return actions[name]
  }
  const firstKey = Object.keys(actions)[0]
  return firstKey ? actions[firstKey] : undefined
}

const updateAnimationByState = () => {
  if (!mixer || !Object.keys(actions).length) return

  Object.values(actions).forEach((action) => action.stop())

  let action: THREE.AnimationAction | undefined
  if (isRunning.value) {
    action = findAction(['Run', 'run', 'Running', 'running'])
  } else {
    action = findAction(['Idle', 'idle', 'Stop', 'stop'])
  }

  if (action) {
    action.reset().play()
  }
}

const updateAnimationBySpeed = () => {
  if (!mixer || !Object.keys(actions).length) return

  const clamped = Math.max(0, Math.min(5000, speed.value))
  const normalized = clamped / 5000
  const timeScale = 0.2 + normalized * 2.8

  Object.values(actions).forEach((action) => {
    action.timeScale = timeScale
  })
}

const animate = () => {
  animationId = requestAnimationFrame(animate)
  const delta = clock.getDelta()

  if (mixer) {
    mixer.update(delta)
  } else if (pumpModel && isRunning.value) {
    // 没有内置动画时，使用简单自转作为退化动画
    pumpModel.rotation.y += delta
  }

  renderer.render(scene, camera)
}

watch(isRunning, () => {
  updateAnimationByState()
})

watch(speed, () => {
  updateAnimationBySpeed()
})

watch(
  () => [width.value, height.value],
  () => {
    if (!renderer || !camera) return
    renderer.setSize(width.value, height.value)
    camera.aspect = width.value / height.value
    camera.updateProjectionMatrix()
  }
)

const cleanup = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  if (renderer) {
    renderer.dispose()
  }

  if (scene) {
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (mesh.isMesh) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => mat.dispose())
        } else if (mesh.material) {
          mesh.material.dispose()
        }
        if (mesh.geometry) {
          mesh.geometry.dispose()
        }
      }
    })
  }
}

onMounted(() => {
  updateComponentData()
  initThree()
  loadModel()
  animate()

  if (props.node && typeof props.node.on === 'function') {
    props.node.on('change:data', () => {
      updateComponentData()
    })
  }
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.pump-glb-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pump-glb-container canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.pump-glb-info {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 4px;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #e2e8f0;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
}
</style>
