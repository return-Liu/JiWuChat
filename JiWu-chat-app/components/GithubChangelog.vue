<template>
  <div class="github-changelog">
    <!-- 头部 -->
    <header class="changelog-header">
      <div class="header-left">
        <h1>更新日志</h1>
        <div class="stats">
          <span>共 {{ releases.length }} 个版本</span>
          <a
            class="github-link"
            :href="`https://github.com/${owner}/${repo}/releases`"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i class="iconfont icon-github"></i>
            在 GitHub 查看全部
          </a>
        </div>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="state-box">
      <span class="spinner"></span>
      <span>正在加载更新日志...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="state-box">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="loadReleases">重试</button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="releases.length === 0" class="state-box">
      <p>暂无发布版本</p>
    </div>

    <!-- 三栏布局 -->
    <div v-else class="changelog-layout">
      <!-- 左侧：版本号列表 -->
      <aside class="version-sidebar">
        <h3 class="sidebar-title">版本列表</h3>
        <ul class="version-nav">
          <li
            v-for="r in releases"
            :key="r.tag_name"
            class="version-item"
            :class="{ active: selectedTag === r.tag_name }"
            @click="selectRelease(r.tag_name)"
          >
            <span class="version-tag">{{ r.tag_name }}</span>
            <span v-if="r.prerelease" class="pre-badge">预发布</span>
            <span class="version-date">{{ formatDate(r.published_at) }}</span>
          </li>
        </ul>
      </aside>

      <!-- 中间：版本内容 -->
      <main class="release-main">
        <div v-if="currentRelease" class="release-content">
          <div class="release-header">
            <h2 class="release-title">{{ currentRelease.name || currentRelease.tag_name }}</h2>
            <div class="release-meta">
              <img
                v-if="currentRelease.authorAvatar"
                :src="currentRelease.authorAvatar"
                class="release-avatar"
                alt=""
              />
              <span class="release-author">{{ currentRelease.author }}</span>
              <span class="release-date">{{ formatDateTime(currentRelease.published_at) }}</span>
              <a
                class="release-link"
                :href="currentRelease.html_url"
                target="_blank"
                rel="noopener noreferrer"
              >
                查看 Release
              </a>
            </div>
          </div>

          <div
            class="release-body markdown-body"
            v-html="renderMarkdown(currentRelease.body)"
          ></div>
        </div>
      </main>

      <!-- 右侧：标题导航（目录） -->
      <aside class="toc-sidebar">
        <h3 class="sidebar-title">目录</h3>
        <ul v-if="headings.length > 0" class="toc-nav">
          <li
            v-for="(h, idx) in headings"
            :key="idx"
            class="toc-item"
            :class="`toc-level-${h.level}`"
            @click="scrollToHeading(h.anchor)"
          >
            {{ h.text }}
          </li>
        </ul>
        <p v-else class="toc-empty">本版本无标题</p>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, nextTick } from "vue";
import { useGithubReleases } from "../composables/useGithubChangelog";
import { renderMarkdown } from "../untils/markdownRenderer";
import "highlight.js/styles/github.css";

const {
  releases,
  loading,
  error,
  selectedTag,
  headings,
  loadReleases,
  selectRelease,
  GITHUB_OWNER: owner,
  GITHUB_REPO: repo,
} = useGithubReleases();

const currentRelease = computed(() => {
  return releases.value.find((r) => r.tag_name === selectedTag.value) || null;
});

onMounted(() => {
  loadReleases();
});

/** 格式化日期（年月日） */
const formatDate = (date: string): string => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** 格式化日期时间 */
const formatDateTime = (date: string): string => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

/** 滚动到指定标题 */
const scrollToHeading = async (anchor: string) => {
  await nextTick();
  const el = document.querySelector(`#${CSS.escape(anchor)}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};
</script>

<style scoped>
.github-changelog {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.changelog-header {
  flex-shrink: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.stats {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
}

.github-link {
  color: #0969da;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.github-link:hover {
  text-decoration: underline;
}

.state-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-secondary, #6b7280);
  padding: 40px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border-color, #e5e7eb);
  border-top-color: #0969da;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.retry-btn {
  padding: 6px 16px;
  border: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-secondary, #fff);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary, #111827);
}

.retry-btn:hover {
  background: var(--hover-bg, #f3f4f6);
}

/* 三栏布局 */
.changelog-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧版本列表 */
.version-sidebar {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-color, #e5e7eb);
  padding: 16px 12px;
  overflow-y: auto;
}

.sidebar-title {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
  padding: 0 8px;
}

.version-nav {
  list-style: none;
  padding: 0;
  margin: 0;
}

.version-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 4px;
}

.version-item:hover {
  background: var(--hover-bg, #f3f4f6);
}

.version-item.active {
  background: rgba(93, 51, 246, 0.08);
}

.version-tag {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.version-item.active .version-tag {
  color: #5d33f6;
}

.pre-badge {
  display: inline-block;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: #f59e0b;
  color: #fff;
  margin-top: 4px;
}

.version-date {
  display: block;
  font-size: 12px;
  color: var(--text-secondary, #9ca3af);
  margin-top: 4px;
}

/* 中间内容 */
.release-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

.release-content {
  max-width: 760px;
  margin: 0 auto;
}

.release-header {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  margin-bottom: 20px;
}

.release-title {
  margin: 0 0 12px;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary, #111827);
}

.release-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
}

.release-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.release-link {
  color: #0969da;
  text-decoration: none;
}

.release-link:hover {
  text-decoration: underline;
}

.release-body {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary, #111827);
}

/* 右侧目录 */
.toc-sidebar {
  width: 200px;
  flex-shrink: 0;
  border-left: 1px solid var(--border-color, #e5e7eb);
  padding: 16px 12px;
  overflow-y: auto;
}

.toc-nav {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  transition:
    color 0.2s,
    background 0.2s;
  line-height: 1.4;
}

.toc-item:hover {
  color: #5d33f6;
  background: var(--hover-bg, #f3f4f6);
}

.toc-level-1 {
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.toc-level-2 {
  padding-left: 16px;
}

.toc-level-3 {
  padding-left: 28px;
}

.toc-level-4 {
  padding-left: 40px;
}

.toc-empty {
  font-size: 13px;
  color: var(--text-secondary, #9ca3af);
  padding: 0 8px;
}
</style>
