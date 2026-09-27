<template>
  <div class="profile-page">
    <Sidebar :current-area="'friend'" />

    <div class="profile-layout">
      <MiddleArea
        :content-type="currentContentType"
        :friends="friendsList"
        :groups="groupsList"
        :active-contact-id="activeContactId"
        placeholder="搜索"
        no-content-tip="无结果"
        @contact-select="handleContactSelect"
        @refresh-contacts="handleRefreshContacts"
      />

      <!-- 右侧详情面板 -->
      <div class="profile-detail" v-if="activeContactId">
        <!-- 头部区域 -->
        <div class="detail-header">
          <div class="avatar-wrapper">
            <img
              :src="selectedContact?.avatar || defaultAvatar"
              class="detail-avatar"
              @error="handleAvatarError"
            />
            <span
              v-if="selectedContact?.isOnline && !selectedContact?.isGroup"
              class="online-badge"
            ></span>
          </div>
          <div class="header-info">
            <div class="contact-name">{{ selectedContact?.name || "未知用户" }}</div>
            <div
              class="contact-sub uin-text"
              v-if="!selectedContact?.isGroup && selectedContact?.username"
            >
              账号：{{ selectedContact.username }}
            </div>
            <div
              class="contact-sub uin-text"
              v-if="selectedContact?.isGroup && selectedContact?.groupNumber"
            >
              群号：{{ selectedContact.groupNumber }}
            </div>
            <div class="status-text" v-if="selectedContact?.isOnline && !selectedContact?.isGroup">
              在线
            </div>
          </div>
        </div>

        <!-- 签名/介绍 -->
        <div class="sign-block" v-if="hasBio">
          <div class="sign-title">
            {{ selectedContact?.isGroup ? "群介绍" : "个性签名" }}
          </div>
          <div class="sign-content">
            {{ selectedContact?.bio || selectedContact?.description || "暂无" }}
          </div>
        </div>

        <!-- 基础资料列表 -->
        <div class="info-section">
          <div
            class="info-row"
            v-if="
              !selectedContact?.isGroup &&
              selectedContact?.gender !== undefined &&
              selectedContact?.gender !== 2
            "
          >
            <div class="row-label">性别</div>
            <div class="row-value">
              {{ formatGender(selectedContact.gender) }}
            </div>
          </div>

          <div class="info-row" v-if="!selectedContact?.isGroup && selectedContact?.birthday">
            <div class="row-label">生日</div>
            <div class="row-value">{{ selectedContact.birthday }}</div>
          </div>

          <div class="info-row" v-if="!selectedContact?.isGroup && selectedContact?.age">
            <div class="row-label">年龄</div>
            <div class="row-value">{{ selectedContact.age }}岁</div>
          </div>

          <div class="info-row" v-if="!selectedContact?.isGroup && selectedContact?.zodiacSign">
            <div class="row-label">星座</div>
            <div class="row-value">{{ selectedContact.zodiacSign }}</div>
          </div>

          <div class="info-row" v-if="!selectedContact?.isGroup && selectedContact?.hometown">
            <div class="row-label">家乡</div>
            <div class="row-value">{{ selectedContact.hometown }}</div>
          </div>

          <div class="info-row" v-if="selectedContact?.email">
            <div class="row-label">邮箱</div>
            <div class="row-value">{{ selectedContact.email }}</div>
          </div>

          <div class="info-row" v-if="selectedContact?.phone">
            <div class="row-label">手机</div>
            <div class="row-value">{{ selectedContact.phone }}</div>
          </div>

          <div class="info-row" v-if="selectedContact?.remark">
            <div class="row-label">备注</div>
            <div class="row-value">{{ selectedContact.remark }}</div>
          </div>

          <div class="info-row" v-if="selectedContact?.isGroup && selectedContact?.myGroupNickname">
            <div class="row-label">我的群昵称</div>
            <div class="row-value">{{ selectedContact.myGroupNickname }}</div>
          </div>

          <div class="info-row" v-if="selectedContact?.isGroup && selectedContact?.category">
            <div class="row-label">群分类</div>
            <div class="row-value">
              {{ formatCategory(selectedContact.category) }}
            </div>
          </div>

          <div class="info-row" v-if="selectedContact?.isGroup && groupDetails?.owner?.nickname">
            <div class="row-label">群主</div>
            <div class="row-value">{{ groupDetails.owner.nickname }}</div>
          </div>

          <div class="info-row" v-if="selectedContact?.isGroup && selectedContact?.createTime">
            <div class="row-label">创建时间</div>
            <div class="row-value">{{ selectedContact.createTime }}</div>
          </div>

          <div class="info-row" v-if="selectedContact?.isGroup && selectedContact?.maxMembers">
            <div class="row-label">成员上限</div>
            <div class="row-value">{{ selectedContact.maxMembers }}人</div>
          </div>

          <div
            class="info-row"
            v-if="selectedContact?.isGroup && selectedContact?.isPrivate !== undefined"
          >
            <div class="row-label">隐私模式</div>
            <div class="row-value">
              {{ selectedContact.isPrivate ? "私密群" : "公开群" }}
            </div>
          </div>

          <div
            class="info-row"
            v-if="selectedContact?.isGroup && selectedContact?.requireApproval !== undefined"
          >
            <div class="row-label">入群验证</div>
            <div class="row-value">
              {{ selectedContact.requireApproval ? "需要验证" : "无需验证" }}
            </div>
          </div>

          <div class="info-row" v-if="!selectedContact?.isGroup && selectedContact?.friendSince">
            <div class="row-label">成为好友</div>
            <div class="row-value">{{ selectedContact.friendSince }}</div>
          </div>
        </div>

        <!-- 群标签 -->
        <div class="tags-block" v-if="selectedContact?.isGroup && selectedContact?.tags?.length">
          <div class="block-label">群标签</div>
          <div class="tags-list">
            <span v-for="tag in selectedContact.tags" :key="tag" class="tag-item">{{ tag }}</span>
          </div>
        </div>

        <!-- 群成员区域 -->
        <div class="members-block" v-if="selectedContact?.isGroup && groupDetails?.members?.length">
          <div class="members-header">
            <div class="members-header-left">
              <span class="block-label">群成员（{{ groupDetails.members.length }}）</span>
            </div>
            <div class="members-header-right">
              <button class="invite-btn" @click="handleAddMemberClick">+ 邀请好友</button>
              <button class="update-btn" @click="handleViewUpdates">查看更新</button>
            </div>
          </div>

          <!-- 群成员列表 -->
          <div class="members-list-wrapper">
            <div class="members-list">
              <div v-for="m in displayedMembers" :key="m.id" class="member-info">
                <img :src="m.avatar" class="member-avatar" @error="handleAvatarError" />
                <span class="member-nickname">{{ m.name }}</span>
              </div>
              <div
                v-if="groupDetails.members.length > 6 && !showAllMembers"
                class="member-info more-members"
                @click="handleViewAllMembers"
              >
                <div class="more-icon">+{{ groupDetails.members.length - 6 }}</div>
                <span class="member-nickname">查看更多</span>
              </div>
            </div>
            <!-- 展开全部成员 -->
            <div v-if="showAllMembers" class="members-list all-members">
              <div v-for="m in remainingMembers" :key="m.id" class="member-info">
                <img :src="m.avatar" class="member-avatar" @error="handleAvatarError" />
                <span class="member-nickname">{{ m.name }}</span>
              </div>
              <div class="member-info more-members" @click="showAllMembers = false">
                <div class="more-icon collapse-icon">收起</div>
                <span class="member-nickname">收起</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作按钮 -->
        <div class="action-buttons">
          <button class="action-btn primary" @click="startChat">发消息</button>
          <button
            v-if="!selectedContact?.isGroup && !selectedContact?.isSelf"
            class="action-btn"
            @click="handleEditAction"
          >
            编辑备注
          </button>
          <button
            v-if="!selectedContact?.isGroup && !selectedContact?.isSelf"
            class="action-btn danger"
            @click="deleteFriend"
          >
            删除好友
          </button>
          <button
            v-if="selectedContact?.isGroup && !isGroupOwner"
            class="action-btn danger"
            @click="quitGroup"
          >
            退出群聊
          </button>
          <button
            v-if="selectedContact?.isGroup && isGroupOwner"
            class="action-btn danger"
            @click="dismissGroup"
          >
            解散群聊
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-else>
        <div class="empty-placeholder">
          <i class="iconfont icon-profile"></i>
          <p>请在左侧选择联系人查看资料</p>
        </div>
      </div>
    </div>

    <!-- 模态框 -->
    <ContactModal
      v-model="showEditModal"
      :type="currentEditType"
      :contact="selectedContact || {}"
      :initial-value="currentEditInitialValue"
      @confirm="handleConfirmEdit"
      @close="handleCloseEdit"
    />

    <AddGroupMemberModal
      :visible="showAddMemberModal"
      @update:visible="
        (val) => {
          showAddMemberModal = val;
        }
      "
      :group-id="selectedContact?.originalId || ''"
      :current-user-id="String(userStore.user?.id || '')"
      :group-members="groupDetails?.members"
      :allow-member-invite="groupDetails?.allowMemberInvite"
      :is-group-owner-or-admin="isGroupAdmin"
      @refresh-contacts="fetchGroupsList"
    />

    <!-- 查看更新弹窗 -->
    <UpdateModal
      v-model:visible="showUpdateModal"
      :group-id="selectedContact?.originalId || ''"
      :group-members="groupDetails?.members"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { ref, computed, onMounted } from "vue";
