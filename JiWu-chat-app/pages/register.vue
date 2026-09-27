<template>
  <div :class="['register-container', { 'electron-mode': isElectronEnv }]">
    <!-- ===== 桌面端：QQ 式简洁注册框 ===== -->
    <div v-if="isElectronEnv" class="electron-register">
      <div class="electron-brand">
        <img src="../public/jiwuchat-elctron.png" alt="" class="electron-logo" />
        <h1 class="electron-title">注册账号</h1>
        <p class="electron-subtitle">加入极物聊天，开始你的即时通讯体验</p>
      </div>

      <div class="electron-field">
        <input
          v-model="registerForm.nickname"
          type="text"
          class="electron-input"
          placeholder="请输入你的昵称"
          @keyup.enter="handleRegister"
        />
      </div>

      <div class="electron-field">
        <input
          v-model="registerForm.email"
          type="email"
          class="electron-input"
          placeholder="请输入你的邮箱地址"
          @blur="validateEmailFormat"
          @input="handleEmailInput"
          @keyup.enter="handleRegister"
        />
      </div>

      <div v-if="isEmailValid && registerForm.email.trim() !== ''" class="electron-field">
        <input
          v-model="registerForm.verificationCode"
          type="text"
          class="electron-input"
          placeholder="请输入6位邮箱验证码"
          maxlength="6"
          @keyup.enter="handleRegister"
        />
        <span
          class="electron-code-btn"
          :class="{ disabled: verificationBtnDisabled || !isEmailValid }"
          @click="handleSendCodeClick()"
        >
          {{ verificationBtnText }}
        </span>
      </div>

      <div class="electron-field">
        <input
          v-model="registerForm.password"
          type="password"
          class="electron-input"
          placeholder="请输入密码（8位以上，含字母和数字）"
          @keyup.enter="handleRegister"
        />
      </div>

      <div class="electron-field">
        <input
          v-model="registerForm.confirmPassword"
          type="password"
          class="electron-input"
          placeholder="请确认密码"
          @keyup.enter="handleRegister"
        />
      </div>

      <button class="electron-register-btn" :disabled="loading" @click="handleRegister">
        <span v-if="!loading">注册</span>
        <span v-else>注册中...</span>
      </button>

      <!-- 服务协议 -->
      <label class="electron-agreement">
        <input v-model="agreedToTerms" type="checkbox" />
        <span class="electron-agreement-text">
          已阅读并同意
          <a class="electron-agreement-link" @click.prevent="openAgreement('service')">服务协议</a>
          和
          <a class="electron-agreement-link" @click.prevent="openAgreement('privacy')"
            >极物聊天保护指引</a
          >
        </span>
      </label>

      <div class="electron-links">
        <span class="electron-link" @click="router.push('/login')">已有账号？立即登录</span>
      </div>
    </div>

    <!-- ===== Web 端：保持原有布局 ===== -->
    <div v-else :class="['register-wrapper']">
      <div class="register-header">
        <div class="header-icon-wrapper">
          <h2>注册账号</h2>
        </div>
        <p>加入极物聊天，开始你的即时通讯体验</p>
      </div>

      <div class="register-form">
        <div class="form-item">
          <a-input
            v-model:value="registerForm.nickname"
            placeholder="请输入你的昵称"
            size="large"
            class="input-item"
            @pressEnter="handleRegister"
            allow-clear
          />
        </div>

        <div class="form-item">
          <a-input
            v-model:value="registerForm.email"
            placeholder="请输入你的邮箱地址"
            size="large"
            class="input-item"
            @blur="validateEmailFormat"
            @input="handleEmailInput"
            @pressEnter="handleRegister"
            allow-clear
          />
        </div>

        <div
          v-if="isEmailValid && registerForm.email.trim() !== ''"
          class="form-item verification-item"
        >
          <div class="verification-input-wrapper">
            <a-input
              v-model:value="registerForm.verificationCode"
              placeholder="请输入6位邮箱验证码"
              size="large"
              class="input-item verification-input"
              @pressEnter="handleRegister"
              allow-clear
            >
              <template #suffix>
                <span
                  @click="handleSendCodeClick()"
                  :class="[
                    'verification-text',
                    { disabled: verificationBtnDisabled || !isEmailValid },
                  ]"
                >
                  {{ verificationBtnText }}
                </span>
              </template>
            </a-input>
          </div>
        </div>

        <div class="form-item">
          <a-input-password
            v-model:value="registerForm.password"
            placeholder="请设置密码（8位以上，含字母和数字）"
            size="large"
            class="input-item"
            @pressEnter="handleRegister"
            allow-clear
          />
        </div>

        <div class="form-item">
          <a-input-password
            v-model:value="registerForm.confirmPassword"
            placeholder="请再次输入密码"
            size="large"
            class="input-item"
            @pressEnter="handleRegister"
            allow-clear
          />
        </div>

        <div class="form-item register-btn-item">
          <a-button
            type="primary"
            @click="handleRegister"
            class="register-btn"
            :loading="loading"
            size="large"
            block
          >
            <span v-if="!loading">注册</span>
            <span v-else>注册中...</span>
          </a-button>
        </div>

        <p class="login-link">
          已有账号？<span class="login-link-btn" @click="$router.push('/login')">立即登录</span>
        </p>
      </div>
    </div>

    <GeetestVerification
      riskType="puzzle"
      ref="geetestCaptchaRef"
      @verified="handleSendEmailCodeAfterVerification"
      @error="handleCaptchaError"
      @loaded="handleCaptchaLoaded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, toRef, onUnmounted, onMounted } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import request from "../untils/request";
