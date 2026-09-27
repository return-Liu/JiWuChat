<template>
  <Transition name="slide-down">
    <div v-if="showSearchPanel" class="search-panel">
      <div class="search-panel-header">
        <div class="search-panel-title">
          <span>搜索聊天记录</span>
        </div>
        <div class="search-panel-close" @click="closeSearchPanel">✕</div>
      </div>

      <div class="new-search-input-container">
        <div class="new-search-input-wrapper">
          <input
            :value="searchKeyword"
            @input="onSearchKeywordUpdate"
            @keyup.enter="performSearch"
            placeholder="搜索聊天记录关键词..."
            class="new-search-input"
            ref="searchInputRef"
          />
          <div
            v-if="searchKeyword"
            class="new-clear-search"
            @click="clearSearch"
          >
            ✕
          </div>
        </div>
        <button
          class="new-search-button"
          :disabled="isSearching"
          @click="performSearch"
        >
          {{ isSearching ? "搜索中..." : "搜索" }}
        </button>
      </div>

      <div class="advanced-search-filters">
        <div class="filter-type-tabs">
          <span
            class="type-tab-text"
            :class="{ active: chatType === 'group' }"
            v-if="activeContact?.isGroup"
            >群聊模式</span
          >
          <span
            class="type-tab-text"
            :class="{ active: chatType === 'private' }"
            v-else-if="!isSelfChat"
            >私聊模式</span
          >
          <span
            class="type-tab-text"
            :class="{ active: chatType === 'self' }"
            v-else
            >自聊模式</span
          >
        </div>

        <div class="filter-tabs">
          <span
            class="tab-text"
            :class="{ active: searchMessageType === '' }"
            @click="handleMessageTypeChange('')"
            >全部</span
          >
          <span
            class="tab-text"
            :class="{ active: searchMessageType === 'text' }"
            @click="handleMessageTypeChange('text')"
            >文本</span
          >
          <span
            class="tab-text"
            :class="{ active: searchMessageType === 'media' }"
            @click="handleMessageTypeChange('media')"
            >图片/视频</span
          >
          <span
            class="tab-text"
            :class="{ active: searchMessageType === 'emoji' }"
            @click="handleMessageTypeChange('emoji')"
            >表情包</span
          >
          <span
            class="tab-text"
            :class="{ active: searchMessageType === 'file' }"
            v-if="chatType === 'private' || chatType === 'self'"
            @click="handleMessageTypeChange('file')"
            >文件</span
          >
          <span
            class="tab-text"
            :class="{ active: searchMessageType === 'voice' }"
            v-if="chatType === 'private' || chatType === 'self'"
            @click="handleMessageTypeChange('voice')"
            >语音</span
          >
          <span
            class="tab-text"
            :class="{ active: searchMessageType === 'group_notification' }"
            v-if="chatType === 'group'"
            @click="handleMessageTypeChange('group_notification')"
            >群通知</span
          >
          <span
            class="tab-text"
            :class="{ active: searchMessageType === 'group_invite' }"
            v-if="chatType === 'group'"
            @click="handleMessageTypeChange('group_invite')"
            >邀请消息</span
          >
        </div>
      </div>

      <div v-if="hasSearched" class="search-results-container">
        <div class="search-results-header">
          <div class="search-results-title">
            找到 {{ searchResults.length }} 条相关消息
            <span v-if="searchKeyword" class="search-keyword"
              >"{{ searchKeyword }}"</span
            >
          </div>
          <button
            class="clear-results-btn"
            @click="clearSearchResults"
            :disabled="!searchResults.length"
          >
            清空
          </button>
        </div>

        <div class="search-results-list">
          <div v-if="searchResults.length === 0" class="no-search-results">
            <div class="empty-icon"></div>
            <p class="no-results-title">未找到相关消息</p>
            <p class="no-results-subtitle">尝试使用其他关键词搜索</p>
          </div>

          <div
            v-for="(result, index) in paginatedResults"
            :key="result.id || index"
            class="search-result-item"
            @click="handleResultClick(result)"
          >
            <div class="result-item-container">
              <div class="result-avatar">
                <img
                  :src="result.sender?.avatar || defaultAvatar"
                  class="avatar-img"
                  @click.stop="
                    result.sender?.id
                      ? navigateToUserInfo(result.sender.id)
                      : result.senderId
                        ? navigateToUserInfo(result.senderId)
                        : null
                  "
                />
              </div>
              <div class="result-content">
                <div class="result-header">
                  <span class="result-sender">{{
                    result.sender?.nickname || result.senderName
                  }}</span>
                  <span class="result-time">{{
                    result.time || result.createdAt || ""
                  }}</span>
                </div>
                <div class="result-message">
                  <div
                    v-if="result.messageType === 'image'"
                    class="result-media-wrapper"
                    @click.stop="handleResultClick(result)"
                  >
                    <img
                      :src="result.content"
                      class="result-image-thumb"
                      alt="图片缩略图"
                    />
                    <span class="media-tag">图片</span>
                  </div>
                  <div
                    v-else-if="result.messageType === 'video'"
                    class="result-media-wrapper"
                    @click.stop="handleResultClick(result)"
                  >
                    <video
                      :src="result.content"
                      class="result-video-thumb"
                      muted
                      preload="metadata"
                    />
                    <span class="media-tag">视频</span>
                  </div>
                  <div
                    v-else-if="result.messageType === 'emoji'"
                    class="result-emoji-wrapper"
                    @click.stop="handleResultClick(result)"
                  >
                    <span class="emoji-content">{{ result.content }}</span>
                    <span class="media-tag">表情</span>
                  </div>
                  <div
                    v-else-if="
                      result.messageType === 'group_invite_pending' ||
                      result.messageType === 'group_invite_accepted' ||
                      result.messageType === 'group_invite_rejected' ||
                      result.messageType === 'group_notification'
                    "
                    class="group-message"
                  >
                    <SystemMessageCard
                      :message="result"
                      :currentUserId="currentUserId"
                      @open-detail="handleSystemMessageDetail"
                    />
                  </div>
                  <span
                    v-else
                    class="message-text"
                    @click.stop="handleResultClick(result)"
                  >
                    <span
                      v-for="(segment, segmentIndex) in segmentHighlightedText(
                        result.content,
                        searchKeyword,
                      )"
                      :key="segmentIndex"
                      :class="{ highlight: segment.highlighted }"
                    >{{ segment.text }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="totalPages > 1" class="search-pagination">
          <span class="pagination-text"
            >第 {{ currentSearchPage }} / {{ totalPages }} 页</span
          >
          <div class="pagination-controls">
            <button
              class="page-btn"
              @click="handlePageChange(currentSearchPage - 1)"
              :disabled="currentSearchPage <= 1"
            >
              ←
            </button>
            <span class="page-current">{{ currentSearchPage }}</span>
            <button
              class="page-btn"
              @click="handlePageChange(currentSearchPage + 1)"
              :disabled="currentSearchPage >= totalPages"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div v-if="!hasSearched && !searchKeyword" class="search-tips">
        <div class="empty-icon iconfont icon-CDnmxN01"></div>
        <p class="search-tips-title">想要查找什么内容呢～</p>
        <p class="search-tips-subtitle">输入关键词，帮你快速定位历史消息</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { PropType } from "vue";
import type { ChatMessage } from "../types/chatTypes";
import type { StyleValue } from "vue";
import { useUserStore } from "../stores/user";
import { segmentHighlightedText } from "../untils/htmlSecurity";

const userStore = useUserStore();

const currentUserId = computed(() => {
  return userStore.userInfo?.id || 0;
});

interface Props {
  showSearchPanel: boolean;
  inputAreaStyle: StyleValue;
  searchKeyword: string;
  isSearching: boolean;
  hasSearched: boolean;
  searchResults: ChatMessage[];
  activeContact: any;
  pageSize: number;
  currentSearchPage: number;
}

interface Emits {
  (event: "close-search-panel"): void;
  (event: "clear-search"): void;
  (
    event: "perform-search",
    filters?: {
      messageType?: string;
      startDate?: string;
      endDate?: string;
      memberId?: string;
    },
  ): void;
  (event: "clear-search-results"): void;
  (
    event: "scroll-to-message",
    payload: { id: string | number; messageType: string; content: string },
  ): void;
  (event: "navigate-to-user-info", id: string): void;
  (event: "update:searchKeyword", value: string): void;
  (event: "update:currentSearchPage", value: number): void;
}

const props = defineProps({
  showSearchPanel: { type: Boolean, required: true },
  inputAreaStyle: {
    type: [Object, Array, String] as PropType<StyleValue>,
    required: true,
  },
  searchKeyword: { type: String, required: true },
  isSearching: { type: Boolean, required: true },
  hasSearched: { type: Boolean, required: true },
  searchResults: { type: Array as PropType<ChatMessage[]>, required: true },
  activeContact: { type: Object as PropType<any>, required: true },
  pageSize: { type: Number, required: true },
  currentSearchPage: { type: Number, required: true },
});

const emit = defineEmits<Emits>();

const defaultAvatar =
  "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png";

const searchDateRange = ref<string[]>([]);
const searchMemberId = ref<string>("");
const searchMessageType = ref<string>("");

const isSelfChat = computed(() => {
  if (!props.activeContact) return false;
  return (
    String(props.activeContact.id).startsWith("self_") ||
    props.activeContact.isSelf === true
  );
});

const chatType = computed(() => {
  if (!props.activeContact) return "unknown";
  if (props.activeContact.isGroup) return "group";
  if (isSelfChat.value) return "self";
  return "private";
});

const groupMembers = computed(() => {
  if (!props.activeContact?.isGroup) return [];
  const members =
    props.activeContact.groupMembers || props.activeContact.members || [];
  return Array.isArray(members) ? members.filter((m) => m && m.userId) : [];
});

const totalPages = computed(() =>
  Math.ceil(props.searchResults.length / props.pageSize),
);
const paginatedResults = computed(() => {
  const start = (props.currentSearchPage - 1) * props.pageSize;
  return props.searchResults.slice(start, start + props.pageSize);
});

const closeSearchPanel = () => emit("close-search-panel");
const clearSearch = () => {
  emit("clear-search");
  searchDateRange.value = [];
  searchMemberId.value = "";
  searchMessageType.value = "";
};
const performSearch = () => {
  emit("perform-search", {
    messageType: searchMessageType.value,
    startDate: searchDateRange.value?.[0] || "",
    endDate: searchDateRange.value?.[1] || "",
    memberId: searchMemberId.value,
  });
};
const clearSearchResults = () => emit("clear-search-results");
const navigateToUserInfo = (id: string) => emit("navigate-to-user-info", id);
const handlePageChange = (page: number) =>
  emit("update:currentSearchPage", page);

const onSearchFilterChange = () => {
  if (props.hasSearched) performSearch();
};

const clearDateFilter = () => {
  searchDateRange.value = [];
  onSearchFilterChange();
};

const applyDateFilter = () => onSearchFilterChange();
const applyMemberFilter = () => onSearchFilterChange();

const handleMessageTypeChange = (type: string) => {
  searchMessageType.value = type;
  if (props.hasSearched) performSearch();
};

const handleResultClick = (result: ChatMessage) => {
  if (result.id) {
    emit("scroll-to-message", {
      id: result.id,
      messageType: result.messageType || "",
      content: result.content,
    });
    setTimeout(() => emit("close-search-panel"), 300);
  }
};

const handleSystemMessageDetail = (message: ChatMessage) => {
  if (message.id) {
    emit("scroll-to-message", {
      id: message.id,
      messageType: message.messageType || "",
      content: message.content,
    });
    setTimeout(() => emit("close-search-panel"), 300);
  }
};

const onSearchKeywordUpdate = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:searchKeyword", target.value);
};

