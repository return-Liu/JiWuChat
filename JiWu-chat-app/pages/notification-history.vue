<template>
  <div class="notification-history-page">
    <div class="page-header">
      <h2>通知历史</h2>
      <div class="header-actions">
        <button class="action-btn" @click="markAllAsRead">全部标记已读</button>
        <button class="action-btn danger" @click="openClearDialog">
          清除历史
        </button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">时间范围：</span>
        <div class="radio-group">
          <button
            class="radio-btn"
            :class="{ active: filter.timeRange === '24h' }"
            @click="filter.timeRange = '24h'"
          >
            24小时
          </button>
          <button
            class="radio-btn"
            :class="{ active: filter.timeRange === '7d' }"
            @click="filter.timeRange = '7d'"
          >
            7天
          </button>
          <button
            class="radio-btn"
            :class="{ active: filter.timeRange === '30d' }"
            @click="filter.timeRange = '30d'"
          >
            30天
          </button>
          <button
            class="radio-btn"
            :class="{ active: filter.timeRange === 'all' }"
            @click="filter.timeRange = 'all'"
          >
            全部
          </button>
        </div>
      </div>

      <div class="filter-item">
        <span class="filter-label">阅读状态：</span>
        <div class="radio-group">
          <button
            class="radio-btn"
            :class="{ active: filter.readStatus === 'all' }"
            @click="filter.readStatus = 'all'"
          >
            全部
          </button>
          <button
            class="radio-btn"
            :class="{ active: filter.readStatus === 'unread' }"
            @click="filter.readStatus = 'unread'"
          >
            未读
          </button>
          <button
            class="radio-btn"
            :class="{ active: filter.readStatus === 'read' }"
            @click="filter.readStatus = 'read'"
          >
            已读
          </button>
        </div>
      </div>

      <div class="search-wrapper">
        <input
          v-model="filter.keyword"
          type="text"
          placeholder="搜索发送人/内容"
          class="search-input"
        />
      </div>
    </div>

    <div class="stats-bar">
      <span>总计：{{ list.length }} 条</span>
      <span class="unread">未读：{{ unreadCount }} 条</span>
    </div>

    <div class="list-container">
      <div v-if="list.length === 0" class="empty-box">
        <div class="empty-icon iconfont icon-CDnmxN01"></div>
        <p>暂无通知记录</p>
      </div>

      <div
        v-for="item in list"
        :key="item.id"
        class="list-item"
        :class="{ unread: !item.isRead }"
        @click="handleItemClick(item)"
      >
        <div class="avatar-wrapper">
          <img class="avatar" :src="item.avatar" />
          <div v-if="!item.isRead" class="unread-badge"></div>
        </div>

        <div class="content">
          <div class="content-header">
            <span class="name">{{ item.senderName }}</span>
            <span class="time">{{ item.time }}</span>
          </div>
          <div class="message" :title="item.content">{{ item.content }}</div>
        </div>

        <div class="actions">
          <button class="read-btn" @click.stop="markSingleAsRead(item.id)">
            标记已读
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showClearDialog"
      class="modal-overlay"
      @click="showClearDialog = false"
    >
      <div class="modal-card" @click.stop>
        <div class="modal-header">
          <h3>清除通知历史</h3>
          <button class="modal-close" @click="showClearDialog = false">
            ✕
          </button>
        </div>
        <div class="modal-body">
          <p>请选择清除范围：</p>
          <div class="clear-options">
            <label class="radio-option">
              <input type="radio" v-model="clearOption" :value="7" />
              <span>7天前的记录</span>
            </label>
            <label class="radio-option">
              <input type="radio" v-model="clearOption" :value="30" />
              <span>30天前的记录</span>
            </label>
            <label class="radio-option">
              <input type="radio" v-model="clearOption" :value="0" />
              <span>清空全部记录</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel" @click="showClearDialog = false">
            取消
          </button>
          <button class="modal-btn confirm" @click="confirmClear">
            确认清除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useNotificationStore } from "../stores/notification";
import type { NotificationHistoryItem } from "../stores/notification";

const router = useRouter();
const notificationStore = useNotificationStore();

const filter = ref({
  timeRange: "24h",
  readStatus: "all",
  keyword: "",
});

