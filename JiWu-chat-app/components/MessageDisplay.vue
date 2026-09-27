<template>
  <div class="chat-session-section" :style="chatSectionStyle">
    <!-- 连接状态提示栏 -->
    <div v-if="connectionStatus !== 'connected'" class="connection-status-bar">
      <div class="status-indicator" :class="connectionStatus"></div>
      <span class="status-text">{{ connectionStatusText }}</span>
    </div>

    <!-- 消息滚动区外层：用于承载"滚动条 hover 区" -->
    <div class="messages-scroll-host">
      <!-- 消息列表容器 -->
      <div
        class="messages-container"
        ref="messagesContainerRef"
        :style="{ height: '100%', overflowY: 'auto' }"
        @scroll="handleScroll"
      >
        <!-- 加载更多历史 -->
        <div v-if="loadingMoreHistory" class="loading-more-history">
          <LoadingOutlined spin />
          <span>加载中...</span>
        </div>

        <!-- 入群通知 -->
        <div v-if="showJoinGroupNotice" class="join-group-notice-wrapper">
          <div class="join-group-time" :style="chatFontStyle">
            {{ activeContact?.joinMessages?.[0]?.time || "" }}
          </div>
          <div class="join-group-text">
            <span class="join-tag">{{ joinMessageDisplayText }}</span>
          </div>
        </div>

        <!-- 消息列表 -->
        <div v-if="activeContact && activeContact.messages.length">
          <div
            v-for="(message, index) in activeContact.messages"
            :key="message.id || index"
            class="message-wrapper"
            :class="{
              'selected-message':
                isMultiSelectMode && message.id && selectedMessageIds.has(message.id),
              'has-checkbox': isMultiSelectMode && !message.isRecalled,
              'my-message-wrapper': (isSelfChat || message.isMe) && !message.isRecalled,
              'recalled-message-wrapper': message.isRecalled,
              'sending-message': message.status === 'sending',
              'failed-message': message.status === 'failed',
            }"
            :id="`message-${message.id}`"
          >
            <!-- 新消息分割线 - 仅在群聊中显示 -->
            <div
              v-if="
                activeContact?.isGroup &&
                shouldShowNewMessageDivider(message, index, activeContact.messages || [])
              "
              class="new-message-divider"
            >
              <div class="divider-line"></div>
              <span class="divider-text">新消息</span>
              <div class="divider-line"></div>
            </div>

            <!-- 多选复选框 -->
            <div
              v-if="isMultiSelectMode && !message.isRecalled"
              class="message-checkbox"
              @click.stop="toggleMessageSelection(message)"
            >
              <div
                class="checkbox-circle"
                :class="{
                  'checkbox-checked': message.id && selectedMessageIds.has(message.id),
                }"
              >
                <CheckOutlined
                  v-if="message.id && selectedMessageIds.has(message.id)"
                  class="checkmark-icon"
                />
              </div>
            </div>

            <!-- 撤回消息 -->
            <div v-if="message.isRecalled" class="recalled-message-hint-wrapper">
              <div v-if="shouldShowTimeStampLocal(message, index)" class="message-timestamp">
                {{ message.time }}
              </div>
              <div class="recalled-content-row">
                <span class="recalled-text">{{ getRecallText(message) }}</span>
                <span
                  v-if="message.isMe && message.recalledContent"
                  class="re-edit-link"
                  @click.stop="handleReEditRecalledMessage(message)"
                >
                  重新编辑
                </span>
                <i
                  v-if="message.isMe"
                  class="iconfont icon-guanbi delete-recalled-btn"
                  @click.stop="handleDeleteRecalledMessage(message)"
                ></i>
              </div>
            </div>

            <!-- 正常消息时间戳 -->
            <template v-else>
              <div v-if="shouldShowTimeStampLocal(message, index)" class="message-timestamp">
                {{ message.time }}
              </div>
            </template>

            <!-- 消息主体 -->
            <div
              class="message-item"
              :class="{ 'my-message': isSelfChat || message.isMe }"
              v-if="!message.isRecalled"
            >
              <!-- 头像 -->
              <a-avatar
                :size="36"
                :src="getMessageAvatar(message)"
                class="message-avatar"
                style="cursor: pointer; flex-shrink: 0"
                @click="handleAvatarClick(message)"
              />

              <!-- 消息内容区 -->
              <div class="message-content">
                <!-- 群聊发送者名称 -->
                <div v-if="activeContact?.isGroup" class="message-sender-name">
                  <span
                    v-if="getMessageLevelBadge(message)"
                    class="level-badge-combined"
                    :class="getLevelBadgeClass(message)"
                    @click="handleTitleClick(message)"
                  >
                    {{ getMessageLevelBadge(message) }}
                  </span>
                  <span class="sender-nickname">
                    {{
                      message.sender?.groupNickname ||
                      message.sender?.nickname ||
                      message.sender?.username
                    }}
                  </span>
                </div>

                <!-- 系统消息卡片 -->
                <SystemMessageCard
                  v-if="isSystemMessage(message)"
                  :message="message"
                  :current-user-id="currentUserId"
                  @open-detail="handleOpenSystemMessageDetail"
                />

                <!-- 消息气泡 -->
                <div
                  v-else
                  class="message-bubble"
                  :class="{
                    'my-bubble': isSelfChat || message.isMe,
                    'other-bubble': !(isSelfChat || message.isMe),
                    'image-bubble': message.messageType === 'image',
                    'video-bubble': message.messageType === 'video',
                    'file-bubble': message.messageType === 'file',
                  }"
                  :style="getBubbleStyle(message)"
                  @click="handleMessageClick($event)"
                >
                  <!-- 图片消息 -->
                  <div v-if="message.messageType === 'image'" class="message-image-container">
                    <img
                      :src="message.content"
                      class="message-image"
                      loading="lazy"
                      alt="图片"
                      @click.stop="handleImageClick($event)"
                      @dblclick.stop="previewImage(message.content)"
                      @error="(e) => handleImageError(e, message)"
                    />
                  </div>

                  <!-- 视频消息 -->
                  <div v-else-if="message.messageType === 'video'" class="message-video-container">
                    <video
                      :src="message.content"
                      class="message-video"
                      disablePictureInPicture
                      loading="lazy"
                      loop
                      @click.stop="handleVideoClick($event)"
                      @dblclick.stop="previewVideo(message.content)"
                      @mouseenter="playVideoOnHover($event)"
                      @mouseleave="pauseVideoOnLeave($event)"
                      @error="(e) => handleVideoError(e, message)"
                    >
                      你的浏览器不支持视频播放
                    </video>
                  </div>

                  <!-- 文件消息 -->
                  <div
                    v-else-if="message.messageType === 'file'"
                    class="message-file-container"
                    @click.stop="handleFileClick(message)"
                  >
                    <div class="file-icon-wrapper">
                      <i :class="getFileIconClass(message)" class="file-icon"></i>
                    </div>
                    <div class="file-info">
                      <div class="file-name" :title="getFileName(message)">
                        {{ getFileName(message) }}
                      </div>
                      <div class="file-meta">
                        <span class="file-size">{{ formatMessageFileSize(message) }}</span>
                        <span class="file-type">{{ getFileTypeLabel(message) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 系统文本消息 -->
                  <div v-else-if="message.messageType === 'system'" class="system-message-content">
                    {{ message.content }}
                  </div>

                  <!-- 通话消息 -->
                  <div v-else-if="message.messageType === 'call'" class="call-message-content">
                    <div class="call-info-row">
                      <i
                        class="iconfont call-type-icon"
                        :class="
                          message.callType === 'video' ? 'icon-shipintonghua' : 'icon-yuyintonghua'
                        "
                      ></i>
                      <span class="call-status-text">{{ message.content }}</span>
                      <template
                        v-if="
                          message.callStatus === 'missed' ||
                          message.callStatus === 'cancelled' ||
                          message.callStatus === 'rejected'
                        "
                      >
                        <span class="call-redial-inline" @click.stop="handleRedial(message)">
                          重拨
                        </span>
                      </template>
                    </div>
                  </div>

                  <!-- 普通文本消息 -->
                  <div
                    v-else
                    class="text-message-content"
                    :class="{
                      'emoji-only-message': isOnlyEmoji(message.content),
                    }"
                  >
                    <span
                      v-for="(segment, segmentIndex) in segmentHighlightedText(
                        message.content,
                        searchKeyword,
                      )"
                      :key="segmentIndex"
                      :class="{ highlight: segment.highlighted }"
                      >{{ segment.text }}</span
                    >
                  </div>
                </div>

                <!-- 发送状态指示器 -->
                <div
                  v-if="
                    message.isMe && (message.status === 'sending' || message.status === 'failed')
                  "
                  class="message-status-indicator"
                >
                  <span v-if="message.status === 'sending'" class="sending-text">发送中...</span>
                  <span v-if="message.status === 'failed'" class="failed-text">发送失败</span>
                  <a-button
                    v-if="message.status === 'failed'"
                    size="small"
                    type="link"
                    @click="retrySendMessage(message)"
                    class="retry-button"
                  >
                    重试
                  </a-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ✅ 自定义滚动条：只有鼠标经过这条窄边时才显示 -->
      <div
        class="scroll-hover-zone"
        @mouseenter="onScrollZoneEnter"
        @mouseleave="onScrollZoneLeave"
      >
        <div
          class="scroll-thumb"
          :class="{ 'is-visible': scrollbarVisible }"
          :style="scrollThumbStyle"
          @mousedown.prevent="startDragThumb"
        ></div>
      </div>
    </div>

    <!-- 多选底部工具栏 -->
    <div v-if="isMultiSelectMode" class="multi-select-bottom-bar">
      <div class="bottom-bar-content">
        <div class="selection-info">
          <span class="select-all-btn" @click.stop="handleSelectAll">
            {{ isAllSelected ? "取消全选" : "全选" }}
          </span>
          <span style="margin-left: 10px"> 已选择 {{ selectedMessageIds.size }} 条消息 </span>
        </div>
        <div class="bottom-actions right-actions">
          <div class="action-item cancel-action" @click="handleCancelMultiSelect">
            <i class="iconfont icon-guanbi1"></i>
          </div>
          <div class="action-item" @click="handleForwardSelected">
            <i class="iconfont icon-zhuanfa"></i>
          </div>
          <div class="action-item" @click="handleCollectSelected">
            <i class="iconfont icon-shoucang"></i>
          </div>
          <div class="action-item" @click="handleMergeForward">
            <i class="iconfont icon-hebingzhuanfa"></i>
          </div>
          <div class="action-item" @click="handleShareSelected">
            <i class="iconfont icon-fenxiang"></i>
          </div>
          <div class="action-item danger" @click="handleBatchDelete">
            <i class="iconfont icon-shanchu"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗组件 -->
    <UserProfileModal
      :visible="userProfileModalVisible"
      :userId="userProfileModalUserId"
      :position="userProfileModalPosition"
      :anchor-x="userProfileModalAnchorX"
      :groupId="activeContact?.isGroup ? Number(activeContact.id) : null"
      :current-user-id="currentUserId"
      @update:visible="userProfileModalVisible = $event"
      @add-friend="handleAddFriendFromProfile"
      @send-message="handleSendMessageFromProfile"
      @report="handleReportFromProfile"
    />

    <SystemMessageDetailModal
      :visible="systemMessageDetailVisible"
      :message="systemMessageDetailData"
      :current-user-id="currentUserId"
      @update:visible="systemMessageDetailVisible = $event"
      @close="handleSystemMessageDetailClose"
      @refresh-messages="emit('refresh-messages')"
      @refresh-contacts="emit('refresh-contacts')"
    />

    <GroupTitleModal
      :visible="groupTitleModalVisible"
      :userId="groupTitleModalUserId"
      :groupId="groupTitleModalGroupId"
      :current-title="groupTitleModalCurrentTitle"
      :username="groupTitleModalUsername"
      :user-avatar="groupTitleModalUserAvatar"
      :user-level="groupTitleModalUserLevel"
      @update:visible="groupTitleModalVisible = $event"
      @success="handleGroupTitleSuccess"
    />

    <FilePreview
      v-if="filePreviewVisible && filePreviewData"
      :visible="filePreviewVisible"
      :file="filePreviewData"
      :file-list="filePreviewList"
      :current-index="filePreviewCurrentIndex"
      @close="handleFilePreviewClose"
      @update:current-index="filePreviewCurrentIndex = $event"
      @delete-file="handleDeleteFileFromPreview"
      @download="handleDownloadFileFromPreview"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch, onUnmounted } from "vue";
