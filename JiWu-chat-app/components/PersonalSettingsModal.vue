<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="visible" class="personal-settings-modal">
        <div class="modal-header">
          <button class="back-btn" @click="handleClose">
            <i class="iconfont icon-zuojiantou"></i>
          </button>
          <h3>群头衔</h3>
          <div class="header-placeholder"></div>
        </div>

        <div class="modal-body">
          <!-- 效果预览 -->
          <div class="preview-section">
            <div class="section-label">效果预览</div>
            <div class="preview-card">
              <div class="preview-message">
                <div class="preview-avatar">
                  <img :src="currentUserAvatar" alt="avatar" />
                </div>
                <div class="preview-content">
                  <div class="preview-header">
                    <span class="preview-nickname-wrapper">
                      <span
                        v-if="previewBadgeText"
                        class="preview-badge"
                        :class="previewBadgeClass"
                      >
                        {{ previewBadgeText }}
                      </span>
                      <span class="preview-nickname">{{ previewNickname }}</span>
                    </span>
                  </div>
                  <div class="preview-text">群头衔将显示在群聊中</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 选择头衔 -->
          <div class="selection-section">
            <div class="section-label">选择头衔</div>

            <div class="option-card">
              <div class="option-header">
                <span class="option-title">群头衔</span>
              </div>
              <div class="title-options">
                <div class="title-grid">
                  <div
                    v-for="title in titleOptions"
                    :key="title.value"
                    class="title-card"
                    :class="{ active: selectedTitle === title.value }"
                    @click="handleSelectTitle(title.value)"
                  >
                    <span class="title-badge">
                      {{ title.label }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 群等级成长详情 -->
            <div class="link-item" @click="detailModalVisible = true">
              <span>群等级成长详情</span>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 等级详情弹窗 -->
    <GroupLevelDetailModal
      v-if="detailModalVisible"
      :visible="detailModalVisible"
      @update:visible="detailModalVisible = $event"
      :user-id="currentUserId"
      :group-id="groupId"
      :current-level="currentMemberInfo.chatLevel || 1"
      :activity-points="currentMemberInfo.messageCount || 0"
      :contact="contact"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import request from "../untils/request";

import type { Contact } from "../types/chatTypes";
import { getLevelTitle } from "../untils/levelUtils";
import { useUserStore } from "../stores/user";
import { useGroupLevelBadgeStore } from "../stores/groupLevelBadge";

interface Props {
  visible: boolean;
  contact: Contact;
  isGroup: boolean;
  currentUserId: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  contact: () => ({}) as Contact,
  isGroup: false,
  currentUserId: "",
});

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "success"): void;
}>();

const userStore = useUserStore();
const badgeStore = useGroupLevelBadgeStore();

const groupId = computed(() => String(props.contact.id).replace("group_", ""));

const currentMemberInfo = computed(() => {
  if (!props.contact?.isGroup || !props.contact?.groupMembers) {
    return { chatLevel: 1, messageCount: 0, groupTitle: "", role: "member" };
  }
  const member = props.contact.groupMembers.find(
    (m: any) =>
      String(m.id) === String(props.currentUserId) ||
      String(m.userId) === String(props.currentUserId),
  );
  if (!member) {
    return { chatLevel: 1, messageCount: 0, groupTitle: "", role: "member" };
  }
  // 🔥 确保 chatLevel 至少为 1（默认值）
  return {
    chatLevel: member.chatLevel || 1,
    messageCount: member.messageCount || 0,
    groupTitle: member.groupTitle || "",
    useDefaultTitle: member.useDefaultTitle ?? false,
    role: member.role || "member",
  };
});

const currentUserInfo = computed(() => userStore.userInfo);
const currentUserAvatar = computed(() => currentUserInfo.value?.avatar || "/default-avatar.png");

const selectedTitle = ref<"default" | "custom">("default");
const customTitle = computed(() => currentMemberInfo.value.groupTitle || "");

const titleOptions = computed(() => {
  const level = currentMemberInfo.value.chatLevel || 1;
  const role = currentMemberInfo.value.role;
  const options: Array<{ value: string; label: string }> = [];

  // 默认头衔：所有用户都显示基于等级的头衔
  const defaultTitleName = getLevelTitle(level);
  options.push({ value: "default", label: `LV${level} ${defaultTitleName}` });

  // 自定义头衔选项
  if (customTitle.value) {
    // 如果已有自定义头衔，显示它
    options.push({ value: "custom", label: `LV${level} ${customTitle.value}` });
  } else {
    // 如果没有自定义头衔，根据角色显示提示
    if (role === "owner" || role === "admin") {
      // 群主和管理员也可以设置自定义头衔，但提示他们当前是默认头衔
      options.push({ value: "custom", label: `LV${level} 设置自定义头衔` });
    } else {
      // 普通成员显示设置自定义头衔
      options.push({ value: "custom", label: `LV${level} 设置自定义头衔` });
    }
  }
  return options;
});