import { useUserStore } from "../stores/user";
import { useEmailVerification } from "../composables/useEmailVerification";
import { websocketService } from "../untils/websocket";
import { isElectron } from "../untils/electronHelper";

const router = useRouter();
const userStore = useUserStore();
const isElectronEnv = ref(false);

onMounted(() => {
  isElectronEnv.value = isElectron();

  if (isElectronEnv.value && window.electronAPI?.resizeWindow) {
    window.electronAPI.resizeWindow("register");
  }
});

interface RegisterForm {
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
  verificationCode: string;
}

const registerForm = reactive<RegisterForm>({
  nickname: "",
  email: "",
  password: "",
  confirmPassword: "",
  verificationCode: "",
});
const geetestCaptchaRef = ref();
const emailRef = toRef(registerForm, "email");
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
  cleanup,
} = useEmailVerification({
  request: request,
  geetestCaptchaRef,
  email: emailRef,
});

const loading = ref(false);

// 服务协议勾选
const agreedToTerms = ref(false);

const validateForm = (): boolean => {
  if (
    !registerForm.nickname.trim() ||
    !registerForm.email.trim() ||
    !registerForm.password ||
    !registerForm.confirmPassword
  ) {
    message.error("请输入以下注册信息");
    return false;
  }
  if (!registerForm.nickname.trim()) {
    message.error("请输入昵称");
    return false;
  }
  if (registerForm.nickname.trim().length < 1 || registerForm.nickname.trim().length > 50) {
    message.error("昵称长度应在1-50个字符之间");
    return false;
  }

  if (!registerForm.email.trim()) {
    message.error("请输入邮箱地址");
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(registerForm.email.trim())) {
    message.error("请输入正确的邮箱地址");
    return false;
  }

  if (isEmailValid.value && registerForm.email.trim() !== "") {
    if (!registerForm.verificationCode) {
      message.error("请输入邮箱验证码");
      return false;
    }
    if (!/^\d{6}$/.test(registerForm.verificationCode)) {
      message.error("验证码为6位数字");
      return false;
    }
  }

  if (!registerForm.password) {
    message.error("请输入密码");
    return false;
  }
  if (registerForm.password.length < 8) {
    message.error("密码长度至少为8位");
    return false;
  }
  if (registerForm.password.length > 30) {
    message.error("密码长度不能超过30位");
    return false;
  }
  if (!/(?=.*[a-zA-Z])(?=.*\d).+/.test(registerForm.password)) {
    message.error("密码必须包含至少一个字母和一个数字");
    return false;
  }

  if (!registerForm.confirmPassword) {
    message.error("请确认密码");
    return false;
  }
  if (registerForm.confirmPassword !== registerForm.password) {
    message.error("两次输入的密码不一致");
    return false;
  }

  return true;
};

const handleEmailInput = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  isEmailValid.value = emailRegex.test(registerForm.email);
};

const handleCaptchaLoaded = () => {};
const handleCaptchaError = (error: any) => {
  console.error("极验验证码错误:", error);
  handleGeetestError(error);
};

