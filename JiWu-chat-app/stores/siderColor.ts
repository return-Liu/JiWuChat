import { defineStore } from "pinia";
import { ref, computed, readonly } from "vue";
import {
  broadcastThemeSettings,
  onThemeSettingsChanged,
} from "../untils/electronHelper";

// ============================================================
// 类型定义（保持不变）
// ============================================================
export type ThemeType = "classic" | "inkWash" | "dynamic" | "system" | "custom";
export type SystemThemeVariant = "light" | "dark" | "auto";

export interface ColorPalette {
  name: string;
  color: string;
  hover: string;
  active: string;
  light: string;
  text: string;
  bubbleBg: string;
  /** 新增：气泡边框，用于提升气泡边界可见度 */
  bubbleBorder?: string;

  sidebarBg: string;
  sidebarText: string;
  sidebarIcon: string;
  sidebarShadow?: string;
  sidebarBorder?: string;

  sidebarHoverBg?: string;
  sidebarActiveBg?: string;

  chatBgGradient: string;
  chatBgStart: string;
  chatBgMiddle?: string;
  chatBgEnd: string;

  chatBgType: "static" | "animated" | "image" | "video";
  chatBgAnimation: string;
  chatBgPattern: string;
  chatBgOpacity: number;

  /** 动态背景：图片 URL（chatBgType === "image" 时生效） */
  chatBgImage?: string;
  /** 动态背景：视频 URL（chatBgType === "video" 时生效） */
  chatBgVideo?: string;
  /** 动态背景：视频封面图 URL（视频加载前/失败时显示） */
  chatBgPoster?: string;
  /** 动态背景叠加层颜色（用于保证文字可读性，如 rgba(0,0,0,0.3)） */
  chatBgOverlay?: string;

  glassmorphism?: boolean;
  blurAmount?: number;
  shadowIntensity?: number;
  borderGlow?: string;
  texture?: string;
  gradientAngle?: number;
  saturation?: number;
  brightness?: number;

  contactItemBg?: string;
  contactItemHover?: string;
  contactItemActive?: string;

  textPrimary?: string;
  textSecondary?: string;
  bgPrimary?: string;
  borderLight?: string;
  borderNormal?: string;
  bgTertiary?: string;
  tagBg?: string;
  tagColor?: string;
  linkColor?: string;
  dangerColor?: string;
  highlightBg?: string;
  highlightColor?: string;
  selectedBg?: string;
  primaryLight?: string;
  scrollbarTrack?: string;
  scrollbarThumb?: string;

  dividerLineColor: string;
  dividerLineWidth?: string;
  dividerLineStyle?: string;
  dividerLineShadow?: string;
  dividerTextColor: string;
  dividerSpacing?: string;

  bubbleShadow?: string;
  fileIconBg?: string;
  videoPlayBtnBg?: string;
  multiSelectBorder?: string;
  badgeHoverBg?: string;
  loadingTextColor?: string;
  recalledBg?: string;
  joinNoticeBg?: string;
}

// ============================================================
// 工具函数
// ============================================================
const isClient = () => typeof window !== "undefined";

const safeGetStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`保存 ${key} 失败:`, error);
  }
};

// ============================================================
// CSS 变量读取工具
// ============================================================
const readCSSVar = (varName: string): string => {
  if (!isClient()) return "";
  try {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
  } catch {
    return "";
  }
};

// ============================================================
// 颜色工具
// ============================================================
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "255, 255, 255";
};

/** 把颜色（支持 hex / rgb / rgba）转成 [r,g,b] */
const parseColor = (color: string): [number, number, number] | null => {
  if (!color) return null;
  const c = color.trim();

  // #rgb / #rrggbb
  if (c.startsWith("#")) {
    const hex = c.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
    return null;
  }

  // rgb / rgba
  const m = c.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (m) {
    return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
  }
  return null;
};

