import { message } from "ant-design-vue";
import request from "./request";
import type { Ref } from "vue";
import type { SelectedVideo, VideoHandlerOptions } from "../types/untilsTypes";

/**
 * 生成唯一 ID 的工具函数
 */
export const generateVideoId = () =>
  Math.random().toString(36).substring(2, 10);

/**
 * 选择视频文件
 */
export const selectVideo = (
  videoInputRef: Ref<HTMLInputElement | null>,
  options: VideoHandlerOptions,
) => {
  if (videoInputRef.value && document.body.contains(videoInputRef.value)) {
    document.body.removeChild(videoInputRef.value);
  }

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "video/*";
  input.style.display = "none";

  videoInputRef.value = input;

  input.onchange = (event: Event) => {
    handleVideoSelect(event, options);
    if (input.parentNode) {
      input.remove();
    }
  };

  document.body.appendChild(input);
  input.click();
};

/**
 * 处理视频文件选择逻辑
 */
export const handleVideoSelect = async (
  event: Event,
  options: VideoHandlerOptions,
) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files || files.length === 0) return;

  // 限制最多选择 9 个视频文件
  if (options.selectedMedias.value.length + files.length > 9) {
    message.warning("最多只能选择 9 个视频文件");
    return;
  }

  // 频率限制
  const now = Date.now();
  if (
    options.lastMediaSelectionTime.value &&
    now - options.lastMediaSelectionTime.value < 1000
  ) {
    message.warning("选择文件过于频繁，请稍后再试");
    return;
  }

  options.lastMediaSelectionTime.value = now;

  // 验证所有文件
  const validFiles: File[] = [];
  for (const file of Array.from(files)) {
    // 验证文件类型
    if (!file.type.startsWith("video/")) {
      message.error(`${file.name} 不是视频文件`);
      continue;
    }

    // 验证文件大小（限制为 100MB）
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      message.error(`${file.name} 文件大小超过 100MB 限制`);
      continue;
    }

    validFiles.push(file);
  }

  if (validFiles.length === 0) {
    return;
  }

  try {
    // 批量上传所有有效文件
    const formData = new FormData();
    validFiles.forEach((file) => {
      formData.append("video", file);
    });

    const response = await request.post("/message/temp-video", formData);

    // 检查响应数据是否正确
    if (!response.data || !response.data.urls || !response.data.filenames) {
      console.error("临时视频上传失败,响应数据格式不正确:", response.data);
      message.error("视频文件上传失败,服务器响应异常");
      return;
    }

    const tempUrls = response.data.urls;
    const tempFilenames = response.data.filenames;

    // 确保我们有至少一个 URL 和文件名
    if (tempUrls.length > 0 && tempFilenames.length > 0) {
      // 批量添加到选中列表
      validFiles.forEach((file, index) => {
        const previewUrl = URL.createObjectURL(file);
        options.selectedMedias.value.push({
          id: generateVideoId(),
          file,
          previewUrl,
          tempFilename: tempFilenames[index] || tempFilenames[0],
          mediaType: "video",
        });
      });

      console.log("视频批量添加到列表:", options.selectedMedias.value);
    } else {
      console.error("临时视频上传失败,缺少 URL 或文件名:", response.data);
      message.error("视频文件上传失败,缺少必要的 URL 或文件名");
    }
  } catch (error: any) {
    console.error("批量上传临时视频文件失败:", error);
    message.error(`视频文件上传失败:${error.message || error}`);
  }

  // 清空输入框值,支持重复选择同一文件
  if (target) {
    target.value = "";
  }
};

/**
 * 移除选中的视频
 */
export const removeVideo = async (
  videoId: string,
  options: VideoHandlerOptions,
  lastRemoveMediaTimeRef?: Ref<number | null>,
) => {
  // 实现删除频率限制
  if (lastRemoveMediaTimeRef) {
    const now = Date.now();
    if (
      lastRemoveMediaTimeRef.value &&
      now - lastRemoveMediaTimeRef.value < 500
    ) {
      message.warning("删除视频文件过于频繁，请稍后再试");
      return;
    }
    lastRemoveMediaTimeRef.value = now;
  }

  const index = options.selectedMedias.value.findIndex((v) => v.id === videoId);
  if (index !== -1) {
    const video = options.selectedMedias.value[index];

    // 释放预览 URL
    if (video.previewUrl) {
      URL.revokeObjectURL(video.previewUrl);
    }

    // 如果有临时文件名，调用接口删除临时文件
    if (video.tempFilename) {
      try {
        await request.delete(`/message/temp-video`, {
          data: { filename: video.tempFilename },
        });
        options.selectedMedias.value.splice(index, 1);
      } catch (err) {
        console.error("删除临时视频文件失败:", err);
        // 即使删除失败也要从列表中移除，防止重复尝试
        options.selectedMedias.value.splice(index, 1);
        message.error("删除临时视频文件时出现问题，但文件仍已从列表中移除");
      }
    } else {
      // 没有临时文件名，直接从列表中移除
      options.selectedMedias.value.splice(index, 1);
    }
  }
};

/**
 * 清空所有选中的视频
 */
export const clearSelectedVideos = (options: VideoHandlerOptions) => {
  // 释放所有预览 URL
  options.selectedMedias.value.forEach((video) => {
    if (video.previewUrl) {
      URL.revokeObjectURL(video.previewUrl);
    }
  });
  options.selectedMedias.value = [];
};
