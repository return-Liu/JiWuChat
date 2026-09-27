<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="visible" class="level-detail-modal">
        <div class="modal-content">
          <!-- 顶部导航 -->
          <div class="modal-header">
            <button class="back-btn" @click="handleClose">返回</button>
            <span class="header-title">{{ groupName }}</span>
            <span class="header-placeholder"></span>
          </div>

          <!-- 内容区域 -->
          <div class="content-box">
            <!-- 用户信息卡片 -->
            <div class="user-card">
              <div class="user-card-inner">
                <div class="user-avatar-wrapper">
                  <img v-if="userAvatar" :src="userAvatar" alt="用户头像" class="user-avatar" />
                  <div v-else class="user-avatar-placeholder">
                    {{ userName?.charAt(0) || "U" }}
                  </div>
                  <div class="level-badge" :class="badgeClass">LV{{ displayLevel }}</div>
                </div>
                <div class="user-info-wrapper">
                  <div class="user-name">{{ userName || "未知用户" }}</div>
                  <div class="user-title">{{ levelName }}</div>
                  <div class="user-stats">
                    <span class="stat-item">{{ memberInfo.messageCount || 0 }} 条消息</span>
                    <span class="stat-divider">·</span>
                    <span class="stat-item">{{ displayLevel }}/100 级</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 进度区域 -->
            <div class="progress-section">
              <div class="progress-header">
                <div>
                  <div class="label">当前等级</div>
                  <div class="value">LV{{ displayLevel }}</div>
                </div>
                <div class="text-right">
                  <div class="label">下一级</div>
                  <div class="value">LV{{ Math.min(displayLevel + 1, 100) }}</div>
                </div>
              </div>

              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{
                    width: progressPercentage + '%',
                    background: progressPercentage >= 100 ? '#52c41a' : '#1677ff',
                  }"
                ></div>
              </div>

              <div class="progress-info-grid">
                <div>
                  <div class="label">已发言</div>
                  <div class="value">{{ memberInfo.messageCount || 0 }}</div>
                </div>
                <div>
                  <div class="label">距下一级</div>
                  <div class="value">{{ messagesToNextLevel }}</div>
                </div>
                <div>
                  <div class="label">升级进度</div>
                  <div class="value">{{ progressPercentage }}%</div>
                </div>
              </div>
            </div>

            <!-- 统计数据卡片 -->
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">{{ memberInfo.messageCount || 0 }}</div>
                <div class="stat-label">累计发言</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">{{ messagesToNextLevel }}</div>
                <div class="stat-label">距下一级还需</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">{{ getLevelTitle(displayLevel) }}</div>
                <div class="stat-label">当前称号</div>
              </div>
            </div>

            <!-- 特权列表 -->
            <div class="privileges-section">
              <div class="section-title">等级特权</div>
              <div class="privileges-grid">
                <div
                  v-for="(privilege, index) in privileges"
                  :key="index"
                  class="privilege-item"
                  :style="privilege.style"
                >
                  <i :class="privilege.icon" class="privilege-iconfont"></i>
                  <span class="privilege-name">{{ privilege.name }}</span>
                  <span class="privilege-desc">{{ privilege.desc }}</span>
                </div>
              </div>
            </div>

            <!-- 规则说明 -->
            <div class="rules-section">
              <div class="section-title">等级规则</div>
              <div class="rules-list">
                <div class="rule-item">· 等级根据发言数提升，每级所需消息数固定</div>
                <div class="rule-item">· 1～10级升级较快，快速体验成长乐趣</div>
                <div class="rule-item">· 100级为满级，为群内最高荣誉</div>
                <div class="rule-item">· 提升等级可解锁专属头衔、展示标识与群权限</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Contact } from "../types/chatTypes";
import request from "../untils/request";
import { getLevelTitle } from "../untils/levelUtils";
import { useGroupLevelBadgeStore } from "../stores/groupLevelBadge";
import { useUserStore } from "../stores/user";

interface Props {
  visible: boolean;
  userId: string;
  groupId: string;
  currentLevel: number;
  activityPoints: number;
  contact?: any;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  userId: "",
  groupId: "",
  currentLevel: 1,
  activityPoints: 0,
  contact: undefined,
});

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
}>();

const badgeStore = useGroupLevelBadgeStore();
const userStore = useUserStore();

