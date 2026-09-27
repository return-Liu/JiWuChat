<template>
  <div
    class="message-input-area"
    :style="{
      ...inputAreaStyle,
      '--theme-primary-rgb': hexToRgb(currentColorPalette.color),
      '--theme-light': currentColorPalette.light,
    }"
  >
    <!-- 只读模式或全员禁言下的提示信息 -->
    <div v-if="readonly || shouldShowMuteAllHint" class="readonly-hint">
      <div class="hint-content">
        <span class="hint-text">{{ readonly ? noContentTip : muteAllHintText }}</span>
      </div>
    </div>

    <!-- 被拉黑时的提示信息（区分双向） -->
    <div v-else-if="theyBlockedMe" class="readonly-hint blocked-hint">
      <div class="hint-content">
        <span class="hint-text">对方已将你拉黑，无法发送消息</span>
      </div>
    </div>
    <div v-else-if="iBlockedThem" class="readonly-hint blocked-hint">
      <div class="hint-content">
        <span class="hint-text">你已拉黑对方，无法发送消息，请先取消拉黑</span>
      </div>
    </div>

    <!-- 非只读模式下的正常输入区域 -->
    <template v-else>
      <!-- 语音录制模式 - 隐藏工具栏 -->
      <VoiceRecordingArea
        v-if="isVoiceMode"
        :is-recording="isVoiceRecording"
        :duration="voiceRecordingDuration"
        @exit="handleExitVoiceMode"
      />

      <!-- 文本输入模式 - 显示工具栏 -->
      <template v-else>
        <div class="input-tools">
          <!-- 左侧工具按钮 -->
          <InputToolButtons
            :disabled="readonly || shouldShowMuteAllHint || isBlockedComputed"
            @click="handleToggleEmojiPicker"
            @select-media="handleSelectMedia"
            @voice-message="handleVoiceMessage"
            @select-file="handleSelectFile"
            @screen-capture="handleScreenCapture"
          />

          <!-- 右侧工具按钮 -->
          <div class="input-tools-right">
            <a-tooltip content="聊天记录" placement="top">
              <div class="input-tool-btn clickable-text" @click="handleOpenChatHistoryModal">
                <i class="iconfont icon-a-9 menu-icon tool-icon"></i>
              </div>
            </a-tooltip>
          </div>
        </div>

        <!-- 文本输入区域 -->
        <div class="message-input-wrapper">
          <!-- 图片/截图预览列表 -->
          <ImagePreviewList :images="selectedImages" @preview="handlePreviewTempImage" />

          <!-- 视频预览列表 -->
          <VideoPreviewList
            :videos="selectedVideos"
            @preview="handlePreviewTempVideo"
            @play-video-on-hover="handlePlayVideoOnHover"
            @pause-video-on-leave="handlePauseVideoOnLeave"
          />

          <!-- 文件预览列表 -->
          <FilePreviewList :files="selectedFiles" @preview="handlePreviewFile" />

          <div class="message-input-container">
            <div
              ref="messageTextareaRef"
              class="message-input-content"
              :contenteditable="!(readonly || shouldShowMuteAllHint || isBlockedComputed)"
              @keydown="handleKeyDown"
              @input="handleInput"
              @focus="handleFocus"
              @paste="handlePaste"
            ></div>
          </div>

          <!-- 发送提示 -->
          <div
            class="send-hint"
            @click="
              !isSendButtonEnabled || readonly || shouldShowMuteAllHint || isBlockedComputed
                ? null
                : handleSendMessage()
            "
            :style="{
              opacity:
                !isSendButtonEnabled || readonly || shouldShowMuteAllHint || isBlockedComputed
                  ? 0.5
                  : 1,
              cursor:
                !isSendButtonEnabled || readonly || shouldShowMuteAllHint || isBlockedComputed
                  ? 'not-allowed'
                  : 'pointer',
            }"
          >
            <span class="send-hint-text">按 Enter</span>
            <span class="send-hint-divider">|</span>
            <span class="send-hint-text">Shift + Enter</span>
          </div>
        </div>

        <!-- 表情包选择器 -->
        <EmojiPicker
          :visible="showEmojiPicker"
          @select="handleInsertEmoji"
          @close="showEmojiPicker = false"
        />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, type Ref } from "vue";
