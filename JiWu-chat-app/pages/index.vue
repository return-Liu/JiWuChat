<template>
  <a-layout class="app-container" :class="{ 'home-dark': homeDark }">
    <a-layout-header class="app-header" :class="{ 'header-scrolled': isScrolled }">
      <div class="header-wrapper">
        <div class="brand-logo">
          <div class="logo-icon">
            <img src="../public/logo.png" alt="logo" />
          </div>
          <h3 class="logo-text">{{ $t("header.brand") }}</h3>
        </div>

        <div class="action-section">
          <!-- 搜索框 -->
          <div class="search-wrapper">
            <div
              class="search-box"
              :class="{ 'search-active': isSearchPanelVisible }"
              @click="openSearchPanel"
            >
              <i class="search-icon iconfont icon-sousuo"></i>
              <span class="search-placeholder">{{ $t("header.search.placeholder") }}</span>
              <kbd class="search-shortcut">{{ $t("header.search.shortcut") }}</kbd>
            </div>
          </div>

          <div class="nav-tabs">
            <router-link
              v-for="tab in tabs"
              :key="tab.key"
              class="func-link"
              :class="{ 'tab-active': activeTab === tab.key }"
              :to="tab.path"
              @click="switchTab(tab.key)"
            >
              <h3 class="link-label">{{ tab.label }}</h3>
            </router-link>

            <!-- 更新日志 - 跳转到 GitHub commits 展示页 -->
            <a class="func-link changelog-link" @click="goToChangelog">
              <h3 class="link-label">{{ $t("header.nav.changelog") }}</h3>
            </a>

            <!-- 生态 - 作为导航标签 -->
            <div class="eco-wrapper" @click.stop="toggleEcoMenu">
              <div class="eco-toggle-btn" :class="{ 'eco-active': isEcoMenuOpen }">
                <span class="eco-label">{{ $t("header.eco.label") }}</span>
                <i
                  class="iconfont icon-xiajiantou eco-arrow"
                  :class="{ 'eco-arrow-open': isEcoMenuOpen }"
                ></i>
              </div>

              <!-- 生态下拉菜单 -->
              <transition name="eco-dropdown">
                <div v-if="isEcoMenuOpen" class="eco-dropdown">
                  <router-link
                    v-for="item in ecoItems"
                    :key="item.value"
                    class="eco-dropdown-item"
                    :class="{ 'eco-dropdown-item-active': currentEco === item.value }"
                    :to="item.path"
                    @click="switchEco(item.value)"
                  >
                    <div class="eco-dropdown-item-content">
                      <i :class="['iconfont', item.icon, 'eco-item-icon']"></i>
                      <span>{{ $t(item.i18nKey) }}</span>
                    </div>
                    <i v-if="currentEco === item.value" class="iconfont icon-duihao eco-check"></i>
                  </router-link>
                </div>
              </transition>
            </div>
          </div>

          <!-- 分割线 -->
          <div class="divider-line"></div>

          <!-- 语言切换 -->
          <div class="lang-wrapper" @click.stop="toggleLangMenu">
            <div class="lang-toggle-btn">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                class="lang-icon"
              >
                <path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" />
              </svg>
              <i
                class="iconfont icon-xiajiantou lang-arrow"
                :class="{ 'lang-arrow-open': isLangMenuOpen }"
              ></i>
            </div>

            <!-- 语言下拉菜单 -->
            <transition name="lang-dropdown">
              <div v-if="isLangMenuOpen" class="lang-dropdown">
                <div
                  v-for="lang in languages"
                  :key="lang.value"
                  class="lang-dropdown-item"
                  :class="{ 'lang-dropdown-item-active': currentLang === lang.value }"
                  @click="switchLanguage(lang.value)"
                >
                  <span>{{ lang.label }}</span>
                  <i v-if="currentLang === lang.value" class="iconfont icon-duihao lang-check"></i>
                </div>
              </div>
            </transition>
          </div>

          <!-- 分割线 -->
          <div class="divider-line"></div>

          <!-- 主题切换按钮 -->
          <div class="theme-toggle-wrapper" @click="handleToggleTheme">
            <div class="theme-toggle-btn">
              <i
                class="theme-icon iconfont"
                view-transition-name="theme-toggle"
                :title="isDarkTheme ? $t('header.theme.light') : $t('header.theme.dark')"
                :class="isDarkTheme ? 'icon-caozuo-riguang' : 'icon-yueliang1'"
              ></i>
            </div>
          </div>

          <!-- 分割线 -->
          <div class="divider-line"></div>

          <!-- GitHub 链接 -->
          <router-link to="/github" class="github-wrapper" @click="openGitHub">
            <div class="github-btn">
              <i class="iconfont icon-GitHub github-icon"></i>
            </div>
          </router-link>
        </div>
      </div>
    </a-layout-header>

    <a-layout-content class="main-content">
      <Home v-if="activeTab === TAB_KEYS.home" :is-dark-theme="isDarkTheme" />
      <section v-if="activeTab === TAB_KEYS.start" class="docs-page">
        <DocsContent />
      </section>
      <section v-if="activeTab === TAB_KEYS.pricing" class="pricing-section">
        <PricingContent />
      </section>
      <Chat v-if="activeTab === TAB_KEYS.experience" />
      <section v-if="activeTab === TAB_KEYS.jiwu_story" class="jiwu_story-section">
        <JiwuStoryContent />
      </section>
    </a-layout-content>

    <a-layout-footer class="footer-section">
      <span class="footer-text">{{ $t("footer.copyright", { year: currentYear }) }}</span>
    </a-layout-footer>

    <!-- 搜索弹窗 -->
    <div v-if="isSearchPanelVisible" class="search-overlay" @click="closeSearchPanel">
      <div class="search-modal" @click.stop>
        <div class="search-modal-body">
          <div class="search-input-wrap">
            <i class="search-modal-icon iconfont icon-sousuo"></i>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="search-modal-input"
              :placeholder="$t('header.search.modalPlaceholder')"
              autofocus
              @input="handleSearchInput"
            />
            <kbd class="search-esc">ESC</kbd>
          </div>

          <div class="search-divider"></div>

          <!-- 搜索结果列表 -->
          <div v-if="searchQuery.trim()" class="search-results">
            <div v-if="filteredSearchResults.length > 0" class="search-results-list">
              <div
                v-for="(result, idx) in filteredSearchResults"
                :key="idx"
                class="search-result-item"
                @click="handleSearchResultClick(result)"
              >
                <i v-if="result.icon" :class="['iconfont', result.icon, 'search-result-icon']"></i>
                <div class="search-result-content">
                  <span class="search-result-label">{{ result.label }}</span>
                  <span class="search-result-desc">{{ result.desc }}</span>
                </div>
              </div>
            </div>
            <div v-else class="search-no-results">
              <span>{{ $t("header.search.noResults") }}</span>
            </div>
          </div>

          <!-- 默认提示 -->
          <div v-else class="search-hints">
            <div class="hint-group">
              <span class="hint-key iconfont icon-xiangshangjiantou"></span>
              <span class="hint-key iconfont icon-xiangxiajiantou"></span>
              <span class="hint-text">{{ $t("header.search.navigate") }}</span>
            </div>
            <div class="hint-group">
              <span class="hint-key">↵</span>
              <span class="hint-text">{{ $t("header.search.select") }}</span>
            </div>
            <div class="hint-group">
              <span class="hint-key">esc</span>
              <span class="hint-text">{{ $t("header.search.close") }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import pkg from "../package.json";
// 显式导入页面组件（pages/ 目录不会被 Nuxt components 自动导入扫描）
import Home from "./homeTabs/home.vue";
import Chat from "./homeTabs/Chat.vue";
// 显式导入并重命名（自动导入名为 JiwuStoryContent，模板中为小写 jiwu_storyContent）
import JiwuStoryContent from "../components/jiwu_storyContent.vue";

const { t, locale } = useI18n();
const router = useRouter();

// 🔥 首页主题独立：使用独立存储键 home-theme + 独立 class home-dark，
//    不再复用 useTheme 的 theme-mode / html.dark，避免与设置页主题互相影响。
const HOME_THEME_KEY = "home-theme";
const homeDark = ref<boolean>(false);
const isDarkTheme = computed(() => homeDark.value);

interface DocumentWithViewTransition extends Document {
  startViewTransition?: (callback: () => Promise<void> | void) => any;
}

let isThemeAnimating = false;
let latestThemeTransitionId = 0;

function supportsViewTransition() {
  if (typeof window === "undefined") return false;
  const doc = document as DocumentWithViewTransition;
  return (
    typeof doc.startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function initHomeTheme() {
  if (typeof window === "undefined") return;
  const saved = localStorage.getItem(HOME_THEME_KEY);
  homeDark.value = saved === "dark";
}

function applyHomeDark(willBeDark: boolean) {
  homeDark.value = willBeDark;
  if (typeof window !== "undefined") {
    localStorage.setItem(HOME_THEME_KEY, willBeDark ? "dark" : "light");
  }
}

function toggleHomeTheme(event?: MouseEvent) {
  if (isThemeAnimating) return;

  const willBeDark = !homeDark.value;

  // 不支持 View Transition 或没有事件坐标时，直接切换（无动画）
  if (!supportsViewTransition() || !event) {
    applyHomeDark(willBeDark);
    return;
  }

  isThemeAnimating = true;

  const { clientX: x, clientY: y } = event;
  const { innerWidth: w, innerHeight: h } = window;

  const endRadius = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
  const ratioX = (100 * x) / w;
  const ratioY = (100 * y) / h;
  const referR = Math.hypot(w, h) / Math.SQRT2;
  const ratioR = (100 * endRadius) / referR;

  const transitionId = ++latestThemeTransitionId;
  const root = document.documentElement;

  root.dataset.themeTransition = willBeDark ? "to-dark" : "to-light";
  root.style.setProperty("--theme-transition-x", `${ratioX}%`);
  root.style.setProperty("--theme-transition-y", `${ratioY}%`);
  root.style.setProperty("--theme-transition-radius", `${ratioR}%`);

  const doc = document as DocumentWithViewTransition;

  const transition = doc.startViewTransition!(async () => {
    applyHomeDark(willBeDark);
    await nextTick();
  });

  transition.finished.finally(() => {
    if (transitionId !== latestThemeTransitionId) return;
    delete root.dataset.themeTransition;
    root.style.removeProperty("--theme-transition-x");
    root.style.removeProperty("--theme-transition-y");
    root.style.removeProperty("--theme-transition-radius");
    isThemeAnimating = false;
  });
}

const appVersion = pkg?.version || "2.1.4";
const TAB_KEYS = {
  home: "",
  start: "docs/start.html",
  pricing: "pricing.html",
  experience: "chat.html",
  jiwu_story: "jiwu_story.html",
  changelog: `version/${appVersion}.html`,
} as const;

// 添加"极物聊天故事"菜单项 - 使用 computed 支持国际化
const tabs = computed(() => [
  { key: TAB_KEYS.home, path: "/", label: t("header.nav.home") },
  { key: TAB_KEYS.start, path: "/docs/start.html", label: t("header.nav.start") },
  { key: TAB_KEYS.pricing, path: "/pricing.html", label: t("header.nav.pricing") },
  { key: TAB_KEYS.experience, path: "/chat.html", label: t("header.nav.chat") },
  { key: TAB_KEYS.jiwu_story, path: "/jiwu_story.html", label: t("header.nav.jiwu_story") },
]);

const activeTab = ref<string>(TAB_KEYS.home);
const isSearchPanelVisible = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);

// ===== 生态切换 =====
type EcoType = "circle" | "electron" | "admin";

const ecoItems = [
  {
    value: "circle",
    label: "极物圈",
    i18nKey: "header.eco.circle",
    path: "/eco/circle",
    icon: "icon-shequ",
  },
  {
    value: "electron",
    label: "极物聊天(Electron)",
    i18nKey: "header.eco.electron",
    path: "/eco/electron",
    icon: "icon-dianzi",
  },
  {
    value: "admin",
    label: "极物后台系统",
    i18nKey: "header.eco.admin",
    path: "/eco/admin",
    icon: "icon-houtai",
  },
];

const currentEco = ref<EcoType>("circle");
const isEcoMenuOpen = ref(false);

function toggleEcoMenu() {
  isEcoMenuOpen.value = !isEcoMenuOpen.value;
}

function switchEco(value: EcoType) {
  currentEco.value = value;
  isEcoMenuOpen.value = false;
  console.log("切换到生态:", value);
}

// ===== 语言切换 =====
type LangType = "zh" | "en";

const languages = [
  { value: "zh", label: "简体中文" },
  { value: "en", label: "English" },
];

const currentLang = ref<LangType>("zh");
const isLangMenuOpen = ref(false);

function toggleLangMenu() {
  isLangMenuOpen.value = !isLangMenuOpen.value;
}

function switchLanguage(lang: LangType) {
  currentLang.value = lang;
  locale.value = lang;
  isLangMenuOpen.value = false;
  // 持久化语言选择
  if (typeof window !== "undefined") {
    localStorage.setItem("jiwu-lang", lang);
  }
}

// 点击外部关闭菜单
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest(".eco-wrapper")) {
    isEcoMenuOpen.value = false;
  }
  if (!target.closest(".lang-wrapper")) {
    isLangMenuOpen.value = false;
  }
}

