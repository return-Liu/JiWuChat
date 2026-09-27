<template>
  <div class="tab-content">
    <div class="content-header">
      <div>
        <h3 class="content-title">外观</h3>
        <p class="content-desc">自定义主题模式、字体大小和界面风格</p>
      </div>
    </div>

    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">主题模式</span>
        <span class="group-desc">日间模式 / 夜间模式 / 夜间模式跟随系统</span>
      </div>
      <div class="theme-preview-cards">
        <!-- 日间模式卡片 -->
        <div class="theme-preview-item" @click="handleThemeModeChange('light', $event)">
          <div class="theme-preview-card" :class="{ active: currentThemeMode === 'light' }">
            <div class="tpc-window">
              <div
                class="tpc-titlebar"
                :style="{ background: sysLightPalette?.sidebarBg || 'var(--bg-secondary)' }"
              >
                <span
                  class="tpc-dot"
                  :style="{ background: sysLightPalette?.sidebarIcon || 'var(--text-tertiary)' }"
                ></span>
                <span
                  class="tpc-dot"
                  :style="{ background: sysLightPalette?.sidebarIcon || 'var(--text-tertiary)' }"
                ></span>
              </div>
              <div class="tpc-body">
                <div
                  class="tpc-nav"
                  :style="{ background: sysLightPalette?.sidebarBg || 'var(--bg-secondary)' }"
                >
                  <span
                    class="tpc-nav-dot active"
                    :style="{ background: sysLightPalette?.color || 'var(--text-tertiary)' }"
                  ></span>
                  <span
                    class="tpc-nav-dot"
                    :style="{ background: sysLightPalette?.sidebarIcon || 'var(--text-tertiary)' }"
                  ></span>
                  <span
                    class="tpc-nav-dot"
                    :style="{ background: sysLightPalette?.sidebarIcon || 'var(--text-tertiary)' }"
                  ></span>
                  <span
                    class="tpc-nav-dot"
                    :style="{ background: sysLightPalette?.sidebarIcon || 'var(--text-tertiary)' }"
                  ></span>
                </div>
                <div
                  class="tpc-list"
                  :style="{
                    background: (sysLightPalette?.chatBgStart || 'var(--bg-secondary)') + 'F2',
                  }"
                >
                  <span
                    class="tpc-search"
                    :style="{ background: sysLightPalette?.bgTertiary || 'rgba(0,0,0,0.04)' }"
                  ></span>
                  <div
                    class="tpc-contact active"
                    :style="{
                      background:
                        sysLightPalette?.contactItemActive ||
                        sysLightPalette?.sidebarActiveBg ||
                        'rgba(0,0,0,0.04)',
                    }"
                  >
                    <span
                      class="tpc-avatar"
                      :style="{ background: sysLightPalette?.color || 'var(--text-tertiary)' }"
                    ></span>
                    <span
                      class="tpc-line"
                      :style="{
                        background: sysLightPalette?.textSecondary || 'var(--text-tertiary)',
                      }"
                    ></span>
                  </div>
                  <div class="tpc-contact">
                    <span
                      class="tpc-avatar"
                      :style="{
                        background: sysLightPalette?.sidebarIcon || 'var(--text-tertiary)',
                      }"
                    ></span>
                    <span
                      class="tpc-line"
                      :style="{
                        background: sysLightPalette?.textSecondary || 'var(--text-tertiary)',
                        opacity: 0.5,
                      }"
                    ></span>
                  </div>
                </div>
                <div
                  class="tpc-chat"
                  :style="{ background: sysLightPalette?.chatBgGradient || 'var(--bg-secondary)' }"
                >
                  <div class="tpc-msg left">
                    <span
                      class="tpc-avatar"
                      :style="{
                        background: sysLightPalette?.sidebarIcon || 'var(--text-tertiary)',
                      }"
                    ></span>
                    <span
                      class="tpc-bubble"
                      :style="{
                        background:
                          sysLightPalette?.bgPrimary || sysLightPalette?.light || 'var(--card-bg)',
                      }"
                    ></span>
                  </div>
                  <div class="tpc-msg right">
                    <span
                      class="tpc-bubble"
                      :style="{ background: sysLightPalette?.bubbleBg || 'var(--card-bg)' }"
                    ></span>
                    <span
                      class="tpc-avatar"
                      :style="{ background: sysLightPalette?.color || 'var(--text-tertiary)' }"
                    ></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <span class="tpc-label">日间模式</span>
        </div>

        <!-- 夜间模式卡片 -->
        <div class="theme-preview-item" @click="handleThemeModeChange('dark', $event)">
          <div class="theme-preview-card" :class="{ active: currentThemeMode === 'dark' }">
            <div class="tpc-window">
              <div
                class="tpc-titlebar"
                :style="{ background: sysDarkPalette?.sidebarBg || 'var(--bg-secondary)' }"
              >
                <span class="tpc-dot" :style="{ background: 'var(--text-secondary)' }"></span>
                <span class="tpc-dot" :style="{ background: 'var(--text-secondary)' }"></span>
              </div>
              <div class="tpc-body">
                <div
                  class="tpc-nav"
                  :style="{ background: sysDarkPalette?.sidebarBg || 'var(--bg-secondary)' }"
                >
                  <span
                    class="tpc-nav-dot active"
                    :style="{ background: sysDarkPalette?.color || 'var(--purple-color)' }"
                  ></span>
                  <span class="tpc-nav-dot" :style="{ background: 'var(--text-secondary)' }"></span>
                  <span class="tpc-nav-dot" :style="{ background: 'var(--text-secondary)' }"></span>
                  <span class="tpc-nav-dot" :style="{ background: 'var(--text-secondary)' }"></span>
                </div>
                <div
                  class="tpc-list"
                  :style="{
                    background: (sysDarkPalette?.chatBgStart || 'var(--bg-primary)') + 'F2',
                  }"
                >
                  <span class="tpc-search" :style="{ background: 'var(--bg-tertiary)' }"></span>
                  <div class="tpc-contact active" :style="{ background: 'var(--bg-tertiary)' }">
                    <span
                      class="tpc-avatar"
                      :style="{ background: sysDarkPalette?.color || 'var(--purple-color)' }"
                    ></span>
                    <span class="tpc-line" :style="{ background: 'var(--text-secondary)' }"></span>
                  </div>
                  <div class="tpc-contact">
                    <span
                      class="tpc-avatar"
                      :style="{ background: 'var(--text-secondary)' }"
                    ></span>
                    <span class="tpc-line" :style="{ background: 'var(--text-secondary)' }"></span>
                  </div>
                </div>
                <div
                  class="tpc-chat"
                  :style="{ background: sysDarkPalette?.chatBgGradient || 'var(--card-bg)' }"
                >
                  <div class="tpc-msg left">
                    <span
                      class="tpc-avatar"
                      :style="{ background: 'var(--text-secondary)' }"
                    ></span>
                    <span
                      class="tpc-bubble"
                      :style="{
                        background:
                          sysDarkPalette?.bgPrimary ||
                          sysDarkPalette?.light ||
                          'var(--border-color)',
                      }"
                    ></span>
                  </div>
                  <div class="tpc-msg right">
                    <span
                      class="tpc-bubble"
                      :style="{ background: sysDarkPalette?.bubbleBg || 'var(--card-bg)' }"
                    ></span>
                    <span
                      class="tpc-avatar"
                      :style="{ background: sysDarkPalette?.color || 'var(--purple-color)' }"
                    ></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <span class="tpc-label">夜间模式</span>
        </div>

        <!-- 夜间模式跟随系统卡片 -->
        <div class="theme-preview-item" @click="handleThemeModeChange('system', $event)">
          <div class="theme-preview-card" :class="{ active: currentThemeMode === 'system' }">
            <div class="tpc-window" style="flex-direction: row">
              <div class="tpc-window" style="flex: 1; border-radius: 0; border: none">
                <div
                  class="tpc-titlebar"
                  :style="{ background: sysLightPalette?.sidebarBg || 'var(--bg-secondary)' }"
                >
                  <span
                    class="tpc-dot"
                    :style="{ background: sysLightPalette?.sidebarIcon || 'var(--text-tertiary)' }"
                  ></span>
                </div>
                <div class="tpc-body">
                  <div
                    class="tpc-nav"
                    :style="{ background: sysLightPalette?.sidebarBg || 'var(--bg-secondary)' }"
                  >
                    <span
                      class="tpc-nav-dot active"
                      :style="{ background: sysLightPalette?.color || 'var(--text-tertiary)' }"
                    ></span>
                    <span
                      class="tpc-nav-dot"
                      :style="{
                        background: sysLightPalette?.sidebarIcon || 'var(--text-tertiary)',
                      }"
                    ></span>
                  </div>
                  <div
                    class="tpc-list"
                    :style="{
                      background: (sysLightPalette?.chatBgStart || 'var(--bg-secondary)') + 'F2',
                    }"
                  >
                    <span
                      class="tpc-search"
                      :style="{ background: sysLightPalette?.bgTertiary || 'rgba(0,0,0,0.04)' }"
                    ></span>
                    <div
                      class="tpc-contact active"
                      :style="{
                        background:
                          sysLightPalette?.contactItemActive ||
                          sysLightPalette?.sidebarActiveBg ||
                          'rgba(0,0,0,0.04)',
                      }"
                    >
                      <span
                        class="tpc-avatar"
                        :style="{ background: sysLightPalette?.color || 'var(--text-tertiary)' }"
                      ></span>
                    </div>
                  </div>
                  <div
                    class="tpc-chat"
                    :style="{
                      background: sysLightPalette?.chatBgGradient || 'var(--bg-secondary)',
                    }"
                  >
                    <div class="tpc-msg right">
                      <span
                        class="tpc-bubble"
                        :style="{ background: sysLightPalette?.bubbleBg || 'var(--card-bg)' }"
                      ></span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="tpc-window" style="flex: 1; border-radius: 0; border: none">
                <div
                  class="tpc-titlebar"
                  :style="{ background: sysDarkPalette?.sidebarBg || 'var(--bg-secondary)' }"
                >
                  <span class="tpc-dot" :style="{ background: 'var(--text-secondary)' }"></span>
                </div>
                <div class="tpc-body">
                  <div
                    class="tpc-nav"
                    :style="{ background: sysDarkPalette?.sidebarBg || 'var(--bg-secondary)' }"
                  >
                    <span
                      class="tpc-nav-dot"
                      :style="{ background: 'var(--text-secondary)' }"
                    ></span>
                    <span
                      class="tpc-nav-dot active"
                      :style="{ background: sysDarkPalette?.color || 'var(--purple-color)' }"
                    ></span>
                  </div>
                  <div
                    class="tpc-list"
                    :style="{
                      background: (sysDarkPalette?.chatBgStart || 'var(--bg-primary)') + 'F2',
                    }"
                  >
                    <span class="tpc-search" :style="{ background: 'var(--bg-tertiary)' }"></span>
                    <div class="tpc-contact active" :style="{ background: 'var(--bg-tertiary)' }">
                      <span
                        class="tpc-avatar"
                        :style="{ background: sysDarkPalette?.color || 'var(--purple-color)' }"
                      ></span>
                    </div>
                  </div>
                  <div
                    class="tpc-chat"
                    :style="{ background: sysDarkPalette?.chatBgGradient || 'var(--card-bg)' }"
                  >
                    <div class="tpc-msg left">
                      <span
                        class="tpc-bubble"
                        :style="{
                          background:
                            sysDarkPalette?.bgPrimary ||
                            sysDarkPalette?.light ||
                            'var(--border-color)',
                        }"
                      ></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <span class="tpc-label">夜间模式跟随系统</span>
        </div>
      </div>
    </div>

    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">字体</span>
        <span class="group-desc">调整聊天字体大小和样式</span>
      </div>
      <div class="setting-item font-setting-item">
        <div class="font-controls">
          <FontPreview v-model="fontSettings" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useUiSettings } from "../../stores/uiSettings";
