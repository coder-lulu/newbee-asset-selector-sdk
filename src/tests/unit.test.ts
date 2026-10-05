// Asset Selector SDK 单元测试
// 使用简单的断言进行基础功能测试

import { AssetSelectorConfigBuilder } from '../config/ConfigBuilder'
import { ConfigManager } from '../config/ConfigManager'
import { MockAssetService } from '../services/MockAssetService'
import { EventBus, AssetSelectorEventManager } from '../events/EventSystem'
import { MicroserviceIntegration } from '../integration/MicroserviceIntegration'

// 简单的断言函数
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`断言失败: ${message}`)
  }
}

function assertEquals(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`断言失败: ${message}. 期望: ${expected}, 实际: ${actual}`)
  }
}

function assertNotNull(value: any, message: string) {
  if (value == null) {
    throw new Error(`断言失败: ${message}. 值不应该为null或undefined`)
  }
}

// 测试结果收集器
interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration: number
}

class TestRunner {
  private results: TestResult[] = []

  async run(testName: string, testFn: () => Promise<void> | void) {
    const startTime = Date.now()
    try {
      await testFn()
      this.results.push({
        name: testName,
        passed: true,
        duration: Date.now() - startTime
      })
      console.log(`✅ ${testName}`)
    } catch (error) {
      this.results.push({
        name: testName,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      })
      console.error(`❌ ${testName}: ${error}`)
    }
  }

  getResults() {
    return this.results
  }

  getSummary() {
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)

    return {
      total: this.results.length,
      passed,
      failed,
      passRate: this.results.length > 0 ? (passed / this.results.length * 100).toFixed(2) : '0',
      totalDuration
    }
  }
}

