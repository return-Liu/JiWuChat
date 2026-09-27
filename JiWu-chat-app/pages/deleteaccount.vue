<template>
  <div class="account-delete-container">
    <div class="delete-main">
      <div class="step-indicator">
        <div
          class="step-item"
          :class="{ active: currentStep >= 1, completed: currentStep > 1 }"
        >
          <div class="step-number">
            <CheckOutlined v-if="currentStep > 1" :style="{ fontSize: '16px' }" />
            <span v-else>1</span>
          </div>
          <div class="step-text">风险确认</div>
        </div>
        <div class="step-line" :class="{ active: currentStep >= 2 }"></div>
        <div
          class="step-item"
          :class="{ active: currentStep >= 2, completed: currentStep > 2 }"
        >
          <div class="step-number">
            <CheckOutlined v-if="currentStep > 2" :style="{ fontSize: '16px' }" />
            <span v-else>2</span>
          </div>
          <div class="step-text">身份验证</div>
        </div>
        <div class="step-line" :class="{ active: currentStep >= 3 }"></div>
        <div class="step-item" :class="{ active: currentStep >= 3 }">
          <div class="step-number">3</div>
          <div class="step-text">最终确认</div>
        </div>
      </div>

      <div class="step-content" v-if="currentStep === 1">
        <div class="risk-card">
          <h3 class="risk-title">重要提醒：账号注销不可逆</h3>
          <div class="risk-list-wrapper">
            <ul class="risk-list">
              <li>
                <span class="check-badge"
                  ><CheckOutlined :style="{ fontSize: '12px' }" /></span>
                账号注销后将永久无法恢复，所有数据会被彻底清除
              </li>
              <li>
                <span class="check-badge"
                  ><CheckOutlined :style="{ fontSize: '12px' }" /></span>
                你的个人资料、聊天记录、好友关系等信息将全部清空且无法找回
              </li>
              <li>
                <span class="check-badge"
                  ><CheckOutlined :style="{ fontSize: '12px' }" /></span>
                绑定的手机号、邮箱会解除关联，可重新注册但无法恢复原账号数据
              </li>
              <li>
                <span class="check-badge"
                  ><CheckOutlined :style="{ fontSize: '12px' }" /></span>
                第三方平台授权将全部失效，需重新授权才能继续使用相关服务
              </li>
              <li>
                <span class="check-badge"
                  ><CheckOutlined :style="{ fontSize: '12px' }" /></span>
                为保障你的账号安全，注销流程需完成身份验证+二次确认双重防护
              </li>
            </ul>
          </div>
          <label class="agree-checkbox">
            <input type="checkbox" v-model="agreedRisk" />
            <span
              >我已仔细阅读并完全理解上述风险提示，知晓注销后所有数据无法恢复，仍决定继续注销流程</span
            >
          </label>
          <div class="step-actions">
            <button class="btn btn-default" @click="handleCancel">
              返回账号管理
            </button>
            <button
              class="btn btn-danger"
              @click="goToStep2"
              :disabled="!agreedRisk"
            >
              已清楚风险，进入身份验证
            </button>
          </div>
        </div>
      </div>

      <div class="step-content" v-if="currentStep === 2">
        <div class="verify-card">
          <h3 class="verify-title">安全验证：确认是本人操作</h3>
          <p class="verify-desc">
            为保护你的账号安全，防止他人恶意操作，请输入你的登录密码完成身份验证
          </p>
          <div class="verify-form">
            <input
              type="password"
              v-model="passwordForm.currentPassword"
              placeholder="请输入你的登录密码"
              class="password-input"
              @keyup.enter="goToStep3"
            />
          </div>
          <div v-if="passwordError" class="password-error-msg">
            {{ passwordError }}
          </div>
          <div class="step-actions">
            <button class="btn btn-default" @click="goToStep1">
              返回风险确认
            </button>
            <button class="btn btn-primary" @click="goToStep3">
              验证密码，进入最终确认
            </button>
          </div>
        </div>
      </div>

      <div class="step-content" v-if="currentStep === 3">
        <div class="confirm-card">
          <h3 class="confirm-title">最后确认：永久注销账号</h3>
          <p class="confirm-warning">
            这是注销的最后一步！点击确认后，你的账号将被永久注销，所有数据彻底删除且无法恢复。请再次确认是否要执行此操作！
          </p>
          <div class="step-actions confirm-actions">
            <button class="btn btn-default" @click="goToStep2">
              返回密码验证
            </button>
            <button
              class="btn btn-danger"
              @click="performDeleteAccount"
              :disabled="deleting"
            >
              {{ deleting ? "正在处理注销请求..." : "确认永久注销账号" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { CheckOutlined } from "@ant-design/icons-vue";
import request from "../untils/request";
import { useUserStore } from "../stores/user";
import { useSiderColor } from "../stores/siderColor";
import { message } from "ant-design-vue";

const router = useRouter();
const userStore = useUserStore();
const siderColorStore = useSiderColor();

siderColorStore.initTheme();

const currentStep = ref(1);
const agreedRisk = ref(false);
const deleting = ref(false);
const passwordError = ref("");

const passwordForm = reactive({
  currentPassword: "",
});

const goToStep1 = () => {
  currentStep.value = 1;
  passwordError.value = "";
};

const goToStep2 = () => {
  if (!agreedRisk.value) {
    message.warning("请先确认已仔细阅读并理解所有风险提示");
    return;
  }
  currentStep.value = 2;
};

const goToStep3 = async () => {
  if (!passwordForm.currentPassword) {
    message.warning("请输入登录密码");
    return;
  }

  if (passwordForm.currentPassword.length < 6) {
    message.warning("密码长度至少6位");
    return;
  }

  try {
    const response = await request.post("/users/validate-password", {
      currentPassword: passwordForm.currentPassword,
    });
    currentStep.value = 3;
    passwordError.value = "";
    message.success(response.data?.message);
  } catch (error: any) {
    passwordError.value =
      error.response?.data?.data?.message || "密码验证失败，请检查密码是否正确";
    message.error(passwordError.value);
  }
};

const handleCancel = () => {
  router.push("/account");
};

const performDeleteAccount = async () => {
  try {
    deleting.value = true;
    const response = await request.delete("/users/delete-account", {
      data: { currentPassword: passwordForm.currentPassword },
    });
    message.success(response.data?.message || "账号已成功注销，感谢你的使用");
    userStore.logout();
    router.push("/login");
  } catch (error: any) {
    message.error(error.response?.data?.data?.message);
    deleting.value = false;
  }
};
</script>

<style scoped lang="scss">
.account-delete-container {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.delete-main {
  flex: 1;
  max-width: 560px;
  margin: 40px auto;
  padding: 0 16px;
  width: 100%;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;

  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #e5e5e5;
      color: #8e8e93;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 6px;
    }

    .step-text {
      font-size: 12px;
      color: #8e8e93;
    }

    &.active {
      .step-number {
        background: #ff3b30;
        color: #fff;
      }
      .step-text {
        color: #ff3b30;
      }
    }

    &.completed {
      .step-number {
        background: #28a745;
        color: #fff;
      }
      .step-text {
        color: #28a745;
      }
    }
  }

  .step-line {
    width: 60px;
    height: 2px;
    background: #e5e5e5;
    margin: 0 12px;

    &.active {
      background: #ff3b30;
    }
  }
}

.step-content {
  margin: 0 auto;
}

.risk-card,
.verify-card,
.confirm-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.risk-title,
.verify-title,
.confirm-title {
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0 0 16px;
  text-align: center;
}

.risk-list-wrapper {
  margin-bottom: 20px;
}

.risk-list {
  padding: 0;
  margin: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #666;
    line-height: 1.6;
    padding: 6px 0;
  }
}

