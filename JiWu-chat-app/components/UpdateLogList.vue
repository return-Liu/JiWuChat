<template>
  <div class="update-log-list">
    <!-- 头部（可选） -->
    <div v-if="showHeader" class="header-section">
      <div>
        <h1>更新日志</h1>
        <div class="stats">
          <span>共 {{ updateLogs.length }} 条记录</span>
          <span>{{ uniqueVersions.length }} 个版本</span>
        </div>
      </div>
      <div class="action-bar">
        <div class="select-box">
          <button class="select-btn" @click="toggleTagSelect">
            {{ selectedTagLabel }}
            <span class="arrow">▼</span>
          </button>
          <div v-if="tagSelectVisible" class="select-list">
            <div @click="selectTag('')">全部版本</div>
            <div v-for="v in uniqueVersions" :key="v" @click="selectTag(v)">
              {{ v }}
            </div>
          </div>
        </div>
        <button v-if="adminMode && isCurrentUserAdmin" class="add-btn" @click="$emit('create')">
          新增日志
        </button>
      </div>
    </div>

    <!-- 内容 -->
    <div class="content-wrapper">
      <div class="content-scroll">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <span class="spinner"></span>
          <span>加载中...</span>
        </div>

        <template v-else>
          <div v-if="displayLogs.length === 0" class="empty">暂无更新日志</div>

          <div v-for="log in displayLogs" :key="log.id" class="log-item">
            <div class="log-header">
              <div class="log-tags">
                <span class="version-badge" :style="{ background: log.tagColor || '#0969da' }">{{
                  log.version
                }}</span>
                <span v-if="log.updateType" :class="['tag', log.updateType]">{{
                  getUpdateTypeLabel(log.updateType)
                }}</span>
                <span v-if="log.isImportant" class="tag important">重要</span>
                <span v-if="log.platform && log.platform !== 'all'" :class="['tag', log.platform]">{{
                  getPlatformLabel(log.platform)
                }}</span>
              </div>
              <div class="log-date">
                {{ log.formattedTime || formatDate(log.createdAt) }}
              </div>
              <div v-if="adminMode && isCurrentUserAdmin" class="log-actions">
                <a @click="$emit('edit', log)">编辑</a>
                <a @click="$emit('delete', log)">删除</a>
              </div>
            </div>

            <h3 v-if="log.title" class="log-title">{{ log.title }}</h3>
            <p v-if="log.summary" class="log-summary">{{ log.summary }}</p>

            <div v-if="getCoverImages(log).length > 0" class="cover-gallery">
              <img
                v-for="(img, idx) in getCoverImages(log)"
                :key="idx"
                :src="img"
                class="cover-gallery-img"
                @click="previewCoverImage(getCoverImages(log), idx)"
              />
            </div>

            <div class="log-content" v-html="renderUpdateLogMarkdown(log.content)"></div>
          </div>

          <div v-if="hasMore" class="load-more">
            <a class="load-more-link" @click="loadMore">{{
              loadingMore ? "加载中..." : "展示更多"
            }}</a>
          </div>
          <div v-else-if="filteredLogs.length > pageSize" class="load-more end">
            <span>已显示全部 {{ filteredLogs.length }} 条记录</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 封面图预览弹窗 -->
    <Teleport to="body">
      <div v-if="previewVisible" class="modal-mask preview-mask" @click.self="closePreview">
        <div class="preview-container">
          <button class="preview-close" @click="closePreview">×</button>
          <button
            v-if="previewImages.length > 1"
            class="preview-arrow preview-prev"
            @click="previewPrev"
          >
            ‹
          </button>
          <img :src="previewImages[previewIndex]" class="preview-img" @click="closePreview" />
          <button
            v-if="previewImages.length > 1"
            class="preview-arrow preview-next"
            @click="previewNext"
          >
            ›
          </button>
          <div v-if="previewImages.length > 1" class="preview-dots">
            <span
              v-for="(_, i) in previewImages"
              :key="i"
              :class="{ active: i === previewIndex }"
              @click="previewIndex = i"
            ></span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { message } from "ant-design-vue";
