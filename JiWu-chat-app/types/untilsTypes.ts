import type { Ref } from "vue";
import type { ChatMessage, Contact, SelectedImage, SelectedVideo } from "./chatTypes";

export interface SelectedVoice {
    id: string;
    file: File;
    duration?: number;
    tempFilename?: string;
    mediaType: "voice";
}

export interface VoiceHandlerOptions {
    selectedMedias: Ref<SelectedVoice[]>;
    lastMediaSelectionTime: Ref<number | null>;
    activeContact: Ref<any>;
}

export interface SelectedFile {
    id: string;
    file: File;
    previewUrl?: string;
    tempFilename?: string;
    size?: number;
    originalName?: string;
    mimeType?: string;
    mediaType: "file";
}

export interface FileHandlerOptions {
    selectedFiles: Ref<SelectedFile[]>;
    lastFileSelectionTime: Ref<number | null>;
    lastFileSendTime: Ref<number | null>;
    activeContact: Ref<any>;
}

export interface FriendRequest {
    id: number;
    userId: number;
    friendId: number;
    status: "pending" | "accepted" | "rejected" | "blocked";
    remark: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: number;
        username: string;
        nickname: string;
        avatar: string;
        bio: string;
        status: number;
        phone: string;
    };
    requestType: "sent" | "received";
}

export interface Friend {
    id: number;
    userId: number;
    friendId: number;
    status: "pending" | "accepted" | "rejected" | "blocked";
    remark: string | null;
    createdAt: string;
    updatedAt: string;
    unreadCount?: number;
    friendUser?: {
        id: number;
        username: string;
        nickname: string;
        avatar: string;
        status: number;
        bio: string;
        onlineVisibility?: number;
    };
}

export interface UserSearchResult {
    id: number;
    username: string;
    nickname: string;
    avatar: string;
    bio: string;
}

export interface PricingFeature {
    text: string;
    available: boolean;
}

export interface DownloadPlatform {
    key: string;
    label: string;
    tooltip: string;
    downloadUrl: string;
    arch?: string;
    /** 文件名（含格式后缀），用于下拉框展示，如 JiwuChat_2.1.4_x64-setup.exe */
    filename?: string;
}

export interface TextSegment {
    text: string;
    highlighted: boolean;
}

export interface MessagePageState {
    contacts: Contact[];
    activeContactId: string;
    currentUserId: string;
}

export interface MessagePageOptions {
    contacts: Contact[];
    activeContactId: { value: string };
    currentUserId: string;
    rightChatAreaRef?: any;
    router?: any;
    notificationComponentRef?: any;
    statusBarNotificationRef?: any;
}

export interface ComponentContact {
    id: string;
    name: string;
    avatar: string;
    lastMessage?: string;
    lastMessageTime?: string;
    lastMessageAt?: string;
    unreadCount?: number;
    isOnline?: boolean;
    remark?: string;
    isTop?: boolean;
    isMuted?: boolean;
    isGroup?: boolean;
    groupNumber?: string;
    groupOwnerId?: string;
    messages?: any[];
    myGroupNickname?: string;
}

export interface UploadedFile {
    name: string;
    type: string;
    size: number;
    url: string;
    tempFilename?: string;
    file?: File;
}

export interface SubmitReportData {
    contactId: string | number;
    isGroup: boolean;
    reason: string;
    description: string;
    tempFiles?: Array<{
        tempFilename?: string;
        name: string;
        type: string;
        size: number;
    }>;
}

export interface ProcessReportParams {
    status: "pending" | "processing" | "resolved" | "rejected";
    adminNote?: string;
}

export interface ProcessReportResponse {
    id: number;
    status: string;
    adminNote: string | null;
    processedAt: string | null;
    processedBy: number;
}

export interface SelectedFileItem {
    id: string;
    file: File;
    uploadProgress?: number;
    isUploading?: boolean;
    tempFilename?: string;
    originalName?: string;
    mimeType?: string;
}

export interface SendMessageOptions {
    messageTextareaRef: HTMLElement | null;
    selectedImages: Ref<SelectedImage[]>;
    selectedVideos: Ref<SelectedVideo[]>;
    selectedFiles?: Ref<SelectedFileItem[]>;
    lastImageSendTime: Ref<number | null>;
    lastVideoSendTime: Ref<number | null>;
    lastTextSendTime: Ref<number | null>;
    lastFileSendTime?: Ref<number | null>;
    newMessage: Ref<string>;
    messagesContainerRef: HTMLElement | null;
    scrollToBottom: () => void;
    userStore: any;
    activeContactId: string | number;
    getOptions: any;
    rightChatAreaRef?: any;
}

export interface SignalingMessage {
    type:
    | "call_offer"
    | "call_answer"
    | "ice_candidate"
    | "end_call"
    | "screen_share_start"
    | "screen_share_end"
    | "call_answered";
    from: string;
    to: string;
    data: any;
    callerName?: string;
    callerAvatar?: string;
    callType?: "audio" | "video";
}

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

export enum CallStatus {
    IDLE = "idle",
    RINGING = "ringing",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    ENDED = "ended",
}

export enum SignalingMessageType {
    CALL_OFFER = "call_offer",
    CALL_ANSWER = "call_answer",
    CALL_ANSWERED = "call_answered",
    ICE_CANDIDATE = "ice_candidate",
    END_CALL = "end_call",
}

export interface CallManagerOptions {
    userId: string;
    contactId: string;
    callType: "audio" | "video";
    rtcConfig?: RTCConfiguration;
    onStatusChange: (status: CallStatus) => void;
    onRemoteStream: (stream: MediaStream) => void;
    onError: (error: Error) => void;
    callerName?: string;
    callerAvatar?: string;
    onStatsUpdate?: (stats: CallStats) => void;
    timeoutDuration?: number;
}

export interface CallStats {
    rtt: number;
    jitter: number;
    packetsLost: number;
    packetsReceived: number;
    packetsSent: number;
    timestamp: number;
}

export interface ChatAreaManagerOptions {
    contacts: Contact[];
    activeContactId: string | number;
    currentUserId: string | number;
    newMessage: { value: string };
    isTop: { value: boolean };
    isMuted: { value: boolean };
    showContactDrawer: { value: boolean };
    isEditingRule: { value: boolean };
    tempGroupRule: { value: string };
    defaultGroupRule: { value: string };
    showAllMembers: { value: boolean };
    tempRemark: { value: string };
    remarkEditableRef: { value: HTMLElement | null };
    activeContact: { value: Contact | undefined };
    emit: (event: string, ...args: any[]) => void;
}
