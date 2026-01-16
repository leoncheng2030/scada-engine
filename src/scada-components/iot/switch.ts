import type { ComponentConfig } from '../types'
import Switch3D from './Switch3D.vue'

/**
 * 3D开关组件配置
 */
export const SwitchComponent: ComponentConfig = {
  metadata: {
    id: 'switch',
    name: '3D开关',
    category: 'iot',
    icon: '🔘',
    description: '3D仿真IoT开关控制组件',
    version: '2.0.0'
  },
  shape: 'switch-3d-vue',
  component: Switch3D,
  width: 140,
  height: 100,
  label: '',
  attrs: {
    body: {
      fill: 'transparent',
      stroke: 'transparent'
    }
  },
  data: {
    type: 'switch',
    state: false,
    deviceId: '',
    property: ''
  },
  // 接线柱配置 - 左右两侧
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
      label: '开关状态',
      type: 'select',
      path: 'data.state',
      defaultValue: false,
      options: [
        { label: '关闭', value: false },
        { label: '开启', value: true }
      ],
      description: '开关当前状态',
      bindable: true
    },
    {
      key: 'deviceId',
      label: '设备ID',
      type: 'text',
      path: 'data.deviceId',
      defaultValue: '',
      description: '绑定的设备ID'
    },
    {
      key: 'property',
      label: '设备属性',
      type: 'text',
      path: 'data.property',
      defaultValue: '',
      description: '绑定的设备属性名称'
    }
  ],
  // 组件预定义的数据点位
  points: [
    {
      id: 'status',
      name: '开关状态',
      description: '开关当前状态（开/关）',
      dataType: 'boolean',
      defaultValue: false,
      required: true
    },
    {
      id: 'enabled',
      name: '启用状态',
      description: '开关是否可用',
      dataType: 'boolean',
      defaultValue: true,
      required: false
    }
  ]
}
