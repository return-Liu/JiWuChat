<template>
  <div class="docs-layout">
    <!-- 左侧主导航 - 无分割线｜hover&active 移除背景 -->
    <aside class="docs-sidebar-left">
      <h4 class="docs-nav-title">导航</h4>
      <ul class="docs-nav-list">
        <li
          class="docs-nav-item"
          :class="{ active: currentSection === 'start' }"
          @click="switchSection('start')"
        >
          开始
        </li>
        <li
          class="docs-nav-item"
          :class="{ active: currentSection === 'intro' }"
          @click="switchSection('intro')"
        >
          项目介绍
        </li>
      </ul>
    </aside>

    <!-- 中间文档滚动区域 -->
    <main class="docs-content" ref="docsContentRef" @scroll="handleScroll">
      <div class="markdown-body">
        <div class="docs-banner">
          <div class="banner-content">
            <img src="../public/jiwuchat-elctron.png" alt="JW" class="banner-logo" />
            <span class="banner-title">极物聊天 Electron APP</span>
          </div>
        </div>

        <!-- 项目介绍 -->
        <div v-if="shouldShowSection('anchor-project-intro')">
          <h1 id="anchor-project-intro" class="anchor-heading">
            <span class="heading-hash">#</span>
            项目介绍
          </h1>
          <p>
            JiwuChat 是一款基于 Electron 和 Nuxt3
            构建的轻量(~10MB)多平台聊天应用，具备多种实时消息、AI
            群聊机器人（讯飞星火、KimiAI等已接入）、WebRTC 音视频通话、屏幕共享以及 AI
            购物功能。它支持无缝跨设备通信，涵盖文本、图片、文件和语音等多种消息，还支持群聊和可定制化设置。提供浅色/深色模式，助力高效社交网络。
          </p>
        </div>

        <!-- 多端适配 -->
        <div v-if="shouldShowSection('anchor-multi-platform')">
          <div class="section-divider"></div>
          <h2 id="anchor-multi-platform" class="anchor-heading">
            <span class="heading-hash">#</span>
            一套代码，多端适配
          </h2>
          <p>基于 Electron + Nuxt3，同一套前端代码可同时运行在桌面端和 Web 端。</p>
        </div>

        <!-- 项目特点 -->
        <div v-if="shouldShowSection('anchor-project-features')">
          <div class="section-divider"></div>
          <h1 id="anchor-project-features" class="anchor-heading">
            <span class="heading-hash">#</span>
            项目特点
          </h1>
          <ul>
            <li><strong>轻量化：</strong>基于 Electron 和 Nuxt3，安装包仅约 5MB，启动快、占用低</li>
            <li><strong>跨平台：</strong>支持 Windows、macOS、Linux 桌面端和 Web 端</li>
            <li><strong>实时消息：</strong>支持文本、图片、文件、语音等多种消息类型，收发流畅</li>
            <li><strong>音视频通话：</strong>基于 WebRTC 的一对一音视频通话，低延迟、高清晰度</li>
            <li><strong>屏幕共享：</strong>一键共享屏幕，适合远程协作、在线教学与演示场景</li>
            <li>
              <strong>AI 群聊机器人：</strong>支持 DeepSeek、讯飞星火、KimiAI 等多种 AI 机器人
            </li>
            <li><strong>AI 购物：</strong>内置商城系统，支持商品展示、订单管理、在线支付</li>
            <li><strong>社区系统：</strong>帖子发布、评论互动、内容管理等社区功能</li>
            <li><strong>端到端加密：</strong>消息与文件全程加密，保护聊天内容安全</li>
            <li><strong>多端数据同步：</strong>聊天记录、联系人跨设备自动同步，切换设备无缝衔接</li>
            <li><strong>个性化主题：</strong>支持浅色/深色模式、自定义界面主题，打造专属体验</li>
          </ul>
        </div>

        <!-- 功能列表 -->
        <div v-if="shouldShowSection('anchor-feature-list')">
          <div class="section-divider"></div>
          <h1 id="anchor-feature-list" class="anchor-heading">
            <span class="heading-hash">#</span>
            功能列表
          </h1>
          <div class="feature-list-table">
            <a-table
              :columns="featureColumns"
              :data-source="featureData"
              :pagination="false"
              size="middle"
              bordered
            >
              <template #bodyCell="{ column, text, record }">
                <template v-if="column.key === 'module'">
                  <span v-if="record.rowSpan > 0" :rowspan="record.rowSpan">
                    {{ text }}
                  </span>
                </template>
                <template v-else-if="column.key === 'status'">
                  <i
                    v-if="text"
                    class="iconfont icon-dagou1"
                    style="color: #52c41a; font-size: 16px"
                  ></i>
                  <i
                    v-else
                    class="iconfont icon-close1"
                    style="color: #ff4d4f; font-size: 16px"
                  ></i>
                </template>
                <template v-else>
                  {{ text }}
                </template>
              </template>
            </a-table>
          </div>
        </div>

        <!-- 如何开始 -->
        <div v-if="shouldShowSection('anchor-how-to-start')">
          <div class="section-divider"></div>
          <h1 id="anchor-how-to-start" class="anchor-heading">
            <span class="heading-hash">#</span>
            如何开始
          </h1>

          <h2>安装依赖</h2>
          <div class="code-block">
            <!-- 复制图标：容器内部右上角 -->
            <i class="iconfont icon-fuzhi1 copy-btn" title="复制代码" @click="copyCode($event)"></i>
            <pre><code># node 版本 >= 18
