<template>
  <div class="github-changelog">
    <!-- 头部 -->
    <header class="changelog-header">
      <div class="header-left">
        <h1>更新日志</h1>
        <div class="stats">
          <span>共 {{ commits.length }} 条提交</span>
          <a
            class="github-link"
            :href="`https://github.com/${owner}/${repo}/commits`"
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
    <div v-if="loading && commits.length === 0" class="loading-state">
      <span class="spinner"></span>
      <span>正在加载更新日志...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error && commits.length === 0" class="error-state">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="load(true)">重试</button>
    </div>

    <!-- 列表 -->
    <div v-else class="changelog-list">
      <div v-if="commits.length === 0" class="empty-state">暂无更新记录</div>

      <div v-for="commit in commits" :key="commit.sha" class="commit-item">
        <div class="commit-header">
          <span class="commit-type" :style="{ background: commit.typeColor }">
            {{ commit.typeLabel }}
          </span>
          <span class="commit-subject">{{ commit.subject }}</span>
        </div>

        <div class="commit-meta">
          <img v-if="commit.authorAvatar" :src="commit.authorAvatar" class="commit-avatar" alt="" />
          <span class="commit-author">{{ commit.author }}</span>
          <span class="commit-date">{{ formatDate(commit.date) }}</span>
          <a
            v-if="commit.url"
            class="commit-sha"
            :href="commit.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            #{{ commit.shortSha }}
          </a>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore" class="load-more">
        <button class="load-more-btn" :disabled="loading" @click="loadMore">
          {{ loading ? "加载中..." : "加载更多" }}
        </button>
      </div>
      <div v-else-if="commits.length" class="load-more end">
        <span>— 已加载全部 —</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useGithubChangelog } from "../composables/useGithubChangelog";

const {
  commits,
  loading,
  error,
  hasMore,
  load,
  loadMore,
  GITHUB_OWNER: owner,
  GITHUB_REPO: repo,
} = useGithubChangelog();

onMounted(() => {
  load(true);
});

/** 格式化日期 */
const formatDate = (date: string): string => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

.loading-state,
.error-state,
.empty-state {
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

.changelog-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.commit-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color, #f0f0f0);
}

.commit-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.commit-type {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  font-weight: 500;
}

.commit-subject {
  font-size: 14px;
  color: var(--text-primary, #111827);
  line-height: 1.5;
}

.commit-meta {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
}

.commit-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
}

.commit-sha {
  color: #0969da;
  text-decoration: none;
  font-family: monospace;
}

.commit-sha:hover {
  text-decoration: underline;
}

.load-more {
  padding: 16px 0;
  display: flex;
  justify-content: center;
}

.load-more-btn {
  padding: 6px 20px;
  border: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-secondary, #fff);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary, #111827);
}

.load-more-btn:hover:not(:disabled) {
  background: var(--hover-bg, #f3f4f6);
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.load-more.end span {
  color: var(--text-secondary, #9ca3af);
  font-size: 13px;
}
</style>
