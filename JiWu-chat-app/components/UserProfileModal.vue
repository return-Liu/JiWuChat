<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="detail-overlay" @click.self="handleClose">
        <Transition name="panel-slide">
          <div class="detail-panel">
            <!-- 统一静态蓝紫弥散背景(无动画) -->
            <div class="static-light-bg"></div>

            <!-- 头部 -->
            <div class="detail-header">
              <div class="header-content">
                <a-avatar
                  :size="48"
                  :src="userData?.avatar || '/default-avatar.png'"
                  class="panel-avatar"
                />
                <div class="header-info">
                  <h2 class="panel-title">
                    {{ userData?.nickname || userData?.username }}
                  </h2>
                  <p class="panel-subtitle">{{ getUserSubtitle() }}</p>
                </div>
              </div>
              <div class="close-btn" @click="handleClose">
                <CloseOutlined />
              </div>
            </div>

            <!-- 内容区 -->
            <div class="detail-body">
              <div class="detail-container">
                <!-- 加载状态 -->
                <div v-if="loading" class="loading-state">
                  <span>加载中...</span>
                </div>

                <!-- 错误状态 -->
                <div v-else-if="error" class="error-state">
                  <span>{{ error }}</span>
                </div>

                <!-- 用户信息内容 -->
                <div v-else-if="userData" class="user-profile-content">
                  <!-- 基本信息卡片 -->
                  <div class="info-card">
                    <!-- 基本信息 -->
                    <div v-if="hasBasicInfo" class="card-section">
                      <h3 class="section-title">基本信息</h3>
                      <div class="info-list">
                        <div class="info-item" v-if="userData.gender">
                          <span class="label">性别</span>
                          <span class="value">{{
                            userData.gender === "male" ? "男" : "女"
                          }}</span>
                        </div>
                        <div class="info-item" v-if="userData.age">
                          <span class="label">年龄</span>
                          <span class="value">{{ userData.age }}岁</span>
                        </div>
                        <div class="info-item" v-if="userData.constellation">
                          <span class="label">星座</span>
                          <span class="value">{{
                            getConstellationName(userData.constellation)
                          }}</span>
                        </div>
                        <div class="info-item" v-if="userData.bio">
                          <span class="label">个性签名</span>
                          <div class="value-box">{{ userData.bio }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- 联系方式 -->
                    <div v-if="hasContactInfo" class="card-section">
                      <h3 class="section-title">联系方式</h3>
                      <div class="info-list">
                        <div class="info-item" v-if="userData.phone">
                          <span class="label">手机号</span>
                          <span class="value">{{ userData.phone }}</span>
                        </div>
                        <div class="info-item" v-if="userData.email">
                          <span class="label">邮箱</span>
                          <span class="value">{{ userData.email }}</span>
                        </div>
                        <div class="info-item" v-if="userData.hometown">
                          <span class="label">家乡</span>
                          <span class="value">{{ userData.hometown }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- 账户信息 -->
                    <div v-if="hasAccountInfo" class="card-section">
                      <h3 class="section-title">账户信息</h3>
                      <div class="info-list">
                        <div
                          class="info-item"
                          v-if="userData.formattedCreatedAt"
                        >
                          <span class="label">注册时间</span>
                          <span class="value">{{
                            userData.formattedCreatedAt
                          }}</span>
                        </div>
                        <div
                          class="info-item"
                          v-if="userData.formattedUpdatedAt"
                        >
                          <span class="label">更新时间</span>
                          <span class="value">{{
                            userData.formattedUpdatedAt
                          }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- 当没有任何信息时显示提示 -->
                    <div
                      v-if="!hasBasicInfo && !hasContactInfo && !hasAccountInfo"
                      class="no-info-tip"
                    >
                      <span>暂无详细信息</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 底部按钮 -->
            <div
              v-if="
                userData &&
                !isCurrentUser &&
                (shouldShowAddFriend || showSendMessage || showReport)
              "
              class="detail-footer"
            >
              <div class="footer-container">
                <a-tooltip
                  v-if="showAddFriend && !isFriend"
                  :title="addFriendDisabledTip"
                  placement="top"
                >
                  <a-button
                    type="primary"
                    @click="handleAddFriend"
                    :loading="addingFriend"
                    :disabled="!shouldShowAddFriend"
                    class="action-btn add-btn"
                  >
                    加为好友
                  </a-button>
                </a-tooltip>
                <a-tooltip
                  v-if="!shouldShowSendMessage && !isCurrentUser"
                  :title="sendMessageDisabledTip"
                  placement="top"
                >
                  <a-button disabled class="action-btn msg-btn">
                    发送消息
                  </a-button>
                </a-tooltip>
                <a-button
                  v-else-if="shouldShowSendMessage"
                  @click="handleSendMessage"
                  class="action-btn msg-btn"
                >
                  发送消息
                </a-button>
                <a-button
                  v-if="showReport"
                  danger
                  @click="handleReport"
                  class="action-btn report-btn"
                >
                  举报用户
                </a-button>
              </div>
            </div>
          </div>
        </Transition>

        <ReportModal
          v-if="reportContactInfo"
          :visible="reportModalVisible"
          :contact="reportContactInfo"
          @update:visible="reportModalVisible = $event"
          @submit="handleReportSubmit"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Avatar, Button, message, Tooltip } from "ant-design-vue";
import { CloseOutlined } from "@ant-design/icons-vue";
import request from "../untils/request";
import type { Contact } from "../types/chatTypes";
import { checkFriendship, sendFriendRequest } from "../untils/friendManager";
import { prepareTemporaryChat } from "../untils/messageManager";

// 类型定义
interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  status: string;
  gender?: string;
  age?: number;
  constellation?: string;
  birthday?: string;
  bio?: string;
  phone?: string;
  email?: string;
  hometown?: string;
  createdAt: string;
  updatedAt: string;
  formattedCreatedAt?: string;
  formattedUpdatedAt?: string;
  allowAddFriend?: boolean;
  allowAddFriendFromGroup?: boolean;
  allowTemporaryChat?: boolean;
}

interface Props {
  visible: boolean;
  userId: number | null;
  showAddFriend?: boolean;
  showSendMessage?: boolean;
  showReport?: boolean;
  groupId?: number | null;
  currentUserId?: number;
}

const emit = defineEmits<{
  "update:visible": [value: boolean];
  close: [];
  "add-friend": [userId: number];
  "send-message": [payload: { userId: number; userInfo: any }];
  report: [userId: number];
  "refresh-contacts": [];
}>();

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  userId: null,
  showAddFriend: true,
  showSendMessage: true,
  showReport: true,
  groupId: null,
  currentUserId: 0,
});

