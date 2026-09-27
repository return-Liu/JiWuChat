import { message, Modal } from "ant-design-vue";
import request from "./request";
import type { Ref } from "vue";
import type { Contact } from "../types/chatTypes";
import { getSystemMessagePreview } from "./systemMessageUtils";
import { GROUP_INVITE_TYPES } from "../types/constants";
import { useNotificationStore } from "../stores/notification";

// ==================== 接口定义 ====================
interface SendMessageOptions {
  currentUserId: string;
  contacts: Contact[];
  activeContactId: Ref<string>;
  rightChatAreaRef?: any;
}

interface ChatHistoryOptions {
  currentUserId: string;
  contacts: Contact[];
  activeContactId: Ref<string>;
  forceFetch?: boolean;
}

// ==================== 缓存优化：统一初始化 + 懒加载 ====================

let topStatusCache: Map<string, boolean> | null = null;
let muteStatusCache: Map<string, boolean> | null = null;
let topStatusRaw: Record<string, boolean> = {};
let muteStatusRaw: Record<string, boolean> = {};

const initCache = (
  key: string,
  cacheRef: Map<string, boolean> | null,
  rawRef: Record<string, boolean>,
): Map<string, boolean> => {
  if (cacheRef) return cacheRef;
  try {
    const data = JSON.parse(localStorage.getItem(key) || "{}");
    Object.assign(rawRef, data);
    return new Map(Object.entries(data));
  } catch {
    return new Map();
  }
};

export const getTopStatusFromLocalStorage = (): Map<string, boolean> => {
  if (!topStatusCache) {
    topStatusCache = initCache(
      "contactTopStatus",
      topStatusCache,
      topStatusRaw,
    );
  }
  return topStatusCache;
};

export const getMuteStatusFromLocalStorage = (): Map<string, boolean> => {
  if (!muteStatusCache) {
    muteStatusCache = initCache(
      "contactMuteStatus",
      muteStatusCache,
      muteStatusRaw,
    );
  }
  return muteStatusCache;
};

// ==================== 撤回文案 ====================

export const PRESET_RECALL_TEXTS = [
  {
    self: "你撤回了一条消息，正在重新编辑。",
    others: "对方撤回了一条消息，正在重新编辑。",
    tag: "默认",
  },
  {
    self: "你撤回了一条消息，手滑失误。",
    others: "对方撤回了一条消息，手滑失误。",
    tag: "手滑",
  },
  {
    self: "你撤回了一条消息，避免尴尬。",
    others: "对方撤回了一条消息，避免尴尬。",
    tag: "社死",
  },
  {
    self: "你撤回了一条消息，调皮一下。",
    others: "对方撤回了一条消息，调皮一下。",
    tag: "俏皮",
  },
  {
    self: "你撤回了一条消息，保持神秘。",
    others: "对方撤回了一条消息，保持神秘。",
    tag: "神秘",
  },
  {
    self: "你撤回了一条消息，气场冷淡。",
    others: "对方撤回了一条消息，气场冷淡。",
    tag: "高冷",
  },
  {
    self: "你撤回了一条消息，可爱收回。",
    others: "对方撤回了一条消息，可爱收回。",
    tag: "可爱",
  },
  {
    self: "你撤回了一条消息，假装无事发生。",
    others: "对方撤回了一条消息，假装无事发生。",
    tag: "淡定",
  },
  {
    self: "你撤回了一条消息，送上美好祝愿。",
    others: "对方撤回了一条消息，送上美好祝愿。",
    tag: "节日",
  },
  {
    self: "你撤回了一条消息，温柔收回话语。",
    others: "对方撤回了一条消息，温柔收回话语。",
    tag: "温暖",
  },
  {
    self: "你撤回了一条消息，内容已销毁。",
    others: "对方撤回了一条消息，内容已销毁。",
    tag: "霸气",
  },
  {
    self: "你撤回了一条消息，本条消息作废。",
    others: "对方撤回了一条消息，本条消息作废。",
    tag: "干脆",
  },
  {
    self: "你撤回了一条消息，暂时不想多说。",
    others: "对方撤回了一条消息，暂时不想多说。",
    tag: "内敛",
  },
  {
    self: "你撤回了一条消息，收回此刻情绪。",
    others: "对方撤回了一条消息，收回此刻情绪。",
    tag: "文艺",
  },
  {
    self: "你撤回了一条消息，网络出现波动。",
    others: "对方撤回了一条消息，网络出现波动。",
    tag: "借口",
  },
  {
    self: "你撤回了一条消息，留待下次发送。",
    others: "对方撤回了一条消息，留待下次发送。",
    tag: "保留",
  },
  {
    self: "你撤回了一条消息，只想安静片刻。",
    others: "对方撤回了一条消息，只想安静片刻。",
    tag: "佛系",
  },
  {
    self: "你撤回了一条消息，内容过于真实。",
    others: "对方撤回了一条消息，内容过于真实。",
    tag: "真实",
  },
  {
    self: "你撤回了一条消息，悄悄收回内容。",
    others: "对方撤回了一条消息，悄悄收回内容。",
    tag: "害羞",
  },
  {
    self: "你撤回了一条消息，保持温柔姿态。",
    others: "对方撤回了一条消息，保持温柔姿态。",
    tag: "清新",
  },
  {
    self: "你撤回了一条消息，假装十分淡定。",
    others: "对方撤回了一条消息，假装十分淡定。",
    tag: "戏精",
  },
  {
    self: "你撤回了一条消息，从此独自释怀。",
    others: "对方撤回了一条消息，从此独自释怀。",
    tag: "伤感",
  },
  {
    self: "你撤回了一条消息，活动专属内容。",
    others: "对方撤回了一条消息，活动专属内容。",
    tag: "活动",
  },
  {
    self: "你撤回了一条消息，内容已加密处理。",
    others: "对方撤回了一条消息，内容已加密处理。",
    tag: "隐秘",
  },
  {
    self: "你撤回了一条消息，一切随缘就好。",
    others: "对方撤回了一条消息，一切随缘就好。",
    tag: "佛系",
  },
  {
    self: "你撤回了一条消息，撤回所有烦恼。",
    others: "对方撤回了一条消息，撤回所有烦恼。",
    tag: "治愈",
  },
  {
    self: "你撤回了一条消息，不过轻描淡写。",
    others: "对方撤回了一条消息，不过轻描淡写。",
    tag: "淡然",
  },
  {
    self: "你撤回了一条消息，匆匆收回话语。",
    others: "对方撤回了一条消息，匆匆收回话语。",
    tag: "匆忙",
  },
  {
    self: "你撤回了一条消息，轻松带过此刻。",
    others: "对方撤回了一条消息，轻松带过此刻。",
    tag: "轻松",
  },
  {
    self: "你撤回了一条消息，祝自己平安顺遂。",
    others: "对方撤回了一条消息，祝平安顺遂。",
    tag: "祝愿",
  },
];

