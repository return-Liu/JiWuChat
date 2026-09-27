<!-- 登录加载页面 -->
<template>
  <div class="login-loading">
    <div class="loading-container">
      <div v-if="!hasError && !loginSuccess" class="loading-spinner">
        <div class="spinner"></div>
      </div>

      <div class="status-text" :class="{ error: hasError, success: loginSuccess }">
        {{ displayText }}
      </div>

      <button v-if="hasError" class="retry-btn" @click="handleRetry">重新登录</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "../../../stores/user";
import type { UserInfo } from "../../../stores/user";
import { message } from "ant-design-vue";
import { websocketService } from "../../../untils/websocket";
import request from "../../../untils/request";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const loadingText = ref("正在验证登录信息...");
const hasError = ref(false);
const loginSuccess = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

// 计算显示文本
const displayText = computed(() => {
  if (hasError.value) {
    return errorMessage.value || "登录失败，请重试";
  }
  if (loginSuccess.value) {
    return successMessage.value || "登录成功，正在跳转...";
  }
  return loadingText.value;
});

const handleRetry = () => {
  hasError.value = false;
  errorMessage.value = "";
  loadingText.value = "正在验证登录信息，请稍候...";
  // 跳转到后端 QQ 授权入口（而非前端路径）
  const baseURL = localStorage.getItem("api-url") || "http://localhost:8080";
  window.location.href = `${baseURL}/auth/qq`;
};

// 安全获取字符串
const safeGetString = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (value.message) return String(value.message);
    if (value.msg) return String(value.msg);
    return JSON.stringify(value);
  }
  return String(value);
};

// 适配后端返回的用户数据结构
const adaptUserData = (rawData: any): UserInfo => {
  return {
    id: rawData.id,
    username: rawData.username || "",
    email: rawData.email || "",
    avatar: rawData.avatar || "",
    status: rawData.status === 0 || rawData.status === 1 ? rawData.status : 1,
    nickname: rawData.nickname || "",
    createdAt: rawData.createdAt || rawData.created_at,
    updatedAt: rawData.updatedAt || rawData.updated_at,
    gender: rawData.gender,
    bio: rawData.bio || rawData.signature || "",
    phone: rawData.phone || "",
    qq_openid: rawData.qq_openid || "",
  };
};

// 定义响应数据类型
interface TokenResponse {
  token: string;
  user: any;
}

const handleAuthCallback = async () => {
  try {
    // 从 URL hash 中读取临时 code
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);

    const tempCode = hashParams.get("code");
    const messageParam = hashParams.get("message");
    const errorParam = route.query.error as string;

    // 检查是否有错误（error 在 query 中）
    if (errorParam) {
      const errorMsg = safeGetString(decodeURIComponent(errorParam));
      message.error(`登录遇到问题：${errorMsg}`);
      errorMessage.value = errorMsg;
      loadingText.value = errorMsg;
      hasError.value = true;
      return;
    }

    // 显示成功消息
    if (messageParam) {
      const msg = safeGetString(decodeURIComponent(messageParam));
      successMessage.value = msg;
      message.success(msg);
    }

    // 检查是否有临时 code
    if (!tempCode) {
      const errMsg = "缺少临时授权码，请重新登录";
      message.error(errMsg);
      errorMessage.value = errMsg;
      loadingText.value = errMsg;
      hasError.value = true;
      return;
    }

    // 用临时 code 换取真正的 token
    loadingText.value = "正在换取登录凭证...";

    const response = await request.get(`/auth/exchange-token?code=${tempCode}`);
    const data = response as any;

    const token = data?.token;
    const rawUser = data?.user;

    // 检查数据是否完整
    if (!token) {
      console.error("返回数据缺少 token，完整数据:", data);
      throw new Error("返回数据缺少 token");
    }

    if (!rawUser) {
      console.error("返回数据缺少用户信息，完整数据:", data);
      throw new Error("返回数据缺少用户信息");
    }

    // 适配用户数据
    const user = adaptUserData(rawUser);

    // 设置用户信息
    await userStore.login(token, true);
    userStore.setUser(user, false);

    // WebSocket 连接（非阻塞）
    websocketService
      .connect()
      .then(() => {
        console.log("WebSocket 连接成功");
      })
      .catch((wsError) => {
        console.error("WebSocket 连接失败:", wsError);
      });

    // 跳转
    const successMsg = successMessage.value || "登录成功，正在跳转...";
    loadingText.value = successMsg;
    loginSuccess.value = true;

    await nextTick();

    // 检查用户是否有完整信息（邮箱或手机号）
    const hasCompleteInfo =
      !!(user.email && user.email.trim() !== "") || !!(user.phone && user.phone.trim() !== "");
    if (hasCompleteInfo) {
      router.push("/message");
    } else {
      router.push("/auth/qq/fill-info");
    }
  } catch (err: any) {
    console.error("登录处理失败:", err);
    const errMsg = safeGetString(err.message) || "处理登录信息时出现问题，请重试";
    message.error(errMsg);
    errorMessage.value = errMsg;
    loadingText.value = errMsg;
    hasError.value = true;
  }
};

onMounted(() => {
  handleAuthCallback();
});
</script>

<style scoped>
.login-loading {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  margin: 0 0 12px 0;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e5e5e5;
  border-top: 3px solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.status-text {
  font-size: 14px;
  margin: 0 0 16px;
  text-align: center;
  color: #666;
}

.status-text.error {
  color: #ff3b30;
}

.status-text.success {
  color: #28a745;
}

.retry-btn {
  padding: 6px 20px;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #005fc1;
}
</style>