import { message, Modal } from "ant-design-vue";
import { ExclamationCircleOutlined } from "@ant-design/icons-vue";
import { createVNode } from "vue";
import request from "../untils/request";
import { handleEditRemark as editRemarkUtil } from "../untils/contactManager";
import { useUserStore } from "../stores/user";
import { useSiderColor } from "../stores/siderColor";
import { getFriends } from "../untils/friendManager";
import UpdateModal from "./UpdateModal.vue";

const router = useRouter();
const userStore = useUserStore();
const siderColorStore = useSiderColor();

// 🔥 使用主题变量
const theme = computed(() => siderColorStore.currentColor);
const textPrimary = computed(() => siderColorStore.textPrimaryColor);
const textSecondary = computed(() => siderColorStore.textSecondaryColor);
const bgPrimary = computed(() => siderColorStore.bgPrimaryColor);
const bgStart = computed(() => siderColorStore.chatBgStartColor);
const bgEnd = computed(() => siderColorStore.chatBgEndColor);
const borderColor = computed(() => siderColorStore.borderLightColor);
const cardBg = computed(() => siderColorStore.bgPrimaryColor);
const dangerColor = computed(() => siderColorStore.dangerColorValue);

const defaultAvatar = "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png";

interface Friend {
  id: string;
  originalId: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  bio: string;
  remark?: string;
  isSelf?: boolean;
  isGroup: boolean;
  groupNumber?: string;
  memberCount?: number;
  role?: "owner" | "admin" | "member";
  createTime?: string;
  updatedAt?: string;
  username?: string;
  gender?: number;
  birthday?: string;
  age?: number;
  zodiacSign?: string;
  hometown?: string;
  email?: string;
  phone?: string;
  friendSince?: string;
  myGroupNickname?: string;
  tags?: string[];
  category?: string;
  description?: string;
  maxMembers?: number;
  isPrivate?: boolean;
  requireApproval?: boolean;
}

