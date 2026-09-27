<template>
  <!-- ========== 桌面端：顶部通栏通知 ========== -->
  <div v-if="isDesktop" class="global-call-notification">
    <TransitionGroup name="call-fade" tag="div" class="call-list">
      <div
        v-for="notification in activeNotifications"
        :key="notification.id"
        class="call-bar"
        :class="{ 'call-bar-warning': notification.showWarning }"
      >
        <div class="call-bar-left">
          <img class="call-bar-avatar" :src="notification.avatar" alt="" />
          <div class="call-bar-info">
            <span class="call-bar-name">
              <span class="caller-name">{{ notification.callerName }}</span>
              <span class="call-action">向你</span>
              <span class="call-type-label">
                {{ notification.callType === "video" ? "发起视频通话" : "发起语音通话" }}
              </span>
            </span>
          </div>
        </div>

        <div class="call-bar-status-wrap">
          <span v-if="notification.showWarning" class="call-bar-status status-warning">
            {{ notification.countdown }}s
          </span>
        </div>

        <div class="call-bar-right">
          <button class="call-btn decline" @click.stop="declineCall(notification)">
            <i class="iconfont icon-guaduan"></i>
          </button>
          <button class="call-btn accept" @click.stop="acceptCall(notification)">
            <i class="iconfont icon-jieting"></i>
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>

  <!-- ========== Web 端：底部通栏通知 ========== -->
  <div v-else class="global-call-notification-web">
    <TransitionGroup name="call-fade" tag="div" class="call-list-web">
      <div
        v-for="notification in activeNotifications"
        :key="notification.id"
        class="call-bar call-bar-web"
        :class="{ 'call-bar-warning': notification.showWarning }"
      >
        <div class="call-bar-left">
          <img class="call-bar-avatar" :src="notification.avatar" alt="" />
          <div class="call-bar-info">
            <span class="call-bar-name">
              <span class="caller-name">{{ notification.callerName }}</span>
              <span class="call-action">向你</span>
              <span class="call-type-label">
                {{ notification.callType === "video" ? "发起视频通话" : "发起语音通话" }}
              </span>
            </span>
          </div>
        </div>

        <div class="call-bar-status-wrap">
          <span v-if="notification.showWarning" class="call-bar-status status-warning">
            {{ notification.countdown }}s
          </span>
        </div>

        <div class="call-bar-right">
          <button class="call-btn decline" @click.stop="declineCall(notification)">
            <i class="iconfont icon-guaduan"></i>
          </button>
          <button class="call-btn accept" @click.stop="acceptCall(notification)">
            <i class="iconfont icon-jieting"></i>
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useUserStore } from "../stores/user";
import { useCallStore } from "../stores/call";
import { isElectron } from "../untils/electronHelper";
import { getSignalingService, addGlobalSignalingListener } from "../untils/signalingService";
import { CallStatus } from "../untils/webrtcCallManager";
import { message } from "ant-design-vue";

const isDesktop = computed(() => isElectron());

interface CallNotification {
  id: string;
  callerId: string;
  callerName: string;
  avatar: string;
  callType: "audio" | "video";
  sdp: any;
  timestamp: number;
  countdown: number;
  showWarning: boolean;
  countdownTimer: ReturnType<typeof setInterval> | null;
  timeoutTimer: ReturnType<typeof setTimeout> | null;
}

const activeNotifications = ref<CallNotification[]>([]);
const userStore = useUserStore();
const callStore = useCallStore();
let signalingService: any = null;
let removeGlobalListener: (() => void) | null = null;

// 音效
let ringtoneAudio: HTMLAudioElement | null = null;
let hangupAudio: HTMLAudioElement | null = null;
let isRingtonePlaying = false;

const playCallSound = () => {
  try {
    if (isRingtonePlaying) return;
    stopCallSound();
    ringtoneAudio = new Audio("Ringtone/来电铃声.wav");
    ringtoneAudio.loop = true;
    ringtoneAudio.volume = 0.4;
    ringtoneAudio
      .play()
      .then(() => {
        isRingtonePlaying = true;
      })
      .catch(() => {});
  } catch {}
};

const stopCallSound = () => {
  if (ringtoneAudio) {
    try {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
      ringtoneAudio.src = "";
      ringtoneAudio = null;
      isRingtonePlaying = false;
    } catch {}
  }
};

