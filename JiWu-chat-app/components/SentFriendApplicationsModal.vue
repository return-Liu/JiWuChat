<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="header-text">
            <h2>我发起的申请</h2>
            <p>随时查看申请进度，耐心等待对方回应</p>
          </div>
          <button class="close-btn" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <div v-if="loading" class="state-wrapper">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>

          <div v-else-if="requests.length === 0" class="state-wrapper">
            <p class="empty-text">暂无申请记录</p>
            <p class="empty-hint">你还未发起任何好友申请</p>
          </div>

          <div v-else class="request-list">
            <div
              v-for="(request, index) in requests"
              :key="request.id"
              class="request-card"
              :class="{ 'is-first': index === 0 }"
              @mouseenter="hoveredId = request.id"
              @mouseleave="handleMouseLeave(request.id)"
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
                  <span
                    class="status-badge"
                    :class="`status-${request.status}`"
                  >
                    {{ statusText[request.status] }}
                  </span>
                </div>
                <p class="bio">{{ request.user.bio || "暂无个人介绍" }}</p>
                <div class="time-row">
                  <span>申请时间：{{ formatTime(request.createdAt) }}</span>
                  <span v-if="request.status !== 'pending'" class="update-time">
                    {{ request.status === "accepted" ? "通过" : "拒绝" }}：{{
                      formatTime(request.updatedAt)
                    }}
                  </span>
                </div>
              </div>

              <!-- 指示器 - 第一个在底部显示，其他在顶部 -->
              <div
                class="indicator-wrapper"
                :class="{ 'indicator-bottom': index === 0 }"
                v-if="
                  hoveredId === request.id &&
                  !processingIds.includes(request.id)
                "
                @mouseenter="hoveredId = request.id"
                @mouseleave="handleMouseLeave(request.id)"
              >
                <div class="indicator">
                  <span
                    v-if="request.status === 'pending'"
                    class="indicator-btn withdraw"
                    @click.stop="handleCancel(request.id)"
                    >撤回</span
                  >
                  <span
                    v-if="request.status === 'accepted'"
                    class="indicator-btn delete"
                    @click.stop="handleDelete(request.id)"
                    >删除</span
                  >
                  <div class="indicator-arrow"></div>
                </div>
              </div>

              <div
                class="indicator-wrapper"
                :class="{ 'indicator-bottom': index === 0 }"
                v-else-if="processingIds.includes(request.id)"
              >
                <div class="indicator">
                  <span class="indicator-btn processing">{{
                    getProcessingText(request.status)
                  }}</span>
                  <div class="indicator-arrow"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message, Modal } from "ant-design-vue";
import {
  getFriendRequests,
  cancelFriendRequest,
  deleteFriendRequest,
} from "../untils/friendManager";
import type { FriendRequest } from "../untils/friendManager";

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: "update:visible", v: boolean): void;
  (e: "success"): void;
  (e: "close"): void;
}>();

const requests = ref<FriendRequest[]>([]);
const loading = ref(false);
const processingIds = ref<number[]>([]);
const hoveredId = ref<number | null>(null);
const defaultAvatar = "https://via.placeholder.com/48x48?text=User";

const statusText: Record<string, string> = {
  pending: "等待处理",
  accepted: "已通过",
  rejected: "已拒绝",
  blocked: "已屏蔽",
};

const getProcessingText = (status: string) => {
  return status === "pending" ? "撤回中..." : "删除中...";
};

const formatTime = (time: string) => time || "";

const handleMouseLeave = (id: number) => {
  setTimeout(() => {
    if (hoveredId.value === id) {
      hoveredId.value = null;
    }
  }, 150);
};

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
    const data = await getFriendRequests({ all: true } as any);
    requests.value = data.filter((r) => r.requestType === "sent");
  } catch {
    message.error("加载失败");
  } finally {
    loading.value = false;
  }
};

