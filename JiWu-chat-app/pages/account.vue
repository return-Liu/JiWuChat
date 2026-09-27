<template>
  <div class="account-dashboard">
    <aside class="account-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-avatar">
          <img :src="userInfo?.avatar || defaultAvatar" alt="用户头像" class="avatar-img" />
        </div>
        <div class="sidebar-profile">
          <h3 class="sidebar-name">{{ userInfo?.nickname || "未命名用户" }}</h3>
          <p class="sidebar-account">账号：{{ userInfo?.username || "未知账号" }}</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li class="nav-item active">个人资料</li>
          <li class="nav-item" @click="resetpassword">修改密码</li>
          <li class="nav-item" @click="addphone" v-if="!userInfo?.phone">绑定手机</li>
          <li class="nav-item" @click="deleteaccount">注销账号</li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <button class="back-btn" @click="back">离开当前界面</button>
      </div>
    </aside>

    <main class="account-main">
      <div class="main-header">
        <h2 class="main-title">个人账号管理</h2>
        <button class="edit-btn" @click="editaccount">编辑资料</button>
      </div>

      <div v-if="isNewVersion" class="card-container">
        <div class="loading-container" v-if="loading">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>

        <div class="profile-card" v-if="!loading && userInfo">
          <div class="card-header">
            <h3 class="card-title">个性签名</h3>
          </div>
          <div class="card-content bio-content">
            {{ userInfo.bio || "这个人很懒，什么都没留下~" }}
          </div>
        </div>

        <div class="info-card" v-if="!loading && userInfo">
          <div class="card-header">
            <h3 class="card-title">基础信息</h3>
          </div>
          <div class="card-content">
            <div class="info-grid">
              <div class="info-item" v-for="(item, index) in basicDetailList" :key="index">
                <div class="info-label">{{ item.label }}</div>
                <div class="info-value">{{ item.value }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="security-card" v-if="!loading && userInfo">
          <div class="card-header">
            <h3 class="card-title">账号安全</h3>
          </div>
          <div class="card-content">
            <div class="security-items">
              <div class="security-item">
                <div class="security-info">
                  <h4>密码安全</h4>
                  <p>
                    上次修改：{{
                      userInfo &&
                      userInfo.passwordUpdateTime !== undefined &&
                      userInfo.passwordUpdateTime !== null
                        ? formatDate(userInfo.passwordUpdateTime)
                        : "从未修改"
                    }}
                  </p>
                </div>
                <button class="security-action" @click="resetpassword">修改</button>
              </div>
              <div class="security-item">
                <div class="security-info">
                  <h4>手机绑定</h4>
                  <p>{{ userInfo?.phone || "未绑定" }}</p>
                </div>
                <button class="security-action" @click="addphone" v-if="!userInfo?.phone">
                  绑定
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <OldVersionAccount v-else :loading="loading" @add-phone="addphone" />

      <div v-if="showVersionHint && isNewVersion" class="version-hint">
        <div class="hint-content">
          <div class="hint-header">
            <h3>欢迎体验新版界面</h3>
            <button class="hint-close" @click="closeVersionHint">✕</button>
          </div>
          <div class="hint-body">
            <p class="hint-description">
              我们重新设计了账号管理页面，让你的信息更清晰，操作更简单。
            </p>
            <div class="hint-features">
              <div class="feature-item">
                <div class="feature-text">
                  <span class="feature-title">信息分类展示</span>
                  <span class="feature-desc">各项信息一目了然</span>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-text">
                  <span class="feature-title">重点信息突出</span>
                  <span class="feature-desc">安全状态清晰可见</span>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-text">
                  <span class="feature-title">便捷操作</span>
                  <span class="feature-desc">常用功能触手可及</span>
                </div>
              </div>
            </div>
          </div>
          <div class="hint-footer">
            <button class="hint-action hint-secondary" @click="closeVersionHint">
              继续使用新版
            </button>
            <button class="hint-action hint-primary" @click="toggleVersion">切换回旧版</button>
          </div>
        </div>
      </div>

      <div v-if="showBackToNewHint && !isNewVersion" class="version-hint">
        <div class="hint-content">
          <div class="hint-header">
            <h3>试试我们的新版界面</h3>
            <button class="hint-close" @click="closeBackToNewHint">✕</button>
          </div>
          <div class="hint-body">
            <p class="hint-description">我们重新设计了界面，带来更现代的外观和更流畅的操作体验。</p>
            <div class="hint-features">
              <div class="feature-item">
                <div class="feature-text">
                  <span class="feature-title">清新设计</span>
                  <span class="feature-desc">简洁舒适，观感愉悦</span>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-text">
                  <span class="feature-title">流畅体验</span>
                  <span class="feature-desc">快速响应，操作顺滑</span>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-text">
                  <span class="feature-title">清晰布局</span>
                  <span class="feature-desc">信息结构明了，查找方便</span>
                </div>
              </div>
            </div>
          </div>
          <div class="hint-footer">
            <button class="hint-action hint-secondary" @click="closeBackToNewHint">暂不切换</button>
            <button class="hint-action hint-primary" @click="toggleVersion">立即体验</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/user";
import { useSiderColor } from "../stores/siderColor";
import { message } from "ant-design-vue";
import { useOverlayClose } from "../composables/useOverlayClose";

const router = useRouter();
const { closeOrBack, goToMain } = useOverlayClose();
const userStore = useUserStore();
const siderColorStore = useSiderColor();
const defaultAvatar = "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png";

const isNewVersion = ref(true);
const showVersionHint = ref(true);
const showBackToNewHint = ref(true);

const toggleVersion = () => {
  isNewVersion.value = !isNewVersion.value;
  localStorage.setItem("accountPageVersion", isNewVersion.value ? "new" : "old");
  if (isNewVersion.value) {
    showVersionHint.value = true;
    showBackToNewHint.value = false;
  } else {
    showVersionHint.value = false;
    showBackToNewHint.value = true;
  }
};

const closeVersionHint = () => {
  showVersionHint.value = false;
};
const closeBackToNewHint = () => {
  showBackToNewHint.value = false;
};

const deleteaccount = () => {
  router.push("/deleteaccount");
};
const userInfo = computed(() => userStore.user);
const loading = computed(() => userStore.loading);

const formatDate = (date: string | Date | undefined | null) => {
  if (!date) return "未设置";
  let dateObj: Date;
  if (typeof date === "string") dateObj = new Date(date);
  else if (date instanceof Date) dateObj = date;
  else return "未设置";
  return isNaN(dateObj.getTime())
    ? "未设置"
    : dateObj.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
};

const resetpassword = () => {
  // 主窗口页面：浮层场景下先关闭浮层再跳转
  goToMain("/forgot-password");
};
const back = () => {
  // 浮层场景下关闭浮层，正常路由场景下跳转消息页
  closeOrBack();
};
const addphone = () => {
  if (userStore.user?.phone) {
    message.info("你已经添加过手机号了 无需添加");
    return;
  }
  router.push("/addphone");
};
const editaccount = () => {
  message.info("请点击左侧边栏头像，在弹窗中编辑资料");
};

const getGenderText = (gender: number | undefined) => {
  if (gender === undefined) return "未设置";
  return ["男", "女", "保密"][gender] || "未知";
};

const basicDetailList = computed(() => {
  const user = userInfo.value;
  return [
    { label: "手机号", value: user?.phone || "未设置" },
    { label: "邮箱", value: user?.email || "未设置" },
    { label: "性别", value: getGenderText(user?.gender) },
    { label: "星座", value: user?.constellation || "未设置" },
    { label: "年龄", value: user?.age ? `${user.age}岁` : "未设置" },
    {
      label: "生日",
      value: user?.birthday ? formatDate(user.birthday) : "未设置",
    },
    { label: "故乡", value: user?.hometown || "未设置" },
  ];
});

onMounted(async () => {
  await userStore.fetchUserInfo();
  await siderColorStore.initTheme();
  const storedVersion = localStorage.getItem("accountPageVersion");
  if (storedVersion !== null) isNewVersion.value = storedVersion === "new";
  if (isNewVersion.value) {
    showVersionHint.value = true;
    showBackToNewHint.value = false;
  } else {
    showVersionHint.value = false;
    showBackToNewHint.value = true;
  }
});
</script>

<style scoped lang="scss">
.account-dashboard {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
}

.account-sidebar {
  width: 220px;
  background: #fff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e5e5;

  .sidebar-header {
    padding: 20px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #e5e5e5;

    .sidebar-avatar {
      .avatar-img {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
      }
    }

    .sidebar-profile {
      .sidebar-name {
        font-size: 14px;
        font-weight: 500;
        margin: 0 0 2px 0;
        color: #1a1a1a;
      }
      .sidebar-account {
        font-size: 11px;
        color: #8e8e93;
        margin: 0;
      }
    }
  }

  .sidebar-nav {
    flex: 1;
    padding: 12px 0;

    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;

      .nav-item {
        padding: 10px 20px;
        cursor: pointer;
        font-size: 13px;
        color: #666;
        transition: all 0.2s;

        &:hover {
          background: #f5f5f5;
          color: #1a1a1a;
        }

        &.active {
          background: #f0f7ff;
          color: #007aff;
          font-weight: 500;
          border-right: 2px solid #007aff;
        }
      }
    }
  }

  .sidebar-footer {
    padding: 16px;
    border-top: 1px solid #e5e5e5;

    .back-btn {
      width: 100%;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #e5e5e5;
      background: transparent;
      color: #666;
      cursor: pointer;
      font-size: 13px;

      &:hover {
        background: #f5f5f5;
      }
    }
  }
}

