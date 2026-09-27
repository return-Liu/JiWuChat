<template>
  <div class="group-edit-page">
    <!-- 加载骨架 -->
    <div v-if="loading" class="loading-container">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
    </div>

    <div v-else-if="!isGroupOwner" class="no-permission">
      <div class="no-perm-card">
        <h2>无编辑权限</h2>
        <p>仅群主与管理员可修改群资料</p>
        <div class="info-row">
          <span class="info-label">当前身份</span>
          <span class="info-tag">{{ currentUserRole }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">群号</span>
          <span class="info-value">{{ formData.groupNumber }}</span>
        </div>
        <button class="back-button" @click="closeOrBack">返回</button>
      </div>
    </div>

    <div v-else class="edit-content">
      <!-- 页面头部 -->
      <div class="page-header">
        <button class="back-btn" @click="cancelEdit">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="#1f1f1f"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <span class="page-title">编辑群资料</span>
        <span class="group-id">#{{ formData.groupNumber }}</span>
      </div>

      <!-- 上下布局主体 -->
      <div class="page-body">
        <!-- 头像区域 -->
        <div class="avatar-card" @click="selectImage">
          <div class="avatar-wrapper">
            <img :src="displayAvatar" alt="群头像" class="avatar-img" />
            <div class="avatar-overlay">
              <span>更换头像</span>
            </div>
          </div>
        </div>

        <!-- 上传进度条 -->
        <div v-if="uploadingAvatar" class="upload-progress-container">
          <div class="progress-label">上传中...</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
          </div>
        </div>

        <!-- 基本信息卡片 -->
        <div class="info-card">
          <div class="card-title">基本信息</div>

          <!-- 群名称 -->
          <div class="form-item">
            <label class="form-label">群名称</label>
            <div class="form-input-wrap">
              <input
                v-model="formData.name"
                type="text"
                placeholder="请输入群名称"
                maxlength="30"
                class="form-input"
              />
              <span class="input-count">{{ formData.name.length }}/30</span>
            </div>
          </div>

          <!-- 群号 -->
          <div class="form-item">
            <label class="form-label">群号</label>
            <div class="form-input-wrap">
              <span class="form-text">{{ formData.groupNumber }}</span>
            </div>
          </div>

          <!-- 群分类 -->
          <div class="form-item">
            <label class="form-label">群分类</label>
            <div class="form-input-wrap">
              <select v-model="formData.category" class="form-select">
                <option value="friends">好友</option>
                <option value="family">家人</option>
                <option value="work">工作</option>
                <option value="study">学习</option>
                <option value="game">游戏</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>

          <!-- 群介绍 -->
          <div class="form-item">
            <label class="form-label">群介绍</label>
            <div class="form-input-wrap">
              <textarea
                v-model="formData.description"
                placeholder="简单介绍这个群的用途"
                maxlength="100"
                rows="2"
                class="form-textarea"
              ></textarea>
              <span class="input-count">{{ formData.description.length }}/100</span>
            </div>
          </div>

          <!-- 群公告 -->
          <div class="form-item">
            <label class="form-label">群公告</label>
            <div class="form-input-wrap">
              <textarea
                v-model="formData.rule"
                placeholder="填写群公告"
                maxlength="500"
                rows="3"
                class="form-textarea"
              ></textarea>
              <span class="input-count">{{ formData.rule.length }}/500</span>
            </div>
          </div>
        </div>

        <!-- 权限设置卡片 -->
        <div class="settings-card">
          <div class="card-title">权限设置</div>

          <!-- 隐私模式 -->
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">隐私模式</span>
              <span class="setting-desc">
                {{ formData.isPrivate ? "私密群 · 无法被搜索" : "公开群 · 可被搜索" }}
              </span>
            </div>
            <div
              class="switch"
              :class="{ active: formData.isPrivate }"
              @click="formData.isPrivate = !formData.isPrivate"
            >
              <span class="switch-handle"></span>
            </div>
          </div>

          <!-- 成员上限 -->
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">成员上限</span>
              <span class="setting-desc">当前 {{ formData.maxMembers }} 人</span>
            </div>
            <select v-model.number="formData.maxMembers" class="setting-select">
              <option :value="50">50 人</option>
              <option :value="100">100 人</option>
              <option :value="200">200 人</option>
              <option :value="300">300 人</option>
              <option :value="500">500 人</option>
              <option :value="1000">1000 人</option>
            </select>
          </div>

          <!-- 入群审核 -->
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">入群审核</span>
              <span class="setting-desc">新成员需管理员同意</span>
            </div>
            <div
              class="switch"
              :class="{ active: formData.requireApproval }"
              @click="formData.requireApproval = !formData.requireApproval"
            >
              <span class="switch-handle"></span>
            </div>
          </div>

          <!-- 成员邀请 -->
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">成员邀请</span>
              <span class="setting-desc">允许普通成员邀请好友</span>
            </div>
            <div
              class="switch"
              :class="{ active: formData.allowMemberInvite }"
              @click="formData.allowMemberInvite = !formData.allowMemberInvite"
            >
              <span class="switch-handle"></span>
            </div>
          </div>

          <!-- 全员禁言 -->
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">全员禁言</span>
              <span class="setting-desc">仅管理员可发言</span>
            </div>
            <div
              class="switch"
              :class="{ active: formData.muteAll }"
              @click="formData.muteAll = !formData.muteAll"
            >
              <span class="switch-handle"></span>
            </div>
          </div>
        </div>

        <!-- 底部操作按钮 -->
        <div class="action-buttons">
          <button class="btn-cancel" @click="cancelEdit">取消</button>
          <button class="btn-save" :disabled="!hasChanges || isSubmitting" @click="submitForm">
            {{ isSubmitting ? "保存中..." : "保存修改" }}
          </button>
        </div>

        <div class="bottom-spacer"></div>
      </div>

      <!-- 未保存提示 -->
      <transition name="slide-up">
        <div v-if="hasChanges" class="unsaved-toast">
          <span>资料已修改，记得保存哦</span>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "../../stores/user";
import request from "../../untils/request";
import { message, Modal } from "ant-design-vue";
import { useOverlayClose } from "../../composables/useOverlayClose";

const route = useRoute();
const { closeOrBack } = useOverlayClose();
const userStore = useUserStore();

// 支持浮层场景：从 props 接收 groupId（浮层渲染时 route.params 为空）
const props = defineProps<{ groupId?: string }>();

const DEFAULT_AVATAR = "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png";

const rawGroupId = computed(() => props.groupId || (route.params.groupId as string));
const formattedGroupId = computed(() =>
  rawGroupId.value?.startsWith("group_") ? rawGroupId.value : `group_${rawGroupId.value}`,
);

const loading = ref(true);
const isSubmitting = ref(false);
const uploadingAvatar = ref(false);
const uploadProgress = ref(0);
const isGroupOwner = ref(false);
const currentUserRole = ref("");
const tempAvatarFilename = ref("");
const tempAvatarUrl = ref("");
const hasTempAvatar = ref(false);
const originalData = ref<any>(null);

const formData = reactive({
  name: "",
  groupNumber: "",
  avatar: "",
  rule: "",
  isPrivate: false,
  maxMembers: 100,
  requireApproval: false,
  allowMemberInvite: true,
  muteAll: false,
  category: "friends",
  description: "",
});

const displayAvatar = computed(() =>
  hasTempAvatar.value ? tempAvatarUrl.value : formData.avatar || DEFAULT_AVATAR,
);

const hasChanges = computed(() => {
  if (!originalData.value) return false;
  const o = originalData.value;
  if (displayAvatar.value !== (o.avatar || DEFAULT_AVATAR)) return true;
  if (formData.name !== (o.name || "")) return true;
  if (formData.rule !== (o.rule || "")) return true;
  if (formData.category !== (o.category || "friends")) return true;
  if (formData.description !== (o.description || "")) return true;
  if (formData.isPrivate !== (o.isPrivate || false)) return true;
  if (formData.maxMembers !== (o.maxMembers || 100)) return true;
  if (formData.requireApproval !== (o.requireApproval || false)) return true;
  if (formData.allowMemberInvite !== (o.allowMemberInvite ?? true)) return true;
  if (formData.muteAll !== (o.muteAll || false)) return true;
  return false;
});

const fetchGroupInfo = async () => {
  try {
    loading.value = true;
    const { data } = await request.get(`/group/${formattedGroupId.value}`);
    originalData.value = JSON.parse(JSON.stringify(data));
    formData.name = data.name || "";
    formData.groupNumber = data.groupNumber || "";
    formData.avatar = data.avatar || DEFAULT_AVATAR;
    formData.rule = data.rule || "";
    formData.isPrivate = data.isPrivate ?? false;
    formData.maxMembers = data.maxMembers ?? 100;
    formData.requireApproval = data.requireApproval ?? false;
    formData.allowMemberInvite = data.allowMemberInvite ?? true;
    formData.muteAll = data.muteAll ?? false;
    formData.category = data.category || "friends";
    formData.description = data.description || "";
    isGroupOwner.value = data.role === "owner" || data.role === "admin";
    currentUserRole.value =
      data.role === "owner" ? "群主" : data.role === "admin" ? "管理员" : "群成员";
  } catch {
    message.error("加载失败");
  } finally {
    loading.value = false;
  }
};

const selectImage = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpeg,image/png,image/webp";
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) await handleImageUpload(file);
  };
  input.click();
};