function getTabFromHash(): string {
  const hash = window.location.hash.replace("#", "");
  if (!hash) return TAB_KEYS.home;
  const tab = tabs.value.find((t) => t.key === hash);
  return tab ? tab.key : TAB_KEYS.home;
}

function switchTab(key: string) {
  activeTab.value = key;
  const tab = tabs.value.find((t) => t.key === key);
  if (tab && key === TAB_KEYS.home) {
    history.replaceState(null, "", window.location.pathname);
  } else if (tab) {
    window.location.hash = key;
  }
}

function onHashChange() {
  activeTab.value = getTabFromHash();
}

// ===== 搜索功能 =====
const searchQuery = ref("");

interface SearchResult {
  label: string;
  desc: string;
  icon: string;
  action: () => void;
}

// 构建可搜索的索引数据（覆盖 index.vue 中所有 import 的组件/模块 + 页面功能）
const searchIndexData = computed<SearchResult[]>(() => {
  const items: SearchResult[] = [];

  // ========== 页面导航标签（完整组件内容） ==========
  // 首页 → pages/homeTabs/home.vue
  items.push({
    label: t("header.nav.home"),
    desc: "一个轻量的聊天软件。基于 Electron + Nuxt3 构建，安装包仅约 10 MB，支持 Windows、macOS、Linux 与 Web。核心功能：多平台下载、Web体验入口、消息收发、文件传输、音视频通话、群组管理、AI群聊机器人、屏幕共享、端到端加密、多端数据同步、个性化主题切换。",
    icon: "",
    action: () => {
      switchTab(TAB_KEYS.home);
      closeSearchPanel();
    },
  });
  // 开始 → components/DocsContent.vue
  items.push({
    label: t("header.nav.start"),
    desc: "极物聊天 Electron APP。JiwuChat 是一款基于 Electron 和 Nuxt3 构建的轻量(~10MB)多平台聊天应用，具备多种实时消息、AI 群聊机器人（讯飞星火、KimiAI等已接入）、WebRTC 音视频通话、屏幕共享以及 AI 购物功能。支持无缝跨设备通信，涵盖文本、图片、文件和语音等多种消息，还支持群聊和可定制化设置。提供浅色/深色模式。一套代码多端适配。项目特点：轻量化安装包仅约5MB、跨平台支持 Windows/macOS/Linux 桌面端和 Web 端、实时消息文本图片文件语音、音视频通话基于 WebRTC 低延迟高清晰度、屏幕共享一键共享适合远程协作、AI 群聊机器人支持 DeepSeek/讯飞星火/KimiAI、AI 购物内置商城系统、社区系统帖子发布评论互动、端到端加密消息文件全程加密、多端数据同步聊天记录联系人跨设备自动同步、个性化主题浅色深色模式。如何开始：Node >= 18，pnpm install 安装依赖，pnpm run dev:nuxt 启动 nuxt，pnpm run dev:electron 启动 electron。构建：pnpm run build:nuxt 或 pnpm generate 打包，pnpm run build:electron 打包桌面端。技术栈：前端 Vue3+Nuxt3+Electron+TypeScript+Ant Design Vue+Socket.IO Client+PeerJS+Pinia+Vue I18n+SCSS，后端 Node.js+Express+Sequelize+MySQL+Socket.IO+WebRTC+JWT+Multer+Sharp+Nodemailer。",
    icon: "",
    action: () => {
      switchTab(TAB_KEYS.start);
      closeSearchPanel();
    },
  });
  // 定价 → components/PricingContent.vue
  items.push({
    label: t("header.nav.pricing"),
    desc: "透明定价 · 一次性授权。选择适合您的授权方案。基于 Electron + Nuxt3 构建的跨平台即时通讯应用，体积约 10MB，一次性付款后续版本免费获取。基础授权 ¥899：个人开发者或小团队自用，获得完整源码与自部署权限，含 14 天部署咨询。商业授权 ¥3000（推荐）：支持二次开发与商业分发，适合将源码集成至自身产品的企业或团队，含 1 个月部署咨询。旗舰版本：集成 AI 能力、商城与社区等完整系统，适合打造独立平台或企业级产品，按需报价联系获取方案。常见问题帮助您快速了解授权政策。联系 QQ：2286223728。",
    icon: "",
    action: () => {
      switchTab(TAB_KEYS.pricing);
      closeSearchPanel();
    },
  });
  // 体验 → pages/homeTabs/Chat.vue
  items.push({
    label: t("header.nav.chat"),
    desc: "极物聊天测试版。极物聊天，不止于聊天 · 让沟通更简单。支持音视频通话、消息收发、文件传输、群组管理、表情包、消息撤回、消息转发。功能状态：音视频通话体验版不可用、QQ授权体验版不可用、微信登录体验版不可用、手机号绑定测试中、群组管理可用、文件传输限10MB、消息撤回可用、表情包可用、消息转发测试中。基于 Electron + Nuxt3 构建的轻量级多平台聊天应用。下载 APP 获取完整功能体验。",
    icon: "",
    action: () => {
      switchTab(TAB_KEYS.experience);
      closeSearchPanel();
    },
  });
  // 关于 → components/jiwu_storyContent.vue
  items.push({
    label: t("header.nav.jiwu_story"),
    desc: "极物聊天故事。基于 Electron + Nuxt3 的轻量级跨平台即时通讯应用。功能概览：围绕即时通讯核心场景构建涵盖消息、联系人、群组、AI 助手、音视频通话、商城、社区等完整功能体系。前端 Vue3+Nuxt3+Electron，后端 Node.js+Express+Sequelize，WebSocket 实时双向通信。用户系统：多方式注册登录账号密码手机号邮箱QQ授权一键登录、个人资料管理头像上传昵称修改性别设置个性签名编辑、账号安全修改密码设备管理密码更新时间追踪、隐私设置在线状态可见性允许陌生人邀请临时会话开关、极验验证关键操作人机校验。即时消息：多类型消息文本图片文件语音音视频通话记录系统通知、消息操作撤回2分钟内删除软删除引用回复@群成员、文件传输上传下载预览断点续传本地文件直接打开、消息状态已发送已送达已读发送中发送失败实时同步、Socket.IO WebSocket 长连接毫秒级送达。联系人群组：好友管理搜索添加删除好友申请审批双向关系维护、联系人分组备注名分组标签快速检索、群组功能创建群聊搜索群聊加入群聊群号查找、群管理群主管理员多级角色成员禁言群全员禁言入群审批、群成员头衔自定义头衔等级体系群公告编辑、群邀请成员邀请陌生人邀请开关邀请链接分享。AI 助手音视频通话：AI 群聊机器人已接入 DeepSeek/讯飞星火/KimiAI 群内@机器人即可对话、一对一音视频基于 WebRTC+PeerJS 低延迟、屏幕共享一键共享桌面窗口适合远程协作在线演示、通话控制麦克风摄像头开关扬声器控制挂断通话时长统计。商城社区：商城系统商品展示分类浏览订单管理在线支付、社区系统帖子发布编辑评论互动内容管理、举报机制用户举报违规内容管理员审核处理。系统功能：应用更新版本检测自动更新提醒更新日志 Markdown 渲染、主题切换浅色深色双主题 CSS 变量无缝切换、字体设置自定义字体内置阿里巴巴 Alimama 系列、自定义下载路径文件下载目录可配置、全局搜索 Ctrl+K 唤起搜索面板搜索联系人群组消息。多端适配：Electron 桌面端自定义标题栏沉浸式窗口体验、系统托盘常驻后台消息不遗漏、原生系统通知即时感知新消息、自动更新检测一键升级到最新版、安装包约 10MB 轻量无负担。技术栈：前端 Vue3+Nuxt3+TypeScript+Electron+Ant Design Vue+Pinia+Vue I18n+Socket.IO Client+PeerJS+SCSS，后端 Node.js+Express+Sequelize+MySQL+Socket.IO+Redis+JWT+Multer+Sharp+Nodemailer。品牌故事、设计理念、参与贡献、开发团队。",
    icon: "",
    action: () => {
      switchTab(TAB_KEYS.jiwu_story);
      closeSearchPanel();
    },
  });

  return items;
});

const filteredSearchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return [];
  return searchIndexData.value.filter(
    (item) => item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q),
  );
});

function handleSearchInput() {
  // 搜索输入处理（computed 自动响应）
}

function handleSearchResultClick(result: SearchResult) {
  result.action();
}

function openSearchPanel() {
  isSearchPanelVisible.value = true;
  searchQuery.value = "";
  document.body.style.overflow = "hidden";
  nextTick(() => {
    searchInputRef.value?.focus();
  });
}

function closeSearchPanel() {
  isSearchPanelVisible.value = false;
  document.body.style.overflow = "";
}

function toggleSearchPanel() {
  if (isSearchPanelVisible.value) {
    closeSearchPanel();
  } else {
    openSearchPanel();
  }
}

function handleSearchShortcut(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    toggleSearchPanel();
  }
  if (e.key === "Escape" && isSearchPanelVisible.value) {
    closeSearchPanel();
  }
}

const handleToggleTheme = (event: MouseEvent) => {
  toggleHomeTheme(event);
};

function openGitHub() {
  window.open("https://github.com/return-Liu/JiWu_Chat", "_blank");
}

// 跳转到更新日志页面（GitHub commits 展示）
function goToChangelog() {
  router.push("/updateLogs").catch(() => {});
}

// ==================== Chat tab 缩放拦截 & 滚动条隐藏 ====================
function preventZoomWheel(e: WheelEvent) {
  if (e.ctrlKey || e.metaKey) e.preventDefault();
}
function preventZoomKey(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    const key = e.key;
    if (
      key === "-" ||
      key === "=" ||
      key === "0" ||
      key === "NumpadSubtract" ||
      key === "NumpadAdd" ||
      key === "Numpad0"
    ) {
      e.preventDefault();
    }
  }
}
function preventContextMenu(e: MouseEvent) {
  e.preventDefault();
}