export const getCustomRecallText = (): { self?: string; others?: string } => {
  try {
    const saved = localStorage.getItem("customRecallText");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const saveCustomRecallText = (self: string, others: string): void => {
  try {
    localStorage.setItem("customRecallText", JSON.stringify({ self, others }));
  } catch {
    // ignore error
  }
};

export const loadPresetRecallTexts = () => PRESET_RECALL_TEXTS;

// ==================== 保存状态 ====================

const saveStatusToStorage = (
  contactId: string,
  value: boolean,
  cache: Map<string, boolean>,
  raw: Record<string, boolean>,
  key: string,
) => {
  try {
    cache.set(contactId, value);
    raw[contactId] = value;
    localStorage.setItem(key, JSON.stringify(raw));
  } catch {
    // ignore error
  }
};

export const saveTopStatusToLocalStorage = (
  contactId: string,
  isTop: boolean,
) => {
  const cache = getTopStatusFromLocalStorage();
  saveStatusToStorage(
    contactId,
    isTop,
    cache,
    topStatusRaw,
    "contactTopStatus",
  );
};

export const saveMuteStatusToLocalStorage = (
  contactId: string,
  isMuted: boolean,
) => {
  const cache = getMuteStatusFromLocalStorage();
  saveStatusToStorage(
    contactId,
    isMuted,
    cache,
    muteStatusRaw,
    "contactMuteStatus",
  );
};

export const initContactTopAndMuteStatus = (contacts: Contact[]) => {
  const topMap = getTopStatusFromLocalStorage();
  const muteMap = getMuteStatusFromLocalStorage();
  for (let i = 0, len = contacts.length; i < len; i++) {
    const contact = contacts[i];
    const cid = String(contact.id);
    contact.isTop = !!topMap.get(cid);
    contact.isMuted = !!muteMap.get(cid);
  }
};

// ==================== 临时会话持久化管理 ====================

export const saveTemporaryContact = (contact: Contact) => {
  // 不再使用本地存储，通过后端接口管理
};

export const restoreTemporaryContacts = (contacts: Contact[]): Contact[] => {
  return contacts;
};

export const removeTemporaryContact = (contactId: string) => {
  // 不再使用本地存储，通过后端接口管理
};

// ==================== 原始顺序管理器（增强版） ====================

class OriginalOrderManager {
  private orderMap: Map<string, number> = new Map();
  private version: number = 0;

  setOrder(contactId: string, order: number) {
    this.orderMap.set(contactId, order);
    this.version++;
  }

  getOrder(contactId: string): number {
    return this.orderMap.get(contactId) ?? 0;
  }

  getMap(): Map<string, number> {
    return new Map(this.orderMap);
  }

  getVersion(): number {
    return this.version;
  }

  clear() {
    this.orderMap.clear();
    this.version++;
  }

  // 批量初始化
  initFromContacts(contacts: Contact[]) {
    if (this.orderMap.size === 0) {
      for (let i = 0, len = contacts.length; i < len; i++) {
        this.orderMap.set(String(contacts[i].id), i);
      }
      this.version++;
    }
  }

  // 更新单个联系人顺序
  updateOrder(contactId: string, order: number) {
    this.orderMap.set(contactId, order);
    this.version++;
  }

  // 重新计算所有顺序
  reindex(contacts: Contact[]) {
    this.orderMap.clear();
    for (let i = 0, len = contacts.length; i < len; i++) {
      this.orderMap.set(String(contacts[i].id), i);
    }
    this.version++;
  }
}

export const globalOriginalOrderManager = new OriginalOrderManager();

// ==================== 时间工具 ====================

const parseMessageTimeString = (timeStr?: string | Date | null): number => {
  if (!timeStr) return 0;
  if (timeStr instanceof Date) return timeStr.getTime();

  const trimmed = String(timeStr).trim();
  if (!trimmed) return 0;

  const todayMatch = trimmed.match(/^今天\s*(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (todayMatch) {
    const hours = parseInt(todayMatch[1], 10);
    const minutes = parseInt(todayMatch[2], 10);
    const seconds = parseInt(todayMatch[3] || "0", 10);
    const date = new Date();
    date.setHours(hours, minutes, seconds, 0);
    return date.getTime();
  }

  const dateTimeMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (dateTimeMatch) {
    const month = parseInt(dateTimeMatch[1], 10) - 1;
    const day = parseInt(dateTimeMatch[2], 10);
    const hours = parseInt(dateTimeMatch[3], 10);
    const minutes = parseInt(dateTimeMatch[4], 10);
    const seconds = parseInt(dateTimeMatch[5] || "0", 10);
    const now = new Date();
    const year = now.getFullYear();
    const date = new Date(year, month, day, hours, minutes, seconds);
    if (date > now) date.setFullYear(year - 1);
    return date.getTime();
  }

  const timeOnlyMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeOnlyMatch) {
    const hours = parseInt(timeOnlyMatch[1], 10);
    const minutes = parseInt(timeOnlyMatch[2], 10);
    const seconds = parseInt(timeOnlyMatch[3] || "0", 10);
    const date = new Date();
    date.setHours(hours, minutes, seconds, 0);
    return date.getTime();
  }

  const parsedDate = new Date(trimmed);
  if (!isNaN(parsedDate.getTime())) return parsedDate.getTime();
  return 0;
};

export const getMessageTimestamp = (value?: string | Date | null): number => {
  return parseMessageTimeString(value);
};

const getContactOriginalOrder = (
  contact: Contact,
  fallbackIndex: number,
  originalOrderMap?: Map<string, number>,
): number => {
  const mappedOrder = originalOrderMap?.get(String(contact.id));
  if (mappedOrder !== undefined) return mappedOrder;
  if (contact.originalIndex !== undefined) return contact.originalIndex;
  return fallbackIndex;
};

// ==================== 稳定排序（核心优化） ====================

/**
 * 稳定比较两个联系人
 * 1. 置顶优先
 * 2. 最新消息时间降序
 * 3. 时间相同时保持原始顺序（防止跳动）
 */
export const compareContacts = (
  a: Contact,
  b: Contact,
  originalOrderA: number,
  originalOrderB: number,
): number => {
  // 1. 置顶优先
  if (!!a.isTop !== !!b.isTop) {
    return a.isTop ? -1 : 1;
  }

  // 2. 按最新消息时间降序
  const timeA = getMessageTimestamp(a.lastMessageAt);
  const timeB = getMessageTimestamp(b.lastMessageAt);

  if (timeA !== timeB) {
    return timeB - timeA; // 最新的在前
  }

  // 3. 时间相同时，保持原始顺序（稳定排序的关键）
  return originalOrderA - originalOrderB;
};

/**
 * 稳定排序联系人列表
 * 使用原始顺序作为稳定排序的最终依据
 */
export const sortContacts = (
  contacts: Contact[],
  currentUserId: string,
  originalOrderMap?: Map<string, number>,
) => {
  const manager = globalOriginalOrderManager;

  // 确保原始顺序已初始化
  if (!originalOrderMap && manager.getMap().size === 0) {
    manager.initFromContacts(contacts);
  }

  const orderMap = originalOrderMap || manager.getMap();

  // 创建带原始顺序的映射
  const fallbackOrder = new Map(
    contacts.map((contact, index) => [String(contact.id), index]),
  );

  // 稳定排序
  const sorted = [...contacts].sort((a, b) =>
    compareContacts(
      a,
      b,
      getContactOriginalOrder(
        a,
        fallbackOrder.get(String(a.id)) ?? 0,
        orderMap,
      ),
      getContactOriginalOrder(
        b,
        fallbackOrder.get(String(b.id)) ?? 0,
        orderMap,
      ),
    ),
  );

  // 原地更新数组
  contacts.length = 0;
  contacts.push(...sorted);
};

/**
 * 从服务器响应更新原始顺序（保持稳定）
 */
export const updateOriginalOrderFromServer = (contacts: Contact[], serverOrder: string[]) => {
  const manager = globalOriginalOrderManager;
  serverOrder.forEach((id, index) => {
    manager.updateOrder(id, index);
  });
};

export const ensureOriginalOrderInitialized = (contacts: Contact[]) => {
  const manager = globalOriginalOrderManager;
  if (manager.getMap().size === 0) {
    for (let i = 0, len = contacts.length; i < len; i++) {
      manager.setOrder(String(contacts[i].id), i);
    }
  }
};

// ==================== 格式化消息 ====================

const jsonCache = new Map<string, any>();

const safeJsonParse = (value: unknown) => {
  if (typeof value === "object" && value !== null) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  if (jsonCache.has(value)) return jsonCache.get(value);
  try {
    const res = JSON.parse(value);
    jsonCache.set(value, res);
    return res;
  } catch {
    return null;
  }
};

const normalizeFallbackText = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value && typeof value === "object") {
    const maybeText = (value as any)?.text;
    if (typeof maybeText === "string" && maybeText.trim()) {
      return maybeText;
    }
  }

  return "";
};

export const formatMessageContent = (
  messageType: string,
  content: unknown,
  isGroup: boolean,
  sender?: any,
  isRecalled: boolean = false,
  currentUserId?: string | number,
  senderId?: string | number,
  recalledContent?: string,
): string => {
  if (isRecalled) {
    if (recalledContent) return recalledContent;
    const isSelf =
      currentUserId && senderId && String(currentUserId) === String(senderId);
    const custom = getCustomRecallText();
    return isSelf
      ? custom.self || "你撤回了一条消息"
      : custom.others || "对方撤回了一条消息";
  }

  let displayText = "";
  switch (messageType) {
    case "text":
      displayText = normalizeFallbackText(content) || "[文本消息]";
      break;
    case "image":
      displayText = "[图片]";
      break;
    case "video":
      displayText = "[视频]";
      break;
    case "voice":
      displayText = "[语音]";
      break;
    case "file":
      displayText = "[文件]";
      break;
    case "call": {
      const callData = safeJsonParse(content);
      const callText = callData?.text;
      displayText =
        (typeof callText === "string" && callText.trim())
          ? callText
          : normalizeFallbackText(content) || "[通话]";
      break;
    }
    case "system":
      displayText = normalizeFallbackText(content) || "[系统消息]";
      break;
    case "group_notification":
    case "group_invite_pending":
    case "group_invite_accepted":
    case "group_invite_rejected": {
      const data = safeJsonParse(content);
      if (!data && typeof content === "string" && content.trim()) {
        displayText = content.trim();
      } else {
        displayText = getSystemMessagePreview(messageType, data);
      }
      break;
    }
    default:
      displayText = normalizeFallbackText(content) || "[消息]";
  }

  if (isGroup && sender) {
    const name =
      sender.groupNickname || sender.nickname || sender.username || "未知用户";
    return `${name}: ${displayText}`;
  }
  return displayText;
};

export const updateContactLastMessage = (
  contacts: Contact[],
  contactId: string | number,
  lastMessage: string,
  lastMessageTime: string,
  lastMessageAt?: string,
) => {
  const targetId = String(contactId);
  for (let i = 0, len = contacts.length; i < len; i++) {
    const c = contacts[i];
    if (String(c.id) === targetId) {
      contacts[i] = {
        ...c,
        lastMessage,
        lastMessageTime,
        lastMessageAt,
        messages: Array.isArray(c.messages) ? [...c.messages] : c.messages,
      };
      break;
    }
  }
};

export const shouldReplaceContactSummary = (
  contact: Contact,
  createdAt?: string | null,
): boolean => {
  const incomingTimestamp = getMessageTimestamp(createdAt);
  const currentTimestamp = getMessageTimestamp(contact.lastMessageAt);
  return currentTimestamp === 0 || incomingTimestamp >= currentTimestamp;
};

// ==================== 切换置顶状态 ====================

export const handleToggleTop = async (
  contactId: string | number,
  isTop: boolean,
  options: SendMessageOptions,
) => {
  const { contacts } = options;
  const targetId = String(contactId);
  const contact = contacts.find((c) => String(c.id) === targetId);

  if (!contact) {
    message.error("找不到指定的联系人或群聊");
    return;
  }

  try {
    contact.isTop = isTop;
    saveTopStatusToLocalStorage(targetId, isTop);
    const originalOrderMap = globalOriginalOrderManager.getMap();
    sortContacts(contacts, options.currentUserId, originalOrderMap);
    message.success(isTop ? "已设为置顶" : "已取消置顶");
  } catch (error: any) {
    message.error(
      error.response?.data?.data?.message || "操作失败，请稍后重试",
    );
  }
};

// ==================== 切换免打扰状态 ====================

export const handleToggleMute = async (
  contactId: string | number,
  isMuted: boolean,
  options: SendMessageOptions,
) => {
  const { contacts } = options;
  const targetId = String(contactId);
  const contact = contacts.find((c) => String(c.id) === targetId);

  if (!contact) {
    message.error("找不到指定的联系人或群聊");
    return;
  }

  try {
    contact.isMuted = isMuted;
    saveMuteStatusToLocalStorage(targetId, isMuted);
    const originalOrderMap = globalOriginalOrderManager.getMap();
    sortContacts(contacts, options.currentUserId, originalOrderMap);
    message.success(isMuted ? "已开启消息免打扰" : "已关闭消息免打扰");
  } catch (error: any) {
    message.error(
      error.response?.data?.data?.message || "操作失败，请稍后重试",
    );
  }
};

// ==================== 工具函数 ====================

const calculateChatLevel = (messageCount: number): number => {
  const count = Math.max(0, Math.floor(Number(messageCount) || 0));

  const LEVEL_MESSAGE_REQUIREMENTS = [
    0, 3, 8, 15, 25, 40, 60, 85, 115, 150, 190, 235, 285, 340, 400, 465, 535,
    610, 690, 775, 870, 970, 1080, 1200, 1330, 1470, 1620, 1780, 1950, 2130,
    2330, 2540, 2760, 2990, 3230, 3480, 3740, 4010, 4290, 4580, 4900, 5230,
    5570, 5920, 6280, 6650, 7030, 7420, 7820, 8230, 8670, 9120, 9580, 10050,
    10530, 11020, 11520, 12030, 12550, 13080, 13650, 14230, 14820, 15420,
    16030, 16650, 17280, 17920, 18570, 19230, 19930, 20640, 21360, 22090,
    22830, 23580, 24340, 25110, 25890, 26680, 27520, 28370, 29230, 30100,
    30980, 31870, 32770, 33680, 34600, 35530, 36530, 37540, 38560, 39590,
    40630, 41680, 42800, 43930, 45070, 50000,
  ];

  let level = 1;
  for (let i = LEVEL_MESSAGE_REQUIREMENTS.length - 1; i >= 0; i--) {
    if (count >= LEVEL_MESSAGE_REQUIREMENTS[i]) {
      level = i + 1;
      break;
    }
  }

  return Math.min(100, level);
};

export const getChatPartnerMyGroupNickname = (chatPartner: any): string => {
  if (!chatPartner) return "";
  const raw =
    chatPartner.myGroupNickname ?? chatPartner.dataValues?.myGroupNickname;
  return typeof raw === "string" && raw.trim() ? raw.trim() : "";
};

export const enhanceSenderWithGroupNickname = (
  sender: any,
  contact: Contact,
  senderId: string,
  currentUserId: string,
) => {
  let enhancedSender = sender;

  if (contact.isGroup && contact.groupMembers) {
    const member = contact.groupMembers.find(
      (m: any) => String(m.id) === String(senderId),
    );

    if (member && member.nickname) {
      enhancedSender = {
        ...sender,
        groupNickname: member.nickname,
      };
    }
  }

  return enhancedSender;
};

export const updateContactGroupNickname = (
  contact: Contact,
  msg: any,
  currentUserId: string,
) => {
  if (!contact.isGroup) return;

  const partnerNick = getChatPartnerMyGroupNickname(msg.chatPartner);
  if (partnerNick) {
    contact.myGroupNickname = partnerNick;
    return;
  }

  if (contact.groupMembers) {
    const currentMember = contact.groupMembers.find(
      (m: any) => String(m.id) === String(currentUserId),
    );
    if (currentMember?.nickname) {
      contact.myGroupNickname = currentMember.nickname;
    }
  }
};

export const createNewMessage = (
  msg: any,
  enhancedSender: any,
  currentUserId: string,
) => {
  const senderId = String(msg.senderId);

  let fileName: string | undefined;
  let fileSize: number | undefined;

  if (msg.messageType === "file" && msg.content) {
    try {
      const contentData = JSON.parse(msg.content);
      if (contentData.filename) {
        fileName = contentData.filename;
      }
      if (contentData.size !== undefined) {
        fileSize = contentData.size;
      }
    } catch {
      // 静默失败
    }
  }

  return {
    id: msg.id || `${Date.now()}`,
    content: msg.content,
    time: msg.time,
    createdAt: msg.createdAt || msg.time,
    _timestamp: msg.createdAt
      ? new Date(msg.createdAt).getTime()
      : new Date().getTime(),
    avatar: enhancedSender?.avatar || "",
    isMe: senderId === currentUserId,
    senderId,
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
    fileName,
    fileSize,
  };
};

export const isMessageExists = (messages: any[], newMessage: any): boolean => {
  const systemMessageTypes = new Set([
    "group_notification",
    "group_invite_pending",
    "group_invite_accepted",
    "group_invite_rejected",
  ]);

  return messages.some((existingMsg: any) => {
    if (existingMsg.id && newMessage.id) {
      return existingMsg.id === newMessage.id;
    }

    const existingType = String(existingMsg.messageType || "");
    const incomingType = String(newMessage.messageType || "");
    if (
      systemMessageTypes.has(existingType) ||
      systemMessageTypes.has(incomingType)
    ) {
      return false;
    }

    if (
      existingMsg._timestamp &&
      newMessage._timestamp &&
      Math.abs(existingMsg._timestamp - newMessage._timestamp) < 500
    ) {
      return existingMsg.content === newMessage.content;
    }
    return false;
  });
};

export const updateJoinMessages = (contact: Contact, msg: any) => {
  if (msg.messageType !== "group_notification" || !contact.isGroup) {
    return;
  }

  try {
    const content = JSON.parse(msg.content);
    if (content.type === "group_notification" && content.joinedUser) {
      const joinMsg = {
        userId: String(content.joinedUser.id),
        userName:
          content.joinedUser.nickname || content.joinedUser.username || "用户",
        time: msg.time || content.timestamp || new Date().toISOString(),
      };

      if (!contact.joinMessages) {
        contact.joinMessages = [];
      }
      contact.joinMessages.push(joinMsg);

      contact.joinMessages.sort(
        (a, b) => getMessageTimestamp(a.time) - getMessageTimestamp(b.time),
      );
    }
  } catch {
    // 静默失败
  }
};

export const triggerContactReactiveUpdate = (
  contacts: Contact[],
  contactId: string,
): Contact[] => {
  const updatedContacts = [...contacts];
  const contactIndex = updatedContacts.findIndex((c) => c.id === contactId);

  if (contactIndex !== -1) {
    updatedContacts[contactIndex] = {
      ...updatedContacts[contactIndex],
      messages: [...updatedContacts[contactIndex].messages],
    };
  }

  return updatedContacts;
};

// ==================== 统一的消息通知辅助函数 ====================

const handleNotificationsForContact = (
  msg: any,
  contact: Contact,
  contactId: string,
  currentUserId: string,
  activeContactId: string,
  refs: {
    contacts: Contact[];
    notificationComponentRef?: any;
    statusBarNotificationRef?: any;
    router?: any;
  },
) => {
  try {
    const notificationEnabled = localStorage.getItem("notificationEnabled") !== "false";
    if (!notificationEnabled) return;

    const notificationMode = localStorage.getItem("notificationMode") || "sound-and-system";
    if (notificationMode === "dnd") return;

    const notificationStore = useNotificationStore();
    const isActiveContact = activeContactId === contactId;
    const isDocumentHidden = typeof document !== "undefined" && document.hidden;

    const options: any = {
      contacts: refs.contacts,
      activeContactId: { value: activeContactId },
      currentUserId,
      router: refs.router,
      notificationComponentRef: refs.notificationComponentRef,
      statusBarNotificationRef: refs.statusBarNotificationRef,
    };

    if (!["statusbar-only", "desktop-only"].includes(notificationMode)) {
      notificationStore.playMessageSound();
    }

    if (["system-only", "sound-and-system"].includes(notificationMode)) {
      notificationStore.showCustomNotification(msg, contact, options);
    }

    if (["statusbar-only", "sound-and-statusbar"].includes(notificationMode)) {
      notificationStore.showStatusBarNotification(msg, contact, options);
    }

    if (["desktop-only", "sound-and-desktop"].includes(notificationMode)) {
      notificationStore.showDesktopNotification(msg, contact, options);
    }

    if (!isActiveContact && isDocumentHidden) {
      notificationStore.startTitleFlash();
    }
  } catch (err) {
    console.error("[通知] 处理失败:", err);
  }
};

// ==================== 处理实时消息的核心逻辑 ====================

export interface HandleRealtimeMessageOptions {
  contacts: Contact[];
  currentUserId: string;
  activeContactId: string;
  rightChatAreaRef?: any;
  nextTick?: Function;
  notificationComponentRef?: any;
  statusBarNotificationRef?: any;
  router?: any;
}

export const handleRealtimeMessageCore = (
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
    const isGroup = !!msg.groupId;

    if (
      msg.messageType === GROUP_INVITE_TYPES.PENDING ||
      msg.messageType === GROUP_INVITE_TYPES.ACCEPTED ||
      msg.messageType === GROUP_INVITE_TYPES.REJECTED
    ) {
      try {
        const inviteData = JSON.parse(msg.content);

        if (msg.messageType === GROUP_INVITE_TYPES.PENDING) {
          message.info({
            content: `${inviteData.inviter?.nickname || inviteData.inviter?.username} 邀请你加入群聊「${inviteData.groupName}」`,
            duration: 5,
          });
        } else if (msg.messageType === GROUP_INVITE_TYPES.ACCEPTED) {
          message.success({
            content: `你已成功加入群聊「${inviteData.groupName}」`,
            duration: 3,
          });
        } else if (msg.messageType === GROUP_INVITE_TYPES.REJECTED) {
          message.info({
            content: `你已拒绝加入群聊「${inviteData.groupName}」`,
            duration: 3,
          });
        }
      } catch {
        // 静默失败
      }
    }

    let contactId: string;
    if (isGroup) {
      const groupId = String(msg.groupId);
      contactId = groupId.startsWith("group_") ? groupId : `group_${groupId}`;
    } else {
      contactId =
        senderId === currentUserId ? String(msg.receiverId) : senderId;
    }

    let contactIndex = contacts.findIndex((c) => c.id === contactId);
    let contact = contactIndex !== -1 ? contacts[contactIndex] : undefined;

    if (!contact && !isGroup) {
      contact = {
        id: contactId,
        name: msg.sender?.nickname || msg.sender?.username || "未知用户",
        avatar:
          msg.sender?.avatar ||
          "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png",
        lastMessage: "",
        lastMessageTime: "",
        unreadCount: 0,
        isOnline: false,
        messages: [],
        remark: "",
        isTop: false,
        isMuted: false,
        isGroup: false,
        username: msg.sender?.username || "",
      };
      contacts.push(contact);
      contactIndex = contacts.length - 1;
    }

    if (!contact) {
      return contacts;
    }

    invalidateChatHistoryCache(contacts, contactId);

    updateContactGroupNickname(contact, msg, currentUserId);

    const enhancedSender = enhanceSenderWithGroupNickname(
      msg.sender,
      contact,
      senderId,
      currentUserId,
    );

    contact.lastMessage = formatMessageContent(
      msg.messageType || "text",
      msg.content,
      isGroup,
      enhancedSender,
      msg.isRecalled || false,
      currentUserId,
      msg.senderId,
    );
    contact.lastMessageTime = msg.time;

    if (isGroup && enhancedSender) {
      contact.lastMessageSender = {
        nickname:
          enhancedSender.groupNickname || enhancedSender.nickname || "未知用户",
        id: senderId,
      };
    }

    const newMessage = createNewMessage(msg, enhancedSender, currentUserId);

    if (!Array.isArray(contact.messages)) {
      contact.messages = [];
    }

    if (!isMessageExists(contact.messages, newMessage)) {
      contact.messages.push(newMessage);
    }

    if (activeContactId !== contactId) {
      contact.unreadCount = (contact.unreadCount || 0) + 1;
    }

    updateJoinMessages(contact, msg);

    // 使用稳定排序
    const originalOrderMap = globalOriginalOrderManager.getMap();
    sortContacts(contacts, currentUserId, originalOrderMap);

    const sortedIndex = contacts.findIndex((c) => c.id === contactId);
    if (sortedIndex !== -1) {
      contacts[sortedIndex] = { ...contacts[sortedIndex] };
    }

    // 触发响应式更新
    const newContactsArray = [...contacts];
    contacts.splice(0, contacts.length, ...newContactsArray);

    if (
      activeContactId === contactId &&
      rightChatAreaRef?.value?.scrollToBottom &&
      nextTick
    ) {
      setTimeout(() => {
        nextTick(() => {
          rightChatAreaRef.value.scrollToBottom();
        });
      }, 50);
    }

    const isMe = senderId === currentUserId;
    if (!isMe) {
      handleNotificationsForContact(msg, contact, contactId, currentUserId, activeContactId, {
        contacts,
        notificationComponentRef,
        statusBarNotificationRef,
        router,
      });
    }

    return contacts;
  } catch (err) {
    console.error("[handleRealtimeMessageCore] 处理消息失败:", err);
    return contacts;
  }
};