const playHangupSound = () => {
  try {
    if (hangupAudio) {
      hangupAudio.pause();
      hangupAudio.src = "";
      hangupAudio = null;
    }
    hangupAudio = new Audio("Ringtone/来电挂断铃声.mp3");
    hangupAudio.volume = 0.5;
    hangupAudio.play().catch(() => {});
    hangupAudio.addEventListener("ended", () => {
      if (hangupAudio) {
        hangupAudio.src = "";
        hangupAudio = null;
      }
    });
  } catch {}
};

const clearAllNotifications = () => {
  activeNotifications.value.forEach((n) => clearNotificationTimers(n));
  activeNotifications.value = [];
  stopCallSound();
};

const clearNotificationTimers = (notification: CallNotification) => {
  if (notification.countdownTimer) {
    clearInterval(notification.countdownTimer);
    notification.countdownTimer = null;
  }
  if (notification.timeoutTimer) {
    clearTimeout(notification.timeoutTimer);
    notification.timeoutTimer = null;
  }
};

const startCountdown = (notification: CallNotification) => {
  const TOTAL_TIMEOUT = 30;
  const WARNING_AT = 20;

  notification.countdown = TOTAL_TIMEOUT;

  notification.countdownTimer = setInterval(() => {
    notification.countdown--;
    if (notification.countdown <= WARNING_AT && !notification.showWarning) {
      notification.showWarning = true;
    }
    if (notification.countdown <= 0) {
      clearNotificationTimers(notification);
    }
  }, 1000);

  notification.timeoutTimer = setTimeout(() => {
    const index = activeNotifications.value.findIndex((n) => n.id === notification.id);
    if (index !== -1) {
      declineCall(notification);
    }
  }, TOTAL_TIMEOUT * 1000);
};

const handleCallInvite = (data: any) => {
  const currentUserId = userStore.user?.id || localStorage.getItem("userId");
  if (!currentUserId) return;

  const callerId = data.callerId || data.from || data.caller || "";
  const callerName = data.callerName || data.name || data.username || data.fromName || "未知联系人";
  const avatar =
    data.callerAvatar ||
    data.avatar ||
    data.userAvatar ||
    "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png";

  let callType: "audio" | "video" = "audio";
  if (data.callType === "video" || data.type === "video") {
    callType = "video";
  }

  const sdp = data.sdp || data.offer || data.data?.signal || null;

  if (String(callerId) === String(currentUserId)) return;

  const existingNotification = activeNotifications.value.find((n) => n.callerId === callerId);

  if (existingNotification) {
    existingNotification.callType = callType;
    existingNotification.callerName = callerName;
    existingNotification.avatar = avatar;
    if (sdp) existingNotification.sdp = sdp;
    existingNotification.timestamp = Date.now();
    return;
  }

  const notification: CallNotification = {
    id: `call_${Date.now()}_${callerId}`,
    callerId,
    callerName,
    avatar,
    callType,
    sdp,
    timestamp: Date.now(),
    countdown: 30,
    showWarning: false,
    countdownTimer: null,
    timeoutTimer: null,
  };

  activeNotifications.value.push(notification);
  playCallSound();
  startCountdown(notification);
};

