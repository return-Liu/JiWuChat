<template>
  <div class="tab-content">
    <div class="content-header">
      <div>
        <h3 class="content-title">语言</h3>
        <p class="content-desc">切换应用界面显示语言</p>
      </div>
    </div>

    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">语言偏好</span>
        <span class="group-desc">选择应用显示语言</span>
      </div>
      <div class="setting-item">
        <div class="item-info">
          <span class="label">应用语言</span>
          <span class="desc">选择应用显示语言</span>
        </div>
        <a-select
          v-model:value="currentLanguage"
          class="setting-select"
          :options="languageOptions"
          :popup-match-select-width="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const currentLanguage = ref("zh-CN");
const languageOptions = [
  { value: "zh-CN", label: "简体中文" },
  { value: "zh-TW", label: "繁体中文" },
  { value: "en-US", label: "English" },
];

watch(currentLanguage, (val) => localStorage.setItem("language", val));
</script>
