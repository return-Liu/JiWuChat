import { message } from "ant-design-vue";
import { handleSendMessage } from "./contactManager";
import type { Ref } from "vue";
import type { SelectedImage, SelectedVideo } from "../types/chatTypes";
import type {
  SendMessageOptions,
  SelectedFileItem,
} from "../types/untilsTypes";

/**
 * 检查发送频率限制
 */
const checkSendFrequency = (
  lastSendTime: Ref<number | null>,
  interval: number,
  type: string,
): boolean => {
  const now = Date.now();
  if (lastSendTime.value && now - lastSendTime.value < interval) {
    const remain = Math.ceil((interval - (now - lastSendTime.value)) / 1000);
    message.warning(`${type}发送过于频繁，请等待 ${remain} 秒`);
    return false;
  }
  return true;
};

/**
 * 清除撤回消息的内容
 */
const clearRecalledContent = (contact: any) => {
  if (!contact?.messages) return;
  contact.messages.forEach((msg: any) => {
    if (msg.isRecalled && msg.recalledContent) {
      msg.recalledContent = "";
    }
  });
};

/**
 * 释放图片预览URL
 */
const revokeImageUrls = (images: SelectedImage[]) => {
  images.forEach(img => URL.revokeObjectURL(img.previewUrl));
};

/**
 * 释放视频预览URL
 */
const revokeVideoUrls = (videos: SelectedVideo[]) => {
  videos.forEach(vid => {
    if (vid.previewUrl) URL.revokeObjectURL(vid.previewUrl);
  });
};

/**
 * 发送消息（文本/图片/视频/文件）
 */
export const sendMessages = async (options: SendMessageOptions & {
  contacts?: any[];
  activeContact?: any;
}) => {
  const {
    messageTextareaRef,
    selectedImages,
    selectedVideos,
    selectedFiles,
    lastImageSendTime,
    lastVideoSendTime,
    lastTextSendTime,
    lastFileSendTime,
    newMessage,
    messagesContainerRef,
    scrollToBottom,
    userStore,
    activeContactId,
    getOptions,
    activeContact,
    rightChatAreaRef,
  } = options;

  // 检查拉黑状态
  if (activeContact && !activeContact.isGroup && activeContact.blocked) {
    message.warning("对方已将你拉黑，无法发送消息");
    return;
  }

  let hasSent = false;
  const sendOpts = { ...getOptions, rightChatAreaRef };

  // 1. 发送文本
  if (newMessage.value.trim()) {
    if (!checkSendFrequency(lastTextSendTime, 1000, "消息")) return;

    await handleSendMessage(
      activeContactId,
      newMessage.value.trim(),
      sendOpts,
      userStore,
      "text",
    );

    clearRecalledContent(activeContact);
    if (messageTextareaRef) {
      messageTextareaRef.innerText = "";
      newMessage.value = "";
    }
    lastTextSendTime.value = Date.now();
    hasSent = true;
  }

  // 2. 发送图片
  if (selectedImages.value.length > 0) {
    if (!checkSendFrequency(lastImageSendTime, 5000, "图片")) return;

    const tempFilenames = selectedImages.value
      .map(img => img.tempFilename)
      .filter((f): f is string => !!f);

    await handleSendMessage(
      activeContactId,
      "",
      sendOpts,
      userStore,
      "image",
      undefined,
      tempFilenames,
    );

    clearRecalledContent(activeContact);
    revokeImageUrls(selectedImages.value);
    selectedImages.value = [];
    lastImageSendTime.value = Date.now();
    hasSent = true;
  }

  // 3. 发送视频
  if (selectedVideos.value.length > 0) {
    if (!checkSendFrequency(lastVideoSendTime, 5000, "视频")) return;

    const tempFilenames = selectedVideos.value
      .map(v => v.tempFilename)
      .filter((f): f is string => !!f);

    await handleSendMessage(
      activeContactId,
      "",
      sendOpts,
      userStore,
      "video",
      undefined,
      tempFilenames,
    );

    clearRecalledContent(activeContact);
    revokeVideoUrls(selectedVideos.value);
    selectedVideos.value = [];
    lastVideoSendTime.value = Date.now();
    hasSent = true;
  }

  // 4. 发送文件
  if (selectedFiles?.value?.length) {
    if (!checkSendFrequency(lastFileSendTime!, 5000, "文件")) return;

    const tempFilenames = selectedFiles.value
      .map(f => f.tempFilename)
      .filter((f): f is string => !!f);

    const originalNames = selectedFiles.value
      .map(f => f.originalName || f.file.name)
      .filter((n): n is string => !!n);

    // 修复：通过 file.size 获取文件大小
    const fileSizes = selectedFiles.value
      .map(f => f.file.size)
      .filter((s): s is number => !!s);

    await handleSendMessage(
      activeContactId,
      "",
      sendOpts,
      userStore,
      "file",
      undefined,
      tempFilenames,
      originalNames,
      fileSizes,
    );

    selectedFiles.value = [];
    if (lastFileSendTime) lastFileSendTime.value = Date.now();
    hasSent = true;
  }

  // 滚动到底部
  if (hasSent && messagesContainerRef) {
    scrollToBottom();
  }
};