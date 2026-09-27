const { BrowserWindow } = require("electron");
const path = require("path");

/**
 * 统一窗口管理器（主进程）
 *
 * 职责：
 * - 维护所有独立窗口的注册表（id -> record）
 * - 维护「route + type -> id」索引，用于去重/聚焦
 * - 维护每个窗口的会话状态（session），用于关闭后恢复
 * - 提供统一的 open / focus / close / hide / restore 生命周期
 *
 * 所有低频页面均以独立 BrowserWindow 形式打开，由本管理器统一注册管理。
 */

const windowRegistry = new Map(); // id -> record
const routeIndex = new Map(); // `${route}:${type}` -> id
const sessionIndex = new Map(); // id -> session（活跃窗口的会话）
const persistedSession = new Map(); // `${route}:${type}` -> session（关闭后保留，供再次打开恢复）

const normalizeRoute = (route = "") => {
  if (!route) return "/";
  return route.startsWith("/") ? route : `/${route}`;
};

const routeKey = (route, type) => `${normalizeRoute(route)}:${type}`;

const buildWindowUrl = ({ route, isDev }) => {
  const safeRoute = normalizeRoute(route);
  if (isDev) {
    return `http://localhost:3000${safeRoute}`;
  }
  const indexPath = path.join(process.cwd(), "dist", "index.html");
  return `file://${indexPath}#${safeRoute}`;
};

const getDefaultSize = ({ type }) => {
  const map = {
    main: { width: 1200, height: 760 },
    auxiliary: { width: 980, height: 760 },
    modal: { width: 900, height: 700 },
    popup: { width: 420, height: 620 },
  };
  return map[type] || map.auxiliary;
};

const removeWindowRecord = (win) => {
  if (!win) return;
  const id = win.__windowId;
  if (!id) return;
  const record = windowRegistry.get(id);
  if (!record) return;

  const key = routeKey(record.route, record.type);
  routeIndex.delete(key);
  windowRegistry.delete(id);
  // 关键：关闭时把会话持久化，供再次打开恢复（而不是直接丢弃）
  const session = sessionIndex.get(id);
  if (session && Object.keys(session).length > 0) {
    persistedSession.set(key, session);
  }
  sessionIndex.delete(id);
};

const attachLifecycle = (win, record) => {
  win.__windowId = record.id;
  win.__route = record.route;
  win.__type = record.type;

  // 关闭时：先持久化会话，再清理注册表
  win.on("close", () => removeWindowRecord(win));
  // 兜底：closed 时确保清理干净（此时 isDestroyed 为 true，removeWindowRecord 已不依赖它）
  win.on("closed", () => {
    const id = win.__windowId;
    if (id) {
      windowRegistry.delete(id);
      sessionIndex.delete(id);
    }
  });
};

/**
 * 打开一个独立窗口（带去重：同 route + type 已存在则聚焦）
 */
