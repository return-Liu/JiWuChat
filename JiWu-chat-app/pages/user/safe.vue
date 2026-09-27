<template>
  <div class="account-safe-page">
    <div class="page-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">账户中心</h1>
        <p class="page-subtitle">管理您的账户信息与安全设置</p>
      </div>

      <!-- 标签导航 -->
      <div class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-nav-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.badge" class="badge">{{ tab.badge }}</span>
        </button>
      </div>

      <!-- 主体内容 -->
      <div class="page-content">
        <!-- ========== 账号 Tab ========== -->
        <div v-show="activeTab === 'account'" class="account-tab">
          <!-- 个人信息 -->
          <section class="section">
            <div class="profile-row">
              <div class="profile-avatar">
                <img :src="userAvatar" alt="头像" />
              </div>
              <div class="profile-info">
                <div class="profile-name">{{ displayName }}</div>
                <div class="profile-meta">注册于 {{ registerDate || "--" }}</div>
              </div>
              <button class="btn-edit-profile">编辑资料</button>
            </div>
          </section>

          <!-- 安全设置 -->
          <section class="section">
            <h3 class="section-title">安全设置</h3>
            <div class="row-item">
              <div class="row-label">
                <span class="label-main">登录密码</span>
                <span class="label-desc">建议定期更换密码</span>
              </div>
              <div class="row-right">
                <span class="row-value">••••••••</span>
                <button class="btn-text" @click="handleChangePassword">修改</button>
              </div>
            </div>
            <div class="row-item">
              <div class="row-label">
                <span class="label-main">手机号</span>
                <span class="label-desc">用于登录和找回密码</span>
              </div>
              <div class="row-right">
                <span class="row-value">{{ phone || "未绑定" }}</span>
                <button class="btn-text" @click="handleChangePhone">修改</button>
              </div>
            </div>
            <div class="row-item">
              <div class="row-label">
                <span class="label-main">邮箱地址</span>
                <span class="label-desc">用于接收通知</span>
              </div>
              <div class="row-right">
                <span class="row-value">{{ email || "未绑定" }}</span>
                <button class="btn-text" @click="handleChangeEmail">修改</button>
              </div>
            </div>
          </section>

          <!-- 第三方绑定 -->
          <section class="section">
            <h3 class="section-title">第三方绑定</h3>
            <div class="row-item">
              <div class="row-label">
                <span class="label-main">QQ账号</span>
                <span class="label-desc">使用QQ快速登录</span>
              </div>
              <div class="row-right">
                <span class="row-value" :class="{ bound: isQQBound }">
                  {{ isQQBound ? "已绑定" : "未绑定" }}
                </span>
                <button
                  v-if="!isQQBound"
                  class="btn-primary"
                  :disabled="qqBindingLoading"
                  @click="handleBindQQ"
                >
                  {{ qqBindingLoading ? "跳转中..." : "绑定" }}
                </button>
                <button v-else class="btn-danger" @click="handleUnbindQQ">解绑</button>
              </div>
            </div>
          </section>

          <!-- 退出登录 -->
          <section class="section">
            <div class="logout-row">
              <button class="btn-logout" @click="handleLogout">退出登录</button>
            </div>
          </section>
        </div>

        <!-- ========== 安全管理 Tab ========== -->
        <div v-show="activeTab === 'security'" class="security-tab">
          <section class="section">
            <h3 class="section-title">
              登录设备
              <span class="title-extra">共 {{ devices.length }} 台</span>
            </h3>
            <div
              v-for="device in devices"
              :key="device.id"
              class="device-item"
              :class="{ current: device.isCurrentDevice }"
            >
              <div class="device-info">
                <div class="device-name">{{ device.deviceName }}</div>
                <div class="device-detail">{{ device.os }} · {{ device.browser }}</div>
                <div class="device-detail">登录于: {{ device.loginTime }}</div>
                <div class="device-detail">登录地点: {{ device.location }}</div>
              </div>
              <div class="device-action">
                <span v-if="device.isCurrentDevice" class="current-badge">当前设备</span>
                <button v-else class="btn-danger" @click="handleLogoutDevice(device.id)">
                  踢出
                </button>
              </div>
            </div>
          </section>
        </div>

        <!-- ========== 系统 Tab ========== -->
        <div v-show="activeTab === 'system'" class="system-tab">
          <section class="section">
            <h3 class="section-title">
              电池状态
              <span class="title-extra" :class="{ charging: batteryCharging }">
                {{ batteryCharging ? "充电中" : "使用电池" }}
              </span>
            </h3>

            <div class="battery-panel">
              <div class="battery-head">
                <div class="battery-level" :style="batteryPercentageStyle">
                  {{ batteryLevel }}<i>%</i>
                </div>
                <div class="battery-tag" :class="batteryLevelClass">
                  {{ batteryLevelText }}
                </div>
              </div>

              <div class="battery-bar">
                <div
                  class="bar-fill"
                  :class="batteryLevelClass"
                  :style="{ width: batteryLevel + '%' }"
                ></div>
              </div>

              <div class="battery-meta">
                <div class="meta-row">
                  <span class="row-label">当前状态</span>
                  <span class="row-value" :class="{ green: batteryCharging }">
                    {{ batteryCharging ? "正在充电" : "未充电" }}
                  </span>
                </div>
                <div class="meta-row" v-if="batterySupport">
                  <span class="row-label">
                    {{ batteryCharging ? "预计充满" : "剩余可用" }}
                  </span>
                  <span class="row-value">
                    {{ batteryCharging ? batteryChargingTime : batteryDischargingTime }}
                  </span>
                </div>
                <div class="meta-row" v-else>
                  <span class="row-label">设备信息</span>
                  <span class="row-value">暂不支持获取</span>
                </div>
                <div class="meta-row">
                  <span class="row-label">电量等级</span>
                  <span class="row-value">{{ batteryLevelText }}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../../stores/user";
