<template>
  <div id="geetest-captcha-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const emit = defineEmits(["verified", "error", "loaded"]);

let captcha: any = null;
const isLoaded = ref(false);
const isInitializing = ref(false);
const isScriptLoaded = ref(false);
let scriptLoadedPromise: Promise<boolean> | null = null;

// 极验验证码类型定义
interface GeetestValidateResult {
  lot_number: string;
  captcha_output: string;
  pass_token: string;
  gen_time: string;
}

// 声明全局变量类型
declare global {
  interface Window {
    initGeetest4: (
      options: {
        captchaId: string;
        product?: string;
        language?: string;
        riskType?: string;
      },
      callback: (captcha: any) => void,
    ) => void;
  }
}

// 加载极验JS脚本（Nuxt3 适配版）
const loadGeetestScript = (): Promise<boolean> => {
  // 避免重复加载
  if (scriptLoadedPromise) return scriptLoadedPromise;

  scriptLoadedPromise = new Promise((resolve) => {
    // 检查是否已加载
    if (isScriptLoaded.value || typeof window.initGeetest4 !== "undefined") {
      isScriptLoaded.value = true;
      resolve(true);
      return;
    }

    // 动态加载极验 JS
    const script = document.createElement("script");
    script.src = "https://static.geetest.com/v4/gt4.js";
    script.async = true;
    script.onload = () => {
      isScriptLoaded.value = true;
      resolve(true);
    };
    script.onerror = () => {
      console.error("极验验证码JS加载失败");
      resolve(false);
    };
    document.head.appendChild(script);

    // 5秒超时处理
    setTimeout(() => {
      if (!isScriptLoaded.value) {
        console.error("极验验证码JS加载超时");
        resolve(false);
      }
    }, 5000);
  });

  return scriptLoadedPromise;
};
// 定义组件的 props
interface Props {
  riskType?: string;
}
const props = withDefaults(defineProps<Props>(), {
  riskType: "puzzle",
});
// 初始化极验验证码
const initGeetestCaptcha = (captchaId: string): Promise<boolean> => {
  return new Promise(async (resolve) => {
    try {
      // 第一步：加载JS文件
      const scriptLoaded = await loadGeetestScript();
      if (!scriptLoaded) {
        emit("error", new Error("极验验证码JS未加载"));
        resolve(false);
        return;
      }

      // 再次检查
      if (typeof window.initGeetest4 === "undefined") {
        emit("error", new Error("极验验证码JS未加载"));
        resolve(false);
        return;
      }

      if (isInitializing.value) {
        resolve(false);
        return;
      }

      // 清理旧实例
      if (captcha) {
        captcha.destroy();
        captcha = null;
      }

      isInitializing.value = true;

      // 极验配置（消消乐类型）
      const options = {
        captchaId: captchaId,
        product: "bind",
        language: "zh",
        riskType: props.riskType,
      };

      // 创建验证码实例
      window.initGeetest4(options, (captchaObj: any) => {
        isInitializing.value = false;
        captcha = captchaObj;

        if (!captcha) {
          console.error("极验验证码初始化失败：captchaObj为空");
          emit("error", new Error("验证码初始化失败"));
          resolve(false);
          return;
        }

        // 验证码就绪
        captcha.onReady(() => {
          isLoaded.value = true;
          emit("loaded", true);
          resolve(true);
        });

        // 验证成功
        captcha.onSuccess(() => {
          const result = captcha.getValidate() as GeetestValidateResult;
          if (result) {
            emit("verified", {
              lot_number: result.lot_number,
              captcha_output: result.captcha_output,
              pass_token: result.pass_token,
              gen_time: result.gen_time,
            });
          } else {
            emit("error", new Error("获取验证结果失败"));
          }
        });

        // 验证失败
        captcha.onError((error: any) => {
          console.error("极验验证失败:", error);
          emit("error", new Error("验证失败"));
        });

        // 挂载到容器
        try {
          captcha.appendTo("#geetest-captcha-container");
        } catch (error) {
          console.error("验证码添加到容器失败:", error);
          emit("error", new Error("验证码加载失败"));
          resolve(false);
        }
      });

      // 初始化超时
      setTimeout(() => {
        if (isInitializing.value) {
          isInitializing.value = false;
          console.error("极验验证码初始化超时");
          emit("error", new Error("验证码初始化超时"));
          resolve(false);
        }
      }, 10000);
    } catch (error) {
      isInitializing.value = false;
      console.error("初始化极验验证码失败:", error);
      emit("error", error);
      resolve(false);
    }
  });
};

// 显示验证码
const showCaptcha = async (captchaId: string): Promise<boolean> => {
  try {
    console.log("开始显示验证码，当前状态:", {
      captcha: !!captcha,
      isLoaded: isLoaded.value,
      isInitializing: isInitializing.value,
    });

    if (!captcha || !isLoaded.value) {
      console.log("验证码未初始化，开始初始化...");
      const initialized = await initGeetestCaptcha(captchaId);
      if (!initialized) {
        console.error("验证码初始化失败");
        return false;
      }
    }

    if (!captcha) {
      console.error("验证码实例不存在");
      emit("error", new Error("验证码实例不存在"));
      return false;
    }

    captcha.showCaptcha();
    return true;
  } catch (error) {
    console.error("显示验证码失败:", error);
    emit("error", error);
    return false;
  }
};

// 重置验证码
const resetCaptcha = () => {
  if (captcha) {
    try {
      captcha.reset();
    } catch (error) {
      console.error("重置验证码失败:", error);
    }
  }
};

// 获取验证结果
const getValidate = (): GeetestValidateResult | null => {
  return captcha ? captcha.getValidate() : null;
};

// 清理资源
const cleanup = () => {
  if (captcha) {
    try {
      captcha.destroy();
    } catch (e) {
      console.warn("清理验证码实例时出错:", e);
    }
    captcha = null;
  }
  isLoaded.value = false;
  isInitializing.value = false;
};

// 检查验证状态
const isVerified = (): boolean => {
  return captcha && captcha.getValidate() !== null;
};

// 检查加载状态
const isCaptchaLoaded = (): boolean => {
  return isLoaded.value;
};

onMounted(() => {
  // 组件挂载时预检查
  if (typeof window.initGeetest4 !== "undefined") {
    isScriptLoaded.value = true;
    emit("loaded", true);
  }
});

onUnmounted(() => {
  cleanup();
  scriptLoadedPromise = null; // 重置加载Promise
});

// 暴露方法
defineExpose({
  initGeetestCaptcha,
  showCaptcha,
  resetCaptcha,
  getValidate,
  cleanup,
  isVerified,
  isCaptchaLoaded,
});
</script>

<style scoped>
#geetest-captcha-container {
  min-height: 44px;
  width: 100%;
  position: relative;
}
</style>