import { useUiSettings } from "../stores/uiSettings";
import { useSiderColor } from "../stores/siderColor";
import type { Contact } from "../types/chatTypes";
import { message } from "ant-design-vue";
import type { SelectedImage as ImportedSelectedImage } from "../untils/imageHandler";
import type { SelectedVideo as ImportedSelectedVideo } from "../untils/videoHandler";
import { AudioRecorder, getAudioDuration } from "../untils/audioHandler";

const siderColorStore = useSiderColor();

let typingTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
let lastTypingStatus = false;

// 语音模式状态
const isVoiceMode = ref(false);
const isVoiceRecording = ref(false);
const voiceRecordingDuration = ref(0);

interface ColorPalette {
  name: string;
  color: string;
  light: string;
  active: string;
}

type SelectedImage = ImportedSelectedImage;
type SelectedVideo = ImportedSelectedVideo;

interface SelectedFileItem {
  id: string;
  file: File;
  name?: string;
  size?: number;
  type?: string;
}

interface Props {
  readonly?: boolean;
  isBlocked?: boolean;
  iBlockedThem?: boolean;
  theyBlockedMe?: boolean;
  noContentTip?: string;
  activeContact: Contact | null;
  currentColorPalette: ColorPalette;
  selectedImages: SelectedImage[];
  selectedVideos: SelectedVideo[];
  selectedFiles?: SelectedFileItem[];
  showEmojiPicker: boolean;
  isSendButtonDisabled: boolean;
  newMessage: string;
  contacts?: Contact[];
  currentUserId?: string;
  rightChatAreaRef?: any;
  scrollToBottom?: () => void;
  messagesContainerRef?: HTMLElement | null;
  lastTextSendTime?: Ref<number | null>;
  lastImageSendTime?: Ref<number | null>;
  lastVideoSendTime?: Ref<number | null>;
  lastFileSendTime?: Ref<number | null>;
  getOptions?: any;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  isBlocked: false,
  iBlockedThem: false,
  theyBlockedMe: false,
  noContentTip: "爱发消息的人 运气不会差...",
  selectedFiles: () => [],
  currentUserId: "",
  contacts: () => [],
});

const emit = defineEmits<{
  (
    e: "send-message",
    payload?: {
      text?: string;
      images?: SelectedImage[];
      videos?: SelectedVideo[];
      files?: SelectedFileItem[];
      hasText: boolean;
      hasMedia: boolean;
      hasFiles: boolean;
    },
  ): void;
  (e: "toggle-emoji-picker", event?: Event): void;
  (e: "insert-emoji", emoji: string): void;
  (e: "select-media"): void;
  (e: "select-file", files: File[]): void;
  (e: "remove-image", id: string): void;
  (e: "remove-video", id: string): void;
  (e: "remove-file", id: string): void;
  (e: "preview-temp-image", image: SelectedImage, index: number): void;
  (e: "preview-temp-video", video: SelectedVideo, index: number): void;
  (e: "preview-file", file: SelectedFileItem): void;
  (e: "play-video-on-hover", event: MouseEvent): void;
  (e: "pause-video-on-leave", event: MouseEvent): void;
  (e: "open-chat-history-modal"): void;
  (e: "update:new-message", value: string): void;
  (e: "add-screenshot", screenshot: SelectedImage): void;
  (e: "update:show-emoji-picker", value: boolean): void;
}>();

// 添加响应式变量用于控制表情包选择器的显示
const showEmojiPicker = ref(props.showEmojiPicker);

// 添加响应式变量来跟踪输入框中的文本内容
const currentInputText = ref("");

// 监听外部传入的showEmojiPicker变化
watch(
  () => props.showEmojiPicker,
  (newValue) => {
    showEmojiPicker.value = newValue;
  },
);

// 监听内部showEmojiPicker变化并同步到父组件
watch(showEmojiPicker, (newValue) => {
  emit("update:show-emoji-picker", newValue);
});

const messageTextareaRef = ref<HTMLElement | null>(null);

