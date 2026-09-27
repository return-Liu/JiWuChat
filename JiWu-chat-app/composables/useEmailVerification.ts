import { ref, type Ref, reactive } from "vue";
import { message } from "ant-design-vue";

export interface UseEmailVerificationParams {
  request: any; // API请求实例
  geetestCaptchaRef: Ref<any>; // 极验验证码组件引用
  email: Ref<string>; // 邮箱地址引用
  verifyApiEndpoint?: string; // 极验验证接口端点
  resetVerifyApiEndpoint?: string; // 重置密码极验验证接口端点
  loginApiEndpoint?: string; // 登录接口端点
}

export interface RegisterForm {
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
  verificationCode: string;
}

// 注册表单数据
export const registerForm = reactive<RegisterForm>({
  nickname: "",
  email: "",
  password: "",
  confirmPassword: "",
  verificationCode: "",
});

export const useEmailVerification = (params: UseEmailVerificationParams) => {
  const {
    request,
    geetestCaptchaRef,
    email,
    verifyApiEndpoint = "/auth/verify-geetest-captcha",
    resetVerifyApiEndpoint = "/auth/verify-reset-geetest-captcha",
    loginApiEndpoint = "/auth/login",
  } = params;

  // 验证码相关状态
  const isEmailValid = ref(false);
  const verificationBtnText = ref("获取验证码");
  const verificationBtnDisabled = ref(false);
  const countdown = ref(0);
  const isSending = ref(false); // 防止重复发送
  let countdownInterval: ReturnType<typeof setInterval> | null = null;

  // 添加一个状态来跟踪当前操作类型
  const currentOperation = ref<"register" | "reset" | null>(null);

  // 邮箱格式验证
  const validateEmailFormat = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    isEmailValid.value = emailRegex.test(email.value.trim());
  };

  // 启动倒计时
  const startCountdown = () => {
    verificationBtnDisabled.value = true;
    countdown.value = 60;
    verificationBtnText.value = `${countdown.value}秒后重发`;

    // 清除已有定时器
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(() => {
      countdown.value--;
      verificationBtnText.value = `${countdown.value}秒后重发`;

      if (countdown.value <= 0) {
        clearInterval(countdownInterval!);
        verificationBtnDisabled.value = false;
        verificationBtnText.value = "重新发送";
      }
    }, 1000);
  };

  // 加载极验 SDK
  const loadGeetestSDK = () => {
    return new Promise((resolve, reject) => {
      // 检查是否已加载
      if (typeof (window as any).initGeetest4 !== "undefined") {
        resolve((window as any).initGeetest4);
        return;
      }

      // 创建 script 标签
      const script = document.createElement("script");
      script.src = "https://static.geetest.com/v4/gt4.js";
      script.async = true;

      script.onload = () => {
        if (typeof (window as any).initGeetest4 !== "undefined") {
          resolve((window as any).initGeetest4);
        } else {
          reject(new Error("极验 SDK 加载失败"));
        }
      };

      script.onerror = () => {
        reject(new Error("极验 SDK 加载出错"));
      };

      document.head.appendChild(script);
    });
  };

  // 验证成功后发送邮箱验证码
  const handleSendEmailCodeAfterVerification = async (geetestData: any) => {
    const hideLoading = message.loading("发送验证码中...", 0);

    try {
      // 使用currentOperation来确定要调用的API端点
      const apiEndpoint =
        currentOperation.value === "reset"
          ? resetVerifyApiEndpoint
          : verifyApiEndpoint;

      const verifyResponse = await request.post(apiEndpoint, {
        email: email.value,
        geetestData: geetestData,
      });

      message.success(verifyResponse.data.message);
      startCountdown();
    } catch (error: any) {
      if (error.response?.data?.data?.message) {
        message.error(error.response.data.data.message);
      }
      // 重置验证码
      if (geetestCaptchaRef.value) {
        geetestCaptchaRef.value.resetCaptcha();
      }
    } finally {
      hideLoading();
      isSending.value = false; // 重置发送状态
      currentOperation.value = null; // 重置操作类型
    }
  };

  // 处理登录验证
  const handleLoginWithGeetest = async (loginData: any) => {
    const hideLoading = message.loading("登录中...", 0);

    try {
      const response = await request.post(loginApiEndpoint, {
        ...loginData,
      });

      return response;
    } catch (error: any) {
      throw error;
    } finally {
      hideLoading();
    }
  };

  // 点击获取验证码
  const handleSendCodeClick = async (isResetPassword: boolean = false) => {
    if (!email.value) {
      message.error("请输入你的邮箱~");
      return;
    }
    if (!isEmailValid.value) {
      validateEmailFormat();
      message.error("请输入正确的邮箱格式");
      return;
    }

    if (isSending.value || verificationBtnDisabled.value) {
      return;
    }

    // 设置当前操作类型
    currentOperation.value = isResetPassword ? "reset" : "register";

    isSending.value = true;
    const hideLoading = message.loading("加载验证码中...", 0);

    try {
      // 确保极验SDK已加载
      await loadGeetestSDK();

      // 获取极验配置（请求加密版本）
      const configResponse = await request.get("/auth/geetest-config");
      // 处理新的API响应格式，支持加密和未加密的ID
      let captchaId = configResponse.data.captchaId || configResponse.data.encryptedCaptchaId;

      // 显示极验验证码
      if (geetestCaptchaRef.value) {
        const success = await geetestCaptchaRef.value.showCaptcha(captchaId);
        if (!success) {
          message.error("验证码加载失败，请刷新页面重试");
        }
      } else {
        console.error("验证码组件引用为空");
        message.error("验证码组件未初始化");
      }
    } catch (error: any) {
      if (error.response?.data?.data?.message) {
        message.error(error.response.data.data.message);
      } else {
        message.error("验证码加载失败，请稍后重试");
      }
    } finally {
      hideLoading();
      // 仅在真正失败时重置
      if (!verificationBtnDisabled.value) {
        isSending.value = false;
      }
    }
  };

  // 极验验证错误处理
  const handleGeetestError = (error: any) => {
    console.error("极验验证码错误:", error);
    message.error(error?.message || "验证码操作失败，请重试");
    isSending.value = false;
    currentOperation.value = null; // 重置操作类型
  };

  // 极验加载完成
  const handleGeetestLoaded = () => {
    console.log("极验验证码组件加载完成");
  };

  // 清理定时器
  const cleanup = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    currentOperation.value = null; // 清理操作类型
  };

  return {
    isEmailValid,
    verificationBtnText,
    verificationBtnDisabled,
    countdown,
    isSending,
    validateEmailFormat,
    startCountdown,
    loadGeetestSDK,
    handleSendEmailCodeAfterVerification,
    handleLoginWithGeetest,
    handleSendCodeClick,
    handleGeetestError,
    handleGeetestLoaded,
    cleanup,
  };
};
