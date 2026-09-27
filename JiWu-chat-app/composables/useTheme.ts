/**
 * 主题管理 composable
 * 支持 light / dark / system 三种模式
 * View Transition API 实现圆形裁剪切换动画
 */
import { useDark } from "@vueuse/core";
import { nextTick, ref } from "vue";
import {
    broadcastThemeSettings,
    onThemeSettingsChanged,
} from "../untils/electronHelper";
import { useSiderColor } from "../stores/siderColor";

interface DocumentWithViewTransition extends Document {
    startViewTransition?: (callback: () => Promise<void> | void) => any;
}

const THEME_STORAGE_KEY = "vitepress-theme-appearance";
const THEME_MODE_KEY = "theme-mode";

const supportsVT = () => {
    if (typeof window === "undefined") return false;
    const doc = document as DocumentWithViewTransition;
    return typeof doc.startViewTransition === "function" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

let latestTransitionId = 0;

export function useTheme() {
    const isDark = useDark({
        storageKey: THEME_STORAGE_KEY,
        valueDark: "dark",
        valueLight: "light",
    });

    // 侧边栏颜色 store：用于同步明暗模式到 siderColor.systemPrefersDark，
    // 使 Sidebar / MessageDisplay / ContactList 等组件的颜色随日间/夜间切换更新
    let siderColorStore: ReturnType<typeof useSiderColor> | null = null;
    try {
        siderColorStore = useSiderColor();
    } catch {
        // siderColor store 未初始化时忽略（例如在非组件上下文）
    }

    const themeMode = ref<'light' | 'dark' | 'system'>(
        (typeof window !== "undefined" && (localStorage.getItem(THEME_MODE_KEY) as any)) || "light"
    );

    let isAnimating = false;
    let systemMediaQuery: MediaQueryList | null = null;

    const resolveIsDark = () => {
        if (themeMode.value === "system") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        return themeMode.value === "dark";
    };

    const applyTheme = () => {
        const dark = resolveIsDark();
        if (isDark.value !== dark) {
            isDark.value = dark;
        }
        // 🔥 关键：同步明暗模式到 siderColor，驱动组件颜色更新
        // siderColor.currentColorPalette 依赖 systemPrefersDark 决定返回暗色/亮色调色板
        if (siderColorStore) {
            siderColorStore.updateSystemPrefersDark(dark);
        }
    };

    const setThemeMode = (mode: 'light' | 'dark' | 'system') => {
        if (themeMode.value === mode) return;
        themeMode.value = mode;
        if (typeof window !== "undefined") {
            localStorage.setItem(THEME_MODE_KEY, mode);
        }
        applyTheme();
        // 跨窗口同步：通知其它窗口（主窗口/Web）立即应用新主题
        console.log("[主题] setThemeMode 广播:", mode);
        broadcastThemeSettings({ type: "mode", mode });
    };

    const setTheme = (newTheme: 'light' | 'dark') => {
        setThemeMode(newTheme);
    };

    const toggleTheme = (event?: MouseEvent, targetDark?: boolean) => {
        if (isAnimating) return;

        const currentDark = resolveIsDark();
        const willBeDark = targetDark !== undefined ? targetDark : !currentDark;

        if (willBeDark === currentDark) return;

        if (!supportsVT() || !event) {
            setThemeMode(willBeDark ? 'dark' : 'light');
            return;
        }

        isAnimating = true;

        const { clientX: x, clientY: y } = event;
        const { innerWidth: w, innerHeight: h } = window;

        const endRadius = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
        const ratioX = (100 * x) / w;
        const ratioY = (100 * y) / h;
        const referR = Math.hypot(w, h) / Math.SQRT2;
        const ratioR = (100 * endRadius) / referR;

        const transitionId = ++latestTransitionId;
        const root = document.documentElement;

        root.dataset.themeTransition = willBeDark ? "to-dark" : "to-light";
        root.style.setProperty("--theme-transition-x", `${ratioX}%`);
        root.style.setProperty("--theme-transition-y", `${ratioY}%`);
        root.style.setProperty("--theme-transition-radius", `${ratioR}%`);

        const doc = document as DocumentWithViewTransition;

        const transition = doc.startViewTransition!(async () => {
            setThemeMode(willBeDark ? 'dark' : 'light');
            await nextTick();
        });

        transition.finished.finally(() => {
            if (transitionId !== latestTransitionId) return;
            delete root.dataset.themeTransition;
            root.style.removeProperty("--theme-transition-x");
            root.style.removeProperty("--theme-transition-y");
            root.style.removeProperty("--theme-transition-radius");
            isAnimating = false;
        });
    };

    const initTheme = () => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(THEME_MODE_KEY) as 'light' | 'dark' | 'system' | null;
            if (saved) themeMode.value = saved;
        }

        if (typeof window !== "undefined") {
            systemMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            systemMediaQuery.addEventListener("change", () => {
                if (themeMode.value === "system") {
                    applyTheme();
                }
            });
        }

        applyTheme();

        // 跨窗口同步：监听其它窗口广播的主题变化，立即应用
        if (typeof window !== "undefined") {
            onThemeSettingsChanged((settings) => {
                console.log("[主题] 收到广播:", settings);
                if (settings?.type === "mode" && settings.mode) {
                    if (themeMode.value !== settings.mode) {
                        themeMode.value = settings.mode as 'light' | 'dark' | 'system';
                        localStorage.setItem(THEME_MODE_KEY, settings.mode);
                    }
                    applyTheme();
                }
            });

            // Web 端多标签页同步：监听 localStorage storage 事件
            window.addEventListener("storage", (e) => {
                if (e.key === THEME_MODE_KEY || e.key === THEME_STORAGE_KEY) {
                    const saved = localStorage.getItem(THEME_MODE_KEY) as
                        | 'light'
                        | 'dark'
                        | 'system'
                        | null;
                    if (saved && themeMode.value !== saved) {
                        themeMode.value = saved;
                    }
                    applyTheme();
                }
            });
        }
    };

    return {
        theme: isDark,
        themeMode,
        isDark: () => isDark.value,
        toggleTheme,
        setTheme,
        setThemeMode,
        initTheme
    };
}