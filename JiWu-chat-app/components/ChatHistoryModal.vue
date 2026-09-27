<template>
  <div class="chat-history-modal" :class="{ 'embed-mode': embed }">
    <div
      class="modal-mask"
      v-if="visible"
      @click="!embed && handleClose()"
      :style="{ zIndex: embed ? 'auto' : 2000 }"
    >
      <div class="modal-card" :class="{ 'embed-card': embed }" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ modalTitle }}</h2>
        </div>

        <div class="search-bar">
          <div class="search-box">
            <a-input
              v-model="searchText"
              placeholder="搜索聊天记录"
              clearable
              @input="handleSearch"
              class="search-input"
            />
          </div>
        </div>

        <div class="filter-tabs-bar">
          <div class="filter-tabs">
            <span
              class="tab-item"
              :class="{ active: activeTab === 'all' }"
              @click="switchTab('all')"
            >
              全部
            </span>
            <span
              class="tab-item"
              :class="{ active: activeTab === 'image' }"
              @click="switchTab('image')"
            >
              图片/视频
            </span>
            <span
              class="tab-item"
              :class="{ active: activeTab === 'file' }"
              @click="switchTab('file')"
            >
              文件
            </span>
          </div>

          <div class="filter-trigger" @click="showFilterDrawer = true">
            <span class="filter-text">筛选</span>
            <i class="iconfont icon-shaixuan filter-icon"></i>
          </div>
        </div>

        <div class="modal-body">
          <div class="message-list-wrapper">
            <div v-if="loading" class="loading-box">
              <i class="iconfont icon-jiazai is-loading"></i>
              <span class="loading-text">正在加载历史消息…</span>
            </div>

            <div v-else-if="filteredMessages.length === 0 && hasLoaded" class="empty-box">
              <i class="iconfont icon-wangluoyichang empty-icon"></i>
              <p class="empty-text">暂无聊天记录</p>
              <p class="empty-hint">开始对话后，这里会记录你们的每一次交流</p>
            </div>

            <div v-else class="message-list">
              <div
                v-for="msg in filteredMessages"
                :key="msg.id"
                class="message-item"
                :class="{ 'is-me': msg.isMe }"
                @mouseenter="hoveredMessageId = msg.id"
                @mouseleave="hoveredMessageId = null"
              >
                <div class="message-time-center">
                  {{ formatMessageTime(msg.time) }}
                </div>

                <!-- 消息行：统一结构，强制左右布局 -->
                <div class="message-row" :class="{ 'is-me': msg.isMe }">
                  <!-- 对方：头像左 -->
                  <template v-if="!msg.isMe">
                    <div class="message-avatar">
                      <a-avatar
                        :src="getAvatar(msg)"
                        :size="40"
                        @error="handleAvatarError($event)"
                      />
                    </div>
                  </template>

                  <!-- 消息内容主体 -->
                  <div
                    class="message-content"
                    :class="{
                      'system-message-content': isSystemMessageType(msg),
                      'recalled-content': msg.isRecalled,
                    }"
                  >
                    <!-- 撤回消息 -->
                    <div v-if="msg.isRecalled" class="recalled-text">
                      {{ getRecallText(msg) }}
                    </div>

                    <!-- 系统消息 -->
                    <template v-else-if="isSystemMessageType(msg)">
                      <div class="message-header">
                        <div class="sender-info">
                          <span class="sender-name">{{ msg.senderName }}</span>
                          <span
                            v-if="msg.sender?.nickname && msg.sender.nickname !== msg.senderName"
                            class="sender-nickname"
                          >
                            {{ msg.sender.nickname }}
                          </span>
                        </div>
                      </div>
                      <SystemMessageCard
                        :message="msg"
                        :current-user-id="Number(currentUserId)"
                        @open-detail="handleOpenSystemMessageDetail"
                      />
                    </template>

                    <!-- 普通消息：文本/图片/视频/语音/文件 -->
                    <template v-else>
                      <div class="message-header">
                        <div class="sender-info">
                          <span class="sender-name">{{ msg.senderName }}</span>
                          <span
                            v-if="msg.sender?.nickname && msg.sender.nickname !== msg.senderName"
                            class="sender-nickname"
                          >
                            {{ msg.sender.nickname }}
                          </span>
                        </div>
                      </div>

                      <div v-if="msg.messageType === 'text'" class="message-text">
                        <span
                          v-for="(segment, segmentIndex) in segmentHighlightedText(
                            msg.content,
                            searchText,
                          )"
                          :key="segmentIndex"
                          :class="{ highlight: segment.highlighted }"
                          >{{ segment.text }}</span
                        >
                      </div>
                      <div v-else-if="msg.messageType === 'image'" class="message-media">
                        <img
                          :src="msg.content"
                          class="media-image"
                          loading="lazy"
                          alt="图片"
                          @click="previewMedia(msg.content, 'image')"
                          @error="(e) => handleMediaError(e, msg)"
                        />
                      </div>
                      <div v-else-if="msg.messageType === 'video'" class="message-media">
                        <div class="video-wrapper" @click="previewMedia(msg.content, 'video')">
                          <video
                            :src="msg.content"
                            class="media-video"
                            preload="metadata"
                            @error="(e) => handleMediaError(e, msg)"
                          ></video>
                          <div class="video-play-icon">
                            <i class="iconfont icon-24gl-playCircle"></i>
                          </div>
                        </div>
                      </div>
                      <div v-else-if="msg.messageType === 'voice'" class="message-voice">
                        <audio :src="msg.content" controls class="voice-audio"></audio>
                      </div>
                      <div v-else-if="msg.messageType === 'file'" class="message-file">
                        文件消息
                      </div>
                      <div v-else class="message-text">
                        {{ msg.content || "不支持的消息类型" }}
                      </div>
                    </template>
                  </div>

                  <!-- 自己：头像右 -->
                  <template v-if="msg.isMe">
                    <div class="message-avatar">
                      <a-avatar
                        :src="getAvatar(msg)"
                        :size="40"
                        @error="handleAvatarError($event)"
                      />
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <div v-if="hasLoaded && filteredMessages.length > 0" class="custom-pagination-container">
            <button
              class="page-btn prev-btn"
              @click="changePage(pagination.currentPage - 1)"
              :disabled="!pagination.hasPrevPage"
            >
              <ArrowLeftOutlined :style="{ fontSize: '14px' }" />
              <span>上一页</span>
            </button>
            <span class="page-info">
              第 {{ pagination.currentPage }} 页 / 共 {{ pagination.totalPages }} 页
            </span>
            <button
              class="page-btn next-btn"
              @click="changePage(pagination.currentPage + 1)"
              :disabled="!pagination.hasNextPage"
            >
              <span>下一页</span>
              <ArrowRightOutlined :style="{ fontSize: '14px' }" />
            </button>
          </div>
        </div>

        <transition name="drawer-slide">
          <div
            v-if="showFilterDrawer"
            class="custom-filter-drawer-overlay"
            @click="showFilterDrawer = false"
          >
            <div class="custom-filter-drawer" @click.stop>
              <div class="drawer-header">
                <h3 class="drawer-title">高级筛选</h3>
              </div>

              <div class="drawer-body">
                <!-- 时间范围筛选 -->
                <div class="filter-section">
                  <h4 class="filter-section-title">时间范围</h4>
                  <div class="date-range-container">
                    <div class="date-input-group">
                      <input
                        type="date"
                        v-model="filterForm.startDate"
                        class="date-input"
                        placeholder="开始日期"
                      />
                      <span class="date-separator">至</span>
                      <input
                        type="date"
                        v-model="filterForm.endDate"
                        class="date-input"
                        placeholder="结束日期"
                      />
                    </div>
                  </div>
                </div>

                <!-- 发送人筛选（仅群聊显示） -->
                <div class="filter-section" v-if="isGroupChat">
                  <h4 class="filter-section-title">发送人</h4>
                  <div class="sender-select-container">
                    <div
                      class="sender-select-trigger"
                      @click="toggleSenderDropdown"
                      :class="{ 'sender-select-open': senderDropdownOpen }"
                    >
                      <div class="sender-selected-text">
                        {{ selectedSenderText }}
                      </div>
                      <i class="iconfont icon-arrow-down sender-select-arrow"></i>
                    </div>
                    <div
                      v-show="senderDropdownOpen"
                      class="sender-dropdown"
                      ref="senderDropdownRef"
                    >
                      <div class="sender-option" @click="selectSender(null)">
                        <span class="sender-option-text">全部发送人</span>
                      </div>
                      <div
                        v-for="member in groupMembers"
                        :key="member.userId || member.id"
                        class="sender-option"
                        @click="selectSender(Number(member.userId || member.id))"
                        :class="{
                          'sender-option-selected':
                            Number(member.userId || member.id) === filterForm.selectedSender,
                        }"
                      >
                        <div class="sender-option-avatar">
                          <img
                            :src="member.avatar"
                            alt=""
                            class="sender-option-avatar-img"
                            @error="handleAvatarErrorInDropdown"
                          />
                        </div>
                        <span class="sender-option-text">{{
                          member.nickname || member.username
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="drawer-footer">
                <button @click="resetFilters" class="reset-btn">重置</button>
                <button @click="applyFilters" class="apply-btn">应用筛选</button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <MediaPreview
      :visible="showPreview"
      @update:visible="showPreview = $event"
      :image="previewImages"
      :video="previewVideos"
      :current-media-index="currentPreviewIndex"
      @update:current-media-index="currentPreviewIndex = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from "vue";
import { message } from "ant-design-vue";
import { Avatar, Input, Button } from "ant-design-vue";
import { CloseOutlined, ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons-vue";
import request from "../untils/request";
import { useFormatMessageTime } from "../untils/rightchat";
import { getChatHistoryForModal } from "../untils/contactManager";
import { segmentHighlightedText } from "../untils/htmlSecurity";
import SystemMessageCard from "./SystemMessageCard.vue";
import MediaPreview from "./MediaPreview.vue";

import { useSiderColor } from "../stores/siderColor";

const siderColorStore = useSiderColor();

const modalTitle = computed(() => {
  if (!props.contactId) return "聊天记录";
  const contact = props.contacts.find((c: any) => String(c.id) === String(props.contactId));
  if (!contact) return "聊天记录";
  if (contact.isGroup) {
    const groupName = contact.remark || contact.name || "群聊";
    return `${groupName}的聊天记录`;
  } else {
    const otherName = contact.remark || contact.name || contact.username || "好友";
    return `${otherName}的聊天记录`;
  }
});

const searchText = ref("");
const activeTab = ref("all");

const hasActiveFilters = computed(() => {
  return activeTab.value !== "all" || searchText.value.trim() !== "";
});

const showFilterDrawer = ref(false);

// 筛选表单
const filterForm = ref({
  startDate: null as string | null,
  endDate: null as string | null,
  selectedSender: null as number | null,
});

const groupMembers = ref<any[]>([]);
const senderDropdownOpen = ref(false);
const senderDropdownRef = ref<HTMLDivElement | null>(null);

// 计算选中的发送人显示文本
const selectedSenderText = computed(() => {
  if (filterForm.value.selectedSender === null) {
    return "全部发送人";
  }
  const member = groupMembers.value.find(
    (m) => Number(m.userId || m.id) === filterForm.value.selectedSender,
  );
  return member ? member.nickname || member.username : "未知用户";
});

const isGroupChat = computed(() => {
  if (!props.contactId) return false;
  const contact = props.contacts.find((c: any) => String(c.id) === String(props.contactId));
  return contact?.isGroup || false;
});

// 点击外部关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  if (senderDropdownRef.value && !senderDropdownRef.value.contains(event.target as Node)) {
    senderDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

const toggleSenderDropdown = () => {
  senderDropdownOpen.value = !senderDropdownOpen.value;
};

const selectSender = (senderId: number | null) => {
  filterForm.value.selectedSender = senderId;
  senderDropdownOpen.value = false;
};

const handleAvatarErrorInDropdown = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.src = defaultAvatar;
};

const resetFilters = () => {
  filterForm.value = {
    startDate: null,
    endDate: null,
    selectedSender: null,
  };
};

const applyFilters = () => {
  showFilterDrawer.value = false;
  pagination.value.currentPage = 1;
  loadChatHistory();
};

const loadGroupMembers = async () => {
  if (!isGroupChat.value || !props.contactId) return;
  try {
    const response = await request({
      url: `/group/${props.contactId}/members`,
      method: "GET",
    });
    groupMembers.value = response.data?.members || response.data || [];
  } catch (error) {
    console.error(error);
    message.error("加载群成员失败");
  }
};

const filteredMessages = computed(() => {
  let list = [...messages.value];

  if (activeTab.value !== "all") {
    if (activeTab.value === "image") {
      list = list.filter((msg) => ["image", "video"].includes(msg.messageType));
    } else {
      list = list.filter((msg) => msg.messageType === activeTab.value);
    }
  }

  if (searchText.value.trim()) {
    const keyword = searchText.value.toLowerCase();
    list = list.filter((msg) => {
      if (msg.content) return msg.content.toLowerCase().includes(keyword);
      if (msg.senderName) return msg.senderName.toLowerCase().includes(keyword);
      return false;
    });
  }

  // 使用筛选表单里的时间
  const { startDate, endDate } = filterForm.value;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    list = list.filter((msg) => {
      const msgDate = new Date(msg.createdAt || msg.time);
      return msgDate >= start && msgDate <= end;
    });
  }

  // 使用筛选表单里的发送人
  if (filterForm.value.selectedSender) {
    list = list.filter((msg) => {
      const msgSenderId = msg.senderId || msg.sender?.id;
      return Number(msgSenderId) === Number(filterForm.value.selectedSender);
    });
  }

  return list;
});

const handleSearch = () => {};

const switchTab = (tab: string) => {
  activeTab.value = tab;
};

interface Props {
  visible: boolean;
  contactId: string | number;
  contacts: any[];
  currentUserId: string;
  searchKeyword?: string;
  /** embed 模式：独立窗口内全屏渲染（无遮罩、无居中卡片） */
  embed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  contactId: "",
  contacts: () => [],
  currentUserId: "",
  searchKeyword: "",
  embed: false,
});

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
}>();

