<template>
  <div class="page-wrapper">
    <div class="qq-chat-container">
      <div class="qq-main">
        <!-- 侧边栏导航 -->
        <Sidebar :current-area="'message'" />
        <div class="message-content">
          <div class="chat-main-area">
            <!-- 中间联系人/群聊列表区域 -->
            <MiddleArea
              :content-type="'message'"
              :contacts="contacts"
              :active-contact-id="activeContactId"
              :pending-group-application-count="pendingGroupApplicationCount"
              :pending-friend-application-count="pendingFriendApplicationCount"
              no-content-tip="没有搜索到相关联系人/群聊"
              placeholder="搜索联系人/群聊"
              @contact-select="handleContactSelect"
              @group-created="handleGroupCreated"
              @update-contact="handleUpdateContact"
              @refresh-contacts="handleRefreshContacts"
              @refresh-group-application-count="loadPendingGroupApplicationCount"
              @refresh-friend-application-count="loadPendingFriendApplicationCount"
              @close-drawer="closeContactDrawer"
            />
            <!-- 右侧聊天窗口区域 -->
            <RightChatArea
              ref="rightChatAreaRef"
              :contacts="contacts"
              :active-contact-id="activeContactId"
              @send-message="handleSendMessageWrapper"
              @edit-remark="handleEditRemarkWrapper"
              @clear-chat="handleClearChatWrapper"
              @delete-friend="handleDeleteFriendWrapper"
              @delete-temporary-contact="handleDeleteTemporaryContactWrapper"
              @toggle-top="handleToggleTopWrapper"
              @toggle-mute="handleToggleMuteWrapper"
              @quit-group="handleQuitGroupWrapper"
              @dissolve-group="handleDissolveGroupWrapper"
              @update-group-rule="handleUpdateGroupRuleWrapper"
              @refresh-contacts="handleRefreshContacts"
              @contact-select="handleContactSelect"
              :current-user-id="currentUserId"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义系统通知组件 -->
    <NotificationComponent ref="notificationComponentRef" />

    <!-- 状态栏通知组件 -->
    <StatusBarNotification ref="statusBarNotificationRef" />

    <!-- 版本更新提醒组件 -->
    <UpdateReminderModal
      :visible="showUpdateReminder"
      @update:visible="showUpdateReminder = $event"
      ref="updateReminderRef"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, inject, watch } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/user";
import request from "../untils/request";
import { getFriends } from "../untils/friendManager";
import { websocketService } from "../untils/websocket";
import {
  getTopStatusFromLocalStorage,
  getMuteStatusFromLocalStorage,
  sortContacts,
  handleUpdateGroupRule,
  handleToggleTop,
  handleToggleMute,
  handleSendMessage,
  handleEditRemark,
  getChatHistory,
  invalidateChatHistoryCache,
  formatMessageContent,
  updateContactLastMessage,
  getCustomRecallText,
  createOrUpdateTemporaryContactAPI,
  markMessagesAsRead,
} from "../untils/contactManager";
import { getTemporaryContacts } from "../untils/temporaryContactManager";
import { handleMoreActionCommand, type ChatAreaManagerOptions } from "../untils/chatAreaManager";
import {
  refreshGroups as refreshGroupsUtil,
  fetchFriendsList as fetchFriendsListUtil,
  fetchAllRecentMessages as fetchAllRecentMessagesUtil,
  handleRealtimeMessage as handleRealtimeMessageUtil,
  handleRecallMessage as handleRecallMessageUtil,
  handleDeleteMessageFromWs as handleDeleteMessageFromWsUtil,
  handleBatchDeleteMessagesFromWs as handleBatchDeleteMessagesFromWsUtil,
  handleGroupMemberLevelUpdate as handleGroupMemberLevelUpdateUtil,
  handleGroupMemberTitleUpdate as handleGroupMemberTitleUpdateUtil,
  fetchGroupDetails as fetchGroupDetailsUtil,
  restoreContactStates as restoreContactStatesUtil,
  prepareTemporaryChat,
  MessageLoader,
  type MessagePageState,
  type MessagePageOptions,
} from "../untils/messageManager";
import type { Contact } from "../types/chatTypes";
import { message } from "ant-design-vue";
import { useCallStore } from "../stores/call";
import {
  createCallMessage,
  insertCallMessageToContact,
  sendCallRecordToServer,
} from "../untils/callMessageUtils";