</script>

<style scoped>
.search-panel {
  position: absolute;
  top: 56px;
  left: 0;
  right: 0;
  background: #fff;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #e5e5e5;
  overflow: hidden;
}

.search-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.search-panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
}

.search-panel-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  color: #8e8e93;
  font-size: 14px;
}

.search-panel-close:hover {
  background: #f5f5f5;
}

.new-search-input-container {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  background: #fafafa;
}

.new-search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.new-search-input {
  width: 100%;
  height: 36px;
  padding: 0 32px 0 12px;
  border: 1px solid #e5e5e5;
  border-radius: 18px;
  font-size: 13px;
  background: #fff;
  color: #1a1a1a;
  outline: none;
}

.new-search-input:focus {
  border-color: #007aff;
}

.new-search-input::placeholder {
  color: #c7c7c7;
}

.new-clear-search {
  position: absolute;
  right: 12px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  color: #8e8e93;
  font-size: 12px;
}

.new-clear-search:hover {
  background: #f5f5f5;
}

.new-search-button {
  height: 36px;
  padding: 0 20px;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  background: #007aff;
  color: #fff;
  cursor: pointer;
}

.new-search-button:hover {
  background: #005fc1;
}

.new-search-button:disabled {
  background: #c7c7c7;
  cursor: not-allowed;
}

