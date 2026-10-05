// SDK配置构建器
// 提供流式API创建复杂配置

import type { AssetSelectorConfig, SortField } from '../types'

export class AssetSelectorConfigBuilder {
  private config: Partial<AssetSelectorConfig> = {}

  static create() {
    return new AssetSelectorConfigBuilder()
  }

  displayMode(mode: 'table' | 'card' | 'list') {
    this.config.displayMode = mode
    return this
  }

  pageSize(size: number) {
    this.config.pageSize = size
    return this
  }

  enableSearch(enabled: boolean = true) {
    this.config.enableSearch = enabled
    return this
  }

  enableFilter(enabled: boolean = true) {
    this.config.enableFilter = enabled
    return this
  }

  multiSelect(enabled: boolean = true) {
    this.config.multiSelect = enabled
    return this
  }

  showTypeFilter(show: boolean = true) {
    this.config.showTypeFilter = show
    return this
  }

  displayFields(fields: string[]) {
    this.config.displayFields = [...fields]
    return this
  }

  searchFields(fields: string[]) {
    this.config.searchFields = [...fields]
    return this
  }

  sortFields(fields: SortField[]) {
    this.config.sortFields = [...fields]
    return this
  }

  allowedTypes(types: string[]) {
    this.config.allowedTypes = [...types]
    return this
  }

  requirePermission(required: boolean = true) {
    this.config.requirePermission = required
    return this
  }

  theme(themeName: string) {
    this.config.theme = themeName
    return this
  }

  customStyle(key: string, value: any) {
    if (!this.config.customStyles) {
      this.config.customStyles = {}
    }
    this.config.customStyles[key] = value
    return this
  }

  customStyles(styles: Record<string, any>) {
    this.config.customStyles = { ...styles }
    return this
  }

  metadata(key: string, value: any) {
    if (!this.config.metadata) {
      this.config.metadata = {}
    }
    this.config.metadata[key] = value
    return this
  }

  metadataObject(metadata: Record<string, any>) {
    this.config.metadata = { ...metadata }
    return this
  }

  validation(rules: string[]) {
    this.config.validationRules = [...rules]
    return this
  }

  // 快捷配置方法
  simple() {
    return this
      .displayMode('card')
      .enableFilter(false)
      .showTypeFilter(false)
      .displayFields(['name', 'status'])
      .searchFields(['name'])
      .multiSelect(false)
  }

  advanced() {
    return this
      .displayMode('table')
      .enableFilter(true)
      .showTypeFilter(true)
      .displayFields(['name', 'ip', 'hostname', 'status', 'owner', 'department'])
      .searchFields(['name', 'ip', 'hostname', 'description'])
      .multiSelect(true)
  }

  compact() {
    return this
      .displayMode('list')
      .pageSize(50)
      .showTypeFilter(false)
      .displayFields(['name', 'status'])
      .searchFields(['name'])
  }

  mobile() {
    return this
      .displayMode('card')
      .pageSize(10)
      .showTypeFilter(false)
      .displayFields(['name', 'status'])
      .searchFields(['name'])
      .customStyles({
        cardSize: 'small',
        responsive: true,
        mobile: true
      })
  }

  cmdb() {
    return this
      .displayMode('table')
      .enableFilter(true)
      .showTypeFilter(true)
      .displayFields(['name', 'ip', 'hostname', 'status', 'heartbeat'])
      .searchFields(['name', 'ip', 'hostname'])
      .requirePermission(true)
      .validation(['cmdb_validation'])
      .metadata('source', 'cmdb')
      .metadata('enableRelationship', true)
  }

  // 响应式配置
  responsive() {
    return this.customStyles({
      responsive: true,
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200
      }
    })
  }

  // 性能优化配置
  performance() {
    return this
      .pageSize(20)
      .customStyles({
        virtualScroll: true,
        lazyLoad: true,
        cacheEnabled: true
      })
      .metadata('performance', 'optimized')
  }

  // 安全配置
  secure() {
    return this
      .requirePermission(true)
      .validation(['permission_check', 'data_validation'])
      .metadata('security', 'enabled')
      .metadata('auditLog', true)
  }

  build(): AssetSelectorConfig {
    const now = new Date().toISOString()
    
    const defaultConfig: AssetSelectorConfig = {
      id: `config_${Date.now()}`,
      name: '自定义配置',
      description: '通过构建器创建的配置',
      displayMode: 'table',
      pageSize: 20,
      enableSearch: true,
      enableFilter: true,
      multiSelect: false,
      showTypeFilter: true,
      defaultTypeIds: [],
      displayFields: ['name', 'status'],
      searchFields: ['name'],
      sortFields: [],
      requirePermission: false,
      allowedTypes: [],
      theme: 'default',
      customStyles: {},
      validationRules: [],
      metadata: {},
      createdAt: now,
      updatedAt: now
    }

    return {
      ...defaultConfig,
      ...this.config,
      updatedAt: now
    }
  }

  // 构建并验证配置
  buildAndValidate(): AssetSelectorConfig {
    const config = this.build()
    
    // 验证必需字段
    if (!config.displayFields?.length) {
      throw new Error('displayFields 不能为空')
    }
    
    if (!config.searchFields?.length) {
      throw new Error('searchFields 不能为空')
    }
    
    if (config.pageSize <= 0) {
      throw new Error('pageSize 必须大于0')
    }
    
    return config
  }

  // 从现有配置克隆构建器
  static fromConfig(config: AssetSelectorConfig) {
    const builder = new AssetSelectorConfigBuilder()
    builder.config = { ...config }
    return builder
  }

  // 合并另一个配置
  merge(other: Partial<AssetSelectorConfig>) {
    this.config = {
      ...this.config,
      ...other,
      // 深度合并对象字段
      customStyles: {
        ...this.config.customStyles,
        ...other.customStyles
      },
      metadata: {
        ...this.config.metadata,
        ...other.metadata
      }
    }
    return this
  }

  // 重置构建器
  reset() {
    this.config = {}
    return this
  }

  // 获取当前配置快照
  getSnapshot() {
    return { ...this.config }
  }
}

// 便捷的配置创建函数
export function createAssetSelectorConfig() {
  return AssetSelectorConfigBuilder.create()
}

// 预设配置快速创建
export const QuickConfigs = {
  simple: () => AssetSelectorConfigBuilder.create().simple().build(),
  advanced: () => AssetSelectorConfigBuilder.create().advanced().build(),
  compact: () => AssetSelectorConfigBuilder.create().compact().build(),
  mobile: () => AssetSelectorConfigBuilder.create().mobile().build(),
  cmdb: () => AssetSelectorConfigBuilder.create().cmdb().build(),
  
  // 组合配置
  mobileAdvanced: () => AssetSelectorConfigBuilder.create().advanced().mobile().build(),
  secureCmdb: () => AssetSelectorConfigBuilder.create().cmdb().secure().build(),
  performanceOptimized: () => AssetSelectorConfigBuilder.create().advanced().performance().build()
}