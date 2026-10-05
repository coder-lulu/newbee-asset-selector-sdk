// 微服务集成工具
// 提供与NewBee微服务生态系统的集成支持

import type { AssetServiceConfig, CreateAssetSelectorOptions } from '../types'

export interface MicroserviceConfig {
  // 服务发现配置
  serviceName: string
  version?: string
  namespace?: string
  
  // 网关配置
  gateway?: string
  basePath?: string
  
  // 认证配置
  authType?: 'jwt' | 'apikey' | 'oauth2'
  authConfig?: Record<string, any>
  
  // 租户配置
  tenantMode?: boolean
  tenantHeader?: string
  
  // 权限配置
  permissionMode?: boolean
  permissionScope?: string[]
}

export class MicroserviceIntegration {
  // NewBee CMDB微服务集成
  static cmdb(config: MicroserviceConfig): CreateAssetSelectorOptions {
    const {
      serviceName = 'cmdb',
      version = 'v1',
      namespace = 'api',
      gateway = '',
      tenantMode = true,
      permissionMode = true
    } = config

    const baseUrl = `${gateway}/${namespace}/${serviceName}/${version}`

    return {
      serviceConfig: {
        mode: 'cmdb',
        endpoints: {
          getAssetTypes: `${baseUrl}/ci-types`,
          getAssets: `${baseUrl}/cis`,
          getAssetDetail: `${baseUrl}/cis/:id/detail`,
          getSearchSuggestions: `${baseUrl}/cis/suggestions`,
          validateAssetSelection: `${baseUrl}/cis/validate`
        },
        authentication: {
          type: config.authType || 'jwt',
          config: config.authConfig || {}
        },
        tenant: {
          enabled: tenantMode,
          headerName: config.tenantHeader || 'x-tenant-id'
        },
        permission: {
          enabled: permissionMode,
          scope: config.permissionScope || ['read', 'select']
        }
      },
      config: {
        displayMode: 'table',
        enableFilter: true,
        showTypeFilter: true,
        requirePermission: permissionMode,
        metadata: {
          integration: 'newbee-cmdb',
          serviceName,
          version
        }
      }
    }
  }

  // NewBee 用户管理微服务集成
  static userManagement(config: MicroserviceConfig): CreateAssetSelectorOptions {
    const {
      serviceName = 'user-mgmt',
      version = 'v1',
      namespace = 'api',
      gateway = ''
    } = config

    const baseUrl = `${gateway}/${namespace}/${serviceName}/${version}`

    return {
      serviceConfig: {
        mode: 'user-management',
        endpoints: {
          getAssetTypes: `${baseUrl}/departments`,
          getAssets: `${baseUrl}/users`,
          getAssetDetail: `${baseUrl}/users/:id`,
          getSearchSuggestions: `${baseUrl}/users/search`
        },
        authentication: {
          type: config.authType || 'jwt',
          config: config.authConfig || {}
        }
      },
      config: {
        displayMode: 'table',
        displayFields: ['name', 'email', 'department', 'role', 'status'],
        searchFields: ['name', 'email', 'phone'],
        metadata: {
          integration: 'newbee-user-mgmt',
          serviceName,
          version
        }
      }
    }
  }

  // NewBee 资产管理微服务集成
  static assetManagement(config: MicroserviceConfig): CreateAssetSelectorOptions {
    const {
      serviceName = 'asset-mgmt',
      version = 'v1',
      namespace = 'api',
      gateway = ''
    } = config

    const baseUrl = `${gateway}/${namespace}/${serviceName}/${version}`

    return {
      serviceConfig: {
        mode: 'asset-management',
        endpoints: {
          getAssetTypes: `${baseUrl}/asset-types`,
          getAssets: `${baseUrl}/assets`,
          getAssetDetail: `${baseUrl}/assets/:id`,
          getSearchSuggestions: `${baseUrl}/assets/search`
        },
        authentication: {
          type: config.authType || 'jwt',
          config: config.authConfig || {}
        }
      },
      config: {
        displayMode: 'table',
        displayFields: ['name', 'type', 'status', 'location', 'owner'],
        searchFields: ['name', 'serialNumber', 'model'],
        metadata: {
          integration: 'newbee-asset-mgmt',
          serviceName,
          version
        }
      }
    }
  }

  // 通用微服务集成
  static generic(config: MicroserviceConfig & {
    endpoints: Record<string, string>
    displayFields?: string[]
    searchFields?: string[]
  }): CreateAssetSelectorOptions {
    const {
      serviceName,
      version = 'v1',
      namespace = 'api',
      gateway = '',
      endpoints,
      displayFields = ['name', 'status'],
      searchFields = ['name']
    } = config

    const baseUrl = `${gateway}/${namespace}/${serviceName}/${version}`

    // 处理端点URL
    const processedEndpoints: Record<string, string> = {}
    Object.entries(endpoints).forEach(([key, path]) => {
      processedEndpoints[key] = path.startsWith('http') ? path : `${baseUrl}${path}`
    })

    return {
      serviceConfig: {
        mode: 'generic',
        endpoints: processedEndpoints,
        authentication: {
          type: config.authType || 'jwt',
          config: config.authConfig || {}
        }
      },
      config: {
        displayMode: 'table',
        displayFields,
        searchFields,
        metadata: {
          integration: 'newbee-generic',
          serviceName,
          version
        }
      }
    }
  }
}

