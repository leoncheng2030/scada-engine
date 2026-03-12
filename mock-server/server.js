/**
 * SCADA 模拟后端服务
 * 提供设备数据接口，供前端 HTTP 数据源轮询
 * 
 * 启动方式: node mock-server/server.js
 * 接口地址: http://localhost:3001/api/devices/data
 */

import http from 'http'

const PORT = 3002

// 模拟设备数据 —— 每次请求返回随机波动的值
function generateDeviceData(deviceIds) {
  // 如果前端传了设备ID列表，只返回这些设备的数据
  // 如果没传，返回所有模拟设备
  const allDevices = {
    'reactor-tank': {
      id: 'reactor-tank',
      name: '反应罐',
      points: [
        { id: 'liquid_level', value: randomFloat(30, 90), unit: '%' },
        { id: 'temperature', value: randomFloat(20, 80), unit: '℃' },
        { id: 'pressure', value: randomFloat(0.1, 2.5), unit: 'MPa' },
        { id: 'stirrer_running', value: Math.random() > 0.3 }
      ]
    },
    'chimney': {
      id: 'chimney',
      name: '烟囱',
      points: [
        { id: 'smoke_density', value: randomFloat(10, 200), unit: 'mg/m³' },
        { id: 'exhaust_temp', value: randomFloat(80, 250), unit: '℃' },
        { id: 'is_active', value: Math.random() > 0.2 }
      ]
    },
    'cooling-tower': {
      id: 'cooling-tower',
      name: '冷却塔',
      points: [
        { id: 'inlet_temp', value: randomFloat(30, 50), unit: '℃' },
        { id: 'outlet_temp', value: randomFloat(20, 35), unit: '℃' },
        { id: 'is_running', value: Math.random() > 0.2 }
      ]
    },
    'fengji': {
      id: 'fengji',
      name: '风机',
      points: [
        { id: 'speed', value: randomFloat(800, 2500), unit: 'rpm' },
        { id: 'power', value: randomFloat(50, 300), unit: 'kW' },
        { id: 'is_running', value: Math.random() > 0.2 }
      ]
    },
    'tuoxiaoji': {
      id: 'tuoxiaoji',
      name: '脱硝机',
      points: [
        { id: 'nox_inlet', value: randomFloat(200, 600), unit: 'mg/m³' },
        { id: 'nox_outlet', value: randomFloat(20, 100), unit: 'mg/m³' },
        { id: 'efficiency', value: randomFloat(70, 98), unit: '%' },
        { id: 'is_running', value: Math.random() > 0.2 }
      ]
    },
    'yaolu': {
      id: 'yaolu',
      name: '窑炉',
      points: [
        { id: 'temperature', value: randomFloat(800, 1200), unit: '℃' },
        { id: 'pressure', value: randomFloat(-100, 100), unit: 'Pa' },
        { id: 'is_running', value: Math.random() > 0.2 }
      ]
    },
    'tower': {
      id: 'tower',
      name: '塔器',
      points: [
        { id: 'temperature', value: randomFloat(50, 200), unit: '℃' },
        { id: 'pressure', value: randomFloat(0.1, 5), unit: 'MPa' },
        { id: 'liquid_level', value: randomFloat(20, 80), unit: '%' }
      ]
    }
  }

  // 筛选请求的设备
  let result
  if (deviceIds && deviceIds.length > 0) {
    const devices = deviceIds
      .map(id => allDevices[id])
      .filter(Boolean)
    result = { devices }
  } else {
    result = { devices: Object.values(allDevices) }
  }

  return result
}

function randomFloat(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10
}

// 创建 HTTP 服务
const server = http.createServer((req, res) => {
  // CORS 头 —— 允许前端跨域访问
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // 设备数据接口
  if (req.url === '/api/devices/data') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      let deviceIds = []

      // 解析 POST 请求体中的设备ID列表
      if (body) {
        try {
          const parsed = JSON.parse(body)
          deviceIds = parsed.deviceIds || []
        } catch (e) {
          // 忽略解析错误
        }
      }

      const data = generateDeviceData(deviceIds)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(data))

      console.log(`[${new Date().toLocaleTimeString()}] ${req.method} /api/devices/data → 返回 ${data.devices.length} 个设备数据${deviceIds.length ? '（指定: ' + deviceIds.join(', ') + '）' : ''}`)
    })
    return
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not Found' }))
})

server.listen(PORT, () => {
  console.log(`\n🚀 SCADA 模拟后端已启动`)
  console.log(`📡 设备数据接口: http://localhost:${PORT}/api/devices/data`)
  console.log(`\n前端数据源配置:`)
  console.log(`  协议类型: HTTP`)
  console.log(`  接口地址: http://localhost:${PORT}/api/devices/data`)
  console.log(`  请求方法: POST`)
  console.log(`  轮询间隔: 3000 (ms)`)
  console.log(`  自动采集设备ID: 开启\n`)
})
