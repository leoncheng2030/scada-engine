import type { ComponentConfig } from '../types'
import Motor3D from './Motor3D.vue'
import Valve3D from './Valve3D.vue'
import Tank3D from './Tank3D.vue'
import Pump3D from './Pump3D.vue'

/**
 * 3D电机组件配置
 */
export const Motor3DComponent: ComponentConfig = {
  metadata: {
    id: 'motor-3d',
    name: '3D电机',
    category: 'iot',
    icon: '⚡',
    description: '3D仿真电机组件，支持运行状态和转速显示',
    version: '1.0.0'
  },
  shape: 'motor-3d-vue',
  component: Motor3D,
  width: 140,
  height: 110,
  label: '',
  attrs: {
    body: {
      fill: 'transparent',
      stroke: 'transparent'
    }
  },
  data: {
    type: 'motor',
    state: false,
    speed: 1500,
    power: 7.5,
    deviceId: '',
    property: ''
  },
  ports: {
    groups: {
      left: {
        position: 'left',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#31d0c6',
            strokeWidth: 2,
            fill: '#fff'
          }
        }
      },
      right: {
        position: 'right',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#31d0c6',
            strokeWidth: 2,
            fill: '#fff'
          }
        }
      }
    },
    items: [
      { id: 'port-left', group: 'left' },
      { id: 'port-right', group: 'right' }
    ]
  },
  props: [
    {
      key: 'state',
      label: '运行状态',
      type: 'select',
      path: 'data.state',
      defaultValue: false,
      options: [
        { label: '停止', value: false },
        { label: '运行', value: 'running' }
      ],
      bindable: true
    },
    {
      key: 'speed',
      label: '转速(rpm)',
      type: 'number',
      path: 'data.speed',
      defaultValue: 1500,
      min: 0,
      bindable: true
    },
    {
      key: 'power',
      label: '功率(kW)',
      type: 'number',
      path: 'data.power',
      defaultValue: 7.5,
      min: 0,
      bindable: true
    },
    {
      key: 'deviceId',
      label: '设备ID',
      type: 'text',
      path: 'data.deviceId',
      defaultValue: ''
    },
    {
      key: 'property',
      label: '设备属性',
      type: 'text',
      path: 'data.property',
      defaultValue: ''
    }
  ],
  // 组件预定义的数据点位
  points: [
    {
      id: 'status',
      name: '运行状态',
      description: '电机当前运行状态',
      dataType: 'boolean',
      defaultValue: false,
      required: true
    },
    {
      id: 'speed',
      name: '转速',
      description: '电机当前转速',
      dataType: 'number',
      unit: 'rpm',
      defaultValue: 0,
      required: true,
      range: { min: 0, max: 5000 }
    },
    {
      id: 'power',
      name: '功率',
      description: '电机当前功率',
      dataType: 'number',
      unit: 'kW',
      defaultValue: 0,
      required: false,
      range: { min: 0 }
    },
    {
      id: 'current',
      name: '电流',
      description: '电机运行电流',
      dataType: 'number',
      unit: 'A',
      defaultValue: 0,
      required: false
    },
    {
      id: 'temperature',
      name: '温度',
      description: '电机轴承温度',
      dataType: 'number',
      unit: '℃',
      defaultValue: 25,
      required: false
    },
    {
      id: 'alarm',
      name: '告警状态',
      description: '是否处于告警状态',
      dataType: 'boolean',
      defaultValue: false,
      required: false
    }
  ]
}

/**
 * 3D阀门组件配置
 */
