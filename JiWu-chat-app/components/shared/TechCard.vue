<template>
  <div class="tech-card">
    <div class="tech-card-top">
      <span class="tech-badge">{{ category }}</span>
      <span class="tech-ver">{{ version }}</span>
    </div>
    <h4 class="tech-name">{{ name }}</h4>
    <p class="tech-desc">{{ desc }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  category: string;
  name: string;
  version: string;
  desc: string;
}>();
</script>

<style scoped>
.tech-card {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.tech-card:hover {
  border-color: #5d33f6;
}

.dark .tech-card:hover {
  border-color: #8b5cf6;
}

.tech-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tech-badge {
  font-size: 10px;
  font-weight: 600;
  color: #5d33f6;
  background: rgba(93, 51, 246, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: "Alimama", Helvetica, sans-serif;
}

.dark .tech-badge {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.12);
}

.tech-ver {
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.6;
  font-family: monospace;
}

.tech-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
  font-family: "Alimama", Helvetica, sans-serif;
}

.tech-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
}
</style>
