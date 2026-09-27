/**
 * 通话记录消息工具
 * 用于在挂断/取消/拒绝通话时，向聊天记录中插入通话消息
 */
import request from "./request";
import type { Contact, ChatMessage } from "../types/chatTypes";

/** 通话状态对应的显示文案 */
const CALL_STATUS_TEXT: Record<string, { self: string; peer: string }> = {
    cancelled: { self: "已取消", peer: "对方已取消" },
    missed: { self: "对方未接听", peer: "未接听" },
    rejected: { self: "已拒绝", peer: "对方已拒绝" },
    ended: { self: "通话结束", peer: "通话结束" },
};

/** 通话类型图标 */
const CALL_TYPE_LABEL: Record<string, string> = {
    audio: "语音通话",
    video: "视频通话",
};

/**
 * 格式化通话时长为 mm:ss
 */
export const formatCallDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * 生成本地通话消息对象（不发送到服务器，仅用于本地展示）
 */
export const createCallMessage = (
    currentUserId: string,
    contactId: string,
    callType: "audio" | "video",
    callStatus: "missed" | "cancelled" | "ended" | "rejected",
    callDuration: number,
    isMe: boolean,
    senderInfo?: { nickname?: string; username?: string; avatar?: string; id?: string },
): ChatMessage => {
    const now = Date.now();
    const time = new Date(now).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const statusTextMap = CALL_STATUS_TEXT[callStatus] || CALL_STATUS_TEXT.ended;
    const typeLabel = CALL_TYPE_LABEL[callType] || "通话";

    let content: string;
    if (callStatus === "ended" && callDuration > 0) {
        content = `${typeLabel} ${formatCallDuration(callDuration)}`;
    } else {
        content = `${typeLabel} ${isMe ? statusTextMap.self : statusTextMap.peer}`;
    }

    return {
        id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        time,
        createdAt: new Date(now).toISOString(),
        _timestamp: now,
        isMe,
        senderId: isMe ? currentUserId : contactId,
        senderName: senderInfo?.nickname || senderInfo?.username || "",
        messageType: "call",
        callType,
        callStatus,
        callDuration,
        sender: {
            id: isMe ? currentUserId : contactId,
            nickname: senderInfo?.nickname,
            username: senderInfo?.username,
            avatar: senderInfo?.avatar || "",
        },
    };
};

/**
 * 向联系人消息列表插入通话记录消息
 * 同时更新 lastMessage
 */
export const insertCallMessageToContact = (
    contacts: Contact[],
    contactId: string,
    callMessage: ChatMessage,
) => {
    const contact = contacts.find((c) => String(c.id) === contactId);
    if (!contact) return;

    if (!Array.isArray(contact.messages)) {
        contact.messages = [];
    }

    // 避免重复插入（检查最近一条是否已经是相同的通话消息）
    const lastMsg = contact.messages[contact.messages.length - 1];
    if (
        lastMsg &&
        lastMsg.messageType === "call" &&
        lastMsg.callType === callMessage.callType &&
        lastMsg.callStatus === callMessage.callStatus &&
        lastMsg.isMe === callMessage.isMe &&
        lastMsg._timestamp &&
        callMessage._timestamp &&
        Math.abs(lastMsg._timestamp - callMessage._timestamp) < 5000
    ) {
        return; // 5秒内重复消息不插入
    }

    contact.messages.push(callMessage);
    // lastMessage 使用 content 文本（本地消息直接是文本，后端消息是 JSON）
    const lastMsgText = typeof callMessage.content === "string"
        ? callMessage.content
        : (callMessage.content as any)?.text || "[通话]";
    contact.lastMessage = lastMsgText;
    contact.lastMessageTime = callMessage.time;
};

/**
 * 发送通话记录到服务器（通过 HTTP API）
 */
export const sendCallRecordToServer = async (
    contactId: string,
    callType: "audio" | "video",
    callStatus: "missed" | "cancelled" | "ended" | "rejected",
    callDuration: number,
) => {
    try {
        const isGroup = contactId.startsWith("group_");
        const pureId = isGroup ? contactId.replace("group_", "") : contactId;

        await request.post("/message/call", {
            ...(isGroup ? { groupId: pureId } : { receiverId: pureId }),
            callType,
            callStatus,
            callDuration,
        });
    } catch (error) {
        // 静默失败，本地消息已经显示了
        console.error("发送通话记录失败:", error);
    }
};
