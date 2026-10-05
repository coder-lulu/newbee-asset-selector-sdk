# @newbee/asset-selector-sdk

通用资产选择器SDK - 支持多微服务集成的高性能、可扩展资产选择组件。

## 特性

- 🚀 **高性能** - 虚拟滚动、智能分页、多层缓存
- 🔌 **插件化** - 完全可扩展的插件架构
- 🎨 **主题系统** - 支持多种UI框架和自定义主题
- 🔧 **配置驱动** - 灵活的配置系统，支持多种使用场景
- 🌐 **多服务支持** - CMDB、Kubernetes、Docker等
- 📱 **响应式** - 移动端友好的自适应设计
- 🔒 **权限控制** - 完整的多租户和数据权限支持
- 💾 **智能缓存** - 多层缓存策略，提升用户体验

## 安装

```bash
npm install @newbee/asset-selector-sdk
# 或
yarn add @newbee/asset-selector-sdk
# 或
pnpm add @newbee/asset-selector-sdk
```

## 快速开始

### 基础使用

```vue
<template>
  <div>
    <AssetSelector
      :open="visible"
      :multiple="true"
      @confirm="handleConfirm"
      @cancel="visible = false"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { AssetSelector } from '@newbee/asset-selector-sdk'

const visible = ref(false)

const handleConfirm = (assets) => {
  console.log('选中的资产:', assets)
  visible.value = false
}
</script>
```

### Vue插件方式

```typescript
import { createApp } from 'vue'
import AssetSelectorSDK from '@newbee/asset-selector-sdk'

const app = createApp(App)

app.use(AssetSelectorSDK, {
  // 全局配置
  config: {
    displayMode: 'table',
    pageSize: 20
  },
  // 服务配置
  serviceConfig: {
    mode: 'cmdb',
    endpoints: {
      getAssets: '/api/cmdb/v1/cis'
    }
  }
})
```

### 工厂函数方式

```typescript
import { createAssetSelector } from '@newbee/asset-selector-sdk'

// 创建选择器实例
const selector = createAssetSelector({
  container: '#selector-container',
  config: {
    displayMode: 'card',
    multiSelect: true
  },
  onConfirm: (assets) => {
    console.log('选择完成:', assets)
  }
})

// 显示选择器
selector.show()
```

## 配置系统

### 预设配置

```typescript
import { ConfigPresets, createAssetSelector } from '@newbee/asset-selector-sdk'

// CMDB模式
const cmdbSelector = createAssetSelector({
  ...ConfigPresets.cmdb('https://api.example.com'),
  onConfirm: handleConfirm
})

// 简单模式
const simpleSelector = createAssetSelector({
  ...ConfigPresets.simple(),
  onConfirm: handleConfirm
})

// 移动端模式
const mobileSelector = createAssetSelector({
  ...ConfigPresets.mobile(),
  onConfirm: handleConfirm
})
```

### 配置构建器

```typescript
import { AssetSelectorConfigBuilder } from '@newbee/asset-selector-sdk'

const config = AssetSelectorConfigBuilder
  .create()
  .displayMode('table')
  .pageSize(50)
  .enableSearch(true)
  .enableFilter(true)
  .multiSelect(true)
  .displayFields(['name', 'ip', 'status'])
  .searchFields(['name', 'ip'])
  .theme('antd')
  .build()
```

## 服务适配器

### CMDB集成

```typescript
import { CMDBAssetService } from '@newbee/asset-selector-sdk'

const service = new CMDBAssetService({
  endpoints: {
    getAssets: '/api/cmdb/v1/cis',
    getAssetTypes: '/api/cmdb/v1/ci-types'
  },
  authentication: {
    type: 'jwt',
    config: {
      token: 'your-jwt-token'
    }
  }
})
```

### 自定义服务

```typescript
import { AssetService } from '@newbee/asset-selector-sdk'

class CustomAssetService extends AssetService {
  async getAssets(query) {
    // 自定义实现
    const response = await fetch('/api/custom/assets', {
      method: 'POST',
      body: JSON.stringify(query)
    })
    return response.json()
  }
}
```

## 插件系统

### 内置插件

```typescript
import { 
  CMDBPlugin, 
  PermissionPlugin, 
  ValidationPlugin,
  AuditPlugin 
} from '@newbee/asset-selector-sdk'

// 注册插件
const selector = createAssetSelector({
  plugins: [
    new CMDBPlugin(),
    new PermissionPlugin({
      checkPermission: async (assets) => {
        // 权限检查逻辑
        return true
      }
    }),
    new ValidationPlugin({
      rules: ['required', 'unique']
    }),
    new AuditPlugin({
      onSelect: (assets) => {
        console.log('审计日志:', assets)
      }
    })
  ]
})
```

### 自定义插件