import { message, Modal } from "ant-design-vue";
import request from "../../untils/request";

const router = useRouter();
const userStore = useUserStore();

// ========== Tab 配置 ==========
const tabs = [
  { key: "account", label: "账号" },
  { key: "security", label: "安全管理" },
  { key: "system", label: "系统" },
];
const activeTab = ref("account");

// ========== 用户信息 ==========
const username = ref("");
const registerDate = ref("");
const email = ref("");
const phone = ref("");
const userId = ref("");

const userAvatar = computed(() => {
  return userStore.userAvatar || userStore.user?.avatar || "";
});

const displayName = computed(() => {
  return username.value || "未设置昵称";
});

// ========== QQ绑定 ==========
const isQQBound = ref(false);
const qqBindingLoading = ref(false);

// ========== 设备管理 ==========
interface Device {
  id: number;
  deviceName: string;
  deviceType: string;
  os: string;
  browser: string;
  ipAddress: string;
  location: string;
  loginTime: string;
  isCurrentDevice: boolean;
}

const devices = ref<Device[]>([]);

// ========== 电池相关 ==========
const batteryLevel = ref(100);
const batteryCharging = ref(false);
const batterySupport = ref(false);
const batteryDischargingTime = ref("--");
const batteryChargingTime = ref("--");
let batteryInstance: any = null;

const batteryLevelClass = computed(() => {
  if (batteryCharging.value) return "charging";
  if (batteryLevel.value <= 20) return "low";
  if (batteryLevel.value <= 50) return "medium";
  return "high";
});

const batteryLevelText = computed(() => {
  const level = batteryLevel.value;
  if (level <= 20) return "低电量";
  if (level <= 50) return "中等";
  if (level <= 80) return "良好";
  return "充足";
});

const batteryPercentageStyle = computed(() => {
  if (batteryCharging.value) return { color: "#22c55e" };
  const level = batteryLevel.value;
  if (level <= 20) return { color: "#f87171" };
  if (level <= 50) return { color: "#fb923c" };
  if (level <= 80) return { color: "#fbbf24" };
  return { color: "#4ade80" };
});

const formatTime = (seconds: number): string => {
  if (!seconds || seconds === Infinity || seconds <= 0) return "--";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0 && minutes > 0) return `${hours} 小时 ${minutes} 分`;
  if (hours > 0) return `${hours} 小时`;
  if (minutes > 0) return `${minutes} 分钟`;
  return "不到 1 分钟";
};

const updateBatteryInfo = () => {
  if (!batteryInstance) return;
  try {
    batteryLevel.value = Math.round(batteryInstance.level * 100);
    batteryCharging.value = batteryInstance.charging;

    if (batteryInstance.charging) {
      const t = batteryInstance.chargingTime;
      batteryChargingTime.value = t && t !== Infinity && t > 0 ? formatTime(t) : "计算中";
      batteryDischargingTime.value = "--";
    } else {
      const t = batteryInstance.dischargingTime;
      batteryDischargingTime.value = t && t !== Infinity && t > 0 ? formatTime(t) : "--";
      batteryChargingTime.value = "--";
    }
  } catch (error) {
    console.error("更新电池信息失败:", error);
  }
};

