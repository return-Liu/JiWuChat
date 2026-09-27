<template>
  <Teleport to="body">
    <Transition name="modal-fade" appear>
      <div v-if="modelValue" class="modal-overlay" @click.self="handleClose">
        <div
          class="modal-container"
          :class="{ 'modal-large': type === 'tag' }"
          :style="modalStyle"
          @click.stop
        >
          <!-- 头部 -->
          <div class="modal-header">
            <h3 class="modal-title">{{ modalTitle }}</h3>
            <button
              class="modal-close"
              @click="handleClose"
              aria-label="关闭弹窗"
            >
              <CloseOutlined />
              <!-- Ant Design 关闭图标 -->
            </button>
          </div>

          <!-- 内容 -->
          <div class="modal-body">
            <!-- 备注 -->
            <div v-if="type === 'remark'" class="form-item">
              <a-input
                v-model="tempRemark"
                :type="isLongText ? 'textarea' : 'text'"
                :rows="isLongText ? 5 : undefined"
                :placeholder="remarkPlaceholder"
                :maxlength="isLongText ? 100 : 50"
                show-word-limit
                clearable
                ref="inputRef"
                @keyup.enter="handleConfirm"
                class="modal-input"
              />
              <p class="form-hint">{{ remarkHint }}</p>
            </div>

            <!-- 群昵称 -->
            <div v-if="type === 'nickname'" class="form-item">
              <a-input
                v-model="tempNickname"
                placeholder="请输入群昵称（最多 20 字，选填）"
                maxlength="20"
                show-word-limit
                clearable
                ref="inputRef"
                @keyup.enter="handleConfirm"
                class="modal-input"
              />
              <p class="form-hint">不填写则保留原有昵称</p>
            </div>

            <!-- 标签 -->
            <div v-if="type === 'tag'" class="tag-content">
              <div class="tag-section">
                <div class="section-label">
                  <span class="label-text">常用标签</span>
                </div>
                <div class="tag-list">
                  <div
                    v-for="tag in defaultTags"
                    :key="tag"
                    class="tag-option"
                    :class="{ 'is-active': selectedTags.includes(tag) }"
                    @click="toggleTag(tag)"
                  >
                    {{ tag }}
                    <CheckOutlined
                      v-if="selectedTags.includes(tag)"
                      class="icon-check"
                    />
                    <!-- Ant Design 勾选图标 -->
                  </div>
                </div>
              </div>

              <div class="tag-section">
                <div class="section-label">
                  <span class="label-text">已选标签</span>
                </div>
                <div class="tag-list tag-list--selected">
                  <div
                    v-for="tag in selectedTags"
                    :key="tag"
                    class="tag-option is-active"
                  >
                    {{ tag }}
                    <CloseOutlined
                      @click.stop="removeTag(tag)"
                      class="icon-close"
                    />
                    <!-- Ant Design 关闭图标 -->
                  </div>
                  <div v-if="!selectedTags.length" class="tag-empty">
                    暂无已选标签
                  </div>
                </div>
              </div>

              <div class="tag-section">
                <div class="section-label">
                  <span class="label-text">自定义标签</span>
                </div>
                <div class="custom-tag-wrap">
                  <a-input
                    v-model="customTagInput"
                    placeholder="输入标签名，按回车添加"
                    maxlength="10"
                    @keyup.enter="addCustomTag"
                    clearable
                    class="custom-tag-input"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 底部 -->
          <div class="modal-footer">
            <a-button @click="handleClose" class="btn-cancel">取消</a-button>
            <a-button
              type="primary"
              @click="handleConfirm"
              :loading="loading"
              class="btn-confirm"
            >
              保存
            </a-button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { message } from "ant-design-vue";
// 引入 Ant Design Vue 图标
import { CloseOutlined, CheckOutlined } from "@ant-design/icons-vue";
import type { Contact } from "../types/chatTypes";
import { useSiderColor } from "../stores/siderColor";

// 引入主题 store
const siderColorStore = useSiderColor();

interface Props {
  modelValue: boolean;
  type: "remark" | "nickname" | "tag";
  contact: Partial<Contact>;
  initialValue?: string;
  initialTags?: string[];
  isLongText?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  type: "remark",
  contact: () => ({}),
  initialValue: "",
  initialTags: () => [],
  isLongText: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (
    e: "confirm",
    data: { remark?: string; nickname?: string; tags?: string[] },
  ): void;
  (e: "close"): void;
}>();

