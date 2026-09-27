<template>
  <div v-if="videos.length > 0" class="inline-media-preview-list">
    <div
      v-for="(video, index) in videos"
      :key="video.id"
      class="media-preview-item"
      contenteditable="false"
      @click="$emit('preview', video, index)"
    >
      <video
        :src="video.previewUrl"
        class="media-preview-thumb"
        :alt="`预览视频${video.id}`"
        @mouseenter="handlePlayVideoOnHover"
        @mouseleave="handlePauseVideoOnLeave"
        loop
        muted
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SelectedVideo } from "../untils/videoHandler";

interface Props {
  videos: SelectedVideo[];
}

defineProps<Props>();

defineEmits<{
  (e: "preview", video: SelectedVideo, index: number): void;
  (e: "play-video-on-hover", event: MouseEvent): void;
  (e: "pause-video-on-leave", event: MouseEvent): void;
}>();

const handlePlayVideoOnHover = (event: MouseEvent) => {
  const videoElement = event.target as HTMLVideoElement;
  if (videoElement && videoElement.tagName === "VIDEO") {
    videoElement.muted = true;
    videoElement.playbackRate = 0.5;
    videoElement.play().catch((error) => {
      console.warn("视频预览播放失败:", error);
    });
  }
};

const handlePauseVideoOnLeave = (event: MouseEvent) => {
  const videoElement = event.target as HTMLVideoElement;
  if (videoElement && videoElement.tagName === "VIDEO") {
    videoElement.pause();
    videoElement.currentTime = 0;
  }
};
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
</style>