// 响应式数据
const userData = ref<UserInfo | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const addingFriend = ref(false);
const isFriend = ref(false);
const reportModalVisible = ref(false);
const reportContactInfo = ref<Contact | null>(null);

// 计算属性
const isCurrentUser = computed(() => {
  return props.currentUserId !== 0 && props.userId === props.currentUserId;
});

// 判断是否应该显示添加好友按钮
const shouldShowAddFriend = computed(() => {
  if (!props.showAddFriend || isFriend.value || isCurrentUser.value) {
    return false;
  }

  // 如果用户禁止被添加为好友，则不显示按钮
  if (userData.value?.allowAddFriend === false) {
    return false;
  }

  // 如果是从群聊中添加，检查是否允许从群聊添加
  if (props.groupId && userData.value?.allowAddFriendFromGroup === false) {
    return false;
  }

  return true;
});

// 判断是否应该显示发送消息按钮
const shouldShowSendMessage = computed(() => {
  if (!props.showSendMessage || isCurrentUser.value) {
    return false;
  }

  // 如果不是好友且对方禁止临时会话，则不显示按钮
  if (!isFriend.value && userData.value?.allowTemporaryChat === false) {
    return false;
  }

  return true;
});

// 获取添加好友按钮的禁用提示
const addFriendDisabledTip = computed(() => {
  if (!userData.value) return "";

  if (userData.value.allowAddFriend === false) {
    return "对方设置了禁止被添加为好友";
  }

  if (props.groupId && userData.value.allowAddFriendFromGroup === false) {
    return "对方设置了不允许从群聊添加好友";
  }

  return "";
});

