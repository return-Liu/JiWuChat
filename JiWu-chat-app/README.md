# 极物聊天 JiWu Chat

> 基于 Nuxt 3 + Electron 的即时通讯桌面聊天软件

极物聊天（JiWu Chat）是一款现代化的即时通讯桌面应用，采用 Nuxt 3 构建前端界面，通过 Electron 打包为跨平台桌面客户端，支持中英文双语国际化。

## ✨ 功能特性

- 💬 **即时通讯**：单聊、群聊、好友管理
- 📞 **音视频通话**：基于 WebRTC（PeerJS / Simple-Peer）的语音与视频通话
- 📁 **文件传输**：图片、文件、媒体预览与上传
- 😊 **表情与富文本**：Emoji 表情、Markdown 渲染、代码高亮
- 🌐 **国际化**：中英文双语切换（i18n）
- 🎨 **主题系统**：浅色 / 深色模式，支持自定义主题色
- 🔔 **消息通知**：全局通知、状态栏通知
- 👥 **群组管理**：创建群组、群成员管理、群等级
- 📋 **举报与反馈**：举报系统、意见反馈
- 🔐 **多种登录方式**：账号密码、QQ 登录、手机号绑定、设备管理

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | [Nuxt 3](https://nuxt.com/) / Vue 3 |
| 桌面端 | [Electron](https://www.electronjs.org/) |
| 状态管理 | [Pinia](https://pinia.vuejs.org/)（含持久化插件） |
| UI 组件 | [Ant Design Vue](https://antdv.com/) |
| 国际化 | [@nuxtjs/i18n](https://i18n.nuxtjs.org/) |
| 实时通信 | Socket.IO Client、PeerJS、Simple-Peer |
| 样式 | SCSS |
| 测试 | [Vitest](https://vitest.dev/) |
| 构建 | electron-builder |

## 📁 目录结构

```
JiWu-chat-app/
├── assets/          # 全局样式、字体、图标
├── build/           # 应用图标等构建资源
├── components/      # Vue 组件
├── composables/     # 组合式函数
├── config/          # 配置文件
├── constants/       # 常量定义
├── electron/        # Electron 主进程与预加载脚本
├── hooks/           # 自定义 Hooks
├── i18n/            # 国际化配置
├── layouts/         # 布局
├── locales/         # 语言包（zh / en）
├── middleware/      # 路由中间件
├── pages/           # 页面
├── plugins/         # 客户端插件
├── public/          # 静态资源
├── server/          # Nitro 服务端
├── stores/          # Pinia 状态
├── tests/           # 单元测试
├── types/           # TypeScript 类型定义
└── untils/          # 工具函数
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm（推荐）

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

复制环境变量示例文件并填写相应配置（`.env` 文件已通过 `.gitignore` 排除，不会提交到仓库）：

```bash
# 根据运行环境选择对应的 .env 文件
# .env.development / .env.production / .env.test
```

### 启动开发环境

Web 端开发模式：

```bash
pnpm dev
```

Electron 桌面端开发模式（同时启动 Nuxt 与 Electron）：

```bash
pnpm electron:dev:full
```

## 📦 构建与打包

```bash
# 构建 Nuxt 应用
pnpm build

# 生成静态站点
pnpm generate

# 打包 Electron 桌面应用
pnpm electron:build

# 生产环境打包
pnpm electron:build:prod
```

## 🧪 测试

```bash
# 运行单元测试
pnpm test

# 监听模式
pnpm test:watch

# 覆盖率报告
pnpm test:coverage
```

## 🔍 代码规范

```bash
# ESLint 检查与自动修复
pnpm lint

# Prettier 格式化
pnpm format
```

## 📄 许可证

Copyright © 2026 JiWu
