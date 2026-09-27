<template>
  <div class="notification-container" :style="containerPositionStyle">
    <div v-if="aggregatedNotifications.length > 0" class="notification-header-bar">
      <div class="header-title">
        <i class="iconfont icon-xiaoxi"></i>
        <span>新消息通知</span>
      </div>
      <div class="header-actions">
        <a-tooltip content="全部清空" placement="bottom">
          <div class="action-btn" @click="clearAllNotifications">
            <i class="iconfont icon-shanchu"></i>
          </div>
        </a-tooltip>
      </div>
    </div>

    <TransitionGroup
      :name="`notification-${notificationAnimation}`"
      tag="div"
      class="notification-list"
    >
      <div
        v-for="notification in aggregatedNotifications"
        :key="notification.id"
        class="notification-card"
        :class="[
          `preview-${notificationPreviewMode}`,
          animationClass,
          { 'has-multiple': notification.messageCount > 1 },
        ]"
        @click="handleNotificationClick(notification)"
      >
        <div class="card-header">
          <div class="avatar-wrapper">
            <a-avatar class="notification-avatar" :size="44" :src="notification.avatar" />
            <span v-if="notification.messageCount > 1" class="message-badge">
              {{ notification.messageCount }}
            </span>
          </div>

          <div class="info-wrapper">
            <div class="info-row">
              <span class="sender-name">{{ getSenderName(notification) }}</span>
              <span class="send-time">{{ notification.time }}</span>
            </div>

            <!-- 折叠消息展示区域 - QQ风格 -->
            <div class="message-preview-area">
              <!-- 单条消息 -->
              <div v-if="notification.messageCount === 1" class="single-message">
                <span class="message-icon">
                  <i class="iconfont icon-liaotian"></i>
                </span>
                <span class="message-text">{{ getDisplayContent(notification) }}</span>
              </div>

              <!-- 多条消息 - 折叠展示 -->
              <div v-else class="multiple-messages">
                <div class="message-stack">
                  <div class="stack-header">
                    <i class="iconfont icon-xiaoxi1"></i>
                    <span>{{ notification.messageCount }} 条新消息</span>
                    <i
                      class="iconfont icon-arrow-down expand-icon"
                      :class="{
                        expanded: expandedNotificationId === notification.id,
                      }"
                      @click.stop="toggleExpand(notification.id)"
                    >
                    </i>
                  </div>

                  <Transition name="expand">
                    <div v-if="expandedNotificationId === notification.id" class="message-list">
                      <div
                        v-for="(msg, idx) in notification.messages"
                        :key="idx"
                        class="message-item"
                      >
                        <div class="message-bubble">
                          <span class="message-time">{{ msg.time }}</span>
                          <span class="message-content">{{ msg.content }}</span>
                        </div>
                      </div>
                    </div>
                    <div v-else class="collapsed-preview">
                      <span class="latest-tag">最新</span>
                      <span class="latest-message">{{ notification.messages[0]?.content }}</span>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>
          </div>

          <div class="close-wrapper">
            <CloseOutlined class="close-btn" @click.stop="closeNotification(notification.id)" />
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { CloseOutlined } from "@ant-design/icons-vue";
import type { Contact } from "../types/chatTypes";

// 🔥 实时从 localStorage 读取配置，确保与 settings 页面同步
const getStoredValue = <T extends string>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  return (localStorage.getItem(key) as T) || defaultValue;
};

const notificationPreviewMode = ref<"full" | "simple" | "hidden">(
  getStoredValue("notificationPreviewMode", "full"),
);
const notificationPosition = ref<"top-right" | "top-left" | "bottom-right" | "bottom-left">(
  getStoredValue("notificationPosition", "top-right"),
);
const notificationAnimation = ref<"slide" | "fade" | "bounce" | "scale">(
  getStoredValue("notificationAnimation", "slide"),
);
const notificationDuration = ref<"short" | "medium" | "long" | "manual">(
  getStoredValue("notificationDuration", "medium"),
);

