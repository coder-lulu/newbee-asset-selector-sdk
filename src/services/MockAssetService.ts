// Mock资产服务
// 提供模拟数据用于开发和测试

import { AssetService } from './AssetService'
import type {
  Asset,
  AssetType,
  AssetQuery,
  AssetListResponse,
  Suggestion,
  ValidationResult,
  AssetServiceConfig,
  AssetField,
  FieldType
} from '../types'

/**
 * Mock资产服务实现
 * 提供丰富的模拟数据用于开发和演示
 */
export class MockAssetService extends AssetService {
  private mockAssetTypes: AssetType[]
  private mockAssets: Asset[]
  private readonly TOTAL_ASSETS = 500 // 模拟总资产数量

  constructor(config: AssetServiceConfig) {
    super(config)
    this.initializeMockData()
  }

  private initializeMockData() {
    this.mockAssetTypes = this.generateMockAssetTypes()
    this.mockAssets = this.generateMockAssets()
  }

  private generateMockAssetTypes(): AssetType[] {
    const fieldTemplates: Record<string, AssetField[]> = {
      server: [
        { id: 'name', name: '服务器名称', code: 'name', type: 'string', required: true, searchable: true, sortable: true, filterable: true, displayOrder: 1 },
        { id: 'ip', name: 'IP地址', code: 'ip', type: 'ip', required: true, searchable: true, sortable: true, filterable: true, displayOrder: 2 },
        { id: 'hostname', name: '主机名', code: 'hostname', type: 'string', required: true, searchable: true, sortable: true, filterable: true, displayOrder: 3 },
        { id: 'cpu', name: 'CPU', code: 'cpu', type: 'string', required: false, searchable: false, sortable: true, filterable: true, displayOrder: 4 },
        { id: 'memory', name: '内存', code: 'memory', type: 'string', required: false, searchable: false, sortable: true, filterable: true, displayOrder: 5 },
        { id: 'storage', name: '存储', code: 'storage', type: 'string', required: false, searchable: false, sortable: true, filterable: true, displayOrder: 6 },
        { id: 'os', name: '操作系统', code: 'os', type: 'select', required: false, searchable: true, sortable: true, filterable: true, displayOrder: 7, options: [
          { value: 'linux', label: 'Linux' },
          { value: 'windows', label: 'Windows' },
          { value: 'unix', label: 'Unix' }
        ]},
        { id: 'status', name: '状态', code: 'status', type: 'select', required: true, searchable: false, sortable: true, filterable: true, displayOrder: 8, options: [
          { value: 'active', label: '运行中', color: 'green' },
          { value: 'inactive', label: '已停用', color: 'red' },
          { value: 'maintenance', label: '维护中', color: 'orange' }
        ]},
        { id: 'location', name: '机房位置', code: 'location', type: 'string', required: false, searchable: true, sortable: true, filterable: true, displayOrder: 9 },
        { id: 'owner', name: '负责人', code: 'owner', type: 'string', required: false, searchable: true, sortable: true, filterable: true, displayOrder: 10 },
        { id: 'department', name: '所属部门', code: 'department', type: 'string', required: false, searchable: true, sortable: true, filterable: true, displayOrder: 11 }
      ],
      network: [
        { id: 'name', name: '设备名称', code: 'name', type: 'string', required: true, searchable: true, sortable: true, filterable: true, displayOrder: 1 },
        { id: 'ip', name: '管理IP', code: 'ip', type: 'ip', required: true, searchable: true, sortable: true, filterable: true, displayOrder: 2 },
        { id: 'model', name: '设备型号', code: 'model', type: 'string', required: false, searchable: true, sortable: true, filterable: true, displayOrder: 3 },
        { id: 'vendor', name: '厂商', code: 'vendor', type: 'select', required: false, searchable: true, sortable: true, filterable: true, displayOrder: 4, options: [
          { value: 'cisco', label: 'Cisco' },
          { value: 'huawei', label: '华为' },
          { value: 'h3c', label: 'H3C' }
        ]},
        { id: 'ports', name: '端口数量', code: 'ports', type: 'number', required: false, searchable: false, sortable: true, filterable: true, displayOrder: 5 },
        { id: 'status', name: '状态', code: 'status', type: 'select', required: true, searchable: false, sortable: true, filterable: true, displayOrder: 6, options: [
          { value: 'active', label: '正常', color: 'green' },
          { value: 'inactive', label: '故障', color: 'red' },
          { value: 'maintenance', label: '维护', color: 'orange' }
        ]},
        { id: 'location', name: '位置', code: 'location', type: 'string', required: false, searchable: true, sortable: true, filterable: true, displayOrder: 7 }
      ],
      storage: [
        { id: 'name', name: '存储名称', code: 'name', type: 'string', required: true, searchable: true, sortable: true, filterable: true, displayOrder: 1 },
        { id: 'capacity', name: '容量', code: 'capacity', type: 'string', required: false, searchable: false, sortable: true, filterable: true, displayOrder: 2 },
        { id: 'used', name: '已用空间', code: 'used', type: 'string', required: false, searchable: false, sortable: true, filterable: true, displayOrder: 3 },
        { id: 'type', name: '存储类型', code: 'type', type: 'select', required: false, searchable: true, sortable: true, filterable: true, displayOrder: 4, options: [
          { value: 'ssd', label: 'SSD' },
          { value: 'hdd', label: 'HDD' },
          { value: 'nvme', label: 'NVMe' }
        ]},
        { id: 'status', name: '状态', code: 'status', type: 'select', required: true, searchable: false, sortable: true, filterable: true, displayOrder: 5, options: [
          { value: 'active', label: '正常', color: 'green' },
          { value: 'inactive', label: '故障', color: 'red' },
          { value: 'maintenance', label: '维护', color: 'orange' }
        ]}
      ]
    }

    return [
      {
        id: 'server',
        name: '物理服务器',
        code: 'server',
        description: '数据中心物理服务器设备',
        category: 'compute',
        icon: 'server',
        color: '#1890ff',
        fields: fieldTemplates.server,
        allowedOperations: ['view', 'edit', 'delete', 'restart'],
        metadata: { priority: 1, isPhysical: true }
      },
      {
        id: 'vm',
        name: '虚拟机',
        code: 'vm',
        description: '虚拟化服务器实例',
        category: 'compute',
        icon: 'cloud',
        color: '#52c41a',
        fields: fieldTemplates.server.filter(f => !['storage'].includes(f.code)),
        allowedOperations: ['view', 'edit', 'delete', 'start', 'stop', 'restart'],
        metadata: { priority: 2, isVirtual: true }
      },
      {
        id: 'switch',
        name: '交换机',
        code: 'switch',
        description: '网络交换设备',
        category: 'network',
        icon: 'cluster',
        color: '#722ed1',
        fields: fieldTemplates.network,
        allowedOperations: ['view', 'edit', 'restart'],
        metadata: { priority: 3, layer: 2 }
      },
      {
        id: 'router',
        name: '路由器',
        code: 'router',
        description: '网络路由设备',
        category: 'network',
        icon: 'partition',
        color: '#fa8c16',
        fields: fieldTemplates.network,
        allowedOperations: ['view', 'edit', 'restart'],
        metadata: { priority: 4, layer: 3 }
      },
      {
        id: 'storage',
        name: '存储设备',
        code: 'storage',
        description: '存储阵列和磁盘设备',
        category: 'storage',
        icon: 'database',
        color: '#eb2f96',
        fields: fieldTemplates.storage,
        allowedOperations: ['view', 'edit'],
        metadata: { priority: 5, isStorage: true }
      },
      {
        id: 'firewall',
        name: '防火墙',
        code: 'firewall',
        description: '网络安全防护设备',
        category: 'security',
        icon: 'safety',
        color: '#f5222d',
        fields: fieldTemplates.network.filter(f => !['ports'].includes(f.code)),
        allowedOperations: ['view', 'edit'],
        metadata: { priority: 6, isSecurity: true }
      }
    ]
  }

