import type { ChatMessage } from "../types/chatTypes";
export interface ParsedGroupInviteData {
  type?: string;
  groupId?: string | number;
  groupName?: string;
  groupNumber?: string;
  isPrivate?: boolean;
  maxMembers?: number;
  currentMembers?: number;
  memberCount?: number | { previous: number; current: number };
  rule?: string;
  requireApproval?: boolean;
  inviter?: {
    id?: number | string;
    username?: string;
    nickname?: string;
    avatar?: string;
    tags?: string[];
  };
  invitee?: {
    id?: number | string;
    name?: string;
    username?: string;
    nickname?: string;
  };
  acceptedUser?: {
    id?: number | string;
    nickname?: string;
  };
  rejectedUser?: {
    id?: number | string;
    nickname?: string;
    username?: string;
  };
  timestamp?: string;
  message?: string;
  groupAvatar?: string;
  groupTag?: string;
  tags?: string[];
  inviterNickname?: string;
}

export interface ParsedGroupNotificationData {
  type?: string;
  groupId?: string | number;
  groupName?: string;
  groupNumber?: string;
  groupAvatar?: string;
  groupIntroduction?: string;
  maxMembers?: number;
  message?: string;
  kickedUser?: {
    id?: number | string;
    nickname?: string;
    avatar?: string;
  } | null;
  removedUser?: {
    id?: number | string;
    nickname?: string;
    avatar?: string;
  } | null;
  operator?: {
    id?: number | string;
    nickname?: string;
    avatar?: string;
    role?: string;
  } | null;
  timestamp?: string;
  timestampRaw?: string;
  reason?: string;
  memberCount?: number;
  operationTime?: string;
  notificationType?: string;
}

// ============ 核心解析函数 ============

/**
 * 解析系统消息内容（支持字符串或对象）
 */
export const parseSystemMessageContent = (
  content: string | Record<string, any> | undefined,
): Record<string, any> => {
  if (!content) return {};
  if (typeof content === "object") return content;

  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
};

/**
 * 解析群聊邀请数据
 */
export const parseGroupInviteData = (
  content: string | Record<string, any>,
): ParsedGroupInviteData | null => {
  try {
    const data = typeof content === "string" ? JSON.parse(content) : content;

    return {
      type: data.type,
      groupId: data.groupId,
      groupName: data.groupName,
      groupNumber: data.groupNumber,
      isPrivate: data.isPrivate,
      maxMembers: data.maxMembers,
      currentMembers: data.currentMembers || data.memberCount,
      memberCount: data.memberCount,
      rule: data.rule,
      requireApproval: data.requireApproval,
      inviter: data.inviter,
      invitee: data.invitee,
      acceptedUser: data.acceptedUser,
      rejectedUser:
        data.rejectedUser ||
        (data.invitee
          ? {
            id: data.invitee.id,
            nickname: data.invitee.name || data.invitee.nickname,
            username: data.invitee.username,
          }
          : undefined),
      timestamp: data.timestamp,
      message: data.message,
      groupAvatar: data.groupAvatar,
      groupTag: data.groupTag,
      tags: data.inviter?.tags || [],
      inviterNickname: data.inviter?.nickname || data.inviter?.name,
    };
  } catch {
    return null;
  }
};

/**
 * 解析群聊通知数据（踢出、禁言等）
 */
export const parseGroupNotificationData = (
  content: string | Record<string, any>,
): ParsedGroupNotificationData | null => {
  try {
    const data = typeof content === "string" ? JSON.parse(content) : content;

    return {
      type: data.type,
      groupId: data.groupId,
      groupName: data.groupName,
      groupNumber: data.groupNumber,
      groupAvatar: data.groupAvatar,
      groupIntroduction: data.groupIntroduction,
      maxMembers: data.maxMembers,
      message: data.message,
      kickedUser: data.kickedUser
        ? {
          id: data.kickedUser.id,
          nickname: data.kickedUser.nickname,
          avatar: data.kickedUser.avatar,
        }
        : null,
      removedUser: data.removedUser
        ? {
          id: data.removedUser.id,
          nickname: data.removedUser.nickname,
          avatar: data.removedUser.avatar,
        }
        : null,
      operator: data.operator
        ? {
          id: data.operator.id,
          nickname: data.operator.nickname,
          avatar: data.operator.avatar,
          role: data.operator.role,
        }
        : null,
      timestamp: data.timestamp,
      timestampRaw: data.timestampRaw,
      reason: data.reason,
      memberCount: data.memberCount,
      operationTime: data.operationTime,
      notificationType: data.notificationType,
    };
  } catch {
    return null;
  }
};

