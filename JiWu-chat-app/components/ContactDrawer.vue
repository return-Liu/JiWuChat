<template>
  <div>
    <!-- 重新设计的抽屉 - 简洁无阴影风格 -->
    <transition name="drawer-fade" appear>
      <div v-if="visible" class="modern-drawer" @click.stop :style="drawerStyle">
        <!-- 头部区域 -->
        <div class="drawer-header">
          <div class="avatar-section">
            <a-avatar :size="72" :src="contact.avatar" class="avatar-large">
              <template #fallback>
                {{ (contact.remark || contact.name || "未知").charAt(0) }}
              </template>
            </a-avatar>
          </div>

          <div class="info-section">
            <h2 class="user-name">
              {{ contact.remark || contact.name || "未知联系人" }}
              <i
                v-if="contact.isGroup && showGroupManagement"
                class="iconfont icon-bianjiziliao edit-group-btn"
                title="修改群信息"
                @click.stop="handleEditGroupInfo"
              ></i>
            </h2>

            <!-- 群标签区域 -->
            <div v-if="showMyTagsSection" class="tags-wrapper" @click.stop="showTagModalMethod">
              <a-tag v-for="(tag, index) in groupTags" :key="index" color="blue" class="tag-item">
                {{ tag }}
              </a-tag>
              <a-tag v-if="groupTags.length === 0" color="default" class="tag-add">
                <span>添加标签</span>
              </a-tag>
            </div>
          </div>
        </div>

        <!-- 内容区域 - 可滚动 -->
        <div class="drawer-content">
          <!-- 群聊特有信息卡片 -->
          <template v-if="contact.isGroup">
            <!-- 群公告卡片 -->
            <div class="info-card">
              <div class="card-header">
                <div class="card-title">
                  <i class="iconfont icon-gonggao menu-icon"></i>
                  <span>群公告</span>
                </div>
                <a-button v-if="isGroupOwner" type="link" size="small" @click="handleEditRule">
                  编辑
                </a-button>
              </div>

              <div v-if="!isEditingRule" class="announcement-content">
                {{ groupRule || "暂无群公告" }}
              </div>

              <div v-else class="announcement-edit">
                <a-textarea
                  v-model="tempGroupRule"
                  :rows="3"
                  placeholder="请输入群公告内容（最多200字）"
                  :maxlength="200"
                  show-count
                />
                <div class="edit-actions">
                  <a-button size="small" @click="cancelEditRule">取消</a-button>
                  <a-button size="small" type="primary" @click="saveGroupRuleLocal">
                    保存
                  </a-button>
                </div>
              </div>
            </div>

            <!-- 群成员卡片 -->
            <div v-if="showGroupMembersSection" class="info-card members-card">
              <div class="card-header">
                <div class="card-title">
                  <i class="iconfont icon-qunchengyuanbeifen menu-icon"></i>
                  <span>群成员</span>
                </div>
                <a-button
                  v-if="(contact.groupMembers?.length || 0) > 30"
                  type="link"
                  size="small"
                  @click="handleShowAllMembersToggle"
                >
                  {{ showAllMembers ? "收起" : `查看全部 (${contact.groupMembers?.length || 0})` }}
                </a-button>
              </div>

              <!-- 网格视图 -->
              <div v-if="!showAllMembers" class="members-grid">
                <div
                  v-for="member in displayedMembers"
                  :key="member.id"
                  class="member-item"
                  @click.stop="handleMemberClick(Number(member.id))"
                  @contextmenu.prevent="handleMemberContextMenu($event, member)"
                >
                  <a-avatar :size="44" :src="member.avatar" class="member-avatar" loading="lazy">
                    <template #fallback">
                      {{ (member.nickname || member.name)?.charAt(0) }}
                    </template>
                  </a-avatar>
                  <span class="member-name">{{ member.nickname || member.name }}</span>
                </div>

                <!-- 更多按钮 - 当成员数超过 30 时显示 -->
                <div
                  v-if="(contact.groupMembers?.length || 0) > 30"
                  class="member-item more-members"
                  @click.stop="handleShowAllMembersToggle"
                >
                  <div class="more-icon-wrapper">
                    <span>+{{ (contact.groupMembers?.length || 0) - 30 }}</span>
                  </div>
                  <span class="member-name">更多</span>
                </div>

                <!-- 添加成员按钮 -->
                <div class="member-item add-member" @click.stop="handleAddMemberClick">
                  <div class="add-icon-wrapper">
                    <PlusOutlined />
                  </div>
                  <span class="member-name">邀请</span>
                </div>
              </div>

              <!-- 列表视图 -->
              <div
                v-else
                class="members-list"
                ref="membersListRef"
                @scroll="handleMembersListScroll"
              >
                <!-- 加载提示 -->
                <div v-if="isLoadingMoreMembers" class="loading-members-tip">
                  <LoadingOutlined spin />
                  <span>正在加载更多成员...</span>
                </div>

                <!-- 群主 -->
                <div
                  v-if="groupOwner"
                  class="list-item"
                  @click.stop="handleMemberClick(Number(groupOwner.id))"
                  @contextmenu.prevent="handleMemberContextMenu($event, groupOwner)"
                >
                  <a-avatar :size="36" :src="groupOwner.avatar" loading="lazy">
                    <template #fallback">
                      {{ (groupOwner.nickname || groupOwner.name)?.charAt(0) }}
                    </template>
                  </a-avatar>
                  <span class="list-name">{{ groupOwner.nickname || groupOwner.name }}</span>
                  <a-tag color="red">群主</a-tag>
                </div>

                <!-- 管理员 -->
                <div
                  v-for="admin in groupAdmins"
                  :key="admin.id"
                  class="list-item"
                  @click.stop="handleMemberClick(Number(admin.id))"
                  @contextmenu.prevent="handleMemberContextMenu($event, admin)"
                >
                  <a-avatar :size="36" :src="admin.avatar" loading="lazy">
                    <template #fallback">
                      {{ (admin.nickname || admin.name)?.charAt(0) }}
                    </template>
                  </a-avatar>
                  <span class="list-name">{{ admin.nickname || admin.name }}</span>
                  <a-tag color="blue">管理员</a-tag>
                </div>

                <!-- 普通成员 -->
                <div
                  v-for="member in normalMembers"
                  :key="member.id"
                  class="list-item"
                  @click.stop="handleMemberClick(Number(member.id))"
                  @contextmenu.prevent="handleMemberContextMenu($event, member)"
                >
                  <a-avatar :size="36" :src="member.avatar" loading="lazy">
                    <template #fallback">
                      {{ (member.nickname || member.name)?.charAt(0) }}
                    </template>
                  </a-avatar>
                  <span class="list-name">{{ member.nickname || member.name }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- 通用信息卡片 -->
          <div class="info-card">
            <div class="card-title">
              <i class="iconfont icon-xiangqingxinxi menu-icon"></i>
              <span>详细信息</span>
            </div>

            <div class="detail-list">
              <!-- 群聊名称 -->
              <div v-if="contact.isGroup" class="detail-item">
                <span class="detail-label">群聊名称</span>
                <span class="detail-value">{{ contact.name || "未命名" }}</span>
              </div>

              <!-- 群号 -->
              <div v-if="contact.isGroup" class="detail-item">
                <span class="detail-label">群号</span>
                <span class="detail-value">{{ contact.groupNumber || "无" }}</span>
              </div>

              <!-- 我的本群昵称 -->
              <div
                v-if="contact.isGroup && showMyNicknameSection"
                class="detail-item editable"
                @click.stop="handleMyNicknameClick"
              >
                <span class="detail-label">我的本群昵称</span>
                <div class="detail-value-wrapper">
                  <span
                    ref="myNicknameEditableRef"
                    class="detail-value editable-text"
                    :class="{ placeholder: !myGroupNickname }"
                    contenteditable="true"
                    @focus="handleMyNicknameFocus"
                    @blur="handleMyNicknameBlur"
                    @input="handleMyNicknameInput"
                    @keydown.enter.prevent
                    @keyup.enter="handleMyNicknameKeyUp"
                  >
                    {{ myGroupNickname || "未设置" }}
                  </span>
                </div>
              </div>

              <!-- 备注 -->
              <div v-if="showRemarkEditItem && contact.isFriend" class="detail-item editable">
                <span class="detail-label">{{ contact.isGroup ? "群聊备注" : "好友备注" }}</span>
                <div class="detail-value-wrapper">
                  <span
                    class="detail-value editable-text"
                    :class="{
                      placeholder: !contact.remark || contact.remark.trim() === '',
                    }"
                    @click.stop="handleRemarkClick"
                  >
                    {{
                      contact.remark && contact.remark.trim() !== ""
                        ? contact.remark
                        : contact.isGroup
                          ? "未设置"
                          : "未设置"
                    }}
                  </span>
                </div>
              </div>

              <!-- 置顶开关 -->
              <div class="detail-item switch-item">
                <span class="detail-label">设为置顶</span>
                <a-switch
                  v-model:checked="localIsTop"
                  size="small"
                  @change="handleTopToggle"
                  :disabled="!contact.id"
                />
              </div>

              <!-- 免打扰开关 -->
              <div v-if="contact.id !== currentUserId" class="detail-item switch-item">
                <span class="detail-label">消息免打扰</span>
                <a-switch
                  v-model:checked="localIsMuted"
                  size="small"
                  @change="handleMuteToggle"
                  :disabled="!contact.id"
                />
              </div>

              <div class="detail-item action-item" @click.stop="handleClearHistory">
                <span class="detail-label">删除聊天记录</span>
              </div>
              <div class="detail-item action-item" @click.stop="handleToggleSearch">
                <span class="detail-label">查找聊天记录</span>
              </div>

              <!-- 个性设置按钮（仅群聊显示） -->
              <div
                v-if="contact.isGroup"
                class="detail-item action-item"
                @click.stop="handleOpenPersonalSettings"
              >
                <span class="detail-label">个性设置</span>
              </div>

              <!-- 举报记录按钮 -->
              <div
                v-if="!isCurrentUserContact"
                class="detail-item action-item"
                @click.stop="handleViewReportHistory"
              >
                <span class="detail-label">举报记录</span>
              </div>

              <!-- 拉黑/取消拉黑按钮（仅好友且非群聊） -->
              <div
                v-if="!contact.isGroup && !isCurrentUserContact"
                class="detail-item action-item"
                @click.stop="toggleBlockStatus"
              >
                <span class="detail-label">
                  {{ isBlocked ? "取消拉黑" : "拉黑该用户" }}
                </span>
              </div>

              <!-- 举报按钮 -->
              <div
                v-if="!isCurrentUserContact"
                class="detail-item report-item"
                @click.stop="handleReport"
              >
                <span class="detail-label report-label">
                  {{ contact.isGroup ? "举报该群" : "举报该用户" }}
                </span>
              </div>

              <div v-if="contact.isGroup" class="detail-item danger-action-item">
                <div @click.stop="handleGroupAction" :disabled="!contact.id">
                  {{ isGroupOwner ? "解散该群聊" : "退出该群聊" }}
                </div>
              </div>
              <div
                v-else-if="!isCurrentUserContact && contact.isFriend"
                class="detail-item danger-action-item"
              >
                <div @click.stop="handleDeleteFriend" :disabled="!contact.id">删除好友</div>
              </div>
              <!-- 删除临时会话按钮（非好友且非群聊） -->
              <div
                v-else-if="!isCurrentUserContact && !contact.isGroup && !contact.isFriend"
                class="detail-item danger-action-item"
              >
                <div @click.stop="handleDeleteTemporaryContact" :disabled="!contact.id">
                  删除临时会话
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 通用模态框组件 -->
        <ContactModal
          v-model="showModal"
          :type="modalType"
          :contact="contact"
          :initial-value="modalInitialValue"
          :initial-tags="groupTags"
          @confirm="handleModalConfirm"
          @close="handleModalClose"
        />

        <!-- 添加群成员模态框 -->
        <AddGroupMemberModal
          :visible="showAddMemberModal"
          @update:visible="showAddMemberModal = $event"
          :group-id="contact.id"
          :current-user-id="currentUserId"
          :group-members="contact.groupMembers"
          :allow-member-invite="contact.allowMemberInvite"
          :is-group-owner-or-admin="isGroupOwner || isGroupAdmin"
          @refresh-contacts="emit('refresh-contacts')"
        />

        <!-- 举报弹窗组件 -->
        <ReportModal
          :visible="showReportModal"
          @update:visible="showReportModal = $event"
          :contact="contact"
          :is-submitting="isSubmitting"
          @close="handleReportClose"
        />

        <!-- 举报记录弹窗组件 -->
        <ReportHistoryModal
          :visible="showReportHistoryModal"
          @update:visible="showReportHistoryModal = $event"
        />

        <!-- 用户详情弹窗 -->
        <UserProfileModal
          :visible="showUserProfileModal"
          :user-id="selectedMemberId"
          :group-id="contact.isGroup ? Number(contact.id) : null"
          :current-user-id="Number(currentUserId)"
          :show-add-friend="true"
          :show-send-message="true"
          :show-report="true"
          :update-contact-list="updateContactList"
          @update:visible="showUserProfileModal = $event"
          @send-message="handleSendMessageFromProfile"
        />

        <!-- 个性设置弹窗 -->
        <PersonalSettingsModal
          :visible="showPersonalSettingsModal"
          :contact="contact"
          :is-group="contact.isGroup"
          :current-user-id="currentUserId"
          @update:visible="showPersonalSettingsModal = $event"
          @success="handlePersonalSettingsSuccess"
        />

        <!-- 右键菜单 -->
        <Teleport to="body">
          <div
            v-if="contextMenu.visible"
            class="member-context-menu"
            :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
            @click.stop
          >
            <div class="context-menu-item" @click="handleContextMenuAction('profile')">
              <span>查看资料</span>
            </div>
            <!-- <div class="context-menu-item" @click="handleContextMenuAction('message')">
              <span>发送消息</span>
            </div> -->
            <template v-if="showGroupManagement">
              <div class="context-menu-divider"></div>
              <!-- <div v-if="isGroupOwner && !isTargetOwner" class="context-menu-item" @click="handleContextMenuAction('transferOwner')">
                <span>转让群主</span>
              </div> -->
              <div v-if="!isTargetOwner && !isTargetAdmin" class="context-menu-item" @click="handleContextMenuAction('setAdmin')">
                <span>设为管理员</span>
              </div>
              <div v-if="isTargetAdmin" class="context-menu-item" @click="handleContextMenuAction('removeAdmin')">
                <span>取消管理员</span>
              </div>
              <div v-if="!isTargetOwner" class="context-menu-divider"></div>
              <div v-if="!isTargetOwner" class="context-menu-item danger" @click="handleContextMenuAction('kick')">
                <span>移出群聊</span>
              </div>
            </template>
          </div>
        </Teleport>
        <!-- 点击空白关闭右键菜单 -->
        <div v-if="contextMenu.visible" class="context-menu-mask" @click="closeContextMenu" @contextmenu.prevent="closeContextMenu"></div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef, nextTick } from "vue";