watch(
  () => props.activeContact,
  async (newVal) => {
    if (newVal && messageTextareaRef.value) {
      await nextTick();
      messageTextareaRef.value.focus();
    }
  },
  { immediate: false },
);

// ==================== 键盘事件处理（核心修复） ====================

/**
 * 统一的键盘事件处理
 * 修复回车发送消息的问题
 */
const handleKeyDown = (event: KeyboardEvent) => {
  // 如果处于只读或禁言状态，阻止所有键盘操作
  if (props.readonly || shouldShowMuteAllHint.value || isBlockedComputed.value) {
    event.preventDefault();
    return;
  }

  // 处理回车键
  if (event.key === "Enter") {
    // Shift + Enter 换行
    if (event.shiftKey) {
      // 允许换行，不阻止默认行为
      return;
    }

    // 单独按 Enter 发送消息
    event.preventDefault();

    // 获取当前文本内容
    const text = extractPureTextContent();
    const hasText = text.trim().length > 0;
    const hasMedia = props.selectedImages.length > 0 || props.selectedVideos.length > 0;
    const hasFiles = props.selectedFiles && props.selectedFiles.length > 0;

    // 如果有内容则发送
    if (hasText || hasMedia || hasFiles) {
      handleSendMessage();
    }
    return;
  }

  // 处理 Backspace 删除（删除附件）
  if (event.key === "Backspace") {
    const text = extractPureTextContent();
    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().length > 0;

    // 如果没有文本内容且没有选中内容，删除附件
    if (!hasSelection && text.trim() === "") {
      if (props.selectedFiles && props.selectedFiles.length > 0) {
        event.preventDefault();
        const lastFile = props.selectedFiles[props.selectedFiles.length - 1];
        emit("remove-file", lastFile.id);
        return;
      }
      if (props.selectedVideos.length > 0) {
        event.preventDefault();
        const lastVideo = props.selectedVideos[props.selectedVideos.length - 1];
        emit("remove-video", lastVideo.id);
        return;
      }
      if (props.selectedImages.length > 0) {
        event.preventDefault();
        const lastImage = props.selectedImages[props.selectedImages.length - 1];
        emit("remove-image", lastImage.id);
        return;
      }
    }
  }
};

// ==================== 其他事件处理 ====================

const handleFocus = () => {
  // 聚焦时不需要额外操作
};

const handlePaste = (event: ClipboardEvent) => {
  // 处理粘贴图片
  const items = event.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith("image/")) {
      event.preventDefault();
      const file = item.getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const previewUrl = e.target?.result as string;
          const image: SelectedImage = {
            id: `paste_${Date.now()}`,
            previewUrl,
            file,
            mediaType: "image",
          };
          // 通过 select-media 事件添加图片
          emit("select-media");
        };
        reader.readAsDataURL(file);
      }
      break;
    }
  }
};

// 移除 inputAreaStyle 中的背景色
const inputAreaStyle = computed(() => {
  return {
    background: "transparent",
    borderTop: `1px solid ${siderColorStore.dividerLineColorValue}`,
  };
});

// 统一的拉黑判断
const isBlockedComputed = computed(() => {
  return props.iBlockedThem || props.theyBlockedMe || props.isBlocked;
});

const shouldShowMuteAllHint = computed(() => {
  if (!props.activeContact?.isGroup || !props.activeContact?.muteAll) {
    return false;
  }
  const userRole = props.activeContact.role;
  return userRole !== "owner" && userRole !== "admin";
});

const muteAllHintText = computed(() => {
  if (!props.activeContact) return "全员禁言中";
  const userRole = props.activeContact.role;
  if (userRole === "owner") {
    return "全员禁言中（群主可发言）";
  } else if (userRole === "admin") {
    return "全员禁言中（管理员可发言）";
  } else {
    return "全员禁言中";
  }
});

const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "22, 93, 255";
};

// ==================== 工具按钮事件 ====================

const handleToggleEmojiPicker = () => {
  if (props.readonly || shouldShowMuteAllHint.value || isBlockedComputed.value) return;
  const newState = !showEmojiPicker.value;
  showEmojiPicker.value = newState;
  emit("toggle-emoji-picker");
};

