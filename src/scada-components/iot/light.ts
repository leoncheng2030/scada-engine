import type { ComponentConfig } from '../types'
import Light3D from './Light3D.vue'

/**
 * 灯泡组件配置（使用3D仿真效果）
 */
export const LightComponent: ComponentConfig = {
  metadata: {
    id: 'light',
    name: '3D灯泡',
    category: 'iot',
    icon: '💡',
    description: '3D仿真IoT灯泡控制组件',
    version: '2.0.0'
  },
  shape: 'light-3d-vue',
  component: Light3D,
  width: 100,
  height: 120,
  label: '',
  attrs: {
    body: {
      fill: 'transparent',
      stroke: 'transparent'
    }
  },
  data: {
    type: 'light',
    state: false,
    color: '#fbbf24',
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
      label: '灯泡状态',
      type: 'select',
      path: 'data.state',
      defaultValue: false,
      options: [
        { label: '关闭', value: false },
        { label: '开启', value: true }
      ],
      description: '灯泡开关状态',
      bindable: true
    },
    {
      key: 'color',
      label: '灯光颜色',
      type: 'color',
      path: 'data.color',
      defaultValue: '#fbbf24',
      description: '灯泡发光颜色',
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
      description: '灯泡开关状态（开/关）',
      dataType: 'boolean',
      defaultValue: false,
      required: true
    },
    {
      id: 'color',
      name: '灯光颜色',
      description: '灯泡发光颜色（十六进制颜色值）',
      dataType: 'string',
      defaultValue: '#fbbf24',
      required: false
    },
    {
      id: 'brightness',
      name: '亮度',
      description: '灯泡亮度百分比',
      dataType: 'number',
      unit: '%',
      defaultValue: 100,
      required: false,
      range: { min: 0, max: 100 }
    }
  ]
}
