import { defineStore } from "pinia";
import { ref, computed, readonly } from "vue";
import {
  broadcastUiSettings,
  onUiSettingsChanged,
} from "../untils/electronHelper";

// ========== 类型定义 ==========
export interface UiSettings {
  fontSize: string; // 字体大小 (如："14", "16")
  fontFamily: string; // 字体类型 (如："system-ui", "Microsoft YaHei")
}

export interface FontOption {
  label: string; // 显示名称
  value: string; // CSS font-family 值
  type: "system"; // 字体类型：系统字体/网络字体
}

// ========== 常量定义 ==========
const DEFAULT_SETTINGS: UiSettings = {
  fontSize: "14",
  fontFamily: "'AlimamaShuHeiTi'",
};

const STORAGE_KEY_PREFIX = "user_ui_settings_";

/** 预定义的字体列表 */
const FONT_OPTIONS: FontOption[] = [
  // 阿里妈妈数黑体
  {
    label: "阿里妈妈数黑体",
    value: "'AlimamaShuHeiTi'",
    type: "system",
  },
  // 阿里妈妈东方大楷
  {
    label: "阿里妈妈东方大楷",
    value: "'Alimama Dongfang Dakai'",
    type: "system",
  },
  // 阿里巴巴普惠体
  {
    label: "阿里巴巴普惠体3.0",
    value: "Alibaba PuHuiTi",
    type: "system",
  },
  // 钉钉进步体
  {
    label: "钉钉进步体",
    value: "DingTalk JiJin",
    type: "system",
  },
  // 阿里妈妈刀隶体
  {
    label: "阿里妈妈刀隶体",
    value: "Alimama DiaoLiTi",
    type: "system",
  },
  // 得意黑
  {
    label: "得意黑",
    value: "SmileySans-Oblique",
    type: "system",
  },
  // 淘宝买菜体
  {
    label: "淘宝买菜体",
    value: "TaobaoMaiCaiTi",
    type: "system",
  },
  // 阿里妈妈灵动体
  {
    label: "阿里妈妈灵动体",
    value: "AlimamaAgileVF-Thin",
    type: "system",
  },
  // 
  {
    label: "字玩哥特黑白无常",
    value: "iWanGeTeHeiBaiWuChang",
    type: "system",
  },
];

// ========== 工具函数 ==========
const isClient = () => typeof window !== "undefined";

/**
 * 生成用户专属的存储键
 * @param userId 用户ID
 * @returns 存储键名
 */
const getUserStorageKey = (userId: number | string): string => {
  return `${STORAGE_KEY_PREFIX}${userId}`;
};

