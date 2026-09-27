/**
 * 官网首页数据常量
 * 包含功能卡片、定价方案、配色方案等静态数据
 */

/** 从 package.json 读取版本号 */
import pkg from "../package.json";

const VERSION = pkg.version;

// ===== GitHub 仓库配置 =====
const GITHUB_OWNER = "return-Liu";
const GITHUB_REPO = "----Nuxt3-Electron";
// Release tag 前缀（v2.1.4）
const RELEASE_TAG = `v${VERSION}`;

/** 生成 GitHub Release 安装包下载链接（下划线命名，与 electron-builder artifactName 一致） */
function getGithubReleaseUrl(filename: string): string {
    return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${RELEASE_TAG}/${filename}`;
}

/** 功能卡片配色方案 */
export const COLOR_SCHEMES = [
    { name: "violet", primary: "#7c3aed", light: "rgba(124, 58, 237, 0.08)" },
    { name: "rose", primary: "#e11d48", light: "rgba(225, 29, 72, 0.08)" },
    { name: "amber", primary: "#d97706", light: "rgba(217, 119, 6, 0.08)" },
    { name: "emerald", primary: "#059669", light: "rgba(5, 150, 105, 0.08)" },
    { name: "cyan", primary: "#0891b2", light: "rgba(8, 145, 178, 0.08)" },
    { name: "indigo", primary: "#4f46e5", light: "rgba(79, 70, 229, 0.08)" },
    { name: "fuchsia", primary: "#c026d3", light: "rgba(192, 38, 211, 0.08)" },
    { name: "orange", primary: "#ea580c", light: "rgba(234, 88, 12, 0.08)" },
] as const;

/** 功能卡片图标（iconfont class） */
export const FEATURE_ICONS = [
    "icon-duopingtaizw",
    "icon-xiaoxi",
    "icon-shipintonghua",
    "icon-pingmugongxiang",
    "icon-wenjianjia",
    "icon-jiami",
    "icon-tongbu",
    "icon-pifu",
] as const;

/** 功能卡片数据 */
export const FEATURES = [
    {
        title: "多平台轻量架构",
        desc: "安装包仅约 5 MB，支持 Windows、macOS、Linux 与Web，启动快、占用低。",
    },
    {
        title: "丰富消息类型",
        desc: "支持文字、图片、语音、文件等多种消息格式，收发流畅，体验稳定。",
    },
    {
        title: "高清音视频通话",
        desc: "一对一音视频通话，低延迟、高清晰度，满足远程沟通需求。",
    },
    {
        title: "实时屏幕共享",
        desc: "一键共享屏幕，适合远程协作、在线教学与演示场景。",
    },
    {
        title: "安全文件传输",
        desc: "支持文件断点续传，传输过程加密，保障数据安全可靠。",
    },
    {
        title: "端到端加密",
        desc: "消息与文件全程加密，保护你的聊天内容不被泄露。",
    },
    {
        title: "多端数据同步",
        desc: "聊天记录、联系人跨设备自动同步，切换设备无缝衔接。",
    },
    { title: "个性化主题", desc: "支持自定义界面主题，打造专属的聊天体验。" },
] as const;

import type { PricingFeature, DownloadPlatform } from "../types/untilsTypes";

// 重新导出 DownloadPlatform 类型，供 home.vue 等使用方从本文件导入
export type { DownloadPlatform };

/** 定价方案特性项 */
export const BASIC_FEATURES: PricingFeature[] = [
    { text: "前后端完整源码", available: true },
    { text: "个人/小团队自部署使用", available: true },
    { text: "Docker 部署支持文档", available: true },
    { text: "完整技术开发文档", available: true },
    { text: "后续版本免费更新", available: true },
    { text: "部署问题咨询（14 天）", available: true },
    { text: "二次开发与商业分发", available: false },
    { text: "AI 功能定制集成", available: false },
];

/** 商业授权特性 */
export const BUSINESS_FEATURES: PricingFeature[] = [
    { text: "授权版本全部权益", available: true },
    { text: "支持二次开发", available: true },
    { text: "商业分发授权", available: true },
    { text: "企业/团队无限制使用", available: true },
    { text: "完整技术文档与开发资料", available: true },
    { text: "部署问题咨询（1 个月）", available: true },
    { text: "后续版本免费更新", available: true },
    { text: "AI 功能定制集成", available: false },
];

/** 旗舰版本特性 */
export const FLAGSHIP_FEATURES: PricingFeature[] = [
    { text: "商业授权全部权益", available: true },
    { text: "AI 能力集成（群聊机器人、对话助手等）", available: true },
    { text: "商城系统（商品、订单、支付）", available: true },
    { text: "社区系统（帖子、评论、互动）", available: true },
    { text: "个性化 UI/UX 品牌定制", available: true },
    { text: "专属技术对接与支持", available: true },
    { text: "长期维护与运维方案", available: true },
    { text: "独立部署与上线支持", available: true },
];

/** 根据 index 获取图标样式 */
export function getFeatureIconStyle(index: number, isDark: boolean) {
    const scheme = COLOR_SCHEMES[index % COLOR_SCHEMES.length];
    return {
        background: isDark ? `rgba(255,255,255,0.06)` : scheme.light,
        color: scheme.primary,
    };
}

/** 下载平台数据（全平台安装文件，均托管在 GitHub Release） */
export const DOWNLOAD_PLATFORMS: DownloadPlatform[] = [
    // Windows（NSIS 安装器）
    {
        key: "windows-x64-setup",
        label: "Windows",
        filename: `JiwuChat_${VERSION}_x64-setup.exe`,
        tooltip: getGithubReleaseUrl(`JiwuChat_${VERSION}_x64-setup.exe`),
        downloadUrl: getGithubReleaseUrl(`JiwuChat_${VERSION}_x64-setup.exe`),
        arch: "x64",
    },
    {
        key: "windows-ia32-setup",
        label: "Windows",
        filename: `JiwuChat_${VERSION}_ia32-setup.exe`,
        tooltip: getGithubReleaseUrl(`JiwuChat_${VERSION}_ia32-setup.exe`),
        downloadUrl: getGithubReleaseUrl(`JiwuChat_${VERSION}_ia32-setup.exe`),
        arch: "ia32",
    },
    // macOS（DMG + ZIP）
    {
        key: "macos-x64-dmg",
        label: "macOS",
        filename: `JiwuChat_${VERSION}_x64.dmg`,
        tooltip: getGithubReleaseUrl(`JiwuChat_${VERSION}_x64.dmg`),
        downloadUrl: getGithubReleaseUrl(`JiwuChat_${VERSION}_x64.dmg`),
        arch: "x64",
    },
    {
        key: "macos-arm64-dmg",
        label: "macOS",
        filename: `JiwuChat_${VERSION}_arm64.dmg`,
        tooltip: getGithubReleaseUrl(`JiwuChat_${VERSION}_arm64.dmg`),
        downloadUrl: getGithubReleaseUrl(`JiwuChat_${VERSION}_arm64.dmg`),
        arch: "arm64",
    },
    {
        key: "macos-x64-zip",
        label: "macOS",
        filename: `JiwuChat_${VERSION}_x64.zip`,
        tooltip: getGithubReleaseUrl(`JiwuChat_${VERSION}_x64.zip`),
        downloadUrl: getGithubReleaseUrl(`JiwuChat_${VERSION}_x64.zip`),
        arch: "x64",
    },
    {
        key: "macos-arm64-zip",
        label: "macOS",
        filename: `JiwuChat_${VERSION}_arm64.zip`,
        tooltip: getGithubReleaseUrl(`JiwuChat_${VERSION}_arm64.zip`),
        downloadUrl: getGithubReleaseUrl(`JiwuChat_${VERSION}_arm64.zip`),
        arch: "arm64",
    },
    // Linux（AppImage + deb + rpm）
    {
        key: "linux-x64-appimage",
        label: "Linux",
        filename: `JiwuChat_${VERSION}_x64.AppImage`,
        tooltip: getGithubReleaseUrl(`JiwuChat_${VERSION}_x64.AppImage`),
        downloadUrl: getGithubReleaseUrl(`JiwuChat_${VERSION}_x64.AppImage`),
        arch: "x64",
    },
    {
        key: "linux-arm64-appimage",
        label: "Linux",
        filename: `JiwuChat_${VERSION}_arm64.AppImage`,
        tooltip: getGithubReleaseUrl(`JiwuChat_${VERSION}_arm64.AppImage`),
        downloadUrl: getGithubReleaseUrl(`JiwuChat_${VERSION}_arm64.AppImage`),
        arch: "arm64",
    },
    {
        key: "linux-x64-deb",
        label: "Linux",
        filename: `JiwuChat_${VERSION}_x64.deb`,
        tooltip: getGithubReleaseUrl(`JiwuChat_${VERSION}_x64.deb`),
        downloadUrl: getGithubReleaseUrl(`JiwuChat_${VERSION}_x64.deb`),
        arch: "x64",
    },
    {
        key: "linux-arm64-deb",
        label: "Linux",
        filename: `JiwuChat_${VERSION}_arm64.deb`,
        tooltip: getGithubReleaseUrl(`JiwuChat_${VERSION}_arm64.deb`),
        downloadUrl: getGithubReleaseUrl(`JiwuChat_${VERSION}_arm64.deb`),
        arch: "arm64",
    },
    {
        key: "linux-x64-rpm",
        label: "Linux",
        filename: `JiwuChat_${VERSION}_x64.rpm`,
        tooltip: getGithubReleaseUrl(`JiwuChat_${VERSION}_x64.rpm`),
        downloadUrl: getGithubReleaseUrl(`JiwuChat_${VERSION}_x64.rpm`),
        arch: "x64",
    },
];
