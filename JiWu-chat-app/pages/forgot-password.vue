<template>
  <div
    :class="['forgot-password-container', { 'electron-mode': isElectronEnv }]"
    @keyup.enter="handleVerifySubmit"
  >
    <!-- ===== 桌面端：QQ 式简洁找回密码 ===== -->
    <div v-if="isElectronEnv" class="electron-forgot">
      <div class="electron-brand">
        <img src="../public/logo.png" alt="" class="electron-logo" />
        <h1 class="electron-title">找回密码</h1>
      </div>

      <!-- 步骤 0：验证邮箱 -->
      <template v-if="activeStep === 0">
        <div class="electron-field">
          <input
            v-model="verifyForm.email"
            type="email"
            class="electron-input"
            placeholder="注册邮箱"
            :disabled="loading"
            @blur="validateEmailFormat"
          />
        </div>

        <div v-if="isEmailValid && verifyForm.email.trim() !== ''" class="electron-field">
          <input
            v-model="verifyForm.verificationCode"
            type="text"
            class="electron-input"
            placeholder="6位验证码"
            maxlength="6"
            :disabled="loading"
          />
          <span
            class="electron-code-btn"
            :class="{ disabled: verificationBtnDisabled || loading }"
            @click="handleSendCodeClick(true)"
          >
            {{ verificationBtnText }}
          </span>
        </div>

        <button class="electron-submit-btn" :disabled="loading" @click="handleVerifySubmit">
          验证并继续
        </button>
      </template>

      <!-- 步骤 1：重置密码 -->
      <template v-else-if="activeStep === 1">
        <div class="electron-field">
          <input
            v-model="resetForm.newPassword"
            type="password"
            class="electron-input"
            placeholder="新密码"
            :disabled="loading"
          />
        </div>

        <div class="electron-field">
          <input
            v-model="resetForm.confirmPassword"
            type="password"
            class="electron-input"
            placeholder="确认新密码"
            :disabled="loading"
          />
        </div>

        <button class="electron-submit-btn" :disabled="loading" @click="handleResetSubmit">
          确认重置密码
        </button>
      </template>

      <!-- 步骤 2：成功 -->
      <template v-else-if="activeStep === 2">
        <div class="electron-success">
          <i class="iconfont icon-duihao electron-success-icon"></i>
          <p class="electron-success-title">密码重置成功</p>
          <p class="electron-success-sub">请使用新密码登录</p>
          <button class="electron-submit-btn" @click="goToLogin">返回登录</button>
        </div>
      </template>

      <div v-if="activeStep !== 2" class="electron-links">
        <span class="electron-link" @click="goToLogin">已记得密码？前往登录</span>
      </div>
    </div>

    <!-- ===== Web 端：保持原有布局 ===== -->
    <div v-else class="forgot-password-wrapper">
      <div class="forgot-password-header">
        <h2>找回密码</h2>
      </div>

      <div v-if="activeStep === 0" class="step-content">
        <a-form
          :model="verifyForm"
          :rules="verifyRules"
          ref="verifyFormRef"
          class="forgot-password-form"
          @submit.prevent
        >
          <a-form-item prop="email">
            <a-input
              v-model="verifyForm.email"
              placeholder="请输入您的注册邮箱"
              :prefix-icon="Message"
              size="large"
              class="input-item"
              :disabled="loading"
            />
          </a-form-item>

          <a-form-item
            v-if="isEmailValid && verifyForm.email.trim() !== ''"
            prop="verificationCode"
          >
            <a-input
              v-model="verifyForm.verificationCode"
              placeholder="请输入6位验证码"
              :prefix-icon="Key"
              size="large"
              class="input-item"
              :disabled="loading"
            >
              <template #suffix>
                <span
                  @click="handleSendCodeClick(true)"
                  :class="['verification-text', { disabled: verificationBtnDisabled || loading }]"
                >
                  {{ verificationBtnText }}
                </span>
              </template>
            </a-input>
          </a-form-item>

          <a-form-item>
            <a-button
              type="primary"
              @click="handleVerifySubmit"
              class="submit-btn"
              :loading="loading"
              size="large"
              block
            >
              验证并继续
            </a-button>
          </a-form-item>
        </a-form>
      </div>

      <div v-if="activeStep === 1" class="step-content">
        <a-form
          :model="resetForm"
          :rules="resetRules"
          ref="resetFormRef"
          class="forgot-password-form"
          @submit.prevent
        >
          <a-form-item prop="newPassword">
            <a-input
              v-model="resetForm.newPassword"
              type="password"
              placeholder="请设置新密码"
              :prefix-icon="Lock"
              size="large"
              show-password
              class="input-item"
              :disabled="loading"
            />
          </a-form-item>

          <a-form-item prop="confirmPassword">
            <a-input
              v-model="resetForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              :prefix-icon="Lock"
              size="large"
              show-password
              class="input-item"
              :disabled="loading"
            />
          </a-form-item>

          <a-form-item>
            <a-button
              type="primary"
              @click="handleResetSubmit"
              class="submit-btn"
              :loading="loading"
              size="large"
              block
            >
              确认重置密码
            </a-button>
          </a-form-item>
        </a-form>
      </div>

      <div v-if="activeStep === 2" class="step-content success-content">
        <a-result status="success" title="密码重置成功" sub-title="请使用新密码登录">
          <template #extra>
            <a-button type="primary" @click="goToLogin" size="large"> 返回登录 </a-button>
          </template>
        </a-result>
      </div>

      <p class="login-link" v-if="activeStep !== 2">
        已记得密码？
        <a-button type="link" @click="goToLogin" :disabled="loading"> 前往登录 </a-button>
      </p>
    </div>

    <GeetestVerification
      riskType="puzzle"
      ref="geetestCaptchaRef"
      @verified="handleSendEmailCodeAfterVerification"
      @error="handleGeetestError"
      @loaded="handleGeetestLoaded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, toRef } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { LockOutlined, MessageOutlined, KeyOutlined } from "@ant-design/icons-vue";
