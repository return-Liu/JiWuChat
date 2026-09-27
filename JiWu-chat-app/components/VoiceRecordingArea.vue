<template>
  <div class="voice-recording-area">
    <div class="voice-recording-content">
      <div class="voice-mic-icon" :class="{ recording: isRecording }">
        <i class="iconfont icon-maikefenghuatong voice-mic"></i>
      </div>
      <div class="voice-recording-hint">
        <template v-if="!isRecording">
          按住空格键开始说话，按 Esc 键或点击
          <span class="voice-exit-link" @click="$emit('exit')">退出</span>
        </template>
        <template v-else>
          <div class="recording-timer">录音中... {{ duration }}秒</div>
          <div class="recording-tip">松开空格键发送</div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isRecording: boolean;
  duration: number;
}

defineProps<Props>();

defineEmits<{
  (e: "exit"): void;
}>();
</script>

<style scoped>
.voice-recording-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  border-radius: 12px;
  background: transparent;
}

.voice-recording-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.voice-mic-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #1890ff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.voice-mic-icon.recording {
  animation: voicePulse 1.5s ease-in-out infinite;
  box-shadow: 0 4px 20px rgba(24, 144, 255, 0.5);
}

@keyframes voicePulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 4px 24px rgba(24, 144, 255, 0.5);
  }
}

.voice-mic {
  font-size: 40px;
  color: #ffffff;
}

.voice-recording-hint {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
}

.recording-timer {
  font-size: 14px;
  font-weight: 500;
  color: #1890ff;
  margin-bottom: 4px;
}

.recording-tip {
  font-size: 14px;
  color: var(--text-secondary);
}

.voice-exit-link {
  color: #1890ff;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
}

.voice-exit-link:hover {
  color: #096dd9;
  text-decoration: underline;
}
</style>
