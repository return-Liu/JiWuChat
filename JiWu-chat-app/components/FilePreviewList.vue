<template>
  <div v-if="files.length > 0" class="inline-file-preview-list">
    <div
      v-for="fileItem in files"
      :key="fileItem.id"
      class="file-preview-item"
      contenteditable="false"
      @click.stop="$emit('preview', fileItem)"
      @mousedown.stop
      @keydown.stop
    >
      <div class="file-preview-icon">
        <i class="iconfont icon-a-wenjianjiawenjian file-icon tool-icon"></i>
      </div>
      <div class="file-preview-info">
        <div class="file-preview-name">{{ getFileName(fileItem) }}</div>
        <div class="file-preview-size">{{ getFileSize(fileItem) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SelectedFileItem {
  id: string;
  file: File;
  name?: string;
  size?: number;
  type?: string;
}

interface Props {
  files: SelectedFileItem[];
}

defineProps<Props>();

defineEmits<{
  (e: "preview", file: SelectedFileItem): void;
}>();

// 获取文件名
const getFileName = (item: SelectedFileItem): string => {
  if (item.name) return item.name;
  if (item.file?.name) return item.file.name;
  return "未知文件";
};

// 获取文件大小
const getFileSize = (item: SelectedFileItem): string => {
  let bytes = 0;
  if (item.size) {
    bytes = item.size;
  } else if (item.file?.size) {
    bytes = item.file.size;
  }
  return formatFileSize(bytes);
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};
</script>

<style scoped>
.inline-file-preview-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  /* 阻止光标定位到文件预览列表 */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.file-preview-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f0f2f5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  /* 阻止光标进入和文本选择 */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  /* 阻止元素获得焦点 */
  pointer-events: auto;
  /* 宽度和高度控制 */
  width: 100%;

  max-width: 300px;
  height: 48px;
  min-height: 48px;
  max-height: 60px;
}

.file-preview-icon {
  font-size: 24px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  /* 阻止图标获得焦点 */
  pointer-events: none;
}

.file-preview-info {
  flex: 1;
  min-width: 0;
  /* 阻止文本信息获得焦点 */
  pointer-events: none;
}

.file-preview-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  /* 阻止文本选择 */
  user-select: none;
  -webkit-user-select: none;
}

.file-preview-size {
  font-size: 11px;
  color: #999;
  line-height: 1.3;
  /* 阻止文本选择 */
  user-select: none;
  -webkit-user-select: none;
}
</style>
