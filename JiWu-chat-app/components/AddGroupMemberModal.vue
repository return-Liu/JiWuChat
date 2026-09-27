<template>
  <!-- 遮罩层：取消点击关闭 + 弹窗 -->
  <div class="modal-mask" v-if="visible">
    <div class="modal-card" @click.stop>
      <!-- 头部 -->
      <div class="modal-header">
        <h2 class="modal-title">邀请好友</h2>
        <button class="btn-close" @click="handleClose">
          <CloseOutlined />
        </button>
      </div>

      <!-- 主体：左右分栏 -->
      <div class="modal-body">
        <!-- 左侧：好友列表 -->
        <div class="left-panel">
          <div class="panel-header">
            <span class="panel-title">好友列表</span>
            <span class="panel-count" v-if="availableFriends.length > 0">
              {{ availableFriends.length }}
            </span>
          </div>

          <div v-if="loadingAvailableFriends" class="loading-box">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>

          <div v-else-if="availableFriends.length === 0" class="empty-box">
            <div class="empty-icon">
              <UserOutlined :style="{ fontSize: '48px' }" />
            </div>
            <p class="empty-main">暂无好友</p>
            <p class="empty-sub">添加好友后可邀请入群</p>
          </div>

          <div v-else class="friend-list">
            <div
              v-for="friend in availableFriends"
              :key="friend.id"
              class="friend-item"
              :class="{
                selected:
                  groupMembersToAdd.includes(Number(friend.id)) &&
                  !friend.isInGroup &&
                  !friend.isInvited,
                inGroup: friend.isInGroup,
                invited: friend.isInvited,
              }"
              @click="!friend.isInGroup && !friend.isInvited && toggleMemberSelection(friend.id)"
            >
              <div class="avatar-wrapper">
                <img
                  class="avatar"
                  :src="friend.avatar"
                  alt="好友头像"
                  @error="handleAvatarError"
                />
              </div>
              <div class="friend-info">
                <span class="friend-name">{{ friend.name }}</span>
                <span v-if="friend.signature" class="friend-signature">{{ friend.signature }}</span>
              </div>
              <!-- 状态标签统一在右边 -->
              <div class="tag tag-in-group" v-if="friend.isInGroup">已在群</div>
              <div class="tag tag-invited" v-else-if="friend.isInvited">已邀请</div>
            </div>
          </div>
        </div>

        <!-- 右侧：已选中成员 -->
        <div class="right-panel">
          <div class="panel-header">
            <span class="panel-title">已选好友</span>
            <span class="panel-count" v-if="groupMembersToAdd.length > 0">
              {{ groupMembersToAdd.length }}
            </span>
          </div>

          <!-- 空状态 -->
          <div v-if="groupMembersToAdd.length === 0" class="selected-empty">
            <div class="empty-icon">
              <InfoCircleOutlined :style="{ fontSize: '48px' }" />
            </div>
            <p>未选择好友</p>
            <span>请从左侧列表选择好友</span>
          </div>

          <!-- 有选中成员时显示分组 -->
          <div v-else class="selected-members-container">
            <!-- 可以直接加入的好友 -->
            <div v-if="friendsCanDirectJoin.length > 0" class="invite-type-group">
              <div class="invite-type-label">直接加入 ({{ friendsCanDirectJoin.length }})</div>
              <div class="invited-friends-list">
                <div
                  v-for="friend in friendsCanDirectJoin"
                  :key="friend.id"
                  class="invited-friend-item"
                  @click="removeSelected(Number(friend.id))"
                >
                  <div class="selected-avatar-wrapper">
                    <img
                      :src="friend.avatar"
                      :alt="friend.name"
                      class="friend-avatar"
                      @error="handleAvatarError"
                    />
                    <!-- 蓝色选中徽章 -->
                    <div class="selected-badge">
                      <CheckOutlined />
                    </div>
                  </div>
                  <div class="friend-info">
                    <span class="friend-name">{{ friend.name }}</span>
                    <span v-if="friend.signature" class="friend-signature">{{
                      friend.signature
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 需要发送邀请的好友 -->
            <div v-if="friendsNeedInvitation.length > 0" class="invite-type-group">
              <div class="invite-type-label need-invite">
                等待确认 ({{ friendsNeedInvitation.length }})
              </div>
              <div class="invited-friends-list">
                <div
                  v-for="friend in friendsNeedInvitation"
                  :key="friend.id"
                  class="invited-friend-item"
                  @click="removeSelected(Number(friend.id))"
                >
                  <div class="selected-avatar-wrapper">
                    <img
                      :src="friend.avatar"
                      :alt="friend.name"
                      class="friend-avatar"
                      @error="handleAvatarError"
                    />
                    <!-- 蓝色选中徽章 -->
                    <div class="selected-badge">
                      <CheckOutlined />
                    </div>
                  </div>
                  <div class="friend-info">
                    <span class="friend-name">{{ friend.name }}</span>
                  </div>
                  <span class="invite-status-tag">待确认</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部 -->
      <div class="modal-footer">
        <div class="footer-tip">
          已选择
          <span class="num">{{ selectedNewMembersCount }}</span> 位好友
        </div>
        <div class="btn-group">
          <button class="btn-cancel" @click="handleClose">取消</button>
          <button
            class="btn-confirm"
            :disabled="selectedNewMembersCount === 0"
            @click="handleConfirmAddMembers"
          >
            确认邀请
          </button>
        </div>
      </div>
    </div>

    <!-- 提示信息 Toast - 显示在弹窗前面 -->
    <div v-if="toastVisible" class="custom-toast">
      <div class="toast-content">
        <WarningOutlined class="toast-icon" />
        <span>{{ toastMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import request from "../untils/request";
import { getFriends } from "../untils/friendManager";
import { message } from "ant-design-vue";
// Ant Design 图标导入
import {
  CloseOutlined,
  UserOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons-vue";

interface Friend {
  id: string;
  name: string;
  avatar: string;
  signature?: string;
  isInGroup: boolean;
  isInvited?: boolean;
  allowStrangerInvite?: boolean;
}

interface Props {
  visible: boolean;
  groupId?: string | number;
  groupMembers?: any[];
  invitedFriendIds?: number[];
  allowMemberInvite?: boolean;
  isGroupOwnerOrAdmin?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  groupId: undefined,
  groupMembers: () => [],
  invitedFriendIds: () => [],
  allowMemberInvite: true,
  isGroupOwnerOrAdmin: false,
});

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "refresh-contacts"): void;
  (e: "confirm-select", selectedIds: number[]): void;
}>();

const groupMembersToAdd = ref<number[]>([]);
const availableFriends = ref<Friend[]>([]);
const loadingAvailableFriends = ref(false);
const toastVisible = ref(false);
const toastMessage = ref("");

let isLoadingFriends = false;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

const selectedNewMembersCount = computed(() => {
  return groupMembersToAdd.value.filter((id) => {
    const f = availableFriends.value.find((x) => Number(x.id) === id);
    return f && !f.isInGroup;
  }).length;
});

const friendsCanDirectJoin = computed(() => {
  return availableFriends.value.filter(
    (friend) =>
      groupMembersToAdd.value.includes(Number(friend.id)) &&
      !friend.isInGroup &&
      friend.allowStrangerInvite !== false,
  );
});

const friendsNeedInvitation = computed(() => {
  return availableFriends.value.filter(
    (friend) =>
      groupMembersToAdd.value.includes(Number(friend.id)) &&
      !friend.isInGroup &&
      friend.allowStrangerInvite === false,
  );
});

// 显示提示信息
const showToast = (message: string, duration = 2000) => {
  if (toastTimer) clearTimeout(toastTimer);
  toastMessage.value = message;
  toastVisible.value = true;
  toastTimer = setTimeout(() => {
    toastVisible.value = false;
  }, duration);
};

const toggleMemberSelection = (friendId: string) => {
  const numId = Number(friendId);
  const index = groupMembersToAdd.value.indexOf(numId);
  index > -1 ? groupMembersToAdd.value.splice(index, 1) : groupMembersToAdd.value.push(numId);
};

const removeSelected = (id: number) => {
  const idx = groupMembersToAdd.value.indexOf(id);
  if (idx > -1) groupMembersToAdd.value.splice(idx, 1);
};

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      await loadAvailableFriends();
      if (props.invitedFriendIds && props.invitedFriendIds.length > 0) {
        groupMembersToAdd.value = [...props.invitedFriendIds];
      }
    } else {
      groupMembersToAdd.value = [];
      availableFriends.value = [];
      toastVisible.value = false;
      if (toastTimer) clearTimeout(toastTimer);
    }
  },
);

