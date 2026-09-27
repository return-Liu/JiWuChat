<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="detail-overlay" @click.self="handleClose">
        <Transition name="panel-slide">
          <div class="detail-panel">
            <div class="detail-header">
              <div class="header-content">
                <div class="panel-avatar">
                  <img :src="avatarUrl" alt="" />
                </div>
                <div class="header-info">
                  <h2 class="panel-title">{{ groupName }}</h2>
                  <p class="panel-subtitle">群号：{{ groupNumber }}</p>
                </div>
              </div>
              <div class="close-btn" @click="handleClose">✕</div>
            </div>

            <div class="detail-body">
              <div class="detail-container">
                <div v-if="messageType === 'group_notification'" class="info-card">
                  <div class="card-section">
                    <h3 class="section-title">群聊信息</h3>
                    <div class="info-list">
                      <div class="info-item">
                        <span class="label">群名称</span>
                        <span class="value">{{ groupName }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">群号</span>
                        <span class="value">{{ groupNumber }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">群备注</span>
                        <span class="value">{{ remark || "无" }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">群类型</span>
                        <span class="value">{{ isPrivate ? "私密群" : "公开群" }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">群标签</span>
                        <span class="value">{{ groupTag || "无" }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">成员人数</span>
                        <span class="value">{{ currentMembers }} / {{ maxMembers }} 人</span>
                      </div>
                      <div class="info-item">
                        <span class="label">加入方式</span>
                        <span class="value">{{ requireApproval ? "需审核" : "直接加入" }}</span>
                      </div>
                      <div class="info-item announcement">
                        <span class="label">群公告</span>
                        <div class="value-box">{{ groupNotice }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="card-section">
                    <h3 class="section-title">移出信息</h3>
                    <div class="info-list">
                      <div class="info-item">
                        <span class="label">被移出用户</span>
                        <span class="value">{{ removedUserName }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">操作人</span>
                        <span class="value">{{ operatorName }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">移出时间</span>
                        <span class="value">{{ kickTimeDisplay }}</span>
                      </div>
                      <div class="info-item">
                        <span class="label">移出原因</span>
                        <span class="value">{{ kickReason }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-if="
                    isInviter &&
                    messageType !== 'group_notification' &&
                    messageType !== 'group_invite_accepted' &&
                    messageType !== 'group_invite_rejected'
                  "
                  class="status-tip"
                >
                  {{ getStatusDescription(messageType) }}
                </div>

                <div v-if="isInvitee && messageType !== 'group_notification'" class="info-card">
                  <GroupInfoCard
                    :show-inviter="true"
                    :show-invite-time="true"
                    :show-expire-time="true"
                    :inviter-name="inviterName"
                    :invite-time-display="inviteTimeDisplay"
                    :expire-time-display="expireTimeDisplay"
                    :is-expired="isExpired"
                  />
                </div>

                <!-- 处理结果提示（已处理状态） -->
                <div
                  v-if="
                    messageType === 'group_invite_accepted' ||
                    messageType === 'group_invite_rejected'
                  "
                  class="info-card"
                >
                  <GroupInfoCard
                    :show-processing-time="true"
                    :processing-time-display="inviteTimeDisplay"
                  />
                </div>

                <!-- 状态提示区域 - 使用互斥逻辑 -->
                <template v-if="!isInviter || isInvitee">
                  <!-- 情况1：已在群中（优先显示） -->
                  <div
                    v-if="isAlreadyInGroup && messageType === 'group_invite_pending'"
                    class="status-tip result-already"
                  >
                    ⚠️ 您已在该群聊中，无需重复操作
                  </div>

                  <!-- 情况2：已处理（接受或拒绝） -->
                  <div
                    v-else-if="
                      messageType === 'group_invite_accepted' ||
                      messageType === 'group_invite_rejected'
                    "
                    class="status-tip"
                    :class="getStatusTipClass()"
                  >
                    {{ getProcessedStatusText(messageType, isInvitee) }}
                  </div>
                </template>
              </div>
            </div>

            <div
              v-if="isInvitee && messageType === 'group_invite_pending' && !isAlreadyInGroup"
              class="detail-footer"
            >
              <div class="footer-container">
                <button class="btn-agree" @click="handleAccept">同意入群</button>
                <button class="btn-refuse" @click="handleReject">拒绝入群</button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, provide } from "vue";
import { message } from "ant-design-vue";
import type { ChatMessage } from "../types/chatTypes";
import request from "../untils/request";

import {
  formatFullDateTime,
  isInviteExpired,
  getInviterName,
  getOperatorName,
  getRemovedUserName,
  getStatusDescription,
  getProcessedStatusText,
  parseSystemMessageContent,
} from "../untils/systemMessageUtils";

interface Props {
  visible: boolean;
  message: ChatMessage | null;
  currentUserId: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "close"): void;
  (e: "refresh-messages"): void;
  (e: "refresh-contacts"): void;
}>();

const isAlreadyInGroup = ref(false);

const parsedData = computed(() =>
  props.message ? parseSystemMessageContent(props.message.content) : {},
);

const avatarUrl = computed(() => parsedData.value.groupAvatar || "/default-group-avatar.png");
const groupName = computed(() => parsedData.value.groupName || "群聊");
const groupNumber = computed(() => parsedData.value.groupNumber || "未设置");
const isPrivate = computed(() => parsedData.value.isPrivate || false);
const currentMembers = computed(() => {
  const count = parsedData.value.memberCount;
  return typeof count === "object" && count !== null ? count.current || 0 : count || 0;
});
const maxMembers = computed(() => parsedData.value.maxMembers || "500");
const groupTag = computed(() => parsedData.value.groupTag || "");
const requireApproval = computed(() => parsedData.value.requireApproval || false);
const groupNotice = computed(
  () => parsedData.value.rule || parsedData.value.notice || "暂无群公告",
);
const remark = computed(() => parsedData.value.remark || "");

const operatorName = computed(() => getOperatorName(parsedData.value));
const removedUserName = computed(() => getRemovedUserName(parsedData.value));
const inviterName = computed(() => getInviterName(parsedData.value));

provide("groupName", groupName);
provide("groupNumber", groupNumber);
provide("isPrivate", isPrivate);
provide("currentMembers", currentMembers);
provide("maxMembers", maxMembers);
provide("groupTag", groupTag);
provide("requireApproval", requireApproval);
provide("groupNotice", groupNotice);

const inviteTime = computed(() => {
  const time =
    parsedData.value._timestampISO || props.message?.createdAt || parsedData.value.timestamp;
  return formatFullDateTime(time);
});

const expireTime = computed(() => {
  return formatFullDateTime(parsedData.value._expiresAtISO || parsedData.value.expiresAt);
});

const inviteTimeDisplay = computed(() => inviteTime.value || "未知");
const expireTimeDisplay = computed(() => (isExpired.value ? "已过期" : expireTime.value || "未知"));
const isExpired = computed(() => isInviteExpired(parsedData.value));

const kickTimeDisplay = computed(() => {
  const time =
    parsedData.value._timestampISO || props.message?.createdAt || parsedData.value.timestamp;
  return formatFullDateTime(time) || "未知";
});

const kickReason = computed(() => parsedData.value.reason || "未说明原因");
const messageType = computed(() => props.message?.messageType || "");

const isInviter = computed(() => {
  const inviterId = parsedData.value.inviter?.id;
  return inviterId === props.currentUserId;
});

const isInvitee = computed(() => {
  const inviteeId = parsedData.value.invitee?.id;
  return inviteeId === props.currentUserId;
});

function getStatusTipClass() {
  const t = messageType.value;
  if (t === "group_invite_accepted") return "result-accept";
  if (t === "group_invite_rejected") return "result-reject";
  return "";
}

function handleClose() {
  isAlreadyInGroup.value = false;
  emit("update:visible", false);
  emit("close");
}

// 检查用户是否已在群中
async function checkUserInGroup(groupId: number): Promise<boolean> {
  try {
    const response = await request.get(`/groups/${groupId}/members/${props.currentUserId}`);
    return response.data && response.data.isMember;
  } catch (error) {
    return false;
  }
}

// 处理已在群中的情况
function handleAlreadyInGroup() {
  isAlreadyInGroup.value = true;
  // 注意：不改变 messageType，保持为 group_invite_pending
  emit("refresh-messages");
  emit("refresh-contacts");
}

async function handleAccept() {
  try {
    if (!props.message || !parsedData.value.groupId) {
      message.error("邀请数据不完整");
      return;
    }

    const groupId = Number(parsedData.value.groupId);

    // 检查用户是否已在群中
    const isMember = await checkUserInGroup(groupId);
    if (isMember) {
      handleAlreadyInGroup();
      return;
    }

    // 执行加入操作
    const response = await request.post("/group-invitation/accept", {
      messageId: props.message.id,
      groupId: groupId,
    });

    message.success(response.data.message);
    if (props.message) {
      props.message.messageType = "group_invite_accepted";
    }

    // 🔥 修复：关闭弹窗，然后刷新联系人列表（新群会出现在列表中）
    // 不再 emit refresh-messages，因为它只刷新当前活跃联系人的消息（对加入新群无用）
    isAlreadyInGroup.value = false;
    emit("update:visible", false);
    emit("close");
    // 延迟刷新确保后端数据已更新
    setTimeout(() => {
      emit("refresh-contacts");
    }, 300);
  } catch (error: any) {
    // 如果后端返回用户已在群中的错误
    if (
      error.response?.data?.data?.message?.includes("已在群中") ||
      error.response?.data?.message?.includes("已在群中")
    ) {
      handleAlreadyInGroup();
    } else {
      message.error(error.response?.data?.data?.message || "操作失败");
    }
  }
}

async function handleReject() {
  try {
    if (!props.message || !props.message.id || !parsedData.value.groupId) {
      message.error("邀请数据不完整");
      return;
    }

    const groupId = Number(parsedData.value.groupId);

    // 检查用户是否已在群中
    const isMember = await checkUserInGroup(groupId);
    if (isMember) {
      handleAlreadyInGroup();
      return;
    }

    const response = await request.post("/group-invitation/decline", {
      messageId: props.message.id,
      groupId: groupId,
    });

    message.success(response.data.message);
    if (props.message) {
      props.message.messageType = "group_invite_rejected";
    }
    // 🔥 修复：刷新消息列表以更新卡片状态，关闭弹窗
    emit("refresh-messages");
    isAlreadyInGroup.value = false;
    emit("update:visible", false);
    emit("close");
  } catch (error: any) {
    // 如果后端返回用户已在群中的错误
    if (
      error.response?.data?.data?.message?.includes("已在群中") ||
      error.response?.data?.message?.includes("已在群中")
    ) {
      handleAlreadyInGroup();
    } else {
      message.error(error.response?.data?.data?.message || "操作失败");
    }
  }
}
</script>

<style scoped>
.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.panel-slide-enter-active {
  transition: transform 0.25s;
}
.panel-slide-leave-active {
  transition: transform 0.2s;
}
.panel-slide-enter-from {
  transform: translateY(100%);
}
.panel-slide-leave-to {
  transform: translateY(100%);
}

.detail-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
  background: #fff;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
}

.panel-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header-info {
  line-height: 1.3;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
}

.panel-subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: #8e8e93;
}

.close-btn {
  font-size: 16px;
  color: #8e8e93;
  cursor: pointer;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
  background: #fff;
}

.detail-container {
  width: 100%;
  padding: 0 16px;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 16px;
}

.card-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.info-list {
  background: #f8f8f8;
  border-radius: 8px;
  overflow: hidden;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fff;
  font-size: 13px;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #8e8e93;
}

.info-item .value {
  color: #1a1a1a;
}

.info-item.announcement {
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 12px;
}

.value-box {
  width: 100%;
  padding: 8px 10px;
  background: #f8f8f8;
  border-radius: 6px;
  color: #666;
  font-size: 12px;
  line-height: 1.5;
}

.status-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  margin-bottom: 16px;
  background: #f0f7ff;
  border-radius: 8px;
  color: #007aff;
  font-size: 13px;
}

.status-tip.result-accept {
  background: #e6f7e6;
  color: #28a745;
}

.status-tip.result-reject {
  background: #ffe6e6;
  color: #ff3b30;
}

.status-tip.result-already {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffc107;
}

.detail-footer {
  border-top: 1px solid #e5e5e5;
  background: #fff;
  padding: 12px 16px;
  flex-shrink: 0;
}

.footer-container {
  display: flex;
  gap: 12px;
}

.btn-agree {
  flex: 1;
  padding: 10px;
  background: #007aff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  color: #fff;
  cursor: pointer;
}

.btn-agree:hover {
  background: #005fc1;
}

.btn-refuse {
  flex: 1;
  padding: 10px;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  color: #1a1a1a;
  cursor: pointer;
}

.btn-refuse:hover {
  background: #e5e5e5;
}
</style>
