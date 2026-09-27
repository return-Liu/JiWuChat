<template>
  <!--
    auxiliary-window 布局 - 专门用于独立窗口页面
    自动包裹 AuxiliaryWindowLoader，页面加载完成后淡入内容
  -->
  <div class="auxiliary-layout">
    <!-- 加载过渡层 -->
    <AuxiliaryWindowLoader :pageTitle="pageTitle" @ready="onReady" @timeout="onReady" />

    <!-- 页面内容：加载完成后显示 -->
    <div class="auxiliary-content" :class="{ 'content-visible': loaded }">
      <!-- 独立窗口的标题栏（自定义标题 + 内容，与桌面 QQ 一致） -->
      <CustomTitleBar
        v-if="isElectronEnv"
        :isAuthPage="false"
        :hideMinimize="false"
        :title="pageTitle"
      />
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { isElectron } from "../untils/electronHelper";

const route = useRoute();
const isElectronEnv = ref(false);
const loaded = ref(false);

// 根据路由自动生成页面标题
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    settings: "设置",
    editaccount: "编辑资料",
    account: "账号管理",
    addphone: "绑定手机",
    deleteaccount: "注销账号",
    "login-devices": "设备管理",
    "notification-history": "通知历史",
    updateLogs: "更新日志",
    supercolorpalette: "调色板",
    user: "账户中心",
    editgroup: "编辑群资料",
    home: "首页",
  };
  // 优先用路由名，其次用路径第一段
  const name = (route.name as string) || "";
  const firstSegment = (route.path || "").replace(/^\//, "").split("/")[0];

  // 聊天记录：标题栏显示联系人的名字（从 query.title 读取）
  if (firstSegment === "chat-history") {
    const contactTitle = (route.query.title as string) || "";
    return contactTitle ? `${contactTitle}的聊天记录` : "聊天记录";
  }

  // 通话：标题栏显示通话类型
  if (firstSegment === "call") {
    const callType = (route.query.type as string) || "audio";
    return callType === "video" ? "视频通话" : "语音通话";
  }

  return titles[name] || titles[firstSegment] || "";
});

const onReady = () => {
  loaded.value = true;
};

onMounted(() => {
  isElectronEnv.value = isElectron();
});
</script>

<style scoped>
.auxiliary-layout {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.auxiliary-content {
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.25s ease-out;
}

.content-visible {
  opacity: 1;
}
</style>
