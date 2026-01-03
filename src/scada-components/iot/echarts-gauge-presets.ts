/**
 * ECharts 仪表盘预设样式配置
 * 优化版本：减少拥挤感，增加留白和可读性
 */

export interface GaugePreset {
  id: string
  name: string
  config: any
}

export const gaugePresets: GaugePreset[] = [
  {
    id: 'basic',
    name: '基础仪表盘',
    config: {
      min: 0,
      max: 100,
      splitNumber: 5,
      radius: '100%',
      axisLine: {
        lineStyle: {
          width: 10,
          color: [
            [0.3, '#67e0e3'],
            [0.7, '#37a2da'],
            [1, '#fd666d']
          ]
        }
      },
      axisTick: {
        distance: 2,
        length: 5,
        lineStyle: {
          color: '#fff',
          width: 1
        }
      },
      splitLine: {
        distance: 2,
        length: 10,
        lineStyle: {
          color: '#fff',
          width: 2
        }
      },
      axisLabel: {
        distance: 20,
        fontSize: 12,
        color: '#999'
      },
      title: {
        offsetCenter: [0, '90%'],
        fontSize: 14,
        color: '#999'
      },
      detail: {
        fontSize: 30,
        offsetCenter: [0, '45%'],
        color: '#fff',
        formatter: '{value}'
      }
    }
  },
  {
    id: 'temperature',
    name: '温度仪表盘',
    config: {
      min: -20,
      max: 50,
      splitNumber: 5,
      radius: '100%',
      axisLine: {
        lineStyle: {
          width: 10,
          color: [
            [0.2, '#2563eb'],
            [0.5, '#22c55e'],
            [0.8, '#f59e0b'],
            [1, '#ef4444']
          ]
        }
      },
      axisTick: {
        distance: 2,
        length: 5,
        lineStyle: {
          color: '#fff',
          width: 1
        }
      },
      splitLine: {
        distance: 2,
        length: 10,
        lineStyle: {
          color: '#fff',
          width: 2
        }
      },
      axisLabel: {
        distance: 10,
        fontSize: 12,
        color: '#999'
      },
      title: {
        offsetCenter: [0, '90%'],
        fontSize: 14,
        color: '#999'
      },
      detail: {
        fontSize: 30,
        offsetCenter: [0, '45%'],
        color: '#fff',
        formatter: '{value}°C'
      }
    }
  },
  {
    id: 'humidity',
    name: '湿度仪表盘',
    config: {
      min: 0,
      max: 100,
      splitNumber: 5,
      radius: '100%',
      axisLine: {
        lineStyle: {
          width: 10,
          color: [
            [0.3, '#fbbf24'],
            [0.7, '#3b82f6'],
            [1, '#1e40af']
          ]
        }
      },
      axisTick: {
        distance: 2,
        length: 5,
        lineStyle: {
          color: '#fff',
          width: 1
        }
      },
      splitLine: {
        distance: 2,
        length: 10,
        lineStyle: {
          color: '#fff',
          width: 2
        }
      },
      axisLabel: {
        distance: 20,
        fontSize: 12,
        color: '#999'
      },
      title: {
        offsetCenter: [0, '90%'],
        fontSize: 14,
        color: '#999'
      },
      detail: {
        fontSize: 30,
        offsetCenter: [0, '45%'],
        color: '#fff',
        formatter: '{value}%'
      }
    }
  },
  {
    id: 'speed',
    name: '速度仪表盘',
    config: {
      min: 0,
      max: 200,
      splitNumber: 10,
      startAngle: 225,
      endAngle: -45,
      radius: '100%',
      axisLine: {
        lineStyle: {
          width: 10,
          color: [
            [0.4, '#10b981'],
            [0.7, '#f59e0b'],
            [1, '#ef4444']
          ]
        }
      },
      axisTick: {
        distance: 2,
        length: 5,
        lineStyle: {
          color: '#fff',
          width: 1
        }
      },
      splitLine: {
        distance: 2,
        length: 10,
        lineStyle: {
          color: '#fff',
          width: 2
        }
      },
      axisLabel: {
        distance: 20,
        fontSize: 12,
        color: '#999'
      },
      title: {
        offsetCenter: [0, '90%'],
        fontSize: 14,
        color: '#999'
      },
      detail: {
        fontSize: 30,
        offsetCenter: [0, '45%'],
        color: '#fff',
        formatter: '{value} km/h'
      }
    }
  },
  {
    id: 'pressure',
    name: '压力仪表盘',
    config: {
      min: 0,
      max: 10,
      splitNumber: 5,
      radius: '100%',
      axisLine: {
        lineStyle: {
          width: 10,
          color: [
            [0.5, '#22c55e'],
            [0.8, '#f59e0b'],
            [1, '#dc2626']
          ]
        }
      },
      axisTick: {
        distance: 2,
        length: 5,
        lineStyle: {
          color: '#fff',
          width: 1
        }
      },
      splitLine: {
        distance: 2,
        length: 10,
        lineStyle: {
          color: '#fff',
          width: 2
        }
      },
      axisLabel: {
        distance: 20,
        fontSize: 12,
        color: '#999'
      },
      title: {
        offsetCenter: [0, '90%'],
        fontSize: 14,
        color: '#999'
      },
      detail: {
        fontSize: 30,
        offsetCenter: [0, '45%'],
        color: '#fff',
        formatter: '{value} MPa'
      }
    }
  },
  {
    id: 'rpm',
    name: '转速仪表盘',
    config: {
      min: 0,
      max: 8000,
      splitNumber: 8,
      startAngle: 225,
      endAngle: -45,
      radius: '100%',
      axisLine: {
        lineStyle: {
          width: 10,
          color: [
            [0.6, '#06b6d4'],
            [0.85, '#eab308'],
            [1, '#dc2626']
          ]
        }
      },
      axisTick: {
        distance: 2,
        length: 5,
        lineStyle: {
          color: '#fff',
          width: 1
        }
      },
      splitLine: {
        distance: 2,
        length: 10,
        lineStyle: {
          color: '#fff',
          width: 2
        }
      },
      axisLabel: {
        distance: 20,
        fontSize: 12,
        color: '#999'
      },
      title: {
        offsetCenter: [0, '90%'],
        fontSize: 14,
        color: '#999'
      },
      detail: {
        fontSize: 30,
        offsetCenter: [0, '45%'],
        color: '#fff',
        formatter: '{value} RPM'
      }
    }
  },
  {
    id: 'battery',
    name: '电池仪表盘',
    config: {
      min: 0,
      max: 100,
      splitNumber: 5,
      radius: '100%',
      axisLine: {
        lineStyle: {
          width: 10,
          color: [
            [0.2, '#dc2626'],
            [0.5, '#f59e0b'],
            [1, '#22c55e']
          ]
        }
      },
      axisTick: {
        distance: 2     ,
        length: 5,
        lineStyle: {
          color: '#fff',
          width: 1
        }
      },
      splitLine: {
        distance: 2,
        length: 10,
        lineStyle: {
          color: '#fff',
          width: 2
        }
      },
      axisLabel: {
        distance: 10,
        fontSize: 12,
        color: '#999'
      },
      title: {
        offsetCenter: [0, '80%'],
        fontSize: 12,
        color: '#999'
      },
      detail: {
        fontSize: 20,
        offsetCenter: [0, '45%'],
        color: '#fff',
        formatter: '{value}%'
      }
    }
  },
  {
    id: 'power',
    name: '功率仪表盘',
    config: {
      min: 0,
      max: 100,
      splitNumber: 5,
      radius: '100%',
      axisLine: {
        lineStyle: {
          width: 10,
          color: [
            [0.3, '#64748b'],
            [0.7, '#3b82f6'],
            [1, '#8b5cf6']
          ]
        }
      },
      axisTick: {
        distance: 2,
        length: 5,
        lineStyle: {
          color: '#fff',
          width: 1
        }
      },
      splitLine: {
        distance: 2,
        length: 10,
        lineStyle: {
          color: '#fff',
          width: 2
        }
      },
      axisLabel: {
        distance: 10,
        fontSize: 12,
        color: '#999'
      },
      title: {
        offsetCenter: [0, '90%'],
        fontSize: 12,
        color: '#999'
      },
      detail: {
        fontSize: 20,
        offsetCenter: [0, '45%'],
        color: '#fff',
        formatter: '{value} kW'
      }
    }
  }
]

/**
 * 根据预设ID获取预设配置
 */
export function getPresetById(presetId: string): GaugePreset | undefined {
  return gaugePresets.find(p => p.id === presetId)
}

/**
 * 应用预设配置到节点数据
 */
export function applyPresetConfig(presetId: string) {
  const preset = getPresetById(presetId)
  if (!preset) return {}
  
  return {
    presetId,
    ...preset.config
  }
}
