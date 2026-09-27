<template>
  <div class="voice-recorder" :class="{ recording: isRecording }">
    <a-tooltip :content="tooltipContent" placement="top">
      <div
        class="voice-btn clickable-text"
        @mousedown="startRecording"
        @mouseup="stopRecording"
        @mouseleave="cancelRecording"
        @focus="isFocused = true"
        @blur="isFocused = false"
        tabindex="0"
      >
        <AudioOutlined v-if="!isRecording" />
        <StopOutlined v-else />
      </div>
    </a-tooltip>

    <!-- 录音时长显示 -->
    <div v-if="isRecording" class="recording-duration">
      {{ formatDuration(recordingDuration) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, readonly } from "vue";
import { message } from "ant-design-vue";
import { AudioOutlined, StopOutlined } from "@ant-design/icons-vue";
import { AudioRecorder, getAudioDuration } from "../untils/audioHandler";

interface Props {
  disabled?: boolean;
}

interface Emits {
  (e: "record-complete", blob: Blob, duration: number): void;
  (e: "record-error", error: Error): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<Emits>();

const isRecording = ref(false);
const recordingDuration = ref(0);
const audioRecorder = ref<AudioRecorder | null>(null);
const isFocused = ref(false); // 新增：按钮是否获得焦点

const tooltipContent = computed(() => {
  if (isRecording.value) {
    return "松开发送，按 Esc 键取消";
  } else {
    return "按住空格键开始说话，按 Esc 键取消";
  }
});

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const startRecording = async () => {
  if (props.disabled) return;

  try {
    isRecording.value = true;
    recordingDuration.value = 0;

    audioRecorder.value = new AudioRecorder(
      () => {
        // 开始录制回调
        console.log("开始录音");
      },
      async (audioBlob: Blob) => {
        // 录制结束回调
        isRecording.value = false;
        const duration = await getAudioDuration(audioBlob);
        emit("record-complete", audioBlob, duration);
      },
      (error: Error) => {
        // 录制错误回调
        isRecording.value = false;
        recordingDuration.value = 0;
        message.error(`录音失败: ${error.message}`);
        emit("record-error", error);
      },
      (duration: number) => {
        // 进度更新回调
        recordingDuration.value = duration;
      },
    );

    await audioRecorder.value.startRecording();
  } catch (error: any) {
    isRecording.value = false;
    recordingDuration.value = 0;
    message.error(`无法开始录音: ${error.message}`);
    emit("record-error", error);
  }
};

const stopRecording = () => {
  if (audioRecorder.value && isRecording.value) {
    audioRecorder.value.stopRecording();
  }
};

const cancelRecording = () => {
  if (audioRecorder.value && isRecording.value) {
    audioRecorder.value.cancelRecording();
    isRecording.value = false;
    recordingDuration.value = 0;
    isFocused.value = false;
  }
};

// 暴露方法给父组件
defineExpose({
  startRecording,
  stopRecording,
  cancelRecording,
  isRecording: readonly(isRecording),
});
</script>

<style scoped>
.voice-recorder {
  position: relative;
  display: inline-block;
}

.voice-btn {
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
  user-select: none;
}

.voice-btn.recording {
  background-color: #ff4d4f;
  color: white;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.recording-duration {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1002;
}
</style>
