<template>
  <a-modal
    :open="open"
    :title="modalTitle"
    :width="modalWidth"
    :maskClosable="false"
    :destroyOnClose="true"
    @cancel="handleCancel"
    class="asset-selector-modal"
  >
    <!-- 头部工具栏 -->
    <div class="asset-selector-header">
      <!-- 搜索区域 -->
      <div class="search-section" v-if="computedConfig.enableSearch">
        <a-input-search
          v-model:value="searchKeyword"
          :placeholder="searchPlaceholder"
          size="large"
          @search="handleSearch"
          @pressEnter="handleSearch"
          style="width: 300px;"
        >
          <template #enterButton>
            <a-button type="primary">
              <template #icon><SearchOutlined /></template>
              搜索
            </a-button>
          </template>
        </a-input-search>
      </div>

      <!-- 过滤器区域 -->
      <div class="filter-section" v-if="computedConfig.enableFilter">
        <!-- 资产类型过滤 -->
        <a-select
          v-if="computedConfig.showTypeFilter"
          v-model:value="selectedTypeIds"
          mode="multiple"
          placeholder="选择资产类型"
          style="width: 200px; margin-left: 12px;"
          :loading="typesLoading"
          @change="handleTypeFilterChange"
        >
          <a-select-option
            v-for="type in assetTypes"
            :key="type.id"
            :value="type.id"
          >
            {{ type.name }}
          </a-select-option>
        </a-select>
      </div>

      <!-- 右侧操作区 -->
      <div class="header-actions">
        <a-space>
          <!-- 显示模式切换 -->
          <a-radio-group
            v-model:value="currentDisplayMode"
            size="small"
            @change="handleDisplayModeChange"
          >
            <a-radio-button value="table">
              <template #icon><TableOutlined /></template>
              表格
            </a-radio-button>
            <a-radio-button value="card">
              <template #icon><AppstoreOutlined /></template>
              卡片
            </a-radio-button>
            <a-radio-button value="list">
              <template #icon><UnorderedListOutlined /></template>
              列表
            </a-radio-button>
          </a-radio-group>
          
          <!-- 刷新按钮 -->
          <a-button @click="handleRefresh" :loading="loading">
            <template #icon><ReloadOutlined /></template>
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="asset-selector-content">
      <!-- 选择统计信息 -->
      <div class="selection-info" v-if="selectedAssets.length > 0">
        <a-alert
          :message="`已选择 ${selectedAssets.length} 个资产`"
          type="info"
          show-icon
          closable
          @close="handleClearSelection"
        >
          <template #action>
            <a-button size="small" @click="handleClearSelection">清空选择</a-button>
          </template>
        </a-alert>
      </div>

      <!-- 表格显示模式 -->
      <div v-if="currentDisplayMode === 'table'" class="table-container">
        <a-table
          :columns="tableColumns"
          :dataSource="assets"
          :loading="loading"
          :pagination="paginationConfig"
          :rowSelection="rowSelectionConfig"
          :scroll="{ x: 800, y: 400 }"
          size="middle"
          @change="handleTableChange"
        >
          <!-- 自定义列渲染 -->
          <template #bodyCell="{ column, record, text }">
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(text)">{{ getStatusText(text) }}</a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button type="link" size="small" @click="viewAssetDetail(record)">
                  详情
                </a-button>
              </a-space>
            </template>
            <template v-else>
              {{ formatFieldValue(column.key, text) }}
            </template>
          </template>
        </a-table>
      </div>

      <!-- 卡片显示模式 -->
      <div v-else-if="currentDisplayMode === 'card'" class="card-container">
        <div class="card-grid">
          <div
            v-for="asset in assets"
            :key="asset.id"
            class="asset-card"
            :class="{ 'selected': isAssetSelected(asset) }"
            @click="toggleAssetSelection(asset)"
          >
            <a-card size="small" hoverable>
              <template #title>
                <div class="card-title">
                  <span>{{ asset.name }}</span>
                  <a-checkbox
                    :checked="isAssetSelected(asset)"
                    @click.stop
                    @change="(e) => handleAssetCheck(asset, e.target.checked)"
                  />
                </div>
              </template>
              
              <div class="card-content">
                <div
                  v-for="fieldKey in computedConfig.displayFields.slice(1, 4)"
                  :key="fieldKey"
                  class="card-field"
                >
                  <span class="field-label">{{ getFieldLabel(fieldKey) }}:</span>
                  <span class="field-value">{{ formatFieldValue(fieldKey, asset[fieldKey]) }}</span>
                </div>
              </div>
            </a-card>
          </div>
        </div>

        <!-- 卡片模式分页 -->
        <div class="card-pagination">
          <a-pagination
            v-model:current="currentPage"
            v-model:pageSize="pageSize"
            :total="total"
            :showSizeChanger="true"
            :showQuickJumper="true"
            :showTotal="(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`"
            @change="handlePageChange"
            @showSizeChange="handlePageSizeChange"
          />
        </div>
      </div>

      <!-- 列表显示模式 -->
      <div v-else-if="currentDisplayMode === 'list'" class="list-container">
        <a-list
          :dataSource="assets"
          :loading="loading"
          item-layout="horizontal"
        >
          <template #renderItem="{ item }">
            <a-list-item
              class="asset-list-item"
              :class="{ 'selected': isAssetSelected(item) }"
              @click="toggleAssetSelection(item)"
            >
              <template #actions>
                <a-checkbox
                  :checked="isAssetSelected(item)"
                  @change="(e) => handleAssetCheck(item, e.target.checked)"
                />
              </template>
              
              <a-list-item-meta>
                <template #title>
                  <span class="asset-name">{{ item.name }}</span>
                  <a-tag
                    v-if="item.status"
                    :color="getStatusColor(item.status)"
                    size="small"
                    style="margin-left: 8px;"
                  >
                    {{ getStatusText(item.status) }}
                  </a-tag>
                </template>
                
                <template #description>
                  <div class="asset-description">
                    <span v-for="fieldKey in computedConfig.displayFields.slice(1, 3)" :key="fieldKey">
                      {{ getFieldLabel(fieldKey) }}: {{ formatFieldValue(fieldKey, item[fieldKey]) }}
                      <a-divider type="vertical" />
                    </span>
                  </div>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>

        <!-- 列表模式分页 -->
        <div class="list-pagination">
          <a-pagination
            v-model:current="currentPage"
            v-model:pageSize="pageSize"
            :total="total"
            :showSizeChanger="true"
            :showTotal="(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`"
            @change="handlePageChange"
            @showSizeChange="handlePageSizeChange"
          />
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && assets.length === 0" class="empty-state">
        <a-empty description="暂无数据">
          <a-button type="primary" @click="handleRefresh">刷新数据</a-button>
        </a-empty>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <template #footer>
      <div class="modal-footer">
        <div class="footer-info">
          <span v-if="selectedAssets.length > 0">
            已选择 <strong>{{ selectedAssets.length }}</strong> 个资产
          </span>
          <span v-else class="text-muted">
            {{ multiple ? '可多选' : '单选模式' }}
          </span>
        </div>
        
        <div class="footer-actions">
          <a-space>
            <a-button @click="handleCancel">取消</a-button>
            <a-button
              type="primary"
              :disabled="selectedAssets.length === 0"
              @click="handleConfirm"
            >
              确认选择 ({{ selectedAssets.length }})
            </a-button>
          </a-space>
        </div>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import {
  SearchOutlined,
  TableOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'

import type {
  Asset,
  AssetType,
  AssetSelectorProps,
  AssetSelectorConfig,
  AssetServiceConfig,
  AssetQuery,
  AssetListResponse
} from '../types'
import { useAssetSelector } from '../composables/useAssetSelector'

// Props定义
const props = withDefaults(defineProps<AssetSelectorProps>(), {
  open: false,
  title: '选择资产',
  width: 1200,
  multiple: false,
  selectedAssets: () => [],
  allowedTypes: () => [],
  maxSelection: undefined,
  minSelection: 0
})

// Emits定义
const emit = defineEmits<{
  confirm: [assets: Asset[]]
  cancel: []
  error: [error: Error]
  selectionChange: [assets: Asset[]]
}>()

// 使用资产选择器逻辑
const {
  loading,
  typesLoading,
  assets,
  assetTypes,
  selectedAssets,
  total,
  error,
  currentPage,
  pageSize,
  query,
  search,
  selectAsset,
  unselectAsset,
  toggleAssetSelection,
  clearSelection,
  isAssetSelected,
  validateSelection,
  refresh,
  changePage,
  addFilter,
  removeFilter
} = useAssetSelector({
  config: props.config,
  serviceConfig: props.serviceConfig,
  immediate: false // 等对话框打开时再加载
})

// 组件内部状态
const searchKeyword = ref('')
const selectedTypeIds = ref<string[]>([])
const currentDisplayMode = ref<'table' | 'card' | 'list'>('table')

// 计算属性
const modalTitle = computed(() => props.title)
const modalWidth = computed(() => props.width)
const multiple = computed(() => props.multiple)

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
const computedConfig = computed(() => {
  return {
    ...defaultConfig,
    ...props.config,
    multiSelect: multiple.value // 组件props优先级更高
  }
})

// 搜索占位符
const searchPlaceholder = computed(() => {
  const fields = computedConfig.value.searchFields.join('、')
  return `搜索 ${fields}`
})

// 表格列配置
const tableColumns = computed(() => {
  const baseColumns = computedConfig.value.displayFields.map(fieldKey => ({
    title: getFieldLabel(fieldKey),
    dataIndex: fieldKey,
    key: fieldKey,
    ellipsis: true,
    width: getColumnWidth(fieldKey)
  }))

  // 添加操作列
  return [
    ...baseColumns,
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const
    }
  ]
})

