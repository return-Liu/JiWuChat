<template>
  <!-- 功能概览 -->
  <div v-if="shouldShowSection('anchor-features-overview')">
    <AnchorHeading anchor-id="anchor-features-overview" tag="h1"> 功能概览 </AnchorHeading>
    <p>
      极物聊天围绕<strong>即时通讯</strong>核心场景，构建了涵盖消息、联系人、群组、AI 助手、
      音视频通话、商城、社区等在内的完整功能体系。前端采用 Vue3 + Nuxt3 + Electron 架构， 后端基于
      Node.js + Express + Sequelize，通过 WebSocket 实现实时双向通信。
    </p>
  </div>

  <SectionDivider />

  <!-- 用户系统 -->
  <div v-if="shouldShowSection('anchor-feature-user')">
    <AnchorHeading anchor-id="anchor-feature-user"> 用户系统 </AnchorHeading>
    <ul>
      <li>
        <strong>多方式注册登录：</strong>支持账号密码、手机号、邮箱注册与登录，接入 QQ 授权一键登录
      </li>
      <li><strong>个人资料管理：</strong>头像上传、昵称修改、性别设置、个性签名编辑</li>
      <li><strong>账号安全：</strong>修改密码、设备管理（查看/下线登录设备）、密码更新时间追踪</li>
      <li><strong>隐私设置：</strong>在线状态可见性、允许陌生人邀请、临时会话开关</li>
      <li><strong>行为验证：</strong>接入极验验证，关键操作人机校验</li>
    </ul>
  </div>

  <SectionDivider />

  <!-- 即时消息 -->
  <div v-if="shouldShowSection('anchor-feature-message')">
    <AnchorHeading anchor-id="anchor-feature-message"> 即时消息 </AnchorHeading>
    <ul>
      <li><strong>多类型消息：</strong>文本、图片、文件、语音、音视频通话记录、系统通知等</li>
      <li><strong>消息操作：</strong>撤回（2分钟内）、删除（软删除）、引用回复、@群成员</li>
      <li><strong>文件传输：</strong>支持上传/下载/预览，断点续传，本地文件直接打开</li>
      <li><strong>消息状态：</strong>已发送/已送达/已读/发送中/发送失败，状态实时同步</li>
      <li><strong>实时通信：</strong>基于 Socket.IO 的 WebSocket 长连接，消息毫秒级送达</li>
    </ul>
  </div>

  <SectionDivider />

  <!-- 联系人 & 群组 -->
  <div v-if="shouldShowSection('anchor-feature-contact')">
    <AnchorHeading anchor-id="anchor-feature-contact"> 联系人 &amp; 群组 </AnchorHeading>
    <ul>
      <li><strong>好友管理：</strong>搜索/添加/删除好友，好友申请与审批，双向关系维护</li>
      <li><strong>联系人分组：</strong>支持备注名、分组标签，联系人列表快速检索</li>
      <li><strong>群组功能：</strong>创建群聊、搜索群聊、加入群聊，支持群号查找</li>
      <li><strong>群管理：</strong>群主/管理员多级角色，成员禁言、群全员禁言、入群审批</li>
      <li><strong>群成员头衔：</strong>自定义头衔与等级体系，群公告编辑</li>
      <li><strong>群邀请：</strong>支持成员邀请、陌生人邀请开关、邀请链接分享</li>
    </ul>
  </div>

  <SectionDivider />

  <!-- AI 助手 & 音视频 -->
  <div v-if="shouldShowSection('anchor-feature-ai-call')">
    <AnchorHeading anchor-id="anchor-feature-ai-call"> AI 助手 &amp; 音视频通话 </AnchorHeading>
    <ul>
      <li>
        <strong>AI 群聊机器人：</strong>已接入 DeepSeek、讯飞星火、KimiAI，群内 @机器人 即可对话
      </li>
      <li><strong>一对一音视频：</strong>基于 WebRTC + PeerJS 的实时音视频通话，低延迟</li>
      <li><strong>屏幕共享：</strong>一键共享桌面窗口，适合远程协作与在线演示</li>
      <li><strong>通话控制：</strong>麦克风/摄像头开关、扬声器控制、挂断、通话时长统计</li>
    </ul>
  </div>

  <SectionDivider />

  <!-- 商城 & 社区 -->
  <div v-if="shouldShowSection('anchor-feature-mall')">
    <AnchorHeading anchor-id="anchor-feature-mall"> 商城 &amp; 社区 </AnchorHeading>
    <ul>
      <li><strong>商城系统：</strong>商品展示、分类浏览、订单管理、在线支付</li>
      <li><strong>社区系统：</strong>帖子发布与编辑、评论互动、内容管理</li>
      <li><strong>举报机制：</strong>用户可举报违规内容，管理员审核处理</li>
    </ul>
  </div>

  <SectionDivider />

  <!-- 系统功能 -->
  <div v-if="shouldShowSection('anchor-feature-system')">
    <AnchorHeading anchor-id="anchor-feature-system"> 系统功能 </AnchorHeading>
    <ul>
      <li><strong>应用更新：</strong>版本检测与自动更新提醒，更新日志支持 Markdown 渲染</li>
      <li><strong>主题切换：</strong>浅色/深色双主题，通过 CSS 变量无缝切换</li>
      <li><strong>字体设置：</strong>支持自定义字体，内置阿里巴巴 Alimama 系列</li>
      <li><strong>自定义下载路径：</strong>文件下载目录可配置</li>
      <li><strong>全局搜索：</strong>Ctrl+K 唤起搜索面板，支持搜索联系人、群组、消息</li>
    </ul>
  </div>

  <SectionDivider />

  <!-- 多端适配 -->
  <div v-if="shouldShowSection('anchor-feature-multiplatform')">
    <AnchorHeading anchor-id="anchor-feature-multiplatform"> 多端适配 </AnchorHeading>
    <div class="platform-cards">
      <div class="platform-card">
        <div class="platform-card-header">
          <i class="iconfont icon-a-205_keji platform-card-icon"></i>
          <h4>Electron 桌面端</h4>
        </div>
        <ul>
          <li>自定义标题栏，沉浸式窗口体验</li>
          <li>系统托盘常驻，后台消息不遗漏</li>
          <li>原生系统通知，即时感知新消息</li>
          <li>自动更新检测，一键升级到最新版</li>
          <li>安装包约 10MB，轻量无负担</li>
        </ul>
      </div>
      <div class="platform-card">
        <div class="platform-card-header">
          <i class="iconfont icon-duopingtaizw platform-card-icon"></i>
          <h4>Web 浏览器端</h4>
        </div>
        <ul>
          <li>无需安装，浏览器打开即用</li>
          <li>响应式布局，适配不同屏幕尺寸</li>
          <li>支持所有现代浏览器（Chrome/Edge/Firefox）</li>
          <li>与桌面端数据实时同步</li>
        </ul>
      </div>
    </div>
  </div>

  <SectionDivider />

  <!-- 后端架构 -->
  <div v-if="shouldShowSection('anchor-feature-backend')">
    <AnchorHeading anchor-id="anchor-feature-backend"> 后端架构 </AnchorHeading>
    <ul>
      <li><strong>框架：</strong>Node.js + Express，TypeScript 逐步迁移中</li>
      <li><strong>数据库：</strong>Sequelize ORM，支持 MySQL，70+ 张数据表</li>
      <li><strong>认证：</strong>JWT 双 Token 机制（accessToken + refreshToken）</li>
      <li><strong>实时通信：</strong>WebSocket 服务独立部署，支持水平扩展</li>
      <li><strong>文件存储：</strong>本地存储 + 临时文件自动清理，支持头像/封面/聊天文件分类</li>
      <li>
        <strong>工程化：</strong>ESLint + Prettier 代码规范，Vitest 单元测试，Sequelize CLI
        数据库迁移
      </li>
      <li><strong>安全：</strong>bcryptjs 密码哈希、CORS 跨域控制、Helmet 安全头、请求频率限制</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import AnchorHeading from "../shared/AnchorHeading.vue";
import SectionDivider from "../shared/SectionDivider.vue";

defineProps<{
  shouldShowSection: (anchorId: string) => boolean;
}>();
</script>

<style scoped>
.platform-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin: 20px 0;
}

.platform-card {
  padding: 20px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  transition: all 0.25s ease;
}

.platform-card:hover {
  border-color: #5d33f6;
}

.dark .platform-card:hover {
  border-color: #8b5cf6;
}

.platform-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.platform-card-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  font-family: "Alimama", Helvetica, sans-serif;
}

.platform-card-icon {
  font-size: 22px;
  color: #5d33f6;
}

.dark .platform-card-icon {
  color: #8b5cf6;
}

.platform-card ul {
  padding-left: 28px;
  margin: 0;
}

.platform-card li {
  font-size: 13px;
  margin-bottom: 6px;
}

@media (max-width: 900px) {
  .platform-cards {
    grid-template-columns: 1fr;
  }
}
</style>