// 加载状态
const loading = ref<boolean>(false);
const chatLoading = ref<boolean>(false);
const hasInitialized = ref<boolean>(true);

// 核心数据
const router = useRouter();
const userStore = useUserStore();
const activeContactId = ref<string>("");
const contacts = ref<Contact[]>([]);
const currentUserId = ref<string>("");
const rightChatAreaRef = ref();

// 通知组件引用
const notificationComponentRef = ref();
const statusBarNotificationRef = ref();

// 待处理群聊申请数量
const pendingGroupApplicationCount = ref(0);

// 待处理好友申请数量
const pendingFriendApplicationCount = ref(0);

// 版本更新提醒
const showUpdateReminder = ref(false);
const updateReminderRef = ref();

// MessageLoader 实例
let messageLoader: MessageLoader | null = null;

// 消息页面状态对象
const messageState: MessagePageState = {
  get contacts() {
    return contacts.value;
  },
  set contacts(v) {
    contacts.value = v;
  },
  get activeContactId() {
    return activeContactId.value;
  },
  set activeContactId(v) {
    activeContactId.value = v;
  },
  get currentUserId() {
    return currentUserId.value;
  },
  set currentUserId(v) {
    currentUserId.value = v;
  },
};

// 消息页面选项对象
const messageOptions: MessagePageOptions = {
  get contacts() {
    return contacts.value;
  },
  get activeContactId() {
    return { value: activeContactId.value };
  },
  get currentUserId() {
    return currentUserId.value;
  },
  rightChatAreaRef,
  router,
  notificationComponentRef,
  statusBarNotificationRef,
};

// 去重工具函数：合并联系人并去重
const mergeAndDeduplicateContacts = (
  existingContacts: Contact[],
  newContacts: Contact[],
): Contact[] => {
  const contactMap = new Map<string, Contact>();

  existingContacts.forEach((contact) => {
    const id = String(contact.id);
    contactMap.set(id, contact);
  });

  newContacts.forEach((contact) => {
    const id = String(contact.id);
    if (!contactMap.has(id)) {
      contactMap.set(id, contact);
    }
  });

  return Array.from(contactMap.values());
};

// 检查联系人是否为好友
const isFriend = (contactId: string): boolean => {
  return contacts.value.some(
    (c) => String(c.id) === contactId && !c.isGroup && c.isFriend === true,
  );
};

// 过滤临时会话：移除已经是好友的临时会话
const filterTemporaryContacts = (tempContacts: Contact[], friendIds: Set<string>): Contact[] => {
  return tempContacts.filter((tempContact) => {
    const tempId = String(tempContact.id);
    if (friendIds.has(tempId)) {
      return false;
    }
    return true;
  });
};

const createSelfContact = (): Contact => {
  return {
    id: String(userStore.user?.id || currentUserId.value || "current-user"),
    name: userStore.user?.nickname || userStore.user?.username || "当前用户",
    avatar:
      userStore.user?.avatar ||
      "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png",
    lastMessage: "",
    lastMessageTime: "",
    unreadCount: 0,
    isOnline: userStore.user?.status === 0,
    messages: [],
    isTop: false,
    isMuted: false,
    remark: "",
    isGroup: false,
    isFriend: false,
  };
};

// 刷新群聊列表
const refreshGroups = async () => {
  try {
    contacts.value = await refreshGroupsUtil(contacts.value, currentUserId.value, {
      fetchRecentMessages: false,
      loadHistory: true,
    });
  } catch (err) {
    message.error("刷新群聊失败");
  }
};

// 获取好友列表
const fetchFriendsList = async () => {
  return await fetchFriendsListUtil();
};