import request from "../untils/request";
import { useUserStore } from "../stores/user";
import { renderUpdateLogMarkdown } from "../untils/markdownRenderer";
import "highlight.js/styles/github.css";

// ============ 类型定义 ============
interface UpdateLog {
  id: number;
  version: string;
  title: string;
  summary: string;
  content: string;
  updateType: string;
  tagColor: string;
  isImportant: boolean;
  releaseDate: string | null;
  coverImage: string | null;
  changelog: string | null;
  platform: string;
  createdAt: string;
  updatedAt: string;
  formattedTime?: string;
}

// ============ Props ============
const props = withDefaults(
  defineProps<{
    /** 是否显示顶部标题栏 */
    showHeader?: boolean;
    /** 管理模式：需要 token，可编辑/删除 */
    adminMode?: boolean;
    /** 自定义 API 基础路径 */
    apiBase?: string;
  }>(),
  {
    showHeader: true,
    adminMode: false,
    apiBase: "",
  },
);

// ============ Emits ============
const emit = defineEmits<{
  create: [];
  edit: [log: UpdateLog];
  delete: [log: UpdateLog];
}>();

// ============ Stores ============
const userStore = useUserStore();

// ============ 响应式数据 ============
const updateLogs = ref<UpdateLog[]>([]);
const filteredLogs = ref<UpdateLog[]>([]);
const selectedTag = ref("");
const tagSelectVisible = ref(false);
const loading = ref(true);
const loadingMore = ref(false);
const currentPage = ref(1);
const pageSize = 3;

// 封面图预览
const previewVisible = ref(false);
const previewImages = ref<string[]>([]);
const previewIndex = ref(0);

// ============ 常量 ============
const COVER_SEPARATOR = "|||";

// ============ 计算属性 ============
const isCurrentUserAdmin = computed(() => userStore.userId === 1);

const uniqueVersions = computed(() => {
  const versions = [...new Set(updateLogs.value.map((l) => l.version))];
  return versions.sort(compareVersions);
});

const selectedTagLabel = computed(() => {
  return selectedTag.value || "全部版本";
});

const displayLogs = computed(() => {
  return filteredLogs.value.slice(0, currentPage.value * pageSize);
});

const hasMore = computed(() => {
  return displayLogs.value.length < filteredLogs.value.length;
});

const apiBasePath = computed(() => {
  if (props.apiBase) return props.apiBase;
  return props.adminMode ? "/updatelogs" : "/updatelog";
});

// ============ 工具函数 ============

/**
 * 语义化版本号比较（降序）
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);
  const maxLen = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLen; i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA !== numB) {
      return numB - numA; // 降序
    }
  }
  return 0;
}

/**
 * 安全提取日志列表，兼容多种响应结构
 */
function extractLogs(res: any): UpdateLog[] {
  // 情况1: { data: { logs: [...] } }
  if (res?.data?.logs && Array.isArray(res.data.logs)) {
    return res.data.logs;
  }
  // 情况2: { logs: [...] } (拦截器已解包)
  if (res?.logs && Array.isArray(res.logs)) {
    return res.logs;
  }
  // 情况3: 直接是数组
  if (Array.isArray(res)) {
    return res;
  }
  // 情况4: { data: [...] }
  if (res?.data && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
}

const getCoverImages = (log: UpdateLog): string[] => {
  const raw = log.coverImage;
  if (!raw || typeof raw !== "string" || raw.trim() === "") return [];
  return raw.split(COVER_SEPARATOR).filter(Boolean);
};

const getUpdateTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    feature: "新功能",
    optimization: "优化",
    fix: "修复",
    other: "其他",
  };
  return map[t] || "其他";
};

const getPlatformLabel = (p: string) => {
  const map: Record<string, string> = {
    all: "所有平台",
    web: "PC客户端",
    mobile: "安卓版",
  };
  return map[p] || "所有平台";
};