// ======================
// 分段等级配置（1~100级）
// ======================
const LEVEL_MESSAGE_REQUIREMENTS = [
  0, 3, 8, 15, 25, 40, 60, 85, 115, 150, 190, 235, 285, 340, 400, 465, 535, 610, 690, 775, 870, 970,
  1080, 1200, 1330, 1470, 1620, 1780, 1950, 2130, 2330, 2540, 2760, 2990, 3230, 3480, 3740, 4010,
  4290, 4580, 4900, 5230, 5570, 5920, 6280, 6650, 7030, 7420, 7820, 8230, 8670, 9120, 9580, 10050,
  10530, 11020, 11520, 12030, 12550, 13080, 13650, 14230, 14820, 15420, 16030, 16650, 17280, 17920,
  18570, 19230, 19930, 20640, 21360, 22090, 22830, 23580, 24340, 25110, 25890, 26680, 27520, 28370,
  29230, 30100, 30980, 31870, 32770, 33680, 34600, 35530, 36530, 37540, 38560, 39590, 40630, 41680,
  42800, 43930, 45070, 50000,
];

// 等级特权配置 - 使用更自然的纯色背景
const privileges = [
  {
    icon: "iconfont icon-zhuanshuhuizhang",
    name: "专属徽章",
    desc: "解锁等级专属徽章",
    style: {
      background: "#e8f4fd",
      color: "#1677ff",
      border: "1px solid #bae0ff",
    },
  },
  {
    icon: "iconfont icon-huangguan",
    name: "个性头衔",
    desc: "自定义炫酷头衔",
    style: {
      background: "#fef3e8",
      color: "#fa8c16",
      border: "1px solid #ffd9b3",
    },
  },
  {
    icon: "iconfont icon-navicon-hdbk",
    name: "互动标识",
    desc: "点亮互动标识",
    style: {
      background: "#ecfdf3",
      color: "#52c41a",
      border: "1px solid #b7eb8f",
    },
  },
  {
    icon: "iconfont icon-quanxianguanli",
    name: "专属权限",
    desc: "解锁高级权限",
    style: {
      background: "#f5f0ff",
      color: "#722ed1",
      border: "1px solid #d3adf7",
    },
  },
];

/**
 * 根据消息数量计算群聊等级
 */
const calculateChatLevel = (messageCount: number): number => {
  const count = Math.max(0, Math.floor(Number(messageCount) || 0));

  let level = 1;
  for (let i = LEVEL_MESSAGE_REQUIREMENTS.length - 1; i >= 0; i--) {
    if (count >= LEVEL_MESSAGE_REQUIREMENTS[i]) {
      level = i + 1;
      break;
    }
  }

  return Math.min(100, level);
};

const memberInfo = ref({
  messageCount: 0,
  groupTitle: "",
  chatLevel: 1,
  role: "member",
});
const loading = ref(false);
const groupName = ref("");
const userName = ref("");

const fetchMemberInfo = async () => {
  if (!props.userId || !props.groupId) {
    console.warn("缺少 userId 或 groupId");
    return;
  }

  try {
    loading.value = true;

    const groupResponse = await request.get(`/group/${props.groupId}`);
    const members = groupResponse.data?.members || [];
    const member = members.find((m: any) => String(m.id) === String(props.userId));

    if (member) {
      // 🔥 优先使用后端返回的 chatLevel，如果后端没返回则用 messageCount 计算
      const backendChatLevel = member.chatLevel;
      const calculatedLevel = calculateChatLevel(member.messageCount || 0);
      // 后端返回的 chatLevel 可信度更高（它是发送消息时实时计算的）
      const finalLevel =
        backendChatLevel != null && backendChatLevel > 0 ? backendChatLevel : calculatedLevel;

      memberInfo.value = {
        messageCount: member.messageCount || 0,
        groupTitle: member.groupTitle || "",
        chatLevel: finalLevel,
        role: member.role || "member",
      };
      userName.value = member.name || member.nickname || "未知用户";
    } else {
      // 成员不在列表中，尝试用 props 传入的数据
      memberInfo.value = {
        messageCount: props.activityPoints || 0,
        groupTitle: "",
        chatLevel: props.currentLevel || 1,
        role: "member",
      };
      userName.value = "未知用户";
    }
    groupName.value = groupResponse.data?.name || "未知群组";
  } catch (error) {
    console.error("获取群组成员信息失败:", error);
    memberInfo.value = {
      messageCount: props.activityPoints || 0,
      groupTitle: "",
      chatLevel: props.currentLevel || 1,
      role: "member",
    };
  } finally {
    loading.value = false;
  }
};

// 监听 visible 变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      fetchMemberInfo();
    }
  },
  { immediate: true },
);

const displayLevel = computed(() => {
  const level = memberInfo.value.chatLevel || props.currentLevel || 1;
  return Math.min(level, 100);
});

const messagesToNextLevel = computed(() => {
  const level = displayLevel.value;
  if (level >= 100) return 0;

  const currentRequired = LEVEL_MESSAGE_REQUIREMENTS[level - 1] || 0;
  const nextRequired = LEVEL_MESSAGE_REQUIREMENTS[level] || 0;
  const currentMessages = memberInfo.value.messageCount || 0;
  const remaining = Math.max(0, nextRequired - currentMessages);

  return remaining;
});