const generatePrefixedId = (type: "friend" | "group", id: string) => `${type}_${id}`;
const parsePrefixedId = (prefixedId: string) => {
  const [type, originalId] = prefixedId.split("_");
  return { type: type as any, originalId: originalId || "" };
};

const friendsList = ref<Friend[]>([]);
const groupsList = ref<Friend[]>([]);
const allContacts = ref<Friend[]>([]);
const activeContactId = ref("");
const currentContentType = ref<"friend" | "group">("friend");
const groupDetails = ref<any>(null);

const showEditModal = ref(false);
const currentEditType = ref<"remark" | "nickname">("remark");
const currentEditInitialValue = ref("");
const showAddMemberModal = ref(false);
const showAllMembers = ref(false);
const showUpdateModal = ref(false);

const selectedContact = computed(() =>
  allContacts.value.find((c) => c.id === activeContactId.value),
);

const isGroupOwner = computed(
  () => selectedContact.value?.isGroup && selectedContact.value.role === "owner",
);
const isGroupAdmin = computed(
  () =>
    selectedContact.value?.isGroup &&
    (selectedContact.value.role === "owner" || selectedContact.value.role === "admin"),
);
const canInviteMembers = computed(() => {
  if (!selectedContact.value?.isGroup) return false;
  if (isGroupAdmin.value) return true;
  return groupDetails.value?.allowMemberInvite !== false;
});
const hasBio = computed(() => selectedContact.value?.bio || selectedContact.value?.description);

const MEMBERS_PER_ROW = 6;

const displayedMembers = computed(() => {
  if (!groupDetails.value?.members) return [];
  return groupDetails.value.members.slice(0, MEMBERS_PER_ROW);
});

const remainingMembers = computed(() => {
  if (!groupDetails.value?.members) return [];
  return groupDetails.value.members.slice(MEMBERS_PER_ROW);
});

const formatGender = (g?: number) => {
  if (g === 0) return "男";
  if (g === 1) return "女";
  return "未设置";
};