const messages = ref<any[]>([]);
const loading = ref(false);
const hasLoaded = ref(false);
const pagination = ref({
  total: 0,
  currentPage: 1,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
});

const showPreview = ref(false);
const previewImages = ref<string[]>([]);
const previewVideos = ref<string[]>([]);
const currentPreviewIndex = ref(0);
const hoveredMessageId = ref<string | number | null>(null);
const mediaLoadErrors = ref<Record<string, boolean>>({});
const defaultAvatar = "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png";

const isSystemMessageType = (msg: any) =>
  [
    "group_invite_pending",
    "group_invite_accepted",
    "group_invite_rejected",
    "group_notification",
  ].includes(msg.messageType);

const formatMessageTime = (time: string) => useFormatMessageTime(time);
const handleAvatarError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.src = defaultAvatar;
};
const handleMediaError = (e: Event, msg: any) => {
  if (msg?.id) mediaLoadErrors.value[msg.id] = true;
};
const getAvatar = (msg: any) => msg.sender?.avatar || msg.avatar || defaultAvatar;

const previewMedia = (url: string, type: string) => {
  if (type === "image") {
    previewImages.value = [url];
    previewVideos.value = [];
  } else {
    previewVideos.value = [url];
    previewImages.value = [];
  }
  currentPreviewIndex.value = 0;
  showPreview.value = true;
};

