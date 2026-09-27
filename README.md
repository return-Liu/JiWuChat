# 极物聊天 JiWu Chat

> 基于 Nuxt 3 + Electron 的即时通讯聊天软件，同时支持 **Web 端** 与 **桌面端**

极物聊天（JiWu Chat）是一款现代化的即时通讯应用，采用 Nuxt 3 构建前端界面，一套代码同时支持两种运行形态：

- 🌐 **Web 端**：基于 Nuxt 3 的响应式 Web 应用，可通过浏览器直接访问
- 🖥️ **桌面端**：通过 Electron 打包为跨平台（Windows / macOS / Linux）桌面客户端

应用支持中英文双语国际化，提供完整的即时通讯能力。

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

| 类别     | 技术                                              |
| -------- | ------------------------------------------------- |
| 前端框架 | [Nuxt 3](https://nuxt.com/) / Vue 3               |
| 桌面端   | [Electron](https://www.electronjs.org/)           |
| 状态管理 | [Pinia](https://pinia.vuejs.org/)（含持久化插件） |
| UI 组件  | [Ant Design Vue](https://antdv.com/)              |
| 国际化   | [@nuxtjs/i18n](https://i18n.nuxtjs.org/)          |
| 实时通信 | Socket.IO Client、PeerJS、Simple-Peer             |
| 样式     | SCSS                                              |
| 测试     | [Vitest](https://vitest.dev/)                     |
| 构建     | electron-builder                                  |

## 📁 项目结构

```
.
├── JiWu-chat-app/     # 前端 + 桌面端（Nuxt 3 + Electron）
│   └── README.md      # 详细说明文档
└── .gitignore
```

## 🚀 快速开始

前端项目位于 `JiWu-chat-app/` 目录，详细的安装、开发、构建与打包说明请参阅：

👉 **[JiWu-chat-app/README.md](JiWu-chat-app/README.md)**

快速预览：

```bash
cd JiWu-chat-app

# 安装依赖
pnpm install

# Web 端开发模式
pnpm dev

# Electron 桌面端开发模式
pnpm electron:dev:full
```

## 📄 许可证

Copyright © 2026 JiWu
