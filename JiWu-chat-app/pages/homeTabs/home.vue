<template>
  <div>
    <section class="welcome-section">
      <div class="brand-header">
        <h1 class="brand-title" aria-label="极物聊天 JiwuChat">极物聊天</h1>
      </div>

      <div class="welcome-content">
        <span class="welcome-desc-highlight">一个轻量的聊天软件</span>
        <p class="welcome-desc">
          基于 Electron + Nuxt3 构建，安装包仅约 10 MB，支持 Windows、macOS、Linux 与 Web。
        </p>

        <div class="download-section">
          <div class="download-actions">
            <div class="download-btn-group">
              <button class="download-btn" @click="handleDownload" :title="currentPlatform.tooltip">
                <i class="iconfont icon-xiazai download-btn-icon"></i>
                <span class="btn-label">{{ currentPlatform.label }}</span>
              </button>
              <div class="download-btn-divider"></div>
              <div class="download-btn-arrow" @click="togglePlatformList">
                <i
                  class="iconfont icon-xialajiantou1"
                  :class="{ 'arrow-rotated': showPlatformList }"
                ></i>
              </div>
            </div>

            <div class="web-badge" @click="openWebLogin">
              <i class="iconfont icon-a-205_keji"></i>
              <span>Web体验</span>
            </div>
          </div>

          <transition name="platform-dropdown">
            <div v-if="showPlatformList" class="platform-list">
              <div
                v-for="platform in otherPlatforms"
                :key="platform.key"
                class="platform-item"
                :title="platform.tooltip"
                @click="handlePlatformDownload(platform)"
              >
                <span class="platform-item-label">{{ platform.filename || platform.label }}</span>
                <i class="iconfont icon-xiazai platform-item-icon"></i>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </section>

    <section class="features-section" id="features">
      <div class="section-header">
        <h3 class="section-title">核心功能</h3>
      </div>
      <div class="features-grid">
        <div
          v-for="(feature, index) in FEATURES"
          :key="index"
          class="feature-card"
          :class="`feature-card--${COLOR_SCHEMES[index % COLOR_SCHEMES.length].name}`"
        >
          <div class="feature-card-inner">
            <div class="feature-icon-wrapper">
              <div class="feature-icon" :style="getFeatureIconStyle(index, isDarkTheme)">
                <i :class="['iconfont', FEATURE_ICONS[index]]"></i>
              </div>
            </div>
            <div class="feature-content">
              <h4 class="feature-title">{{ feature.title }}</h4>
              <p class="feature-desc">{{ feature.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  COLOR_SCHEMES,
  FEATURE_ICONS,
  FEATURES,
  DOWNLOAD_PLATFORMS,
  getFeatureIconStyle,
} from "../../untils/homePageData";
import type { DownloadPlatform } from "../../types/untilsTypes";

const props = defineProps<{
  isDarkTheme: boolean;
}>();

/* --------------------------------------------------------------------------
 * 下载 / 平台切换
 * ------------------------------------------------------------------------ */
const currentPlatform = ref<DownloadPlatform>(DOWNLOAD_PLATFORMS[0]);
const showPlatformList = ref<boolean>(false);

const otherPlatforms = computed<DownloadPlatform[]>(() =>
  DOWNLOAD_PLATFORMS.filter((p: DownloadPlatform) => p.key !== currentPlatform.value.key),
);

function togglePlatformList(): void {
  showPlatformList.value = !showPlatformList.value;
}

function handleDownload(): void {
  const url = currentPlatform.value.downloadUrl;
  if (url && url !== "#") window.open(url, "_blank");
}

function handlePlatformDownload(platform: DownloadPlatform): void {
  const url = platform.downloadUrl;
  if (url && url !== "#") window.open(url, "_blank");
  showPlatformList.value = false;
}

function openWebLogin(): void {
  if (typeof window === "undefined") return;
  window.open("/login", "_blank");
}
</script>

<style scoped>
/* ==========================================================================
 * 阿里巴巴普惠体 3.0 @font-face 声明
 * ======================================================================== */
@font-face {
  font-family: "Alibaba PuHuiTi";
  src:
    url("./font/AlibabaPuHuiTi/AlibabaPuHuiTi-3-115-Black.woff2") format("woff2"),
    url("./font/AlibabaPuHuiTi/AlibabaPuHuiTi-3-115-Black.woff") format("woff");
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Alibaba PuHuiTi";
  src:
    url("./font/AlibabaPuHuiTi/AlibabaPuHuiTi-3-85-Bold.woff2") format("woff2"),
    url("./font/AlibabaPuHuiTi/AlibabaPuHuiTi-3-85-Bold.woff") format("woff");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Alibaba PuHuiTi";
  src:
    url("./font/AlibabaPuHuiTi/AlibabaPuHuiTi-3-55-Regular.woff2") format("woff2"),
    url("./font/AlibabaPuHuiTi/AlibabaPuHuiTi-3-55-Regular.woff") format("woff");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

/* ==========================================================================
 * 布局
 * ======================================================================== */
.brand-header {
  text-align: center;
  padding: 50px 0 60px;
}

.brand-title {
  margin: 0;
  font-family: "Alibaba PuHuiTi", "Segoe UI", system-ui, sans-serif;
  font-size: 80px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: 8px;
  color: var(--text-primary);
  transition: color 0.3s ease;
}

.welcome-section {
  text-align: center;
  padding: 40px 20px 40px;
  margin-bottom: 40px;
}

.welcome-desc-highlight {
  font-size: 20px;
  font-weight: 700;
  font-family: "Courier New", Courier, monospace;
  color: var(--text-primary);
  margin-bottom: 12px;
  transition: color 0.3s ease;
}

.welcome-desc {
  max-width: 700px;
  margin: 0 auto 20px;
  font-size: 16px;
  font-family: "Courier New", Courier, monospace;
  color: var(--text-secondary);
  line-height: 1.6;
  transition: color 0.3s ease;
}

/* ==========================================================================
 * 下载区域
 * ======================================================================== */
.download-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 24px auto 16px;
  position: relative;
  max-width: 480px;
}

.download-actions {
  display: flex;
  align-items: stretch;
  gap: 12px;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.download-btn-group {
  display: flex;
  align-items: stretch;
  background: var(--card-bg);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  transition:
    box-shadow 0.25s ease,
    border-color 0.2s;
  overflow: hidden;
  height: 48px;
  flex-shrink: 0;
}

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 0 20px;
  background: transparent;
  color: var(--text-primary);
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
  letter-spacing: 0.2px;
}

.download-btn:hover {
  color: #5d33f6;
}

.dark .download-btn:hover {
  color: #8b5cf6;
}

.download-btn-icon {
  font-size: 16px;
  color: #5d33f6;
}

.dark .download-btn-icon {
  color: #8b5cf6;
}

.btn-label {
  font-weight: 600;
}

.download-btn-divider {
  width: 1px;
  background: var(--border-color);
  margin: 12px 0;
  align-self: stretch;
}

.download-btn-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  cursor: pointer;
  color: var(--text-primary);
  transition: background 0.2s;
}

