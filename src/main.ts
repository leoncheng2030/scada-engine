import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import { loadExampleSvgComponents } from './svg/helpers/utils'
import { componentRegistry } from './scada-components/registry'
import { COMMON_ANIMATION_PROPS } from './scada-components/types'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// 通用端口配置
const defaultPorts = {
  groups: {
    top: { position: 'top', attrs: { circle: { r: 4, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
    right: { position: 'right', attrs: { circle: { r: 4, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
    bottom: { position: 'bottom', attrs: { circle: { r: 4, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
    left: { position: 'left', attrs: { circle: { r: 4, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } }
  },
  items: [
    { id: 'port-top', group: 'top' },
    { id: 'port-right', group: 'right' },
    { id: 'port-bottom', group: 'bottom' },
    { id: 'port-left', group: 'left' }
  ]
}

// 通用属性配置
function deviceProps(label: string, fill = '#3b82f6', stroke = '#2563eb') {
  return [
    { key: 'deviceId', label: '设备ID', type: 'text' as const, path: 'data.deviceId', defaultValue: '', description: '绑定的后端设备ID' },
    { key: 'text', label: '文本', type: 'text' as const, path: 'attrs.label.text', defaultValue: label },
    { key: 'fill', label: '填充色', type: 'color' as const, path: 'attrs.body.fill', defaultValue: fill },
    { key: 'stroke', label: '边框色', type: 'color' as const, path: 'attrs.body.stroke', defaultValue: stroke },
    { key: 'strokeWidth', label: '边框宽度', type: 'number' as const, path: 'attrs.body.strokeWidth', defaultValue: 2, min: 0, max: 10 },
    { key: 'opacity', label: '透明度', type: 'slider' as const, path: 'attrs.body.opacity', defaultValue: 1, min: 0, max: 1, step: 0.1 },
    ...COMMON_ANIMATION_PROPS
  ]
}

// 注册自定义设备组件
function registerCustomDevices() {
  // 冷却塔
  componentRegistry.register({
    metadata: {
      id: 'cooling-tower',
      name: '冷却塔',
      category: 'custom',
      custom_category_name: '设备',
      iconType: 'img',
      icon: '/src/icon/cooling-tower.svg',
      description: '冷却塔设备组件',
      version: '1.0.0'
    },
    shape: 'image',
    width: 80,
    height: 80,
    label: '冷却塔',
    attrs: {
      body: { fill: '#3b82f6', stroke: '#2563eb', strokeWidth: 2 },
      label: { fill: '#fff', fontSize: 14 }
    },
    ports: defaultPorts,
    props: deviceProps('冷却塔')
  })

  // 反应罐
  componentRegistry.register({
    metadata: {
      id: 'reactor-tank',
      name: '反应罐',
      category: 'custom',
      custom_category_name: '设备',
      iconType: 'img',
      icon: '/src/icon/reactor-tank.svg',
      description: '反应罐设备组件，带搅拌和液位显示',
      version: '1.0.0'
    },
    shape: 'image',
    width: 80,
    height: 100,
    label: '反应罐',
    attrs: {
      body: { fill: '#0891b2', stroke: '#0e7490', strokeWidth: 2 },
      label: { fill: '#fff', fontSize: 14 }
    },
    ports: defaultPorts,
    props: deviceProps('反应罐', '#0891b2', '#0e7490'),
    points: [
      { id: 'liquid_level', name: '液位', dataType: 'number', unit: '%', defaultValue: 50, range: { min: 0, max: 100 } },
      { id: 'temperature', name: '温度', dataType: 'number', unit: '℃', defaultValue: 25, range: { min: 0, max: 200 } },
      { id: 'pressure', name: '压力', dataType: 'number', unit: 'MPa', defaultValue: 0.1, range: { min: 0, max: 10 } },
      { id: 'stirrer_running', name: '搅拌运行', dataType: 'boolean', defaultValue: false }
    ]
  })

  // 烟囱
  componentRegistry.register({
    metadata: {
      id: 'chimney',
      name: '烟囱',
      category: 'custom',
      custom_category_name: '设备',
      iconType: 'img',
      icon: '/src/icon/chimney.svg',
      description: '工业烟囱组件，红白条纹',
      version: '1.0.0'
    },
    shape: 'image',
    width: 50,
    height: 100,
    label: '烟囱',
    attrs: {
      body: { fill: '#ef4444', stroke: '#b91c1c', strokeWidth: 2 },
      label: { fill: '#fff', fontSize: 14 }
    },
    ports: defaultPorts,
    props: deviceProps('烟囱', '#ef4444', '#b91c1c'),
    points: [
      { id: 'smoke_density', name: '烟气浓度', dataType: 'number', unit: 'mg/m³', defaultValue: 0, range: { min: 0, max: 500 } },
      { id: 'exhaust_temp', name: '排烟温度', dataType: 'number', unit: '℃', defaultValue: 120, range: { min: 0, max: 500 } },
      { id: 'is_active', name: '运行状态', dataType: 'boolean', defaultValue: false }
    ]
  })

  // 风机
  componentRegistry.register({
    metadata: {
      id: 'fengji',
      name: '风机',
      category: 'custom',
      custom_category_name: '设备',
      iconType: 'img',
      icon: '/src/icon/fengji.png',
      description: '风机设备组件',
      version: '1.0.0'
    },
    shape: 'image',
    width: 80,
    height: 80,
    label: '风机',
    attrs: {
      body: { fill: '#3b82f6', stroke: '#2563eb', strokeWidth: 2 },
      label: { fill: '#fff', fontSize: 14 }
    },
    ports: defaultPorts,
    props: deviceProps('风机'),
    points: [
      { id: 'speed', name: '转速', dataType: 'number', unit: 'rpm', defaultValue: 0, range: { min: 0, max: 3000 } },
      { id: 'power', name: '功率', dataType: 'number', unit: 'kW', defaultValue: 0, range: { min: 0, max: 500 } },
      { id: 'is_running', name: '运行状态', dataType: 'boolean', defaultValue: false }
    ]
  })

  // 脱硝机
  componentRegistry.register({
    metadata: {
      id: 'tuoxiaoji',
      name: '脱硝机',
      category: 'custom',
      custom_category_name: '设备',
      iconType: 'img',
      icon: '/src/icon/tuoxiaoji.png',
      description: '脱硝机设备组件',
      version: '1.0.0'
    },
    shape: 'image',
    width: 80,
    height: 80,
    label: '脱硝机',
    attrs: {
      body: { fill: '#8b5cf6', stroke: '#7c3aed', strokeWidth: 2 },
      label: { fill: '#fff', fontSize: 14 }
    },
    ports: defaultPorts,
    props: deviceProps('脱硝机', '#8b5cf6', '#7c3aed'),
    points: [
      { id: 'nox_inlet', name: 'NOx入口浓度', dataType: 'number', unit: 'mg/m³', defaultValue: 0, range: { min: 0, max: 1000 } },
      { id: 'nox_outlet', name: 'NOx出口浓度', dataType: 'number', unit: 'mg/m³', defaultValue: 0, range: { min: 0, max: 500 } },
      { id: 'efficiency', name: '脱硝效率', dataType: 'number', unit: '%', defaultValue: 0, range: { min: 0, max: 100 } },
      { id: 'is_running', name: '运行状态', dataType: 'boolean', defaultValue: false }
    ]
  })

  // 窑炉
  componentRegistry.register({
    metadata: {
      id: 'yaolu',
      name: '窑炉',
      category: 'custom',
      custom_category_name: '设备',
      iconType: 'img',
      icon: '/src/icon/yaolu.png',
      description: '窑炉设备组件',
      version: '1.0.0'
    },
    shape: 'image',
    width: 100,
    height: 80,
    label: '窑炉',
    attrs: {
      body: { fill: '#f59e0b', stroke: '#d97706', strokeWidth: 2 },
      label: { fill: '#fff', fontSize: 14 }
    },
    ports: defaultPorts,
    props: deviceProps('窑炉', '#f59e0b', '#d97706'),
    points: [
      { id: 'temperature', name: '炉温', dataType: 'number', unit: '℃', defaultValue: 0, range: { min: 0, max: 1500 } },
      { id: 'pressure', name: '炉压', dataType: 'number', unit: 'Pa', defaultValue: 0, range: { min: -500, max: 500 } },
      { id: 'is_running', name: '运行状态', dataType: 'boolean', defaultValue: false }
    ]
  })

  // 塔器
  componentRegistry.register({
    metadata: {
      id: 'tower',
      name: '塔器',
      category: 'custom',
      custom_category_name: '设备',
      iconType: 'img',
      icon: '/src/icon/tower.svg',
      description: '塔器设备组件',
      version: '1.0.0'
    },
    shape: 'image',
    width: 60,
    height: 100,
    label: '塔器',
    attrs: {
      body: { fill: '#64748b', stroke: '#475569', strokeWidth: 2 },
      label: { fill: '#fff', fontSize: 14 }
    },
    ports: defaultPorts,
    props: deviceProps('塔器', '#64748b', '#475569'),
    points: [
      { id: 'temperature', name: '温度', dataType: 'number', unit: '℃', defaultValue: 0, range: { min: 0, max: 500 } },
      { id: 'pressure', name: '压力', dataType: 'number', unit: 'MPa', defaultValue: 0, range: { min: 0, max: 10 } },
      { id: 'liquid_level', name: '液位', dataType: 'number', unit: '%', defaultValue: 0, range: { min: 0, max: 100 } }
    ]
  })

  // Group设备
  componentRegistry.register({
    metadata: {
      id: 'group-device',
      name: '设备组',
      category: 'custom',
      custom_category_name: '设备',
      iconType: 'img',
      icon: '/src/icon/Group 1739333234.png',
      description: '设备组合组件',
      version: '1.0.0'
    },
    shape: 'image',
    width: 100,
    height: 80,
    label: '设备组',
    attrs: {
      body: { fill: '#3b82f6', stroke: '#2563eb', strokeWidth: 2 },
      label: { fill: '#fff', fontSize: 14 }
    },
    ports: defaultPorts,
    props: deviceProps('设备组'),
    points: [
      { id: 'status', name: '运行状态', dataType: 'boolean', defaultValue: false },
      { id: 'temperature', name: '温度', dataType: 'number', unit: '℃', defaultValue: 0, range: { min: 0, max: 500 } }
    ]
  })

  console.log('[App] 自定义设备组件已注册')
}

// 先加载 SVG 组件，再注册自定义组件，最后挂载应用
loadExampleSvgComponents().then(() => {
  console.log('[App] SVG 组件已加载')
  registerCustomDevices()
  app.mount('#app')
}).catch(error => {
  console.error('[App] 加载 SVG 组件失败:', error)
  registerCustomDevices()
  app.mount('#app')
})
