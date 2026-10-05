// 事件系统
// 提供简单但强大的事件管理和通信机制

import type { Asset, AssetSelectorConfig } from '../types'

export interface EventPayload {
  timestamp: number
  source: string
  data?: any
}

export interface AssetSelectorEvents {
  // 生命周期事件
  'selector:created': { config: AssetSelectorConfig }
  'selector:destroyed': { reason?: string }
  'selector:show': {}
  'selector:hide': {}
  
  // 数据事件
  'data:loading': { type: 'assets' | 'types' }
  'data:loaded': { type: 'assets' | 'types'; count: number }
  'data:error': { type: 'assets' | 'types'; error: Error }
  'data:refresh': {}
  
  // 选择事件
  'selection:change': { assets: Asset[]; action: 'add' | 'remove' | 'clear' }
  'selection:confirm': { assets: Asset[] }
  'selection:cancel': {}
  'selection:validate': { assets: Asset[]; valid: boolean }
  
  // 搜索事件
  'search:start': { keyword: string }
  'search:complete': { keyword: string; results: number }
  'search:clear': {}
  
  // 过滤事件
  'filter:change': { filters: Record<string, any> }
  'filter:clear': {}
  
  // 分页事件
  'pagination:change': { page: number; pageSize: number }
  
  // 配置事件
  'config:update': { config: Partial<AssetSelectorConfig> }
  
  // 错误事件
  'error:network': { error: Error; endpoint: string }
  'error:validation': { error: Error; context: string }
  'error:general': { error: Error }
  
  // 性能事件
  'performance:measure': { operation: string; duration: number }
  'performance:warning': { operation: string; duration: number; threshold: number }
}

export type EventName = keyof AssetSelectorEvents
export type EventHandler<T extends EventName> = (payload: AssetSelectorEvents[T] & EventPayload) => void

export class EventBus {
  private listeners: Map<string, Set<Function>> = new Map()
  private eventHistory: Array<{ event: string; payload: any; timestamp: number }> = []
  private maxHistorySize = 100
  private debugMode = false

  constructor(options: { debugMode?: boolean; maxHistorySize?: number } = {}) {
    this.debugMode = options.debugMode || false
    this.maxHistorySize = options.maxHistorySize || 100
  }

  // 注册事件监听器
  on<T extends EventName>(event: T, handler: EventHandler<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    this.listeners.get(event)!.add(handler)
    
    if (this.debugMode) {
      console.log(`[EventBus] Registered listener for event: ${event}`)
    }
  }

  // 注册一次性事件监听器
  once<T extends EventName>(event: T, handler: EventHandler<T>): void {
    const onceHandler = (payload: AssetSelectorEvents[T] & EventPayload) => {
      handler(payload)
      this.off(event, onceHandler as any)
    }
    
    this.on(event, onceHandler as EventHandler<T>)
  }

  // 移除事件监听器
  off<T extends EventName>(event: T, handler?: EventHandler<T>): void {
    const listeners = this.listeners.get(event)
    if (!listeners) return

    if (handler) {
      listeners.delete(handler)
      if (listeners.size === 0) {
        this.listeners.delete(event)
      }
    } else {
      this.listeners.delete(event)
    }

    if (this.debugMode) {
      console.log(`[EventBus] Removed listener(s) for event: ${event}`)
    }
  }

  // 触发事件
  emit<T extends EventName>(event: T, payload: AssetSelectorEvents[T], source = 'unknown'): void {
    const fullPayload = {
      ...payload,
      timestamp: Date.now(),
      source
    } as AssetSelectorEvents[T] & EventPayload

    // 记录事件历史
    this.addToHistory(event, fullPayload)

    // 触发监听器
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(handler => {
        try {
          ;(handler as Function)(fullPayload)
        } catch (error) {
          console.error(`[EventBus] Error in event handler for ${event}:`, error)
          
          // 触发错误事件
          if (event !== 'error:general') {
            this.emit('error:general', { error: error as Error }, 'EventBus')
          }
        }
      })
    }

    if (this.debugMode) {
      console.log(`[EventBus] Emitted event: ${event}`, fullPayload)
    }
  }

  // 添加到事件历史
  private addToHistory(event: string, payload: any): void {
    this.eventHistory.push({
      event,
      payload,
      timestamp: Date.now()
    })

    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift()
    }
  }

  // 获取事件历史
  getHistory(eventFilter?: string): Array<{ event: string; payload: any; timestamp: number }> {
    if (eventFilter) {
      return this.eventHistory.filter(record => record.event === eventFilter)
    }
    return [...this.eventHistory]
  }

  // 清空事件历史
  clearHistory(): void {
    this.eventHistory = []
  }

  // 获取当前监听器统计
  getListenerStats(): Record<string, number> {
    const stats: Record<string, number> = {}
    
    for (const [event, listeners] of this.listeners) {
      stats[event] = listeners.size
    }
    
    return stats
  }

  // 清空所有监听器
  clear(): void {
    this.listeners.clear()
    
    if (this.debugMode) {
      console.log('[EventBus] Cleared all listeners')
    }
  }

  // 启用/禁用调试模式
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }

  // 等待特定事件
  waitFor<T extends EventName>(event: T, timeout = 5000): Promise<AssetSelectorEvents[T] & EventPayload> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(event, handler)
        reject(new Error(`Timeout waiting for event: ${event}`))
      }, timeout)

      const handler: EventHandler<T> = (payload) => {
        clearTimeout(timer)
        this.off(event, handler)
        resolve(payload)
      }

      this.on(event, handler)
    })
  }

  // 批量触发事件
  emitBatch(events: Array<{ event: EventName; payload: any; source?: string }>): void {
    events.forEach(({ event, payload, source }) => {
      this.emit(event as any, payload, source)
    })
  }
}