import { useRouter } from "vue-router";
import { message, Modal } from "ant-design-vue";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons-vue";
import { useSiderColor } from "../stores/siderColor";
import { useGroupMemberActions } from "../composables/useGroupMemberActions";
import { useGroupMembers } from "../composables/useGroupMembers";
import request from "../untils/request";
import type { Contact, ColorPalette } from "../types/chatTypes";

import {
  handleUpdateGroupRule,
  getTopStatusFromLocalStorage,
  saveTopStatusToLocalStorage,
  getMuteStatusFromLocalStorage,
  saveMuteStatusToLocalStorage,
  handleEditRemark,
  invalidateChatHistoryCache,
} from "../untils/contactManager";
import { handleMoreActionCommand, type ChatAreaManagerOptions } from "../untils/chatAreaManager";

// Props定义
interface Props {
  visible: boolean;
  contact: Contact;
  currentUserId: string;
  colorPalette?: ColorPalette;
  isGroupOwner: boolean;
  isGroupAdmin: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  contact: () => ({}) as Contact,
  currentUserId: "",
  isGroupOwner: false,
  isGroupAdmin: false,
});

// Emits定义
const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "edit-remark", contactId: string | number, newRemark: string): void;
  (e: "clear-chat", contactId: string | number): void;
  (e: "delete-friend", contactId: string | number): void;
  (e: "delete-temporary-contact", contactId: string | number): void;
  (e: "toggle-top", contactId: string | number, isTop: boolean): void;
  (e: "toggle-mute", contactId: string | number, isMuted: boolean): void;
  (e: "quit-group", groupId: string): void;
  (e: "dissolve-group", groupId: string): void;
  (e: "update-group-rule", groupId: string, rule: string): void;
  (e: "toggle-search-panel"): void;
  (e: "refresh-contacts"): void;
  (e: "send-message", payload: { userId: number; userInfo: any }): void;
  (e: "contactSelect", contactId: string): void;
}>();

