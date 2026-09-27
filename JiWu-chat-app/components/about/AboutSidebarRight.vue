<template>
  <aside class="about-sidebar-right">
    <h4 class="about-nav-title">文章导航</h4>
    <ul class="about-nav-list">
      <li
        v-for="item in navItems"
        :key="item.anchor"
        class="about-nav-item"
        :class="{ active: activeAnchor === item.anchor }"
        @click="$emit('scroll-to-anchor', item.anchor)"
      >
        {{ item.label }}
      </li>
    </ul>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Section } from "../../composables/useAboutNavigation";
import { NAV_MAP } from "../../composables/useAboutNavigation";

const props = defineProps<{
  currentSection: Section;
  activeAnchor: string;
}>();

defineEmits<{
  (e: "scroll-to-anchor", anchorId: string): void;
}>();

const navItems = computed(() => NAV_MAP[props.currentSection] || []);
</script>

<style scoped>
.about-sidebar-right {
  width: 200px;
  flex-shrink: 0;
  padding: 32px 16px;
  border-left: 1px solid var(--border-color);
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
  padding: 8px 12px 8px 16px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 2px solid transparent;
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
  background: transparent !important;
}

.about-nav-item:hover {
  color: var(--text-primary);
  background: transparent !important;
}

.about-nav-item.active {
  color: #5d33f6;
  font-weight: 600;
  border-left-color: #5d33f6;
  background: transparent !important;
}

.dark .about-nav-item.active {
  color: #8b5cf6;
  border-left-color: #8b5cf6;
}

@media (max-width: 900px) {
  .about-sidebar-right {
    display: none;
  }
}
</style>