const formatDate = (d?: string) => {
  if (!d) return "";
  const date = new Date(d);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

// ============ 数据获取 ============

const fetchLogs = async () => {
  loading.value = true;
  try {
    const res = await request.get(apiBasePath.value);
    const list = extractLogs(res);

    updateLogs.value = list.map((l) => ({
      ...l,
      formattedTime: l.formattedTime || formatDate(l.createdAt),
    }));

    // 按创建时间降序排列
    updateLogs.value.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );

    filterLogs();
  } catch (error) {
    console.error("获取更新日志失败:", error);
    message.error("获取更新日志失败");
    updateLogs.value = [];
    filteredLogs.value = [];
  } finally {
    loading.value = false;
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

// ============ 筛选操作 ============

const toggleTagSelect = () => {
  tagSelectVisible.value = !tagSelectVisible.value;
};

const selectTag = (tag: string) => {
  selectedTag.value = tag;
  tagSelectVisible.value = false;
  filterLogs();
};

// ============ 封面图预览 ============

const previewCoverImage = (images: string[], index: number) => {
  previewImages.value = images;
  previewIndex.value = index;
  previewVisible.value = true;
  document.body.style.overflow = "hidden";
};

const closePreview = () => {
  previewVisible.value = false;
  document.body.style.overflow = "";
};

const previewPrev = () => {
  if (previewIndex.value > 0) {
    previewIndex.value--;
  } else {
    previewIndex.value = previewImages.value.length - 1;
  }
};

const previewNext = () => {
  if (previewIndex.value < previewImages.value.length - 1) {
    previewIndex.value++;
  } else {
    previewIndex.value = 0;
  }
};

// ============ 事件处理 ============

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest?.(".select-box")) {
    tagSelectVisible.value = false;
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  if (!previewVisible.value) return;
  if (e.key === "Escape") {
    closePreview();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    previewPrev();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    previewNext();
  }
};

// ============ 暴露方法给父组件 ============

defineExpose({
  refresh: fetchLogs,
  selectTag,
  getLogs: () => updateLogs.value,
});

// ============ 生命周期 ============

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeydown);
  fetchLogs();
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = "";
});

// 监听 adminMode 变化，重新获取数据
watch(
  () => props.adminMode,
  () => {
    fetchLogs();
  },
);
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.update-log-list {
  background: #f5f5f5;
  min-height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: flex;
  flex-direction: column;
}

/* ===== 头部 ===== */
.header-section {
  background: #fff;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  flex-shrink: 0;
}

.header-section h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #222;
}

.stats {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #666;
}

.action-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* ===== 下拉选择器 ===== */
.select-box {
  position: relative;
}

.select-btn {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  gap: 8px;
  align-items: center;
  transition: border-color 0.2s;
}
.select-btn:hover {
  border-color: #1890ff;
}

.arrow {
  font-size: 10px;
  transition: transform 0.2s;
}

.select-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-top: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
}

.select-list div {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
}
.select-list div:hover {
  background: #f0f0f0;
}
.select-list div:first-child {
  font-weight: 500;
}

.add-btn {
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}
.add-btn:hover {
  background: #40a9ff;
}

/* ===== 内容区域 ===== */
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
}

.content-scroll::-webkit-scrollbar {
  width: 8px;
}
.content-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
.content-scroll::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}
.content-scroll::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
.content-scroll {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

/* ===== 加载状态 ===== */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px;
  color: #999;
  font-size: 14px;
}

.spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid #f0f0f0;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ===== 空状态 ===== */
.empty {
  text-align: center;
  padding: 60px;
  color: #999;
  font-size: 14px;
}

