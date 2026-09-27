<template>
  <Teleport to="body">
    <transition name="preview-fade">
      <div v-if="visible" class="preview-mask" @click.self="handleClose">
        <div class="preview-dialog">
          <!-- 头部 -->
          <div class="preview-header">
            <span class="file-title">{{ currentFileName }}</span>
            <div class="header-actions">
              <button class="action-btn delete-btn" @click="handleDeleteFile" title="删除文件">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="3 6,5 6,21 6"></polyline>
                  <path
                    d="M19 6V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
                  ></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
              <button class="action-btn download-btn" @click="handleDownload" title="下载文件">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>
              <button class="action-btn close-btn" @click="handleClose">×</button>
            </div>
          </div>

          <!-- 内容区 -->
          <div class="preview-content">
            <!-- 文件信息卡片 -->
            <div class="file-info-card">
              <div class="file-icon-wrapper">
                <div v-if="isPDF" class="file-type-icon pdf">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      stroke="white"
                      stroke-width="1.5"
                    />
                    <polyline points="14 2 14 8 20 8" stroke="white" stroke-width="1.5" />
                    <line x1="16" y1="13" x2="8" y2="13" stroke="white" stroke-width="1.5" />
                    <line x1="16" y1="17" x2="8" y2="17" stroke="white" stroke-width="1.5" />
                    <polyline points="10 9 9 9 8 9" stroke="white" stroke-width="1.5" />
                  </svg>
                </div>
                <div v-else-if="isImage" class="file-type-icon image">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                      stroke="white"
                      stroke-width="1.5"
                    />
                    <circle cx="8.5" cy="8.5" r="1.5" fill="white" />
                    <path d="M21 15l-5-5L5 21" stroke="white" stroke-width="1.5" />
                  </svg>
                </div>
                <div v-else-if="isVideo" class="file-type-icon video">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <polygon points="23 7 16 12 23 17 23 7" fill="white" />
                    <rect
                      x="3"
                      y="5"
                      width="15"
                      height="14"
                      rx="2"
                      ry="2"
                      stroke="white"
                      stroke-width="1.5"
                    />
                  </svg>
                </div>
                <div v-else-if="isAudio" class="file-type-icon audio">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 18V5l12-2v13M9 18a3 3 0 0 1 6 0M9 18a3 3 0 0 0-6 0M15 18a3 3 0 0 1 6 0M9 18a3 3 0 0 0-6 0"
                      stroke="white"
                      stroke-width="1.5"
                    />
                  </svg>
                </div>
                <div v-else-if="isWord" class="file-type-icon word">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      stroke="white"
                      stroke-width="1.5"
                    />
                    <polyline points="14 2 14 8 20 8" stroke="white" stroke-width="1.5" />
                    <line x1="16" y1="13" x2="8" y2="13" stroke="white" stroke-width="1.5" />
                    <line x1="16" y1="17" x2="8" y2="17" stroke="white" stroke-width="1.5" />
                    <polyline points="10 9 9 9 8 9" stroke="white" stroke-width="1.5" />
                  </svg>
                </div>
                <div v-else-if="isExcel" class="file-type-icon excel">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      stroke="white"
                      stroke-width="1.5"
                    />
                    <polyline points="14 2 14 8 20 8" stroke="white" stroke-width="1.5" />
                    <line x1="8" y1="13" x2="16" y2="13" stroke="white" stroke-width="1.5" />
                    <line x1="8" y1="17" x2="16" y2="17" stroke="white" stroke-width="1.5" />
                    <line x1="10" y1="9" x2="14" y2="9" stroke="white" stroke-width="1.5" />
                  </svg>
                </div>
                <div v-else-if="isPPT" class="file-type-icon ppt">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      stroke="white"
                      stroke-width="1.5"
                    />
                    <polyline points="14 2 14 8 20 8" stroke="white" stroke-width="1.5" />
                    <rect x="8" y="12" width="8" height="6" rx="1" fill="white" />
                    <line x1="12" y1="12" x2="12" y2="18" stroke="white" stroke-width="1.5" />
                  </svg>
                </div>
                <div v-else class="file-type-icon default">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      stroke="white"
                      stroke-width="1.5"
                    />
                    <polyline points="14 2 14 8 20 8" stroke="white" stroke-width="1.5" />
                    <line x1="16" y1="13" x2="8" y2="13" stroke="white" stroke-width="1.5" />
                    <line x1="16" y1="17" x2="8" y2="17" stroke="white" stroke-width="1.5" />
                    <polyline points="10 9 9 9 8 9" stroke="white" stroke-width="1.5" />
                  </svg>
                </div>
              </div>

              <div class="file-details">
                <div class="file-name">{{ file?.file.name }}</div>
                <div class="file-properties">
                  <div class="property-item">
                    <span class="property-label">大小</span>
                    <span class="property-value">{{ formatFileSize(file?.file.size || 0) }}</span>
                  </div>
                  <div class="property-item" v-if="file?.file.lastModified">
                    <span class="property-label">修改时间</span>
                    <span class="property-value">{{ formatDate(file?.file.lastModified) }}</span>
                  </div>
                  <div class="property-item">
                    <span class="property-label">类型</span>
                    <span class="property-value">{{
                      getFileTypeLabel(file?.file.type || "")
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 预览区 -->
            <div class="preview-area">
              <!-- PDF 预览 -->
              <div v-if="isPDF" class="pdf-preview">
                <iframe :src="fileUrl" frameborder="0"></iframe>
              </div>

              <!-- 图片预览 -->
              <div v-else-if="isImage" class="image-preview">
                <img
                  :src="fileUrl"
                  :alt="file?.file.name"
                  @load="onImageLoad"
                  @error="onImageError"
                />
              </div>

              <!-- 视频预览 -->
              <div v-else-if="isVideo" class="video-preview">
                <video :src="fileUrl" controls></video>
              </div>

              <!-- 音频预览 -->
              <div v-else-if="isAudio" class="audio-preview">
                <div class="audio-container">
                  <div class="audio-info">
                    <div class="audio-icon">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#1677ff"
                        stroke-width="2"
                      >
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                      </svg>
                    </div>
                    <div class="audio-details">
                      <div class="audio-name">{{ file?.file.name }}</div>
                      <div class="audio-meta">
                        {{ formatFileSize(file?.file.size || 0) }}
                      </div>
                    </div>
                  </div>
                  <audio :src="fileUrl" controls autoplay class="audio-player"></audio>
                </div>
              </div>

              <!-- Office 文档在线预览 -->
              <div v-else-if="isOffice" class="office-preview-container">
                <div v-if="officePreviewUrl" class="office-iframe-wrapper">
                  <iframe
                    :src="officePreviewUrl"
                    frameborder="0"
                    @load="handleOfficeLoad"
                    @error="handleOfficeError"
                  ></iframe>
                </div>
                <div v-else class="office-fallback">
                  <div class="office-icon">
                    <svg
                      v-if="isWord"
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#2b579a"
                      stroke-width="1.5"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <svg
                      v-else-if="isExcel"
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#217346"
                      stroke-width="1.5"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="8" y1="13" x2="16" y2="13"></line>
                      <line x1="8" y1="17" x2="16" y2="17"></line>
                      <line x1="10" y1="9" x2="14" y2="9"></line>
                    </svg>
                    <svg
                      v-else
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#d24726"
                      stroke-width="1.5"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <rect x="8" y="12" width="8" height="6" rx="1"></rect>
                      <line x1="12" y1="12" x2="12" y2="18"></line>
                    </svg>
                  </div>
                  <div class="office-info">
                    <div class="office-name">{{ file?.file.name }}</div>
                    <div class="office-meta">
                      {{ formatFileSize(file?.file.size || 0) }}
                    </div>
                    <p v-if="officeLoadError" class="office-error">在线预览失败，请尝试下载</p>
                    <p v-else class="office-tip">正在加载在线预览...</p>
                  </div>
                  <button class="action-download" @click="handleDownload">下载文件</button>
                </div>
              </div>

              <!-- 文本文件预览 -->
              <div v-else-if="isText" class="text-preview">
                <pre>{{ textContent }}</pre>
              </div>

              <!-- 不支持预览的文件类型 -->
              <div v-else class="unsupported-preview">
                <div class="file-icon">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#999"
                    stroke-width="1.5"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div class="file-info">
                  <div class="detail-name">{{ file?.file.name }}</div>
                  <div class="detail-meta">
                    {{ formatFileSize(file?.file.size || 0) }} ·
                    {{ getFileTypeLabel(file?.file.type || "") }}
                  </div>
                  <p class="tip-text">此文件类型暂不支持在线预览</p>
                </div>
                <button class="action-download" @click="handleDownload">下载文件</button>
              </div>
            </div>

            <!-- 多文件切换 -->
            <div class="file-switch" v-if="fileList.length > 1">
              <button
                class="switch-btn prev-btn"
                @click="handlePrevFile"
                :disabled="currentIndex === 0"
              >
                ← 上一个
              </button>
              <span class="switch-index">{{ currentIndex + 1 }} / {{ fileList.length }}</span>
              <button
                class="switch-btn next-btn"
                @click="handleNextFile"
                :disabled="currentIndex === fileList.length - 1"
              >
                下一个 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { SelectedFile } from "../types/untilsTypes";

interface Props {
  visible: boolean;
  file: SelectedFile | null;
  fileList: SelectedFile[];
  currentIndex: number;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  file: null,
  fileList: () => [],
  currentIndex: 0,
});

const emit = defineEmits<{
  (e: "close"): void;
  (e: "update:currentIndex", index: number): void;
  (e: "delete-file", fileId: string): void;
  (e: "download", file: SelectedFile): void;
}>();

const textContent = ref<string>("");
const loading = ref<boolean>(false);
const officePreviewUrl = ref<string>("");
const officeLoadError = ref<boolean>(false);
const imageLoaded = ref<boolean>(false);

const currentFileName = computed(() => {
  if (!props.file) return "";
  const name = props.file.file.name;
  return name.length <= 30 ? name : name.slice(0, 27) + "...";
});

const fileUrl = computed(() => {
  if (!props.file) return "";
  if (props.file.file instanceof File) {
    return URL.createObjectURL(props.file.file);
  }
  return props.file.previewUrl || "";
});

const isPDF = computed(() => props.file?.file.type === "application/pdf");
const isImage = computed(() => (props.file?.file.type || "").startsWith("image/"));
const isText = computed(() => {
  const type = props.file?.file.type || "";
  return [
    "text/plain",
    "text/html",
    "text/css",
    "application/json",
    "text/javascript",
    "text/xml",
  ].includes(type);
});
const isVideo = computed(() => (props.file?.file.type || "").startsWith("video/"));
const isAudio = computed(() => (props.file?.file.type || "").startsWith("audio/"));

const isOffice = computed(() => {
  const name = props.file?.file.name || "";
  const ext = name.split(".").pop()?.toLowerCase();
  return ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext || "");
});