const getBatteryInfo = async () => {
  try {
    if (!("getBattery" in navigator)) {
      batterySupport.value = false;
      return;
    }
    const battery = await (navigator as any).getBattery();
    batteryInstance = battery;
    batterySupport.value = true;
    updateBatteryInfo();

    ["levelchange", "chargingchange", "chargingtimechange", "dischargingtimechange"].forEach(
      (event) => {
        battery.addEventListener(event, updateBatteryInfo);
      },
    );
  } catch (error) {
    console.error("获取电池信息失败:", error);
    batterySupport.value = false;
  }
};

// ========== API 请求 ==========
const fetchUserInfo = async () => {
  try {
    await userStore.fetchUserInfo();
    if (userStore.user) {
      email.value = userStore.user.email || "";
      username.value = userStore.user.nickname || userStore.user.username || "";
      phone.value = userStore.user.phone || "";
      userId.value = userStore.user.id || "";
      if (userStore.user.createdAt) {
        const date = new Date(userStore.user.createdAt);
        registerDate.value = date.toISOString().split("T")[0];
      }
    }
  } catch (error) {
    console.error("获取用户信息失败:", error);
  }
};

const fetchQQBindingStatus = async () => {
  try {
    const res = await request.get("/auth/qq/binding-status");
    if (res.data) {
      isQQBound.value = res.data.isQQBound ?? false;
    }
  } catch (error) {
    console.error("获取QQ绑定状态失败:", error);
  }
};

const fetchDevices = async () => {
  try {
    const res = await request.get("/auth/devices");
    if (res.data?.devices) {
      devices.value = (res.data.devices || []).map((d: any) => ({
        id: d.id,
        deviceName: d.deviceName || "未知设备",
        deviceType: d.deviceType || "web",
        os: d.osName ? `${d.osName} ${d.osVersion || ""}` : "未知系统",
        browser: d.browserName ? `${d.browserName} ${d.browserVersion || ""}` : "未知浏览器",
        ipAddress: d.ipAddress || "未知",
        location: d.location || "未知位置",
        loginTime: d.loginTime || "",
        isCurrentDevice: d.isCurrentDevice ?? false,
      }));
    }
  } catch (error) {
    console.error("获取设备列表失败:", error);
  }
};

// ========== 事件处理 ==========
const handleChangePassword = () => {
  router.push("/forgot-password");
};

const handleChangePhone = () => {
  message.info("修改手机号功能开发中");
};

const handleChangeEmail = () => {
  message.info("修改邮箱功能开发中");
};

const handleBindQQ = () => {
  qqBindingLoading.value = true;
  const backendUrl = process.env.NUXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  window.location.href = `${backendUrl}/auth/qq/bind`;
};

const handleUnbindQQ = () => {
  Modal.confirm({
    title: "确认解绑QQ",
    content: "解绑后你将无法使用QQ快捷登录，确定要解绑吗？",
    okText: "确认解绑",
    cancelText: "取消",
    okType: "danger",
    onOk: async () => {
      try {
        const response = await request.delete("/auth/qq/unbind");
        isQQBound.value = false;
        message.success(response.data?.message || "解绑成功");
      } catch (error: any) {
        message.error(error?.response?.data?.message || "解绑失败，请重试");
      }
    },
  });
};

const handleLogoutDevice = (deviceId: number) => {
  Modal.confirm({
    title: "确认踢出设备",
    content: "确定要踢出该设备吗？该设备将被强制下线。",
    okText: "确认踢出",
    cancelText: "取消",
    okType: "danger",
    onOk: async () => {
      try {
        const response = await request.delete(`/auth/devices/${deviceId}`);
        message.success(response.data?.message || "操作成功");
        devices.value = devices.value.filter((d) => d.id !== deviceId);
      } catch (error: any) {
        message.error(error?.response?.data?.message || "操作失败，请重试");
      }
    },
  });
};

const handleLogout = () => {
  Modal.confirm({
    title: "确认退出",
    content: "确定要退出登录吗？",
    okText: "确认退出",
    cancelText: "取消",
    okType: "danger",
    onOk() {
      userStore.logout();
      router.push("/login");
    },
  });
};

// ========== 生命周期 ==========
onBeforeUnmount(() => {
  if (batteryInstance) {
    ["levelchange", "chargingchange", "chargingtimechange", "dischargingtimechange"].forEach(
      (event) => {
        batteryInstance.removeEventListener(event, updateBatteryInfo);
      },
    );
    batteryInstance = null;
  }
});