// 创建全局事件总线实例
export const globalEventBus = new EventBus({ debugMode: false })

// 便捷的事件管理器
export class AssetSelectorEventManager {
  private eventBus: EventBus
  private selectorId: string

  constructor(selectorId: string, eventBus = globalEventBus) {
    this.selectorId = selectorId
    this.eventBus = eventBus
  }

  // 生命周期事件
  emitCreated(config: AssetSelectorConfig): void {
    this.eventBus.emit('selector:created', { config }, this.selectorId)
  }

  emitDestroyed(reason?: string): void {
    this.eventBus.emit('selector:destroyed', { reason }, this.selectorId)
  }

  emitShow(): void {
    this.eventBus.emit('selector:show', {}, this.selectorId)
  }

  emitHide(): void {
    this.eventBus.emit('selector:hide', {}, this.selectorId)
  }

  // 数据事件
  emitDataLoading(type: 'assets' | 'types'): void {
    this.eventBus.emit('data:loading', { type }, this.selectorId)
  }

  emitDataLoaded(type: 'assets' | 'types', count: number): void {
    this.eventBus.emit('data:loaded', { type, count }, this.selectorId)
  }

  emitDataError(type: 'assets' | 'types', error: Error): void {
    this.eventBus.emit('data:error', { type, error }, this.selectorId)
  }

  emitDataRefresh(): void {
    this.eventBus.emit('data:refresh', {}, this.selectorId)
  }

  // 选择事件
  emitSelectionChange(assets: Asset[], action: 'add' | 'remove' | 'clear'): void {
    this.eventBus.emit('selection:change', { assets, action }, this.selectorId)
  }

  emitSelectionConfirm(assets: Asset[]): void {
    this.eventBus.emit('selection:confirm', { assets }, this.selectorId)
  }

  emitSelectionCancel(): void {
    this.eventBus.emit('selection:cancel', {}, this.selectorId)
  }

  emitSelectionValidate(assets: Asset[], valid: boolean): void {
    this.eventBus.emit('selection:validate', { assets, valid }, this.selectorId)
  }

  // 搜索事件
  emitSearchStart(keyword: string): void {
    this.eventBus.emit('search:start', { keyword }, this.selectorId)
  }

  emitSearchComplete(keyword: string, results: number): void {
    this.eventBus.emit('search:complete', { keyword, results }, this.selectorId)
  }

  emitSearchClear(): void {
    this.eventBus.emit('search:clear', {}, this.selectorId)
  }

  // 过滤事件
  emitFilterChange(filters: Record<string, any>): void {
    this.eventBus.emit('filter:change', { filters }, this.selectorId)
  }

  emitFilterClear(): void {
    this.eventBus.emit('filter:clear', {}, this.selectorId)
  }

  // 分页事件
  emitPaginationChange(page: number, pageSize: number): void {
    this.eventBus.emit('pagination:change', { page, pageSize }, this.selectorId)
  }

  // 配置事件
  emitConfigUpdate(config: Partial<AssetSelectorConfig>): void {
    this.eventBus.emit('config:update', { config }, this.selectorId)
  }

  // 错误事件
  emitNetworkError(error: Error, endpoint: string): void {
    this.eventBus.emit('error:network', { error, endpoint }, this.selectorId)
  }

  emitValidationError(error: Error, context: string): void {
    this.eventBus.emit('error:validation', { error, context }, this.selectorId)
  }

  emitGeneralError(error: Error): void {
    this.eventBus.emit('error:general', { error }, this.selectorId)
  }

  // 性能事件
  emitPerformanceMeasure(operation: string, duration: number): void {
    this.eventBus.emit('performance:measure', { operation, duration }, this.selectorId)
  }

  emitPerformanceWarning(operation: string, duration: number, threshold: number): void {
    this.eventBus.emit('performance:warning', { operation, duration, threshold }, this.selectorId)
  }

  // 监听器注册
  on<T extends EventName>(event: T, handler: EventHandler<T>): void {
    this.eventBus.on(event, handler)
  }

  once<T extends EventName>(event: T, handler: EventHandler<T>): void {
    this.eventBus.once(event, handler)
  }

  off<T extends EventName>(event: T, handler?: EventHandler<T>): void {
    this.eventBus.off(event, handler)
  }

  // 等待事件
  waitFor<T extends EventName>(event: T, timeout?: number): Promise<AssetSelectorEvents[T] & EventPayload> {
    return this.eventBus.waitFor(event, timeout)
  }

  // 获取事件历史
  getHistory(eventFilter?: string): Array<{ event: string; payload: any; timestamp: number }> {
    return this.eventBus.getHistory(eventFilter)
  }

  // 清理资源
  destroy(): void {
    // 可以在这里添加特定于选择器的清理逻辑
    this.emitDestroyed('manager-destroyed')
  }
}

// 性能监控装饰器
export function measurePerformance(eventManager: AssetSelectorEventManager, operation: string, threshold = 1000) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now()
      
      try {
        const result = await originalMethod.apply(this, args)
        const duration = performance.now() - startTime
        
        eventManager.emitPerformanceMeasure(operation, duration)
        
        if (duration > threshold) {
          eventManager.emitPerformanceWarning(operation, duration, threshold)
        }
        
        return result
      } catch (error) {
        eventManager.emitGeneralError(error as Error)
        throw error
      }
    }

    return descriptor
  }
}

// 便捷函数
export function createEventManager(selectorId: string): AssetSelectorEventManager {
  return new AssetSelectorEventManager(selectorId)
}

// 默认导出
export default globalEventBus