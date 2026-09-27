<template>
  <div class="content-container">
    <!-- 消息列表 -->
    <div v-if="contentType === 'message'" class="contact-list">
      <div
        v-for="contact in filteredContacts"
        :key="contact.id"
        class="contact-card"
        :class="{
          active: contact.id === currentActiveContactId,
          'is-top': contact.isTop,
          'is-muted': contact.isMuted,
        }"
        @click="handleContactClick(String(contact.id))"
      >
        <div class="contact-avatar-container">
          <div class="avatar-wrapper">
            <img :src="contact.avatar" :alt="contact.name" class="avatar" />
            <div
              v-if="contact.unreadCount && contact.unreadCount > 0"
              class="unread-badge-on-avatar"
            >
              {{ contact.unreadCount > 99 ? "99+" : contact.unreadCount }}
            </div>
          </div>
        </div>

        <div class="contact-info">
          <div class="contact-header">
            <div class="contact-name-row">
              <h4 class="contact-name">
                {{ contact.remark || contact.name }}
              </h4>
              <div class="contact-time">
                {{ contact.lastMessageTime }}
              </div>
            </div>
          </div>

          <div class="contact-content">
            <div class="last-message">
              <p class="message-text">{{ contact.lastMessage }}</p>

              <div class="contact-icons-inline">
                <div class="top-icon" v-show="contact.isTop">
                  <PushpinOutlined />
                </div>
                <div class="mute-icon" v-show="contact.isMuted">
                  <BellFilled />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showNoContentTip" class="empty-state">
        <i
          class="iconfont icon-wangluoyichang empty-icon"
          :style="{ color: currentThemeColor }"
        ></i>
        <p class="empty-text">暂无聊天记录</p>
      </div>
    </div>

    <!-- 好友 / 群聊 -->
    <div v-else-if="contentType === 'friend'" class="friend-list">
      <!-- 通知入口 -->
      <div class="notice-list">
        <div class="notice-item" @click="handleNoticeClick('friend')">
          <span class="notice-text">好友通知</span>
          <span class="notice-arrow">
            <i class="iconfont icon-arrow-right"></i>
          </span>
        </div>
        <div class="notice-item" @click="handleNoticeClick('group')">
          <span class="notice-text">群通知</span>
          <span class="notice-arrow">
            <i class="iconfont icon-arrow-right"></i>
          </span>
        </div>
      </div>

      <!-- Tab 切换栏 -->
      <div class="tab-bar">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'friend' }"
          @click="activeTab = 'friend'"
        >
          <span>好友列表</span>
          <span v-if="friendUnreadCount > 0" class="tab-badge">
            {{ friendUnreadCount > 99 ? "99+" : friendUnreadCount }}
          </span>
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'group' }"
          @click="activeTab = 'group'"
        >
          <span>群聊列表</span>
          <span v-if="groupUnreadCount > 0" class="tab-badge">
            {{ groupUnreadCount > 99 ? "99+" : groupUnreadCount }}
          </span>
        </div>
      </div>

      <div class="tab-content">
        <!-- 好友列表 -->
        <div v-show="activeTab === 'friend'" class="list-panel">
          <!-- ===== 好友分组下拉框 ===== -->
          <div class="category-collapse">
            <div v-for="category in friendCategories" :key="category.key" class="collapse-group">
              <div class="collapse-header" @click="toggleFriendCategory(category.key)">
                <span class="collapse-arrow" :class="{ expanded: category.expanded }">
                  <i class="iconfont icon-arrow-right"></i>
                </span>
                <span class="collapse-title">{{ category.label }}</span>
                <span class="collapse-count">{{ getFriendCountByCategory(category.key) }}</span>
              </div>
              <div v-show="category.expanded" class="collapse-body">
                <div
                  v-for="friend in getFriendsByCategory(category.key)"
                  :key="'friend-' + friend.id"
                  class="friend-card"
                  :class="{ active: friend.id === currentActiveContactId }"
                  @click="handleContactClick(friend.id)"
                >
                  <div class="friend-avatar-container">
                    <div class="avatar-wrapper">
                      <img :src="friend.avatar" :alt="friend.name" class="avatar" />
                      <div
                        v-if="shouldShowOnlineStatus(friend)"
                        class="status-indicator"
                        :class="{ online: friend.isOnline }"
                      ></div>
                    </div>
                  </div>

                  <div class="friend-info">
                    <div class="friend-header">
                      <h4 class="friend-name">
                        {{ friend.remark || friend.name }}
                      </h4>
                      <div
                        v-if="shouldShowOnlineStatus(friend) && friend.isOnline"
                        class="online-status"
                      >
                        在线
                      </div>
                    </div>

                    <div class="friend-content">
                      <p class="friend-bio">{{ friend.bio || "暂无个性签名" }}</p>
                    </div>
                  </div>
                </div>

                <div
                  v-if="getFriendsByCategory(category.key).length === 0"
                  class="empty-category-inline"
                >
                  <p class="empty-text">暂无好友</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 搜索结果 / 无分组时的普通列表 -->
          <template v-if="!showFriendCategories">
            <div
              v-for="friend in filteredFriends"
              :key="'friend-' + friend.id"
              class="friend-card"
              :class="{ active: friend.id === currentActiveContactId }"
              @click="handleContactClick(friend.id)"
            >
              <div class="friend-avatar-container">
                <div class="avatar-wrapper">
                  <img :src="friend.avatar" :alt="friend.name" class="avatar" />
                  <div
                    v-if="shouldShowOnlineStatus(friend)"
                    class="status-indicator"
                    :class="{ online: friend.isOnline }"
                  ></div>
                </div>
              </div>

              <div class="friend-info">
                <div class="friend-header">
                  <h4 class="friend-name">
                    {{ friend.remark || friend.name }}
                  </h4>
                  <div
                    v-if="shouldShowOnlineStatus(friend) && friend.isOnline"
                    class="online-status"
                  >
                    在线
                  </div>
                </div>

                <div class="friend-content">
                  <p class="friend-bio">{{ friend.bio || "暂无个性签名" }}</p>
                </div>
              </div>
            </div>

            <div v-if="filteredFriends.length === 0" class="empty-category">
              <i
                class="iconfont icon-wangluoyichang"
                style="font-size: 30px"
                :style="{ color: currentThemeColor }"
              ></i>
              <p class="empty-text">暂无好友</p>
            </div>
          </template>
        </div>

        <!-- 群聊列表 -->
        <div v-show="activeTab === 'group'" class="list-panel">
          <!-- ===== 群聊分组下拉框 ===== -->
          <div class="category-collapse">
            <div v-for="category in groupCategories" :key="category.key" class="collapse-group">
              <div class="collapse-header" @click="toggleGroupCategory(category.key)">
                <span class="collapse-arrow" :class="{ expanded: category.expanded }">
                  <i class="iconfont icon-arrow-right"></i>
                </span>
                <span class="collapse-title">{{ category.label }}</span>
                <span class="collapse-count">{{ getGroupCountByCategory(category.key) }}</span>
              </div>
              <div v-show="category.expanded" class="collapse-body">
                <div
                  v-for="group in getGroupsByCategory(category.key)"
                  :key="'group-' + group.id"
                  class="friend-card group-card"
                  :class="{ active: group.id === currentActiveContactId }"
                  @click="handleContactClick(group.id)"
                >
                  <div class="friend-avatar-container">
                    <div class="avatar-wrapper">
                      <img :src="group.avatar" :alt="group.name" class="avatar" />
                    </div>
                  </div>

                  <div class="friend-info">
                    <div class="friend-header">
                      <h4 class="friend-name">
                        {{ group.remark || group.name }}
                      </h4>
                    </div>

                    <div class="friend-content">
                      <p class="friend-bio">
                        <span v-if="group.bio">{{ group.bio }}</span>
                        <span v-else>暂无群公告</span>
                        <span class="member-count">({{ group.memberCount }}人)</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  v-if="getGroupsByCategory(category.key).length === 0"
                  class="empty-category-inline"
                >
                  <p class="empty-text">暂无群聊</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 搜索结果 / 无分组时的普通列表 -->
          <template v-if="!showGroupCategories">
            <div
              v-for="group in filteredGroups"
              :key="'group-' + group.id"
              class="friend-card group-card"
              :class="{ active: group.id === currentActiveContactId }"
              @click="handleContactClick(group.id)"
            >
              <div class="friend-avatar-container">
                <div class="avatar-wrapper">
                  <img :src="group.avatar" :alt="group.name" class="avatar" />
                </div>
              </div>

              <div class="friend-info">
                <div class="friend-header">
                  <h4 class="friend-name">
                    {{ group.remark || group.name }}
                  </h4>
                </div>

                <div class="friend-content">
                  <p class="friend-bio">
                    <span v-if="group.bio">{{ group.bio }}</span>
                    <span v-else>暂无群公告</span>
                    <span class="member-count">({{ group.memberCount }}人)</span>
                  </p>
                </div>
              </div>
            </div>

            <div v-if="filteredGroups.length === 0" class="empty-category">
              <i
                class="iconfont icon-wangluoyichang"
                style="font-size: 30px"
                :style="{ color: currentThemeColor }"
              ></i>
              <p class="empty-text">暂无群聊</p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import type { Contact } from "../types/chatTypes";
