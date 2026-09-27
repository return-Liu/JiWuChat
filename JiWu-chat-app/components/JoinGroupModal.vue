<template>
  <transition name="modal-fade">
    <div v-if="visible" class="join-group-modal" @click="handleOverlayClick">
      <div class="modal-dialog" @click.stop>
        <!-- 顶部标题栏 -->
        <div class="modal-header">
          <div class="header-left">
            <h2 class="title">加入群聊</h2>
            <p class="desc">查找群聊并申请加入</p>
          </div>
          <button
            class="btn-close"
            @click="handleClose"
            :disabled="isSubmitting"
          >
            ✕
          </button>
        </div>

        <!-- 内容主体 -->
        <div class="modal-body">
          <!-- 搜索区域 -->
          <div class="search-panel">
            <input
              v-model="groupNumber"
              type="text"
              placeholder="请输入群号码"
              class="search-input"
              :class="{ 'input-error': groupNumberError }"
              @input="handleGroupNumberInput"
            />

            <div
              class="search-feedback"
              v-if="groupNumber || groupNumberError || isSearching"
            >
              <div v-if="isSearching" class="searching">
                <span class="loading-spinner small"></span>
                <span>正在搜索群聊信息…</span>
              </div>
              <div v-else-if="groupNumberError" class="error">
                <span class="error-icon">!</span>
                <span>{{ groupNumberError }}</span>
              </div>
              <div v-else-if="selectedGroupInfo" class="success">
                <span class="success-icon">✓</span>
                <span>找到群聊：{{ selectedGroupInfo.name }}</span>
              </div>
            </div>
          </div>

          <!-- 搜索结果 -->
          <div
            class="group-list-panel"
            v-if="searchResult && !groupNumberError"
          >
            <div class="panel-header">
              <h3>搜索结果</h3>
            </div>
            <div class="list-container">
              <div
                v-for="item in [searchResult]"
                :key="item.id"
                class="group-item"
                :class="{ active: selectedGroupInfo?.id === item.id }"
                @click="selectGroupFromList(item)"
              >
                <div class="group-item-left">
                  <div class="avatar-box">
                    <img
                      :src="item.avatar || defaultAvatar"
                      alt=""
                      class="avatar"
                    />
                    <div v-if="item.isPrivate" class="private-badge"></div>
                  </div>
                  <div class="group-info">
                    <div class="item-title">
                      <span class="name">{{ item.name }}</span>
                      <div class="tags">
                        <span v-if="item.isPrivate" class="tag private"
                          >私密</span
                        >
                        <span v-if="item.requireApproval" class="tag approval"
                          >需审核</span
                        >
                      </div>
                    </div>
                    <div class="item-info">
                      <span>群号：{{ item.groupNumber }}</span>
                      <span class="count"
                        >{{ item.memberCount || 0 }}/{{
                          item.maxMembers || 1000
                        }}</span
                      >
                    </div>
                  </div>
                </div>
                <div
                  v-if="selectedGroupInfo?.id === item.id"
                  class="checked-icon"
                >
                  ✓
                </div>
              </div>
            </div>
          </div>

          <!-- 选中群详情 -->
          <div class="group-detail-panel" v-if="selectedGroupInfo">
            <h3 class="panel-header">群聊详情</h3>
            <div class="detail-card">
              <div class="detail-head">
                <img
                  :src="selectedGroupInfo.avatar || defaultAvatar"
                  alt=""
                  class="detail-avatar"
                />
                <div class="base-info">
                  <h4 class="group-name">{{ selectedGroupInfo.name }}</h4>
                  <p class="group-number">
                    群号：{{ selectedGroupInfo.groupNumber }}
                  </p>
                  <div class="detail-tags">
                    <span
                      class="detail-tag"
                      :class="
                        selectedGroupInfo.isPrivate ? 'private' : 'public'
                      "
                    >
                      {{ selectedGroupInfo.isPrivate ? "私密群" : "公开群" }}
                    </span>
                    <span
                      v-if="selectedGroupInfo.requireApproval"
                      class="detail-tag approval"
                      >需审核</span
                    >
                  </div>
                </div>
              </div>

              <div class="detail-info-row">
                <div class="info-item">
                  <span class="info-label">成员人数</span>
                  <span class="info-value"
                    >{{ selectedGroupInfo.memberCount || 0 }}/{{
                      selectedGroupInfo.maxMembers || 1000
                    }}</span
                  >
                </div>
                <div class="info-item">
                  <span class="info-label">群主</span>
                  <span class="info-value">{{
                    selectedGroupInfo.owner?.nickname ||
                    selectedGroupInfo.owner?.id ||
                    "未知"
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">创建时间</span>
                  <span class="info-value">{{
                    selectedGroupInfo.createdAt || "未知"
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">加入方式</span>
                  <span class="info-value">{{
                    selectedGroupInfo.requireApproval
                      ? "管理员审核"
                      : "直接加入"
                  }}</span>
                </div>
              </div>

              <div v-if="selectedGroupInfo.rule" class="announce-section">
                <div class="announce-title">
                  <span>群公告</span>
                </div>
                <div class="announce-content">{{ selectedGroupInfo.rule }}</div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div
            v-if="!groupNumber && !selectedGroupInfo && !isSearching"
            class="search-guide"
          >
            <div class="guide-icon iconfont icon-CDnmxN01"></div>
            <h4>查找群聊</h4>
            <p>输入群号码搜索并加入群聊</p>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="modal-footer">
          <div class="alert-tip">
            <span class="alert-icon">!</span>
            <span>提交加入申请即表示您同意遵守该群的相关规定</span>
          </div>
          <div class="action-row">
            <button
              class="btn btn-cancel"
              @click="handleClose"
              :disabled="isSubmitting"
            >
              取消
            </button>
            <button
              class="btn btn-confirm"
              :disabled="!selectedGroupInfo || isSubmitting"
              @click="handleSubmit"
            >
              <span v-if="isSubmitting" class="loading-spinner"></span>
              <span>{{ isSubmitting ? "提交中…" : "申请加入" }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from "vue";
import request from "../untils/request";
import { message } from "ant-design-vue";

interface GroupInfo {
  id: number | string;
  name: string;
  avatar: string;
  groupNumber: string;
  memberCount?: number;
  maxMembers?: number;
  createdAt?: string;
  owner?: { nickname?: string; id?: number | string };
  rule?: string;
  isPrivate?: boolean;
  requireApproval?: boolean;
}

interface Props {
  visible: boolean;
  isSubmitting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  isSubmitting: false,
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  close: [];
  success: [];
}>();

const defaultAvatar =
  "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png";

const groupNumber = ref("");
const groupNumberError = ref("");
const selectedGroupInfo = ref<GroupInfo | null>(null);
const searchResult = ref<GroupInfo | null>(null);
const isSearching = ref(false);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const handleClose = () => {
  if (props.isSubmitting) return;
  emit("update:visible", false);
  emit("close");
  resetForm();
};

const resetForm = () => {
  groupNumber.value = "";
  groupNumberError.value = "";
  selectedGroupInfo.value = null;
  searchResult.value = null;
};

const handleOverlayClick = () => {};

watch(
  () => props.visible,
  (val) => {
    if (!val) {
      resetForm();
    }
  },
  { immediate: true },
);

const handleGroupNumberInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  groupNumber.value = val;
  groupNumberError.value = "";
  selectedGroupInfo.value = null;
  searchResult.value = null;

  if (searchTimer) clearTimeout(searchTimer);
  if (!val.trim()) return;

  if (!/^[a-zA-Z0-9]+$/.test(val)) {
    groupNumberError.value = "群号只能包含字母和数字";
    return;
  }
  if (val.length < 4 || val.length > 20) {
    groupNumberError.value = "群号长度为4-20位";
    return;
  }

  searchTimer = setTimeout(() => {
    autoSearchGroup(val.trim());
  }, 500);
};

const autoSearchGroup = async (num: string) => {
  try {
    isSearching.value = true;
    const { data } = await request.get(`/group-number/${num}`);

    if (data.isPrivate) {
      groupNumberError.value = "该群为私密群，无法通过搜索加入";
      searchResult.value = null;
    } else {
      selectedGroupInfo.value = data;
      searchResult.value = data;
      groupNumberError.value = "";
    }
  } catch (err: any) {
    const msg = err.response?.data?.data?.message;
    groupNumberError.value =
      msg || (err.response?.status === 404 ? "未找到该群聊" : "搜索失败");
    searchResult.value = null;
  } finally {
    isSearching.value = false;
  }
};

const selectGroupFromList = (item: GroupInfo) => {
  if (item.isPrivate) {
    message.info("私密群需要邀请才能加入");
    return;
  }
  selectedGroupInfo.value = item;
  groupNumber.value = item.groupNumber;
  groupNumberError.value = "";
  if (searchTimer) clearTimeout(searchTimer);
};

const handleSubmit = async () => {
  if (!selectedGroupInfo.value) {
    message.error("请选择要加入的群聊");
    return;
  }

  try {
    const params = { groupNumber: selectedGroupInfo.value.groupNumber };
    if (selectedGroupInfo.value.requireApproval) {
      await request.post("/group/apply", params);
      message.success("申请已提交，等待管理员审核");
    } else {
      await request.post("/group/join-public", params);
      message.success("成功加入群聊");
    }
    emit("update:visible", false);
    emit("success");
    resetForm();
  } catch (err: any) {
    message.error(err.response?.data?.data?.message || "操作失败");
  }
};

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer);
});
</script>

<style scoped lang="scss">
// 完全沿用你之前统一的配色与间距
.join-group-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-dialog {
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;

  .header-left {
    .title {
      margin: 0 0 4px;
      font-size: 20px;
      font-weight: 600;
      color: #1d2129;
    }
    .desc {
      margin: 0;
      font-size: 13px;
      color: #86909c;
    }
  }

  .btn-close {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: transparent;
    border: none;
    font-size: 18px;
    color: #86909c;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;

    &:hover {
      background: #f2f3f5;
      color: #1d2129;
    }
  }
}

.modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #fff;
}