// 行选择配置
const rowSelectionConfig = computed(() => ({
  type: multiple.value ? 'checkbox' : 'radio',
  selectedRowKeys: selectedAssets.value.map(asset => asset.id),
  onSelect: (record: Asset, selected: boolean) => {
    if (selected) {
      addAssetToSelection(record)
    } else {
      removeAssetFromSelection(record)
    }
  },
  onSelectAll: (selected: boolean, selectedRows: Asset[], changeRows: Asset[]) => {
    if (selected) {
      changeRows.forEach(asset => addAssetToSelection(asset))
    } else {
      changeRows.forEach(asset => removeAssetFromSelection(asset))
    }
  }
}))

// 分页配置
const paginationConfig = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) => 
    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
  onChange: handlePageChange,
  onShowSizeChange: handlePageSizeChange
}))

// 方法实现
function getFieldLabel(fieldKey: string): string {
  const labelMap: Record<string, string> = {
    name: '名称',
    ip: 'IP地址',
    hostname: '主机名',
    status: '状态',
    type: '类型',
    owner: '负责人',
    department: '部门',
    location: '位置',
    description: '描述'
  }
  return labelMap[fieldKey] || fieldKey
}

function getColumnWidth(fieldKey: string): number {
  const widthMap: Record<string, number> = {
    name: 150,
    ip: 120,
    hostname: 150,
    status: 80,
    type: 100,
    owner: 100,
    department: 120,
    location: 120
  }
  return widthMap[fieldKey] || 100
}

