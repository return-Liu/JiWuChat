<template>
  <!-- 参与贡献 -->
  <div v-if="shouldShowSection('anchor-contribute-overview')">
    <AnchorHeading anchor-id="anchor-contribute-overview" tag="h1"> 参与贡献 </AnchorHeading>
    <p>
      极物聊天<strong>暂时未开源</strong>，后续计划逐步开放核心代码。
      欢迎每一位开发者关注项目进展，参与社区讨论与反馈。 无论是提交代码、报告
      Bug、改进文档，还是提出新功能建议，你的每一份贡献都意义重大。
    </p>
  </div>

  <SectionDivider />

  <!-- 代码规范 -->
  <div v-if="shouldShowSection('anchor-contribute-code-style')">
    <AnchorHeading anchor-id="anchor-contribute-code-style"> 代码规范 </AnchorHeading>
    <p>项目使用统一的代码规范工具，确保代码风格一致：</p>
    <ul>
      <li><strong>ESLint：</strong>基于 @antfu/eslint-config，统一 JS/TS/Vue 代码规则</li>
      <li><strong>Prettier：</strong>自动格式化代码，统一缩进、引号、分号等风格</li>
      <li><strong>TypeScript：</strong>前后端均使用 TypeScript，提供完整类型定义</li>
    </ul>
    <p>提交代码前请运行：</p>
    <CodeBlock> pnpm lint # 代码检查 pnpm format # 代码格式化 pnpm test # 运行测试 </CodeBlock>
  </div>

  <SectionDivider />

  <!-- 贡献流程 -->
  <div v-if="shouldShowSection('anchor-contribute-flow')">
    <AnchorHeading anchor-id="anchor-contribute-flow"> 贡献流程 </AnchorHeading>
    <div class="contribute-steps">
      <div class="contribute-step" v-for="(step, idx) in contributeSteps" :key="idx">
        <div class="step-number">{{ idx + 1 }}</div>
        <div class="step-content">
          <h4>{{ step.title }}</h4>
          <p>{{ step.desc }}</p>
        </div>
      </div>
    </div>
  </div>

  <SectionDivider />

  <!-- 项目结构 -->
  <div v-if="shouldShowSection('anchor-contribute-structure')">
    <AnchorHeading anchor-id="anchor-contribute-structure"> 项目结构 </AnchorHeading>
    <p>项目采用 pnpm monorepo 管理，包含两个子项目：</p>
    <div class="structure-cards">
      <div class="structure-card">
        <div class="structure-card-header">
          <i class="iconfont icon-vue structure-icon"></i>
          <h4>JiWu-chat-app</h4>
        </div>
        <p>前端项目，基于 Nuxt3 + Electron</p>
        <ul>
          <li><code>components/</code> — 50+ Vue 组件</li>
          <li><code>pages/</code> — 页面路由</li>
          <li><code>stores/</code> — Pinia 状态管理</li>
          <li><code>composables/</code> — 组合式函数</li>
          <li><code>electron/</code> — Electron 主进程</li>
          <li><code>assets/</code> — 静态资源 & 字体</li>
        </ul>
      </div>
      <div class="structure-card">
        <div class="structure-card-header">
          <i class="iconfont icon-sql structure-icon"></i>
          <h4>JiWu-chat-node</h4>
        </div>
        <p>后端项目，基于 Express + Sequelize</p>
        <ul>
          <li><code>routes/</code> — API 路由</li>
          <li><code>controllers/</code> — 控制器逻辑</li>
          <li><code>models/</code> — Sequelize 数据模型</li>
          <li><code>middleware/</code> — 中间件</li>
          <li><code>migrations/</code> — 70+ 数据库迁移</li>
          <li><code>seeders/</code> — 种子数据</li>
        </ul>
      </div>
    </div>
  </div>

  <SectionDivider />

  <!-- 开发环境搭建 -->
  <div v-if="shouldShowSection('anchor-contribute-setup')">
    <AnchorHeading anchor-id="anchor-contribute-setup"> 开发环境搭建 </AnchorHeading>
    <ul>
      <li><strong>Node.js：</strong>版本 >= 18</li>
      <li><strong>包管理器：</strong>pnpm（<code>npm install -g pnpm</code>）</li>
      <li><strong>数据库：</strong>MySQL，创建数据库后配置 <code>.env</code> 连接信息</li>
      <li>
        <strong>环境变量：</strong>复制 <code>.env.example</code> 为
        <code>.env</code>，填写数据库、JWT 密钥、QQ 登录等配置
      </li>
    </ul>
    <p>启动开发环境：</p>
    <CodeBlock>
      # 前端 cd JiWu-chat-app && pnpm install && pnpm dev # 后端 cd JiWu-chat-node && pnpm install
      && pnpm dev
    </CodeBlock>
  </div>

  <SectionDivider />

  <!-- 联系方式 -->
  <div v-if="shouldShowSection('anchor-contribute-contact')">
    <AnchorHeading anchor-id="anchor-contribute-contact"> 联系方式 </AnchorHeading>
    <ul>
      <li>📧 邮箱：2286223728@QQ.com</li>
      <li>🌐 官网：https://jiwuchat.com</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import AnchorHeading from "../shared/AnchorHeading.vue";
import SectionDivider from "../shared/SectionDivider.vue";
import CodeBlock from "../shared/CodeBlock.vue";

defineProps<{
  shouldShowSection: (anchorId: string) => boolean;
}>();

const contributeSteps = [
  { title: "获取源码", desc: "项目暂时未开源，源码后续逐步开放。可先关注项目动态，了解最新进展。" },
  { title: "创建分支", desc: "基于 main 分支创建功能分支，命名规范：feature/xxx 或 fix/xxx。" },
  { title: "编写代码", desc: "遵循项目代码规范，确保通过 ESLint 和 Prettier 检查。" },
  { title: "运行测试", desc: "执行 pnpm test 确保现有测试通过，为新功能编写测试用例。" },
  { title: "提交代码", desc: "完成开发后提交代码到开发分支，描述改动内容和原因，等待维护者审核。" },
  { title: "Code Review", desc: "维护者会进行代码审查，请根据反馈修改，通过后即可合并。" },
];
</script>

<style scoped>
.contribute-steps {
  margin: 20px 0;
}

.contribute-step {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}

.contribute-step:last-child {
  border-bottom: none;
}

.step-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #5d33f6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  font-family: "Alimama", Helvetica, sans-serif;
}

.dark .step-number {
  background: #8b5cf6;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-content h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
  font-family: "Alimama", Helvetica, sans-serif;
}

.step-content p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
}

.structure-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin: 20px 0;
}

.structure-card {
  padding: 20px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  transition: all 0.25s ease;
}

.structure-card:hover {
  border-color: #5d33f6;
}

.dark .structure-card:hover {
  border-color: #8b5cf6;
}

.structure-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.structure-card-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  font-family: "Alimama", Helvetica, sans-serif;
}

.structure-icon {
  font-size: 20px;
  color: #5d33f6;
}

.dark .structure-icon {
  color: #8b5cf6;
}

.structure-card > p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 10px;
  font-weight: 500;
}

.structure-card ul {
  padding-left: 18px;
  margin: 0;
}

.structure-card li {
  font-size: 12px;
  margin-bottom: 3px;
}

@media (max-width: 900px) {
  .structure-cards {
    grid-template-columns: 1fr;
  }
}
</style>
