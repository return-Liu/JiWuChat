import { defineStore } from "pinia";

/**
 * 窗口会话状态（渲染进程）
 *
 * 职责：记录「打开独立窗口前」的主窗口状态，用于关闭时精确恢复，
 * 而不是依赖 router.back() 或简单的 fromPath 硬回退。
 */

type SessionSnapshot = {
    /** 打开前的主窗口路由 */
    route: string;
    /** 打开前主窗口的滚动位置（可选） */
    scroll?: { x: number; y: number };
    /** 打开前主窗口的选中状态（如当前会话 id，可选） */
    selection?: Record<string, any>;
    /** 打开前主窗口的额外上下文（可选） */
    context?: Record<string, any>;
};

export const useWindowSessionStore = defineStore("windowSession", {
    state: () => ({
        /** 当前主窗口的快照（打开浮层/窗口前记录） */
        snapshot: null as SessionSnapshot | null,
        /** 独立窗口会话（id -> session），与主进程 windowManager 同步 */
        sessions: {} as Record<string, Record<string, any>>,
        /** 当前活跃的独立窗口 id */
        activeWindowId: "" as string,
    }),

    getters: {
        hasSnapshot: (state) => state.snapshot !== null,
    },

    actions: {
        /** 记录打开浮层/窗口前的主窗口快照 */
        captureSnapshot(route: string, extra?: Partial<SessionSnapshot>) {
            this.snapshot = {
                route,
                ...extra,
            };
        },

        /** 获取并清除快照（关闭浮层时调用，恢复主窗口） */
        consumeSnapshot(): SessionSnapshot | null {
            const snap = this.snapshot;
            this.snapshot = null;
            return snap;
        },

        /** 清除快照 */
        clearSnapshot() {
            this.snapshot = null;
        },

        /** 注册独立窗口会话 */
        registerWindow(id: string, session: Record<string, any>) {
            this.sessions[id] = { ...session };
            this.activeWindowId = id;
        },

        /** 更新独立窗口会话 */
        updateWindowSession(id: string, session: Record<string, any>) {
            this.sessions[id] = { ...this.sessions[id], ...session };
        },

        /** 移除独立窗口会话 */
        removeWindow(id: string) {
            delete this.sessions[id];
            if (this.activeWindowId === id) this.activeWindowId = "";
        },

        /** 完全重置（应用销毁时） */
        reset() {
            this.snapshot = null;
            this.sessions = {};
            this.activeWindowId = "";
        },
    },
});
