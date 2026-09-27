interface ElectronAPI {
  // 平台信息
  platform: string;

  // 版本信息
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };

  // 窗口控制方法
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  resizeWindow: (pageName: string) => void;

  // 获取窗口状态
  getWindowState: () => Promise<string>;

  // 获取窗口最大化状态 (新增)
  getWindowMaximizeState: () => Promise<boolean>;

  // 获取应用版本号
  getAppVersion: () => Promise<string>;

  // 打开辅助窗口
  openAuxiliaryWindow: (pageName: string) => Promise<{ success: boolean; action: 'created' | 'focused'; error?: string }>;

  // ===== 统一窗口管理器 API =====
  openWindow: (options: {
    route: string;
    type?: 'main' | 'auxiliary' | 'modal' | 'popup';
    title?: string;
    restoreTarget?: string;
    session?: Record<string, any>;
    width?: number;
    height?: number;
    modal?: boolean;
    frame?: boolean;
    parentId?: string;
  }) => Promise<{ success: boolean; action?: string; id?: string; error?: string }>;
  focusWindow: (id: string) => Promise<{ success: boolean; error?: string }>;
  closeWindowById: (id: string) => Promise<{ success: boolean; error?: string }>;
  hideWindowById: (id: string) => Promise<{ success: boolean; error?: string }>;
  restoreWindowById: (id: string) => Promise<{ success: boolean; error?: string }>;
  getWindowByRoute: (route: string, type?: string) => Promise<{ id: string; route: string; type: string; restoreTarget: string } | null>;
  setWindowSession: (id: string, session: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
  getWindowSession: (id: string) => Promise<Record<string, any>>;
  getAllWindows: () => Promise<Array<{ id: string; route: string; type: string; title: string; restoreTarget: string }>>;

  // 判断当前窗口是否为辅助窗口
  isAuxiliaryWindow: () => Promise<boolean>;

  // 监听辅助窗口关闭事件（仅主窗口使用）
  onAuxiliaryWindowClosed: (callback: (pageName: string) => void) => (() => void);

  // 监听窗口状态变化
  onWindowStateChange: (callback: (state: string) => void) => void;

  // 监听窗口最大化状态变化 (新增)
  onWindowMaximizeStateChange: (callback: (isMaximized: boolean) => void) => void;

  // OAuth 第三方登录
  openOAuthWindow: (authUrl: string) => Promise<{ success: boolean; error?: string }>;
  onOAuthCallback: (callback: (data: {
    token: string | null;
    user: string | null;
    error: string | null;
    url: string;
  }) => void) => (() => void);
  onOAuthWindowClosed: (callback: () => void) => (() => void);
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export { };