.search-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #4080ff;
  }

  &.input-error {
    border-color: #f53f3f;
  }
}

.search-feedback {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;

  .searching {
    color: #86909c;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .error {
    color: #f53f3f;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .success {
    color: #00b42a;
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.error-icon,
.success-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.error-icon {
  background: #f53f3f;
  color: #fff;
}

.success-icon {
  background: #00b42a;
  color: #fff;
}

.group-list-panel {
  .panel-header {
    margin-bottom: 12px;

    h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #1d2129;
    }
  }

  .list-container {
    max-height: 260px;
    overflow-y: auto;
  }

  .group-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #f5f6f7;
    }

    &.active {
      background: #f0f7ff;
    }
  }

  .group-item-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .avatar-box {
    position: relative;

    .avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
    }

    .private-badge {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 16px;
      height: 16px;
      background: #ff9800;
      border-radius: 50%;
    }
  }

  .group-info {
    flex: 1;
  }

  .item-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;

    .name {
      font-size: 14px;
      font-weight: 500;
      color: #1d2129;
    }

    .tags {
      display: flex;
      gap: 6px;
    }

    .tag {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;

      &.private {
        background: #fff3e0;
        color: #ff9800;
      }

      &.approval {
        background: #e6f7ff;
        color: #4080ff;
      }
    }
  }

  .item-info {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #86909c;

    .count {
      color: #86909c;
    }
  }

  .checked-icon {
    width: 20px;
    height: 20px;
    background: #4080ff;
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }
}

