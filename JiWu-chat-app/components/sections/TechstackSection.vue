<template>
  <!-- 技术栈概览 -->
  <div v-if="shouldShowSection('anchor-tech-overview')">
    <AnchorHeading anchor-id="anchor-tech-overview" tag="h1"> 技术栈概览 </AnchorHeading>
    <p>
      极物聊天采用 <strong>pnpm monorepo</strong> 管理前后端两个项目， 前端
      <code>JiWu-chat-app</code> 基于 Nuxt3 + Electron， 后端 <code>JiWu-chat-node</code> 基于
      Express + Sequelize。
    </p>
  </div>

  <SectionDivider />

  <!-- 前端技术栈 -->
  <div v-if="shouldShowSection('anchor-tech-frontend')">
    <AnchorHeading anchor-id="anchor-tech-frontend"> 前端技术栈 </AnchorHeading>
    <div class="tech-grid">
      <TechCard
        v-for="t in frontendTechs"
        :key="t.name"
        :category="t.category"
        :name="t.name"
        :version="t.version"
        :desc="t.desc"
      />
    </div>
  </div>

  <SectionDivider />

  <!-- 后端技术栈 -->
  <div v-if="shouldShowSection('anchor-tech-backend')">
    <AnchorHeading anchor-id="anchor-tech-backend"> 后端技术栈 </AnchorHeading>
    <div class="tech-grid">
      <TechCard
        v-for="t in backendTechs"
        :key="t.name"
        :category="t.category"
        :name="t.name"
        :version="t.version"
        :desc="t.desc"
      />
    </div>
  </div>

  <SectionDivider />

  <!-- 工程化工具链 -->
  <div v-if="shouldShowSection('anchor-tech-tools')">
    <AnchorHeading anchor-id="anchor-tech-tools"> 工程化工具链 </AnchorHeading>
    <div class="tech-grid">
      <TechCard
        v-for="t in toolTechs"
        :key="t.name"
        :category="t.category"
        :name="t.name"
        :version="t.version"
        :desc="t.desc"
      />
    </div>
  </div>

  <SectionDivider />

  <!-- 项目数据 -->
  <div v-if="shouldShowSection('anchor-tech-project-stats')">
    <AnchorHeading anchor-id="anchor-tech-project-stats"> 项目数据 </AnchorHeading>
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-number">70+</span>
        <span class="stat-label">数据库迁移</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">50+</span>
        <span class="stat-label">Vue 组件</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">~10MB</span>
        <span class="stat-label">安装包体积</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">2</span>
        <span class="stat-label">子项目 (monorepo)</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">23+</span>
        <span class="stat-label">后端测试用例</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">5</span>
        <span class="stat-label">前端测试用例</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AnchorHeading from "../shared/AnchorHeading.vue";
import SectionDivider from "../shared/SectionDivider.vue";
import TechCard from "../shared/TechCard.vue";

defineProps<{
  shouldShowSection: (anchorId: string) => boolean;
}>();

const frontendTechs = [
  { category: "框架", name: "Nuxt 3", version: "^3.0.0", desc: "Vue3 全栈框架，SSR/SSG 支持" },
  { category: "框架", name: "Electron", version: "^42.3.3", desc: "跨平台桌面应用框架" },
  { category: "UI 库", name: "Ant Design Vue", version: "^4.0.0", desc: "企业级 UI 组件库" },
  { category: "状态管理", name: "Pinia", version: "^3.0.4", desc: "Vue3 官方状态管理" },
  { category: "通信", name: "Socket.IO Client", version: "^4.8.3", desc: "WebSocket 实时通信" },
  { category: "通信", name: "PeerJS", version: "^1.5.5", desc: "WebRTC 音视频通话" },
  { category: "HTTP", name: "Axios", version: "^1.13.2", desc: "HTTP 请求库" },
  { category: "图表", name: "@ant-design/charts", version: "^2.6.7", desc: "数据可视化图表" },
  { category: "Markdown", name: "markdown-it", version: "^14.1.1", desc: "Markdown 渲染引擎" },
];

const backendTechs = [
  { category: "运行时", name: "Node.js", version: ">=18", desc: "JavaScript 服务端运行时" },
  { category: "框架", name: "Express", version: "^4.x", desc: "轻量级 Web 框架" },
  { category: "ORM", name: "Sequelize", version: "^6.x", desc: "数据库 ORM，支持 MySQL" },
  { category: "认证", name: "jsonwebtoken", version: "^9.x", desc: "JWT 令牌生成与验证" },
  { category: "加密", name: "bcryptjs", version: "^2.x", desc: "密码哈希加盐存储" },
  { category: "WebSocket", name: "ws", version: "^8.x", desc: "WebSocket 服务端实现" },
  { category: "安全", name: "Helmet", version: "^7.x", desc: "HTTP 安全头防护" },
  { category: "验证", name: "express-validator", version: "^7.x", desc: "请求参数校验" },
];

const toolTechs = [
  { category: "代码规范", name: "ESLint", version: "^9.0.0", desc: "代码质量检查" },
  { category: "格式化", name: "Prettier", version: "^3.3.0", desc: "代码自动格式化" },
  { category: "测试", name: "Vitest", version: "^3.0.0", desc: "单元测试框架" },
  { category: "类型", name: "TypeScript", version: "^5.x", desc: "静态类型检查" },
  { category: "样式", name: "Sass", version: "^1.97.3", desc: "CSS 预处理器" },
  { category: "构建", name: "electron-builder", version: "^24.13.3", desc: "Electron 打包工具" },
  { category: "包管理", name: "pnpm", version: "latest", desc: "高效的包管理器 (monorepo)" },
  { category: "数据库", name: "Sequelize CLI", version: "^6.x", desc: "数据库迁移管理" },
];
</script>

<style scoped>
.tech-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 20px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 20px 0;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 16px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  transition: all 0.25s ease;
}

.stat-card:hover {
  border-color: #5d33f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(93, 51, 246, 0.08);
}

.dark .stat-card:hover {
  border-color: #8b5cf6;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.12);
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #5d33f6;
  font-family: "Alimama", Helvetica, sans-serif;
}

.dark .stat-number {
  color: #8b5cf6;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 6px;
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
}

@media (max-width: 900px) {
  .tech-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .tech-grid {
    grid-template-columns: 1fr;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
