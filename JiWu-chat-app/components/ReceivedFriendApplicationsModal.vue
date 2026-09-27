<!-- 收到的好友申请组件 - 修复版 -->
<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="header-text">
            <h2>收到的好友申请</h2>
            <p>及时处理好友申请，拓展你的社交圈</p>
          </div>
          <button class="close-btn" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <div v-if="loading" class="state-wrapper">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>

          <div v-else-if="pendingRequests.length === 0" class="state-wrapper">
            <p class="empty-text">暂无好友申请</p>
            <p class="empty-hint">有新的好友申请会第一时间显示在这里</p>
          </div>

          <div v-else class="request-list">
            <div
              v-for="request in pendingRequests"
              :key="request.id"
              class="request-card"
            >
              <div class="avatar-area">
                <img
                  :src="request.user.avatar || defaultAvatar"
                  :alt="request.user.nickname"
                  class="avatar"
                />
              </div>

              <div class="info-area">
                <div class="name-row">
                  <span class="name">{{
                    request.user.nickname || request.user.username
                  }}</span>
                  <span class="time">{{ formatTime(request.createdAt) }}</span>
                </div>
                <p class="bio">{{ request.user.bio || "暂无个人介绍" }}</p>
                <div v-if="request.remark" class="remark">
                  <span class="remark-label">附言：</span>
                  <span class="remark-text">{{ request.remark }}</span>
                </div>
              </div>

              <div class="action-area">
                <button
                  class="action-btn accept-btn"
                  :disabled="processingIds.includes(request.id)"
                  @click="handleRequest(request.id, 'accept')"
                >
                  {{ processingIds.includes(request.id) ? "处理中" : "接受" }}
                </button>
                <button
                  class="action-btn reject-btn"
                  :disabled="processingIds.includes(request.id)"
                  @click="handleRequest(request.id, 'reject')"
                >
                  {{ processingIds.includes(request.id) ? "处理中" : "拒绝" }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "ant-design-vue";
import {
  getFriendRequests,
  handleFriendRequest,
} from "../untils/friendManager";
import type { FriendRequest } from "../untils/friendManager";
import { useUserStore } from "../stores/user";

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
  (e: "success"): void;
  (e: "close"): void;
}>();

const userStore = useUserStore();
const currentUserId = computed(() => userStore.userId);
const requests = ref<FriendRequest[]>([]);
const loading = ref(false);
const processingIds = ref<number[]>([]);
const defaultAvatar = "https://via.placeholder.com/48x48?text=User";

const pendingRequests = computed(() => {
  return requests.value.filter(
    (r) =>
      r.requestType === "received" &&
      r.friendId === currentUserId.value &&
      r.status === "pending",
  );
});

const formatTime = (time: string) => time || "";

watch(
  () => props.visible,
  async (val) => {
    if (val) await loadRequests();
  },
  { immediate: true },
);

const loadRequests = async () => {
  loading.value = true;
  try {
    const data = await getFriendRequests({ status: "pending" });
    requests.value = data;
  } catch {
    message.error("加载失败");
  } finally {
    loading.value = false;
  }
};

const handleRequest = async (id: number, action: "accept" | "reject") => {
  if (processingIds.value.includes(id)) return;
  processingIds.value.push(id);
  try {
    await handleFriendRequest(id, action);
    requests.value = requests.value.filter((r) => r.id !== id);
    emit("success");
    message.success(action === "accept" ? "已添加好友" : "已拒绝申请");
  } catch {
    message.error("操作失败");
  } finally {
    processingIds.value = processingIds.value.filter((i) => i !== id);
  }
};

const handleClose = () => {
  emit("update:visible", false);
  emit("close");
};
</script>

<style scoped>
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
  z-index: 1000;
}

.modal-container {
  background: #ffffff;
  width: 580px;
  max-width: 90%;
  max-height: 85vh;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
}

.header-text h2 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f1f1f;
}

.header-text p {
  margin: 0;
  font-size: 12px;
  color: #8c8c8c;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  line-height: 1;
  padding: 0 4px;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px 24px;
}

.state-wrapper {
  text-align: center;
  padding: 48px 20px;
}

.loading-spinner {
  width: 28px;
  height: 28px;
  margin: 0 auto 12px;
  border: 2px solid #f0f0f0;
  border-top-color: #1677ff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.empty-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 12px;
  color: #999;
}

.request-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.request-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: #e8e8e8;
}

.info-area {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}

.name {
  font-size: 15px;
  font-weight: 600;
  color: #1f1f1f;
}

.time {
  font-size: 11px;
  color: #999;
}

.bio {
  font-size: 13px;
  color: #666;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.remark {
  font-size: 12px;
  background: #f0f0f0;
  padding: 6px 10px;
  border-radius: 4px;
  color: #555;
}

.remark-label {
  font-weight: 500;
  color: #333;
}

.action-area {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  padding: 6px 16px;
  font-size: 13px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.accept-btn {
  background: #1677ff;
  color: #fff;
}

.accept-btn:hover:not(:disabled) {
  background: #0958d9;
}

.reject-btn {
  background: #f5f5f5;
  color: #666;
}

.reject-btn:hover:not(:disabled) {
  background: #e8e8e8;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