const router = useRouter();
const siderColorStore = useSiderColor();

// 响应式数据
const showAllMembers = ref(false);
const isEditingRule = ref(false);
const tempGroupRule = ref("");
const localIsTop = ref(false);
const localIsMuted = ref(false);
const remarkEditableRef = ref<HTMLElement | null>(null);
const myNicknameEditableRef = ref<HTMLElement | null>(null);
const tempNickname = ref("");
const myGroupNickname = ref("");
const showAddMemberModal = ref(false);
const selectedMember = ref<any>(null);
const isSubmitting = ref(false);
// 通用模态框状态
const showModal = ref(false);
const modalType = ref<"remark" | "nickname" | "tag">("remark");
const modalInitialValue = ref("");

// 举报相关状态
const showReportModal = ref(false);
const showReportHistoryModal = ref(false);

// 用户详情弹窗状态
const showUserProfileModal = ref(false);
const selectedMemberId = ref<number | null>(null);

// 个性设置弹窗状态
const showPersonalSettingsModal = ref(false);

// 新增：黑名单相关状态
const isBlocked = ref(false);
const showBlockConfirm = ref(false);
const showUnblockConfirm = ref(false);
const blockReason = ref("");

// 大型群聊分页加载状态
const membersPageSize = 50; // 每页加载的成员数量
const membersCurrentPage = ref(1); // 当前页码
const loadedMembersCount = ref(0); // 已加载的成员数量

