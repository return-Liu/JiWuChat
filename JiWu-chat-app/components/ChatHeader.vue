<template>
  <div class="chat-header-container">
    <div v-if="showUpdateEntry" class="update-entry" @click="openUpdateModal">
      <div class="update-entry-left">
        <i class="iconfont icon-pilianggengxin"></i>
        <span class="update-entry-text">更新内容</span>
      </div>
      <div class="update-entry-right">
        <span v-if="latestVersion" class="update-version">{{ latestVersion }}</span>
        <i class="iconfont icon-arrow-right"></i>
      </div>
    </div>

    <div class="chat-header" :style="chatHeaderStyle">
      <div class="chat-header-text-group">
        <div class="chat-header-name">
          <span class="name-text">{{ activeContact.name }}</span>
          <span v-if="activeContact.isGroup" class="member-count">
            ({{ activeContact.groupMembers?.length || 0 }})
          </span>
          <span
            v-if="!activeContact.isGroup && shouldShowContactOnlineStatus"
            class="online-status-text"
            :class="{ online: isContactOnline }"
          >
            {{ isContactOnline ? "在线" : "离线" }}
          </span>
        </div>
        <div v-if="activeContact.isGroup" class="chat-header-subtitle">
          <span> 群号：{{ activeContact.groupNumber || "未设置" }} </span>
        </div>
        <div v-if="!activeContact.isGroup && isTyping" class="typing-wrapper">
          <span class="typing-status-text" :style="{ color: currentColorPalette.text }">
            正在输入中
          </span>
        </div>
      </div>
      <div class="chat-header-actions">
        <div
          v-if="
            !hideMenuButton && !activeContact.isGroup && !isCurrentUser && activeContact.isFriend
          "
          class="chat-header-audio-call-btn"
          :style="{ color: currentColorPalette.text }"
          title="语音通话"
          @click="handleAudioCall"
        >
          <i class="iconfont icon-yuyintonghua icon"></i>
        </div>
        <div
          v-if="
            !hideMenuButton && !activeContact.isGroup && !isCurrentUser && activeContact.isFriend
          "
          class="chat-header-video-call-btn"
          :style="{ color: currentColorPalette.text }"
          title="视频通话"
          @click="handleVideoCall"
        >
          <i class="iconfont icon-shipintonghua icon"></i>
        </div>
        <div
          v-if="
            !hideMenuButton && !activeContact.isGroup && !isCurrentUser && !activeContact.isFriend
          "
          class="chat-header-add-friend-btn"
          :style="{ color: currentColorPalette.text }"
          title="添加好友"
          @click="handleAddFriend"
        >
          <i class="iconfont icon-tianjiahaoyou2 icon"></i>
        </div>
        <div
          v-else-if="!hideMenuButton && !activeContact.isGroup && !isCurrentUser"
          class="chat-header-create-group-btn"
          :style="{ color: currentColorPalette.text }"
          title="发起群聊"
          @click="openCreateGroupModal"
        >
          <div class="plus-circle-wrapper">
            <i class="iconfont icon-faqiqunliao icon"></i>
          </div>
        </div>
        <div
          v-if="!hideMenuButton"
          class="chat-header-menu-btn"
          @click="toggleDrawer"
          :style="{ color: currentColorPalette.text }"
          title="菜单"
        >
          <i class="iconfont icon-more icon"></i>
        </div>
      </div>
    </div>

    <CreateGroupModal
      :visible="showCreateGroupModal"
      :group-form-data="groupFormData"
      :invited-friend-ids="selectedFriendIds"
      @update:visible="showCreateGroupModal = $event"
      @update:group-form-data="groupFormData = $event"
      @confirm-create-group="handleConfirmCreateGroup"
      @close="handleCloseCreateGroupModal"
    />

    <AddGroupMemberModal
      :visible="showInviteModal"
      @update:visible="showInviteModal = $event"
      @confirm-select="handleConfirmSelectFriends"
      :invited-friend-ids="selectedFriendIds"
    />

    <UpdateModal
      :visible="updateModalVisible"
      @update:visible="updateModalVisible = $event"
      ref="updateModalRef"
    />
  </div>
</template>

<script setup lang="ts">
import type { Contact } from "../types/chatTypes";
import type { CSSProperties } from "vue";
import { useSiderColor } from "../stores/siderColor";
import { useVersionStore } from "../stores/version";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/user";
import { useCallStore } from "../stores/call";
import { computed, ref, watch, onBeforeUnmount, nextTick, onMounted } from "vue";
import { message } from "ant-design-vue";
import { sendFriendRequest } from "../untils/friendManager";
import request from "../untils/request";
import { shouldShowOnlineStatus } from "../untils/levelUtils";
import { isElectron, openAuxiliaryWindow } from "../untils/electronHelper";
import UpdateModal from "./UpdateModel.vue";
import CreateGroupModal from "./CreateGroupModal.vue";
import AddGroupMemberModal from "./AddGroupMemberModal.vue";

