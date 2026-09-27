<template>
  <component :is="tag" :id="anchorId" class="anchor-heading">
    <span class="heading-hash">#</span>
    <slot />
  </component>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    anchorId: string;
    tag?: "h1" | "h2" | "h3" | "h4";
  }>(),
  { tag: "h2" },
);
</script>

<style scoped>
.anchor-heading {
  position: relative;
  cursor: pointer;
}

.heading-hash {
  opacity: 0;
  color: #8364ff;
  margin-right: 6px;
  transition: opacity 0.2s ease;
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
  font-size: inherit;
}

.anchor-heading:hover .heading-hash {
  opacity: 1;
}

.markdown-body h1.anchor-heading {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 14px;
  padding-top: 16px;
  color: var(--text-primary);
  font-family: "Alimama", Helvetica, sans-serif;
}

.markdown-body h2.anchor-heading {
  font-size: 20px;
  font-weight: 600;
  margin-top: 24px;
  margin-bottom: 10px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
  font-family: "Alimama", Helvetica, sans-serif;
}

.markdown-body h3.anchor-heading {
  font-size: 17px;
  font-weight: 600;
  margin-top: 18px;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-family: "Alimama", Helvetica, sans-serif;
}
</style>