// 新建群后刷新列表
const handleGroupCreated = async () => {
  loading.value = true;
  await refreshGroups();
  if (contacts.value.length && !activeContactId.value) {
    activeContactId.value = String(contacts.value[contacts.value.length - 1].id);
  }
  loading.value = false;
};

// 优化：并行加载所有联系人数据
const loadAllContactsParallel = async (userStore: any) => {
  const selfContact = createSelfContact();

  const [friends, groups, tempContacts] = await Promise.all([
    fetchFriendsListUtil().catch(() => []),
    refreshGroupsUtil([selfContact], currentUserId.value, {
      fetchRecentMessages: false,
      loadHistory: true,
    }).catch(() => [selfContact]),
    getTemporaryContacts().catch(() => []),
  ]);

  const friendIds = new Set<string>();
  friends.forEach((friend) => {
    friendIds.add(String(friend.id));
  });

  let allContacts = [selfContact, ...friends];

  const groupContacts = groups.filter((contact) => contact.isGroup);
  allContacts = [...allContacts, ...groupContacts];

  if (tempContacts.length > 0) {
    const filteredTempContacts = filterTemporaryContacts(tempContacts, friendIds);

    if (filteredTempContacts.length > 0) {
      allContacts = mergeAndDeduplicateContacts(allContacts, filteredTempContacts);
    }
  }

  return allContacts;
};

// 初始化 MessageLoader（纯 WebSocket 驱动，无需轮询）
const initializeMessageLoader = () => {
  if (messageLoader) {
    messageLoader.destroy();
  }

  messageLoader = new MessageLoader(contacts.value, currentUserId.value);

  // 🔥 设置通知相关参数
  messageLoader.setNotificationOptions({
    notificationComponentRef,
    statusBarNotificationRef,
    router,
    activeContactId,
  });

  // 注册更新回调 - 当消息更新时自动刷新界面
  messageLoader.onUpdate((updatedContacts) => {
    contacts.value = updatedContacts;
  });
};

