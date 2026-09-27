<template>
  <div class="settings-page">
    <!-- 左侧边栏 -->
    <div class="settings-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <div>
            <h2>极物聊天</h2>
            <p class="brand-subtitle">设置中心</p>
          </div>
        </div>
      </div>
      <div class="sidebar-menu">
        <div
          v-for="item in menuItems"
          :key="item.key"
          class="menu-item"
          :class="{ active: currentTab === item.key }"
          :style="{ '--menu-color': item.color }"
          @click="navigateTo(item.key)"
        >
          <i class="iconfont" :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- 右侧主内容 -->
    <div class="settings-main">
      <div class="settings-content">
        <SettingsNotification v-show="currentTab === 'notification'" />
        <SettingsAppearance v-show="currentTab === 'appearance'" />
        <SettingsSuperColorPalette v-show="currentTab === 'supercolorpalette'" />
        <SettingsPrivacy v-show="currentTab === 'privacy'" />
        <SettingsLanguage v-show="currentTab === 'language'" />
        <SettingsShortcut v-show="currentTab === 'shortcut'" />
        <SettingsFeature v-show="currentTab === 'feature'" />
        <SettingsSystem v-show="currentTab === 'system'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref } from "vue";
import { useRouter, useRoute } from "#app";
import { useTheme } from "../../composables/useTheme";
import { useSiderColor } from "../../stores/siderColor";
import { useUserStore } from "../../stores/user";
import SettingsNotification from "../../components/settings/SettingsNotification.vue";
import SettingsAppearance from "../../components/settings/SettingsAppearance.vue";
import SettingsSuperColorPalette from "../../components/settings/SettingsSuperColorPalette.vue";
import SettingsPrivacy from "../../components/settings/SettingsPrivacy.vue";
import SettingsLanguage from "../../components/settings/SettingsLanguage.vue";
import SettingsShortcut from "../../components/settings/SettingsShortcut.vue";
import SettingsFeature from "../../components/settings/SettingsFeature.vue";
import SettingsSystem from "../../components/settings/SettingsSystem.vue";

const router = useRouter();
const route = useRoute();
const { initTheme: initThemeMode } = useTheme();
const siderColorStore = useSiderColor();
const userStore = useUserStore();

// 支持浮层场景：从 props 接收 tab（浮层渲染时 route.params 为空）
const props = defineProps<{ tab?: string }>();

// ===== 菜单配置 =====
const menuItems = [
  { key: "notification", label: "通知", icon: "icon-tongzhi", color: "#f59e0b" },
  { key: "appearance", label: "外观", icon: "icon-theme", color: "#8b5cf6" },
  { key: "supercolorpalette", label: "超级调色盘", icon: "icon-pifu", color: "#8b5cf6" },
  { key: "privacy", label: "隐私", icon: "icon-yinsibaohu", color: "#3b82f6" },
  { key: "language", label: "语言", icon: "icon-yuyan", color: "#10b981" },
  { key: "shortcut", label: "快捷键", icon: "icon-kuaijiejian", color: "#ef4444" },
  { key: "feature", label: "新特性", icon: "icon-tianwenxue", color: "#ec4899" },
  { key: "system", label: "系统", icon: "icon-xitong", color: "#6366f1" },
];

// 当前 tab：优先从 props（浮层场景），其次 route.params（正常路由场景）
const currentTab = ref(props.tab || (route.params.tab as string) || "notification");

// 校验 tab 合法性，非法则回退默认
if (!menuItems.some((item) => item.key === currentTab.value)) {
  currentTab.value = "notification";
}

// 🔥 离开超级调色盘 tab 时重置预览模式
watch(currentTab, (newTab, oldTab) => {
  if (oldTab === "supercolorpalette" && newTab !== "supercolorpalette") {
    siderColorStore.setPreviewThemeMode(null);
  }
});

// ===== 导航方法 =====
// 浮层场景下切换 tab 用本地状态（不切换路由）；正常路由场景下用 router.push
const navigateTo = (key: string) => {
  currentTab.value = key;
  // 仅在非浮层（正常路由）场景下同步路由
  if (!props.tab) {
    router.push(`/settings/${key}`);
  }
};

// ===== 生命周期 =====
onMounted(async () => {
  // 🔥 关键：初始化用户状态，触发 uiSettings.setCurrentUser → 加载该用户的字体设置
  // 否则设置窗口里 currentUserId 为 null，字体保存到 legacy 键，与主窗口的 userId 键不匹配，
  // 导致「设置了字体，再打开就恢复默认」的 BUG。
  try {
    await userStore.initializeAuth();
    if (!userStore.user) {
      await userStore.fetchUserInfo(true);
    }
  } catch (err) {
    console.error("设置窗口初始化用户失败:", err);
  }

  // 初始化侧边栏颜色主题（含跨窗口同步监听）
  await siderColorStore.initTheme();

  // 初始化明暗模式（含跨窗口同步监听，替代之前手动 setThemeMode/toggleTheme）
  initThemeMode();
});
</script>

<!-- 共享样式：非 scoped，可穿透到子组件 -->
<style lang="scss">
@import "../../assets/scss/settings-shared.scss";
</style>

<!-- 页面布局：scoped，仅作用于当前组件 -->
<style scoped lang="scss">
.settings-page {
  width: 100vw;
  height: 100vh;
  background: var(--bg-primary);
  display: flex;
  overflow: hidden;

  // 左侧边栏
  .settings-sidebar {
    width: 200px;
    min-width: 200px;
    background: var(--bg-secondary);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;

    .sidebar-header {
      // 优化：增大上下间距，让品牌区更舒展
      padding: 24px 20px 20px;

      .sidebar-brand {
        display: flex;
        align-items: center;
        gap: 12px;

        h2 {
          margin: 0;
          font-size: 1.143rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .brand-subtitle {
          margin: 0;
          font-size: 0.786rem;
          color: var(--text-tertiary);
          letter-spacing: 0.3px;
        }
      }
    }

    .sidebar-menu {
      flex: 1;
      // 优化：上下留白更均衡，菜单项不会贴着 header
      padding: 12px 10px 16px;
      overflow-y: auto;

      .menu-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 9px 14px;
        border-radius: 6px;
        font-size: 1rem;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.15s;

        // 👇 关键：相邻菜单项之间留出间距，避免 hover/active 背景连成一片
        & + .menu-item {
          margin-top: 4px;
        }

        .iconfont {
          font-size: 1.286rem;
          color: var(--menu-color, var(--text-tertiary));
          transition:
            color 0.15s,
            transform 0.2s;
        }

        &.active {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-weight: 500;

          .iconfont {
            color: var(--menu-color, var(--text-primary));
          }
        }

        &:hover:not(.active) {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
      }
    }
  }

  // 右侧主内容
  .settings-main {
    flex: 1;
    overflow-y: auto;
    min-width: 0;
    background: var(--bg-primary);
    padding: 0 32px 40px;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--bg-tertiary);
      border-radius: 4px;
    }
  }

  .settings-content {
    max-width: 100%;
  }
}
</style>