npm install -g pnpm
pnpm install</code></pre>
          </div>

          <h2>开发</h2>
          <div class="code-block">
            <i class="iconfont icon-fuzhi1 copy-btn" title="复制代码" @click="copyCode($event)"></i>
            <pre><code># 终端1：启动 nuxt
pnpm run dev:nuxt
# 终端2：启动 electron
pnpm run dev:electron</code></pre>
          </div>

          <h2>构建</h2>
          <div class="code-block">
            <i class="iconfont icon-fuzhi1 copy-btn" title="复制代码" @click="copyCode($event)"></i>
            <pre><code>1. 打包 Nuxt 资源 或 生成静态站点（SSG）
pnpm run build:nuxt 或  pnpm generate 

2. 打包 electron 桌面端
pnpm run build:electron</code></pre>
          </div>
        </div>

        <!-- 技术栈 -->
        <div v-if="shouldShowSection('anchor-tech-stack')">
          <div class="section-divider"></div>
          <h1 id="anchor-tech-stack" class="anchor-heading">
            <span class="heading-hash">#</span>
            涉及技术栈
          </h1>
          <div class="tech-stack-table">
            <a-table
              :columns="techStackColumns"
              :data-source="techStackData"
              :pagination="false"
              size="middle"
              bordered
            >
              <template #bodyCell="{ column, text, record }">
                <template v-if="column.key === 'category'">
                  <span v-if="record.rowSpan > 0" :rowspan="record.rowSpan">
                    {{ text }}
                  </span>
                </template>
                <template v-else>
                  {{ text }}
                </template>
              </template>
            </a-table>
          </div>
        </div>

        <!-- 项目截图 -->
        <div v-if="shouldShowSection('anchor-screenshot')">
          <div class="section-divider"></div>
          <h2 id="anchor-screenshot" class="anchor-heading">
            <span class="heading-hash">#</span>
            项目截图
          </h2>
          <p>（项目运行截图可在此处展示）</p>
        </div>

        <!-- 联系方式 -->
        <div v-if="shouldShowSection('anchor-contact')">
          <div class="section-divider"></div>
          <h2 id="anchor-contact" class="anchor-heading">
            <span class="heading-hash">#</span>
            联系方式
          </h2>
          <ul>
            <li>邮箱：2286223728@QQ.com</li>
            <li>官网：https://jiwuchat.com</li>
          </ul>
        </div>
      </div>
    </main>

    <!-- 右侧文章导航｜容器左侧带分割线 -->
    <aside class="docs-sidebar-right">
      <h4 class="docs-nav-title">文章导航</h4>
      <ul class="docs-nav-list">
        <template v-if="currentSection === 'start'">
          <li
            v-for="item in startNavItems"
            :key="item.anchor"
            class="docs-nav-item"
            :class="{ active: activeAnchor === item.anchor }"
            @click="scrollToAnchor(item.anchor)"
          >
            {{ item.label }}
          </li>
        </template>
        <template v-else>
          <li
            v-for="item in introNavItems"
            :key="item.anchor"
            class="docs-nav-item"
            :class="{ active: activeAnchor === item.anchor }"
            @click="scrollToAnchor(item.anchor)"
          >
            {{ item.label }}
          </li>
        </template>
      </ul>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { Table as ATable } from "ant-design-vue";

// 导航配置
const startNavItems = [
  { label: "项目介绍", anchor: "anchor-project-intro" },
  { label: "项目特点", anchor: "anchor-project-features" },
  { label: "如何开始", anchor: "anchor-how-to-start" },
  { label: "技术栈", anchor: "anchor-tech-stack" },
  { label: "联系方式", anchor: "anchor-contact" },
];

