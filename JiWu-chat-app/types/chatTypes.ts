// types/chatTypes.ts

export interface ChatMessage {
  id?: string | number;
  content: string;
  time: string;
  isMe: boolean;
  senderId?: string | number;
  senderName?: string;
  sender?: {
    avatar?: string;
    nickname?: string;
    username?: string;
    id?: string | number;
    groupNickname?: string;
  };
  createdAt?: string;
  messageType: string;
  _timestamp?: number;
  _formattedTime?: string;
  _uniqueId?: string;
  status?: string;
  // 撤回相关
  isRecalled?: boolean;
  recalledAt?: string;
  recalledBy?: string;
  recalledContent?: string;
  // 文件相关
  fileName?: string;
  fileSize?: number;
  // 通话相关
  callType?: "audio" | "video";
  callStatus?: "missed" | "cancelled" | "ended" | "rejected";
  callDuration?: number;
  // 系统消息相关
  groupId?: string | number | null;
  receiverId?: string | number;
}

export interface Contact {
  id: string | number;
  name: string;
  avatar: string;
  remark?: string;
  isOnline: boolean;
  messages: ChatMessage[];
  isTop?: boolean;
  isMuted?: boolean;
  isDefault?: boolean;
  isGroup: boolean;
  isFriend?: boolean;
  groupOwnerId?: string;
  groupMembers?: {
    id: string | number;
    name: string;
    avatar: string;
    nickname?: string;
    tags?: string[];
    isMuted?: boolean;
    isOnline?: boolean;
    chatLevel?: number;
    messageCount?: number;
    groupTitle?: string;
    useDefaultTitle?: boolean;
    role?: string;
  }[];
  memberCount?: number;
  joinMessages?: { userId: string; userName: string; time: string }[];
  groupRule?: string;
  groupNumber?: string;
  owner?: { id: string; name: string; avatar: string; nickname?: string };
  admin?: { id: string; name: string; avatar: string; nickname?: string }[];
  createdAt?: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageAt?: string;
  unreadCount: number;
  role?: string;
  originalIndex?: number;
  lastMessageSender?: {
    nickname: string;
    id: string;
  };
  username?: string;
  myGroupNickname?: string;
  myGroupTags?: string[];
  tags?: string[];
  blocked?: boolean;
  muteAll?: boolean;
  allowMemberInvite?: boolean;
  onlineVisibility?: number;
  status?: number;
  chatHistoryPagination?: {
    currentPage: number;
    totalPages: number;
    total: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface UserInfo {
  avatar: string;
  username?: string;
}

export interface ColorPalette {
  name: string;
  color: string;
  hover: string;
  active: string;
  light: string;
  text: string;
}

export interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
  tempFilename?: string;
  mediaType: "image";
  isScreenshot?: boolean;
}

export interface SelectedVideo {
  id: string;
  file: File;
  previewUrl?: string;
  duration?: number;
  tempFilename?: string;
  mediaType: "video";
}

export interface ImageHandlerOptions {
  selectedImages: { value: SelectedImage[] };
  lastImageSelectionTime: { value: number | null };
  lastImageSendTime: { value: number | null };
  activeContact: { value: Contact | undefined };
  showMediaPreview: { value: boolean };
  previewMedias: { value: (string | { url: string; type: string })[] };
  currentPreviewIndex: { value: number };
  lastRemoveImageTime?: { value: number | null };
}

export interface VideoHandlerOptions {
  selectedVideos: { value: SelectedVideo[] };
  lastVideoSelectionTime: { value: number | null };
  lastVideoSendTime: { value: number | null };
  activeContact: { value: Contact | undefined };
  showMediaPreview: { value: boolean };
  previewMedias: { value: (string | { url: string; type: string })[] };
  currentPreviewIndex: { value: number };
  lastRemoveVideoTime?: { value: number | null };
}

export interface ContactManagerOptions {
  contacts: Contact[];
  activeContactId: string | number;
  currentUserId: string;
  newMessage?: { value: string };
  isTop?: { value: boolean };
  isMuted?: { value: boolean };
  showContactDrawer?: { value: boolean };
  isEditingRule?: { value: boolean };
  tempGroupRule?: { value: string };
  defaultGroupRule?: { value: string };
  showAllMembers?: { value: boolean };
  tempRemark?: { value: string };
  remarkEditableRef?: { value: HTMLElement | null };
  activeContact?: { value: Contact | undefined };
  emit?: (event: string, ...args: any[]) => void;
  handleInputLocal?: (e: InputEvent) => void;
}

export type SendMessageFunction = (
  contactId: string | number,
  message: string,
  options: ContactManagerOptions,
  userStore: any,
  messageType?: string,
  files?: File[],
  tempFilenames?: string[],
) => Promise<void>;

// 系统消息类型常量
export const SYSTEM_MESSAGE_TYPES = {
  PENDING: 'group_invite_pending',
  ACCEPTED: 'group_invite_accepted',
  REJECTED: 'group_invite_rejected',
  NOTIFICATION: 'group_notification',
} as const;

export type SystemMessageType = typeof SYSTEM_MESSAGE_TYPES[keyof typeof SYSTEM_MESSAGE_TYPES];

//  判断是否为系统消息
export const isSystemMessageType = (messageType: string): boolean => {
  return Object.values(SYSTEM_MESSAGE_TYPES).includes(messageType as SystemMessageType);
};