.download-btn-arrow .iconfont {
  font-size: 12px;
  transition: transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.download-btn-arrow .arrow-rotated {
  transform: rotate(180deg);
}

.web-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 18px;
  height: 48px;
  background: rgba(93, 51, 246, 0.04);
  border: 1px solid rgba(93, 51, 246, 0.08);
  border-radius: 10px;
  color: #5d33f6;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.dark .web-badge {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.12);
  color: #8b5cf6;
}

.web-badge i {
  font-size: 15px;
}

.platform-list {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  min-width: 180px;
  z-index: 100;
}

.dark .platform-list {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.platform-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  gap: 12px;
}

.platform-item:hover {
  background: rgba(93, 51, 246, 0.05);
}

.dark .platform-item:hover {
  background: rgba(139, 92, 246, 0.06);
}

.platform-item-label {
  flex: 1;
}

.platform-item-icon {
  font-size: 16px;
  color: #5d33f6;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.dark .platform-item-icon {
  color: #8b5cf6;
  opacity: 0.5;
}

.platform-item:hover .platform-item-icon {
  opacity: 1;
}

.platform-dropdown-enter-active {
  transition: all 0.2s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.platform-dropdown-leave-active {
  transition: all 0.15s ease-in;
}

.platform-dropdown-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px) scale(0.96);
}

.platform-dropdown-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-2px) scale(0.98);
}

