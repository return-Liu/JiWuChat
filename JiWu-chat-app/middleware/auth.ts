import { useUserStore } from "../stores/user";
import { message } from "ant-design-vue";
import { websocketService } from "../untils/websocket";
import { defineNuxtRouteMiddleware, navigateTo } from "nuxt/app";

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.client) {
    const userStore = useUserStore();

    await userStore.initializeAuth();

    // 检查是否已登录
    const isAuthenticated = !!userStore.token;

    // 🔥 如果用户已登录且 WebSocket 未连接，则建立连接
    if (isAuthenticated && !websocketService.isConnected()) {
      try {
        await websocketService.connect();
        console.log("应用初始化：WebSocket 连接成功");
      } catch (error) {
        console.error("应用初始化：WebSocket 连接失败:", error);
        // WebSocket 连接失败不影响页面访问，会在后续重试
      }
    }

    // 定义需要在登录后禁止访问的页面（未认证用户页面）
    const unauthenticatedPages = [
      "/login",
      "/register",
      "/forgot-password",
      "/",
    ];

    // 如果用户已登录，但尝试访问未认证用户页面，则重定向到消息页面
    if (isAuthenticated && unauthenticatedPages.includes(to.path)) {
      return navigateTo("/message");
    }

    // 如果用户未登录，但尝试访问需要认证的页面，则重定向到登录页面
    if (!isAuthenticated && !unauthenticatedPages.includes(to.path)) {
      return navigateTo("/login");
    }

    // 如果用户已登录，但缺少用户信息，则获取用户信息（带重试）
    if (isAuthenticated && !userStore.user) {
      let retries = 2;
      let success = false;

      while (retries >= 0 && !success) {
        try {
          await userStore.fetchUserInfo(true);
          if (userStore.user) {
            success = true;
          } else if (retries > 0) {
            // 等待后重试
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`获取用户信息失败 (剩余重试: ${retries}):`, error);
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
        retries--;
      }

      if (!userStore.user) {
        console.error("多次重试后仍无法获取用户信息，清除登录状态");
        userStore.logout();
        message.error("登录已过期，请重新登录");
        return navigateTo("/login");
      }
    }
  }
});