// 成员列表滚动加载状态
const isLoadingMoreMembers = ref(false); // 是否正在加载更多
const membersListRef = ref<HTMLElement | null>(null); // 成员列表 DOM 引用

// 初始化状态标记
const isDrawerInitialized = ref(false);
const isMembersLoaded = ref(false);

// 联系人数据缓存 (使用 Map 存储，key 为 contactId)
const contactDataCache = new Map<
  string | number,
  {
    localIsTop: boolean;
    localIsMuted: boolean;
    tempGroupRule: string;
    myGroupNickname: string;
    timestamp: number;
  }
>();

// 缓存有效期 (5 分钟)
const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

// 当前正在加载的联系人 ID (避免重复加载)
let currentLoadingContactId: string | number | null = null;

// 计算属性 - 直接使用 Store 配置
const drawerStyle = computed(() => {
  const palette = siderColorStore.currentColorPalette;
  return {
    "--theme-color": palette.color,
    "--theme-hover": palette.hover,
    "--theme-light": palette.light,
  };
});

const showGroupManagement = computed(() => {
  return props.contact.isGroup && (props.isGroupOwner || props.isGroupAdmin);
});

// 🔥 是否可以邀请成员：群主/管理员始终可以；普通成员需检查 allowMemberInvite 设置
const canInviteMembers = computed(() => {
  if (!props.contact.isGroup) return false;
  // 群主或管理员始终可以邀请
  if (props.isGroupOwner || props.isGroupAdmin) return true;
  // 普通成员：allowMemberInvite 为 false 时禁止邀请，默认为 true（允许）
  return props.contact.allowMemberInvite !== false;
});

const showGroupMembersSection = computed(() => {
  return props.contact.isGroup && Array.isArray(props.contact.groupMembers);
});

const showRemarkEditItem = computed(() => {
  const isSelfChat = String(props.contact.id) === String(props.currentUserId);
  return !isSelfChat || props.contact.isGroup;
});

const isCurrentUserContact = computed(() => {
  return String(props.contact.id) === String(props.currentUserId);
});

const showMyNicknameSection = computed(() => {
  return props.contact.isGroup && !!props.currentUserId;
});

const showMyTagsSection = computed(() => {
  return props.contact.isGroup && !!props.currentUserId;
});

// 群标签 - 每次直接从 props.contact.tags 动态获取
const groupTags = computed(() => {
  return props.contact.tags || [];
});

const groupRule = computed(() => props.contact.groupRule || tempGroupRule.value);

// 获取当前备注值（根据是否为群聊读取不同字段）
const getRemarkValue = () => {
  return props.contact.isGroup ? props.contact.remark || "" : props.contact.remark || "";
};

// 获取显示文本（根据是否为群聊读取不同字段）
const getRemarkText = () => {
  return props.contact.isGroup ? props.contact.remark || "" : props.contact.remark || "";
};

// 群成员分类（使用 composable）
const {
  groupOwner,
  groupAdmins,
  normalMembers,
  displayedMembers: baseDisplayedMembers,
} = useGroupMembers(() => props.contact);

const displayedMembers = computed(() => {
  if (!showAllMembers.value) return baseDisplayedMembers.value;
  return props.contact.groupMembers?.slice(0, loadedMembersCount.value) || [];
});

// 方法
const closeDrawer = () => {
  if (showReportModal.value) {
    return;
  }
  emit("update:visible", false);
};

const handleEditGroupInfo = () => {
  router.push(`/editgroup/${props.contact.id}`);
  closeDrawer();
};



const handleEditRule = () => {
  tempGroupRule.value = props.contact.groupRule || "";
  isEditingRule.value = true;
};

const cancelEditRule = () => {
  isEditingRule.value = false;
  tempGroupRule.value = "";
};

const saveGroupRuleLocal = async () => {
  try {
    await handleUpdateGroupRule(String(props.contact.id), tempGroupRule.value, []);
    isEditingRule.value = false;
    emit("update-group-rule", String(props.contact.id), tempGroupRule.value);
  } catch (error: any) {
    console.error("保存群公告失败:", error);
  }
};

const handleTopToggle = (val: boolean) => {
  localIsTop.value = val;
  if (props.contact) {
    props.contact.isTop = val;
  }
  saveTopStatusToLocalStorage(String(props.contact.id), val);
  message.success(val ? "已设为置顶" : "已取消置顶");
};

const handleMuteToggle = (val: boolean) => {
  localIsMuted.value = val;
  if (props.contact) {
    props.contact.isMuted = val;
  }
  saveMuteStatusToLocalStorage(String(props.contact.id), val);
  message.success(val ? "已开启消息免打扰" : "已关闭消息免打扰");
};

const handleClearHistory = async () => {
  const options: ChatAreaManagerOptions = {
    contacts: [props.contact],
    activeContactId: props.contact.id,
    currentUserId: props.currentUserId,
    newMessage: { value: "" },
    isTop: { value: false },
    isMuted: { value: false },
    showContactDrawer: { value: true },
    isEditingRule: { value: false },
    tempGroupRule: { value: "" },
    defaultGroupRule: { value: "" },
    showAllMembers: { value: false },
    tempRemark: { value: "" },
    remarkEditableRef: { value: null },
    activeContact: shallowRef(props.contact),
    emit: ((event: string, ...args: any[]) => {
      if (event === "clearChat") {
        console.log("[ContactDrawer] 聊天记录已清空");
        invalidateChatHistoryCache([props.contact], props.contact.id);
        console.log("[ContactDrawer] 已清除聊天历史缓存");
        closeDrawer();
        emit("clear-chat", props.contact.id);
      }
    }) as any,
  };

  await handleMoreActionCommand("clearHistory", options);
};