const showClearDialog = ref(false);
const clearOption = ref(7);

const openClearDialog = () => {
  showClearDialog.value = true;
};

const list = computed(() => {
  let data = [...notificationStore.notificationHistory];

  if (filter.value.timeRange !== "all") {
    const hourMap: Record<string, number> = {
      "24h": 24,
      "7d": 168,
      "30d": 720,
    };
    const hours = hourMap[filter.value.timeRange];
    data = notificationStore.getNotificationHistoryByTimeRange(hours);
  }

  if (filter.value.readStatus === "unread") {
    data = data.filter((i) => !i.isRead);
  } else if (filter.value.readStatus === "read") {
    data = data.filter((i) => i.isRead);
  }

  if (filter.value.keyword.trim()) {
    const kw = filter.value.keyword.toLowerCase();
    data = data.filter(
      (i) =>
        i.senderName.toLowerCase().includes(kw) ||
        i.content.toLowerCase().includes(kw),
    );
  }

  return data;
});

const unreadCount = computed(() => {
  return list.value.filter((i) => !i.isRead).length;
});

const handleItemClick = (item: NotificationHistoryItem) => {
  if (!item.isRead) {
    notificationStore.markNotificationAsRead(item.id);
  }
  router.push({ path: "/message", query: { contactId: item.contactId } });
};

const markSingleAsRead = (id: string) => {
  notificationStore.markNotificationAsRead(id);
};

const markAllAsRead = () => {
  notificationStore.markAllNotificationsAsRead();
};

const confirmClear = () => {
  if (clearOption.value === 0) {
    notificationStore.clearNotificationHistory();
  } else {
    notificationStore.clearNotificationHistory(clearOption.value);
  }
  showClearDialog.value = false;
};
</script>

<style scoped lang="scss">
.notification-history-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: #1a1a1a;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    padding: 5px 12px;
    background: #f5f5f5;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;

    &:hover {
      background: #e5e5e5;
    }

    &.danger {
      color: #ff3b30;

      &:hover {
        background: #ffe6e6;
      }
    }
  }
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;

  .filter-label {
    font-size: 13px;
    color: #666;
  }
}

.radio-group {
  display: flex;
  gap: 4px;
}

.radio-btn {
  padding: 4px 10px;
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: #e5e5e5;
  }

  &.active {
    background: #007aff;
    color: #fff;
  }
}

.search-wrapper {
  margin-left: auto;
}

.search-input {
  padding: 5px 10px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 12px;
  width: 180px;
  outline: none;

  &:focus {
    border-color: #007aff;
  }
}

.stats-bar {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  font-size: 12px;
  color: #8e8e93;

  .unread {
    color: #ff3b30;
  }
}

.list-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 12px;

  .empty-icon {
    font-size: 60px;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #8e8e93;
  }
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  border: 1px solid transparent;

  &:hover {
    border-color: #e5e5e5;
  }

  &.unread {
    background: #f0f7ff;
  }
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: #e5e5e5;
}

.unread-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  background: #ff3b30;
  border-radius: 50%;
  border: 2px solid #fff;
}

.content {
  flex: 1;
  min-width: 0;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;

  .name {
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
  }

  .time {
    font-size: 11px;
    color: #8e8e93;
  }
}

.message {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  flex-shrink: 0;
}

.read-btn {
  padding: 4px 10px;
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;

  &:hover {
    background: #e5e5e5;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
}

.modal-card {
  width: 360px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e5e5;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
  }

  .modal-close {
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 14px;
    color: #8e8e93;

    &:hover {
      background: #f5f5f5;
    }
  }
}

.modal-body {
  padding: 16px;

  p {
    margin: 0 0 12px;
    font-size: 13px;
    color: #1a1a1a;
  }
}

.clear-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #1a1a1a;

  input {
    margin: 0;
  }
}

.modal-footer {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid #e5e5e5;
}

.modal-btn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;

  &.cancel {
    background: #f5f5f5;
    color: #1a1a1a;

    &:hover {
      background: #e5e5e5;
    }
  }

  &.confirm {
    background: #ff3b30;
    color: #fff;

    &:hover {
      background: #d63026;
    }
  }
}
</style>