const isWord = computed(() => {
  const ext = props.file?.file.name.split(".").pop()?.toLowerCase();
  return ["doc", "docx"].includes(ext || "");
});

const isExcel = computed(() => {
  const ext = props.file?.file.name.split(".").pop()?.toLowerCase();
  return ["xls", "xlsx"].includes(ext || "");
});

const isPPT = computed(() => {
  const ext = props.file?.file.name.split(".").pop()?.toLowerCase();
  return ["ppt", "pptx"].includes(ext || "");
});

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(bytes < 10 ? 1 : 0) + " " + sizes[i];
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const getFileTypeLabel = (mimeType: string): string => {
  if (!mimeType) return "文件";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word")) return "Word";
  if (mimeType.includes("sheet")) return "Excel";
  if (mimeType.includes("powerpoint")) return "PowerPoint";
  if (mimeType.includes("text")) return "文本";
  if (mimeType.includes("image")) return "图片";
  if (mimeType.includes("video")) return "视频";
  if (mimeType.includes("audio")) return "音频";

  // 检查扩展名
  const name = props.file?.file.name || "";
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "doc" || ext === "docx") return "Word";
  if (ext === "xls" || ext === "xlsx") return "Excel";
  if (ext === "ppt" || ext === "pptx") return "PowerPoint";
  if (ext === "pdf") return "PDF";
  if (ext === "txt") return "文本";
  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "gif" || ext === "webp")
    return "图片";
  if (ext === "mp4" || ext === "avi" || ext === "mov" || ext === "wmv") return "视频";
  if (ext === "mp3" || ext === "wav" || ext === "flac") return "音频";

  return "文件";
};

