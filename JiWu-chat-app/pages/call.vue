<template>
  <!--
    /call 独立窗口页面（桌面端音视频通话）
    从路由 query 读取通话参数，重新发起通话，并渲染通话界面。
    Web 端保持主窗口内浮层（不经过此页面）。
  -->
  <CallInterface />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useCallStore } from "../stores/call";
import { useUserStore } from "../stores/user";
import { getSignalingService } from "../untils/signalingService";

const route = useRoute();
const callStore = useCallStore();
const userStore = useUserStore();

onMounted(async () => {
  // 初始化用户状态（独立窗口需要重新拉取）
  try {
    await userStore.initializeAuth();
    if (!userStore.user) {
      await userStore.fetchUserInfo(true);
    }
  } catch (err) {
    console.error("通话窗口初始化用户失败:", err);
  }

  // 确保信令服务已连接（通话需要信令通道）
  const userId = String(userStore.user?.id || "");
  if (userId) {
    const signaling = getSignalingService();
    if (!signaling.isConnected) {
      try {
        await signaling.connect(userId);
      } catch (err) {
        console.error("通话窗口信令连接失败:", err);
      }
    }
  }

  // 从 query 读取通话参数
  const callType = (route.query.type as "video" | "audio") || "audio";
  const receiverId = String(route.query.receiverId || "");
  const receiverName = String(route.query.receiverName || "对方");
  const receiverAvatar = String(route.query.receiverAvatar || "");
  const callerId = String(route.query.callerId || userStore.user?.id || "");
  const callerAvatar = String(route.query.callerAvatar || userStore.user?.avatar || "");

  if (!receiverId || !callerId) {
    console.error("通话参数缺失");
    return;
  }

  // 重新发起通话
  await callStore.startCall(
    callType,
    callerId,
    receiverId,
    callerAvatar,
    receiverAvatar,
    receiverName,
  );
});
</script>