const handleSignalingMessage = (msg: any) => {
  if (msg.type === "call_answered" || msg.type === "call_accepted") {
    const callerId = msg.from || msg.callerId;
    if (callerId) {
      const notification = activeNotifications.value.find((n) => n.callerId === callerId);
      if (notification) {
        clearNotificationTimers(notification);
        activeNotifications.value = activeNotifications.value.filter(
          (n) => n.id !== notification.id,
        );
        stopCallSound();
      } else {
        clearAllNotifications();
      }

      setTimeout(() => {
        if (callStore.isCalling && !callStore.isInCall) {
          callStore.isCalling = false;
          callStore.isInCall = true;
          callStore.webRtcStatus = CallStatus.CONNECTED;

          if (callStore.callStartTime === null) {
            callStore.callStartTime = Date.now();
            if (callStore.timer) {
              clearInterval(callStore.timer);
            }
            callStore.timer = window.setInterval(() => {
              if (callStore.callStartTime) {
                callStore.callDuration = Math.floor((Date.now() - callStore.callStartTime) / 1000);
              }
            }, 1000) as any;
          }
        }
      }, 3000);
    }
    return;
  }

  if (msg.type === "ice_candidate") return;

  if (msg.type === "end_call" || msg.type === "call_ended") {
    const callerId = msg.from || msg.callerId || msg.to;
    if (callerId) {
      const notification = activeNotifications.value.find((n) => n.callerId === callerId);
      if (notification) {
        clearNotificationTimers(notification);
        stopCallSound();
        activeNotifications.value = activeNotifications.value.filter(
          (n) => n.id !== notification.id,
        );
      } else {
        stopCallSound();
        clearAllNotifications();
      }
    } else {
      stopCallSound();
      clearAllNotifications();
    }

    if (callStore.isCalling && !callStore.isInCall) {
      const reason = msg.data?.reason || "";
      if (reason === "declined") {
        message.warning("对方拒绝了通话", 3);
      } else {
        message.info("对方取消了通话", 3);
      }
    }
    return;
  }

  if (msg.type === "call_offer") {
    const callerId = msg.from || msg.callerId;
    if (!callerId) return;

    const currentUserId = userStore.user?.id || localStorage.getItem("userId");
    if (String(callerId) === String(currentUserId)) return;

    const existingNotification = activeNotifications.value.find((n) => n.callerId === callerId);

    if (existingNotification) {
      const updatedCallType: "audio" | "video" =
        msg.callType || msg.data?.callType || existingNotification.callType;
      if (updatedCallType) {
        existingNotification.callType = updatedCallType;
      }

      if (msg.data?.signal) {
        existingNotification.sdp = msg.data.signal;
      } else if (msg.sdp) {
        existingNotification.sdp = msg.sdp;
      } else if (msg.data) {
        existingNotification.sdp = msg.data;
      }

      if (existingNotification.callerName === "未知联系人") {
        existingNotification.callerName =
          msg.callerName || msg.data?.callerName || msg.fromName || callerId;
      }
      if (!existingNotification.avatar || existingNotification.avatar === "") {
        existingNotification.avatar =
          msg.callerAvatar ||
          msg.data?.callerAvatar ||
          "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png";
      }
    } else {
      const callerName = msg.callerName || msg.data?.callerName || msg.fromName || callerId;
      const avatar =
        msg.callerAvatar ||
        msg.data?.callerAvatar ||
        "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png";
      const callType: "audio" | "video" = msg.callType || msg.data?.callType || "audio";
      const sdp = msg.data?.signal || msg.sdp || msg.data || null;

      const notification: CallNotification = {
        id: `call_${Date.now()}_${callerId}`,
        callerId,
        callerName,
        avatar,
        callType,
        sdp,
        timestamp: Date.now(),
        countdown: 30,
        showWarning: false,
        countdownTimer: null,
        timeoutTimer: null,
      };

      activeNotifications.value.push(notification);
      playCallSound();
      startCountdown(notification);
    }
    return;
  }

  if (msg.from || msg.callerId) {
    const callerId = msg.from || msg.callerId;
    const notification = activeNotifications.value.find((n) => n.callerId === callerId);

    if (notification) {
      if (msg.data?.signal) {
        notification.sdp = msg.data.signal;
      } else if (msg.sdp) {
        notification.sdp = msg.sdp;
      } else if (msg.data) {
        notification.sdp = msg.data;
      }

      if (notification.callerName === "未知联系人" && msg.callerName) {
        notification.callerName = msg.callerName;
      }
    }
  }
};

const acceptCall = async (notification: CallNotification) => {
  try {
    clearNotificationTimers(notification);
    activeNotifications.value = activeNotifications.value.filter((n) => n.id !== notification.id);
    stopCallSound();

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    await callStore.receiveCall(
      notification.sdp,
      notification.callerId,
      notification.avatar,
      notification.callerName,
      notification.callType,
    );
  } catch (error: any) {
    console.error("接听失败:", error);
    if (!activeNotifications.value.find((n) => n.id === notification.id)) {
      activeNotifications.value.push(notification);
      playCallSound();
    }
  }
};

const declineCall = (notification: CallNotification) => {
  clearNotificationTimers(notification);

  activeNotifications.value = activeNotifications.value.filter((n) => n.id !== notification.id);

  stopCallSound();
  playHangupSound();

  if (navigator.vibrate) {
    navigator.vibrate(30);
  }

  callStore.callType = notification.callType;
  callStore.callerId = notification.callerId;
  callStore.receiverId = String(userStore.user?.id || "");

  callStore.declineCall();
};