function injectChatIframeRestrictions() {
  const iframe = document.querySelector(".chat-iframe") as HTMLIFrameElement | null;
  if (!iframe?.contentWindow) return;
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  if (!doc) return;

  const styleId = "chat-iframe-restrict-style";
  if (doc.getElementById(styleId)) return;
  const style = doc.createElement("style");
  style.id = styleId;
  style.textContent = `
    html, body {
      overflow: hidden !important;
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
    html::-webkit-scrollbar, body::-webkit-scrollbar { display: none !important; }
  `;
  doc.head.appendChild(style);

  iframe.contentWindow.addEventListener("wheel", preventZoomWheel, { passive: false });
  iframe.contentWindow.addEventListener("keydown", preventZoomKey);
  iframe.contentWindow.addEventListener("contextmenu", preventContextMenu);
}

watch(activeTab, (newTab) => {
  if (newTab === TAB_KEYS.experience) {
    window.addEventListener("wheel", preventZoomWheel, { passive: false });
    window.addEventListener("keydown", preventZoomKey);
    window.addEventListener("contextmenu", preventContextMenu);
    const container = document.querySelector(".app-container") as HTMLElement | null;
    if (container) {
      container.style.overflowY = "hidden";
      container.style.overflowX = "hidden";
    }
    setTimeout(injectChatIframeRestrictions, 500);
  } else {
    window.removeEventListener("wheel", preventZoomWheel);
    window.removeEventListener("keydown", preventZoomKey);
    window.removeEventListener("contextmenu", preventContextMenu);
    const container = document.querySelector(".app-container") as HTMLElement | null;
    if (container) {
      container.style.overflowY = "auto";
      container.style.overflowX = "hidden";
    }
  }
});

