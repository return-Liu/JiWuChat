<template>
  <div>
    <!-- 品牌故事 -->
    <div v-if="shouldShowSection('anchor-brand-story')">
      <AnchorHeading anchor-id="anchor-brand-story" tag="h1"> 品牌故事 </AnchorHeading>

      <div class="brand-intro">
        <p class="brand-intro-text">
          极物聊天是一款即时通讯软件，目前处于开发阶段。
          支持文字、语音、图片、文件传输、音视频通话等基础通讯功能。 覆盖桌面端（Electron）和 Web
          端。
        </p>
      </div>

      <div class="brand-divider"></div>

      <h2 class="brand-section-title">品牌故事</h2>
      <p class="brand-subtitle">连接每一份热爱</p>
      <p>
        极物聊天由独立开发者创建。项目始于 2026 年 1 月，
        目标是做一个功能集中、界面简洁的即时通讯工具。
      </p>
      <p>产品定位：轻量级即时通讯软件。不集成无关功能， 不推送营销信息，不默认关注无关账号。</p>
      <p>核心场景：好友聊天、群组沟通、文件协作。</p>

      <div class="brand-divider"></div>

      <h2 class="brand-section-title">社会责任</h2>
      <p class="brand-subtitle">用户为本 · 科技向善</p>

      <h3>隐私保护</h3>
      <ul>
        <li>聊天记录仅保存在用户本地设备，不上传服务器</li>
        <li>不读取、不上传用户通讯录</li>
        <li>不向第三方开放用户数据接口</li>
        <li>支持设备管理，用户可查看并下线已登录设备</li>
        <li>密码采用 bcryptjs 哈希加密存储</li>
      </ul>

      <h3>内容治理</h3>
      <ul>
        <li>建立用户举报机制，举报内容 24 小时内审核</li>
        <li>违规账号按规则采取限制或封禁处理</li>
        <li>不推荐低质内容，不靠擦边内容引流</li>
      </ul>

      <h3>未成年人保护</h3>
      <ul>
        <li>注册时需验证年龄</li>
        <li>未成年账号默认开启青少年模式</li>
        <li>青少年模式下限制陌生人添加和部分功能使用</li>
      </ul>

      <div class="brand-divider"></div>

      <h2 class="brand-section-title">科技向善 · 社交共探未来</h2>

      <h3>AI 功能</h3>
      <ul>
        <li>群聊支持 @AI 机器人获取信息</li>
        <li>已接入 DeepSeek、讯飞星火、KimiAI 三个模型</li>
        <li>AI 定位为辅助工具，不替代真人社交</li>
      </ul>

      <h3>产品理念</h3>
      <ul>
        <li>不制造社交焦虑，不强制用户在线</li>
        <li>不设排行榜、不展示在线状态（用户可自主选择是否展示）</li>
        <li>功能迭代以用户实际需求为准，不盲目跟风</li>
      </ul>
    </div>

    <SectionDivider />

    <!-- 2026 正向价值年刊 -->
    <div v-if="shouldShowSection('anchor-vision')">
      <AnchorHeading anchor-id="anchor-vision"> 2026 正向价值年刊 </AnchorHeading>

      <p class="annual-intro-text">极物聊天 2026 年度开发动态：</p>

      <table class="annual-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>内容</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2026.01</td>
            <td>项目启动，完成用户系统开发（注册登录、个人资料编辑）</td>
          </tr>
          <tr>
            <td>2026.02</td>
            <td>完成好友系统（添加/删除/审批/备注）和群组功能（创建/搜索/加入）</td>
          </tr>
          <tr>
            <td>2026.03</td>
            <td>完成即时消息系统（文字/图片/语音/文件/音视频通话）</td>
          </tr>
          <tr>
            <td>2026.04</td>
            <td>Electron 桌面端适配完成，支持 Windows / macOS</td>
          </tr>
          <tr>
            <td>2026.05</td>
            <td>Web 端开发完成，与桌面端数据互通</td>
          </tr>
          <tr>
            <td>2026.06</td>
            <td>AI 群聊机器人接入（DeepSeek、讯飞星火、KimiAI）</td>
          </tr>
          <tr>
            <td>2026.07</td>
            <td>青少年模式、设备管理、举报系统开发完成</td>
          </tr>
        </tbody>
      </table>
    </div>

    <SectionDivider />

    <!-- 核心价值观 -->
    <div v-if="shouldShowSection('anchor-values')">
      <AnchorHeading anchor-id="anchor-values"> 核心价值观 </AnchorHeading>
      <div class="values-grid">
        <div class="value-card" v-for="item in coreValues" :key="item.title">
          <div class="value-icon-wrap">
            <i :class="['iconfont', item.icon, 'value-icon']"></i>
          </div>
          <div class="value-info">
            <h4 class="value-title">{{ item.title }}</h4>
            <p class="value-desc">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <SectionDivider />

    <!-- 项目里程碑 -->
    <div v-if="shouldShowSection('anchor-milestones')">
      <AnchorHeading anchor-id="anchor-milestones"> 项目里程碑 </AnchorHeading>
      <div class="milestone-timeline">
        <div class="milestone-item" v-for="(item, idx) in milestones" :key="idx">
          <div class="milestone-dot"></div>
          <div class="milestone-line" v-if="idx < milestones.length - 1"></div>
          <div class="milestone-content">
            <span class="milestone-date">{{ item.date }}</span>
            <h4 class="milestone-title">{{ item.title }}</h4>
            <p class="milestone-desc">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <SectionDivider />

    <!-- 技术架构 -->
    <div v-if="shouldShowSection('anchor-architecture')">
      <AnchorHeading anchor-id="anchor-architecture"> 技术架构 </AnchorHeading>
      <ul>
        <li><strong>前端：</strong>Electron + Nuxt3 + Ant Design Vue 4.x</li>
        <li><strong>后端：</strong>Node.js + Express + Sequelize</li>
        <li><strong>通信：</strong>Socket.IO（WebSocket）+ PeerJS（WebRTC）</li>
        <li><strong>数据库：</strong>MySQL</li>
        <li><strong>包管理：</strong>pnpm monorepo</li>
      </ul>
    </div>

    <SectionDivider />

    <!-- 联系我们 -->
    <div v-if="shouldShowSection('anchor-contact-overview')">
      <AnchorHeading anchor-id="anchor-contact-overview"> 联系我们 </AnchorHeading>
      <ul>
        <li>邮箱：2286223728@QQ.com</li>
        <li>官网：https://jiwuchat.com</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import AnchorHeading from "../shared/AnchorHeading.vue";