  private generateMockAssets(): Asset[] {
    const assets: Asset[] = []
    const locations = ['机房A', '机房B', '机房C', '云端']
    const departments = ['研发部', '运维部', '测试部', '产品部', '数据部']
    const owners = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']
    const statuses = ['active', 'inactive', 'maintenance'] as const

    for (let i = 1; i <= this.TOTAL_ASSETS; i++) {
      const typeIndex = i % this.mockAssetTypes.length
      const assetType = this.mockAssetTypes[typeIndex]
      const status = statuses[i % statuses.length]
      
      let asset: Asset = {
        id: i.toString(),
        name: `${assetType.name}-${i.toString().padStart(3, '0')}`,
        type: assetType.code,
        typeName: assetType.name,
        status,
        location: locations[i % locations.length],
        owner: owners[i % owners.length],
        department: departments[i % departments.length],
        description: `这是第${i}个${assetType.name}设备`,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          category: assetType.category,
          priority: i % 5 + 1,
          environment: i % 3 === 0 ? 'production' : i % 3 === 1 ? 'testing' : 'development'
        }
      }

      // 根据资产类型添加特定字段
      switch (assetType.code) {
        case 'server':
        case 'vm':
          asset = {
            ...asset,
            ip: `192.168.${Math.floor(i / 254) + 1}.${(i % 254) + 1}`,
            hostname: `srv-${i.toString().padStart(3, '0')}.example.com`,
            cpu: ['Intel Xeon E5-2680', 'AMD EPYC 7742', 'Intel Core i7-9700'][i % 3],
            memory: ['16GB', '32GB', '64GB', '128GB'][i % 4],
            storage: ['500GB SSD', '1TB SSD', '2TB HDD', '4TB HDD'][i % 4],
            os: ['linux', 'windows', 'unix'][i % 3]
          }
          break
        
        case 'switch':
        case 'router':
          asset = {
            ...asset,
            ip: `10.0.${Math.floor(i / 254) + 1}.${(i % 254) + 1}`,
            model: ['WS-C3750X-48T', 'WS-C2960X-24T', 'ASR1001-X'][i % 3],
            vendor: ['cisco', 'huawei', 'h3c'][i % 3],
            ports: [24, 48, 96][i % 3]
          }
          break
          
        case 'storage':
          asset = {
            ...asset,
            capacity: ['10TB', '20TB', '50TB', '100TB'][i % 4],
            used: ['2TB', '8TB', '25TB', '60TB'][i % 4],
            type: ['ssd', 'hdd', 'nvme'][i % 3]
          }
          break
          
        case 'firewall':
          asset = {
            ...asset,
            ip: `172.16.${Math.floor(i / 254) + 1}.${(i % 254) + 1}`,
            model: ['ASA5525-X', 'FG-200F', 'USG6000'][i % 3],
            vendor: ['cisco', 'fortinet', 'huawei'][i % 3]
          }
          break
      }

      // 添加标签
      asset.tags = [
        assetType.category,
        asset.metadata?.environment || 'unknown',
        status
      ]

      assets.push(asset)
    }

