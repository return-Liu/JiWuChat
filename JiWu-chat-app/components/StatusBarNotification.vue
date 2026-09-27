<template>
  <div class="statusbar-notification-wrapper">
    <Transition name="statusbar-slide">
      <div
        v-if="currentNotification"
        class="statusbar-notification"
        @click="handleClick"
      >
        <div class="statusbar-content">
          <!-- 左侧：头像 + 昵称 -->
          <div class="left-group">
            <a-avatar :size="32" :src="currentNotification.avatar" />
            <span class="sender-name">{{ currentNotification.senderName }}</span>
          </div>

          <!-- 右侧：消息内容 -->
          <div class="message-text">{{ currentNotification.content }}</div>
        </div>
      </div>
    </Transition>
    
    <!-- 遮罩层，点击外部区域关闭通知 -->
    <Transition name="overlay-fade">
      <div
        v-if="currentNotification"
        class="notification-overlay"
        @click="closeNotification"
      ></div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Contact } from "../types/chatTypes";

export interface StatusBarNotificationData {
  id: string;
  senderName: string;
  avatar: string;
  content: string;
  contactId: string;
  msg: any;
  contact: Contact;
  options: any;
}

const currentNotification = ref<StatusBarNotificationData | null>(null);

// 显示通知（无自动关闭）
const showStatusBarNotification = (
  data: Omit<StatusBarNotificationData, "id">,
) => {
  const notification: StatusBarNotificationData = {
    ...data,
    id: `statusbar_${Date.now()}`,
  };
  currentNotification.value = notification;
};

// 手动关闭
const closeNotification = () => {
  currentNotification.value = null;
};

// 点击跳转
const handleClick = () => {
  if (!currentNotification.value) return;
  const { contact, options } = currentNotification.value;
  window.focus();

  if (options.router) {
    options.router.push("/message");
    setTimeout(() => {
      options.activeContactId.value = String(contact.id);
    }, 100);
  }
  closeNotification();
};

defineExpose({ showStatusBarNotification, closeNotification });
</script>

<style scoped>
/* 顶部通知条 */
.statusbar-notification {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: #ffffff;
  border-bottom: 0.5px solid #e5e7eb;
  cursor: pointer;
}

/* 布局容器：左右分布 */
.statusbar-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 10px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

/* 左侧：头像 + 昵称 */
.left-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sender-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
}

/* 右侧：消息内容 */
.message-text {
  flex: 1;
  text-align: right;
  font-size: 14px;
  color: #4b5563;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 关闭按钮 */
.close-btn {
  font-size: 16px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  flex-shrink: 0;
}
/* 遮罩层 */
.notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  background: transparent;
}

/* 动画 */
.statusbar-slide-enter-active,
.statusbar-slide-leave-active {
  transition: transform 0.25s ease;
}
.statusbar-slide-enter-from {
  transform: translateY(-100%);
}
.statusbar-slide-leave-to {
  transform: translateY(-100%);
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.25s ease;
}
.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}
</style>
