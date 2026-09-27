/**
 * 消息页面管理器 - 优化版
 * 核心功能：所有联系人收到新消息时立即更新最近一条消息，无需切换界面
 */

import type { Contact } from "../types/chatTypes";
import type {
  ComponentContact,
  MessagePageOptions,
  MessagePageState,
} from "../types/untilsTypes";
import {
  getTopStatusFromLocalStorage,
  getMuteStatusFromLocalStorage,
  sortContacts,
  formatMessageContent,
  updateContactLastMessage,
  invalidateChatHistoryCache,
  getMessageTimestamp,
  shouldReplaceContactSummary,
} from "./contactManager";
import request from "./request";
import { message } from "ant-design-vue";
import { GROUP_INVITE_TYPES } from "../types/constants";
import { ref } from "vue";
import { useNotificationStore } from "../stores/notification";

// ==========================================
// 数据转换工具
// ==========================================

export const getChatPartnerMyGroupNickname = (chatPartner: any): string => {
  if (!chatPartner) return "";
  const raw =
    chatPartner.myGroupNickname ?? chatPartner.dataValues?.myGroupNickname;
  return typeof raw === "string" && raw.trim() ? raw.trim() : "";
};

export const convertToComponentContact = (
  contact: Contact,
): ComponentContact => ({
  id: String(contact.id),
  name: contact.name,
  avatar: contact.avatar,
  lastMessage: contact.lastMessage,
  lastMessageTime: contact.lastMessageTime,
  lastMessageAt: contact.lastMessageAt,
  unreadCount: contact.unreadCount,
  isOnline: contact.isOnline,
  remark: contact.remark,
  isTop: contact.isTop,
  isMuted: contact.isMuted,
  isGroup: contact.isGroup,
  groupNumber: contact.groupNumber,
  groupOwnerId: contact.groupOwnerId,
  messages: contact.messages,
  myGroupNickname: contact.myGroupNickname,
});

// ==========================================
// 联系人状态管理
// ==========================================

export const restoreContactStates = (
  contacts: Contact[],
  currentUserId: string,
) => {
  try {
    const top = JSON.parse(localStorage.getItem("contactTopStatus") || "{}");
    const mute = JSON.parse(localStorage.getItem("contactMuteStatus") || "{}");
    contacts.forEach((c) => {
      c.isTop = top[c.id] ?? false;
      c.isMuted = mute[c.id] ?? false;
    });
    sortContacts(contacts, currentUserId);
  } catch (err) {
    // 静默失败
  }
};

export const triggerContactsUpdate = (contacts: Contact[]) => {
  return [...contacts];
};

export const triggerContactUpdate = (
  contacts: Contact[],
  contactId: string,
) => {
  const contactIndex = contacts.findIndex((c) => c.id === contactId);
  if (contactIndex !== -1) {
    contacts[contactIndex] = { ...contacts[contactIndex] };
  }
  return triggerContactsUpdate(contacts);
};

// ==========================================
// 群聊数据加载
// ==========================================

export const refreshGroups = async (
  contacts: Contact[],
  currentUserId: string,
  options?: {
    fetchRecentMessages?: boolean;
    loadHistory?: boolean;
  },
): Promise<Contact[]> => {
  const userStore = await import("../stores/user").then((m) =>
    m.useUserStore(),
  );
  const { getChatHistory } = await import("./contactManager");

  const { fetchRecentMessages = true, loadHistory = true } = options || {};

  try {
    const baseContacts = contacts.filter((contact) => !contact.isGroup);

    const { data } = await request.get("/group");
    const groups = data.groups || [];
    const newGroups: Contact[] = [];

    const groupDetailPromises = groups.map((group: any) =>
      request
        .get(`/group/${group.id}`)
        .then(({ data: groupData }) => ({ group, groupData }))
        .catch(() => null),
    );
    const groupDetails = (await Promise.all(groupDetailPromises)).filter(
      Boolean,
    ) as { group: any; groupData: any }[];

    for (const { group, groupData } of groupDetails) {
      const groupId = `group_${group.id}`;
      const currentMember = groupData.members?.find(
        (m: any) => String(m.id) === String(userStore.user?.id),
      );

      const unreadCount = groupData.unreadCount ?? group.unreadCount ?? 0;

      const groupContact: Contact = {
        id: groupId,
        name: group.name,
        avatar: group.avatar,
        lastMessage: "",
        lastMessageTime: "",
        unreadCount,
        isOnline: false,
        messages: [],
        remark: groupData.remark || "",
        isTop: false,
        isMuted: false,
        isGroup: true,
        role: group.role,
        groupNumber: group.groupNumber,
        groupRule: group.rule,
        groupOwnerId: groupData.owner ? String(groupData.owner.id) : "",
        owner: groupData.owner,
        admin: groupData.admin || [],
        memberCount: groupData.memberCount || 0,
        allowMemberInvite: groupData.allowMemberInvite ?? true,
        groupMembers:
          groupData.members?.map((m: any) => ({
            id: String(m.id),
            name: m.name,
            avatar: m.avatar,
            role: m.role,
            joinTime: m.joinTime,
            nickname: m.nickname || null,
            tags: m.tags || [],
            chatLevel: m.chatLevel || 1,
            messageCount: m.messageCount || 0,
            groupTitle: m.groupTitle || null,
          })) || [],
        joinMessages: [],
        myGroupNickname: currentMember?.nickname || "",
        myGroupTags: currentMember?.tags || [],
        tags: groupData.tags || [],
      };

      if (!newGroups.some((g) => g.id === groupId))
        newGroups.push(groupContact);
    }

    const updatedContacts = [...baseContacts, ...newGroups];
    const recentApplied = typeof document !== "undefined" && !document.hidden;
    if (recentApplied && fetchRecentMessages) {
      await fetchAllRecentMessages(updatedContacts, currentUserId);
    }

    if (loadHistory) {
      const historyPromises = newGroups.map(async (groupContact) => {
        try {
          // 🔥 修复：即使 lastMessage 为空，也尝试加载历史（首次加载时 lastMessage 可能为空）
          // 只有当明确确认没有历史消息时才跳过
          if (recentApplied && groupContact.chatHistoryPagination?.total === 0 && !groupContact.chatHistoryPagination?.hasNextPage) {
            groupContact.joinMessages = [];
            return;
          }

          const historyResult = await getChatHistory(
            groupContact.id,
            {
              currentUserId: String(userStore.user?.id),
              contacts: updatedContacts,
              activeContactId: ref(String(groupContact.id)),
            },
            1,
            50,
          );

          groupContact.messages = (historyResult.messages ||
            []) as Contact["messages"];
          const joinMsgs = extractJoinMessages(groupContact.messages || []);
          groupContact.joinMessages = joinMsgs;
        } catch (err) {
          // 静默失败
        }
      });

      await Promise.all(historyPromises);
    }

    return updatedContacts;
  } catch (err) {
    message.error("刷新群聊失败");
    return contacts;
  }
};