import { message as antMessage, Modal } from "ant-design-vue";
import { CheckOutlined, LoadingOutlined } from "@ant-design/icons-vue";
import request from "../untils/request";
import type { Contact, ChatMessage } from "../types/chatTypes";
import type { SelectedFile } from "../types/untilsTypes";
import { segmentHighlightedText } from "../untils/htmlSecurity";
import { shouldShowTimeStamp, shouldShowNewMessageDivider } from "../untils/rightchat";
import { useSiderColor } from "../stores/siderColor";
import { useUserStore } from "../stores/user";
import { useGroupLevelBadgeStore } from "../stores/groupLevelBadge";

import {
  getCustomRecallText,
  updateContactLastMessage,
  getChatHistory,
} from "../untils/contactManager";
import { getLevelTitle } from "../untils/levelUtils";
import {
  getFileExtension,
  getFileName,
  getFileIconClass,
  getFileTypeLabel,
  formatMessageFileSize,
  getMimeType,
} from "../untils/fileHandler";

const siderColorStore = useSiderColor();
const badgeStore = useGroupLevelBadgeStore();

// 系统消息类型列表
const SYSTEM_MESSAGE_TYPES = [
  "group_invite_pending",
  "group_invite_accepted",
  "group_invite_rejected",
  "group_notification",
];