// ==================== 处理撤回消息 ====================

export const handleRecallMessageCore = (
  data: any,
  contacts: Contact[],
  currentUserId: string,
): Contact[] => {
  try {
    const { messageId, groupId, receiverId, senderId, time } = data;

    const isGroup = !!groupId;
    const contactId = isGroup
      ? `group_${groupId}`
      : String(senderId) === currentUserId
        ? String(receiverId)
        : String(senderId);

    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) {
      return contacts;
    }

    const messageIndex = contact.messages.findIndex(
      (msg: any) => msg.id === messageId,
    );

    if (messageIndex !== -1) {
      const message = contact.messages[messageIndex];

      if (!message.recalledContent && message.content) {
        message.recalledContent = message.content;
      }

      message.content = "";
      message.isRecalled = true;
      message.recalledAt = time || new Date().toISOString();

      contact.messages = [...contact.messages];
    }

    const messages = contact.messages;
    if (messages && messages.length > 0) {
      let lastValidMessage = null;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (!messages[i].isRecalled) {
          lastValidMessage = messages[i];
          break;
        }
      }

      if (lastValidMessage) {
        contact.lastMessage = formatMessageContent(
          lastValidMessage.messageType || "text",
          lastValidMessage.content,
          contact.isGroup,
          lastValidMessage.sender,
          false,
          currentUserId,
          lastValidMessage.senderId,
        );
        contact.lastMessageTime = lastValidMessage.time;
      } else {
        contact.lastMessage = "暂无消息";
        contact.lastMessageTime = "";
      }
    } else {
      contact.lastMessage = "暂无消息";
      contact.lastMessageTime = "";
    }

    return [...contacts];
  } catch (err) {
    console.error("[handleRecallMessageCore] 处理撤回失败:", err);
    return contacts;
  }
};

