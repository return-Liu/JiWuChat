<template>
  <div class="qq-sidebar" :style="sidebarStyles">
    <!-- 用户头像 -->
    <div class="user-avatar-wrapper">
      <a-avatar :size="40" :src="userAvatar" class="user-avatar" @click.stop="toggleUserInfo" />

      <!-- 用户信息弹窗 - 淡雅双色渐变背景 -->
      <div
        v-if="showUserInfo && userStore.user"
        class="user-info-popup"
        :class="{ 'popup-visible': showUserInfo && userStore.user }"
        @click.stop
      >
        <!-- 淡雅双色渐变背景 -->
        <div class="popup-gradient-bg"></div>
        <!-- 动态光晕层 -->
        <div class="popup-glow-layer"></div>

        <skeleton-loading v-if="isLoadingUserInfo" />
        <transition name="content-fade">
          <div v-if="!isLoadingUserInfo" class="user-info-content">
            <div class="user-info-header">
              <div class="popup-avatar-wrapper" @click="selectAvatar">
                <a-avatar :size="60" :src="editAvatar || userAvatar" class="popup-avatar" />
                <div class="avatar-edit-overlay">
                  <i class="iconfont icon-camera" style="font-size: 14px; color: #fff"></i>
                </div>
              </div>
              <div class="user-info-text">
                <div class="user-nickname-wrap">
                  <span v-if="!isEditing" class="user-nickname">{{ userNickname }}</span>
                  <input
                    v-else
                    v-model="editForm.nickname"
                    class="edit-input nickname-input"
                    placeholder="输入昵称"
                    maxlength="20"
                  />
                </div>
                <div class="user-username">账号 {{ userStore.user.username }}</div>
              </div>
            </div>

            <!-- 编辑模式下的表单 -->
            <template v-if="isEditing">
              <div class="user-info-details edit-mode">
                <div class="info-item">
                  <span class="info-label">邮箱</span>
                  <input
                    v-model="editForm.email"
                    class="edit-input"
                    type="email"
                    placeholder="输入邮箱"
                  />
                </div>
                <div class="info-item">
                  <span class="info-label">性别</span>
                  <div class="gender-group">
                    <button
                      v-for="(label, key) in genderOptions"
                      :key="key"
                      class="gender-btn"
                      :class="{ active: editForm.gender === Number(key) }"
                      @click="editForm.gender = Number(key)"
                    >
                      {{ label }}
                    </button>
                  </div>
                </div>
                <div class="info-item">
                  <span class="info-label">生日</span>
                  <div class="birthday-group">
                    <select
                      v-model="editForm.birthYear"
                      class="mini-select"
                      @change="updateBirthday"
                    >
                      <option :value="undefined">年</option>
                      <option v-for="y in yearList" :key="y" :value="y">{{ y }}</option>
                    </select>
                    <select
                      v-model="editForm.birthMonth"
                      class="mini-select"
                      @change="updateBirthday"
                    >
                      <option :value="undefined">月</option>
                      <option v-for="m in 12" :key="m" :value="m">{{ m }}</option>
                    </select>
                    <select
                      v-model="editForm.birthDay"
                      class="mini-select"
                      @change="updateBirthday"
                    >
                      <option :value="undefined">日</option>
                      <option v-for="d in dayList" :key="d" :value="d">{{ d }}</option>
                    </select>
                  </div>
                </div>
                <div class="info-item">
                  <span class="info-label">星座</span>
                  <select v-model="editForm.constellation" class="edit-input">
                    <option :value="undefined">选择星座</option>
                    <option
                      v-for="item in constellationOptions"
                      :key="item.value"
                      :value="item.value"
                    >
                      {{ item.label }}
                    </option>
                  </select>
                </div>
                <div class="info-item">
                  <span class="info-label">故乡</span>
                  <input v-model="editForm.hometown" class="edit-input" placeholder="输入故乡" />
                </div>
                <div class="info-item">
                  <span class="info-label">签名</span>
                  <input
                    v-model="editForm.bio"
                    class="edit-input"
                    placeholder="写一句个性签名吧~"
                    maxlength="100"
                  />
                </div>
              </div>

              <div class="user-info-actions">
                <button class="action-btn cancel-btn" @click="cancelEdit">取消</button>
                <button class="action-btn save-btn" :disabled="isSubmitting" @click="saveProfile">
                  <LoadingOutlined v-if="isSubmitting" spin />
                  {{ isSubmitting ? "保存中..." : "保存" }}
                </button>
              </div>
            </template>

            <!-- 查看模式下的信息展示 -->
            <template v-else>
              <div class="user-info-details">
                <div class="info-item">
                  <span class="info-label">邮箱</span>
                  <span class="info-value">{{ userStore.user.email || "未设置" }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">性别</span>
                  <span class="info-value">{{
                    getGenderText(userStore.user.gender) || "未设置"
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">年龄</span>
                  <span class="info-value">{{ userStore.user.age ?? "未设置" }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">星座</span>
                  <span class="info-value">{{ userStore.user.constellation || "未设置" }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">故乡</span>
                  <span class="info-value">{{ userStore.user.hometown || "未设置" }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">个性签名</span>
                  <span class="info-value">{{ userStore.user.bio || "未设置" }}</span>
                </div>
              </div>

              <div class="user-info-actions">
                <button class="action-btn edit-profile-btn" @click="startEdit">编辑资料</button>
              </div>
            </template>
          </div>
        </transition>
      </div>
    </div>

    <!-- 消息 -->
    <div
      class="sidebar-btn"
      :class="{ active: currentArea === 'message' }"
      @click="switchArea('message')"
    >
      <i
        class="iconfont"
        :class="currentArea === 'message' ? 'icon-message-comments-fill' : 'icon-message-comments'"
        style="font-size: 20px"
      ></i>
    </div>

    <!-- 好友 -->
    <div
      class="sidebar-btn"
      :class="{ active: currentArea === 'friend' }"
      @click="switchArea('friend')"
    >
      <i
        class="iconfont"
        :class="currentArea === 'friend' ? 'icon-Profile' : 'icon-Profile1'"
        style="font-size: 20px"
      ></i>
    </div>

    <div class="space-between-btns"></div>

    <div class="sidebar-bottom" ref="sidebarBottomRef">
      <!-- 账号图标（在菜单按钮上方） -->
      <div
        class="sidebar-btn account-icon-btn"
        :class="{ active: currentArea === 'user' }"
        @click="handleAccountClick"
      >
        <i class="iconfont icon-duopingtai" style="font-size: 20px"></i>
      </div>

      <!-- 菜单 -->
      <div
        class="sidebar-btn menu-trigger-btn"
        :class="{ active: false }"
        @click.stop="toggleCustomMenu"
      >
        <i class="iconfont icon-a-204_mulu" style="font-size: 24px"></i>
      </div>

      <transition name="menu-fade">
        <div
          v-show="showCustomMenu"
          class="custom-dropdown-menu"
          @mouseleave="closeCustomMenu"
          @click.stop
        >
          <div class="dropdown-item" @click.stop="handleCommand('supercolorpalette')">
            <i class="iconfont icon-pifu item-icon"></i>
            <span class="item-text">超级调色盘</span>
          </div>

          <div class="dropdown-item" @click.stop="handleCommand('manageInfo')">
            <i class="iconfont icon-shezhi item-icon"></i>
            <span class="item-text">设置</span>
          </div>
          <div class="dropdown-item" @click.stop="handleCommand('checkUpdate')">
            <i class="iconfont icon-iconfontzhizuobiaozhun0254 item-icon"></i>
            <span class="item-text">检查更新</span>
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item logout-item" @click.stop="handleCommand('logout')">
            <i class="iconfont icon-tuichudenglu item-icon"></i>
            <span class="item-text">退出登录</span>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, nextTick, watch, reactive } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/user";
import { Avatar } from "ant-design-vue";
import { useSiderColor } from "../stores/siderColor";
import request from "../untils/request";
import { message } from "ant-design-vue";
import { LoadingOutlined } from "@ant-design/icons-vue";

const SkeletonLoading = {
  template: `
    <div class="skeleton-loading">
      <div class="skeleton-header">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-text">
          <div class="skeleton-line skeleton-line-lg"></div>
          <div class="skeleton-line skeleton-line-sm"></div>
        </div>
      </div>
      <div class="skeleton-details">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </div>
      <div class="skeleton-actions">
        <div class="skeleton-btn"></div>
        <div class="skeleton-btn"></div>
      </div>
    </div>
  `,
};

interface Props {
  currentArea: "message" | "friend" | "user" | "space";
}

const props = defineProps<Props>();
const router = useRouter();

// 🔥 强制更新计数器
const forceUpdate = ref(0);

// 🔥 获取 themeStore 并监听 systemPrefersDark
const themeStore = useSiderColor();

// 🔥 监听主题相关状态变化（含跨窗口同步后的状态更新）
watch(
  () => [
    themeStore.systemPrefersDark,
    themeStore.previewThemeMode,
    themeStore.currentThemeType,
    themeStore.currentPaletteIndex,
    themeStore.systemBaseType,
    themeStore.systemBaseIndex,
    themeStore.currentSystemVariant,
  ],
  () => {
    forceUpdate.value++;
    console.log("🔄 Sidebar: theme changed");
  },
  { immediate: true, deep: true },
);

const showUserInfo = ref(false);
const isLoadingUserInfo = ref(false);
const popupDelay = ref(0.15);

const showCustomMenu = ref(false);
const toggleCustomMenu = () => {
  showCustomMenu.value = !showCustomMenu.value;
};
const closeCustomMenu = () => {
  showCustomMenu.value = false;
};
const currentColor = computed(() => {
  const _ = forceUpdate.value;
  try {
    return themeStore.currentColor;
  } catch (e) {
    return "#336699";
  }
});

const currentColorPalette = computed(() => {
  const _ = forceUpdate.value;
  try {
    return themeStore.currentColorPalette;
  } catch (e) {
    console.error("获取主题配置失败:", e);
    return null;
  }
});

// ❌ 删除原来的 gradientStyles，改用固定的 CSS 类

// 🔥 强制依赖 forceUpdate 的 sidebarStyles
const sidebarStyles = computed(() => {
  const _ = forceUpdate.value;
  try {
    const styles = themeStore.getSidebarStyles();
    const bgValue = styles.backgroundColor;
    if (typeof bgValue === "string" && bgValue.includes("gradient")) {
      return {
        ...styles,
        background: bgValue,
        backgroundColor: "transparent",
      };
    }
    return styles;
  } catch (e) {
    console.error("获取侧边栏样式失败:", e);
    return {};
  }
});

const userStore = useUserStore();
const userAvatar = computed(() => userStore.userAvatar);
const userNickname = computed(() => userStore.userNickname);

const toggleUserInfo = () => {
  showUserInfo.value = !showUserInfo.value;
  if (showUserInfo.value) {
    isLoadingUserInfo.value = true;
    setTimeout(() => {
      isLoadingUserInfo.value = false;
    }, 200);
  } else {
    isLoadingUserInfo.value = false;
  }
};

const closeUserInfo = () => {
  showUserInfo.value = false;
  isLoadingUserInfo.value = false;
};

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node;
  const avatarEl = document.querySelector(".user-avatar");
  const popupEl = document.querySelector(".user-info-popup");
  if (avatarEl && popupEl && !avatarEl.contains(target) && !popupEl.contains(target))
    closeUserInfo();

  const menuTrigger = document.querySelector(".menu-trigger-btn");
  const menuPanel = document.querySelector(".custom-dropdown-menu");
  if (menuTrigger && menuPanel && !menuTrigger.contains(target) && !menuPanel.contains(target))
    closeCustomMenu();
};

// 账号图标点击处理 - 跳转到账户安全页面
const handleAccountClick = () => {
  closeUserInfo();
  closeCustomMenu();
  router.push("/user/safe");
};

const handleLogout = () => {
  isLoadingUserInfo.value = true;
  userStore.logout();
  isLoadingUserInfo.value = false;
  closeCustomMenu();
};

// ===== 编辑资料相关 =====
const isEditing = ref(false);
const isSubmitting = ref(false);
const editAvatar = ref("");

const genderOptions: Record<number, string> = { 0: "男", 1: "女", 2: "保密" };

const constellationOptions = [
  { label: "白羊座 (03/21 - 04/19)", value: "白羊座" },
  { label: "金牛座 (04/20 - 05/20)", value: "金牛座" },
  { label: "双子座 (05/21 - 06/21)", value: "双子座" },
  { label: "巨蟹座 (06/22 - 07/22)", value: "巨蟹座" },
  { label: "狮子座 (07/23 - 08/22)", value: "狮子座" },
  { label: "处女座 (08/23 - 09/22)", value: "处女座" },
  { label: "天秤座 (09/23 - 10/23)", value: "天秤座" },
  { label: "天蝎座 (10/24 - 11/22)", value: "天蝎座" },
  { label: "射手座 (11/23 - 12/21)", value: "射手座" },
  { label: "摩羯座 (12/22 - 01/19)", value: "摩羯座" },
  { label: "水瓶座 (01/20 - 02/18)", value: "水瓶座" },
  { label: "双鱼座 (02/19 - 03/20)", value: "双鱼座" },
];

const currentYear = new Date().getFullYear();
const yearList = computed(() => {
  const years: number[] = [];
  for (let y = currentYear; y >= 1900; y--) years.push(y);
  return years;
});
const dayList = computed(() => {
  let days = 31;
  if (editForm.birthYear && editForm.birthMonth) {
    days = new Date(editForm.birthYear, editForm.birthMonth, 0).getDate();
  }
  const dList: number[] = [];
  for (let d = 1; d <= days; d++) dList.push(d);
  return dList;
});

const editForm = reactive({
  nickname: "",
  email: "",
  gender: undefined as number | undefined,
  birthYear: undefined as number | undefined,
  birthMonth: undefined as number | undefined,
  birthDay: undefined as number | undefined,
  birthday: "",
  constellation: undefined as string | undefined,
  hometown: "",
  bio: "",
});

const updateBirthday = () => {
  if (editForm.birthYear && editForm.birthMonth && editForm.birthDay) {
    const y = editForm.birthYear;
    const m = String(editForm.birthMonth).padStart(2, "0");
    const d = String(editForm.birthDay).padStart(2, "0");
    editForm.birthday = `${y}-${m}-${d}`;
  } else {
    editForm.birthday = "";
  }
};

const parseBirthday = (birthdayStr: string) => {
  if (!birthdayStr) return;
  const parts = birthdayStr.split("-");
  if (parts.length === 3) {
    editForm.birthYear = parseInt(parts[0]);
    editForm.birthMonth = parseInt(parts[1]);
    editForm.birthDay = parseInt(parts[2]);
  }
};

import { isEditingLock } from "../untils/uiState";

const startEdit = () => {
  const u = userStore.user;
  if (!u) return;
  editAvatar.value = "";
  editForm.nickname = u.nickname || "";
  editForm.email = u.email || "";
  editForm.gender = u.gender ?? undefined;
  editForm.bio = u.bio || "";
  editForm.hometown = u.hometown || "";
  editForm.birthday = u.birthday || "";
  editForm.constellation = u.constellation || undefined;
  parseBirthday(u.birthday || "");
  isEditing.value = true;
  isEditingLock.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  editAvatar.value = "";
  isEditingLock.value = false;
};

const selectAvatar = () => {
  if (!isEditing.value) return;
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = "image/jpeg,image/png,image/webp";
  inp.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      message.error("图片不能超过2MB");
      return;
    }
    await uploadAvatar(file);
  };
  inp.click();
};

const tempAvatarFilename = ref("");

const uploadAvatar = async (file: File) => {
  if (!userStore.user?.id) {
    message.error("用户信息不存在");
    return;
  }
  const fd = new FormData();
  fd.append("avatar", file);
  fd.append("userId", String(userStore.user.id));
  try {
    const res = await request.post("/avatar/temp", fd);
    editAvatar.value = res.data.avatar || res.data.url || "";
    tempAvatarFilename.value = res.data.tempFilename || "";
    message.success("头像上传成功");
  } catch {
    message.error("上传失败");
  }
};

const saveProfile = async () => {
  if (!userStore.user?.id) {
    message.error("用户信息不存在");
    return;
  }
  if (!editForm.nickname.trim()) {
    message.error("请填写昵称");
    return;
  }
  if (!editForm.email.trim()) {
    message.error("请填写邮箱");
    return;
  }
  isSubmitting.value = true;
  try {
    // 如果有临时头像，先确认头像
    if (editAvatar.value && tempAvatarFilename.value) {
      await request.post("/avatar/confirm", {
        userId: userStore.user.id,
        tempFilename: tempAvatarFilename.value,
      });
    }
    const updateData: Record<string, any> = {
      nickname: editForm.nickname,
      email: editForm.email,
      gender: editForm.gender,
      bio: editForm.bio,
      hometown: editForm.hometown,
      birthday: editForm.birthday,
      constellation: editForm.constellation,
    };
    const res = await userStore.updateProfile(updateData);
    if (res && res.dataValues) {
      userStore.setUser({ ...userStore.user, ...res.dataValues } as any);
    } else if (res) {
      userStore.setUser({ ...userStore.user, ...res } as any);
    }
    message.success("保存成功");
    isEditing.value = false;
    editAvatar.value = "";
    isEditingLock.value = false;
  } catch {
    message.error("保存失败");
  } finally {
    isSubmitting.value = false;
  }
};

onUnmounted(() => {
  // 组件卸载时确保解除锁定
  isEditingLock.value = false;
});

const handleManageInfo = async () => {
  closeCustomMenu();
  // 低频页面统一走浮层渲染（中间件 window-manager 自动拦截转为浮层）
  router.push("/settings/notification");
};

const handleCheckUpdate = async () => {
  closeCustomMenu();
  try {
    const res = await request.get("/updatelogs/latest");
    let latestData = null;
    if (res && res.data) {
      latestData = res.data;
    } else if (res && typeof res === "object") {
      latestData = res;
    }
    if (!latestData || !latestData.hasUpdate) {
      message.info("当前已是最新版本");
      return;
    }
    const latestLog = latestData.latestLog;
    if (!latestLog) {
      message.info("暂无更新内容");
      return;
    }
    const localVersion = localStorage.getItem("lastViewedUpdateVersion");
    if (localVersion && localVersion === latestLog.version) {
      message.info("当前已是最新版本");
      return;
    }
    localStorage.setItem("lastViewedUpdateVersion", latestLog.version);
    message.success(`发现新版本: ${latestLog.version}`);
    setTimeout(() => {
      // 低频页面统一走浮层渲染（中间件自动拦截转为浮层）
      router.push("/updateLogs");
    }, 1000);
  } catch (err) {
    console.error("检查更新失败:", err);
    message.error("检查更新失败,请稍后重试");
  }
};

const handleCommand = async (command: string) => {
  switch (command) {
    case "manageInfo":
      await handleManageInfo();
      break;
    case "supercolorpalette":
      router.push("/settings/supercolorpalette");
      closeCustomMenu();
      break;
    case "checkUpdate":
      await handleCheckUpdate();
      break;
    case "logout":
      handleLogout();
      break;
  }
};

const switchArea = async (area: Props["currentArea"]) => {
  if (props.currentArea !== area) {
    closeUserInfo();
    closeCustomMenu();
    await nextTick();
    setTimeout(() => {
      router.push(`/${area}`);
    }, 50);
  }
};

const getGenderText = (gender: number | undefined) => {
  if (gender == null) return "未设置";
  switch (gender) {
    case 0:
      return "男";
    case 1:
      return "女";
    case 2:
      return "保密";
    default:
      return "未知";
  }
};

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

onMounted(async () => {
  document.addEventListener("click", handleClickOutside);
  themeStore.initTheme();

  if (!userStore.user || !userStore.user.avatar) {
    try {
      await userStore.initializeAuth();
      if (!userStore.user) {
        await userStore.fetchUserInfo(true);
      }
    } catch (err) {
      console.error("Sidebar: 获取用户信息失败:", err);
    }
  }
});
</script>

<style lang="scss" scoped>
$sidebar-width: 60px;
$popup-width: 500px;
$transition-duration: 0.25s;
$popup-delay: var(--popup-delay, 0.15s);

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.content-fade-enter-from {
  opacity: 0;
  transform: translateY(5px);
}
.content-fade-enter-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.content-fade-leave-to {
  opacity: 0;
}
.content-fade-leave-active {
  transition: opacity 0.15s ease;
}

.qq-sidebar {
  width: $sidebar-width;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  gap: 20px;
  position: relative;
  height: 100%;
  transition: all $transition-duration ease;
  border-right: 1px solid var(--border-color);
  .space-between-btns {
    margin-bottom: 80px;
    width: 100%;
  }

  .user-avatar-wrapper {
    position: relative;

    .user-avatar {
      margin-bottom: 10px;
      cursor: pointer;
      transition: transform 0.2s ease;
      &:hover {
        transform: scale(1.05);
      }
    }

    .user-info-popup {
      position: absolute;
      left: calc(100% + 10px);
      top: 0;
      width: $popup-width;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      padding: 24px;
      z-index: 9999;
      border: 1px solid rgba(255, 255, 255, 0.3);
      overflow: hidden;
      color: var(--text-primary);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);

      opacity: 0;
      transform: translateX(-20px) scale(0.95);
      visibility: hidden;
      transition:
        opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
        visibility 0s linear $popup-delay;

      &.popup-visible {
        opacity: 1;
        transform: translateX(0) scale(1);
        visibility: visible;
        transition:
          opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
          transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
          visibility 0s linear 0s;
      }

      // 🌈 固定的淡雅双色渐变背景
      .popup-gradient-bg {
        position: absolute;
        inset: 0;
        z-index: 0;
        border-radius: inherit;
        // 淡雅双色渐变 - 跟随主题切换
        background: linear-gradient(
          135deg,
          var(--bg-secondary) 0%,
          var(--bg-tertiary) 50%,
          var(--bg-secondary) 100%
        );
        // 其他双色方案示例：
        // 粉紫: linear-gradient(135deg, #fce4ec 0%, #f3e5f5 100%)
        // 青蓝: linear-gradient(135deg, #e0f7fa 0%, #e3f2fd 100%)
        // 橙黄: linear-gradient(135deg, #fff3e0 0%, #fbe9e7 100%)
        // 薄荷: linear-gradient(135deg, #e0f2f1 0%, #e8f5e9 100%)
      }

      .popup-glow-layer {
        position: absolute;
        inset: 0;
        z-index: 0;
        border-radius: inherit;
        background:
          radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.5) 0%, transparent 60%),
          radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
        opacity: 0.6;
        animation: glowPulse 4s ease-in-out infinite alternate;
        pointer-events: none;
      }

      @keyframes glowPulse {
        0% {
          opacity: 0.4;
          transform: scale(1);
        }
        50% {
          opacity: 0.7;
          transform: scale(1.02);
        }
        100% {
          opacity: 0.5;
          transform: scale(0.98);
        }
      }

      .skeleton-loading {
        position: relative;
        z-index: 1;
        .skeleton-header {
          display: flex;
          align-items: center;
          margin-bottom: 18px;
          .skeleton-avatar {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            margin-right: 14px;
            overflow: hidden;
            position: relative;
            backdrop-filter: blur(4px);
            &::after {
              content: "";
              position: absolute;
              top: 0;
              left: -100%;
              width: 50%;
              height: 100%;
              background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.2),
                transparent
              );
              animation: skeleton-loading 1.5s infinite;
            }
          }
          .skeleton-text {
            flex: 1;
            .skeleton-line {
              height: 20px;
              background: rgba(255, 255, 255, 0.3);
              border-radius: 4px;
              margin-bottom: 8px;
              overflow: hidden;
              position: relative;
              backdrop-filter: blur(4px);
              &::after {
                content: "";
                position: absolute;
                top: 0;
                left: -100%;
                width: 50%;
                height: 100%;
                background: linear-gradient(
                  90deg,
                  transparent,
                  rgba(255, 255, 255, 0.2),
                  transparent
                );
                animation: skeleton-loading 1.5s infinite;
              }
              &.skeleton-line-lg {
                width: 70%;
                height: 24px;
              }
              &.skeleton-line-sm {
                width: 50%;
                height: 16px;
              }
            }
          }
        }
        .skeleton-details {
          margin-bottom: 18px;
          .skeleton-line {
            height: 20px;
            background: rgba(255, 255, 255, 0.25);
            border-radius: 4px;
            margin-bottom: 8px;
            overflow: hidden;
            position: relative;
            backdrop-filter: blur(4px);
            &::after {
              content: "";
              position: absolute;
              top: 0;
              left: -100%;
              width: 50%;
              height: 100%;
              background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.2),
                transparent
              );
              animation: skeleton-loading 1.5s infinite;
            }
          }
        }
        .skeleton-actions {
          display: flex;
          gap: 12px;
          .skeleton-btn {
            flex: 1;
            height: 36px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            backdrop-filter: blur(4px);
            &::after {
              content: "";
              position: absolute;
              top: 0;
              left: -100%;
              width: 50%;
              height: 100%;
              background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.2),
                transparent
              );
              animation: skeleton-loading 1.5s infinite;
            }
          }
        }
      }

      .user-info-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .user-info-header {
        display: flex;
        align-items: center;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(200, 200, 210, 0.3);
        .popup-avatar-wrapper {
          position: relative;
          margin-right: 14px;
          cursor: pointer;
          .popup-avatar {
            border: 2px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          }
          .avatar-edit-overlay {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s;
          }
          &:hover .avatar-edit-overlay {
            opacity: 1;
          }
        }
        .user-info-text {
          .user-nickname-wrap {
            .user-nickname {
              font-size: 18px;
              font-weight: 600;
              color: var(--text-primary);
              text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
            }
          }
          .user-username {
            font-size: 13px;
            color: var(--text-secondary);
            margin-top: 2px;
          }
        }
      }

      .user-info-details {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
        padding: 2px 0;
        .info-label {
          width: 60px;
          color: var(--text-tertiary);
          font-weight: 400;
        }
        .info-value {
          color: var(--text-primary);
          flex: 1;
          text-align: right;
          font-weight: 450;
        }
      }

      .user-info-actions {
        display: flex;
        gap: 12px;
        padding-top: 16px;
        border-top: 1px solid rgba(200, 200, 210, 0.3);
        margin-top: 4px;
        .action-btn {
          flex: 1;
          height: 40px;
          border-radius: 10px;
          border: none;
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          cursor: pointer;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 500;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          // &:hover {
          //   background: rgba(255, 255, 255, 0.6);
          //   transform: translateY(-1px);
          //   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          // }
          // &:active {
          //   transform: translateY(0) scale(0.98);
          // }
          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          &.edit-profile-btn {
            background: rgba(255, 255, 255, 0.25);
            &:hover {
              background: rgba(255, 255, 255, 0.5);
            }
          }
          &.save-btn {
            background: rgba(99, 102, 241, 0.6);
            color: #fff;
            &:hover:not(:disabled) {
              background: rgba(99, 102, 241, 0.8);
            }
          }
          &.cancel-btn {
            background: rgba(255, 255, 255, 0.25);
            &:hover {
              background: rgba(255, 255, 255, 0.45);
            }
          }
        }
      }

      // 编辑模式样式
      .edit-mode {
        gap: 6px;
        .info-item {
          flex-direction: row;
          align-items: center;
          .info-label {
            width: 44px;
            flex-shrink: 0;
            font-size: 12px;
          }
        }
      }

      .edit-input {
        flex: 1;
        padding: 4px 8px;
        font-size: 12px;
        color: var(--text-primary);
        background: var(--card-bg);
        border: 1px solid rgba(200, 202, 215, 0.4);
        border-radius: 6px;
        outline: none;
        font-family: inherit;
        transition: all 0.2s;
        &:focus {
          border-color: #6366f1;
          background: rgba(255, 255, 255, 0.85);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }
        &::placeholder {
          color: #b8bcc8;
        }
      }

      .nickname-input {
        font-size: 16px;
        font-weight: 600;
        width: 100%;
      }

      .gender-group {
        display: flex;
        gap: 6px;
        .gender-btn {
          padding: 2px 10px;
          border-radius: 6px;
          border: 1px solid rgba(200, 202, 215, 0.4);
          background: rgba(255, 255, 255, 0.5);
          font-size: 11px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          &:hover {
            border-color: #6366f1;
            color: #6366f1;
          }
          &.active {
            background: #6366f1;
            border-color: #6366f1;
            color: #fff;
          }
        }
      }

      .birthday-group {
        display: flex;
        gap: 4px;
        .mini-select {
          flex: 1;
          padding: 3px 4px;
          font-size: 11px;
          color: var(--text-primary);
          background: var(--card-bg);
          border: 1px solid rgba(200, 202, 215, 0.4);
          border-radius: 6px;
          outline: none;
          cursor: pointer;
          &:focus {
            border-color: #6366f1;
          }
        }
      }
    }
  }

  .sidebar-btn {
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    cursor: pointer;
    color: var(--sidebar-icon-color);
    transition: all 0.2s;
    &.active {
      background: var(--sidebar-item-active-bg);
      color: var(--sidebar-icon-active-color);
    }
    &:hover {
      background: var(--sidebar-item-hover-bg);
    }
  }

  .sidebar-bottom {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-bottom: 20px;
    position: relative;
    z-index: 999;
  }

  .custom-dropdown-menu {
    position: absolute;
    left: calc(100% + 10px);
    top: -95px;
    width: 160px;
    background: var(--card-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    z-index: 1000;
    padding: 6px 0;
    border: 1px solid var(--border-color);
    .dropdown-item {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      cursor: pointer;
      font-size: 14px;
      color: var(--text-primary);
      transition: all 0.15s;
      &:hover {
        background: var(--bg-hover);
      }
      .item-icon {
        margin-right: 10px;
        font-size: 16px;
        opacity: 0.7;
      }
      .item-text {
        font-weight: 450;
      }
    }
    .dropdown-divider {
      height: 1px;
      background: var(--border-color);
      margin: 4px 12px;
    }
    .logout-item {
      color: var(--error-color);
      &:hover {
        background: var(--error-bg);
      }
    }
  }
}

@keyframes skeleton-loading {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
</style>