// 判断是否为系统消息
const isSystemMessage = (message: ChatMessage): boolean => {
  if (!message || !message.messageType) {
    return false;
  }
  return SYSTEM_MESSAGE_TYPES.includes(message.messageType);
};

// ============================================================
// Props 和 Emits
// ============================================================
interface Props {
  activeContact: Contact | null;
  showJoinGroupNotice?: boolean;
  joinMessageDisplayText?: string;
  isSelfChat: boolean;
  searchKeyword: string;
  contacts: Contact[];
  currentUserId: number;
  isMultiSelectMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showJoinGroupNotice: false,
  joinMessageDisplayText: "",
  contacts: () => [],
  currentUserId: 0,
  isMultiSelectMode: false,
});

const emit = defineEmits<{
  (e: "previewImage", imageUrl: string): void;
  (e: "previewVideo", videoUrl: string): void;
  (e: "previewFile", fileInfo: { url: string; filename: string; size: number; type: string }): void;
  (e: "playVideoOnHover", event: MouseEvent): void;
  (e: "pauseVideoOnLeave", event: MouseEvent): void;
  (e: "messageDeleted", message: ChatMessage): void;
  (e: "context-menu-show", event: MouseEvent, message: ChatMessage): void;
  (e: "context-menu-close"): void;
  (e: "show-add-friend-modal", userId: number): void;
  (e: "show-report-modal", contact: { id: number; isGroup: boolean }): void;
  (e: "contact-select", contactId: string): void;
  (e: "add-friend", userId: number): void;
  (e: "send-message", payload: { userId: number; userInfo: any }): void;
  (e: "report", userId: number): void;
  (e: "refresh-messages"): void;
  (e: "refresh-contacts"): void;
  (e: "re-edit-message", content: string): void;
  (e: "re-edit-image", imageUrl: string): void;
  (e: "re-edit-video", videoUrl: string): void;
  (e: "toggle-multi-select-mode"): void;
  (e: "select-message", messageId: string | number): void;
  (e: "batch-delete"): void;
  (e: "redial-call", payload: { callType: string; contactId?: string | number }): void;
}>();

/**
 * 格式化通话时长
 */
const formatCallDuration = (duration: number): string => {
  if (!duration || duration <= 0) return "";

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  if (minutes > 0) {
    return `${minutes}分${seconds}秒`;
  }
  return `${seconds}秒`;
};

// ============================================================
// 主题样式相关
// ============================================================
const chatSectionStyle = computed(() => {
  const palette = siderColorStore.currentColorPalette;
  return {
    background:
      palette.chatBgGradient || `linear-gradient(180deg, ${palette.light} 0%, transparent 100%)`,
    "--theme-primary": palette.textPrimary || palette.color,
    "--theme-active": palette.active,
    "--theme-hover": palette.hover,
    "--theme-light": palette.light,
    "--chat-primary-color": palette.textPrimary || palette.color,
    "--chat-active-color": palette.active,
    "--chat-hover-color": palette.hover,
    // ✅ 气泡核心变量（无阴影）
    "--message-bubble-bg": siderColorStore.bubbleBg,
    "--message-bubble-border": siderColorStore.bubbleBorder,
    "--message-bubble-text": siderColorStore.bubbleTextColor,
    "--text-primary": siderColorStore.textPrimaryColor,
    "--text-secondary": siderColorStore.textSecondaryColor,
    "--bg-primary": siderColorStore.bgPrimaryColor,
    "--bg-tertiary": siderColorStore.bgTertiaryColor,
    "--border-light": siderColorStore.borderLightColor,
    "--border-normal": siderColorStore.borderNormalColor,
    "--tag-bg": siderColorStore.tagBgColor,
    "--tag-color": siderColorStore.tagTextColor,
    "--link-color": siderColorStore.linkColorValue,
    "--danger-color": siderColorStore.dangerColorValue,
    "--highlight-bg": siderColorStore.highlightBgColor,
    "--highlight-color": siderColorStore.highlightColorValue,
    "--selected-bg": siderColorStore.selectedBgColor,
    "--primary-light": siderColorStore.primaryLightColor,
    "--scrollbar-track": siderColorStore.scrollbarTrackColor,
    "--scrollbar-thumb": siderColorStore.scrollbarThumbColor,
    "--divider-line-color": siderColorStore.dividerLineColorValue,
    "--divider-text-color": siderColorStore.dividerTextColorValue,
  };
});

const chatFontStyle = computed(() => ({
  color: siderColorStore.currentColorPalette.text,
}));

const currentColorPalette = computed(() => {
  return siderColorStore.currentColorPalette;
});

const isSelfChat = computed(() => props.isSelfChat);

/**
 * 获取消息气泡样式（无阴影）
 */
const getBubbleStyle = (message: ChatMessage) => {
  const palette = currentColorPalette.value;
  const style: Record<string, string> = {};

  // 图片、视频、文件消息不应用气泡样式
  if (
    message.messageType === "image" ||
    message.messageType === "video" ||
    message.messageType === "file"
  ) {
    return style;
  }

  const bg = siderColorStore.bubbleBg || palette.bubbleBg || palette.bgPrimary || "#FFFFFF";
  const text = siderColorStore.bubbleTextColor || palette.textPrimary || palette.text || "#1A1A1A";
  const border =
    siderColorStore.bubbleBorder || `1px solid ${palette.borderLight || "rgba(0,0,0,0.08)"}`;

  style.backgroundColor = bg;
  style.color = text;
  style.border = border;
  // ✅ 不设置 boxShadow

  return style;
};

// ============================================================
// 状态管理
// ============================================================
const messagesContainerRef = ref<HTMLElement | null>(null);
const imageLoadErrors = ref<Record<string, boolean>>({});
const videoLoadErrors = ref<Record<string, boolean>>({});
const userProfileModalVisible = ref(false);
const userProfileModalUserId = ref<number | null>(null);
const userProfileModalPosition = ref<"left" | "right">("right");
const userProfileModalAnchorX = ref(0);
const systemMessageDetailVisible = ref(false);
const systemMessageDetailData = ref<ChatMessage | null>(null);
const selectedMessageIds = ref<Set<string | number>>(new Set());

// 滚动加载
const loadingMoreHistory = ref(false);
const hasMoreHistory = ref(true);
const currentPage = ref(1);
const scrollThreshold = 100;

