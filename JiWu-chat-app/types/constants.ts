// 项目级常量定义
import { BACKEND_URL } from "../config";

export const GROUP_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export const GROUP_MEMBER_LIMIT = {
  MIN: 10,
  MAX: 1000,
} as const;

// 群组邀请消息类型
export const GROUP_INVITE_TYPES = {
  PENDING: "group_invite_pending", // 待处理的邀请
  ACCEPTED: "group_invite_accepted", // 已接受的邀请
  REJECTED: "group_invite_rejected", // 已拒绝的邀请
  NOTIFICATION: "group_notification", // 群组通知（如入群通知）
} as const;

export const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  VOICE: "voice",
  VIDEO: "video",
  FILE: "file",
} as const;

export const MESSAGE_TYPE_DISPLAY = {
  [MESSAGE_TYPES.IMAGE]: "[图片]",
  [MESSAGE_TYPES.VOICE]: "[语音]",
  [MESSAGE_TYPES.VIDEO]: "[视频]",
  [MESSAGE_TYPES.FILE]: "[文件]",
} as const;

export const VALID_APPLICATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

export { BACKEND_URL };
