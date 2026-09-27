<template>
  <div>
    <!-- 主弹窗 -->
    <transition name="modal-fade">
      <div v-if="visible" class="modal-overlay" @click="handleClose">
        <div class="modal-container" @click.stop>
          <!-- 头部 -->
          <div class="modal-header">
            <div class="header-left">
              <i class="iconfont icon-pilianggengxin"></i>
              <span class="header-title">更新公告</span>
            </div>
            <button class="close-btn" @click="handleClose">×</button>
          </div>

          <!-- 内容 -->
          <div class="modal-body">
            <div v-if="loading" class="loading-state">
              <div class="loading-spinner"></div>
              <span>正在加载更新...</span>
            </div>

            <div v-else-if="updateLogs.length > 0" class="update-content">
              <!-- 版本切换 -->
              <div class="version-selector" @click="toggleVersionList">
                <div class="version-selector-left">
                  <i class="iconfont icon-version"></i>
                  <span class="version-selector-label">查看最近更新内容</span>
                </div>
                <div class="version-selector-right">
                  <span class="current-version">{{ currentLog?.version || "" }}</span>
                  <i class="iconfont icon-arrow-down" :class="{ 'is-open': showVersionList }"></i>
                </div>
              </div>

              <!-- 版本下拉列表 -->
              <transition name="slide-down">
                <div v-if="showVersionList" class="version-list">
                  <div
                    v-for="log in updateLogs"
                    :key="log.id"
                    class="version-item"
                    :class="{ active: currentLog && currentLog.id === log.id }"
                    @click="selectVersion(log)"
                  >
                    <div class="version-item-left">
                      <span class="version-item-tag">{{ log.version }}</span>
                      <span v-if="log.isImportant" class="tag-important">重要</span>
                      <span v-if="log.id === updateLogs[0]?.id" class="tag-latest">最新</span>
                    </div>
                    <span class="version-item-date">{{ formatTime(log.createdAt) }}</span>
                  </div>
                </div>
              </transition>

              <!-- 当前选中的版本详情 -->
              <template v-if="currentLog">
                <div class="version-info">
                  <span class="version-badge">版本 {{ currentLog.version }}</span>
                  <span class="update-time">{{ formatTime(currentLog.createdAt) }}</span>
                </div>

                <div v-if="currentLog.title" class="update-title">
                  {{ currentLog.title }}
                </div>

                <div v-if="currentLog.summary" class="update-summary">
                  {{ currentLog.summary }}
                </div>

                <!-- 封面图展示 -->
                <div v-if="coverImages.length > 0" class="cover-gallery">
                  <img
                    v-for="(img, idx) in coverImages"
                    :key="idx"
                    :src="img"
                    class="cover-gallery-img"
                    @click="openImagePreview(idx)"
                  />
                </div>

                <div class="update-details">
                  <div class="details-title">详细内容</div>
                  <div class="details-content" v-html="renderMarkdown(currentLog.content)"></div>
                </div>
              </template>
            </div>

            <div v-else class="empty-state">
              <i class="iconfont icon-pilianggengxin"></i>
              <p>暂无更新日志</p>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="modal-footer">
            <div class="footer-left">
              <button class="btn-feedback" @click="openFeedback">
                <i class="iconfont icon-yaoqingdaoshi"></i>
                <span>意见反馈</span>
              </button>
            </div>
            <div class="footer-right">
              <button class="btn-default" @click="handleLater">稍后提醒</button>
              <button
                class="btn-primary"
                @click="handleViewAll"
                :disabled="updateLogs.length === 0"
              >
                查看全部
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 反馈弹窗 -->
    <FeedbackModal v-model:visible="feedbackVisible" :default-type="'update'" />

    <!-- 图片预览组件 -->
    <MediaPreview
      v-model:visible="previewVisible"
      :image="previewImageList"
      :current-media-index="previewIndex"
      @update:current-media-index="previewIndex = $event"
      group-name="版本更新内容封面"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import request from "../untils/request";