function formatFieldValue(fieldKey: string, value: any): string {
  if (value == null || value === '') return '-'
  
  // 根据字段类型格式化显示
  switch (fieldKey) {
    case 'status':
      return getStatusText(value)
    default:
      return String(value)
  }
}

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    active: 'green',
    inactive: 'red', 
    maintenance: 'orange',
    retired: 'default',
    unknown: 'default'
  }
  return colorMap[status] || 'default'
}

function getStatusText(status: string): string {
  const textMap: Record<string, string> = {
    active: '正常',
    inactive: '停用',
    maintenance: '维护中',
    retired: '已退役',
    unknown: '未知'
  }
  return textMap[status] || status
}

// 资产选择相关方法
function addAssetToSelection(asset: Asset) {
  // 检查最大选择数量限制
  if (props.maxSelection && selectedAssets.value.length >= props.maxSelection) {
    console.warn(`最多只能选择 ${props.maxSelection} 个资产`)
    return
  }
  
  if (!multiple.value) {
    // 单选模式，先清空再选择
    clearSelection()
  }
  
  selectAsset(asset)
  emit('selectionChange', selectedAssets.value)
}

function removeAssetFromSelection(asset: Asset) {
  unselectAsset(asset)
  emit('selectionChange', selectedAssets.value)
}

function handleAssetCheck(asset: Asset, checked: boolean) {
  if (checked) {
    addAssetToSelection(asset)
  } else {
    removeAssetFromSelection(asset)
  }
}

function handleClearSelection() {
  clearSelection()
  emit('selectionChange', selectedAssets.value)
}

// 事件处理方法
async function handleSearch() {
  await search(searchKeyword.value)
}

async function handleTypeFilterChange() {
  // 更新类型过滤器
  if (selectedTypeIds.value.length > 0) {
    addFilter('typeIds', selectedTypeIds.value)
  } else {
    removeFilter('typeIds')
  }
}

function handleDisplayModeChange() {
  // 显示模式切换时可能需要调整分页大小
  if (currentDisplayMode.value === 'card') {
    const newSize = Math.min(pageSize.value, 12)
    if (newSize !== pageSize.value) {
      changePage(1, newSize)
    }
  } else if (currentDisplayMode.value === 'list') {
    const newSize = Math.min(pageSize.value, 10)
    if (newSize !== pageSize.value) {
      changePage(1, newSize)
    }
  }
}

async function handleRefresh() {
  await refresh()
}

async function handleTableChange(pagination: any, filters: any, sorter: any) {
  // TODO: 处理排序和过滤
  await changePage(pagination.current, pagination.pageSize)
}

async function handlePageChange(page: number, size: number) {
  await changePage(page, size)
}

async function handlePageSizeChange(current: number, size: number) {
  await changePage(1, size)
}

function viewAssetDetail(asset: Asset) {
  console.log('查看资产详情:', asset)
  // TODO: 实现资产详情查看
}

