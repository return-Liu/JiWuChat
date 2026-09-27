<template>
  <div class="tab-content">
    <div class="content-header">
      <div>
        <h3 class="content-title">新特性</h3>
        <p class="content-desc">体验流畅模式、过渡动效和界面精细化功能</p>
      </div>
    </div>

    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">动画与性能</span>
        <span class="group-desc">调整界面动画效果和性能模式</span>
      </div>
      <div class="setting-item">
        <div class="item-info">
          <span class="label">流畅模式</span>
          <span class="desc">开启后提升界面切换动画流畅度</span>
        </div>
        <div
          class="setting-switch"
          :class="{ active: smoothMode }"
          @click.stop="toggleSmoothMode()"
        >
          <span class="switch-handle"></span>
        </div>
      </div>

      <div v-if="!smoothMode" class="setting-item">
        <div class="item-info">
          <span class="label">过渡动效</span>
          <span class="desc">{{ getAnimationStyleDesc(animationStyle) }}</span>
        </div>
        <a-select
          v-model:value="animationStyle"
          class="setting-select"
          :options="animationStyleOptions"
          :popup-match-select-width="false"
        />
      </div>

      <div class="setting-item">
        <div class="item-info">
          <span class="label">精细化界面</span>
          <span class="desc">组件动画、硬件加速、消息滚动等高级设置</span>
        </div>
        <button class="action-btn" @click.stop="showFineTuneModal = true">设置</button>
      </div>

      <div class="setting-item">
        <div class="item-info">
          <span class="label">主题动画</span>
          <span class="desc">{{
            themeAnimationEnabled ? "已开启主题切换动画" : "已关闭主题切换动画"
          }}</span>
        </div>
        <div
          class="setting-switch"
          :class="{ active: themeAnimationEnabled }"
          @click.stop="toggleThemeAnimation()"
        >
          <span class="switch-handle"></span>
        </div>
      </div>
    </div>

    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">版本信息</span>
        <span class="group-desc">查看版本更新和检查新版本</span>
      </div>
      <div class="setting-item">
        <div class="item-info">
          <span class="label">版本更新</span>
          <span class="desc">查看各版本的更新内容</span>
        </div>
        <button class="action-btn" @click.stop="showUpdateLogs">查看</button>
      </div>

      <div class="setting-item">
        <div class="item-info">
          <span class="label">版本信息</span>
          <span class="desc">当前版本 {{ appVersion }}</span>
        </div>
        <button class="action-btn" @click.stop="checkVersion">检查更新</button>
      </div>
    </div>

    <!-- 精细化界面弹窗 -->
    <Teleport to="body">
      <div v-if="showFineTuneModal" class="modal-overlay" @click.self="showFineTuneModal = false">
        <div class="modal-panel">
          <div class="modal-header">
            <h3 class="modal-title">精细化界面设置</h3>
            <i class="iconfont icon-guanbi modal-close" @click="showFineTuneModal = false"></i>
          </div>
          <div class="modal-body">
            <div class="fine-tune-list">
              <div class="fine-tune-item">
                <div class="ft-info">
                  <span class="ft-label">组件动画</span>
                  <span class="ft-desc">开启组件切换时的过渡动画效果</span>
                </div>
                <div
                  class="setting-switch"
                  :class="{ active: ftComponentAnimation }"
                  @click.stop="ftComponentAnimation = !ftComponentAnimation"
                >
                  <span class="switch-handle"></span>
                </div>
              </div>
              <div class="fine-tune-item">
                <div class="ft-info">
                  <span class="ft-label">硬件加速 GPU</span>
                  <span class="ft-desc">使用 GPU 加速渲染，提升界面流畅度</span>
                </div>
                <div
                  class="setting-switch"
                  :class="{ active: ftGpuAcceleration }"
                  @click.stop="ftGpuAcceleration = !ftGpuAcceleration"
                >
                  <span class="switch-handle"></span>
                </div>
              </div>
              <div class="fine-tune-item">
                <div class="ft-info">
                  <span class="ft-label">消息滚动</span>
                  <span class="ft-desc">优化消息列表滚动性能</span>
                </div>
                <div
                  class="setting-switch"
                  :class="{ active: ftMessageScroll }"
                  @click.stop="ftMessageScroll = !ftMessageScroll"
                >
                  <span class="switch-handle"></span>
                </div>
              </div>
              <div class="fine-tune-item">
                <div class="ft-info">
                  <span class="ft-label">消息列表动画</span>
                  <span class="ft-desc">新消息进入列表时的动画效果</span>
                </div>
                <div
                  class="setting-switch"
                  :class="{ active: ftMessageListAnimation }"
                  @click.stop="ftMessageListAnimation = !ftMessageListAnimation"
                >
                  <span class="switch-handle"></span>
                </div>
              </div>
              <div class="fine-tune-item">
                <div class="ft-info">
                  <span class="ft-label">骨架屏</span>
                  <span class="ft-desc">加载时显示骨架屏占位，提升感知体验</span>
                </div>
                <div
                  class="setting-switch"
                  :class="{ active: ftSkeletonScreen }"
                  @click.stop="ftSkeletonScreen = !ftSkeletonScreen"
                >
                  <span class="switch-handle"></span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-confirm" @click="showFineTuneModal = false">完成</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "#app";