export const Valve3DComponent: ComponentConfig = {
  metadata: {
    id: 'valve-3d',
    name: '3D阀门',
    category: 'iot',
    icon: '🚰',
    description: '3D仿真阀门组件，支持开关状态和开度显示',
    version: '1.0.0'
  },
  shape: 'valve-3d-vue',
  component: Valve3D,
  width: 100,
  height: 140,
  label: '',
  attrs: {
    body: {
      fill: 'transparent',
      stroke: 'transparent'
    }
  },
  data: {
    type: 'valve',
    state: false,
    openness: 0,
    deviceId: '',
    property: ''
  },
  ports: {
    groups: {
      top: {
        position: 'top',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#31d0c6',
            strokeWidth: 2,
            fill: '#fff'
          }
        }
      },
      bottom: {
        position: 'bottom',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#31d0c6',
            strokeWidth: 2,
            fill: '#fff'
          }
        }
      }
    },
    items: [
      { id: 'port-top', group: 'top' },
      { id: 'port-bottom', group: 'bottom' }
    ]
  },
  props: [
    {
      key: 'state',
      label: '阀门状态',
      type: 'select',
      path: 'data.state',
      defaultValue: false,
      options: [
        { label: '关闭', value: false },
        { label: '开启', value: 'open' }
      ],
      bindable: true
    },
    {
      key: 'openness',
      label: '开度(%)',
      type: 'number',
      path: 'data.openness',
      defaultValue: 0,
      min: 0,
      max: 100,
      bindable: true
    },
    {
      key: 'deviceId',
      label: '设备ID',
      type: 'text',
      path: 'data.deviceId',
      defaultValue: ''
    },
    {
      key: 'property',
      label: '设备属性',
      type: 'text',
      path: 'data.property',
      defaultValue: ''
    }
  ],
  // 组件预定义的数据点位
  points: [
    {
      id: 'status',
      name: '阀门状态',
      description: '阀门当前开关状态',
      dataType: 'boolean',
      defaultValue: false,
      required: true
    },
    {
      id: 'openness',
      name: '开度',
      description: '阀门当前开度百分比',
      dataType: 'number',
      unit: '%',
      defaultValue: 0,
      required: true,
      range: { min: 0, max: 100 }
    },
    {
      id: 'flow_rate',
      name: '流量',
      description: '通过阀门的流量',
      dataType: 'number',
      unit: 'm³/h',
      defaultValue: 0,
      required: false
    },
    {
      id: 'pressure_diff',
      name: '压差',
      description: '阀门两端压差',
      dataType: 'number',
      unit: 'kPa',
      defaultValue: 0,
      required: false
    },
    {
      id: 'alarm',
      name: '告警状态',
      description: '是否处于告警状态',
      dataType: 'boolean',
      defaultValue: false,
      required: false
    }
  ]
}

/**
 * 3D储罐组件配置
 */
export const Tank3DComponent: ComponentConfig = {
  metadata: {
    id: 'tank-3d',
    name: '3D储罐',
    category: 'iot',
    icon: '🛢️',
    description: '3D仿真储罐组件，支持液位、温度、压力显示',
    version: '1.0.0'
  },
  shape: 'tank-3d-vue',
  component: Tank3D,
  width: 120,
  height: 160,
  label: '',
  attrs: {
    body: {
      fill: 'transparent',
      stroke: 'transparent'
    }
  },
  data: {
    type: 'tank',
    level: 50,
    capacity: 100,
    temperature: 25,
    pressure: 101,
    liquidColor: '#3b82f6',
    deviceId: '',
    property: ''
  },
  ports: {
    groups: {
      top: {
        position: 'top',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#31d0c6',
            strokeWidth: 2,
            fill: '#fff'
          }
        }
      },
      right: {
        position: 'right',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#31d0c6',
            strokeWidth: 2,
            fill: '#fff'
          }
        }
      },
      bottom: {
        position: 'bottom',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#31d0c6',
            strokeWidth: 2,
            fill: '#fff'
          }
        }
      }
    },
    items: [
      { id: 'port-top', group: 'top' },
      { id: 'port-right', group: 'right' },
      { id: 'port-bottom', group: 'bottom' }
    ]
  },
  props: [
    {
      key: 'level',
      label: '液位(%)',
      type: 'number',
      path: 'data.level',
      defaultValue: 50,
      min: 0,
      max: 100,
      bindable: true
    },
    {
      key: 'capacity',
      label: '容量(m³)',
      type: 'number',
      path: 'data.capacity',
      defaultValue: 100,
      min: 0,
      bindable: true
    },
    {
      key: 'temperature',
      label: '温度(°C)',
      type: 'number',
      path: 'data.temperature',
      defaultValue: 25,
      bindable: true
    },
    {
      key: 'pressure',
      label: '压力(kPa)',
      type: 'number',
      path: 'data.pressure',
      defaultValue: 101,
      min: 0,
      bindable: true
    },
    {
      key: 'liquidColor',
      label: '液体颜色',
      type: 'color',
      path: 'data.liquidColor',
      defaultValue: '#3b82f6',
      bindable: true
    },
    {
      key: 'deviceId',
      label: '设备ID',
      type: 'text',
      path: 'data.deviceId',
      defaultValue: ''
    },
    {
      key: 'property',
      label: '设备属性',
      type: 'text',
      path: 'data.property',
      defaultValue: ''
    }
  ],
  // 组件预定义的数据点位（后端应按此格式返回数据）
  points: [
    {
      id: 'liquid_level',
      name: '液位高度',
      description: '储罐当前液位百分比',
      dataType: 'number',
      unit: '%',
      defaultValue: 50,
      required: true,
      range: { min: 0, max: 100 }
    },
    {
      id: 'temperature',
      name: '温度',
      description: '储罐内液体温度',
      dataType: 'number',
      unit: '℃',
      defaultValue: 25,
      required: false
    },
    {
      id: 'pressure',
      name: '压力',
      description: '储罐内部压力',
      dataType: 'number',
      unit: 'kPa',
      defaultValue: 101,
      required: false,
      range: { min: 0 }
    },
    {
      id: 'capacity',
      name: '实际容量',
      description: '当前实际存储量',
      dataType: 'number',
      unit: 'm³',
      defaultValue: 50,
      required: false
    },
    {
      id: 'alarm',
      name: '告警状态',
      description: '是否处于告警状态',
      dataType: 'boolean',
      defaultValue: false,
      required: false
    }
  ]
}