const openWindow = async ({
  route,
  type = "auxiliary",
  title = "窗口",
  restoreTarget = "/message",
  session = {},
  width,
  height,
  modal = false,
  frame = false,
  parentId,
}) => {
  const safeRoute = normalizeRoute(route);
  const key = routeKey(safeRoute, type);

  // 1. 去重：同 route + type 已存在 → 聚焦
  const existingId = routeIndex.get(key);
  if (existingId) {
    const existing = windowRegistry.get(existingId);
    const existingWin = existing?.win;
    if (existingWin && !existingWin.isDestroyed()) {
      if (existingWin.isMinimized()) existingWin.restore();
      existingWin.show();
      existingWin.focus();
      return { success: true, action: "focused", id: existingId };
    }
  }

  const size = getDefaultSize({ type });

  const win = new BrowserWindow({
    width: width || size.width,
    height: height || size.height,
    minWidth: type === "popup" ? 320 : 360,
    minHeight: type === "popup" ? 420 : 400,
    title,
    frame,
    modal,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#f5f7fa",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // 关键：标记为独立窗口（与 main.js 的 open-auxiliary-window 保持一致），
  // 使渲染进程 is-auxiliary-window 返回 true，从而走 auxiliary-window 布局（自定义标题栏 + 内容）。
  // auxiliaryPageName 取 route 第一段，用于窗口去重/聚焦/预热池标识。
  win.auxiliaryPageName = safeRoute.replace(/^\//, "").split("/")[0] || type;
  win.auxiliaryFullPath = safeRoute;

  const id = `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  // 3. 会话恢复：关闭前保存的 session 合并进来
  const restoredSession = persistedSession.get(key) || {};
  const mergedSession = { ...restoredSession, ...session };
  persistedSession.delete(key);

  const record = {
    id,
    type,
    route: safeRoute,
    title,
    restoreTarget,
    session: mergedSession,
    parentId,
    win,
    createdAt: Date.now(),
  };

  windowRegistry.set(id, record);
  routeIndex.set(key, id);
  sessionIndex.set(id, mergedSession);

  attachLifecycle(win, record);

  win.once("ready-to-show", () => win.show());

  win.webContents.on("did-finish-load", () => {
    win.webContents.send("window-ready", {
      id,
      type,
      route: safeRoute,
      title,
      session: mergedSession,
    });
  });

  win.loadURL(buildWindowUrl({ route: safeRoute, isDev: process.env.NODE_ENV === "development" }));

  return { success: true, action: "created", id };
};

const focusWindow = (id) => {
  const record = windowRegistry.get(id);
  if (!record) return { success: false, error: "window not found" };
  const { win } = record;
  if (!win || win.isDestroyed()) return { success: false, error: "window destroyed" };

  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  return { success: true };
};

const closeWindow = (id) => {
  const record = windowRegistry.get(id);
  if (!record) return { success: false, error: "window not found" };
  const { win } = record;
  if (!win || win.isDestroyed()) return { success: true };

  win.close();
  return { success: true };
};

const hideWindow = (id) => {
  const record = windowRegistry.get(id);
  if (!record) return { success: false, error: "window not found" };
  const { win } = record;
  if (!win || win.isDestroyed()) return { success: true };

  win.hide();
  return { success: true };
};

const restoreWindow = (id) => {
  const record = windowRegistry.get(id);
  if (!record) return { success: false, error: "window not found" };
  const { win } = record;
  if (!win || win.isDestroyed()) return { success: true };

  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  return { success: true };
};

const getWindowById = (id) => windowRegistry.get(id) || null;

const getWindowByRoute = (route, type) => {
  const safeRoute = normalizeRoute(route);
  const id = routeIndex.get(`${safeRoute}:${type || "auxiliary"}`);
  return id ? windowRegistry.get(id) || null : null;
};

const setWindowSession = (id, session) => {
  const record = windowRegistry.get(id);
  if (!record) return { success: false, error: "window not found" };

  record.session = { ...record.session, ...session };
  sessionIndex.set(id, record.session);
  return { success: true };
};

const getWindowSession = (id) => sessionIndex.get(id) || {};

const initWindowManager = ({ ipcMain }) => {
  ipcMain.handle("app-open-window", async (_, options) => openWindow(options || {}));
  ipcMain.handle("app-focus-window", async (_, id) => focusWindow(id));
  ipcMain.handle("app-close-window", async (_, id) => closeWindow(id));
  ipcMain.handle("app-hide-window", async (_, id) => hideWindow(id));
  ipcMain.handle("app-restore-window", async (_, id) => restoreWindow(id));
  ipcMain.handle("app-get-window-by-route", async (_, route, type) => {
    const record = getWindowByRoute(route, type);
    return record
      ? {
          id: record.id,
          route: record.route,
          type: record.type,
          restoreTarget: record.restoreTarget,
        }
      : null;
  });
  ipcMain.handle("app-set-window-session", async (_, id, session) => setWindowSession(id, session));
  ipcMain.handle("app-get-window-session", async (_, id) => getWindowSession(id));
  ipcMain.handle("app-get-all-windows", async () =>
    [...windowRegistry.values()].map((r) => ({
      id: r.id,
      route: r.route,
      type: r.type,
      title: r.title,
      restoreTarget: r.restoreTarget,
    })),
  );
};

module.exports = {
  initWindowManager,
  openWindow,
  focusWindow,
  closeWindow,
  hideWindow,
  restoreWindow,
  getWindowById,
  getWindowByRoute,
  setWindowSession,
  getWindowSession,
};
