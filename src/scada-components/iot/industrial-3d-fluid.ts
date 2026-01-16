import type { ComponentConfig } from '../types'
import Pipe3D from './Pipe3D.vue'
import Filter3D from './Filter3D.vue'
import HeatExchanger3D from './HeatExchanger3D.vue'
import Tee3D from './Tee3D.vue'

/**
 * 3D管道组件配置
 */
export const Pipe3DComponent: ComponentConfig = {
  metadata: {
    id: 'pipe-3d',
    name: '3D管道',
    category: 'iot',
    icon: '🔧',
    description: '3D仿真管道组件，支持横向/纵向和流体动画',
    version: '1.0.0'
  },
  shape: 'pipe-3d-vue',
  component: Pipe3D,
  width: 220,
  height: 60,
  label: '',
  attrs: {
    body: {
      fill: 'transparent',
      stroke: 'transparent'
    }
  },
  data: {
    type: 'pipe',
    state: false,
    flowRate: 10,
    direction: 'horizontal',
    fluidColor: '#3b82f6',
    diameter: 40,
    length: 200,
    deviceId: '',
    property: ''
  },
  ports: {
    groups: {
      left: { position: 'left', attrs: { circle: { r: 4, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
      right: { position: 'right', attrs: { circle: { r: 4, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } }
    },
    items: [
      { id: 'port-left', group: 'left' },
      { id: 'port-right', group: 'right' }
    ]
  },
  props: [
    { key: 'state', label: '流动状态', type: 'select', path: 'data.state', defaultValue: false, options: [{ label: '停止', value: false }, { label: '流动', value: 'flowing' }], description: '管道流体状态', bindable: true },
    { key: 'flowRate', label: '流量(m³/h)', type: 'number', path: 'data.flowRate', defaultValue: 10, min: 0, description: '流体流量', bindable: true },
    { key: 'direction', label: '管道方向', type: 'select', path: 'data.direction', defaultValue: 'horizontal', options: [{ label: '横向', value: 'horizontal' }, { label: '纵向', value: 'vertical' }], description: '管道布置方向' },
    { key: 'fluidColor', label: '流体颜色', type: 'color', path: 'data.fluidColor', defaultValue: '#3b82f6', description: '流体显示颜色', bindable: true },
    { key: 'diameter', label: '管径(mm)', type: 'number', path: 'data.diameter', defaultValue: 40, min: 20, max: 100, description: '管道直径' },
    { key: 'length', label: '长度(mm)', type: 'number', path: 'data.length', defaultValue: 200, min: 100, max: 500, description: '管道长度' },
    { key: 'deviceId', label: '设备ID', type: 'text', path: 'data.deviceId', defaultValue: '', description: '绑定的设备ID' },
    { key: 'property', label: '设备属性', type: 'text', path: 'data.property', defaultValue: '', description: '绑定的设备属性名称' }
  ],
  // 组件预定义的数据点位
  points: [
    {
      id: 'status',
      name: '流动状态',
      description: '管道流体流动状态',
      dataType: 'boolean',
      defaultValue: false,
      required: true
    },
    {
      id: 'flow_rate',
      name: '流量',
      description: '管道流体流量',
      dataType: 'number',
      unit: 'm³/h',
      defaultValue: 0,
      required: true,
      range: { min: 0 }
    },
    {
      id: 'pressure',
      name: '压力',
      description: '管道内压力',
      dataType: 'number',
      unit: 'kPa',
      defaultValue: 0,
      required: false
    },
    {
      id: 'temperature',
      name: '温度',
      description: '流体温度',
      dataType: 'number',
      unit: '℃',
      defaultValue: 25,
      required: false
    }
  ]
}

/**
 * 3D过滤器组件配置
 */
export const Filter3DComponent: ComponentConfig = {
  metadata: {
    id: 'filter-3d',
    name: '3D过滤器',
    category: 'iot',
    icon: '🧹',
    description: '3D仿真过滤器，支持堵塞度和压差显示',
    version: '1.0.0'
  },
  shape: 'filter-3d-vue',
  component: Filter3D,
  width: 140,
  height: 120,
  label: '',
  attrs: {
    body: {
      fill: 'transparent',
      stroke: 'transparent'
    }
  },
  data: {
    type: 'filter',
    clogLevel: 20,
    pressureDrop: 5,
    diameter: 50,
    alarmThreshold: 70,
    deviceId: '',
    property: ''
  },
  ports: {
    groups: {
      left: { position: 'left', attrs: { circle: { r: 4, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
      right: { position: 'right', attrs: { circle: { r: 4, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } }
    },
    items: [
      { id: 'port-left', group: 'left' },
      { id: 'port-right', group: 'right' }
    ]
  },
  props: [
    { key: 'clogLevel', label: '堵塞度(%)', type: 'number', path: 'data.clogLevel', defaultValue: 20, min: 0, max: 100, description: '滤芯堵塞程度', bindable: true },
    { key: 'pressureDrop', label: '压差(kPa)', type: 'number', path: 'data.pressureDrop', defaultValue: 5, min: 0, description: '过滤器压差', bindable: true },
    { key: 'diameter', label: '口径(mm)', type: 'number', path: 'data.diameter', defaultValue: 50, min: 20, max: 100, description: '过滤器口径' },
    { key: 'alarmThreshold', label: '报警阈值(%)', type: 'number', path: 'data.alarmThreshold', defaultValue: 70, min: 0, max: 100, description: '堵塞度报警阈值' },
    { key: 'deviceId', label: '设备ID', type: 'text', path: 'data.deviceId', defaultValue: '', description: '绑定的设备ID' },
    { key: 'property', label: '设备属性', type: 'text', path: 'data.property', defaultValue: '', description: '绑定的设备属性名称' }
  ],
  // 组件预定义的数据点位
  points: [
    {
      id: 'clog_level',
      name: '堵塞度',
      description: '滤芯堵塞程度百分比',
      dataType: 'number',
      unit: '%',
      defaultValue: 0,
      required: true,
      range: { min: 0, max: 100 }
    },
    {
      id: 'pressure_drop',
      name: '压差',
      description: '过滤器进出口压差',
      dataType: 'number',
      unit: 'kPa',
      defaultValue: 0,
      required: true,
      range: { min: 0 }
    },
    {
      id: 'flow_rate',
      name: '流量',
      description: '通过过滤器的流量',
      dataType: 'number',
      unit: 'm³/h',
      defaultValue: 0,
      required: false
    },
    {
      id: 'alarm',
      name: '告警状态',
      description: '是否触发堵塞告警',
      dataType: 'boolean',
      defaultValue: false,
      required: false
    }
  ]
}

/**
 * 3D换热器组件配置
 */
export const HeatExchanger3DComponent: ComponentConfig = {
  metadata: {
    id: 'heat-exchanger-3d',
    name: '3D换热器',
    category: 'iot',
    icon: '🔥',
    description: '3D仿真换热器，支持热冷流体交换和效率显示',
    version: '1.0.0'
  },
  shape: 'heat-exchanger-3d-vue',
  component: HeatExchanger3D,
  width: 160,
  height: 140,
  label: '',
  attrs: {
    body: {
      fill: 'transparent',
      stroke: 'transparent'
    }
  },
  data: {
    type: 'heat-exchanger',
    state: false,
    hotTempIn: 80,
    hotTempOut: 50,
    coldTempIn: 20,
    coldTempOut: 40,
    heatTransferArea: 10,
    deviceId: '',
    property: ''
  },
  ports: {
    groups: {
      top: { position: 'top', attrs: { circle: { r: 4, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
      bottom: { position: 'bottom', attrs: { circle: { r: 4, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
      left: { position: 'left', attrs: { circle: { r: 4, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
      right: { position: 'right', attrs: { circle: { r: 4, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } }
    },
    items: [
      { id: 'port-top', group: 'top' },
      { id: 'port-bottom', group: 'bottom' },
      { id: 'port-left', group: 'left' },
      { id: 'port-right', group: 'right' }
    ]
  },
  props: [
    { key: 'state', label: '运行状态', type: 'select', path: 'data.state', defaultValue: false, options: [{ label: '停止', value: false }, { label: '运行', value: 'working' }], description: '换热器运行状态', bindable: true },
    { key: 'hotTempIn', label: '热侧进口(°C)', type: 'number', path: 'data.hotTempIn', defaultValue: 80, description: '热流体进口温度', bindable: true },
    { key: 'hotTempOut', label: '热侧出口(°C)', type: 'number', path: 'data.hotTempOut', defaultValue: 50, description: '热流体出口温度', bindable: true },
    { key: 'coldTempIn', label: '冷侧进口(°C)', type: 'number', path: 'data.coldTempIn', defaultValue: 20, description: '冷流体进口温度', bindable: true },
    { key: 'coldTempOut', label: '冷侧出口(°C)', type: 'number', path: 'data.coldTempOut', defaultValue: 40, description: '冷流体出口温度', bindable: true },
    { key: 'heatTransferArea', label: '换热面积(m²)', type: 'number', path: 'data.heatTransferArea', defaultValue: 10, min: 1, description: '换热器换热面积' },
    { key: 'deviceId', label: '设备ID', type: 'text', path: 'data.deviceId', defaultValue: '', description: '绑定的设备ID' },
    { key: 'property', label: '设备属性', type: 'text', path: 'data.property', defaultValue: '', description: '绑定的设备属性名称' }
  ],
  // 组件预定义的数据点位
  points: [
    {
      id: 'status',
      name: '运行状态',
      description: '换热器运行状态',
      dataType: 'boolean',
      defaultValue: false,
      required: true
    },
    {
      id: 'hot_temp_in',
      name: '热侧进口温度',
      description: '热流体进口温度',
      dataType: 'number',
      unit: '℃',
      defaultValue: 80,
      required: true
    },
    {
      id: 'hot_temp_out',
      name: '热侧出口温度',
      description: '热流体出口温度',
      dataType: 'number',
      unit: '℃',
      defaultValue: 50,
      required: true
    },
    {
      id: 'cold_temp_in',
      name: '冷侧进口温度',
      description: '冷流体进口温度',
      dataType: 'number',
      unit: '℃',
      defaultValue: 20,
      required: true
    },
    {
      id: 'cold_temp_out',
      name: '冷侧出口温度',
      description: '冷流体出口温度',
      dataType: 'number',
      unit: '℃',
      defaultValue: 40,
      required: true
    },
    {
      id: 'efficiency',
      name: '换热效率',
      description: '换热器当前效率',
      dataType: 'number',
      unit: '%',
      defaultValue: 85,
      required: false,
      range: { min: 0, max: 100 }
    }
  ]
}

/**
 * 3D三通组件配置
 */
export const Tee3DComponent: ComponentConfig = {
  metadata: {
    id: 'tee-3d',
    name: '3D三通',
    category: 'iot',
    icon: '⛓️',
    description: '3D仿真三通管件，支持流体分流和汇流',
    version: '1.0.0'
  },
  shape: 'tee-3d-vue',
  component: Tee3D,
  width: 120,
  height: 120,
  label: '',
  attrs: {
    body: {
      fill: 'transparent',
      stroke: 'transparent'
    }
  },
  data: {
    type: 'tee',
    state: false,
    fluidColor: '#3b82f6',
    topFlowEnabled: true,
    bottomFlowEnabled: true,
    deviceId: '',
    property: ''
  },
  ports: {
    groups: {
      left: { position: 'left', attrs: { circle: { r: 4, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
      right: { position: 'right', attrs: { circle: { r: 4, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
      top: { position: 'top', attrs: { circle: { r: 4, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
      bottom: { position: 'bottom', attrs: { circle: { r: 4, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } }
    },
    items: [
      { id: 'port-left', group: 'left' },
      { id: 'port-right', group: 'right' },
      { id: 'port-top', group: 'top' },
      { id: 'port-bottom', group: 'bottom' }
    ]
  },
  props: [
    { key: 'state', label: '流动状态', type: 'select', path: 'data.state', defaultValue: false, options: [{ label: '关闭', value: false }, { label: '流动', value: 'flowing' }], description: '三通管件流动状态', bindable: true },
    { key: 'fluidColor', label: '流体颜色', type: 'color', path: 'data.fluidColor', defaultValue: '#3b82f6', description: '流体显示颜色' },
    { key: 'topFlowEnabled', label: '上方分流', type: 'boolean', path: 'data.topFlowEnabled', defaultValue: true, description: '是否启用上方分流', bindable: true },
    { key: 'bottomFlowEnabled', label: '下方分流', type: 'boolean', path: 'data.bottomFlowEnabled', defaultValue: true, description: '是否启用下方分流', bindable: true },
    { key: 'deviceId', label: '设备ID', type: 'text', path: 'data.deviceId', defaultValue: '', description: '绑定的设备ID' },
    { key: 'property', label: '设备属性', type: 'text', path: 'data.property', defaultValue: '', description: '绑定的设备属性名称' }
  ],
  // 组件预定义的数据点位
  points: [
    {
      id: 'status',
      name: '流动状态',
      description: '三通管件流动状态',
      dataType: 'boolean',
      defaultValue: false,
      required: true
    },
    {
      id: 'top_flow_enabled',
      name: '上方分流',
      description: '上方分流是否启用',
      dataType: 'boolean',
      defaultValue: true,
      required: false
    },
    {
      id: 'bottom_flow_enabled',
      name: '下方分流',
      description: '下方分流是否启用',
      dataType: 'boolean',
      defaultValue: true,
      required: false
    },
    {
      id: 'inlet_flow',
      name: '入口流量',
      description: '三通入口流量',
      dataType: 'number',
      unit: 'm³/h',
      defaultValue: 0,
      required: false
    }
  ]
}