// ============ 格式化工具 ============

/**
 * 格式化完整日期时间
 */
export const formatFullDateTime = (dateString?: string): string => {
  if (!dateString) return "--";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "--";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// ============ 获取名称函数 ============

export const getInviterName = (data: any): string => {
  return data?.inviter?.nickname || data?.inviter?.username || "未知";
};

export const getInviteeName = (data: any): string => {
  return (
    data?.invitee?.name ||
    data?.invitee?.nickname ||
    data?.invitee?.username ||
    "未知"
  );
};

export const getOperatorName = (data: any): string => {
  return data?.operator?.nickname || data?.operator?.username || "未知";
};

export const getRemovedUserName = (data: any): string => {
  return data?.removedUser?.nickname || data?.removedUser?.username || "未知";
};

// ============ 判断函数 ============

export const isInviteExpired = (data: any): boolean => {
  const expireAt = data?._expiresAtISO || data?.expiresAt;
  if (!expireAt) return false;

  try {
    const expireDate = new Date(expireAt);
    return !isNaN(expireDate.getTime()) && expireDate < new Date();
  } catch {
    return false;
  }
};

export const isInviter = (data: any, currentUserId: number): boolean => {
  return data?.inviter?.id === currentUserId;
};

export const isInvitee = (data: any, currentUserId: number): boolean => {
  return data?.invitee?.id === currentUserId;
};

// ============ 获取文本函数 ============

export const getStatusDescription = (messageType: string): string => {
  const map: Record<string, string> = {
    group_invite_pending: "等待对方处理",
    group_invite_accepted: "对方已同意入群",
    group_invite_rejected: "对方已拒绝入群",
  };
  return map[messageType] || "系统通知";
};

export const getProcessedStatusText = (
  messageType: string,
  isCurrentUser: boolean,
): string => {
  if (messageType === "group_invite_accepted") {
    return isCurrentUser ? "你已成功加入群聊" : "对方已成功加入群聊";
  }
  if (messageType === "group_invite_rejected") {
    return isCurrentUser ? "你已拒绝该入群邀请" : "对方已拒绝该入群邀请";
  }
  return "系统通知";
};

export const getSystemMessageTitle = (messageType: string): string => {
  const map: Record<string, string> = {
    group_invite_pending: "邀请你加入群聊",
    group_invite_accepted: "已同意入群",
    group_invite_rejected: "已拒绝入群",
    group_notification: "群成员变动",
  };
  return map[messageType] || "群系统消息";
};

export const getSystemMessageSubtitle = (
  messageType: string,
  data: any,
): string => {
  const groupName = data?.groupName || "群聊";

  const map: Record<string, string> = {
    group_invite_pending: `邀请你加入群聊"${groupName}"，进入可查看详情。`,
    group_invite_accepted: `你已成功加入群聊"${groupName}"。`,
    group_invite_rejected: `你已拒绝加入群聊"${groupName}"。`,
    group_notification: `${getRemovedUserName(data)} 已被移出群聊"${groupName}"。`,
  };
  return map[messageType] || groupName;
};

export const getSystemMessageStatusText = (messageType: string): string => {
  const map: Record<string, string> = {
    group_invite_pending: "邀请加群",
    group_invite_accepted: "已加入群聊",
    group_invite_rejected: "已拒绝邀请",
    group_notification: "移出群聊",
  };
  return map[messageType] || "系统通知";
};

export const getSystemMessagePreview = (
  messageType: string,
  data: any,
): string => {
  const groupName = data?.groupName || "未知群聊";

  const map: Record<string, string> = {
    group_invite_pending: `[邀请加群] ${getInviterName(data)} 邀请你加入群聊`,
    group_invite_accepted: `你已成功加入群聊"${groupName}"`,
    group_invite_rejected: `你已拒绝加入群聊"${groupName}"`,
    group_notification: `[群成员变动] ${getRemovedUserName(data)} 已被移出群聊`,
  };
  return map[messageType] || "[系统消息]";
};