const handleClose = () => emit("close");
const handlePrevFile = () =>
  props.currentIndex > 0 && emit("update:currentIndex", props.currentIndex - 1);
const handleNextFile = () =>
  props.currentIndex < props.fileList.length - 1 &&
  emit("update:currentIndex", props.currentIndex + 1);
const handleDeleteFile = () => {
  if (props.file) {
    emit("delete-file", props.file.id);
    props.fileList.length <= 1 && handleClose();
  }
};
const handleDownload = () => props.file && emit("download", props.file);
const handleOfficeLoad = () => (loading.value = false);
const handleOfficeError = () => {
  loading.value = false;
  officeLoadError.value = true;
};

const onImageLoad = () => {
  imageLoaded.value = true;
};
const onImageError = () => {
  console.error("Image failed to load");
};

const generateOfficePreviewUrl = (fileUrl: string) =>
  `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

const loadTextContent = async () => {
  if (!props.file || !isText.value) return;
  loading.value = true;
  try {
    textContent.value = await props.file.file.text();
  } catch {
    textContent.value = "读取文件内容失败";
  } finally {
    loading.value = false;
  }
};

watch(
  () => [props.file, props.visible],
  ([newFile, newVisible]) => {
    if (newVisible && newFile) {
      officeLoadError.value = false;
      officePreviewUrl.value = "";
      isText.value && loadTextContent();
      if (isOffice.value) {
        loading.value = true;
        const url = fileUrl.value;
        url?.startsWith("http") && (officePreviewUrl.value = generateOfficePreviewUrl(url));
      }
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.25s ease;
}
.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}

.preview-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.preview-dialog {
  width: 92vw;
  max-width: 1200px;
  height: 88vh;
  max-height: 820px;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  animation: scaleIn 0.22s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0.96);
    opacity: 0.8;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafbfc;
}

.file-title {
  font-size: 16px;
  font-weight: 500;
  color: #1d2129;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-size: 16px;
}

.action-btn:hover {
  background: #f2f3f5;
  color: #1d2129;
}

.delete-btn:hover {
  background: #ffccc7;
  color: #ff4d4f;
}

.download-btn:hover {
  background: #e6f7ff;
  color: #1677ff;
}

.close-btn:hover {
  background: #f2f3f5;
  color: #1d2129;
}

.preview-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.file-info-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  gap: 16px;
}

.file-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-type-icon {
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-type-icon.pdf {
  background: #cc0000;
}
.file-type-icon.image {
  background: #0072bd;
}
.file-type-icon.video {
  background: #aa00ff;
}
.file-type-icon.audio {
  background: #00bcd4;
}
.file-type-icon.word {
  background: #2b579a;
}
.file-type-icon.excel {
  background: #217346;
}
.file-type-icon.ppt {
  background: #d24726;
}
.file-type-icon.default {
  background: #8c8c8c;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 12px;
  word-break: break-all;
}

.file-properties {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.property-item {
  display: flex;
  flex-direction: column;
}

.property-label {
  font-size: 12px;
  color: #86909c;
  margin-bottom: 2px;
}

.property-value {
  font-size: 14px;
  color: #1d2129;
  font-weight: 500;
}

.preview-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.pdf-preview {
  flex: 1;
  width: 100%;
  height: 100%;
}
.pdf-preview iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.image-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
  padding: 24px;
}
.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.video-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  padding: 24px;
}
.video-preview video {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
}

.audio-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
  padding: 40px;
}
.audio-container {
  width: 100%;
  max-width: 600px;
  background: #fff;
  border-radius: 16px;
  padding: 36px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.audio-player {
  width: 100%;
  margin-top: 20px;
}
.audio-info {
  display: flex;
  align-items: center;
  gap: 18px;
}
.audio-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.audio-details {
  flex: 1;
}
.audio-name {
  font-size: 16px;
  font-weight: 500;
  color: #1d2129;
  margin-bottom: 4px;
}
.audio-meta {
  font-size: 13px;
  color: #86909c;
}

.office-preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.office-iframe-wrapper {
  flex: 1;
  width: 100%;
  height: 100%;
}
.office-iframe-wrapper iframe {
  width: 100%;
  height: 100%;
  border: none;
}
.office-fallback {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px;
  gap: 24px;
}
.office-icon {
  width: 80px;
  height: 80px;
}
.office-info {
  text-align: center;
}
.office-name {
  font-size: 17px;
  font-weight: 500;
  color: #1d2129;
  margin-bottom: 8px;
}
.office-meta {
  font-size: 13px;
  color: #86909c;
  margin-bottom: 12px;
}
.office-tip {
  font-size: 14px;
  color: #666;
}
.office-error {
  font-size: 14px;
  color: #ff4d4f;
}

.text-preview {
  flex: 1;
  overflow: auto;
  padding: 24px;
  background: #f7f8fa;
}
.text-preview pre {
  margin: 0;
  font-family: Consolas, Monaco, monospace;
  font-size: 14px;
  line-height: 1.7;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.unsupported-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px;
  gap: 24px;
}
.file-icon {
  width: 80px;
  height: 80px;
}
.file-info {
  text-align: center;
}
.detail-name {
  font-size: 17px;
  font-weight: 500;
  color: #1d2129;
  margin-bottom: 8px;
}
.detail-meta {
  font-size: 13px;
  color: #86909c;
  margin-bottom: 12px;
}
.tip-text {
  font-size: 14px;
  color: #ff9800;
}

.action-download {
  padding: 12px 36px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: #1677ff;
  color: #fff;
  transition: all 0.2s ease;
}
.action-download:hover {
  background: #4096ff;
  transform: translateY(-1px);
}

.file-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 14px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fafbfc;
}
.switch-btn {
  padding: 8px 20px;
  border: 1px solid #e5e6eb;
  background: #fff;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  color: #4e5969;
  transition: all 0.2s ease;
}
.switch-btn:hover:not(:disabled) {
  border-color: #1677ff;
  color: #1677ff;
}
.switch-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.switch-index {
  font-size: 14px;
  color: #666;
  min-width: 60px;
  text-align: center;
}
</style>