.account-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;

  .main-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .main-title {
      font-size: 18px;
      font-weight: 500;
      color: #1a1a1a;
      margin: 0;
    }

    .edit-btn {
      padding: 6px 14px;
      border-radius: 6px;
      border: 1px solid #007aff;
      background: transparent;
      color: #007aff;
      cursor: pointer;
      font-size: 13px;

      &:hover {
        background: #007aff;
        color: #fff;
      }
    }
  }

  .card-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .profile-card,
  .info-card,
  .security-card {
    background: #fff;
    border-radius: 10px;
    border: 1px solid #e5e5e5;
    overflow: hidden;

    .card-header {
      padding: 12px 16px;
      border-bottom: 1px solid #e5e5e5;
      background: #fafafa;

      .card-title {
        font-size: 14px;
        font-weight: 500;
        color: #1a1a1a;
        margin: 0;
      }
    }

    .card-content {
      padding: 16px;
    }
  }

  .profile-card {
    .bio-content {
      font-size: 13px;
      color: #666;
      line-height: 1.5;
    }
  }

  .info-card {
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px 20px;

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .info-label {
          font-size: 11px;
          color: #8e8e93;
        }
        .info-value {
          font-size: 13px;
          color: #1a1a1a;
        }
      }
    }
  }

  .security-card {
    .security-items {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .security-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 10px;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .security-info {
          flex: 1;

          h4 {
            font-size: 13px;
            font-weight: 500;
            color: #1a1a1a;
            margin: 0 0 2px;
          }
          p {
            font-size: 11px;
            color: #8e8e93;
            margin: 0;
          }
        }

        .security-action {
          padding: 4px 12px;
          border-radius: 4px;
          border: 1px solid #007aff;
          background: transparent;
          color: #007aff;
          cursor: pointer;
          font-size: 12px;

          &:hover {
            background: #007aff;
            color: #fff;
          }
        }
      }
    }
  }

  .loading-container {
    background: #fff;
    border-radius: 10px;
    padding: 16px;
    border: 1px solid #e5e5e5;

    .skeleton-line {
      height: 14px;
      background: #e5e5e5;
      border-radius: 4px;
      margin-bottom: 12px;

      &.short {
        width: 60%;
      }
    }
  }

  .version-hint {
    position: fixed;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    z-index: 1000;
    width: 320px;
    animation: slideInRight 0.3s ease-out;

    .hint-content {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border: 1px solid #e5e5e5;
      overflow: hidden;

      .hint-header {
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        border-bottom: 1px solid #e5e5e5;

        h3 {
          font-size: 16px;
          font-weight: 500;
          color: #1a1a1a;
          margin: 0;
          flex: 1;
        }

        .hint-close {
          background: transparent;
          border: none;
          font-size: 14px;
          color: #8e8e93;
          cursor: pointer;
          width: 28px;
          height: 28px;

          &:hover {
            background: #f5f5f5;
            border-radius: 50%;
          }
        }
      }

      .hint-body {
        padding: 16px 20px;

        .hint-description {
          margin: 0 0 16px;
          font-size: 13px;
          color: #666;
          line-height: 1.5;
        }

        .hint-features {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .feature-item {
            .feature-text {
              .feature-title {
                font-size: 13px;
                font-weight: 500;
                color: #1a1a1a;
              }
              .feature-desc {
                font-size: 11px;
                color: #8e8e93;
              }
            }
          }
        }
      }

      .hint-footer {
        padding: 12px 20px;
        background: #fafafa;
        display: flex;
        gap: 10px;
        justify-content: flex-end;

        .hint-action {
          padding: 6px 16px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          border: none;

          &.hint-primary {
            background: #007aff;
            color: #fff;

            &:hover {
              background: #005fc1;
            }
          }

          &.hint-secondary {
            background: #fff;
            color: #666;
            border: 1px solid #e5e5e5;

            &:hover {
              background: #f5f5f5;
            }
          }
        }
      }
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateY(-50%) translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }
  }
}
</style>