import request from "../untils/request";
import { useEmailVerification } from "../composables/useEmailVerification";
import { isElectron } from "../untils/electronHelper";

const router = useRouter();

const isElectronEnv = ref(false);

const activeStep = ref(0);

const verifyForm = ref({
  email: "",
  verificationCode: "",
});
const verifyFormRef = ref();
const resetForm = ref({
  newPassword: "",
  confirmPassword: "",
});
const resetFormRef = ref();
const loading = ref(false);
const geetestCaptchaRef = ref();
const emailRef = toRef(verifyForm.value, "email");

onMounted(() => {
  isElectronEnv.value = isElectron();

  // 在 Electron 环境中调整窗口尺寸
  if (isElectronEnv.value && window.electronAPI?.resizeWindow) {
    window.electronAPI.resizeWindow("forgot-password");
  }
});

const {
  isEmailValid,
  verificationBtnText,
  verificationBtnDisabled,
  validateEmailFormat,
  loadGeetestSDK,
  handleSendEmailCodeAfterVerification,
  handleSendCodeClick,
  handleGeetestError,
  handleGeetestLoaded,
} = useEmailVerification({
  request,
  geetestCaptchaRef,
  email: emailRef,
});

watch(
  () => verifyForm.value.email,
  (newVal) => {
    isEmailValid.value = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newVal);
  },
  { immediate: true },
);

const verifyRules = {
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  verificationCode: [
    { required: true, message: "请输入验证码", trigger: "blur" },
    { pattern: /^\d{6}$/, message: "验证码为6位数字", trigger: "blur" },
  ],
};

const resetRules = {
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 8, message: "密码至少8位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== resetForm.value.newPassword) {
          callback(new Error("两次输入密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

const handleVerifySubmit = async () => {
  const valid = await verifyFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const respnse = await request.post("/auth/verify-reset-code", verifyForm.value);
    message.success(respnse.data.message);
    activeStep.value = 1;
  } catch (err: any) {
    message.error(err.response?.data?.data?.message || "验证失败");
  } finally {
    loading.value = false;
  }
};

const handleResetSubmit = async () => {
  const valid = await resetFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const response = await request.post("/auth/reset-password", {
      ...verifyForm.value,
      newPassword: resetForm.value.newPassword,
    });
    message.success(response.data.data.message);
    activeStep.value = 2;
  } catch (err: any) {
    message.error(err.response?.data?.data?.message || "重置失败");
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => router.push("/login");
</script>

<style scoped lang="scss">
/* ===== 桌面端：极物聊天品牌找回密码 ===== */
.electron-forgot {
  --brand-900: #4c1d95;
  --brand-700: #6d28d9;
  --brand-500: #8b5cf6;
  --brand-400: #a78bfa;
  --brand-100: #ede9fe;
  --brand-50: #f5f3ff;
  --ink-900: #2e1065;
  --ink-700: #3b2f63;
  --ink-500: #6b5b95;
  --ink-300: #a99ccb;

  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 26px 34px 20px;
  box-sizing: border-box;
  background: #ffffff;
  overflow-y: auto;
}

.electron-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 26px;

  .electron-logo {
    width: 52px;
    height: 52px;
    object-fit: contain;
    border-radius: 14px;
    margin-bottom: 12px;
    box-shadow: 0 6px 18px rgba(109, 40, 217, 0.16);
  }

  .electron-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--ink-900);
    margin: 0;
    letter-spacing: 1px;
  }
}

