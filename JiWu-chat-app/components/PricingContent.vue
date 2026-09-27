<template>
  <div class="pricing-content">
    <!-- 定价头部 -->
    <div class="pricing-header">
      <div class="pricing-badge-wrapper">
        <span class="pricing-badge">
          <i class="iconfont icon-dingjia"></i>
          透明定价 · 一次性授权
        </span>
      </div>
      <h3 class="pricing-title">
        选择适合您的
        <span class="pricing-title-highlight">授权方案</span>
      </h3>
      <p class="pricing-desc">
        基于 Electron + Nuxt3 构建的跨平台即时通讯应用，体积约 10MB。 一次性付款，后续版本免费获取。
      </p>
    </div>

    <!-- 定价卡片（保持三卡片） -->
    <div class="pricing-cards">
      <!-- 基础授权 -->
      <div
        class="pricing-card card-base"
        ref="cardBaseRef"
        @mousemove="handleCardTilt($event, 'base')"
        @mouseleave="resetCardTilt('base')"
        role="article"
        aria-label="基础授权方案"
      >
        <div class="card-header">
          <h4 class="card-title card-title-base">基础授权</h4>
          <p class="card-subtitle">个人开发者或小团队自用，获得完整源码与自部署权限</p>
        </div>
        <div class="card-price-wrapper">
          <div class="card-price">
            <span class="price-symbol price-symbol-base">¥</span>
            <span class="price-value price-value-base">899</span>
          </div>
          <div class="price-note price-note-base">一次性付款，含 14 天部署咨询</div>
        </div>
        <button
          class="card-btn card-btn-base"
          @click="handleSelectPlan('基础授权')"
          aria-label="选择基础授权方案，价格899元"
        >
          立即购买
          <i class="iconfont icon-youjiantou"></i>
        </button>
        <ul class="card-features" role="list">
          <li
            v-for="(feature, idx) in BASIC_FEATURES"
            :key="idx"
            class="feature-item"
            role="listitem"
          >
            <span class="feature-check" :aria-label="feature.available ? '支持' : '不支持'">
              <i
                v-if="feature.available"
                class="iconfont icon-24gl-successCircle base-check-icon"
              ></i>
              <i v-else class="iconfont icon-guanbi3 base-close-icon"></i>
            </span>
            <span :class="{ 'feature-text-disabled': !feature.available }">
              {{ feature.text }}
            </span>
          </li>
        </ul>
      </div>

      <!-- 商业授权（推荐） -->
      <div
        class="pricing-card card-business card-recommended"
        ref="cardBusinessRef"
        @mousemove="handleCardTilt($event, 'business')"
        @mouseleave="resetCardTilt('business')"
        role="article"
        aria-label="商业授权方案，推荐"
      >
        <div class="recommended-badge-wrapper">
          <div class="recommended-badge">
            <i class="iconfont icon-pingjiaxingxing"></i>
            推荐
          </div>
        </div>

        <div class="card-header">
          <h4 class="card-title card-title-business">商业授权</h4>
          <p class="card-subtitle">支持二次开发与商业分发，适合将源码集成至自身产品的企业或团队</p>
        </div>
        <div class="card-price-wrapper">
          <div class="card-price">
            <span class="price-symbol price-symbol-business">¥</span>
            <span class="price-value price-value-business">3000</span>
          </div>
          <div class="price-note price-note-business">一次性付款，含 1 个月部署咨询</div>
        </div>
        <button
          class="card-btn card-btn-business"
          @click="handleSelectPlan('商业授权')"
          aria-label="选择商业授权方案，价格3000元"
        >
          立即购买
          <i class="iconfont icon-youjiantou"></i>
        </button>
        <ul class="card-features" role="list">
          <li
            v-for="(feature, idx) in BUSINESS_FEATURES"
            :key="idx"
            class="feature-item"
            role="listitem"
          >
            <span class="feature-check" :aria-label="feature.available ? '支持' : '不支持'">
              <i
                v-if="feature.available"
                class="iconfont icon-24gl-successCircle business-check-icon"
              ></i>
              <i v-else class="iconfont icon-guanbi3 business-close-icon"></i>
            </span>
            <span :class="{ 'feature-text-disabled': !feature.available }">
              {{ feature.text }}
            </span>
          </li>
        </ul>
      </div>

      <!-- 旗舰版本 -->
      <div
        class="pricing-card card-flagship"
        ref="cardFlagshipRef"
        @mousemove="handleCardTilt($event, 'flagship')"
        @mouseleave="resetCardTilt('flagship')"
        role="article"
        aria-label="旗舰版本方案"
      >
        <div class="card-header">
          <h4 class="card-title card-title-flagship">旗舰版本</h4>
          <p class="card-subtitle">
            集成 AI 能力、商城与社区等完整系统，适合打造独立平台或企业级产品
          </p>
        </div>
        <div class="card-price-wrapper">
          <div class="card-price">
            <span class="price-value price-value-flagship price-consult">咨询</span>
          </div>
          <div class="price-note price-note-flagship">按需报价，联系获取方案</div>
        </div>
        <button
          class="card-btn card-btn-flagship"
          @click="handleContactUs('flagship')"
          aria-label="联系咨询旗舰版本方案"
        >
          联系咨询
          <i class="iconfont icon-youjiantou"></i>
        </button>
        <ul class="card-features" role="list">
          <li
            v-for="(feature, idx) in FLAGSHIP_FEATURES"
            :key="idx"
            class="feature-item"
            role="listitem"
          >
            <span class="feature-check" :aria-label="feature.available ? '支持' : '不支持'">
              <i
                v-if="feature.available"
                class="iconfont icon-24gl-successCircle flagship-check-icon"
              ></i>
              <i v-else class="iconfont icon-guanbi3 flagship-close-icon"></i>
            </span>
            <span :class="{ 'feature-text-disabled': !feature.available }">
              {{ feature.text }}
            </span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 功能对比表 -->
    <div class="comparison-section">
      <h4 class="comparison-title">功能全面对比</h4>
      <p class="comparison-desc">清晰了解每个版本的能力差异，选择最适合您的方案</p>
      <div class="comparison-table-wrapper">
        <table class="comparison-table" role="table" aria-label="各授权方案功能对比">
          <thead>
            <tr>
              <th scope="col">功能特性</th>
              <th scope="col" class="comparison-col-base">基础授权</th>
              <th scope="col" class="comparison-col-business">商业授权</th>
              <th scope="col" class="comparison-col-flagship">旗舰版本</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in comparisonData" :key="idx">
              <td class="comparison-feature-name">{{ row.feature }}</td>
              <td class="comparison-col-base">
                <span class="comparison-value" :class="getComparisonClass(row.base)">
                  <i
                    v-if="row.base === true"
                    class="iconfont icon-24gl-successCircle base-check-icon"
                  ></i>
                  <i
                    v-else-if="row.base === false"
                    class="iconfont icon-guanbi3 base-close-icon"
                  ></i>
                  <span v-else class="comparison-text">{{ row.base }}</span>
                </span>
              </td>
              <td class="comparison-col-business">
                <span class="comparison-value" :class="getComparisonClass(row.business)">
                  <i
                    v-if="row.business === true"
                    class="iconfont icon-24gl-successCircle business-check-icon"
                  ></i>
                  <i
                    v-else-if="row.business === false"
                    class="iconfont icon-guanbi3 business-close-icon"
                  ></i>
                  <span v-else class="comparison-text">{{ row.business }}</span>
                </span>
              </td>
              <td class="comparison-col-flagship">
                <span class="comparison-value" :class="getComparisonClass(row.flagship)">
                  <i
                    v-if="row.flagship === true"
                    class="iconfont icon-24gl-successCircle flagship-check-icon"
                  ></i>
                  <i
                    v-else-if="row.flagship === false"
                    class="iconfont icon-guanbi3 flagship-close-icon"
                  ></i>
                  <span v-else class="comparison-text">{{ row.flagship }}</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 底部 FAQ -->
    <div class="pricing-bottom">
      <div class="pricing-faq-section">
        <div class="faq-header">
          <h4 class="faq-title">常见问题</h4>
          <p class="faq-desc">购买前后常见疑问，帮助您快速了解授权政策</p>
        </div>

        <div class="faq-grid">
          <div
            v-for="(faq, index) in FAQ_LIST"
            :key="index"
            class="faq-item"
            @click="toggleFaq(index)"
            @keydown.enter="toggleFaq(index)"
            role="button"
            tabindex="0"
            :aria-expanded="faq.expanded"
            :aria-controls="`faq-answer-${index}`"
          >
            <div class="faq-question">
              <span class="faq-question-text">{{ faq.question }}</span>
              <i
                class="iconfont icon-xialajiantou1 faq-toggle-icon"
                :class="{ 'faq-toggle-open': faq.expanded }"
                aria-hidden="true"
              ></i>
            </div>
            <div
              class="faq-answer"
              :class="{ 'faq-answer-open': faq.expanded }"
              :id="`faq-answer-${index}`"
              role="region"
            >
              <p>{{ faq.answer }}</p>
            </div>
          </div>
        </div>

        <div class="faq-footer">
          <div class="faq-footer-line">还有疑问？</div>
          <div class="faq-footer-line">
            欢迎通过
            <a
              href="tencent://message/?uin=2286223728&Site=www.jiwuchat.com&Menu=yes"
              class="faq-contact-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              QQ：2286223728
            </a>
            联系作者，购买前可免费咨询
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { BASIC_FEATURES, BUSINESS_FEATURES, FLAGSHIP_FEATURES } from "../untils/homePageData";