// NewBee微服务发现配置
export interface ServiceDiscoveryConfig {
  // 注册中心配置
  registryType: 'etcd' | 'consul' | 'nacos'
  registryEndpoints: string[]
  
  // 服务配置
  serviceName: string
  version?: string
  tags?: string[]
}

export class ServiceDiscovery {
  // 通过服务发现获取服务端点
  static async discoverService(config: ServiceDiscoveryConfig): Promise<string> {
    const { registryType, registryEndpoints, serviceName, version = 'latest' } = config

    // 这里应该实现真实的服务发现逻辑
    // 目前返回模拟的端点
    console.log(`Discovering service: ${serviceName}@${version} from ${registryType}`)
    
    // 模拟服务发现逻辑
    if (registryType === 'etcd') {
      return await ServiceDiscovery.discoverFromEtcd(registryEndpoints, serviceName, version)
    } else if (registryType === 'consul') {
      return await ServiceDiscovery.discoverFromConsul(registryEndpoints, serviceName, version)
    } else if (registryType === 'nacos') {
      return await ServiceDiscovery.discoverFromNacos(registryEndpoints, serviceName, version)
    }

    throw new Error(`不支持的注册中心类型: ${registryType}`)
  }

  private static async discoverFromEtcd(endpoints: string[], serviceName: string, version: string): Promise<string> {
    // 实现etcd服务发现
    return `http://discovered-${serviceName}-${version}.local:8080`
  }

  private static async discoverFromConsul(endpoints: string[], serviceName: string, version: string): Promise<string> {
    // 实现consul服务发现
    return `http://discovered-${serviceName}-${version}.local:8080`
  }

  private static async discoverFromNacos(endpoints: string[], serviceName: string, version: string): Promise<string> {
    // 实现nacos服务发现
    return `http://discovered-${serviceName}-${version}.local:8080`
  }
}

// NewBee API网关集成
export class ApiGatewayIntegration {
  // 配置API网关路由
  static configureRoutes(gateway: string, services: Array<{
    name: string
    path: string
    version?: string
    auth?: boolean
  }>) {
    const routes: Record<string, string> = {}

    services.forEach(service => {
      const { name, path, version = 'v1', auth = true } = service
      const routePath = `${gateway}/api/${version}/${name}`
      routes[name] = routePath
    })

    return routes
  }

  // 生成网关特定的服务配置
  static createGatewayConfig(gatewayUrl: string, serviceName: string): AssetServiceConfig {
    return {
      mode: 'gateway',
      endpoints: {
        getAssetTypes: `${gatewayUrl}/api/v1/${serviceName}/types`,
        getAssets: `${gatewayUrl}/api/v1/${serviceName}/assets`,
        getAssetDetail: `${gatewayUrl}/api/v1/${serviceName}/assets/:id`
      },
      authentication: {
        type: 'jwt',
        config: {
          headerName: 'Authorization',
          tokenPrefix: 'Bearer'
        }
      },
      gateway: {
        enabled: true,
        url: gatewayUrl,
        timeout: 30000,
        retries: 3
      }
    }
  }
}

// 微服务健康检查
export class ServiceHealthCheck {
  static async checkServiceHealth(serviceUrl: string): Promise<{
    healthy: boolean
    latency: number
    version?: string
    error?: string
  }> {
    const startTime = Date.now()

    try {
      // 使用AbortController实现超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${serviceUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      const latency = Date.now() - startTime

      if (response.ok) {
        const data = await response.json()
        return {
          healthy: true,
          latency,
          version: data.version
        }
      } else {
        return {
          healthy: false,
          latency,
          error: `HTTP ${response.status}: ${response.statusText}`
        }
      }
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  static async checkMultipleServices(serviceUrls: string[]): Promise<Record<string, any>> {
    const checks = serviceUrls.map(async url => {
      const result = await ServiceHealthCheck.checkServiceHealth(url)
      return { url, ...result }
    })

    const results = await Promise.all(checks)
    
    const summary: Record<string, any> = {}
    results.forEach(result => {
      summary[result.url] = {
        healthy: result.healthy,
        latency: result.latency,
        version: result.version,
        error: result.error
      }
    })

    return summary
  }
}

// 导出集成工具
export const NewBeeIntegration = {
  MicroserviceIntegration,
  ServiceDiscovery,
  ApiGatewayIntegration,
  ServiceHealthCheck
}