<template>
  <!--
    chat-history 独立窗口页面（桌面端）
    从路由 query 读取 contactId / currentUserId / title / isGroup，
    以 embed 模式（全屏、无遮罩）渲染聊天记录内容。
    Web 端保持原有模态框方式，不走此页面。
  -->
  <ChatHistoryModal
    :visible="true"
    :embed="true"
    :contact-id="contactId"
    :contacts="contacts"
    :current-user-id="currentUserId"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

// 从路由 query 读取参数（由主窗口打开独立窗口时传入）
const contactId = computed(() => String(route.query.contactId || ""));
const currentUserId = computed(() => String(route.query.currentUserId || ""));
const title = computed(() => String(route.query.title || ""));
const isGroup = computed(() => route.query.isGroup === "true");

// 构造最小化的联系人列表（仅含当前联系人），供 ChatHistoryModal 解析名称/群聊标识
const contacts = computed(() => {
  if (!contactId.value) return [];
  return [
    {
      id: contactId.value,
      name: title.value,
      remark: title.value,
      username: title.value,
      isGroup: isGroup.value,
    },
  ];
});
</script>