const handleImageUpload = async (file: File) => {
  if (file.size > 5 * 1024 * 1024) {
    message.error("图片不能超过5MB");
    return;
  }
  uploadingAvatar.value = true;
  uploadProgress.value = 0;
  const fd = new FormData();
  fd.append("groupavatar", file);
  fd.append("groupId", formattedGroupId.value);
  fd.append("userId", String(userStore.user?.id || ""));
  try {
    const { data } = await request.post("/groupavatar/temp", fd, {
      onUploadProgress: (e) => {
        if (e.total) uploadProgress.value = Math.round((e.loaded / e.total) * 100);
      },
    });
    tempAvatarFilename.value = data.tempFilename;
    tempAvatarUrl.value = data.avatar;
    hasTempAvatar.value = true;
    message.success("头像上传成功");
  } catch {
    message.error("上传失败");
  } finally {
    uploadingAvatar.value = false;
  }
};

const cleanupTempAvatar = async () => {
  if (tempAvatarFilename.value) {
    try {
      await request.delete(`/groupavatar/temp/${tempAvatarFilename.value}`);
    } catch {}
  }
  tempAvatarFilename.value = "";
  tempAvatarUrl.value = "";
  hasTempAvatar.value = false;
};

const submitForm = async () => {
  if (!formData.name.trim()) {
    message.error("请填写群名称");
    return;
  }
  if (!hasChanges.value) {
    closeOrBack();
    return;
  }
  isSubmitting.value = true;
  try {
    if (hasTempAvatar.value) {
      const { data } = await request.post("/groupavatar/confirm", {
        groupId: formattedGroupId.value,
        userId: userStore.user?.id,
        tempFilename: tempAvatarFilename.value,
      });
      formData.avatar = data.avatar;
      tempAvatarFilename.value = "";
      tempAvatarUrl.value = "";
      hasTempAvatar.value = false;
    }
    const response = await request.put(`/group/${formattedGroupId.value}`, {
      name: formData.name,
      rule: formData.rule,
      category: formData.category,
      description: formData.description,
      isPrivate: formData.isPrivate,
      maxMembers: formData.maxMembers,
      requireApproval: formData.requireApproval,
      allowMemberInvite: formData.allowMemberInvite,
      muteAll: formData.muteAll,
      avatar: formData.avatar,
    });
    message.success(response.data.message);
    closeOrBack();
  } catch (error: any) {
    message.error(error.response?.data?.data?.message);
  } finally {
    isSubmitting.value = false;
  }
};