// ==================== 处理删除单条消息 ====================

export const handleDeleteMessageCore = (
  data: any,
  contacts: Contact[],
  currentUserId: string,
): Contact[] => {
  try {
    const { messageId, groupId, receiverId, senderId } = data;

    const isGroup = !!groupId;
    const contactId = isGroup
      ? `group_${groupId}`
      : String(senderId) === currentUserId
        ? String(receiverId)
        : String(senderId);

    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) {
      return contacts;
    }

    const messageIndex = contact.messages.findIndex(
      (msg: any) => msg.id === messageId,
    );

    if (messageIndex > -1) {
      contact.messages.splice(messageIndex, 1);

      const messages = contact.messages;
      if (messages && messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        const lastMessageText = formatMessageContent(
          lastMsg.messageType || "text",
          lastMsg.content,
          contact.isGroup,
          lastMsg.sender,
          lastMsg.isRecalled || false,
          currentUserId,
          lastMsg.senderId,
        );
        const lastMessageTime = lastMsg.time || new Date().toISOString();

        updateContactLastMessage(
          contacts,
          contactId,
          lastMessageText,
          lastMessageTime,
        );
      } else {
        updateContactLastMessage(contacts, contactId, "", "");
      }
    }

    return [...contacts];
  } catch (err) {
    console.error("[handleDeleteMessageCore] 处理删除失败:", err);
    return contacts;
  }
};