.advanced-search-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
}

.filter-type-tabs {
  display: flex;
  gap: 16px;
  align-items: center;
}

.type-tab-text {
  font-size: 13px;
  color: #8e8e93;
}

.type-tab-text.active {
  color: #007aff;
  font-weight: 500;
}

.filter-tabs {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.tab-text {
  font-size: 13px;
  color: #8e8e93;
  cursor: pointer;
}

.tab-text:hover {
  color: #007aff;
}

.tab-text.active {
  color: #007aff;
  font-weight: 500;
}

.search-tips {
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 60px;
}

.search-tips-title {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
}

.search-tips-subtitle {
  font-size: 12px;
  color: #8e8e93;
}

.search-results-container {
  background: #fff;
  max-height: 460px;
  overflow-y: auto;
}

.search-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.search-results-title {
  font-size: 13px;
  color: #666;
}

.search-keyword {
  color: #007aff;
}

.clear-results-btn {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid #e5e5e5;
  background: #fff;
  cursor: pointer;
}

.clear-results-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.clear-results-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-result-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.search-result-item:hover {
  background: #fafafa;
}

.result-item-container {
  display: flex;
  gap: 12px;
}

.result-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.result-sender {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
}

.result-time {
  font-size: 11px;
  color: #8e8e93;
}

.result-message {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.result-media-wrapper {
  position: relative;
  display: inline-block;
  border-radius: 8px;
  overflow: hidden;
}

.result-image-thumb,
.result-video-thumb {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
}

.media-tag {
  position: absolute;
  bottom: 4px;
  right: 4px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 10px;
  border-radius: 4px;
}

.result-emoji-wrapper {
  position: relative;
  display: inline-block;
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 8px;
}

.emoji-content {
  font-size: 18px;
}

.highlight {
  background: #fff3e0;
  color: #ff9800;
  padding: 0 2px;
  border-radius: 2px;
}

.no-search-results {
  padding: 40px 20px;
  text-align: center;
}

.no-results-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.no-results-subtitle {
  font-size: 12px;
  color: #8e8e93;
}

.search-pagination {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.pagination-text {
  font-size: 12px;
  color: #8e8e93;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid #e5e5e5;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
}

.page-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-current {
  font-size: 13px;
  color: #1a1a1a;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.search-results-container::-webkit-scrollbar {
  width: 4px;
}

.search-results-container::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.search-results-container::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}
</style>