// ===== 响应式 =====
const isMobile = ref(false);

// ===== DOM 引用 =====
const cardBaseRef = ref<HTMLElement | null>(null);
const cardBusinessRef = ref<HTMLElement | null>(null);
const cardFlagshipRef = ref<HTMLElement | null>(null);

const cardRefs = {
  base: cardBaseRef,
  business: cardBusinessRef,
  flagship: cardFlagshipRef,
};

// ===== RAF 节流 =====
let rafId: number | null = null;
let lastEvent: MouseEvent | null = null;
let activeCardType: "base" | "business" | "flagship" | null = null;

function handleCardTilt(event: MouseEvent, type: "base" | "business" | "flagship") {
  if (isMobile.value) return;

  lastEvent = event;
  activeCardType = type;

  if (rafId !== null) return;

  rafId = requestAnimationFrame(() => {
    if (lastEvent && activeCardType) {
      applyCardTilt(lastEvent, activeCardType);
    }
    rafId = null;
  });
}

function applyCardTilt(event: MouseEvent, type: "base" | "business" | "flagship") {
  const card = cardRefs[type]?.value;
  if (!card) return;

  const rect = card.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const rotateY = ((x - centerX) / centerX) * -2;
  const rotateX = ((y - centerY) / centerY) * 2;

  card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  card.style.transition = "transform 0.05s ease-out";
}

