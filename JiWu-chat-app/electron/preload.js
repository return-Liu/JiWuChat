const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,

  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },

  // 窗口控制方法
  minimizeWindow: () => ipcRenderer.send("minimize-window"),
  maximizeWindow: () => ipcRenderer.send("maximize-window"),
  closeWindow: () => ipcRenderer.send("close-window"),
  resizeWindow: (pageName) => ipcRenderer.send("resize-window", pageName),

  // 获取窗口状态
  getWindowState: () => ipcRenderer.invoke("get-window-state"),

  getWindowMaximizeState: () => ipcRenderer.invoke("get-window-maximize-state"),

  getAppVersion: () => ipcRenderer.invoke("get-app-version"),

  // 打开辅助窗口（main.js 已有预热池 + pendingWindows 防并发，preload 层不再缓存）
  // 传递完整路径（含子路径和 query），主进程负责用第一段作为窗口标识
  openAuxiliaryWindow: (pageName) => {
    return ipcRenderer.invoke("open-auxiliary-window", pageName);
  },

  // ===== 统一窗口管理器 API（windowManager.js）=====
  openWindow: (options) => ipcRenderer.invoke("app-open-window", options),
  focusWindow: (id) => ipcRenderer.invoke("app-focus-window", id),
  closeWindowById: (id) => ipcRenderer.invoke("app-close-window", id),
  hideWindowById: (id) => ipcRenderer.invoke("app-hide-window", id),
  restoreWindowById: (id) => ipcRenderer.invoke("app-restore-window", id),
  getWindowByRoute: (route, type) => ipcRenderer.invoke("app-get-window-by-route", route, type),
  setWindowSession: (id, session) => ipcRenderer.invoke("app-set-window-session", id, session),
  getWindowSession: (id) => ipcRenderer.invoke("app-get-window-session", id),
  getAllWindows: () => ipcRenderer.invoke("app-get-all-windows"),

  // 判断当前窗口是否为辅助窗口
  isAuxiliaryWindow: () => ipcRenderer.invoke("is-auxiliary-window"),

  // ===== UI 设置跨窗口同步（字体大小/字体族）=====
  // 广播字体设置到其它窗口（设置窗口修改后调用）
  broadcastUiSettings: (settings) => ipcRenderer.send("broadcast-ui-settings", settings),
  // 监听其它窗口广播的字体设置变化
  onUiSettingsChanged: (callback) => {
    const handler = (event, settings) => callback(settings);
    ipcRenderer.on("ui-settings-changed", handler);
    return () => {
      ipcRenderer.removeListener("ui-settings-changed", handler);
    };
  },

  // ===== 主题跨窗口同步（明暗模式/侧边栏颜色）=====
  // 广播主题设置变化到其它窗口（设置窗口修改后调用）
  broadcastThemeSettings: (settings) => ipcRenderer.send("broadcast-theme-settings", settings),
  // 监听其它窗口广播的主题设置变化
  onThemeSettingsChanged: (callback) => {
    const handler = (event, settings) => callback(settings);
    ipcRenderer.on("theme-settings-changed", handler);
    return () => {
      ipcRenderer.removeListener("theme-settings-changed", handler);
    };
  },

  // 监听窗口内 SPA 路由跳转指令（主进程通知导航，避免 loadURL 二次加载）
  onNavigate: (callback) => {
    const handler = (event, path) => callback(path);
    ipcRenderer.on("navigate", handler);
    return () => {
      ipcRenderer.removeListener("navigate", handler);
    };
  },

  // 监听辅助窗口关闭（仅主窗口使用）
  onAuxiliaryWindowClosed: (callback) => {
    const handler = (event, pageName) => callback(pageName);
    ipcRenderer.on("auxiliary-window-closed", handler);
    return () => {
      ipcRenderer.removeListener("auxiliary-window-closed", handler);
    };
  },

  // 监听窗口状态变化
  onWindowStateChange: (callback) => {
    const handler = (event, state) => callback(state);
    ipcRenderer.on("window-state-change", handler);
    return () => {
      ipcRenderer.removeListener("window-state-change", handler);
    };
  },

  onWindowMaximizeStateChange: (callback) => {
    const handler = (event, isMaximized) => callback(isMaximized);
    ipcRenderer.on("window-maximize-state-change", handler);
    return () => {
      ipcRenderer.removeListener("window-maximize-state-change", handler);
    };
  },

  // OAuth 第三方登录
  openOAuthWindow: (authUrl) => ipcRenderer.invoke("open-oauth-window", authUrl),

  // 监听 OAuth 回调
  onOAuthCallback: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on("oauth-callback", handler);
    return () => {
      ipcRenderer.removeListener("oauth-callback", handler);
    };
  },

  // 监听 OAuth 窗口关闭
  onOAuthWindowClosed: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("oauth-window-closed", handler);
    return () => {
      ipcRenderer.removeListener("oauth-window-closed", handler);
    };
  },

  // 打开 Web 体验窗口（固定宽高）
  openWebExperience: () => ipcRenderer.invoke("open-web-experience"),
});