// ============================================================
// ✅ 自定义滚动条状态（高性能版）
// ============================================================
const scrollbarVisible = ref(false); // 鼠标是否在滚动条 hover 区
const scrollThumbTop = ref(0); // 滑块 top（px）
const scrollThumbHeight = ref(0); // 滑块高度（px）
const hasScrollbar = ref(false); // 内容是否超出，需要滚动条

let draggingThumb = false;
let dragStartY = 0;
let dragStartScrollTop = 0;
let rafId: number | null = null; // 拖动用的 rAF 句柄
let syncRafId: number | null = null; // 同步用的 rAF 句柄

/** 同步滚动条几何（用 rAF 节流，避免滚动高频触发） */
const syncScrollbar = () => {
  if (syncRafId !== null) return;
  syncRafId = requestAnimationFrame(() => {
    syncRafId = null;
    const c = messagesContainerRef.value;
    if (!c) return;

    const { scrollTop, scrollHeight, clientHeight } = c;

    if (scrollHeight <= clientHeight) {
      hasScrollbar.value = false;
      scrollThumbHeight.value = 0;
      scrollThumbTop.value = 0;
      return;
    }

    hasScrollbar.value = true;

    const ratio = clientHeight / scrollHeight;
    const thumbH = Math.max(24, clientHeight * ratio);
    const maxTop = clientHeight - thumbH;
    const maxScroll = scrollHeight - clientHeight;
    const top = maxScroll > 0 ? (scrollTop / maxScroll) * maxTop : 0;

    // 只在变化时赋值，避免无意义响应式触发
    if (scrollThumbHeight.value !== thumbH) scrollThumbHeight.value = thumbH;
    if (scrollThumbTop.value !== top) scrollThumbTop.value = top;
  });
};

const scrollThumbStyle = computed(() => {
  if (!hasScrollbar.value) return { visibility: "hidden" as const, opacity: 0 };
  return {
    height: `${scrollThumbHeight.value}px`,
    transform: `translateY(${scrollThumbTop.value}px)`,
  };
});

/** 鼠标进入滚动条 hover 区 */
const onScrollZoneEnter = (e: MouseEvent) => {
  const related = e.relatedTarget as Node | null;
  if (related && (e.currentTarget as HTMLElement).contains(related)) return;
  if (!hasScrollbar.value) return;
  scrollbarVisible.value = true;
};

/** 鼠标离开滚动条 hover 区 */
const onScrollZoneLeave = (e: MouseEvent) => {
  const related = e.relatedTarget as Node | null;
  if (related && (e.currentTarget as HTMLElement).contains(related)) return;
  if (draggingThumb) return;
  scrollbarVisible.value = false;
};

/** 拖动滑块（rAF 节流） */
const startDragThumb = (e: MouseEvent) => {
  draggingThumb = true;
  scrollbarVisible.value = true;
  dragStartY = e.clientY;
  dragStartScrollTop = messagesContainerRef.value?.scrollTop || 0;

  document.body.style.userSelect = "none";
  window.addEventListener("mousemove", onDragThumb);
  window.addEventListener("mouseup", stopDragThumb);
};

const onDragThumb = (e: MouseEvent) => {
  if (!draggingThumb) return;
  if (rafId !== null) return;

  const clientY = e.clientY;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    const c = messagesContainerRef.value;
    if (!c) return;

    const deltaY = clientY - dragStartY;
    const { scrollHeight, clientHeight } = c;
    const maxTop = clientHeight - scrollThumbHeight.value;
    if (maxTop <= 0) return;

    const maxScroll = scrollHeight - clientHeight;
    const scrollDelta = (deltaY / maxTop) * maxScroll;
    c.scrollTop = dragStartScrollTop + scrollDelta;
  });
};

const stopDragThumb = () => {
  draggingThumb = false;
  document.body.style.userSelect = "";
  window.removeEventListener("mousemove", onDragThumb);
  window.removeEventListener("mouseup", stopDragThumb);
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
};

// 群头衔弹窗
const groupTitleModalVisible = ref(false);
const groupTitleModalGroupId = ref<number | null>(null);
const groupTitleModalUserId = ref<number | null>(null);
const groupTitleModalCurrentTitle = ref("");
const groupTitleModalUsername = ref("");
const groupTitleModalUserAvatar = ref("");
const groupTitleModalUserLevel = ref(0);

// 文件预览
const filePreviewVisible = ref(false);
const filePreviewData = ref<SelectedFile | null>(null);
const filePreviewList = ref<SelectedFile[]>([]);
const filePreviewCurrentIndex = ref(0);

// ============================================================
// 多选功能
// ============================================================
const isAllSelected = computed(() => {
  if (!props.activeContact?.messages?.length) return false;
  const validMessages = props.activeContact.messages.filter((m) => !m.isRecalled && m.id);
  return (
    validMessages.length > 0 && validMessages.every((m) => selectedMessageIds.value.has(m.id!))
  );
});

const toggleMessageSelection = (message: ChatMessage) => {
  if (!message.id) return;
  if (selectedMessageIds.value.has(message.id)) {
    selectedMessageIds.value.delete(message.id);
  } else {
    selectedMessageIds.value.add(message.id);
  }
};

const handleSelectAll = () => {
  if (!props.activeContact?.messages) return;

  if (isAllSelected.value) {
    selectedMessageIds.value.clear();
  } else {
    props.activeContact.messages.forEach((m) => {
      if (m.id && !m.isRecalled) {
        selectedMessageIds.value.add(m.id);
      }
    });
  }
};

const handleCancelMultiSelect = () => {
  selectedMessageIds.value.clear();
  emit("toggle-multi-select-mode");
};

const handleBatchDelete = async () => {
  if (selectedMessageIds.value.size === 0) {
    antMessage.warning("请先选择要删除的消息");
    return;
  }
  try {
    await Modal.confirm({
      title: "删除确认",
      content: "确定删除？删除后无法恢复。",
      okText: "确定",
      cancelText: "取消",
    });

    const messageIds = Array.from(selectedMessageIds.value).filter((id) => id);
    if (messageIds.length === 0) {
      antMessage.warning("没有有效的消息ID");
      return;
    }

    const response = await request.post("/message/batch", {
      messageIds: messageIds.map((id) => Number(id)),
    });

    if (response.data) {
      antMessage.success("删除成功");
      messageIds.forEach((id) => {
        const messageToDelete = props.activeContact?.messages.find((m) => m.id === id);
        if (messageToDelete) {
          emit("messageDeleted", messageToDelete);
        }
      });
    } else {
      throw new Error(response.data?.message || "删除失败");
    }

    selectedMessageIds.value.clear();
    emit("toggle-multi-select-mode");
  } catch (e: any) {
    if (e !== "cancel") {
      const errorMessage = e.response?.data?.message || "删除失败";
      antMessage.error(errorMessage);
    }
  }
};

