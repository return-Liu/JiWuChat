<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal-overlay">
      <div class="modal-card" @click.stop>
        <div class="modal-header">
          <div class="modal-header-main">
            <div class="modal-title-content">
              <h2 class="modal-title">新建群聊</h2>
              <p class="modal-subtitle">填写群信息，完成后即可使用</p>
            </div>
          </div>
          <button class="modal-close-btn" @click="handleClose">✕</button>
        </div>

        <div class="modal-body">
          <div class="left-column">
            <!-- 基础信息 -->
            <div class="form-section">
              <h3 class="section-heading">基础信息</h3>
              <div class="form-fields">
                <div class="form-item">
                  <label class="form-label"> 群头像 <span class="required-mark">*</span> </label>
                  <div class="avatar-upload-container">
                    <div class="avatar-uploader" @click="openFileSelector">
                      <div class="avatar-preview" :class="{ 'has-image': tempAvatarUrl }">
                        <img v-if="tempAvatarUrl" :src="tempAvatarUrl" alt="群聊头像" />
                        <img
                          v-else
                          :src="defaultAvatar"
                          alt="默认头像"
                          class="avatar-placeholder-img"
                        />
                      </div>
                    </div>
                    <input
                      ref="avatarInputRef"
                      type="file"
                      @change="handleAvatarChange"
                      accept="image/jpeg,image/png,image/webp"
                      class="avatar-input"
                    />
                    <div class="avatar-tips">
                      <span>格式 JPG/PNG/WebP</span>
                      <span>建议尺寸 200×200px</span>
                      <span>大小不超过 2MB</span>
                    </div>
                    <div class="avatar-default-tip">
                      <span class="tip-icon">i</span>
                      <span>未上传则使用你的头像</span>
                    </div>
                  </div>
                </div>

                <div class="form-item">
                  <label class="form-label"> 群名称 <span class="required-mark">*</span> </label>
                  <div class="input-wrapper">
                    <input
                      v-model="localGroupData.groupName"
                      type="text"
                      placeholder="请输入群名称"
                      maxlength="20"
                      class="form-input"
                      :class="{ 'input-error': nameError }"
                      @input="validateGroupName"
                    />
                    <div class="input-feedback">
                      <div v-if="nameError" class="error-message">
                        {{ nameErrorMessage }}
                      </div>
                      <div v-else class="char-counter">
                        {{ localGroupData.groupName.length }}/20
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-item">
                  <label class="form-label"> 群分类 <span class="required-mark">*</span> </label>
                  <select v-model="localGroupData.category" class="form-select">
                    <option value="friends">好友</option>
                    <option value="family">家人</option>
                    <option value="work">工作</option>
                    <option value="study">学习</option>
                    <option value="game">游戏</option>
                    <option value="other">其他</option>
                  </select>
                </div>

                <div class="form-item">
                  <label class="form-label"> 群介绍 <span class="optional-mark">选填</span> </label>
                  <textarea
                    v-model="localGroupData.description"
                    placeholder="简单介绍该群"
                    class="form-textarea"
                    rows="2"
                    maxlength="100"
                  ></textarea>
                  <div class="textarea-counter">{{ localGroupData.description.length }}/100</div>
                </div>

                <div class="form-item">
                  <label class="form-label">
                    群规公告 <span class="optional-mark">选填</span>
                  </label>
                  <textarea
                    v-model="localGroupData.rule"
                    placeholder="请输入群规或注意事项"
                    class="form-textarea"
                    rows="3"
                    maxlength="500"
                  ></textarea>
                  <div class="textarea-counter">{{ localGroupData.rule.length }}/500</div>
                </div>
              </div>
            </div>

            <!-- 权限设置 -->
            <div class="form-section">
              <h3 class="section-heading">权限设置</h3>
              <div class="settings-container">
                <div class="setting-item">
                  <div class="setting-info">
                    <div class="setting-title">私密群</div>
                    <div class="setting-desc">开启后无法被搜索，仅可通过邀请加入</div>
                  </div>
                  <div
                    class="setting-switch"
                    :class="{ active: localGroupData.isPrivate }"
                    @click="localGroupData.isPrivate = !localGroupData.isPrivate"
                  >
                    <span class="switch-handle"></span>
                  </div>
                </div>
                <div class="setting-item">
                  <div class="setting-info">
                    <div class="setting-title">入群验证</div>
                    <div class="setting-desc">开启后加群需管理员审核通过</div>
                  </div>
                  <div
                    class="setting-switch"
                    :class="{ active: localGroupData.requireApproval }"
                    @click="localGroupData.requireApproval = !localGroupData.requireApproval"
                  >
                    <span class="switch-handle"></span>
                  </div>
                </div>
                <div class="setting-item">
                  <div class="setting-info">
                    <div class="setting-title">群成员上限</div>
                    <div class="setting-desc">
                      当前最多可容纳 {{ localGroupData.maxMembers }} 人
                    </div>
                  </div>
                  <select
                    v-model.number="localGroupData.maxMembers"
                    class="form-select member-limit-select"
                  >
                    <option :value="10">10 人</option>
                    <option :value="20">20 人</option>
                    <option :value="50">50 人</option>
                    <option :value="100">100 人</option>
                    <option :value="200">200 人</option>
                    <option :value="500">500 人</option>
                    <option :value="1000">1000 人</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-notice">
            <span class="notice-icon">!</span>
            <span>创建后你将成为群主，可管理成员与修改群设置</span>
          </div>
          <div class="footer-actions">
            <button class="btn btn-cancel" @click="handleClose" :disabled="isSubmitting">
              取消
            </button>
            <button
              class="btn btn-confirm"
              @click="handleSubmit"
              :disabled="!localGroupData.groupName.trim() || !tempAvatarUrl || isSubmitting"
            >
              {{ isSubmitting ? "创建中..." : "确定创建" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from "vue";
import { message } from "ant-design-vue";
import { useUserStore } from "../stores/user";

interface GroupFormData {
  groupName: string;
  isPrivate: boolean;
  requireApproval: boolean;
  maxMembers: number;
  rule: string;
  category: string;
  description: string;
}

interface Props {
  visible: boolean;
  groupFormData?: GroupFormData;
  invitedFriendIds?: number[];
}

interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "close"): void;
  (e: "confirm-create-group", data: any): void;
}