const formatCategory = (c: string) => {
  const map: Record<string, string> = {
    friends: "好友",
    family: "家人",
    work: "工作",
    study: "学习",
    game: "游戏",
    other: "其他",
  };
  return map[c] || c;
};

const handleContactSelect = async (id: string) => {
  activeContactId.value = id;
  showAllMembers.value = false;
  showUpdateModal.value = false;
  const c = allContacts.value.find((x) => x.id === id);
  if (c?.isGroup) await fetchGroupDetail(parsePrefixedId(id).originalId);
};

const handleViewUpdates = () => {
  showUpdateModal.value = true;
};

const updateAllContacts = () => {
  allContacts.value = [...friendsList.value, ...groupsList.value];
};

const fetchFriendsList = async () => {
  try {
    const data = await getFriends("accepted");
    const arr: Friend[] = [];

    if (userStore.user) {
      arr.push({
        id: generatePrefixedId("friend", String(userStore.user.id)),
        originalId: String(userStore.user.id),
        name: userStore.user.nickname || userStore.user.username || "我",
        avatar: userStore.user.avatar || defaultAvatar,
        isOnline: true,
        bio: userStore.user.bio || "",
        isSelf: true,
        isGroup: false,
        username: userStore.user.username || "未知用户",
        gender: userStore.user.gender,
        birthday: userStore.user.birthday,
        age: userStore.user.age,
        zodiacSign: userStore.user.constellation,
        hometown: userStore.user.hometown,
        email: userStore.user.email || "",
        phone: userStore.user.phone || "",
      });
    }

    if (Array.isArray(data) && data.length > 0) {
      data.forEach((f) => {
        const u = f.friendUser || f;
        const id = String(u.id || f.friendId);
        if (!id) return;

        const userObj = u as any;
        const friendObj = f as any;

        const username = userObj.username || userObj.nickname || `用户${id.slice(-4)}`;
        const displayName = userObj.nickname || username || "好友";

        arr.push({
          id: generatePrefixedId("friend", id),
          originalId: id,
          name: displayName,
          avatar: userObj.avatar || defaultAvatar,
          isOnline: userObj.status === 0,
          bio: userObj.bio || "",
          remark: friendObj.remark || "",
          isGroup: false,
          username: username,
          gender: userObj.gender !== undefined ? userObj.gender : 2,
          birthday: userObj.birthday || "",
          age: userObj.age,
          zodiacSign: userObj.constellation || "",
          hometown: userObj.hometown || "",
          email: userObj.email || "",
          phone: userObj.phone || "",
          friendSince: friendObj.friendSince || "",
        });
      });
    }

    friendsList.value = arr;
    updateAllContacts();
  } catch (error) {
    console.error("获取好友列表失败:", error);
    message.error("获取好友列表失败");
  }
};

const fetchGroupsList = async () => {
  try {
    const { data } = await request.get("/group");
    const list: Friend[] = [];

    if (data && data.groups && Array.isArray(data.groups)) {
      for (const g of data.groups) {
        const groupName = g.name || `群聊${String(g.id).slice(-4)}`;

        list.push({
          id: generatePrefixedId("group", String(g.id)),
          originalId: String(g.id),
          name: groupName,
          avatar: g.avatar || defaultAvatar,
          isOnline: false,
          bio: g.rule || "",
          isGroup: true,
          groupNumber: String(g.groupNumber || g.id || ""),
          memberCount: g.memberCount || 0,
          role: g.role || "member",
          createTime: g.createTime || g.createdAt?.split("T")[0] || "",
          updatedAt: g.updatedAt || "",
          remark: g.remark || "",
          myGroupNickname: g.myGroupNickname || "",
          tags: g.tags || [],
          category: g.category || "friends",
          description: g.description || "",
          maxMembers: g.maxMembers || 200,
          isPrivate: g.isPrivate !== undefined ? g.isPrivate : false,
          requireApproval: g.requireApproval !== undefined ? g.requireApproval : true,
        });
      }
    }

    groupsList.value = list;
    updateAllContacts();
  } catch (error) {
    console.error("获取群列表失败:", error);
    message.error("获取群列表失败");
  }
};

const fetchGroupDetail = async (gid: string) => {
  try {
    const { data } = await request.get(`/group/${gid}`);
    groupDetails.value = data;
  } catch (error) {
    console.error("获取群详情失败:", error);
  }
};

const handleAvatarError = (e: Event) => {
  (e.target as HTMLImageElement).src = defaultAvatar;
};