const handleGlobalMessage = (msg: any) => {
  if (msg.type === "call_answered" || msg.type === "call_accepted") {
    handleSignalingMessage(msg);
    return;
  }

  if (msg.type === "call_offer") {
    handleSignalingMessage(msg);
    return;
  }

  if (msg.type === "end_call" || msg.type === "call_ended") {
    handleSignalingMessage(msg);
    return;
  }

  handleSignalingMessage(msg);
};

const handleSocketCallInvite = (data: any) => {
  handleCallInvite(data);
};

let isSignalingInitialized = false;
let initPromise: Promise<void> | null = null;
let boundSocketId: string | null = null;

const bindCallInviteListener = () => {
  const socket = signalingService?.getSocket();
  if (!socket) return;
  if (boundSocketId === socket.id) return;

  socket.off("call_invite", handleSocketCallInvite);
  socket.on("call_invite", handleSocketCallInvite);
  boundSocketId = socket.id || null;
};

const ensureSignalingInitialized = async (): Promise<void> => {
  if (isSignalingInitialized) {
    bindCallInviteListener();
    return;
  }
  if (initPromise) {
    await initPromise;
    bindCallInviteListener();
    return;
  }

  initPromise = (async () => {
    signalingService = getSignalingService();

    if (!userStore.user?.id) {
      const startTime = Date.now();
      while (!userStore.user?.id && Date.now() - startTime < 3000) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    const userId = userStore.user?.id ? String(userStore.user.id) : localStorage.getItem("userId");

    if (!userId) return;

    if (!removeGlobalListener) {
      removeGlobalListener = addGlobalSignalingListener(handleGlobalMessage);
    }

    if (!signalingService.isConnected) {
      try {
        await signalingService.connect(userId);
      } catch (err: any) {
        return;
      }
    }

    bindCallInviteListener();

    isSignalingInitialized = true;
  })();

  await initPromise;
};

const handleKeydown = (e: KeyboardEvent) => {
  if (activeNotifications.value.length === 0) return;

  const latestNotification = activeNotifications.value[activeNotifications.value.length - 1];

  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    acceptCall(latestNotification);
  } else if (e.key === "Escape") {
    e.preventDefault();
    declineCall(latestNotification);
  }
};

onMounted(async () => {
  await ensureSignalingInitialized();
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  const socket = signalingService?.getSocket();
  if (socket) {
    socket.off("call_invite", handleSocketCallInvite);
  }
  if (signalingService) {
    signalingService.disconnect();
  }
  if (removeGlobalListener) {
    removeGlobalListener();
  }
  stopCallSound();
  document.removeEventListener("keydown", handleKeydown);

  if (callStore.timer) {
    clearInterval(callStore.timer);
    callStore.timer = null;
  }
});

defineExpose({
  handleCallInvite,
  clearAllNotifications,
});
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
}

.call-bar-warning {
  background: rgba(200, 50, 30, 0.92);
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
}

.call-bar-status.status-warning {
  color: #ff6b35;
  font-weight: 600;
  animation: callPulse 0.8s ease-in-out infinite;
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
  transition: all 0.2s;
  font-size: 16px;
  color: #fff;
}

.call-btn:hover {
  transform: scale(1.1);
}

.call-btn.accept {
  background: #34c759;
}
.call-btn.accept:hover {
  background: #2db84d;
}

.call-btn.decline {
  background: rgba(255, 255, 255, 0.12);
}
.call-btn.decline:hover {
  background: #ff3b30;
}

.call-btn .iconfont {
  font-size: 16px;
}

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
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* 过渡动画 */
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

/* ================================================
   桌面端：顶部通栏
   ================================================ */
.global-call-notification {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  pointer-events: none;
}

.call-list {
  display: flex;
  flex-direction: column;
  pointer-events: auto;
}

/* ================================================
   Web 端：底部通栏
   ================================================ */
.global-call-notification-web {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  pointer-events: none;
}

.call-list-web {
  display: flex;
  flex-direction: column-reverse;
  pointer-events: auto;
}

.call-list-web .call-bar {
  border-bottom: none;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.call-list-web .call-fade-enter-from,
.call-list-web .call-fade-leave-to {
  transform: translateY(100%);
}

/* ================================================
   响应式
   ================================================ */
@media (max-width: 520px) {
  .call-bar {
    padding: 10px 14px;
    gap: 10px;
    flex-wrap: wrap;
  }

  .call-bar-name {
    font-size: 13px;
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
}
</style>
