<template>
  <div
    v-if="notification"
    class="call-bar"
    :class="{ 'call-bar-warning': notification.showWarning }"
  >
    <div class="call-bar-left">
      <img class="call-bar-avatar" :src="notification.avatar || defaultAvatar" alt="avatar" />
      <div class="call-bar-info">
        <span class="call-bar-name">
          <span class="caller-name">{{ notification.callerName || "未知联系人" }}</span>
          <span class="call-action">向你</span>
          <span class="call-type-label">
            {{ notification.callType === "video" ? "发起视频通话" : "发起语音通话" }}
          </span>
        </span>
      </div>
    </div>

    <div class="call-bar-status-wrap">
      <span v-if="notification.showWarning" class="call-bar-status status-warning">
        {{ notification.countdown || 0 }}s
      </span>
    </div>

    <div class="call-bar-right">
      <button class="call-btn decline" @click.stop="$emit('decline', notification)" title="拒绝">
        <i class="iconfont icon-guaduan"></i>
      </button>
      <button class="call-btn accept" @click.stop="$emit('accept', notification)" title="接听">
        <i class="iconfont icon-jieting"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CallNotification } from "../../../types/callTypes";

const defaultAvatar = "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png";

defineProps<{
  notification: CallNotification;
}>();

defineEmits<{
  (e: "accept", notification: CallNotification): void;
  (e: "decline", notification: CallNotification): void;
}>();
</script>

<style scoped>
/* ================================================
   通用通栏样式
   ================================================ */
.call-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  animation: callSlide 0.3s ease;
  gap: 16px;
  min-height: 56px;
  box-sizing: border-box;
}

.call-bar-warning {
  background: rgba(200, 50, 30, 0.92);
  animation: callPulse 1s ease-in-out infinite;
}

.call-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.call-bar-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: #f0f0f0;
}

.call-bar-info {
  display: flex;
  align-items: center;
  min-width: 0;
}

.call-bar-name {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.caller-name {
  color: #fff;
  font-weight: 600;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.call-action {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
}

.call-type-label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
}

.call-bar-warning .caller-name {
  color: #fff;
}

.call-bar-warning .call-action {
  color: rgba(255, 255, 255, 0.7);
}

.call-bar-warning .call-type-label {
  color: rgba(255, 255, 255, 0.8);
}

.call-bar-status-wrap {
  flex-shrink: 0;
  min-width: 32px;
  text-align: center;
}

.call-bar-status {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.call-bar-status.status-warning {
  color: #ff6b35;
  font-weight: 600;
  animation: warningPulse 0.8s ease-in-out infinite;
}

.call-bar-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.call-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
  color: #fff;
  background: transparent;
  outline: none;
  user-select: none;
}

.call-btn:active {
  transform: scale(0.92);
}

.call-btn:hover {
  transform: scale(1.08);
}

.call-btn.accept {
  background: #34c759;
}

.call-btn.accept:hover {
  background: #2db84d;
  box-shadow: 0 0 20px rgba(52, 199, 89, 0.4);
}

.call-btn.accept:active {
  background: #28a745;
  transform: scale(0.92);
}

.call-btn.decline {
  background: rgba(255, 255, 255, 0.12);
}

.call-btn.decline:hover {
  background: #ff3b30;
  box-shadow: 0 0 20px rgba(255, 59, 48, 0.4);
}

.call-btn.decline:active {
  background: #d63031;
  transform: scale(0.92);
}

.call-btn .iconfont {
  font-size: 16px;
  line-height: 1;
}

/* ================================================
   动画
   ================================================ */
@keyframes callSlide {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes callPulse {
  0%,
  100% {
    background: rgba(200, 50, 30, 0.92);
  }
  50% {
    background: rgba(220, 60, 40, 0.95);
  }
}

@keyframes warningPulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.1);
  }
}

/* ================================================
   过渡动画
   ================================================ */
.call-fade-enter-active,
.call-fade-leave-active {
  transition: all 0.3s ease;
}

.call-fade-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}

.call-fade-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.call-fade-bottom-enter-active,
.call-fade-bottom-leave-active {
  transition: all 0.3s ease;
}

.call-fade-bottom-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.call-fade-bottom-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

/* ================================================
   响应式
   ================================================ */
@media (max-width: 520px) {
  .call-bar {
    padding: 10px 14px;
    gap: 10px;
    min-height: 48px;
  }

  .call-bar-name {
    font-size: 13px;
  }

  .caller-name {
    max-width: 80px;
  }

  .call-btn {
    width: 30px;
    height: 30px;
    font-size: 14px;
  }

  .call-bar-avatar {
    width: 32px;
    height: 32px;
  }

  .call-btn .iconfont {
    font-size: 14px;
  }

  .call-bar-status-wrap {
    min-width: 28px;
  }

  .call-bar-status {
    font-size: 11px;
  }
}

@media (max-width: 380px) {
  .call-bar {
    padding: 8px 10px;
    gap: 6px;
    min-height: 44px;
  }

  .call-bar-name {
    font-size: 12px;
  }

  .caller-name {
    max-width: 60px;
  }

  .call-btn {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .call-bar-avatar {
    width: 28px;
    height: 28px;
  }
}

/* ================================================
   暗色主题适配
   ================================================ */
@media (prefers-color-scheme: dark) {
  .call-bar {
    background: rgba(0, 0, 0, 0.92);
  }
}

/* ================================================
   可访问性
   ================================================ */
.call-btn:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.call-btn.accept:focus-visible {
  outline-color: #34c759;
}

.call-btn.decline:focus-visible {
  outline-color: #ff3b30;
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .call-bar {
    animation: none !important;
  }

  .call-bar-warning {
    animation: none !important;
  }

  .call-bar-status.status-warning {
    animation: none !important;
  }

  .call-btn {
    transition: none !important;
  }

  .call-btn:hover {
    transform: none !important;
  }
}
</style>
