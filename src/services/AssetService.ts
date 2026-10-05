// 资产服务基础类
// 提供统一的资产数据访问接口

import type {
  Asset,
  AssetType,
  AssetQuery,
  AssetListResponse,
  Suggestion,
  ValidationResult,
  AssetServiceConfig
} from '../types'

/**
 * 资产服务抽象基类
 * 定义所有资产服务实现必须遵循的接口规范
 */
export abstract class AssetService {
  protected config: AssetServiceConfig

  constructor(config: AssetServiceConfig) {
    this.config = config
  }

  /**
   * 获取资产类型列表
   */
  abstract getAssetTypes(filter?: any): Promise<AssetType[]>

  /**
   * 查询资产列表
   */
  abstract getAssets(query: AssetQuery): Promise<AssetListResponse>

  /**
   * 获取资产详情
   */
  abstract getAssetDetail(id: string): Promise<Asset>

  /**
   * 获取搜索建议
   */
  abstract getSearchSuggestions(input: string, fields?: string[]): Promise<Suggestion[]>

  /**
   * 验证资产选择
   */
  abstract validateAssetSelection(assets: Asset[]): Promise<ValidationResult>

  /**
   * 更新服务配置
   */
  updateConfig(newConfig: Partial<AssetServiceConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 获取当前配置
   */
  getConfig(): AssetServiceConfig {
    return { ...this.config }
  }
}

/**
 * 基础HTTP资产服务实现
 * 提供通用的HTTP API访问功能
 */
export class BaseAssetService extends AssetService {
  private baseUrl: string
  private headers: Record<string, string>

  constructor(config: AssetServiceConfig) {
    super(config)
    this.baseUrl = this.extractBaseUrl()
    this.headers = this.buildHeaders()
  }

  private extractBaseUrl(): string {
    if (this.config.endpoints?.getAssets) {
      const url = new URL(this.config.endpoints.getAssets)
      return `${url.protocol}//${url.host}`
    }
    return ''
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // 添加认证头
    if (this.config.authentication) {
      const { type, config: authConfig } = this.config.authentication
      
      switch (type) {
        case 'jwt':
          if (authConfig.token) {
            headers.Authorization = `Bearer ${authConfig.token}`
          }
          break
        case 'apikey':
          if (authConfig.key && authConfig.headerName) {
            headers[authConfig.headerName] = authConfig.key
          }
          break
        case 'basic':
          if (authConfig.username && authConfig.password) {
            const credentials = btoa(`${authConfig.username}:${authConfig.password}`)
            headers.Authorization = `Basic ${credentials}`
          }
          break
      }
    }

    // 添加租户头
    if (this.config.tenant?.enabled && this.config.tenant.headerName) {
      const tenantId = this.config.tenant.defaultTenantId || 'default'
      headers[this.config.tenant.headerName] = tenantId
    }

    return headers
  }

  protected async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: { ...this.headers, ...options.headers },
      timeout: this.config.timeout || 30000,
      ...options
    }