const cancelEdit = async () => {
  if (hasChanges.value) {
    try {
      await Modal.confirm("资料尚未保存，确定要离开吗？", "提示", {
        confirmButtonText: "离开",
        cancelButtonText: "继续编辑",
        type: "warning",
      });
    } catch {
      return;
    }
  }
  closeOrBack();
};

onMounted(() => {
  fetchGroupInfo();
});

onUnmounted(() => {
  cleanupTempAvatar();
});
</script>

<style scoped lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.group-edit-page {
  min-height: 100vh;
  background: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow-y: auto; /* 关键：允许滚动 */
}

.edit-content {
  min-height: 100vh;
  background: #f5f7fa;
  overflow-y: auto; /* 确保内容可滚动 */
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f5f7fa;
  }
}

.page-title {
  font-size: 17px;
  font-weight: 600;
  color: #1f1f1f;
}

.group-id {
  font-size: 13px;
  color: #999;
}

/* 上下布局主体 */
.page-body {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 加载骨架 */
.loading-container {
  background: #fff;
  border-radius: 16px;
  padding: 32px 20px;
  max-width: 600px;
  margin: 20px auto;
}

.skeleton-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f2f5 25%, #e6e8eb 50%, #f0f2f5 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  margin: 0 auto 20px;
}

