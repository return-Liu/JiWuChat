<template>
  <div class="tab-content">
    <div class="content-header">
      <div>
        <h3 class="content-title">超级调色盘</h3>
        <p class="content-desc">个性化你的聊天体验，选择喜欢的主题配色方案</p>
      </div>
    </div>

    <!-- 大预览界面 -->
    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">主题效果</span>
        <span class="group-desc">预览当前配色方案的实际效果</span>
      </div>
      <div class="big-preview-wrapper">
        <div class="preview-qq-window">
          <div
            class="preview-titlebar"
            :style="{ background: previewPalette.sidebarBg || previewPalette.color }"
          >
            <div class="titlebar-blocks">
              <div
                class="titlebar-block"
                :style="{ background: previewPalette.sidebarIcon || 'var(--text-tertiary)' }"
              ></div>
              <div
                class="titlebar-block"
                :style="{ background: previewPalette.sidebarIcon || 'var(--text-tertiary)' }"
              ></div>
            </div>
          </div>
          <div class="preview-qq-body">
            <video
              v-if="previewChatBgType === 'video' && previewChatBgVideo"
              class="preview-chat-bg-video"
              :src="encodeURI(previewChatBgVideo)"
              muted
              loop
              autoplay
              playsinline
              preload="metadata"
            ></video>
            <div
              class="preview-icon-nav"
              :style="{
                background: previewIconNavBg,
              }"
            >
              <div class="nav-icon-group top">
                <div class="nav-block active" :style="{ background: previewPalette.color }"></div>
                <div
                  class="nav-block"
                  :style="{
                    background: previewPalette.sidebarIcon || 'var(--text-tertiary)',
                  }"
                ></div>
              </div>
              <div class="nav-icon-group bottom">
                <div
                  class="nav-block"
                  :style="{
                    background: previewPalette.sidebarIcon || 'var(--text-tertiary)',
                  }"
                ></div>
                <div
                  class="nav-block"
                  :style="{
                    background: previewPalette.sidebarIcon || 'var(--text-tertiary)',
                  }"
                ></div>
              </div>
            </div>
            <div
              class="preview-contact-list"
              :style="{
                background: previewContactBg,
              }"
            >
              <div class="contact-search-bar">
                <div
                  class="search-block"
                  :style="{
                    background:
                      previewPalette.sidebarActiveBg ||
                      previewPalette.bgTertiary ||
                      'rgba(0,0,0,0.04)',
                  }"
                ></div>
              </div>
              <div
                v-for="i in 3"
                :key="i"
                class="contact-item"
                :class="{ active: i === 1 }"
                :style="
                  i === 1
                    ? {
                        background:
                          previewPalette.contactItemActive ||
                          previewPalette.sidebarActiveBg ||
                          'rgba(0,0,0,0.04)',
                      }
                    : {}
                "
              >
                <div
                  class="contact-avatar-block"
                  :style="{
                    background:
                      i === 1
                        ? previewPalette.color
                        : previewPalette.sidebarIcon || 'var(--text-tertiary)',
                  }"
                ></div>
                <div class="contact-lines">
                  <div
                    class="contact-line long"
                    :style="{
                      background: previewPalette.textSecondary || 'var(--text-tertiary)',
                    }"
                  ></div>
                  <div
                    class="contact-line short"
                    :style="{
                      background: previewPalette.textSecondary || 'var(--text-tertiary)',
                      opacity: 0.5,
                    }"
                  ></div>
                </div>
              </div>
            </div>
            <div class="preview-chat-area" :style="{ background: previewChatBg }">
              <div class="chat-messages">
                <div class="chat-msg-row left">
                  <div
                    class="msg-avatar-block"
                    :style="{
                      background: previewPalette.sidebarIcon || 'var(--text-tertiary)',
                    }"
                  ></div>
                  <div class="msg-bubble-block" :style="{ background: previewLeftBubbleBg }"></div>
                </div>
                <div class="chat-msg-row right">
                  <div
                    class="msg-bubble-block"
                    :style="{
                      background:
                        previewPalette.bubbleBg || previewPalette.color || 'var(--purple-color)',
                    }"
                  ></div>
                  <div
                    class="msg-avatar-block"
                    :style="{ background: previewPalette.color || 'var(--text-tertiary)' }"
                  ></div>
                </div>
                <div class="chat-msg-row left">
                  <div
                    class="msg-avatar-block"
                    :style="{
                      background: previewPalette.sidebarIcon || 'var(--text-tertiary)',
                    }"
                  ></div>
                  <div
                    class="msg-bubble-block short"
                    :style="{ background: previewLeftBubbleBg }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="preview-side-actions">
          <i
            class="iconfont preview-mode-icon"
            :class="previewThemeMode === 'light' ? 'icon-caozuo-riguang' : 'icon-yueliang1'"
            :title="previewThemeMode === 'light' ? '切换夜间模式' : '切换日间模式'"
            @click="togglePreviewTheme"
          ></i>
        </div>
      </div>
    </div>

    <!-- 精品尝鲜 -->
    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">精品尝鲜</span>
        <span class="group-desc">精选配色，定制你的专属主题</span>
      </div>
      <div class="theme-card-list-inline">
        <div
          class="theme-card-inline"
          v-for="(palette, index) in classicPalettes"
          :key="`classic-${index}`"
          :class="{ active: isThemeActive('classic', index) }"
          @click="selectTheme('classic', index)"
          :style="{ background: palette.previewGradient }"
        >
          <div v-if="palette.isDefault" class="default-badge">默认</div>
          <div class="theme-card-name">{{ palette.name }}</div>
        </div>
      </div>
    </div>

    <!-- 水墨国风 -->
    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">水墨国风</span>
        <span class="group-desc">秋水共长天一色</span>
      </div>
      <div class="theme-card-list-inline">
        <div
          class="theme-card-inline"
          v-for="(palette, index) in inkWashPalettes"
          :key="`ink-${index}`"
          :class="{ active: isThemeActive('inkWash', index) }"
          @click="selectTheme('inkWash', index)"
          :style="{ background: palette.previewGradient }"
        >
          <div class="theme-card-name">{{ palette.name }}</div>
        </div>
      </div>
    </div>
    <!-- 个性装扮 -->
    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">个性装扮</span>
        <span class="group-desc">选择喜欢的个性作为聊天背景</span>
      </div>
      <div class="theme-card-list-inline">
        <div
          class="theme-card-inline dynamic-theme-card"
          :class="{ active: isThemeActive('dynamic', 0) }"
          @click="selectTheme('dynamic', 0)"
        >
          <video
            class="dynamic-theme-preview-img"
            :src="encodeURI(dynamicUrl)"
            muted
            loop
            autoplay
            playsinline
            preload="metadata"
          ></video>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import { useSiderColor } from "../../stores/siderColor";