import { useUserStore } from "../stores/user";
import { useSiderColor } from "../stores/siderColor";
import { PushpinOutlined, BellFilled } from "@ant-design/icons-vue";
import { shouldShowOnlineStatus as checkOnlineVisibility } from "../untils/levelUtils";

const siderColorStore = useSiderColor();

const currentThemeColor = computed(() => {
  return siderColorStore.currentColorPalette.textPrimary || "#6366F1";
});

interface Friend {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  isOnline?: boolean;
  remark?: string;
  onlineVisibility?: number;
  category?: string; // 分组标识
}

interface Group {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  isOnline?: boolean;
  remark?: string;
  isGroup?: boolean;
  groupNumber?: string;
  memberCount?: number;
  isAdmin?: boolean;
  category?: string; // 分组标识
}

interface Props {
  contentType: "message" | "friend" | "group";
  contacts?: Contact[];
  friends?: Friend[];
  groups?: Group[];
  activeContactId?: string;
  searchQuery?: string;
  placeholder?: string;
  unreadMessageCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  contentType: "message",
  contacts: () => [],
  friends: () => [],
  groups: () => [],
  searchQuery: "",
  placeholder: "搜索",
  unreadMessageCount: 0,
});

const emit = defineEmits<{
  contactSelect: [id: string];
  closeDrawer: [];
  refreshContacts: [];
  friendNoticeClick: [];
  groupNoticeClick: [];
}>();

