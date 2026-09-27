/**
 * Electron 环境检测工具
 */
export const isElectron = (): boolean => {
  return (
    typeof window !== "undefined" && typeof window.electronAPI !== "undefined"
  );
};

export const shouldUseMainWindow = (path: string): boolean => {
  // 主窗口页面：登录注册 + 消息/好友两个核心页面
  const mainWindowPaths = [
    '/message',
    '/friend',
    '/login',
    '/register',
    '/forgot-password',
  ];
  // 精确匹配或以这些路径开头（支持子路由如 /message/xxx）
  return mainWindowPaths.some(
    (p) => path === p || path.startsWith(p + '/')
  );
};

export const minimizeWindow = (): void => {
  if (isElectron() && window.electronAPI?.minimizeWindow) {
    window.electronAPI.minimizeWindow();
  }
};

export const maximizeWindow = (): void => {
  if (isElectron() && window.electronAPI?.maximizeWindow) {
    window.electronAPI.maximizeWindow();
  }
};

export const closeWindow = (): void => {
  if (isElectron() && window.electronAPI?.closeWindow) {
    window.electronAPI.closeWindow();
  }
};

export const resizeWindow = (pageName: string): void => {
  if (isElectron() && window.electronAPI?.resizeWindow) {
    window.electronAPI.resizeWindow(pageName);
  }
};

export const getPlatform = (): string => {
  if (isElectron() && window.electronAPI?.platform) {
    return window.electronAPI.platform;
  }
  return "web";
};

// ============= 统一窗口管理器封装 =============

export interface DesktopWindowOptions {
  route: string;
  type?: "main" | "auxiliary" | "modal" | "popup";
  title?: string;
  restoreTarget?: string;
  session?: Record<string, any>;
  width?: number;
  height?: number;
  modal?: boolean;
  frame?: boolean;
  parentId?: string;
}

export const openDesktopWindow = async (
  options: DesktopWindowOptions
): Promise<{ success: boolean; action?: string; id?: string; error?: string }> => {
  if (!isElectron() || !window.electronAPI?.openWindow) {
    return { success: false, error: "非 Electron 环境" };
  }
  try {
    return await window.electronAPI.openWindow(options);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "打开窗口失败",
    };
  }
};

export const focusWindowById = async (id: string) => {
  if (!isElectron() || !window.electronAPI?.focusWindow) return;
  return await window.electronAPI.focusWindow(id);
};

export const closeWindowById = async (id: string) => {
  if (!isElectron() || !window.electronAPI?.closeWindowById) return;
  return await window.electronAPI.closeWindowById(id);
};

export const restoreWindowById = async (id: string) => {
  if (!isElectron() || !window.electronAPI?.restoreWindowById) return;
  return await window.electronAPI.restoreWindowById(id);
};

export const setWindowSession = async (id: string, session: Record<string, any>) => {
  if (!isElectron() || !window.electronAPI?.setWindowSession) return;
  return await window.electronAPI.setWindowSession(id, session);
};

export const getWindowSession = async (id: string): Promise<Record<string, any>> => {
  if (!isElectron() || !window.electronAPI?.getWindowSession) return {};
  return await window.electronAPI.getWindowSession(id);
};

export const openExternalLink = (url: string): void => {
  if (isElectron()) {
    const { shell } = require("electron");
    if (shell && shell.openExternal) {
      shell.openExternal(url);
      return;
    }
  }
  window.location.href = url;
};

// 优化：添加加载状态管理
const loadingStates = new Map<string, boolean>();
// 防抖时间窗口（ms）
const DEBOUNCE_DELAY = 300;
// 最后点击时间记录
const lastClickTimestamps = new Map<string, number>();
// 窗口打开结果缓存（用于快速重复调用）
const resultCache = new Map<string, { result: any; timestamp: number }>();
const RESULT_CACHE_TTL = 2000; // 结果缓存 2 秒

