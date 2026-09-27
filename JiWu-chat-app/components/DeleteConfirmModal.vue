<template>
  <div v-if="visible" class="modal-mask" @click.self="handleCancel">
    <div class="modal-wrapper">
      <div class="modal-container small">
        <div class="modal-header">
          <span>确认删除</span>
          <button class="close-btn" @click="handleCancel">×</button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">确定删除这条更新日志吗？</p>
          <p class="delete-preview">{{ content }}</p>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="handleCancel">取消</button>
          <button class="delete-btn" @click="handleConfirm" :disabled="loading">
            {{ loading ? "删除中" : "删除" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean;
  content: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

const handleConfirm = () => {
  emit("confirm");
};

const handleCancel = () => {
  emit("update:visible", false);
  emit("cancel");
};
</script>

<style lang="scss" scoped>
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-container {
  background: #fff;
  border-radius: 8px;
  max-width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

  &.small {
    width: 380px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
  padding: 0 4px;
  line-height: 1;

  &:hover {
    color: #333;
  }
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;

  .confirm-text {
    font-size: 14px;
    color: #333;
  }

  .delete-preview {
    margin-top: 12px;
    padding: 8px 12px;
    background: #f5f5f5;
    border-radius: 6px;
    font-size: 13px;
    color: #666;
    word-break: break-all;
    line-height: 1.5;
  }
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.cancel-btn,
.delete-btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.cancel-btn {
  background: #f0f0f0;
  color: #333;

  &:hover:not(:disabled) {
    background: #e0e0e0;
  }
}

.delete-btn {
  background: #ff4d4f;
  color: #fff;

  &:hover:not(:disabled) {
    background: #ff7875;
  }
}
</style>