// 🔥 监听 storage 事件，当其他标签页修改设置时同步更新
const handleStorageChange = (e: StorageEvent) => {
  if (e.key === "notificationPreviewMode" && e.newValue) {
    notificationPreviewMode.value = e.newValue as any;
  } else if (e.key === "notificationPosition" && e.newValue) {
    notificationPosition.value = e.newValue as any;
  } else if (e.key === "notificationAnimation" && e.newValue) {
    notificationAnimation.value = e.newValue as any;
  } else if (e.key === "notificationDuration" && e.newValue) {
    notificationDuration.value = e.newValue as any;
  }
};

export interface NotificationData {
  id: string;
  senderName: string;
  avatar: string;
  content: string;
  time: string;
  contactId: string;
  msg: any;
  contact: Contact;
  options: any;
}

interface AggregatedNotification extends NotificationData {
  messageCount: number;
  messages: Array<{ content: string; time: string }>;
  displayContent: string;
  lastUpdateTime: number;
}

const customNotifications = ref<NotificationData[]>([]);
const expandedNotificationId = ref<string | null>(null);
const MAX_NOTIFICATIONS = 5;
const autoCloseTimers = ref<Map<string, number>>(new Map());

// 获取自动关闭时长（毫秒）- 实时从 localStorage 读取
const getAutoCloseDelay = (): number => {
  const savedDuration =
    typeof window !== "undefined"
      ? localStorage.getItem("notificationDuration") || "medium"
      : "medium";
  const durationMap: Record<string, number> = {
    short: 3000,
    medium: 5000,
    long: 10000,
    manual: 0, // 0 表示不自动关闭
  };
  return durationMap[savedDuration] || 5000;
};

const addCustomNotification = (data: Omit<NotificationData, "id">) => {
  const exists = customNotifications.value.some((n) => n.msg?.id === data.msg?.id);
  if (exists) return;

  const notification: NotificationData = {
    ...data,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
  };

  customNotifications.value.unshift(notification);
  if (customNotifications.value.length > MAX_NOTIFICATIONS * 2) {
    customNotifications.value = customNotifications.value.slice(0, MAX_NOTIFICATIONS * 2);
  }

  // 根据配置设置自动关闭
  const delay = getAutoCloseDelay();
  if (delay > 0) {
    const timer = window.setTimeout(() => {
      closeNotification(notification.id);
      autoCloseTimers.value.delete(notification.id);
    }, delay);
    autoCloseTimers.value.set(notification.id, timer);
  }
};

// 容器位置样式 - 实时从 localStorage 读取
const containerPositionStyle = computed(() => {
  const pos = getStoredValue("notificationPosition", "top-right");
  const positions: Record<string, any> = {
    "top-right": { top: "20px", right: "20px", left: "auto", bottom: "auto" },
    "top-left": { top: "20px", left: "20px", right: "auto", bottom: "auto" },
    "bottom-right": {
      bottom: "20px",
      right: "20px",
      top: "auto",
      left: "auto",
    },
    "bottom-left": { bottom: "20px", left: "20px", top: "auto", right: "auto" },
  };
  return positions[pos] || positions["top-right"];
});

// 动画类名 - 实时从 localStorage 读取
const animationClass = computed(() => {
  const anim = getStoredValue("notificationAnimation", "slide");
  return `notification-${anim}`;
});

const aggregatedNotifications = computed(() => {
  const result: AggregatedNotification[] = [];
  const processedIds = new Set<string>();
  const sorted = [...customNotifications.value];

  for (const item of sorted) {
    if (processedIds.has(item.id)) continue;

    const group = sorted.filter((n) => n.contactId === item.contactId && !processedIds.has(n.id));
    group.forEach((g) => processedIds.add(g.id));

    const count = group.length;
    const latest = group[0];
    let content = "";

    if (count === 1) {
      content = latest.content;
    } else if (count <= 3) {
      content = group.map((g) => g.content).join(" · ");
    } else {
      content = `${latest.content}`;
    }

    result.push({
      ...latest,
      messageCount: count,
      messages: group.map((g) => ({ content: g.content, time: g.time })),
      displayContent: content,
      lastUpdateTime: Date.now(),
    });
  }

  return result.slice(0, MAX_NOTIFICATIONS);
});

