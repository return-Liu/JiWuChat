import { useRouter } from "vue-router";

/**
 * 页面关闭/返回辅助函数
 *
 * 统一处理独立窗口页面的"返回/关闭"逻辑：
 * - 独立窗口场景：直接关闭窗口（由 CustomTitleBar 的关闭按钮触发）
 * - 正常路由场景：router.back()
 */
export function useOverlayClose() {
    const router = useRouter();

    /**
     * 返回上一页（独立窗口内返回，或正常路由场景返回上一页）
     */
    const closeOrBack = () => {
        router.back();
    };

    /** 跳转到主窗口指定页面 */
    const goToMain = (path: string = "/message") => {
        if (router.currentRoute.value.fullPath !== path) {
            router.push(path).catch(() => { });
        }
    };

    return { closeOrBack, goToMain };
}
