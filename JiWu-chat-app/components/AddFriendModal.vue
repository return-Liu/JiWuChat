<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal-overlay fullscreen">
      <div class="modal-card fullscreen" @click.stop>
        <div class="modal-header">
          <div class="modal-header-content">
            <div class="modal-title-section">
              <h2 class="modal-title">添加好友</h2>
            </div>
            <p class="modal-subtitle">搜索用户名、昵称或手机号,快速找到好友</p>
          </div>
          <button class="modal-close-btn" @click="handleClose">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">
              <span class="label-text">搜索用户</span>
              <span class="required">*</span>
            </label>
            <div class="search-container-large">
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="输入用户名、昵称或手机号"
                class="form-input"
                :class="{ 'input-error': searchError }"
                @input="autoSearch"
              />
              <button
                class="search-button"
                @click="handleSearchUsers"
                :disabled="isSearching || !searchKeyword.trim()"
              >
                <span v-if="isSearching" class="loading-spinner small"></span>
                <span v-else>搜索</span>
              </button>
            </div>
            <div class="input-footer">
              <div v-if="searchError" class="error-text">
                {{ searchError }}
              </div>
              <div v-else class="form-hint">支持用户名/昵称/手机号搜索</div>
            </div>
          </div>

          <div
            v-if="
              searchKeyword &&
              !isSearching &&
              searchResults.length === 0 &&
              !searchError
            "
            class="empty-state"
          >
            <div class="empty-icon iconfont icon-CDnmxN01"></div>
            <h4>未找到相关用户</h4>
            <p>请检查关键词是否正确，或更换关键词重试</p>
          </div>

          <div v-if="searchResults.length > 0" class="search-results">
            <h3 class="section-title">搜索结果</h3>
            <div class="user-list">
              <div
                v-for="user in searchResults"
                :key="user.id"
                class="user-item"
                :class="{ selected: selectedUser?.id === user.id }"
                @click="selectUser(user)"
              >
                <div class="user-avatar">
                  <img :src="user.avatar" :alt="user.nickname" />
                </div>
                <div class="user-info">
                  <h4 class="user-name">
                    {{ user.nickname || user.username }}
                  </h4>
                  <p class="user-bio">
                    {{ user.bio || "暂无个性签名" }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedUser" class="remark-section">
            <h3 class="section-title">好友备注</h3>
            <div class="remark-field">
              <label class="form-label">
                <span class="label-text">设置备注名称（仅自己可见）</span>
              </label>
              <input
                v-model="friendRemark"
                type="text"
                placeholder="选填，便于识别好友身份"
                class="form-input"
                maxlength="20"
              />
              <div class="char-count">{{ friendRemark.length }}/20</div>
            </div>
          </div>

          <div v-if="!searchKeyword && !selectedUser" class="search-guide">
            <div class="guide-content">
              <div class="guide-icon iconfont icon-CDnmxN01"></div>
              <h4>开始添加好友</h4>
              <p>输入对方的用户名、昵称或手机号进行搜索</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-tips">
            <span>发送好友申请后，等待对方同意即可成为好友</span>
          </div>
          <div class="footer-actions">
            <button class="btn btn-secondary" @click="handleClose">取消</button>
            <button
              class="btn btn-primary"
              @click="handleSendRequest"
              :disabled="!selectedUser || isSendingRequest"
            >
              <span v-if="isSendingRequest" class="loading-spinner"></span>
              <span>{{ isSendingRequest ? "发送中..." : "发送好友申请" }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import { searchUsers, sendFriendRequest } from "../untils/friendManager";
import { useSiderColor } from "../stores/siderColor";

const siderColorStore = useSiderColor();

interface User {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  bio?: string;
}

interface Props {
  visible: boolean;
  currentContactId?: number;
}

const props = withDefaults(defineProps<Props>(), {
  currentContactId: 0,
});

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "success", user: User): void;
}>();

const searchKeyword = ref("");
const searchResults = ref<User[]>([]);
const selectedUser = ref<User | null>(null);
const friendRemark = ref("");
const searchError = ref("");
const isSearching = ref(false);
const isSendingRequest = ref(false);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const handleClose = () => {
  emit("update:visible", false);
  resetState();
};

const resetState = () => {
  searchKeyword.value = "";
  searchResults.value = [];
  selectedUser.value = null;
  friendRemark.value = "";
  searchError.value = "";
  isSearching.value = false;
  isSendingRequest.value = false;
};

