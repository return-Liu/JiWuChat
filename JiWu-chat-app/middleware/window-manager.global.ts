import {
    isElectron,
    shouldUseMainWindow,
    isAuxiliaryWindow,
    openDesktopWindow,
    openAuxiliaryWindow,
} from "~/untils/electronHelper";
import { useWindowSessionStore } from "~/stores/windowSession";

/**
 * 窗口管理全局中间件 - 统一处理 Electron 环境下的页面打开方式与布局切换
 *
 * 两层策略（独立窗口 / 主窗口）—— 与桌面 QQ 一致，所有低频页面均以
 * 「独立窗口（自定义标题栏 + 内容）」形式打开：
 * 1. 主窗口页面(/message, /friend, /login 等): default 布局正常路由
 * 2. 轻量独立窗口页面(settings, account, editgroup 等): 独立 BrowserWindow（自定义标题栏）
 * 3. 重量独立窗口页面(file-preview, media, report, call 等): 独立 BrowserWindow
 *
 * 会话恢复：
 * 打开独立窗口前，用 windowSession store 记录主窗口快照；
 * 关闭时按快照恢复，而不是只依赖 fromPath 硬回退。
 */

// 缓存辅助窗口判断结果，避免重复 IPC 调用
let _isAuxiliaryWindow: boolean | null = null;
let _isAuxiliaryWindowPromise: Promise<boolean> | null = null;

// 走独立窗口（而非浮层）的低频页面
const FORCE_WINDOW_ROUTES = [
    "/file-preview",
    "/media",
    "/report",
    "/call",
    "/oauth",
];

export default defineNuxtRouteMiddleware(async (to, from) => {
    if (!isElectron()) {
        return;
    }

    // 延迟判断：缓存辅助窗口状态
    if (_isAuxiliaryWindow === null) {
        if (!_isAuxiliaryWindowPromise) {
            _isAuxiliaryWindowPromise = isAuxiliaryWindow().then((v) => {
                _isAuxiliaryWindow = v;
                return v;
            });
        }
        await _isAuxiliaryWindowPromise;
    }

    // 独立窗口内部：保持 auxiliary-window 布局，允许正常路由跳转
    if (_isAuxiliaryWindow) {
        setPageLayout("auxiliary-window");
        return;
    }

    const sessionStore = useWindowSessionStore();

    // 主窗口页面：normal 路由 + default 布局，并清快照
    if (shouldUseMainWindow(to.path)) {
        setPageLayout("default");
        sessionStore.clearSnapshot();
        return;
    }

    const fullPath = to.fullPath || to.path;

    // ===== 重量页面：独立窗口 =====
    const isForceWindow = FORCE_WINDOW_ROUTES.some(
        (p) => to.path === p || to.path.startsWith(`${p}/`)
    );
    if (isForceWindow) {
        // 记录主窗口快照，便于关闭后恢复
        sessionStore.captureSnapshot(from.fullPath || from.path || "/message");

        const result = await openDesktopWindow({
            route: fullPath,
            type: "modal",
            title: "窗口",
            restoreTarget: from.fullPath || from.path || "/message",
            session: { previousRoute: from.fullPath || from.path || "/message" },
        });

        if (result?.success) {
            if (result.id) {
                sessionStore.registerWindow(result.id, {
                    previousRoute: from.fullPath || from.path || "/message",
                });
            }
            return false;
        }
        // 打开失败降级为正常路由
        console.warn(`打开独立窗口失败: ${fullPath}, 降级为正常路由`);
    }

    // ===== 轻量页面：独立窗口（自定义标题栏 + 内容，与桌面 QQ 一致）=====
    if (from.path && shouldUseMainWindow(from.path)) {
        sessionStore.captureSnapshot(from.fullPath || from.path);
    }

    const auxResult = await openAuxiliaryWindow(fullPath);

    if (auxResult?.success) {
        return false;
    }

    // 独立窗口打开失败 → 降级为正常路由
    console.warn(`打开独立窗口失败: ${fullPath}, 使用正常路由`);
    setPageLayout("default");
    return;
});