const toggleExpand = (id: string) => {
  if (expandedNotificationId.value === id) {
    expandedNotificationId.value = null;
  } else {
    expandedNotificationId.value = id;
  }
};

const closeNotification = (id: string) => {
  // 清除该通知的自动关闭定时器
  const timer = autoCloseTimers.value.get(id);
  if (timer) {
    clearTimeout(timer);
    autoCloseTimers.value.delete(id);
  }

  const target = aggregatedNotifications.value.find((n) => n.id === id);
  if (target) {
    customNotifications.value = customNotifications.value.filter(
      (n) => n.contactId !== target.contactId,
    );
    // 清除该联系人所有相关通知的定时器
    autoCloseTimers.value.forEach((_, timerId) => {
      // 注意：这里的 timerId 是 Map 的 key，即 notification id
      // 我们需要检查这个 notification id 是否属于被关闭的 contactId
      // 由于我们之前只存了当前 notification 的 id，这里需要更严谨的处理或者依赖 id 生成规则
      // 简单起见，我们主要依靠上面的单个 timer 清除。
      // 如果需要批量清除同一联系人的其他未聚合通知的定时器，可以遍历 customNotifications
    });

    // 更稳妥的方式：遍历当前 customNotifications 中属于该 contactId 的所有通知并清除定时器
    customNotifications.value.forEach((n) => {
      if (n.contactId === target.contactId) {
        const t = autoCloseTimers.value.get(n.id);
        if (t) {
          clearTimeout(t);
          autoCloseTimers.value.delete(n.id);
        }
      }
    });
  } else {
    customNotifications.value = customNotifications.value.filter((n) => n.id !== id);
  }
  // 如果关闭的是展开的通知，清除展开状态
  if (expandedNotificationId.value === id) {
    expandedNotificationId.value = null;
  }
};

const handleNotificationClick = (notification: AggregatedNotification) => {
  const { contact, options } = notification;
  window.focus();
  if (options?.router) {
    options.router.push("/message");
    setTimeout(() => {
      options.activeContactId.value = String(contact.id);
    }, 100);
  }
  closeNotification(notification.id);
};

const clearAllNotifications = () => {
  // 清除所有自动关闭定时器
  autoCloseTimers.value.forEach((timer) => {
    clearTimeout(timer);
  });
  autoCloseTimers.value.clear();
  customNotifications.value = [];
  expandedNotificationId.value = null;
};

const getSenderName = (notification: AggregatedNotification): string => {
  const mode: string = getStoredValue("notificationPreviewMode", "full");
  if (mode === "hidden") return "新消息";
  return notification.senderName || notification.contact.name;
};

const getDisplayContent = (notification: AggregatedNotification): string => {
  const mode: string = getStoredValue("notificationPreviewMode", "full");
  if (mode === "simple") return "收到新消息";
  if (mode === "hidden") {
    return notification.messageCount > 1 ? `${notification.messageCount}条新消息` : "新消息内容";
  }
  return notification.displayContent || notification.content;
};

// 🔥 监听 storage 事件（跨标签页同步）和页面内修改
onMounted(() => {
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageChange);
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("storage", handleStorageChange);
  }
});

defineExpose({ addCustomNotification, closeNotification });
</script>

<style scoped>
.notification-container {
  position: fixed;
  z-index: 9999;
  width: 380px;
  pointer-events: none;
}

/* QQ风格头部栏 */
.notification-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  pointer-events: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #1f2a3e;
}

