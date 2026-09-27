# 极物聊天

一个基于 Nuxt 3 和 Electron 的即时通讯软件，同时支持 Web 端和桌面端。

## 说明

这个仓库目前只包含前端代码（Web 端 + 桌面端），后端服务暂未开放。

## 下载

最新版本 v1.0.0 已经发布，Windows 安装包在 [GitHub Release](https://github.com/return-Liu/JiWuChat/releases/tag/v1.0.0) 里：

- JiwuChat_1.0.0_x64-setup.exe（64 位系统，推荐）
- JiwuChat_1.0.0_ia32-setup.exe（32 位系统）
- JiwuChat_1.0.0-setup.exe（默认安装器）

## 开发

代码在 `JiWu-chat-app` 目录下，详细的安装、开发、构建说明见 [JiWu-chat-app/README.md](JiWu-chat-app/README.md)。

```bash
cd JiWu-chat-app

# 安装依赖
pnpm install

# Web 端开发
pnpm dev

# 桌面端开发
pnpm electron:dev:full
```

## 许可证

Copyright © 2026 JiWu
