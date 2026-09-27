/**
 * 首页独立主题管理
 * 首页使用 .home-light / .home-dark 类名控制自身主题，
 * 不与 html.dark（设置页/App全局主题）互相影响。
 */
import { ref, watch } from "vue";

const HOME_THEME_KEY = "jiwu-home-theme";

type HomeTheme = "light" | "dark";

// 全局单例状态
const homeTheme = ref<HomeTheme>(
    (typeof window !== "undefined" && (localStorage.getItem(HOME_THEME_KEY) as HomeTheme)) || "light",
);

export function useHomeTheme() {
    const isHomeDark = () => homeTheme.value === "dark";

    const setHomeTheme = (theme: HomeTheme) => {
        homeTheme.value = theme;
        if (typeof window !== "undefined") {
            localStorage.setItem(HOME_THEME_KEY, theme);
        }
    };

    const toggleHomeTheme = () => {
        setHomeTheme(homeTheme.value === "dark" ? "light" : "dark");
    };

    const initHomeTheme = () => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(HOME_THEME_KEY) as HomeTheme | null;
            if (saved) {
                homeTheme.value = saved;
            }
        }
    };

    return {
        homeTheme,
        isHomeDark,
        setHomeTheme,
        toggleHomeTheme,
        initHomeTheme,
    };
}
