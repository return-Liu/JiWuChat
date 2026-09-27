<template>
  <div class="group-system-message" @contextmenu.stop.prevent="handleCardRightClick">
    <div
      class="msg-card"
      :class="{
        'expired-card': isExpired,
        'accepted-card': messageType === 'group_invite_accepted',
        'rejected-card': messageType === 'group_invite_rejected',
        'pending-card': messageType === 'group_invite_pending',
        'notification-card': messageType === 'group_notification',
      }"
      :data-message-id="message.id"
      @click="handleCardClick"
    >
      <div class="msg-card-body">
        <div class="msg-info">
          <div class="msg-title">{{ title }}</div>
          <div class="msg-subtitle">{{ subtitle }}</div>
        </div>
        <div class="card-avatar">
          <img :src="avatarUrl" alt="" />
        </div>
      </div>

      <div class="card-divider" />

      <div class="card-footer">
        <div class="status-wrapper">
          <span class="status-text">{{ statusText }}</span>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <MessageContextMenu
        v-if="contextMenuVisible"
        :visible="contextMenuVisible"
        :position="contextMenuPosition"
        :message="message"
        :contacts="[]"
        :active-contact-id="undefined"
        :current-user-id="currentUserId"
        @close="closeContextMenu"
        @delete="handleDeleteMessage"
        @recall="handleRecallMessage"
        @copy="handleCopyMessage"
        @reply="handleReplyMessage"
        @forward="handleForwardMessage"
        @multiSelect="handleMultiSelectMessage"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { message } from "ant-design-vue";
import type { ChatMessage } from "../types/chatTypes";

import {
  isInviteExpired,
  parseSystemMessageContent,
  getSystemMessageTitle,
  getSystemMessageSubtitle,
  getSystemMessageStatusText,
} from "../untils/systemMessageUtils";

interface Props {
  message: ChatMessage;
  currentUserId: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  openDetail: [message: ChatMessage];
  delete: [message: ChatMessage];
  recall: [message: ChatMessage, originalContent?: string, recalledAt?: string];
  copy: [message: ChatMessage];
  reply: [message: ChatMessage];
  forward: [message: ChatMessage];
  multiSelect: [message: ChatMessage];
}>();

const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });

// ✅ 安全解析消息内容
const messageData = computed(() => {
  try {
    return parseSystemMessageContent(props.message.content);
  } catch (e) {
    console.warn("解析系统消息内容失败:", e);
    return {};
  }
});

// ✅ 安全获取头像
const avatarUrl = computed(() => {
  return messageData.value?.groupAvatar || "/default-group-avatar.png";
});

// ✅ 安全获取 messageType（兼容空值）
const messageType = computed(() => {
  return props.message?.messageType || "";
});

// ✅ 安全判断是否过期
const isExpired = computed(() => {
  // 只有 pending 状态才检查过期
  if (messageType.value !== "group_invite_pending") return false;
  return isInviteExpired(messageData.value);
});

// ✅ 标题（带默认值）
const title = computed(() => {
  if (!messageType.value) return "系统消息";
  return getSystemMessageTitle(messageType.value);
});

// ✅ 副标题（带默认值）
const subtitle = computed(() => {
  if (!messageType.value) {
    return props.message.content || "系统通知";
  }
  return getSystemMessageSubtitle(messageType.value, messageData.value);
});

// ✅ 状态文本（带默认值）
const statusText = computed(() => {
  if (!messageType.value) return "系统通知";
  return getSystemMessageStatusText(messageType.value);
});

function handleCardClick() {
  const systemTypes = [
    "group_invite_pending",
    "group_invite_accepted",
    "group_invite_rejected",
    "group_notification",
  ];

  // ✅ 检查 messageType 是否有效
  if (!messageType.value || !systemTypes.includes(messageType.value)) {
    return;
  }

  if (messageType.value === "group_invite_pending" && isExpired.value) {
    message.warning("该入群邀请已过期，无法查看详情");
    return;
  }

  emit("openDetail", props.message);
}

function handleCardRightClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  contextMenuPosition.value = { x: event.clientX, y: event.clientY };
  contextMenuVisible.value = true;
}

function closeContextMenu() {
  contextMenuVisible.value = false;
}

function handleDeleteMessage(msg: ChatMessage) {
  emit("delete", msg);
  closeContextMenu();
}

function handleRecallMessage(msg: ChatMessage, originalContent?: string, recalledAt?: string) {
  emit("recall", msg, originalContent, recalledAt);
  closeContextMenu();
}

function handleCopyMessage(msg: ChatMessage) {
  emit("copy", msg);
  closeContextMenu();
}

function handleReplyMessage(msg: ChatMessage) {
  emit("reply", msg);
  closeContextMenu();
}

function handleForwardMessage(msg: ChatMessage) {
  emit("forward", msg);
  closeContextMenu();
}

function handleMultiSelectMessage(msg: ChatMessage) {
  emit("multiSelect", msg);
  closeContextMenu();
}
</script>

<style scoped>
.group-system-message {
  margin: 6px 0;
}

.msg-card {
  width: 230px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
}

.msg-card.expired-card {
  opacity: 0.6;
  cursor: default;
}

.msg-card.expired-card:hover {
  transform: none;
  box-shadow: none;
}

.msg-card-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 10px 12px;
  min-height: 56px;
}

.card-avatar {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f5f5;
}

.card-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.msg-info {
  flex: 1;
  min-width: 0;
  padding-right: 8px;
}

.msg-title {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.3;
}

.msg-subtitle {
  font-size: 11px;
  color: #8e8e93;
  margin-top: 2px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-divider {
  height: 1px;
  background: #f0f0f0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
}

.status-text {
  color: #8e8e93;
  font-size: 10px;
}
</style>