// ==================== 处理批量删除消息 ====================

export const handleBatchDeleteMessagesCore = (
  data: any,
  contacts: Contact[],
  currentUserId: string,
): Contact[] => {
  try {
    const { messageIds, groupId } = data;
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return contacts;
    }

    const contactId = `group_${groupId}`;
    const contact = contacts.find((c) => c.id === contactId);

    if (!contact) {
      return contacts;
    }

    const messageIdSet = new Set(messageIds.map(String));
    contact.messages = contact.messages.filter(
      (msg: any) => !messageIdSet.has(String(msg.id)),
    );

    const messages = contact.messages;
    if (messages && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const lastMessageText = formatMessageContent(
        lastMsg.messageType || "text",
        lastMsg.content,
        contact.isGroup,
        lastMsg.sender,
        lastMsg.isRecalled || false,
        currentUserId,
        lastMsg.senderId,
      );
      const lastMessageTime = lastMsg.time || new Date().toISOString();

      updateContactLastMessage(
        contacts,
        contactId,
        lastMessageText,
        lastMessageTime,
      );
    } else {
      updateContactLastMessage(contacts, contactId, "", "");
    }

    return [...contacts];
  } catch (err) {
    console.error("[handleBatchDeleteMessagesCore] 处理批量删除失败:", err);
    return contacts;
  }
};

// ==================== 处理群成员等级更新 ====================

export const handleGroupMemberLevelUpdateCore = (
  data: any,
  contacts: Contact[],
  activeContactId: string,
): {
  contacts: Contact[];
  showNotification?: boolean;
  notificationMessage?: string;
} => {
  try {
    const { userId, groupId, messageCount, chatLevel, nickname, role } = data;

    const contactId = `group_${groupId}`;
    const contact = contacts.find((c) => c.id === contactId);

    if (!contact || !contact.isGroup) {
      return { contacts };
    }

    if (!contact.groupMembers) {
      return { contacts };
    }

    const memberIndex = contact.groupMembers.findIndex(
      (m: any) =>
        String(m.id) === String(userId) || String(m.userId) === String(userId),
    );

    if (memberIndex === -1) {
      return { contacts };
    }

    const member = contact.groupMembers[memberIndex];
    member.chatLevel = chatLevel;
    member.messageCount = messageCount;

    if (nickname) {
      member.nickname = nickname;
    }
    if (role) {
      member.role = role;
    }

    contact.groupMembers = [...contact.groupMembers];

    let updatedContacts = [...contacts];
    let showNotification = false;
    let notificationMessage = "";

    if (activeContactId === contactId) {
      const contactIndex = updatedContacts.findIndex((c) => c.id === contactId);
      if (contactIndex !== -1) {
        updatedContacts[contactIndex] = { ...updatedContacts[contactIndex] };
      }

      showNotification = true;
      notificationMessage = `${nickname || member.nickname || "用户"} 升级到 LV${chatLevel}`;
    }

    return {
      contacts: updatedContacts,
      showNotification,
      notificationMessage,
    };
  } catch (err) {
    console.error("[handleGroupMemberLevelUpdateCore] 处理等级更新失败:", err);
    return { contacts };
  }
};

// ==================== 处理群成员头衔更新 ====================

