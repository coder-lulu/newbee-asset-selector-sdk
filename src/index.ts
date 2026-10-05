// NewBee Asset Selector SDK
// 通用资产选择器SDK，支持多种数据源和配置

// ===== 核心组件导出 =====
export { default as AssetSelector } from './components/AssetSelector.vue'

// ===== Composables导出 =====
export { useAssetSelector, useSimpleAssetSelector, useAdvancedAssetSelector, useCMDBAssetSelector } from './composables/useAssetSelector'

// ===== 服务层导出 =====
export { AssetService, BaseAssetService, createAssetService, AssetServiceManager, globalServiceManager, getDefaultAssetService } from './services/AssetService'
export { MockAssetService } from './services/MockAssetService'

// ===== 配置系统导出 =====
export { AssetSelectorConfigBuilder, createAssetSelectorConfig, QuickConfigs } from './config/ConfigBuilder'
export { ConfigManager, EnvironmentPresets, createConfigForEnvironment, initializeGlobalConfig } from './config/ConfigManager'

// ===== 工厂函数导出 =====
export { createAssetSelector, AssetSelectorFactory, AssetSelectorPlugin, install as installPlugin } from './factory/AssetSelectorFactory'
export type { AssetSelectorInstance, CreateAssetSelectorOptions } from './factory/AssetSelectorFactory'

// ===== 微服务集成导出 =====
export { 
  MicroserviceIntegration,
  createCMDBIntegration,
  createMonitoringIntegration,
  createInventoryIntegration,
  createGenericIntegration,
  createMultipleIntegrations
} from './integration/MicroserviceIntegration'
export type { 
  MicroserviceConfig,
  CMDBIntegrationOptions,
  MonitoringIntegrationOptions,
  InventoryIntegrationOptions
} from './integration/MicroserviceIntegration'

// ===== 事件系统导出 =====
export { 
  EventBus, 
  AssetSelectorEventManager, 
  globalEventBus,
  createEventManager,
  measurePerformance
} from './events/EventSystem'
export type { 
  AssetSelectorEvents, 
  EventName, 
  EventHandler, 
  EventPayload 
} from './events/EventSystem'

// ===== 类型定义（统一导出） =====
export type {
  // 基础类型
  Asset,
  AssetType,
  AssetField,
  AssetRelationship,
  FieldOption,
  FieldValidation,
  
  // 枚举类型
  FieldType,
  AssetStatus,
  FilterOperator,
  
  // 查询和响应类型
  AssetQuery,
  AssetFilter,
  SortField,
  AssetListResponse,
  
  // 配置类型
  AssetSelectorConfig,
  AssetServiceConfig,
  AssetSelectorProps,
  AssetSelectorRef,
  AssetSelectorSDKOptions,
  
  // 服务接口类型
  AssetService,
  PermissionService,
  CacheService,
  
  // 插件系统类型
  SelectorPlugin,
  PluginContext,
  
  // 验证和建议类型
  ValidationResult,
  ValidationError,
  ValidationWarning,
  Suggestion,
  
  // 权限类型
  AssetPermissionScope,
  
  // 事件类型
  AssetSelectorEvent,
  
  // 缓存类型
  CacheOptions,
  CacheEntry,
  
  // 工厂函数类型
  CreateAssetSelectorOptions,
  AssetSelectorInstance
} from './types'

// ===== 待实现的功能（TODO） =====

// TODO: Vue组件
// export { default as AssetSelector } from './components/AssetSelector.vue'
// export { default as AssetSelectorSimple } from './components/AssetSelectorSimple.vue'

// TODO: 服务层
// export { AssetService } from './services/AssetService'
// export { CMDBAssetService } from './services/CMDBAssetService'

// TODO: 适配器
// export { AssetServiceAdapter } from './adapters/AssetServiceAdapter'

// TODO: 插件系统
// export { PluginManager } from './plugins/PluginManager'

// TODO: Composables
// export { useAssetSelector } from './composables/useAssetSelector'

// TODO: 缓存管理
// export { CacheManager } from './cache/CacheManager'

// TODO: 工具类
// export { EventBus } from './utils/EventBus'

// TODO: 常量
// export { DEFAULT_CONFIG } from './constants'

// ===== Vue插件安装 =====
import type { App } from 'vue'
import AssetSelector from './components/AssetSelector.vue'
import { AssetSelectorPlugin } from './factory/AssetSelectorFactory'
import type { AssetSelectorSDKOptions } from './types'

// Vue插件安装函数
export const install = (app: App, options: AssetSelectorSDKOptions = {}) => {
  app.use(AssetSelectorPlugin, options)
}

// 默认导出
export default {
  install,
  AssetSelector,
  createAssetSelector,
  AssetSelectorFactory: AssetSelectorFactory,
  MicroserviceIntegration,
  ConfigManager,
  AssetSelectorConfigBuilder,
  EventBus,
  AssetSelectorEventManager,
  version: '1.0.0-beta'
}