import SectionDivider from "../shared/SectionDivider.vue";

defineProps<{
  shouldShowSection: (anchorId: string) => boolean;
}>();

const coreValues = [
  {
    icon: "icon-jijian",
    title: "极简至上",
    desc: "去除一切冗余，只保留真正有价值的功能。每一个像素、每一行代码都有其存在的意义。",
  },
  {
    icon: "icon-anquan",
    title: "安全可靠",
    desc: "bcryptjs 密码哈希、JWT 双 Token、HTTPS/WSS 全链路加密，你的数据只属于你自己。",
  },
  {
    icon: "icon-kaifangsousuo",
    title: "开放透明",
    desc: "项目暂时未开源，后续计划逐步开放。技术方案公开透明，积极听取社区反馈。",
  },
  {
    icon: "icon-gaoxiao",
    title: "高效流畅",
    desc: "约 10MB 轻量体积，2 秒极速启动，WebSocket 毫秒级消息送达。",
  },
  {
    icon: "icon-wanmeikuapingtai",
    title: "跨平台无缝",
    desc: "一套代码同时覆盖 Electron 桌面端与 Web 端，数据云端同步。",
  },
  {
    icon: "icon-yonghu1",
    title: "用户至上",
    desc: "每个交互细节都经过反复打磨，让用户以最自然的直觉完成操作。",
  },
];