// 🔥 核心修复：loadChatHistory 函数
const loadChatHistory = async () => {
  if (!props.contactId) {
    message.warning("联系人信息异常");
    return;
  }

  loading.value = true;
  mediaLoadErrors.value = {};

  try {
    // 调用修复后的 getChatHistoryForModal
    const result = await getChatHistoryForModal(
      props.contactId,
      props.currentUserId,
      props.contacts,
      pagination.value.currentPage,
      50,
    );

    console.log("[loadChatHistory] 获取到的数据:", result);

    // 提取消息列表
    let rawMessages = result.messages || [];

    // 获取联系人信息，用于群聊昵称映射
    const contact = props.contacts.find((c: any) => String(c.id) === String(props.contactId));
    const memberNicknameMap = new Map<string, string>();
    if (contact?.isGroup && contact?.groupMembers) {
      contact.groupMembers.forEach((member: any) => {
        if (member.nickname) memberNicknameMap.set(String(member.id), member.nickname);
      });
    }

    // 格式化消息
    messages.value = rawMessages.map((msg: any) => {
      const senderId = String(msg.senderId);
      const groupNickname = memberNicknameMap.get(senderId);

      return {
        ...msg,
        // 发送者名称：优先群昵称，其次用户昵称，最后用户名
        senderName: groupNickname || msg.sender?.nickname || msg.sender?.username || "未知用户",
        sender: msg.sender
          ? { ...msg.sender, groupNickname: groupNickname || undefined }
          : undefined,
        // 判断是否是自己发送的消息
        isMe: Number(msg.senderId) === Number(props.currentUserId),
        // 确保时间和消息类型字段存在
        time: msg.time || msg.createdAt,
        messageType: msg.messageType || "text",
        // 如果消息有撤回内容，保存原始内容
        recalledContent: msg.recalledContent || null,
      };
    });

    // 更新分页信息
    pagination.value = result.pagination || {
      total: 0,
      currentPage: 1,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    };

    hasLoaded.value = true;

    console.log("[loadChatHistory] 加载成功:", {
      messageCount: messages.value.length,
      pagination: pagination.value,
    });
  } catch (error: any) {
    console.error("[loadChatHistory] 加载聊天记录失败:", error);

    // 显示错误信息
    const errorMsg =
      error?.response?.data?.data?.message || error?.message || "加载聊天记录失败，请重试";
    message.error(errorMsg);

    messages.value = [];
    hasLoaded.value = true;
  } finally {
    loading.value = false;
  }
};