    return assets
  }

  private filterAssets(query: AssetQuery): Asset[] {
    let filteredAssets = [...this.mockAssets]

    // 关键字搜索
    if (query.keyword) {
      const keyword = query.keyword.toLowerCase()
      const searchFields = query.searchFields || ['name', 'ip', 'hostname']
      
      filteredAssets = filteredAssets.filter(asset =>
        searchFields.some(field => {
          const value = asset[field]
          return value && String(value).toLowerCase().includes(keyword)
        })
      )
    }

    // 资产类型过滤
    if (query.typeIds && query.typeIds.length > 0) {
      filteredAssets = filteredAssets.filter(asset =>
        query.typeIds!.includes(asset.type || '')
      )
    }

    // 过滤条件
    if (query.filters && query.filters.length > 0) {
      for (const filter of query.filters) {
        filteredAssets = filteredAssets.filter(asset => {
          const value = asset[filter.field]
          
          switch (filter.operator) {
            case 'eq':
              return value === filter.value
            case 'ne':
              return value !== filter.value
            case 'in':
              return filter.values?.includes(value)
            case 'nin':
              return !filter.values?.includes(value)
            case 'like':
              return String(value).toLowerCase().includes(String(filter.value).toLowerCase())
            case 'exists':
              return value != null && value !== ''
            case 'nexists':
              return value == null || value === ''
            default:
              return true
          }
        })
      }
    }

    // 排序
    if (query.sortFields && query.sortFields.length > 0) {
      filteredAssets.sort((a, b) => {
        for (const sort of query.sortFields!) {
          const aValue = a[sort.fieldId]
          const bValue = b[sort.fieldId]
          
          let comparison = 0
          if (aValue < bValue) comparison = -1
          else if (aValue > bValue) comparison = 1
          
          if (comparison !== 0) {
            return sort.direction === 'desc' ? -comparison : comparison
          }
        }
        return 0
      })
    }

    return filteredAssets
  }

  private simulateLatency(): Promise<void> {
    // 模拟网络延迟
    const latency = Math.random() * 800 + 200 // 200-1000ms
    return new Promise(resolve => setTimeout(resolve, latency))
  }

  async getAssetTypes(filter?: any): Promise<AssetType[]> {
    await this.simulateLatency()
    
    let types = [...this.mockAssetTypes]
    
    // 应用过滤条件
    if (filter) {
      if (filter.category) {
        types = types.filter(type => type.category === filter.category)
      }
      if (filter.search) {
        const keyword = filter.search.toLowerCase()
        types = types.filter(type => 
          type.name.toLowerCase().includes(keyword) ||
          type.description?.toLowerCase().includes(keyword)
        )
      }
    }
    
    return types
  }

  async getAssets(query: AssetQuery): Promise<AssetListResponse> {
    await this.simulateLatency()
    
    const filteredAssets = this.filterAssets(query)
    const page = query.page || 1
    const pageSize = query.pageSize || 20
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    
    const items = filteredAssets.slice(startIndex, endIndex)
    const total = filteredAssets.length
    const hasMore = endIndex < total

    return {
      items,
      total,
      page,
      pageSize,
      hasMore,
      metadata: {
        totalPages: Math.ceil(total / pageSize),
        aggregations: {
          statusCounts: this.getStatusCounts(filteredAssets),
          typeCounts: this.getTypeCounts(filteredAssets)
        },
        performance: {
          queryTime: Math.random() * 500 + 100,
          cacheHit: Math.random() > 0.3
        }
      }
    }
  }

  private getStatusCounts(assets: Asset[]): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const asset of assets) {
      const status = asset.status || 'unknown'
      counts[status] = (counts[status] || 0) + 1
    }
    return counts
  }

  private getTypeCounts(assets: Asset[]): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const asset of assets) {
      const type = asset.type || 'unknown'
      counts[type] = (counts[type] || 0) + 1
    }
    return counts
  }

  async getAssetDetail(id: string): Promise<Asset> {
    await this.simulateLatency()
    
    const asset = this.mockAssets.find(a => a.id === id)
    if (!asset) {
      throw new Error(`Asset not found: ${id}`)
    }

    // 返回包含更多详细信息的资产
    return {
      ...asset,
      relationships: this.generateMockRelationships(asset),
      metadata: {
        ...asset.metadata,
        lastHeartbeat: new Date().toISOString(),
        uptime: Math.floor(Math.random() * 365) + ' days',
        monitoring: {
          cpu: Math.floor(Math.random() * 100),
          memory: Math.floor(Math.random() * 100),
          disk: Math.floor(Math.random() * 100),
          network: Math.floor(Math.random() * 1000) + ' Mbps'
        }
      }
    }
  }

  private generateMockRelationships(asset: Asset) {
    const relationships = []
    const relatedCount = Math.floor(Math.random() * 5) + 1
    
    for (let i = 0; i < relatedCount; i++) {
      const relatedAsset = this.mockAssets[Math.floor(Math.random() * this.mockAssets.length)]
      if (relatedAsset.id !== asset.id) {
        relationships.push({
          id: `rel_${asset.id}_${relatedAsset.id}`,
          sourceAssetId: asset.id,
          targetAssetId: relatedAsset.id,
          relationType: ['depends_on', 'connected_to', 'deployed_on', 'monitors'][i % 4],
          direction: 'forward' as const
        })
      }
    }
    
    return relationships
  }

  async getSearchSuggestions(input: string, fields?: string[]): Promise<Suggestion[]> {
    await this.simulateLatency()
    
    const suggestions: Suggestion[] = []
    const keyword = input.toLowerCase()
    const searchFields = fields || ['name', 'ip', 'hostname']
    
    // 从现有资产中生成建议
    const matchingAssets = this.mockAssets
      .filter(asset => 
        searchFields.some(field => {
          const value = asset[field]
          return value && String(value).toLowerCase().includes(keyword)
        })
      )
      .slice(0, 10)
    
    for (const asset of matchingAssets) {
      suggestions.push({
        value: asset.name,
        label: `${asset.name} (${asset.typeName})`,
        type: 'asset',
        icon: 'server',
        description: asset.description,
        metadata: { assetId: asset.id, type: asset.type }
      })
    }
    
    // 添加一些通用搜索建议
    const commonSuggestions = [
      { value: 'server', label: '服务器', type: 'field' as const, icon: 'server' },
      { value: 'active', label: '运行中', type: 'value' as const, icon: 'check-circle' },
      { value: 'maintenance', label: '维护中', type: 'value' as const, icon: 'tool' },
      { value: '192.168', label: 'IP地址段', type: 'field' as const, icon: 'network' }
    ].filter(s => s.value.toLowerCase().includes(keyword))
    
    suggestions.push(...commonSuggestions)
    
    return suggestions.slice(0, 15)
  }

  async validateAssetSelection(assets: Asset[]): Promise<ValidationResult> {
    await this.simulateLatency()
    
    const errors = []
    const warnings = []
    const suggestions = []

    // 基础验证
    if (assets.length === 0) {
      errors.push({
        code: 'NO_ASSETS_SELECTED',
        message: '请至少选择一个资产',
        severity: 'error' as const
      })
    }

    // 检查停用资产
    const inactiveAssets = assets.filter(asset => asset.status === 'inactive')
    if (inactiveAssets.length > 0) {
      warnings.push({
        code: 'INACTIVE_ASSETS_SELECTED',
        message: `选择了 ${inactiveAssets.length} 个停用状态的资产，这些资产可能无法正常使用`
      })
    }

    // 检查维护中资产
    const maintenanceAssets = assets.filter(asset => asset.status === 'maintenance')
    if (maintenanceAssets.length > 0) {
      warnings.push({
        code: 'MAINTENANCE_ASSETS_SELECTED',
        message: `选择了 ${maintenanceAssets.length} 个维护中的资产，请确认是否需要这些资产`
      })
    }

    // 检查混合环境
    const environments = new Set(assets.map(asset => asset.metadata?.environment).filter(Boolean))
    if (environments.size > 1) {
      warnings.push({
        code: 'MIXED_ENVIRONMENTS',
        message: `选择了来自不同环境的资产: ${Array.from(environments).join(', ')}`
      })
    }

    // 检查大量选择
    if (assets.length > 50) {
      warnings.push({
        code: 'LARGE_SELECTION',
        message: `选择了大量资产 (${assets.length} 个)，操作可能需要较长时间`
      })
    }

    // 生成建议
    if (assets.length > 0) {
      const activeAssets = assets.filter(asset => asset.status === 'active')
      if (activeAssets.length > 0 && activeAssets.length < assets.length) {
        suggestions.push(`建议优先使用 ${activeAssets.length} 个运行中的资产`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }
}