const handleForwardSelected = () => antMessage.info("开发中");
const handleCollectSelected = () => antMessage.info("开发中");
const handleMergeForward = () => antMessage.info("开发中");
const handleShareSelected = () => antMessage.info("开发中");

// ============================================================
// 群组相关功能
// ============================================================
const getMessageLevelBadge = (m: ChatMessage): string => {
  if (!props.activeContact?.isGroup) return "";
  const member = props.activeContact.groupMembers?.find(
    (g: any) => String(g.id) === String(m.senderId),
  );
  if (!member) return "";
  const level = member.chatLevel ?? 1;

  if (member.groupTitle && !member.useDefaultTitle) return `LV${level} ${member.groupTitle}`;
  if (member.role === "owner") return `LV${level} 群主`;
  if (member.role === "admin") return `LV${level} 管理员`;
  return `LV${level} ${getLevelTitle(level)}`;
};

const getLevelBadgeClass = (m: ChatMessage): string => {
  if (!props.activeContact?.isGroup) return "";
  const member = props.activeContact.groupMembers?.find(
    (g: any) => String(g.id) === String(m.senderId),
  );
  if (!member) return "";
  const level = member.chatLevel ?? 1;

  let titleType = "default";
  if (member.groupTitle && !member.useDefaultTitle) titleType = "custom";
  else if (member.role === "owner") titleType = "owner";
  else if (member.role === "admin") titleType = "admin";

  return badgeStore.getLevelBadgeClass(level, member.role || "", titleType);
};

const canEditTitle = (m: ChatMessage): boolean => {
  if (!props.activeContact?.isGroup) return false;
  const curr = props.activeContact.groupMembers?.find(
    (g) => String(g.id) === String(props.currentUserId),
  );
  const target = props.activeContact.groupMembers?.find((g) => String(g.id) === String(m.senderId));
  if (!curr || !target) return false;
  if (curr.role === "owner") return true;
  if (curr.role === "admin") {
    return target.role !== "owner" && target.role !== "admin";
  }
  return false;
};

const handleTitleClick = (m: ChatMessage) => {
  if (!canEditTitle(m)) return;
  const activeContact = props.activeContact!;
  const member = activeContact.groupMembers?.find((g) => String(g.id) === String(m.senderId));
  let gid = activeContact.id;
  if (typeof gid === "string" && gid.startsWith("group_")) {
    gid = gid.replace("group_", "");
  }
  groupTitleModalGroupId.value = Number(gid) || null;
  groupTitleModalUserId.value = Number(m.senderId);
  groupTitleModalCurrentTitle.value = member?.groupTitle || "";
  groupTitleModalUsername.value = m.sender?.nickname || m.sender?.username || "";
  groupTitleModalUserAvatar.value = m.sender?.avatar || "";
  groupTitleModalUserLevel.value = member?.chatLevel || 1;
  groupTitleModalVisible.value = true;
};

const handleGroupTitleSuccess = (newTitle?: string) => {
  if (!props.activeContact?.isGroup || !groupTitleModalUserId.value) return;
  const m = props.activeContact.groupMembers?.find(
    (g) => String(g.id) === String(groupTitleModalUserId.value),
  );
  if (m) m.groupTitle = newTitle;
};

// ============================================================
// 消息操作
// ============================================================
const handleReEditRecalledMessage = (m: ChatMessage) => {
  if (!m.recalledContent) return;
  if (m.messageType === "image") {
    emit("re-edit-image", m.recalledContent);
  } else if (m.messageType === "video") {
    emit("re-edit-video", m.recalledContent);
  } else {
    emit("re-edit-message", m.recalledContent);
  }
};

const handleDeleteRecalledMessage = async (m: ChatMessage) => {
  try {
    await request.delete(`/message/${m.id}`);
    if (props.activeContact?.messages) {
      props.activeContact.messages = props.activeContact.messages.filter((x) => x.id !== m.id);
      const last = props.activeContact.messages.length
        ? props.activeContact.messages[props.activeContact.messages.length - 1]
        : undefined;
      updateContactLastMessage(
        props.contacts,
        props.activeContact.id,
        last ? (last.isRecalled ? "你撤回了一条消息" : last.content) : "",
        last?.time || "",
      );
    }
    emit("refresh-messages");
  } catch (e: any) {
    antMessage.error(e.response?.data?.message || "删除失败");
  }
};

const handleImageError = (e: Event, m?: ChatMessage) => {
  if (m?.id) imageLoadErrors.value[m.id] = true;
};

const handleVideoError = (e: Event, m: ChatMessage) => {
  if (m.id) videoLoadErrors.value[m.id] = true;
};

const handleFileClick = (message: ChatMessage) => {
  if (!message.content) return;
  let fileInfo: { url: string; filename: string; size: number; type: string };

  try {
    const contentObj =
      typeof message.content === "string" ? JSON.parse(message.content) : message.content;

    fileInfo = {
      url: contentObj.url || message.content,
      filename: contentObj.filename || getFileName(message),
      size: contentObj.size || message.fileSize || 0,
      type: getFileExtension(contentObj.filename || getFileName(message)),
    };
  } catch (e) {
    fileInfo = {
      url: message.content,
      filename: getFileName(message),
      size: message.fileSize || 0,
      type: getFileExtension(getFileName(message)),
    };
  }

  openFilePreview(fileInfo);
};

const openFilePreview = (fileInfo: {
  url: string;
  filename: string;
  size: number;
  type: string;
}) => {
  const mimeType = getMimeType(fileInfo.type);
  const virtualFile = new File([], fileInfo.filename, {
    type: mimeType,
    lastModified: Date.now(),
  });

  Object.defineProperty(virtualFile, "size", {
    value: fileInfo.size || 0,
    writable: false,
  });

  const selectedFile: SelectedFile = {
    id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    file: virtualFile,
    originalName: fileInfo.filename,
    tempFilename: fileInfo.filename,
    previewUrl: fileInfo.url,
    size: fileInfo.size,
    mimeType: mimeType,
    mediaType: "file",
  };

  filePreviewData.value = selectedFile;
  filePreviewList.value = [selectedFile];
  filePreviewCurrentIndex.value = 0;
  filePreviewVisible.value = true;
};

const handleMessageClick = (e: MouseEvent) => e.stopPropagation();
const handleImageClick = (e: MouseEvent) => e.stopPropagation();
const handleVideoClick = (e: MouseEvent) => e.stopPropagation();

const getRecallText = (m: ChatMessage) => {
  const custom = getCustomRecallText();
  return m.isMe ? custom.self || "你撤回了一条消息" : custom.others || "对方撤回了一条消息";
};

const getMessageAvatar = (m: ChatMessage) => m.sender?.avatar || "";