// ========== Pinia Store 定义 ==========
export const useUiSettings = defineStore("uiSettings", () => {
  // ========== 响应式状态 ==========
  const fontSize = ref<string>(DEFAULT_SETTINGS.fontSize);
  const fontFamily = ref<string>(DEFAULT_SETTINGS.fontFamily);
  const currentUserId = ref<number | string | null>(null);

  // ========== 计算属性 ==========
  /** 完整的字体设置对象 */
  const uiSettings = computed<UiSettings>(() => ({
    fontSize: fontSize.value,
    fontFamily: fontFamily.value,
  }));

  /** 当前字体大小的数值 */
  const fontSizeNumber = computed<number>(
    () => parseInt(fontSize.value, 10) || 14,
  );

  /** CSS 变量格式的字体大小 */
  const fontSizeWithUnit = computed<string>(() => `${fontSize.value}px`);

  /** 可用的字体选项列表 */
  const availableFonts = computed<FontOption[]>(() => FONT_OPTIONS);

  /** 当前选中的字体配置 */
  const currentFont = computed<FontOption | undefined>(() =>
    FONT_OPTIONS.find((font) => font.value === fontFamily.value),
  );

  // ========== 核心方法 ==========
  /**
   * 设置当前用户ID（应在用户登录后调用）
   * @param userId 用户ID
   */
  const setCurrentUser = (userId: number | string) => {
    currentUserId.value = userId;
    console.log(`[UI设置] 已设置当前用户ID: ${userId}`);

    // 设置用户ID后立即加载该用户的字体设置
    if (isClient()) {
      loadFromLocalStorage();
    }
  };

  /**
   * 清除当前用户ID（应在用户登出时调用）
   */
  const clearCurrentUser = () => {
    currentUserId.value = null;
    console.log("[UI设置] 已清除当前用户ID");
  };

  /**
   * 设置字体大小
   * @param size 字体大小值（字符串格式，如 "14"）
   */
  const setFontSize = (size: string) => {
    if (!size || isNaN(parseInt(size, 10))) {
      console.warn("无效的字体大小：", size);
      return;
    }

    fontSize.value = size;
    saveToLocalStorage();
    applyToCSS();
    syncAcrossWindows();
  };

  /**
   * 设置字体类型
   * @param family 字体类型字符串
   */
  const setFontFamily = async (family: string) => {
    if (!family) {
      return;
    }

    fontFamily.value = family;
    saveToLocalStorage();
    applyToCSS();
    syncAcrossWindows();
  };

  /**
   * 通过 FontOption 对象设置字体
   * @param font 字体配置对象
   */
  const setFontByOption = async (font: FontOption) => {
    await setFontFamily(font.value);
  };

  /**
   * 同时设置字体大小和类型
   * @param settings 字体设置对象
   */
  const setFontSettings = async (settings: Partial<UiSettings>) => {
    let changed = false;

    if (settings.fontSize && settings.fontSize !== fontSize.value) {
      fontSize.value = settings.fontSize;
      changed = true;
    }

    if (settings.fontFamily && settings.fontFamily !== fontFamily.value) {
      await setFontFamily(settings.fontFamily);
      changed = true;
    }

    if (changed) {
      saveToLocalStorage();
      applyToCSS();
      syncAcrossWindows();
    }
  };

  /**
   * 保存设置到 localStorage（用户专属）
   */
  const saveToLocalStorage = () => {
    if (!isClient()) return;

    const userId = currentUserId.value;

    // 如果没有用户ID，使用遗留键名（向后兼容）
    if (!userId) {
      try {
        const settings: UiSettings = {
          fontSize: fontSize.value,
          fontFamily: fontFamily.value,
        };
        localStorage.setItem(STORAGE_KEY_PREFIX + "legacy", JSON.stringify(settings));
      } catch (error) {
        console.error("保存设置失败:", error);
      }
      return;
    }

    try {
      const storageKey = getUserStorageKey(userId);
      const settings: UiSettings = {
        fontSize: fontSize.value,
        fontFamily: fontFamily.value,
      };
      localStorage.setItem(storageKey, JSON.stringify(settings));
      console.log(`[UI设置] 已保存用户 ${userId} 的字体设置`);
    } catch (error) {
      console.error("保存设置失败:", error);
    }
  };

  /**
   * 应用字体设置到 CSS 变量
   */
  const applyToCSS = () => {
    if (!isClient()) return;

    const sizeNum = fontSizeNumber.value; // 当前字体大小数值，如 14, 16
    // 设置 html font-size，使 1rem = 用户选择的字体大小
    // 这样所有使用 rem 的元素都会自动缩放
    document.documentElement.style.fontSize = `${sizeNum}px`;
    document.documentElement.style.setProperty(
      "--font-size-base",
      fontSizeWithUnit.value,
    );
    document.documentElement.style.setProperty(
      "--font-family",
      fontFamily.value,
    );
  };

  /**
   * 跨窗口同步字体设置（Electron 环境）
   * 设置窗口修改字体后，广播给主窗口等其它窗口，使其即时生效。
   */
  const syncAcrossWindows = () => {
    broadcastUiSettings({
      fontSize: fontSize.value,
      fontFamily: fontFamily.value,
    });
  };

  /**
   * 接收其它窗口广播的字体设置并应用（Electron 环境）
   */
  const applyRemoteSettings = (settings: { fontSize?: string; fontFamily?: string }) => {
    if (!settings) return;
    let changed = false;

    if (settings.fontSize && settings.fontSize !== fontSize.value) {
      fontSize.value = settings.fontSize;
      changed = true;
    }

    if (settings.fontFamily && settings.fontFamily !== fontFamily.value) {
      fontFamily.value = settings.fontFamily;
      changed = true;
    }

    if (changed) {
      applyToCSS();
      console.log("[UI设置] 已应用其它窗口同步的字体设置", settings);
    }
  };

  /**
   * 从 localStorage 加载设置（用户专属）
   */
  const loadFromLocalStorage = async () => {
    if (!isClient()) return;

    const userId = currentUserId.value;

    // 如果没有用户ID，尝试使用旧逻辑（向后兼容）
    if (!userId) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + "legacy");
        if (saved) {
          const settings: UiSettings = JSON.parse(saved);

          if (settings.fontSize) {
            fontSize.value = settings.fontSize;
          }

          if (settings.fontFamily) {
            fontFamily.value = settings.fontFamily;
          }

          applyToCSS();
          console.log("已加载遗留字体设置");
        } else {
          console.log("未找到遗留字体设置，使用默认值");
        }
      } catch (error) {
        console.error("加载设置失败:", error);
        resetToDefault();
      }
      return;
    }

    try {
      const storageKey = getUserStorageKey(userId);
      const saved = localStorage.getItem(storageKey);

      if (saved) {
        const settings: UiSettings = JSON.parse(saved);

        if (settings.fontSize) {
          fontSize.value = settings.fontSize;
        }

        if (settings.fontFamily) {
          fontFamily.value = settings.fontFamily;
        }

        // 加载时立即应用到 CSS
        applyToCSS();
        console.log(`[UI设置] 已加载用户 ${userId} 的字体设置`);
      } else {
        console.log(`[UI设置] 用户 ${userId} 无历史设置，使用默认值`);
      }
    } catch (error) {
      console.error("加载设置失败:", error);
      resetToDefault();
    }
  };

  /**
   * 重置为默认设置
   */
  const resetToDefault = () => {
    fontSize.value = DEFAULT_SETTINGS.fontSize;
    fontFamily.value = DEFAULT_SETTINGS.fontFamily;
    saveToLocalStorage();
    applyToCSS();
  };

  /**
   * 清除本地存储的设置（用户专属）
   */
  const clearLocalStorage = () => {
    if (!isClient()) return;

    const userId = currentUserId.value;

    try {
      if (userId) {
        const storageKey = getUserStorageKey(userId);
        localStorage.removeItem(storageKey);
        console.log(`[UI设置] 已清除用户 ${userId} 的字体设置`);
      } else {
        // 向后兼容：清除遗留设置
        localStorage.removeItem(STORAGE_KEY_PREFIX + "legacy");
      }
    } catch (error) {
      console.error("清除设置失败:", error);
    }
  };

  // ========== 初始化 ==========
  // 注意：不在 store 创建时自动加载，而是等待 setCurrentUser 被调用后再加载
  // 这样可以确保使用正确的用户ID加载对应的设置
  // if (isClient()) {
  //   loadFromLocalStorage();
  // }

  // 跨窗口同步：监听其它窗口广播的字体设置变化（Electron 环境）
  // 设置窗口修改字体后，主窗口等其它窗口通过此监听即时应用新字体。
  if (isClient()) {
    onUiSettingsChanged(applyRemoteSettings);
  }

  // ========== 暴露接口 ==========
  return {
    // 状态
    fontSize: readonly(fontSize),
    fontFamily: readonly(fontFamily),
    currentUserId: readonly(currentUserId),
    uiSettings,
    fontSizeNumber,
    fontSizeWithUnit,
    availableFonts,
    currentFont,

    // 方法
    setCurrentUser,
    clearCurrentUser,
    setFontSize,
    setFontFamily,
    setFontByOption,
    setFontSettings,
    loadFromLocalStorage,
    resetToDefault,
    clearLocalStorage,
    applyToCSS,
  };
});