// 获取发送消息按钮的禁用提示
const sendMessageDisabledTip = computed(() => {
  if (!userData.value) return "";

  if (!isFriend.value && userData.value.allowTemporaryChat === false) {
    return "对方设置了禁止临时会话";
  }

  return "";
});

// 判断是否有基本信息
const hasBasicInfo = computed(() => {
  if (!userData.value) return false;
  return !!(
    userData.value.gender ||
    userData.value.age ||
    userData.value.constellation ||
    userData.value.bio
  );
});

// 判断是否有联系方式信息
const hasContactInfo = computed(() => {
  if (!userData.value) return false;
  return !!(
    userData.value.phone ||
    userData.value.email ||
    userData.value.hometown
  );
});

// 判断是否有账户信息
const hasAccountInfo = computed(() => {
  if (!userData.value) return false;
  return !!(
    userData.value.formattedCreatedAt || userData.value.formattedUpdatedAt
  );
});

// 获取用户副标题
const getUserSubtitle = () => {
  if (!userData.value) return "";
  const parts = [];
  if (userData.value.username) parts.push(`用户名: ${userData.value.username}`);
  if (userData.value.phone) parts.push(`手机: ${userData.value.phone}`);
  return parts.join(" | ") || "用户详情";
};

const modalStyle = computed(() => ({}));

// 星座转换
const getConstellationName = (constellation: string): string => {
  const constellationMap: Record<string, string> = {
    aries: "白羊座",
    taurus: "金牛座",
    gemini: "双子座",
    cancer: "巨蟹座",
    leo: "狮子座",
    virgo: "处女座",
    libra: "天秤座",
    scorpio: "天蝎座",
    sagittarius: "射手座",
    capricorn: "摩羯座",
    aquarius: "水瓶座",
    pisces: "双鱼座",
  };
  return constellationMap[constellation] || constellation;
};

// 获取用户信息
const fetchUserInfo = async () => {
  if (!props.userId) return;
  loading.value = true;
  error.value = null;
  try {
    let response;
    if (props.groupId) {
      response = await request.get(
        `/group/${props.groupId}/members/${props.userId}`,
      );
      userData.value = {
        ...response.data.user,
        role: response.data.role,
        nickname: response.data.nickname || response.data.user?.nickname,
        tags: response.data.tags,
        joinTime: response.data.joinTime,
        groupName: response.data.groupName,
      };
    } else {
      response = await request.get(`/users/${props.userId}`);
      userData.value = response.data;
    }
    if (!props.groupId && props.userId !== props.currentUserId) {
      try {
        isFriend.value = await checkFriendship(props.userId);
      } catch (e) {
        isFriend.value = false;
      }
    }
  } catch (err: any) {
    console.error("获取用户信息失败:", err);
    error.value = err.response?.data?.message || "获取用户信息失败，请稍后重试";
  } finally {
    loading.value = false;
  }
};

// 事件处理
const handleClose = () => {
  emit("update:visible", false);
  emit("close");
};

const handleAddFriend = async () => {
  if (!props.userId) return;
  addingFriend.value = true;

  await sendFriendRequest(props.userId);
  handleClose();

  addingFriend.value = false;
};

const handleSendMessage = async () => {
  if (!props.userId) return;

  try {
    // 使用统一的工具函数处理临时会话
    const result = await prepareTemporaryChat(props.userId);

    handleClose();
    emit("send-message", {
      userId: props.userId,
      userInfo: {
        id: result.id,
        name: result.name,
        avatar: result.avatar,
        username: result.username,
        isOnline: result.isOnline,
      },
    });
  } catch (error: any) {
    console.error("创建临时会话失败:", error);
    message.error(
      error.response?.data?.data?.message ||
        error.response?.data?.message ||
        "创建临时会话失败",
    );
  }
};

