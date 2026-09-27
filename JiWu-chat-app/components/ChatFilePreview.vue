<template>
  <Teleport to="body">
    <Transition name="file-preview-fade">
      <div v-if="visible" class="file-preview-mask" @click.self="handleClose">
        <div class="file-preview-container">
          <!-- 头部 -->
          <div class="preview-header">
            <span class="preview-title">文件预览</span>
            <button class="close-btn" @click="handleClose">
              <i class="iconfont icon-guanbi"></i>
            </button>
          </div>

          <!-- 文件信息卡片 -->
          <div class="file-info-card" v-if="fileInfo">
            <div class="file-icon-wrapper">
              <i :class="getFileIconClass(fileInfo.type)" class="file-icon"></i>
            </div>
            <div class="file-details">
              <div class="file-name" :title="fileInfo.filename">
                {{ fileInfo.filename }}
              </div>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(fileInfo.size) }}</span>
                <span class="file-type">{{ getFileTypeLabel(fileInfo.type) }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="preview-actions">
            <button class="action-btn primary" @click="handleDownload">
              <i class="iconfont icon-xiazai"></i>
              <span>下载文件</span>
            </button>
            <button v-if="canPreview" class="action-btn secondary" @click="handleOpenInBrowser">
              <i class="iconfont icon-liulanqi"></i>
              <span>浏览器打开</span>
            </button>
          </div>

          <!-- 提示信息 -->
          <div class="preview-tip">
            <i class="iconfont icon-tishi"></i>
            <span>建议先下载后查看，确保文件完整性</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { message } from "ant-design-vue";

interface FileInfo {
  url: string;
  filename: string;
  size: number;
  type: string;
}

interface Props {
  visible: boolean;
  fileInfo: FileInfo | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "download", fileInfo: FileInfo): void;
}>();

// 可预览的文件类型
const previewTypes = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "pdf"];

const canPreview = computed(() => {
  if (!props.fileInfo) return false;
  return previewTypes.includes(props.fileInfo.type.toLowerCase());
});

// 文件图标映射
const iconMap: Record<string, string> = {
  pdf: "iconfont icon-PDF",
  doc: "iconfont icon-word",
  docx: "iconfont icon-word",
  xls: "iconfont icon-Excel",
  xlsx: "iconfont icon-Excel",
  ppt: "iconfont icon-ppt",
  pptx: "iconfont icon-ppt",
  txt: "iconfont icon-txt",
  zip: "iconfont icon-zip",
  rar: "iconfont icon-zip",
  "7z": "iconfont icon-zip",
  jpg: "iconfont icon-file-image",
  jpeg: "iconfont icon-file-image",
  png: "iconfont icon-file-image",
  gif: "iconfont icon-file-image",
  mp4: "iconfont icon-video-file",
  avi: "iconfont icon-video-file",
  mov: "iconfont icon-video-file",
  mp3: "iconfont icon-music-file-o",
  wav: "iconfont icon-music-file-o",
};

// 文件类型映射
const typeMap: Record<string, string> = {
  pdf: "PDF文档",
  doc: "Word文档",
  docx: "Word文档",
  xls: "Excel表格",
  xlsx: "Excel表格",
  ppt: "PPT演示",
  pptx: "PPT演示",
  txt: "文本文件",
  zip: "压缩文件",
  rar: "压缩文件",
  "7z": "压缩文件",
  jpg: "图片文件",
  jpeg: "图片文件",
  png: "图片文件",
  gif: "图片文件",
  mp4: "视频文件",
  avi: "视频文件",
  mov: "视频文件",
  mp3: "音频文件",
  wav: "音频文件",
};

const getFileIconClass = (type: string): string => {
  return iconMap[type.toLowerCase()] || "iconfont icon-tuya-";
};

const getFileTypeLabel = (type: string): string => {
  return typeMap[type.toLowerCase()] || "未知类型";
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
};

const handleClose = () => {
  emit("update:visible", false);
};

const handleDownload = () => {
  if (!props.fileInfo?.url) {
    message.warning("文件链接无效");
    return;
  }

  emit("download", props.fileInfo);

  const link = document.createElement("a");
  link.href = props.fileInfo.url;
  link.download = props.fileInfo.filename;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  message.success("开始下载文件");
};

const handleOpenInBrowser = () => {
  if (!props.fileInfo?.url) {
    message.warning("文件链接无效");
    return;
  }

  window.open(props.fileInfo.url, "_blank");
  handleClose();
};
</script>

<style scoped>
.file-preview-fade-enter-active,
.file-preview-fade-leave-active {
  transition: opacity 0.3s ease;
}

.file-preview-fade-enter-from,
.file-preview-fade-leave-to {
  opacity: 0;
}

.file-preview-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.file-preview-container {
  background: var(--bg-primary, #ffffff);
  border-radius: 12px;
  padding: 24px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light, #e8e8e8);
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #333333);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--text-secondary, #999999);
}

.close-btn:hover {
  background: var(--bg-tertiary, #f5f5f5);
  color: var(--text-primary, #333333);
}

.close-btn .iconfont {
  font-size: 18px;
}

.file-info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-tertiary, #f8f9fa);
  border-radius: 8px;
  margin-bottom: 20px;
}

.file-icon-wrapper {
  width: 64px;
  height: 64px;
  background: var(--bg-primary, #ffffff);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.file-icon {
  font-size: 36px;
  color: var(--theme-primary, #007aff);
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary, #333333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 8px;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--text-secondary, #999999);
}

.file-size {
  padding: 2px 8px;
  background: var(--tag-bg, #e8e8e8);
  border-radius: 4px;
  color: var(--tag-color, #666666);
}

.file-type {
  color: var(--text-secondary, #999999);
}

.preview-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.action-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.action-btn .iconfont {
  font-size: 18px;
}

.action-btn.primary {
  background: var(--theme-primary, #007aff);
  color: #ffffff;
}

.action-btn.primary:hover {
  background: var(--theme-active, #0066d6);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.action-btn.secondary {
  background: var(--bg-tertiary, #f5f5f5);
  color: var(--text-primary, #333333);
  border: 1px solid var(--border-normal, #d9d9d9);
}

.action-btn.secondary:hover {
  background: var(--bg-primary, #ffffff);
  border-color: var(--theme-primary, #007aff);
  color: var(--theme-primary, #007aff);
}

.preview-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 122, 255, 0.08);
  border-radius: 6px;
  font-size: 12px;
  color: var(--theme-primary, #007aff);
}

.preview-tip .iconfont {
  font-size: 16px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .file-preview-container {
    min-width: auto;
    width: 90%;
    max-width: 400px;
    padding: 20px;
  }

  .file-info-card {
    flex-direction: column;
    text-align: center;
  }

  .file-icon-wrapper {
    width: 56px;
    height: 56px;
  }

  .file-icon {
    font-size: 32px;
  }

  .preview-actions {
    flex-direction: column;
  }

  .action-btn {
    height: 40px;
  }
}
</style>