const handleRefreshContacts = async () => {
  await Promise.all([fetchFriendsList(), fetchGroupsList()]);
  message.success("已刷新联系人列表");
};

const handleAddMemberClick = () => {
  if (!canInviteMembers.value) {
    message.warning("当前群聊仅允许群主和管理员邀请成员");
    return;
  }
  showAddMemberModal.value = true;
};

const handleConfirmEdit = async (d: any) => {
  if (!selectedContact.value) return;
  try {
    if (currentEditType.value === "remark") {
      await editRemarkUtil(
        selectedContact.value.originalId,
        d.remark || "",
        allContacts.value as any,
      );
      if (selectedContact.value.isGroup) {
        await fetchGroupsList();
      } else {
        await fetchFriendsList();
      }
    }
    showEditModal.value = false;
    message.success("已保存");
  } catch (error) {
    console.error("编辑失败:", error);
    message.error("编辑失败");
  }
};

const handleCloseEdit = () => {
  showEditModal.value = false;
};

const startChat = async () => {
  if (!selectedContact.value) return;
  try {
    localStorage.setItem("pendingContactId", selectedContact.value.originalId);
    localStorage.setItem("pendingChatType", selectedContact.value.isGroup ? "group" : "friend");
    await router.push("/message");
  } catch (error) {
    console.error("跳转聊天失败:", error);
    message.error("跳转聊天失败");
  }
};

const handleEditAction = () => {
  if (!selectedContact.value) return;
  if (selectedContact.value.isGroup || selectedContact.value.isSelf) return;
  currentEditType.value = "remark";
  currentEditInitialValue.value = selectedContact.value.remark || "";
  showEditModal.value = true;
};

// 🔥 修复：删除好友 - 使用 onOk 回调
const deleteFriend = () => {
  if (!selectedContact.value || selectedContact.value.isGroup) return;

  Modal.confirm({
    title: "提示",
    icon: createVNode(ExclamationCircleOutlined),
    content: "确定删除该好友？",
    okText: "删除",
    cancelText: "取消",
    okType: "danger",
    onOk: async () => {
      try {
        await request.delete(`/friend/${selectedContact.value.originalId}`);
        await fetchFriendsList();
        activeContactId.value = allContacts.value[0]?.id || "";
        message.success("已删除");
      } catch (error: any) {
        console.error("删除好友失败:", error);
        const errorMsg = error?.response?.data?.message || error?.message || "删除好友失败";
        message.error(errorMsg);
        throw error; // 保持弹窗打开
      }
    },
    onCancel: () => {
      console.log("用户取消了删除好友操作");
    },
  });
};

// 🔥 修复：退出群聊 - 使用 onOk 回调
const quitGroup = () => {
  if (!selectedContact.value?.isGroup || isGroupOwner.value) return;

  Modal.confirm({
    title: "提示",
    icon: createVNode(ExclamationCircleOutlined),
    content: "确定退出该群聊？",
    okText: "退出",
    cancelText: "取消",
    okType: "danger",
    onOk: async () => {
      try {
        const groupId = selectedContact.value.originalId;
        console.log("退出群聊，群ID:", groupId);

        const response = await request.post(`/group/${groupId}/quit`);
        console.log("退出群聊响应:", response);

        await fetchGroupsList();
        activeContactId.value = "";
        groupDetails.value = null;
        message.success("已退出群聊");
      } catch (error: any) {
        console.error("退出群聊失败:", error);
        const errorMsg = error?.response?.data?.message || error?.message || "退出群聊失败";
        message.error(errorMsg);
        throw error; // 保持弹窗打开
      }
    },
    onCancel: () => {
      console.log("用户取消了退出群聊操作");
    },
  });
};

// 🔥 修复：解散群聊 - 使用 onOk 回调
const dismissGroup = () => {
  if (!selectedContact.value || !isGroupOwner.value) return;

  Modal.confirm({
    title: "提示",
    icon: createVNode(ExclamationCircleOutlined),
    content: "解散后无法恢复，确定解散该群聊？",
    okText: "解散",
    cancelText: "取消",
    okType: "danger",
    onOk: async () => {
      try {
        await request.delete(`/group/${selectedContact.value.originalId}`);
        await fetchGroupsList();
        activeContactId.value = allContacts.value[0]?.id || "";
        message.success("群聊已解散");
      } catch (error: any) {
        console.error("解散群聊失败:", error);
        const errorMsg = error?.response?.data?.message || error?.message || "解散群聊失败";
        message.error(errorMsg);
        throw error; // 保持弹窗打开
      }
    },
    onCancel: () => {
      console.log("用户取消了解散群聊操作");
    },
  });
};

