import { message } from "ant-design-vue";
import request from "./request";
import type { Ref } from "vue";
import type { SelectedVoice, VoiceHandlerOptions } from "../types/untilsTypes";

/**
 * 生成唯一 ID 的工具函数
 */
export const generateVoiceId = () =>
  Math.random().toString(36).substring(2, 10);

/**
 * 选择语音文件
 */
export const selectVoice = (
  voiceInputRef: Ref<HTMLInputElement | null>,
  options: VoiceHandlerOptions,
) => {
  if (voiceInputRef.value && document.body.contains(voiceInputRef.value)) {
    document.body.removeChild(voiceInputRef.value);
  }

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "audio/*";
  input.style.display = "none";

  voiceInputRef.value = input;

  input.onchange = (event: Event) => {
    handleVoiceSelect(event, options);
    if (input.parentNode) {
      input.remove();
    }
  };

  document.body.appendChild(input);
  input.click();
};

/**
 * 处理语音文件选择逻辑
 */
export const handleVoiceSelect = async (
  event: Event,
  options: VoiceHandlerOptions,
) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files || files.length === 0) return;

  const file = files[0];

  // 验证文件类型
  if (!file.type.startsWith("audio/")) {
    message.error("请选择音频文件");
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

  try {
    // 上传语音文件到临时存储
    const formData = new FormData();
    formData.append("audio", file);

    const response = await request.post("/message/temp-voice", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // 检查响应数据是否正确
    if (!response.data || !response.data.url || !response.data.filename) {
      console.error("临时语音上传失败,响应数据格式不正确:", response.data);
      message.error("语音文件上传失败,服务器响应异常");
      return;
    }

    const tempUrl = response.data.url;
    const tempFilename = response.data.filename;

    // 添加到选中列表
    const voiceId = generateVoiceId();
    options.selectedMedias.value.push({
      id: voiceId,
      file,
      tempFilename,
      mediaType: "voice",
    });

    message.success("语音文件已添加");
  } catch (error: any) {
    console.error("语音文件上传失败:", error);
    message.error(`语音文件上传失败:${error.message || error}`);
  }
};

/**
 * 移除选中的语音
 */
export const removeVoice = async (
  voiceId: string,
  options: VoiceHandlerOptions,
  lastRemoveMediaTimeRef?: Ref<number | null>,
) => {
  // 实现删除频率限制
  if (lastRemoveMediaTimeRef) {
    const now = Date.now();
    if (
      lastRemoveMediaTimeRef.value &&
      now - lastRemoveMediaTimeRef.value < 500
    ) {
      message.warning("删除语音文件过于频繁，请稍后再试");
      return;
    }
    lastRemoveMediaTimeRef.value = now;
  }

  const index = options.selectedMedias.value.findIndex(
    (v) => v.id === voiceId,
  );
  if (index !== -1) {
    const voice = options.selectedMedias.value[index];

    // 如果有临时文件名，调用接口删除临时文件
    if (voice.tempFilename) {
      try {
        await request.delete(`/message/temp-voice`, {
          data: { filename: voice.tempFilename },
        });
        options.selectedMedias.value.splice(index, 1);
      } catch (err) {
        console.error("删除临时语音文件失败:", err);
        // 即使删除失败也要从列表中移除，防止重复尝试
        options.selectedMedias.value.splice(index, 1);
        message.error("删除临时语音文件时出现问题，但文件仍已从列表中移除");
      }
    } else {
      // 没有临时文件名，直接从列表中移除
      options.selectedMedias.value.splice(index, 1);
    }
  }
};

/**
 * 清空所有选中的语音
 */
export const clearSelectedVoices = (options: VoiceHandlerOptions) => {
  options.selectedMedias.value = [];
};

/**
 * 音频录制器类
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private durationInterval: NodeJS.Timeout | null = null;

  private onStartCallback: (() => void) | null = null;
  private onCompleteCallback:
    | ((audioBlob: Blob) => Promise<void> | void)
    | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private onDurationUpdateCallback: ((duration: number) => void) | null = null;

  constructor(
    onStart?: () => void,
    onComplete?: (audioBlob: Blob) => Promise<void> | void,
    onError?: (error: Error) => void,
    onDurationUpdate?: (duration: number) => void,
  ) {
    this.onStartCallback = onStart || null;
    this.onCompleteCallback = onComplete || null;
    this.onErrorCallback = onError || null;
    this.onDurationUpdateCallback = onDurationUpdate || null;
  }

  /**
   * 开始录音
   */
  async startRecording(): Promise<void> {
    try {
      // 请求麦克风权限
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 创建 MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      // 监听数据可用事件
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // 监听录音停止事件
      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });

        // 清理定时器
        if (this.durationInterval) {
          clearInterval(this.durationInterval);
          this.durationInterval = null;
        }

        // 调用完成回调
        if (this.onCompleteCallback) {
          try {
            await this.onCompleteCallback(audioBlob);
          } catch (error) {
            console.error("录音完成回调执行失败:", error);
          }
        }

        // 停止所有音轨
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }
      };

      // 监听错误事件
      this.mediaRecorder.onerror = (event) => {
        const error = new Error(
          `录音错误: ${(event as any).error?.message || "未知错误"}`,
        );
        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }

        // 清理资源
        this.cleanup();
      };

      // 开始录音
      this.mediaRecorder.start(100); // 每100ms收集一次数据
      this.startTime = Date.now();

      // 启动时长更新
      this.durationInterval = setInterval(() => {
        const duration = (Date.now() - this.startTime) / 1000;
        if (this.onDurationUpdateCallback) {
          this.onDurationUpdateCallback(duration);
        }
      }, 100);

      // 调用开始回调
      if (this.onStartCallback) {
        this.onStartCallback();
      }
    } catch (error: any) {
      const errorMessage =
        error.name === "NotAllowedError"
          ? "麦克风权限被拒绝，请允许使用麦克风"
          : error.message || "无法访问麦克风";

      const err = new Error(errorMessage);
      if (this.onErrorCallback) {
        this.onErrorCallback(err);
      }
      throw err;
    }
  }

  /**
   * 停止录音
   */
  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
  }

  /**
   * 取消录音
   */
  cancelRecording(): void {
    this.cleanup();

    // 重置音频块
    this.audioChunks = [];
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    // 清理定时器
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }

    // 停止媒体录制器
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch (error) {
        console.error("停止媒体录制器失败:", error);
      }
    }
    this.mediaRecorder = null;

    // 停止所有音轨
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // 重置音频块
    this.audioChunks = [];
  }
}

/**
 * 获取音频文件的时长（秒）
 */
export const getAudioDuration = (audioBlob: Blob): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration;
      URL.revokeObjectURL(audioUrl);
      resolve(duration);
    });

    audio.addEventListener('error', (error) => {
      URL.revokeObjectURL(audioUrl);
      reject(new Error(`无法加载音频文件: ${error.message || '未知错误'}`));
    });

    // 设置一个超时，防止无限等待
    setTimeout(() => {
      URL.revokeObjectURL(audioUrl);
      reject(new Error('获取音频时长超时'));
    }, 5000);
  });
};
