// 资产选择器工厂函数
// 提供便捷的创建和配置方法

import { createApp, App, Plugin } from 'vue'
import type { AssetSelectorConfig, AssetServiceConfig, Asset } from '../types'
import AssetSelector from '../components/AssetSelector.vue'
import { ConfigManager } from '../config/ConfigManager'
import { AssetSelectorConfigBuilder } from '../config/ConfigBuilder'

export interface AssetSelectorInstance {
  // 基本方法
  show(): void
  hide(): void
  destroy(): void
  
  // 配置方法
  updateConfig(config: Partial<AssetSelectorConfig>): void
  getConfig(): AssetSelectorConfig
  
  // 数据方法
  getSelectedAssets(): Asset[]
  setSelectedAssets(assets: Asset[]): void
  clearSelection(): void
  refresh(): Promise<void>
  
  // 事件方法
  on(event: string, handler: Function): void
  off(event: string, handler?: Function): void
  emit(event: string, ...args: any[]): void
}

export interface CreateAssetSelectorOptions {
  config?: Partial<AssetSelectorConfig>
  serviceConfig?: AssetServiceConfig
  container?: string | HTMLElement
  immediate?: boolean
}

// 主工厂函数
export function createAssetSelector(options: CreateAssetSelectorOptions = {}): AssetSelectorInstance {
  const {
    config = {},
    serviceConfig,
    container,
    immediate = false
  } = options

  // 合并配置
  const mergedConfig = ConfigManager.mergeConfigs(config)
  
  // 创建Vue实例
  let app: App | null = null
  let isOpen = false
  let selectedAssets: Asset[] = []
  const eventHandlers: Map<string, Function[]> = new Map()

  // 事件处理
  const on = (event: string, handler: Function) => {
    if (!eventHandlers.has(event)) {
      eventHandlers.set(event, [])
    }
    eventHandlers.get(event)?.push(handler)
  }

  const off = (event: string, handler?: Function) => {
    if (!eventHandlers.has(event)) return
    
    const handlers = eventHandlers.get(event)!
    if (handler) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    } else {
      handlers.length = 0
    }
  }

  const emit = (event: string, ...args: any[]) => {
    const handlers = eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args)
        } catch (error) {
          console.error(`Event handler error for ${event}:`, error)
        }
      })
    }
  }

  // 显示选择器
  const show = () => {
    if (isOpen) return

    // 创建挂载容器
    let mountElement: HTMLElement
    
    if (container) {
      if (typeof container === 'string') {
        mountElement = document.querySelector(container) as HTMLElement
        if (!mountElement) {
          throw new Error(`Container not found: ${container}`)
        }
      } else {
        mountElement = container
      }
    } else {
      // 创建默认容器
      mountElement = document.createElement('div')
      mountElement.id = `asset-selector-${Date.now()}`
      document.body.appendChild(mountElement)
    }

    // 创建Vue应用
    app = createApp({
      components: { AssetSelector },
      data() {
        return {
          open: true,
          selectedAssets: [...selectedAssets],
          config: mergedConfig,
          serviceConfig
        }
      },
      template: `
        <AssetSelector
          :open="open"
          :selectedAssets="selectedAssets"
          :config="config"
          :serviceConfig="serviceConfig"
          @confirm="handleConfirm"
          @cancel="handleCancel"
          @error="handleError"
          @selectionChange="handleSelectionChange"
        />
      `,
      methods: {
        handleConfirm(assets: Asset[]) {
          selectedAssets = [...assets]
          emit('confirm', assets)
          hide()
        },
        handleCancel() {
          emit('cancel')
          hide()
        },
        handleError(error: Error) {
          emit('error', error)
        },
        handleSelectionChange(assets: Asset[]) {
          selectedAssets = [...assets]
          emit('selectionChange', assets)
        }
      }
    })

    app.mount(mountElement)
    isOpen = true
    emit('show')
  }

  // 隐藏选择器
  const hide = () => {
    if (!isOpen || !app) return

    app.unmount()
    app = null
    
    // 清理默认容器
    if (!container) {
      const element = document.getElementById(`asset-selector-${Date.now()}`)
      if (element) {
        element.remove()
      }
    }
    
    isOpen = false
    emit('hide')
  }

  // 销毁实例
  const destroy = () => {
    hide()
    eventHandlers.clear()
    emit('destroy')
  }

  // 更新配置
  const updateConfig = (newConfig: Partial<AssetSelectorConfig>) => {
    Object.assign(mergedConfig, newConfig)
    emit('configUpdate', mergedConfig)
  }

  // 获取配置
  const getConfig = (): AssetSelectorConfig => {
    return { ...mergedConfig } as AssetSelectorConfig
  }

  // 获取选中资产
  const getSelectedAssets = (): Asset[] => {
    return [...selectedAssets]
  }

  // 设置选中资产
  const setSelectedAssets = (assets: Asset[]) => {
    selectedAssets = [...assets]
    emit('selectionChange', selectedAssets)
  }

  // 清空选择
  const clearSelection = () => {
    selectedAssets = []
    emit('selectionChange', selectedAssets)
  }

  // 刷新数据
  const refresh = async () => {
    emit('refresh')
    // TODO: 实现数据刷新逻辑
  }

  // 如果设置了立即显示，则显示选择器
  if (immediate) {
    show()
  }

  return {
    show,
    hide,
    destroy,
    updateConfig,
    getConfig,
    getSelectedAssets,
    setSelectedAssets,
    clearSelection,
    refresh,
    on,
    off,
    emit
  }
}