const userStore = useUserStore();

const activeTab = ref<"friend" | "group">("friend");

const currentActiveContactId = computed(() => props.activeContactId || "");

const shouldShowOnlineStatus = (friend: any): boolean => {
  const currentUserId = userStore.user?.id;
  return checkOnlineVisibility(
    {
      onlineVisibility: friend.onlineVisibility,
      status: friend.status,
      id: friend.id,
    },
    currentUserId,
    true,
  );
};

// ========== 好友分组配置（默认关闭） ==========
const friendCategories = reactive([
  { key: "myDevice", label: "我的设备", expanded: false },
  { key: "robot", label: "机器人", expanded: false },
  { key: "specialCare", label: "特别关心", expanded: false },
  { key: "myFriend", label: "我的好友", expanded: false },
]);

// ========== 群聊分组配置（默认关闭） ==========
const groupCategories = reactive([
  { key: "topGroup", label: "置顶群聊", expanded: false },
  { key: "unnamedGroup", label: "未命名的群聊", expanded: false },
  { key: "createdGroup", label: "我创建的群聊", expanded: false },
  { key: "managedGroup", label: "我管理的群聊", expanded: false },
  { key: "joinedGroup", label: "我加入的群聊", expanded: false },
]);

// 切换好友分组展开/收起
const toggleFriendCategory = (key: string) => {
  const category = friendCategories.find((c) => c.key === key);
  if (category) {
    category.expanded = !category.expanded;
  }
};

// 切换群聊分组展开/收起
const toggleGroupCategory = (key: string) => {
  const category = groupCategories.find((c) => c.key === key);
  if (category) {
    category.expanded = !category.expanded;
  }
};