// 响应式数据
const tempRemark = ref("");
const tempNickname = ref("");
const selectedTags = ref<string[]>([]);
const customTagInput = ref("");
const loading = ref(false);
const inputRef = ref<any>(null);

// 默认标签
const defaultTags = ref([
  "灌水",
  "摸鱼",
  "日常",
  "干货",
  "求助",
  "闲聊",
  "分享",
  "讨论",
]);

// 计算属性
const modalTitle = computed(() => {
  switch (props.type) {
    case "remark":
      return props.contact.isGroup ? "编辑群聊备注" : "编辑好友备注";
    case "nickname":
      return "编辑本群昵称";
    case "tag":
      return "选择群聊标签";
    default:
      return "编辑信息";
  }
});

const remarkPlaceholder = computed(() => {
  if (props.contact.isGroup) {
    return props.isLongText
      ? "请输入群聊备注（最多 100 字，选填）"
      : "请输入群聊备注（选填）";
  } else {
    return "请输入好友备注（选填）";
  }
});

const remarkHint = computed(() => {
  return props.isLongText
    ? "不填写则保留原有备注或为空，最多输入 100 字"
    : "不填写则保留原有备注或为空";
});

const modalStyle = computed(() => {
  const palette = siderColorStore.currentColorPalette;
  return {
    "--primary-color": palette.color,
    "--primary-light": palette.light,
    "--primary-hover": palette.hover,
  };
});

// 监听弹窗显示状态
watch(
  () => props.modelValue,
  async (val) => {
    if (!val) return;

    // 初始化数据
    if (props.type === "remark") {
      // 根据是否为群聊读取不同的备注字段
      const remarkValue = props.contact.remark || "";
      tempRemark.value = props.initialValue || remarkValue;
    }
    if (props.type === "nickname") {
      tempNickname.value = props.initialValue || "";
    }
    if (props.type === "tag") {
      selectedTags.value = [...(props.initialTags || [])];
    }

    // 自动聚焦
    await nextTick();
    inputRef.value?.focus?.();
  },
  { immediate: true },
);

// 方法
const handleClose = () => {
  emit("update:modelValue", false);
  emit("close");
};

const handleConfirm = async () => {
  loading.value = true;
  try {
    const data: any = {};

    if (props.type === "remark") {
      const val = tempRemark.value.trim();
      if (props.isLongText && val.length > 100) {
        message.error("备注最多只能输入 100 个字符");
        return;
      }
      if (!props.isLongText && val.length > 50) {
        message.error("备注最多只能输入 50 个字符");
        return;
      }
      data.remark = val;
    }

    if (props.type === "nickname") {
      data.nickname = tempNickname.value.trim();
    }

    if (props.type === "tag") {
      data.tags = [...selectedTags.value];
    }

    emit("confirm", data);
    handleClose();
    message.success(`${modalTitle.value}保存成功`);
  } catch (err) {
    console.error("确认操作失败:", err);
    message.error("操作失败，请重试");
  } finally {
    loading.value = false;
  }
};

const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag);
  index > -1
    ? selectedTags.value.splice(index, 1)
    : selectedTags.value.push(tag);
};

const removeTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag);
  if (index > -1) selectedTags.value.splice(index, 1);
};

const addCustomTag = () => {
  const tag = customTagInput.value.trim();
  if (!tag) {
    message.warning("请输入标签名称");
    return;
  }

  if (selectedTags.value.includes(tag)) {
    message.warning("该标签已存在");
    return;
  }

  selectedTags.value.push(tag);
  customTagInput.value = "";
  message.success(`已添加标签: ${tag}`);
};
</script>

<style scoped lang="scss">
// 基础变量 - 直接使用 CSS 变量，无回退值
$primary: var(--primary-color);
$primary-light: var(--primary-light);
$primary-hover: var(--primary-hover);
$primary-gradient: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);

$text-primary: #1d2129;
$text-regular: #4e5969;
$text-secondary: #86909c;
$text-placeholder: #c9cdd4;

$bg-white: #ffffff;
$bg-light: #f8f9fa;
$bg-hover: #f2f3f5;
$bg-active: #e5e6eb;

$border-light: #e5e6eb;
$border-normal: #dcdfe6;
$border-hover: #c0c6cf;

$shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
$shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
$shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);

$radius-xs: 4px;
$radius-sm: 8px;
$radius-md: 12px;
$radius-lg: 16px;
$radius-full: 999px;

$transition-fast: all 0.15s ease;
$transition-base: all 0.25s ease;
$transition-slow: all 0.35s ease;

// 遮罩层
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