const handleAvatarClick = (m: ChatMessage) => {
  if (!m.sender?.id) return;
  userProfileModalUserId.value = Number(m.sender.id);
  userProfileModalPosition.value = m.isMe ? "left" : "right";
  userProfileModalAnchorX.value = (window.event as MouseEvent).clientX || 0;
  userProfileModalVisible.value = true;
};

const handleAddFriendFromProfile = (id: number) => emit("show-add-friend-modal", id);
const handleSendMessageFromProfile = (payload: { userId: number; userInfo: any }) => {
  userProfileModalVisible.value = false;
  emit("send-message", payload);
};
const handleReportFromProfile = (id: number) => {
  userProfileModalVisible.value = false;
  emit("report", id);
};

const handleFilePreviewClose = () => {
  filePreviewVisible.value = false;
  filePreviewData.value = null;
  filePreviewList.value = [];
  filePreviewCurrentIndex.value = 0;
};

const handleDeleteFileFromPreview = (fileId: string) => {
  const index = filePreviewList.value.findIndex((f) => f.id === fileId);
  if (index > -1) {
    filePreviewList.value.splice(index, 1);
    if (filePreviewCurrentIndex.value >= filePreviewList.value.length) {
      filePreviewCurrentIndex.value = Math.max(0, filePreviewList.value.length - 1);
    }
    if (filePreviewList.value.length === 0) {
      handleFilePreviewClose();
    } else {
      filePreviewData.value = filePreviewList.value[filePreviewCurrentIndex.value];
    }
  }
};

const handleDownloadFileFromPreview = (file: SelectedFile) => {
  if (!file.previewUrl) return;
  const link = document.createElement("a");
  link.href = file.previewUrl;
  link.download = file.tempFilename || file.originalName || file.file.name || "download";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  antMessage.success("开始下载");
};

const isOnlyEmoji = (text: string) => {
  return /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+$/u.test(text?.trim() || "");
};

const shouldShowTimeStampLocal = (m: ChatMessage, i: number) => {
  return shouldShowTimeStamp(m, i, props.activeContact?.messages || []);
};

const previewImage = (url: string) => emit("previewImage", url);
const previewVideo = (url: string) => emit("previewVideo", url);
const playVideoOnHover = (e: MouseEvent) => emit("playVideoOnHover", e);
const pauseVideoOnLeave = (e: MouseEvent) => emit("pauseVideoOnLeave", e);

// ============================================================
// 滚动加载
// ============================================================
const scrollToBottom = () => {
  nextTick(() => {
    const c = messagesContainerRef.value;
    if (c) {
      c.scrollTop = c.scrollHeight;
    }
    syncScrollbar();
  });
};

const handleScroll = async (e: Event) => {
  // 用 rAF 节流同步滚动条
  syncScrollbar();

  const t = e.target as HTMLElement;
  if (t.scrollTop < scrollThreshold && hasMoreHistory.value && !loadingMoreHistory.value) {
    await loadMoreHistory();
  }
};

const loadMoreHistory = async () => {
  if (!props.activeContact || !hasMoreHistory.value || loadingMoreHistory.value) return;
  loadingMoreHistory.value = true;
  try {
    const c = messagesContainerRef.value;
    const oh = c?.scrollHeight || 0;
    const ot = c?.scrollTop || 0;
    const res = await getChatHistory(
      props.activeContact.id,
      {
        currentUserId: String(props.currentUserId),
        contacts: props.contacts,
        activeContactId: ref(String(props.activeContact.id)),
      },
      currentPage.value + 1,
      50,
    );
    if (res.pagination) {
      currentPage.value = res.pagination.currentPage;
      hasMoreHistory.value = res.pagination.hasNextPage;
      if (res.messages.length === 0 && currentPage.value === 1) {
        hasMoreHistory.value = false;
      }
    } else {
      hasMoreHistory.value = false;
    }
    await nextTick();
    if (c && res.messages.length) {
      c.scrollTop = ot + (c.scrollHeight - oh);
    }
    syncScrollbar();
  } catch (e: any) {
    console.error("加载历史消息失败:", e);
    const statusCode = e.response?.status;
    if (statusCode !== 404) antMessage.error("加载历史消息失败");
    else hasMoreHistory.value = false;
  } finally {
    loadingMoreHistory.value = false;
  }
};

const resetInfiniteScroll = () => {
  loadingMoreHistory.value = false;
  hasMoreHistory.value = true;
  currentPage.value = 1;
};

// ============================================================
// 系统消息
// ============================================================
const handleOpenSystemMessageDetail = (m: ChatMessage) => {
  systemMessageDetailData.value = m;
  systemMessageDetailVisible.value = true;
};

const handleSystemMessageDetailClose = () => {
  systemMessageDetailData.value = null;
};

// ============================================================
// WebSocket 连接状态
// ============================================================
const connectionStatus = ref<"connected" | "connecting" | "disconnected">("connected");
const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case "connected":
      return "已连接";
    case "connecting":
      return "连接中...";
    case "disconnected":
      return "连接已断开";
    default:
      return "连接异常";
  }
});

const retrySendMessage = async (message: ChatMessage) => {
  try {
    message.status = "sending";
    emit("refresh-messages");
    antMessage.info("正在重试发送...");
  } catch (error) {
    console.error("重试发送消息失败:", error);
    message.status = "failed";
    antMessage.error("重试发送失败，请检查网络连接");
  }
};

const handleRedial = (message: ChatMessage) => {
  if (!message.callType) return;
  emit("redial-call", {
    callType: message.callType,
    contactId: props.activeContact?.id,
  });
};

// ============================================================
// 生命周期
// ============================================================
watch(
  () => props.activeContact?.messages,
  (newMessages) => {
    if (newMessages && newMessages.length > 0) {
      console.log("=== 消息列表 ===");
      newMessages.forEach((m, i) => {
        console.log(`[${i}] ID: ${m.id}, messageType: "${m.messageType || "undefined"}"`);
      });

      const systemMsgs = newMessages.filter((m) =>
        SYSTEM_MESSAGE_TYPES.includes(m.messageType || ""),
      );
      console.log("✅ 系统消息数量:", systemMsgs.length);
      if (systemMsgs.length > 0) {
        console.log("系统消息详情:", systemMsgs);
      }
    }
    nextTick(() => syncScrollbar());
  },
  { deep: true, immediate: true },
);

// 监听窗口尺寸，重新计算滚动条
const onWindowResize = () => syncScrollbar();