/** 相对亮度 0~255 */
const luminanceOf = (color: string): number => {
  const rgb = parseColor(color);
  if (!rgb) return 255;
  const [r, g, b] = rgb;
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

const isLightColor = (color: string): boolean => luminanceOf(color) > 180;

const darkenColor = (color: string, amount: number = 0.6): string => {
  const rgb = parseColor(color);
  if (!rgb) return color || "#8b5cf6";
  const [r, g, b] = rgb.map((v) => Math.round(v * amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

const createShadow = (
  color: string,
  intensity: number = 0.15,
  blur: number = 24,
  spread: number = 0,
): string => {
  const rgb = hexToRgb(color);
  return `0 ${spread}px ${blur}px rgba(${rgb}, ${intensity})`;
};

const createUnifiedGradient = (colors: string[], angle: number = 135): string => {
  const stops = colors.map(
    (c, i) => `${c} ${(i / (colors.length - 1)) * 100}%`,
  );
  return `linear-gradient(${angle}deg, ${stops.join(", ")})`;
};

const createSidebarShadow = (color: string, intensity: number = 0.06): string => {
  const rgb = hexToRgb(color);
  return `2px 0 16px rgba(${rgb}, ${intensity}), 1px 0 4px rgba(${rgb}, ${intensity * 0.5})`;
};

// ============================================================
// 由 CSS 变量构建调色板（system 主题用）
// ============================================================
const buildDarkPaletteFromCSSVars = (): ColorPalette => {
  return {
    name: "夜间模式",
    color: "#8b5cf6",
    hover: "#7c3aed",
    active: "#6d28d9",
    light: "rgba(139, 92, 246, 0.12)",
    text: "#e5e5e5",
    bubbleBg: "#1a1a1a",
    bubbleBorder: "1px solid #333333",

    sidebarBg: "#141414",
    sidebarText: "#e5e5e5",
    sidebarIcon: "#999999",
    sidebarShadow: "none",
    sidebarBorder: "1px solid #2a2a2a",

    sidebarHoverBg: "#262626",
    sidebarActiveBg: "#1f1f1f",

    chatBgGradient:
      "linear-gradient(135deg, #0d0d0d 0%, #141414 50%, #0d0d0d 100%)",
    chatBgStart: "#0d0d0d",
    chatBgMiddle: "#141414",
    chatBgEnd: "#0d0d0d",
    chatBgType: "static" as const,
    chatBgAnimation: "",
    chatBgPattern: "",
    chatBgOpacity: 1,

    glassmorphism: false,
    blurAmount: 12,
    shadowIntensity: 0.3,
    borderGlow: "#2a2a2a",
    texture: "matte",
    gradientAngle: 135,
    saturation: 0.3,
    brightness: 0.95,

    textPrimary: "#e5e5e5",
    textSecondary: "#999999",
    bgPrimary: "#1a1a1a",
    borderLight: "#2a2a2a",
    borderNormal: "#2a2a2a",
    bgTertiary: "#1f1f1f",
    tagBg: "rgba(139, 92, 246, 0.12)",
    tagColor: "#8b5cf6",
    linkColor: "#8b5cf6",
    dangerColor: "#ef4444",
    highlightBg: "rgba(251, 191, 36, 0.12)",
    highlightColor: "#f59e0b",
    selectedBg: "rgba(139, 92, 246, 0.08)",
    primaryLight: "rgba(139, 92, 246, 0.08)",
    scrollbarTrack: "#141414",
    scrollbarThumb: "#404040",

    contactItemBg: "#1f1f1f",
    contactItemHover: "#262626",
    contactItemActive: "#1f1f1f",

    dividerLineColor: "#2a2a2a",
    dividerLineWidth: "1px",
    dividerLineStyle: "solid",
    dividerLineShadow: "none",
    dividerTextColor: "#666666",
    dividerSpacing: "10px",

    // ✅ 无阴影
    bubbleShadow: "none",
  };
};

const buildLightPaletteFromCSSVars = (): ColorPalette => {
  return {
    name: "日间模式",
    color: readCSSVar("--color-brand") || "#94A3B8",
    hover: readCSSVar("--color-brand-hover") || "#64748B",
    active: readCSSVar("--color-brand-hover") || "#64748B",
    light: readCSSVar("--color-brand-light") || "rgba(148,163,184,0.12)",
    text: readCSSVar("--text-primary") || "#0F172A",
    bubbleBg: readCSSVar("--card-bg") || "#FFFFFF",
    bubbleBorder: `1px solid ${readCSSVar("--border-color") || "#E2E8F0"}`,

    sidebarBg: readCSSVar("--bg-secondary") || "#FFFFFF",
    sidebarText: readCSSVar("--text-primary") || "#0F172A",
    sidebarIcon: readCSSVar("--text-secondary") || "#64748B",
    sidebarShadow: "2px 0 16px rgba(0, 0, 0, 0.06)",
    sidebarBorder: `1px solid ${readCSSVar("--border-color") || "#E2E8F0"}`,

    sidebarHoverBg: readCSSVar("--bg-hover") || "#F1F5F9",
    sidebarActiveBg: readCSSVar("--bg-tertiary") || "#E2E8F0",

    chatBgGradient: `linear-gradient(135deg, ${readCSSVar("--bg-primary") || "#FFFFFF"} 0%, ${readCSSVar("--bg-secondary") || "#F8FAFC"} 50%, ${readCSSVar("--bg-primary") || "#FFFFFF"} 100%)`,
    chatBgStart: readCSSVar("--bg-primary") || "#FFFFFF",
    chatBgMiddle: readCSSVar("--bg-secondary") || "#F8FAFC",
    chatBgEnd: readCSSVar("--bg-primary") || "#FFFFFF",
    chatBgType: "static" as const,
    chatBgAnimation: "",
    chatBgPattern: "",
    chatBgOpacity: 1,

    glassmorphism: false,
    blurAmount: 16,
    shadowIntensity: 0.06,
    borderGlow: readCSSVar("--border-color") || "#E2E8F0",
    texture: "smooth",
    gradientAngle: 135,
    saturation: 0.85,
    brightness: 1.05,

    textPrimary: readCSSVar("--text-primary") || "#0F172A",
    textSecondary: readCSSVar("--text-secondary") || "#64748B",
    bgPrimary: readCSSVar("--card-bg") || "#FFFFFF",
    borderLight: readCSSVar("--border-color") || "rgba(0,0,0,0.04)",
    borderNormal: readCSSVar("--border-color") || "#E2E8F0",
    bgTertiary: readCSSVar("--bg-tertiary") || "rgba(0,0,0,0.015)",
    tagBg: readCSSVar("--color-brand-light") || "rgba(148,163,184,0.08)",
    tagColor: readCSSVar("--color-brand") || "#94A3B8",
    linkColor: readCSSVar("--color-brand") || "#94A3B8",
    dangerColor: readCSSVar("--error-color") || "#EF4444",
    highlightBg: readCSSVar("--warning-bg") || "rgba(251,191,36,0.12)",
    highlightColor: readCSSVar("--warning-color") || "#D97706",
    selectedBg: readCSSVar("--color-brand-light") || "rgba(148,163,184,0.08)",
    primaryLight: readCSSVar("--color-brand-light") || "rgba(148,163,184,0.06)",
    scrollbarTrack: readCSSVar("--bg-secondary") || "rgba(0,0,0,0.015)",
    scrollbarThumb: readCSSVar("--text-tertiary") || "rgba(0,0,0,0.1)",

    contactItemBg: readCSSVar("--bg-tertiary") || "rgba(0,0,0,0.015)",
    contactItemHover: readCSSVar("--bg-hover") || "#F1F5F9",
    contactItemActive: readCSSVar("--bg-tertiary") || "#E2E8F0",

    dividerLineColor: readCSSVar("--border-color") || "#E2E8F0",
    dividerLineWidth: "1.5px",
    dividerLineStyle: "solid",
    dividerLineShadow: "0 1px 2px rgba(0, 0, 0, 0.06)",
    dividerTextColor: readCSSVar("--text-tertiary") || "#94A3B8",
    dividerSpacing: "10px",

    // ✅ 无阴影
    bubbleShadow: "none",
  };
};

const DEFAULT_THEME_TYPE: ThemeType = "classic";
const DEFAULT_PALETTE_INDEX = 0;
const DEFAULT_SYSTEM_BASE_TYPE: "classic" | "inkWash" = "classic";
const DEFAULT_COLOR = "#94A3B8";
const DEFAULT_TEXT_SECONDARY = "#64748B";
const DEFAULT_BORDER_LIGHT = "rgba(0, 0, 0, 0.04)";
const DEFAULT_BORDER_NORMAL = "#E2E8F0";
const DEFAULT_BG_TERTIARY = "rgba(0, 0, 0, 0.015)";
const DEFAULT_DANGER_COLOR = "#EF4444";
const DEFAULT_HIGHLIGHT_BG = "rgba(251, 191, 36, 0.12)";
const DEFAULT_HIGHLIGHT_COLOR = "#D97706";
const DEFAULT_SCROLLBAR_TRACK = "rgba(0, 0, 0, 0.015)";
const DEFAULT_SCROLLBAR_THUMB = "rgba(0, 0, 0, 0.1)";

// ============================================================
// 主题配色
// ============================================================
const THEME_PALETTES = {
  classic: [
    {
      name: "极简白",
      color: "#DCDCDC",
      hover: "#E8E8E8",
      active: "#C8C8C8",
      light: "rgba(200, 200, 200, 0.10)",
      text: "#111111",
      // ✅ 气泡：纯白实色 + 极浅描边，无阴影
      bubbleBg: "#FFFFFF",
      bubbleBorder: "1px solid rgba(0, 0, 0, 0.06)",

      sidebarBg: "#FAFAFA",
      sidebarText: "#1A1A1A",
      sidebarIcon: "#D0D0D0",
      sidebarShadow: createSidebarShadow("#DCDCDC", 0.03),
      sidebarBorder: "1px solid rgba(220, 220, 220, 0.05)",

      sidebarHoverBg: "#F0F0F0",
      sidebarActiveBg: "#E8E8E8",

      chatBgGradient: createUnifiedGradient(
        ["#FEFEFE", "#FBFBFB", "#F8F8F8", "#FBFBFB", "#FEFEFE"],
        120,
      ),
      chatBgStart: "#FEFEFE",
      chatBgMiddle: "#F8F8F8",
      chatBgEnd: "#FBFBFB",
      chatBgType: "static" as const,
      chatBgAnimation: "",
      chatBgPattern: "",
      chatBgOpacity: 1,

      glassmorphism: true,
      blurAmount: 12,
      shadowIntensity: 0.03,
      borderGlow: "rgba(220, 220, 220, 0.06)",
      texture: "matte",
      gradientAngle: 120,
      saturation: 0.2,
      brightness: 1.02,

      textPrimary: "#1A1A1A",
      textSecondary: "#999999",
      bgPrimary: "rgba(255, 255, 255, 0.3)",
      borderLight: "rgba(220, 220, 220, 0.04)",
      borderNormal: "rgba(230, 230, 230, 0.4)",
      bgTertiary: "rgba(220, 220, 220, 0.02)",
      tagBg: "rgba(220, 220, 220, 0.05)",
      tagColor: "#999999",
      linkColor: "#999999",
      dangerColor: "#E06060",
      highlightBg: "rgba(251, 191, 36, 0.08)",
      highlightColor: "#D4880F",
      selectedBg: "rgba(200, 200, 200, 0.14)",
      primaryLight: "rgba(220, 220, 220, 0.05)",
      scrollbarTrack: "rgba(220, 220, 220, 0.02)",
      scrollbarThumb: "rgba(200, 200, 200, 0.10)",

      contactItemBg: "rgba(255, 255, 255, 0.6)",
      contactItemHover: "#F0F0F0",
      contactItemActive: "#E8E8E8",

      dividerLineColor: "#ebe1e1",
      dividerLineWidth: "1px",
      dividerLineStyle: "solid",
      dividerLineShadow: "none",
      dividerTextColor: "#B0B0B0",
      dividerSpacing: "10px",

      // ✅ 无阴影
      bubbleShadow: "none",
    },
    {
      name: "地海蔚蓝",
      color: "#4A8DB7",
      hover: "#6BA3C8",
      active: "#3A7A9E",
      light: "rgba(74, 141, 183, 0.12)",
      text: "#FFFFFF",
      bubbleBg: "rgba(255, 255, 255, 0.90)",
      bubbleBorder: "1px solid rgba(74, 141, 183, 0.08)",

      sidebarBg: "#EAF1F7",
      sidebarText: "#0F2633",
      sidebarIcon: "#6BA3C8",
      sidebarShadow: createSidebarShadow("#4A8DB7", 0.06),
      sidebarBorder: "1px solid rgba(74, 141, 183, 0.08)",

      sidebarHoverBg: "#D8E4ED",
      sidebarActiveBg: "#C8D8E5",

      chatBgGradient: createUnifiedGradient(
        ["#F0F7FC", "#E8F0F7", "#DCE8F2", "#E8F0F7", "#F0F7FC"],
        135,
      ),
      chatBgStart: "#F0F7FC",
      chatBgMiddle: "#DCE8F2",
      chatBgEnd: "#E8F0F7",
      chatBgType: "static" as const,
      chatBgAnimation: "",
      chatBgPattern: "",
      chatBgOpacity: 1,

      glassmorphism: true,
      blurAmount: 16,
      shadowIntensity: 0.06,
      borderGlow: "rgba(74, 141, 183, 0.10)",
      texture: "smooth",
      gradientAngle: 135,
      saturation: 0.85,
      brightness: 1.05,

      textPrimary: "#0A1E2A",
      textSecondary: "#4A8DB7",
      bgPrimary: "rgba(255, 255, 255, 0.4)",
      borderLight: "rgba(74, 141, 183, 0.06)",
      borderNormal: "#D0DEE8",
      bgTertiary: "rgba(74, 141, 183, 0.04)",
      tagBg: "rgba(74, 141, 183, 0.08)",
      tagColor: "#4A8DB7",
      linkColor: "#4A8DB7",
      dangerColor: "#E07070",
      highlightBg: "rgba(251, 191, 36, 0.12)",
      highlightColor: "#D4880F",
      selectedBg: "rgba(74, 141, 183, 0.06)",
      primaryLight: "rgba(74, 141, 183, 0.06)",
      scrollbarTrack: "rgba(74, 141, 183, 0.03)",
      scrollbarThumb: "rgba(74, 141, 183, 0.12)",

      contactItemBg: "rgba(255, 255, 255, 0.5)",
      contactItemHover: "#D8E4ED",
      contactItemActive: "#C8D8E5",

      dividerLineColor: "#C0D2E0",
      dividerLineWidth: "1.5px",
      dividerLineStyle: "solid",
      dividerLineShadow: "0 1px 2px rgba(74, 141, 183, 0.06)",
      dividerTextColor: "#6BA3C8",
      dividerSpacing: "10px",

      // ✅ 无阴影
      bubbleShadow: "none",
    },
  ],
  inkWash: [
    {
      name: "水墨江南",
      color: "#5A6B7A",
      hover: "#7A8B9A",
      active: "#4A5B6A",
      light: "rgba(90, 107, 122, 0.12)",
      text: "#FFFFFF",
      bubbleBg: "rgba(248, 245, 240, 0.92)",
      bubbleBorder: "1px solid rgba(90, 107, 122, 0.10)",

      sidebarBg: "#E8E4DE",
      sidebarText: "#1A1A2E",
      sidebarIcon: "#7A8B9A",
      sidebarShadow: createSidebarShadow("#5A6B7A", 0.05),
      sidebarBorder: "1px solid rgba(90, 107, 122, 0.06)",

      sidebarHoverBg: "#D5D0C8",
      sidebarActiveBg: "#C5C0B8",

      chatBgGradient: createUnifiedGradient(
        ["#F5F2ED", "#EDEAE4", "#E5E0D8", "#EDEAE4", "#F5F2ED"],
        120,
      ),
      chatBgStart: "#F5F2ED",
      chatBgMiddle: "#E5E0D8",
      chatBgEnd: "#EDEAE4",
      chatBgType: "static" as const,
      chatBgAnimation: "",
      chatBgPattern: "",
      chatBgOpacity: 1,

      glassmorphism: true,
      blurAmount: 14,
      shadowIntensity: 0.05,
      borderGlow: "rgba(90, 107, 122, 0.08)",
      texture: "paper",
      gradientAngle: 120,
      saturation: 0.4,
      brightness: 1.04,

      textPrimary: "#1A1A2E",
      textSecondary: "#5A6B7A",
      bgPrimary: "rgba(248, 245, 240, 0.4)",
      borderLight: "rgba(90, 107, 122, 0.05)",
      borderNormal: "#D5D0C8",
      bgTertiary: "rgba(90, 107, 122, 0.03)",
      tagBg: "rgba(90, 107, 122, 0.06)",
      tagColor: "#5A6B7A",
      linkColor: "#5A6B7A",
      dangerColor: "#C07060",
      highlightBg: "rgba(251, 191, 36, 0.10)",
      highlightColor: "#B0880F",
      selectedBg: "rgba(90, 107, 122, 0.05)",
      primaryLight: "rgba(90, 107, 122, 0.05)",
      scrollbarTrack: "rgba(90, 107, 122, 0.02)",
      scrollbarThumb: "rgba(90, 107, 122, 0.10)",

      contactItemBg: "rgba(248, 245, 240, 0.5)",
      contactItemHover: "#D5D0C8",
      contactItemActive: "#C5C0B8",

      dividerLineColor: "#C5C0B8",
      dividerLineWidth: "1px",
      dividerLineStyle: "solid",
      dividerLineShadow: "0 1px 2px rgba(90, 107, 122, 0.04)",
      dividerTextColor: "#8A9BAA",
      dividerSpacing: "10px",

      // ✅ 无阴影
      bubbleShadow: "none",
    },
  ],
};

// ============================================================
// 个性装扮 —— 默认使用 public/theme 下的本地视频壁纸
// ============================================================
const DEFAULT_LIGHT_PALETTE = THEME_PALETTES.classic[0] as ColorPalette;

/** 默认个性装扮视频壁纸路径 */
const DEFAULT_DYNAMIC_URL =
  "/theme/4k石昊动态壁纸｜水墨风云海对战场景背景视频 - 完美世界国漫「哲风壁纸」.mp4";

/**
 * 生成个性装扮调色板 —— 复用默认主题配色，仅替换背景为视频
 */
const buildDynamicPalette = (): ColorPalette => {
  return {
    ...DEFAULT_LIGHT_PALETTE,
    name: "个性装扮",
    chatBgType: "video",
    chatBgAnimation: "",
    chatBgPattern: "",
    chatBgVideo: DEFAULT_DYNAMIC_URL,
    chatBgPoster: DEFAULT_DYNAMIC_URL,
    chatBgOverlay: "transparent",
  };
};

// ============================================================
// 🔥 核心修复：由日间调色板生成暗色调色板
// ============================================================
const buildDarkPaletteFromLight = (light: ColorPalette): ColorPalette => {
  const themeColor = light?.color || "#8b5cf6";

  const darkBubbleBg = darkenColor(light.bubbleBg || "#FFFFFF", 0.12);
  const bubbleTextColor = isLightColor(darkBubbleBg) ? "#1a1a1a" : "#e5e5e5";

  return {
    ...light,
    name: `${light.name} 夜间`,
    color: themeColor,
    hover: darkenColor(themeColor, 0.7),
    active: darkenColor(themeColor, 0.55),
    light: `rgba(${hexToRgb(themeColor)}, 0.12)`,
    text: bubbleTextColor,

    sidebarBg: darkenColor(light.sidebarBg || "#FAFAFA", 0.08),
    sidebarText: "#e5e5e5",
    sidebarIcon: darkenColor(light.sidebarIcon || "#D0D0D0", 0.55),
    sidebarShadow: "none",
    sidebarBorder: "1px solid #2a2a2a",

    sidebarHoverBg: darkenColor(
      light.sidebarHoverBg || light.sidebarActiveBg || "#F0F0F0",
      0.16,
    ),
    sidebarActiveBg: darkenColor(
      light.sidebarActiveBg || light.sidebarHoverBg || "#E8E8E8",
      0.12,
    ),

    chatBgGradient: `linear-gradient(135deg, ${darkenColor(
      light.chatBgStart || "#FEFEFE",
      0.06,
    )} 0%, ${darkenColor(
      light.chatBgMiddle || light.chatBgStart || "#F8F8F8",
      0.08,
    )} 50%, ${darkenColor(light.chatBgStart || "#FEFEFE", 0.06)} 100%)`,
    chatBgStart: darkenColor(light.chatBgStart || "#FEFEFE", 0.06),
    chatBgMiddle: darkenColor(
      light.chatBgMiddle || light.chatBgStart || "#F8F8F8",
      0.08,
    ),
    chatBgEnd: darkenColor(light.chatBgEnd || light.chatBgStart || "#FBFBFB", 0.06),
    chatBgType: light.chatBgType ?? "static",
    chatBgAnimation: light.chatBgAnimation || "",
    chatBgPattern: light.chatBgPattern || "",
    chatBgOpacity: light.chatBgOpacity ?? 1,
    chatBgImage: light.chatBgImage,
    chatBgVideo: light.chatBgVideo,
    chatBgPoster: light.chatBgPoster,
    chatBgOverlay: light.chatBgOverlay,

    glassmorphism: false,
    blurAmount: 12,
    shadowIntensity: 0.3,
    borderGlow: "#2a2a2a",
    texture: "matte",
    gradientAngle: 135,
    saturation: 0.3,
    brightness: 0.95,

    textPrimary: "#e5e5e5",
    textSecondary: "#999999",
    bgPrimary: darkenColor(light.bgPrimary || "#FFFFFF", 0.10),
    borderLight: "#2a2a2a",
    borderNormal: "#2a2a2a",
    bgTertiary: darkenColor(light.bgTertiary || "#FEFEFE", 0.10),
    tagBg: `rgba(${hexToRgb(themeColor)}, 0.12)`,
    tagColor: themeColor,
    linkColor: themeColor,
    dangerColor: "#ef4444",
    highlightBg: "rgba(251, 191, 36, 0.12)",
    highlightColor: "#f59e0b",
    selectedBg: `rgba(${hexToRgb(themeColor)}, 0.08)`,
    primaryLight: `rgba(${hexToRgb(themeColor)}, 0.08)`,
    scrollbarTrack: darkenColor(light.scrollbarTrack || "#FAFAFA", 0.08),
    scrollbarThumb: "#404040",

    contactItemBg: darkenColor(
      light.contactItemBg || light.sidebarActiveBg || "#E8E8E8",
      0.12,
    ),
    contactItemHover: darkenColor(
      light.contactItemHover || light.sidebarHoverBg || "#F0F0F0",
      0.16,
    ),
    contactItemActive: darkenColor(
      light.contactItemActive || light.sidebarActiveBg || "#E8E8E8",
      0.12,
    ),

    dividerLineColor: "#2a2a2a",
    dividerLineWidth: "1px",
    dividerLineStyle: "solid",
    dividerLineShadow: "none",
    dividerTextColor: "#666666",
    dividerSpacing: "10px",

    bubbleBg: darkBubbleBg,
    // ✅ 夜间气泡边框：浅白描边，避免和背景糊在一起
    bubbleBorder: "1px solid rgba(255, 255, 255, 0.08)",
    // ✅ 无阴影
    bubbleShadow: "none",

    fileIconBg: darkenColor(light.fileIconBg || light.bgTertiary || "#FEFEFE", 0.10),
    videoPlayBtnBg: "rgba(0, 0, 0, 0.6)",
    multiSelectBorder: themeColor,
    badgeHoverBg: darkenColor(
      light.badgeHoverBg || light.bgTertiary || "#FEFEFE",
      0.10,
    ),
    loadingTextColor: "#999999",
    recalledBg: darkenColor(light.recalledBg || light.bgTertiary || "#FEFEFE", 0.10),
    joinNoticeBg: darkenColor(
      light.joinNoticeBg || light.bgTertiary || "#FEFEFE",
      0.10,
    ),
  };
};

// ============================================================
// Store 定义
// ============================================================
export const useSiderColor = defineStore("siderColor", () => {
  // ---- 状态 ----
  const themePalettes = ref<typeof THEME_PALETTES>(
    structuredClone(THEME_PALETTES),
  );
  const currentThemeType = ref<ThemeType>(DEFAULT_THEME_TYPE);
  const currentPaletteIndex = ref<number>(DEFAULT_PALETTE_INDEX);
  const currentSystemVariant = ref<SystemThemeVariant>("auto");
  const systemPrefersDark = ref(false);
  const systemBaseType = ref<"classic" | "inkWash">(DEFAULT_SYSTEM_BASE_TYPE);
  const systemBaseIndex = ref<number>(DEFAULT_PALETTE_INDEX);
  const customPalette = ref<ColorPalette | null>(null);

  // 超级调色盘预览模式
  const previewThemeMode = ref<"light" | "dark" | null>(null);

  const setPreviewThemeMode = (mode: "light" | "dark" | null) => {
    previewThemeMode.value = mode;
  };

  // ---- 系统主题监听 ----
  let mediaQuery: MediaQueryList | null = null;
  let mediaHandler: ((e: MediaQueryListEvent) => void) | null = null;

  const initSystemThemeListener = () => {
    if (!isClient() || mediaQuery) return;
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    systemPrefersDark.value = mediaQuery.matches;

    mediaHandler = (e: MediaQueryListEvent) => {
      systemPrefersDark.value = e.matches;
    };
    mediaQuery.addEventListener("change", mediaHandler);
  };

  const disposeSystemThemeListener = () => {
    if (mediaQuery && mediaHandler) {
      mediaQuery.removeEventListener("change", mediaHandler);
    }
    mediaQuery = null;
    mediaHandler = null;
  };

  const updateSystemPrefersDark = (isDark: boolean) => {
    systemPrefersDark.value = isDark;
  };

  // ---- 系统主题调色板 ----
  const getCurrentSystemPalette = (): ColorPalette => {
    const variant = currentSystemVariant.value;
    const shouldUseDark =
      variant === "dark" || (variant === "auto" && systemPrefersDark.value);

    if (shouldUseDark) {
      return buildDarkPaletteFromCSSVars();
    }

    const palettes = themePalettes.value?.[systemBaseType.value] ?? [];
    const idx = clampIndex(systemBaseIndex.value, palettes.length);
    return palettes[idx] ?? buildLightPaletteFromCSSVars();
  };

  const clampIndex = (idx: number | undefined, len: number): number => {
    if (typeof idx !== "number" || Number.isNaN(idx) || len <= 0) return 0;
    return Math.max(0, Math.min(idx, len - 1));
  };

  // ---- 核心计算属性 ----
  const currentColorPalette = computed(() => {
    const dark = systemPrefersDark.value;
    const previewMode = previewThemeMode.value;
    const type = currentThemeType.value;

    // ---------- 超级调色盘预览：夜间 ----------
    if (previewMode === "dark") {
      const base = resolveLightPalette(type);
      return buildDarkPaletteFromLight(base);
    }

    // ---------- system 主题 ----------
    if (type === "system") {
      return getCurrentSystemPalette();
    }

    // ---------- classic / inkWash / custom ----------
    const lightPalette = resolveLightPalette(type);
    if (dark) {
      return buildDarkPaletteFromLight(lightPalette);
    }
    return lightPalette;
  });

  /** 解析当前应使用的"日间调色板" */
  const resolveLightPalette = (type: ThemeType): ColorPalette => {
    if (type === "custom") {
      return customPalette.value ?? DEFAULT_LIGHT_PALETTE;
    }
    if (type === "dynamic") {
      return buildDynamicPalette();
    }
    const key = type === "system" ? systemBaseType.value : type;
    const palettes = themePalettes.value?.[key] ?? themePalettes.value?.classic ?? [];
    const idx = clampIndex(
      type === "system" ? systemBaseIndex.value : currentPaletteIndex.value,
      palettes.length,
    );
    return palettes[idx] ?? DEFAULT_LIGHT_PALETTE;
  };

  // ---- 所有颜色属性 ----
  const currentColor = computed(
    () => currentColorPalette.value.color || DEFAULT_COLOR,
  );
  const bubbleBg = computed(
    () => currentColorPalette.value.bubbleBg || "#FFFFFF",
  );
  const bubbleBorder = computed(
    () => currentColorPalette.value.bubbleBorder || "none",
  );
  const bubbleTextColor = computed(() => {
    const bg = currentColorPalette.value.bubbleBg || "#FFFFFF";
    return isLightColor(bg) ? "#111111" : "#e5e5e5";
  });
  const bubbleShadow = computed(
    () => currentColorPalette.value.bubbleShadow || "none",
  );

  const sidebarBgColor = computed(() => currentColorPalette.value.sidebarBg);
  const sidebarTextColor = computed(
    () => currentColorPalette.value.sidebarText || "#1E293B",
  );
  const sidebarIconColor = computed(
    () => currentColorPalette.value.sidebarIcon || "#94A3B8",
  );
  const sidebarIconHoverColor = computed(
    () => currentColorPalette.value.hover || "#CBD5E1",
  );
  const sidebarIconActiveColor = computed(
    () => currentColorPalette.value.active || "#64748B",
  );
  const sidebarItemHoverBg = computed(
    () =>
      currentColorPalette.value.sidebarHoverBg ||
      "rgba(148, 163, 184, 0.10)",
  );
  const sidebarItemActiveBg = computed(
    () =>
      currentColorPalette.value.sidebarActiveBg ||
      "rgba(148, 163, 184, 0.15)",
  );
  const contactItemHoverBg = computed(
    () =>
      currentColorPalette.value.contactItemHover ||
      "rgba(148, 163, 184, 0.10)",
  );
  const contactItemActiveBg = computed(
    () =>
      currentColorPalette.value.contactItemActive ||
      "rgba(148, 163, 184, 0.15)",
  );

  const textSecondaryColor = computed(
    () => currentColorPalette.value.textSecondary || DEFAULT_TEXT_SECONDARY,
  );
  const borderLightColor = computed(
    () => currentColorPalette.value.borderLight || DEFAULT_BORDER_LIGHT,
  );
  const borderNormalColor = computed(
    () => currentColorPalette.value.borderNormal || DEFAULT_BORDER_NORMAL,
  );
  const bgTertiaryColor = computed(
    () => currentColorPalette.value.bgTertiary || DEFAULT_BG_TERTIARY,
  );
  const tagBgColor = computed(
    () => currentColorPalette.value.tagBg || "rgba(148, 163, 184, 0.06)",
  );
  const tagTextColor = computed(
    () => currentColorPalette.value.tagColor || currentColorPalette.value.color,
  );
  const linkColorValue = computed(
    () => currentColorPalette.value.linkColor || currentColorPalette.value.color,
  );
  const dangerColorValue = computed(
    () => currentColorPalette.value.dangerColor || DEFAULT_DANGER_COLOR,
  );
  const highlightBgColor = computed(
    () => currentColorPalette.value.highlightBg || DEFAULT_HIGHLIGHT_BG,
  );
  const highlightColorValue = computed(
    () => currentColorPalette.value.highlightColor || DEFAULT_HIGHLIGHT_COLOR,
  );
  const selectedBgColor = computed(
    () =>
      currentColorPalette.value.selectedBg || "rgba(148, 163, 184, 0.04)",
  );
  const textPrimaryColor = computed(
    () => currentColorPalette.value.textPrimary || "#0F172A",
  );
  const bgPrimaryColor = computed(
    () => currentColorPalette.value.bgPrimary || "#FFFFFF",
  );
  const primaryLightColor = computed(
    () =>
      currentColorPalette.value.primaryLight || "rgba(148, 163, 184, 0.06)",
  );
  const scrollbarTrackColor = computed(
    () => currentColorPalette.value.scrollbarTrack || DEFAULT_SCROLLBAR_TRACK,
  );
  const scrollbarThumbColor = computed(
    () => currentColorPalette.value.scrollbarThumb || DEFAULT_SCROLLBAR_THUMB,
  );

  // ===== 分割线 =====
  const dividerLineColorValue = computed(
    () =>
      currentColorPalette.value.dividerLineColor ||
      currentColorPalette.value.color ||
      "#CBD5E1",
  );
  const dividerLineWidth = computed(
    () => currentColorPalette.value.dividerLineWidth || "1.5px",
  );
  const dividerLineStyle = computed(
    () => currentColorPalette.value.dividerLineStyle || "solid",
  );
  const dividerLineShadow = computed(
    () => currentColorPalette.value.dividerLineShadow || "none",
  );
  const dividerTextColorValue = computed(
    () =>
      currentColorPalette.value.dividerTextColor ||
      currentColorPalette.value.color ||
      "#94A3B8",
  );
  const dividerSpacing = computed(
    () => currentColorPalette.value.dividerSpacing || "10px",
  );

  const dividerStyle = computed(() => ({
    borderColor: dividerLineColorValue.value,
    borderWidth: dividerLineWidth.value,
    borderStyle: dividerLineStyle.value,
    boxShadow: dividerLineShadow.value,
    margin: `${dividerSpacing.value} 0`,
    position: "relative" as const,
  }));

  const dividerTextStyle = computed(() => ({
    color: dividerTextColorValue.value,
    backgroundColor: "transparent",
    padding: `0 ${dividerSpacing.value}`,
    fontSize: "0.875rem",
    fontWeight: 500,
  }));

  // ---- 质感 ----
  const glassmorphismEnabled = computed(
    () => currentColorPalette.value.glassmorphism ?? false,
  );
  const blurAmount = computed(
    () => currentColorPalette.value.blurAmount ?? 16,
  );
  const shadowIntensity = computed(
    () => currentColorPalette.value.shadowIntensity ?? 0.06,
  );
  const borderGlow = computed(
    () => currentColorPalette.value.borderGlow ?? "transparent",
  );
  const texture = computed(() => currentColorPalette.value.texture ?? "matte");
  const saturation = computed(
    () => currentColorPalette.value.saturation ?? 1,
  );
  const brightness = computed(
    () => currentColorPalette.value.brightness ?? 1.05,
  );

  // ---- 聊天背景 ----
  const chatBgGradient = computed(
    () => currentColorPalette.value.chatBgGradient,
  );
  const chatBgSimpleGradient = computed(
    () => currentColorPalette.value.chatBgGradient,
  );
  const chatBgStartColor = computed(
    () => currentColorPalette.value.chatBgStart || "#FFFFFF",
  );
  const chatBgEndColor = computed(
    () => currentColorPalette.value.chatBgEnd || "#F1F5F9",
  );
  const chatBgMiddleColor = computed(
    () => currentColorPalette.value.chatBgMiddle || "#F8FAFC",
  );
  const chatBgOpacity = computed(
    () => currentColorPalette.value.chatBgOpacity ?? 1,
  );

  const chatBgAnimatedStyle = computed(() => ({
    background: chatBgGradient.value,
    opacity: chatBgOpacity.value,
    backdropFilter: glassmorphismEnabled.value
      ? `blur(${blurAmount.value}px)`
      : "none",
    WebkitBackdropFilter: glassmorphismEnabled.value
      ? `blur(${blurAmount.value}px)`
      : "none",
  }));

  // ===== 动态背景（图片 / 视频壁纸） =====
  const chatBgType = computed(
    () => currentColorPalette.value.chatBgType ?? "static",
  );
  const chatBgImage = computed(
    () => currentColorPalette.value.chatBgImage || "",
  );
  const chatBgVideo = computed(
    () => currentColorPalette.value.chatBgVideo || "",
  );
  const chatBgPoster = computed(
    () => currentColorPalette.value.chatBgPoster || "",
  );
  const chatBgOverlay = computed(
    () => currentColorPalette.value.chatBgOverlay || "transparent",
  );

  const hasDynamicBackground = computed(
    () =>
      (chatBgType.value === "image" && !!chatBgImage.value) ||
      (chatBgType.value === "video" && !!chatBgVideo.value),
  );

  // ---- 可用调色板 ----
  const getAvailablePalettes = computed(() => {
    if (currentThemeType.value === "system") {
      return [];
    }
    if (currentThemeType.value === "dynamic") {
      const p = buildDynamicPalette();
      return [
        {
          name: p.name,
          color: p.color,
          previewGradient: p.chatBgGradient,
          isDefault: true,
        },
      ];
    }
    const key =
      currentThemeType.value === "custom"
        ? "classic"
        : currentThemeType.value;
    const palettes = themePalettes.value[key] || [];
    return palettes.map((p, index) => ({
      name: p.name,
      color: p.color,
      previewGradient: p.chatBgGradient,
      isDefault: index === 0,
    }));
  });

  // ============================================================
  // 操作方法
  // ============================================================
  const setSystemTheme = (variant: SystemThemeVariant) => {
    if (currentThemeType.value !== "system") {
      const currentType = currentThemeType.value;
      if (currentType === "classic" || currentType === "inkWash") {
        systemBaseType.value = currentType;
        systemBaseIndex.value = currentPaletteIndex.value;
      }
    }

    currentThemeType.value = "system";
    currentSystemVariant.value = variant;
    customPalette.value = null;

    if (isClient()) {
      safeSetStorage("theme-type", "system");
      safeSetStorage("system-theme-variant", variant);
      safeSetStorage("system-base-type", systemBaseType.value);
      safeSetStorage("system-base-index", String(systemBaseIndex.value));
    }

    syncThemeAcrossWindows();
  };

  const updateSystemBase = (type: "classic" | "inkWash", index: number) => {
    systemBaseType.value = type;
    systemBaseIndex.value = index;

    if (isClient()) {
      safeSetStorage("system-base-type", type);
      safeSetStorage("system-base-index", String(index));
    }

    syncThemeAcrossWindows();
  };

  const setTheme = (type: "classic" | "inkWash" | "dynamic", index: number = 0) => {
    currentThemeType.value = type;
    currentPaletteIndex.value = index;
    customPalette.value = null;

    if (isClient()) {
      safeSetStorage("theme-type", type);
      safeSetStorage("theme-palette-index", String(index));
    }

    syncThemeAcrossWindows();
  };

  const setCustomTheme = (palette: ColorPalette) => {
    currentThemeType.value = "custom";
    customPalette.value = palette;

    if (isClient()) {
      safeSetStorage("theme-type", "custom");
      safeSetStorage("custom-theme", JSON.stringify(palette));
    }

    syncThemeAcrossWindows();
  };

  /**
   * 跨窗口同步侧边栏颜色主题（Electron 环境）
   * 设置窗口修改主题后，广播给主窗口等其它窗口，使其立即重新加载主题。
   */
  const syncThemeAcrossWindows = () => {
    broadcastThemeSettings({ type: "color" });
  };

  const initTheme = () => {
    if (!isClient()) return;

    initSystemThemeListener();

    // 跨窗口同步：监听其它窗口广播的主题变化，立即重新加载主题
    onThemeSettingsChanged((settings) => {
      if (settings?.type === "color") {
        // 从 localStorage 重新读取主题设置并应用
        loadThemeFromStorage();
      }
    });

    // Web 端多标签页同步：监听 localStorage storage 事件
    window.addEventListener("storage", (e) => {
      if (e.key === "theme-type" || e.key === "theme-palette-index" ||
        e.key === "system-theme-variant" || e.key === "system-base-type" ||
        e.key === "system-base-index" || e.key === "custom-theme") {
        loadThemeFromStorage();
      }
    });

    loadThemeFromStorage();
  };

  /**
   * 从 localStorage 读取主题设置并应用（供 initTheme 与跨窗口同步复用）
   */
  const loadThemeFromStorage = () => {
    try {
      const savedThemeType = safeGetStorage("theme-type") as ThemeType;

      if (savedThemeType === "system") {
        const savedVariant = safeGetStorage(
          "system-theme-variant",
        ) as SystemThemeVariant;
        const savedBaseType = safeGetStorage("system-base-type") as
          | "classic"
          | "inkWash";
        const savedBaseIndex = safeGetStorage("system-base-index");

        if (savedVariant && ["light", "dark", "auto"].includes(savedVariant)) {
          currentThemeType.value = "system";
          currentSystemVariant.value = savedVariant;
          systemBaseType.value =
            savedBaseType === "inkWash" ? "inkWash" : "classic";
          const idx = parseInt(savedBaseIndex || "0", 10);
          systemBaseIndex.value = isNaN(idx) ? 0 : idx;
          return;
        }
      }

      if (savedThemeType === "custom") {
        const savedCustom = safeGetStorage("custom-theme");
        if (savedCustom) {
          try {
            customPalette.value = JSON.parse(savedCustom);
            currentThemeType.value = "custom";
            return;
          } catch {
            // ignore
          }
        }
      }

      const savedPaletteIndex = safeGetStorage("theme-palette-index");
      const savedType = safeGetStorage("theme-type") as
        | "classic"
        | "inkWash"
        | "dynamic";
      if (
        (savedType === "classic" ||
          savedType === "inkWash" ||
          savedType === "dynamic") &&
        savedPaletteIndex !== null
      ) {
        const index = parseInt(savedPaletteIndex, 10);
        if (!isNaN(index)) {
          currentThemeType.value = savedType;
          currentPaletteIndex.value = index;
          return;
        }
      }
    } catch (error) {
      console.error("读取主题设置失败:", error);
    }

    // 兜底：无保存设置时使用默认主题（直接设置状态，不触发跨窗口广播，避免递归）
    currentThemeType.value = "classic";
    currentPaletteIndex.value = 0;
    customPalette.value = null;
  };

  // ===== 样式方法 =====
  const getSidebarStyles = () => {
    const p = currentColorPalette.value;
    return {
      backgroundColor: p.sidebarBg,
      backgroundImage: "none",
      color: sidebarTextColor.value,
      boxShadow: p.sidebarShadow || "none",
      borderRight: p.sidebarBorder || "none",
      "--sidebar-text-color": sidebarTextColor.value,
      "--sidebar-icon-color": sidebarIconColor.value,
      "--sidebar-icon-hover-color": sidebarIconHoverColor.value,
      "--sidebar-icon-active-color": sidebarIconActiveColor.value,
      "--sidebar-item-hover-bg": sidebarItemHoverBg.value,
      "--sidebar-item-active-bg": sidebarItemActiveBg.value,
      "--glassmorphism": glassmorphismEnabled.value ? "true" : "false",
      "--blur-amount": `${blurAmount.value}px`,
      "--shadow-intensity": String(shadowIntensity.value),
      "--border-glow": borderGlow.value,
      "--texture": texture.value,
    };
  };

  const getChatAreaStyles = () => {
    return {
      background: chatBgGradient.value,
      opacity: chatBgOpacity.value,
      "--chat-bg-start": chatBgStartColor.value,
      "--chat-bg-end": chatBgEndColor.value,
      "--chat-bg-middle": chatBgMiddleColor.value,
      "--message-bubble-bg": bubbleBg.value,
      "--message-bubble-border": bubbleBorder.value,
      "--message-bubble-text": bubbleTextColor.value,
      // 不输出阴影变量，气泡无阴影
      backdropFilter: glassmorphismEnabled.value
        ? `blur(${blurAmount.value}px)`
        : "none",
      WebkitBackdropFilter: glassmorphismEnabled.value
        ? `blur(${blurAmount.value}px)`
        : "none",
      boxShadow: glassmorphismEnabled.value
        ? `inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 32px rgba(0,0,0,${shadowIntensity.value * 0.5
        })`
        : "none",
    };
  };

  const getDividerStyles = () => ({
    border: `${dividerLineWidth.value} ${dividerLineStyle.value} ${dividerLineColorValue.value}`,
    boxShadow: dividerLineShadow.value,
    margin: `${dividerSpacing.value} 0`,
    position: "relative" as const,
  });

  const getDividerTextStyles = () => ({
    color: dividerTextColorValue.value,
    backgroundColor: "transparent",
    padding: `0 ${dividerSpacing.value}`,
    fontSize: "0.875rem",
    fontWeight: 500,
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
  });

  const resetToDefault = () => setTheme("classic", 0);

  // ===== 返回 =====
  return {
    // 状态
    currentThemeType: readonly(currentThemeType),
    currentPaletteIndex: readonly(currentPaletteIndex),
    themePalettes: readonly(themePalettes),
    systemBaseType: readonly(systemBaseType),
    systemBaseIndex: readonly(systemBaseIndex),

    // 颜色属性
    currentColor,
    bubbleBg,
    bubbleBorder,
    bubbleTextColor,
    bubbleShadow,
    currentColorPalette,
    sidebarBgColor,
    sidebarTextColor,
    sidebarIconColor,
    sidebarIconHoverColor,
    sidebarIconActiveColor,
    sidebarItemHoverBg,
    sidebarItemActiveBg,
    contactItemHoverBg,
    contactItemActiveBg,
    textSecondaryColor,
    borderLightColor,
    borderNormalColor,
    bgTertiaryColor,
    tagBgColor,
    tagTextColor,
    linkColorValue,
    dangerColorValue,
    highlightBgColor,
    highlightColorValue,
    selectedBgColor,
    textPrimaryColor,
    bgPrimaryColor,
    primaryLightColor,
    scrollbarTrackColor,
    scrollbarThumbColor,

    // 分割线
    dividerLineColorValue,
    dividerLineWidth,
    dividerLineStyle,
    dividerLineShadow,
    dividerTextColorValue,
    dividerSpacing,
    dividerStyle,
    dividerTextStyle,

    // 聊天背景
    chatBgGradient,
    chatBgSimpleGradient,
    chatBgStartColor,
    chatBgEndColor,
    chatBgMiddleColor,
    chatBgOpacity,
    chatBgAnimatedStyle,

    // 动态背景
    chatBgType,
    chatBgImage,
    chatBgVideo,
    chatBgPoster,
    chatBgOverlay,
    hasDynamicBackground,

    // 质感
    glassmorphismEnabled,
    blurAmount,
    shadowIntensity,
    borderGlow,
    texture,
    saturation,
    brightness,

    // 方法
    getAvailablePalettes,
    setTheme,
    setSystemTheme,
    updateSystemBase,
    setCustomTheme,
    initTheme,
    resetToDefault,
    getSidebarStyles,
    getChatAreaStyles,
    getDividerStyles,
    getDividerTextStyles,

    // 系统
    currentSystemVariant: readonly(currentSystemVariant),
    systemPrefersDark: readonly(systemPrefersDark),
    updateSystemPrefersDark,

    // 预览
    previewThemeMode: readonly(previewThemeMode),
    setPreviewThemeMode,

    // 生命周期
    disposeSystemThemeListener,
  };
});