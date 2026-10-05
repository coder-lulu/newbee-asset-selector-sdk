# 新蜂资产管理平台 — 资产选择器 SDK

用于在平台前端和其他 Vue 应用中复用资产选择界面、查询配置、服务适配与事件处理。包名为 `@newbee/asset-selector-sdk`，对外 API 以 `src/index.ts` 的导出为准。

仓库：[coder-lulu/newbee-asset-selector-sdk](https://github.com/coder-lulu/newbee-asset-selector-sdk) · [平台工作区](https://github.com/coder-lulu/newbee)

## 获取与开发

建议随完整平台工作区获取，便于和 CMDB、前端联调：

```bash
git clone --recurse-submodules https://github.com/coder-lulu/newbee.git
cd newbee/packages/asset-selector-sdk
npm ci
npm run dev
```

建议使用 Node.js 20 或更高版本及 npm。宿主应用需提供 Vue `^3.3.0` 和 Ant Design Vue `^4.0.0`。`npm run dev` 启动 `example/` 示例；真实后端地址和认证信息应由宿主应用配置，勿把凭据写入组件源码。

## 目录导航

| 路径 | 用途 |
| --- | --- |
| `src/components/` | Vue 资产选择组件 |
| `src/composables/` | 组合式 API |
| `src/services/` | 服务抽象与数据适配 |
| `src/config/`、`src/integration/` | 配置构建与业务集成 |
| `src/index.ts` | 公开导出 |
| `example/` | 本地示例 |
| `rollup.config.js` | SDK 打包配置 |

## 构建与接入

```bash
npm run type-check
npm run build
npm pack
```

构建输出位于 `dist/`，包含 CommonJS、ES Module 和类型声明入口，具体文件名见 [package.json](package.json)。通过 `npm pack` 生成本地包后，可在宿主项目执行 `npm install /path/to/package.tgz` 验证。此流程不依赖已经发布到 npm 的版本。

常用导出包括 `AssetSelector`、`useAssetSelector`、`createAssetSelector` 和 `AssetSelectorConfigBuilder`；完整类型与选项见 [公开入口](src/index.ts)。按 [示例目录](example/) 配置服务与回调，并与实际 CMDB 接口校验请求、分页和权限字段。

## 验证与资料

```bash
npm run lint
npm run test -- --run
```

以上是检查命令，不表示当前类型检查、打包和测试已全部通过。交互验证可参考 [基础测试页](test-basic.html)、[Vue 集成页](test-vue-integration.html) 和 [实现说明](IMPLEMENTATION_SUMMARY.md)。

## 许可证与来源

本仓库采用 [MIT](LICENSE)。第三方依赖遵循各自许可证，保留原有版权与许可声明。