.electron-field {
  width: 100%;
  height: 42px;
  display: flex;
  align-items: center;
  border: 1px solid #e4dcf7;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.85);
  margin-bottom: 14px;
  padding: 0 16px;
  box-sizing: border-box;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--brand-400);
  }

  &:focus-within {
    border-color: var(--brand-700);
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.12);
  }

  .electron-input {
    flex: 1;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    color: var(--ink-700);
    text-align: center;

    &::placeholder {
      color: var(--ink-300);
      text-align: center;
    }
  }

  .electron-code-btn {
    margin-left: 8px;
    font-size: 13px;
    color: var(--brand-700);
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: color 0.2s ease;

    &:hover:not(.disabled) {
      color: var(--brand-900);
    }

    &.disabled {
      color: var(--ink-300);
      cursor: not-allowed;
    }
  }
}

.electron-submit-btn {
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--brand-500) 0%, #6366f1 100%);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 6px;
  letter-spacing: 2px;
  box-shadow: 0 6px 18px rgba(109, 40, 217, 0.28);
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    box-shadow: 0 8px 24px rgba(109, 40, 217, 0.38);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.electron-links {
  display: flex;
  align-items: center;
  margin-top: 18px;

  .electron-link {
    font-size: 13px;
    color: var(--brand-700);
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: var(--brand-900);
    }
  }
}

.electron-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;

  .electron-success-icon {
    font-size: 56px;
    color: #22c55e;
    margin-bottom: 16px;
  }

  .electron-success-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--ink-900);
    margin: 0 0 6px 0;
  }

  .electron-success-sub {
    font-size: 13px;
    color: var(--ink-500);
    margin: 0 0 20px 0;
  }
}

.forgot-password-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0 20px;
  background: #ffffff;
  flex-direction: column;
  overflow: auto;

  &.electron-mode {
    padding: 0;
    background: transparent;
    align-items: flex-start;
    justify-content: flex-start;

    .forgot-password-wrapper {
      margin-top: 40px;
    }
  }
}

.forgot-password-wrapper {
  width: 400px;
  padding: 40px;
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #eee;
  box-sizing: border-box;
  margin-top: 40px;

  &.electron-card {
    width: 100%;
    max-width: 100%;
    padding: 30px;
    background: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
    margin-top: 0;
  }
}

.forgot-password-header {
  text-align: center;
  margin-bottom: 24px;
  h2 {
    font-size: 26px;
    font-weight: 700;
    color: #1677ff;
    margin: 0 0 6px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    .header-logo {
      width: 32px;
      height: 32px;
      object-fit: contain;
      border-radius: 6px;
    }
  }
}

.step-content {
  margin-bottom: 16px;
}

.forgot-password-form {
  :deep(.ant-form-item) {
    margin-bottom: 20px;
  }
  :deep(.ant-input) {
    height: 46px;
    border-radius: 12px;
    border: 1px solid #e5e6eb;
    background: #fff;
    box-shadow: none;
  }
  :deep(.ant-input:focus) {
    border-color: #1677ff;
    box-shadow: none;
  }
  .verification-text {
    font-size: 14px;
    color: #1677ff;
    font-weight: 500;
    cursor: pointer;
  }
  .verification-text.disabled {
    color: #a8abb2;
    cursor: not-allowed;
  }
  .submit-btn {
    width: 100%;
    height: 46px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    background: #1677ff;
    border: none;
    box-shadow: none;
  }
}

.login-link {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
  text-align: center;
  :deep(.ant-btn-link) {
    color: #1677ff !important;
    padding: 0;
    font-weight: 500;
  }
}

.success-content {
  text-align: center;
}

// 响应式设计
@media (max-width: 768px) {
  .forgot-password-wrapper {
    width: 90%;
    padding: 30px 20px;
  }
}
</style>