const milestones = [
  {
    date: "2026 年 1 月",
    title: "项目启动 · 用户系统",
    desc: "搭建项目框架，完成用户核心模块：账号/手机号/邮箱注册登录、密码修改、个人资料编辑。",
  },
  {
    date: "2026 年 1 月",
    title: "群组 & 即时消息",
    desc: "上线群组功能（创建/搜索/加入群聊）、WebSocket 消息系统，支持文本消息实时收发。",
  },
  {
    date: "2026 年 1-2 月",
    title: "QQ 登录 & 好友系统",
    desc: "接入 QQ 授权一键登录与极验行为验证；上线好友系统（搜索/添加/删除/审批/备注）。",
  },
  {
    date: "2026 年 2-4 月",
    title: "功能全面扩展",
    desc: "消息类型扩展（语音/文件/音视频通话）、群组功能完善（禁言/审批/头衔/等级）、举报系统、设备管理、隐私设置、临时会话。",
  },
  {
    date: "2026 年 4-6 月",
    title: "商城 & 社区 & 优化",
    desc: "上线商城系统与社区系统；QQ 登录性能优化（耗时降低 60%+）；更新日志支持版本号/标题/摘要/封面图。",
  },
  {
    date: "2026 年 7 月",
    title: "v2.1.4 · 工程化升级",
    desc: "前端全面迁移至 Ant Design Vue 4.x；后端核心模块迁移 TypeScript；新增 ESLint + Prettier + Vitest 工程化体系；统一 Markdown 渲染。",
  },
];
</script>

<style scoped>
.brand-intro {
  margin: 12px 0 20px;
}

.brand-intro-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
  line-height: 1.8;
  margin: 0;
  font-family: "Alimama", Helvetica, sans-serif;
}

.brand-divider {
  height: 1px;
  background: var(--border-color);
  margin: 28px 0;
  opacity: 0.5;
}

.brand-section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: "Alimama", Helvetica, sans-serif;
}

.brand-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 16px;
  font-family: "Alimama", Helvetica, sans-serif;
}

.annual-intro-text {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 8px 0 16px;
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
}

.annual-table {
  width: 100%;
  border-collapse: collapse;
  font-family: "Alimama", Helvetica, sans-serif;
  font-size: 14px;
}

.annual-table th {
  text-align: left;
  padding: 10px 12px;
  background: var(--bg-hover, rgba(0, 0, 0, 0.03));
  border-bottom: 2px solid var(--border-color);
  font-weight: 600;
  color: var(--text-primary);
}

.annual-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.annual-table tr:hover td {
  background: var(--bg-hover, rgba(0, 0, 0, 0.02));
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin: 20px 0;
}

.value-card {
  display: flex;
  gap: 14px;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  transition: all 0.25s ease;
  background: transparent;
}

.value-card:hover {
  border-color: #5d33f6;
  box-shadow: 0 4px 16px rgba(93, 51, 246, 0.08);
}

.dark .value-card:hover {
  border-color: #8b5cf6;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.12);
}

.value-icon-wrap {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(93, 51, 246, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark .value-icon-wrap {
  background: rgba(139, 92, 246, 0.12);
}

.value-icon {
  font-size: 22px;
  color: #5d33f6;
}

.dark .value-icon {
  color: #8b5cf6;
}

.value-info {
  flex: 1;
  min-width: 0;
}

.value-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px;
  font-family: "Alimama", Helvetica, sans-serif;
}

.value-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
}

.milestone-timeline {
  margin: 24px 0;
  padding-left: 8px;
}

.milestone-item {
  display: flex;
  gap: 16px;
  position: relative;
  padding-bottom: 28px;
}

.milestone-item:last-child {
  padding-bottom: 0;
}

.milestone-dot {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #5d33f6;
  margin-top: 6px;
  position: relative;
  z-index: 1;
  box-shadow: 0 0 0 4px rgba(93, 51, 246, 0.15);
}

.dark .milestone-dot {
  background: #8b5cf6;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
}

.milestone-line {
  position: absolute;
  left: 5px;
  top: 18px;
  bottom: 0;
  width: 2px;
  background: var(--border-color);
}

.milestone-content {
  flex: 1;
  min-width: 0;
}

.milestone-date {
  font-size: 12px;
  font-weight: 600;
  color: #5d33f6;
  letter-spacing: 0.5px;
  font-family: "Alimama", Helvetica, sans-serif;
}

.dark .milestone-date {
  color: #8b5cf6;
}

.milestone-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 4px 0 6px;
  font-family: "Alimama", Helvetica, sans-serif;
}

.milestone-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
}

@media (max-width: 900px) {
  .values-grid {
    grid-template-columns: 1fr;
  }
}
</style>
