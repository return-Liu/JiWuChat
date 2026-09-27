<template>
  <Transition name="menu-fade">
    <div
      v-if="visible"
      class="context-menu"
      :style="{ top: position.y + 'px', left: position.x + 'px' }"
      @contextmenu.prevent
      @click.stop
    >
      <!-- 回复消息 -->
      <div v-if="canReplyMessage" class="menu-item" @click.stop="handleReply">
        <i class="iconfont icon-yinyong menu-icon"></i>
        <span>引用</span>
      </div>

      <!-- 分隔线 -->
      <div v-if="showFirstDivider" class="menu-divider"></div>

      <!-- 复制消息 -->
      <div v-if="canCopyMessage" class="menu-item" @click.stop="handleCopy">
        <i class="iconfont icon-fuzhi menu-icon"></i>
        <span>复制</span>
      </div>

      <!-- 转发消息 -->
      <div
        v-if="canForwardMessage"
        class="menu-item"
        @click.stop="handleForward"
      >
        <i class="iconfont icon-zhuanfa menu-icon"></i>
        <span>转发</span>
      </div>

      <!-- 多选消息 -->
      <div
        v-if="canMultiSelectMessage"
        class="menu-item"
        @click.stop="handleMultiSelect"
      >
        <i class="iconfont icon-duoxuan menu-icon"></i>
        <span>多选</span>
      </div>

      <!-- 撤回消息 -->
      <div v-if="canRecallMessage" class="menu-item" @click.stop="handleRecall">
        <i class="iconfont icon-withdraw menu-icon"></i>
        <span>撤回</span>
      </div>

      <!-- 分隔线 -->
      <div v-if="showDeleteDivider" class="menu-divider"></div>

      <!-- 删除消息 -->
      <div
        v-if="canDeleteMessage"
        class="menu-item danger"
        @click.stop="handleDelete"
      >
        <i class="iconfont icon-shanchu menu-icon"></i>
        <span>删除</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { watch, nextTick, onUnmounted, computed } from "vue";
import { message, Modal } from "ant-design-vue";
import request from "../untils/request";
import type { ChatMessage } from "../types/chatTypes";
import {
  updateContactLastMessage,
  deleteMessage,
} from "../untils/contactManager";

interface Props {
  visible: boolean;
  position: { x: number; y: number };
  message: ChatMessage | null;
  contacts: any[];
  activeContactId: string | number | undefined;
  currentUserId: number; // 当前用户 ID，用于权限判断
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "delete", message: ChatMessage): void;
  (
    e: "recall",
    message: ChatMessage,
    originalContent?: string,
    recalledAt?: string,
  ): void;
  (e: "copy", message: ChatMessage): void;
  (e: "reply", message: ChatMessage): void;
  (e: "forward", message: ChatMessage): void;
  (e: "multiSelect", message: ChatMessage): void;
  (e: "close"): void;
}>();

// 计算属性：判断各种操作的可用性
const canReplyMessage = computed(() => {
  if (!props.message) return false;
  // 所有消息类型都可以回复
  return true;
});

const canCopyMessage = computed(() => {
  if (!props.message) return false;
  // 文本消息和链接消息可以复制
  return ["text", "link"].includes(props.message.messageType || "text");
});

const canForwardMessage = computed(() => {
  if (!props.message) return false;
  // 除系统消息外的所有消息都可以转发
  return props.message.messageType !== "system";
});

const canMultiSelectMessage = computed(() => {
  if (!props.message) return false;
  // 除系统消息外的所有消息都可以多选
  return props.message.messageType !== "system";
});

const canRecallMessage = computed(() => {
  if (!props.message || !props.currentUserId) return false;

  // 只能撤回自己发送的消息
  const isOwnMessage =
    String(props.message.senderId) === String(props.currentUserId);
  if (!isOwnMessage) return false;

  // 已经撤回的消息不能再次撤回
  if (props.message.isRecalled) return false;

  // 🔥 只支持文本和表情消息撤回，不支持图片和视频
  const messageType = props.message.messageType || "text";
  if (messageType === "image" || messageType === "video") {
    return false;
  }

  // 检查是否在2分钟内（撤回时间窗口）
  let messageTime: number;

  // 优先使用 createdAt（ISO 格式时间字符串）
  if (props.message.createdAt) {
    // 使用 new Date() 解析时间
    messageTime = new Date(props.message.createdAt).getTime();
  }
  // 如果没有 createdAt，尝试使用 _timestamp（原始时间戳）
  else if ((props.message as any)._timestamp) {
    messageTime = (props.message as any)._timestamp;
  }
  // 最后尝试解析 time 字段
  else if (props.message.time) {
    const timeStr = props.message.time;
    // 如果包含"今天"，说明是格式化后的时间，无法用于计算
    if (timeStr.includes("今天") || timeStr.includes("昨天")) {
      // 无法确定准确时间，保守起见不允许撤回
      return false;
    }
    // 尝试解析为标准时间格式
    messageTime = new Date(timeStr).getTime();
  } else {
    // 没有时间信息，不允许撤回
    return false;
  }

  // 验证时间是否有效
  if (isNaN(messageTime)) {
    return false;
  }

  const currentTime = Date.now();
  const timeDiff = currentTime - messageTime;
  const twoMinutes = 2 * 60 * 1000; // 2分钟毫秒数

  return timeDiff <= twoMinutes;
});