// 根据分组标识获取好友列表
const getFriendsByCategory = (categoryKey: string): Friend[] => {
  if (!props.friends) return [];
  return props.friends.filter((friend) => {
    if (friend.category) {
      return friend.category === categoryKey;
    }
    // 模拟映射：根据 id 尾号简单分配（仅演示，实际请替换为真实数据）
    if (categoryKey === "myDevice" && friend.id.endsWith("1")) return true;
    if (categoryKey === "robot" && friend.id.endsWith("2")) return true;
    if (categoryKey === "specialCare" && friend.id.endsWith("3")) return true;
    if (categoryKey === "myFriend") {
      return !friend.id.endsWith("1") && !friend.id.endsWith("2") && !friend.id.endsWith("3");
    }
    return false;
  });
};

// 根据分组标识获取群聊列表
const getGroupsByCategory = (categoryKey: string): Group[] => {
  if (!props.groups) return [];
  return props.groups.filter((group) => {
    if (group.category) {
      return group.category === categoryKey;
    }
    // 模拟映射（仅演示，实际请替换为真实数据）
    const id = group.id;
    if (categoryKey === "topGroup" && id.endsWith("1")) return true;
    if (categoryKey === "unnamedGroup" && !group.name) return true;
    if (categoryKey === "createdGroup" && id.endsWith("2")) return true;
    if (categoryKey === "managedGroup" && id.endsWith("3")) return true;
    if (categoryKey === "joinedGroup") {
      return !id.endsWith("1") && !id.endsWith("2") && !id.endsWith("3");
    }
    return false;
  });
};

// 统计分组内好友数量
const getFriendCountByCategory = (categoryKey: string): number => {
  return getFriendsByCategory(categoryKey).length;
};

// 统计分组内群聊数量
const getGroupCountByCategory = (categoryKey: string): number => {
  return getGroupsByCategory(categoryKey).length;
};

// 是否展示好友分组（有搜索词时不展示分组，直接展示搜索结果）
const showFriendCategories = computed(() => {
  return !props.searchQuery;
});

// 是否展示群聊分组（有搜索词时不展示分组）
const showGroupCategories = computed(() => {
  return !props.searchQuery;
});

const filteredContacts = computed(() => {
  const list = props.contacts || [];

  if (!props.searchQuery) {
    const sortedList = [...list].sort((a, b) => {
      const aIsTop = a.isTop ? 1 : 0;
      const bIsTop = b.isTop ? 1 : 0;
      if (aIsTop !== bIsTop) return bIsTop - aIsTop;
      const timeA = a.lastMessageTime || "";
      const timeB = b.lastMessageTime || "";
      return timeB.localeCompare(timeA);
    });
    return sortedList;
  }

  const lowerQuery = props.searchQuery?.toLowerCase() || "";
  const topContacts: Contact[] = [];
  const normalContacts: Contact[] = [];

  for (const contact of list) {
    const isTop = contact.isTop ?? false;

    const nameMatch = contact.name.toLowerCase().includes(lowerQuery);
    const remarkMatch = contact.remark ? contact.remark.toLowerCase().includes(lowerQuery) : false;
    const messageMatch = contact.lastMessage
      ? contact.lastMessage.toLowerCase().includes(lowerQuery)
      : false;
    const groupNumberMatch = contact.isGroup
      ? contact.groupNumber?.includes(props.searchQuery)
      : false;

    if (!nameMatch && !remarkMatch && !messageMatch && !groupNumberMatch) {
      continue;
    }

    if (isTop) {
      topContacts.push(contact);
    } else {
      normalContacts.push(contact);
    }
  }

  topContacts.sort((a, b) => {
    const timeA = a.lastMessageTime || "";
    const timeB = b.lastMessageTime || "";
    return timeB.localeCompare(timeA);
  });

  normalContacts.sort((a, b) => {
    const timeA = a.lastMessageTime || "";
    const timeB = b.lastMessageTime || "";
    return timeB.localeCompare(timeA);
  });

  return topContacts.length ? [...topContacts, ...normalContacts] : [...normalContacts];
});

const filteredFriends = computed(() => {
  if (!props.friends || props.friends.length === 0) return [];
  if (!props.searchQuery) return props.friends;

  const lowerQuery = props.searchQuery.toLowerCase();
  return props.friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(lowerQuery) ||
      (friend.remark && friend.remark.toLowerCase().includes(lowerQuery)),
  );
});