const changePage = (page: number) => {
  if (page < 1 || page > pagination.value.totalPages) return;
  pagination.value.currentPage = page;
  loadChatHistory();
};

const getRecallText = (msg: any) => {
  // 如果有自定义撤回内容，优先使用
  if (msg.recalledContent) return msg.recalledContent;
  return msg.isMe ? "你撤回了一条消息" : "对方撤回了一条消息";
};

const handleClose = () => emit("update:visible", false);

const handleOpenSystemMessageDetail = (message: any) => {
  console.log("打开系统消息详情", message);
};

// 监听 visible 变化
watch(
  () => props.visible,
  (val) => {
    if (val) {
      // 打开弹窗时加载数据
      loadChatHistory();
      loadGroupMembers();
    } else {
      // 关闭弹窗时重置状态
      messages.value = [];
      hasLoaded.value = false;
      searchText.value = "";
      activeTab.value = "all";
      resetFilters();
      pagination.value = {
        total: 0,
        currentPage: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }
  },
  { immediate: true, deep: true },
);
</script>

<style scoped lang="scss">
.chat-history-modal {
  --primary: #4096ff;
  --text-1: #111827;
  --text-2: #4b5563;
  --text-3: #9ca3af;
  --bg-1: #ffffff;
  --bg-2: #f9fafb;
  --bg-me: #e8f4ff;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.modal-mask {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.25s ease;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ===== embed 模式：独立窗口内全屏渲染（无遮罩、无居中卡片） ===== */
.embed-mode .modal-mask {
  position: relative;
  inset: auto;
  width: 100%;
  height: 100%;
  background: transparent;
  animation: none;
}

.embed-mode .modal-card.embed-card {
  width: 100%;
  max-width: none;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
  animation: none;
}

.modal-card {
  width: 90%;
  max-width: 1000px;
  height: 600px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
  position: relative;
}
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 12px;
  background: transparent;
  flex-shrink: 0;
}
.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-1);
  margin: 0;
}
.btn-close {
  color: var(--text-2);
  font-size: 18px;
  cursor: pointer;
}
.btn-close:hover {
  color: var(--primary);
}