function resetCardTilt(type: "base" | "business" | "flagship") {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  lastEvent = null;
  activeCardType = null;

  const card = cardRefs[type]?.value;
  if (!card) return;

  card.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg)";
  card.style.transition = "transform 0.4s cubic-bezier(0.34, 1.2, 0.64, 1)";
}

// ===== 检测移动端 =====
function checkMobile() {
  isMobile.value = window.innerWidth < 1024;
}

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", checkMobile);
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
});

// ===== 事件处理 =====
const handleSelectPlan = (name: string) => {
  console.log(`[选择方案] ${name}`);
};

const handleContactUs = (type: string) => {
  console.log(`[联系咨询] ${type}`);
};

// ===== FAQ =====
interface FaqItem {
  question: string;
  answer: string;
  expanded: boolean;
}

const FAQ_LIST = ref<FaqItem[]>([
  {
    question: "购买后如何获取源码？",
    answer: "购买成功后，您将在订单页面获取源码下载链接，或通过邮件接收包含仓库访问权限的邀请。",
    expanded: false,
  },
  {
    question: "基础授权和商业授权有什么区别？",
    answer:
      "基础授权适用于个人开发者或小团队自用；商业授权允许将源码集成至自身产品并进行商业分发。",
    expanded: false,
  },
  {
    question: "咨询期内可以问哪些问题？",
    answer: "咨询期内仅支持部署相关问题，不含二次开发指导、代码逻辑修改或功能定制服务。",
    expanded: false,
  },
  {
    question: "购买后是否包含后续版本更新？",
    answer: "是的，一次性付款后您可免费获取所有后续版本更新。",
    expanded: false,
  },
  {
    question: "授权是否支持多个项目/多台服务器部署？",
    answer:
      "基础授权仅限单一项目/单台服务器部署。如需多项目或多服务器部署，请选择商业授权或旗舰版本。",
    expanded: false,
  },
  {
    question: "旗舰版本包含哪些核心系统？",
    answer: "旗舰版本额外集成 AI 智能助手、电商商城系统、社区论坛、管理后台等模块。",
    expanded: false,
  },
  {
    question: "购买前可以预览效果吗？",
    answer: "您可以通过首页的「体验项目」在线试用完整功能。",
    expanded: false,
  },
  {
    question: "是否支持退款？",
    answer: "由于产品为数字商品，源码交付后不支持退款。购买前请仔细阅读授权协议。",
    expanded: false,
  },
]);