async function handleConfirm() {
  // 验证选择数量
  if (props.minSelection && selectedAssets.value.length < props.minSelection) {
    console.warn(`至少需要选择 ${props.minSelection} 个资产`)
    return
  }
  
  if (props.maxSelection && selectedAssets.value.length > props.maxSelection) {
    console.warn(`最多只能选择 ${props.maxSelection} 个资产`)
    return
  }
  
  // 执行选择验证
  try {
    const validationResult = await validateSelection()
    
    if (!validationResult.valid) {
      // 如果有错误，阻止确认
      if (validationResult.errors && validationResult.errors.length > 0) {
        const errorMessages = validationResult.errors.map(e => e.message).join(', ')
        console.error('选择验证失败:', errorMessages)
        emit('error', new Error(`选择验证失败: ${errorMessages}`))
        return
      }
    }
    
    // 如果有警告，可以选择显示但不阻止确认
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      const warningMessages = validationResult.warnings.map(w => w.message).join(', ')
      console.warn('选择警告:', warningMessages)
    }
    
    emit('confirm', selectedAssets.value)
  } catch (error) {
    console.error('验证过程出错:', error)
    emit('error', error as Error)
  }
}

function handleCancel() {
  emit('cancel')
}

// 服务集成相关方法
function viewAssetDetail(asset: Asset) {
  console.log('查看资产详情:', asset)
  // TODO: 实现资产详情查看
}

// 监听配置变化
watch(() => computedConfig.value.displayMode, (newMode) => {
  currentDisplayMode.value = newMode
}, { immediate: true })

watch(() => computedConfig.value.pageSize, (newSize) => {
  pageSize.value = newSize
}, { immediate: true })

// 监听props变化
watch(() => props.selectedAssets, (newAssets) => {
  // 同步外部传入的选中资产
  newAssets.forEach(asset => {
    if (!isAssetSelected(asset)) {
      selectAsset(asset)
    }
  })
  
  // 移除不在新列表中的资产
  const newAssetIds = new Set(newAssets.map(a => a.id))
  selectedAssets.value.forEach(asset => {
    if (!newAssetIds.has(asset.id)) {
      unselectAsset(asset)
    }
  })
}, { deep: true })

// 监听搜索关键词变化
watch(searchKeyword, (newKeyword) => {
  if (newKeyword !== query.value.keyword) {
    query.value.keyword = newKeyword
  }
})

// 监听类型过滤器变化
watch(selectedTypeIds, (newTypeIds) => {
  if (JSON.stringify(newTypeIds) !== JSON.stringify(query.value.typeIds)) {
    query.value.typeIds = [...newTypeIds]
    handleTypeFilterChange()
  }
}, { deep: true })

watch(() => props.open, async (newOpen) => {
  if (newOpen) {
    // 对话框打开时刷新数据
    await nextTick()
    await refresh()
    
    // 同步初始选择
    if (props.selectedAssets.length > 0) {
      props.selectedAssets.forEach(asset => {
        selectAsset(asset)
      })
    }
  }
})

// 监听错误状态
watch(error, (newError) => {
  if (newError) {
    emit('error', newError)
  }
})
</script>

<style scoped>
.asset-selector-modal {
  .asset-selector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding: 16px;
    background: #fafafa;
    border-radius: 6px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .search-section {
    flex: 1;
    min-width: 300px;
  }

  .filter-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-actions {
    display: flex;
    align-items: center;
  }

  .asset-selector-content {
    min-height: 400px;
    max-height: 600px;
  }

  .selection-info {
    margin-bottom: 16px;
  }

  .table-container {
    .ant-table {
      border: 1px solid #f0f0f0;
    }
  }

  .card-container {
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .asset-card {
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &.selected {
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
      }

      .card-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .card-content {
        .card-field {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          
          .field-label {
            color: #666;
            font-size: 12px;
          }
          
          .field-value {
            font-weight: 500;
          }
        }
      }
    }

    .card-pagination {
      display: flex;
      justify-content: center;
      margin-top: 16px;
    }
  }

  .list-container {
    .asset-list-item {
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f5f5f5;
      }

      &.selected {
        background-color: #e6f7ff;
        border-color: #1890ff;
      }

      .asset-name {
        font-weight: 500;
        font-size: 14px;
      }

      .asset-description {
        font-size: 12px;
        color: #666;
      }
    }

    .list-pagination {
      display: flex;
      justify-content: center;
      margin-top: 16px;
    }
  }

  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .footer-info {
      color: #666;
      font-size: 14px;

      .text-muted {
        color: #999;
      }
    }

    .footer-actions {
      display: flex;
      align-items: center;
    }
  }
}

/* 响应式适配 */
@media (max-width: 768px) {
  .asset-selector-modal {
    .asset-selector-header {
      flex-direction: column;
      align-items: stretch;
    }

    .search-section {
      min-width: auto;
    }

    .card-container .card-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>