    // 使用AbortController实现超时
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout as number)
    config.signal = controller.signal

    try {
      const response = await fetch(url, config)
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        return await response.text() as unknown as T
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`请求超时: ${url}`)
        }
        throw new Error(`请求失败: ${error.message}`)
      }
      throw error
    }
  }

  async getAssetTypes(filter?: any): Promise<AssetType[]> {
    if (!this.config.endpoints?.getAssetTypes) {
      throw new Error('getAssetTypes endpoint not configured')
    }

    try {
      const response = await this.request<AssetType[]>(
        this.config.endpoints.getAssetTypes,
        filter ? { 
          method: 'POST', 
          body: JSON.stringify(filter) 
        } : { method: 'GET' }
      )

      return Array.isArray(response) ? response : []
    } catch (error) {
      console.error('获取资产类型失败:', error)
      throw error
    }
  }

  async getAssets(query: AssetQuery): Promise<AssetListResponse> {
    if (!this.config.endpoints?.getAssets) {
      throw new Error('getAssets endpoint not configured')
    }

    try {
      // 构建查询参数
      const params = new URLSearchParams()
      
      if (query.page) params.append('page', query.page.toString())
      if (query.pageSize) params.append('pageSize', query.pageSize.toString())
      if (query.keyword) params.append('keyword', query.keyword)
      if (query.typeIds?.length) {
        query.typeIds.forEach(id => params.append('typeIds', id))
      }

      const url = `${this.config.endpoints.getAssets}?${params.toString()}`
      
      const response = await this.request<AssetListResponse>(url, {
        method: 'GET'
      })

      return {
        items: response.items || [],
        total: response.total || 0,
        page: response.page || 1,
        pageSize: response.pageSize || 20,
        hasMore: response.hasMore || false,
        metadata: response.metadata
      }
    } catch (error) {
      console.error('获取资产列表失败:', error)
      throw error
    }
  }

  async getAssetDetail(id: string): Promise<Asset> {
    if (!this.config.endpoints?.getAssetDetail) {
      throw new Error('getAssetDetail endpoint not configured')
    }

    try {
      const url = this.config.endpoints.getAssetDetail.replace(':id', id)
      const response = await this.request<Asset>(url, { method: 'GET' })
      
      if (!response) {
        throw new Error(`Asset not found: ${id}`)
      }
      
      return response
    } catch (error) {
      console.error('获取资产详情失败:', error)
      throw error
    }
  }

  async getSearchSuggestions(input: string, fields?: string[]): Promise<Suggestion[]> {
    if (!this.config.endpoints?.getSearchSuggestions) {
      return [] // 如果没有配置搜索建议接口，返回空数组
    }

    try {
      const params = new URLSearchParams()
      params.append('input', input)
      if (fields?.length) {
        fields.forEach(field => params.append('fields', field))
      }

      const url = `${this.config.endpoints.getSearchSuggestions}?${params.toString()}`
      const response = await this.request<Suggestion[]>(url, { method: 'GET' })
      
      return Array.isArray(response) ? response : []
    } catch (error) {
      console.error('获取搜索建议失败:', error)
      return [] // 搜索建议失败不应该阻断主流程
    }
  }

  async validateAssetSelection(assets: Asset[]): Promise<ValidationResult> {
    if (!this.config.endpoints?.validateAssetSelection) {
      // 如果没有配置验证接口，执行基础验证
      return this.basicValidation(assets)
    }

    try {
      const response = await this.request<ValidationResult>(
        this.config.endpoints.validateAssetSelection,
        {
          method: 'POST',
          body: JSON.stringify({ assets })
        }
      )
      
      return response
    } catch (error) {
      console.error('验证资产选择失败:', error)
      // 验证失败时返回基础验证结果
      return this.basicValidation(assets)
    }
  }

  private basicValidation(assets: Asset[]): ValidationResult {
    const errors = []
    const warnings = []

    // 基础验证规则
    if (assets.length === 0) {
      errors.push({
        code: 'NO_ASSETS_SELECTED',
        message: '请至少选择一个资产',
        severity: 'error' as const
      })
    }

    // 检查重复资产
    const ids = new Set()
    for (const asset of assets) {
      if (ids.has(asset.id)) {
        errors.push({
          code: 'DUPLICATE_ASSET',
          message: `资产重复: ${asset.name}`,
          asset,
          severity: 'error' as const
        })
      }
      ids.add(asset.id)
    }

    // 检查停用资产
    const inactiveAssets = assets.filter(asset => asset.status === 'inactive')
    if (inactiveAssets.length > 0) {
      warnings.push({
        code: 'INACTIVE_ASSETS',
        message: `选择了 ${inactiveAssets.length} 个停用资产`
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}

/**
 * 服务工厂函数
 * 根据配置创建合适的服务实例
 */
export function createAssetService(config: AssetServiceConfig): AssetService {
  switch (config.mode) {
    case 'http':
    case 'cmdb':
    case 'generic':
      return new BaseAssetService(config)
    
    case 'mock':
      // 动态导入Mock服务以避免循环依赖
      return import('./MockAssetService').then(module => 
        new module.MockAssetService(config)
      ) as any
    
    default:
      throw new Error(`Unsupported service mode: ${config.mode}`)
  }
}

/**
 * 服务管理器
 * 管理多个服务实例和切换
 */
export class AssetServiceManager {
  private services: Map<string, AssetService> = new Map()
  private activeService: string | null = null

  /**
   * 注册服务实例
   */
  registerService(name: string, service: AssetService) {
    this.services.set(name, service)
    if (this.activeService === null) {
      this.activeService = name
    }
  }

  /**
   * 获取服务实例
   */
  getService(name?: string): AssetService {
    const serviceName = name || this.activeService
    if (!serviceName) {
      throw new Error('No active service configured')
    }

    const service = this.services.get(serviceName)
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`)
    }

    return service
  }

  /**
   * 切换活动服务
   */
  switchService(name: string) {
    if (!this.services.has(name)) {
      throw new Error(`Service not found: ${name}`)
    }
    this.activeService = name
  }

  /**
   * 获取所有注册的服务名称
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys())
  }

  /**
   * 移除服务
   */
  removeService(name: string) {
    this.services.delete(name)
    if (this.activeService === name) {
      const names = this.getServiceNames()
      this.activeService = names.length > 0 ? names[0] : null
    }
  }

  /**
   * 清空所有服务
   */
  clear() {
    this.services.clear()
    this.activeService = null
  }
}

// 全局服务管理器实例
export const globalServiceManager = new AssetServiceManager()

/**
 * 便捷函数：获取默认服务实例
 */
export function getDefaultAssetService(): AssetService {
  return globalServiceManager.getService()
}