const router = useRouter();
const userStore = useUserStore();
const callStore = useCallStore();
const siderColorStore = useSiderColor();
const versionStore = useVersionStore();

const updateModalVisible = ref(false);
const updateModalRef = ref<any>(null);
const latestVersion = ref("");
const hasNewUpdate = ref(false);
const showUpdateEntry = ref(true);

const openUpdateModal = () => {
  updateModalVisible.value = true;
};

const checkUpdateStatus = async () => {
  try {
    const res = await request.get("/updatelogs/latest");
    let latestData = null;
    if (res && res.data) {
      latestData = res.data;
    } else if (res && typeof res === "object") {
      latestData = res;
    }

    if (!latestData || !latestData.hasUpdate) {
      hasNewUpdate.value = false;
      latestVersion.value = "";
      return;
    }

    const logData = latestData.latestLog;
    if (!logData) {
      hasNewUpdate.value = false;
      latestVersion.value = "";
      return;
    }

    const localVersion = localStorage.getItem("lastViewedUpdateVersion");
    if (localVersion && localVersion === logData.version) {
      hasNewUpdate.value = false;
    } else {
      hasNewUpdate.value = true;
    }
    latestVersion.value = logData.version;
  } catch (err) {
    console.error("检查更新状态失败:", err);
    hasNewUpdate.value = false;
  }
};

watch(updateModalVisible, (newVal) => {
  if (!newVal) {
    checkUpdateStatus();
  }
});

onMounted(() => {
  versionStore.initVersion();
  checkUpdateStatus();
});

interface Props {
  activeContact: Contact;
  chatHeaderStyle: CSSProperties;
  currentColorPalette: {
    text: string;
  };
  hideMenuButton?: boolean;
  isTyping?: boolean;
}

interface Emits {
  (event: "navigate-to-edit"): void;
  (event: "toggle-drawer"): void;
  (event: "refresh-contacts"): void;
}

const props = withDefaults(defineProps<Props>(), {
  hideMenuButton: false,
});
const emit = defineEmits<Emits>();

const isCurrentUser = computed(() => {
  return props.activeContact.id == userStore.user?.id;
});

const shouldShowContactOnlineStatus = computed(() => {
  if (!props.activeContact || props.activeContact.isGroup) return false;

  const currentUserId = userStore.user?.id;

  if (props.activeContact.id === currentUserId) {
    return true;
  }

  return shouldShowOnlineStatus(
    {
      onlineVisibility: props.activeContact.onlineVisibility,
      status: props.activeContact.status,
      id: props.activeContact.id,
    },
    currentUserId,
    true,
  );
});

const isContactOnline = computed(() => {
  if (!props.activeContact) return false;
  if (props.activeContact.isGroup) return false;

  const currentUserId = userStore.user?.id;

  if (props.activeContact.id === currentUserId) {
    return userStore.user?.status === 0;
  }

  if (props.activeContact.isOnline !== undefined) {
    return props.activeContact.isOnline === true;
  }

  return props.activeContact.status === 0;
});

const toggleDrawer = () => {
  emit("toggle-drawer");
};

const isCalling = ref(false);

const checkCallAvailable = (type: "audio" | "video"): boolean => {
  if (isCalling.value) {
    message.warning("通话中，请稍后重试");
    return false;
  }

  if (!userStore.user) {
    message.error("请先登录");
    return false;
  }

  if (!props.activeContact.isFriend) {
    message.warning("请先添加对方为好友再进行通话");
    return false;
  }

  return true;
};

// 桌面端：打开通话独立窗口（自定义标题栏 + 内容）
const openCallWindow = (type: "video" | "audio") => {
  const user = userStore.user;
  if (!user) return;

  const query = new URLSearchParams({
    type,
    callerId: String(user.id),
    receiverId: String(props.activeContact.id),
    receiverName: props.activeContact.name || props.activeContact.remark || "对方",
    receiverAvatar: props.activeContact.avatar || "",
    callerAvatar: user.avatar || "",
  });

  openAuxiliaryWindow(`/call?${query.toString()}`);
};

const handleVideoCall = () => {
  if (!checkCallAvailable("video")) return;

  const user = userStore.user;
  if (!user) {
    message.error("用户未登录");
    return;
  }

  // 桌面端：打开独立通话窗口
  if (isElectron()) {
    openCallWindow("video");
    return;
  }

  isCalling.value = true;

  callStore
    .startCall(
      "video",
      user.id.toString(),
      props.activeContact.id.toString(),
      user.avatar || "",
      props.activeContact.avatar || "",
      props.activeContact.name || "",
    )
    .catch((error: any) => {
      console.error("发起视频通话失败:", error);
      message.error(error.message || "发起视频通话失败");
    })
    .finally(() => {
      setTimeout(() => {
        isCalling.value = false;
      }, 500);
    });
};

