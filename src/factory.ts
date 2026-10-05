// 资产选择器工厂函数
// 提供便捷的创建和配置方法

import { h, createApp, type App, type VNode } from 'vue'
// TODO: 等组件实现后启用
// import AssetSelector from './components/AssetSelector.vue'
import type { 
  AssetSelectorConfig, 
  AssetServiceConfig, 
  SelectorPlugin,
  AssetSelectorProps,
  Asset,
  CreateAssetSelectorOptions,
  AssetSelectorInstance
} from './types'
// TODO: 等插件系统实现后启用
// import { PluginManager } from './plugins/PluginManager'
import { ConfigManager } from './config/ConfigManager'
// TODO: 等服务层实现后启用
// import { AssetService } from './services/AssetService'

// 接口定义已移至 types.ts，避免重复定义

/**
 * 创建资产选择器实例（模拟实现，等组件完成后替换）
 */
export function createAssetSelector(options: CreateAssetSelectorOptions = {}): AssetSelectorInstance {
  const {
    config = {},
    serviceConfig,
    props = {},
    plugins = [],
    container,
    onConfirm,
    onCancel,
    onError
  } = options
  
  console.warn('createAssetSelector: 使用模拟实现，等AssetSelector组件完成后将提供完整功能')
  
  // 模拟的Vue应用实例
  const mockApp = {
    mount: () => console.log('Mock app mounted'),
    unmount: () => console.log('Mock app unmounted')
  }
  
  // 模拟挂载容器
  let mountedElement: HTMLElement | null = null
  
  if (container) {
    const containerElement = typeof container === 'string' 
      ? document.querySelector(container) as HTMLElement
      : container
    
    if (containerElement) {
      mountedElement = containerElement
      console.log('Mock mount to container:', containerElement)
    }
  }
  
  return {
    app: mockApp,
    
    show() {
      console.log('AssetSelector.show() called')
      if (mountedElement) {
        mountedElement.style.display = 'block'
      }
    },
    
    hide() {
      console.log('AssetSelector.hide() called')
      if (mountedElement) {
        mountedElement.style.display = 'none'
      }
    },
    
    destroy() {
      console.log('AssetSelector.destroy() called')
      mockApp.unmount()
      if (mountedElement && mountedElement.parentNode) {
        mountedElement.parentNode.removeChild(mountedElement)
      }
    },
    
    updateConfig(newConfig: Partial<AssetSelectorConfig>) {
      console.log('AssetSelector.updateConfig() called with:', newConfig)
      Object.assign(config, newConfig)
    },
    
    updateServiceConfig(newServiceConfig: Partial<AssetServiceConfig>) {
      console.log('AssetSelector.updateServiceConfig() called with:', newServiceConfig)
      if (serviceConfig) {
        Object.assign(serviceConfig, newServiceConfig)
      }
    },
    
    addPlugin(plugin: SelectorPlugin) {
      console.log('AssetSelector.addPlugin() called with:', plugin.name)
      // TODO: 等PluginManager实现后启用
      // pluginManager.registerPlugin(plugin)
    },
    
    removePlugin(name: string) {
      console.log('AssetSelector.removePlugin() called with:', name)
      // TODO: 等PluginManager实现后启用
      // pluginManager.unregisterPlugin(name)
    },
    
    getSelectedAssets(): Asset[] {
      console.log('AssetSelector.getSelectedAssets() called')
      // 返回模拟数据
      return []
    },
    
    isVisible(): boolean {
      return mountedElement ? mountedElement.style.display !== 'none' : false
    }
  }
}

/**
 * 创建模态框形式的资产选择器
 */
export function createModalAssetSelector(options: CreateAssetSelectorOptions & {
  title?: string
  width?: number | string
  destroyOnClose?: boolean
}): Promise<Asset[]> {
  return new Promise((resolve, reject) => {
    const {
      title = '选择资产',
      width = 1200,
      destroyOnClose = true,
      ...restOptions
    } = options
    
    // 创建容器
    const container = document.createElement('div')
    document.body.appendChild(container)
    
    const instance = createAssetSelector({
      ...restOptions,
      container,
      props: {
        ...restOptions.props,
        open: true,
        title,
        width
      },
      onConfirm: (assets: Asset[]) => {
        resolve(assets)
        if (destroyOnClose) {
          setTimeout(() => instance.destroy(), 300)
        }
      },
      onCancel: () => {
        reject(new Error('用户取消选择'))
        if (destroyOnClose) {
          setTimeout(() => instance.destroy(), 300)
        }
      },
      onError: (error: Error) => {
        reject(error)
        if (destroyOnClose) {
          setTimeout(() => instance.destroy(), 300)
        }
      }
    })
  })
}

/**
 * 快速选择单个资产
 */
export function selectSingleAsset(options: Omit<CreateAssetSelectorOptions, 'props'> & {
  title?: string
  allowedTypes?: string[]
}): Promise<Asset> {
  return createModalAssetSelector({
    ...options,
    props: {
      multiple: false,
      allowedTypes: options.allowedTypes
    },
    title: options.title || '选择一个资产'
  }).then(assets => {
    if (assets.length === 0) {
      throw new Error('没有选择任何资产')
    }
    return assets[0]
  })
}

/**
 * 快速选择多个资产
 */
export function selectMultipleAssets(options: Omit<CreateAssetSelectorOptions, 'props'> & {
  title?: string
  allowedTypes?: string[]
  maxSelection?: number
  minSelection?: number
}): Promise<Asset[]> {
  return createModalAssetSelector({
    ...options,
    props: {
      multiple: true,
      allowedTypes: options.allowedTypes,
      maxSelection: options.maxSelection,
      minSelection: options.minSelection
    },
    title: options.title || '选择资产'
  })
}

