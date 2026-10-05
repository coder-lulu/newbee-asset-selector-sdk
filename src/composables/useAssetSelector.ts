// useAssetSelector 组合式函数
// 提供资产选择器的核心逻辑和状态管理

import { ref, computed, reactive, watch, nextTick } from 'vue'
import type {
  Asset,
  AssetType,
  AssetQuery,
  AssetListResponse,
  AssetSelectorConfig,
  AssetServiceConfig,
  Suggestion,
  ValidationResult
} from '../types'
import { AssetService } from '../services/AssetService'
import { MockAssetService } from '../services/MockAssetService'

export interface UseAssetSelectorOptions {
  config?: Partial<AssetSelectorConfig>
  serviceConfig?: AssetServiceConfig
  immediate?: boolean // 是否立即加载数据
}

export interface UseAssetSelectorReturn {
  // 状态
  loading: Ref<boolean>
  typesLoading: Ref<boolean>
  assets: Ref<Asset[]>
  assetTypes: Ref<AssetType[]>
  selectedAssets: Ref<Asset[]>
  total: Ref<number>
  error: Ref<Error | null>

  // 查询参数
  query: Ref<AssetQuery>
  
  // 计算属性
  hasAssets: ComputedRef<boolean>
  hasSelectedAssets: ComputedRef<boolean>
  isMultiSelect: ComputedRef<boolean>
  canSelectMore: ComputedRef<boolean>

  // 方法
  loadAssetTypes: () => Promise<void>
  loadAssets: () => Promise<void>
  search: (keyword?: string) => Promise<void>
  selectAsset: (asset: Asset) => void
  unselectAsset: (asset: Asset) => void
  toggleAssetSelection: (asset: Asset) => void
  clearSelection: () => void
  isAssetSelected: (asset: Asset) => boolean
  validateSelection: () => Promise<ValidationResult>
  getSearchSuggestions: (input: string) => Promise<Suggestion[]>
  reset: () => void
  refresh: () => Promise<void>

  // 分页
  currentPage: Ref<number>
  pageSize: Ref<number>
  changePage: (page: number, size?: number) => Promise<void>

  // 过滤
  filters: Ref<Record<string, any>>
  addFilter: (key: string, value: any) => void
  removeFilter: (key: string) => void
  clearFilters: () => void

  // 服务实例
  service: Ref<AssetService>
}