export const handleGroupMemberTitleUpdateCore = (
  data: any,
  contacts: Contact[],
  activeContactId: string,
): Contact[] => {
  try {
    const { userId, groupId, groupTitle, nickname } = data;

    const contactId = `group_${groupId}`;
    const contact = contacts.find((c) => c.id === contactId);

    if (!contact || !contact.isGroup) {
      return contacts;
    }

    if (!contact.groupMembers) {
      return contacts;
    }

    const memberIndex = contact.groupMembers.findIndex(
      (m: any) =>
        String(m.id) === String(userId) || String(m.userId) === String(userId),
    );

    if (memberIndex === -1) {
      return contacts;
    }

    const member = contact.groupMembers[memberIndex];
    member.groupTitle = groupTitle || undefined;

    contact.groupMembers = [...contact.groupMembers];

    let updatedContacts = [...contacts];

    if (activeContactId === contactId) {
      const contactIndex = updatedContacts.findIndex((c) => c.id === contactId);
      if (contactIndex !== -1) {
        updatedContacts[contactIndex] = { ...updatedContacts[contactIndex] };
      }
    }

    return updatedContacts;
  } catch (err) {
    console.error("[handleGroupMemberTitleUpdateCore] 处理头衔更新失败:", err);
    return contacts;
  }
};

// ==================== 添加或更新临时联系人 ====================

export const addOrUpdateTemporaryContactToList = async (
  contacts: Contact[],
  userId: string | number,
  currentUserId: string,
): Promise<Contact[]> => {
  try {
    const response = await request.get(`/users/${userId}`);
    const userInfo = response.data;

    const existingContactIndex = contacts.findIndex(
      (contact) => String(contact.id) === String(userId),
    );

    const newContact: Contact = {
      id: String(userId),
      name: userInfo.nickname || userInfo.username || "未知用户",
      avatar:
        userInfo.avatar ||
        "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png",
      lastMessage: "",
      lastMessageTime: "",
      unreadCount: 0,
      isOnline: userInfo.status === 0,
      messages: [],
      remark: "",
      isTop: false,
      isMuted: false,
      isGroup: false,
      username: userInfo.username,
    };

    let updatedContacts = [...contacts];

    if (existingContactIndex !== -1) {
      updatedContacts[existingContactIndex] = {
        ...updatedContacts[existingContactIndex],
        ...newContact,
      };
    } else {
      updatedContacts.push(newContact);

      const topMap = getTopStatusFromLocalStorage();
      const muteMap = getMuteStatusFromLocalStorage();
      const cid = String(userId);
      newContact.isTop = !!topMap.get(cid);
      newContact.isMuted = !!muteMap.get(cid);
    }

    const originalOrderMap = globalOriginalOrderManager.getMap();
    sortContacts(updatedContacts, currentUserId, originalOrderMap);

    return updatedContacts;
  } catch (error) {
    console.error("[addOrUpdateTemporaryContactToList] 添加临时联系人失败:", error);
    return contacts;
  }
};

// ==================== 发送消息 ====================

export const handleSendMessage = async (
  contactId: string | number,
  msgContent: string,
  options: SendMessageOptions,
  userStore: any,
  messageType: string = "text",
  files?: File[],
  tempFilenames?: string[],
  originalFilenames?: string[],
  fileSizes?: number[],
) => {
  if (!msgContent && !tempFilenames?.length) {
    const { currentUserId, contacts } = options;
    const targetId = String(contactId);
    const contact = contacts.find((c) => String(c.id) === targetId);

    if (!contact) {
      try {
        const response = await request.get(`/users/${contactId}`);
        const userInfo = response.data;

        const newContact: Contact = {
          id: String(contactId),
          name: userInfo.nickname || userInfo.username || "未知用户",
          avatar:
            userInfo.avatar ||
            "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png",
          lastMessage: "",
          lastMessageTime: "",
          unreadCount: 0,
          isOnline: userInfo.status === 0,
          messages: [],
          remark: "",
          isTop: false,
          isMuted: false,
          isGroup: false,
          username: userInfo.username,
        };

        contacts.push(newContact);

        const topMap = getTopStatusFromLocalStorage();
        const muteMap = getMuteStatusFromLocalStorage();
        const cid = String(contactId);
        newContact.isTop = !!topMap.get(cid);
        newContact.isMuted = !!muteMap.get(cid);
      } catch (error) {
        console.error("[handleSendMessage] 获取用户信息失败:", error);
      }
    }

    return null;
  }

  const { currentUserId, contacts, rightChatAreaRef } = options;
  const targetId = String(contactId);
  let contact = contacts.find((c) => String(c.id) === targetId);

  if (!contact) {
    const updatedContacts = await addOrUpdateTemporaryContactToList(
      contacts,
      contactId,
      currentUserId,
    );
    const newContact = updatedContacts.find((c) => String(c.id) === targetId);

    if (!newContact) {
      message.error("找不到指定的联系人或群聊");
      return;
    }

    Object.assign(contacts, updatedContacts);
    contact = newContact;
  }

  const isGroup = targetId.startsWith("group_");
  const pureId = isGroup ? targetId.replace("group_", "") : targetId;

  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();
  const time = new Date(now).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const user = userStore.user || userStore.userInfo || {};
  let groupNickname: string | undefined = undefined;
  if (isGroup && contact.isGroup && contact.groupMembers) {
    const currentMember = contact.groupMembers.find(
      (m: any) =>
        String(m.id) === String(currentUserId) ||
        String(m.userId) === String(currentUserId),
    );
    if (currentMember?.nickname) groupNickname = currentMember.nickname;
  }

  const senderInfo = {
    id: currentUserId,
    nickname: user.nickname,
    username: user.username,
    name: user.nickname || user.username || "我",
    avatar: user.avatar || "",
    groupNickname: groupNickname,
  };

  const pendingMessage = {
    id: tempId,
    content: msgContent,
    time,
    createdAt: new Date(now).toISOString(),
    _timestamp: now,
    isMe: true,
    senderId: currentUserId,
    senderName: senderInfo.name,
    messageType: messageType,
    sender: senderInfo,
    isPending: true,
    status: "sending",
  };

  if (!Array.isArray(contact.messages)) {
    contact.messages = [];
  }
  contact.messages.push(pendingMessage);

  const displayContent = ["image", "video", "file"].includes(messageType) ? "" : msgContent;
  contact.lastMessage = formatMessageContent(
    messageType,
    displayContent,
    isGroup,
    isGroup ? senderInfo : undefined,
  );
  if (isGroup) contact.lastMessageSender = senderInfo;
  contact.lastMessageTime = time;

  const originalOrderMap = globalOriginalOrderManager.getMap();
  sortContacts(contacts, currentUserId, originalOrderMap);

  const updatedContacts = contacts.map(contact => ({ ...contact }));
  contacts.length = 0;
  contacts.push(...updatedContacts);

  try {
    const isMedia = ["image", "video", "file"].includes(messageType);
    let response;

    if (isMedia) {
      const requestData: any = { messageType };
      isGroup
        ? (requestData.groupId = pureId)
        : (requestData.receiverId = pureId);
      if (tempFilenames?.length) requestData.tempFilenames = tempFilenames;

      if (messageType === "file") {
        if (originalFilenames?.length) {
          requestData.originalFilenames = originalFilenames;
        }
        if (fileSizes?.length) {
          requestData.fileSizes = fileSizes;
        }
      }

      let endpoint;
      if (messageType === "video") {
        endpoint = "/message/video";
      } else if (messageType === "file") {
        endpoint = "/message/file";
      } else {
        endpoint = "/message/image";
      }

      response = await request.post(endpoint, requestData);
    } else {
      response = await request.post("/message/text", {
        ...(isGroup ? { groupId: pureId } : { receiverId: pureId }),
        content: msgContent,
        messageType,
      });
    }

    const responseData = response.data.data || response.data;
    const messages = isMedia
      ? responseData.messages || []
      : Array.isArray(responseData)
        ? responseData
        : [responseData];

    for (const msg of messages) {
      const pendingIndex = contact.messages.findIndex(
        (m: any) => m.id === tempId
      );

      if (pendingIndex !== -1) {
        contact.messages[pendingIndex] = {
          id: msg.id,
          content: msg.content,
          time: msg.time || time,
          createdAt: msg.createdAt || new Date(now).toISOString(),
          _timestamp: msg.createdAt ? new Date(msg.createdAt).getTime() : now,
          isMe: true,
          senderId: msg.senderId || currentUserId,
          senderName: senderInfo.name,
          messageType: msg.messageType || messageType,
          sender: senderInfo,
        };
      } else {
        const wsTimestamp = msg.createdAt ? new Date(msg.createdAt).getTime() : now;
        const alreadyExists = contact.messages.some(
          (m: any) =>
            String(m.id) === String(msg.id) ||
            (m.isMe && m._timestamp && Math.abs(m._timestamp - wsTimestamp) < 2000 &&
              m.messageType === msg.messageType)
        );
        if (!alreadyExists) {
          contact.messages.push({
            id: msg.id,
            content: msg.content,
            time: msg.time || time,
            createdAt: msg.createdAt || new Date(now).toISOString(),
            _timestamp: msg.createdAt ? new Date(msg.createdAt).getTime() : now,
            isMe: true,
            senderId: msg.senderId || currentUserId,
            senderName: senderInfo.name,
            messageType: msg.messageType || messageType,
            sender: senderInfo,
          });
        }
      }
    }

    if (isGroup && contact.isGroup && contact.groupMembers) {
      const currentMember = contact.groupMembers.find(
        (m: any) =>
          String(m.id) === String(currentUserId) ||
          String(m.userId) === String(currentUserId),
      );
      if (currentMember) {
        currentMember.messageCount = (currentMember.messageCount || 0) + 1;
        const newLevel = calculateChatLevel(currentMember.messageCount);
        currentMember.chatLevel = newLevel;
      }
    }

    invalidateChatHistoryCache(contacts, targetId);

    if (!isGroup && !contact.isGroup) {
      try {
        await createOrUpdateTemporaryContactAPI(
          String(contact.id),
          contact.name,
          contact.avatar,
          contact.username || "",
        );
      } catch {
        // 静默失败
      }
    }

    if (rightChatAreaRef?.value?.scrollToBottom) {
      setTimeout(() => {
        rightChatAreaRef.value.scrollToBottom();
      }, 50);
    }

    return messages[0];
  } catch (error: any) {
    // 标记临时消息为发送失败，便于 UI 展示 & 重试
    try {
      const pendingIndex = contact.messages.findIndex((m: any) => m.id === tempId);
      if (pendingIndex !== -1) {
        contact.messages[pendingIndex].status = "failed";
      }
    } catch (e) {
      // ignore
    }

    const msg =
      error.response?.data?.data?.message || "消息发送失败，请稍后重试";
    message.error(msg);
    throw error;
  }
};

