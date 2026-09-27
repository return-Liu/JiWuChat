<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="group-title-modal-overlay"
      @click.self="handleClose"
    >
      <div class="group-title-modal">
        <div class="modal-header">
          <h3>设置群头衔</h3>
          <button class="close-btn" @click="handleClose">✕</button>
        </div>

        <div class="modal-body">
          <div class="user-info">
            <div class="user-avatar">
              <img :src="userAvatar || defaultAvatar" alt="" />
            </div>
            <div class="user-details">
              <div class="username">{{ username }}</div>
              <div class="current-title" v-if="currentTitle">
                当前头衔：{{ currentTitle }}
              </div>
            </div>
          </div>

          <!-- 头衔类型说明 -->
          <div class="title-type-section">
            <label>头衔说明</label>
            <div class="title-type-info">
              <div class="info-item">
                <span class="info-label">系统头衔：</span>
                <span class="info-desc">根据等级和角色自动显示（如：LV5 初识、LV10 群主）</span>
              </div>
              <div class="info-item">
                <span class="info-label">自定义头衔：</span>
                <span class="info-desc">可设置个性化头衔，优先于系统头衔显示</span>
              </div>
            </div>
          </div>

          <!-- 自定义头衔输入 -->
          <div class="title-input-section">
            <label>自定义头衔（可选）</label>
            <input
              v-model="customTitle"
              type="text"
              class="title-input"
              placeholder="留空则使用系统头衔"
              maxlength="20"
            />
            <div class="char-count">{{ customTitle.length }}/20</div>
          </div>

          <div class="title-preview" v-if="previewBadgeText">
            <div class="preview-label">效果预览</div>
            <div class="preview-content">
              <span class="preview-badge" :class="previewBadgeClass">
                {{ previewBadgeText }}
              </span>
              <span class="preview-name">{{ username }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn cancel" @click="handleClose">取消</button>
          <button
            class="btn confirm"
            @click="handleConfirm"
            :disabled="loading"
          >
            {{ loading ? "提交中..." : "确认" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import request from "../untils/request";
import { message } from "ant-design-vue";
import { useSiderColor } from "../stores/siderColor";
import { getLevelTitle } from "../untils/levelUtils";
import { useGroupLevelBadgeStore } from "../stores/groupLevelBadge";

const siderColorStore = useSiderColor();
const badgeStore = useGroupLevelBadgeStore();

interface Props {
  visible: boolean;
  userId: number | null;
  groupId: number | null;
  currentTitle: string;
  username: string;
  userAvatar?: string;
  userLevel?: number;
  userRole?: string; // 'owner' | 'admin' | 'member'
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  userId: null,
  groupId: null,
  currentTitle: "",
  username: "",
  userAvatar: "",
  userLevel: 0,
  userRole: "member",
});

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "success", newTitle?: string): void;
}>();

const defaultAvatar =
  "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png";
const customTitle = ref("");
const loading = ref(false);

// 默认头衔名称
const defaultTitleName = computed(() => {
  return getLevelTitle(props.userLevel || 1);
});

// 预览徽章文本
const previewBadgeText = computed(() => {
  const level = props.userLevel || 1;

  // 如果有自定义头衔，显示自定义头衔
  if (customTitle.value.trim()) {
    return `LV${level} ${customTitle.value.trim()}`;
  }

  // 否则根据角色显示系统头衔
  if (props.userRole === "owner") {
    return `LV${level} 群主`;
  }
  if (props.userRole === "admin") {
    return `LV${level} 管理员`;
  }
  
  // 默认等级头衔
  return `LV${level} ${defaultTitleName.value}`;
});

// 预览徽章样式类
const previewBadgeClass = computed(() => {
  const level = props.userLevel || 1;
  
  // 确定头衔类型
  let titleType = "default";
  if (customTitle.value.trim()) {
    titleType = "custom";
  } else if (props.userRole === "owner") {
    titleType = "owner";
  } else if (props.userRole === "admin") {
    titleType = "admin";
  }
  
  return badgeStore.getLevelBadgeClass(level, props.userRole, titleType);
});

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      // 初始化自定义头衔输入框
      customTitle.value = props.currentTitle || "";
    }
  },
);

const handleClose = () => {
  emit("update:visible", false);
};

const handleConfirm = async () => {
  try {
    loading.value = true;

    // 如果输入了自定义头衔，则设置；否则清除（使用系统头衔）
    const finalTitle = customTitle.value.trim() || null;

    const response = await request.put(
      `/group/${props.groupId}/members/${props.userId}/title`,
      {
        groupTitle: finalTitle,
      },
    );

    const successMessage = response.data?.message || "头衔设置成功";
    message.success(successMessage);
    emit("success", finalTitle || undefined);
    handleClose();
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || "设置失败";
    message.error(errorMessage);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.group-title-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.group-title-modal {
  background: #fff;
  border-radius: 12px;
  width: 420px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e5e5;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
}

.close-btn {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  color: #8e8e93;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f5f5f5;
}

.modal-body {
  padding: 18px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 10px;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.username {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.current-title {
  font-size: 12px;
  color: #8e8e93;
}

.title-input-section {
  margin-bottom: 18px;
}

.title-input-section label {
  display: block;
  font-size: 13px;
  color: #1a1a1a;
  margin-bottom: 6px;
  font-weight: 500;
}

.title-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
}

.title-input:focus {
  border-color: #007aff;
}

.char-count {
  text-align: right;
  font-size: 11px;
  color: #8e8e93;
  margin-top: 4px;
}

/* 头衔类型选择区域 */
.title-type-section {
  margin-bottom: 18px;
}

.title-type-section label {
  display: block;
  font-size: 13px;
  color: #1a1a1a;
  margin-bottom: 6px;
  font-weight: 500;
}

.title-type-info {
  padding: 12px;
  background: #f8f8f8;
  border-radius: 8px;
}

.info-item {
  margin-bottom: 8px;
  line-height: 1.5;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 12px;
  font-weight: 500;
  color: #1a1a1a;
}

.info-desc {
  font-size: 12px;
  color: #666;
}

.title-preview {
  padding: 12px;
  background: #f8f8f8;
  border-radius: 10px;
}

.preview-label {
  font-size: 12px;
  color: #8e8e93;
  margin-bottom: 10px;
}

.preview-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 500;
}

.preview-name {
  font-size: 13px;
  color: #666;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid #e5e5e5;
}

.btn {
  padding: 6px 18px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.btn.cancel:hover {
  background: #e5e5e5;
}

.btn.confirm {
  background: #007aff;
  color: #fff;
}

.btn.confirm:hover {
  background: #005fc1;
}

.btn.confirm:disabled {
  background: #c7c7c7;
  cursor: not-allowed;
}
</style>
