<template>
  <div class="update-logs-page">
    <GithubChangelog />
  </div>
</template>

<script setup lang="ts">
// GithubChangelog 组件由 Nuxt 自动导入（components/ 目录）
</script>

<style lang="scss" scoped>
.update-logs-page {
  min-height: 100vh;
  height: 100%;
  background: var(--bg-primary, #f5f7fa);
}
</style>