onMounted(async () => {
  scrollToBottom();
  const c = messagesContainerRef.value;
  if (c) c.addEventListener("scroll", handleScroll, { passive: true });

  window.addEventListener("resize", onWindowResize);
  nextTick(() => syncScrollbar());

  try {
    const { websocketService } = await import("../untils/websocket");
    connectionStatus.value = websocketService.isConnected() ? "connected" : "disconnected";

    const handleConnectionStatus = (status: { connected: boolean }) => {
      connectionStatus.value = status.connected ? "connected" : "disconnected";
    };

    websocketService.on("connection_status", handleConnectionStatus);

    onUnmounted(() => {
      websocketService.off("connection_status", handleConnectionStatus);
    });
  } catch (error) {
    console.error("无法获取 WebSocket 实例:", error);
    connectionStatus.value = "disconnected";
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", onWindowResize);
  stopDragThumb();
  if (syncRafId !== null) cancelAnimationFrame(syncRafId);
  if (rafId !== null) cancelAnimationFrame(rafId);
});

defineExpose({ messagesContainerRef, scrollToBottom, resetInfiniteScroll });
</script>

<style scoped>
@import "../assets/scss/level-badge.scss";

.chat-session-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 消息滚动外层：承载自定义滚动条 hover 区 */
.messages-scroll-host {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ============================================================
   ✅ 滚动条：原生滚动条完全隐藏，改用自定义滑块
   ============================================================ */
.messages-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  height: 100%;
  overflow-y: auto;
  scroll-behavior: smooth;

  /* 隐藏原生滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.messages-container::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

/* 自定义滚动条 hover 区（贴右边缘 12px 宽的透明条） */
.scroll-hover-zone {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 12px;
  z-index: 20;
  pointer-events: auto;
  transition: none;
}

/* 自定义滑块：默认隐藏，hover 区 hover 时才显示
   ✅ 颜色很淡，鼠标经过时出现，不打扰视线 */
.scroll-thumb {
  position: absolute;
  top: 0;
  right: 2px;
  width: 6px;
  border-radius: 3px;
  /* ✅ 淡色：极浅灰 */
  background: rgba(0, 0, 0, 0.12);
  cursor: pointer;
  visibility: hidden;
  opacity: 0;
  /* 只过渡 opacity，不动 visibility，避免抖动 */
  transition: opacity 0.1s linear;
  will-change: transform, opacity;
  transform: translate3d(0, 0, 0);
}

.scroll-thumb.is-visible {
  visibility: visible;
  opacity: 1;
}

/* 鼠标按住/悬停滑块时稍微深一点点，仍然很淡 */
.scroll-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.connection-status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-primary, #ffffff);
  border-bottom: 1px solid var(--border-light, #e5e5e5);
  font-size: 12px;
  color: var(--text-secondary, #666666);
  z-index: 100;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-indicator.connected {
  background-color: #4caf50;
}

.status-indicator.connecting {
  background-color: #ff9800;
  animation: pulse 1.5s infinite;
}

.status-indicator.disconnected {
  background-color: #f44336;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.join-group-notice-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 12px;
  animation: fadeInUp 0.3s ease-out;
}

.join-group-time {
  font-size: 11px;
  color: var(--text-secondary, #8e8e93);
  padding: 2px 10px;
  border-radius: 10px;
  background: var(--bg-tertiary, rgba(0, 0, 0, 0.05));
  margin-bottom: 4px;
}

.join-tag {
  font-size: 12px;
  padding: 4px 12px;
  background: var(--tag-bg, rgba(0, 122, 255, 0.1));
  color: var(--tag-color, #007aff);
  border-radius: 16px;
}

.recalled-message-hint-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 12px;
  margin: 0 auto;
}

.recalled-text {
  font-size: 12px;
  color: var(--text-secondary, #8e8e93);
}

.recalled-content-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 4px;
}

.re-edit-link {
  font-size: 12px;
  color: var(--link-color, #007aff);
  cursor: pointer;
  transition: opacity 0.2s ease;
  vertical-align: baseline;
}

.re-edit-link:hover {
  text-decoration: underline;
  opacity: 0.8;
}

.delete-recalled-btn {
  font-size: 14px;
  color: var(--text-secondary, #8e8e93);
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.2s ease;
  vertical-align: baseline;
  line-height: 1;
}

.delete-recalled-btn:hover {
  color: var(--danger-color, #ff3b30);
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 12px;
  position: relative;
  animation: fadeInUp 0.3s ease-out;
}

.message-wrapper.recalled-message-wrapper {
  align-items: center;
}

.message-wrapper.selected-message {
  background: var(--selected-bg, rgba(0, 122, 255, 0.05));
  border-radius: 8px;
  transition: background 0.2s ease;
}

.message-checkbox {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  z-index: 10;
  padding: 0 4px;
  cursor: pointer;
}

.message-wrapper.my-message-wrapper .message-checkbox {
  left: auto;
  right: 0;
}

.checkbox-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--border-normal, #c7c7c7);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary, #ffffff);
  transition: all 0.2s ease;
}

.checkbox-checked {
  background: var(--text-primary, #1a1a2e);
  border-color: var(--text-primary, #1a1a2e);
}

.checkmark-icon {
  color: #ffffff;
  font-size: 10px;
}

.message-timestamp {
  margin: 6px auto;
  padding: 2px 10px;
  font-size: 10px;
  color: var(--text-primary, #1a1a2e);
  background: var(--bg-tertiary, rgba(0, 0, 0, 0.05));
  border-radius: 10px;
  width: fit-content;
}

/* ===== 新消息分割线 ===== */
.new-message-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  padding: 0 16px;
  position: relative;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--divider-line-color, #6366f1) 20%,
    var(--divider-line-color, #6366f1) 80%,
    transparent 100%
  );
}

.divider-text {
  font-size: 11px;
  font-weight: 500;
  color: var(--divider-text-color, #6366f1);
  white-space: nowrap;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: 10px;
}

.message-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  width: 100%;
}

.message-wrapper.has-checkbox .message-item {
  padding-left: 28px;
}

.message-wrapper.has-checkbox.my-message-wrapper .message-item {
  padding-left: 0;
  padding-right: 28px;
}

.message-item.my-message {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  margin-top: 2px;
  transition: transform 0.2s ease;
}

/* ===== 关键修复：消息内容区 ===== */
.message-content {
  flex: 0 1 auto !important;
  min-width: 0 !important;
  max-width: 75% !important;
  display: flex !important;
  flex-direction: column !important;
}

.message-item.my-message .message-content {
  align-items: flex-end !important;
  max-width: 75% !important;
}

.message-sender-name {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 12px;
  line-height: 1.4;
  max-width: 100%;
}

.level-badge-combined {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  vertical-align: middle;
  flex-shrink: 0;
}

.sender-nickname {
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  line-height: 1.3;
  vertical-align: middle;
  color: var(--text-primary);
  word-break: break-word;
}

/* ===== 关键修复：消息气泡（无阴影） ===== */
.message-bubble {
  position: relative !important;
  display: inline-block !important;
  padding: 8px 12px !important;
  border-radius: 12px !important;
  width: auto !important;
  min-width: 20px !important;
  max-width: 100% !important;
  word-wrap: break-word !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  box-sizing: border-box !important;
  background-clip: padding-box !important;
  box-shadow: none !important;
}

.message-item.my-message .message-bubble {
  margin-left: auto !important;
}

.message-item:not(.my-message) .message-bubble {
  margin-right: auto !important;
}

/* ✅ 气泡：无阴影，仅靠底色 + 描边区分 */
.message-bubble.my-bubble,
.message-bubble.other-bubble {
  background: var(--message-bubble-bg, #ffffff);
  color: var(--message-bubble-text, #111111);
  border: var(--message-bubble-border, 1px solid rgba(0, 0, 0, 0.06));
  box-shadow: none;
}

/* ===== 图片/视频/文件消息 ===== */
.message-bubble.image-bubble,
.message-bubble.video-bubble,
.message-bubble.file-bubble {
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  max-width: 100% !important;
  width: auto !important;
  display: inline-block !important;
}

.message-image-container {
  display: inline-block !important;
  max-width: 280px !important;
  max-height: 280px !important;
  border-radius: 8px !important;
  overflow: hidden !important;
}

.message-image {
  max-width: 280px !important;
  max-height: 280px !important;
  width: auto !important;
  height: auto !important;
  display: block !important;
}

.message-video-container {
  display: inline-block !important;
  max-width: 280px !important;
  max-height: 280px !important;
  border-radius: 8px !important;
  overflow: hidden !important;
}

.message-video {
  max-width: 280px !important;
  max-height: 280px !important;
  width: auto !important;
  height: auto !important;
  display: block !important;
}

.message-file-container {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 12px !important;
  background: var(--bg-primary, #ffffff) !important;
  border: 1px solid var(--border-light, #e5e7eb) !important;
  border-radius: 10px !important;
  min-width: 160px !important;
  max-width: 280px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.file-icon-wrapper {
  width: 48px;
  height: 48px;
  background: var(--bg-tertiary, #f5f5f5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-icon {
  font-size: 28px;
  color: var(--text-primary, #1a1a2e);
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, #333333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-secondary, #999999);
}

.file-size {
  padding: 1px 6px;
  background: var(--tag-bg, #e8e8e8);
  border-radius: 3px;
  color: var(--tag-color, #666666);
}

.file-type {
  color: var(--tag-color, #666666);
}

.media-load-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px;
  background: var(--bg-primary, rgba(255, 255, 255, 0.9));
  border-radius: 8px;
}

.error-text {
  font-size: 11px;
  color: var(--text-secondary, #666666);
}

.video-play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 16px;
  pointer-events: none;
  transition: transform 0.2s ease;
}

.message-video-container:hover .video-play-icon {
  transform: translate(-50%, -50%) scale(1.1);
}

.text-message-content {
  word-wrap: break-word !important;
  white-space: pre-wrap !important;
  line-height: 1.5 !important;
  font-size: 13px !important;
  max-width: 100% !important;
  display: inline !important;
}

.emoji-only-message {
  font-size: 22px;
  line-height: 1;
}

.system-message-content {
  display: inline !important;
  word-wrap: break-word !important;
  white-space: pre-wrap !important;
}

.call-message-content {
  display: flex !important;
  flex-direction: column !important;
  gap: 2px !important;
  min-width: 120px !important;
}

.call-info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.call-type-icon {
  font-size: 16px;
  color: var(--text-primary, #1a1a2e);
  flex-shrink: 0;
}

.call-status-text {
  font-size: 13px;
  color: var(--text-primary, #333333);
  line-height: 1.4;
}

.call-duration {
  font-size: 11px;
  color: var(--text-secondary, #8e8e93);
  padding-left: 22px;
}

.call-redial-inline {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: var(--text-primary, #1a1a2e);
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.call-redial-inline:hover {
  opacity: 0.7;
}

.redial-icon-inline {
  font-size: 13px;
  color: var(--text-primary, #1a1a2e);
}

.message-status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-secondary, #999999);
}

.sending-text {
  color: var(--text-secondary, #999999);
}

.failed-text {
  color: var(--danger-color, #f44336);
}

.retry-button {
  padding: 2px 6px;
  font-size: 11px;
  color: var(--link-color, #6366f1);
}

.retry-button:hover {
  background: transparent;
  color: var(--link-color, #6366f1);
}

.multi-select-bottom-bar {
  position: sticky;
  bottom: 0;
  background: var(--bg-primary, rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--border-light, rgba(0, 0, 0, 0.1));
  padding: 10px 16px;
  z-index: 100;
  animation: slideUp 0.3s ease-out;
}

.bottom-bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selection-info {
  font-size: 13px;
  color: var(--text-primary, #666666);
}

.bottom-actions {
  display: flex;
  gap: 12px;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary, #666666);
  font-size: 16px;
  transition: all 0.2s ease;
}

.action-item:hover {
  background: var(--bg-tertiary, rgba(0, 0, 0, 0.05));
  color: var(--text-primary, #1a1a2e);
  transform: scale(1.05);
}

.action-item.danger:hover {
  background: rgba(255, 59, 48, 0.1);
  color: var(--danger-color, #ff3b30);
}

mark.highlight {
  background: var(--highlight-bg, #fff3e0);
  color: var(--highlight-color, #ff9800);
  padding: 0 2px;
  border-radius: 2px;
}

.loading-more-history {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  color: var(--text-secondary, #8e8e93);
  font-size: 12px;
}

.select-all-btn {
  color: var(--link-color, #6366f1);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.select-all-btn:hover {
  background: var(--primary-light, rgba(0, 122, 255, 0.1));
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.sending-message .message-bubble {
  opacity: 0.8;
}

.failed-message .message-bubble {
  opacity: 0.7;
  border: 1px dashed var(--danger-color, #f44336);
}

/* ===== 响应式调整 ===== */
@media (max-width: 768px) {
  .message-content,
  .message-item.my-message .message-content {
    max-width: 85% !important;
  }

  .message-image-container,
  .message-video-container {
    max-width: 220px !important;
    max-height: 220px !important;
  }

  .message-image,
  .message-video {
    max-width: 220px !important;
    max-height: 220px !important;
  }

  .message-file-container {
    max-width: 220px !important;
    min-width: 120px !important;
  }

  .messages-container {
    padding: 8px 10px;
  }
}

@media (max-width: 480px) {
  .message-content,
  .message-item.my-message .message-content {
    max-width: 90% !important;
  }

  .message-image-container,
  .message-video-container {
    max-width: 180px !important;
    max-height: 180px !important;
  }

  .message-image,
  .message-video {
    max-width: 180px !important;
    max-height: 180px !important;
  }

  .message-file-container {
    max-width: 180px !important;
    min-width: 100px !important;
    padding: 8px 10px !important;
  }

  .file-icon-wrapper {
    width: 36px;
    height: 36px;
  }

  .file-icon {
    font-size: 20px;
  }
}
</style>
