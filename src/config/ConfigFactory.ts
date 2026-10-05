// SDK配置工厂
// 提供预设配置模板和配置生成工具

import type { AssetSelectorConfig, AssetServiceConfig } from '../types'
import { AssetSelectorConfigBuilder } from './ConfigBuilder'

// 配置模板定义
interface ConfigTemplate {
  id: string
  name: string
  description: string
  category: string
  config: Partial<AssetSelectorConfig>
  serviceConfig?: Partial<AssetServiceConfig>
  preview?: string
  tags: string[]
}

// 内置配置模板
const builtinTemplates: ConfigTemplate[] = [
  {
    id: 'simple',
    name: '简单模式',
    description: '最小化配置，适合快速选择',
    category: 'basic',
    config: {
      displayMode: 'card',
      pageSize: 10,
      enableSearch: true,
      enableFilter: false,
      multiSelect: false,
      showTypeFilter: false,
      displayFields: ['name', 'status'],
      searchFields: ['name'],
      theme: 'simple'
    },
    tags: ['simple', 'minimal', 'quick']
  },

  {
    id: 'advanced',
    name: '高级模式',
    description: '完整功能配置，适合复杂场景',
    category: 'advanced',
    config: {
      displayMode: 'table',
      pageSize: 20,
      enableSearch: true,
      enableFilter: true,
      multiSelect: true,
      showTypeFilter: true,
      displayFields: ['name', 'ip', 'hostname', 'status', 'owner', 'department'],
      searchFields: ['name', 'ip', 'hostname', 'description'],
      requirePermission: true,
      theme: 'advanced'
    },
    tags: ['advanced', 'full-featured', 'professional']
  },

  {
    id: 'mobile',
    name: '移动端优化',
    description: '针对移动设备优化的配置',
    category: 'responsive',
    config: {
      displayMode: 'card',
      pageSize: 8,
      enableSearch: true,
      enableFilter: false,
      multiSelect: false,
      showTypeFilter: false,
      displayFields: ['name', 'status'],
      searchFields: ['name'],
      customStyles: {
        responsive: true,
        mobile: true,
        cardSize: 'small'
      }
    },
    tags: ['mobile', 'responsive', 'touch-friendly']
  },

  {
    id: 'compact',
    name: '紧凑列表',
    description: '高密度显示，适合大量数据浏览',
    category: 'layout',
    config: {
      displayMode: 'list',
      pageSize: 50,
      enableSearch: true,
      enableFilter: true,
      multiSelect: true,
      showTypeFilter: false,
      displayFields: ['name', 'status'],
      searchFields: ['name'],
      customStyles: {
        density: 'compact',
        showIcons: false
      }
    },
    tags: ['compact', 'high-density', 'performance']
  },

  {
    id: 'cmdb',
    name: 'CMDB专用',
    description: 'CMDB配置项管理专用配置',
    category: 'domain',
    config: {
      displayMode: 'table',
      pageSize: 25,
      enableSearch: true,
      enableFilter: true,
      multiSelect: true,
      showTypeFilter: true,
      displayFields: ['name', 'ip', 'hostname', 'status', 'heartbeat', 'location'],
      searchFields: ['name', 'ip', 'hostname'],
      requirePermission: true,
      validationRules: ['cmdb_validation', 'relationship_check'],
      metadata: {
        source: 'cmdb',
        enableRelationship: true,
        showDependencies: true
      }
    },
    serviceConfig: {
      mode: 'cmdb',
      endpoints: {
        getAssetTypes: '/api/cmdb/v1/ci-types',
        getAssets: '/api/cmdb/v1/cis',
        getAssetDetail: '/api/cmdb/v1/cis/:id/detail'
      }
    },
    tags: ['cmdb', 'infrastructure', 'enterprise']
  },

  {
    id: 'kubernetes',
    name: 'Kubernetes资源',
    description: 'Kubernetes集群资源选择器',
    category: 'domain',
    config: {
      displayMode: 'table',
      pageSize: 30,
      enableSearch: true,
      enableFilter: true,
      multiSelect: true,
      showTypeFilter: true,
      displayFields: ['name', 'namespace', 'status', 'age', 'ready'],
      searchFields: ['name', 'namespace', 'labels'],
      metadata: {
        source: 'kubernetes',
        showNamespaces: true,
        showLabels: true
      }
    },
    serviceConfig: {
      mode: 'kubernetes',
      endpoints: {
        getAssets: '/api/v1/pods',
        getAssetTypes: '/api/v1/namespaces'
      }
    },
    tags: ['kubernetes', 'k8s', 'cloud-native']
  },

  {
    id: 'readonly',
    name: '只读浏览',
    description: '只读模式，用于数据浏览展示',
    category: 'utility',
    config: {
      displayMode: 'table',
      pageSize: 20,
      enableSearch: true,
      enableFilter: true,
      multiSelect: false,
      showTypeFilter: false,
      displayFields: ['name', 'type', 'status', 'description'],
      searchFields: ['name', 'description'],
      customStyles: {
        readonly: true,
        disableSelection: true
      }
    },
    tags: ['readonly', 'browse', 'display-only']
  }
]

export class ConfigFactory {
  private static templates: Map<string, ConfigTemplate> = new Map()
  
  static {
    // 初始化内置模板
    builtinTemplates.forEach(template => {
      ConfigFactory.templates.set(template.id, template)
    })
  }

  // 获取所有模板
  static getTemplates(category?: string): ConfigTemplate[] {
    const templates = Array.from(ConfigFactory.templates.values())
    
    if (category) {
      return templates.filter(t => t.category === category)
    }
    
    return templates
  }