export function useAssetSelector(options: UseAssetSelectorOptions = {}): UseAssetSelectorReturn {
  const {
    config = {},
    serviceConfig,
    immediate = true
  } = options

  // 默认配置
  const defaultConfig: AssetSelectorConfig = {
    id: 'default',
    name: '默认配置',
    description: '默认资产选择器配置',
    displayMode: 'table',
    pageSize: 20,
    enableSearch: true,
    enableFilter: true,
    multiSelect: false,
    showTypeFilter: true,
    defaultTypeIds: [],
    displayFields: ['name', 'ip', 'hostname', 'status'],
    searchFields: ['name', 'ip', 'hostname'],
    sortFields: [],
    requirePermission: false,
    allowedTypes: [],
    theme: 'default',
    customStyles: {},
    validationRules: [],
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // 合并配置
  const mergedConfig = computed(() => ({
    ...defaultConfig,
    ...config
  }))

  // 创建服务实例
  const service = ref<AssetService>(createServiceInstance())

  function createServiceInstance(): AssetService {
    if (serviceConfig) {
      switch (serviceConfig.mode) {
        case 'mock':
          return new MockAssetService(serviceConfig)
        default:
          // TODO: 实现其他服务类型
          console.warn(`Service mode ${serviceConfig.mode} not implemented, using MockAssetService`)
          return new MockAssetService({ mode: 'mock' })
      }
    } else {
      // 默认使用Mock服务
      return new MockAssetService({ mode: 'mock' })
    }
  }

  // 响应式状态
  const loading = ref(false)
  const typesLoading = ref(false)
  const assets = ref<Asset[]>([])
  const assetTypes = ref<AssetType[]>([])
  const selectedAssets = ref<Asset[]>([])
  const total = ref(0)
  const error = ref<Error | null>(null)

  // 查询参数
  const query = ref<AssetQuery>({
    page: 1,
    pageSize: mergedConfig.value.pageSize,
    keyword: '',
    searchFields: mergedConfig.value.searchFields,
    typeIds: [...mergedConfig.value.defaultTypeIds],
    filters: [],
    sortFields: [...mergedConfig.value.sortFields],
    includeRelationships: false,
    includeMetadata: true
  })

  // 分页参数
  const currentPage = ref(1)
  const pageSize = ref(mergedConfig.value.pageSize)

  // 过滤参数
  const filters = ref<Record<string, any>>({})

  // 计算属性
  const hasAssets = computed(() => assets.value.length > 0)
  const hasSelectedAssets = computed(() => selectedAssets.value.length > 0)
  const isMultiSelect = computed(() => mergedConfig.value.multiSelect)
  const canSelectMore = computed(() => {
    if (!isMultiSelect.value) {
      return selectedAssets.value.length === 0
    }
    return true // 多选模式暂不限制数量
  })

  // 方法实现
  async function loadAssetTypes() {
    if (typesLoading.value) return

    typesLoading.value = true
    error.value = null

    try {
      const types = await service.value.getAssetTypes()
      assetTypes.value = types

      // 如果有允许的类型限制，过滤资产类型
      if (mergedConfig.value.allowedTypes.length > 0) {
        assetTypes.value = types.filter(type =>
          mergedConfig.value.allowedTypes.includes(type.code)
        )
      }
    } catch (err) {
      error.value = err as Error
      console.error('加载资产类型失败:', err)
    } finally {
      typesLoading.value = false
    }
  }

  async function loadAssets() {
    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      // 更新查询参数
      query.value.page = currentPage.value
      query.value.pageSize = pageSize.value

      // 应用过滤条件
      const filterArray = Object.entries(filters.value).map(([key, value]) => ({
        field: key,
        operator: 'eq' as const,
        value
      }))
      query.value.filters = filterArray

      const response = await service.value.getAssets(query.value)
      assets.value = response.items
      total.value = response.total

      // 清除不再存在的选中资产
      if (hasSelectedAssets.value) {
        const currentAssetIds = new Set(assets.value.map(a => a.id))
        selectedAssets.value = selectedAssets.value.filter(asset =>
          currentAssetIds.has(asset.id)
        )
      }
    } catch (err) {
      error.value = err as Error
      console.error('加载资产数据失败:', err)
      assets.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  async function search(keyword?: string) {
    if (keyword !== undefined) {
      query.value.keyword = keyword
    }
    currentPage.value = 1
    await loadAssets()
  }

  function selectAsset(asset: Asset) {
    if (isAssetSelected(asset)) return

    if (!isMultiSelect.value) {
      selectedAssets.value = [asset]
    } else {
      selectedAssets.value.push(asset)
    }
  }

  function unselectAsset(asset: Asset) {
    const index = selectedAssets.value.findIndex(a => a.id === asset.id)
    if (index > -1) {
      selectedAssets.value.splice(index, 1)
    }
  }

  function toggleAssetSelection(asset: Asset) {
    if (isAssetSelected(asset)) {
      unselectAsset(asset)
    } else {
      selectAsset(asset)
    }
  }

  function clearSelection() {
    selectedAssets.value = []
  }

  function isAssetSelected(asset: Asset): boolean {
    return selectedAssets.value.some(a => a.id === asset.id)
  }

  async function validateSelection(): Promise<ValidationResult> {
    try {
      return await service.value.validateAssetSelection(selectedAssets.value)
    } catch (err) {
      console.error('验证选择失败:', err)
      return {
        valid: false,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: '验证选择时发生错误',
          severity: 'error'
        }],
        warnings: []
      }
    }
  }

  async function getSearchSuggestions(input: string): Promise<Suggestion[]> {
    try {
      return await service.value.getSearchSuggestions(input, query.value.searchFields)
    } catch (err) {
      console.error('获取搜索建议失败:', err)
      return []
    }
  }

  function reset() {
    // 重置所有状态
    assets.value = []
    selectedAssets.value = []
    total.value = 0
    error.value = null
    currentPage.value = 1
    query.value.keyword = ''
    query.value.typeIds = [...mergedConfig.value.defaultTypeIds]
    clearFilters()
  }

  async function refresh() {
    await Promise.all([
      loadAssetTypes(),
      loadAssets()
    ])
  }

  async function changePage(page: number, size?: number) {
    currentPage.value = page
    if (size) {
      pageSize.value = size
    }
    await loadAssets()
  }

  function addFilter(key: string, value: any) {
    filters.value[key] = value
    currentPage.value = 1 // 重置到第一页
  }

  function removeFilter(key: string) {
    delete filters.value[key]
    currentPage.value = 1
  }

  function clearFilters() {
    filters.value = {}
    currentPage.value = 1
  }

  // 监听配置变化
  watch(() => mergedConfig.value.pageSize, (newSize) => {
    pageSize.value = newSize
    query.value.pageSize = newSize
  })

  watch(() => mergedConfig.value.searchFields, (newFields) => {
    query.value.searchFields = newFields
  })

  watch(() => mergedConfig.value.defaultTypeIds, (newTypeIds) => {
    query.value.typeIds = [...newTypeIds]
  })

  // 监听过滤器变化，自动重新加载数据
  watch(filters, () => {
    if (hasAssets.value) {
      loadAssets()
    }
  }, { deep: true })

  // 自动初始化
  if (immediate) {
    nextTick(() => {
      refresh()
    })
  }

  return {
    // 状态
    loading,
    typesLoading,
    assets,
    assetTypes,
    selectedAssets,
    total,
    error,

    // 查询参数
    query,

    // 计算属性
    hasAssets,
    hasSelectedAssets,
    isMultiSelect,
    canSelectMore,

    // 方法
    loadAssetTypes,
    loadAssets,
    search,
    selectAsset,
    unselectAsset,
    toggleAssetSelection,
    clearSelection,
    isAssetSelected,
    validateSelection,
    getSearchSuggestions,
    reset,
    refresh,

    // 分页
    currentPage,
    pageSize,
    changePage,

    // 过滤
    filters,
    addFilter,
    removeFilter,
    clearFilters,

    // 服务实例
    service
  }
}