/**
 * 注册全局插件（模拟实现）
 */
export function registerGlobalPlugins(plugins: SelectorPlugin[]) {
  console.log('registerGlobalPlugins called with:', plugins.map(p => p.name))
  // TODO: 等PluginManager实现后启用
  // const pluginManager = PluginManager.getInstance()
  // plugins.forEach(plugin => {
  //   pluginManager.registerPlugin(plugin)
  // })
}

/**
 * 设置全局配置
 */
export function setGlobalConfig(config: Partial<AssetSelectorConfig>) {
  ConfigManager.setGlobalConfig(config)
}

/**
 * 设置全局服务配置
 */
export function setGlobalServiceConfig(config: AssetServiceConfig) {
  ConfigManager.setServiceConfig(config)
}

/**
 * 预设配置工厂
 */
export const ConfigPresets = {
  // CMDB配置
  cmdb: (baseUrl: string = ''): CreateAssetSelectorOptions => ({
    config: {
      displayMode: 'table',
      enableFilter: true,
      showTypeFilter: true,
      displayFields: ['name', 'ip', 'hostname', 'status'],
      searchFields: ['name', 'ip', 'hostname'],
      requirePermission: true
    },
    serviceConfig: {
      mode: 'cmdb',
      endpoints: {
        getAssetTypes: `${baseUrl}/api/cmdb/v1/ci-types`,
        getAssets: `${baseUrl}/api/cmdb/v1/cis`,
        getAssetDetail: `${baseUrl}/api/cmdb/v1/cis/:id/detail`,
        getSearchSuggestions: `${baseUrl}/api/cmdb/v1/cis/suggestions`,
        validateAssetSelection: `${baseUrl}/api/cmdb/v1/cis/validate`
      },
      authentication: {
        type: 'jwt',
        config: {}
      }
    },
    plugins: []
  }),
  
  // 简单模式配置
  simple: (): CreateAssetSelectorOptions => ({
    config: {
      displayMode: 'card',
      enableFilter: false,
      showTypeFilter: false,
      displayFields: ['name', 'status'],
      searchFields: ['name'],
      multiSelect: false
    }
  }),
  
  // 移动端配置
  mobile: (): CreateAssetSelectorOptions => ({
    config: {
      displayMode: 'list',
      pageSize: 10,
      showTypeFilter: false,
      displayFields: ['name', 'status'],
      searchFields: ['name'],
      customStyles: {
        responsive: true,
        mobile: true
      }
    }
  }),
  
  // 开发模式配置（使用模拟数据）
  development: (): CreateAssetSelectorOptions => ({
    serviceConfig: {
      mode: 'mock'
    },
    config: {
      displayMode: 'table',
      enableFilter: true,
      showTypeFilter: true
    }
  })
}

/**
 * 服务适配器工厂
 */
export const ServiceAdapters = {
  // 创建HTTP适配器
  http: (baseUrl: string, options: Partial<AssetServiceConfig> = {}) => ({
    mode: 'http',
    endpoints: {
      getAssetTypes: `${baseUrl}/api/v1/assets/types`,
      getAssets: `${baseUrl}/api/v1/assets`,
      getAssetDetail: `${baseUrl}/api/v1/assets/:id`,
      getSearchSuggestions: `${baseUrl}/api/v1/assets/suggestions`,
      validateAssetSelection: `${baseUrl}/api/v1/assets/validate`
    },
    ...options
  }),
  
  // 创建GraphQL适配器
  graphql: (endpoint: string, options: Partial<AssetServiceConfig> = {}) => ({
    mode: 'graphql',
    endpoints: {
      graphql: endpoint
    },
    ...options
  }),
  
  // 创建WebSocket适配器
  websocket: (url: string, options: Partial<AssetServiceConfig> = {}) => ({
    mode: 'websocket',
    endpoints: {
      websocket: url
    },
    ...options
  })
}

/**
 * 主题工厂
 */
export const ThemeFactory = {
  // Ant Design主题
  antd: () => ({
    theme: 'antd',
    customStyles: {
      primaryColor: '#1890ff',
      borderRadius: '6px'
    }
  }),
  
  // Element Plus主题
  elementPlus: () => ({
    theme: 'element-plus',
    customStyles: {
      primaryColor: '#409eff',
      borderRadius: '4px'
    }
  }),
  
  // 自定义主题
  custom: (colors: Record<string, string>) => ({
    theme: 'custom',
    customStyles: {
      ...colors
    }
  })
}

/**
 * 集成辅助工具
 */
export const IntegrationUtils = {
  // 微服务集成配置
  microservice: (serviceName: string, config: {
    gateway?: string
    version?: string
    namespace?: string
  } = {}) => {
    const { gateway = '', version = 'v1', namespace = 'api' } = config
    const baseUrl = `${gateway}/${namespace}/${serviceName}/${version}`
    
    return {
      serviceConfig: ServiceAdapters.http(baseUrl),
      config: {
        metadata: {
          serviceName,
          version,
          namespace
        }
      }
    }
  },
  
  // Kubernetes集成配置
  kubernetes: (clusterUrl: string, namespace: string = 'default') => ({
    serviceConfig: {
      mode: 'kubernetes',
      endpoints: {
        getAssetTypes: `${clusterUrl}/api/v1/namespaces/${namespace}/configmaps/asset-types`,
        getAssets: `${clusterUrl}/api/v1/namespaces/${namespace}/pods`
      },
      authentication: {
        type: 'bearer',
        config: {
          tokenType: 'kubernetes'
        }
      }
    }
  }),
  
  // Docker集成配置
  docker: (dockerHost: string) => ({
    serviceConfig: {
      mode: 'docker',
      endpoints: {
        getAssets: `${dockerHost}/containers/json`
      }
    }
  })
}