import { useTheme } from "../../composables/useTheme";
import { useSiderColor } from "../../stores/siderColor";
import FontPreview from "../FontPreview.vue";

const uiSettingsStore = useUiSettings();
const { setThemeMode, toggleTheme } = useTheme();
const siderColorStore = useSiderColor();

// 系统主题预览卡片配色
const sysLightPalette = computed(() => {
  const palettes =
    siderColorStore.themePalettes?.[siderColorStore.systemBaseType] ||
    siderColorStore.themePalettes?.classic ||
    [];
  return palettes[0] || siderColorStore.currentColorPalette;
});

const sysDarkPalette = computed(() => ({
  sidebarBg: "#141414",
  color: "#8b5cf6",
  bubbleBg: "#1a1a1a",
  bgPrimary: "#1a1a1a",
  light: "rgba(139, 92, 246, 0.12)",
  chatBgGradient: "linear-gradient(135deg, #0d0d0d 0%, #141414 50%, #0d0d0d 100%)",
  chatBgStart: "#0d0d0d",
}));

// ===== 主题相关 =====
const currentThemeMode = ref<"light" | "dark" | "system">(
  (typeof window !== "undefined" && (localStorage.getItem("theme-mode") as any)) || "light",
);

const handleThemeModeChange = (val: "light" | "dark" | "system", event?: MouseEvent) => {
  if (val === "system") {
    setThemeMode("system");
  } else {
    toggleTheme(event, val === "dark");
  }
  currentThemeMode.value = val;
};

// ===== 字体设置 =====
const fontSettings = computed({
  get: () => ({
    fontSize: uiSettingsStore.fontSizeNumber,
    fontFamily: uiSettingsStore.fontFamily,
  }),
  set: (val) => {
    const size = String(val.fontSize);
    if (size !== uiSettingsStore.fontSize || val.fontFamily !== uiSettingsStore.fontFamily) {
      uiSettingsStore.setFontSettings({
        fontSize: size,
        fontFamily: val.fontFamily,
      });
    }
  },
});
</script>
