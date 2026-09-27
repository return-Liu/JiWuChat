<template>
  <div class="add-phone-page">
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <div class="top-bar-inner">
        <h1 class="page-title">绑定手机号</h1>
      </div>
    </div>

    <!-- 主体内容区 -->
    <div class="main-container">
      <div class="form-card">
        <div class="form-group">
          <label for="phone" class="form-label">手机号码</label>
          <input
            type="tel"
            id="phone"
            v-model="phone"
            placeholder="请输入你的手机号码"
            class="form-input"
          />
        </div>

        <div class="actions-section">
          <button class="submit-btn" :disabled="submitting" @click="bindPhone">
            {{ submitting ? "提交中..." : "确认绑定" }}
          </button>
        </div>

        <div class="help-text">
          <p>绑定手机号后可以用于登录和找回密码</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/user";
import { useSiderColor } from "../stores/siderColor";
import { message } from "ant-design-vue";

const router = useRouter();
const userStore = useUserStore();
const siderColorStore = useSiderColor();

// 表单数据
const phone = ref("");
const submitting = ref(false);

// 绑定手机号
const bindPhone = async () => {
  if (!phone.value) {
    message.error("请输入你的手机号码");
    return;
  }

  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone.value)) {
    message.error("请输入正确的手机号码");
    return;
  }

  try {
    submitting.value = true;

    // 更新用户资料，包括手机号
    await userStore.updateProfile({ phone: phone.value });

    // 手机号已更新，向用户反馈成功信息
    message.success("手机号绑定成功");

    // 直接路由返回上一页
    router.go(-1);
  } catch (error: any) {
    console.error("绑定手机号失败:", error);
    message.error(error.message || "绑定失败,请稍后重试");
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.add-phone-page {
  min-height: 100vh;
  background-color: v-bind("siderColorStore.chatBgGradient");
  padding-bottom: 20px;
}

.top-bar {
  background: v-bind("siderColorStore.currentColor");
  padding: 15px 20px;
  color: white;
}

.top-bar-inner {
  display: flex;
  align-items: center;
}

.nav-back {
  margin-right: 15px;
  cursor: pointer;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.main-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.form-card {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 25px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: v-bind("siderColorStore.currentColor");
  box-shadow: 0 0 0 2px v-bind("siderColorStore.currentColorPalette.hover");
}

.actions-section {
  display: flex;
  justify-content: flex-start; // 按钮左对齐
  gap: 10px;
  margin-bottom: 15px;
}

.help-text {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.submit-btn {
  flex: 0 0 auto;
  padding: 12px 24px;
  background-color: v-bind("siderColorStore.currentColor");
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 120px;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.submit-btn:not(:disabled):hover {
  background-color: v-bind("siderColorStore.currentColorPalette.hover");
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