/**
 * 3D水泵组件配置
 */
export const Pump3DComponent: ComponentConfig = {
  metadata: {
    id: 'pump-3d',
    name: '3D水泵',
    category: 'iot',
    icon: '🌊',
    description: '3D仿真水泵组件，支持运行状态、流量、压力显示',
    version: '1.0.0'
  },
  shape: 'pump-3d-vue',
  component: Pump3D,
  width: 160,
  height: 120,
  label: '',
  attrs: {
    body: {
      fill: 'transparent',
      stroke: 'transparent'
    }
  },
  data: {
    type: 'pump',
    state: false,
    speed: 2900,
    power: 5.5,
    flowRate: 15,
    pressure: 3.5,
    deviceId: '',
    property: ''
  },
  ports: {
    groups: {
      left: {
        position: 'left',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#31d0c6',
            strokeWidth: 2,
            fill: '#fff'
          }
        }
      },
      right: {
        position: 'right',
        attrs: {
          circle: {
            r: 4,
            magnet: true,
            stroke: '#31d0c6',
            strokeWidth: 2,
            fill: '#fff'
          }
        }
      }
    },
    items: [
      { id: 'port-left', group: 'left' },
      { id: 'port-right', group: 'right' }
    ]
  },
  props: [
    {
      key: 'state',
      label: '运行状态',
      type: 'select',
      path: 'data.state',
      defaultValue: false,
      options: [
        { label: '停止', value: false },
        { label: '运行', value: 'running' }
      ],
      bindable: true
    },
    {
      key: 'speed',
      label: '转速(rpm)',
      type: 'number',
      path: 'data.speed',
      defaultValue: 2900,
      min: 0,
      bindable: true
    },
    {
      key: 'power',
      label: '功率(kW)',
      type: 'number',
      path: 'data.power',
      defaultValue: 5.5,
      min: 0,
      bindable: true
    },
    {
      key: 'flowRate',
      label: '流量(m³/h)',
      type: 'number',
      path: 'data.flowRate',
      defaultValue: 15,
      min: 0,
      bindable: true
    },
    {
      key: 'pressure',
      label: '压力(bar)',
      type: 'number',
      path: 'data.pressure',
      defaultValue: 3.5,
      min: 0,
      bindable: true
    },
    {
      key: 'deviceId',
      label: '设备ID',
      type: 'text',
      path: 'data.deviceId',
      defaultValue: ''
    },
    {
      key: 'property',
      label: '设备属性',
      type: 'text',
      path: 'data.property',
      defaultValue: ''
    }
  ],
  // 组件预定义的数据点位
  points: [
    {
      id: 'status',
      name: '运行状态',
      description: '泵当前运行状态',
      dataType: 'boolean',
      defaultValue: false,
      required: true
    },
    {
      id: 'speed',
      name: '转速',
      description: '泵轴转速',
      dataType: 'number',
      unit: 'rpm',
      defaultValue: 0,
      required: true,
      range: { min: 0, max: 5000 }
    },
    {
      id: 'flow_rate',
      name: '流量',
      description: '当前流量',
      dataType: 'number',
      unit: 'm³/h',
      defaultValue: 0,
      required: true,
      range: { min: 0, max: 200 }
    },
    {
      id: 'pressure',
      name: '出口压力',
      description: '泵出口压力',
      dataType: 'number',
      unit: 'bar',
      defaultValue: 0,
      required: true,
      range: { min: 0, max: 20 }
    },
    {
      id: 'power',
      name: '功率',
      description: '当前功率',
      dataType: 'number',
      unit: 'kW',
      defaultValue: 0,
      required: false
    },
    {
      id: 'temperature',
      name: '温度',
      description: '泵体温度',
      dataType: 'number',
      unit: '℃',
      defaultValue: 25,
      required: false
    },
    {
      id: 'vibration',
      name: '振动',
      description: '振动值',
      dataType: 'number',
      unit: 'mm/s',
      defaultValue: 0,
      required: false
    },
    {
      id: 'alarm',
      name: '告警状态',
      description: '是否处于告警状态',
      dataType: 'boolean',
      defaultValue: false,
      required: false
    }
  ]
}
