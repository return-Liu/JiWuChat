<template>
  <div v-if="images.length > 0" class="inline-media-preview-list">
    <div
      v-for="(image, index) in images"
      :key="image.id"
      class="media-preview-item"
      contenteditable="false"
      @click="$emit('preview', image, index)"
    >
      <img
        :src="image.previewUrl"
        class="media-preview-thumb"
        :alt="`${image.isScreenshot ? '截图' : '图片'}${image.id}`"
      />
      <div v-if="image.isScreenshot" class="screenshot-tag">截图</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SelectedImage } from "../untils/imageHandler";

interface Props {
  images: SelectedImage[];
}

defineProps<Props>();

defineEmits<{
  (e: "preview", image: SelectedImage, index: number): void;
}>();
</script>

<style scoped>
.inline-media-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.media-preview-item {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: #f5f5f5;
}

.media-preview-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.screenshot-tag {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}
</style>
