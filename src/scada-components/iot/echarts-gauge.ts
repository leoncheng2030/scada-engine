import type { ComponentConfig } from '../types'
import { gaugePresets } from './echarts-gauge-presets'

/**
 * ECharts 仪表盘组件配置
 */
export const EChartsGaugeComponent: ComponentConfig = {
  metadata: {
    id: 'echarts-gauge',
    name: 'ECharts仪表盘',
    category: 'iot',
    icon: '📈',
    description: 'ECharts 仪表盘数据展示组件，支持丰富的配置选项',
    version: '1.0.0'
  },
  shape: 'echarts-vue',
  width: 200,
  height: 200,
  label: '',
  attrs: {
    body: {
      fill: 'transparent',
      stroke: 'transparent'
    }
  },
  data: {
    type: 'echarts-gauge',
    presetId: 'basic',  // 预设样式
    value: 50,
    title: 'SCORE',
    name: 'Pressure'
  },
  // 接线柱配置
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
      },
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
      }
    },
    items: [
      { id: 'port-top', group: 'top' },
      { id: 'port-right', group: 'right' },
      { id: 'port-bottom', group: 'bottom' },
      { id: 'port-left', group: 'left' }
    ]
  },
  props: [
    {
      key: 'presetId',
      label: '仪表盘类型',
      type: 'select',
      path: 'data.presetId',
      defaultValue: 'basic',
      options: gaugePresets.map(preset => ({
        label: preset.name,
        value: preset.id
      })),
      description: '选择预设的仪表盘类型，会自动应用对应的配置'
    },
    {
      key: 'value',
      label: '当前值',
      type: 'number',
      path: 'data.value',
      defaultValue: 50,
      description: '仪表盘当前显示值'
    },
    {
      key: 'title',
      label: '标题',
      type: 'text',
      path: 'data.title',
      defaultValue: 'SCORE',
      description: '仪表盘标题'
    },
    {
      key: 'name',
      label: '系列名称',
      type: 'text',
      path: 'data.name',
      defaultValue: 'Pressure',
      description: '显示在 tooltip 中的系列名称'
    }
  ]
}
