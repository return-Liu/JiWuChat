<template>
  <!-- 设计哲学 -->
  <div v-if="shouldShowSection('anchor-philosophy')">
    <AnchorHeading anchor-id="anchor-philosophy" tag="h1"> 设计哲学 </AnchorHeading>
    <p>极物聊天的设计哲学可概括为三个关键词：<strong>极简、直觉、克制</strong>。</p>
    <p>
      我们坚信<strong>最好的设计就是让用户感觉不到设计的存在</strong>。
      每一个交互细节都经过反复推敲，每一个视觉元素都有其存在的理由。
      不追求炫技式的动画，而是专注于让用户以最少的操作完成目标。
    </p>
  </div>

  <SectionDivider />

  <!-- 设计原则 -->
  <div v-if="shouldShowSection('anchor-principles')">
    <AnchorHeading anchor-id="anchor-principles"> 设计原则 </AnchorHeading>
    <div class="principles-list">
      <div class="principle-item" v-for="item in designPrinciples" :key="item.title">
        <div class="principle-index">{{ item.index }}</div>
        <div class="principle-body">
          <h4 class="principle-title">{{ item.title }}</h4>
          <p class="principle-desc">{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </div>

  <SectionDivider />

  <!-- 视觉设计 -->
  <div v-if="shouldShowSection('anchor-visual')">
    <AnchorHeading anchor-id="anchor-visual"> 视觉设计 </AnchorHeading>

    <h3>色彩系统</h3>
    <p>
      主色调采用深邃的紫色（#5D33F6），象征创造力与科技感；
      辅助色以中性灰为基底，确保长时间使用不造成视觉疲劳。
    </p>
    <div class="color-palette">
      <div class="color-item" v-for="color in colorPalette" :key="color.name">
        <div class="color-swatch" :style="{ background: color.hex }"></div>
        <div class="color-info">
          <span class="color-name">{{ color.name }}</span>
          <span class="color-hex">{{ color.hex }}</span>
        </div>
      </div>
    </div>

    <h3>字体系统</h3>
    <p>
      选用<strong>阿里巴巴 Alimama 系列字体</strong>作为主字体，字形圆润亲和，
      屏幕可读性极佳。配合合理的字号层级（12px~26px）与行高（1.6~1.8）， 确保文本内容清晰易读。
    </p>

    <h3>主题系统</h3>
    <p>
      内置<strong>浅色/深色双主题</strong>，通过 CSS 变量（--bg-primary、--text-primary 等）
      实现全局无缝切换。深色模式经过精心调校，低光环境下依然舒适护眼。
    </p>
  </div>

  <SectionDivider />

  <!-- 设计工具链 -->
  <div v-if="shouldShowSection('anchor-design-tools')">
    <AnchorHeading anchor-id="anchor-design-tools"> 设计工具链 </AnchorHeading>
    <ul>
      <li><strong>图标库：</strong>iconfont 自定义图标集（项目 ID: 5139189），100+ 个专用图标</li>
      <li><strong>字体：</strong>阿里巴巴 Alimama 系列免费商用字体</li>
      <li><strong>UI 组件库：</strong>Ant Design Vue 4.x，统一的设计语言</li>
      <li><strong>主题变量：</strong>全局 CSS 自定义属性，支持浅色/深色一键切换</li>
    </ul>
  </div>

  <SectionDivider />

  <!-- 交互设计 -->
  <div v-if="shouldShowSection('anchor-interaction')">
    <AnchorHeading anchor-id="anchor-interaction"> 交互设计 </AnchorHeading>
    <ul>
      <li><strong>即时反馈：</strong>每个操作都有明确的视觉或动效反馈，系统状态一目了然</li>
      <li><strong>容错设计：</strong>关键操作提供确认弹窗，支持消息撤回、删除确认等安全措施</li>
      <li><strong>渐进呈现：</strong>复杂功能采用渐进式引导，避免一次性信息过载</li>
      <li><strong>键盘优先：</strong>核心操作支持快捷键（Ctrl+K 搜索、Esc 关闭弹窗等）</li>
      <li><strong>平滑过渡：</strong>页面切换和状态变更使用过渡动画，保持操作连贯性</li>
    </ul>
  </div>

  <SectionDivider />

  <!-- 性能设计 -->
  <div v-if="shouldShowSection('anchor-performance')">
    <AnchorHeading anchor-id="anchor-performance"> 性能设计 </AnchorHeading>
    <p>
      轻量是我们的核心承诺。极物聊天安装包仅约 <strong>10MB</strong>， 启动速度控制在
      <strong>2 秒以内</strong>，内存占用远低于同类产品。
    </p>
    <ul>
      <li><strong>按需加载：</strong>路由级别代码分割（Nuxt3 自动），首屏仅加载必要资源</li>
      <li><strong>虚拟列表：</strong>消息列表采用虚拟滚动，万条消息流畅滚动无卡顿</li>
      <li><strong>资源优化：</strong>图片懒加载、字体子集化、CSS 按需注入</li>
      <li><strong>缓存策略：</strong>合理利用 Pinia 持久化与浏览器缓存，减少网络请求</li>
    </ul>
  </div>

  <SectionDivider />

  <!-- 安全设计 -->
  <div v-if="shouldShowSection('anchor-security')">
    <AnchorHeading anchor-id="anchor-security"> 安全设计 </AnchorHeading>
    <p>安全是通讯应用的基石，极物聊天从设计之初就将安全置于最高优先级：</p>
    <ul>
      <li><strong>密码安全：</strong>bcryptjs 哈希加盐存储，密码更新时间追踪</li>
      <li><strong>传输安全：</strong>全链路 HTTPS + WSS 加密传输，CORS 跨域白名单</li>
      <li><strong>身份认证：</strong>JWT accessToken + refreshToken 双 Token 机制，支持设备管理</li>
      <li><strong>接口防护：</strong>Helmet 安全头、请求频率限制、极验行为验证</li>
      <li><strong>数据隔离：</strong>严格的用户数据隔离，中间件校验权限，防止越权访问</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import AnchorHeading from "../shared/AnchorHeading.vue";
import SectionDivider from "../shared/SectionDivider.vue";

defineProps<{
  shouldShowSection: (anchorId: string) => boolean;
}>();

const designPrinciples = [
  {
    index: "01",
    title: "内容优先",
    desc: "界面设计以内容为核心，减少装饰性元素干扰。打开应用第一眼看到的是对话内容，而非花哨的界面。",
  },
  {
    index: "02",
    title: "一致性",
    desc: "全局统一的交互模式与视觉语言。相同功能使用相同操作方式，降低学习成本。",
  },
  {
    index: "03",
    title: "可访问性",
    desc: "确保所有用户都能顺畅使用。支持键盘导航，色彩对比度符合 WCAG 标准。",
  },
  {
    index: "04",
    title: "响应式适配",
    desc: "从桌面大屏到移动小窗，界面自适应布局。窗口缩放不影响核心功能使用。",
  },
  {
    index: "05",
    title: "情感化细节",
    desc: "在保证功能性的前提下，通过微妙的动画、友好的提示文案和精致的图标，带来愉悦体验。",
  },
];

const colorPalette = [
  { name: "主色调", hex: "#5D33F6" },
  { name: "主色浅", hex: "#8B5CF6" },
  { name: "成功绿", hex: "#52C41A" },
  { name: "警告橙", hex: "#FAAD14" },
  { name: "错误红", hex: "#FF4D4F" },
  { name: "文字主", hex: "#1A1A2E" },
  { name: "文字辅", hex: "#6B7280" },
  { name: "背景浅", hex: "#F5F6FA" },
  { name: "背景深", hex: "#0A0A0A" },
];
</script>

<style scoped>
.principles-list {
  margin: 20px 0;
}

.principle-item {
  display: flex;
  gap: 18px;
  padding: 18px 0;
  border-bottom: 1px solid var(--border-color);
}

.principle-item:last-child {
  border-bottom: none;
}

.principle-index {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(93, 51, 246, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  color: #5d33f6;
  font-family: "Alimama", Helvetica, sans-serif;
}

.dark .principle-index {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.principle-body {
  flex: 1;
  min-width: 0;
}

.principle-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px;
  font-family: "Alimama", Helvetica, sans-serif;
}

.principle-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.7;
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
}

.color-palette {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 16px 0 24px;
}

.color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.color-swatch {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  transition: transform 0.2s ease;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.color-name {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
}

.color-hex {
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.6;
  font-weight: 500;
  font-family: monospace;
}

@media (max-width: 900px) {
  .color-palette {
    justify-content: center;
  }
}
</style>
