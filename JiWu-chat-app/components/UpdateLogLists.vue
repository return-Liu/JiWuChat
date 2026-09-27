<template>
  <div class="update-logs-container">
    <!-- 头部 -->
    <header class="header-section">
      <div class="header-left">
        <h1>更新日志</h1>
        <div class="stats">
          <span>共 {{ updateLogs.length }} 条</span>
          <span v-if="selectedTag">筛选: {{ selectedTag }}</span>
        </div>
      </div>

      <div class="header-right">
        <div class="select-box" ref="selectRef">
          <button class="select-btn" @click="toggleSelect">
            <span>{{ selectedTagLabel || "全部版本" }}</span>
            <span class="arrow">▾</span>
          </button>
          <div v-if="showSelect" class="select-dropdown">
            <div class="select-item" @click="selectTag('')">全部版本</div>
            <div v-for="v in uniqueVersions" :key="v" class="select-item" @click="selectTag(v)">
              {{ v }}
            </div>
          </div>
        </div>

        <button v-if="isAdmin" class="add-btn" @click="handleCreate">+ 新增</button>
      </div>
    </header>

    <!-- 列表 -->
    <div class="content-wrapper">
      <div class="content-scroll">
        <div v-if="!displayLogs.length" class="empty">
          <p>暂无更新日志</p>
        </div>

        <div v-for="log in displayLogs" :key="log.id" class="log-item">
          <div class="log-header">
            <div class="log-tags">
              <span class="version-badge" :style="{ background: log.tagColor || '#0969da' }">
                {{ log.version || "v1.0.0" }}
              </span>
              <span class="tag" :class="log.updateType">
                {{ getUpdateTypeLabel(log.updateType) }}
              </span>
              <span class="tag" :class="log.platform">
                {{ getPlatformLabel(log.platform) }}
              </span>
              <span v-if="log.isImportant" class="tag important">重要</span>
            </div>

            <div class="log-meta">
              <span class="log-date">{{ formatDate(log.createdAt) }}</span>
              <div v-if="isAdmin" class="log-actions">
                <a @click="handleEdit(log)">编辑</a>
                <a @click="handleDelete(log)">删除</a>
              </div>
            </div>
          </div>

          <h3 class="log-title">{{ log.title }}</h3>
          <p v-if="log.summary" class="log-summary">{{ log.summary }}</p>

          <!-- 封面图画廊 -->
          <div v-if="getCoverImages(log).length" class="cover-gallery">
            <img
              v-for="(img, idx) in getCoverImages(log)"
              :key="idx"
              :src="img"
              class="cover-gallery-img"
              @click="handleCoverPreview(log, idx)"
              alt="封面图"
            />
          </div>

          <!-- 内容 -->
          <div class="log-content" v-html="renderContent(log.content)" />
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <a class="load-more-link" @click="loadMore">
            {{ loadingMore ? "加载中..." : "加载更多" }}
          </a>
        </div>
        <div v-else-if="displayLogs.length" class="load-more end">
          <span>— 已加载全部 —</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";
import { message } from "ant-design-vue";
import request from "../untils/request";
import { renderUpdateLogMarkdown } from "../untils/markdownRenderer";
import "highlight.js/styles/github.css";

const COVER_SEPARATOR = "|||";

const props = defineProps<{
  adminMode?: boolean;
  showHeader?: boolean;
}>();

const emit = defineEmits<{
  (e: "create"): void;
  (e: "edit", log: any): void;
  (e: "delete", log: any): void;
  (e: "coverPreview", images: string[], index: number): void;
}>();

// 状态
const updateLogs = ref<any[]>([]);
const filteredLogs = ref<any[]>([]);
const selectedTag = ref("");
const showSelect = ref(false);
const loadingMore = ref(false);
const currentPage = ref(1);
const pageSize = ref(5);
const selectRef = ref<HTMLElement | null>(null);

// 计算属性
const isAdmin = computed(() => props.adminMode);
const uniqueVersions = computed(() =>
  [...new Set(updateLogs.value.map((l) => l.version))]
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a)),
);
const selectedTagLabel = computed(() => selectedTag.value || "");

const displayLogs = computed(() => {
  return filteredLogs.value.slice(0, currentPage.value * pageSize.value);
});

const hasMore = computed(() => {
  return displayLogs.value.length < filteredLogs.value.length;
});

// 方法
const getCoverImages = (log: any): string[] => {
  const raw = log.coverImage;
  if (!raw || typeof raw !== "string" || raw.trim() === "") return [];
  return raw.split(COVER_SEPARATOR).filter(Boolean);
};

const getUpdateTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    feature: "新功能",
    optimization: "优化",
    fix: "修复",
    other: "其他",
  };
  return map[type] || "其他";
};

const getPlatformLabel = (platform: string) => {
  const map: Record<string, string> = {
    all: "所有平台",
    web: "PC客户端",
    mobile: "安卓版",
  };
  return map[platform] || "所有平台";
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const renderContent = (content: string) => {
  if (!content) return "";
  return renderUpdateLogMarkdown(content);
};

const fetchLogs = async () => {
  try {
    const res = await request.get("/updatelogs");
    const list = Array.isArray(res.data) ? res.data : res.data?.logs || [];
    updateLogs.value = list.map((l: any) => ({
      ...l,
      formattedTime: l.formattedTime || formatDate(l.createdAt),
    }));
    updateLogs.value.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );
    filterLogs();
  } catch {
    message.error("获取更新日志失败");
  }
};

const filterLogs = () => {
  filteredLogs.value = selectedTag.value
    ? updateLogs.value.filter((l) => l.version === selectedTag.value)
    : [...updateLogs.value];
  currentPage.value = 1;
};

