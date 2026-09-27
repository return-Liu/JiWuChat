<template>
  <!-- 主弹窗 -->
  <transition name="modal-fade">
    <div v-if="visible" class="feedback-overlay" @click="handleClose">
      <div class="feedback-container" @click.stop>
        <!-- 头部 -->
        <div class="feedback-header">
          <div class="header-left">
            <i class="iconfont icon-fankui"></i>
            <span class="header-title">意见反馈</span>
          </div>
          <button class="close-btn" @click="handleClose">×</button>
        </div>

        <!-- 内容 -->
        <div class="feedback-body">
          <div class="feedback-tip">
            <i class="iconfont icon-tip"></i>
            <span>感谢您的反馈，我们会认真对待每一条意见</span>
          </div>

          <!-- 反馈类型 -->
          <div class="form-group">
            <label class="form-label">反馈类型</label>
            <div class="type-btns">
              <button
                v-for="item in feedbackTypes"
                :key="item.value"
                class="type-btn"
                :class="{ active: formData.type === item.value }"
                @click="formData.type = item.value"
              >
                <i :class="item.icon"></i>
                {{ item.label }}
              </button>
            </div>
          </div>

          <!-- 反馈内容 -->
          <div class="form-group">
            <label class="form-label"
              >反馈内容 <span class="required">*</span></label
            >
            <textarea
              v-model="formData.content"
              class="feedback-textarea"
              placeholder="请详细描述您遇到的问题或建议..."
              rows="5"
              maxlength="500"
            ></textarea>
            <div
              class="char-count"
              :class="{ warning: formData.content.length > 450 }"
            >
              {{ formData.content.length }}/500
            </div>
          </div>

          <!-- 联系方式 -->
          <div class="form-group">
            <label class="form-label">联系方式（选填）</label>
            <input
              v-model="formData.contact"
              class="feedback-input"
              placeholder="QQ / 手机号 / 邮箱，方便我们联系您"
            />
          </div>

          <!-- 上传图片 -->
          <div class="form-group">
            <label class="form-label">截图（选填，最多3张）</label>
            <div class="upload-area">
              <div
                v-for="(img, index) in previewImages"
                :key="index"
                class="preview-item"
              >
                <img :src="img" />
                <button class="remove-img" @click="removeImage(index)">
                  ×
                </button>
              </div>
              <div
                v-if="previewImages.length < 3"
                class="upload-trigger"
                @click="triggerUpload"
              >
                <i class="iconfont icon-add"></i>
                <span>上传截图</span>
              </div>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                multiple
                style="display: none"
                @change="handleFileUpload"
              />
            </div>
            <div class="upload-hint">支持 JPG、PNG 格式，单张不超过 5MB</div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="feedback-footer">
          <button class="btn-cancel" @click="handleClose">取消</button>
          <button
            class="btn-submit"
            @click="handleSubmit"
            :disabled="submitting"
          >
            {{ submitting ? "提交中..." : "提交反馈" }}
          </button>
        </div>
      </div>
    </div>
  </transition>

  <!-- 提交成功提示 - 放在外面 -->
  <transition name="modal-fade">
    <div
      v-if="successVisible"
      class="success-overlay"
      @click="successVisible = false"
    >
      <div class="success-container" @click.stop>
        <div class="success-icon">✓</div>
        <div class="success-title">提交成功</div>
        <div class="success-desc">感谢您的反馈，我们会尽快处理！</div>
        <button class="success-btn" @click="successVisible = false">
          我知道了
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { message } from "ant-design-vue";

const props = defineProps<{
  visible: boolean;
  defaultType?: string;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

const submitting = ref(false);
const successVisible = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const previewImages = ref<string[]>([]);
const uploadedImages = ref<string[]>([]);

const feedbackTypes = [
  { value: "bug", label: "问题反馈", icon: "iconfont icon-bug" },
  { value: "suggestion", label: "功能建议", icon: "iconfont icon-suggestion" },
  { value: "experience", label: "体验优化", icon: "iconfont icon-experience" },
  { value: "other", label: "其他", icon: "iconfont icon-other" },
];

const formData = reactive({
  type: props.defaultType || "suggestion",
  content: "",
  contact: "",
  images: [] as string[],
});

// 重置表单
const resetForm = () => {
  formData.type = props.defaultType || "suggestion";
  formData.content = "";
  formData.contact = "";
  formData.images = [];
  previewImages.value = [];
  uploadedImages.value = [];
  successVisible.value = false;
};

// 监听弹窗关闭，重置表单
watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      setTimeout(() => {
        resetForm();
      }, 300);
    }
  },
);

const handleClose = () => {
  emit("update:visible", false);
};

const triggerUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files) return;

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      message.warning(`${file.name} 不是图片文件`);
      continue;
    }

    if (file.size > 5 * 1024 * 1024) {
      message.warning(`${file.name} 超过5MB限制`);
      continue;
    }

    if (previewImages.value.length >= 3) {
      message.warning("最多上传3张图片");
      break;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      previewImages.value.push(ev.target?.result as string);
      const mockUrl = URL.createObjectURL(file);
      uploadedImages.value.push(mockUrl);
      formData.images = uploadedImages.value;
    };
    reader.readAsDataURL(file);
  }

  input.value = "";
};