// 主测试函数
export async function runTests() {
  const runner = new TestRunner()

  console.log('🚀 开始运行Asset Selector SDK单元测试...\n')

  // 1. 配置构建器测试
  await runner.run('配置构建器 - 基础功能', () => {
    const builder = AssetSelectorConfigBuilder.create()
    assertNotNull(builder, '构建器应该被创建')

    const config = builder
      .displayMode('table')
      .pageSize(20)
      .enableSearch(true)
      .multiSelect(false)
      .build()

    assertNotNull(config, '配置应该被构建')
    assertEquals(config.displayMode, 'table', '显示模式应该正确')
    assertEquals(config.pageSize, 20, '页面大小应该正确')
    assertEquals(config.enableSearch, true, '搜索应该启用')
    assertEquals(config.multiSelect, false, '多选应该禁用')
  })

  await runner.run('配置构建器 - 链式调用', () => {
    const config = AssetSelectorConfigBuilder
      .create('test-chain')
      .displayMode('card')
      .pageSize(12)
      .displayFields(['name', 'status'])
      .searchFields(['name'])
      .theme('dark')
      .build()

    assertEquals(config.displayMode, 'card', '链式调用应该正确设置显示模式')
    assertEquals(config.pageSize, 12, '链式调用应该正确设置页面大小')
    assert(config.displayFields.includes('name'), '显示字段应该包含name')
    assert(config.searchFields.includes('name'), '搜索字段应该包含name')
    assertEquals(config.theme, 'dark', '主题应该正确')
  })

  await runner.run('配置构建器 - 快捷配置', () => {
    const simpleConfig = AssetSelectorConfigBuilder.create().simple().build()
    assertEquals(simpleConfig.displayMode, 'card', '简单配置应该使用卡片模式')
    assertEquals(simpleConfig.multiSelect, false, '简单配置应该是单选')

    const advancedConfig = AssetSelectorConfigBuilder.create().advanced().build()
    assertEquals(advancedConfig.displayMode, 'table', '高级配置应该使用表格模式')
    assertEquals(advancedConfig.multiSelect, true, '高级配置应该是多选')
  })

  // 2. 配置管理器测试
  await runner.run('配置管理器 - 全局配置', () => {
    ConfigManager.setGlobalConfig({
      theme: 'test-theme',
      pageSize: 25
    })

    const globalConfig = ConfigManager.getGlobalConfig()
    assertEquals(globalConfig.theme, 'test-theme', '全局主题应该正确')
    assertEquals(globalConfig.pageSize, 25, '全局页面大小应该正确')
  })

  await runner.run('配置管理器 - 配置合并', () => {
    ConfigManager.setGlobalConfig({
      theme: 'global-theme',
      pageSize: 20,
      enableSearch: true
    })

    const merged = ConfigManager.mergeConfigs({
      pageSize: 30,
      enableFilter: true
    })

    assertEquals(merged.theme, 'global-theme', '应该保留全局主题')
    assertEquals(merged.pageSize, 30, '应该使用本地页面大小')
    assertEquals(merged.enableSearch, true, '应该保留全局搜索设置')
    assertEquals(merged.enableFilter, true, '应该使用本地过滤设置')
  })

  await runner.run('配置管理器 - 配置验证', () => {
    const validConfig = {
      displayMode: 'table' as const,
      pageSize: 20
    }
    const validation = ConfigManager.validateConfig(validConfig)
    assert(validation.valid, '有效配置应该通过验证')

    const invalidConfig = {
      displayMode: 'invalid' as any,
      pageSize: -1
    }
    const invalidValidation = ConfigManager.validateConfig(invalidConfig)
    assert(!invalidValidation.valid, '无效配置应该验证失败')
    assert(invalidValidation.errors.length > 0, '应该有错误信息')
  })

  // 3. Mock服务测试
  await runner.run('Mock服务 - 资产类型获取', async () => {
    const service = new MockAssetService({ mode: 'mock' })
    
    const types = await service.getAssetTypes()
    assert(Array.isArray(types), '应该返回数组')
    assert(types.length > 0, '应该有资产类型')
    
    const firstType = types[0]
    assertNotNull(firstType.id, '资产类型应该有ID')
    assertNotNull(firstType.name, '资产类型应该有名称')
    assertNotNull(firstType.code, '资产类型应该有代码')
  })

  await runner.run('Mock服务 - 资产查询', async () => {
    const service = new MockAssetService({ mode: 'mock' })
    
    const query = {
      page: 1,
      pageSize: 10,
      keyword: '',
      searchFields: ['name'],
      typeIds: [],
      filters: [],
      sortFields: [],
      includeRelationships: false,
      includeMetadata: true
    }

    const response = await service.getAssets(query)
    
    assertNotNull(response, '应该返回响应')
    assert(Array.isArray(response.items), '应该返回资产数组')
    assertEquals(response.items.length, 10, '应该返回请求数量的资产')
    assert(response.total > 0, '总数应该大于0')
    assertEquals(response.page, 1, '页码应该正确')
    assertEquals(response.pageSize, 10, '页面大小应该正确')
  })

  await runner.run('Mock服务 - 搜索功能', async () => {
    const service = new MockAssetService({ mode: 'mock' })
    
    const query = {
      page: 1,
      pageSize: 20,
      keyword: 'server',
      searchFields: ['name', 'hostname'],
      typeIds: [],
      filters: [],
      sortFields: [],
      includeRelationships: false,
      includeMetadata: true
    }

    const response = await service.getAssets(query)
    
    // 检查是否有搜索结果
    assert(response.items.length > 0, '搜索应该返回结果')
    
    // 检查结果是否包含搜索关键词
    const hasKeyword = response.items.some(asset => 
      asset.name.toLowerCase().includes('server') || 
      asset.hostname?.toLowerCase().includes('server')
    )
    assert(hasKeyword, '搜索结果应该包含关键词')
  })

  // 4. 事件系统测试
  await runner.run('事件系统 - 基础功能', () => {
    const eventBus = new EventBus()
    let eventReceived = false
    let receivedData: any = null

    eventBus.on('test:event', (data) => {
      eventReceived = true
      receivedData = data
    })

    eventBus.emit('test:event', { message: 'hello' })

    assert(eventReceived, '事件应该被接收')
    assertEquals(receivedData.message, 'hello', '事件数据应该正确')
  })

  await runner.run('事件系统 - 一次性监听', () => {
    const eventBus = new EventBus()
    let callCount = 0

    eventBus.once('test:once', () => {
      callCount++
    })

    eventBus.emit('test:once', {})
    eventBus.emit('test:once', {})

    assertEquals(callCount, 1, '一次性监听器应该只触发一次')
  })

  await runner.run('事件系统 - 监听器移除', () => {
    const eventBus = new EventBus()
    let callCount = 0

    const handler = () => {
      callCount++
    }

    eventBus.on('test:remove', handler)
    eventBus.emit('test:remove', {})
    eventBus.off('test:remove', handler)
    eventBus.emit('test:remove', {})

    assertEquals(callCount, 1, '移除监听器后不应该再触发')
  })

  await runner.run('事件管理器 - 选择器事件', () => {
    const eventManager = new AssetSelectorEventManager('test-selector')
    let selectionChangeCount = 0

    // 设置监听器
    eventManager.on('selection:change', () => {
      selectionChangeCount++
    })

    // 触发事件
    eventManager.emitSelectionChange([{ id: '1', name: 'Test Asset' }], 'add')

    assertEquals(selectionChangeCount, 1, '选择变更事件应该被触发')
  })

  // 5. 微服务集成测试
  await runner.run('微服务集成 - CMDB配置', () => {
    const integration = MicroserviceIntegration.cmdb({
      serviceName: 'cmdb',
      gateway: 'https://api.example.com',
      tenantMode: true,
      enableValidation: true
    })

    assertNotNull(integration.config, '应该生成配置')
    assertNotNull(integration.serviceConfig, '应该生成服务配置')
    assertEquals(integration.serviceConfig.mode, 'cmdb', '服务模式应该正确')
    assert(integration.config.requirePermission, '应该要求权限')
    assert(integration.config.metadata.enableValidation, '应该启用验证')
  })

  await runner.run('微服务集成 - 通用集成', () => {
    const integration = MicroserviceIntegration.generic({
      serviceName: 'inventory',
      gateway: 'https://api.example.com',
      endpoints: {
        getAssets: '/api/inventory/assets',
        getAssetTypes: '/api/inventory/types'
      }
    })

    assertEquals(integration.serviceConfig.mode, 'generic', '通用模式应该正确')
    assertNotNull(integration.serviceConfig.endpoints, '端点应该被设置')
    assert(integration.serviceConfig.endpoints.getAssets.includes('/api/inventory/assets'), '资产端点应该正确')
  })

  await runner.run('微服务集成 - 多服务创建', () => {
    const configs = [
      {
        type: 'cmdb' as const,
        options: {
          serviceName: 'cmdb',
          gateway: 'https://api.example.com'
        }
      },
      {
        type: 'generic' as const,
        options: {
          serviceName: 'monitoring',
          gateway: 'https://api.example.com',
          endpoints: {
            getAssets: '/assets',
            getAssetTypes: '/types'
          }
        }
      }
    ]

    const selectors = MicroserviceIntegration.createMultiple(configs)
    
    assert(Object.keys(selectors).length === 2, '应该创建两个选择器')
    assert('cmdb_cmdb' in selectors, '应该有CMDB选择器')
    assert('generic_monitoring' in selectors, '应该有监控选择器')
  })

  // 6. 工具函数测试
  await runner.run('配置序列化', () => {
    const testConfig = {
      theme: 'test',
      pageSize: 20
    }

    ConfigManager.setGlobalConfig(testConfig)
    const serialized = ConfigManager.serialize()
    
    assert(typeof serialized === 'string', '序列化结果应该是字符串')
    assert(serialized.includes('test'), '序列化应该包含配置内容')

    ConfigManager.reset()
    const deserialized = ConfigManager.deserialize(serialized)
    
    assert(deserialized, '反序列化应该成功')
  })

  // 运行总结
  console.log('\n📊 测试结果总结:')
  const summary = runner.getSummary()
  console.log(`总测试数: ${summary.total}`)
  console.log(`通过: ${summary.passed}`)
  console.log(`失败: ${summary.failed}`)
  console.log(`通过率: ${summary.passRate}%`)
  console.log(`总耗时: ${summary.totalDuration}ms`)

  if (summary.failed > 0) {
    console.log('\n❌ 失败的测试:')
    runner.getResults()
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`)
      })
  }

  return runner.getResults()
}

// 如果在Node.js环境中直接运行
if (typeof process !== 'undefined' && process.argv) {
  runTests().catch(console.error)
}