const handleVoiceMessage = () => {
  if (props.readonly || shouldShowMuteAllHint.value || isBlockedComputed.value) return;
  if (isVoiceMode.value) {
    handleExitVoiceMode();
  } else {
    enterVoiceMode();
  }
};

const enterVoiceMode = () => {
  isVoiceMode.value = true;
  isVoiceRecording.value = false;
  voiceRecordingDuration.value = 0;
  document.addEventListener("keydown", handleVoiceKeyDown);
  document.addEventListener("keyup", handleVoiceKeyUp);
};

const handleExitVoiceMode = () => {
  isVoiceMode.value = false;
  isVoiceRecording.value = false;
  voiceRecordingDuration.value = 0;
  document.removeEventListener("keydown", handleVoiceKeyDown);
  document.removeEventListener("keyup", handleVoiceKeyUp);
  if (audioRecorder.value && isVoiceRecording.value) {
    audioRecorder.value.cancelRecording();
  }
};

// 语音录制相关
const audioRecorder = ref<AudioRecorder | null>(null);

const handleVoiceKeyDown = async (event: KeyboardEvent) => {
  if (event.code === "Space" && isVoiceMode.value && !isVoiceRecording.value) {
    event.preventDefault();
    await startVoiceRecording();
  } else if (event.key === "Escape" && isVoiceMode.value) {
    event.preventDefault();
    handleExitVoiceMode();
  }
};

const handleVoiceKeyUp = async (event: KeyboardEvent) => {
  if (event.code === "Space" && isVoiceRecording.value) {
    event.preventDefault();
    await stopVoiceRecording();
  }
};

const startVoiceRecording = async () => {
  try {
    isVoiceRecording.value = true;
    voiceRecordingDuration.value = 0;

    audioRecorder.value = new AudioRecorder(
      () => {
        console.log("开始录音");
      },
      async (audioBlob: Blob) => {
        isVoiceRecording.value = false;
        const duration = await getAudioDuration(audioBlob);
        console.log("录音完成，时长:", duration);
        message.success("语音录制完成");
        handleExitVoiceMode();
      },
      (error: Error) => {
        isVoiceRecording.value = false;
        voiceRecordingDuration.value = 0;
        message.error(`录音失败: ${error.message}`);
      },
      (duration: number) => {
        voiceRecordingDuration.value = duration;
      },
    );

    await audioRecorder.value.startRecording();
  } catch (error: any) {
    isVoiceRecording.value = false;
    voiceRecordingDuration.value = 0;
    message.error(`无法开始录音: ${error.message}`);
  }
};

const stopVoiceRecording = async () => {
  if (audioRecorder.value && isVoiceRecording.value) {
    audioRecorder.value.stopRecording();
  }
};

const handleScreenCapture = async () => {
  if (props.readonly || shouldShowMuteAllHint.value || isBlockedComputed.value) {
    message.warning(
      props.theyBlockedMe
        ? "对方已将你拉黑，无法使用截图功能"
        : props.iBlockedThem
          ? "你已拉黑对方，无法使用截图功能"
          : "全员禁言中，无法使用截图功能",
    );
    return;
  }
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      message.error("您的浏览器不支持截图功能，请升级到最新版本");
      return;
    }
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.onloadedmetadata = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        message.error("截图失败：无法获取画布上下文");
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (!blob) {
          message.error("截图失败：无法转换为图片文件");
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const timestamp = new Date().getTime();
        const file = new File([blob], `截图_${timestamp}.png`, {
          type: "image/png",
        });
        const previewUrl = URL.createObjectURL(blob);
        const screenshot: SelectedImage = {
          id: `screenshot_${timestamp}`,
          previewUrl,
          file,
          isScreenshot: true,
          mediaType: "image",
        };
        emit("add-screenshot", screenshot);
        message.success("截图成功，可直接发送");
        stream.getTracks().forEach((track) => track.stop());
      }, "image/png");
    };
  } catch (error) {
    if ((error as Error).name === "NotAllowedError") {
      message.warning("您拒绝了屏幕捕获权限，无法完成截图");
    } else {
      message.error(`截图失败：${(error as Error).message}`);
    }
  }
};