const siderColorStore = useSiderColor();

// 预览主题切换（仅影响预览窗口的日间/夜间显示）
const previewThemeMode = ref<"light" | "dark">("light");

const togglePreviewTheme = () => {
  const newMode = previewThemeMode.value === "light" ? "dark" : "light";
  previewThemeMode.value = newMode;
  // 🔥 同步到 store，让 Sidebar/ContactList/MessageDisplay 等组件跟随变化
  siderColorStore.setPreviewThemeMode(newMode);
};

// 🔥 离开页面时重置预览模式，恢复正常主题
onUnmounted(() => {
  siderColorStore.setPreviewThemeMode(null);
});

// 大预览界面使用的调色板（当前 store 的实际配色，夜间模式下可能是暗色调色板）
const currentPreviewPalette = computed(() => siderColorStore.currentColorPalette);

// 获取日间调色板（用于预览日间模式时显示正确的浅色背景）
const lightPalette = computed(() => {
  // 如果当前是 system 主题，使用 systemBaseType/systemBaseIndex 对应的日间调色板
  if (siderColorStore.currentThemeType === "system") {
    const palettes = siderColorStore.themePalettes?.[siderColorStore.systemBaseType] ?? [];
    const idx = Math.max(0, Math.min(siderColorStore.systemBaseIndex, palettes.length - 1));
    return palettes[idx] ?? null;
  }
  // 非 system 主题，当前 palette 本身就是日间配色
  return siderColorStore.currentColorPalette;
});