const props = withDefaults(defineProps<Props>(), {
  groupFormData: () => ({
    groupName: "",
    isPrivate: false,
    requireApproval: false,
    maxMembers: 100,
    rule: "",
    category: "friends",
    description: "",
  }),
  invitedFriendIds: () => [],
});

const emit = defineEmits<Emits>();
const userStore = useUserStore();
const defaultAvatar = "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png";

const creatorAvatar = computed(() => userStore.userAvatar);

const localGroupData = ref<GroupFormData>({ ...props.groupFormData! });

const nameError = ref(false);
const nameErrorMessage = ref("");
const tempAvatarUrl = ref("");
const avatarFile = ref<File | null>(null);
const avatarInputRef = ref<HTMLInputElement>();
const isSubmitting = ref(false);

const validateGroupName = () => {
  const n = localGroupData.value.groupName.trim();
  nameError.value = !n;
  nameErrorMessage.value = !n ? "群名称不能为空" : "";
};

const validateForm = () => {
  const n = localGroupData.value.groupName.trim();
  if (!n) {
    message.error("群名称不能为空");
    nameError.value = true;
    return false;
  }
  if (!tempAvatarUrl.value) {
    message.error("请上传群头像");
    return false;
  }
  return true;
};

const openFileSelector = () => avatarInputRef.value?.click();

const handleAvatarChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 2 * 1024 * 1024
  ) {
    message.error("图片格式或大小不符合要求");
    return;
  }
  avatarFile.value = file;
  tempAvatarUrl.value = URL.createObjectURL(file);
};

