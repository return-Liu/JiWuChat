<template>
  <div v-if="visible" class="report-modal-mask">
    <div class="report-modal-wrapper" @click.stop>
      <div class="report-modal-header">
        <h3 class="modal-title">举报{{ contact.isGroup ? "群聊" : "用户" }}</h3>
        <button class="close-btn" @click="handleClose" :disabled="isSubmitting">
          ✕
        </button>
        <div class="report-tip">请如实填写举报信息</div>
      </div>

      <div class="report-modal-body">
        <div class="report-target">
          <div class="target-avatar">
            <img
              v-if="contact.avatar"
              :src="contact.avatar"
              alt="头像"
              class="avatar-img"
            />
            <div v-else class="avatar-fallback">
              {{ (contact.remark || contact.name || "未知").charAt(0) }}
            </div>
          </div>
          <div class="target-info">
            <div class="target-name">
              {{ contact.remark || contact.name || "未知联系人" }}
            </div>
            <div class="target-id">
              {{
                contact.isGroup
                  ? `群号：${contact.groupNumber || "未知"}`
                  : `用户名：${contact.username || "未知"}`
              }}
            </div>
            <div class="target-type">
              类型：{{ contact.isGroup ? "群聊" : "好友" }}
            </div>
          </div>
        </div>

        <div class="report-section">
          <div class="section-label">
            举报原因 <span class="required">*</span>
          </div>
          <div class="reason-list">
            <div
              v-for="(reason, key) in reasonOptions"
              :key="key"
              class="reason-item"
              :class="{
                selected: selectedReportReason === key,
                disabled: isSubmitting,
              }"
              @click="!isSubmitting && (selectedReportReason = key)"
            >
              {{ reason }}
            </div>
          </div>
        </div>

        <div class="report-section">
          <div class="section-label">
            补充说明
            <span class="word-count">{{ reportDescription.length }}/500</span>
          </div>
          <textarea
            v-model="reportDescription"
            class="description-input"
            placeholder="请详细描述违规行为并提供相关证据（选填）"
            rows="4"
            :disabled="isSubmitting"
            maxlength="500"
          ></textarea>
        </div>

        <div class="report-section">
          <div class="section-label">
            相关凭证（选填）<span class="tips"
              >支持图片/视频，最多上传 3 个文件</span
            >
          </div>

          <div class="upload-area">
            <div
              v-if="uploadedFiles.length < 3"
              class="add-file-btn"
              @click="triggerFileInput"
              :class="{ disabled: isSubmitting }"
            >
              <div class="add-icon">+</div>
              <div class="add-text">添加文件</div>
            </div>

            <div class="file-list">
              <div
                v-for="(file, index) in uploadedFiles"
                :key="index"
                class="file-item"
              >
                <div
                  v-if="file.type.startsWith('image/')"
                  class="file-preview image-preview"
                >
                  <img
                    :src="file.url"
                    alt="图片凭证"
                    class="preview-img"
                    @click="viewImage(file.url)"
                  />
                  <div class="file-name">{{ file.name }}</div>
                </div>
                <div
                  v-else-if="file.type.startsWith('video/')"
                  class="file-preview video-preview"
                >
                  <video :src="file.url" controls class="preview-video">
                    您的浏览器不支持视频播放
                  </video>
                  <div class="file-name">{{ file.name }}</div>
                </div>
                <div
                  class="delete-file-btn"
                  @click.stop="deleteFile(index)"
                  :class="{ disabled: isSubmitting }"
                >
                  ✕
                </div>
              </div>
            </div>

            <input
              ref="fileInputRef"
              type="file"
              accept="image/*,video/*"
              multiple
              class="hidden-file-input"
              @change="handleFileChange"
            />
          </div>
        </div>
      </div>

      <div class="report-modal-footer">
        <button
          class="modal-btn cancel-btn"
          @click="handleCancel"
          :disabled="isSubmitting"
        >
          取消
        </button>
        <button
          class="modal-btn submit-btn"
          @click="handleSubmit"
          :disabled="!selectedReportReason || isSubmitting"
          :class="{ loading: isSubmitting }"
        >
          {{ isSubmitting ? "提交中..." : "提交举报" }}
        </button>
      </div>
    </div>

    <div
      v-if="showImageViewer"
      class="image-viewer-mask"
      @click="closeImageViewer"
    >
      <img
        :src="currentImageUrl"
        alt="大图查看"
        class="viewer-img"
        @click.stop
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message, Modal } from "ant-design-vue";
import {
  uploadTempFiles,
  deleteTempFiles,
  submitReport,
  revokeFileUrls,
  type UploadedFile,
} from "../untils/reportUtils";