const handleRegister = async () => {
  if (!validateForm()) return;
  if (loading.value) return;

  // 服务协议校验
  if (!agreedToTerms.value) {
    message.warning("请先阅读并同意服务协议和极物聊天保护指引");
    return;
  }

  loading.value = true;
  try {
    const response = await request.post("/auth/register", {
      nickname: registerForm.nickname,
      email: registerForm.email,
      password: registerForm.password,
      confirmPassword: registerForm.confirmPassword,
      verificationCode: registerForm.verificationCode,
    });
    userStore.login(response.data.token);

    try {
      await websocketService.connect();
      console.log("WebSocket 连接成功");
    } catch (wsError) {
      console.error("WebSocket 连接失败:", wsError);
    }

    message.success(response.data.message);
    router.push("/message");
  } catch (error: any) {
    if (error.response?.data?.data?.message) {
      message.error(error.response.data.data.message);
    } else {
      message.error("注册失败，请重试");
    }
  } finally {
    loading.value = false;
  }
};

// ===== 服务协议 =====
const openAgreement = (type: "service" | "privacy") => {
  message.info(type === "service" ? "服务协议" : "极物聊天保护指引");
};

const getStarStyle = (index: number) => {
  const size = Math.random() * 3 + 1;
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  const duration = Math.random() * 3 + 2;
  const delay = Math.random() * 3;
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    top: `${y}%`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
  };
};

const getDotStyle = (index: number) => {
  const size = Math.random() * 6 + 3;
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  const duration = Math.random() * 10 + 8;
  const delay = Math.random() * 8;
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    top: `${y}%`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
  };
};

onUnmounted(() => {
  cleanup();
});
</script>

<style scoped lang="scss">
/* ===== 桌面端：极物聊天品牌注册 ===== */
.electron-register {
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
  padding: 22px 34px 18px;
  box-sizing: border-box;
  background: #f5f3ff; /* 纯色背景，替代原渐变 */
  overflow-y: auto;
}

.electron-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;

  .electron-logo {
    width: 48px;
    height: 48px;
    object-fit: contain;
    border-radius: 12px;
    margin-bottom: 10px;
    box-shadow: 0 6px 18px rgba(109, 40, 217, 0.16);
  }

  .electron-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--ink-900);
    margin: 0 0 4px 0;
    letter-spacing: 1px;
  }

  .electron-subtitle {
    font-size: 12px;
    color: var(--ink-500);
    margin: 0;
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
  margin-bottom: 12px;
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

.electron-register-btn {
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--brand-500) 0%, #6366f1 100%);
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
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

.electron-agreement {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--ink-500);
  cursor: pointer;
  user-select: none;

  input[type="checkbox"] {
    width: 14px;
    height: 14px;
    margin-top: 1px;
    cursor: pointer;
    accent-color: var(--brand-500);
    flex-shrink: 0;
  }

  .electron-agreement-text {
    line-height: 1.5;
  }

  .electron-agreement-link {
    color: var(--brand-700);
    cursor: pointer;

    &:hover {
      color: var(--brand-900);
      text-decoration: underline;
    }
  }
}

.electron-links {
  display: flex;
  align-items: center;
  margin-top: 12px;

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

.register-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0 20px;
  background: #f7f9fc;
  flex-direction: column;
  overflow: hidden;

  &.electron-mode {
    padding: 0;
    background: transparent;
    align-items: flex-start;
    justify-content: flex-start;
    overflow: hidden;

    .register-wrapper {
      margin-top: 20px;
    }
  }
}

.register-bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;

  .bg-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.4;
    animation: blobFloat 20s ease-in-out infinite;
  }

  .blob-1 {
    width: 500px;
    height: 500px;
    top: -200px;
    right: -150px;
    background: radial-gradient(circle, #1677ff, #4f9eff);
    animation-delay: 0s;
  }

  .blob-2 {
    width: 400px;
    height: 400px;
    bottom: -150px;
    left: -120px;
    background: radial-gradient(circle, #4f9eff, #1677ff);
    animation-delay: -7s;
  }

  .blob-3 {
    width: 300px;
    height: 300px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(22, 119, 255, 0.2), rgba(79, 158, 255, 0.05));
    filter: blur(150px);
    animation: blobFloat 25s ease-in-out infinite reverse;
    animation-delay: -3s;
  }

  .blob-4 {
    width: 200px;
    height: 200px;
    top: 30%;
    right: 10%;
    background: radial-gradient(circle, rgba(79, 158, 255, 0.3), rgba(22, 119, 255, 0.1));
    filter: blur(120px);
    animation: blobFloat 18s ease-in-out infinite;
    animation-delay: -10s;
  }

  .glow-ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(22, 119, 255, 0.1);
    animation: ringPulse 8s ease-in-out infinite;
  }

  .ring-1 {
    width: 600px;
    height: 600px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation-delay: 0s;
  }

  .ring-2 {
    width: 800px;
    height: 800px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation-delay: -4s;
    border-color: rgba(22, 119, 255, 0.05);
  }

  .floating-line {
    position: absolute;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(22, 119, 255, 0.15), transparent);
    animation: lineFloat 15s ease-in-out infinite;
  }

  .line-1 {
    width: 300px;
    top: 20%;
    left: -100px;
    animation-delay: 0s;
  }

  .line-2 {
    width: 400px;
    bottom: 30%;
    right: -150px;
    animation-delay: -5s;
    height: 1px;
  }

  .line-3 {
    width: 250px;
    top: 60%;
    left: -80px;
    animation-delay: -10s;
    height: 1.5px;
  }

  .stars {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    .star {
      position: absolute;
      background: white;
      border-radius: 50%;
      animation: starTwinkle 3s ease-in-out infinite;
    }
  }

  .floating-dots {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    .dot {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(22, 119, 255, 0.3), transparent);
      animation: dotFloat 10s ease-in-out infinite;
    }
  }
}