const handleDeleteFriend = async () => {
  const options: ChatAreaManagerOptions = {
    contacts: [props.contact],
    activeContactId: props.contact.id,
    currentUserId: props.currentUserId,
    newMessage: { value: "" },
    isTop: { value: false },
    isMuted: { value: false },
    showContactDrawer: { value: true },
    isEditingRule: { value: false },
    tempGroupRule: { value: "" },
    defaultGroupRule: { value: "" },
    showAllMembers: { value: false },
    tempRemark: { value: "" },
    remarkEditableRef: { value: null },
    activeContact: shallowRef(props.contact),
    emit: ((event: string, ...args: any[]) => {
      if (event === "deleteFriend") {
        emit("delete-friend", args[0] || props.contact.id);
      } else if (event === "clearChat") {
        emit("clear-chat", args[0] || props.contact.id);
      } else if (event === "refreshContacts") {
        emit("refresh-contacts");
      }
    }) as any,
  };

  await handleMoreActionCommand("deleteFriend", options);
};

const handleDeleteTemporaryContact = async () => {
  const options: ChatAreaManagerOptions = {
    contacts: [props.contact],
    activeContactId: props.contact.id,
    currentUserId: props.currentUserId,
    newMessage: { value: "" },
    isTop: { value: false },
    isMuted: { value: false },
    showContactDrawer: { value: true },
    isEditingRule: { value: false },
    tempGroupRule: { value: "" },
    defaultGroupRule: { value: "" },
    showAllMembers: { value: false },
    tempRemark: { value: "" },
    remarkEditableRef: { value: null },
    activeContact: shallowRef(props.contact),
    emit: ((event: string, ...args: any[]) => {
      if (event === "deleteTemporaryContact") {
        emit("delete-temporary-contact", args[0] || props.contact.id);
      } else if (event === "refreshContacts") {
        emit("refresh-contacts");
      }
    }) as any,
  };

  await handleMoreActionCommand("deleteTemporaryContact", options);
};

const handleGroupAction = async () => {
  const action = props.isGroupOwner ? "dissolveGroup" : "quitGroup";

  const options: ChatAreaManagerOptions = {
    contacts: [props.contact],
    activeContactId: props.contact.id,
    currentUserId: props.currentUserId,
    newMessage: { value: "" },
    isTop: { value: false },
    isMuted: { value: false },
    showContactDrawer: { value: true },
    isEditingRule: { value: false },
    tempGroupRule: { value: "" },
    defaultGroupRule: { value: "" },
    showAllMembers: { value: false },
    tempRemark: { value: "" },
    remarkEditableRef: { value: null },
    activeContact: shallowRef(props.contact),
    emit: ((event: string, ...args: any[]) => {
      if (event === "quitGroup") {
        emit("quit-group", args[0] || props.contact.id);
      } else if (event === "dissolveGroup") {
        emit("dissolve-group", args[0] || props.contact.id);
      } else if (event === "refreshContacts") {
        emit("refresh-contacts");
      }

      if (event === "quitGroup" || event === "dissolveGroup") {
        console.log(`[ContactDrawer] ${event} 操作完成`);
        closeDrawer();
      }
    }) as any,
  };

  await handleMoreActionCommand(action, options);
};

const handleToggleSearch = () => {
  emit("toggle-search-panel");
  closeDrawer();
};

const handleAddMemberClick = () => {
  // 🔥 二次校验：非群主/管理员且 allowMemberInvite 为 false 时禁止邀请
  if (!canInviteMembers.value) {
    message.warning("当前群聊仅允许群主和管理员邀请成员");
    return;
  }
  showAddMemberModal.value = true;
};

// 举报相关方法
const handleReport = () => {
  showReportModal.value = true;
};

const handleReportClose = () => {
  if (isSubmitting.value) {
    message.warning("举报正在提交中，请稍候");
    return;
  }
  showReportModal.value = false;
};

// 查看举报记录
const handleViewReportHistory = () => {
  showReportHistoryModal.value = true;
};

// 用户详情弹窗相关方法
const handleMemberClick = (memberId: number) => {
  selectedMemberId.value = memberId;
  showUserProfileModal.value = true;
};

// 群成员右键菜单（使用 composable）
const {
  contextMenu,
  showGroupManagement: canManageGroup,
  isTargetOwner,
  isTargetAdmin,
  handleMemberContextMenu,
  closeContextMenu,
  handleContextMenuAction,
} = useGroupMemberActions({
  groupId: () => props.contact.id,
  isGroupOwner: () => props.isGroupOwner,
  isGroupAdmin: () => props.isGroupAdmin,
  groupOwner: () => groupOwner.value,
  groupAdmins: () => groupAdmins.value,
  onRefresh: () => emit("refresh-contacts"),
  onSendMessage: (member) => {
    emit("send-message", { userId: Number(member.id), userInfo: member });
    closeDrawer();
  },
  onViewProfile: (memberId) => {
    selectedMemberId.value = memberId;
    showUserProfileModal.value = true;
  },
});

const handleSendMessageFromProfile = (payload: { userId: number; userInfo: any }) => {
  showUserProfileModal.value = false;
  emit("send-message", payload);
};

const updateContactList = (newContact: any) => {
  console.log("[ContactDrawer] 更新联系人列表请求", newContact);
};

// 打开个性设置弹窗
const handleOpenPersonalSettings = () => {
  showPersonalSettingsModal.value = true;
};

// 个性设置成功回调
const handlePersonalSettingsSuccess = () => {
  emit("refresh-contacts");
};

// 备注编辑方法
const handleRemarkClick = () => {
  modalInitialValue.value = getRemarkValue();
  modalType.value = "remark";
  showModal.value = true;
};

const handleModalConfirm = async (data: {
  remark?: string;
  nickname?: string;
  tags?: string[];
}) => {
  switch (modalType.value) {
    case "remark":
      await saveRemark(data.remark || "");
      break;
    case "nickname":
      tempNickname.value = data.nickname || "";
      await saveNickname();
      break;
    case "tag":
      await saveTags(data.tags || []);
      break;
  }
};