```typescript
import { createPlugin } from '@newbee/asset-selector-sdk'

const customPlugin = createPlugin({
  name: 'custom-validation',
  version: '1.0.0',
  hooks: {
    async onBeforeSelect(assets, context) {
      // 选择前验证
      const valid = await validateAssets(assets)
      if (!valid) {
        context.showMessage('error', '资产验证失败')
        return false
      }
      return true
    },
    async onAfterSelect(assets, context) {
      // 选择后处理
      await logSelection(assets)
    }
  }
})
```

## 高级功能

### 微服务集成

```typescript
import { IntegrationUtils } from '@newbee/asset-selector-sdk'

// 微服务模式
const serviceConfig = IntegrationUtils.microservice('asset-service', {
  gateway: 'https://api-gateway.example.com',
  version: 'v2',
  namespace: 'services'
})

const selector = createAssetSelector({
  ...serviceConfig,
  config: {
    displayMode: 'table'
  }
})

// Kubernetes集成
const k8sConfig = IntegrationUtils.kubernetes(
  'https://k8s-cluster.example.com',
  'production'
)

// Docker集成
const dockerConfig = IntegrationUtils.docker('tcp://docker-host:2376')
```

### 缓存策略

```typescript
import { CacheManager, MemoryCache, LocalStorageCache } from '@newbee/asset-selector-sdk'

// 配置缓存
const cacheManager = new CacheManager({
  strategies: [
    new MemoryCache({ maxSize: 1000, ttl: 300000 }), // 5分钟内存缓存
    new LocalStorageCache({ ttl: 3600000 }) // 1小时本地存储缓存
  ]
})

const selector = createAssetSelector({
  serviceConfig: {
    cache: cacheManager
  }
})
```

### 主题定制

```typescript
import { ThemeFactory } from '@newbee/asset-selector-sdk'

// 使用预设主题
const antdTheme = ThemeFactory.antd()
const elementTheme = ThemeFactory.elementPlus()

// 自定义主题
const customTheme = ThemeFactory.custom({
  primaryColor: '#ff6b35',
  backgroundColor: '#f8f9fa',
  textColor: '#343a40'
})

const selector = createAssetSelector({
  config: {
    ...customTheme
  }
})
```

## API参考

### AssetSelectorProps

```typescript
interface AssetSelectorProps {
  open: boolean                    // 是否显示
  title?: string                   // 标题
  multiple?: boolean               // 是否多选
  selectedAssets?: Asset[]         // 已选择的资产
  allowedTypes?: string[]          // 允许的资产类型
  maxSelection?: number            // 最大选择数量
  minSelection?: number            // 最小选择数量
  config?: AssetSelectorConfig     // 选择器配置
  serviceConfig?: AssetServiceConfig // 服务配置
  onConfirm?: (assets: Asset[]) => void    // 确认回调
  onCancel?: () => void            // 取消回调
  onError?: (error: Error) => void // 错误回调
}
```

### AssetSelectorConfig

```typescript
interface AssetSelectorConfig {
  displayMode: 'table' | 'card' | 'list'  // 显示模式
  pageSize: number                         // 每页大小
  enableSearch: boolean                    // 启用搜索
  enableFilter: boolean                    // 启用过滤
  multiSelect: boolean                     // 多选模式
  showTypeFilter: boolean                  // 显示类型过滤
  displayFields: string[]                  // 显示字段
  searchFields: string[]                   // 搜索字段
  sortFields: SortField[]                  // 排序字段
  requirePermission: boolean               // 需要权限验证
  allowedTypes: string[]                   // 允许的类型
  theme: string                            // 主题名称
  customStyles: Record<string, any>        // 自定义样式
}
```

### AssetService

```typescript
interface AssetService {
  getAssetTypes(filter?: any): Promise<AssetType[]>
  getAssets(query: AssetQuery): Promise<AssetListResponse>
  getAssetDetail(id: string): Promise<Asset>
  getSearchSuggestions(input: string): Promise<Suggestion[]>
  validateAssetSelection(assets: Asset[]): Promise<ValidationResult>
}
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情

## 更新日志

### v1.0.0

- 🎉 首次发布
- ✨ 完整的资产选择器功能
- 🔌 插件化架构
- 🎨 多主题支持
- 🚀 高性能优化
- 📚 完整的文档和示例

## 支持

- 📖 [文档](https://docs.example.com/asset-selector-sdk)
- 🐛 [问题反馈](https://github.com/coder-lulu/newbee/issues)
- 💬 [讨论区](https://github.com/coder-lulu/newbee/discussions)
- 📧 [邮件支持](mailto:support@example.com)

## 相关项目

- [NewBee CMDB](https://github.com/coder-lulu/newbee) - 企业级配置管理数据库
- [NewBee UI](https://github.com/coder-lulu/newbee-ui) - 统一UI组件库