  // 获取模板分类
  static getCategories(): string[] {
    const categories = new Set<string>()
    ConfigFactory.templates.forEach(template => {
      categories.add(template.category)
    })
    return Array.from(categories)
  }

  // 根据ID获取模板
  static getTemplate(id: string): ConfigTemplate | undefined {
    return ConfigFactory.templates.get(id)
  }

  // 根据标签搜索模板
  static searchTemplates(tags: string[]): ConfigTemplate[] {
    return Array.from(ConfigFactory.templates.values()).filter(template => 
      tags.some(tag => template.tags.includes(tag))
    )
  }

  // 注册自定义模板
  static registerTemplate(template: ConfigTemplate) {
    ConfigFactory.templates.set(template.id, template)
  }

  // 从模板创建配置
  static createFromTemplate(
    templateId: string,
    overrides?: Partial<AssetSelectorConfig>
  ): AssetSelectorConfig {
    const template = ConfigFactory.templates.get(templateId)
    
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`)
    }

    const builder = AssetSelectorConfigBuilder.create()
    
    // 应用模板配置
    const baseConfig = template.config
    Object.entries(baseConfig).forEach(([key, value]) => {
      if (value !== undefined) {
        (builder as any)[key]?.(value) || builder.merge({ [key]: value } as any)
      }
    })

    // 应用覆盖配置
    if (overrides) {
      builder.merge(overrides)
    }

    const config = builder.build()
    
    // 设置模板信息
    config.name = template.name
    config.description = template.description
    config.metadata = {
      ...config.metadata,
      templateId,
      category: template.category,
      tags: template.tags
    }

    return config
  }

  // 智能推荐配置
  static recommendConfig(requirements: {
    usage?: 'simple' | 'advanced' | 'professional'
    device?: 'mobile' | 'tablet' | 'desktop'
    domain?: 'cmdb' | 'kubernetes' | 'general'
    performance?: 'fast' | 'balanced' | 'comprehensive'
  }): string[] {
    const recommendations: string[] = []
    const { usage, device, domain, performance } = requirements

    // 基于用途推荐
    if (usage === 'simple') {
      recommendations.push('simple')
    } else if (usage === 'advanced') {
      recommendations.push('advanced')
    } else if (usage === 'professional') {
      recommendations.push('cmdb', 'advanced')
    }

    // 基于设备推荐
    if (device === 'mobile') {
      recommendations.push('mobile')
    } else if (device === 'tablet') {
      recommendations.push('compact')
    }

    // 基于领域推荐
    if (domain === 'cmdb') {
      recommendations.push('cmdb')
    } else if (domain === 'kubernetes') {
      recommendations.push('kubernetes')
    }

    // 基于性能要求推荐
    if (performance === 'fast') {
      recommendations.push('simple', 'compact')
    } else if (performance === 'comprehensive') {
      recommendations.push('advanced', 'cmdb')
    }

    // 去重并返回
    return Array.from(new Set(recommendations))
  }

  // 配置比较
  static compareConfigs(configA: AssetSelectorConfig, configB: AssetSelectorConfig) {
    const differences: Array<{
      field: string
      valueA: any
      valueB: any
      type: 'added' | 'removed' | 'changed'
    }> = []

    const fieldsToCompare = [
      'displayMode', 'pageSize', 'enableSearch', 'enableFilter',
      'multiSelect', 'showTypeFilter', 'displayFields', 'searchFields'
    ]

    fieldsToCompare.forEach(field => {
      const valueA = (configA as any)[field]
      const valueB = (configB as any)[field]

      if (JSON.stringify(valueA) !== JSON.stringify(valueB)) {
        differences.push({
          field,
          valueA,
          valueB,
          type: 'changed'
        })
      }
    })

    return differences
  }

  // 导出模板
  static exportTemplate(id: string): string {
    const template = ConfigFactory.templates.get(id)
    if (!template) {
      throw new Error(`模板不存在: ${id}`)
    }
    return JSON.stringify(template, null, 2)
  }

  // 导入模板
  static importTemplate(templateJson: string): boolean {
    try {
      const template = JSON.parse(templateJson) as ConfigTemplate
      
      // 验证模板格式
      if (!template.id || !template.name || !template.config) {
        throw new Error('模板格式无效')
      }

      ConfigFactory.registerTemplate(template)
      return true
    } catch (error) {
      console.error('导入模板失败:', error)
      return false
    }
  }
}

// 便捷的配置创建函数
export function createAssetSelectorConfig(templateId?: string, overrides?: Partial<AssetSelectorConfig>) {
  if (templateId) {
    return ConfigFactory.createFromTemplate(templateId, overrides)
  }
  
  return AssetSelectorConfigBuilder.create().build()
}

// 快速配置函数
export const QuickConfig = {
  simple: (overrides?: Partial<AssetSelectorConfig>) => 
    ConfigFactory.createFromTemplate('simple', overrides),
    
  advanced: (overrides?: Partial<AssetSelectorConfig>) => 
    ConfigFactory.createFromTemplate('advanced', overrides),
    
  mobile: (overrides?: Partial<AssetSelectorConfig>) => 
    ConfigFactory.createFromTemplate('mobile', overrides),
    
  cmdb: (overrides?: Partial<AssetSelectorConfig>) => 
    ConfigFactory.createFromTemplate('cmdb', overrides),
    
  kubernetes: (overrides?: Partial<AssetSelectorConfig>) => 
    ConfigFactory.createFromTemplate('kubernetes', overrides)
}