const handleModalClose = () => {
  showModal.value = false;
  modalInitialValue.value = "";
};

const saveRemark = async (newRemark: string) => {
  await handleEditRemark(props.contact.id, newRemark, [props.contact]);
  emit("edit-remark", props.contact.id, newRemark);
};

// 本群昵称方法
const handleMyNicknameClick = () => {
  showNicknameModalMethod();
};

const handleMyNicknameFocus = (e: FocusEvent) => {
  const target = e.target as HTMLElement;
  const range = document.createRange();
  const selection = window.getSelection();
  if (target.firstChild) {
    range.selectNodeContents(target);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
};

const handleMyNicknameInput = (e: Event) => {
  const target = e.target as HTMLElement;
  target.textContent = myGroupNickname.value || "";
};

const handleMyNicknameBlur = (e: FocusEvent) => {
  const target = e.target as HTMLElement;
  target.textContent = myGroupNickname.value || (myGroupNickname.value ? "" : "设置昵称");
  if (!myGroupNickname.value) {
    target.classList.add("placeholder");
  } else {
    target.classList.remove("placeholder");
  }
};

const handleMyNicknameKeyUp = (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    e.preventDefault();
    (e.target as HTMLElement).blur();
  }
};

const showNicknameModalMethod = () => {
  modalInitialValue.value = myGroupNickname.value;
  modalType.value = "nickname";
  showModal.value = true;
};

const saveNickname = async () => {
  const newNickname = tempNickname.value.trim();

  if (newNickname === myGroupNickname.value) {
    return;
  }

  try {
    const pureGroupId = String(props.contact.id).replace("group_", "");
    await request.put(`/group/${pureGroupId}/member/nickname`, {
      nickname: newNickname,
    });

    myGroupNickname.value = newNickname;
    if (myNicknameEditableRef.value) {
      myNicknameEditableRef.value.textContent = newNickname || "设置昵称";
      myNicknameEditableRef.value.classList.toggle("placeholder", !newNickname);
    }
    message.success("本群昵称已更新");
  } catch (error: any) {
    message.error(error.response?.data?.message || "修改失败，请重试");
  }
};

// 标签方法
const showTagModalMethod = () => {
  if (!props.isGroupOwner && !props.isGroupAdmin) {
    message.warning("仅群主和管理员可以编辑群标签");
    return;
  }

  modalType.value = "tag";
  showModal.value = true;
};

const saveTags = async (tags: string[]) => {
  try {
    const pureGroupId = String(props.contact.id).replace("group_", "");
    const response = await request.put(`/group/${pureGroupId}/tags`, {
      tags,
    });

    if (props.contact) {
      props.contact.tags = response.data.tags || tags;
    }

    message.success(response.data.message);
  } catch (error: any) {
    message.error(error.response?.data?.message);
  }
};

// 检查缓存是否有效
const isCacheValid = (contactId: string | number): boolean => {
  const cached = contactDataCache.get(contactId);
  if (!cached) return false;

  const now = Date.now();
  const isExpired = now - cached.timestamp > CACHE_EXPIRY_TIME;

  if (isExpired) {
    contactDataCache.delete(contactId);
    console.log(`[缓存] 联系人 ${contactId} 缓存已过期`);
    return false;
  }

  return true;
};

// 从缓存恢复数据
const restoreFromCache = (contactId: string | number): boolean => {
  const cached = contactDataCache.get(contactId);
  if (!cached) return false;

  localIsTop.value = cached.localIsTop;
  localIsMuted.value = cached.localIsMuted;
  tempGroupRule.value = cached.tempGroupRule;
  myGroupNickname.value = cached.myGroupNickname;

  console.log(`[缓存] 已从缓存恢复联系人 ${contactId} 的数据`);
  return true;
};

// 保存数据到缓存
const saveToCache = (contactId: string | number) => {
  contactDataCache.set(contactId, {
    localIsTop: localIsTop.value,
    localIsMuted: localIsMuted.value,
    tempGroupRule: tempGroupRule.value,
    myGroupNickname: myGroupNickname.value,
    timestamp: Date.now(),
  });

  console.log(`[缓存] 已缓存联系人 ${contactId} 的数据`);
};

// 懒加载初始化抽屉数据 (带缓存)
const loadDrawerData = async () => {
  const contactId = props.contact.id;

  if (currentLoadingContactId === contactId) {
    console.log(`[抽屉懒加载] 联系人 ${contactId} 正在加载中，跳过`);
    return;
  }

  if (isCacheValid(contactId)) {
    console.log(`[抽屉懒加载] 联系人 ${contactId} 命中缓存`);
    restoreFromCache(contactId);
    return;
  }

  currentLoadingContactId = contactId;

  try {
    localIsTop.value = props.contact.isTop || false;
    localIsMuted.value = props.contact.isMuted || false;
    console.log("[抽屉懒加载] 状态初始化完成");

    if (props.contact.isGroup) {
      tempGroupRule.value = props.contact.groupRule || "";
      myGroupNickname.value = props.contact.myGroupNickname || "";

      if (myNicknameEditableRef.value) {
        const target = myNicknameEditableRef.value;
        const nickname = myGroupNickname.value;
        target.textContent = nickname || "设置昵称";
        target.classList.toggle("placeholder", !nickname);
      }

      console.log("[抽屉懒加载] 群聊基础数据加载完成");

      if (Array.isArray(props.contact.groupMembers)) {
        isMembersLoaded.value = true;
        membersCurrentPage.value = 1;
        loadedMembersCount.value = Math.min(membersPageSize, props.contact.groupMembers.length);

        console.log("[抽屉懒加载] 群成员初始数据加载完成");
      }
    } else {
      isMembersLoaded.value = true;
    }

    isDrawerInitialized.value = true;
    saveToCache(contactId);
    console.log("[抽屉懒加载] 初始化完成");
  } catch (error) {
    console.error("[抽屉懒加载] 初始化失败:", error);
  } finally {
    currentLoadingContactId = null;
  }
};