export const openAuxiliaryWindow = async (pageName: string): Promise<{
  success: boolean;
  action: "created" | "focused";
  error?: string;
}> => {
  // 完整路径（含子路径和 query），用于加载正确路由
  const fullPath = pageName.startsWith("/") ? pageName : `/${pageName}`;
  // 窗口标识：仅用第一段路径（去掉 query），用于窗口去重/聚焦/预热池
  const normalizedName = fullPath.replace(/^\//, "").split("?")[0].split("/")[0];

  // 检查结果缓存（短时间内重复调用直接返回上次结果）
  const cached = resultCache.get(fullPath);
  if (cached && Date.now() - cached.timestamp < RESULT_CACHE_TTL) {
    return cached.result;
  }

  // 防抖：防止快速双击
  const now = Date.now();
  const lastClick = lastClickTimestamps.get(normalizedName) || 0;
  if (now - lastClick < DEBOUNCE_DELAY) {
    console.warn(`窗口 ${normalizedName} 操作过于频繁，已忽略`);
    return { success: false, action: "created", error: "操作过于频繁" };
  }
  lastClickTimestamps.set(normalizedName, now);

  // 防止重复点击（同一窗口正在创建中）
  if (loadingStates.get(normalizedName)) {
    console.warn(`窗口 ${normalizedName} 正在打开中，请勿重复点击`);
    return { success: false, action: "created", error: "正在打开中" };
  }

  if (!isElectron() || !window.electronAPI?.openAuxiliaryWindow) {
    return { success: false, action: "created", error: "非 Electron 环境" };
  }

  try {
    loadingStates.set(normalizedName, true);
    const result = await window.electronAPI.openAuxiliaryWindow(fullPath);

    // 缓存成功结果
    if (result.success) {
      resultCache.set(fullPath, {
        result,
        timestamp: Date.now(),
      });
    }

    return result;
  } catch (error) {
    console.error(`打开辅助窗口失败: ${normalizedName}`, error);
    return { success: false, action: "created", error: (error as Error).message };
  } finally {
    // 立即清除加载状态（主进程已有 pendingWindows 防并发）
    loadingStates.delete(normalizedName);
  }
};

export const getAppVersion = async (): Promise<string> => {
  if (isElectron() && window.electronAPI?.getAppVersion) {
    try {
      return await window.electronAPI.getAppVersion();
    } catch (error) {
      console.error("获取应用版本号失败:", error);
      return "1.0.0";
    }
  }
  return "1.0.0";
};

export const getWindowMaximizeState = async (): Promise<boolean> => {
  if (isElectron() && window.electronAPI?.getWindowMaximizeState) {
    try {
      return await window.electronAPI.getWindowMaximizeState();
    } catch (error) {
      console.error("获取窗口最大化状态失败:", error);
      return false;
    }
  }
  return false;
};

export const onWindowMaximizeStateChange = (callback: (isMaximized: boolean) => void): void => {
  if (isElectron() && window.electronAPI?.onWindowMaximizeStateChange) {
    window.electronAPI.onWindowMaximizeStateChange(callback);
  }
};

// ============= 辅助窗口相关 =============

/**
 * 判断当前窗口是否为辅助窗口（独立窗口）
 */
export const isAuxiliaryWindow = async (): Promise<boolean> => {
  if (isElectron() && window.electronAPI?.isAuxiliaryWindow) {
    try {
      return await window.electronAPI.isAuxiliaryWindow();
    } catch (error) {
      console.error("判断辅助窗口失败:", error);
      return false;
    }
  }
  return false;
};

/**
 * 监听辅助窗口关闭事件（仅主窗口需要）
 * @param callback 回调函数，参数为被关闭的窗口页面名称
 * @returns 取消监听的函数
 */
export const onAuxiliaryWindowClosed = (
  callback: (pageName: string) => void
): (() => void) | void => {
  if (isElectron() && window.electronAPI?.onAuxiliaryWindowClosed) {
    return window.electronAPI.onAuxiliaryWindowClosed(callback);
  }
};

// ============= UI 设置跨窗口同步（字体大小/字体族）=============

/**
 * 广播字体设置到其它窗口（设置窗口修改后调用）
 * @param settings 字体设置对象 { fontSize, fontFamily }
 */
export const broadcastUiSettings = (settings: Record<string, any>): void => {
  if (isElectron() && window.electronAPI?.broadcastUiSettings) {
    window.electronAPI.broadcastUiSettings(settings);
  }
};

/**
 * 监听其它窗口广播的字体设置变化（主窗口监听，收到后重新 applyToCSS）
 * @param callback 回调函数，参数为字体设置对象
 * @returns 取消监听的函数
 */
export const onUiSettingsChanged = (
  callback: (settings: Record<string, any>) => void
): (() => void) | void => {
  if (isElectron() && window.electronAPI?.onUiSettingsChanged) {
    return window.electronAPI.onUiSettingsChanged(callback);
  }
};

// ============= 主题跨窗口同步（明暗模式/侧边栏颜色）=============

/**
 * 广播主题设置变化到其它窗口（设置窗口修改主题后调用）
 * @param settings 主题设置对象 { type: 'mode' | 'color', mode? }
 */
export const broadcastThemeSettings = (settings: Record<string, any>): void => {
  if (isElectron() && window.electronAPI?.broadcastThemeSettings) {
    window.electronAPI.broadcastThemeSettings(settings);
  }
};

/**
 * 监听其它窗口广播的主题设置变化（主窗口监听，收到后立即应用主题）
 * @param callback 回调函数，参数为主题设置对象
 * @returns 取消监听的函数
 */
export const onThemeSettingsChanged = (
  callback: (settings: Record<string, any>) => void
): (() => void) | void => {
  if (isElectron() && window.electronAPI?.onThemeSettingsChanged) {
    return window.electronAPI.onThemeSettingsChanged(callback);
  }
};

// ============= OAuth 第三方登录 =============

/**
 * 在桌面端打开 OAuth 授权窗口
 * @param authUrl 第三方授权 URL
 */
export const openOAuthWindow = async (authUrl: string): Promise<{ success: boolean; error?: string }> => {
  if (!isElectron() || !window.electronAPI?.openOAuthWindow) {
    return { success: false, error: "非 Electron 环境" };
  }

  try {
    const result = await window.electronAPI.openOAuthWindow(authUrl);
    return result;
  } catch (error) {
    console.error("打开 OAuth 窗口失败:", error);
    return { success: false, error: (error as Error).message };
  }
};

/**
 * 监听 OAuth 回调结果
 * @param callback 回调处理函数
 * @returns 取消监听的函数
 */
export const onOAuthCallback = (
  callback: (data: { token: string | null; user: string | null; error: string | null; url: string }) => void
): (() => void) | void => {
  if (isElectron() && window.electronAPI?.onOAuthCallback) {
    return window.electronAPI.onOAuthCallback(callback);
  }
};

/**
 * 监听 OAuth 窗口关闭
 * @param callback 窗口关闭回调
 * @returns 取消监听的函数
 */
export const onOAuthWindowClosed = (callback: () => void): (() => void) | void => {
  if (isElectron() && window.electronAPI?.onOAuthWindowClosed) {
    return window.electronAPI.onOAuthWindowClosed(callback);
  }
};