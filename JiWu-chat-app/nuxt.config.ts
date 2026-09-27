// Nuxt 3 应用的基本配置文件
export default defineNuxtConfig({
  // 引入全局样式文件
  css: [
    "~/assets/globals.css", // 全局基础样式
    "~/assets/font/iconfont.css", // 图标字体样式
    "~/assets/scss/theme.scss",
  ],

  // 在页面渲染前设置主题，防止暗色模式下的白屏闪烁
  app: {
    // 使用相对路径，确保 Electron 桌面端通过 file:// 协议加载时资源能正确解析
    baseURL: "./",
    head: {
      script: [
        {
          innerHTML: `
            (function() {
              // 认证页面（登录/注册/忘记密码）不需要主题，始终浅色
              var path = window.location.hash.replace(/^#/, '') || window.location.pathname;
              var authPage = /^\\/(login|register|forgot-password)/.test(path);
              if (authPage) return;
              var theme = localStorage.getItem('vitepress-theme-appearance');
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              }
            })();
          `,
          type: "text/javascript",
        },
      ],
    },
  },

  // 启用 Nuxt 模块
  modules: ["@pinia/nuxt", "pinia-plugin-persistedstate/nuxt", "@nuxtjs/i18n", "nuxt-charts",], // 状态管理模块及其持久化插件 + 国际化

  // 插件配置:注册客户端插件
  plugins: ["~/plugins/antd-vue.client"], // UI 组件库插件

  // i18n 国际化配置
  i18n: {
    vueI18n: "i18n.config.ts",
    locales: ["zh", "en"],
    defaultLocale: "zh",
    strategy: "no_prefix",
    detectBrowserLanguage: false,
  },

  // ===== SSG 动静结合：官网首页预渲染，其他页面保持 SPA =====
  ssr: true,

  // Nitro 预设（静态托管时使用）
  nitro: {
    preset: "static",
    prerender: {
      routes: ["/"],           // 预渲染首页
      crawlLinks: false,       // 不自动爬取链接（避免把登录页也预渲染）
    },
  },

  // 路由规则：按路由粒度控制渲染模式
  routeRules: {
    // 首页：完全预渲染为静态 HTML（SSG）
    "/": { prerender: true },
    // QQ 登录回调页：保持 SPA 模式，确保能正确处理 hash 参数
    "/auth/qq/**": { ssr: false },
    // 其他所有页面：SPA 模式（仅在客户端渲染，SSG 构建时跳过）
    "/**": { ssr: false },
  },

  devtools: {
    enabled: false,
  },

  // Vite 配置优化
  vite: {
    // 使用相对路径，确保 file:// 协议下资源能正确加载
    base: "./",
    server: {
      // 文件监听配置：忽略 node_modules 和 dist 减少不必要的重启
      watch: {
        ignored: ["**/node_modules/**", "**/dist/**", "**/.nuxt/**"],
      },
    },
  },
});