import type { ComponentConfig } from '../types'
import { linePresets } from './echarts-line-presets'
import EChartsLine from './EChartsLine.vue'

/**
 * ECharts 折线图组件配置
 */
export const EChartsLineComponent: ComponentConfig = {
  metadata: {
    id: 'echarts-line',
    name: 'ECharts折线图',
    category: 'iot',
    icon: '📉',
    description: 'ECharts 折线图数据展示组件，支持时序数据可视化',
    version: '1.0.0'
  },
  shape: 'echarts-line-vue',
  component: EChartsLine,
  width: 400,
  height: 300,
  label: '',
  attrs: {
    body: {
      fill: 'transparent',
      stroke: 'transparent'
    }
  },
  data: {
    type: 'echarts-line',
    presetId: 'basic',
    title: '数据趋势',
    xAxisData: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    seriesData: [120, 200, 150, 80, 70, 110, 130],
    seriesName: 'Data'
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
      label: '折线图类型',
      type: 'select',
      path: 'data.presetId',
      defaultValue: 'basic',
      options: linePresets.map(preset => ({
        label: preset.name,
        value: preset.id
      })),
      description: '选择预设的折线图类型'
    },
    {
      key: 'title',
      label: '图表标题',
      type: 'text',
      path: 'data.title',
      defaultValue: '数据趋势',
      description: '折线图标题'
    },
    {
      key: 'seriesName',
      label: '系列名称',
      type: 'text',
      path: 'data.seriesName',
      defaultValue: 'Data',
      description: '显示在 tooltip 和 legend 中的系列名称'
    }
  ],
  // 组件预定义的数据点位
  points: [
    {
      id: 'series_data',
      name: '系列数据',
      description: '折线图Y轴数据数组',
      dataType: 'json',
      defaultValue: [120, 200, 150, 80, 70, 110, 130],
      required: true
    },
    {
      id: 'x_axis_data',
      name: 'X轴数据',
      description: '折线图X轴标签数组',
      dataType: 'json',
      defaultValue: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      required: false
    },
    {
      id: 'title',
      name: '图表标题',
      description: '折线图显示标题',
      dataType: 'string',
      defaultValue: '数据趋势',
      required: false
    }
  ]
}
