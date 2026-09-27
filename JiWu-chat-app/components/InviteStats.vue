<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal-overlay">
      <div class="modal-card" @click.stop>
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="modal-title-wrapper">
              <h2 class="modal-title">邀请统计</h2>
              <p class="modal-subtitle">查看群聊邀请数据统计</p>
            </div>
          </div>
          <button class="modal-close-btn" @click="handleClose">✕</button>
        </div>

        <div class="modal-body">
          <div v-if="loading" class="loading-state">
            <span class="loading-spinner"></span>
            <p>加载中...</p>
          </div>

          <div v-else class="stats-content">
            <!-- 数据概览 -->
            <div class="overview-section">
              <div class="stat-card">
                <div class="stat-value">{{ stats.total }}</div>
                <div class="stat-label">总邀请数</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.pending }}</div>
                <div class="stat-label">待处理</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.accepted }}</div>
                <div class="stat-label">已接受</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.rejected }}</div>
                <div class="stat-label">已拒绝</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ stats.successRate }}%</div>
                <div class="stat-label">成功率</div>
              </div>
            </div>

            <!-- 时间筛选 -->
            <div class="filter-section">
              <span class="filter-label">统计时间</span>
              <select
                v-model="selectedDays"
                class="filter-select"
                @change="handleDaysChange(selectedDays)"
              >
                <option :value="7">最近 7 天</option>
                <option :value="30">最近 30 天</option>
                <option :value="90">最近 90 天</option>
                <option :value="180">最近半年</option>
              </select>
            </div>

            <!-- 邀请记录 -->
            <div class="records-section">
              <div class="section-header">
                <h3 class="section-title">邀请明细</h3>
                <span class="record-count"
                  >共 {{ stats.details.length }} 条</span
                >
              </div>

              <div v-if="stats.details.length === 0" class="empty-records">
                <div class="empty-icon iconfont icon-CDnmxN01"></div>
                <p>暂无邀请记录</p>
              </div>

              <div v-else class="records-list">
                <div
                  v-for="record in stats.details"
                  :key="record.id"
                  class="record-item"
                >
                  <div class="record-main">
                    <img
                      class="record-avatar"
                      :src="getInviteeAvatar(record)"
                    />
                    <div class="record-info">
                      <div class="record-name-row">
                        <span class="invitee-name">{{
                          getInviteeName(record)
                        }}</span>
                        <span
                          class="status-tag"
                          :class="'status-' + getStatusClass(record.status)"
                        >
                          {{ getStatusText(record.status) }}
                        </span>
                      </div>
                      <div class="record-detail-row">
                        <span class="group-name">{{ record.groupName }}</span>
                        <span class="record-time">{{
                          formatTime(record.createdAt)
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import request from "../untils/request";

interface Props {
  visible: boolean;
}
const props = withDefaults(defineProps<Props>(), { visible: false });
const emit = defineEmits<{ "update:visible": [value: boolean] }>();

interface InviteStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  successRate: string;
  details: Array<{
    id: number;
    groupName: string;
    invitee: any;
    status: string;
    createdAt: string;
  }>;
}

const loading = ref(false);
const selectedDays = ref(30);
const stats = ref<InviteStats>({
  total: 0,
  pending: 0,
  accepted: 0,
  rejected: 0,
  successRate: "0",
  details: [],
});

const fetchInviteStats = async (days: number = 30) => {
  loading.value = true;
  try {
    const res = await request.get(`/group/invite-stats?days=${days}`);
    stats.value = res.data;
  } catch (err: any) {
    message.error(err.message || "获取失败");
  } finally {
    loading.value = false;
  }
};

const handleDaysChange = (v: number) => fetchInviteStats(v);

const formatTime = (timeStr: string) => {
  const date = new Date(timeStr);
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusClass = (s: string) => {
  if (s === "group_invite_pending") return "pending";
  if (s === "group_invite_accepted") return "accepted";
  if (s === "group_invite_rejected") return "rejected";
  return "pending";
};

const getStatusText = (s: string) => {
  if (s === "group_invite_pending") return "待处理";
  if (s === "group_invite_accepted") return "已接受";
  if (s === "group_invite_rejected") return "已拒绝";
  return "未知";
};

const getInviteeAvatar = (r: any) =>
  r.invitee
    ? r.invitee.avatar || r.invitee.receiver?.avatar || "/default-avatar.png"
    : "/default-avatar.png";

const getInviteeName = (r: any) =>
  r.invitee
    ? r.invitee.receiver?.nickname ||
      r.invitee.nickname ||
      r.invitee.username ||
      "未知用户"
    : "未知用户";

const handleClose = () => emit("update:visible", false);

watch(
  () => props.visible,
  (v) => v && fetchInviteStats(selectedDays.value),
);
</script>

<style scoped>
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
  max-width: 600px;
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
  color: #8e8e93;
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 2px solid #e5e5e5;
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-state p {
  margin: 0;
  font-size: 13px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.overview-section {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.stat-card {
  background: #f8f8f8;
  border-radius: 10px;
  padding: 12px 4px;
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 11px;
  color: #8e8e93;
}

.filter-section {
  background: #f8f8f8;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-label {
  font-size: 13px;
  color: #1a1a1a;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #007aff;
}

.records-section {
  background: #f8f8f8;
  border-radius: 10px;
  overflow: hidden;
}

.section-header {
  padding: 12px 14px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0;
}

.record-count {
  font-size: 11px;
  color: #8e8e93;
}

.empty-records {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 60px;
}

.empty-records p {
  margin: 0;
  font-size: 13px;
  color: #8e8e93;
}

.records-list {
  max-height: 320px;
  overflow-y: auto;
}

.record-item {
  padding: 10px 14px;
  border-bottom: 1px solid #e5e5e5;
}

.record-item:last-child {
  border-bottom: none;
}

.record-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.record-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.record-info {
  flex: 1;
  min-width: 0;
}

.record-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.invitee-name {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
}

.status-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
}

.status-pending {
  background: #fff3e0;
  color: #ff9800;
}

.status-accepted {
  background: #e6f7e6;
  color: #28a745;
}

.status-rejected {
  background: #ffe6e6;
  color: #ff3b30;
}

.record-detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #8e8e93;
}

.group-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
}

.record-time {
  color: #bbb;
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
