<template>
  <!--
    AuxiliaryWindowLoader - 独立窗口加载过渡组件
    解决独立窗口打开时的白屏卡顿感：
    1. 窗口创建时立即显示加载动画（backgroundColor 与组件背景一致，无缝衔接）
    2. 渐进式进度条提供视觉反馈
    3. 页面就绪后淡出过渡
  -->
  <Transition name="loader-fade">
    <div v-if="visible" class="auxiliary-window-loader">
      <div class="loader-container">
        <!-- 旋转动画 -->
        <div class="loader-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring spinner-ring-inner"></div>
        </div>

        <!-- 页面图标 -->
        <div class="loader-icon">
          <slot name="icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 20h9"></path>
              <path
                d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
              ></path>
            </svg>
          </slot>
        </div>

        <!-- 页面标题 -->
        <div class="loader-title">
          <slot name="title">
            <span>{{ pageTitle || "加载中" }}</span>
          </slot>
        </div>

        <!-- 进度条 -->
        <div class="loader-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
        </div>

        <!-- 提示文字 -->
        <div class="loader-hint">{{ hintText }}</div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

interface Props {
  /** 页面标题 */
  pageTitle?: string;
  /** 加载超时时间(ms)，默认 10000 */
  timeout?: number;
  /** 最小显示时间(ms)，防止闪烁，默认 150（降低人为延迟，减少卡顿感） */
  minDisplayTime?: number;
}

const props = withDefaults(defineProps<Props>(), {
  pageTitle: "",
  timeout: 10000,
  minDisplayTime: 150,
});

const emit = defineEmits<{
  (e: "ready"): void;
  (e: "timeout"): void;
}>();

const visible = ref(true);
const progressPercent = ref(0);
const hintText = ref("正在加载...");

let progressTimer: ReturnType<typeof setInterval> | null = null;
let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
let startTime = 0;

// 模拟渐进式加载进度（让用户感知到"正在加载"）
const startProgress = () => {
  startTime = Date.now();
  const totalDuration = 4000; // 模拟总时长
  const interval = 60;
  const steps = totalDuration / interval;
  let step = 0;

  progressTimer = setInterval(() => {
    step++;
    // 缓动：前期快，后期慢，最多到 90%（留 10% 给真正加载完成）
    const linearProgress = (step / steps) * 90;
    const eased =
      linearProgress * (1 + Math.sin((step / steps) * Math.PI * 0.5) * 0.25);
    progressPercent.value = Math.min(90, Math.round(eased));

    // 更新提示文字
    if (progressPercent.value > 60) {
      hintText.value = "即将完成...";
    } else if (progressPercent.value > 30) {
      hintText.value = "加载资源中...";
    }

    if (step >= steps) {
      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }
    }
  }, interval);
};

// 完成进度并淡出
const completeProgress = () => {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
  progressPercent.value = 100;
  hintText.value = "加载完成";

  // 确保至少显示了 minDisplayTime，避免闪烁
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, props.minDisplayTime - elapsed);

  setTimeout(() => {
    visible.value = false;
    // 等 CSS transition 完成后再通知父组件（缩短过渡等待，减少卡顿感）
    setTimeout(() => {
      emit("ready");
    }, 180);
  }, remaining);
};

const clearTimers = () => {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
  if (timeoutTimer) {
    clearTimeout(timeoutTimer);
    timeoutTimer = null;
  }
};

onMounted(() => {
  startProgress();

  // 超时兜底
  timeoutTimer = setTimeout(() => {
    completeProgress();
    emit("timeout");
  }, props.timeout);

  // 监听页面加载完成（Nuxt3 页面挂载完成后触发）
  if (document.readyState === "complete") {
    // 页面可能已经渲染，延迟一点等 Vue 完成 hydration
    setTimeout(() => {
      completeProgress();
    }, 100);
  } else {
    window.addEventListener("load", onPageLoad);
  }

  // 监听 Nuxt3 的 page:finish hook
  // @ts-ignore - Nuxt3 运行时注入
  if (typeof window !== "undefined" && (window as any).$nuxt) {
    (window as any).$nuxt.$on("page:finish", onNuxtPageFinish);
  }
});

const onPageLoad = () => {
  completeProgress();
  window.removeEventListener("load", onPageLoad);
};

const onNuxtPageFinish = () => {
  completeProgress();
};

onUnmounted(() => {
  clearTimers();
  window.removeEventListener("load", onPageLoad);
  // @ts-ignore - Nuxt3 运行时注入
  if (typeof window !== "undefined" && (window as any).$nuxt) {
    (window as any).$nuxt.$off("page:finish", onNuxtPageFinish);
  }
});

defineExpose({
  completeProgress,
  /** 手动隐藏加载器 */
  hide: () => {
    visible.value = false;
  },
});
</script>

<style scoped>
.auxiliary-window-loader {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 与 main.js 中 backgroundColor: "#f5f7fa" 保持一致，无缝衔接 */
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 50%, #f0f2f5 100%);
  z-index: 9999;
  user-select: none;
  -webkit-app-region: drag;
}

.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  -webkit-app-region: no-drag;
}

/* ===== 旋转动画 ===== */
.loader-spinner {
  position: relative;
  width: 56px;
  height: 56px;
  margin-bottom: 4px;
}

.spinner-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #6366f1;
  animation: spin 1.1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.spinner-ring-inner {
  inset: 14%;
  border-top-color: #a5b4fc;
  animation-duration: 0.7s;
  animation-direction: reverse;
}

/* ===== 图标 ===== */
.loader-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.08);
  border-radius: 14px;
  color: #6366f1;
}

/* ===== 标题 ===== */
.loader-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: 0.3px;
}

/* ===== 进度条 ===== */
.loader-progress {
  width: 180px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(99, 102, 241, 0.12);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #818cf8, #6366f1);
  background-size: 200% 100%;
  border-radius: 2px;
  transition: width 0.25s ease-out;
  animation: shimmer 2s ease-in-out infinite;
}

/* ===== 提示文字 ===== */
.loader-hint {
  font-size: 12px;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

/* ===== 淡出过渡 ===== */
.loader-fade-leave-active {
  transition: opacity 0.3s ease-out;
}
.loader-fade-leave-to {
  opacity: 0;
}

/* ===== 关键帧 ===== */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