// 监听群成员展开状态，触发懒加载
watch(showAllMembers, async (newValue, oldValue) => {
  if (newValue && !oldValue && props.contact.isGroup && isMembersLoaded.value) {
    const initialLoadCount = 50;
    loadedMembersCount.value = Math.min(initialLoadCount, props.contact.groupMembers?.length || 0);

    if ((props.contact.groupMembers?.length || 0) > initialLoadCount) {
      console.log("[成员展开] 大型群聊，启用滚动加载");
    }
  }
});

// 优化后的监听器 - 添加缓存逻辑
watch(
  [() => props.visible, () => props.contact],
  async ([newVisible, newContact], [oldVisible, oldContact]) => {
    if (newVisible && newContact) {
      const contactIdChanged = !oldContact || oldContact.id !== newContact.id;

      if (contactIdChanged) {
        console.log("[抽屉监听器] 检测到联系人切换:", {
          from: oldContact?.id,
          to: newContact.id,
        });

        isDrawerInitialized.value = false;

        if (isCacheValid(newContact.id)) {
          console.log("[抽屉监听器] 命中缓存，直接恢复");
          restoreFromCache(newContact.id);
          isDrawerInitialized.value = true;
        } else {
          console.log("[抽屉监听器] 无缓存，开始加载数据");
          await loadDrawerData();
        }
      } else if (!isDrawerInitialized.value) {
        console.log("[抽屉监听器] 同一联系人但未初始化，开始加载");
        if (isCacheValid(newContact.id)) {
          restoreFromCache(newContact.id);
          isDrawerInitialized.value = true;
        } else {
          await loadDrawerData();
        }
      }

      if (!newContact.isGroup) {
        await checkIfBlocked();
      }
    } else if (!newVisible) {
      selectedMember.value = null;
    }
  },
  { immediate: true },
);

// 处理展开/收起成员列表
const handleShowAllMembersToggle = () => {
  showAllMembers.value = !showAllMembers.value;

  if (showAllMembers.value) {
    const initialLoadCount = 50;
    loadedMembersCount.value = Math.min(initialLoadCount, props.contact.groupMembers?.length || 0);
  }
};

// 监听成员列表滚动，加载更多
const handleMembersListScroll = async (event: Event) => {
  if (!membersListRef.value || isLoadingMoreMembers.value) return;

  const target = event.target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = target;

  if (scrollTop + clientHeight >= scrollHeight - 100) {
    const totalMembers = props.contact.groupMembers?.length || 0;

    if (loadedMembersCount.value < totalMembers) {
      await loadMoreMembers();
    }
  }
};

// 加载更多成员
const loadMoreMembers = async () => {
  if (isLoadingMoreMembers.value) return;

  isLoadingMoreMembers.value = true;

  try {
    const currentCount = loadedMembersCount.value;
    const increment = 50;
    const totalMembers = props.contact.groupMembers?.length || 0;
    const newCount = Math.min(currentCount + increment, totalMembers);

    await new Promise((resolve) => setTimeout(resolve, 100));

    loadedMembersCount.value = newCount;

    console.log(`[滚动加载] 已加载 ${loadedMembersCount.value}/${totalMembers} 名成员`);
  } catch (error) {
    console.error("[滚动加载] 失败:", error);
  } finally {
    isLoadingMoreMembers.value = false;
  }
};

// 检查用户是否被我拉黑（仅检查"我拉黑对方"方向）
const checkIfBlocked = async () => {
  if (!props.contact.id || props.contact.isGroup) return;

  try {
    const response = await request.get(`/blocked-users/${props.contact.id}/is-blocked`);
    const data = response.data;
    if (data.hasOwnProperty("iBlockedThem")) {
      isBlocked.value = data.iBlockedThem || false;
    } else {
      isBlocked.value = data.isBlocked || false;
    }
  } catch (error) {
    console.error("检查拉黑状态失败:", error);
    isBlocked.value = false;
  }
};

// 切换拉黑状态
const toggleBlockStatus = async () => {
  if (!props.contact.id || props.contact.isGroup) return;

  if (isBlocked.value) {
    // 取消拉黑
    Modal.confirm({
      title: "提示",
      content: "确定要取消拉黑该用户吗？",
      okText: "确定",
      cancelText: "取消",
      async onOk() {
        try {
          const response = await request.delete(`/blocked-users/${props.contact.id}/unblock`);
          isBlocked.value = false;
          message.success(response.data.message || "已取消拉黑");
        } catch (error: any) {
          console.error("取消拉黑失败:", error);
          message.error(error.response?.data?.message || "操作失败，请重试");
        }
      },
      onCancel() {
        // 用户取消，不做任何操作
      },
    });
  } else {
    // 拉黑用户
    Modal.confirm({
      title: "提示",
      content: "确定要拉黑该用户吗？拉黑后将无法接收对方的消息。",
      okText: "确定",
      cancelText: "取消",
      async onOk() {
        try {
          const response = await request.post(`/blocked-users/${props.contact.id}/block`, {
            reason: "用户主动拉黑",
          });
          isBlocked.value = true;
          message.success(response.data.message || "已拉黑用户");
          closeDrawer();
        } catch (error: any) {
          console.error("拉黑用户失败:", error);
          message.error(error.response?.data?.message || "操作失败，请重试");
        }
      },
      onCancel() {
        // 用户取消，不做任何操作
      },
    });
  }
};
</script>