import request from "../../untils/request";

const router = useRouter();

// ===== 通用 =====
const appVersion = ref("1.0.0");

// ===== 动画相关 =====
const smoothMode = ref(false);
const toggleSmoothMode = (value?: boolean) => {
  smoothMode.value = value ?? !smoothMode.value;
  if (typeof window !== "undefined") {
    localStorage.setItem("smoothMode", String(smoothMode.value));
  }
  document.documentElement.classList.toggle("smooth-mode", smoothMode.value);
};

const animationStyle = ref<"default" | "elastic" | "fade" | "slide" | "scale">("default");
const animationStyleOptions = [
  { value: "default", label: "默认动画" },
  { value: "elastic", label: "弹性动画" },
  { value: "fade", label: "淡入效果" },
  { value: "slide", label: "滑动效果" },
  { value: "scale", label: "缩放效果" },
];

const getAnimationStyleDesc = (style: string) => {
  const descMap: Record<string, string> = {
    default: "默认动画效果",
    elastic: "弹性动画效果",
    fade: "淡入动画效果",
    slide: "滑动动画效果",
    scale: "缩放动画效果",
  };
  return descMap[style] || "";
};

// ===== 新特性相关 =====
const themeAnimationEnabled = ref(true);

const toggleThemeAnimation = (value?: boolean) => {
  themeAnimationEnabled.value = value ?? !themeAnimationEnabled.value;
  if (typeof window !== "undefined") {
    localStorage.setItem("themeAnimationEnabled", String(themeAnimationEnabled.value));
  }
  document.documentElement.classList.toggle(
    "theme-animation-disabled",
    !themeAnimationEnabled.value,
  );
};

// 精细化界面
const showFineTuneModal = ref(false);
const ftComponentAnimation = ref(true);
const ftGpuAcceleration = ref(true);
const ftMessageScroll = ref(true);
const ftMessageListAnimation = ref(true);
const ftSkeletonScreen = ref(true);

// ===== 版本更新 =====
const showUpdateLogs = () => router.push("/updateLogs");
const checkVersion = async () => {
  try {
    const res = await request.get("/updatelogs/latest");
    let latestData = res?.data || res;
    if (!latestData?.hasUpdate) {
      message.info("当前已是最新版本");
      return;
    }
    const latestLog = latestData.latestLog;
    if (!latestLog) {
      message.info("暂无更新内容");
      return;
    }
    message.success(`发现新版本: ${latestLog.version}`);
    router.push("/updateLogs");
  } catch {
    message.error("检查更新失败");
  }
};

// ===== 生命周期 =====
onMounted(async () => {
  try {
    const res = await request.get("/updatelogs/latest");
    const latestData = res?.data || res;
    if (latestData?.latestLog) {
      appVersion.value = latestData.latestLog.version;
    }
  } catch {
    appVersion.value = "1.0.0";
  }

  if (typeof window !== "undefined") {
    const savedSmoothMode = localStorage.getItem("smoothMode");
    if (savedSmoothMode !== null) {
      smoothMode.value = savedSmoothMode === "true";
      document.documentElement.classList.toggle("smooth-mode", smoothMode.value);
    }

    const savedAnimationStyle = localStorage.getItem("animationStyle");
    if (savedAnimationStyle && savedAnimationStyle !== "default") {
      animationStyle.value = savedAnimationStyle as any;
      document.documentElement.classList.add(`animation-${savedAnimationStyle}`);
    }

    const savedFt = (key: string, ref: any) => {
      const v = localStorage.getItem(key);
      if (v !== null) ref.value = v === "true";
    };
    savedFt("ftComponentAnimation", ftComponentAnimation);
    savedFt("ftGpuAcceleration", ftGpuAcceleration);
    savedFt("ftMessageScroll", ftMessageScroll);
    savedFt("ftMessageListAnimation", ftMessageListAnimation);
    savedFt("ftSkeletonScreen", ftSkeletonScreen);

    const savedThemeAnim = localStorage.getItem("themeAnimationEnabled");
    if (savedThemeAnim !== null) {
      themeAnimationEnabled.value = savedThemeAnim === "true";
      document.documentElement.classList.toggle(
        "theme-animation-disabled",
        !themeAnimationEnabled.value,
      );
    }
  }
});