const handleCancel = (id: number) => {
  Modal.confirm({
    title: "确认撤回",
    content: "确定要撤回这条好友申请吗？",
    okText: "确认",
    cancelText: "取消",
    zIndex: 10000,
    onOk: async () => {
      processingIds.value.push(id);
      try {
        await cancelFriendRequest(id);
        requests.value = requests.value.filter((r) => r.id !== id);
        emit("success");
      } catch {
        message.error("撤回失败");
      } finally {
        processingIds.value = processingIds.value.filter((i) => i !== id);
      }
    },
  });
};

const handleDelete = (id: number) => {
  Modal.confirm({
    title: "确认删除",
    content: "确定要删除这条记录吗？",
    okText: "确认",
    cancelText: "取消",
    zIndex: 10000,
    onOk: async () => {
      processingIds.value.push(id);
      try {
        await deleteFriendRequest(id);
        requests.value = requests.value.filter((r) => r.id !== id);
        emit("success");
      } catch {
        message.error("删除失败");
      } finally {
        processingIds.value = processingIds.value.filter((i) => i !== id);
      }
    },
  });
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
  width: 560px;
  max-width: 90%;
  max-height: 85vh;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.header-text h2 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.header-text p {
  margin: 0;
  font-size: 13px;
  color: #8c8c8c;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #8c8c8c;
  line-height: 1;
  padding: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 24px;
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
  font-size: 13px;
  color: #bbb;
}

.request-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.request-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: #fafafa;
  border-radius: 12px;
  position: relative;
  transition: all 0.2s;
}

.request-card:hover {
  background: #f0f0f0;
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
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}

.status-badge {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 500;
}

.status-pending {
  background: #fff7e6;
  color: #d46b00;
}

.status-accepted {
  background: #f6ffed;
  color: #389e0d;
}

.status-rejected {
  background: #fff2f0;
  color: #cf1322;
}

.status-blocked {
  background: #f5f5f5;
  color: #8c8c8c;
}

.bio {
  font-size: 13px;
  color: #888;
  margin: 0 0 8px 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time-row {
  font-size: 11px;
  color: #bbb;
  display: flex;
  gap: 16px;
}

.update-time {
  color: #1677ff;
}

/* 指示器包装器 - 默认在顶部 */
.indicator-wrapper {
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  z-index: 10;
  margin-bottom: -2px;
  padding-bottom: 12px;
  pointer-events: auto;
  cursor: default;
}

/* 第一个卡片指示器在底部 */
.indicator-wrapper.indicator-bottom {
  top: 100%;
  bottom: auto;
  margin-bottom: 0;
  margin-top: -2px;
  padding-bottom: 0;
  padding-top: 12px;
}

.indicator-wrapper.indicator-bottom .indicator-arrow {
  border-top: none;
  border-bottom: 5px solid #d46b00;
}

.indicator-wrapper.indicator-bottom .indicator:has(.delete) .indicator-arrow {
  border-bottom-color: #cf1322;
}

.indicator-wrapper.indicator-bottom
  .indicator:has(.processing)
  .indicator-arrow {
  border-bottom-color: #999;
}

.indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
}

.indicator-wrapper.indicator-bottom .indicator {
  flex-direction: column-reverse;
}

.indicator-btn {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 14px;
  border-radius: 6px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.25s ease;
  pointer-events: auto;
  color: #333;
  background: transparent;
  border: 1.5px solid #333;
}

.indicator-btn:hover {
  background: #333;
  color: #fff;
}

.indicator-btn.withdraw {
  border-color: #d46b00;
  color: #d46b00;
}

.indicator-btn.withdraw:hover {
  background: #d46b00;
  color: #fff;
}

.indicator-btn.delete {
  border-color: #cf1322;
  color: #cf1322;
}

.indicator-btn.delete:hover {
  background: #cf1322;
  color: #fff;
}

.indicator-btn.processing {
  border-color: #999;
  color: #999;
  cursor: default;
}

.indicator-btn.processing:hover {
  background: transparent;
  color: #999;
}

.indicator-arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #d46b00;
  margin-top: 1px;
  pointer-events: none;
  transition: border-color 0.25s ease;
}

.indicator:has(.delete) .indicator-arrow {
  border-top-color: #cf1322;
}

.indicator:has(.processing) .indicator-arrow {
  border-top-color: #999;
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
