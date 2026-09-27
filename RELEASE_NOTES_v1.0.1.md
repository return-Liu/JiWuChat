# 🔥 Release v1.0.1

[Latest](https://github.com/return-Liu/JiWuChat-Electron/releases/latest)

[v1.0.1](https://github.com/return-Liu/JiWuChat-Electron/tree/v1.0.1)

# 1.0.1 版本说明

本次更新聚焦**桌面端安装体验**与 **Windows 系统集成**：由一键静默安装改为向导式安装，支持自定义安装目录，修复安装完成后桌面不生成快捷方式的问题，并统一应用系统标识，改善任务栏、通知与跳转列表的关联表现。

## 🤯 更新说明

- **安装更可控**：由「一键静默安装」改为**向导式安装**，安装过程可视化，用户可逐步确认；支持**自定义安装目录**，不再强制安装到默认路径。
- **桌面快捷方式更可靠**：修复安装完成后桌面不生成快捷方式的问题；安装器提升为「所有用户」安装模式并支持请求管理员权限，确保快捷方式正确写入当前用户桌面，桌面与开始菜单均创建「极物聊天」快捷方式。
- **系统集成更规范**：修复 `AppUserModelId` 使用错误占位值的问题，统一为 `com.jiwu.chat`，使 Windows 端的任务栏图标分组、桌面通知、跳转列表（Jump List）能正确关联到应用。
- **发布链路更稳定**：补充 electron-builder 的 GitHub 发布配置，修复打包时 `Cannot read properties of null (reading 'channel')` 报错；更新前端 GitHub 仓库引用为 `JiWuChat-Electron`。

## ✨ 新功能与体验增强

- feat(nsis): 安装器由一键静默安装改为向导式安装，支持自定义安装目录与多语言界面
- feat(nsis): 开启「所有用户」安装模式与管理员权限请求，确保桌面及开始菜单快捷方式正确创建

## 🐛 修复了以下问题

- fix(win): 修复 `AppUserModelId` 为错误占位值 `com.yourcompany.yourapp` 的问题，统一为 `com.jiwu.chat`
- fix(build): 修复 electron-builder 因缺少 GitHub 发布配置导致的打包报错（`Cannot read properties of null (reading 'channel')`）

## 🔧 构建与发布优化

- chore(publish): 补充 GitHub 发布配置（`owner: return-Liu`，`repo: JiWuChat-Electron`）
- chore(repo): 更新前端 GitHub 仓库引用为 `JiWuChat-Electron`（更新日志、官网下载链接等）
- chore(clean): 清理旧版本（v2.1.4）打包残留目录

## 🧪 下载

各平台安装包见下表，实际可用资源以 Release 页面为准。

| 平台                       | 下载地址                                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Windows x64 安装程序       | [JiwuChat_1.0.1_x64-setup.exe](https://github.com/return-Liu/JiWuChat-Electron/releases/download/v1.0.1/JiwuChat_1.0.1_x64-setup.exe)   |
| Windows ia32 安装程序      | [JiwuChat_1.0.1_ia32-setup.exe](https://github.com/return-Liu/JiWuChat-Electron/releases/download/v1.0.1/JiwuChat_1.0.1_ia32-setup.exe) |
| Windows 通用（x64 + ia32） | [JiwuChat_1.0.1-setup.exe](https://github.com/return-Liu/JiWuChat-Electron/releases/download/v1.0.1/JiwuChat_1.0.1-setup.exe)           |

## 📌 后续计划

沿用既有版本的待办，以下内容不属于本次交付：

- 本地消息存储
- 用户版本埋点
- Android 通话悬浮窗（考虑）