const loadAvailableFriends = async () => {
  if (isLoadingFriends) return;

  isLoadingFriends = true;
  loadingAvailableFriends.value = true;

  try {
    const friendsData = await getFriends("accepted");
    const groupMemberIds = new Set(props.groupMembers?.map((m) => String(m.id)) || []);

    availableFriends.value = (friendsData || []).map((friend: any) => {
      const friendId = String(friend.id || friend.friendId || "");
      const numId = Number(friendId);
      const isInvited = props.invitedFriendIds.includes(numId);

      return {
        id: friendId,
        name: friend.name || friend.displayName || "未知用户",
        avatar:
          friend.avatar || "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png",
        signature: friend.signature || "",
        isInGroup: groupMemberIds.has(friendId),
        isInvited: isInvited,
        allowStrangerInvite: friend.allowStrangerInvite ?? true,
      };
    });
  } catch (error: any) {
    console.error("加载好友列表失败:", error);
    showToast("加载失败，请重试");
  } finally {
    loadingAvailableFriends.value = false;
    isLoadingFriends = false;
  }
};

const handleAvatarError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.src = "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png";
};

const handleConfirmAddMembers = async () => {
  if (props.groupId && props.allowMemberInvite === false && !props.isGroupOwnerOrAdmin) {
    showToast("当前群聊仅允许群主和管理员邀请成员", 3000);
    return;
  }

  const inviteIds = groupMembersToAdd.value.filter((id) => {
    const f = availableFriends.value.find((x) => Number(x.id) === id);
    return f && !f.isInGroup;
  });

  if (!inviteIds.length) {
    showToast("请选择要邀请的好友");
    return;
  }

  if (!props.groupId) {
    emit("confirm-select", inviteIds);
    handleClose();
    return;
  }

  try {
    let gid = String(props.groupId).replace("group_", "");
    const response = await request.post(`/group/${gid}/invite-members`, {
      invitedUserIds: inviteIds,
    });

    const data = response.data;

    // 🔥 构建完整的提示信息
    let fullMessage = data.message;

    // 如果有拉黑警告，追加提示
    if (data.blockedWarnings && data.blockedWarnings.length > 0) {
      fullMessage += "（" + data.blockedWarnings.join("；") + "）";
    }

    message.success(response.data.message);
    setTimeout(() => {
      handleClose();
    }, 2500);
  } catch (error: any) {
    if (error.response?.data?.data?.message) {
      message.error(error.response.data.data.message);
    } else {
      message.error("注册失败，请重试");
    }
  }
};