.check-badge {
  width: 18px;
  height: 18px;
  background: #28a745;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}

.agree-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  margin-bottom: 20px;

  input {
    margin-top: 2px;
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  span {
    font-size: 12px;
    color: #666;
    line-height: 1.4;
  }
}

.verify-desc {
  font-size: 13px;
  color: #8e8e93;
  margin: 0 0 20px;
  text-align: center;
}

.verify-form {
  margin-bottom: 16px;
}

.password-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #007aff;
  }
}

.password-error-msg {
  color: #ff3b30;
  font-size: 12px;
  margin-bottom: 16px;
  text-align: left;
}

.confirm-warning {
  font-size: 13px;
  color: #ff3b30;
  margin: 0 0 24px;
  text-align: center;
  line-height: 1.5;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.confirm-actions {
  margin-top: 24px;
}

.btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;

  &.btn-default {
    background: #f5f5f5;
    color: #1a1a1a;

    &:hover {
      background: #e5e5e5;
    }
  }

  &.btn-primary {
    background: #007aff;
    color: #fff;

    &:hover {
      background: #005fc1;
    }
  }

  &.btn-danger {
    background: #ff3b30;
    color: #fff;

    &:hover {
      background: #d63026;
    }

    &:disabled {
      background: #c7c7c7;
      cursor: not-allowed;
    }
  }
}
</style>
