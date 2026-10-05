// 统一类型定义文件
// 确保前后端类型一致性

// ===== 基础资产类型 =====

export interface Asset {
  id: string
  name: string
  type?: string
  typeName?: string
  status?: AssetStatus
  ip?: string
  hostname?: string
  description?: string
  tags?: string[]
  metadata?: Record<string, any>
  relationships?: AssetRelationship[]
  createdAt?: string
  updatedAt?: string
  [key: string]: any
}

export interface AssetType {
  id: string
  name: string
  code: string
  description?: string
  category?: string
  icon?: string
  color?: string
  fields: AssetField[]
  allowedOperations?: string[]
  metadata?: Record<string, any>
}

export interface AssetField {
  id: string
  name: string
  code: string
  type: FieldType
  required: boolean
  searchable: boolean
  sortable: boolean
  filterable: boolean
  displayOrder: number
  options?: FieldOption[]
  validation?: FieldValidation
  metadata?: Record<string, any>
}

export interface FieldOption {
  value: string
  label: string
  color?: string
  icon?: string
  disabled?: boolean
}

export interface FieldValidation {
  min?: number
  max?: number
  pattern?: string
  message?: string
}

export interface AssetRelationship {
  id: string
  sourceAssetId: string
  targetAssetId: string
  relationType: string
  direction: 'forward' | 'backward' | 'bidirectional'
  metadata?: Record<string, any>
}

// ===== 枚举类型 =====

export type FieldType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'date' 
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'text'
  | 'url'
  | 'email'
  | 'ip'
  | 'json'

export type AssetStatus = 
  | 'active'
  | 'inactive' 
  | 'maintenance'
  | 'retired'
  | 'unknown'

export type FilterOperator = 
  | 'eq'       // 等于
  | 'ne'       // 不等于
  | 'gt'       // 大于
  | 'gte'      // 大于等于
  | 'lt'       // 小于
  | 'lte'      // 小于等于
  | 'in'       // 包含于
  | 'nin'      // 不包含于
  | 'like'     // 模糊匹配
  | 'nlike'    // 不模糊匹配
  | 'exists'   // 字段存在
  | 'nexists'  // 字段不存在

// ===== 查询和响应类型 =====

export interface AssetQuery {
  // 分页参数
  page?: number
  pageSize?: number
  
  // 搜索参数
  keyword?: string
  searchFields?: string[]
  
  // 过滤参数
  filters?: AssetFilter[]
  typeIds?: string[]
  
  // 排序参数
  sortFields?: SortField[]
  
  // 其他参数
  includeRelationships?: boolean
  includeMetadata?: boolean
  fields?: string[] // 指定返回字段
}

export interface AssetFilter {
  field: string
  operator: FilterOperator
  value: any
  values?: any[] // 用于 in/nin 操作符
}

export interface SortField {
  fieldId: string
  fieldName: string
  direction: 'asc' | 'desc'
  priority: number
}

export interface AssetListResponse {
  items: Asset[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  metadata?: {
    totalPages: number
    aggregations?: Record<string, any>
    performance?: {
      queryTime: number
      cacheHit: boolean
    }
  }
}

// ===== 配置类型 =====

export interface AssetSelectorConfig {
  // 基本信息
  id: string
  name: string
  description: string
  
  // 显示配置
  displayMode: 'table' | 'card' | 'list'
  pageSize: number
  enableSearch: boolean
  enableFilter: boolean
  multiSelect: boolean
  showTypeFilter: boolean
  defaultTypeIds: string[]
  
  // 字段配置
  displayFields: string[]
  searchFields: string[]
  sortFields: SortField[]
  
  // 权限配置
  requirePermission: boolean
  allowedTypes: string[]
  
  // UI配置
  theme: string
  customStyles: Record<string, any>
  
  // 业务配置
  validationRules: string[]
  metadata: Record<string, any>
  
  // 时间戳
  createdAt: string
  updatedAt: string
}

export interface AssetServiceConfig {
  // 服务模式
  mode: 'cmdb' | 'http' | 'graphql' | 'websocket' | 'mock' | 'generic' | 'kubernetes' | 'user-management' | 'asset-management' | 'gateway'
  
  // 端点配置
  endpoints?: {
    getAssetTypes?: string
    getAssets?: string
    getAssetDetail?: string
    getSearchSuggestions?: string
    validateAssetSelection?: string
    [key: string]: string | undefined
  }
  
  // 认证配置
  authentication?: {
    type: 'jwt' | 'apikey' | 'oauth2' | 'basic' | 'bearer'
    config: Record<string, any>
  }
  
  // 租户配置
  tenant?: {
    enabled: boolean
    headerName: string
    defaultTenantId?: string
  }
  
  // 权限配置
  permission?: {
    enabled: boolean
    scope: string[]
    checkEndpoint?: string
  }
  
  // 缓存配置
  cache?: {
    enabled: boolean
    ttl: number
    strategy: 'memory' | 'redis' | 'hybrid'
  }
  
  // 网关配置
  gateway?: {
    enabled: boolean
    url: string
    timeout: number
    retries: number
  }
  
  // 其他配置
  timeout?: number
  retries?: number
  metadata?: Record<string, any>
}

// ===== 组件Props类型 =====

export interface AssetSelectorProps {
  // 显示控制
  open: boolean
  title?: string
  width?: number | string
  
  // 选择控制
  multiple?: boolean
  selectedAssets?: Asset[]
  allowedTypes?: string[]
  maxSelection?: number
  minSelection?: number
  