/* ===== 日志卡片 ===== */
.log-item {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  transition: box-shadow 0.2s;
}
.log-item:hover {
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
  padding: 2px 8px;
  border-radius: 4px;
  color: #fff;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f0f0f0;
  color: #555;
  font-weight: 500;
}
.tag.feature {
  background: #e6f7e6;
  color: #2e7d32;
}
.tag.optimization {
  background: #e6f0ff;
  color: #1565c0;
}
.tag.fix {
  background: #ffe6e6;
  color: #c62828;
}
.tag.important {
  background: #fff3e0;
  color: #e65100;
}
.tag.web {
  background: #e6f0ff;
  color: #1565c0;
}
.tag.mobile {
  background: #f3e6ff;
  color: #7b1fa2;
}

.log-date {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.log-actions {
  display: flex;
  gap: 12px;
}
.log-actions a {
  font-size: 12px;
  color: #1890ff;
  cursor: pointer;
}
.log-actions a:last-child {
  color: #ff4d4f;
}
.log-actions a:hover {
  text-decoration: underline;
}

.log-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #222;
}

.log-summary {
  font-size: 14px;
  color: #666;
  margin: 0 0 16px;
  line-height: 1.5;
}

/* ===== 封面图 ===== */
.cover-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 16px;
}
.cover-gallery-img {
  width: calc(33.33% - 6px);
  max-width: 200px;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  border: 1px solid #eee;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  object-fit: cover;
}
.cover-gallery-img:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* ===== 日志内容 ===== */
.log-content {
  font-size: 14px;
  line-height: 1.7;
  color: #333;
}

.log-content :deep(h1),
.log-content :deep(h2),
.log-content :deep(h3) {
  margin: 18px 0 10px;
  font-weight: 600;
}
.log-content :deep(h1) {
  font-size: 20px;
}
.log-content :deep(h2) {
  font-size: 18px;
}
.log-content :deep(h3) {
  font-size: 16px;
}
.log-content :deep(ul),
.log-content :deep(ol) {
  padding-left: 24px;
  margin: 8px 0;
}
.log-content :deep(li) {
  margin: 4px 0;
}
.log-content :deep(p) {
  margin: 8px 0;
}
.log-content :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
}
.log-content :deep(pre) {
  background: #f5f5f5;
  padding: 14px 16px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 13px;
  margin: 10px 0;
}
.log-content :deep(pre code) {
  background: transparent;
  padding: 0;
}
.log-content :deep(blockquote) {
  border-left: 4px solid #1890ff;
  padding-left: 16px;
  margin: 10px 0;
  color: #666;
}
.log-content :deep(hr) {
  border: none;
  border-top: 1px solid #e8e8e8;
  margin: 16px 0;
}
.log-content :deep(a) {
  color: #1890ff;
  text-decoration: none;
}
.log-content :deep(a:hover) {
  text-decoration: underline;
}
.log-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
}
.log-content :deep(th),
.log-content :deep(td) {
  border: 1px solid #e8e8e8;
  padding: 8px 12px;
  text-align: left;
}
.log-content :deep(th) {
  background: #fafafa;
  font-weight: 600;
}
.log-content :deep(img) {
  max-width: 100%;
  border-radius: 6px;
}

/* ===== 加载更多 ===== */
.load-more {
  text-align: center;
  margin-top: 24px;
  padding: 16px;
}
.load-more-link {
  color: #1890ff;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s;
}
.load-more-link:hover {
  color: #40a9ff;
  text-decoration: underline;
}
.load-more.end span {
  color: #999;
  font-size: 13px;
}

/* ===== 封面图预览弹窗 ===== */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.preview-mask {
  z-index: 10000;
}

.preview-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 92vw;
  max-height: 92vh;
}

.preview-img {
  max-width: 90vw;
  max-height: 85vh;
  border-radius: 8px;
  object-fit: contain;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.preview-close {
  position: absolute;
  top: -44px;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: none;
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}
.preview-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.preview-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border: none;
  font-size: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
  z-index: 1;
}
.preview-arrow:hover {
  background: rgba(255, 255, 255, 0.25);
}
.preview-prev {
  left: -60px;
}
.preview-next {
  right: -60px;
}