const handleAudioCall = () => {
  if (!checkCallAvailable("audio")) return;

  const user = userStore.user;
  if (!user) {
    message.error("用户未登录");
    return;
  }

  // 桌面端：打开独立通话窗口
  if (isElectron()) {
    openCallWindow("audio");
    return;
  }

  isCalling.value = true;

  callStore
    .startCall(
      "audio",
      user.id.toString(),
      props.activeContact.id.toString(),
      user.avatar || "",
      props.activeContact.avatar || "",
      props.activeContact.name || "",
    )
    .catch((error: any) => {
      console.error("发起语音通话失败:", error);
      message.error(error.message || "发起语音通话失败");
    })
    .finally(() => {
      setTimeout(() => {
        isCalling.value = false;
      }, 500);
    });
};

const handleAddFriend = async () => {
  try {
    const contactId = Number(props.activeContact.id);
    if (isNaN(contactId)) {
      message.error("无效的联系人ID");
      return;
    }

    await sendFriendRequest(contactId, "");
  } catch (error) {
    console.error("添加好友失败:", error);
  }
};

const showImageViewer = ref(false);
const currentImageUrl = ref("");

const viewImage = (url: string) => {
  currentImageUrl.value = url;
  showImageViewer.value = true;
};

const closeImageViewer = () => {
  showImageViewer.value = false;
  currentImageUrl.value = "";
};

const showCreateGroupModal = ref(false);
const showInviteModal = ref(false);

const groupFormData = ref({
  groupName: "",
  isPrivate: false,
  requireApproval: false,
  maxMembers: 100,
  rule: "",
  category: "friends",
  description: "",
});

const selectedFriendIds = ref<number[]>([]);

const openCreateGroupModal = async () => {
  selectedFriendIds.value = [];

  if (!props.activeContact.isGroup && !isCurrentUser.value) {
    const contactId = Number(props.activeContact.id);
    if (!isNaN(contactId)) {
      selectedFriendIds.value = [contactId];
      showInviteModal.value = true;
      return;
    }
  }

  showInviteModal.value = true;
};

const handleCloseCreateGroupModal = () => {
  showCreateGroupModal.value = false;
  groupFormData.value = {
    groupName: "",
    isPrivate: false,
    requireApproval: false,
    maxMembers: 100,
    rule: "",
    category: "friends",
    description: "",
  };
};

const handleConfirmCreateGroup = () => {
  setTimeout(() => {
    selectedFriendIds.value = [];
  }, 100);
};

const handleConfirmSelectFriends = async (friendIds: number[]) => {
  if (friendIds.length === 0) {
    message.warning("请至少选择一位好友");
    return;
  }

  selectedFriendIds.value = friendIds;
  showInviteModal.value = false;

  await nextTick();
  showCreateGroupModal.value = true;
};

onBeforeUnmount(() => {
  isCalling.value = false;
});
</script>

<style scoped>
.chat-header-container {
  position: relative;
  --text-primary: v-bind("siderColorStore.currentColorPalette.textPrimary");
  border-bottom: 1px solid v-bind("siderColorStore.dividerLineColorValue");
}
.update-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  background: #f0f7ff;
  border-bottom: 1px solid #e8f0fe;
  cursor: pointer;
  transition: background 0.2s ease;
  user-select: none;
}

.update-entry:hover {
  background: #e5f0ff;
}

.update-entry-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.update-entry-left .iconfont {
  font-size: 16px;
  color: #1890ff;
}

.update-entry-text {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
}

.update-entry-right {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #999;
  font-size: 12px;
}

.update-version {
  color: #1890ff;
  font-weight: 500;
}

.update-entry-right .iconfont {
  font-size: 12px;
  color: #bbb;
}

.chat-header-container.dark .update-entry {
  background: rgba(24, 144, 255, 0.08);
  border-bottom-color: rgba(255, 255, 255, 0.06);
}

.chat-header-container.dark .update-entry:hover {
  background: rgba(24, 144, 255, 0.14);
}

.chat-header-container.dark .update-entry-text {
  color: #e0e0e0;
}

.chat-header-container.dark .update-entry .iconfont {
  color: #40a9ff;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  z-index: 10;
}

.chat-header-text-group {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.2;
  min-height: 30px;
}

.chat-header-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
  line-height: 1.2;
}

.name-text {
  flex-shrink: 0;
}

.member-count {
  flex-shrink: 0;
  font-weight: normal;
  font-size: 14px;
  opacity: 0.9;
  color: var(--text-primary);
}

.online-status-text {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: normal;
  opacity: 0.9;
  color: #999;
  line-height: 1.2;
}

.online-status-text.online {
  color: #1cc23e;
}

.typing-wrapper {
  margin-top: 2px;
}

.typing-status-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: normal;
  opacity: 0.9;
  line-height: 1.2;
}

.chat-header-subtitle {
  font-size: 12px;
  opacity: 0.9;
  line-height: 1.2;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-header-video-call-btn,
.chat-header-audio-call-btn,
.chat-header-create-group-btn,
.chat-header-add-friend-btn,
.chat-header-menu-btn {
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.icon {
  font-size: 20px;
  color: var(--text-primary);
}

.plus-circle-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