// Watch 保存
watch(smoothMode, (val) => localStorage.setItem("smoothMode", String(val)));
watch(animationStyle, (val) => localStorage.setItem("animationStyle", val));
watch(themeAnimationEnabled, (val) => localStorage.setItem("themeAnimationEnabled", String(val)));
watch(ftComponentAnimation, (val) => localStorage.setItem("ftComponentAnimation", String(val)));
watch(ftGpuAcceleration, (val) => localStorage.setItem("ftGpuAcceleration", String(val)));
watch(ftMessageScroll, (val) => localStorage.setItem("ftMessageScroll", String(val)));
watch(ftMessageListAnimation, (val) => localStorage.setItem("ftMessageListAnimation", String(val)));
watch(ftSkeletonScreen, (val) => localStorage.setItem("ftSkeletonScreen", String(val)));

// 精细化界面功能实际生效
watch(ftComponentAnimation, (val) => {
  document.documentElement.classList.toggle("disable-component-animation", !val);
});
watch(ftGpuAcceleration, (val) => {
  document.documentElement.classList.toggle("enable-gpu-acceleration", val);
});
watch(ftMessageScroll, (val) => {
  document.documentElement.classList.toggle("optimize-message-scroll", val);
});
watch(ftMessageListAnimation, (val) => {
  document.documentElement.classList.toggle("disable-message-list-animation", !val);
});
watch(ftSkeletonScreen, (val) => {
  document.documentElement.classList.toggle("enable-skeleton-screen", val);
});

onMounted(() => {
  // 初始化时应用已保存的设置
  document.documentElement.classList.toggle(
    "disable-component-animation",
    !ftComponentAnimation.value,
  );
  document.documentElement.classList.toggle("enable-gpu-acceleration", ftGpuAcceleration.value);
  document.documentElement.classList.toggle("optimize-message-scroll", ftMessageScroll.value);
  document.documentElement.classList.toggle(
    "disable-message-list-animation",
    !ftMessageListAnimation.value,
  );
  document.documentElement.classList.toggle("enable-skeleton-screen", ftSkeletonScreen.value);
});
</script>

<style scoped lang="scss">
// 弹窗遮罩
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

// 弹窗面板
.modal-panel {
  width: 440px;
  max-width: 90vw;
  max-height: 80vh;
  border-radius: 12px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);

  .modal-title {
    font-size: 1.143rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .modal-close {
    font-size: 1.143rem;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.15s;

    &:hover {
      color: var(--text-primary);
      background: var(--bg-hover);
    }
  }
}

.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);

  .btn-confirm {
    padding: 8px 24px;
    border-radius: 6px;
    border: none;
    background: var(--purple-color);
    color: #fff;
    font-size: 0.929rem;
    cursor: pointer;
    transition: opacity 0.15s;

    &:hover {
      opacity: 0.85;
    }
  }
}

// 精细化界面项
.fine-tune-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fine-tune-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);

  .ft-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
    margin-right: 16px;

    .ft-label {
      font-size: 0.929rem;
      color: var(--text-primary);
      font-weight: 500;
    }

    .ft-desc {
      font-size: 0.786rem;
      color: var(--text-tertiary);
      line-height: 1.4;
    }
  }
}

// 开关
.setting-switch {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--bg-hover);
  cursor: pointer;
  position: relative;
  transition: background 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  user-select: none;
  -webkit-user-select: none;

  .switch-handle {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--card-bg);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateX(0);
    will-change: transform;
  }

  &.active {
    background: var(--purple-color);

    .switch-handle {
      transform: translateX(20px);
    }
  }
}
</style>