// 预设工厂函数
export const AssetSelectorFactory = {
  // 创建简单选择器
  createSimple(options: Omit<CreateAssetSelectorOptions, 'config'> & { config?: Partial<AssetSelectorConfig> } = {}) {
    const simpleConfig = AssetSelectorConfigBuilder.create().simple().build()
    return createAssetSelector({
      ...options,
      config: { ...simpleConfig, ...options.config }
    })
  },

  // 创建高级选择器
  createAdvanced(options: Omit<CreateAssetSelectorOptions, 'config'> & { config?: Partial<AssetSelectorConfig> } = {}) {
    const advancedConfig = AssetSelectorConfigBuilder.create().advanced().build()
    return createAssetSelector({
      ...options,
      config: { ...advancedConfig, ...options.config }
    })
  },

  // 创建移动端选择器
  createMobile(options: Omit<CreateAssetSelectorOptions, 'config'> & { config?: Partial<AssetSelectorConfig> } = {}) {
    const mobileConfig = AssetSelectorConfigBuilder.create().mobile().build()
    return createAssetSelector({
      ...options,
      config: { ...mobileConfig, ...options.config }
    })
  },

  // 创建CMDB选择器
  createCMDB(baseUrl: string, options: Omit<CreateAssetSelectorOptions, 'config' | 'serviceConfig'> & { config?: Partial<AssetSelectorConfig> } = {}) {
    const cmdbConfig = AssetSelectorConfigBuilder.create().cmdb().build()
    const serviceConfig: AssetServiceConfig = {
      mode: 'cmdb',
      endpoints: {
        getAssetTypes: `${baseUrl}/api/cmdb/v1/ci-types`,
        getAssets: `${baseUrl}/api/cmdb/v1/cis`,
        getAssetDetail: `${baseUrl}/api/cmdb/v1/cis/:id/detail`
      }
    }
    
    return createAssetSelector({
      ...options,
      config: { ...cmdbConfig, ...options.config },
      serviceConfig
    })
  },

  // 创建紧凑选择器
  createCompact(options: Omit<CreateAssetSelectorOptions, 'config'> & { config?: Partial<AssetSelectorConfig> } = {}) {
    const compactConfig = AssetSelectorConfigBuilder.create().compact().build()
    return createAssetSelector({
      ...options,
      config: { ...compactConfig, ...options.config }
    })
  }
}

// Vue插件
export const AssetSelectorPlugin: Plugin = {
  install(app: App, options: CreateAssetSelectorOptions = {}) {
    // 注册全局组件
    app.component('AssetSelector', AssetSelector)
    
    // 提供全局方法
    app.config.globalProperties.$createAssetSelector = createAssetSelector
    app.config.globalProperties.$AssetSelectorFactory = AssetSelectorFactory
    
    // 提供依赖注入
    app.provide('assetSelectorOptions', options)
    
    // 如果有全局配置，设置到ConfigManager
    if (options.config) {
      ConfigManager.setGlobalConfig(options.config)
    }
    
    if (options.serviceConfig) {
      ConfigManager.setServiceConfig(options.serviceConfig)
    }
  }
}

// 默认导出
export default createAssetSelector

// 便捷的全局安装函数
export function install(app: App, options: CreateAssetSelectorOptions = {}) {
  app.use(AssetSelectorPlugin, options)
}