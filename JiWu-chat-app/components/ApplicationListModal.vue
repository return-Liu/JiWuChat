<template>
  <transition name="modal-fade">
    <!-- 去掉了 @click="handleClose" -->
    <div v-if="visible" class="modal-overlay">
      <div class="modal-card" @click.stop>
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="modal-title-wrapper">
              <h2 class="modal-title">群聊申请记录</h2>
              <p class="modal-subtitle">看看你申请过哪些群，现在啥状态</p>
            </div>
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
                全部记录
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
                class="application-card"
              >
                <div class="card-header">
                  <div class="header-left">
                    <div class="card-avatar">
                      <img :src="app.avatar" :alt="app.groupName" />
                    </div>
                    <div class="card-title-group">
                      <h4 class="card-title">{{ app.groupName }}</h4>
                      <div class="card-meta">
                        <span class="meta-item"
                          >群号：{{ app.groupNumber }}</span
                        >
                      </div>
                    </div>
                  </div>
                  <span class="status-badge" :class="'status-' + app.status">{{
                    getStatusText(app.status)
                  }}</span>
                </div>

                <div class="card-content">
                  <div class="content-row">
                    <span class="content-label">申请时间：</span>
                    <span class="content-text">{{ app.createdAt }}</span>
                  </div>
                  <div v-if="app.message" class="content-row message-row">
                    <span class="content-label">申请备注：</span>
                    <span class="content-text">{{ app.message }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <div class="empty-icon iconfont icon-CDnmxN01"></div>
              <h4>还没有申请记录</h4>
              <p>你还没申请加入任何群聊哦</p>
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

interface Application {
  id: string;
  groupName: string;
  groupNumber: string;
  avatar: string;
  status: string;
  createdAt: string;
  message?: string;
}

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const filterStatus = ref<string>("");
const applications = ref<Application[]>([]);
const loading = ref(false);

const handleClose = () => {
  emit("update:visible", false);
};

const handleFilterChange = async (status: string) => {
  filterStatus.value = status;
  await loadApplications();
};

const loadApplications = async () => {
  try {
    loading.value = true;
    const params = filterStatus.value ? { status: filterStatus.value } : {};
    const res = await request.get("/group/my-applications", { params });
    applications.value = res.data.applications;
  } catch (error: any) {
    message.error(error.response?.data?.data?.message || "加载申请记录失败啦");
  } finally {
    loading.value = false;
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

.modal-title-group {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.modal-title-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e5e5e5;
  flex-shrink: 0;
}

.modal-title-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
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

  .application-card {
    background: #f8f8f8;
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .header-left {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .card-avatar {
    flex-shrink: 0;

    img {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
    }
  }

  .card-title-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1;
  }

  .card-title {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: #1a1a1a;
  }

  .card-meta {
    font-size: 11px;
    color: #8e8e93;

    .meta-item {
      display: inline-block;
    }
  }

  .status-badge {
    flex-shrink: 0;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 11px;
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

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 8px;
    border-top: 1px solid #e5e5e5;
  }

  .content-row {
    display: flex;
    gap: 8px;
    font-size: 12px;

    .content-label {
      color: #8e8e93;
      flex-shrink: 0;
    }

    .content-text {
      color: #666;
      flex: 1;
      word-break: break-word;
    }

    &.message-row {
      background: #efefef;
      padding: 6px 10px;
      border-radius: 6px;
      margin-top: 2px;
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