// ==================== 滚动监听 ====================
const isScrolled = ref(false);
const appContainerRef = ref<HTMLElement | null>(null);
const handleScroll = () => {
  const el = appContainerRef.value;
  if (!el) return;
  isScrolled.value = el.scrollTop > 10;
};

const currentYear = computed(() => new Date().getFullYear());

// ==================== 生命周期 ====================
onMounted(() => {
  initHomeTheme();
  // 从 localStorage 恢复语言设置
  if (typeof window !== "undefined") {
    const savedLang = localStorage.getItem("jiwu-lang") as LangType | null;
    if (savedLang && (savedLang === "zh" || savedLang === "en")) {
      currentLang.value = savedLang;
      locale.value = savedLang;
    }
  }
  activeTab.value = getTabFromHash();
  window.addEventListener("hashchange", onHashChange);
  window.addEventListener("keydown", handleSearchShortcut);
  window.addEventListener("click", handleClickOutside);
  appContainerRef.value = document.querySelector(".app-container");
  appContainerRef.value?.addEventListener("scroll", handleScroll);
  handleScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener("hashchange", onHashChange);
  window.removeEventListener("keydown", handleSearchShortcut);
  window.removeEventListener("click", handleClickOutside);
  appContainerRef.value?.removeEventListener("scroll", handleScroll);
  document.body.style.overflow = "";
});
</script>

<style scoped>
/* ===== 全局字体 ===== */
*:not(.iconfont):not([class*="icon-"]) {
  font-weight: 500;
  font-family: "Courier New", Courier, monospace;
}

/* 确保 iconfont 使用自己的字体 */
.iconfont,
[class*="icon-"] {
  font-family: "iconfont";
  font-weight: normal;
}

