<template>
  <div class="info-card">
    <div class="info-grid">
      <!-- 基础信息 -->
      <div class="label">群名称</div>
      <div class="value">{{ groupName }}</div>

      <div class="label">群号</div>
      <div class="value">{{ groupNumber }}</div>

      <div class="label">群类型</div>
      <div class="value">{{ isPrivate ? "私密群" : "公开群" }}</div>

      <div class="label">群标签</div>
      <div class="value">{{ groupTag || "无" }}</div>

      <div class="label">成员人数</div>
      <div class="value">{{ currentMembers }} / {{ maxMembers }} 人</div>

      <div class="label">加入方式</div>
      <div class="value">{{ requireApproval ? "需审核" : "直接加入" }}</div>

      <!-- 可选信息 -->
      <template v-if="showInviter">
        <div class="label">邀请人</div>
        <div class="value">{{ inviterName }}</div>
      </template>

      <template v-if="showInviteTime">
        <div class="label">邀请时间</div>
        <div class="value">{{ formatTime(inviteTimeDisplay) }}</div>
      </template>

      <template v-if="showExpireTime">
        <div class="label">有效期</div>
        <div class="value" :class="{ expired: isExpired }">
          {{ formatTime(expireTimeDisplay) }}
        </div>
      </template>

      <template v-if="showProcessingTime">
        <div class="label">处理时间</div>
        <div class="value">{{ formatTime(processingTimeDisplay) }}</div>
      </template>
    </div>

    <!-- 群公告（独占一行） -->
    <div class="announcement" v-if="groupNotice">
      <div class="label">群公告</div>
      <div class="notice-box">{{ groupNotice }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";

interface Props {
  showInviter?: boolean;
  showInviteTime?: boolean;
  showExpireTime?: boolean;
  showProcessingTime?: boolean;

  inviterName?: string;
  inviteTimeDisplay?: string | number | Date;
  expireTimeDisplay?: string | number | Date;
  processingTimeDisplay?: string | number | Date;
  isExpired?: boolean;
}

withDefaults(defineProps<Props>(), {
  showInviter: false,
  showInviteTime: false,
  showExpireTime: false,
  showProcessingTime: false,
  inviterName: "",
  inviteTimeDisplay: "",
  expireTimeDisplay: "",
  processingTimeDisplay: "",
  isExpired: false,
});

// 注入数据
const groupName = inject<string>("groupName", "");
const groupNumber = inject<string>("groupNumber", "");
const isPrivate = inject<boolean>("isPrivate", false);
const currentMembers = inject<number>("currentMembers", 0);
const maxMembers = inject<string | number>("maxMembers", "500");
const groupTag = inject<string>("groupTag", "");
const requireApproval = inject<boolean>("requireApproval", false);
const groupNotice = inject<string>("groupNotice", "");

/**
 * 时间格式化：年---月---日 时:分
 */
const formatTime = (time: string | number | Date | undefined): string => {
  if (!time) return "未知";
  try {
    const date = new Date(time);
    if (isNaN(date.getTime())) return "未知";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch {
    return "未知";
  }
};
</script>

<style scoped>
/* 整体卡片 */
.info-card {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 12px;
}

/* 左右两栏核心布局 */
.info-grid {
  display: grid;
  grid-template-columns: 80px 1fr;
  column-gap: 16px;
  row-gap: 14px;
  align-items: center;
  font-size: 14px;
}

/* 标签样式 */
.label {
  color: #666;
  font-weight: 500;
  white-space: nowrap;
}

/* 值样式 */
.value {
  color: #333;
  word-break: break-word;
}

/* 过期状态 */
.value.expired {
  color: #f56c6c;
  font-weight: 500;
}

/* 公告模块 */
.announcement {
  margin-top: 20px;
}

.notice-box {
  margin-top: 8px;
  padding: 12px 14px;
  background: #f5f7fa;
  border-radius: 8px;
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