interface Contact {
  id: string | number;
  isGroup: boolean;
  avatar?: string;
  remark?: string;
  name?: string;
  groupNumber?: string;
  username?: string;
}

interface Props {
  visible: boolean;
  contact: Contact;
  isSubmitting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  contact: () => ({}) as Contact,
  isSubmitting: false,
});

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (
    e: "submit",
    data: { reason: string; description: string; files: File[] },
  ): void;
  (e: "close"): void;
}>();

const selectedReportReason = ref("");
const reportDescription = ref("");
const fileInputRef = ref<HTMLInputElement | null>(null);
const showImageViewer = ref(false);
const currentImageUrl = ref("");
const uploadedFiles = ref<UploadedFile[]>([]);

const reasonOptions = {
  porn: "色情低俗内容",
  violence: "暴力/血腥/恐怖内容",
  fraud: "诈骗/虚假信息",
  harassment: "骚扰/辱骂/人身攻击",
  advertising: "垃圾广告/恶意营销",
  politics: "政治敏感/违法违规内容",
  other: "其他违规行为",
};

const handleClose = async () => {
  if (props.isSubmitting) {
    message.warning("举报正在提交中，请稍候");
    return;
  }

  if (uploadedFiles.value.length > 0) {
    const tempFilenames = uploadedFiles.value
      .map((file) => file.tempFilename)
      .filter((name): name is string => name !== undefined);
    if (tempFilenames.length > 0) await deleteTempFiles(tempFilenames);
  }

  revokeFileUrls(uploadedFiles.value.map((file) => file.url));
  uploadedFiles.value = [];
  selectedReportReason.value = "";
  reportDescription.value = "";
  emit("update:visible", false);
  emit("close");
};

const handleCancel = () => handleClose();
const triggerFileInput = () => {
  if (!props.isSubmitting) fileInputRef.value?.click();
};

const generateRandomFilename = (file: File): File => {
  const randomStr = Math.random()
    .toString()
    .replace("0.", "")
    .padEnd(16, "0")
    .slice(0, 16);
  const dotIndex = file.name.lastIndexOf(".");
  const extension = dotIndex !== -1 ? file.name.slice(dotIndex) : "";
  const newFileName = randomStr + extension;
  return new File([file], newFileName, { type: file.type });
};

const uploadTempFilesWrapper = async (files: File[]) => {
  try {
    const filesWithRandomNames = files.map((file) =>
      generateRandomFilename(file),
    );
    const uploaded = await uploadTempFiles(filesWithRandomNames);
    uploadedFiles.value.push(...uploaded);
  } catch (error: any) {
    console.error("文件上传失败:", error);
    message.error(error.message || "文件上传失败");
    throw error;
  }
};

const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  const maxFileSize = 10 * 1024 * 1024;
  const remainCount = 3 - uploadedFiles.value.length;

  const validFiles = Array.from(files)
    .slice(0, remainCount)
    .filter((file) => {
      if (file.size > maxFileSize) {
        message.error(`文件${file.name}超过 10MB，无法上传`);
        return false;
      }
      return true;
    });

  if (validFiles.length === 0) {
    target.value = "";
    return;
  }

  try {
    await uploadTempFilesWrapper(validFiles);
  } catch (error) {
    // 错误已在包装函数中处理
  } finally {
    target.value = "";
  }
};

const deleteFile = async (index: number) => {
  if (props.isSubmitting) return;
  const file = uploadedFiles.value[index];
  if (file.tempFilename) await deleteTempFiles([file.tempFilename]);
  URL.revokeObjectURL(file.url);
  uploadedFiles.value.splice(index, 1);
};

const viewImage = (url: string) => {
  currentImageUrl.value = url;
  showImageViewer.value = true;
};

const closeImageViewer = () => {
  showImageViewer.value = false;
  currentImageUrl.value = "";
};

