// src/untils/rightchat.ts

import { type ChatMessage } from "../types/chatTypes";

/**
 * 解析消息时间字符串为时间戳
 * 修复：使用更可靠的年份推断逻辑
 */
const parseMessageTime = (timeStr: string): number | null => {
  if (!timeStr) return null;

  const trimmed = timeStr.trim();

  // 处理 "今天 HH:mm" 或 "今天 HH:mm:ss" 格式
  if (trimmed.includes('今天')) {
    const timePart = trimmed.replace('今天', '').trim();
    const match = timePart.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const seconds = parseInt(match[3] || '0');
      const today = new Date();
      today.setHours(hours, minutes, seconds, 0);
      return today.getTime();
    }
  }

  // 处理 "M-D HH:mm" 格式（如 "8-3 13:48"）
  const dateTimeMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (dateTimeMatch) {
    const month = parseInt(dateTimeMatch[1]) - 1; // 月份从0开始
    const day = parseInt(dateTimeMatch[2]);
    const hours = parseInt(dateTimeMatch[3]);
    const minutes = parseInt(dateTimeMatch[4]);
    const seconds = parseInt(dateTimeMatch[5] || '0');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // 构建日期对象
    let dateObj = new Date(currentYear, month, day, hours, minutes, seconds);

    // 如果解析出的日期比当前日期晚，尝试用上一年
    if (dateObj > now) {
      dateObj = new Date(currentYear - 1, month, day, hours, minutes, seconds);
    }

    // 如果还是比当前日期晚（比如闰年2月29日问题），继续减一年
    if (dateObj > now) {
      dateObj = new Date(currentYear - 2, month, day, hours, minutes, seconds);
    }

    return dateObj.getTime();
  }

  // 处理 "HH:mm" 或 "HH:mm:ss" 格式
  const timeOnlyMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeOnlyMatch) {
    const hours = parseInt(timeOnlyMatch[1]);
    const minutes = parseInt(timeOnlyMatch[2]);
    const seconds = parseInt(timeOnlyMatch[3] || '0');
    const today = new Date();
    today.setHours(hours, minutes, seconds, 0);
    return today.getTime();
  }

  // 处理完整日期时间格式
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date.getTime();
  }

  return null;
};

/**
 * 获取消息的毫秒时间戳
 * 优先级：_timestamp > createdAt > time（解析）
 */
const getMessageTimestamp = (msg: ChatMessage): number | null => {
  // 1. 优先使用存储的时间戳（最可靠）
  if (typeof msg._timestamp === 'number' && msg._timestamp > 0) {
    return msg._timestamp;
  }

  // 2. 使用创建时间（后端 ISO 时间，精确可靠）
  if (msg.createdAt) {
    const d = new Date(msg.createdAt);
    if (!isNaN(d.getTime())) return d.getTime();
  }

  // 3. 回退：解析不精确的时间字符串
  if (msg.time) {
    const parsed = parseMessageTime(msg.time);
    if (parsed !== null) return parsed;
  }

  return null;
};

/**
 * 判断是否显示时间戳（间隔 >= 5分钟）
 */
export const shouldShowTimeStamp = (
  message: ChatMessage,
  index: number,
  messages: ChatMessage[],
): boolean => {
  // 第一条消息或消息列表为空时显示时间戳
  if (index === 0 || !messages || messages.length === 0) {
    return true;
  }

  const prev = messages[index - 1];
  if (!prev) return true;

  const curTime = getMessageTimestamp(message);
  const prevTime = getMessageTimestamp(prev);

  if (curTime === null || prevTime === null) return true;

  const diffMinutes = Math.abs(curTime - prevTime) / (1000 * 60);

  return diffMinutes >= 5;
};

/**
 * 判断是否显示"新消息"分割线
 * 规则：时间差 > 5分钟
 */
export const shouldShowNewMessageDivider = (
  message: ChatMessage,
  index: number,
  messages: ChatMessage[],
): boolean => {
  if (index === 0 || !messages || messages.length === 0) {
    return false;
  }

  const prev = messages[index - 1];
  if (!prev) return false;

  const curTime = getMessageTimestamp(message);
  const prevTime = getMessageTimestamp(prev);
  if (curTime === null || prevTime === null) return false;

  const diffMinutes = Math.abs(curTime - prevTime) / (1000 * 60);

  return diffMinutes > 5;
};

/**
 * 格式化时间为 "今天 HH:mm"
 */
export const formatMessageTime = (timeStr: string): string => {
  if (!timeStr) return "";
  if (timeStr.includes('今天')) return timeStr;

  const timestamp = parseMessageTime(timeStr);
  if (timestamp === null) return timeStr;

  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `今天 ${hours}:${minutes}`;
};

/**
 * 从消息对象获取显示时间
 */
export const getDisplayTime = (message: ChatMessage): string => {
  // 如果有预设的格式化时间，直接返回
  if (message._formattedTime) return message._formattedTime;

  // 如果没有时间，返回空字符串
  if (!message.time) {
    const timestamp = getMessageTimestamp(message);
    if (timestamp === null) return "";
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `今天 ${hours}:${minutes}`;
  }

  // 通话消息保持原始格式（如 "今天 16:12" 或 "8-3 13:48"）
  if (message.messageType === 'call') {
    return message.time;
  }

  // 其他消息统一格式化为 "今天 HH:mm"
  return formatMessageTime(message.time);
};

// ========== 兼容旧版本导出 ==========
export const useShouldShowTimeStamp = shouldShowTimeStamp;
export const useFormatMessageTime = formatMessageTime;