.app-container {
  /* ===== 首页私有 CSS 变量（覆盖全局，只影响首页子树，与设置页隔离） ===== */
  --bg-primary: #f5f6fa;
  --bg-secondary: #e8edf8;
  --bg-tertiary: #f5f5f5;
  --bg-hover: rgba(0, 0, 0, 0.04);
  --text-primary: #1a1a2e;
  --text-secondary: #6b7280;
  --text-tertiary: #8e8e93;
  --border-color: #dce2ef;
  --card-bg: #ffffff;

  min-height: 100vh;
  background: var(--bg-primary);
  overflow-y: auto;
  overflow-x: hidden;
  height: 100vh;
  position: relative;
  z-index: 1;
}

.app-container.home-dark {
  --bg-primary: #0a0a0a;
  --bg-secondary: #141414;
  --bg-tertiary: #1a1a1a;
  --bg-hover: rgba(255, 255, 255, 0.04);
  --text-primary: #e8e8e8;
  --text-secondary: #9ca3af;
  --text-tertiary: #6b7280;
  --border-color: #2a2a2a;
  --card-bg: #1a1a1a;
}

.app-header {
  background: transparent;
  padding: 0 24px;
  height: 64px;
  line-height: 64px;
}

.main-content {
  background: transparent;
  padding: 40px 24px 24px;
  min-height: auto;
}

.footer-section {
  background: transparent;
  padding: 40px 20px;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 999;
  border-bottom: 1px solid transparent;
  transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
}

.app-header.header-scrolled {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(12px);
}

.app-container:not(.home-dark) .app-header.header-scrolled {
  background: rgba(245, 246, 250, 0.88);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.home-dark .app-header.header-scrolled {
  background: rgba(10, 10, 10, 0.92);
}

.header-wrapper {
  max-width: 1440px;
  height: 64px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
}

.logo-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-dark .logo-icon {
  filter: brightness(0.9);
}

.logo-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.logo-text {
  font-size: 16px;
  font-weight: 500;
  font-family: "Courier New", Courier, monospace;
  color: var(--text-primary);
  transition: color 0.3s ease;
  line-height: 1;
  display: flex;
  align-items: center;
  margin: 0;
}

.action-section {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  font-weight: 500;
}

/* ===== 导航标签容器 ===== */
.nav-tabs {
  display: flex;
  align-items: center;
  gap: 0;
  height: 100%;
}

/* ===== 搜索框样式 ===== */
.search-wrapper {
  display: flex;
  align-items: center;
  height: 100%;
  margin-right: 8px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  height: 34px;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: all 0.25s ease;
  cursor: pointer;
  background: transparent;
  color: var(--text-secondary);
}

.search-box:hover {
  border-color: #5d33f6;
}

.search-box.search-active {
  border-color: #5d33f6;
  background: rgba(93, 51, 246, 0.08);
}

.search-icon {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.7;
}

.search-placeholder {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.7;
  font-weight: 400;
}

.search-shortcut {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.5;
  font-weight: 400;
  font-family: "Courier New", Courier, monospace;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  line-height: 1.4;
  letter-spacing: 0.3px;
}

.app-container:not(.home-dark) .search-shortcut {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.08);
}

.home-dark .search-shortcut {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

/* ===== 搜索弹窗 ===== */
.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
  animation: overlayIn 0.2s ease;
}

@keyframes overlayIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.search-modal {
  width: 800px;
  background: var(--bg-primary);
  border-radius: 12px;
  animation: modalIn 0.25s cubic-bezier(0.34, 1.2, 0.64, 1);
  overflow: hidden;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: translateY(-16px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.app-container:not(.home-dark) .search-modal {
  background: #ffffff;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
}

.home-dark .search-modal {
  background: #1e1e1e;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.search-modal-body {
  padding: 20px 24px 16px;
}

/* ===== 搜索输入框 ===== */
.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  height: 42px;
  border: 1px solid #5d33f6;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: var(--bg-hover);
}

.app-container:not(.home-dark) .search-input-wrap {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.08);
}

.home-dark .search-input-wrap {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
}

.search-input-wrap:focus-within {
  border-color: #5d33f6;
  box-shadow: 0 0 0 3px rgba(93, 51, 246, 0.1);
  background: var(--bg-primary);
}

.app-container:not(.home-dark) .search-input-wrap:focus-within {
  background: #ffffff;
}

.home-dark .search-input-wrap:focus-within {
  background: #1e1e1e;
}

.search-modal-icon {
  font-size: 18px;
  color: var(--text-secondary);
  opacity: 0.4;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.search-input-wrap:focus-within .search-modal-icon {
  color: #5d33f6;
  opacity: 1;
}

.search-modal-input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #5d33f6;
  font-weight: 400;
}

.search-modal-input::placeholder {
  color: #5d33f6;
  opacity: 0.35;
  font-weight: 400;
}

.search-esc {
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.35;
  font-weight: 400;
  font-family: "Courier New", Courier, monospace;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  line-height: 1.4;
  flex-shrink: 0;
}

.app-container:not(.home-dark) .search-esc {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.06);
}

.home-dark .search-esc {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.06);
}

.search-divider {
  height: 1px;
  background: var(--border-color);
  margin: 14px 0 12px;
  opacity: 0.4;
}

/* ===== 搜索提示 ===== */
.search-hints {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 4px;
}

.hint-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hint-key {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-hover);
  border: 1px solid var(--border-color);
  font-family: "Courier New", Courier, monospace;
  line-height: 1;
  opacity: 0.7;
  min-width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.hint-key:not(.iconfont) {
  font-size: 13px;
  min-width: 28px;
  height: 28px;
}

