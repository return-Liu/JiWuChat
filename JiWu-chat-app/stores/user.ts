import { defineStore } from "pinia";
import { ref, computed } from "vue";
import request from "../untils/request";
import Cookies from "js-cookie";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";
import { useUiSettings } from "./uiSettings";
import { getSignalingService } from "../untils/signalingService";

// 独立定义User接口，避免和响应式变量重名
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  status: 0 | 1;
  nickname?: string;
  createdAt?: string;
  updatedAt?: string;
  gender?: number; // 性别: 0男, 1女, 2保密
  bio?: string; // 个性签名
  constellation?: string; // 星座
  age?: number; // 年龄
  birthday?: string; // 生日
  hometown?: string; // 故乡
  phone: string;
  qq_openid?: string; // QQ openid
  qq_nickname?: string; // QQ昵称
  qq_avatar?: string; // QQ头像
  passwordUpdateTime?: string; // 密码最后更新时间
  formattedPasswordUpdateTime?: string; // 格式化后的密码最后更新时间
  allowStrangerInvite?: boolean; // 是否允许陌生人邀请加入群聊
  searchableByQQ?: boolean; // 是否可通过QQ/邮箱搜索
  searchableByUsername?: boolean; // 是否可通过用户名搜索
  searchableByNickname?: boolean; // 是否可通过昵称搜索
  searchableByPhone?: boolean; // 是否可通过手机号搜索
  allowAddFriend?: boolean; // 是否允许被添加为好友
  allowAddFriendFromGroup?: boolean; // 是否允许从群聊添加为好友
  allowTemporaryChat?: boolean; // 是否允许发起临时会话
  onlineVisibility?: number; // 在线状态可见性: 0-所有人, 1-仅好友, 2-无人
}

