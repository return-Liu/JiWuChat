<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal-overlay" @click="handleClose">
      <div class="modal-container" @click.stop>
        <!-- 头部 -->
        <div class="modal-header">
          <div class="header-left">
            <i class="iconfont icon-pilianggengxin"></i>
            <span class="header-title">发现新版本</span>
          </div>
          <button class="close-btn" @click="handleClose">×</button>
        </div>

        <!-- 内容 -->
        <div class="modal-body">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <span>正在检查更新...</span>
          </div>

          <div v-else-if="latestLog" class="update-content">
            <!-- 版本信息 -->
            <div class="version-info">
              <span class="version-badge">版本 {{ latestVersion }}</span>
              <span class="update-time">{{ formatTime(latestLog.createdAt) }}</span>
            </div>

            <!-- 标题 -->
            <div v-if="latestLog.title" class="update-title">
              {{ latestLog.title }}
            </div>

            <!-- 摘要 -->
            <div v-if="latestLog.summary" class="update-summary">
              {{ latestLog.summary }}
            </div>

            <!-- 更新内容 -->
            <div class="update-details">
              <div class="details-title">详细内容</div>
              <div class="details-content" v-html="renderMarkdown(latestLog.content)"></div>
            </div>
          </div>

          <div v-else class="empty-state">
            <i class="iconfont icon-pilianggengxin"></i>
            <p>当前已是最新版本</p>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="modal-footer">
          <button class="btn-default" @click="handleLater">稍后提醒</button>
          <button class="btn-primary" @click="handleUpdate" :disabled="!latestLog">立即查看</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import request from "../untils/request";
import { renderMarkdown } from "../untils/markdownRenderer";

const router = useRouter();

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const loading = ref(false);
const latestVersion = ref("");
const latestLog = ref<any>(null);

// 格式化时间
const formatTime = (timeStr: string) => {
  if (!timeStr) return "";
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `今天 ${hours}:${minutes}`;
  } else if (days === 1) {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `昨天 ${hours}:${minutes}`;
  } else {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${month}月${day}日`;
  }
};

const handleClose = () => {
  emit("update:visible", false);
};

const handleLater = () => {
  if (latestVersion.value) {
    localStorage.setItem("lastViewedUpdateVersion", latestVersion.value);
  }
  emit("update:visible", false);
};

const handleUpdate = () => {
  if (latestVersion.value) {
    localStorage.setItem("lastViewedUpdateVersion", latestVersion.value);
  }
  emit("update:visible", false);
  setTimeout(() => {
    router.push("/updateLogs");
  }, 200);
};

const checkVersionUpdate = async () => {
  try {
    loading.value = true;
    const res = await request.get("/updatelogs/latest");

    let latestData = null;
    if (res && res.data) {
      latestData = res.data;
    } else if (res && typeof res === "object") {
      latestData = res;
    }

    if (!latestData || !latestData.hasUpdate) {
      return false;
    }

    const logData = latestData.latestLog;
    if (!logData) {
      return false;
    }

    const localVersion = localStorage.getItem("lastViewedUpdateVersion");
    if (localVersion && localVersion === logData.version) {
      return false;
    }

    latestVersion.value = logData.version;
    latestLog.value = logData;
    return true;
  } catch (err) {
    console.error("检查更新失败:", err);
    return false;
  } finally {
    loading.value = false;
  }
};

defineExpose({
  checkVersionUpdate,
});

watch(
  () => props.visible,
  async (newVal) => {
    if (newVal && !latestLog.value) {
      await checkVersionUpdate();
    }
  },
);

onMounted(async () => {
  if (props.visible) {
    await checkVersionUpdate();
  }
});
</script>

<style scoped>
/* 遮罩层 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* 弹窗容器 */
.modal-container {
  width: 520px;
  max-width: 92%;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  animation: modalIn 0.25s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 头部 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 22px;
  color: #bbb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

/* 内容区域 */
.modal-body {
  padding: 20px 24px 16px;
  max-height: 520px;
  overflow-y: auto;
}

.modal-body::-webkit-scrollbar {
  width: 4px;
}

.modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  gap: 14px;
  color: #999;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #f0f0f0;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 更新内容 */
.update-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.version-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.version-badge {
  display: inline-block;
  padding: 4px 14px;
  background: #e6f0ff;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1890ff;
}

.update-time {
  font-size: 13px;
  color: #aaa;
}

.update-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.6;
  margin: 2px 0;
}

.update-summary {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 10px;
  margin: 4px 0;
}

.update-details {
  margin-top: 4px;
}

.details-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

/* ============ 更新内容样式 ============ */
.details-content {
  font-size: 14px;
  color: #333;
  line-height: 1.8;
}

/* Markdown 渲染样式 */
.details-content :deep(h3) {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  padding: 16px 0 10px;
  margin: 8px 0 12px;
  border-bottom: 2px solid #e8ecf0;
}

.details-content :deep(ul) {
  margin: 4px 0 6px;
  padding-left: 20px;
  list-style-type: disc;
}

.details-content :deep(li) {
  margin: 2px 0;
  padding: 2px 0;
  color: #444;
  line-height: 1.8;
}

.details-content :deep(li::marker) {
  color: #1890ff;
}

.details-content :deep(p) {
  color: #444;
  line-height: 1.8;
  margin: 6px 0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  color: #aaa;
}

/* 底部按钮 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 24px 18px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.btn-default,
.btn-primary {
  padding: 10px 28px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s;
  border: none;
  font-weight: 500;
}

.btn-default {
  background: #f0f0f0;
  color: #666;
}

.btn-default:hover {
  background: #e5e5e5;
}

.btn-primary {
  background: #1890ff;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .modal-container {
    width: 100%;
    max-width: 95%;
    border-radius: 12px;
  }

  .modal-header {
    padding: 16px 18px 12px;
  }

  .modal-body {
    padding: 16px 18px 12px;
    max-height: 450px;
  }

  .header-title {
    font-size: 16px;
  }

  .update-title {
    font-size: 17px;
  }

  .modal-footer {
    padding: 12px 18px 16px;
  }

  .btn-default,
  .btn-primary {
    padding: 8px 20px;
    font-size: 13px;
  }

  .details-content .module-card {
    margin: 12px 0;
  }

  .details-content .module-title {
    padding: 10px 14px;
    font-size: 14px;
  }

  .details-content .module-body {
    padding: 10px 14px 12px;
  }

  .details-content .content-list {
    padding-left: 16px;
  }
}
</style>
