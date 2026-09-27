import { message } from "ant-design-vue";
import request from "./request";
import type { Ref } from "vue";
import type { ChatMessage } from "../types/chatTypes";
import type { SelectedImage, ImageHandlerOptions } from "../types/untilsTypes";

/**
 * 生成唯一 ID 的工具函数
 */
export const generateimageId = () =>
  Math.random().toString(36).substring(2, 10);

/**
 * 选择图片文件 - 创建隐藏的文件输入框，支持多选
 */
export const selectImage = (
  imageInputRef: Ref<HTMLInputElement | null>,
  options: ImageHandlerOptions,
) => {
  // 检查是否有已经存在的 input 元素，如果有则先移除
  if (imageInputRef.value && document.body.contains(imageInputRef.value)) {
    document.body.removeChild(imageInputRef.value);
  }

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*"; // 仅允许选择图片文件
  input.multiple = true; // 支持多选
  input.style.display = "none"; // 隐藏输入框

  imageInputRef.value = input;

  input.onchange = (event: Event) => {
    handleImageSelect(event, options);
    // 确保元素存在再移除
    if (input.parentNode) {
      input.remove();
    }
  };

  document.body.appendChild(input);
  input.click(); // 触发选择框
};

/**
 * 处理图片文件选择逻辑 - 验证、批量上传临时文件、添加到预览列表
 */
export const handleImageSelect = async (
  event: Event,
  options: ImageHandlerOptions,
) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files || files.length === 0) return;

  // 限制最多选择 9 个图片文件
  if (options.selectedMedias.value.length + files.length > 9) {
    message.warning("最多只能选择 9 个图片文件");
    return;
  }

  // 频率限制 - 1 秒内只能选择一次
  const now = Date.now();
  if (
    options.lastMediaSelectionTime.value &&
    now - options.lastMediaSelectionTime.value < 1000
  ) {
    message.warning("选择图片文件过于频繁,请稍后再试");
    return;
  }

  options.lastMediaSelectionTime.value = now;

  // 验证所有文件
  const validFiles: File[] = [];
  for (const file of Array.from(files)) {
    // 仅验证图片类型
    if (!file.type.startsWith("image/")) {
      message.error(`${file.name} 不是图片文件`);
      continue;
    }

    // 验证文件大小（最大 10MB）
    if (file.size > 10 * 1024 * 1024) {
      message.error(`${file.name} 大小超过 10MB`);
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
      formData.append("image", file);
    });

    const response = await request.post("/message/temp-image", formData);

    // 检查响应数据是否正确
    if (!response.data || !response.data.urls || !response.data.filenames) {
      console.error("临时图片上传失败,响应数据格式不正确:", response.data);
      message.error("图片文件上传失败,服务器响应异常");
      return;
    }

    const tempUrls = response.data.urls;
    const tempFilenames = response.data.filenames;

    // 确保我们有至少一个 URL 和文件名
    if (tempUrls.length > 0 && tempFilenames.length > 0) {
      // 批量添加到选中图片列表
      validFiles.forEach((file, index) => {
        options.selectedMedias.value.push({
          id: generateimageId(),
          file,
          previewUrl: tempUrls[index] || tempUrls[0],
          tempFilename: tempFilenames[index] || tempFilenames[0],
          mediaType: "image",
        });
      });

      console.log("图片批量添加到列表:", options.selectedMedias.value);
    } else {
      console.error("临时图片上传失败,缺少 URL 或文件名:", response.data);
      message.error("图片文件上传失败,缺少必要的 URL 或文件名");
    }
  } catch (error: any) {
    console.error("批量上传临时图片文件失败:", error);
    message.error(`图片文件上传失败:${error.message || error}`);
  }

  // 清空输入框值,支持重复选择同一文件
  if (target) {
    target.value = "";
  }
};

/**
 * 删除选中的图片文件 - 同时删除临时文件
 */
export const removeImage = async (
  id: string,
  selectedImages: Ref<SelectedImage[]>,
  lastRemoveMediaTimeRef?: Ref<number | null>, // 添加参数来追踪上次删除时间
) => {
  // 实现删除频率限制
  if (lastRemoveMediaTimeRef) {
    const now = Date.now();
    if (
      lastRemoveMediaTimeRef.value &&
      now - lastRemoveMediaTimeRef.value < 500
    ) {
      // 0.5 秒内不能重复删除
      message.warning("删除图片文件过于频繁，请稍后再试");
      return;
    }
    lastRemoveMediaTimeRef.value = now;
  }

  const imageIndex = selectedImages.value.findIndex((image) => image.id === id);
  if (imageIndex !== -1) {
    const image = selectedImages.value[imageIndex];

    // 先释放预览 URL，防止内存泄漏和 null 引用错误
    if (image.previewUrl) {
      URL.revokeObjectURL(image.previewUrl);
    }

    // 如果有临时文件名，调用接口删除临时文件
    if (image.tempFilename) {
      try {
        // 发起删除请求
        await request.delete(`/message/temp-image`, {
          data: { filename: image.tempFilename },
        });
        // 从列表中移除
        selectedImages.value.splice(imageIndex, 1);
      } catch (err) {
        console.error("删除临时图片文件失败:", err);
        // 即使删除失败也要从列表中移除，防止重复尝试
        selectedImages.value.splice(imageIndex, 1);
        message.error("删除临时图片文件时出现问题，但文件仍已从列表中移除");
      }
    } else {
      // 没有临时文件名，直接从列表中移除
      selectedImages.value.splice(imageIndex, 1);
    }
  }
};
/**
 * 预览图片文件 - 从聊天记录中提取所有图片并定位当前图片
 */
export const previewImage = (
  imageUrl: string,
  activeContact: Ref<any>,
  previewImages: Ref<string[]>,
  currentPreviewIndex: Ref<number>,
  showImagePreview: Ref<boolean>,
) => {
  // 获取当前聊天中所有图片消息
  const allImages =
    activeContact.value?.messages
      ?.filter((msg: ChatMessage) => msg.messageType === "image") // 仅筛选图片消息
      .map((msg: ChatMessage) => msg.content) || [];

  // 查找当前图片在列表中的索引
  const currentIndex = allImages.findIndex((item: string) => item === imageUrl);

  if (currentIndex >= 0) {
    // 存在于聊天记录中，加载所有图片
    previewImages.value = allImages;
    currentPreviewIndex.value = currentIndex;
    showImagePreview.value = true;
  } else {
    // 不存在则单独预览当前图片
    previewImages.value = [imageUrl];
    currentPreviewIndex.value = 0;
    showImagePreview.value = true;
  }
};

/**
 * 关闭图片预览弹窗
 */
export const closeImagePreview = (
  showImagePreview: Ref<boolean>,
  previewImageUrl: Ref<string>,
) => {
  showImagePreview.value = false;
  previewImageUrl.value = "";
  document.body.style.overflow = ""; // 恢复页面滚动
};