const introNavItems = [
  { label: "项目介绍", anchor: "anchor-project-intro" },
  { label: "多端适配", anchor: "anchor-multi-platform" },
  { label: "功能列表", anchor: "anchor-feature-list" },
  { label: "技术栈", anchor: "anchor-tech-stack" },
  { label: "项目截图", anchor: "anchor-screenshot" },
  { label: "联系方式", anchor: "anchor-contact" },
];

// 状态
const currentSection = ref<"start" | "intro">("start");
const activeAnchor = ref<string>("");
const docsContentRef = ref<HTMLElement | null>(null);
const isProgramScroll = ref(false);

function shouldShowSection(anchorId: string): boolean {
  const items = currentSection.value === "start" ? startNavItems : introNavItems;
  return items.some((item) => item.anchor === anchorId);
}

function switchSection(section: "start" | "intro") {
  currentSection.value = section;
  const targetAnchor = section === "start" ? "anchor-how-to-start" : "anchor-project-intro";
  nextTick(() => scrollToAnchor(targetAnchor));
}

// 点击导航触发滚动
function scrollToAnchor(anchorId: string) {
  const el = document.getElementById(anchorId);
  const container = docsContentRef.value;
  if (!el || !container) return;

  activeAnchor.value = anchorId;
  isProgramScroll.value = true;

  container.scrollTo({
    top: el.offsetTop - 40,
    behavior: "smooth",
  });

  setTimeout(() => {
    isProgramScroll.value = false;
    calcCurrentAnchor();
  }, 550);
}

// 自动计算当前可视区域锚点
function calcCurrentAnchor() {
  const container = docsContentRef.value;
  if (!container) return;
  const scrollTop = container.scrollTop;
  const list = currentSection.value === "start" ? startNavItems : introNavItems;

  let current = list[0].anchor;
  for (const item of list) {
    const targetDom = document.getElementById(item.anchor);
    if (!targetDom) continue;
    if (targetDom.offsetTop - 60 <= scrollTop) {
      current = item.anchor;
    }
  }
  activeAnchor.value = current;
}

// 滚动统一入口
function handleScroll() {
  if (isProgramScroll.value) return;
  calcCurrentAnchor();
}

watch(currentSection, () => {
  nextTick(() => setTimeout(calcCurrentAnchor, 100));
});

// ===== 复制代码方法 =====
async function copyCode(e: MouseEvent) {
  const block = (e.target as HTMLElement).closest(".code-block");
  if (!block) return;
  const codeText = block.querySelector("code")?.textContent || "";
  await navigator.clipboard.writeText(codeText.trim());
  // 如需复制成功提示可以自行增加
}

// ==================== 表格数据 ====================
const techStackColumns = [
  { title: "类别", dataIndex: "category", key: "category", width: 140 },
  { title: "技术/组件", dataIndex: "tech", key: "tech" },
  { title: "版本号", dataIndex: "version", key: "version", width: 140 },
];

const techStackData = [
  { key: "1", category: "框架", tech: "Nuxt 3", version: "^3.0.0", rowSpan: 2 },
  { key: "2", category: "", tech: "Electron", version: "^42.3.3", rowSpan: 0 },
  { key: "3", category: "UI 组件库", tech: "Ant Design Vue", version: "^4.0.0", rowSpan: 2 },
  { key: "4", category: "", tech: "@ant-design/icons-vue", version: "^7.0.1", rowSpan: 0 },
  { key: "5", category: "可视化", tech: "@ant-design/charts", version: "^2.6.7", rowSpan: 2 },
  { key: "6", category: "", tech: "@ant-design/graphs", version: "2.0.0", rowSpan: 0 },
  { key: "7", category: "状态管理", tech: "Pinia", version: "^3.0.4", rowSpan: 2 },
  { key: "8", category: "", tech: "pinia-plugin-persistedstate", version: "^4.7.1", rowSpan: 0 },
  { key: "9", category: "实时通信", tech: "Socket.IO Client", version: "^4.8.3", rowSpan: 2 },
  { key: "10", category: "", tech: "PeerJS (WebRTC)", version: "^1.5.5", rowSpan: 0 },
  { key: "11", category: "HTTP 客户端", tech: "Axios", version: "^1.13.2", rowSpan: 1 },
  { key: "12", category: "Markdown", tech: "markdown-it", version: "^14.1.1", rowSpan: 2 },
  { key: "13", category: "", tech: "highlight.js", version: "^11.11.1", rowSpan: 0 },
  { key: "14", category: "代码质量", tech: "ESLint", version: "^9.0.0", rowSpan: 2 },
  { key: "15", category: "", tech: "Prettier", version: "^3.3.0", rowSpan: 0 },
  { key: "16", category: "类型检查", tech: "TypeScript", version: "^5.x (vue-tsc)", rowSpan: 1 },
  { key: "17", category: "样式处理", tech: "Sass", version: "^1.97.3", rowSpan: 1 },
  { key: "18", category: "测试", tech: "Vitest", version: "^3.0.0", rowSpan: 1 },
  { key: "19", category: "构建", tech: "electron-builder", version: "^24.13.3", rowSpan: 1 },
];