.skeleton-line {
  height: 44px;
  background: linear-gradient(90deg, #f0f2f5 25%, #e6e8eb 50%, #f0f2f5 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;
  margin-bottom: 12px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 无权限页面 */
.no-permission {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.no-perm-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px 32px;
  text-align: center;
  width: 320px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: #1f1f1f;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: #999;
    margin-bottom: 24px;
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;

  .info-label {
    font-size: 14px;
    color: #999;
  }

  .info-tag {
    background: #f0f2f5;
    padding: 2px 12px;
    border-radius: 12px;
    font-size: 13px;
    color: #165dff;
    font-weight: 500;
  }

  .info-value {
    font-size: 14px;
    color: #1f1f1f;
    font-weight: 500;
  }
}

.back-button {
  margin-top: 24px;
  width: 100%;
  padding: 12px;
  background: #165dff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;

  &:hover {
    background: #0e4fd9;
  }
}

/* 头像卡片 */
.avatar-card {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}

.avatar-wrapper {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.25s;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

/* 上传进度 */
.upload-progress-container {
  background: #fff;
  border-radius: 12px;
  padding: 12px 16px;
}

.progress-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.progress-bar {
  height: 4px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #165dff;
  border-radius: 4px;
  transition: width 0.3s;
}

/* 卡片通用 */
.info-card,
.settings-card {
  background: #fff;
  border-radius: 16px;
  padding: 0 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f1f1f;
  padding: 16px 0;
  border-bottom: 1px solid #f5f7fa;
}

/* 表单项 */
.form-item {
  padding: 14px 0;
  border-bottom: 1px solid #f5f7fa;

  &:last-child {
    border-bottom: none;
  }
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
}

.form-input-wrap {
  position: relative;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 0;
  font-size: 15px;
  border: none;
  background: transparent;
  outline: none;
  color: #1f1f1f;
  font-family: inherit;

  &::placeholder {
    color: #ccc;
  }
}

.form-textarea {
  resize: none;
}

.form-text {
  font-size: 15px;
  color: #1f1f1f;
}

.form-select {
  width: 100%;
  padding: 8px 0;
  font-size: 15px;
  border: none;
  background: transparent;
  outline: none;
  cursor: pointer;
  color: #1f1f1f;
  appearance: none;

  option {
    padding: 4px 8px;
  }
}

.input-count {
  position: absolute;
  right: 0;
  bottom: 8px;
  font-size: 11px;
  color: #ccc;
}

/* 设置项 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f5f7fa;

  &:last-child {
    border-bottom: none;
  }
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  font-size: 15px;
  color: #1f1f1f;
}

.setting-desc {
  font-size: 12px;
  color: #999;
}

.setting-select {
  padding: 6px 12px;
  font-size: 14px;
  border: 1px solid #e8ecf0;
  border-radius: 8px;
  background: #fff;
  outline: none;
  cursor: pointer;
  color: #1f1f1f;

  &:focus {
    border-color: #165dff;
  }
}

/* 开关 */
.switch {
  width: 44px;
  height: 24px;
  background: #e8ecf0;
  border-radius: 24px;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: background 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  -webkit-user-select: none;

  &.active {
    background: #165dff;
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
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  &.active .switch-handle {
    transform: translateX(20px);
  }
}

/* 底部按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 14px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: #f5f7fa;
  color: #666;

  &:hover {
    background: #e8ecf0;
  }
}

.btn-save {
  background: #165dff;
  color: #fff;

  &:hover:not(:disabled) {
    background: #0e4fd9;
  }

  &:disabled {
    background: #a0c0ff;
    cursor: not-allowed;
  }
}

.bottom-spacer {
  height: 20px;
}

/* 未保存提示 */
.unsaved-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 600px;
  width: calc(100% - 32px);
  background: rgba(255, 249, 230, 0.96);
  backdrop-filter: blur(8px);
  border-radius: 40px;
  padding: 12px 20px;
  text-align: center;
  font-size: 14px;
  color: #b8860b;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  z-index: 20;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateX(-50%) translateY(20px);
  opacity: 0;
}
</style>