.search-bar {
  padding: 0 24px 12px;
  background: transparent;
  flex-shrink: 0;
}
.search-box {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-3);
  font-size: 16px;
  z-index: 2;
  pointer-events: none;
}
.search-input {
  width: 100%;
}

.filter-tabs-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px 12px;
  background: transparent;
  flex-shrink: 0;
}
.filter-tabs {
  display: flex;
  gap: 0;
  align-items: center;
}
.tab-item {
  padding: 8px 18px;
  font-size: 14px;
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  position: relative;
  border-radius: 8px;
}
.tab-item:hover {
  color: var(--primary);
  background: var(--bg-2);
}
.tab-item.active {
  color: var(--primary);
  font-weight: 600;
  background: rgba(64, 150, 255, 0.08);
}
.filter-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  cursor: pointer;
  color: var(--text-2);
  border-radius: 8px;
}
.filter-trigger:hover {
  color: var(--primary);
  background: var(--bg-2);
}

.custom-filter-drawer-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: flex-end;
}
.custom-filter-drawer {
  width: 320px;
  max-width: 90%;
  height: 100%;
  background: #fff;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: all 0.3s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: transparent;
}
.drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
}

.drawer-body {
  flex: 1;
  padding: 12px 20px;
  overflow-y: auto;
}
.filter-section {
  margin-bottom: 20px;
}
.filter-section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-2);
  margin-bottom: 10px;
}

