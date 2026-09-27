<template>
  <div class="modern-old-version-content">
    <!-- 加载状态 -->
    <div class="loading-container" v-if="loading">
      <a-skeleton :rows="8" animated />
    </div>

    <div v-if="!loading && userInfo" class="modern-content-wrapper">
      <!-- 个人信息卡片 -->
      <div class="modern-card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="iconfont icon-yonghutianchong"></i>
            个人信息
          </h3>
        </div>
        <div class="card-content">
          <div class="detail-grid">
            <div
              class="detail-item"
              v-for="(item, index) in profileTableData"
              :key="'profile-' + index"
            >
              <span class="detail-label">{{ item.label }}:</span>
              <span class="detail-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 联系方式卡片 -->
      <div class="modern-card">
        <div class="card-header">
          <h3 class="card-title">
            <InfoCircleOutlined /> 联系方式
          </h3>
        </div>
        <div class="card-content">
          <div class="detail-grid">
            <div
              class="detail-item"
              v-for="(item, index) in contactTableData"
              :key="'contact-' + index"
            >
              <span class="detail-label">{{ item.label }}:</span>
              <span class="detail-value">
                {{ item.value }}
                <span v-if="item.operate" class="link-text" @click="handleOperation('phone')">
                  {{ item.operateText }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 账号安全卡片 -->
      <div class="modern-card">
        <div class="card-header">
          <h3 class="card-title">
            <LockOutlined /> 账号安全
          </h3>
        </div>
        <div class="card-content">
          <div class="detail-grid">
            <div
              class="detail-item"
              v-for="(item, index) in securityTableData"
              :key="'security-' + index"
            >
              <span class="detail-label">{{ item.label }}:</span>
              <span class="detail-value">
                {{ item.value }}
                <span v-if="item.operate" class="link-text" @click="item.handleClick">
                  {{ item.btnText }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUserStore } from "../stores/user";
import { UserOutlined, InfoCircleOutlined, LockOutlined } from "@ant-design/icons-vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";

// 接收 props
interface Props {
  loading: boolean;
}

const props = defineProps<Props>();

// 使用 emit 触发父组件事件
const emit = defineEmits<{
  addPhone: [];
}>();

const router = useRouter();
const userStore = useUserStore();

// 用户信息与加载状态
const userInfo = computed(() => userStore.user);

// 格式化时间
const formatDate = (dateStr: string) => {
  if (!dateStr) return "未设置";
  const date = new Date(dateStr);
  return isNaN(date.getTime())
    ? dateStr
    : date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
};

// 跳转方法
const resetpassword = () => {
  router.push("/forgot-password");
};

const addphone = () => {
  if (userStore.user?.phone) {
    message.info("你已经添加过手机号了 无需添加");
    return;
  }
  emit("addPhone");
};

// 处理操作
const handleOperation = (type: string) => {
  switch (type) {
    case "phone":
      addphone();
      break;
    default:
      break;
  }
};

// 性别转换
const getGenderText = (gender: number | undefined) => {
  if (gender === undefined) return "未设置";
  return ["男", "女", "保密"][gender] || "未知";
};

// 个人信息表格数据
const profileTableData = computed(() => {
  const user = userInfo.value;
  return [
    { label: "用户名", value: user?.nickname || "未命名用户" },
    { label: "账号", value: user?.username || "未知账号" },
    { label: "个性签名", value: user?.bio || "这个人很懒，什么都没留下~" },
    { label: "性别", value: getGenderText(user?.gender) },
    { label: "年龄", value: user?.age ? `${user.age}岁` : "未设置" },
    {
      label: "生日",
      value: user?.birthday ? formatDate(user.birthday) : "未设置",
    },
    { label: "星座", value: user?.constellation || "未设置" },
    { label: "故乡", value: user?.hometown || "未设置" },
  ];
});

// 联系方式表格数据
const contactTableData = computed(() => {
  const user = userInfo.value;
  return [
    {
      label: "手机号",
      value: user?.phone || "未绑定",
      operate: !user?.phone,
      operateText: "立即绑定",
    },
    { label: "邮箱", value: user?.email || "未设置" },
  ];
});

// 安全信息表格数据
const securityTableData = computed(() => {
  const user = userInfo.value;
  return [
    {
      label: "密码修改",
      value: `上次修改：${
        user &&
        "passwordUpdateTime" in user &&
        user.passwordUpdateTime &&
        typeof user.passwordUpdateTime === "string"
          ? formatDate(user.passwordUpdateTime)
          : "从未修改"
      }`,
      operate: true,
      btnText: "修改密码",
      handleClick: resetpassword,
    },
  ];
});
</script>

<style scoped lang="scss">
.modern-old-version-content {
  width: 100%;

  .modern-content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  // 现代化卡片样式
  .modern-card {
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    border: 1px solid #e5e7eb;

    .card-header {
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      background-color: #f8f9fa;
      color: #495057;

      .card-title {
        font-size: 14px;
        font-weight: 600;
        color: #495057;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .card-content {
      padding: 16px;

      .detail-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .detail-label {
            font-weight: 600;
            color: #374151;
            min-width: 100px;
            text-align: left;
          }

          .detail-value {
            flex: 1;
            text-align: right;
            color: #6b7280;
            word-break: break-word;
            padding-left: 16px;

            .link-text {
              color: #007bff;
              cursor: pointer;
              font-weight: 500;
              text-decoration: underline;
              margin-left: 4px;

              &:hover {
                opacity: 0.8;
              }
            }
          }
        }
      }
    }
  }

  .loading-container {
    padding: 16px;
    background-color: #ffffff;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
}
</style>
