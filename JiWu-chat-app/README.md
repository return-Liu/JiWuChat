# 极物聊天

一个基于 Nuxt 3 和 Electron 的即时通讯软件，同时支持 Web 端和桌面端。

## 功能

- 单聊、群聊、好友管理
- 基于 WebRTC 的音视频通话和屏幕共享
- 图片、文件传输
- Emoji 表情、Markdown 消息渲染
- 中英文双语
- 浅色 / 深色主题
- 账号密码、QQ 登录

## 技术栈

- Nuxt 3 / Vue 3
- Electron
- Pinia
- Ant Design Vue
- Socket.IO、PeerJS
- SCSS

## 环境要求

- Node.js 18+
- pnpm

## 安装

```bash
pnpm install
```

## 开发

Web 端：

```bash
pnpm dev
```

桌面端（同时启动 Nuxt 和 Electron）：

```bash
pnpm electron:dev:full
```

## 构建

Web 端：

```bash
pnpm build
```

桌面端打包：

```bash
pnpm electron:build
```

打包出来的安装包在 `release` 目录下。

## 测试

```bash
pnpm test
```

## 许可证

Copyright © 2026 JiWu