const handleReport = () => {
  if (!props.userId || !userData.value) return;
  reportContactInfo.value = {
    id: props.userId,
    isGroup: false,
    avatar: userData.value.avatar || "",
    name: userData.value.nickname || userData.value.username || "未知用户",
    username: userData.value.username,
    isOnline: false,
    messages: [],
    lastMessage: "",
    lastMessageTime: "",
    unreadCount: 0,
  };
  reportModalVisible.value = true;
};

const handleReportSubmit = async (data: any) => {
  reportModalVisible.value = false;
};

// 监听
watch(
  [() => props.visible, () => props.userId],
  ([v, uid]) => {
    if (v && uid) {
      isFriend.value = false;
      fetchUserInfo();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
/* 遮罩层 */
.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* 遮罩渐变动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* 面板从下往上滑入动画 */
.panel-slide-enter-active {
  transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.panel-slide-leave-active {
  transition: transform 0.3s ease;
}
.panel-slide-enter-from {
  transform: translateY(100%);
}
.panel-slide-leave-to {
  transform: translateY(100%);
}

/* 全屏面板主体 */
.detail-panel {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #f8f5ff 0%, #f0f0ff 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 统一静态蓝紫弥散背景（无动画） */
.static-light-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(160, 140, 255, 0.07),
      transparent 45%
    ),
    radial-gradient(
      circle at 80% 70%,
      rgba(120, 160, 255, 0.06),
      transparent 50%
    ),
    radial-gradient(
      circle at 50% 90%,
      rgba(255, 255, 255, 0.2),
      transparent 60%
    );
  filter: blur(12px);
}

/* 头部样式 */
.detail-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #f2f3f5;
  background: rgba(255, 255, 255, 0.92);
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 14px;
}

.panel-avatar {
  border-radius: 12px;
}

.header-info {
  line-height: 1.3;
}

.panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}

.panel-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #86909c;
}

.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 20px;
  color: #4e5969;
  cursor: pointer;
  transition: all 0.2s;
}
.close-btn:hover {
  background: #f2f3f5;
  transform: rotate(90deg);
}

/* 内容区域 */
.detail-body {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  padding: 24px 0;
}

.detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 加载/错误状态 */
.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  font-size: 14px;
  border-radius: 12px;
  animation: fadeIn 0.4s ease forwards;
}
.loading-state {
  color: #666;
}
.error-state {
  color: #f56c6c;
  background: rgba(255, 240, 240, 0.8);
}

/* 用户资料内容 */
.user-profile-content {
  animation: cardFade 0.4s ease forwards;
}

/* 信息卡片 */
.info-card {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.card-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

/* 信息列表 */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #f7f8fa;
  border-radius: 14px;
  overflow: hidden;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fff;
  font-size: 14px;
  transition: background 0.2s;
}
.info-item:hover {
  background: #fafbfc;
}

.info-item .label {
  color: #4e5969;
}

.info-item .value {
  color: #1d2129;
  font-weight: 500;
}

/* 个性签名 */
.info-item .value-box {
  white-space: nowrap;
  overflow: visible;
  padding: 0;
  background: transparent;
  color: #1d2129;
  font-weight: 500;
}

/* 无信息提示 */
.no-info-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #86909c;
  font-size: 14px;
  text-align: center;
}

/* 底部按钮区域 */
.detail-footer {
  position: relative;
  z-index: 1;
  border-top: 1px solid #f2f3f5;
  background: rgba(255, 255, 255, 0.92);
  padding: 16px 24px;
  flex-shrink: 0;
  animation: footerUp 0.4s ease forwards;
}

.footer-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  gap: 12px;
}

.footer-container :deep(.ant-btn) {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  transition: transform 0.2s;
}

/* 元素入场动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes cardFade {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes footerUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
