<template>
  <div
    class="custom-titlebar"
    :class="{ 'titlebar-light': isAuthPage }"
    :style="titlebarStyle"
  >
    <div v-if="!isAuthPage" class="titlebar-drag-area">
      <div class="titlebar-logo">
        <img src="../public/jiwuchat-elctron.png" alt="" />
      </div>
      <div class="titlebar-title">{{ title || "极物聊天" }}</div>
    </div>

    <div v-else class="titlebar-drag-area-empty"></div>
    <div class="titlebar-controls">
      <button class="titlebar-button" @click="minimizeWindow">
        <i class="iconfont icon-zuixiaohua"></i>
      </button>
      <button
        v-if="!hideMaximize && !isAuthPage"
        class="titlebar-button"
        @click="toggleMaximize"
      >
        <!-- 最大化图标 -->
        <i v-if="!isMaximized" class="iconfont icon-zuidahua"></i>
        <!-- 移除旋转最小化图标，替换还原图标 icon-huanyuan，视觉完全区分 -->
        <i v-else class="iconfont icon-24gl-minimize2"></i>
      </button>
      <button
        class="titlebar-button titlebar-button-close"
        @click="closeWindow"
      >
        <i class="iconfont icon-guanbi2"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useSiderColor } from "../stores/siderColor";
// 引入封装好的electron工具
import {
  isElectron,
  minimizeWindow as apiMinimize,
  maximizeWindow as apiMaximize,
  closeWindow as apiClose,
  getWindowMaximizeState,
  onWindowMaximizeStateChange,
} from "../untils/electronHelper";

const props = defineProps<{
  hideMaximize?: boolean;
  isAuthPage?: boolean;
  title?: string;
}>();

let siderColorStore: any = null;
try {
  siderColorStore = useSiderColor();
} catch (error) {
  console.warn("SiderColor store not found, using default colors");
}

const isMaximized = ref(false);

const defaultColors = {
  sidebarGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  sidebarBg: "#667eea",
  sidebarText: "#ffffff",
};

const titlebarStyle = computed(() => {
  if (props.isAuthPage) {
    return {
      background: "#ffffff",
      color: "#1d2129",
    };
  }

  if (siderColorStore) {
    const palette = siderColorStore.currentColorPalette;
    return {
      background:
        palette?.sidebarGradient ||
        palette?.sidebarBg ||
        defaultColors.sidebarGradient,
      color: palette?.sidebarText || defaultColors.sidebarText,
    };
  }

  return {
    background: defaultColors.sidebarGradient,
    color: defaultColors.sidebarText,
  };
});

// 初始化窗口最大化状态
const checkWindowState = async () => {
  if (!isElectron()) return;
  try {
    const state = await getWindowMaximizeState();
    isMaximized.value = state;
  } catch (error) {
    console.error("获取窗口状态失败:", error);
  }
};

// 最小化
const minimizeWindow = () => {
  apiMinimize();
};

// 切换最大化/还原【核心修复：本地状态立即翻转，图标立刻变】
const toggleMaximize = () => {
  if (!isElectron()) return;
  // 先更新本地状态，解决图标切换延迟、看起来一样的问题
  isMaximized.value = !isMaximized.value;
  apiMaximize();
};

// 关闭窗口
const closeWindow = () => {
  apiClose();
};

// 窗口最大化状态回调
const handleWindowMaximizeStateChange = (isMaximizedState: boolean) => {
  isMaximized.value = isMaximizedState;
};

onMounted(() => {
  if (siderColorStore && siderColorStore.initTheme) {
    try {
      siderColorStore.initTheme();
    } catch (error) {
      console.warn("Failed to initialize theme:", error);
    }
  }

  checkWindowState();

  // 注册监听
  if (isElectron()) {
    onWindowMaximizeStateChange(handleWindowMaximizeStateChange);
  }
});

// 恢复注销监听，防止页面销毁后监听残留导致状态错乱
onUnmounted(() => {
  // 若你的onWindowMaximizeStateChange支持返回取消函数，在这里调用注销
  // 无返回值则主进程统一管理监听，无需额外处理
});
</script>

<style scoped>
.custom-titlebar {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  -webkit-app-region: drag;
  user-select: none;
  flex-shrink: 0;
  transition: background 0.3s ease;
}

.titlebar-drag-area {
  display: flex;
  align-items: center;
  padding-left: 12px;
  height: 100%;
  gap: 8px;
}

.titlebar-drag-area-empty {
  flex: 1;
  height: 100%;
}

.titlebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
}

.titlebar-logo img {
  width: 23px;
  height: 23px;
  object-fit: contain;
  border-radius: 4px;
}

.titlebar-title {
  font-size: 17px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.titlebar-controls {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag;
  margin-left: auto;
}

.titlebar-button {
  width: 46px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
  padding: 0;
  color: inherit;
  position: relative;
}

.titlebar-button .iconfont {
  font-size: 16px;
  transition: transform 0.2s ease;
}

/* 默认主题 - 深色背景下的悬停效果（所有按钮） */
.titlebar-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 默认主题 - 所有按钮点击效果 */
.titlebar-button:active {
  background-color: rgba(255, 255, 255, 0.3);
}

/* 白色标题栏 - 浅色背景下的悬停效果（所有按钮） */
.titlebar-light .titlebar-button:hover {
  background-color: rgba(0, 0, 0, 0.08);
}

/* 白色标题栏 - 所有按钮点击效果 */
.titlebar-light .titlebar-button:active {
  background-color: rgba(0, 0, 0, 0.15);
}

/* 关闭按钮 - 悬停效果（纯红色背景） */
.titlebar-button-close:hover {
  background-color: #e81123 !important;
  color: #ffffff !important;
}

/* 关闭按钮 - 点击效果 */
.titlebar-button-close:active {
  background-color: #c50b1b !important;
  color: #ffffff !important;
}

/* 白色标题栏下关闭按钮保持红色不变 */
.titlebar-light .titlebar-button-close:hover {
  background-color: #e81123 !important;
  color: #ffffff !important;
}

.titlebar-light .titlebar-button-close:active {
  background-color: #c50b1b !important;
  color: #ffffff !important;
}

/* 让关闭按钮的图标在悬停时变白 */
.titlebar-button-close:hover .iconfont {
  color: #ffffff !important;
}

.titlebar-button-close:active .iconfont {
  color: #ffffff !important;
}
</style>
