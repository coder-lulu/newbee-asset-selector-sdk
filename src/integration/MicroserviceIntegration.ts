// 微服务集成模块
// 提供与NewBee微服务架构的集成

import type { AssetSelectorConfig, AssetServiceConfig } from '../types'
import { AssetSelectorConfigBuilder } from '../config/ConfigBuilder'
import { createAssetSelector, AssetSelectorInstance } from '../factory/AssetSelectorFactory'

export interface MicroserviceConfig {
  serviceName: string
  gateway: string
  version?: string
  tenantMode?: boolean
  authentication?: {
    type: 'jwt' | 'apikey' | 'basic'
    config: Record<string, any>
  }
}

export interface CMDBIntegrationOptions extends MicroserviceConfig {
  enableRelationships?: boolean
  enableValidation?: boolean
  enableAuditLog?: boolean
  customFields?: string[]
}

export interface MonitoringIntegrationOptions extends MicroserviceConfig {
  enableMetrics?: boolean
  enableAlerts?: boolean
  metricTypes?: string[]
}

export interface InventoryIntegrationOptions extends MicroserviceConfig {
  enableStock?: boolean
  enableLocation?: boolean
  enableMovement?: boolean
}

export class MicroserviceIntegration {
  // CMDB微服务集成
  static cmdb(options: CMDBIntegrationOptions): {
    config: AssetSelectorConfig
    serviceConfig: AssetServiceConfig
    createSelector: (selectorOptions?: any) => AssetSelectorInstance
  } {
    const {
      serviceName,
      gateway,
      version = 'v1',
      tenantMode = true,
      enableRelationships = true,
      enableValidation = true,
      enableAuditLog = true,
      customFields = [],
      authentication
    } = options

    // 构建API端点
    const baseUrl = `${gateway}/api/${serviceName}/${version}`
    
    // 创建配置
    const config = AssetSelectorConfigBuilder
      .create('cmdb-integration')
      .name('CMDB资产选择器')
      .description('与CMDB微服务集成的资产选择器')
      .displayMode('table')
      .enableFilter(true)
      .showTypeFilter(true)
      .requirePermission(true)
      .displayFields(['name', 'ip', 'hostname', 'status', 'heartbeat', ...customFields])
      .searchFields(['name', 'ip', 'hostname', 'description'])
      .metadata('source', 'cmdb')
      .metadata('serviceName', serviceName)
      .metadata('enableRelationships', enableRelationships)
      .metadata('enableValidation', enableValidation)
      .metadata('enableAuditLog', enableAuditLog)
      .metadata('tenantMode', tenantMode)
      .build()

    // 创建服务配置
    const serviceConfig: AssetServiceConfig = {
      mode: 'cmdb',
      endpoints: {
        getAssetTypes: `${baseUrl}/ci-types`,
        getAssets: `${baseUrl}/cis`,
        getAssetDetail: `${baseUrl}/cis/:id/detail`,
        validateAssetSelection: enableValidation ? `${baseUrl}/cis/validate` : undefined,
        getSearchSuggestions: `${baseUrl}/cis/suggest`
      },
      authentication,
      timeout: 30000,
      tenant: tenantMode ? {
        enabled: true,
        headerName: 'X-Tenant-ID',
        defaultTenantId: 'default'
      } : undefined
    }

    return {
      config,
      serviceConfig,
      createSelector: (selectorOptions = {}) => createAssetSelector({
        config,
        serviceConfig,
        ...selectorOptions
      })
    }
  }

  // 监控微服务集成
  static monitoring(options: MonitoringIntegrationOptions): {
    config: AssetSelectorConfig
    serviceConfig: AssetServiceConfig
    createSelector: (selectorOptions?: any) => AssetSelectorInstance
  } {
    const {
      serviceName,
      gateway,
      version = 'v1',
      tenantMode = true,
      enableMetrics = true,
      enableAlerts = true,
      metricTypes = ['cpu', 'memory', 'disk', 'network'],
      authentication
    } = options

    const baseUrl = `${gateway}/api/${serviceName}/${version}`
    
    const config = AssetSelectorConfigBuilder
      .create('monitoring-integration')
      .name('监控资产选择器')
      .description('与监控微服务集成的资产选择器')
      .displayMode('card')
      .enableFilter(true)
      .showTypeFilter(true)
      .displayFields(['name', 'ip', 'status', 'metrics', 'alerts'])
      .searchFields(['name', 'ip', 'hostname'])
      .metadata('source', 'monitoring')
      .metadata('serviceName', serviceName)
      .metadata('enableMetrics', enableMetrics)
      .metadata('enableAlerts', enableAlerts)
      .metadata('metricTypes', metricTypes)
      .build()

    const serviceConfig: AssetServiceConfig = {
      mode: 'http',
      endpoints: {
        getAssetTypes: `${baseUrl}/asset-types`,
        getAssets: `${baseUrl}/assets`,
        getAssetDetail: `${baseUrl}/assets/:id`,
        getSearchSuggestions: `${baseUrl}/assets/suggest`
      },
      authentication,
      timeout: 30000,
      tenant: tenantMode ? {
        enabled: true,
        headerName: 'X-Tenant-ID'
      } : undefined
    }

    return {
      config,
      serviceConfig,
      createSelector: (selectorOptions = {}) => createAssetSelector({
        config,
        serviceConfig,
        ...selectorOptions
      })
    }
  }