@keyframes blobFloat {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(30px, -20px) scale(1.1);
  }
  50% {
    transform: translate(-20px, 30px) scale(0.9);
  }
  75% {
    transform: translate(20px, 10px) scale(1.05);
  }
}

@keyframes ringPulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.3);
    opacity: 0.3;
  }
}

@keyframes lineFloat {
  0%,
  100% {
    transform: translateX(0) scaleX(1);
    opacity: 0;
  }
  25% {
    opacity: 1;
  }
  75% {
    opacity: 1;
  }
  100% {
    transform: translateX(200px) scaleX(0.5);
    opacity: 0;
  }
}

@keyframes starTwinkle {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes dotFloat {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.3;
  }
  25% {
    transform: translate(40px, -30px) scale(1.5);
    opacity: 0.8;
  }
  50% {
    transform: translate(-20px, 40px) scale(0.8);
    opacity: 0.4;
  }
  75% {
    transform: translate(30px, 20px) scale(1.3);
    opacity: 0.6;
  }
}

.register-wrapper {
  width: 500px;
  padding: 48px 44px 40px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid #eee;
  box-sizing: border-box;
  position: relative;
  z-index: 10;
  margin-top: 40px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(22, 119, 255, 0.1);
  }

  .card-shimmer {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(ellipse at 50% 0%, rgba(22, 119, 255, 0.06) 0%, transparent 70%);
    animation: shimmerRotate 10s linear infinite;
    pointer-events: none;
  }

  .card-border-glow {
    position: absolute;
    inset: -2px;
    border-radius: 22px;
    padding: 2px;
    background: linear-gradient(135deg, rgba(22, 119, 255, 0.1), rgba(79, 158, 255, 0.05));
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  &:hover .card-border-glow {
    opacity: 1;
  }

  .card-bottom-decoration {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;

    .bottom-line {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(22, 119, 255, 0.2), transparent);
      border-radius: 2px;
    }

    .bottom-dots {
      display: flex;
      gap: 6px;

      span {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: rgba(22, 119, 255, 0.15);
        animation: dotPulse 2s ease-in-out infinite;

        &:nth-child(2) {
          animation-delay: 0.3s;
        }
        &:nth-child(3) {
          animation-delay: 0.6s;
        }
        &:nth-child(4) {
          animation-delay: 0.9s;
        }
        &:nth-child(5) {
          animation-delay: 1.2s;
        }
      }
    }
  }

  &.electron-card {
    width: 100%;
    max-width: 100%;
    padding: 8px 30px 5px 30px;
    background: transparent;
    backdrop-filter: none;
    border: none;
    border-radius: 0;
    box-shadow: none;
    margin-top: 0;
    transition: none;

    &:hover {
      background: transparent;
      border-color: transparent;
    }
  }
}

@keyframes shimmerRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dotPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.8;
  }
}

.register-header {
  text-align: center;
  margin-bottom: 28px;
  position: relative;
  z-index: 1;

  .header-icon-wrapper {
    position: relative;
    display: inline-block;

    .header-icon-pulse {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(22, 119, 255, 0.05);
      animation: iconPulse 2s ease-in-out infinite;
    }
  }

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: #1677ff;
    margin: 0 0 6px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    position: relative;

    .header-logo {
      width: 28px;
      height: 28px;
      object-fit: contain;
      border-radius: 6px;
      animation: logoFloat 3s ease-in-out infinite;
    }
  }

  p {
    font-size: 14px;
    color: #8c8c8c;
    margin: 0;
    letter-spacing: 0.5px;
  }
}