const featureColumns = [
  { title: "功能模块", dataIndex: "module", key: "module", width: 140 },
  { title: "功能描述", dataIndex: "description", key: "description" },
  { title: "状态", dataIndex: "status", key: "status", width: 80, align: "center" as const },
];

const featureData = [
  {
    key: "1",
    module: "用户模块",
    description: "支持账号、手机号和邮箱的登录和注册，个人资料编辑、头像上传",
    status: true,
    rowSpan: 1,
  },
  {
    key: "2",
    module: "消息模块",
    description: "支持文本、图片、文件、语音、@用户、撤回、删除、引用回复等多种消息类型",
    status: true,
    rowSpan: 1,
  },
  {
    key: "3",
    module: "会话模块",
    description: "支持群聊、私聊多种聊天模式，群主、管理员、普通用户等多级角色管理",
    status: true,
    rowSpan: 1,
  },
  {
    key: "4",
    module: "联系人模块",
    description: "支持搜索、添加、删除联系人，好友申请与审批，联系人分组管理",
    status: true,
    rowSpan: 1,
  },
  {
    key: "5",
    module: "AI 模块",
    description: "群聊支持多种 AI 聊天机器人（DeepSeek、讯飞星火、KimiAI 等），智能客服",
    status: true,
    rowSpan: 1,
  },
  {
    key: "6",
    module: "语音视频模块",
    description: "基于 WebRTC 的一对一音视频通话、实时屏幕共享",
    status: true,
    rowSpan: 1,
  },
  {
    key: "7",
    module: "文件管理模块",
    description: "支持文件上传/下载、断点续传、本地打开、删除管理等功能",
    status: true,
    rowSpan: 1,
  },
  {
    key: "8",
    module: "商城系统",
    description: "商品展示、订单管理、在线支付等完整电商功能",
    status: true,
    rowSpan: 1,
  },
  {
    key: "9",
    module: "社区系统",
    description: "帖子发布、评论互动、内容管理等社区功能",
    status: true,
    rowSpan: 1,
  },
  {
    key: "10",
    module: "系统设置模块",
    description: "应用自动更新、版本公告查看、主题切换、字体设置、自定义下载路径等",
    status: true,
    rowSpan: 1,
  },
  {
    key: "11",
    module: "账号安全模块",
    description: "修改密码、账号管理、设备安全管理、账号上下线通知等",
    status: true,
    rowSpan: 1,
  },
  {
    key: "12",
    module: "多端适配",
    description: "同一套代码支持 Windows、macOS、Linux 桌面端和 Web 端",
    status: true,
    rowSpan: 1,
  },
];

onMounted(() => {
  nextTick(() => {
    calcCurrentAnchor();
  });
});

onBeforeUnmount(() => {
  docsContentRef.value = null;
});
</script>

<style scoped>
.docs-layout {
  display: flex;
  gap: 0;
  max-width: 1260px;
  margin: 0 auto;
}

/* 左侧主导航 */
.docs-sidebar-left {
  width: 200px;
  flex-shrink: 0;
  padding: 32px 16px;
}

/* 右侧文章导航：左侧竖分割线 */
.docs-sidebar-right {
  width: 200px;
  flex-shrink: 0;
  padding: 32px 16px;
  border-left: 1px solid var(--border-color);
}

.docs-content {
  flex: 1;
  padding: 32px 48px;
  max-height: calc(100vh - 160px);
  overflow-y: auto;
}
/* 隐藏滚动条 */
.docs-content::-webkit-scrollbar {
  width: 0;
}
.docs-content {
  scrollbar-width: none;
}

.docs-nav-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 18px;
  padding: 0 8px;
  letter-spacing: 0.5px;
  font-family: "Alimama", Helvetica, sans-serif;
}

.docs-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* ===== 左侧导航项【无背景】 ===== */
.docs-sidebar-left .docs-nav-item {
  position: relative;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
  border-radius: 6px;
  background: transparent !important;
}

.docs-sidebar-left .docs-nav-item:hover {
  color: var(--text-primary);
  background: transparent !important;
}

.docs-sidebar-left .docs-nav-item.active {
  color: #5d33f6;
  font-weight: 600;
  background: transparent !important;
}