export const extractJoinMessages = (messages: any[]) => {
  return messages
    .filter((msg: any) => {
      try {
        if (msg.messageType === "group_notification") {
          const content = JSON.parse(msg.content);
          return content.type === "group_notification" && content.joinedUser;
        }
        return false;
      } catch {
        return false;
      }
    })
    .map((msg: any) => {
      try {
        const content = JSON.parse(msg.content);
        return {
          userId: String(content.joinedUser.id),
          userName:
            content.joinedUser.nickname ||
            content.joinedUser.username ||
            "用户",
          time: msg.time || content.timestamp || new Date().toISOString(),
        };
      } catch {
        return null;
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => getMessageTimestamp(a.time) - getMessageTimestamp(b.time));
};

// ==========================================
// 好友数据加载
// ==========================================

export const fetchFriendsList = async (): Promise<Contact[]> => {
  const { getFriends } = await import("./friendManager");
  const userStore = await import("../stores/user").then((m) =>
    m.useUserStore(),
  );

  try {
    const friendsData = await getFriends("accepted");
    const friendContacts: Contact[] = [];

    for (const friend of friendsData) {
      if (String(friend.friendUser?.id) === String(userStore.user?.id))
        continue;

      const friendContact: Contact = {
        id: String(friend.friendUser?.id || friend.friendId || friend.id || ""),
        name:
          friend.friendUser?.nickname ||
          friend.friendUser?.username ||
          "未知用户",
        avatar:
          friend.friendUser?.avatar ||
          "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png",
        lastMessage: "",
        lastMessageTime: "",
        unreadCount: friend.unreadCount || 0,
        isOnline: (friend.friendUser?.status || 0) === 0,
        messages: [],
        remark: friend.remark || "",
        isTop: false,
        isMuted: false,
        isGroup: false,
        isFriend: true,
        username: friend.friendUser?.username || "",
        onlineVisibility: friend.friendUser?.onlineVisibility ?? 0,
        status: friend.friendUser?.status,
      };

      if (friendContact.id) friendContacts.push(friendContact);
    }
    return friendContacts;
  } catch (err) {
    message.error("获取好友列表失败");
    return [];
  }
};

// ==========================================
// 消息加载器
// ==========================================

export class MessageLoader {
  private contacts: Contact[] = [];
  private currentUserId: string = "";
  private updateCallbacks: ((contacts: Contact[]) => void)[] = [];
  private refreshDebounceTimer: number | null = null;
  private visibilityHandler: (() => void) | null = null;
  private notificationComponentRef: any = null;
  private statusBarNotificationRef: any = null;
  private router: any = null;
  private activeContactId: { value: string } = { value: "" };

  constructor(contacts: Contact[], currentUserId: string) {
    this.contacts = contacts;
    this.currentUserId = currentUserId;
    this.setupVisibilityChangeListener();
  }

  /** 🔥 设置通知相关参数 */
  setNotificationOptions(options: {
    notificationComponentRef?: any;
    statusBarNotificationRef?: any;
    router?: any;
    activeContactId?: { value: string };
  }) {
    if (options.notificationComponentRef) this.notificationComponentRef = options.notificationComponentRef;
    if (options.statusBarNotificationRef) this.statusBarNotificationRef = options.statusBarNotificationRef;
    if (options.router) this.router = options.router;
    if (options.activeContactId) this.activeContactId = options.activeContactId;
  }

  onUpdate(callback: (contacts: Contact[]) => void) {
    this.updateCallbacks.push(callback);
  }

  private notifyUpdate() {
    const updatedContacts = [...this.contacts];
    this.updateCallbacks.forEach((cb) => {
      try {
        cb(updatedContacts);
      } catch (err) {
        console.error("更新回调执行失败:", err);
      }
    });
  }

  private setupVisibilityChangeListener() {
    if (typeof document === "undefined") return;

    this.visibilityHandler = () => {
      if (!document.hidden) {
        console.log("[MessageLoader] 页面变为可见，同步最新消息");
        if (this.refreshDebounceTimer) {
          clearTimeout(this.refreshDebounceTimer);
        }
        this.refreshDebounceTimer = window.setTimeout(() => {
          this.syncAllRecentMessages();
          this.refreshDebounceTimer = null;
        }, 300);
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);
  }

  private async syncAllRecentMessages(): Promise<void> {
    try {
      const { data } = await request.get("/message/latest");
      // 🔥 兼容后端返回的多种格式
      let messages = data.recentMessages || data.messages || [];
      if (messages && typeof messages === "object" && !Array.isArray(messages) && Array.isArray(messages.messages)) {
        messages = messages.messages;
      }
      if (!Array.isArray(messages) || messages.length === 0) return;

      const msgMap = new Map<string, any>();
      messages.forEach((m: any) => {
        const key = m.groupId
          ? String(m.groupId).startsWith("group_")
            ? String(m.groupId)
            : `group_${m.groupId}`
          : [String(m.senderId), String(m.receiverId)].sort().join("_");

        const existing = msgMap.get(key);
        if (
          !existing ||
          getMessageTimestamp(m.createdAt) > getMessageTimestamp(existing.createdAt)
        ) {
          msgMap.set(key, m);
        }
      });

      let hasUpdates = false;
      const topMap = getTopStatusFromLocalStorage();
      const muteMap = getMuteStatusFromLocalStorage();

      for (const contact of this.contacts) {
        contact.isTop = topMap.get(String(contact.id)) || false;
        contact.isMuted = muteMap.get(String(contact.id)) || false;

        const lookupKey = contact.isGroup
          ? contact.id
          : [String(contact.id), this.currentUserId].sort().join("_");

        const latest = msgMap.get(lookupKey);
        if (latest) {
          const shouldReplaceSummary = shouldReplaceContactSummary(
            contact,
            latest.createdAt,
          );
          let enhancedSender = latest.sender;
          if (
            contact.isGroup &&
            latest.sender &&
            contact.groupMembers?.length
          ) {
            const member = contact.groupMembers.find(
              (m: any) => String(m.id) === String(latest.senderId),
            );
            if (member?.nickname) {
              enhancedSender = {
                ...latest.sender,
                groupNickname: member.nickname,
              };
            }
          }

          const newLastMessage = formatMessageContent(
            latest.messageType,
            latest.content,
            contact.isGroup,
            enhancedSender,
            latest.isRecalled || false,
            this.currentUserId,
            latest.senderId,
          );

          if (
            shouldReplaceSummary &&
            (contact.lastMessage !== newLastMessage ||
              contact.lastMessageTime !== latest.time ||
              contact.lastMessageAt !== latest.createdAt)
          ) {
            hasUpdates = true;
          }

          if (shouldReplaceSummary) {
            contact.lastMessage = newLastMessage;
            contact.lastMessageTime = latest.time;
            contact.lastMessageAt = latest.createdAt;
          }

          if (latest.unreadCount !== undefined) {
            contact.unreadCount = latest.unreadCount;
          }

          if (contact.isGroup && latest.sender) {
            contact.lastMessageSender = {
              nickname:
                enhancedSender?.groupNickname ||
                enhancedSender?.nickname ||
                "未知用户",
              id: String(latest.senderId),
            };
          }
        }
      }

      if (hasUpdates) {
        sortContacts(this.contacts, this.currentUserId);
        this.notifyUpdate();
        console.log("[MessageLoader] 页面恢复可见，已同步最新消息");
      }
    } catch (error) {
      console.error("[MessageLoader] 同步最新消息失败:", error);
    }
  }

  /**
   * 处理 WebSocket 实时消息 - 核心修复
   */
  handleRealtimeMessage(data: any, type: "private" | "group"): Contact[] {
    try {
      const msg = data.message || data;
      const senderId = String(msg.senderId);
      const isMe = senderId === this.currentUserId;

      // 判断是否为群邀请类型
      const isGroupInviteType = msg.messageType && [
        GROUP_INVITE_TYPES.PENDING,
        GROUP_INVITE_TYPES.ACCEPTED,
        GROUP_INVITE_TYPES.REJECTED,
      ].includes(msg.messageType);

      const isGroup = !!msg.groupId || isGroupInviteType;

      // 解析群信息（群邀请时从 content 中提取）
      let groupInfo: { groupId: string; groupName: string; groupAvatar: string; tags: any[] } | null = null;

      if (isGroupInviteType && !msg.groupId) {
        try {
          const contentData = typeof msg.content === "string" ? JSON.parse(msg.content) : msg.content;
          if (contentData?.groupId) {
            groupInfo = {
              groupId: String(contentData.groupId),
              groupName: contentData.groupName || "未知群聊",
              groupAvatar: contentData.groupAvatar || "",
              tags: contentData.tags || [],
            };
          }
        } catch (err) {
          console.warn("解析群邀请内容失败:", err);
        }
      }

      // ==========================================
      // 1. 确定联系人ID
      // ==========================================
      let contactId: string;

      if (isGroup) {
        if (groupInfo?.groupId) {
          const gid = groupInfo.groupId;
          contactId = gid.startsWith("group_") ? gid : `group_${gid}`;
        } else if (msg.groupId) {
          const gid = String(msg.groupId);
          contactId = gid.startsWith("group_") ? gid : `group_${gid}`;
        } else {
          contactId = isMe ? String(msg.receiverId) : senderId;
        }
      } else {
        contactId = isMe ? String(msg.receiverId) : senderId;
      }

      // ==========================================
      // 2. 查找或创建联系人
      // ==========================================
      let contactIndex = this.contacts.findIndex((c) => c.id === contactId);
      let contact = contactIndex !== -1 ? this.contacts[contactIndex] : undefined;

      // 如果没有找到联系人，创建新联系人
      if (!contact) {
        if (isGroup) {
          // 创建群聊联系人
          const groupName = groupInfo?.groupName || msg.groupName || "未知群聊";
          const groupAvatar = groupInfo?.groupAvatar || msg.groupAvatar || "";

          contact = {
            id: contactId,
            name: groupName,
            avatar: groupAvatar,
            lastMessage: "",
            lastMessageTime: "",
            unreadCount: 0,
            isOnline: false,
            messages: [],
            remark: "",
            isTop: false,
            isMuted: false,
            isGroup: true,
            groupMembers: [],
            joinMessages: [],
            tags: groupInfo?.tags || [],
          };
          this.contacts.push(contact);
          contactIndex = this.contacts.length - 1;
          console.log("[MessageLoader] 创建新群聊联系人:", contactId, groupName);
        } else {
          // 创建私聊联系人
          const sender = msg.sender || {};
          contact = {
            id: contactId,
            name: sender.nickname || sender.username || "未知用户",
            avatar: sender.avatar || "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png",
            lastMessage: "",
            lastMessageTime: "",
            unreadCount: 0,
            isOnline: false,
            messages: [],
            remark: "",
            isTop: false,
            isMuted: false,
            isGroup: false,
            username: sender.username || "",
          };
          this.contacts.push(contact);
          contactIndex = this.contacts.length - 1;
          console.log("[MessageLoader] 创建新私聊联系人:", contactId);
        }
      }

      // 如果还是没有联系人，返回
      if (!contact) {
        return this.contacts;
      }

      // ==========================================
      // 3. 更新联系人信息
      // ==========================================

      // 使缓存失效
      invalidateChatHistoryCache(this.contacts, contactId);

      // 如果是群邀请，更新群名称和头像
      if (groupInfo) {
        contact.name = groupInfo.groupName;
        contact.avatar = groupInfo.groupAvatar;
        contact.tags = groupInfo.tags || [];
      }

      // 增强发送者信息
      let enhancedSender = msg.sender;
      if (isGroup && contact.groupMembers) {
        const member = contact.groupMembers.find(
          (m: any) => String(m.id) === String(msg.senderId),
        );
        if (member?.nickname) {
          enhancedSender = { ...msg.sender, groupNickname: member.nickname };
        }
      }

      // 更新最后一条消息
      const newLastMessage = formatMessageContent(
        msg.messageType || "text",
        msg.content,
        isGroup,
        enhancedSender,
        msg.isRecalled || false,
        this.currentUserId,
        msg.senderId,
      );

      contact.lastMessage = newLastMessage;
      contact.lastMessageTime = msg.time;
      contact.lastMessageAt = msg.createdAt || msg.time;

      // 更新未读数（不是自己发送的）
      if (!isMe) {
        const activeId = this.getActiveContactId();
        if (activeId !== contactId) {
          contact.unreadCount = (contact.unreadCount || 0) + 1;
        }
      }

      // 更新群昵称
      if (isGroup) {
        const nickname = getChatPartnerMyGroupNickname(msg.chatPartner);
        if (nickname) {
          contact.myGroupNickname = nickname;
        }
        if (enhancedSender) {
          contact.lastMessageSender = {
            nickname:
              enhancedSender.groupNickname ||
              enhancedSender.nickname ||
              "未知用户",
            id: senderId,
          };
        }
      }

      // ==========================================
      // 4. 添加消息到列表（去重）
      // ==========================================

      if (!Array.isArray(contact.messages)) {
        contact.messages = [];
      }

      const newMsg = {
        id: msg.id || `${Date.now()}_${Math.random()}`,
        content: msg.content,
        time: msg.time,
        createdAt: msg.createdAt || msg.time,
        _timestamp: msg.createdAt
          ? new Date(msg.createdAt).getTime()
          : Date.now(),
        avatar: enhancedSender?.avatar || "",
        isMe: isMe,
        senderId: senderId,
        senderName:
          enhancedSender?.groupNickname ||
          enhancedSender?.nickname ||
          enhancedSender?.username ||
          "未知用户",
        sender: enhancedSender,
        messageType: msg.messageType || "text",
        isRecalled: msg.isRecalled || false,
        recalledAt: msg.recalledAt || null,
        recalledContent: msg.recalledContent || null,
        // 群邀请相关
        groupId: isGroup ? contactId : undefined,
        receiverId: msg.receiverId,
        // 通话消息字段
        callType: msg.callType,
        callStatus: msg.callStatus,
        callDuration: msg.callDuration,
      };

      // 检查是否已存在（去重）
      const exists = contact.messages.some((m: any) => {
        if (m.id && newMsg.id && String(m.id) === String(newMsg.id)) {
          return true;
        }
        if (
          typeof m.id === "string" &&
          m.id.startsWith("temp_") &&
          m.isMe &&
          newMsg.isMe &&
          m.content === newMsg.content &&
          m.messageType === newMsg.messageType
        ) {
          return true;
        }
        if (
          m.isMe &&
          newMsg.isMe &&
          m.messageType === newMsg.messageType &&
          m._timestamp &&
          newMsg._timestamp &&
          Math.abs(m._timestamp - newMsg._timestamp) < 3000
        ) {
          return true;
        }
        return false;
      });

      if (!exists) {
        contact.messages.push(newMsg);
        contact.messages.sort((a: any, b: any) => {
          const timeA = typeof a._timestamp === "number" && a._timestamp > 0
            ? a._timestamp
            : getMessageTimestamp(a.createdAt || a.time);
          const timeB = typeof b._timestamp === "number" && b._timestamp > 0
            ? b._timestamp
            : getMessageTimestamp(b.createdAt || b.time);
          return timeA - timeB;
        });
        console.log("[MessageLoader] 添加新消息:", contactId, msg.messageType);
      }

      // ==========================================
      // 5. 处理入群通知
      // ==========================================

      if (msg.messageType === "group_notification") {
        try {
          const content = typeof msg.content === "string" ? JSON.parse(msg.content) : msg.content;
          if (content.type === "group_notification" && content.joinedUser) {
            if (!contact.joinMessages) {
              contact.joinMessages = [];
            }
            const joinMessage = {
              userId: String(content.joinedUser.id),
              userName:
                content.joinedUser.nickname ||
                content.joinedUser.username ||
                "用户",
              time: msg.time || new Date().toISOString(),
            };
            const existsJoin = contact.joinMessages.some(
              (jm) =>
                jm.userId === joinMessage.userId &&
                Math.abs(
                  getMessageTimestamp(jm.time) -
                  getMessageTimestamp(joinMessage.time),
                ) < 1000,
            );
            if (!existsJoin) {
              contact.joinMessages.push(joinMessage);
              contact.joinMessages.sort(
                (a, b) => getMessageTimestamp(a.time) - getMessageTimestamp(b.time),
              );
            }
          }
        } catch (err) {
          // 静默失败
        }
      }

      // ==========================================
      // 6. 替换联系人对象（触发响应式更新）
      // ==========================================

      if (contactIndex !== -1) {
        this.contacts[contactIndex] = { ...contact };
      }

      // 重新排序
      sortContacts(this.contacts, this.currentUserId);

      // 强制更新整个数组（触发 Vue 响应式）
      const newContactsArray = [...this.contacts];
      this.contacts.splice(0, this.contacts.length, ...newContactsArray);

      // 通知更新
      this.notifyUpdate();

      // ==========================================
      // 7. 🔥 消息通知（声音、弹窗、状态栏、桌面通知、标题闪烁）
      // ==========================================
      if (!isMe) {
        this.handleNotifications(msg, contact, contactId);
      }

      console.log("[MessageLoader] 联系人已更新:", {
        contactId,
        messageType: msg.messageType,
        isMe,
        messageCount: contact.messages.length,
        contactsCount: this.contacts.length,
      });

      return this.contacts;
    } catch (err) {
      console.error("[MessageLoader] 处理实时消息失败:", err);
      return this.contacts;
    }
  }

  private getActiveContactId(): string {
    return this.activeContactId?.value || "";
  }

  /**
   * 🔥 统一的消息通知处理
   * 根据 notificationMode 配置决定通知方式
   */
  private handleNotifications(msg: any, contact: Contact, contactId: string) {
    try {
      const notificationEnabled = localStorage.getItem("notificationEnabled") !== "false";
      if (!notificationEnabled) return;

      const notificationMode = localStorage.getItem("notificationMode") || "sound-and-system";
      if (notificationMode === "dnd") return; // 免打扰模式

      const notificationStore = useNotificationStore();
      const isActiveContact = this.getActiveContactId() === contactId;
      const isDocumentHidden = typeof document !== "undefined" && document.hidden;

      // 构建通知选项
      const options: MessagePageOptions = {
        contacts: this.contacts,
        activeContactId: this.activeContactId,
        currentUserId: this.currentUserId,
        router: this.router,
        notificationComponentRef: this.notificationComponentRef,
        statusBarNotificationRef: this.statusBarNotificationRef,
      };

      // 1. 声音提醒（除 statusbar-only 和 desktop-only 外都播放）
      if (!["statusbar-only", "desktop-only"].includes(notificationMode)) {
        notificationStore.playMessageSound();
      }

      // 2. 应用内弹窗通知
      if (["system-only", "sound-and-system"].includes(notificationMode)) {
        notificationStore.showCustomNotification(msg, contact, options);
      }

      // 3. 状态栏通知
      if (["statusbar-only", "sound-and-statusbar"].includes(notificationMode)) {
        notificationStore.showStatusBarNotification(msg, contact, options);
      }

      // 4. 桌面通知
      if (["desktop-only", "sound-and-desktop"].includes(notificationMode)) {
        notificationStore.showDesktopNotification(msg, contact, options);
      }

      // 5. 标题闪烁（仅当页面不在前台且不是当前活跃联系人时）
      if (!isActiveContact && isDocumentHidden) {
        notificationStore.startTitleFlash();
      }
    } catch (err) {
      console.error("[MessageLoader] 通知处理失败:", err);
    }
  }

  setActiveContactId(contactId: string) {
    const contact = this.contacts.find((c) => c.id === contactId);
    if (contact && contact.unreadCount && contact.unreadCount > 0) {
      contact.unreadCount = 0;
      this.notifyUpdate();
    }
  }

  getContacts(): Contact[] {
    return this.contacts;
  }

  setContacts(contacts: Contact[]) {
    this.contacts = contacts;
    this.notifyUpdate();
  }

  destroy() {
    if (this.refreshDebounceTimer) {
      clearTimeout(this.refreshDebounceTimer);
      this.refreshDebounceTimer = null;
    }
    if (this.visibilityHandler && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.updateCallbacks = [];
  }
}

// ==========================================
// 加载最近消息
// ==========================================

export const fetchAllRecentMessages = async (
  contacts: Contact[],
  currentUserId: string,
  options?: {
    forceRefresh?: boolean;
    onUpdate?: (contacts: Contact[]) => void;
  },
): Promise<Contact[]> => {
  const { forceRefresh = false, onUpdate } = options || {};

  if (typeof document !== "undefined" && document.hidden && !forceRefresh) {
    return contacts;
  }

  try {
    const { data } = await request.get("/message/latest");
    // 🔥 兼容后端返回的多种格式：
    // 1. { recentMessages: [...] } - 直接是数组
    // 2. { recentMessages: { messages: [...] } } - 嵌套对象
    // 3. { messages: [...] } - 另一种格式
    let messages = data.recentMessages || data.messages || [];
    // 🔥 如果 recentMessages 是对象（包含 messages 属性），提取 messages 数组
    if (messages && typeof messages === "object" && !Array.isArray(messages) && Array.isArray(messages.messages)) {
      messages = messages.messages;
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return contacts;
    }

    const topMap = getTopStatusFromLocalStorage();
    const muteMap = getMuteStatusFromLocalStorage();
    const msgMap = new Map<string, any>();

    messages.forEach((m: any) => {
      const key = m.groupId
        ? String(m.groupId).startsWith("group_")
          ? String(m.groupId)
          : `group_${m.groupId}`
        : [String(m.senderId), String(m.receiverId)].sort().join("_");

      const existing = msgMap.get(key);
      if (
        !existing ||
        getMessageTimestamp(m.createdAt) > getMessageTimestamp(existing.createdAt)
      ) {
        msgMap.set(key, m);
      }
    });

    let hasUpdates = false;

    for (const contact of contacts) {
      contact.isTop = topMap.get(String(contact.id)) || false;
      contact.isMuted = muteMap.get(String(contact.id)) || false;

      const lookupKey = contact.isGroup
        ? contact.id
        : [String(contact.id), currentUserId].sort().join("_");

      const latest = msgMap.get(lookupKey);

      if (latest) {
        const shouldReplaceSummary = shouldReplaceContactSummary(
          contact,
          latest.createdAt,
        );
        let enhancedSender = latest.sender;
        if (contact.isGroup && latest.sender && contact.groupMembers?.length) {
          const member = contact.groupMembers.find(
            (m: any) => String(m.id) === String(latest.senderId),
          );
          if (member?.nickname) {
            enhancedSender = {
              ...latest.sender,
              groupNickname: member.nickname,
            };
          }
        }

        const newLastMessage = formatMessageContent(
          latest.messageType,
          latest.content,
          contact.isGroup,
          enhancedSender,
          latest.isRecalled || false,
          currentUserId,
          latest.senderId,
        );

        if (
          contact.lastMessage !== newLastMessage ||
          contact.lastMessageTime !== latest.time
        ) {
          hasUpdates = true;
        }

        contact.lastMessage = newLastMessage;
        contact.lastMessageTime = latest.time;

        if (latest.unreadCount !== undefined) {
          contact.unreadCount = latest.unreadCount;
        }

        if (contact.isGroup) {
          const nickname = getChatPartnerMyGroupNickname(latest.chatPartner);
          if (nickname) {
            contact.myGroupNickname = nickname;
          }
          if (latest.sender) {
            contact.lastMessageSender = {
              nickname:
                enhancedSender?.groupNickname ||
                enhancedSender?.nickname ||
                "未知用户",
              id: String(latest.senderId),
            };
          }
        }
      }
    }

    if (hasUpdates) {
      sortContacts(contacts, currentUserId);
      if (onUpdate) {
        onUpdate([...contacts]);
      }
    }

    return contacts;
  } catch (error) {
    console.error("加载最近消息失败:", error);
    return contacts;
  }
};

// ==========================================
// WebSocket 消息处理入口
// ==========================================

export interface HandleRealtimeMessageOptions {
  contacts: Contact[];
  currentUserId: string;
  activeContactId: string;
  rightChatAreaRef?: any;
  nextTick?: (fn: () => void) => void;
  notificationComponentRef?: any;
  statusBarNotificationRef?: any;
  router?: any;
  messageLoader?: MessageLoader;
}

/**
 * 处理实时消息 - 统一入口
 */
export const handleRealtimeMessage = (
  data: any,
  type: "private" | "group",
  options: HandleRealtimeMessageOptions,
) => {
  // 优先使用 MessageLoader
  if (options.messageLoader) {
    return options.messageLoader.handleRealtimeMessage(data, type);
  }

  // 降级处理
  return handleRealtimeMessageLegacy(data, type, options);
};

/**
 * 降级处理函数（兼容旧逻辑）
 */
const handleRealtimeMessageLegacy = (
  data: any,
  type: "private" | "group",
  options: HandleRealtimeMessageOptions,
) => {
  const {
    contacts,
    currentUserId,
    activeContactId,
    rightChatAreaRef,
    nextTick,
    notificationComponentRef,
    statusBarNotificationRef,
    router,
  } = options;

  try {
    const msg = data.message || data;
    const senderId = String(msg.senderId);
    const isMe = senderId === currentUserId;

    const isGroupInviteType = msg.messageType && [
      GROUP_INVITE_TYPES.PENDING,
      GROUP_INVITE_TYPES.ACCEPTED,
      GROUP_INVITE_TYPES.REJECTED,
    ].includes(msg.messageType);

    const isGroup = !!msg.groupId || isGroupInviteType;

    // 解析群信息
    let groupInfo: { groupId: string; groupName: string; groupAvatar: string; tags: any[] } | null = null;

    if (isGroupInviteType && !msg.groupId) {
      try {
        const contentData = typeof msg.content === "string" ? JSON.parse(msg.content) : msg.content;
        if (contentData?.groupId) {
          groupInfo = {
            groupId: String(contentData.groupId),
            groupName: contentData.groupName || "未知群聊",
            groupAvatar: contentData.groupAvatar || "",
            tags: contentData.tags || [],
          };
        }
      } catch (err) {
        console.warn("解析群邀请内容失败:", err);
      }
    }

    // 确定联系人ID
    let contactId: string;

    if (isGroup) {
      if (groupInfo?.groupId) {
        const gid = groupInfo.groupId;
        contactId = gid.startsWith("group_") ? gid : `group_${gid}`;
      } else if (msg.groupId) {
        const gid = String(msg.groupId);
        contactId = gid.startsWith("group_") ? gid : `group_${gid}`;
      } else {
        contactId = isMe ? String(msg.receiverId) : senderId;
      }
    } else {
      contactId = isMe ? String(msg.receiverId) : senderId;
    }

    // 查找或创建联系人
    let contactIndex = contacts.findIndex((c) => c.id === contactId);
    let contact = contactIndex !== -1 ? contacts[contactIndex] : undefined;

    if (!contact) {
      if (isGroup) {
        const groupName = groupInfo?.groupName || msg.groupName || "未知群聊";
        const groupAvatar = groupInfo?.groupAvatar || msg.groupAvatar || "";

        contact = {
          id: contactId,
          name: groupName,
          avatar: groupAvatar,
          lastMessage: "",
          lastMessageTime: "",
          unreadCount: 0,
          isOnline: false,
          messages: [],
          remark: "",
          isTop: false,
          isMuted: false,
          isGroup: true,
          groupMembers: [],
          joinMessages: [],
          tags: groupInfo?.tags || [],
        };
        contacts.push(contact);
        contactIndex = contacts.length - 1;
      } else {
        const sender = msg.sender || {};
        contact = {
          id: contactId,
          name: sender.nickname || sender.username || "未知用户",
          avatar: sender.avatar || "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png",
          lastMessage: "",
          lastMessageTime: "",
          unreadCount: 0,
          isOnline: false,
          messages: [],
          remark: "",
          isTop: false,
          isMuted: false,
          isGroup: false,
          username: sender.username || "",
        };
        contacts.push(contact);
        contactIndex = contacts.length - 1;
      }
    }

    if (!contact) {
      return contacts;
    }

    // 更新联系人信息
    invalidateChatHistoryCache(contacts, contactId);

    if (groupInfo) {
      contact.name = groupInfo.groupName;
      contact.avatar = groupInfo.groupAvatar;
      contact.tags = groupInfo.tags || [];
    }

    // 增强发送者
    let enhancedSender = msg.sender;
    if (isGroup && contact.groupMembers) {
      const member = contact.groupMembers.find(
        (m: any) => String(m.id) === String(msg.senderId),
      );
      if (member?.nickname) {
        enhancedSender = { ...msg.sender, groupNickname: member.nickname };
      }
    }

    // 更新最后消息
    const newLastMessage = formatMessageContent(
      msg.messageType || "text",
      msg.content,
      isGroup,
      enhancedSender,
      msg.isRecalled || false,
      currentUserId,
      msg.senderId,
    );

    contact.lastMessage = newLastMessage;
    contact.lastMessageTime = msg.time;
    contact.lastMessageAt = msg.createdAt || msg.time;

    if (!isMe) {
      if (activeContactId !== contactId) {
        contact.unreadCount = (contact.unreadCount || 0) + 1;
      }
    }

    if (isGroup) {
      const nickname = getChatPartnerMyGroupNickname(msg.chatPartner);
      if (nickname) {
        contact.myGroupNickname = nickname;
      }
      if (enhancedSender) {
        contact.lastMessageSender = {
          nickname: enhancedSender.groupNickname || enhancedSender.nickname || "未知用户",
          id: senderId,
        };
      }
    }

    // 添加消息
    if (!Array.isArray(contact.messages)) {
      contact.messages = [];
    }

    const newMsg = {
      id: msg.id || `${Date.now()}_${Math.random()}`,
      content: msg.content,
      time: msg.time,
      createdAt: msg.createdAt || msg.time,
      _timestamp: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),
      avatar: enhancedSender?.avatar || "",
      isMe: isMe,
      senderId: senderId,
      senderName: enhancedSender?.groupNickname || enhancedSender?.nickname || enhancedSender?.username || "未知用户",
      sender: enhancedSender,
      messageType: msg.messageType || "text",
      isRecalled: msg.isRecalled || false,
      recalledAt: msg.recalledAt || null,
      recalledContent: msg.recalledContent || null,
      groupId: isGroup ? contactId : undefined,
      receiverId: msg.receiverId,
      // 通话消息字段
      callType: msg.callType,
      callStatus: msg.callStatus,
      callDuration: msg.callDuration,
    };

    const exists = contact.messages.some((m: any) => {
      if (m.id && newMsg.id && String(m.id) === String(newMsg.id)) return true;
      if (typeof m.id === "string" && m.id.startsWith("temp_") && m.isMe && newMsg.isMe &&
        m.content === newMsg.content && m.messageType === newMsg.messageType) return true;
      if (m.isMe && newMsg.isMe && m.messageType === newMsg.messageType &&
        m._timestamp && newMsg._timestamp && Math.abs(m._timestamp - newMsg._timestamp) < 3000) return true;
      return false;
    });

    if (!exists) {
      contact.messages.push(newMsg);
      contact.messages.sort((a: any, b: any) => {
        const timeA = typeof a._timestamp === "number" && a._timestamp > 0
          ? a._timestamp
          : getMessageTimestamp(a.createdAt || a.time);
        const timeB = typeof b._timestamp === "number" && b._timestamp > 0
          ? b._timestamp
          : getMessageTimestamp(b.createdAt || b.time);
        return timeA - timeB;
      });
    }

    // 更新联系人
    if (contactIndex !== -1) {
      contacts[contactIndex] = { ...contact };
    }

    // 重新排序
    sortContacts(contacts, currentUserId);

    // 强制更新响应式
    const newContactsArray = [...contacts];
    contacts.splice(0, contacts.length, ...newContactsArray);

    // 滚动到底部
    if (activeContactId === contactId && rightChatAreaRef?.value?.scrollToBottom && nextTick) {
      nextTick(() => {
        rightChatAreaRef.value.scrollToBottom();
      });
    }

    // 通知
    if (!isMe && localStorage.getItem("notificationEnabled") !== "false") {
      const notificationStore = useNotificationStore();
      if (localStorage.getItem("notificationMode") !== "dnd") {
        notificationStore.playMessageSound();
      }
      if (activeContactId !== contactId) {
        if (typeof document !== "undefined" && document.hidden) {
          notificationStore.startTitleFlash();
        }
      }
    }

    console.log("[handleRealtimeMessage] 消息处理完成:", {
      contactId,
      messageType: msg.messageType,
      isMe,
      contactsCount: contacts.length,
    });

    return contacts;
  } catch (err) {
    console.error("处理实时消息失败", err);
    return options.contacts;
  }
};

// ==========================================
// 撤回消息处理
// ==========================================

export const handleRecallMessage = (data: any, state: MessagePageState) => {
  try {
    const { messageId, groupId, receiverId, senderId, time } = data;
    const isGroup = !!groupId;
    const cid = isGroup
      ? `group_${groupId}`
      : String(senderId) === state.currentUserId
        ? String(receiverId)
        : String(senderId);
    const c = state.contacts.find((x) => x.id === cid);
    if (!c) return;

    const idx = c.messages.findIndex((x) => x.id === messageId);
    if (idx !== -1) {
      const m = c.messages[idx];
      if (!m.recalledContent && m.content) m.recalledContent = m.content;
      m.content = "";
      m.isRecalled = true;
      m.recalledAt = time || new Date().toISOString();
      c.messages = [...c.messages];
    }

    updateContactLastMessageAfterRecall(c, state.currentUserId);
    state.contacts.splice(0, state.contacts.length, ...state.contacts);
  } catch { }
};

const updateContactLastMessageAfterRecall = (c: Contact, uid: string) => {
  if (!c.messages?.length) {
    c.lastMessage = "暂无消息";
    c.lastMessageTime = "";
    return;
  }
  let last = null;
  for (let i = c.messages.length - 1; i >= 0; i--) {
    if (!c.messages[i].isRecalled) {
      last = c.messages[i];
      break;
    }
  }
  if (last) {
    c.lastMessage = formatMessageContent(
      last.messageType || "text",
      last.content,
      c.isGroup,
      last.sender,
      false,
      uid,
      last.senderId,
    );
    c.lastMessageTime = last.time;
  } else {
    c.lastMessage = "暂无消息";
    c.lastMessageTime = "";
  }
};

// ==========================================
// 其他工具函数
// ==========================================

export const prepareTemporaryChat = async (userId: number | string) => {
  const userStore = await import("../stores/user").then((m) =>
    m.useUserStore(),
  );
  const { checkFriendship } = await import("./friendManager");

  try {
    const userResponse = await request.get(`/users/${userId}`);
    const userInfo = userResponse.data;

    const isFriend = await checkFriendship(Number(userId));

    if (!isFriend) {
      const { createOrUpdateTemporaryContactAPI } =
        await import("./contactManager");
      const success = await createOrUpdateTemporaryContactAPI(
        String(userId),
        userInfo.nickname || userInfo.username || "未知用户",
        userInfo.avatar ||
        "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png",
        userInfo.username || "",
      );

      if (!success) {
        throw new Error("创建临时会话失败");
      }
    }

    return {
      id: Number(userId),
      name: userInfo.nickname || userInfo.username || "未知用户",
      avatar:
        userInfo.avatar ||
        "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png",
      username: userInfo.username,
      isOnline: userInfo.status === 0,
      isFriend,
      userInfo,
    };
  } catch (error: any) {
    throw error;
  }
};

export const handleDeleteMessageFromWs = (
  data: any,
  state: MessagePageState,
) => {
  try {
    const { messageId, groupId, receiverId, senderId } = data;
    const isGroup = !!groupId;
    const cid = isGroup
      ? `group_${groupId}`
      : String(senderId) === state.currentUserId
        ? String(receiverId)
        : String(senderId);
    const c = state.contacts.find((x) => x.id === cid);
    if (!c) return;
    const idx = c.messages.findIndex((x) => x.id === messageId);
    if (idx === -1) return;
    c.messages.splice(idx, 1);

    if (c.messages.length) {
      const last = c.messages.at(-1)!;
      const text = formatMessageContent(
        last.messageType || "text",
        last.content,
        c.isGroup,
        last.sender,
        last.isRecalled,
        state.currentUserId,
        last.senderId,
      );
      updateContactLastMessage(
        state.contacts,
        cid,
        text,
        last.time || new Date().toISOString(),
      );
    } else {
      updateContactLastMessage(state.contacts, cid, "", "");
    }
    state.contacts.splice(0, state.contacts.length, ...state.contacts);
  } catch { }
};

export const handleBatchDeleteMessagesFromWs = (
  data: any,
  state: MessagePageState,
) => {
  try {
    const { messageIds, groupId } = data;
    if (!messageIds?.length) return;
    const cid = `group_${groupId}`;
    const c = state.contacts.find((x) => x.id === cid);
    if (!c) return;
    const set = new Set(messageIds.map(String));
    c.messages = c.messages.filter((x) => !set.has(String(x.id)));

    if (c.messages.length) {
      const last = c.messages.at(-1)!;
      const text = formatMessageContent(
        last.messageType || "text",
        last.content,
        c.isGroup,
        last.sender,
        last.isRecalled,
        state.currentUserId,
        last.senderId,
      );
      updateContactLastMessage(
        state.contacts,
        cid,
        text,
        last.time || new Date().toISOString(),
      );
    } else {
      updateContactLastMessage(state.contacts, cid, "", "");
    }
    state.contacts.splice(0, state.contacts.length, ...state.contacts);
  } catch { }
};

export const handleGroupMemberLevelUpdate = (
  data: any,
  state: MessagePageState,
  active: string,
) => {
  try {
    const { userId, groupId, chatLevel, messageCount } = data;
    const cid = `group_${groupId}`;
    const c = state.contacts.find((x) => x.id === cid);
    if (!c?.isGroup || !c.groupMembers) return;
    const idx = c.groupMembers.findIndex(
      (x) => String(x.id) === String(userId),
    );
    if (idx === -1) return;
    c.groupMembers[idx].chatLevel = chatLevel;
    if (messageCount !== undefined) {
      c.groupMembers[idx].messageCount = messageCount;
    }
    c.groupMembers = [...c.groupMembers];
    state.contacts.splice(0, state.contacts.length, ...state.contacts);
  } catch { }
};

export const handleGroupMemberTitleUpdate = (
  data: any,
  state: MessagePageState,
  active: string,
) => {
  try {
    const { userId, groupId, groupTitle, useDefaultTitle } = data;
    const cid = `group_${groupId}`;
    const c = state.contacts.find((x) => x.id === cid);
    if (!c?.isGroup || !c.groupMembers) return;
    const idx = c.groupMembers.findIndex(
      (x) => String(x.id) === String(userId),
    );
    if (idx === -1) return;
    c.groupMembers[idx].groupTitle = groupTitle;
    c.groupMembers[idx].useDefaultTitle = useDefaultTitle ?? false;
    c.groupMembers = [...c.groupMembers];
    state.contacts.splice(0, state.contacts.length, ...state.contacts);
  } catch { }
};

export const fetchGroupDetails = async (gid: string, contacts: Contact[]) => {
  try {
    const { data } = await request.get(`/group/${gid.replace("group_", "")}`);
    const c = contacts.find((x) => x.id === gid);
    if (!c?.isGroup) return;
    c.owner = data.owner;
    c.admin = data.admin || [];
    c.groupOwnerId = data.owner ? String(data.owner.id) : "";
    c.groupRule = data.rule;
    c.groupMembers =
      data.members?.map((m: any) => ({
        id: String(m.id),
        userId: String(m.id),
        name: m.name,
        avatar: m.avatar,
        role: m.role,
        joinTime: m.joinTime,
        nickname: m.nickname,
        tags: m.tags || [],
        chatLevel: m.chatLevel || 1,
        messageCount: m.messageCount || 0,
        groupTitle: m.groupTitle,
        useDefaultTitle: m.useDefaultTitle ?? false,
      })) || [];
  } catch { }
};