// 模态框容器
.modal-container {
  width: 420px;
  max-width: 100%;
  background: $bg-white;
  border-radius: $radius-lg;
  box-shadow: $shadow-lg;
  overflow: hidden;
  transform-origin: center;
  animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.modal-large {
    width: 580px;
  }

  @media (max-width: 576px) {
    width: 100%;
  }
}

// 头部
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid $border-light;
  background: $bg-light;

  .modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
    line-height: 1.4;
  }

  .modal-close {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-full;
    color: $text-secondary;
    cursor: pointer;
    transition: $transition-base;
    border: none;
    background: transparent;
    padding: 0;
    font-size: 16px;

    &:hover {
      background: $primary-light;
      color: $primary;
      transform: rotate(90deg);
    }

    &:active {
      background: rgba(64, 158, 255, 0.2);
    }
  }
}

// 内容区域
.modal-body {
  padding: 28px 24px;

  .form-item {
    width: 100%;

    .form-hint {
      margin: 10px 0 0 0;
      font-size: 12px;
      color: $text-secondary;
      line-height: 1.5;
    }
  }
}

// 输入框样式
.modal-input {
  width: 100%;

  :deep(.el-input__wrapper) {
    border-radius: $radius-md;
    border: 1px solid $border-normal;
    background: $bg-light;
    box-shadow: none;
    padding: 12px 16px;
    transition: $transition-base;

    &:hover {
      border-color: $border-hover;
      background: $bg-white;
    }

    &:focus-within {
      border-color: $primary;
      background: $bg-white;
      box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.1);
      outline: none;
    }
  }

  :deep(.el-textarea__inner) {
    line-height: 1.6;
    resize: none;
  }
}

// 标签区域
.tag-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tag-section {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .section-label {
    .label-text {
      font-size: 14px;
      font-weight: 500;
      color: $text-regular;
      position: relative;
      padding-bottom: 8px;

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 36px;
        height: 2px;
        background: $primary-gradient;
        border-radius: $radius-xs;
      }
    }
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    &.tag-list--selected {
      min-height: 44px;
      align-items: center;
    }

    .tag-option {
      padding: 8px 16px;
      border-radius: $radius-full;
      font-size: 14px;
      background: $bg-light;
      border: 1px solid $border-normal;
      color: $text-regular;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      transition: $transition-base;
      position: relative;
      overflow: hidden;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.2),
          transparent
        );
        transition: $transition-slow;
      }

      &:hover {
        background: $bg-hover;
        border-color: $border-hover;
        transform: translateY(-1px);
        box-shadow: $shadow-sm;

        &::before {
          left: 100%;
        }
      }

      &.is-active {
        background: $primary-light;
        border-color: $primary;
        color: $primary;
        font-weight: 500;

        &:hover {
          background: rgba(64, 158, 255, 0.2);
        }
      }

      .icon-check {
        font-size: 14px;
        color: $primary;
        font-weight: bold;
      }

      .icon-close {
        font-size: 14px;
        color: $text-secondary;
        cursor: pointer;
        transition: $transition-fast;

        &:hover {
          color: #f53f3f;
          transform: scale(1.1);
        }
      }
    }

    .tag-empty {
      font-size: 13px;
      color: $text-secondary;
      padding: 8px 16px;
      width: 100%;
      text-align: center;
      background: $bg-light;
      border-radius: $radius-md;
      border: 1px dashed $border-normal;
    }
  }
}

.custom-tag-wrap {
  width: 100%;

  .custom-tag-input {
    width: 100%;

    :deep(.el-input__wrapper) {
      border-radius: $radius-md;
      padding: 10px 16px;
    }
  }
}

// 底部操作区
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid $border-light;
  background: $bg-light;

  .btn-cancel {
    padding: 10px 24px;
    border-radius: $radius-md;
    font-weight: 500;
    font-size: 14px;
    color: $text-regular;
    background: $bg-white;
    border: 1px solid $border-normal;
    transition: $transition-base;

    &:hover {
      background: $bg-hover;
      border-color: $border-hover;
      color: $text-primary;
    }

    &:active {
      background: $bg-active;
    }
  }

  .btn-confirm {
    padding: 10px 28px;
    border-radius: $radius-md;
    font-weight: 500;
    font-size: 14px;
    background: $primary-gradient;
    border: none;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
    transition: $transition-base;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
    }

    &:disabled,
    &.is-loading {
      transform: none;
      box-shadow: none;
    }
  }
}

// 动画效果
@keyframes modalPop {
  0% {
    opacity: 0;
    transform: scale(0.92);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