const handleSearchUsers = async () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = [];
    searchError.value = "";
    return;
  }

  isSearching.value = true;
  searchError.value = "";

  try {
    const result = await searchUsers(searchKeyword.value.trim());
    searchResults.value = result;
  } catch (error) {
    searchError.value = "搜索失败，请稍后重试";
  } finally {
    isSearching.value = false;
  }
};

const autoSearch = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    handleSearchUsers();
  }, 500);
};

const selectUser = (user: User) => {
  if (selectedUser.value?.id === user.id) {
    selectedUser.value = null;
  } else {
    selectedUser.value = user;
  }
};

const handleSendRequest = async () => {
  if (!selectedUser.value) return;

  isSendingRequest.value = true;

  try {
    await sendFriendRequest(selectedUser.value.id, friendRemark.value.trim());
    message.success(`已向 ${selectedUser.value.nickname || selectedUser.value.username} 发送好友申请`);
    emit("success", selectedUser.value);
    handleClose();
  } catch (error) {
    message.error('发送好友申请失败，请稍后重试');
  } finally {
    isSendingRequest.value = false;
  }
};

watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) resetState();
  },
);
</script>

<style scoped>
/* 只优化文字层级、字重、颜色、行高，其他完全不变 */
.modal-overlay.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-card.fullscreen {
  width: 90%;
  max-width: 600px;
  height: auto;
  max-height: 85vh;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e6eb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.modal-header-content {
  flex: 1;
}

.modal-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.3;
}

.modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #86909c;
  line-height: 1.4;
}

.modal-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 18px;
  color: #86909c;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-close-btn:hover {
  background: #f2f3f5;
  color: #1d2129;
}

.modal-body {
  padding: 20px 24px;
  flex: 1;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
  line-height: 1.4;
}

.required {
  color: #f53f3f;
  font-weight: 600;
}

.search-container-large {
  display: flex;
  gap: 10px;
}

.form-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  font-size: 14px;
  color: #1d2129;
  background: #fff;
}
.form-input::placeholder {
  color: #c9cdd4;
}
.form-input:focus {
  border-color: #4080ff;
  outline: none;
}

.input-error {
  border-color: #f53f3f !important;
  background: #fff7f8 !important;
}

.search-button {
  padding: 10px 20px;
  background: #4080ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
}
.search-button:disabled {
  background: #c7cdd4;
  cursor: not-allowed;
}

.input-footer {
  margin-top: 6px;
  min-height: 20px;
}

.error-text {
  color: #f53f3f;
  font-size: 12px;
  line-height: 1.4;
}

.form-hint {
  color: #86909c;
  font-size: 12px;
  line-height: 1.4;
}

.empty-state,
.search-guide {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  text-align: center;
}

.empty-icon,
.guide-icon {
  font-size: 60px;
}

.empty-state h4,
.guide-content h4 {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 500;
  color: #4e5969;
  line-height: 1.4;
}

.empty-state p,
.guide-content p {
  margin: 0;
  font-size: 13px;
  color: #86909c;
  line-height: 1.5;
}

.section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.4;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
}
.user-item:hover {
  background: #f5f6f7;
}
.user-item.selected {
  background: #4080ff;
  color: #fff;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}
.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-name {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
  line-height: 1.4;
}
.user-item.selected .user-name {
  color: #fff;
}

.user-bio {
  margin: 0;
  font-size: 12px;
  color: #86909c;
  line-height: 1.4;
}
.user-item.selected .user-bio {
  color: rgba(255, 255, 255, 0.85);
}

.remark-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e6eb;
}

.remark-field {
  display: flex;
  flex-direction: column;
}

.char-count {
  margin-top: 4px;
  font-size: 11px;
  color: #86909c;
  text-align: right;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e6eb;
  background: #fff;
  flex-shrink: 0;
}

.footer-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #86909c;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 12px;
  line-height: 1.4;
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
  font-size: 14px;
  cursor: pointer;
}

.btn-secondary {
  background: #f2f3f5;
  color: #4e5969;
}
.btn-secondary:hover {
  background: #e5e6eb;
}

.btn-primary {
  background: #4080ff;
  color: #fff;
}
.btn-primary:hover {
  background: #3366ff;
}
.btn-primary:disabled {
  background: #c7cdd4;
  cursor: not-allowed;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
  margin-right: 6px;
  vertical-align: middle;
}
.loading-spinner.small {
  width: 12px;
  height: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>

<style>
/* 全局样式 - 让 message 显示在弹窗之上 */
.ant-message {
  z-index: 9999 !important;
}

.ant-message-notice {
  z-index: 9999 !important;
}
</style>