const handleSelectMedia = () => {
  if (props.readonly || shouldShowMuteAllHint.value || isBlockedComputed.value) {
    message.warning(
      props.theyBlockedMe
        ? "对方已将你拉黑，无法发送图片"
        : props.iBlockedThem
          ? "你已拉黑对方，无法发送图片"
          : "全员禁言中，无法发送图片",
    );
    return;
  }
  emit("select-media");
};

const handleSelectFile = () => {
  if (props.readonly || shouldShowMuteAllHint.value || isBlockedComputed.value) {
    message.warning(
      props.theyBlockedMe
        ? "对方已将你拉黑，无法发送文件"
        : props.iBlockedThem
          ? "你已拉黑对方，无法发送文件"
          : "全员禁言中，无法发送文件",
    );
    return;
  }
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.style.display = "none";
  input.onchange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      emit("select-file", Array.from(files));
    }
    document.body.removeChild(input);
  };
  document.body.appendChild(input);
  input.click();
};

const handleOpenChatHistoryModal = () => {
  emit("open-chat-history-modal");
};

// ==================== 文本提取和输入处理 ====================

const extractPureTextContent = (): string => {
  if (!messageTextareaRef.value) return "";
  return messageTextareaRef.value.innerText?.trim() || "";
};

const handleInput = (e: InputEvent) => {
  if (messageTextareaRef.value) {
    const text = extractPureTextContent();
    currentInputText.value = text;
    emit("update:new-message", text);
    sendTypingStatus(text.length > 0);
  }
};

// ==================== 发送消息 ====================

const handleSendMessage = async () => {
  if (props.readonly || shouldShowMuteAllHint.value) {
    message.warning("全员禁言中，无法发送消息");
    return;
  }

  if (props.theyBlockedMe) {
    message.warning("对方已将你拉黑，无法发送消息");
    return;
  }
  if (props.iBlockedThem) {
    message.warning("你已拉黑对方，无法发送消息，请先取消拉黑");
    return;
  }

  const pureTextContent = extractPureTextContent();
  const hasTextContent = pureTextContent.trim().length > 0;
  const hasMediaContent = props.selectedImages.length > 0 || props.selectedVideos.length > 0;
  const hasFileContent = props.selectedFiles && props.selectedFiles.length > 0;
  const hasContent = hasTextContent || hasMediaContent || hasFileContent;

  if (!hasContent) {
    return;
  }

  const payload = {
    text: hasTextContent ? pureTextContent : undefined,
    images: hasMediaContent ? [...props.selectedImages] : undefined,
    videos: hasMediaContent ? [...props.selectedVideos] : undefined,
    files: hasFileContent ? (props.selectedFiles ? [...props.selectedFiles] : []) : undefined,
    hasText: hasTextContent,
    hasMedia: hasMediaContent,
    hasFiles: hasFileContent,
  };

  if (hasTextContent) {
    emit("update:new-message", pureTextContent);
  }

  emit("send-message", payload);

  // 清空输入框
  if (messageTextareaRef.value) {
    messageTextareaRef.value.innerText = "";
    currentInputText.value = "";
  }

  if (props.scrollToBottom) {
    await nextTick();
    props.scrollToBottom();
  }
};

// ==================== 打字状态 ====================

const sendTypingStatus = async (isTyping: boolean) => {
  if (isTyping === lastTypingStatus) return;
  if (typingTimeoutTimer) clearTimeout(typingTimeoutTimer);
  try {
    const { websocketService } = await import("../untils/websocket");
    if (props.activeContact && !props.activeContact.isGroup) {
      websocketService.sendTypingStatus({
        targetId: String(props.activeContact.id),
        isTyping,
      });
      lastTypingStatus = isTyping;
    }
    if (isTyping) {
      typingTimeoutTimer = setTimeout(() => {
        sendTypingStatus(false);
      }, 3000);
    }
  } catch (error) {
    console.error("[MessageInputArea] 发送正在输入状态失败:", error);
  }
};

// ==================== 表情插入 ====================