const handleClose = () => {
  emit("update:visible", false);
};
</script>

<style scoped>
/* ===== CSS 变量 ===== */
.modal-mask {
  --border-color: #e5e6eb;
  --bg-hover: #f5f6f7;
  --bg-selected: #e8f0fe;
  --text-primary: #1d2129;
  --text-secondary: #4e5969;
  --text-muted: #86909c;
  --primary-color: #4080ff;
  --primary-hover: #3366ff;
  --warning-color: #ff9800;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;
}

/* ===== 遮罩 & 卡片 ===== */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-card {
  width: 820px;
  height: 600px;
  max-height: 80vh;
  background: #fff;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 2001;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

/* ===== Toast ===== */
.custom-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2100;
  animation: toastFadeIn 0.2s ease;
}

.custom-toast .toast-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 10px var(--spacing-xl);
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  border-radius: var(--radius-md);
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.custom-toast .toast-content .toast-icon {
  flex-shrink: 0;
  font-size: 20px;
}

@keyframes toastFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

/* ===== 头部 ===== */
.modal-header {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.btn-close {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: all 0.2s;
  font-size: 16px;
}

.btn-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* ===== 主体 ===== */
.modal-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ===== 面板通用 ===== */
.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.left-panel {
  width: 340px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-color);
}

.right-panel {
  flex: 1;
  min-width: 0;
}