.date-range-container {
  width: 100%;
}
.date-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.date-input {
  flex: 1;
  min-width: 0;
  width: 0;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-1);
  background: white;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.date-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(64, 150, 255, 0.1);
}
.date-separator {
  color: var(--text-2);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.sender-select-container {
  position: relative;
  width: 100%;
}
.sender-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  min-height: 40px;
  width: 100%;
  box-sizing: border-box;
}
.sender-select-trigger:hover {
  border-color: var(--text-3);
}
.sender-select-trigger.sender-select-open {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(64, 150, 255, 0.1);
}
.sender-selected-text {
  font-size: 14px;
  color: var(--text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  text-align: left;
  max-width: calc(100% - 24px);
}
.sender-select-arrow {
  font-size: 16px;
  color: var(--text-2);
  transition: transform 0.2s ease;
  margin-left: 8px;
  flex-shrink: 0;
}
.sender-select-trigger.sender-select-open .sender-select-arrow {
  transform: rotate(180deg);
}

.sender-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
}
.sender-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}
.sender-option:hover {
  background-color: var(--bg-2);
}
.sender-option-selected {
  background-color: rgba(64, 150, 255, 0.1);
  color: var(--primary);
}
.sender-option-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}
.sender-option-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sender-option-text {
  font-size: 14px;
  color: var(--text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  text-align: left;
}

.drawer-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: transparent;
  border-top: 1px solid #f3f4f6;
}
.reset-btn,
.apply-btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.reset-btn {
  background: var(--bg-2);
  color: var(--text-2);
}
.reset-btn:hover {
  background: #e5e7eb;
}
.apply-btn {
  background: var(--primary);
  color: white;
}
.apply-btn:hover {
  background: #2d8cf0;
  box-shadow: 0 2px 8px rgba(64, 150, 255, 0.3);
}

/* ========== 主要修改：固定高度布局 ========== */
.modal-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-2);
  min-height: 0;
}

.message-list-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
}

.message-list-wrapper::-webkit-scrollbar {
  width: 6px;
}
.message-list-wrapper::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}
.message-list-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.loading-box {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-2);
  font-size: 15px;
  padding: 60px 0;
}
.is-loading {
  animation: rotating 2s linear infinite;
}
@keyframes rotating {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
.empty-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}
.empty-icon {
  font-size: 60px;
}
.empty-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-1);
}
.empty-hint {
  font-size: 14px;
  color: var(--text-3);
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 8px;
}

/* ========== 消息布局 ========== */
.message-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}
.message-time-center {
  width: 100%;
  text-align: center;
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 4px;
}

.message-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  width: 100%;
}
.message-row.is-me {
  justify-content: flex-end;
}

.message-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 70%;
  align-items: flex-start;
}
.message-row.is-me .message-content {
  align-items: flex-end;
  margin-left: auto;
}

.message-header {
  margin-bottom: 4px;
  width: 100%;
}
.sender-info {
  display: flex;
  align-items: center;
  gap: 6px;
}
.sender-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
}
.sender-nickname {
  font-size: 12px;
  color: var(--text-3);
}
.message-row.is-me .sender-info {
  justify-content: flex-end;
}

.message-text {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-1);
  word-break: break-word;
  padding: 10px 14px;
  border-radius: 18px;
  background: var(--bg-1);
}
.message-row.is-me .message-text {
  background: var(--bg-me);
}

.message-media {
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
}
.media-image,
.media-video {
  max-width: 260px;
  max-height: 260px;
  display: block;
  border-radius: 14px;
  object-fit: cover;
}
.video-wrapper {
  position: relative;
}

.video-play-icon {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: transparent !important;
  i {
    font-size: 40px;
    color: #fff;
  }
}

.voice-audio {
  width: 260px;
  height: 38px;
  border-radius: 10px;
}
.message-file {
  padding: 10px 14px;
  background: #fff;
  border-radius: 12px;
}
.recalled-content {
  padding: 6px 12px;
  color: var(--text-3);
}
.system-message-content {
  background: transparent;
}

/* ========== 分页固定在底部 ========== */
.custom-pagination-container {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px 20px;
  margin: 0 20px 20px;
  border-radius: 12px;
  background: #fff;
}
.page-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  background: var(--bg-2);
  color: var(--primary);
  cursor: pointer;
}
.page-btn:hover:not(:disabled) {
  background: var(--bg-me);
}
.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page-info {
  font-size: 14px;
  color: var(--text-2);
}

.highlight {
  background: #fff2ab;
  padding: 1px 3px;
  border-radius: 2px;
}
</style>