// 夜间预览固定配色
const darkPreviewPalette = {
  color: "#8b5cf6",
  sidebarBg: "#141414",
  sidebarIcon: "#999999",
  sidebarActiveBg: "#1f1f1f",
  sidebarHoverBg: "#262626",
  bgTertiary: "#1f1f1f",
  bgPrimary: "#1a1a1a",
  textSecondary: "#999999",
  textPrimary: "#e5e5e5",
  borderLight: "#2a2a2a",
  contactItemActive: "#1f1f1f",
  contactItemHover: "#262626",
  chatBgStart: "#0d0d0d",
  chatBgGradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)",
  bubbleBg: "#1a1a1a",
  light: "rgba(139, 92, 246, 0.12)",
};

// 根据日间调色板动态生成对应的夜间暗色调色板
const buildDarkPaletteFromLight = (light: any) => {
  // 将日间主题色变暗作为夜间强调色
  const darkenColor = (hex: string, amount: number = 0.6): string => {
    if (!hex || !hex.startsWith("#")) return "#8b5cf6";
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.round(((num >> 16) & 0xff) * amount);
    const g = Math.round(((num >> 8) & 0xff) * amount);
    const b = Math.round((num & 0xff) * amount);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  };

  const themeColor = light?.color || "#8b5cf6";
  const darkenedColor = darkenColor(themeColor, 0.55);

  return {
    // 保留日间主题色（侧边栏图标激活态、头像等保持主题辨识度）
    color: themeColor,
    // 侧边栏：基于日间 sidebarBg 大幅变暗
    sidebarBg: darkenColor(light?.sidebarBg || light?.chatBgStart || "#FAFAFA", 0.08),
    sidebarIcon: darkenColor(light?.sidebarIcon || "#D0D0D0", 0.55),
    sidebarActiveBg: darkenColor(
      light?.sidebarActiveBg || light?.sidebarHoverBg || "#E8E8E8",
      0.12,
    ),
    sidebarHoverBg: darkenColor(light?.sidebarHoverBg || light?.sidebarActiveBg || "#F0F0F0", 0.16),
    bgTertiary: darkenColor(light?.bgTertiary || light?.chatBgStart || "#FEFEFE", 0.1),
    bgPrimary: darkenColor(light?.bgPrimary || light?.chatBgStart || "#FFFFFF", 0.1),
    textSecondary: darkenColor(light?.textSecondary || "#999999", 0.6),
    textPrimary: "#e5e5e5",
    borderLight: darkenColor(light?.borderLight || light?.borderNormal || "#E5E5E5", 0.15),
    contactItemActive: darkenColor(
      light?.contactItemActive || light?.sidebarActiveBg || "#E8E8E8",
      0.12,
    ),
    contactItemHover: darkenColor(
      light?.contactItemHover || light?.sidebarHoverBg || "#F0F0F0",
      0.16,
    ),
    chatBgStart: darkenColor(light?.chatBgStart || "#FEFEFE", 0.06),
    chatBgGradient: `linear-gradient(135deg, ${darkenColor(light?.chatBgStart || "#FEFEFE", 0.06)} 0%, ${darkenColor(light?.chatBgMiddle || light?.chatBgStart || "#F8F8F8", 0.08)} 50%, ${darkenColor(light?.chatBgStart || "#FEFEFE", 0.06)} 100%)`,
    bubbleBg: darkenColor(light?.bubbleBg || light?.bgPrimary || "#FFFFFF", 0.1),
    light: `rgba(${parseInt(themeColor.slice(1, 3), 16)}, ${parseInt(themeColor.slice(3, 5), 16)}, ${parseInt(themeColor.slice(5, 7), 16)}, 0.12)`,
  };
};