/* ==========================================================================
 * 核心功能
 * ======================================================================== */
.features-section {
  margin-bottom: 80px;
  padding: 40px 0;
  content-visibility: auto;
  contain-intrinsic-size: 600px;
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-title {
  font-size: 32px;
  font-weight: 900;
  color: var(--text-primary);
  transition: color 0.3s ease;
  font-family: "Alibaba PuHuiTi", Helvetica, sans-serif;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  position: relative;
  background: var(--card-bg);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  overflow: hidden;
  cursor: default;
}

.feature-card-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 20px;
  width: 100%;
  box-sizing: border-box;
}

.feature-icon-wrapper {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.feature-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.feature-icon i {
  font-size: 26px;
  transition: all 0.3s ease;
}

.feature-content {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.feature-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px 0;
  transition: color 0.3s ease;
  font-family: "Alibaba PuHuiTi", Helvetica, sans-serif;
  line-height: 1.3;
}

.feature-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  transition: color 0.3s ease;
  font-weight: 500;
  font-family: "Alibaba PuHuiTi", Helvetica, sans-serif;
  margin: 0;
}

.feature-card--violet .feature-icon i {
  color: #7c3aed;
}
.dark .feature-card--violet .feature-icon {
  background: rgba(124, 58, 237, 0.15);
}
:root:not(.dark) .feature-card--violet .feature-icon {
  background: rgba(124, 58, 237, 0.06);
}

.feature-card--rose .feature-icon i {
  color: #e11d48;
}
.dark .feature-card--rose .feature-icon {
  background: rgba(225, 29, 72, 0.15);
}
:root:not(.dark) .feature-card--rose .feature-icon {
  background: rgba(225, 29, 72, 0.06);
}

.feature-card--amber .feature-icon i {
  color: #d97706;
}
.dark .feature-card--amber .feature-icon {
  background: rgba(217, 119, 6, 0.15);
}
:root:not(.dark) .feature-card--amber .feature-icon {
  background: rgba(217, 119, 6, 0.06);
}

.feature-card--emerald .feature-icon i {
  color: #059669;
}
.dark .feature-card--emerald .feature-icon {
  background: rgba(5, 150, 105, 0.15);
}
:root:not(.dark) .feature-card--emerald .feature-icon {
  background: rgba(5, 150, 105, 0.06);
}

.feature-card--cyan .feature-icon i {
  color: #0891b2;
}
.dark .feature-card--cyan .feature-icon {
  background: rgba(8, 145, 178, 0.15);
}
:root:not(.dark) .feature-card--cyan .feature-icon {
  background: rgba(8, 145, 178, 0.06);
}

.feature-card--indigo .feature-icon i {
  color: #4f46e5;
}
.dark .feature-card--indigo .feature-icon {
  background: rgba(79, 70, 229, 0.15);
}
:root:not(.dark) .feature-card--indigo .feature-icon {
  background: rgba(79, 70, 229, 0.06);
}

.feature-card--fuchsia .feature-icon i {
  color: #c026d3;
}
.dark .feature-card--fuchsia .feature-icon {
  background: rgba(192, 38, 211, 0.15);
}
:root:not(.dark) .feature-card--fuchsia .feature-icon {
  background: rgba(192, 38, 211, 0.06);
}

.feature-card--orange .feature-icon i {
  color: #ea580c;
}
.dark .feature-card--orange .feature-icon {
  background: rgba(234, 88, 12, 0.15);
}
:root:not(.dark) .feature-card--orange .feature-icon {
  background: rgba(234, 88, 12, 0.06);
}

/* ==========================================================================
 * 响应式
 * ======================================================================== */
@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }

  .brand-title {
    font-size: 56px;
    letter-spacing: 5px;
  }

  .feature-card-inner {
    padding: 20px 18px;
    gap: 14px;
  }
}

@media (max-width: 480px) {
  .brand-title {
    font-size: 40px;
    letter-spacing: 3px;
  }

  .feature-icon {
    width: 44px;
    height: 44px;
  }

  .feature-icon i {
    font-size: 22px;
  }

  .feature-title {
    font-size: 16px;
  }

  .feature-desc {
    font-size: 13px;
  }

  .feature-card-inner {
    padding: 16px 14px;
    gap: 12px;
  }
}
</style>