function toggleFaq(index: number) {
  FAQ_LIST.value[index].expanded = !FAQ_LIST.value[index].expanded;
}

// ===== 对比表数据 =====
const comparisonData = computed(() => [
  { feature: "前后端完整源码", base: true, business: true, flagship: true },
  { feature: "个人/小团队自部署使用", base: true, business: true, flagship: true },
  { feature: "企业/团队无限制使用", base: false, business: true, flagship: true },
  { feature: "Docker 部署支持文档", base: true, business: true, flagship: true },
  { feature: "完整技术开发文档", base: true, business: true, flagship: true },
  { feature: "后续版本免费更新", base: true, business: true, flagship: true },
  { feature: "部署问题咨询", base: "14 天", business: "1 个月", flagship: "长期" },
  { feature: "二次开发权限", base: false, business: true, flagship: true },
  { feature: "商业分发授权", base: false, business: true, flagship: true },
  { feature: "完整技术文档与开发资料", base: false, business: true, flagship: true },
  {
    feature: "AI 能力集成（群聊机器人、对话助手等）",
    base: false,
    business: false,
    flagship: true,
  },
  { feature: "商城系统（商品、订单、支付）", base: false, business: false, flagship: true },
  { feature: "社区系统（帖子、评论、互动）", base: false, business: false, flagship: true },
  { feature: "个性化 UI/UX 品牌定制", base: false, business: false, flagship: true },
  { feature: "专属技术对接与支持", base: false, business: false, flagship: true },
  { feature: "长期维护与运维方案", base: false, business: false, flagship: true },
  { feature: "独立部署与上线支持", base: false, business: false, flagship: true },
]);

function getComparisonClass(value: boolean | string) {
  if (value === true) return "comparison-check";
  if (value === false) return "comparison-close";
  return "comparison-text-value";
}
</script>

<style scoped lang="scss">
// ============================================================
// CSS 变量
// ============================================================
:root {
  --check-color-base: #999;
  --close-color-base: #ccc;
  --check-color-business: #5d33f6;
  --close-color-business: #ccc;
  --check-color-flagship: #52c41a;
  --close-color-flagship: #ccc;
}

.home-dark {
  --check-color-base: #777;
  --close-color-base: #444;
  --check-color-business: #8b5cf6;
  --close-color-business: #444;
  --check-color-flagship: #67c23a;
  --close-color-flagship: #444;
}

// ============================================================
// 布局（保持三卡片）
// ============================================================
.pricing-content {
  padding: 40px 20px 60px;
  margin-bottom: 20px;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 0;
    background-image: radial-gradient(
      circle,
      var(--dot-color, rgba(200, 200, 200, 0.4)) 1px,
      transparent 1px
    );
    background-size: 32px 32px;
    background-position: 0 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

:root:not(.home-dark) .pricing-content {
  --dot-color: rgba(180, 180, 180, 0.2);
}
.home-dark .pricing-content {
  --dot-color: rgba(200, 200, 200, 0.12);
}

// ============================================================
// Header
// ============================================================
.pricing-header {
  text-align: center;
  margin-bottom: 48px;
}

.pricing-badge-wrapper {
  margin-bottom: 16px;
}

.pricing-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #5d33f6;
  background: rgba(93, 51, 246, 0.08);
  border: 1px solid rgba(93, 51, 246, 0.12);
  font-family: "Alimama", Helvetica, sans-serif;

  .home-dark & {
    background: rgba(139, 92, 246, 0.12);
    border-color: rgba(139, 92, 246, 0.15);
    color: #8b5cf6;
  }

  i {
    font-size: 14px;
  }
}

.pricing-title {
  font-size: 38px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
  line-height: 1.2;
  transition: color 0.3s ease;
  font-family: "Alimama", Helvetica, sans-serif;
}

.pricing-title-highlight {
  color: #5d33f6;
  font-size: 38px;

  .home-dark & {
    color: #8b5cf6;
  }
}

.pricing-desc {
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 640px;
  margin: 0 auto;
  line-height: 1.7;
  transition: color 0.3s ease;
  font-weight: 400;
  font-family: "Alimama", Helvetica, sans-serif;
}

