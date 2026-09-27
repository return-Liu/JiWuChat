<template>
  <div class="tab-content">
    <div class="content-header">
      <div>
        <h3 class="content-title">隐私</h3>
        <p class="content-desc">控制账号可见性、好友添加权限和在线状态</p>
      </div>
    </div>

    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">搜索可见性</span>
        <span class="group-desc">控制他人通过哪些方式找到你</span>
      </div>
      <div class="setting-item">
        <div class="item-info">
          <span class="label">通过账号查找</span>
          <span class="desc">允许他人通过邮箱号搜索到你</span>
        </div>
        <div
          class="setting-switch"
          :class="{ active: searchableByQQ }"
          @click.stop="updateSearchableByQQ(!searchableByQQ)"
        >
          <span class="switch-handle"></span>
        </div>
      </div>

      <div class="setting-item">
        <div class="item-info">
          <span class="label">通过用户名查找</span>
          <span class="desc">允许他人通过用户名搜索到你</span>
        </div>
        <div
          class="setting-switch"
          :class="{ active: searchableByUsername }"
          @click.stop="updateSearchableByUsername(!searchableByUsername)"
        >
          <span class="switch-handle"></span>
        </div>
      </div>

      <div class="setting-item">
        <div class="item-info">
          <span class="label">通过昵称查找</span>
          <span class="desc">允许他人通过昵称搜索到你</span>
        </div>
        <div
          class="setting-switch"
          :class="{ active: searchableByNickname }"
          @click.stop="updateSearchableByNickname(!searchableByNickname)"
        >
          <span class="switch-handle"></span>
        </div>
      </div>

      <div class="setting-item">
        <div class="item-info">
          <span class="label">通过手机号查找</span>
          <span class="desc">允许他人通过手机号添加你为好友</span>
        </div>
        <div
          class="setting-switch"
          :class="{ active: searchableByPhone }"
          @click.stop="updateSearchableByPhone(!searchableByPhone)"
        >
          <span class="switch-handle"></span>
        </div>
      </div>
    </div>

    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">好友与会话</span>
        <span class="group-desc">管理好友添加和临时会话权限</span>
      </div>
      <div class="setting-item">
        <div class="item-info">
          <span class="label">临时会话</span>
          <span class="desc">允许非好友与你发起临时对话</span>
        </div>
        <div
          class="setting-switch"
          :class="{ active: allowTemporaryChat }"
          @click.stop="updateAllowTemporaryChat(!allowTemporaryChat)"
        >
          <span class="switch-handle"></span>
        </div>
      </div>

      <div class="setting-item">
        <div class="item-info">
          <span class="label">群聊添加</span>
          <span class="desc">允许群成员直接添加你为好友</span>
        </div>
        <div
          class="setting-switch"
          :class="{ active: allowAddFriendFromGroup }"
          @click.stop="updateAllowAddFriendFromGroup(!allowAddFriendFromGroup)"
        >
          <span class="switch-handle"></span>
        </div>
      </div>
    </div>

    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">好友申请</span>
        <span class="group-desc">控制谁可以向你发送好友申请</span>
      </div>
      <div class="setting-item">
        <div class="item-info">
          <span class="label">拒绝所有人加好友</span>
          <span class="desc">开启后将无法收到任何好友申请</span>
        </div>
        <div
          class="setting-switch"
          :class="{ active: !allowAddFriend }"
          @click.stop="updateAllowAddFriend(!allowAddFriend)"
        >
          <span class="switch-handle"></span>
        </div>
      </div>
    </div>

    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">在线状态</span>
        <span class="group-desc">设置在线状态对哪些人可见</span>
      </div>
      <div class="setting-item">
        <div class="item-info">
          <span class="label">在线状态可见性</span>
          <span class="desc">设置你的在线状态对哪些人可见</span>
        </div>
        <a-select
          v-model:value="onlineVisibility"
          class="setting-select"
          :options="onlineVisibilityOptions"
          :popup-match-select-width="false"
        />
      </div>
    </div>

    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">黑名单</span>
        <span class="group-desc">管理已屏蔽的用户</span>
      </div>
      <div class="setting-item">
        <div class="item-info">
          <span class="label">黑名单管理</span>
          <span class="desc">查看并管理你拉黑的用户列表</span>
        </div>
        <button class="action-btn" @click.stop="showBlockedUsersList">管理</button>
      </div>
    </div>

    <!-- 黑名单弹窗 -->
    <a-modal v-model:open="showBlockedUsersModal" title="黑名单管理" width="480px" :footer="null">
      <div v-if="loadingBlockedUsers" class="empty-state">加载中...</div>
      <div v-else-if="blockedUsers.length === 0" class="empty-state">暂无黑名单用户</div>
      <div v-else class="block-list">
        <div v-for="item in blockedUsers" :key="item.id" class="block-item">
          <div class="user-info">
            <a-avatar :size="32" :src="item.blockedUser?.avatar" />
            <div>
              <div class="name">{{ item.blockedUser?.nickname }}</div>
              <div class="username">{{ item.blockedUser?.username }}</div>
            </div>
          </div>
          <button class="btn-unblock" @click="handleUnblockFromSettings(item.blockedUserId)">
            取消拉黑
          </button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useUserStore } from "../../stores/user";