export const useUserStore = defineStore("user", () => {
  const router = useRouter();

  // 1. 响应式状态
  const user = ref<UserInfo | null>(null);
  const token = ref<string | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // 2. 计算属性
  const userInfo = computed(() => user.value);
  const isAuthenticated = computed(() => !!token.value);
  const isLoggedIn = computed(() => !!token.value);
  const userAvatar = computed(
    () =>
      user.value?.avatar ||
      "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png",
  );
  const userNickname = computed(
    () => user.value?.nickname || user.value?.username || "未登录用户",
  );
  const userId = computed(() => user.value?.id);

  // 初始化信令服务
  const initializeSignalingService = async (userId: string) => {
    try {
      const signalingService = getSignalingService();
      await signalingService.connect(userId);
      console.log('[UserStore] 信令服务初始化成功');
    } catch (error) {
      console.error('[UserStore] 信令服务初始化失败:', error);
    }
  };

  // 3. 核心方法
  /**
   * 登录（存储token）
   * @param tokenData token字符串
   * @param skipFetch 是否跳过自动拉取用户信息（QQ登录时使用）
   */
  const login = async (tokenData: string, skipFetch = false) => {
    token.value = tokenData;
    Cookies.set("token", tokenData);

    // QQ登录时跳过自动拉取，避免覆盖刚设置的用户信息
    if (!skipFetch) {
      try {
        await fetchUserInfo();
      } catch (err) {
        console.error("登录后拉取用户信息失败:", err);
      }
    } else {
      // QQ登录时，如果已经有用户信息，立即设置UI Store的用户ID
      if (user.value?.id) {
        const uiSettings = useUiSettings();
        uiSettings.setCurrentUser(user.value.id);
        // 初始化信令服务
        initializeSignalingService(String(user.value.id));
      }
    }
  };

  /**
   * 设置用户信息（用于QQ登录等场景）
   * @param userData 用户信息
   * @param persist 是否持久化到后端（默认false）
   */
  const setUser = async (userData: UserInfo, persist = false) => {
    if (!userData || !userData.id) {
      console.warn("setUser: 用户数据不完整，缺少 id 字段", userData);
      return;
    }

    user.value = { ...userData }; // 解构生成新对象，确保响应式

    // 缓存用户头像到 localStorage，供登录页使用
    if (userData.avatar) {
      try {
        localStorage.setItem("user-avatar", userData.avatar);
      } catch (e) {
        // localStorage 不可用时忽略
      }
    }

    // 设置UI Store的当前用户ID，触发字体设置加载
    const uiSettings = useUiSettings();
    uiSettings.setCurrentUser(userData.id);

    // 初始化信令服务
    initializeSignalingService(String(userData.id));

    // 如果需要持久化到后端（比如QQ登录后）
    if (persist && token.value) {
      try {
        await request.put("/users/update-profile", {
          avatar: userData.avatar,
          nickname: userData.nickname,
        });
      } catch (err) {
        console.warn("同步用户信息到后端失败:", err);
        // 不影响前端状态，仅提示
        message.info("头像已显示，刷新后可能需要重新同步");
      }
    }
  };

  /**
   * 初始化用户认证状态
   * @param skipFetch 是否跳过拉取用户信息
   */
  const initializeAuth = async (skipFetch = false) => {
    const cookieToken = Cookies.get("token");

    if (cookieToken) {
      token.value = cookieToken;

      if (!user.value && !skipFetch) {
        try {
          await fetchUserInfo();
        } catch (error: any) {
          console.error("初始化获取用户信息失败:", error);
          // 🔥 只在真正的 401 未授权时才清除 token
          // 网络超时、服务器暂时不可用等情况保留 token，避免误清除导致重复登录
          if (error?.response?.status === 401) {
            console.warn("token 已失效(401)，清除登录状态");
            token.value = null;
            Cookies.remove("token");
          } else {
            // 网络错误等非认证错误：保留 token，下次重试
            console.warn("非认证错误，保留 token 等待下次重试");
          }
        }
      } else if (user.value?.id) {
        // 如果已有用户信息，设置UI Store的用户ID
        const uiSettings = useUiSettings();
        uiSettings.setCurrentUser(user.value.id);
        // 初始化信令服务
        initializeSignalingService(String(user.value.id));
      }
    }
  };

  /**
   * 从后端拉取用户信息
   * @param force 是否强制拉取（忽略缓存）
   */
  const fetchUserInfo = async (force = false) => {
    const cookieToken = Cookies.get("token");
    if (!cookieToken) {
      loading.value = false;
      return null;
    }

    // 如果已有用户信息且不强制拉取，直接返回
    if (user.value && !force) {
      return user.value;
    }

    loading.value = true;
    try {
      const response = await request.get("/users/profile");
      user.value = response.data;

      // 缓存用户头像到 localStorage，供登录页使用
      if (response.data?.avatar) {
        try {
          localStorage.setItem("user-avatar", response.data.avatar);
        } catch (e) {
          // localStorage 不可用时忽略
        }
      }

      // 获取到用户信息后，设置UI Store的当前用户ID
      if (response.data?.id) {
        const uiSettings = useUiSettings();
        uiSettings.setCurrentUser(response.data.id);
        // 初始化信令服务
        initializeSignalingService(String(response.data.id));
      }

      return response.data;
    } catch (err: any) {
      // 如果是请求被取消，静默处理，不显示错误
      if (err.code === "ERR_CANCELED" || err.name === "CanceledError") {
        console.debug("用户信息请求被取消");
        return null;
      }

      error.value = err.message || "获取用户信息失败";
      console.error("拉取用户信息失败:", err);

      // 🔥 只在 401 未授权时才清除 token
      // 网络错误、超时等情况保留 token，不强制登出
      if (err.response && err.response.status === 401) {
        console.warn("token 已失效(401)，执行登出");
        logout();
      }
      // 非 401 错误（如网络超时、服务器错误）不登出，保留 token
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新用户资料
   */
  const updateProfile = async (profileData: Partial<UserInfo>) => {
    if (!token.value) {
      error.value = "未登录";
      message.error("请先登录");
      return null;
    }
    try {
      const response = await request.put(
        "/users/update-profile",
        profileData,
      );
      // 合并更新，保留原有字段
      user.value = { ...user.value, ...response.data } as UserInfo;

      // 如果更新了头像，同步缓存到 localStorage
      if (response.data?.avatar) {
        try {
          localStorage.setItem("user-avatar", response.data.avatar);
        } catch (e) {
          // localStorage 不可用时忽略
        }
      }

      return response.data;
    } catch (error: any) {
      message.error(error.response?.data?.data?.message);
    }
  };

  /**
   * 检查认证状态（轻量版，仅检查token）
   */
  const checkAuthStatus = () => {
    const storedToken = Cookies.get("token");
    if (storedToken) {
      token.value = storedToken;
    }
  };

  /**
   * 登出
   */
  const logout = async () => {
    try {
      const response = await request.post("auth/logout");
      Cookies.remove("token");
      router.push("/login");
      token.value = null;
      user.value = null;
      message.success(response.data.message);
    } catch (err) {
      console.warn("登出接口调用失败:", err);
    }
  };
  return {
    user,
    token,
    loading,
    error,
    userInfo,
    isAuthenticated,
    isLoggedIn,
    userAvatar,
    userNickname,
    userId,
    login,
    setUser,
    initializeAuth,
    fetchUserInfo,
    checkAuthStatus,
    updateProfile,
    logout,
  };
});