const handleInsertEmoji = (emoji: string) => {
  if (!messageTextareaRef.value) return;
  messageTextareaRef.value.focus();

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (range.toString()) range.deleteContents();
    const emojiNode = document.createTextNode(emoji);
    range.insertNode(emojiNode);
    range.setStartAfter(emojiNode);
    range.setEndAfter(emojiNode);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    messageTextareaRef.value.appendChild(document.createTextNode(emoji));
  }

  const newMessage = messageTextareaRef.value.innerText || "";
  currentInputText.value = newMessage;
  emit("update:new-message", newMessage);
  const inputEvent = new InputEvent("input", {
    bubbles: true,
    cancelable: true,
  });
  messageTextareaRef.value.dispatchEvent(inputEvent);
};

// ==================== 预览事件 ====================

const handlePreviewTempImage = (image: SelectedImage, index: number) => {
  emit("preview-temp-image", image, index);
};

const handlePreviewTempVideo = (video: SelectedVideo, index: number) => {
  emit("preview-temp-video", video, index);
};

const handlePlayVideoOnHover = (event: MouseEvent) => {
  emit("play-video-on-hover", event);
};

const handlePauseVideoOnLeave = (event: MouseEvent) => {
  emit("pause-video-on-leave", event);
};

const handlePreviewFile = (file: SelectedFileItem) => {
  emit("preview-file", file);
};

// ==================== 发送按钮状态 ====================

const isSendButtonEnabled = computed(() => {
  if (props.readonly || shouldShowMuteAllHint.value || isBlockedComputed.value) {
    return false;
  }

  const hasTextContent = currentInputText.value.trim().length > 0;
  const hasMediaContent = props.selectedImages.length > 0 || props.selectedVideos.length > 0;
  const hasFileContent = props.selectedFiles && props.selectedFiles.length > 0;

  return hasTextContent || hasMediaContent || hasFileContent;
});

// ==================== 生命周期 ====================

onMounted(() => {
  // 初始化逻辑
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleVoiceKeyDown);
  document.removeEventListener("keyup", handleVoiceKeyUp);
  if (typingTimeoutTimer) {
    clearTimeout(typingTimeoutTimer);
    typingTimeoutTimer = null;
  }
  if (audioRecorder.value) {
    audioRecorder.value.cancelRecording();
  }
});

defineExpose({
  messageTextareaRef,
  handleInsertEmoji,
});
</script>

<style scoped>
.message-input-area {
  padding: 16px;
  height: auto;
  min-height: 100px;
  max-height: 40vh;
  display: flex;
  flex-direction: column;
  background: transparent;
  position: relative;
  --text-primary: v-bind("siderColorStore.currentColorPalette.textPrimary");
}

.readonly-hint {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.hint-content {
  text-align: center;
}

.hint-text {
  color: var(--text-primary);
  font-weight: 500;
}

.input-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-tools-right {
  display: flex;
  gap: 8px;
}

.input-tool-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #5f5f5f;
}

.input-tool-btn:hover {
  background-color: var(--theme-light);
}

.tool-icon {
  font-size: 20px;
  color: #5f5f5f;
}

.message-input-wrapper {
  position: relative;
  flex: 1;
  margin-top: 8px;
}

.message-input-container {
  border-radius: 12px;
  background: transparent;
}

.message-input-content {
  min-height: 80px;
  max-height: 200px;
  overflow-y: auto;
  outline: none;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 空状态占位 */
.message-input-content:empty::before {
  content: attr(data-placeholder);
  color: #aaa;
  pointer-events: none;
}

.send-hint {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  backdrop-filter: blur(4px);
  pointer-events: auto;
}

.send-hint-text {
  user-select: none;
  color: #000;
}

.send-hint-divider {
  color: #000;
}

.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  z-index: 1001;
}

/* 滚动条样式 */
.message-input-content::-webkit-scrollbar {
  width: 4px;
}

.message-input-content::-webkit-scrollbar-track {
  background: transparent;
}

.message-input-content::-webkit-scrollbar-thumb {
  background: var(--theme-light);
  border-radius: 2px;
}
</style>