import FeedbackModal from "./FeedbackModal.vue";
import MediaPreview from "./MediaPreview.vue";
import { renderMarkdown } from "../untils/markdownRenderer";

const router = useRouter();

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const loading = ref(false);
const updateLogs = ref<any[]>([]);
const currentLog = ref<any>(null);
const showVersionList = ref(false);
const feedbackVisible = ref(false);

// 封面图相关
const COVER_SEPARATOR = "|||";
const previewVisible = ref(false);
const previewImageList = ref<string[]>([]);
const previewIndex = ref(0);

// 获取封面图列表
const coverImages = computed(() => {
  const raw = currentLog.value?.coverImage;
  if (!raw || typeof raw !== "string" || raw.trim() === "") return [];
  return raw.split(COVER_SEPARATOR).filter(Boolean);
});

// 打开图片预览
const openImagePreview = (index: number) => {
  previewImageList.value = coverImages.value;
  previewIndex.value = index;
  previewVisible.value = true;
};

const toggleVersionList = () => {
  showVersionList.value = !showVersionList.value;
};

const selectVersion = (log: any) => {
  currentLog.value = log;
  showVersionList.value = false;
};

const openFeedback = () => {
  feedbackVisible.value = true;
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return "";
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `今天 ${hours}:${minutes}`;
  } else if (days === 1) {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `昨天 ${hours}:${minutes}`;
  } else {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${month}月${day}日`;
  }
};

const handleClose = () => {
  showVersionList.value = false;
  emit("update:visible", false);
};

const handleLater = () => {
  if (updateLogs.value.length > 0) {
    localStorage.setItem("lastViewedUpdateVersion", updateLogs.value[0].version);
  }
  emit("update:visible", false);
};

const handleViewAll = () => {
  if (updateLogs.value.length > 0) {
    localStorage.setItem("lastViewedUpdateVersion", updateLogs.value[0].version);
  }
  emit("update:visible", false);
  setTimeout(() => {
    router.push("/updateLogs");
  }, 200);
};

const fetchUpdateLogs = async () => {
  try {
    loading.value = true;
    const res = await request.get("/updatelogs");

    let logs = [];
    if (res && res.data) {
      logs = Array.isArray(res.data) ? res.data : res.data?.logs || [];
    }

    logs.sort(
      (a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );

    updateLogs.value = logs;

    if (logs.length > 0) {
      currentLog.value = logs[0];
    }
  } catch (err) {
    console.error("获取更新日志失败:", err);
    updateLogs.value = [];
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal && updateLogs.value.length === 0) {
      fetchUpdateLogs();
    }
  },
);

onMounted(() => {
  if (props.visible) {
    fetchUpdateLogs();
  }
});

defineExpose({
  fetchUpdateLogs,
});
</script>

<style scoped>
/* 遮罩层 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* 弹窗容器 */
.modal-container {
  width: 560px;
  max-width: 92%;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  animation: modalIn 0.25s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 头部 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 22px;
  color: #bbb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

/* 内容区域 */
.modal-body {
  padding: 20px 24px 16px;
  max-height: 520px;
  overflow-y: auto;
}

.modal-body::-webkit-scrollbar {
  width: 4px;
}

.modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  gap: 14px;
  color: #999;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #f0f0f0;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 更新内容 */
.update-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 版本选择器 */
.version-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e8ecf0;
  user-select: none;
}

.version-selector:hover {
  background: #eef2f7;
  border-color: #d0d8e0;
}

.version-selector-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-selector-left .iconfont {
  font-size: 16px;
  color: #1890ff;
}

.version-selector-label {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.version-selector-right {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
}

.current-version {
  font-size: 13px;
  color: #1890ff;
  font-weight: 500;
}

.version-selector-right .iconfont {
  font-size: 12px;
  transition: transform 0.3s ease;
  color: #bbb;
}

.version-selector-right .iconfont.is-open {
  transform: rotate(180deg);
}

/* 版本下拉列表 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.version-list {
  background: #ffffff;
  border: 1px solid #e8ecf0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  max-height: 260px;
  overflow-y: auto;
}

.version-list::-webkit-scrollbar {
  width: 4px;
}

.version-list::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 4px;
}

.version-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
}

.version-item:last-child {
  border-bottom: none;
}

.version-item:hover {
  background: #f5f7fa;
}

.version-item.active {
  background: #e6f0ff;
}

.version-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-item-tag {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.tag-important {
  font-size: 10px;
  padding: 1px 8px;
  background: #ff4d4f;
  color: #fff;
  border-radius: 10px;
}

.tag-latest {
  font-size: 10px;
  padding: 1px 8px;
  background: #1890ff;
  color: #fff;
  border-radius: 10px;
}

.version-item-date {
  font-size: 12px;
  color: #999;
}

/* 版本详情 */
.version-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.version-badge {
  display: inline-block;
  padding: 4px 14px;
  background: #e6f0ff;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1890ff;
}

.update-time {
  font-size: 13px;
  color: #aaa;
}

.update-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.6;
  margin: 2px 0;
}

.update-summary {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 10px;
  margin: 4px 0;
}

/* 封面图样式 */
.cover-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.cover-gallery-img {
  width: calc(33.33% - 6px);
  max-width: 160px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  border: 1px solid #eee;
  cursor: pointer;
  /* object-fit: cover; */
  transition: transform 0.2s ease;
}

/* .cover-gallery-img:hover {
  transform: scale(1.03);
} */

/* 更新详情 */
.update-details {
  margin-top: 4px;
}

.details-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

/* 更新内容样式 */
.details-content {
  font-size: 14px;
  color: #333;
  line-height: 1.8;
}

.details-content :deep(h3) {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  padding: 16px 0 10px;
  margin: 8px 0 12px;
  border-bottom: 2px solid #e8ecf0;
}

.details-content :deep(ul) {
  margin: 4px 0 6px;
  padding-left: 20px;
  list-style-type: disc;
}

.details-content :deep(li) {
  margin: 2px 0;
  padding: 2px 0;
  color: #444;
  line-height: 1.8;
}

.details-content :deep(li::marker) {
  color: #1890ff;
}

.details-content :deep(p) {
  color: #444;
  line-height: 1.8;
  margin: 6px 0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  color: #aaa;
}

/* 底部按钮 */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px 18px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.footer-left {
  display: flex;
  align-items: center;
}

.footer-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-feedback {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: #999;
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-feedback:hover {
  color: #1890ff;
}

.btn-feedback .iconfont {
  font-size: 16px;
}

.btn-default,
.btn-primary {
  padding: 10px 28px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s;
  border: none;
  font-weight: 500;
}

.btn-default {
  background: #f0f0f0;
  color: #666;
}

.btn-default:hover {
  background: #e5e5e5;
}

.btn-primary {
  background: #1890ff;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .modal-container {
    width: 100%;
    max-width: 95%;
    border-radius: 12px;
  }

  .modal-header {
    padding: 16px 18px 12px;
  }

  .modal-body {
    padding: 16px 18px 12px;
    max-height: 450px;
  }

  .header-title {
    font-size: 16px;
  }

  .update-title {
    font-size: 17px;
  }

  .version-selector {
    padding: 8px 12px;
  }

  .version-selector-label {
    font-size: 12px;
  }

  .version-item {
    padding: 8px 12px;
  }

  .modal-footer {
    flex-direction: column-reverse;
    gap: 10px;
    padding: 12px 18px 16px;
  }

  .footer-left {
    width: 100%;
    justify-content: center;
  }

  .footer-right {
    width: 100%;
    justify-content: center;
  }

  .btn-default,
  .btn-primary {
    padding: 8px 20px;
    font-size: 13px;
  }

  .details-content .module-card {
    margin: 12px 0;
  }

  .details-content .module-title {
    padding: 10px 14px;
    font-size: 14px;
  }

  .details-content .module-body {
    padding: 10px 14px 12px;
  }

  .details-content .content-list {
    padding-left: 16px;
  }

  .cover-gallery-img {
    width: calc(50% - 4px);
    max-width: 120px;
  }
}
</style>