const canDeleteMessage = computed(() => {
  if (!props.message || !props.currentUserId) return false;
  // 可以删除自己的消息，或者群主/管理员删除群消息
  const isOwnMessage =
    String(props.message.senderId) === String(props.currentUserId);
  // 这里可以根据实际需求添加群权限判断
  return isOwnMessage;
});

const showFirstDivider = computed(() => {
  return (
    canCopyMessage.value ||
    canForwardMessage.value ||
    canMultiSelectMessage.value ||
    canRecallMessage.value
  );
});

const showDeleteDivider = computed(() => {
  return (
    canDeleteMessage.value &&
    (canCopyMessage.value ||
      canForwardMessage.value ||
      canMultiSelectMessage.value ||
      canRecallMessage.value)
  );
});

// 处理各种操作
const handleReply = () => {
  if (!props.message) return;
  emit("reply", props.message);
  emit("close");
};

const handleCopy = async () => {
  if (!props.message) return;

  try {
    // 实际执行复制到剪贴板
    await navigator.clipboard.writeText(props.message.content || "");
  } catch (error) {
    console.error("复制失败:", error);
    message.error("复制失败");
  }

  emit("copy", props.message);
  emit("close");
};

const handleForward = () => {
  if (!props.message) return;
  emit("forward", props.message);
  emit("close");
};

const handleMultiSelect = () => {
  if (!props.message) return;
  emit("multiSelect", props.message);
  emit("close");
};

// 处理撤回
const handleRecall = async () => {
  if (!props.message) return;

  try {
    await Modal.confirm({
      title: "撤回确认",
      content: "确定要撤回这条消息吗？",
      okText: "确定",
      cancelText: "取消",
    });

    // 关键修复：在异步操作后再次检查 message 是否仍然有效
    if (!props.message) {
      message.warning("消息已失效，请重试");
      return;
    }

    // 保存原始内容到 recalledContent 字段
    const originalContent = props.message.content;

    const response = await request.post("/message/recall", {
      messageId: props.message.id,
    });

    // 关键修复：使用后端返回的 recalledAt 时间，而不是前端生成的时间
    const backendRecalledAt =
      response.data?.recalledAt || new Date().toISOString();

    // 发射 recall 事件，让父组件知道撤回成功，并传递原始内容和后端返回的时间
    emit("recall", props.message, originalContent, backendRecalledAt);
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("撤回消息失败:", error);
      message.error(error.response?.data?.message || "撤回消息失败");
    }
  } finally {
    emit("close");
  }
};

// 处理删除 - 使用工具函数优化
const handleDelete = async () => {
  if (!props.message || !props.message.id) return;

  // 使用公共的deleteMessage函数，该函数已包含确认对话框和错误处理
  const success = await deleteMessage(props.message.id, true);

  if (success) {
    // 关键修复：在异步操作后再次检查 message 是否仍然有效
    if (!props.message) {
      message.warning("消息已失效，请重试");
      return;
    }

    // ✅ 后端成功后，发射 delete 事件让父组件更新数据
    emit("delete", props.message);
  }

  emit("close");
};

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest(".context-menu")) {
    emit("close");
  }
};

// 监听全局点击事件
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        document.addEventListener("click", handleClickOutside);
      });
    } else {
      document.removeEventListener("click", handleClickOutside);
    }
  },
);

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style lang="scss" scoped>
.context-menu {
  position: fixed;
  z-index: 10000;
  background: white;
  border-radius: 8px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.12),
    0 2px 6px rgba(0, 0, 0, 0.08);
  min-width: 160px;
  padding: 6px 0;
  border: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(8px);
  max-height: 300px;
  overflow-y: auto;
}

// 淡入淡出动画
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.2s ease;
}

.menu-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.menu-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  user-select: none;
  transition: all 0.2s ease;
  gap: 10px;

  &:hover {
    background-color: #f7f8fa;
  }

  &.danger {
    color: #ff4d4f;

    &:hover {
      background-color: #fff2f0;
    }
  }
}

.menu-icon {
  font-size: 16px;
  color: #666;
  transition: all 0.2s ease;

  .menu-item:hover & {
    transform: scale(1.1);
  }

  .danger & {
    color: #ff4d4f;
  }
}

.menu-divider {
  height: 1px;
  background: #e8e8e8;
  margin: 4px 0;
}
</style>