<style lang="scss" scoped>
// 抽屉样式 - 纯净无阴影设计
.modern-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 380px;
  height: 100%;
  background: #ffffff;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .drawer-header {
    padding: 48px 24px 24px;
    border-bottom: 1px solid #f0f2f5;

    .avatar-section {
      display: flex;
      justify-content: center;
      margin-bottom: 16px;

      .avatar-large {
        transition: transform 0.2s;

        &:hover {
          transform: scale(1.02);
        }
      }
    }

    .info-section {
      text-align: center;

      .user-name {
        font-size: 22px;
        font-weight: 600;
        color: #1f2f3d;
        margin: 0 0 8px 0;
        line-height: 1.3;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;

        .edit-group-btn {
          font-size: 20px;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.15s;

        }
      }

      .tags-wrapper {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        margin-top: 12px;
        cursor: pointer;

        .tag-item,
        .tag-add {
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 16px;
          padding: 4px 12px;
          font-size: 12px;
        }

        .tag-add {
          background: #f5f7fa;
          border: 1px dashed #dcdfe6;
          color: #606266;

          &:hover {
            background: var(--theme-color);
            border-color: var(--theme-color);
            color: #ffffff;
          }
        }
      }
    }
  }

  .drawer-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    min-height: 0;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #dcdfe6;
      border-radius: 2px;

      &:hover {
        background: #c0c4cc;
      }
    }

    .info-card {
      background: #fafbfc;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #606266;

        .menu-icon {
          font-size: 16px;
          color: var(--theme-color);
        }

        .member-count {
          margin-left: 4px;
          color: #909399;
          font-size: 12px;
          font-weight: normal;
        }
      }

      .button-group {
        display: flex;
        gap: 12px;
        margin-top: 12px;

        .ant-btn {
          flex: 1;
          height: 32px;
          border-radius: 8px;
          background: transparent !important;
          border: 1px solid #dcdfe6;
          color: #606266;
          transition: all 0.25s ease;

          &:hover {
            background: var(--theme-color) !important;
            border-color: var(--theme-color);
            color: #ffffff;
          }

          &:active {
            transform: scale(0.96);
          }
        }
      }

      .announcement-content {
        font-size: 14px;
        line-height: 1.6;
        color: #606266;
        background: #ffffff;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #e4e7ed;
      }

      .announcement-edit {
        .edit-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          margin-top: 12px;

          .ant-btn {
            border-radius: 8px;
            transition: all 0.25s ease;

            &:not(.ant-btn-primary) {
              background: transparent;
              border: 1px solid #dcdfe6;
              color: #606266;

              &:hover {
                background: var(--theme-color);
                border-color: var(--theme-color);
                color: #ffffff;
              }
            }

            &.ant-btn-primary {
              &:hover {
                opacity: 0.85;
              }
            }
          }
        }
      }

      &.members-card {
        .members-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 12px;

          .member-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            width: 60px;
            transition: all 0.2s;

            .member-avatar {
              transition: all 0.2s;
            }

            &:hover .member-avatar {
              transform: scale(1.05);
            }

            .member-name {
              font-size: 12px;
              color: #606266;
              width: 60px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              text-align: center;
            }

            &.add-member,
            &.more-members {
              .add-icon-wrapper,
              .more-icon-wrapper {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: transparent;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #909399;
                font-size: 20px;
                transition: all 0.25s ease;
                border: 1px solid #dcdfe6;
              }

              &:hover {
                .add-icon-wrapper,
                .more-icon-wrapper {
                  background: var(--theme-color);
                  border-color: var(--theme-color);
                  color: #ffffff;
                }
              }
            }

            &.more-members .more-icon-wrapper {
              font-size: 14px;
              font-weight: 500;
            }
          }
        }

        .members-list {
          max-height: 400px;
          overflow-y: auto;

          .list-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 0;
            border-bottom: 1px solid #f0f2f5;
            cursor: pointer;
            transition: all 0.2s;
            &:last-child {
              border-bottom: none;
            }

            .list-name {
              flex: 1;
              font-size: 14px;
              color: #303133;
            }

            .ant-avatar {
              transition: transform 0.2s;

              &:hover {
                transform: scale(1.05);
              }
            }
          }

          .loading-members-tip {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: #909399;
            font-size: 13px;

            .anticon {
              margin-right: 8px;
              animation: rotating 2s linear infinite;
            }
          }
        }
      }
    }

    .detail-list {
      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f0f2f5;

        &:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-size: 14px;
          color: #606266;
        }

        .detail-value {
          font-size: 14px;
          color: #303133;
          max-width: 60%;
          text-align: right;
          word-break: break-word;
        }

        &.editable {
          cursor: pointer;

          .detail-value-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;

            .editable-text {
              max-width: 180px;
              text-align: right;
              outline: none;
              padding: 4px 8px;
              border-radius: 6px;
              transition: all 0.2s;

              &.placeholder {
                color: #c0c4cc;
              }

              &:hover {
                background: #f5f7fa;
              }

              &:focus {
                background: #ffffff;
                outline: 1px solid var(--theme-color);
              }
            }
          }
        }

        &.switch-item {
          .detail-label {
            color: #303133;
            font-weight: 500;
          }
        }

        &.action-item {
          cursor: pointer;
          transition: color 0.2s;

          &:hover {
            color: var(--theme-color);
          }
        }

        &.report-item {
          cursor: pointer;
          transition: all 0.2s;

          .detail-label {
            color: #f56c6c;
            font-weight: 500;
          }

          &:hover {
            .detail-label {
              color: #f78989;
            }
          }
        }

        &.danger-action-item {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f0f2f5;
          border-bottom: none;

          :deep(div) {
            width: 100%;
            text-align: center;
            padding: 10px 16px;
            border-radius: 8px;
            background: transparent;
            border: 1px solid #f56c6c;
            color: #f56c6c;
            cursor: pointer;
            transition: all 0.25s ease;
            font-size: 14px;
            font-weight: 500;

            &:hover {
              background: #f56c6c;
              border-color: #f56c6c;
              color: #ffffff;
            }

            &:active {
              transform: scale(0.96);
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
              background: transparent;
              color: #c0c4cc;
              border-color: #dcdfe6;

              &:hover {
                background: transparent;
                color: #c0c4cc;
                border-color: #dcdfe6;
                transform: none;
              }
            }
          }
        }
      }
    }
  }
}

// 动画
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  transform: translateX(100%);
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 右键菜单
.context-menu-mask {
  position: fixed;
  inset: 0;
  z-index: 9998;
}

.member-context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 160px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
  overflow: hidden;
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--bg-hover);
  }

  &.danger {
    color: var(--error-color);

    &:hover {
      background: var(--error-bg);
    }
  }
}

.context-menu-divider {
  height: 1px;
  margin: 4px 8px;
  background: var(--border-color);
}
</style>