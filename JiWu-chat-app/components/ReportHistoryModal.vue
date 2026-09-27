<template>
  <div v-if="visible" class="report-history-modal-mask">
    <div class="report-history-modal" @click.stop>
      <div class="report-history-header">
        <h2 class="page-title">举报记录</h2>
        <button class="header-close" @click="handleClose">✕</button>
      </div>

      <div v-if="loading" class="loading-wrapper">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>

      <div v-else class="report-content">
        <div class="report-section">
          <div class="section-header">
            <h3 class="section-title">举报明细</h3>
            <span class="record-count">共 {{ total }} 条记录</span>
          </div>

          <div v-if="reports.length === 0" class="empty-records">
            <div class="empty-icon iconfont icon-CDnmxN01"></div>
            <p>暂无举报记录</p>
          </div>

          <div v-else class="report-list">
            <div
              v-for="report in reports"
              :key="report.id"
              class="report-item"
              @click="handleViewDetail(report)"
            >
              <div class="report-main">
                <div class="target-avatar">
                  <img :src="getTargetAvatar(report)" />
                </div>

                <div class="report-info">
                  <div class="report-name-row">
                    <span class="target-name">{{ getTargetName(report) }}</span>
                    <span
                      :class="['status-tag', getStatusClass(report.status)]"
                    >
                      {{ getStatusLabel(report.status) }}
                    </span>
                  </div>

                  <div class="report-detail-row">
                    <span class="report-type">
                      {{ report.reportedGroup ? "群聊" : "用户" }} ·
                      {{ getReasonText(report.reason) }}
                    </span>
                    <span class="report-time">{{ report.createdAt }}</span>
                  </div>
                </div>
              </div>

              <div class="report-btns" @click.stop>
                <button
                  v-if="
                    userStore.userInfo?.id === 1 &&
                    ['pending', 'processing'].includes(report.status)
                  "
                  class="btn-process"
                  @click="handleProcessReport(report)"
                >
                  处理
                </button>
                <button
                  v-if="isReporter(report) || userStore.userInfo?.id === 1"
                  class="btn-delete"
                  @click="handleDeleteReport(report)"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination-section">
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="handlePageChange(currentPage - 1)"
        >
          ←
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="handlePageChange(currentPage + 1)"
        >
          →
        </button>
      </div>
    </div>

    <ReportDetailModal
      :visible="showDetailModal"
      @update:visible="showDetailModal = $event"
      :report="selectedReport"
    />
    <ProcessReportModal
      :visible="showProcessModal"
      @update:visible="showProcessModal = $event"
      :report-id="processingReportId"
      :current-status="processingReportStatus"
      @success="handleProcessSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message, Modal } from "ant-design-vue";

import { useUserStore } from "../stores/user";
import { getReportList, deleteReport } from "../untils/reportUtils";

interface ReportItem {
  id: number;
  reason: string;
  description: string | null;
  evidenceFiles: any[] | null;
  status: "pending" | "processing" | "resolved" | "rejected";
  adminNote: string | null;
  processedAt: string | null;
  processedBy: string | null;
  createdAt: string;
  reporter: any | null;
  reportedUser: any | null;
  reportedGroup: any | null;
}

const props = defineProps({
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(["update:visible"]);

const loading = ref(false);
const reports = ref<ReportItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const showDetailModal = ref(false);
const selectedReport = ref<ReportItem | null>(null);
const userStore = useUserStore();
const showProcessModal = ref(false);
const processingReportId = ref<number | null>(null);
const processingReportStatus = ref<string>("pending");

const defaultAvatar =
  "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png";

async function loadReports() {
  loading.value = true;
  try {
    const params = { page: currentPage.value, limit: pageSize.value };
    const result = await getReportList(params);
    reports.value = result.reports || [];
    total.value = result.total || 0;
  } catch (error) {
    console.error("加载举报记录失败:", error);
  } finally {
    loading.value = false;
  }
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

watch(
  () => props.visible,
  (val) => {
    if (val) {
      currentPage.value = 1;
      loadReports();
    }
  },
);

function handlePageChange(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  loadReports();
}

function handleViewDetail(report: ReportItem) {
  selectedReport.value = report;
  showDetailModal.value = true;
}

function getTargetName(report: ReportItem) {
  if (report.reportedGroup) return report.reportedGroup.name;
  if (report.reportedUser)
    return report.reportedUser.nickname || report.reportedUser.username;
  return "未知对象";
}

function getTargetAvatar(report: ReportItem) {
  if (report.reportedGroup) return report.reportedGroup.avatar || defaultAvatar;
  if (report.reportedUser) return report.reportedUser.avatar || defaultAvatar;
  return defaultAvatar;
}

function getReasonText(reason: string) {
  const map: Record<string, string> = {
    porn: "色情内容",
    violence: "暴力恐怖",
    fraud: "网络诈骗",
    harassment: "骚扰他人",
    advertising: "广告推广",
    politics: "政治敏感",
    other: "其他",
  };
  return map[reason] || reason;
}

function getStatusClass(status: string) {
  return status;
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "待处理",
    processing: "处理中",
    resolved: "已处理",
    rejected: "已驳回",
  };
  return map[status] || status;
}

function isReporter(report: ReportItem) {
  if (!report.reporter || !userStore.userInfo) return false;
  return report.reporter.id === userStore.userInfo.id;
}

async function handleDeleteReport(report: ReportItem) {
  try {
    await Modal.confirm({
      title: "删除确认",
      content: "确定删除这条举报记录？",
      okText: "确定",
      cancelText: "取消",
    });
    await deleteReport(report.id);
    message.success("删除成功");
    loadReports();
  } catch (err) {
    if (err !== "cancel") message.error("删除失败");
  }
}

function handleProcessReport(report: ReportItem) {
  processingReportId.value = report.id;
  processingReportStatus.value = report.status;
  showProcessModal.value = true;
}

function handleProcessSuccess() {
  loadReports();
}

function handleClose() {
  emit("update:visible", false);
}
</script>

<style scoped>
.report-history-modal-mask {
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

.report-history-modal {
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

.report-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e5e5;
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0;
}

.header-close {
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

.header-close:hover {
  background: #f5f5f5;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 10px;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.report-content {
  flex: 1;
  overflow-y: auto;
}

.report-section {
  background: #fff;
}

.section-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
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

.report-list {
  max-height: 500px;
  overflow-y: auto;
}

.report-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.report-item:hover {
  background: #fafafa;
}

.report-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.target-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.target-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.report-info {
  flex: 1;
  min-width: 0;
}

.report-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.target-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.status-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.status-tag.pending {
  background: #fff3e0;
  color: #ff9800;
}
.status-tag.processing {
  background: #e6f7ff;
  color: #007aff;
}
.status-tag.resolved {
  background: #e6f7e6;
  color: #28a745;
}
.status-tag.rejected {
  background: #ffe6e6;
  color: #ff3b30;
}

.report-detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #8e8e93;
}

.report-type {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;
}

.report-time {
  flex-shrink: 0;
}

.report-btns {
  display: flex;
  gap: 8px;
  margin-left: 12px;
}

.btn-process,
.btn-delete {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  border: none;
}

.btn-process {
  background: #f0f7ff;
  color: #007aff;
}

.btn-process:hover {
  background: #e0efff;
}

.btn-delete {
  background: #ffe6e6;
  color: #ff3b30;
}

.btn-delete:hover {
  background: #ffd4d4;
}

.pagination-section {
  padding: 10px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.page-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #e5e5e5;
  background: #fff;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.page-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: #666;
}
</style>
