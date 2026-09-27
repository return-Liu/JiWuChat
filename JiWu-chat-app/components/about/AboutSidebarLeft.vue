<template>
  <aside class="about-sidebar-left">
    <h4 class="about-nav-title">导航</h4>
    <ul class="about-nav-list">
      <li
        v-for="item in navItems"
        :key="item.value"
        class="about-nav-item"
        :class="{ active: currentSection === item.value }"
        @click="$emit('switch-section', item.value)"
      >
        {{ item.label }}
      </li>
    </ul>
  </aside>
</template>

<script setup lang="ts">
import type { Section } from "./composables/useAboutNavigation";

defineProps<{
  currentSection: Section;
}>();

defineEmits<{
  (e: "switch-section", section: Section): void;
}>();

const navItems: Array<{ label: string; value: Section }> = [
  { label: "功能介绍", value: "features" },
  { label: "技术栈", value: "techstack" },
  { label: "品牌故事", value: "overview" },
  { label: "设计理念", value: "design" },
  { label: "参与贡献", value: "contribute" },
  { label: "开发团队", value: "team" },
];
</script>

<style scoped>
.about-sidebar-left {
  width: 200px;
  flex-shrink: 0;
  padding: 32px 16px;
}

.about-nav-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 18px;
  padding: 0 8px;
  letter-spacing: 0.5px;
  font-family: "Alimama", Helvetica, sans-serif;
}

.about-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.about-nav-item {
  position: relative;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
  border-radius: 6px;
  background: transparent !important;
}

.about-nav-item:hover {
  color: var(--text-primary);
  background: transparent !important;
}

.about-nav-item.active {
  color: #5d33f6;
  font-weight: 600;
  background: transparent !important;
}

.dark .about-nav-item.active {
  color: #8b5cf6;
}

@media (max-width: 900px) {
  .about-sidebar-left {
    display: none;
  }
}
</style>