const filteredGroups = computed(() => {
  if (!props.groups || props.groups.length === 0) return [];
  if (!props.searchQuery) return props.groups;

  const query = props.searchQuery;
  return props.groups.filter(
    (group) =>
      group.name.toLowerCase().includes(query.toLowerCase()) || group.groupNumber?.includes(query),
  );
});

const showNoContentTip = computed(() => {
  return props.contentType === "message"
    ? filteredContacts.value.length === 0
    : props.contentType === "friend"
      ? filteredFriends.value.length === 0
      : filteredGroups.value.length === 0;
});

const friendUnreadCount = computed(() => {
  return (props.friends || []).reduce((total: number, friend: any) => {
    return total + (friend.unreadCount || 0);
  }, 0);
});

const groupUnreadCount = computed(() => {
  return (props.groups || []).reduce((total: number, group: any) => {
    return total + (group.unreadCount || 0);
  }, 0);
});

const totalUnreadCount = computed(() => {
  if (props.unreadMessageCount && props.unreadMessageCount > 0) {
    return props.unreadMessageCount;
  }
  return (props.contacts || []).reduce((total, contact) => {
    return total + (contact.unreadCount || 0);
  }, 0);
});

const handleContactClick = async (contactId: string) => {
  emit("closeDrawer");
  emit("contactSelect", contactId);
};

const handleNoticeClick = (type: "friend" | "group") => {
  if (type === "friend") {
    emit("friendNoticeClick");
  } else {
    emit("groupNoticeClick");
  }
};
</script>

<style lang="scss" scoped>
.content-container {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
  display: flex;
  flex-direction: column;

  --primary-color: v-bind("siderColorStore.currentColor");
  --primary-hover-color: v-bind("siderColorStore.currentColorPalette.hover");
  --primary-active-color: v-bind("siderColorStore.currentColorPalette.active");

  --bg-hover: v-bind("siderColorStore.contactItemHoverBg");
  --bg-active: v-bind("siderColorStore.contactItemActiveBg");
  --bg-top: v-bind("`rgba(${siderColorStore.currentColorPalette.light.replace('#', ' ')}, 0.6)`");

  --text-primary: v-bind("siderColorStore.currentColorPalette.textPrimary");
  --text-secondary: v-bind("siderColorStore.currentColorPalette.textSecondary");
  border-right: 1px solid v-bind("siderColorStore.dividerLineColorValue");
}

// ============ 消息列表样式 ============
.contact-list {
  flex: 1;
  display: flex;
  flex-direction: column;

  .contact-card {
    display: flex;
    align-items: center;
    cursor: pointer;
    border-radius: 4px;
    box-sizing: border-box;
    margin: 2px;
    padding: 12px;
    background: transparent;

    &:hover {
      background: var(--bg-hover);
    }

    &.active {
      background: var(--bg-active);
    }

    &.is-top {
      background: var(--bg-active);
    }

    &.is-top.active {
      background: var(--bg-active);
    }

    .contact-avatar-container {
      margin-right: 16px;
      position: relative;
      flex-shrink: 0;

      .avatar-wrapper {
        position: relative;
        width: 48px;
        height: 48px;

        .avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .unread-badge-on-avatar {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          background: v-bind("siderColorStore.currentColorPalette.dangerColor");
          color: white;
          border-radius: 9px;
          font-size: 10px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          z-index: 10;
        }
      }
    }

    .contact-info {
      flex: 1;
      min-width: 0;

      .contact-header {
        .contact-name-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;

          .contact-name {
            font-size: 15px;
            font-weight: 500;
            color: var(--text-primary);
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .contact-time {
            font-size: 12px;
            color: var(--text-primary);
            flex-shrink: 0;
            margin-left: 8px;
          }
        }
      }

      .contact-content {
        .last-message {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .message-text {
            font-size: 13px;
            color: var(--text-primary);
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
          }

          .contact-icons-inline {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-left: 10px;
            flex-shrink: 0;

            .top-icon,
            .mute-icon {
              color: var(--primary-color);
              font-size: 14px;
            }
          }
        }
      }
    }
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    min-height: 300px;

    .empty-icon {
      font-size: 96px;
      color: var(--primary-color);
      margin-bottom: 24px;
    }

    .empty-text {
      font-size: 14px;
      color: var(--text-primary);
      margin: 0;
    }
  }
}