/**
 * 用于简单场景的便捷函数
 */
export function useSimpleAssetSelector(serviceConfig?: AssetServiceConfig) {
  return useAssetSelector({
    config: {
      displayMode: 'card',
      pageSize: 10,
      enableFilter: false,
      showTypeFilter: false,
      multiSelect: false
    },
    serviceConfig,
    immediate: true
  })
}

/**
 * 用于高级场景的便捷函数
 */
export function useAdvancedAssetSelector(serviceConfig?: AssetServiceConfig) {
  return useAssetSelector({
    config: {
      displayMode: 'table',
      pageSize: 20,
      enableFilter: true,
      showTypeFilter: true,
      multiSelect: true,
      displayFields: ['name', 'ip', 'hostname', 'status', 'owner', 'department'],
      searchFields: ['name', 'ip', 'hostname', 'description']
    },
    serviceConfig,
    immediate: true
  })
}

/**
 * 用于CMDB场景的便捷函数
 */
export function useCMDBAssetSelector(baseUrl?: string) {
  const serviceConfig: AssetServiceConfig = {
    mode: 'cmdb',
    endpoints: {
      getAssetTypes: `${baseUrl || ''}/api/cmdb/v1/ci-types`,
      getAssets: `${baseUrl || ''}/api/cmdb/v1/cis`,
      getAssetDetail: `${baseUrl || ''}/api/cmdb/v1/cis/:id/detail`
    }
  }

  return useAssetSelector({
    config: {
      displayMode: 'table',
      enableFilter: true,
      showTypeFilter: true,
      requirePermission: true,
      displayFields: ['name', 'ip', 'hostname', 'status', 'heartbeat'],
      searchFields: ['name', 'ip', 'hostname'],
      metadata: { source: 'cmdb' }
    },
    serviceConfig,
    immediate: true
  })
}