const handleSubmit = async () => {
  if (!selectedReportReason.value) {
    message.warning("请选择举报原因");
    return;
  }

  try {
    await Modal.confirm({
      title: "确认提交",
      content: `你确定要举报${props.contact.isGroup ? "该群聊" : "该用户"}吗？\n举报原因：${reasonOptions[selectedReportReason.value as keyof typeof reasonOptions]}\n提交后将无法撤回，请谨慎操作。`,
      okText: "确认提交",
      cancelText: "取消",
    });
  } catch {
    message.info("已取消举报");
    return;
  }

  const tempFiles = uploadedFiles.value.map((item) => ({
    tempFilename: item.tempFilename,
    name: item.name,
    type: item.type,
    size: item.size,
  }));

  try {
    emit("submit", {
      reason: selectedReportReason.value,
      description: reportDescription.value,
      files: uploadedFiles.value
        .map((item) => item.file!)
        .filter((f) => f !== null),
    });

    await submitReport({
      contactId: props.contact.id,
      isGroup: props.contact.isGroup,
      reason: selectedReportReason.value,
      description: reportDescription.value,
      tempFiles,
    });

    message.success("举报提交成功");
    handleClose();
  } catch (error: any) {
    console.error("举报失败:", error);
    const errorMsg =
      error.response?.data?.message ||
      error.message ||
      "举报提交失败，请稍后重试";
    message.error(errorMsg);
  }
};

watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      uploadedFiles.value.forEach((file) => URL.revokeObjectURL(file.url));
      uploadedFiles.value = [];
      selectedReportReason.value = "";
      reportDescription.value = "";
    }
  },
);
</script>

<style lang="scss" scoped>
.report-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.report-modal-wrapper {
  width: 100%;
  max-width: 560px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.report-modal-header {
  padding: 14px 20px;
  border-bottom: 1px solid #e5e5e5;
  position: relative;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  padding-right: 32px;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
  font-size: 14px;
  color: #8e8e93;
}

.close-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.report-tip {
  font-size: 11px;
  color: #8e8e93;
  margin-top: 4px;
}

.report-modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.report-target {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 10px;
  margin-bottom: 20px;
}

.target-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  background: #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #666;
}

.target-info {
  flex: 1;
}

.target-name {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.target-id {
  font-size: 11px;
  color: #8e8e93;
  margin-bottom: 2px;
}

.target-type {
  font-size: 11px;
  color: #666;
}

.report-section {
  margin-bottom: 20px;
}

.section-label {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.required {
  color: #ff3b30;
}

.tips {
  font-size: 11px;
  font-weight: normal;
  color: #8e8e93;
}

.word-count {
  font-size: 11px;
  font-weight: normal;
  color: #8e8e93;
}

.reason-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.reason-item {
  padding: 6px 14px;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  background: #fff;
}

.reason-item:hover {
  border-color: #007aff;
  color: #007aff;
}

.reason-item.selected {
  background: #007aff;
  border-color: #007aff;
  color: #fff;
}

.description-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  resize: none;
  font-size: 13px;
  font-family: inherit;
  outline: none;
}

.description-input:focus {
  border-color: #007aff;
}

.upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}

.add-file-btn {
  width: 80px;
  height: 80px;
  border: 1px dashed #e5e5e5;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #fafafa;
  transition: all 0.2s;
}

.add-file-btn:hover:not(.disabled) {
  border-color: #007aff;
  background: #f0f7ff;
}

.add-file-btn.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.add-icon {
  font-size: 22px;
  color: #c7c7c7;
  margin-bottom: 4px;
}

.add-text {
  font-size: 11px;
  color: #8e8e93;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.file-item {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid #e5e5e5;
}

.file-preview {
  width: 100%;
  height: 100%;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: zoom-in;
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 2px 4px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 9px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-file-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ff3b30;
  color: #fff;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.delete-file-btn.disabled {
  background: #ccc;
  cursor: not-allowed;
}

.hidden-file-input {
  display: none;
}

.report-modal-footer {
  padding: 14px 20px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover:not(:disabled) {
  background: #e5e5e5;
}

.submit-btn {
  background: #007aff;
  color: #fff;
}

.submit-btn:hover:not(:disabled) {
  background: #005fc1;
}

.submit-btn:disabled {
  background: #c7c7c7;
  cursor: not-allowed;
}

.image-viewer-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: zoom-out;
}

.viewer-img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}
</style>