.group-detail-panel {
  .panel-header {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: #1d2129;
  }

  .detail-card {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 16px;
  }

  .detail-head {
    display: flex;
    align-items: center;
    gap: 14px;
    padding-bottom: 14px;
    margin-bottom: 14px;
    border-bottom: 1px solid #e5e6eb;

    .detail-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
    }

    .base-info {
      .group-name {
        margin: 0 0 4px;
        font-size: 16px;
        font-weight: 500;
        color: #1d2129;
      }

      .group-number {
        margin: 0 0 8px;
        font-size: 12px;
        color: #86909c;
      }

      .detail-tags {
        display: flex;
        gap: 8px;
      }

      .detail-tag {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;

        &.private {
          background: #fff3e0;
          color: #ff9800;
        }

        &.public {
          background: #e6f7ff;
          color: #4080ff;
        }

        &.approval {
          background: #e6f7ff;
          color: #4080ff;
        }
      }
    }
  }

  .detail-info-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .info-label {
        font-size: 11px;
        color: #86909c;
      }

      .info-value {
        font-size: 13px;
        color: #1d2129;
      }
    }
  }

  .announce-section {
    .announce-title {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 8px;
      color: #1d2129;
    }

    .announce-content {
      background: #fff;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 12px;
      color: #4e5969;
      line-height: 1.5;
      border: 1px solid #e5e6eb;
    }
  }
}

.search-guide {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  text-align: center;

  .guide-icon {
    font-size: 48px;
    color: #c9cdd4;
  }

  h4 {
    margin: 0 0 8px;
    font-size: 15px;
    color: #4e5969;
    font-weight: 500;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #86909c;
  }
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fff;

  .alert-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: #f8f9fa;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 12px;
    color: #86909c;

    .alert-icon {
      width: 16px;
      height: 16px;
      background: #86909c;
      color: #fff;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
    }
  }

  .action-row {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .btn {
    padding: 9px 22px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: background 0.2s;

    &.btn-cancel {
      background: #f2f3f5;
      color: #4e5969;

      &:hover {
        background: #e5e6eb;
      }
    }

    &.btn-confirm {
      background: #4080ff;
      color: #fff;

      &:hover {
        background: #3366ff;
      }

      &:disabled {
        background: #c7c7c7;
        cursor: not-allowed;
      }
    }
  }
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
  margin-right: 6px;
  vertical-align: middle;
}

.loading-spinner.small {
  width: 12px;
  height: 12px;
  border: 2px solid #e5e6eb;
  border-top-color: #4080ff;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