const levelName = computed(() => {
  const level = displayLevel.value;
  const role = memberInfo.value.role;
  const customTitle = memberInfo.value.groupTitle;

  if (customTitle) return `LV${level} ${customTitle}`;
  if (role === "owner") return `LV${level} 群主`;
  if (role === "admin") return `LV${level} 管理员`;
  const defaultTitle = getLevelTitle(level);
  return `LV${level} ${defaultTitle}`;
});

const badgeClass = computed(() => {
  const level = displayLevel.value;
  const role = memberInfo.value.role;
  const customTitle = memberInfo.value.groupTitle;

  let titleType = "default";
  if (role === "owner") titleType = "owner";
  else if (role === "admin") titleType = "admin";
  else if (customTitle) titleType = "custom";
  return badgeStore.getLevelBadgeClass(level, role, titleType);
});

const userAvatar = computed(() => {
  if (userStore.userAvatar) return userStore.userAvatar;
  if (props.contact && !props.contact.isGroup) return props.contact.avatar || "";
  if (props.contact?.isGroup && props.contact?.groupMembers) {
    const member = props.contact.groupMembers.find(
      (m: any) => String(m.id) === String(props.userId),
    );
    return member?.avatar || "";
  }
  return "";
});

const handleClose = () => emit("update:visible", false);

const progressPercentage = computed(() => {
  const level = displayLevel.value;
  if (level >= 100) return 100;

  const curr = LEVEL_MESSAGE_REQUIREMENTS[level - 1] || 0;
  const next = LEVEL_MESSAGE_REQUIREMENTS[level] || 0;
  const currentMessages = memberInfo.value.messageCount || 0;

  if (currentMessages >= next) return 100;
  if (currentMessages < curr) return 0;

  const range = next - curr;
  if (range <= 0) return 0;

  const progress = ((currentMessages - curr) / range) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
});
</script>

<style lang="scss" scoped>
.level-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #f5f5f5;
  z-index: 9999;
  overflow: hidden;
}

.modal-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

/* 顶部导航 */
.modal-header {
  height: 56px;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;

  .back-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    font-size: 15px;
    color: #1677ff;
    transition: background 0.2s;

    &:hover {
      background: #f5f5f5;
    }
  }

  .header-title {
    font-size: 17px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .header-placeholder {
    width: 44px;
  }
}

/* 内容区域 */
.content-box {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 用户卡片 */
.user-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;

  .user-card-inner {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .user-avatar-wrapper {
    position: relative;
    flex-shrink: 0;

    .user-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .user-avatar-placeholder {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #1677ff;
      color: #ffffff;
      font-size: 24px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .level-badge {
      position: absolute;
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%);
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      background: #1677ff;
      border: 2px solid #ffffff;
    }
  }

  .user-info-wrapper {
    flex: 1;
    min-width: 0;

    .user-name {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 2px;
    }

    .user-title {
      font-size: 13px;
      color: #8c8c8c;
      margin-bottom: 6px;
    }

    .user-stats {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #8c8c8c;

      .stat-divider {
        color: #d9d9d9;
      }
    }
  }
}

/* 进度区域 */
.progress-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;

  .progress-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;

    .label {
      font-size: 12px;
      color: #8c8c8c;
    }

    .value {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      margin-top: 2px;
    }

    .text-right {
      text-align: right;
    }
  }

  .progress-track {
    height: 6px;
    background: #f0f0f0;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 16px;

    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.6s ease;
    }
  }

  .progress-info-grid {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;

    > div {
      text-align: center;
    }

    .label {
      font-size: 12px;
      color: #8c8c8c;
    }

    .value {
      font-size: 18px;
      font-weight: 600;
      color: #1677ff;
      margin-top: 2px;
    }
  }
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;

  .stat-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 16px;
    text-align: center;

    .stat-number {
      font-size: 22px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #8c8c8c;
    }
  }
}

/* 特权区域 */
.privileges-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 12px;
  }

  .privileges-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;

    .privilege-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px 12px;
      border-radius: 12px;
      text-align: center;
      transition: all 0.3s ease;
      cursor: default;
      min-height: 90px;
      position: relative;

      .privilege-iconfont {
        font-size: 28px;
        margin-bottom: 6px;
        display: block;
      }

      .privilege-name {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 2px;
      }

      .privilege-desc {
        font-size: 11px;
        opacity: 0.75;
      }
    }
  }
}

/* 规则区域 */
.rules-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 12px;
  }

  .rules-list {
    .rule-item {
      font-size: 13px;
      color: #595959;
      line-height: 1.8;
      padding: 4px 0;
    }
  }
}

/* 动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: translateY(20px);
}
</style>
