<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal-overlay" @click="handleClose">
      <div class="modal-card" @click.stop>
        <div class="modal-header">
          <div class="modal-header-content">
            <div class="modal-title-section">
              <h2 class="modal-title">群申请管理</h2>
            </div>
            <p class="modal-subtitle">处理想加入群里的小伙伴</p>
          </div>
          <button class="modal-close-btn" @click="handleClose">✕</button>
        </div>

        <div class="modal-body">
          <div class="tab-filter">
            <div class="tab-container">
              <button
                class="tab-button"
                :class="{ active: filterStatus === '' }"
                @click="handleFilterChange('')"
              >
                全部申请
              </button>
              <button
                class="tab-button"
                :class="{ active: filterStatus === 'pending' }"
                @click="handleFilterChange('pending')"
              >
                待审核
              </button>
              <button
                class="tab-button"
                :class="{ active: filterStatus === 'approved' }"
                @click="handleFilterChange('approved')"
              >
                已通过
              </button>
              <button
                class="tab-button"
                :class="{ active: filterStatus === 'rejected' }"
                @click="handleFilterChange('rejected')"
              >
                已拒绝
              </button>
            </div>
          </div>

          <div class="application-list">
            <div v-if="loading" class="loading-state">
              <span class="loading-spinner"></span>
              <p>正在加载...</p>
            </div>
            <div v-else-if="applications.length > 0">
              <div
                v-for="app in applications"
                :key="app.id"
                class="application-item"
              >
                <div class="app-avatar">
                  <img :src="app.avatar" :alt="app.username" />
                </div>
                <div class="app-content">
                  <div class="app-info-row">
                    <h4 class="app-title">{{ app.username }}</h4>
                    <span class="app-time">{{ app.createdAt }}</span>
                  </div>
                  <div v-if="app.message" class="app-reason">
                    <span class="reason-label">申请备注：</span>
                    <span class="reason-text">{{ app.message }}</span>
                  </div>
                  <div class="app-actions">
                    <template v-if="app.status === 'pending'">
                      <button
                        class="action-btn accept-btn"
                        @click="handleApprove(Number(app.id))"
                      >
                        同意
                      </button>
                      <button
                        class="action-btn reject-btn"
                        @click="handleReject(Number(app.id))"
                      >
                        拒绝
                      </button>
                    </template>
                    <template v-else>
                      <span
                        class="status-badge"
                        :class="'status-' + app.status"
                        >{{ getStatusText(app.status) }}</span
                      >
                    </template>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <div class="empty-icon iconfont icon-CDnmxN01"></div>
              <h4>暂无申请记录</h4>
              <p>还没人申请加入这个群哦</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import request from "../untils/request";
import { message } from "ant-design-vue";

interface ManageApplication {
  id: number;
  username: string;
  avatar: string;
  status: string;
  createdAt: string;
  message?: string;
}

const props = defineProps<{
  visible: boolean;
  groupId: number | null;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

const filterStatus = ref<string>("");
const applications = ref<ManageApplication[]>([]);
const loading = ref(false);

const handleClose = () => {
  emit("update:visible", false);
};

const handleFilterChange = async (status: string) => {
  filterStatus.value = status;
  await loadApplications();
};

const loadApplications = async () => {
  if (!props.groupId && props.groupId !== 0) {
    message.error("还没选要管理的群呢");
    return;
  }

  try {
    loading.value = true;
    const params = filterStatus.value ? { status: filterStatus.value } : {};
    const res = await request.get(`/group/${props.groupId}/applications`, {
      params,
    });
    applications.value = res.data.applications;
  } catch (error: any) {
    message.error(error.response?.data?.data?.message || "加载申请记录失败啦");
  } finally {
    loading.value = false;
  }
};

const handleApprove = async (applicationId: number) => {
  try {
    await request.put(`/group/applications/${applicationId}`, {
      status: "approved",
    });
    message.success("已同意加入～");
    await loadApplications();
    emit("success");
  } catch (error: any) {
    message.error(error.response?.data?.data?.message || "操作失败了，再试试");
  }
};

const handleReject = async (applicationId: number) => {
  try {
    await request.put(`/group/applications/${applicationId}`, {
      status: "rejected",
    });
    message.success("已拒绝申请");
    await loadApplications();
    emit("success");
  } catch (error: any) {
    message.error(error.response?.data?.data?.message || "操作失败了，再试试");
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "pending":
      return "待审核";
    case "approved":
    case "accepted":
      return "已通过";
    case "rejected":
      return "已拒绝";
    case "blocked":
      return "已屏蔽";
    default:
      return status;
  }
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      loadApplications();
    } else {
      applications.value = [];
      filterStatus.value = "";
    }
  },
);
</script>

<style scoped lang="scss">
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
  z-index: 2000;
}

.modal-card {
  width: 90%;
  max-width: 640px;
  max-height: 85vh;
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-shrink: 0;
}

.modal-header-content {
  flex: 1;
}

.modal-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.modal-title-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e5e5e5;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #1a1a1a;
}

.modal-subtitle {
  margin: 0;
  font-size: 12px;
  color: #8e8e93;
}

.modal-close-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  color: #8e8e93;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: #f5f5f5;
}

.modal-body {
  padding: 16px 20px 20px;
  overflow-y: auto;
  flex: 1;
}

.tab-filter {
  margin-bottom: 16px;
}

.tab-container {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-button {
  padding: 6px 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.2s;

  &:hover {
    background: #e5e5e5;
  }

  &.active {
    background: #007aff;
    color: #fff;
  }
}

.application-list {
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    gap: 12px;
    color: #8e8e93;

    .loading-spinner {
      width: 28px;
      height: 28px;
      border: 2px solid #e5e5e5;
      border-top-color: #007aff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    p {
      margin: 0;
      font-size: 13px;
    }
  }

  .application-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }
  }

  .app-avatar {
    flex-shrink: 0;

    img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }
  }

  .app-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .app-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .app-title {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: #1a1a1a;
  }

  .app-time {
    font-size: 11px;
    color: #8e8e93;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .app-reason {
    display: flex;
    gap: 6px;
    font-size: 12px;
    color: #666;
    background: #f8f8f8;
    padding: 6px 10px;
    border-radius: 6px;

    .reason-label {
      font-weight: 500;
      flex-shrink: 0;
      color: #1a1a1a;
    }

    .reason-text {
      flex: 1;
      word-break: break-word;
    }
  }

  .app-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 4px;

    .action-btn {
      padding: 5px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;

      &.accept-btn {
        background: #007aff;
        color: #fff;

        &:hover {
          background: #005fc1;
        }
      }

      &.reject-btn {
        background: #f5f5f5;
        color: #666;

        &:hover {
          background: #e5e5e5;
        }
      }
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;

      &.status-pending {
        background: #fff3e0;
        color: #ff9800;
      }

      &.status-approved,
      &.status-accepted {
        background: #e6f7e6;
        color: #28a745;
      }

      &.status-rejected {
        background: #ffe6e6;
        color: #ff3b30;
      }

      &.status-blocked {
        background: #f5f5f5;
        color: #8e8e93;
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;

  .empty-icon {
    font-size: 60px;
  }

  h4 {
    margin: 0 0 6px;
    font-size: 15px;
    color: #666;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #8e8e93;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