.hint-text {
  font-size: 15px;
  color: var(--text-secondary);
  font-weight: 500;
  opacity: 0.8;
}

/* ===== 搜索结果列表 ===== */
.search-results {
  max-height: 360px;
  overflow-y: auto;
  margin-top: 4px;
}

.search-results-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-result-item:hover {
  background: rgba(93, 51, 246, 0.08);
}

.home-dark .search-result-item:hover {
  background: rgba(139, 92, 246, 0.1);
}

.search-result-icon {
  font-size: 20px;
  color: #5d33f6;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(93, 51, 246, 0.08);
  border-radius: 8px;
}

.home-dark .search-result-icon {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.1);
}

.search-result-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.search-result-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.search-result-desc {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.7;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-no-results {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: var(--text-secondary);
  font-size: 14px;
  opacity: 0.6;
}

.app-container:not(.home-dark) .hint-key {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.06);
}

.home-dark .hint-key {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.06);
}

/* ===== 导航链接 ===== */
.func-link {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 16px;
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 500;
  font-family: "Courier New", Courier, monospace;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  height: 36px;
  background: transparent;
  text-decoration: none;
}

.link-label {
  font-size: 16px;
  font-weight: 500;
  font-family: "Courier New", Courier, monospace;
  margin: 0;
  line-height: 1;
}

.func-link:visited,
.func-link:active {
  color: var(--text-primary);
}

.func-link:hover {
  color: #5d33f6;
  background: transparent;
}

.home-dark .func-link:hover {
  color: #8b5cf6;
  background: transparent;
}

.func-link.tab-active {
  color: #5d33f6;
  font-weight: 600;
}

.home-dark .func-link.tab-active {
  color: #8b5cf6;
}

/* ===== 生态切换 ===== */
.eco-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
}

.eco-toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
  color: var(--text-primary);
  user-select: none;
  line-height: 1;
}

.eco-toggle-btn:hover {
  color: #5d33f6;
  background: transparent;
}

.home-dark .eco-toggle-btn:hover {
  color: #8b5cf6;
  background: transparent;
}

.eco-toggle-btn.eco-active {
  color: #5d33f6;
}

.home-dark .eco-toggle-btn.eco-active {
  color: #8b5cf6;
}

.eco-label {
  font-size: 16px;
  font-weight: 500;
  font-family: "Courier New", Courier, monospace;
  color: var(--text-primary);
  transition: color 0.2s ease;
  line-height: 1;
}

.eco-toggle-btn:hover .eco-label {
  color: #5d33f6;
}

.home-dark .eco-toggle-btn:hover .eco-label {
  color: #8b5cf6;
}

.eco-toggle-btn.eco-active .eco-label {
  color: #5d33f6;
  font-weight: 600;
}

.home-dark .eco-toggle-btn.eco-active .eco-label {
  color: #8b5cf6;
}

.eco-arrow {
  font-size: 16px;
  color: var(--text-secondary);
  transition: all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
  opacity: 0.6;
  line-height: 1;
  display: inline-block;
}

.eco-toggle-btn:hover .eco-arrow {
  color: #5d33f6;
}

.home-dark .eco-toggle-btn:hover .eco-arrow {
  color: #8b5cf6;
}

.eco-arrow-open {
  transform: rotate(180deg);
}

/* ===== 生态下拉菜单 ===== */
.eco-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 220px;
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--border-color);
  z-index: 100;
  overflow: hidden;
}

.app-container:not(.home-dark) .eco-dropdown {
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.home-dark .eco-dropdown {
  background: #1e1e1e;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.eco-dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 8px;
  line-height: 1;
  text-decoration: none;
}

.eco-dropdown-item:hover {
  background: rgba(93, 51, 246, 0.08);
}

.home-dark .eco-dropdown-item:hover {
  background: rgba(139, 92, 246, 0.1);
}

.eco-dropdown-item-active {
  color: #5d33f6;
}

.home-dark .eco-dropdown-item-active {
  color: #8b5cf6;
}

.eco-dropdown-item-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.eco-item-icon {
  font-size: 20px;
  color: var(--text-secondary);
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.eco-dropdown-item:hover .eco-item-icon {
  color: #5d33f6;
}

.home-dark .eco-dropdown-item:hover .eco-item-icon {
  color: #8b5cf6;
}

.eco-dropdown-item-active .eco-item-icon {
  color: #5d33f6;
}

.home-dark .eco-dropdown-item-active .eco-item-icon {
  color: #8b5cf6;
}

.eco-check {
  font-size: 14px;
  color: #5d33f6;
}

.home-dark .eco-check {
  color: #8b5cf6;
}

/* ===== 生态下拉动画 ===== */
.eco-dropdown-enter-active,
.eco-dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.eco-dropdown-enter-from,
.eco-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

/* ===== 语言切换 ===== */
.lang-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
}

.lang-toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
  background: transparent;
  border: none;
  color: var(--text-primary);
  user-select: none;
  line-height: 1;
}

.lang-icon {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: color 0.3s ease;
  display: block;
}

.lang-toggle-btn:hover .lang-icon {
  color: #5d33f6;
}

.home-dark .lang-toggle-btn:hover .lang-icon {
  color: #8b5cf6;
}

.lang-arrow {
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
  opacity: 0.6;
  line-height: 1;
  display: inline-block;
}

.lang-arrow-open {
  transform: rotate(180deg);
}

/* ===== 语言下拉菜单 ===== */
.lang-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 130px;
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--border-color);
  z-index: 100;
  overflow: hidden;
}

