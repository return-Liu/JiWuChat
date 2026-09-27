<template>
  <div v-if="visible" class="process-report-modal-mask">
    <div class="process-report-modal-wrapper" @click.stop>
      <div class="process-report-modal-header">
        <h3 class="modal-title">处理举报</h3>
        <button class="close-btn" @click="handleClose" :disabled="isSubmitting">✕</button>
      </div>

      <div class="process-report-modal-body">
        <div class="process-section">
          <div class="section-label">处理状态 <span class="required">*</span></div>
          <div class="status-radio-group">
            <label
              v-for="(label, value) in statusOptions"
              :key="value"
              class="status-radio-item"
              :class="{
                selected: selectedStatus === value,
                disabled: isSubmitting,
              }"
            >
              <input
                type="radio"
                :value="value"
                v-model="selectedStatus"
                :disabled="isSubmitting"
                class="status-radio-input"
              />
              <span class="status-radio-label">{{ label }}</span>
            </label>
          </div>
        </div>

        <div class="process-section">
          <div class="section-label">
            管理员备注
            <span class="word-count">{{ adminNote.length }}/1000</span>
          </div>
          <textarea
            v-model="adminNote"
            class="note-textarea"
            placeholder="填写处理说明和结果（选填）"
            rows="5"
            :disabled="isSubmitting"
            maxlength="1000"
          ></textarea>
        </div>
      </div>

      <div class="process-report-modal-footer">
        <button class="modal-btn cancel-btn" @click="handleClose" :disabled="isSubmitting">
          取消
        </button>
        <button
          class="modal-btn submit-btn"
          @click="handleSubmit"
          :disabled="!selectedStatus || isSubmitting"
        >
          {{ isSubmitting ? "提交中..." : "确认处理" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message, Modal } from "ant-design-vue";
import { processReport } from "../untils/reportUtils";
import { useSiderColor } from "../stores/siderColor";

const siderColorStore = useSiderColor();

interface Props {
  visible: boolean;
  reportId: number | null;
  currentStatus?: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  reportId: null,
  currentStatus: "pending",
});

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "success", data: any): void;
}>();

const isSubmitting = ref(false);
const selectedStatus = ref<string>("");
const adminNote = ref("");

const statusOptions: Record<string, string> = {
  pending: "待处理",
  processing: "处理中",
  resolved: "已解决",
  rejected: "已驳回",
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.reportId) {
      selectedStatus.value = props.currentStatus || "pending";
      adminNote.value = "";
    }
  },
  { immediate: true },
);

function handleClose() {
  if (isSubmitting.value) return;
  emit("update:visible", false);
}

async function handleSubmit() {
  if (!props.reportId) {
    message.error("举报记录 ID 无效");
    return;
  }

  if (!selectedStatus.value) {
    message.warning("请选择处理状态");
    return;
  }

  try {
    await Modal.confirm(
      `确定要将此举报标记为"${statusOptions[selectedStatus.value]}"吗？`,
      "确认处理",
      { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" },
    );
  } catch {
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await processReport(props.reportId, {
      status: selectedStatus.value as any,
      adminNote: adminNote.value || undefined,
    });

    message.success("举报记录处理成功");
    emit("success", response);
    emit("update:visible", false);
  } catch (error: any) {
    console.error("处理举报记录失败:", error);

    if (error.response?.status === 403) {
      message.error("权限不足，仅管理员可操作");
    } else if (error.response?.status === 404) {
      message.error("举报记录不存在");
    } else if (error.message) {
      message.error(error.message);
    } else {
      message.error("处理失败，请稍后重试");
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped lang="scss">
.process-report-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.process-report-modal-wrapper {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.process-report-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;

  .modal-title {
    font-size: 16px;
    font-weight: 500;
    color: #1a1a1a;
    margin: 0;
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

  .close-btn:hover:not(:disabled) {
    background: #f5f5f5;
  }
}

.process-report-modal-body {
  padding: 20px;
}

.process-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  .section-label {
    font-size: 13px;
    font-weight: 500;
    color: #1a1a1a;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 4px;

    .required {
      color: #ff3b30;
    }

    .word-count {
      margin-left: auto;
      font-size: 11px;
      color: #8e8e93;
      font-weight: normal;
    }
  }
}

.status-radio-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.status-radio-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(.disabled) {
    border-color: #007aff;
    background: #f5f5f5;
  }

  &.selected {
    border-color: #007aff;
    background: #f0f7ff;

    .status-radio-label {
      color: #007aff;
      font-weight: 500;
    }
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .status-radio-input {
    width: 14px;
    height: 14px;
    margin-right: 8px;
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
    }
  }

  .status-radio-label {
    font-size: 13px;
    color: #1a1a1a;
  }
}

.note-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #007aff;
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
}

.process-report-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid #e5e5e5;
}

.modal-btn {
  min-width: 80px;
  height: 34px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  &.cancel-btn {
    background: #f5f5f5;
    color: #666;

    &:hover:not(:disabled) {
      background: #e5e5e5;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &.submit-btn {
    background: #007aff;
    color: #fff;

    &:hover:not(:disabled) {
      background: #005fc1;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>
