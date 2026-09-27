<!-- 邮箱绑定页面 -->
<template>
  <div class="bind-email-page">
    <div class="content">
      <div class="header-section">
        <p>绑定你的邮箱</p>
      </div>

      <div class="text-section">
        <span class="text-bind" :class="{ disabled: submitting }" @click="goToBindEmail">
          立即绑定
        </span>
        <span class="text-skip" :class="{ disabled: submitting }" @click="skipBind"> 跳过 </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";

const router = useRouter();
const submitting = ref(false);

const goToBindEmail = () => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    router.push("/account");
    submitting.value = false;
  } catch (error) {
    console.error("跳转失败:", error);
    message.error("跳转失败，请重试");
    submitting.value = false;
  }
};

const skipBind = () => {
  if (submitting.value) return;
  submitting.value = true;
  message.info("你可以稍后在个人中心完善个人信息");
  router
    .push("/message")
    .then(() => {
      submitting.value = false;
    })
    .catch((error) => {
      console.error("路由跳转失败:", error);
      submitting.value = false;
    });
};
</script>

<style scoped>
.bind-email-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f5f5f5;
}

.content {
  width: 100%;
  max-width: 360px;
  padding: 32px 24px;
  text-align: center;
}

.header-section p {
  font-size: 20px;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0 0 8px;
}

.text-section {
  display: flex;
  gap: 24px;
  margin-top: 24px;
  justify-content: center;
}

.text-bind,
.text-skip {
  font-size: 15px;
  cursor: pointer;
  padding: 6px 12px;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-bind {
  color: #007aff;
}

.text-bind:hover:not(.disabled) {
  color: #005fc1;
  text-decoration: underline;
}

.text-skip {
  color: #8e8e93;
}

.text-skip:hover:not(.disabled) {
  color: #666;
  text-decoration: underline;
}
</style>
