<template>
  <div v-if="visible" class="report-detail-modal" @click="handleClose">
    <div class="report-detail-content" @click.stop>
      <div class="report-detail-header">
        <h3 class="report-detail-title">举报详情</h3>
        <button class="close-btn" @click="handleClose" :disabled="loading">
          ✕
        </button>
      </div>

      <div v-if="report" class="report-detail-body">
        <div class="detail-section">
          <h4 class="section-title">被举报对象</h4>
          <div class="target-info">
            <div class="target-avatar">
              <img :src="getTargetAvatar()" />
            </div>
            <div class="target-meta">
              <div class="target-name">{{ getTargetName() }}</div>
              <span
                class="target-type"
                :class="report.reportedGroup ? 'group' : 'user'"
              >
                {{ report.reportedGroup ? "群聊" : "用户" }}
              </span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">举报信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">举报原因</span>
              <span class="info-value">{{ getReasonText(report.reason) }}</span>
            </div>
            <div v-if="report.description" class="info-item full-width">
              <span class="info-label">补充说明</span>
              <span class="info-value description">{{
                report.description
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">举报时间</span>
              <span class="info-value">{{ report.createdAt }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">状态</span>
              <span class="status-tag" :class="getStatusClass(report.status)">
                {{ getStatusLabel(report.status) }}
              </span>
            </div>
          </div>
        </div>

        <div
          v-if="report.evidenceFiles && report.evidenceFiles.length > 0"
          class="detail-section"
        >
          <h4 class="section-title">
            证据材料 ({{ report.evidenceFiles.length }})
          </h4>
          <div class="evidence-list">
            <div
              v-for="(file, index) in report.evidenceFiles"
              :key="index"
              class="evidence-item"
              @click="handlePreviewFile(file)"
            >
              <div class="evidence-preview">
                <div v-if="isImage(file.type)" class="evidence-image">
                  <img :src="file.url" alt="证据图片" loading="lazy" />
                  <span class="file-type-badge">图片</span>
                </div>
                <div v-else-if="isVideo(file.type)" class="evidence-video">
                  <video
                    :src="file.url"
                    poster=""
                    controls
                    preload="metadata"
                  ></video>
                  <span class="file-type-badge">视频</span>
                </div>
              </div>
              <div class="evidence-info">
                <div class="file-name" :title="file.name">{{ file.name }}</div>
                <div class="file-size">{{ formatFileSize(file.size) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="report.adminNote || report.processedAt"
          class="detail-section"
        >
          <h4 class="section-title">处理结果</h4>
          <div class="info-grid">
            <div v-if="report.adminNote" class="info-item full-width">
              <span class="info-label">管理员备注</span>
              <span class="info-value">{{ report.adminNote }}</span>
            </div>
            <div v-if="report.processedAt" class="info-item">
              <span class="info-label">处理时间</span>
              <span class="info-value">{{ report.processedAt }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="loading-container">
        <div v-if="loading" class="loading-spinner"></div>
        <span>{{ loading ? "加载中..." : "未找到举报记录" }}</span>
      </div>
    </div>

    <MediaPreview
      v-model:visible="showPreview"
      :image="
        previewType === 'image' ? [{ url: previewUrl, type: 'image' }] : []
      "
      :video="
        previewType === 'video' ? [{ url: previewUrl, type: 'video' }] : []
      "
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

interface ReportItem {
  id: number;
  reason: string;
  description: string | null;
  evidenceFiles: Array<{
    url: string;
    name: string;
    type: string;
    size?: number;
  }> | null;
  status: "pending" | "processing" | "resolved" | "rejected";
  adminNote: string | null;
  processedAt: string | null;
  processedBy: string | null;
  createdAt: string;
  reporter: {
    id: number;
    username: string;
    nickname: string;
    avatar: string;
  } | null;
  reportedUser: {
    id: number;
    username: string;
    nickname: string;
    avatar: string;
  } | null;
  reportedGroup: {
    id: number;
    name: string;
    avatar: string;
    groupNumber: string;
  } | null;
}

const props = defineProps({
  visible: { type: Boolean, default: false },
  report: { type: Object as () => ReportItem | null, default: null },
});

const emit = defineEmits(["update:visible"]);

const loading = ref(false);
const showPreview = ref(false);
const previewUrl = ref("");
const previewType = ref<"image" | "video">("image");

const defaultAvatar =
  "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png";

watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.report) {
      loading.value = false;
    }
  },
);

function getTargetName(): string {
  if (!props.report) return "";
  if (props.report.reportedGroup) return props.report.reportedGroup.name;
  if (props.report.reportedUser)
    return (
      props.report.reportedUser.nickname || props.report.reportedUser.username
    );
  return "未知对象";
}

function getTargetAvatar(): string {
  if (!props.report) return defaultAvatar;
  if (props.report.reportedGroup)
    return props.report.reportedGroup.avatar || defaultAvatar;
  if (props.report.reportedUser)
    return props.report.reportedUser.avatar || defaultAvatar;
  return defaultAvatar;
}

function getReasonText(reason: string): string {
  const reasonMap: Record<string, string> = {
    porn: "色情内容",
    violence: "暴力恐怖",
    fraud: "网络诈骗",
    harassment: "骚扰他人",
    advertising: "广告推广",
    politics: "政治敏感",
    other: "其他",
  };
  return reasonMap[reason] || reason;
}

function getStatusClass(status: string): string {
  const classMap: Record<string, string> = {
    pending: "pending",
    processing: "processing",
    resolved: "resolved",
    rejected: "rejected",
  };
  return classMap[status] || "pending";
}

function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    pending: "待处理",
    processing: "处理中",
    resolved: "已处理",
    rejected: "已驳回",
  };
  return labelMap[status] || status;
}

function formatFileSize(size?: number): string {
  if (!size) return "";
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function isImage(type: string): boolean {
  return type.startsWith("image/");
}

function isVideo(type: string): boolean {
  return type.startsWith("video/");
}

function handlePreviewFile(file: { url: string; type: string }) {
  previewUrl.value = file.url;
  previewType.value = isVideo(file.type) ? "video" : "image";
  showPreview.value = true;
}

function handleClose() {
  emit("update:visible", false);
}
</script>

<style scoped lang="scss">
.report-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2001;
}

.report-detail-content {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.report-detail-header {
  padding: 14px 20px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.report-detail-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
}

.close-btn {
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  color: #8e8e93;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.report-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.detail-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
}

.target-info {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 10px;
}

.target-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.target-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.target-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.target-name {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
}

.target-type {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.target-type.user {
  background: #e6f7ff;
  color: #007aff;
}

.target-type.group {
  background: #f0f0f0;
  color: #666;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  background: #f8f8f8;
  border-radius: 10px;
  padding: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.full-width {
    grid-column: 1 / -1;
  }
}

.info-label {
  font-size: 11px;
  color: #8e8e93;
}

.info-value {
  font-size: 13px;
  color: #1a1a1a;
  line-height: 1.4;

  &.description {
    background: #fff;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid #e5e5e5;
  }
}

.status-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.status-tag.pending {
  background: #fff3e0;
  color: #ff9800;
}

.status-tag.processing {
  background: #e6f7ff;
  color: #007aff;
}

.status-tag.resolved {
  background: #e6f7e6;
  color: #28a745;
}

.status-tag.rejected {
  background: #ffe6e6;
  color: #ff3b30;
}

.evidence-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.evidence-item {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.evidence-item:hover {
  border-color: #007aff;
  transform: translateY(-2px);
}

.evidence-preview {
  position: relative;
  width: 100%;
  height: 120px;
  overflow: hidden;
  background: #f5f5f5;
}

.evidence-image {
  width: 100%;
  height: 100%;
}

.evidence-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.evidence-video {
  width: 100%;
  height: 100%;
  background: #000;
}

.evidence-video video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-type-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.evidence-info {
  padding: 8px 10px;
  border-top: 1px solid #f0f0f0;
}

.file-name {
  font-size: 12px;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  margin-bottom: 2px;
}

.file-size {
  font-size: 10px;
  color: #8e8e93;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
  color: #8e8e93;
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 2px solid #e5e5e5;
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