const handleSubmit = () => {
  if (!validateForm()) return;
  emit("confirm-create-group", {
    groupData: localGroupData.value,
    avatarFile: avatarFile.value,
    avatarUrl: tempAvatarUrl.value,
    invitedFriendIds: props.invitedFriendIds || [],
  });
  handleClose();
};

const handleClose = () => {
  emit("update:visible", false);
  emit("close");
  localGroupData.value = {
    groupName: "",
    isPrivate: false,
    requireApproval: false,
    maxMembers: 100,
    rule: "",
    category: "friends",
    description: "",
  };
  tempAvatarUrl.value = "";
  avatarFile.value = null;
  if (avatarInputRef.value) avatarInputRef.value.value = "";
};

const initDefaultAvatar = () => {
  if (!tempAvatarUrl.value && creatorAvatar.value) {
    tempAvatarUrl.value = creatorAvatar.value;
  }
};

initDefaultAvatar();

const handleOverlayClick = () => handleClose();

defineExpose({});
</script>

<style scoped lang="scss">
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
  z-index: 2000;
}

.modal-card {
  width: 900px;
  max-height: 85vh;
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.3;
}

.modal-subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  color: #86909c;
  line-height: 1.4;
}

.modal-close-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  color: #8e8e93;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: #f5f5f5;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  background: #fff;
}

.section-heading {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
  line-height: 1.4;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
  margin-bottom: 8px;
  line-height: 1.4;
}

.required-mark {
  color: #f53f3f;
  margin-left: 2px;
}

.optional-mark {
  color: #86909c;
  margin-left: 4px;
  font-size: 12px;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: #fff;
  color: #1d2129;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #c9cdd4;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #4080ff;
}

.form-textarea {
  resize: none;
}

.input-error {
  border-color: #f53f3f !important;
}

.input-feedback {
  margin-top: 4px;
  font-size: 11px;
}

.error-message {
  color: #f53f3f;
}

.char-counter {
  color: #86909c;
  text-align: right;
}

.textarea-counter {
  margin-top: 4px;
  font-size: 11px;
  color: #86909c;
  text-align: right;
}

.avatar-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.avatar-uploader {
  cursor: pointer;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px dashed #e5e6eb;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  overflow: hidden;
}

.avatar-preview:hover {
  border-color: #4080ff;
}

.avatar-preview.has-image {
  border-style: solid;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-input {
  display: none;
}

.avatar-tips {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #86909c;
}

.avatar-default-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding: 6px 10px;
  background: #f0f7ff;
  border-radius: 4px;
  font-size: 12px;
  color: #4080ff;
}

.tip-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  background: #4080ff;
  color: #fff;
  border-radius: 50%;
  font-size: 10px;
  font-weight: bold;
  font-style: normal;
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-switch {
  width: 44px;
  height: 24px;
  background: #e5e6eb;
  border-radius: 24px;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: background 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  -webkit-user-select: none;

  &.active {
    background: #4080ff;
  }

  .switch-handle {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateX(0);
    will-change: transform;
  }

  &.active .switch-handle {
    transform: translateX(20px);
  }
}

.setting-info {
  flex: 1;
}

.setting-title {
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
}

.setting-desc {
  font-size: 12px;
  color: #86909c;
  margin-top: 2px;
}

.member-limit-select {
  width: 140px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e6eb;
  background: #fff;
}

.footer-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #fff9e6;
  font-size: 12px;
  color: #e6a23c;
  line-height: 1.4;
}

.notice-icon {
  width: 16px;
  height: 16px;
  background: #e6a23c;
  color: #fff;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.btn-cancel {
  background: #f2f3f5;
  color: #4e5969;
}

.btn-cancel:hover {
  background: #e5e6eb;
}

.btn-confirm {
  background: #4080ff;
  color: #fff;
}

.btn-confirm:hover {
  background: #3366ff;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