@keyframes iconPulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.3);
    opacity: 0;
  }
}

@keyframes logoFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.register-form {
  position: relative;
  z-index: 1;

  .form-item {
    margin-bottom: 16px;
    position: relative;
  }

  :deep(.ant-input) {
    height: 42px;
    border-radius: 12px;
    border: 1px solid #e5e6eb;
    background: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    text-align: center;
    transition: all 0.3s ease;

    &:hover {
      border-color: #4f9eff;
    }

    &:focus {
      border-color: #1677ff;
      box-shadow: 0 0 0 4px rgba(22, 119, 255, 0.08);
    }

    &::placeholder {
      text-align: center;
    }
  }

  :deep(.ant-input-affix-wrapper) {
    height: 42px;
    border-radius: 12px;
    border: 1px solid #e5e6eb;
    background: rgba(255, 255, 255, 0.8);
    transition: all 0.3s ease;
    padding: 0 11px;

    &:hover {
      border-color: #4f9eff;
    }

    &:focus-within {
      border-color: #1677ff;
      box-shadow: 0 0 0 4px rgba(22, 119, 255, 0.08);
    }

    .ant-input {
      height: auto;
      border: none;
      box-shadow: none;
      text-align: center;

      &:focus {
        box-shadow: none;
      }
    }

    .ant-input-password-icon {
      color: #bfbfbf;
      font-size: 16px;

      &:hover {
        color: #1677ff;
      }
    }
  }

  .input-focus-glow {
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #1677ff, transparent);
    transition: width 0.5s ease;
    border-radius: 2px;
  }

  :deep(.ant-input:focus) ~ .input-focus-glow,
  :deep(.ant-input-affix-wrapper:focus-within) ~ .input-focus-glow {
    width: 80%;
  }

  .verification-item {
    .verification-input-wrapper {
      position: relative;
    }

    :deep(.ant-input-affix-wrapper) {
      padding-right: 0;
    }

    :deep(.ant-input-suffix) {
      margin-left: 0;
      display: flex;
      align-items: center;
      padding-right: 4px;
      position: relative;
      z-index: 2;
    }

    :deep(.ant-input) {
      padding-right: 100px;
      text-align: center;
    }
  }

  .verification-text {
    font-size: 13px;
    color: #1677ff;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    padding: 4px 8px;
    border-radius: 6px;
    user-select: none;

    &.disabled {
      color: #a8abb2;
      cursor: not-allowed;
    }
  }

  .register-btn {
    width: 100%;
    height: 42px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    border: none;
    box-shadow: 0 4px 16px rgba(22, 119, 255, 0.25);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    .btn-text {
      position: relative;
      z-index: 2;
    }

    .btn-ripple {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      animation: ripple 2s ease-in-out infinite;
    }

    &::before {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent 30%,
        rgba(255, 255, 255, 0.15) 50%,
        transparent 70%
      );
      animation: btnShimmer 3s ease-in-out infinite;
    }

    &:hover:not(:disabled) {
      transform: translateY(-2px) scale(1.01);
      box-shadow: 0 6px 24px rgba(22, 119, 255, 0.35);
    }

    &:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
    }

    &.electron-btn {
      background: #1677ff;
      box-shadow: none;

      &::before {
        display: none;
      }

      &:hover:not(:disabled) {
        transform: none;
        box-shadow: none;
      }

      &:active:not(:disabled) {
        transform: none;
      }
    }
  }

  @keyframes ripple {
    0% {
      width: 0;
      height: 0;
      opacity: 0.5;
    }
    100% {
      width: 300px;
      height: 300px;
      opacity: 0;
    }
  }

  @keyframes btnShimmer {
    0% {
      transform: translateX(-100%) rotate(45deg);
    }
    100% {
      transform: translateX(100%) rotate(45deg);
    }
  }

  .login-link {
    margin-top: 10px;
    font-size: 14px;
    color: #8c8c8c;
    text-align: center;
  }

  .login-link-btn {
    color: #1677ff !important;
    padding: 0 4px;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 2px;
      background: #1677ff;
      transition: width 0.3s ease;
    }

    &:hover {
      color: #0a58ca !important;
      transform: translateX(2px);

      &::after {
        width: 80%;
      }
    }

    &.electron-link-btn {
      &::after {
        display: none;
      }

      &:hover {
        transform: none;
        color: #1677ff !important;
      }
    }
  }
}
</style>
