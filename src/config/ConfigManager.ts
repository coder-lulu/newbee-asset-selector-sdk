// SDK配置管理器
// 提供全局配置管理和环境配置

import type { AssetSelectorConfig, AssetServiceConfig } from '../types'

export class ConfigManager {
  private static instance: ConfigManager
  private globalConfig: Partial<AssetSelectorConfig> = {}
  private serviceConfig: AssetServiceConfig | null = null
  private environmentConfigs: Map<string, Partial<AssetSelectorConfig>> = new Map()

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  // 设置全局配置
  static setGlobalConfig(config: Partial<AssetSelectorConfig>) {
    const instance = ConfigManager.getInstance()
    instance.globalConfig = { ...instance.globalConfig, ...config }
  }

  // 获取全局配置
  static getGlobalConfig(): Partial<AssetSelectorConfig> {
    const instance = ConfigManager.getInstance()
    return { ...instance.globalConfig }
  }

  // 设置服务配置
  static setServiceConfig(config: AssetServiceConfig) {
    const instance = ConfigManager.getInstance()
    instance.serviceConfig = config
  }

  // 获取服务配置
  static getServiceConfig(): AssetServiceConfig | null {
    const instance = ConfigManager.getInstance()
    return instance.serviceConfig
  }

  // 环境配置管理
  static setEnvironmentConfig(env: string, config: Partial<AssetSelectorConfig>) {
    const instance = ConfigManager.getInstance()
    instance.environmentConfigs.set(env, config)
  }

  static getEnvironmentConfig(env: string): Partial<AssetSelectorConfig> | undefined {
    const instance = ConfigManager.getInstance()
    return instance.environmentConfigs.get(env)
  }

  // 合并配置（优先级：用户配置 > 环境配置 > 全局配置 > 默认配置）
  static mergeConfigs(
    userConfig: Partial<AssetSelectorConfig> = {},
    environment?: string
  ): Partial<AssetSelectorConfig> {
    const instance = ConfigManager.getInstance()
    
    let mergedConfig = { ...instance.globalConfig }
    
    // 应用环境配置
    if (environment) {
      const envConfig = instance.environmentConfigs.get(environment)
      if (envConfig) {
        mergedConfig = { ...mergedConfig, ...envConfig }
      }
    }
    
    // 应用用户配置
    mergedConfig = { ...mergedConfig, ...userConfig }
    
    // 深度合并某些对象字段
    if (instance.globalConfig.customStyles || userConfig.customStyles) {
      mergedConfig.customStyles = {
        ...instance.globalConfig.customStyles,
        ...userConfig.customStyles
      }
    }
    
    if (instance.globalConfig.metadata || userConfig.metadata) {
      mergedConfig.metadata = {
        ...instance.globalConfig.metadata,
        ...userConfig.metadata
      }
    }
    
    return mergedConfig
  }

  // 配置验证
  static validateConfig(config: Partial<AssetSelectorConfig>): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // 验证必需字段
    if (config.displayMode && !['table', 'card', 'list'].includes(config.displayMode)) {
      errors.push(`无效的显示模式: ${config.displayMode}`)
    }

    if (config.pageSize !== undefined && (config.pageSize <= 0 || config.pageSize > 1000)) {
      errors.push(`页面大小必须在1-1000之间: ${config.pageSize}`)
    }

    if (config.displayFields && config.displayFields.length === 0) {
      warnings.push('显示字段列表为空，用户将看不到任何数据')
    }

    if (config.searchFields && config.searchFields.length === 0) {
      warnings.push('搜索字段列表为空，搜索功能将不可用')
    }

    // 验证字段一致性
    if (config.displayFields && config.searchFields) {
      const displaySet = new Set(config.displayFields)
      const invalidSearchFields = config.searchFields.filter(field => !displaySet.has(field))
      
      if (invalidSearchFields.length > 0) {
        warnings.push(`搜索字段中包含未显示的字段: ${invalidSearchFields.join(', ')}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  // 配置序列化
  static serialize(): string {
    const instance = ConfigManager.getInstance()
    
    const data = {
      globalConfig: instance.globalConfig,
      serviceConfig: instance.serviceConfig,
      environmentConfigs: Object.fromEntries(instance.environmentConfigs)
    }
    
    return JSON.stringify(data, null, 2)
  }

  // 配置反序列化
  static deserialize(data: string): boolean {
    try {
      const parsed = JSON.parse(data)
      const instance = ConfigManager.getInstance()
      
      if (parsed.globalConfig) {
        instance.globalConfig = parsed.globalConfig
      }
      
      if (parsed.serviceConfig) {
        instance.serviceConfig = parsed.serviceConfig
      }
      
      if (parsed.environmentConfigs) {
        instance.environmentConfigs = new Map(Object.entries(parsed.environmentConfigs))
      }
      
      return true
    } catch (error) {
      console.error('配置反序列化失败:', error)
      return false
    }
  }

  // 重置所有配置
  static reset() {
    const instance = ConfigManager.getInstance()
    instance.globalConfig = {}
    instance.serviceConfig = null
    instance.environmentConfigs.clear()
  }

  // 获取配置统计
  static getStats() {
    const instance = ConfigManager.getInstance()
    
    return {
      hasGlobalConfig: Object.keys(instance.globalConfig).length > 0,
      hasServiceConfig: instance.serviceConfig !== null,
      environmentCount: instance.environmentConfigs.size,
      environments: Array.from(instance.environmentConfigs.keys())
    }
  }
}

// 环境配置预设
export const EnvironmentPresets = {
  development: {
    pageSize: 10,
    enableSearch: true,
    enableFilter: true,
    theme: 'development',
    customStyles: {
      debug: true,
      showPerformanceStats: true
    },
    metadata: {
      environment: 'development',
      debugMode: true
    }
  },

  production: {
    pageSize: 20,
    enableSearch: true,
    enableFilter: true,
    requirePermission: true,
    theme: 'production',
    customStyles: {
      optimized: true,
      cacheEnabled: true
    },
    metadata: {
      environment: 'production',
      auditLog: true
    }
  },

  testing: {
    pageSize: 5,
    enableSearch: false,
    enableFilter: false,
    theme: 'testing',
    customStyles: {
      minimal: true,
      fastRender: true
    },
    metadata: {
      environment: 'testing',
      mockData: true
    }
  }
}

// 配置工厂函数
export function createConfigForEnvironment(env: 'development' | 'production' | 'testing') {
  return EnvironmentPresets[env]
}

// 全局配置初始化
export function initializeGlobalConfig(options: {
  environment?: 'development' | 'production' | 'testing'
  customConfig?: Partial<AssetSelectorConfig>
  serviceConfig?: AssetServiceConfig
} = {}) {
  const { environment, customConfig, serviceConfig } = options

  // 设置环境配置
  if (environment) {
    ConfigManager.setEnvironmentConfig(environment, EnvironmentPresets[environment])
  }

  // 设置全局配置
  if (customConfig) {
    ConfigManager.setGlobalConfig(customConfig)
  }

  // 设置服务配置
  if (serviceConfig) {
    ConfigManager.setServiceConfig(serviceConfig)
  }
}