  // 配置
  config?: Partial<AssetSelectorConfig>
  serviceConfig?: AssetServiceConfig
  
  // 事件回调
  onConfirm?: (assets: Asset[]) => void
  onCancel?: () => void
  onError?: (error: Error) => void
  onSelectionChange?: (assets: Asset[]) => void
}

export interface AssetSelectorRef {
  // 方法
  show: () => void
  hide: () => void
  refresh: () => Promise<void>
  clearSelection: () => void
  
  // 获取状态
  getSelectedAssets: () => Asset[]
  getConfig: () => AssetSelectorConfig
  isVisible: () => boolean
}

// ===== 服务接口类型 =====

export interface AssetService {
  // 基础查询方法
  getAssetTypes(filter?: any): Promise<AssetType[]>
  getAssets(query: AssetQuery): Promise<AssetListResponse>
  getAssetDetail(id: string): Promise<Asset>
  getSearchSuggestions(input: string, fields?: string[]): Promise<Suggestion[]>
  
  // 验证方法
  validateAssetSelection(assets: Asset[]): Promise<ValidationResult>
}

export interface PermissionService {
  checkAssetTypeAccess(typeIds: string[], userId: string): Promise<string[]>
  filterVisibleAssets(assets: Asset[], userId: string): Promise<Asset[]>
  getUserAssetScope(userId: string): Promise<AssetPermissionScope>
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<boolean>
  delete(key: string): Promise<boolean>
  clear(pattern?: string): Promise<boolean>
}

// ===== 插件系统类型 =====

export interface SelectorPlugin {
  name: string
  version: string
  description?: string
  dependencies?: string[]
  
  // 生命周期钩子
  onInstall?: (context: PluginContext) => void | Promise<void>
  onUninstall?: (context: PluginContext) => void | Promise<void>
  onBeforeSearch?: (query: AssetQuery, context: PluginContext) => AssetQuery | Promise<AssetQuery>
  onAfterSearch?: (result: AssetListResponse, context: PluginContext) => AssetListResponse | Promise<AssetListResponse>
  onBeforeSelect?: (assets: Asset[], context: PluginContext) => boolean | Promise<boolean>
  onAfterSelect?: (assets: Asset[], context: PluginContext) => void | Promise<void>
  
  // UI扩展
  getToolbarComponent?: () => any
  getFilterComponent?: () => any
  getActionComponent?: () => any
}

export interface PluginContext {
  config: AssetSelectorConfig
  serviceConfig: AssetServiceConfig
  currentUser?: any
  showMessage: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void
  refreshData: () => Promise<void>
  updateConfig: (config: Partial<AssetSelectorConfig>) => void
}

// ===== 验证和建议类型 =====

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions?: string[]
}

export interface ValidationError {
  code: string
  message: string
  field?: string
  asset?: Asset
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  code: string
  message: string
  field?: string
  asset?: Asset
}

export interface Suggestion {
  value: string
  label: string
  type: 'asset' | 'field' | 'value'
  icon?: string
  description?: string
  metadata?: Record<string, any>
}

// ===== 权限相关类型 =====

export interface AssetPermissionScope {
  allowedTypes: string[]
  allowedOperations: string[]
  dataScope: 'all' | 'tenant' | 'department' | 'self'
  customFilters?: AssetFilter[]
}

// ===== 事件类型 =====

export interface AssetSelectorEvent {
  type: 'search' | 'select' | 'filter' | 'sort' | 'paginate'
  data: any
  timestamp: number
  source: 'user' | 'system' | 'plugin'
}

// ===== 缓存相关类型 =====

export interface CacheOptions {
  ttl?: number
  tags?: string[]
  dependency?: string[]
  serialize?: boolean
  compress?: boolean
}

export interface CacheEntry<T> {
  value: T
  ttl: number
  createdAt: number
  accessCount: number
  tags: string[]
}

// ===== 工厂函数相关类型 =====

export interface CreateAssetSelectorOptions {
  // 基础配置
  config?: Partial<AssetSelectorConfig>
  serviceConfig?: AssetServiceConfig
  
  // 组件属性
  props?: Partial<AssetSelectorProps>
  
  // 插件
  plugins?: SelectorPlugin[]
  
  // 容器元素
  container?: HTMLElement | string
  
  // 事件处理器
  onConfirm?: (assets: Asset[]) => void
  onCancel?: () => void
  onError?: (error: Error) => void
}

export interface AssetSelectorInstance {
  // 组件实例
  app?: any // Vue App instance
  
  // 方法
  show: () => void
  hide: () => void
  destroy: () => void
  
  // 配置
  updateConfig: (config: Partial<AssetSelectorConfig>) => void
  updateServiceConfig: (config: Partial<AssetServiceConfig>) => void
  
  // 插件管理
  addPlugin: (plugin: SelectorPlugin) => void
  removePlugin: (name: string) => void
  
  // 获取状态
  getSelectedAssets: () => Asset[]
  isVisible: () => boolean
}

// ===== SDK选项类型 =====

export interface AssetSelectorSDKOptions {
  // 全局配置
  config?: Partial<AssetSelectorConfig>
  
  // 服务配置
  serviceConfig?: AssetServiceConfig
  
  // 插件配置
  plugins?: SelectorPlugin[]
  
  // 组件注册名称
  componentName?: string
  
  // 是否自动注册默认插件
  autoRegisterPlugins?: boolean
  
  // 是否启用调试模式
  debug?: boolean
}