const removeImage = (index: number) => {
  previewImages.value.splice(index, 1);
  uploadedImages.value.splice(index, 1);
  formData.images = uploadedImages.value;
};

// 表单验证
const validate = () => {
  if (!formData.content.trim()) {
    message.warning("请填写反馈内容");
    return false;
  }
  if (formData.content.length < 5) {
    message.warning("反馈内容至少5个字");
    return false;
  }
  return true;
};

// 提交反馈
const handleSubmit = async () => {
  if (!validate()) return;
  if (submitting.value) return;

  submitting.value = true;

  try {
    // TODO: 替换为真实接口
    await new Promise((resolve) => setTimeout(resolve, 1500));

    emit("success");
    emit("update:visible", false);

    successVisible.value = true;
    resetForm();
  } catch (error) {
    message.error("提交失败，请稍后重试");
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
/* ============ 反馈弹窗 ============ */
.feedback-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.feedback-container {
  width: 520px;
  max-width: 92%;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  animation: modalIn 0.25s ease;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
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
.feedback-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 14px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left .iconfont {
  font-size: 20px;
  color: #1890ff;
}

.header-title {
  font-size: 17px;
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
.feedback-body {
  padding: 20px 24px 16px;
  overflow-y: auto;
  flex: 1;
}

.feedback-body::-webkit-scrollbar {
  width: 4px;
}

.feedback-body::-webkit-scrollbar-track {
  background: transparent;
}

.feedback-body::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 4px;
}

.feedback-body::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}

/* 提示 */
.feedback-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f0f7ff;
  border-radius: 8px;
  margin-bottom: 18px;
  /* border-left: 3px solid #1890ff; */
}

.feedback-tip .iconfont {
  font-size: 16px;
  color: #1890ff;
}

.feedback-tip span {
  font-size: 13px;
  color: #666;
}

/* 表单 */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.required {
  color: #ff4d4f;
}

/* 反馈类型按钮 */
.type-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: #f5f5f5;
  border: 2px solid transparent;
  border-radius: 20px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn:hover {
  background: #e8e8e8;
}

.type-btn.active {
  background: #e6f0ff;
  border-color: #1890ff;
  color: #1890ff;
}

.type-btn .iconfont {
  font-size: 14px;
}

/* 文本域 */
.feedback-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  resize: vertical;
  transition: border-color 0.2s;
  font-family: inherit;
  min-height: 100px;
}

.feedback-textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #bbb;
  margin-top: 4px;
}

.char-count.warning {
  color: #ff4d4f;
}

/* 输入框 */
.feedback-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  transition: border-color 0.2s;
}

.feedback-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

/* 上传区域 */
.upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
  flex-shrink: 0;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-img {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-img:hover {
  background: #ff4d4f;
}

.upload-trigger {
  width: 80px;
  height: 80px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: #999;
  font-size: 12px;
}

.upload-trigger:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.upload-trigger .iconfont {
  font-size: 24px;
}

.upload-hint {
  font-size: 12px;
  color: #bbb;
  margin-top: 6px;
}

/* 底部按钮 */
.feedback-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 24px 18px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  flex-shrink: 0;
}

.btn-cancel,
.btn-submit {
  padding: 10px 28px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s;
  border: none;
  font-weight: 500;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-cancel:hover {
  background: #e5e5e5;
}

.btn-submit {
  background: #1890ff;
  color: #fff;
}

.btn-submit:hover:not(:disabled) {
  background: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.btn-submit:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============ 成功弹窗 ============ */
.success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10002;
}

.success-container {
  width: 340px;
  background: #ffffff;
  border-radius: 16px;
  padding: 40px 32px 32px;
  text-align: center;
  animation: modalIn 0.25s ease;
}

.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #52c41a;
  color: #fff;
  font-size: 32px;
  line-height: 64px;
  margin: 0 auto 16px;
}

.success-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.success-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
}

.success-btn {
  padding: 8px 40px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.success-btn:hover {
  background: #40a9ff;
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
  .feedback-container {
    width: 100%;
    max-width: 95%;
    border-radius: 12px;
  }

  .feedback-header {
    padding: 14px 16px 12px;
  }

  .feedback-body {
    padding: 16px 16px 12px;
  }

  .header-title {
    font-size: 16px;
  }

  .feedback-footer {
    padding: 12px 16px 16px;
  }

  .btn-cancel,
  .btn-submit {
    padding: 8px 20px;
    font-size: 13px;
  }

  .type-btn {
    padding: 4px 12px;
    font-size: 12px;
  }

  .preview-item,
  .upload-trigger {
    width: 64px;
    height: 64px;
  }

  .success-container {
    width: 300px;
    padding: 32px 24px 28px;
  }
}
</style>