const loadMore = () => {
  if (loadingMore.value || !hasMore.value) return;
  loadingMore.value = true;
  setTimeout(() => {
    currentPage.value++;
    loadingMore.value = false;
  }, 300);
};

const toggleSelect = () => {
  showSelect.value = !showSelect.value;
};

const selectTag = (tag: string) => {
  selectedTag.value = tag;
  showSelect.value = false;
  filterLogs();
};

const handleCreate = () => {
  emit("create");
};

const handleEdit = (log: any) => {
  emit("edit", log);
};

const handleDelete = (log: any) => {
  emit("delete", log);
};

const handleCoverPreview = (log: any, index: number) => {
  const images = getCoverImages(log);
  if (images.length) {
    emit("coverPreview", images, index);
  }
};

// 点击外部关闭下拉
const handleClickOutside = (e: MouseEvent) => {
  if (selectRef.value && !selectRef.value.contains(e.target as Node)) {
    showSelect.value = false;
  }
};

// 暴露方法
defineExpose({
  refresh: fetchLogs,
});

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  fetchLogs();
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style lang="scss" scoped>
.update-logs-container {
  background: var(--bg-primary);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: flex;
  flex-direction: column;
}

// 头部
.header-section {
  background: var(--card-bg);
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  flex-shrink: 0;

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;

    h1 {
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .stats {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: var(--text-secondary);
    }
  }

  .header-right {
    display: flex;
    gap: 12px;
    align-items: center;
  }
}

// 选择框
.select-box {
  position: relative;

  .select-btn {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    gap: 8px;
    align-items: center;
    white-space: nowrap;
    color: var(--text-primary);

    &:hover {
      border-color: var(--purple-color);
    }

    .arrow {
      font-size: 10px;
      color: var(--text-tertiary);
    }
  }

  .select-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    margin-top: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 100;
    max-height: 200px;
    overflow-y: auto;

    .select-item {
      padding: 8px 12px;
      cursor: pointer;
      font-size: 13px;
      color: var(--text-primary);

      &:hover {
        background: var(--bg-hover);
      }
    }
  }
}

// 新增按钮
.add-btn {
  background: var(--purple-color);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
}

// 内容区域
.content-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.content-scroll {
  height: 100%;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
  padding: 24px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: var(--bg-tertiary);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;

    &:hover {
      background: var(--text-tertiary);
    }
  }

  scrollbar-width: thin;
  scrollbar-color: var(--border-color) var(--bg-tertiary);
}

// 空状态
.empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-tertiary);

  p {
    font-size: 16px;
  }
}

// 列表项
.log-item {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .log-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .log-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .version-badge {
    font-size: 12px;
    padding: 2px 10px;
    border-radius: 4px;
    color: #fff;
    font-weight: 500;
  }

  .tag {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--bg-hover);
    color: var(--text-secondary);

    &.feature {
      background: var(--success-bg);
      color: var(--success-color);
    }

    &.optimization {
      background: var(--purple-bg);
      color: var(--purple-color);
    }

    &.fix {
      background: var(--error-bg);
      color: var(--error-color);
    }

    &.important {
      background: var(--error-bg);
      color: var(--error-color);
    }

    &.web {
      background: var(--purple-bg);
      color: var(--purple-color);
    }

    &.mobile {
      background: var(--purple-bg);
      color: var(--purple-color);
    }
  }

  .log-meta {
    display: flex;
    align-items: center;
    gap: 12px;

    .log-date {
      font-size: 12px;
      color: var(--text-tertiary);
    }

    .log-actions {
      display: flex;
      gap: 12px;

      a {
        font-size: 12px;
        color: var(--purple-color);
        cursor: pointer;

        &:last-child {
          color: var(--error-color);
        }

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .log-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px;
    color: var(--text-primary);
  }

  .log-summary {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0 0 12px;
    line-height: 1.5;
  }

  .cover-gallery {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 12px 0;

    .cover-gallery-img {
      width: calc(33.33% - 6px);
      max-width: 200px;
      aspect-ratio: 16 / 9;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      cursor: pointer;
      object-fit: cover;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.02);
      }
    }
  }

  .log-content {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-primary);

    :deep(h1),
    :deep(h2),
    :deep(h3) {
      margin: 16px 0 8px;
      color: var(--text-primary);
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 24px;
      margin: 8px 0;
    }

    :deep(li) {
      margin: 4px 0;
    }

    :deep(p) {
      margin: 8px 0;
    }

    :deep(code) {
      background: var(--bg-tertiary);
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 12px;
      color: var(--text-primary);
    }

    :deep(pre) {
      background: var(--bg-tertiary);
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
    }

    :deep(.platform-block) {
      margin: 16px 0;
      padding: 12px;
      background: var(--bg-secondary);
      border-radius: 6px;

      b {
        display: block;
        margin-bottom: 8px;
        color: var(--purple-color);
      }
    }
  }

  .log-footer {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border-color);

    .log-id {
      font-size: 12px;
      color: var(--text-tertiary);
    }
  }
}

// 加载更多
.load-more {
  text-align: center;
  margin-top: 24px;
  padding: 16px;

  .load-more-link {
    color: var(--purple-color);
    cursor: pointer;
    font-size: 14px;

    &:hover {
      text-decoration: underline;
    }
  }

  &.end span {
    color: var(--text-tertiary);
    font-size: 13px;
  }
}

// 响应式
@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;

    .header-right {
      flex-wrap: wrap;
    }
  }

  .content-scroll {
    max-height: calc(100vh - 200px);
    padding: 16px;
  }

  .log-item {
    padding: 16px;

    .log-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .cover-gallery .cover-gallery-img {
      width: calc(50% - 4px);
      max-width: 150px;
    }
  }
}
</style>