.dark .docs-sidebar-left .docs-nav-item.active {
  color: #8b5cf6;
  background: transparent !important;
}

/* ===== 右侧导航条目：无背景！仅文字+左边指示条 ===== */
.docs-sidebar-right .docs-nav-item {
  position: relative;
  padding: 8px 12px 8px 16px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 2px solid transparent;
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
  background: transparent !important;
}

.docs-sidebar-right .docs-nav-item:hover {
  color: var(--text-primary);
  background: transparent !important;
}

.docs-sidebar-right .docs-nav-item.active {
  color: #5d33f6;
  font-weight: 600;
  border-left-color: #5d33f6;
  background: transparent !important;
}

.dark .docs-sidebar-right .docs-nav-item.active {
  color: #8b5cf6;
  border-left-color: #8b5cf6;
}

/* ===== 标题 # 样式 ===== */
.anchor-heading {
  position: relative;
  cursor: pointer;
}

.heading-hash {
  opacity: 0;
  color: #8364ff;
  margin-right: 6px;
  transition: opacity 0.2s ease;
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
  font-size: inherit;
}

.anchor-heading:hover .heading-hash {
  opacity: 1;
}

/* ===== 文档内容样式 ===== */
.docs-banner {
  display: flex;
  justify-content: center;
  padding: 20px 0 32px;
}

.banner-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.banner-logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
}

.banner-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: "Alimama", Helvetica, sans-serif;
}

.section-divider {
  height: 1px;
  background: var(--border-color);
  margin: 32px 0;
}

.markdown-body {
  line-height: 1.8;
  color: var(--text-primary);
}

.markdown-body h1 {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 14px;
  padding-top: 16px;
  color: var(--text-primary);
  font-family: "Alimama", Helvetica, sans-serif;
}

.markdown-body h2 {
  font-size: 20px;
  font-weight: 600;
  margin-top: 24px;
  margin-bottom: 10px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
  font-family: "Alimama", Helvetica, sans-serif;
}

.markdown-body h3 {
  font-size: 17px;
  font-weight: 600;
  margin-top: 18px;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-family: "Alimama", Helvetica, sans-serif;
}

.markdown-body p {
  margin-bottom: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 20px;
  margin-bottom: 16px;
}

.markdown-body li {
  margin-bottom: 4px;
  color: var(--text-secondary);
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
}

.markdown-body strong {
  font-weight: 600;
  color: var(--text-primary);
  font-family: "Alimama", Helvetica, sans-serif;
}

.markdown-body code {
  background: transparent;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 0.9em;
  color: var(--text-primary);
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
}

/* ===== 表格 ===== */
.tech-stack-table,
.feature-list-table {
  margin: 20px 0;
}

.tech-stack-table :deep(.ant-table),
.feature-list-table :deep(.ant-table) {
  border-radius: 6px;
  overflow: hidden;
}

.tech-stack-table :deep(.ant-table-thead > tr > th),
.feature-list-table :deep(.ant-table-thead > tr > th) {
  background: transparent !important;
  color: var(--text-primary);
  border-color: var(--border-color);
  font-weight: 600;
  font-family: "Alimama", Helvetica, sans-serif;
}

.tech-stack-table :deep(.ant-table-tbody > tr > td),
.feature-list-table :deep(.ant-table-tbody > tr > td) {
  border-color: var(--border-color);
  color: var(--text-secondary);
  background: transparent !important;
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
}

.tech-stack-table :deep(.ant-table-tbody > tr:hover > td),
.feature-list-table :deep(.ant-table-tbody > tr:hover > td) {
  background: transparent !important;
}

.tech-stack-table :deep(.ant-table),
.feature-list-table :deep(.ant-table) {
  background: transparent !important;
}

/* =====【代码块】复制图标 内部右上角 ===== */
.code-block {
  position: relative;
  border-radius: 8px;
  padding: 16px 20px;
  margin: 14px 0;
  overflow-x: auto;
  border: 1px solid var(--border-color);
  background: transparent !important;
}

/* 复制按钮：容器内部右上角，距离内边距对齐 */
.copy-btn {
  position: absolute;
  top: 3px;
  right: 5px;
  font-size: 18px;
  color: var(--text-secondary);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.24s ease,
    color 0.2s;
  z-index: 2;
  user-select: none;
}

.code-block:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  color: #5d33f6;
}

.code-block pre {
  margin: 0;
  line-height: 1.65;
}

.code-block code {
  font-family: "Alimama", Helvetica, sans-serif;
  font-size: 13px;
  color: var(--text-primary);
  background: transparent;
  padding: 0;
  font-weight: 500;
}
</style>
