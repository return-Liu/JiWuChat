<!-- QQ绑定回调页面 -->
<template>
  <div class="bind-loading">
    <div class="bind-container">
      <div v-if="!hasError && !bindSuccess" class="loading-spinner">
        <div class="spinner"></div>
      </div>

      <div class="status-text" :class="{ error: hasError, success: bindSuccess }">
        {{ displayText }}
      </div>

      <div v-if="bindSuccess" class="bind-info">
        <span v-if="bindLocation">绑定位置：{{ bindLocation }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const bindSuccess = ref(false);
const hasError = ref(false);
const statusMessage = ref("");
const bindLocation = ref("");

const displayText = computed(() => {
  if (hasError.value) return statusMessage.value || "绑定失败，请重试";
  if (bindSuccess.value) return statusMessage.value || "QQ绑定成功！";
  return "正在处理绑定结果...";
});

onMounted(() => {
  const bindSuccessParam = route.query.bind_success as string;
  const locationParam = route.query.location as string;
  const errorParam = route.query.error as string;

  if (errorParam) {
    hasError.value = true;
    statusMessage.value = decodeURIComponent(errorParam);
    return;
  }

  if (bindSuccessParam === "true") {
    bindSuccess.value = true;
    bindLocation.value = locationParam ? decodeURIComponent(locationParam) : "";
    statusMessage.value = "QQ账号绑定成功！";
    router.push("/message");
  } else {
    hasError.value = true;
    statusMessage.value = "绑定失败，请返回重试";
  }
});
</script>

<style scoped>
.bind-loading {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
}

.bind-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-spinner {
  margin-bottom: 4px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid #e5e5e5;
  border-top: 2px solid #007aff;
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
  font-size: 15px;
  text-align: center;
  color: #333;
}

.status-text.error {
  color: #ff3b30;
}

.status-text.success {
  color: #28a745;
}

.bind-info {
  font-size: 13px;
  color: #999;
}
</style>