onMounted(() => {
  getBatteryInfo();
  fetchUserInfo();
  fetchQQBindingStatus();
  fetchDevices();
});
</script>

<style lang="scss" scoped>
.account-safe-page {
  width: 100vw;
  height: 100vh;
  background: var(--bg-primary);
  display: flex;
  overflow: hidden;

  // 右侧区域：占满剩余空间
  .page-container {
    flex: 1;
    min-width: 0;
    width: 100%;
    height: 100%;
    padding: 40px 48px 64px;
    overflow-y: auto;
    overflow-x: hidden;

    // 内部所有内容全宽
    > * {
      width: 100%;
      max-width: none;
    }
  }

  // ========== 页面头部 ==========
  .page-header {
    margin-bottom: 24px;

    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 6px 0;
      letter-spacing: -0.4px;
    }

    .page-subtitle {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
    }
  }

  // ========== 标签导航 ==========
  .tab-nav {
    display: flex;
    gap: 32px;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 32px;

    .tab-nav-btn {
      padding: 10px 0 14px;
      font-size: 15px;
      font-weight: 500;
      color: var(--text-secondary);
      border: none;
      background: transparent;
      cursor: pointer;
      position: relative;
      transition: color 0.2s;

      &::after {
        content: "";
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: transparent;
        transition: background 0.2s;
      }

      &:hover {
        color: var(--text-primary);
      }

      &.active {
        color: var(--color-brand);
        font-weight: 600;

        &::after {
          background: var(--color-brand);
        }
      }

      .badge {
        display: inline-block;
        margin-left: 6px;
        padding: 0 7px;
        font-size: 11px;
        font-weight: 600;
        color: #ffffff;
        background: var(--error-color);
        border-radius: 10px;
        line-height: 18px;
      }
    }
  }

  // ========== 页面内容：全宽
  .page-content {
    width: 100%;

    .account-tab,
    .security-tab,
    .system-tab {
      width: 100%;
    }
  }

  // ========== 分区 ==========
  .section {
    width: 100%;
    padding-bottom: 28px;
    margin-bottom: 28px;
    border-bottom: 1px solid var(--border-color);

    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 4px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .title-extra {
        font-size: 13px;
        font-weight: 400;
        color: var(--text-secondary);

        &.charging {
          color: #16a34a;
          font-weight: 500;
        }
      }
    }
  }

  // ========== 个人信息行 ==========
  .profile-row {
    display: flex;
    align-items: center;
    gap: 20px;
    width: 100%;

    .profile-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .profile-info {
      flex: 1;
      min-width: 0;

      .profile-name {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      .profile-meta {
        font-size: 13px;
        color: var(--text-secondary);
      }
    }

    .btn-edit-profile {
      flex-shrink: 0;
      padding: 8px 20px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: transparent;
      color: var(--text-primary);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: var(--color-brand);
        color: var(--color-brand);
      }
    }
  }

  // ========== 通用行项 ==========
  .row-item,
  .device-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    width: 100%;
    padding: 16px 0;
    border-bottom: 1px solid var(--border-color);

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
  }

  .row-label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-width: 0;

    .label-main {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .label-desc {
      font-size: 12px;
      color: var(--text-tertiary);
    }
  }

  .row-right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;

    .row-value {
      font-size: 14px;
      color: var(--text-secondary);

      &.bound {
        color: #16a34a;
        font-weight: 500;
      }

      &.green {
        color: #16a34a;
      }
    }
  }

  // ========== 按钮 ==========
  .btn-text {
    padding: 5px 14px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: transparent;
    color: var(--color-brand);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      border-color: var(--color-brand);
      background: var(--color-brand-light, rgba(59, 130, 246, 0.05));
    }
  }

  .btn-primary {
    padding: 6px 18px;
    border: none;
    border-radius: 8px;
    background: var(--color-brand);
    color: #ffffff;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: var(--color-brand-hover);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .btn-danger {
    padding: 6px 18px;
    border: 1px solid var(--error-color);
    border-radius: 8px;
    background: transparent;
    color: var(--error-color);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: rgba(239, 68, 68, 0.06);
    }
  }

  .logout-row {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }

  .btn-logout {
    padding: 10px 32px;
    border: 1px solid var(--error-color);
    border-radius: 10px;
    background: transparent;
    color: var(--error-color);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: rgba(239, 68, 68, 0.06);
    }
  }

  // ========== 设备 ==========
  .device-item {
    .device-info {
      flex: 1;
      min-width: 0;

      .device-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
      }

      .device-detail {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 3px;
      }
    }

    &.current .device-name {
      color: var(--color-brand);
    }

    .device-action {
      flex-shrink: 0;
      width: 100px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
  }

  .current-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 500;
    color: #ffffff;
    background: #22c55e;
    padding: 5px 12px;
    border-radius: 8px;
    white-space: nowrap;
  }

  // ========== 电池状态 ==========
  .battery-panel {
    width: 100%;
    padding-top: 20px;

    .battery-head {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 16px;

      .battery-level {
        font-size: 40px;
        font-weight: 700;
        letter-spacing: -2px;
        line-height: 1;

        i {
          font-size: 18px;
          font-style: normal;
          font-weight: 600;
          margin-left: 2px;
          opacity: 0.65;
        }
      }

      .battery-tag {
        font-size: 12px;
        font-weight: 500;
        padding: 2px 9px;
        border-radius: 6px;
        color: var(--text-secondary);
        background: rgba(0, 0, 0, 0.04);

        &.high {
          color: #16a34a;
          background: rgba(34, 197, 94, 0.1);
        }
        &.medium {
          color: #d97706;
          background: rgba(251, 191, 36, 0.14);
        }
        &.low {
          color: #dc2626;
          background: rgba(248, 113, 113, 0.12);
        }
        &.charging {
          color: #16a34a;
          background: rgba(34, 197, 94, 0.12);
        }
      }
    }

    .battery-bar {
      position: relative;
      width: 100%;
      height: 10px;
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.05);
      overflow: hidden;
      margin-bottom: 20px;

      .bar-fill {
        position: relative;
        height: 100%;
        border-radius: 999px;
        transition: width 0.6s ease;
        overflow: hidden;

        &.high {
          background: #4ade80;
        }
        &.medium {
          background: #fbbf24;
        }
        &.low {
          background: #f87171;
        }

        &.charging {
          background: linear-gradient(
            90deg,
            #22c55e 0%,
            #4ade80 25%,
            #86efac 50%,
            #4ade80 75%,
            #22c55e 100%
          );
          background-size: 200% 100%;
          animation: bar-flow 2s linear infinite;

          &::before {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(
              100deg,
              transparent 30%,
              rgba(255, 255, 255, 0.65) 50%,
              transparent 70%
            );
            transform: translateX(-100%);
            animation: bar-sheen 1.8s ease-in-out infinite;
          }

          &::after {
            content: "";
            position: absolute;
            inset: 0;
            background-image:
              radial-gradient(
                circle at 10px 0,
                rgba(255, 255, 255, 0.45) 0,
                rgba(255, 255, 255, 0.45) 6px,
                transparent 7px
              ),
              radial-gradient(
                circle at 30px 0,
                rgba(255, 255, 255, 0.35) 0,
                rgba(255, 255, 255, 0.35) 6px,
                transparent 7px
              );
            background-size: 40px 100%;
            background-repeat: repeat-x;
            animation: bar-wave 1.6s linear infinite;
            mix-blend-mode: overlay;
          }
        }
      }
    }

    .battery-meta {
      width: 100%;

      .meta-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid var(--border-color);

        &:last-child {
          border-bottom: none;
        }

        .row-label {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .row-value {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);

          &.green {
            color: #16a34a;
          }
        }
      }
    }
  }

  @keyframes bar-flow {
    0% {
      background-position: 0% 50%;
    }
    100% {
      background-position: 200% 50%;
    }
  }

  @keyframes bar-sheen {
    0% {
      transform: translateX(-100%);
    }
    60% {
      transform: translateX(100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  @keyframes bar-wave {
    0% {
      background-position-x: 0;
    }
    100% {
      background-position-x: 40px;
    }
  }

  // ========== 响应式 ==========
  @media (max-width: 768px) {
    .page-container {
      padding: 24px 20px 40px;
    }

    .page-header .page-title {
      font-size: 22px;
    }

    .tab-nav {
      gap: 20px;
      margin-bottom: 24px;

      .tab-nav-btn {
        font-size: 14px;
      }
    }

    .profile-row {
      flex-wrap: wrap;

      .btn-edit-profile {
        width: 100%;
        margin-top: 4px;
      }
    }

    .row-item,
    .device-item {
      flex-wrap: wrap;

      .row-right,
      .device-action {
        width: 100%;
        justify-content: flex-end;
        padding-top: 8px;
      }
    }

    .battery-panel .battery-head .battery-level {
      font-size: 34px;
    }

    .btn-logout {
      width: 100%;
    }
  }
}
</style>