.app-container:not(.home-dark) .lang-dropdown {
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.home-dark .lang-dropdown {
  background: #1e1e1e;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.lang-dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 8px;
  line-height: 1;
}

.lang-dropdown-item:hover {
  background: rgba(93, 51, 246, 0.08);
}

.home-dark .lang-dropdown-item:hover {
  background: rgba(139, 92, 246, 0.1);
}

.lang-dropdown-item-active {
  color: #5d33f6;
}

.home-dark .lang-dropdown-item-active {
  color: #8b5cf6;
}

.lang-check {
  font-size: 14px;
  color: #5d33f6;
}

.home-dark .lang-check {
  color: #8b5cf6;
}

/* ===== 语言下拉动画 ===== */
.lang-dropdown-enter-active,
.lang-dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.lang-dropdown-enter-from,
.lang-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

/* ===== 分割线 ===== */
.divider-line {
  width: 1px;
  height: 20px;
  background: var(--border-color, rgba(0, 0, 0, 0.08));
  flex-shrink: 0;
  margin: 0 4px;
}

/* ===== 主题切换 ===== */
.theme-toggle-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
  flex-shrink: 0;
}

.theme-toggle-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
  background: transparent;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
}

.app-container:not(.home-dark) .theme-toggle-btn {
  border-color: rgba(0, 0, 0, 0.08);
}

.home-dark .theme-toggle-btn {
  border-color: rgba(255, 255, 255, 0.08);
}

.theme-toggle-btn:hover {
  border-color: #5d33f6;
  background: rgba(93, 51, 246, 0.06);
}

.home-dark .theme-toggle-btn:hover {
  background: rgba(139, 92, 246, 0.08);
}

.theme-toggle-btn:active {
  transform: scale(0.92);
}

.theme-icon {
  font-size: 16px;
  color: var(--text-primary);
  transition: all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle-btn:hover .theme-icon {
  color: #5d33f6;
}

.home-dark .theme-toggle-btn:hover .theme-icon {
  color: #8b5cf6;
}

/* ===== GitHub 链接 ===== */
.github-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
  flex-shrink: 0;
  text-decoration: none;
}

.github-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

.github-icon {
  font-size: 23px;
  color: var(--text-secondary);
  transition: color 0.3s ease;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.github-wrapper:hover .github-icon {
  color: #5d33f6;
}

.home-dark .github-wrapper:hover .github-icon {
  color: #8b5cf6;
}

/* ===== jiwu_story 页面样式 ===== */
.jiwu_story-section {
  padding: 0;
  min-height: calc(100vh - 200px);
}

.main-content {
  max-width: 1440px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.docs-page {
  padding: 0;
  min-height: calc(100vh - 200px);
}

.pricing-section {
  padding: 40px 20px 60px;
  margin-bottom: 20px;
}

.footer-section {
  text-align: center;
  margin-top: 40px;
  border-top: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 14px;
  transition: all 0.3s ease;
  font-weight: 400;
  font-family: "Courier New", Courier, monospace;
}

.footer-text {
  font-weight: 400;
}

@media (max-width: 768px) {
  .nav-tabs .func-link {
    padding: 6px 8px;
    font-size: 14px;
  }
  .link-label {
    font-size: 14px;
  }
  .eco-toggle-btn {
    padding: 6px 8px;
    height: 32px;
  }
  .eco-label {
    font-size: 14px;
  }
  .search-box {
    padding: 4px 8px;
  }
  .search-placeholder {
    font-size: 12px;
  }
  .search-shortcut {
    font-size: 10px;
    padding: 1px 4px;
  }
  .search-overlay {
    padding-top: 40px;
    align-items: center;
  }
  .search-modal {
    width: 92%;
  }
  .search-modal-body {
    padding: 16px 18px 14px;
  }
  .search-input-wrap {
    height: 44px;
    padding: 0 12px;
  }
  .search-modal-input {
    font-size: 14px;
  }
  .search-hints {
    gap: 12px;
    flex-wrap: wrap;
  }
  .hint-key {
    font-size: 18px;
    min-width: 24px;
    height: 24px;
    padding: 1px 4px;
  }
  .hint-key:not(.iconfont) {
    font-size: 11px;
    min-width: 24px;
    height: 24px;
  }
  .hint-text {
    font-size: 13px;
  }
  .hint-group {
    gap: 4px;
  }
  .eco-dropdown {
    min-width: 180px;
  }
}

@media (max-width: 640px) {
  .divider-line {
    height: 18px;
  }
  .theme-toggle-btn,
  .github-btn {
    width: 28px;
    height: 28px;
  }
  .theme-icon {
    font-size: 14px;
  }
  .github-icon {
    font-size: 18px;
  }
  .eco-toggle-btn {
    padding: 4px 6px;
    height: 28px;
  }
  .eco-label {
    font-size: 13px;
  }
  .lang-toggle-btn {
    padding: 2px 6px;
    height: 28px;
    gap: 3px;
  }
  .lang-icon {
    width: 14px;
    height: 14px;
  }
  .eco-arrow,
  .lang-arrow {
    font-size: 13px;
  }
  .eco-dropdown {
    min-width: 160px;
  }
  .lang-dropdown {
    min-width: 110px;
  }
  .eco-dropdown-item,
  .lang-dropdown-item {
    font-size: 13px;
    padding: 6px 10px;
  }
  .eco-item-icon {
    font-size: 18px;
  }
}
</style>
