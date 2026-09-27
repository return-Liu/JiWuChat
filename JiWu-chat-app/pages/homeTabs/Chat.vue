<template>
  <section class="tab-page">
    <div class="chat-iframe-wrapper">
      <div v-if="loading" class="iframe-loading">
        <img src="../../public/logo.png" alt="极物聊天" class="iframe-loading-logo" />
        <span class="iframe-loading-text">极物聊天</span>
      </div>
      <iframe
        :src="iframeSrc"
        class="chat-iframe"
        :class="{ 'iframe-hidden': loading }"
        title="极物聊天体验"
        @load="onIframeLoad"
      ></iframe>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useVersionStore } from "../../stores/version";
import { useUserStore } from "../../stores/user";
import Cookies from "js-cookie";

const userStore = useUserStore();
const versionStore = useVersionStore();
const loading = ref(true);

const latestVersion = ref("");
const versionFetched = ref(false);
const showVersionTip = ref(false);
let hideTimeout: any = null;

// 初始化
onMounted(() => {
  // 标记为体验版
  versionStore.setBeta();
});

// 鼠标进入
const handleMouseEnter = async () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  showVersionTip.value = true;

  if (!versionFetched.value) {
    versionFetched.value = true;
    await fetchLatestVersion();
  }
};

// 鼠标离开
const handleMouseLeave = () => {
  hideTimeout = setTimeout(() => {
    showVersionTip.value = false;
  }, 200);
};

// 获取最新版本号
const fetchLatestVersion = async () => {
  try {
    const { default: request } = await import("../../untils/request");
    const res = await request.get("/updatelogs");
    let logs: any[] = [];
    if (res && res.data) {
      logs = Array.isArray(res.data) ? res.data : res.data?.logs || [];
    }
    if (logs.length > 0) {
      logs.sort(
        (a: any, b: any) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      );
      latestVersion.value = logs[0].version || "";
    }
  } catch (err) {
    console.error("获取最新版本失败:", err);
  }
};

// 如果主应用已登录（Cookie有token），iframe 直接加载消息页
const iframeSrc = computed(() => {
  const token = Cookies.get("token");
  const baseUrl = token ? "/message" : "/login";
  // 传递版本参数给iframe
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}version=beta`;
});

function onIframeLoad() {
  loading.value = false;
}
</script>

<style lang="scss" scoped>
// ===== 变量定义 =====
$iframe-width: 1400px;
$iframe-height: 700px;
$border-radius: 6px;
$loading-gap: 10px;
$loading-logo-size: 28px;
$loading-font-size: 16px;

// ===== 页面容器 =====
.tab-page {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  min-height: 60vh;
}

// ===== iframe 外层容器 =====
.chat-iframe-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  position: relative;
  width: $iframe-width;
  height: $iframe-height;
}

// ===== 加载状态 =====
.iframe-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: $loading-gap;
  z-index: 1;
  border: 1px solid var(--border-color);
  border-radius: $border-radius;
  background: var(--card-bg);

  &-logo {
    width: $loading-logo-size;
    height: $loading-logo-size;
    animation: loadingPulse 1.5s ease-in-out infinite;
  }

  &-text {
    font-size: $loading-font-size;
    color: var(--text-secondary);
    font-family:
      "Alimama",
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      Helvetica,
      Arial,
      sans-serif;
  }
}

@keyframes loadingPulse {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

// ===== iframe 主体 =====
.chat-iframe {
  width: $iframe-width + 200px;
  height: $iframe-height;
  border: 1px solid var(--border-color);
  border-radius: $border-radius;
  transition: opacity 0.3s ease;

  &.iframe-hidden {
    opacity: 0;
  }
}
</style>