// ============================================================
// 定价卡片（保持三列）
// ============================================================
.pricing-cards {
  max-width: 1140px;
  margin: 0 auto 56px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.pricing-card {
  position: relative;
  border-radius: 20px;
  padding: 32px 28px 28px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: visible;
  cursor: default;
  will-change: transform;
  background: var(--card-bg);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.06);
    .home-dark & {
      box-shadow: 0 0 60px rgba(255, 255, 255, 0.02);
    }
  }

  &.card-base {
    border-color: #e0e0e0;
    .home-dark & {
      border-color: #2a2a2a;
    }
  }

  &.card-flagship {
    border-color: #b8d9b8;
    .home-dark & {
      border-color: #1a3a1a;
    }
  }

  &.card-recommended {
    border-color: #5d33f6;
    background: linear-gradient(145deg, var(--card-bg), rgba(93, 51, 246, 0.03));
    .home-dark & {
      border-color: #5d33f6;
    }
  }
}

// ============================================================
// 推荐徽章
// ============================================================
.recommended-badge-wrapper {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  z-index: 20;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.recommended-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, #5d33f6, #7c3aed);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: "Alimama", Helvetica, sans-serif;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 12px rgba(93, 51, 246, 0.35);
  white-space: nowrap;
  pointer-events: auto;

  i {
    font-size: 12px;
  }
}

// ============================================================
// 卡片内容
// ============================================================
.card-title {
  &-base {
    color: #222;
    .home-dark & {
      color: #fff;
    }
  }
  &-business {
    color: #5d33f6;
    .home-dark & {
      color: #8b5cf6;
    }
  }
  &-flagship {
    color: #52c41a;
    .home-dark & {
      color: #67c23a;
    }
  }
}

.card-header {
  margin-bottom: 16px;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px;
  transition: color 0.3s ease;
  font-family: "Alimama", Helvetica, sans-serif;
}

.card-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0;
  transition: color 0.3s ease;
  font-weight: 400;
  font-family: "Alimama", Helvetica, sans-serif;
}

.card-price-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.card-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.price-symbol {
  font-size: 18px;
  font-weight: 600;
  transition: color 0.3s ease;
  font-family: "Alimama", Helvetica, sans-serif;

  &-base,
  &-business,
  &-flagship {
    color: #222;
    .home-dark & {
      color: #fff;
    }
  }
}

.price-value {
  font-size: 36px;
  font-weight: 700;
  transition: color 0.3s ease;
  font-family: "Alimama", Helvetica, sans-serif;
  line-height: 1;

  &-base,
  &-business,
  &-flagship {
    color: #222;
    .home-dark & {
      color: #fff;
    }
  }

  &.price-consult {
    font-size: 28px;
  }
}

.price-note {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 400;
  font-family: "Alimama", Helvetica, sans-serif;
}

// ============================================================
// 按钮
// ============================================================
.card-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 44px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: "Alimama", Helvetica, sans-serif;
  margin-bottom: 20px;

  i {
    font-size: 14px;
    transition: transform 0.2s ease;
  }

  &:hover i {
    transform: translateX(4px);
  }

  &-base {
    background: #f0f0f0;
    color: #555;
    border: 1.5px solid #e0e0e0;

    &:hover {
      background: #e8e8e8;
      border-color: #ccc;
    }
    .home-dark & {
      background: #2a2a2a;
      color: #aaa;
      border-color: #3a3a3a;
      &:hover {
        background: #333;
      }
    }
  }

  &-business {
    background: #5d33f6;
    color: #fff;
    border: 1.5px solid #5d33f6;

    &:hover {
      background: #4a28c4;
      border-color: #4a28c4;
      box-shadow: 0 4px 16px rgba(93, 51, 246, 0.3);
    }
  }

  &-flagship {
    background: #f6ffed;
    color: #52c41a;
    border: 1.5px solid #52c41a;

    &:hover {
      background: #e8f5e0;
      box-shadow: 0 4px 16px rgba(82, 196, 26, 0.15);
    }
    .home-dark & {
      background: rgba(82, 196, 26, 0.1);
      color: #67c23a;
      border-color: #67c23a;
      &:hover {
        background: rgba(82, 196, 26, 0.2);
      }
    }
  }
}

// ============================================================
// 功能列表 & 图标（使用 CSS 变量）
// ============================================================
.card-features {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.4;
  transition: color 0.3s ease;
  font-weight: 400;
  font-family: "Alimama", Helvetica, sans-serif;
}

.feature-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}