const previewNickname = computed(() => userStore.userNickname);

const previewBadgeText = computed(() => {
  const level = currentMemberInfo.value.chatLevel || 1;
  if (selectedTitle.value === "custom") {
    return customTitle.value ? `LV${level} ${customTitle.value}` : `LV${level} 设置自定义头衔`;
  }
  const defaultTitleName = getLevelTitle(level);
  return `LV${level} ${defaultTitleName}`;
});

const previewBadgeClass = computed(() => {
  const level = currentMemberInfo.value.chatLevel || 1;
  return badgeStore.getLevelBadgeClass(level, "", selectedTitle.value);
});

const detailModalVisible = ref(false);

const handleClose = () => {
  emit("update:visible", false);
};

const handleSelectTitle = async (value: string) => {
  if (selectedTitle.value === value) return;

  const previousTitle = selectedTitle.value;
  selectedTitle.value = value as "default" | "custom";

  try {
    if (value === "default") {
      // 使用默认头衔：保留自定义头衔，只标记 useDefaultTitle=true
      await request.put(`/group/${groupId.value}/members/${props.currentUserId}/title`, {
        useDefaultTitle: true,
      });
    } else {
      // 使用自定义头衔
      if (!customTitle.value) {
        selectedTitle.value = previousTitle;
        return;
      }
      await request.put(`/group/${groupId.value}/members/${props.currentUserId}/title`, {
        useDefaultTitle: false,
        groupTitle: customTitle.value,
      });
    }

    emit("success");
  } catch {
    selectedTitle.value = previousTitle;
  }
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      syncSelectedTitle();
    }
  },
);

// 当 customTitle 变化时同步选中状态（弹窗可见时）
watch(customTitle, () => {
  if (props.visible) {
    syncSelectedTitle();
  }
});

const syncSelectedTitle = () => {
  // 有自定义头衔且未使用默认 → 选中自定义
  if (customTitle.value && !currentMemberInfo.value.useDefaultTitle) {
    selectedTitle.value = "custom";
  } else {
    selectedTitle.value = "default";
  }
};
</script>

<style lang="scss" scoped>
.personal-settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f5f5;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: #fff;
    border-bottom: 1px solid #e5e5e5;
    position: sticky;
    top: 0;
    z-index: 10;

    .back-btn {
      width: 28px;
      height: 28px;
      background: transparent;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      color: #007aff;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .back-btn:hover {
      background: #f5f5f5;
    }

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #1a1a1a;
    }

    .header-placeholder {
      width: 28px;
    }
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px;

    .section-label {
      font-size: 12px;
      color: #8e8e93;
      margin-bottom: 8px;
    }

    .preview-section {
      margin-bottom: 16px;

      .preview-card {
        background: #fff;
        border-radius: 8px;
        padding: 12px;
        border: 1px solid #e5e5e5;

        .preview-message {
          display: flex;
          gap: 8px;

          .preview-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            overflow: hidden;
            flex-shrink: 0;
            background: #e5e5e5;

            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }

          .preview-content {
            flex: 1;

            .preview-header {
              display: flex;
              align-items: center;
              gap: 6px;
              margin-bottom: 4px;
              flex-wrap: wrap;

              .preview-nickname-wrapper {
                display: flex;
                align-items: baseline;
                gap: 6px;
                flex-wrap: wrap;

                .preview-nickname {
                  color: #1a1a1a;
                  font-size: 13px;
                  font-weight: 500;
                }
              }

              .preview-badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 500;
                background: #f0f7ff;
                color: #007aff;
              }
            }

            .preview-text {
              background: #f8f8f8;
              padding: 8px 12px;
              border-radius: 8px;
              font-size: 12px;
              color: #666;
              display: inline-block;
              max-width: 80%;
              border: 1px solid #e5e5e5;
            }
          }
        }
      }
    }

    .selection-section {
      .option-card {
        background: #fff;
        border-radius: 8px;
        padding: 10px 12px;
        margin-bottom: 8px;
        border: 1px solid #e5e5e5;

        .option-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid #f0f0f0;

          .option-title {
            font-size: 13px;
            font-weight: 500;
            color: #1a1a1a;
          }
        }

        .title-options {
          .title-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .title-card {
            display: inline-flex;
            padding: 6px 14px;
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid #d0d0d0;
            background: #fff;

            &:hover {
              background: #f5f5f5;
            }

            &.active {
              border-color: #007aff;
              background: #f0f7ff;
            }

            .title-badge {
              font-size: 12px;
              font-weight: 500;
              display: inline-block;
            }
          }
        }
      }

      .link-item {
        color: #007aff;
        font-size: 12px;
        cursor: pointer;
        padding: 8px 12px;
        background: #fff;
        border-radius: 8px;
        margin-bottom: 8px;
        border: 1px solid #e5e5e5;

        &:hover {
          background: #f8f8f8;
        }
      }
    }
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
