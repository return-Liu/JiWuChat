<template>
  <div class="layout-container">
    <CustomTitleBar v-if="isElectronEnv" :isAuthPage="isAuthPage" />
    <slot />
    <!-- 全局通话界面 -->
    <CallInterface />
    <!-- 全局来电通知 -->
    <GlobalCallNotification ref="globalCallNotificationRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute } from "vue-router";
import { isElectron } from "../untils/electronHelper";
import { useTheme } from "../composables/useTheme";
import CustomTitleBar from "../components/CustomTitleBar.vue";
import CallInterface from "../components/CallInterface.vue";
import GlobalCallNotification from "../components/GlobalCallNotification.vue";

const isElectronEnv = ref(false);
const route = useRoute();
const globalCallNotificationRef = ref<InstanceType<typeof GlobalCallNotification>>();

// 明暗模式：初始化并注册跨窗口同步监听（主窗口收到设置窗口广播后立即应用）
const { initTheme: initThemeMode } = useTheme();

// 判断是否为认证页面（登录、注册、忘记密码）
const isAuthPage = computed(() => {
  const authPaths = ["/login", "/register", "/forgot-password"];
  return authPaths.includes(route.path);
});

onMounted(() => {
  isElectronEnv.value = isElectron();

  // 认证页面（登录/注册/忘记密码）不需要主题：强制移除 dark class，保持浅色
  if (isAuthPage.value) {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.removeProperty("color-scheme");
  } else {
    // 非认证页面：初始化明暗模式（含跨窗口同步监听），主窗口收到设置窗口广播后立即应用
    initThemeMode();
  }

  // 挂载全局来电通知组件引用
  if (globalCallNotificationRef.value) {
    (window as any).globalCallNotificationRef = globalCallNotificationRef.value;
  }
});

onUnmounted(() => {
  // 清理window引用
  (window as any).globalCallNotificationRef = null;
});
</script>

<style scoped>
.layout-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