// 页面初始化
onMounted(async () => {
  try {
    // initializeAuth 内部已有缓存判断，如果 login 时已 fetchUserInfo 则直接复用
    await userStore.initializeAuth();
    // 仅在 initializeAuth 没有拉到用户信息时才显式拉取
    if (!userStore.user) {
      await userStore.fetchUserInfo();
    }
    currentUserId.value = String(userStore.user?.id || "current-user");

    // 请求系统通知权限
    const notificationType = localStorage.getItem("notificationType") as "native" | "desktop";
    const notificationEnabled = localStorage.getItem("notificationEnabled") !== "false";

    if (notificationEnabled && notificationType === "native" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    // 确保 WebSocket 已连接
    if (!websocketService.isConnected()) {
      try {
        await websocketService.connect();
      } catch (wsError) {
        message.warning("实时消息服务连接失败，将自动重试");
      }
    }

    // 提前注册好友在线状态监听（在联系人加载之前，避免丢失事件）
    websocketService.on("friend_status_changed", handleFriendStatusChanged);

    // 初始化信令监听器（通话功能）
    initializeSignalingListener();

    // 初始化联系人列表 - 使用优化后的并行加载
    loading.value = true;

    const allContacts = await loadAllContactsParallel(userStore);

    restoreContactStatesUtil(allContacts, currentUserId.value);

    await fetchAllRecentMessagesUtil(allContacts, currentUserId.value);

    contacts.value = allContacts;

    // 注册联系人到通话 Store，用于挂断时插入通话记录消息
    const callStore = useCallStore();
    callStore.registerContacts(() => contacts.value);

    // 初始化 MessageLoader（在 contacts 赋值之后）
    initializeMessageLoader();

    // 处理跳转过来的聊天对象
    const urlParams = new URLSearchParams(window.location.search);
    const urlContactId = urlParams.get("contactId");

    let pendingContactId = localStorage.getItem("pendingContactId");
    const pendingChatType = localStorage.getItem("pendingChatType");

    if (urlContactId) {
      pendingContactId = urlContactId;
      router.replace({ path: "/message" });
    }

    if (contacts.value.length) {
      let targetId = "";
      if (pendingContactId) {
        targetId =
          pendingChatType === "group"
            ? pendingContactId.startsWith("group_")
              ? pendingContactId
              : `group_${pendingContactId}`
            : pendingContactId;

        const target = contacts.value.find((c) => String(c.id) === targetId);
        activeContactId.value = target ? targetId : String(contacts.value[0].id);
        localStorage.removeItem("pendingContactId");
        localStorage.removeItem("pendingChatType");
      } else {
        activeContactId.value = String(contacts.value[0].id);
      }

      chatLoading.value = true;
      await getChatHistory(activeContactId.value, {
        currentUserId: currentUserId.value,
        contacts: contacts.value,
        activeContactId,
      });

      // 滚动到最新消息
      await scrollToLatestMessage();

      chatLoading.value = false;

      await new Promise((r) => setTimeout(r, 100));

      // 初始化消息监听（使用 MessageLoader 增强）
      initializeWebSocketMessageListener();

      await Promise.all([loadPendingGroupApplicationCount(), loadPendingFriendApplicationCount()]);
    }

    loading.value = false;

    // 检查版本更新
    checkVersionUpdate();
  } catch (error) {
    message.error("页面加载失败");
    loading.value = false;
  }
});

// 检查版本更新
const checkVersionUpdate = async () => {
  try {
    // 先通过组件内部的 checkVersionUpdate 获取数据
    if (updateReminderRef.value?.checkVersionUpdate) {
      const hasUpdate = await updateReminderRef.value.checkVersionUpdate();
      if (hasUpdate) {
        showUpdateReminder.value = true;
      }
    }
  } catch (err) {
    console.error("检查版本更新失败:", err);
  }
};

// 滚动到最新消息的优化函数
const scrollToLatestMessage = async (retryCount = 0) => {
  if (retryCount > 5) return;

  await nextTick();

  if (rightChatAreaRef.value?.scrollToBottom) {
    rightChatAreaRef.value.scrollToBottom();
  } else {
    setTimeout(() => scrollToLatestMessage(retryCount + 1), 100);
  }
};

// 组件卸载
onUnmounted(async () => {
  websocketService.off("private_message", handleRealtimeMessage);
  websocketService.off("group_message", handleRealtimeMessage);
  websocketService.off("message_recalled", handleRecallMessage);
  websocketService.off("message_deleted", handleDeleteMessageFromWs);
  websocketService.off("messages_deleted", handleBatchDeleteMessagesFromWs);
  websocketService.off("group_member_level_updated", handleGroupMemberLevelUpdate);
  websocketService.off("group_member_title_updated", handleGroupMemberTitleUpdate);
  websocketService.off("friend_status_changed", handleFriendStatusChanged);

  // 销毁 MessageLoader
  if (messageLoader) {
    messageLoader.destroy();
    messageLoader = null;
  }

  // 断开通话信令连接
  try {
    const { getSignalingService } = await import("../untils/signalingService");
    const service = getSignalingService();
    if (service) {
      service.disconnect();
    }
  } catch (e) {
    // 静默处理
  }
});

// ==================== WebSocket 消息处理 ====================

// 处理实时消息（使用 MessageLoader 增强）
const handleRealtimeMessage = (data: any) => {
  const msg = data.message || data;

  // 🔥 修复：检测群邀请消息类型（groupId 可能为 null）
  const isGroupInviteType =
    msg.messageType &&
    ["group_invite_pending", "group_invite_accepted", "group_invite_rejected"].includes(
      msg.messageType,
    );

  // 🔥 修复：群邀请消息的 groupId 从 content 中提取
  let effectiveGroupId = msg.groupId;
  if (isGroupInviteType && !effectiveGroupId) {
    try {
      const contentData = typeof msg.content === "string" ? JSON.parse(msg.content) : msg.content;
      if (contentData?.groupId) {
        effectiveGroupId = contentData.groupId;
      }
    } catch {}
  }

  const type = effectiveGroupId ? "group" : "private";

  // 优先使用 MessageLoader 处理
  if (messageLoader) {
    messageLoader.handleRealtimeMessage(data, type);
  } else {
    // 降级方案：使用原有逻辑
    handleRealtimeMessageUtil(data, type, {
      contacts: contacts.value,
      currentUserId: currentUserId.value,
      activeContactId: activeContactId.value,
      rightChatAreaRef: rightChatAreaRef.value,
      nextTick,
      notificationComponentRef,
      statusBarNotificationRef,
    });
  }

  // 🔥 修复：收到群邀请消息（已直接加入群）时，自动刷新联系人列表
  if (msg.messageType === "group_invite_accepted") {
    // 延迟刷新确保后端数据已更新
    setTimeout(() => {
      handleRefreshContacts();
    }, 500);
  }

  // 收到新消息时，如果当前正在查看该联系人，自动滚动到底部
  const msgData = data.message || data;
  const senderId = String(msgData.senderId);
  const isGroup = !!effectiveGroupId;
  let contactId: string;
  if (isGroup) {
    const groupId = String(effectiveGroupId);
    contactId = groupId.startsWith("group_") ? groupId : `group_${groupId}`;
  } else {
    contactId = senderId === currentUserId.value ? String(msgData.receiverId) : senderId;
  }

  if (activeContactId.value === contactId) {
    nextTick(() => {
      rightChatAreaRef.value?.scrollToBottom();
    });
  }
};

// 处理消息撤回
const handleRecallMessage = (data: any) => {
  handleRecallMessageUtil(data, messageState);
};

// 处理群邀请实时通知（通过 WebSocket 接收）
const handleGroupInvitationReceived = (data: any) => {
  console.log("[WS] 收到群邀请通知:", data);
  // 将邀请通知作为实时消息处理
  const msgData = {
    message: {
      id: data.id,
      content: data.content,
      senderId: data.senderId,
      receiverId: data.receiverId,
      groupId: data.groupId,
      messageType: data.messageType || "group_invite_pending",
      status: data.status,
      createdAt: data.createdAt,
      sender: data.sender,
      group: data.group,
    },
  };
  handleRealtimeMessage(msgData);
};

// 处理邀请被接受通知
const handleInvitationAccepted = (data: any) => {
  console.log("[WS] 邀请已被接受:", data);
  // 刷新联系人列表以获取新的群成员
  setTimeout(() => {
    handleRefreshContacts();
  }, 500);
};

// 处理邀请被拒绝通知
const handleInvitationRejected = (data: any) => {
  console.log("[WS] 邀请已被拒绝:", data);
};

// 处理消息删除
const handleDeleteMessageFromWs = (data: any) => {
  handleDeleteMessageFromWsUtil(data, messageState);
};

// 处理批量消息删除
const handleBatchDeleteMessagesFromWs = (data: any) => {
  handleBatchDeleteMessagesFromWsUtil(data, messageState);
};

// 处理群成员等级更新
const handleGroupMemberLevelUpdate = (data: any) => {
  handleGroupMemberLevelUpdateUtil(data, messageState, activeContactId.value);
};

// 处理群成员头衔更新
const handleGroupMemberTitleUpdate = (data: any) => {
  handleGroupMemberTitleUpdateUtil(data, messageState, activeContactId.value);
};

// 处理好友在线状态变化
const handleFriendStatusChanged = (data: any) => {
  const { userId, status } = data;
  const isOnline = status === 0;

  // 更新联系人列表中的在线状态
  const index = contacts.value.findIndex((c) => String(c.id) === String(userId));
  if (index !== -1) {
    contacts.value[index] = {
      ...contacts.value[index],
      isOnline,
    };
  }

  // 如果当前活跃联系人就是该好友，同步更新其在线状态
  if (activeContactId.value === String(userId) && rightChatAreaRef.value) {
    rightChatAreaRef.value.updateContactOnlineStatus?.(isOnline);
  }
};

// 初始化 WebSocket 消息监听
const initializeWebSocketMessageListener = () => {
  websocketService.on("private_message", handleRealtimeMessage);
  websocketService.on("group_message", handleRealtimeMessage);
  websocketService.on("message_recalled", handleRecallMessage);
  websocketService.on("message_deleted", handleDeleteMessageFromWs);
  websocketService.on("messages_deleted", handleBatchDeleteMessagesFromWs);
  websocketService.on("group_member_level_updated", handleGroupMemberLevelUpdate);
  websocketService.on("group_member_title_updated", handleGroupMemberTitleUpdate);
  // 群邀请实时通知
  websocketService.on("new_group_invitation", handleGroupInvitationReceived);
  websocketService.on("invitation_accepted", handleInvitationAccepted);
  websocketService.on("invitation_rejected", handleInvitationRejected);
};

// ==================== 联系人操作封装 ====================

// 联系人选择
const handleContactSelect = async (contactId: string) => {
  activeContactId.value = contactId;
  chatLoading.value = true;

  // 通知 MessageLoader 当前活跃联系人变更
  if (messageLoader) {
    messageLoader.setActiveContactId(contactId);
  }

  await markMessagesAsRead(contactId, contacts.value);

  await getChatHistory(activeContactId.value, {
    currentUserId: currentUserId.value,
    contacts: contacts.value,
    activeContactId,
  });

  // 选择联系人后滚动到最新消息
  await scrollToLatestMessage();

  chatLoading.value = false;
};

// 关闭联系人抽屉
const closeContactDrawer = () => {
  if (rightChatAreaRef.value) {
    rightChatAreaRef.value.closeContactDrawer && rightChatAreaRef.value.closeContactDrawer();
  }
};

// 更新联系人
const handleUpdateContact = async (contact: Contact) => {
  const index = contacts.value.findIndex((c) => String(c.id) === String(contact.id));
  if (index !== -1) {
    contacts.value[index] = { ...contacts.value[index], ...contact };
  }
};

// 刷新联系人列表（使用 MessageLoader 同步）
const handleRefreshContacts = async () => {
  loading.value = true;

  try {
    const [friends, groups, tempContacts] = await Promise.all([
      fetchFriendsListUtil().catch(() => []),
      refreshGroupsUtil([], currentUserId.value, {
        fetchRecentMessages: false,
        loadHistory: true,
      }).catch(() => []),
      getTemporaryContacts().catch(() => []),
    ]);

    const selfContact = createSelfContact();

    const friendIds = new Set<string>();
    friends.forEach((friend) => {
      friendIds.add(String(friend.id));
    });

    let mergedContacts = [selfContact, ...friends, ...groups];

    if (tempContacts.length > 0) {
      const filteredTempContacts = tempContacts.filter((tempContact) => {
        const tempId = String(tempContact.id);
        if (friendIds.has(tempId)) {
          return false;
        }
        return true;
      });

      if (filteredTempContacts.length > 0) {
        mergedContacts = mergeAndDeduplicateContacts(mergedContacts, filteredTempContacts);
      }
    }

    // 保证"当前用户"联系人不被刷新替换时丢失
    mergedContacts = mergeAndDeduplicateContacts([selfContact], mergedContacts);

    restoreContactStatesUtil(mergedContacts, currentUserId.value);

    await fetchAllRecentMessagesUtil(mergedContacts, currentUserId.value);

    contacts.value = mergedContacts;

    // 同步更新 MessageLoader
    if (messageLoader) {
      messageLoader.setContacts(mergedContacts);
    }
  } catch (error) {
    message.error("刷新联系人失败");
  } finally {
    loading.value = false;
  }
};

// 加载待处理群聊申请数量
const loadPendingGroupApplicationCount = async () => {
  try {
    const response: any = await request.get("/group/applications/pending-count");

    pendingGroupApplicationCount.value = response.data?.count || 0;
  } catch (error) {
    // 静默失败
  }
};

// 监听 contacts 数组变化
watch(
  () => contacts.value,
  (newContacts, oldContacts) => {
    // 仅用于响应式更新，不输出日志
  },
  { deep: true },
);

// 加载待处理好友申请数量
const loadPendingFriendApplicationCount = async () => {
  try {
    const response: any = await request.get("/friends/applications/pending-count");

    pendingFriendApplicationCount.value = response.data?.count || 0;
  } catch (error) {
    // 静默失败
  }
};

// ==================== 聊天操作封装 ====================

// 发送消息
const handleSendMessageWrapper = async (data: any) => {
  let contactId, userInfo;

  if (typeof data === "object" && data.userId) {
    contactId = data.userId;
    userInfo = data.userInfo;
  } else {
    contactId = data;
  }

  const sendOptions = {
    currentUserId: currentUserId.value,
    contacts: contacts.value,
    activeContactId: activeContactId,
    rightChatAreaRef: rightChatAreaRef.value,
  };

  const existingContact = contacts.value.find((c) => String(c.id) === String(contactId));

  // 无论联系人是否存在，都切换到该联系人
  activeContactId.value = String(contactId);

  if (!existingContact) {
    if (!userInfo) {
      try {
        const tempChatResult = await prepareTemporaryChat(contactId);
        userInfo = {
          id: tempChatResult.id,
          name: tempChatResult.name,
          avatar: tempChatResult.avatar,
          username: tempChatResult.username,
          isOnline: tempChatResult.isOnline,
        };
      } catch (error) {
        // 静默处理
      }
    }
  }

  if (!existingContact && userInfo) {
    const newContact: Contact = {
      id: String(userInfo.id),
      name: userInfo.name,
      avatar: userInfo.avatar,
      lastMessage: "",
      lastMessageTime: "",
      unreadCount: 0,
      isOnline: userInfo.isOnline,
      messages: [],
      remark: "",
      isTop: false,
      isMuted: false,
      isGroup: false,
      username: userInfo.username,
    };

    contacts.value.push(newContact);
  }

  await handleSendMessage(
    contactId,
    "",
    sendOptions,
    { user: { id: currentUserId.value } },
    "text",
    undefined,
    undefined,
    undefined,
    undefined,
  );

  if (userInfo && !existingContact) {
    await handleRefreshContacts();
  }

  // 发送消息后滚动到底部
  await scrollToLatestMessage();
};

// 编辑备注
const handleEditRemarkWrapper = async (contactId: string | number, remark: string) => {
  await handleEditRemark(contactId, remark, contacts.value);
};
// 清空聊天
const handleClearChatWrapper = async (contactId: string | number) => {
  // 清除聊天历史分页缓存
  invalidateChatHistoryCache(contacts.value, contactId);
  closeContactDrawer();
};

// 切换置顶
const handleToggleTopWrapper = async (contactId: string | number, isTop: boolean) => {
  const toggleOptions = {
    currentUserId: currentUserId.value,
    contacts: contacts.value,
    activeContactId: activeContactId,
  };
  await handleToggleTop(contactId, isTop, toggleOptions);
  closeContactDrawer();
};

// 切换免打扰
const handleToggleMuteWrapper = async (contactId: string | number, isMuted: boolean) => {
  const toggleOptions = {
    currentUserId: currentUserId.value,
    contacts: contacts.value,
    activeContactId: activeContactId,
  };
  await handleToggleMute(contactId, isMuted, toggleOptions);
  closeContactDrawer();
};

// 删除好友
const handleDeleteFriendWrapper = async (contactId: string | number) => {
  closeContactDrawer();
  await handleRefreshContacts();
};

// 退出群聊
const handleQuitGroupWrapper = async (groupId: string) => {
  closeContactDrawer();
  if (activeContactId.value === groupId) {
    activeContactId.value = "";
  }
  await handleRefreshContacts();
};

// 解散群聊
const handleDissolveGroupWrapper = async (groupId: string) => {
  closeContactDrawer();
  if (activeContactId.value === groupId) {
    activeContactId.value = "";
  }
  await handleRefreshContacts();
};

// 删除临时会话
const handleDeleteTemporaryContactWrapper = async (contactId: string | number) => {
  closeContactDrawer();
  if (activeContactId.value === String(contactId)) {
    activeContactId.value = "";
  }
  await handleRefreshContacts();
};

// 更新群规
const handleUpdateGroupRuleWrapper = async (groupId: string | number, rule: string) => {
  await handleUpdateGroupRule(groupId, rule, contacts.value);
};

// ==========================================
// 信令服务（通话）
// ==========================================

/**
 * 初始化信令监听
 */
const initializeSignalingListener = async () => {
  try {
    const { getSignalingService, addGlobalSignalingListener } =
      await import("../untils/signalingService");
    const userStore = useUserStore();
    const service = getSignalingService();

    // 确保获取到有效的用户ID
    const userId = String(userStore.user?.id || currentUserId.value);
    if (userId && userId !== "current-user") {
      await service.connect(userId);

      addGlobalSignalingListener((msg) => {
        switch (msg.type) {
          case "call_offer":
            handlePrivateCallOffer({
              callerId: msg.from,
              callType: msg.callType || "audio",
              callerName: msg.callerName,
              callerAvatar: msg.callerAvatar,
              sdp: msg.data?.signal,
            });
            break;
          case "end_call":
            // 处理通话结束
            const callStore = useCallStore();
            if (callStore.isCalling || callStore.isInCall) {
              const userId = String(userStore.user?.id || "");
              const contactId = String(msg.from || "");
              const callType = (callStore.callType || "audio") as "audio" | "video";

              // 如果还在振铃阶段收到 end_call，说明对方取消了/拒绝了
              if (callStore.isCalling && !callStore.isInCall) {
                // 判断：如果我是呼叫方，对方拒绝；如果我是接收方，对方取消
                const isCaller = callStore.callerId === userId;
                const status = isCaller ? "rejected" : "cancelled";

                // ★ 给用户提示
                const reason = msg.data?.reason || "";
                if (isCaller && reason === "declined") {
                  message.warning("对方拒绝了通话");
                } else if (isCaller) {
                  message.info("对方取消了通话");
                }

                const callMsg = createCallMessage(userId, contactId, callType, status, 0, true, {
                  nickname: userStore.user?.nickname,
                  username: userStore.user?.username,
                  avatar: userStore.user?.avatar,
                  id: userId,
                });
                insertCallMessageToContact(contacts.value, contactId, callMsg);
                // ★ 发送通话记录到服务器
                sendCallRecordToServer(contactId, callType, status, 0);
              } else if (callStore.isInCall) {
                // 通话中对方挂断，插入通话结束记录
                message.info("对方已挂断通话");
                const duration = callStore.callDuration;
                const callMsg = createCallMessage(
                  userId,
                  contactId,
                  callType,
                  "ended",
                  duration,
                  true,
                  {
                    nickname: userStore.user?.nickname,
                    username: userStore.user?.username,
                    avatar: userStore.user?.avatar,
                    id: userId,
                  },
                );
                insertCallMessageToContact(contacts.value, contactId, callMsg);
                // ★ 发送通话记录到服务器
                sendCallRecordToServer(contactId, callType, "ended", duration);
              }
              callStore.endCall(true); // skipCallRecord=true，避免重复插入
            }
            break;
        }
      });
    }
  } catch (error) {
    // 静默处理
  }
};

/**
 * 处理私聊通话邀请
 */
const handlePrivateCallOffer = (data: any) => {
  const targetId = String(data.callerId);
  const user = contacts.value.find((c) => String(c.id) === targetId);

  // 通知全局来电组件显示弹窗（每次通话都显示）
  if ((window as any).globalCallNotificationRef) {
    (window as any).globalCallNotificationRef.handleCallInvite({
      ...data,
      avatar: user?.avatar || data.callerAvatar || data.avatar || "",
      callerName:
        user?.remark || user?.name || data.callerName || data.callerDisplayName || "未知联系人",
      isGroup: false,
    });
  }

  // 如果确实找不到联系人，给一个提示
  if (!user) {
    message.warning("收到未知用户的通话邀请");
  }
};
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.qq-chat-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.qq-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.message-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.chat-main-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>
