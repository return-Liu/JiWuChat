import { defineNuxtPlugin } from "#app";
import { useRouter, useRoute } from "vue-router";
import { useSiderColor } from "../stores/siderColor";

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client) {
    const router = useRouter();
    const route = useRoute();

    // 🔥 初始化主题 - 确保从 localStorage 读取用户配置
    const siderColorStore = useSiderColor();
    siderColorStore.initTheme();
    console.log("[Theme] 主题已初始化:", siderColorStore.currentThemeType);

    // 需要小尺寸的页面列表
    const smallSizePages = ["/login", "/register", "/forgot-password"];

    // 处理 Electron 辅助窗口的路由参数
    // 当通过 file:// 协议打开窗口并传递 ?route=xxx 参数时，自动跳转到对应页面
    if (route.query.route && typeof route.query.route === "string") {
      const targetRoute = `/${route.query.route}`;
      console.log(`[Electron] 检测到路由参数，准备跳转到: ${targetRoute}`);

      // 使用 nextTick 确保路由已准备好
      setTimeout(() => {
        router.push(targetRoute).catch(err => {
          console.error(`[Electron] 路由跳转失败: ${err}`);
        });
      }, 100);
    }

    // 🔥 关键优化：监听主进程的窗口内 SPA 跳转指令
    // 预热窗口/已有窗口聚焦到新路径时，用 router.push 替代 loadURL 二次完整加载
    if (window.electronAPI && window.electronAPI.onNavigate) {
      window.electronAPI.onNavigate((targetPath: string) => {
        console.log(`[Electron] 收到窗口内导航指令: ${targetPath}`);
        // 仅当目标路径与当前路径不同时才跳转，避免重复导航
        if (targetPath && targetPath !== route.fullPath && targetPath !== route.path) {
          router.push(targetPath).catch(err => {
            console.error(`[Electron] 窗口内 SPA 跳转失败: ${err}`);
          });
        }
      });
    }

    // 路由变化后调整窗口尺寸
    router.afterEach((to) => {
      // 检查是否在 Electron 环境中
      if (window.electronAPI && window.electronAPI.resizeWindow) {
        const path = to.path;

        // 判断当前页面类型
        let pageName = "default"; // 默认使用 1200x800

        // 特殊页面使用小尺寸
        if (smallSizePages.includes(path)) {
          // 从路径中提取页面名称
          pageName = path.replace("/", "") || "default";
        }

        console.log(`[Electron] 路由变化到 ${path}，调整窗口尺寸为 ${pageName}`);
        window.electronAPI.resizeWindow(pageName);
      }
    });
  }
});