// ============ 好友/群聊 Tab 样式 ============
.friend-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  // ---- 通知入口（无边框）----
  .notice-list {
    display: flex;
    flex-direction: column;
    margin: 4px 8px 0;
    flex-shrink: 0;

    .notice-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 40px;
      padding: 0 8px;
      cursor: pointer;
      background: transparent;
      border-radius: 4px;
      transition: background 0.2s ease;

      & + .notice-item {
        border-top: 1px solid v-bind("siderColorStore.dividerLineColorValue");
      }

      &:hover {
        background: var(--bg-hover);
      }

      .notice-text {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
      }

      .notice-arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: var(--text-secondary);

        .iconfont {
          font-size: 16px;
        }
      }
    }
  }

  // ---- Tab 栏（选中纯填充）----
  .tab-bar {
    display: flex;
    margin: 8px;
    padding: 1px;
    border: 1px solid var(--primary-color);
    border-radius: 6px;
    background: transparent;
    flex-shrink: 0;
    overflow: hidden;

    .tab-item {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 32px;
      font-size: 14px;
      color: var(--text-primary);
      cursor: pointer;
      border-radius: 4px;
      user-select: none;
      transition:
        background 0.2s ease,
        color 0.2s ease;
      position: relative;

      &:hover {
        background: var(--bg-hover);
      }

      &.active {
        background: var(--primary-color);
        color: #fff;
      }

      .tab-badge {
        min-width: 16px;
        height: 16px;
        padding: 0 4px;
        background: var(--danger-color, #f5222d);
        color: #fff;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }
    }
  }

  // ---- Tab 内容 ----
  .tab-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .list-panel {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 4px 0;
    }
  }

  // ---- 分组下拉框 ----
  .category-collapse {
    display: flex;
    flex-direction: column;
    padding: 0 4px;

    .collapse-group {
      margin-bottom: 2px;

      .collapse-header {
        display: flex;
        align-items: center;
        height: 38px;
        padding: 0 12px;
        cursor: pointer;
        border-radius: 4px;
        transition: background 0.2s ease;
        user-select: none;

        &:hover {
          background: var(--bg-hover);
        }

        .collapse-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 8px;
          font-size: 14px;
          color: var(--text-secondary);
          transition: transform 0.25s ease;
          flex-shrink: 0;

          &.expanded {
            transform: rotate(90deg);
          }

          .iconfont {
            font-size: 14px;
          }
        }

        .collapse-title {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .collapse-count {
          font-size: 12px;
          color: var(--text-secondary);
          flex-shrink: 0;
          margin-left: 8px;
        }
      }

      .collapse-body {
        padding-left: 8px;
      }
    }
  }

  // ---- 卡片 ----
  .friend-card,
  .group-card {
    display: flex;
    align-items: center;
    cursor: pointer;
    border-radius: 4px;
    box-sizing: border-box;
    margin: 2px;
    padding: 12px;
    background: transparent;

    &:hover {
      background: var(--bg-hover);
    }

    &.active {
      background: var(--bg-active);
    }

    .friend-avatar-container {
      margin-right: 16px;
      position: relative;
      flex-shrink: 0;

      .avatar-wrapper {
        position: relative;
        width: 48px;
        height: 48px;

        .avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .status-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--text-secondary);
          border: 2px solid var(--bg-primary, #fff);

          &.online {
            background: var(--success-color, #52c41a);
          }
        }
      }
    }

    .friend-info {
      flex: 1;
      min-width: 0;

      .friend-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;

        .friend-name {
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .online-status {
          font-size: 12px;
          color: rgb(48, 193, 48);
          flex-shrink: 0;
          margin-left: 8px;
        }
      }

      .friend-content {
        .friend-bio {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          .member-count {
            color: var(--text-secondary);
            font-size: 12px;
          }
        }
      }
    }
  }

  // ---- 空态 ----
  .empty-category {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;

    .empty-icon {
      font-size: 96px;
      color: var(--text-secondary);
      margin-bottom: 24px;
    }

    .empty-text {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
    }
  }

  // ---- 分组内空态 ----
  .empty-category-inline {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px 20px;
    margin: 0 8px;

    .empty-text {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0;
    }
  }
}
</style>