// 使用 CSS 变量
.base-check-icon {
  color: var(--check-color-base) !important;
}
.base-close-icon {
  color: var(--close-color-base) !important;
}
.business-check-icon {
  color: var(--check-color-business) !important;
}
.business-close-icon {
  color: var(--close-color-business) !important;
}
.flagship-check-icon {
  color: var(--check-color-flagship) !important;
}
.flagship-close-icon {
  color: var(--close-color-flagship) !important;
}

.feature-text-disabled {
  color: #bbb;
  .home-dark & {
    color: #555;
  }
}

// ============================================================
// 功能对比表
// ============================================================
.comparison-section {
  max-width: 1140px;
  margin: 0 auto 56px;
  padding: 0 16px;
}

.comparison-title {
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
  font-family: "Alimama", Helvetica, sans-serif;
}

.comparison-desc {
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 28px;
  font-weight: 400;
  font-family: "Alimama", Helvetica, sans-serif;
}

.comparison-table-wrapper {
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-family: "Alimama", Helvetica, sans-serif;
  font-size: 14px;
  min-width: 500px;

  th,
  td {
    padding: 12px 16px;
    text-align: center;
    border-bottom: 1px solid var(--border-color);
  }

  th {
    font-weight: 600;
    color: var(--text-primary);
    background: var(--bg-secondary);
    font-size: 13px;

    &.comparison-col-base {
      color: #888;
      .home-dark & {
        color: #999;
      }
    }
    &.comparison-col-business {
      color: #5d33f6;
      .home-dark & {
        color: #8b5cf6;
      }
    }
    &.comparison-col-flagship {
      color: #52c41a;
      .home-dark & {
        color: #67c23a;
      }
    }
  }

  td {
    color: var(--text-secondary);
    vertical-align: middle;
  }

  .comparison-feature-name {
    text-align: left;
    font-weight: 500;
    color: var(--text-primary);
    font-size: 13px;
  }

  .comparison-value {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 18px;
    }
  }

  .comparison-text {
    font-size: 13px;
    font-weight: 500;
  }

  .comparison-text-value {
    color: var(--text-primary);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover {
    background: var(--bg-hover);
  }
}

// ============================================================
// FAQ
// ============================================================
.pricing-bottom {
  max-width: 1140px;
  margin: 0 auto;
}

.faq-header {
  text-align: center;
  margin-bottom: 32px;
}

.faq-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
  font-family: "Alimama", Helvetica, sans-serif;
}

.faq-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 400;
  font-family: "Alimama", Helvetica, sans-serif;
}

.faq-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 800px;
  margin: 0 auto;
}

.faq-item {
  background: transparent;
  border: none;
  border-radius: 0;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }

  &:focus-visible {
    outline: 2px solid #5d33f6;
    outline-offset: -2px;
  }
}

.faq-question {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 4px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  transition: color 0.3s ease;
  user-select: none;
  font-family: "Alimama", Helvetica, sans-serif;

  &:hover {
    color: #5d33f6;
    .home-dark & {
      color: #8b5cf6;
    }
  }
}

.faq-question-text {
  flex: 1;
  line-height: 1.4;
}

.faq-toggle-icon {
  font-size: 12px;
  color: var(--text-secondary);
  transition: transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
  flex-shrink: 0;

  &.faq-toggle-open {
    transform: rotate(180deg);
  }
}

.faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);

  p {
    padding: 0 4px 16px;
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-secondary);
    transition: color 0.3s ease;
    font-weight: 400;
    font-family: "Alimama", Helvetica, sans-serif;
  }

  &.faq-answer-open {
    max-height: 300px;
  }
}

.faq-footer {
  margin: 28px auto 0;
  padding: 20px 24px;
  max-width: 800px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--card-bg);
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 400;
  font-family: "Alimama", Helvetica, sans-serif;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.faq-footer-line {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-wrap: wrap;
  line-height: 1.6;
}

.faq-contact-link {
  color: #5d33f6;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
  font-family: "Alimama", Helvetica, sans-serif;

  .home-dark & {
    color: #8b5cf6;
  }

  &:hover {
    color: #4a28c4;
    text-decoration: underline;
    .home-dark & {
      color: #a78bfa;
    }
  }
}

// ============================================================
// 响应式（保持三卡片）
// ============================================================
@media (max-width: 1024px) {
  .pricing-cards {
    grid-template-columns: 1fr;
    max-width: 480px;
  }
}
</style>