import { message, Modal } from "ant-design-vue";
import request from "../../untils/request";

const userStore = useUserStore();

// ===== 隐私相关 =====
const searchableByQQ = ref(true);
const searchableByNickname = ref(true);
const searchableByUsername = ref(true);
const searchableByPhone = ref(true);
const allowAddFriend = ref(true);
const allowAddFriendFromGroup = ref(true);
const allowTemporaryChat = ref(true);
const onlineVisibility = ref(0);

const onlineVisibilityOptions = [
  { value: 0, label: "所有人可见" },
  { value: 1, label: "仅好友可见" },
  { value: 2, label: "不显示在线" },
];

const updatePrivacySetting = async (key: string, val: any) => {
  let originalVal: any;
  const map: Record<string, any> = {
    searchableByQQ,
    searchableByUsername,
    searchableByNickname,
    searchableByPhone,
    allowAddFriend,
    allowAddFriendFromGroup,
    allowTemporaryChat,
    onlineVisibility,
  };
  originalVal = map[key]?.value;
  if (map[key]) map[key].value = val;

  try {
    await request.put("/users/update-profile", { [key]: val });
    userStore.user = { ...userStore.user!, [key]: val };
  } catch (error: any) {
    message.error(error.response?.data?.data?.message || "更新失败");
    if (map[key]) map[key].value = originalVal;
  }
};

const updateSearchableByUsername = (val: boolean) =>
  updatePrivacySetting("searchableByUsername", val);
const updateSearchableByQQ = (val: boolean) => updatePrivacySetting("searchableByQQ", val);
const updateSearchableByNickname = (val: boolean) =>
  updatePrivacySetting("searchableByNickname", val);
const updateSearchableByPhone = (val: boolean) => updatePrivacySetting("searchableByPhone", val);
const updateAllowAddFriend = (val: boolean) => updatePrivacySetting("allowAddFriend", val);
const updateAllowAddFriendFromGroup = (val: boolean) =>
  updatePrivacySetting("allowAddFriendFromGroup", val);
const updateAllowTemporaryChat = (val: boolean) => updatePrivacySetting("allowTemporaryChat", val);

// ===== 黑名单 =====
const blockedUsers = ref<any[]>([]);
const showBlockedUsersModal = ref(false);
const loadingBlockedUsers = ref(false);

const loadBlockedUsers = async () => {
  try {
    loadingBlockedUsers.value = true;
    const res = await request.get("/blocked-users");
    blockedUsers.value = res.data.data?.blockedUsers || res.data.blockedUsers || [];
  } catch {
    message.error("加载失败");
  } finally {
    loadingBlockedUsers.value = false;
  }
};

const showBlockedUsersList = () => {
  loadBlockedUsers();
  showBlockedUsersModal.value = true;
};

const handleUnblockFromSettings = async (userId: number) => {
  Modal.confirm({
    title: "提示",
    content: "确定要取消拉黑该用户吗？",
    okText: "确定",
    cancelText: "取消",
    async onOk() {
      try {
        await request.delete(`/blocked-users/${userId}/unblock`);
        blockedUsers.value = blockedUsers.value.filter((u) => u.blockedUserId !== userId);
        message.success("已取消拉黑");
      } catch (error: any) {
        message.error(error.response?.data?.message || "操作失败");
      }
    },
  });
};

// ===== 生命周期 =====
onMounted(() => {
  if (typeof window !== "undefined") {
    searchableByQQ.value = userStore.user?.searchableByQQ ?? true;
    searchableByUsername.value = userStore.user?.searchableByUsername ?? true;
    searchableByNickname.value = userStore.user?.searchableByNickname ?? true;
    searchableByPhone.value = userStore.user?.searchableByPhone ?? true;
    allowAddFriend.value = userStore.user?.allowAddFriend ?? true;
    allowAddFriendFromGroup.value = userStore.user?.allowAddFriendFromGroup ?? true;
    allowTemporaryChat.value = userStore.user?.allowTemporaryChat ?? true;
    onlineVisibility.value = userStore.user?.onlineVisibility ?? 0;
  }
});
</script>