  // 库存微服务集成
  static inventory(options: InventoryIntegrationOptions): {
    config: AssetSelectorConfig
    serviceConfig: AssetServiceConfig
    createSelector: (selectorOptions?: any) => AssetSelectorInstance
  } {
    const {
      serviceName,
      gateway,
      version = 'v1',
      tenantMode = true,
      enableStock = true,
      enableLocation = true,
      enableMovement = true,
      authentication
    } = options

    const baseUrl = `${gateway}/api/${serviceName}/${version}`
    
    const config = AssetSelectorConfigBuilder
      .create('inventory-integration')
      .name('库存资产选择器')
      .description('与库存微服务集成的资产选择器')
      .displayMode('table')
      .enableFilter(true)
      .showTypeFilter(true)
      .displayFields(['name', 'sku', 'quantity', 'location', 'status'])
      .searchFields(['name', 'sku', 'barcode'])
      .metadata('source', 'inventory')
      .metadata('serviceName', serviceName)
      .metadata('enableStock', enableStock)
      .metadata('enableLocation', enableLocation)
      .metadata('enableMovement', enableMovement)
      .build()

    const serviceConfig: AssetServiceConfig = {
      mode: 'http',
      endpoints: {
        getAssetTypes: `${baseUrl}/item-types`,
        getAssets: `${baseUrl}/items`,
        getAssetDetail: `${baseUrl}/items/:id`,
        getSearchSuggestions: `${baseUrl}/items/suggest`
      },
      authentication,
      timeout: 30000,
      tenant: tenantMode ? {
        enabled: true,
        headerName: 'X-Tenant-ID'
      } : undefined
    }

    return {
      config,
      serviceConfig,
      createSelector: (selectorOptions = {}) => createAssetSelector({
        config,
        serviceConfig,
        ...selectorOptions
      })
    }
  }

  // 通用微服务集成
  static generic(options: MicroserviceConfig & {
    endpoints: {
      getAssets: string
      getAssetTypes: string
      getAssetDetail?: string
      validateAssetSelection?: string
      getSearchSuggestions?: string
    }
    displayFields?: string[]
    searchFields?: string[]
    customConfig?: Partial<AssetSelectorConfig>
  }): {
    config: AssetSelectorConfig
    serviceConfig: AssetServiceConfig
    createSelector: (selectorOptions?: any) => AssetSelectorInstance
  } {
    const {
      serviceName,
      gateway,
      version = 'v1',
      tenantMode = true,
      endpoints,
      displayFields = ['name', 'type', 'status'],
      searchFields = ['name'],
      customConfig = {},
      authentication
    } = options

    const baseUrl = `${gateway}/api/${serviceName}/${version}`
    
    // 处理端点URL
    const processedEndpoints = Object.fromEntries(
      Object.entries(endpoints).map(([key, path]) => [
        key,
        path.startsWith('http') ? path : `${baseUrl}${path}`
      ])
    )

    const config = AssetSelectorConfigBuilder
      .create('generic-integration')
      .name(`${serviceName}资产选择器`)
      .description(`与${serviceName}微服务集成的资产选择器`)
      .displayMode('table')
      .enableFilter(true)
      .displayFields(displayFields)
      .searchFields(searchFields)
      .metadata('source', serviceName)
      .metadata('serviceName', serviceName)
      .metadata('tenantMode', tenantMode)
      .merge(customConfig)
      .build()

    const serviceConfig: AssetServiceConfig = {
      mode: 'generic',
      endpoints: processedEndpoints,
      authentication,
      timeout: 30000,
      tenant: tenantMode ? {
        enabled: true,
        headerName: 'X-Tenant-ID'
      } : undefined
    }

    return {
      config,
      serviceConfig,
      createSelector: (selectorOptions = {}) => createAssetSelector({
        config,
        serviceConfig,
        ...selectorOptions
      })
    }
  }

  // 批量创建多个微服务选择器
  static createMultiple(configs: Array<{
    type: 'cmdb' | 'monitoring' | 'inventory' | 'generic'
    options: any
    selectorOptions?: any
  }>): Record<string, AssetSelectorInstance> {
    const selectors: Record<string, AssetSelectorInstance> = {}

    for (const config of configs) {
      const { type, options, selectorOptions = {} } = config
      let integration: any

      switch (type) {
        case 'cmdb':
          integration = this.cmdb(options)
          break
        case 'monitoring':
          integration = this.monitoring(options)
          break
        case 'inventory':
          integration = this.inventory(options)
          break
        case 'generic':
          integration = this.generic(options)
          break
        default:
          console.warn(`Unknown integration type: ${type}`)
          continue
      }

      const selectorKey = `${type}_${options.serviceName}`
      selectors[selectorKey] = integration.createSelector(selectorOptions)
    }

    return selectors
  }

  // 获取微服务健康检查配置
  static getHealthCheckConfig(services: string[], gateway: string) {
    return services.map(service => ({
      service,
      endpoint: `${gateway}/api/${service}/health`,
      timeout: 5000,
      interval: 30000
    }))
  }

  // 创建微服务网关配置
  static createGatewayConfig(gateway: string, services: string[]) {
    return {
      gateway,
      services: services.map(service => ({
        name: service,
        baseUrl: `${gateway}/api/${service}`,
        timeout: 30000,
        retries: 3
      }))
    }
  }
}

// 便捷导出
export const {
  cmdb: createCMDBIntegration,
  monitoring: createMonitoringIntegration,
  inventory: createInventoryIntegration,
  generic: createGenericIntegration,
  createMultiple: createMultipleIntegrations
} = MicroserviceIntegration

// 默认导出
export default MicroserviceIntegration