.header-title i {
  font-size: 16px;
  color: #1890ff;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #8a9ab0;
}

.action-btn:hover {
  background: #f0f2f5;
  color: #ff4d4f;
}

.action-btn i {
  font-size: 16px;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: auto;
}

/* QQ风格通知卡片 */
.notification-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.notification-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  gap: 12px;
  padding: 16px;
}

/* 头像区域 */
.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.notification-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.message-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: linear-gradient(135deg, #ff6b6b, #ff4757);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
}

/* 信息区域 */
.info-wrapper {
  flex: 1;
  min-width: 0;
}

.info-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}

.sender-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2a3e;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.send-time {
  font-size: 11px;
  color: #a0b0c8;
  flex-shrink: 0;
  margin-left: 8px;
}

/* 消息预览区域 */
.message-preview-area {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 10px 12px;
  margin-top: 4px;
}

/* 单条消息 */
.single-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.message-icon {
  flex-shrink: 0;
  color: #8a9ab0;
  font-size: 14px;
}

.message-text {
  flex: 1;
  font-size: 13px;
  color: #5a6e8a;
  line-height: 1.5;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 多条消息 - 折叠区域 */
.multiple-messages {
  width: 100%;
}

.message-stack {
  width: 100%;
}

.stack-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #1890ff;
  cursor: pointer;
  padding: 4px 0;
}

.stack-header i:first-child {
  font-size: 14px;
}

.expand-icon {
  margin-left: auto;
  font-size: 14px;
  transition: transform 0.3s ease;
  color: #8a9ab0;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

/* 折叠状态预览 */
.collapsed-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e8edf5;
}

.latest-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: linear-gradient(135deg, #1890ff, #69c0ff);
  color: #fff;
  border-radius: 12px;
  flex-shrink: 0;
}

.latest-message {
  flex: 1;
  font-size: 12px;
  color: #5a6e8a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 展开的消息列表 */
.message-list {
  margin-top: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.message-item {
  margin-bottom: 8px;
}

.message-item:last-child {
  margin-bottom: 0;
}

.message-bubble {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 10px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.message-time {
  font-size: 10px;
  color: #b0bedb;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  font-size: 12px;
  color: #3a4a66;
  line-height: 1.4;
  word-break: break-word;
}

/* 关闭按钮区域 */
.close-wrapper {
  flex-shrink: 0;
}

.close-btn {
  font-size: 16px;
  color: #c0ccda;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f0f2f5;
  color: #8a9ab0;
}

/* 展开/收起动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 动画效果 */
.notification-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.notification-slide-leave-active {
  transition: all 0.25s ease;
}
.notification-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.notification-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
.notification-slide-move {
  transition: transform 0.28s ease;
}

/* 淡入效果 */
.notification-fade-enter-active {
  transition: all 0.3s ease;
}
.notification-fade-leave-active {
  transition: all 0.25s ease;
}
.notification-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.notification-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.notification-fade-move {
  transition: transform 0.28s ease;
}

/* 弹跳效果 */
.notification-bounce-enter-active {
  animation: bounce-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
.notification-bounce-leave-active {
  animation: bounce-out 0.25s ease;
}
@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }
  50% {
    transform: scale(1.05) translateY(5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
@keyframes bounce-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
}
.notification-bounce-move {
  transition: transform 0.28s ease;
}

/* 缩放效果 */
.notification-scale-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.notification-scale-leave-active {
  transition: all 0.25s ease;
}
.notification-scale-enter-from {
  opacity: 0;
  transform: scale(0.9);
}
.notification-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.notification-scale-move {
  transition: transform 0.28s ease;
}

/* 滚动条样式 */
.message-list::-webkit-scrollbar {
  width: 3px;
}

.message-list::-webkit-scrollbar-track {
  background: #f0f2f5;
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb {
  background: #d0d8e8;
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: #b0bedb;
}
</style>