// ==================== 聊天历史 ====================

export const invalidateChatHistoryCache = (
  contacts: Contact[],
  contactId: string | number,
) => {
  const id = String(contactId);
  const c = contacts.find((x) => String(x.id) === id);
  if (c) delete c.chatHistoryPagination;
};

const emptyHistoryFromLatestHint = (contact: Contact) => {
  if (String(contact.id).startsWith("self_")) return false;
  if (typeof document !== "undefined" && document.hidden) return false;
  // 🔥 如果消息列表为空（首次加载），不跳过，允许加载历史
  if (!contact.messages || contact.messages.length === 0) return false;
  if (String(contact.lastMessage || "").trim()) return false;
  if (Number(contact.unreadCount) > 0) return false;
  return true;
};

const emptyHistoryConfirmed = (contact: Contact) => {
  const p = contact.chatHistoryPagination;
  if (!p) return false;
  return p.total === 0 && !p.hasNextPage;
};

const pickHistoryPayload = (response: unknown) => {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    (response as { data: unknown }).data != null
  ) {
    return (response as { data: Record<string, unknown> }).data;
  }
  return response as Record<string, unknown>;
};

export const getChatHistory = async (
  contactId: string | number,
  options: ChatHistoryOptions,
  page = 1,
  pageSize = 50,
) => {
  const { currentUserId, contacts, forceFetch } = options;
  const targetId = String(contactId);
  const contact = contacts.find((c) => String(c.id) === targetId);

  const emptyPage1Payload = () => ({
    messages: [],
    pagination: {
      currentPage: 1,
      totalPages: 0,
      total: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
  });

  if (
    page === 1 &&
    !forceFetch &&
    contact &&
    (emptyHistoryConfirmed(contact) || emptyHistoryFromLatestHint(contact))
  ) {
    return emptyPage1Payload();
  }

  if (page > 1 && contact?.chatHistoryPagination?.hasNextPage === false) {
    const p = contact.chatHistoryPagination;
    return {
      messages: [],
      pagination: {
        currentPage: p.currentPage,
        totalPages: p.totalPages,
        total: p.total,
        hasNextPage: false,
        hasPrevPage: p.currentPage > 1,
      },
    };
  }

  try {
    const apiUrl = `/message/chat/${targetId}`;

    const response = await request.get(apiUrl, {
      params: { page, limit: pageSize },
    });

    const payload = pickHistoryPayload(response);
    const messages = (payload.messages as unknown[]) || [];
    const pagination = payload.pagination as
      | Record<string, unknown>
      | undefined;

    if (contact) {
      const existIds = new Set(contact.messages.map((m: any) => m.id));
      const memberNicknameMap = new Map<string, string>();

      const isGroup = targetId.startsWith("group_");
      if (isGroup && contact.groupMembers) {
        contact.groupMembers.forEach((member: any) => {
          if (member.nickname)
            memberNicknameMap.set(String(member.id), member.nickname);
        });
      }

      const formatted = messages.map((msg: any) => {
        const senderId = String(msg.senderId);
        const groupNickname = memberNicknameMap.get(senderId);
        const enhancedSender = msg.sender
          ? { ...msg.sender, groupNickname: groupNickname || undefined }
          : undefined;

        let fileName: string | undefined;
        let fileSize: number | undefined;

        if (msg.messageType === "file" && msg.content) {
          try {
            const contentData = JSON.parse(msg.content);
            if (contentData.filename) {
              fileName = contentData.filename;
            }
            if (contentData.size !== undefined) {
              fileSize = contentData.size;
            }
          } catch {
            // 静默失败
          }
        }

        let callType: string | undefined;
        let callStatus: string | undefined;
        let callDuration: number | undefined;
        let displayContent = msg.content;

        if (msg.messageType === "call" && msg.content) {
          if (msg.callType) {
            callType = msg.callType;
            callStatus = msg.callStatus;
            callDuration = msg.callDuration;
            displayContent = msg.content;
          } else {
            try {
              const contentData = JSON.parse(msg.content);
              if (contentData && typeof contentData === "object") {
                displayContent = contentData.text || msg.content;
                callType = contentData.callType;
                callStatus = contentData.callStatus;
                callDuration = contentData.callDuration;
              }
            } catch {
              displayContent = msg.content;
            }
          }
        }

        return {
          id: msg.id,
          content: displayContent,
          time: msg.time,
          createdAt: msg.createdAt || msg.time,
          _timestamp: new Date(msg.createdAt || msg.time).getTime(),
          avatar: enhancedSender?.avatar || "",
          isMe: senderId === currentUserId,
          senderId,
          senderName:
            groupNickname ||
            msg.sender?.nickname ||
            msg.sender?.username ||
            "未知用户",
          sender: enhancedSender,
          messageType: msg.messageType || "text",
          isRecalled: msg.isRecalled || false,
          recalledAt: msg.recalledAt || null,
          recalledContent: msg.recalledContent || "",
          fileName,
          fileSize,
          ...(callType !== undefined && { callType }),
          ...(callStatus !== undefined && { callStatus }),
          ...(callDuration !== undefined && { callDuration }),
        };
      });

      const sortedMessages = formatted.slice().sort((a: any, b: any) => {
        const timeA = typeof a._timestamp === "number" && a._timestamp > 0
          ? a._timestamp
          : getMessageTimestamp(a.createdAt || a.time);
        const timeB = typeof b._timestamp === "number" && b._timestamp > 0
          ? b._timestamp
          : getMessageTimestamp(b.createdAt || b.time);
        return timeA - timeB;
      });

      contact.messages =
        page === 1
          ? sortedMessages
          : [
            ...sortedMessages.filter((m: any) => !existIds.has(m.id)),
            ...contact.messages,
          ];

      if (sortedMessages.length > 0) {
        const lastMessage = sortedMessages[sortedMessages.length - 1];
        contact.lastMessage = formatMessageContent(
          lastMessage.messageType || "text",
          lastMessage.content,
          isGroup,
          lastMessage.sender,
          lastMessage.isRecalled || false,
          currentUserId,
          lastMessage.senderId,
          lastMessage.recalledContent || "",
        );
        contact.lastMessageTime = lastMessage.time || lastMessage.createdAt;
      }
    }

    const hasNext =
      !!pagination &&
      (Boolean(pagination.hasNextPage) || Boolean(pagination.hasNext) || false);
    const hasPrev =
      !!pagination &&
      (Boolean(pagination.hasPrevPage) || Boolean(pagination.hasPrev) || false);
    const currentPage = pagination
      ? Number(pagination.currentPage) || page
      : page;
    const totalPages = pagination ? Number(pagination.totalPages) || 0 : 0;
    const total = pagination ? Number(pagination.total) || 0 : 0;

    if (contact && pagination) {
      contact.chatHistoryPagination = {
        currentPage,
        totalPages,
        total,
        hasNextPage: hasNext,
        hasPrevPage: hasPrev || currentPage > 1,
      };
    }

    return {
      messages,
      pagination: pagination && {
        currentPage,
        totalPages,
        total,
        hasNextPage: hasNext,
        hasPrevPage: hasPrev || currentPage > 1,
      },
    };
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 404 || status === 204) {
      if (contact) {
        contact.chatHistoryPagination = {
          currentPage: page,
          totalPages: 0,
          total: 0,
          hasNextPage: false,
          hasPrevPage: false,
        };
      }
      return {
        messages: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          total: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    console.error("[getChatHistory] 获取聊天历史失败:", error);
    return { messages: [], pagination: undefined };
  }
};
export const getChatHistoryForModal = async (
  contactId: string | number,
  currentUserId: string,
  contacts: any[],
  page: number = 1,
  pageSize: number = 20,
) => {
  try {
    const targetId = String(contactId);
    const apiUrl = `/message/chat/${targetId}`;

    const response = await request.get(apiUrl, {
      params: { page, limit: pageSize }
    });
    const payload = response?.data?.data || response?.data || response;

    // 确保返回统一的数据结构
    return {
      messages: payload.messages || [],
      pagination: payload.pagination || {
        currentPage: page,
        totalPages: 0,
        total: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      chatType: payload.chatType || 'private',
      message: payload.message || '获取聊天记录成功',
    };
  } catch (error: any) {
    console.error("[getChatHistoryForModal] 获取聊天历史失败:", error);
    return {
      messages: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        total: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      chatType: 'private',
      message: error?.message || '获取聊天记录失败',
    };
  }
};

// ==================== 搜索聊天记录 ====================

export const handleSearchChatHistory = async (
  contactId: string | number,
  keyword: string,
  options?: {
    messageType?: string;
    startDate?: string;
    endDate?: string;
    memberId?: string;
  },
) => {
  const kw = typeof keyword === "string" ? keyword.trim() : "";
  if (!kw) return [];

  try {
    const targetId = String(contactId);

    const params: any = {
      keyword: kw,
      targetId: targetId,
    };

    if (options?.messageType && options.messageType !== "") {
      params.messageType = options.messageType;
    }
    if (options?.startDate) {
      params.startDate = options.startDate;
    }
    if (options?.endDate) {
      params.endDate = options.endDate;
    }
    if (options?.memberId && options.memberId !== "") {
      params.memberId = options.memberId;
    }

    const res = await request.get("/message/search", {
      params,
    });
    const payload = pickHistoryPayload(res);
    const list = (payload.messages as unknown[]) || [];
    message.success(`找到 ${list.length} 条记录`);
    return list;
  } catch (error: any) {
    message.error(
      error.response?.data?.data?.message || "搜索失败，请稍后重试",
    );
    return [];
  }
};

// ==================== 修改备注 ====================

export const handleEditRemark = async (
  contactId: string | number,
  newRemark: string,
  contacts: Contact[],
) => {
  try {
    const targetId = String(contactId);
    const isGroup = targetId.startsWith("group_");
    const pureId = isGroup ? targetId.replace("group_", "") : targetId;

    isGroup
      ? await request.put(`/group/${pureId}/member/remark`, {
        remark: newRemark,
      })
      : await request.put(`/friends/${pureId}/remark`, { remark: newRemark });

    const contact = contacts.find((c) => c.id === targetId);
    if (contact) contact.remark = newRemark;

    message.success("备注修改成功");
  } catch (error: any) {
    message.error(
      error.response?.data?.data?.message || "修改备注失败，请稍后重试",
    );
  }
};

// ==================== 更新群公告 ====================

export const handleUpdateGroupRule = async (
  groupId: string | number,
  rule: string,
  contacts: Contact[],
) => {
  try {
    const pureGroupId = String(groupId).replace("group_", "");

    await request.put(`/group/${pureGroupId}/rule`, {
      rule: rule,
    });

    if (contacts && Array.isArray(contacts)) {
      const groupContact = contacts.find(
        (c) => c.id === `group_${pureGroupId}` || c.id === groupId,
      );
      if (groupContact) {
        groupContact.groupRule = rule;
      }
    }

    message.success("群公告更新成功");
  } catch (error: any) {
    message.error(
      error.response?.data?.data?.message || "更新群公告失败，请稍后重试",
    );
    throw error;
  }
};

// ==================== 获取当前用户名 ====================

export const getCurrentUsername = (): string => {
  try {
    const userInfoStr = localStorage.getItem("userInfo");
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      return userInfo.nickname || userInfo.username || "未知用户";
    }
  } catch {
    // ignore error
  }

  return "未知用户";
};

// ==================== 删除消息 ====================

export const deleteMessage = async (
  messageId: string | number,
  showConfirm: boolean = true,
): Promise<boolean> => {
  try {
    if (showConfirm) {
      await new Promise((resolve, reject) => {
        Modal.confirm({
          title: "删除确认",
          content: "确定要删除这条消息吗？删除后无法恢复。",
          okText: "确定",
          cancelText: "取消",
          type: "warning",
          onOk: () => resolve(true),
          onCancel: () => reject("cancel"),
        });
      });
    }

    await request.delete(`/message/${messageId}`);
    return true;
  } catch (error: any) {
    if (error !== "cancel") {
      message.error(
        error.response?.data?.data?.message || "删除消息失败，请稍后重试",
      );
    }
    return false;
  }
};

// ==================== 标记消息为已读 ====================

export const markMessagesAsRead = async (
  targetId: string,
  contacts: Contact[],
): Promise<boolean> => {
  try {
    const contact = contacts.find((c) => String(c.id) === String(targetId));
    if (!contact) {
      return false;
    }

    await request.post(`/message/mark-read/${targetId}`);

    contact.unreadCount = 0;

    return true;
  } catch (error) {
    console.error("[markMessagesAsRead] 标记已读失败:", error);
    return false;
  }
};

// ==================== 临时会话API接口 ====================

export const createOrUpdateTemporaryContactAPI = async (
  contactId: string,
  name: string,
  avatar: string,
  username: string,
): Promise<boolean> => {
  try {
    const { getFriends } = await import("./friendManager");
    const friends = await getFriends("accepted");

    const isFriend = friends.some(
      (friend) =>
        String(friend.friendUser?.id) === contactId ||
        String(friend.userId) === contactId,
    );

    if (isFriend) {
      return true;
    }

    await request.post("/temporary-contacts", {
      contactId: parseInt(contactId, 10),
    });
    return true;
  } catch (error) {
    console.error("[createOrUpdateTemporaryContactAPI] 创建临时会话失败:", error);
    return false;
  }
};