const handleViewAllMembers = () => {
  showAllMembers.value = true;
};

onMounted(async () => {
  await Promise.all([fetchFriendsList(), fetchGroupsList()]);
});
</script>

<style scoped>
.profile-page {
  height: 100vh;
  display: flex;
  overflow: hidden;
  background: v-bind(bgStart);
}

.profile-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.profile-detail {
  flex: 1;
  overflow-y: auto;
  background: v-bind(cardBg);
  padding: 0 24px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 0;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.detail-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.online-badge {
  position: absolute;
  bottom: 3px;
  right: 3px;
  width: 14px;
  height: 14px;
  background: #07c160;
  border-radius: 50%;
  border: 3px solid v-bind(cardBg);
}

.header-info {
  flex: 1;
}

.contact-name {
  font-size: 20px;
  font-weight: 600;
  color: v-bind(textPrimary);
  margin-bottom: 2px;
}

.uin-text {
  font-size: 13px;
  color: v-bind(textSecondary);
  margin-bottom: 2px;
}

.status-text {
  font-size: 12px;
  color: #07c160;
}

.sign-block {
  padding: 4px 0 8px;
}

.sign-title {
  font-size: 13px;
  color: v-bind(textSecondary);
  margin-bottom: 2px;
}

.sign-content {
  font-size: 14px;
  color: v-bind(textPrimary);
  line-height: 1.4;
}

.info-section {
  padding: 2px 0 8px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  transition: background 0.2s;
}

.info-row:hover {
  background: v-bind(bgStart);
}

.row-label {
  font-size: 14px;
  color: v-bind(textSecondary);
  flex-shrink: 0;
}

.row-value {
  font-size: 14px;
  color: v-bind(textPrimary);
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}

.tags-block {
  padding: 4px 0 8px;
}

.block-label {
  font-size: 14px;
  color: v-bind(textSecondary);
  margin-bottom: 6px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-item {
  padding: 5px 12px;
  background: v-bind(bgStart);
  border-radius: 16px;
  font-size: 12px;
  color: v-bind(textSecondary);
}

.members-block {
  padding: 4px 0 8px;
}

.members-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.members-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.members-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.invite-btn {
  padding: 5px 14px;
  background: transparent;
  border: 1px solid v-bind(borderColor);
  color: v-bind(textSecondary);
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.invite-btn:hover {
  background: v-bind(bgStart);
}

.update-btn {
  padding: 5px 16px;
  background: v-bind(theme);
  color: #ffffff;
  border: none;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.update-btn:hover {
  opacity: 0.85;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.update-btn:active {
  transform: translateY(0);
}

.members-list-wrapper {
  display: flex;
  flex-direction: column;
}

.members-list {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}

.member-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 56px;
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.member-nickname {
  font-size: 12px;
  color: v-bind(textSecondary);
  margin-top: 4px;
  text-align: center;
  max-width: 56px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-members {
  cursor: pointer;
}

.more-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: v-bind(bgStart);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: v-bind(textSecondary);
}

.collapse-icon {
  font-size: 12px;
  background: v-bind(borderColor);
}

.all-members {
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 0 14px;
}

.action-btn {
  flex: 1;
  min-width: 90px;
  height: 36px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: v-bind(theme);
  color: #ffffff;
}

.action-btn.primary:hover {
  opacity: 0.9;
}

.action-btn:not(.primary):not(.danger) {
  background: v-bind(bgStart);
  color: v-bind(textSecondary);
}

.action-btn:not(.primary):not(.danger):hover {
  background: v-bind(borderColor);
}

.action-btn.danger {
  background: rgba(245, 108, 108, 0.1);
  color: v-bind(dangerColor);
}

.action-btn.danger:hover {
  background: rgba(245, 108, 108, 0.2);
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: v-bind(bgStart);
}

.empty-placeholder {
  text-align: center;
  color: v-bind(textSecondary);
}

.empty-placeholder i {
  font-size: 56px;
  margin-bottom: 16px;
}

.empty-placeholder p {
  font-size: 14px;
}

.profile-detail::-webkit-scrollbar {
  width: 6px;
}
.profile-detail::-webkit-scrollbar-track {
  background: v-bind(bgStart);
}
.profile-detail::-webkit-scrollbar-thumb {
  background: v-bind(borderColor);
  border-radius: 3px;
}
</style>