.preview-dots {
  position: absolute;
  bottom: -36px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}
.preview-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: 0.2s;
}
.preview-dots span.active {
  background: #fff;
  transform: scale(1.2);
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 16px;
  }

  .action-bar {
    flex-wrap: wrap;
  }

  .content-scroll {
    max-height: calc(100vh - 200px);
    padding: 12px;
  }

  .log-item {
    padding: 16px;
  }

  .log-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .log-actions {
    margin-top: 4px;
  }

  .cover-gallery-img {
    width: calc(50% - 4px);
    max-width: none;
  }

  .preview-arrow {
    width: 32px;
    height: 32px;
    font-size: 20px;
  }
  .preview-prev {
    left: -40px;
  }
  .preview-next {
    right: -40px;
  }
}

@media (max-width: 480px) {
  .header-section h1 {
    font-size: 20px;
  }

  .stats {
    font-size: 12px;
    gap: 12px;
  }

  .content-scroll {
    padding: 8px;
  }

  .log-item {
    padding: 12px;
    border-radius: 6px;
  }

  .log-title {
    font-size: 16px;
  }

  .cover-gallery-img {
    width: 100%;
    max-width: none;
  }

  .preview-arrow {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }
  .preview-prev {
    left: -30px;
  }
  .preview-next {
    right: -30px;
  }
  .preview-close {
    top: -38px;
    width: 30px;
    height: 30px;
    font-size: 18px;
  }
}

/* ===== 暗色主题 ===== */
:root.dark .update-log-list {
  background: #1a1a1a;
}

:root.dark .header-section {
  background: #222;
  border-bottom-color: #333;
}
:root.dark .header-section h1 {
  color: #eee;
}
:root.dark .stats {
  color: #999;
}

:root.dark .select-btn {
  background: #2a2a2a;
  border-color: #444;
  color: #ddd;
}
:root.dark .select-btn:hover {
  border-color: #1890ff;
}
:root.dark .select-list {
  background: #2a2a2a;
  border-color: #444;
}
:root.dark .select-list div {
  color: #ddd;
}
:root.dark .select-list div:hover {
  background: #333;
}

:root.dark .log-item {
  background: #222;
  border-color: #333;
}
:root.dark .log-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

:root.dark .log-title {
  color: #eee;
}
:root.dark .log-summary {
  color: #aaa;
}
:root.dark .log-content {
  color: #ccc;
}
:root.dark .log-date {
  color: #777;
}

:root.dark .tag {
  background: #333;
  color: #aaa;
}
:root.dark .tag.feature {
  background: #1a3a1a;
  color: #66bb6a;
}
:root.dark .tag.optimization {
  background: #1a2a4a;
  color: #42a5f5;
}
:root.dark .tag.fix {
  background: #3a1a1a;
  color: #ef5350;
}
:root.dark .tag.important {
  background: #3a2a1a;
  color: #ffa726;
}

:root.dark .log-content :deep(code) {
  background: #2a2a2a;
  color: #eee;
}
:root.dark .log-content :deep(pre) {
  background: #2a2a2a;
}
:root.dark .log-content :deep(blockquote) {
  color: #999;
}
:root.dark .log-content :deep(th),
:root.dark .log-content :deep(td) {
  border-color: #444;
}
:root.dark .log-content :deep(th) {
  background: #2a2a2a;
}
:root.dark .log-content :deep(hr) {
  border-color: #333;
}

:root.dark .cover-gallery-img {
  border-color: #333;
}
:root.dark .loading-state {
  color: #777;
}
:root.dark .empty {
  color: #777;
}

:root.dark .content-scroll::-webkit-scrollbar-track {
  background: #222;
}
:root.dark .content-scroll::-webkit-scrollbar-thumb {
  background: #444;
}
:root.dark .content-scroll::-webkit-scrollbar-thumb:hover {
  background: #555;
}
:root.dark .content-scroll {
  scrollbar-color: #444 #222;
}
</style>