.panel-header {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.panel-header .panel-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.panel-header .panel-count {
  font-size: 12px;
  color: var(--text-muted);
  background: #f2f3f5;
  padding: 0 var(--spacing-sm);
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

/* ===== 加载 & 空状态 ===== */
.loading-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  color: var(--text-muted);
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 2.5px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-box,
.selected-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
}

.empty-box .empty-icon,
.selected-empty .empty-icon {
  margin-bottom: var(--spacing-md);
  opacity: 0.4;
  color: #d0d5dd;
}

.empty-box p,
.selected-empty p {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xs);
}

.empty-box span,
.selected-empty span {
  font-size: 13px;
  color: var(--text-muted);
}

.empty-main {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xs);
}

.empty-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

/* ===== 好友列表 ===== */
.friend-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);
}

.friend-list::-webkit-scrollbar {
  width: 4px;
}
.friend-list::-webkit-scrollbar-thumb {
  background: #d0d5dd;
  border-radius: 2px;
}
.friend-list::-webkit-scrollbar-track {
  background: transparent;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.friend-item:last-child {
  margin-bottom: 0;
}

.friend-item:hover {
  background: var(--bg-hover);
}

.friend-item.selected {
  background: var(--bg-selected);
}

.friend-item.selected .friend-name {
  color: var(--primary-color);
}

.friend-item.inGroup,
.friend-item.invited {
  opacity: 0.6;
  cursor: not-allowed;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.friend-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.friend-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.friend-signature {
  font-size: 12px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 状态标签 - 统一在右侧 */
.tag {
  font-size: 11px;
  padding: 0 10px;
  height: 22px;
  line-height: 22px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  font-weight: 500;
}

.tag-in-group {
  background: var(--bg-selected);
  color: var(--primary-color);
}

.tag-invited {
  background: #fff3e0;
  color: var(--warning-color);
}

/* ===== 右侧已选 ===== */
.selected-members-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);
}

.selected-members-container::-webkit-scrollbar {
  width: 4px;
}
.selected-members-container::-webkit-scrollbar-thumb {
  background: #d0d5dd;
  border-radius: 2px;
}
.selected-members-container::-webkit-scrollbar-track {
  background: transparent;
}

.invite-type-group {
  margin-bottom: var(--spacing-md);
}

.invite-type-group:last-child {
  margin-bottom: 0;
}

.invite-type-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.invite-type-label.need-invite {
  color: var(--warning-color);
}

.invited-friends-list {
  display: flex;
  flex-direction: column;
}

.invited-friend-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.invited-friend-item:last-child {
  margin-bottom: 0;
}

.invited-friend-item:hover {
  background: var(--bg-hover);
}

/* 右侧头像容器 */
.selected-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.invited-friend-item .friend-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

/* 蓝色选中徽章 */
.selected-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  background: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border: 2px solid #fff;
  font-size: 10px;
}

.selected-badge .anticon {
  font-size: 10px;
}

.invited-friend-item .friend-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.invited-friend-item .friend-info .friend-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invited-friend-item .friend-info .friend-signature {
  font-size: 12px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invite-status-tag {
  font-size: 11px;
  padding: 0 10px;
  height: 22px;
  line-height: 22px;
  background: #fff3e0;
  color: var(--warning-color);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  font-weight: 500;
}

/* ===== 底部 ===== */
.modal-footer {
  padding: var(--spacing-md) var(--spacing-xl);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.footer-tip {
  font-size: 14px;
  color: var(--text-secondary);
}

.footer-tip .num {
  color: var(--primary-color);
  font-weight: 600;
}

.btn-group {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-cancel {
  padding: 7px 20px;
  background: #f2f3f5;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-cancel:hover {
  background: #e5e6eb;
}

.btn-confirm {
  padding: 7px 20px;
  background: var(--primary-color);
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-confirm:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-confirm:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