// 预览窗口实际使用的调色板：根据 previewThemeMode 切换日间/夜间配色
const previewPalette = computed(() => {
  if (previewThemeMode.value === "dark") {
    const light = lightPalette.value || currentPreviewPalette.value;
    const dark = buildDarkPaletteFromLight(light);
    return { ...light, ...dark };
  }
  return lightPalette.value || currentPreviewPalette.value;
});

// 预览聊天区是否使用视频背景（个性装扮）
const previewChatBgType = computed(() => (previewPalette.value as any).chatBgType);
const previewChatBgVideo = computed(() => (previewPalette.value as any).chatBgVideo || "");

// 是否展示个性装扮视频背景
const isVideoBackground = computed(
  () => previewChatBgType.value === "video" && !!previewChatBgVideo.value,
);

// 根据预览模式计算聊天区背景（个性装扮视频背景时透明，让视频透出）
const previewChatBg = computed(() => {
  if (isVideoBackground.value) {
    return "transparent";
  }
  return previewPalette.value.chatBgGradient;
});

// 根据预览模式计算联系人列表背景（个性装扮视频背景时半透明，露出视频）
const previewContactBg = computed(() => {
  if (isVideoBackground.value) {
    return "rgba(255, 255, 255, 0.35)";
  }
  const p = previewPalette.value;
  if (previewThemeMode.value === "dark") {
    return "#1e1e2e";
  }
  return p.chatBgStart ? `${p.chatBgStart}F2` : `${p.color}06`;
});

// 根据预览模式计算侧边栏图标导航背景（个性装扮视频背景时半透明，露出视频）
const previewIconNavBg = computed(() => {
  if (isVideoBackground.value) {
    return "rgba(255, 255, 255, 0.35)";
  }
  return previewPalette.value.sidebarBg || previewPalette.value.color;
});

// 根据预览模式计算左侧气泡背景
const previewLeftBubbleBg = computed(() => {
  const p = previewPalette.value;
  if (previewThemeMode.value === "dark") {
    return "#2a2a3e";
  }
  return p.bgPrimary || p.light || "var(--bg-tertiary)";
});

// 精品尝鲜 & 水墨国风
const classicPalettes = computed(() => {
  return (siderColorStore.themePalettes?.classic || []).map((p: any, i: number) => ({
    ...p,
    previewGradient: p.chatBgGradient || p.sidebarBg,
    isDefault: i === 0,
  }));
});

const inkWashPalettes = computed(() => {
  return (siderColorStore.themePalettes?.inkWash || []).map((p: any) => ({
    ...p,
    previewGradient: p.chatBgGradient || p.sidebarBg,
  }));
});

// 个性装扮 —— 默认视频壁纸路径
const dynamicUrl =
  "/theme/4k石昊动态壁纸｜水墨风云海对战场景背景视频 - 完美世界国漫「哲风壁纸」.mp4";
("/theme/3k蓝发美女蒙眼动态壁纸｜雪花雪景背景 - 动漫人物「哲风壁纸」.mp4");

const isThemeActive = (type: string, index: number) => {
  if (siderColorStore.currentThemeType === "system") {
    return siderColorStore.systemBaseType === type && siderColorStore.systemBaseIndex === index;
  }
  return siderColorStore.currentThemeType === type && siderColorStore.currentPaletteIndex === index;
};

const selectTheme = (type: string, index: number) => {
  if (siderColorStore.currentThemeType === "system") {
    siderColorStore.updateSystemBase(type as any, index);
  } else {
    siderColorStore.setTheme(type as any, index);
  }
};
</script>
