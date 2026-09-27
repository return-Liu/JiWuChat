<template>
  <div class="about-banner">
    <div class="banner-content">
      <img src="../../public/jiwuchat-elctron.png" alt="极物聊天" class="banner-logo" />
      <span class="banner-title">极物聊天</span>
      <p class="banner-subtitle">基于 Electron + Nuxt3 的轻量级跨平台即时通讯应用</p>
    </div>
  </div>
</template>

<style scoped>
.about-banner {
  display: flex;
  justify-content: center;
  padding: 20px 0 32px;
}

.banner-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.banner-logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
}

.banner-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: "Alimama", Helvetica, sans-serif;
}

.banner-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
  margin: 0;
}
</style>
