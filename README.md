# @nywqs/scada-engine

[![npm version](https://img.shields.io/npm/v/@nywqs/scada-engine.svg)](https://www.npmjs.com/package/@nywqs/scada-engine)
[![license](https://img.shields.io/npm/l/@nywqs/scada-engine.svg)](https://github.com/leoncheng2030/scada-engine/blob/main/LICENSE)

基于 AntV X6 + Vue 3 的自研 SCADA 组态引擎

## 特性

- ✅ **可视化编辑器**：拖拽式组态界面设计
- 🎭 **丰富组件库**：内置基础图形、IoT组件、图表等
- 🔗 **数据绑定**：支持设备数据点绑定和实时更新
- ⚡ **事件系统**：灵活的事件配置和交互响应
- 📝 **TypeScript**：完整的类型定义支持
- 🔄 **响应式**：基于 Vue 3 Composition API
- 🎨 **动画引擎**：支持节点和连线动画效果
- 👀 **预览模式**：支持编辑模式和预览模式切换
- 📡 **数据集成**：支持多种数据源集成方式
- 📱 **自适应**：画布自动适配不同屏幕尺寸

## 安装

```bash
npm install @nywqs/scada-engine
# 或
pnpm add @nywqs/scada-engine
# 或
yarn add @nywqs/scada-engine
```

### Peer Dependencies

请确保已安装以下依赖：

```bash
npm install vue@^3.4.0 vue-router@^4.6.0 @antv/x6@^2.18.0 echarts@^5.5.0 pinia@^2.1.0
```

## 快速开始

### 安装

```bash
npm install @nywqs/scada-engine@latest
```

### 全局注册

```typescript
import { createApp } from 'vue'
import ScadaEngine from '@nywqs/scada-engine'
import '@nywqs/scada-engine/dist/scada-engine.css'

const app = createApp(App)
app.use(ScadaEngine)
app.mount('#app')
```

### 按需引入

```vue
<template>
  <div class="app-container">
    <ScadaCanvas 
      @node-click="handleNodeClick"
      @node-update="handleNodeUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ScadaCanvas } from '@nywqs/scada-engine'
import '@nywqs/scada-engine/dist/scada-engine.css'

const handleNodeClick = (node: any) => {
  console.log('Node clicked:', node)
}

const handleNodeUpdate = (data: any) => {
  console.log('Node updated:', data)
}
</script>
```

## 组件列表

### 核心组件

- `ScadaCanvas`：画布组件（核心），支持编辑和预览模式
- `PropertyPanel`：属性面板，配置节点和连线属性
- `ComponentLibrary`：组件库面板，拖拽添加组件
- `CanvasConfigPanel`：画布配置面板
- `Header`：顶部工具栏

### 辅助组件

- `BindingCard`：数据绑定卡片，配置设备数据点绑定
- `EventCard`：事件配置卡片，配置交互事件
- `BasicPropertiesTab`：基础属性标签页
- `DataPropertiesTab`：数据属性标签页
- `EdgePropertiesTab`：连线属性标签页
- `AttributeConfigDialog`：属性配置对话框
- `CustomCodeDialog`：自定义代码对话框
- `DevicePointSelector`：设备数据点选择器
- `MappingConfigurator`：映射配置器
- `WorkflowSelectorDialog`：流程选择对话框

### 内置组件库

#### 基础组件（basic）
- 矩形（rect）
- 圆形（circle）
- 文本（text）

#### IoT组件（iot）
- 仪表盘（gauge）：支持ECharts仪表盘展示
- 指示灯（light）：支持开关状态指示
- 开关（switch）：支持设备控制

#### 画布配置
- 画布尺寸：支持多种预设尺寸（1920x1080、1366x768等）和自定义尺寸
- 背景设置：支持颜色、图片背景
- 网格配置：支持网格显示、类型、大小设置
- 缩放控制：支持画布缩放和自适应屏幕
- 参考线：支持对齐参考线
- 磁吸功能：支持节点磁吸对齐

## API

### ScadaCanvas 组件 API

`ScadaCanvas` 组件通过 `defineExpose` 暴露了一系列核心方法，供外部编程调用：

```vue
<template>
  <ScadaCanvas ref="canvasRef" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ScadaCanvas } from '@nywqs/scada-engine'

const canvasRef = ref()

// 使用暴露的方法
const handleCustomSave = () => {
  canvasRef.value?.save()
}

const handleCustomExport = () => {
  canvasRef.value?.export()
}

const handleCustomImport = () => {
  canvasRef.value?.import()
}

const handleGetData = () => {
  const data = canvasRef.value?.getCanvasData()
  console.log('画布数据:', data)
}

const handleLoadData = (jsonData: any) => {
  const success = canvasRef.value?.loadCanvasData(jsonData)
  if (success) {
    console.log('加载成功')
  }
}
</script>
```

#### 暴露的方法列表

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| `save()` | - | `void` | 保存画布数据到 localStorage |
| `import()` | - | `void` | 触发文件选择，导入 JSON 数据 |
| `export()` | - | `void` | 导出画布数据为 JSON 文件 |
| `preview()` | - | `void` | 跳转到预览页面 |
| `workflow()` | - | `void` | 打开流程编排弹窗 |
| `zoomIn()` | - | `void` | 放大画布 |
| `zoomOut()` | - | `void` | 缩小画布 |
| `clearAll()` | - | `void` | 清空画布所有元素 |
| `getGraph()` | - | `Graph \| null` | 获取 X6 Graph 实例 |
| `getCanvasData()` | - | `object \| null` | 获取画布完整数据 |
| `loadCanvasData(data)` | `data: any` | `boolean` | 加载画布数据 |

#### getCanvasData() 返回数据结构

```typescript
{
  version: string         // 版本号
  timestamp: string       // 时间戳
  config: object          // 画布配置
  cells: array            // X6 画布元素
  nodes: array            // 节点数据
  edges: array            // 连线数据
}
```

#### 完整示例：自定义工具栏

```vue
<template>
  <div class="custom-editor">
    <!-- 自定义工具栏 -->
    <div class="custom-toolbar">
      <button @click="handleSave">保存</button>
      <button @click="handleExport">导出</button>
      <button @click="handleImport">导入</button>
      <button @click="handleGetData">获取数据</button>
      <button @click="handleZoomIn">放大</button>
      <button @click="handleZoomOut">缩小</button>
    </div>
    
    <!-- 画布组件 -->
    <ScadaCanvas ref="canvasRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ScadaCanvas } from '@nywqs/scada-engine'

const canvasRef = ref()

const handleSave = () => {
  canvasRef.value?.save()
  console.log('已保存')
}

const handleExport = () => {
  canvasRef.value?.export()
}

const handleImport = () => {
  canvasRef.value?.import()
}

const handleGetData = () => {
  const data = canvasRef.value?.getCanvasData()
  console.log('画布数据:', data)
  
  // 可以将数据发送到服务器
  // await api.saveCanvas(data)
}

const handleZoomIn = () => {
  canvasRef.value?.zoomIn()
}

const handleZoomOut = () => {
  canvasRef.value?.zoomOut()
}
</script>
```

### 组件注册系统

```typescript
import { componentRegistry } from '@nywqs/scada-engine'

// 获取所有组件
const components = componentRegistry.getAllComponents()

// 按分类获取组件
const basicComponents = componentRegistry.getComponentsByCategory('basic')
```

### 画布配置

```typescript
import { canvasConfigManager } from '@nywqs/scada-engine'

// 获取画布配置
const config = canvasConfigManager.getConfig()

// 更新画布大小
canvasConfigManager.updateSize({ width: 1920, height: 1080 })
```

### 类型定义

```typescript
import type { 
  EventConfig, 
  BindingConfig,
  ComponentConfig,
  ComponentCategory,
  Device,
  DevicePoint,
  DeviceList,
  PointDataType,
  PointAccessMode
} from '@nywqs/scada-engine'

// 设备点位相关枚举
import {
  DeviceStatus,
  DeviceType,
  PointDataType,
  PointAccessMode
} from '@nywqs/scada-engine'
```

## 数据集成

SCADA引擎支持多种方式集成设备数据，实现数据绑定和实时更新。

### 1. 通过组件属性传递数据

```vue
<template>
  <ScadaCanvas 
    :device-data="deviceData"
    :data-source="dataConfig"
  />
</template>

<script setup lang="ts">
import { ScadaCanvas } from '@nywqs/scada-engine'

// 设备数据
const deviceData = {
  devices: [
    {
      id: 'device_001',
      name: '1号温控设备',
      status: 'online',
      points: [
        {
          id: 'point_001_01',
          name: '当前温度',
          value: 25.5,
          dataType: 'number',
          unit: '°C'
        }
      ]
    }
  ]
}

// 数据源配置
const dataConfig = {
  type: 'websocket', // 或 'mqtt', 'http', 'sse'
  url: 'ws://localhost:8080/device-data',
  interval: 1000 // 更新间隔(毫秒)
}
</script>
```

### 2. 通过暴露的方法更新数据

```vue
<template>
  <ScadaCanvas ref="scadaRef" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ScadaCanvas } from '@nywqs/scada-engine'

const scadaRef = ref()

// 获取设备数据并更新到画布
const updateDeviceData = async () => {
  // 从主应用的API获取设备数据
  const deviceData = await fetchDeviceDataFromAPI()
  
  // 通过暴露的方法更新到画布组件
  scadaRef.value?.updateDeviceData(deviceData)
}

onMounted(() => {
  // 定时更新设备数据
  setInterval(updateDeviceData, 1000)
})
</script>
```

### 3. 使用事件绑定方式

```vue
<template>
  <ScadaCanvas 
    @data-request="handleDataRequest"
    @data-update="handleDataUpdate"
  />
</template>

<script setup lang="ts">
import { ScadaCanvas } from '@nywqs/scada-engine'

// 当画布需要数据时触发
const handleDataRequest = (requestData: any) => {
  // 根据请求参数获取对应设备数据
  const deviceData = getDeviceData(requestData.deviceIds)
  
  // 返回数据给画布
  return deviceData
}

// 当画布数据更新时触发
const handleDataUpdate = (updatedData: any) => {
  // 将更新的数据发送到主应用的设备系统
  updateDeviceValues(updatedData)
}
</script>
```

### 4. 数据格式要求

设备数据应遵循以下格式：

```typescript
interface DeviceData {
  devices: Array<{
    id: string        // 设备唯一标识
    name: string      // 设备名称
    status: 'online' | 'offline' | 'error' | 'maintenance'
    points: Array<{
      id: string      // 点位唯一标识
      name: string    // 点位名称
      value: any      // 点位值
      dataType: 'number' | 'boolean' | 'string'
      unit?: string   // 单位
      quality: 'good' | 'bad' | 'uncertain' // 数据质量
      updateTime: string // 更新时间
    }>
  }>
}
```

推荐使用事件绑定方式或数据绑定配置，这两种方式可以实现主应用与SCADA引擎的双向数据同步，既灵活又高效。

## 使用示例

### 完整编辑器应用

```vue
<template>
  <div class="scada-editor">
    <Header 
      @save="handleSave"
      @export="handleExport"
      @preview="handlePreview"
    />
    
    <div class="editor-body">
      <ComponentLibrary />
      
      <ScadaCanvas 
        ref="canvasRef"
        @node-select="handleNodeSelect"
      />
      
      <PropertyPanel 
        v-if="selectedNode"
        :selected-node="selectedNode"
        @update-node="handleUpdateNode"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  Header, 
  ComponentLibrary, 
  ScadaCanvas, 
  PropertyPanel 
} from '@nywqs/scada-engine'
import '@nywqs/scada-engine/dist/scada-engine.css'

const canvasRef = ref()
const selectedNode = ref(null)

const handleNodeSelect = (node: any) => {
  selectedNode.value = node
}

const handleUpdateNode = (data: any) => {
  // 更新节点数据
}

const handleSave = () => {
  // 保存逻辑
}

const handleExport = () => {
  // 导出逻辑
}

const handlePreview = () => {
  // 预览逻辑
}
</script>
```

### 软件授权使用

本软件默认在底部显示版权信息。如需隐藏或修改版权信息，必须使用有效的数字签名令牌与公钥。

#### 获取授权

请联系作者获取：
1. **授权令牌 (Token)**：包含公司名、有效期等信息的签名串。
2. **公钥 (Public Key)**：用于验证签名的 `public.pem` 文件内容。

- 邮箱：nywqs@outlook.com
- 电话：18637762001

#### 使用方式

在使用 `ScadaCanvas` 组件时，需同时传入 `auth-code`（令牌）与 `public-key-pem`（公钥内容）。

```vue
<template>
  <ScadaCanvas 
    :auth-code="licenseToken"
    :public-key-pem="publicKey"
    :custom-footer="{
      copyright: '© 2025 您的公司',
      license: '商业授权使用',
      contact: '联系方式: support@yourcompany.com'
    }"
  />
</template>

<script setup lang="ts">
// 填入从授权方获取的 Token 字符串
const licenseToken = 'eyJh...<完整Token字符串>'

// 填入 public.pem 的完整内容
const publicKey = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAExxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxx==
-----END PUBLIC KEY-----`
</script>
```

**授权模式说明**
- 未提供有效 Token 或 公钥验证失败：显示默认版权信息
- 验证通过 + 无 customFooter：隐藏 Footer
- 验证通过 + customFooter：显示自定义 Footer

**授权验证机制**
采用 ECDSA P-256 + SHA-256 数字签名技术。前端仅持有公钥进行验签，无法伪造授权。

控制台会输出授权验证信息：
```javascript
✅ 授权验证成功
🏛️ 授权公司: ACME Corp
📅 有效期至: 2026-12-31
```

## 预览模式

ScadaCanvas 组件支持预览模式，用于在运行时展示组态画面：

```vue
<template>
  <ScadaCanvas 
    :preview-mode="true"
    :auth-code="authCode"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ScadaCanvas } from '@nywqs/scada-engine'

const authCode = ref('your-auth-code')

// 预览模式特性：
// 1. 隐藏编辑工具栏和组件库
// 2. 禁止节点移动和编辑
// 3. 仅显示画布和组件
// 4. 支持动画自动播放
// 5. 支持实时数据更新
</script>
```

## 开发

```bash
# 克隆项目
git clone https://github.com/yourusername/scada-engine.git

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建库
npm run build:lib
```

## 发布到 npm

```bash
# 1. 登录 npm
npm login

# 2. 构建库
npm run build:lib

# 3. 发布（首次发布公开包）
npm publish --access public

# 4. 后续版本更新
npm version patch  # 补丁版本 1.0.0 -> 1.0.1
npm version minor  # 次版本 1.0.0 -> 1.1.0
npm version major  # 主版本 1.0.0 -> 2.0.0
npm publish
```

## 版本管理建议

- patch (1.0.x)：Bug 修复、小改进
- minor (1.x.0)：新功能、向后兼容
- major (x.0.0)：破坏性更新、重大重构

## 版本历史

完整的版本更新记录请查看 [CHANGELOG.md](./CHANGELOG.md)

### 1.1.27 (2025-01-16)
- 修复 `ScadaCanvas.vue` 中 `calculateContainerSize` 函数的 TypeScript 类型声明
- 为函数添加明确的返回类型注解，消除 TS6133 警告

### 1.1.26 (2025-01-16)
- 创建版本更新历史记录文档 CHANGELOG.md
- 建立版本发布规范和记录模板

### 1.1.20 (2026-01-06)
- 画布自适应缩放：支持不同分辨率设备自动适配显示
- 组件库折叠展开：基础组件和IoT组件分组可收缩
- 组件库三列布局：优化组件展示，更紧凑的空间利用
- 画布自定义尺寸：支持800-7680px宽度，600-4320px高度
- 设备点位类型导出：完整的Device、DevicePoint等类型定义

### 1.1.11 (2025-12-30)
- 修复预览按钮事件触发问题
- 优化路由跳转逻辑
- 添加详细调试日志

### 1.1.10 (2025-12-30)
- 添加预览事件支持
- 优化事件触发机制

### 1.0.0
- 初始版本发布
- 基础组态编辑功能
- 支持基础组件和IoT组件

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可协议

本项目采用 **MIT 许可协议**，详见 [LICENSE](LICENSE) 文件。

- 允许商业使用、修改、分发
- 需保留版权声明与许可文本
- 软件按“原样”提供，无任何担保

如需商业授权，请联系作者。

## 作者

**leoncheng**

- 📧 邮箱：nywqs@outlook.com
- 📱 电话：18637762001

如有任何问题或商业合作需求，欢迎联系。
