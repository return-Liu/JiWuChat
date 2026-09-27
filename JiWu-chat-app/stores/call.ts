import WebRTCCallManager, { CallStatus, type CallStats } from "../untils/webrtcCallManager";
import type { CallManagerOptions } from "../untils/webrtcCallManager";
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { message } from "ant-design-vue";
import { getSignalingService } from "../untils/signalingService";
import { useUserStore } from "./user";
import {
  createCallMessage,
  insertCallMessageToContact,
  sendCallRecordToServer,
} from "../untils/callMessageUtils";
import type { Contact } from "../types/chatTypes";
import { AudioProcessingService } from '../untils/audioProcessingService';
import { RTC_CONFIG } from '../constants/call.config';

// 默认设备状态：麦克风、摄像头、扬声器都开启
const DEFAULT_DEVICE_STATE: Record<string, boolean> = {
  MICROPHONE: true,
  CAMERA: true,
  SPEAKER: true,
};

// 获取媒体流约束配置
const getAdaptiveVideoConstraints = (
  type: "video" | "audio",
  isVideoEnabled: boolean,
  networkQuality: "excellent" | "good" | "fair" | "poor" = "good",
): MediaStreamConstraints => {
  const constraints: MediaStreamConstraints = {
    audio: {
      sampleRate: networkQuality === "poor" ? 16000 : 48000,
      sampleSize: 16,
      channelCount: 1,
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
    },
  };

  if (isVideoEnabled && type === "video") {
    const qualityPresets = {
      excellent: { width: 1280, height: 720, frameRate: 30, bitrate: 2500000 },
      good: { width: 640, height: 480, frameRate: 24, bitrate: 1000000 },
      fair: { width: 480, height: 360, frameRate: 20, bitrate: 500000 },
      poor: { width: 320, height: 240, frameRate: 15, bitrate: 200000 },
    };
    const preset = qualityPresets[networkQuality] || qualityPresets.good;

    constraints.video = {
      width: { ideal: preset.width, max: preset.width },
      height: { ideal: preset.height, max: preset.height },
      frameRate: { ideal: preset.frameRate, max: preset.frameRate },
      facingMode: "user",
      ...(navigator.userAgent.includes("Chrome") && {
        googCpuOveruseDetection: true,
        googCpuUnderuseThreshold: 55,
        googCpuOveruseThreshold: 85,
        googNoiseReduction: false,
        googScreenshare: false,
      }),
    };
  }

  return constraints;
};

// 创建通话 Store
export const useCallStore = defineStore("call", () => {
  // ========== 通话状态 ==========
  const isCalling = ref(false);
  const isInCall = ref(false);
  const callType = ref<"video" | "audio" | null>(null);
  const webRtcStatus = ref<CallStatus>(CallStatus.IDLE);

  // ========== 设备状态 ==========
  const isMicrophoneEnabled = ref<boolean>(DEFAULT_DEVICE_STATE.MICROPHONE);
  const isCameraEnabled = ref<boolean>(DEFAULT_DEVICE_STATE.CAMERA);
  const isSpeakerEnabled = ref<boolean>(DEFAULT_DEVICE_STATE.SPEAKER);

  // ========== 通话参与者信息 ==========
  const callerId = ref<string | null>(null);
  const receiverId = ref<string | null>(null);
  const callerAvatar = ref<string | null>(null);
  const receiverAvatar = ref<string | null>(null);
  const receiverName = ref<string | null>(null);

  // ========== 媒体流 ==========
  const localStream = ref<MediaStream | null>(null);
  const remoteStream = ref<MediaStream | null>(null);

  // ========== 音频处理器 ==========
  const audioProcessor = ref<AudioProcessingService | null>(null);

  // ========== 通话时间 ==========
  const callStartTime = ref<number | null>(null);
  const callDuration = ref(0);

  // ========== 延迟监控 ==========
  const currentLatency = ref(0);
  const maxLatency = ref(0);
  const avgLatency = ref(0);
  const latencyHistory: number[] = [];
  const MAX_LATENCY_HISTORY = 30;
  let statsUpdateTimer: number | null = null;

  // 延迟警告状态标记
  let latencyWarningShown = {
    high: false,
    veryHigh: false,
    packetLoss: false
  };

  // 音量控制 
  const speakerVolume = ref(100);
  const microphoneVolume = ref(100);
  const autoAdjustMic = ref(true);
  const audioNoiseReduction = ref(true);

  let audioContext: AudioContext | null = null;
  let gainNodeMap = new Map<string, GainNode>();
  let remoteAudioElement: HTMLAudioElement | null = null;

  // 设备管理
  const audioInputDevices = ref<MediaDeviceInfo[]>([]);
  const audioOutputDevices = ref<MediaDeviceInfo[]>([]);
  const videoInputDevices = ref<MediaDeviceInfo[]>([]);

  const selectedAudioInputId = ref<string>("");
  const selectedAudioOutputId = ref<string>("");
  const selectedVideoInputId = ref<string>("");

  // 设备标签
  const selectedAudioInputLabel = computed(() => {
    const device = audioInputDevices.value.find(d => d.deviceId === selectedAudioInputId.value);
    return device?.label || "系统默认";
  });

  const selectedAudioOutputLabel = computed(() => {
    const device = audioOutputDevices.value.find(d => d.deviceId === selectedAudioOutputId.value);
    return device?.label || "系统默认";
  });

  const selectedVideoInputLabel = computed(() => {
    const device = videoInputDevices.value.find(d => d.deviceId === selectedVideoInputId.value);
    return device?.label || "系统默认";
  });

  // 通话消息回调
  let getContacts: (() => Contact[]) | null = null;
  const registerContacts = (contactsGetter: () => Contact[]) => {
    getContacts = contactsGetter;
  };

  // WebRTC管理器实例和计时器
  let callManager: WebRTCCallManager | null = null;
  let timer: number | null = null;
  let callTimeoutTimer: number | null = null;
  const CALL_TIMEOUT_MS = 60000;

  let callRecordInserted = false;

  // ==========================================
  // 音频处理器初始化
  // ==========================================

  const initAudioProcessor = (stream: MediaStream) => {
    try {
      if (audioProcessor.value) {
        audioProcessor.value.destroy();
        audioProcessor.value = null;
      }

      audioProcessor.value = new AudioProcessingService();
      audioProcessor.value.initialize(stream, {
        autoAdjust: autoAdjustMic.value,
        noiseReduction: audioNoiseReduction.value,
        targetVolume: 60,
      });

      // 监听音量变化（可用于UI显示）
      audioProcessor.value.onVolumeChange((volume) => {
        // 可以在这里更新音量指示器
      });

    } catch (e) {
      // 音频处理器初始化失败不影响通话
      console.warn('音频处理器初始化失败:', e);
    }
  };

  // ==========================================
  // 音量控制方法
  // ==========================================

  const initAudioContext = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => { });
    }
    return audioContext;
  };

  const setSpeakerVolume = (volume: number) => {
    speakerVolume.value = Math.max(0, Math.min(100, volume));
    const volumeRatio = speakerVolume.value / 100;

    if (remoteAudioElement) {
      remoteAudioElement.volume = volumeRatio;
    } else {
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(el => {
        if (el.srcObject === remoteStream.value) {
          remoteAudioElement = el;
          el.volume = volumeRatio;
        }
      });
    }

    if (remoteStream.value) {
      try {
        const audioTracks = remoteStream.value.getAudioTracks();
        audioTracks.forEach(track => {
          const trackId = `remote_${track.id}`;

          if (gainNodeMap.has(trackId)) {
            const gainNode = gainNodeMap.get(trackId)!;
            gainNode.gain.value = volumeRatio;
          } else {
            const context = initAudioContext();
            if (context) {
              const source = context.createMediaStreamSource(new MediaStream([track]));
              const gain = context.createGain();
              gain.gain.value = volumeRatio;

              source.connect(gain);
              gain.connect(context.destination);

              gainNodeMap.set(trackId, gain);
            }
          }
        });
      } catch (e) {
        // 静默处理
      }
    }
  };

  const setMicrophoneVolume = (volume: number) => {
    microphoneVolume.value = Math.max(0, Math.min(100, volume));
    const volumeRatio = microphoneVolume.value / 100;

    if (localStream.value) {
      const audioTracks = localStream.value.getAudioTracks();
      audioTracks.forEach(track => {
        try {
          const constraints = track.getConstraints() as any;
          track.applyConstraints({
            ...constraints,
            volume: volumeRatio,
          }).catch(() => {
            applyGainToAudioTrack(track, volumeRatio);
          });
        } catch (e) {
          applyGainToAudioTrack(track, volumeRatio);
        }
      });
    }
  };

  const applyGainToAudioTrack = (track: MediaStreamTrack, volume: number) => {
    try {
      const trackId = `local_${track.id}`;
      const context = initAudioContext();
      if (!context) return;

      if (gainNodeMap.has(trackId)) {
        const oldGain = gainNodeMap.get(trackId)!;
        oldGain.disconnect();
        gainNodeMap.delete(trackId);
      }

      const source = context.createMediaStreamSource(new MediaStream([track]));
      const gain = context.createGain();
      gain.gain.value = volume;

      source.connect(gain);
      gain.connect(context.destination);

      gainNodeMap.set(trackId, gain);
    } catch (e) {
      // 静默处理
    }
  };

  // ==========================================
  // 音频降噪和自动调整
  // ==========================================

  const setAudioNoiseReduction = async (enabled: boolean) => {
    audioNoiseReduction.value = enabled;

    // 更新音频处理器
    if (audioProcessor.value) {
      await audioProcessor.value.setNoiseReduction(enabled);
    }

    // 重新应用音频约束
    if (localStream.value) {
      const audioTracks = localStream.value.getAudioTracks();
      audioTracks.forEach(track => {
        try {
          track.applyConstraints({
            noiseSuppression: enabled,
            echoCancellation: true,
            autoGainControl: autoAdjustMic.value,
          }).catch(() => { });
        } catch (e) {
          // 忽略
        }
      });
    }
  };

  const setAutoAdjustMic = (enabled: boolean) => {
    autoAdjustMic.value = enabled;

    // 更新音频处理器
    if (audioProcessor.value) {
      audioProcessor.value.setAutoAdjust(enabled);
    }

    // 重新应用音频约束
    if (localStream.value) {
      const audioTracks = localStream.value.getAudioTracks();
      audioTracks.forEach(track => {
        try {
          track.applyConstraints({
            autoGainControl: enabled,
            noiseSuppression: audioNoiseReduction.value,
            echoCancellation: true,
          }).catch(() => { });
        } catch (e) {
          // 忽略
        }
      });
    }

    if (enabled) {
      message.success('已开启麦克风自动调整');
    } else {
      message.info('已关闭麦克风自动调整');
    }
  };

  // ==========================================
  // 音频资源清理
  // ==========================================

  const cleanupAudioResources = () => {
    // 清理音频处理器
    if (audioProcessor.value) {
      audioProcessor.value.destroy();
      audioProcessor.value = null;
    }

    // 清理 GainNode
    gainNodeMap.forEach((gain) => {
      try {
        gain.disconnect();
      } catch (e) {
        // 忽略
      }
    });
    gainNodeMap.clear();

    // 关闭 AudioContext
    if (audioContext && audioContext.state !== 'closed') {
      try {
        audioContext.close();
      } catch (e) {
        // 忽略
      }
    }
    audioContext = null;
    remoteAudioElement = null;

    // 重置音量状态
    speakerVolume.value = 100;
    microphoneVolume.value = 100;
  };

  // ==========================================
  // 通话类型切换
  // ==========================================

  const switchCallType = async (newType: "video" | "audio") => {
    if (!isInCall.value) {
      message.warning("通话未接通，无法切换");
      return;
    }

    if (callType.value === newType) {
      message.info(`当前已是${newType === "video" ? "视频" : "语音"}通话`);
      return;
    }

    try {
      const currentAudioTrack = localStream.value?.getAudioTracks()[0];
      if (!currentAudioTrack) {
        message.error("未检测到音频流");
        return;
      }

      if (newType === "video") {
        const videoConstraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 24, max: 30 },
            facingMode: "user",
          },
        };

        try {
          const videoStream = await navigator.mediaDevices.getUserMedia(videoConstraints);
          const videoTrack = videoStream.getVideoTracks()[0];

          if (videoTrack) {
            localStream.value?.addTrack(videoTrack);

            if (callManager) {
              callManager.replaceVideoTrack(videoTrack);
            }

            callType.value = "video";
            isCameraEnabled.value = true;
            message.success("已切换到视频通话");
          }
        } catch (error: any) {
          message.error("无法打开摄像头: " + (error.message || "未知错误"));
          throw error;
        }
      } else {
        const videoTracks = localStream.value?.getVideoTracks() || [];
        videoTracks.forEach((track) => {
          localStream.value?.removeTrack(track);
          track.stop();
        });

        if (callManager) {
          callManager.replaceVideoTrack(null);
        }

        callType.value = "audio";
        isCameraEnabled.value = false;
        message.success("已切换到语音通话");
      }

      const signaling = getSignalingService();
      if (signaling.isConnected) {
        const fromId = receiverId.value || localStorage.getItem("userId") || "";
        const toId = callerId.value === fromId ? receiverId.value : callerId.value;

        if (fromId && toId) {
          signaling.send({
            type: "call_type_switch" as any,
            from: String(fromId),
            to: String(toId),
            data: {
              newType: newType,
              timestamp: Date.now()
            }
          });
        }
      }

    } catch (error: any) {
      message.error("切换通话类型失败: " + (error.message || "未知错误"));
    }
  };

  const handleRemoteSwitchType = (newType: "video" | "audio") => {
    if (!isInCall.value) {
      console.warn("通话未接通，忽略切换请求");
      return;
    }

    if (callType.value === newType) {
      return;
    }

    callType.value = newType;

    if (newType === "video") {
      isCameraEnabled.value = true;
    } else {
      isCameraEnabled.value = false;
    }

    message.info(`对方已切换到${newType === "video" ? "视频" : "语音"}通话`);
  };

  // ==========================================
  // 私有辅助方法 - 资源清理
  // ==========================================

  const cleanupMediaStreams = () => {
    if (localStream.value) {
      localStream.value.getTracks().forEach((track) => track.stop());
      localStream.value = null;
    }
    if (remoteStream.value) {
      remoteStream.value.getTracks().forEach((track) => track.stop());
      remoteStream.value = null;
    }
    if (audioProcessor.value) {
      audioProcessor.value.destroy();
      audioProcessor.value = null;
    }
    cleanupAudioResources();
  };

  const cleanupTimer = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const cleanupCallTimeout = () => {
    if (callTimeoutTimer) {
      clearTimeout(callTimeoutTimer);
      callTimeoutTimer = null;
    }
  };

  const cleanupStatsMonitor = () => {
    if (statsUpdateTimer) {
      clearInterval(statsUpdateTimer);
      statsUpdateTimer = null;
    }
    latencyHistory.length = 0;
    currentLatency.value = 0;
    maxLatency.value = 0;
    avgLatency.value = 0;
    latencyWarningShown = {
      high: false,
      veryHigh: false,
      packetLoss: false
    };
  };

  const cleanupCallManager = () => {
    if (callManager) {
      callManager.destroy();
      callManager = null;
    }
  };

  const resetCallState = () => {
    isCalling.value = false;
    isInCall.value = false;
    callType.value = null;
    webRtcStatus.value = CallStatus.ENDED;
    callerId.value = null;
    receiverId.value = null;
    callerAvatar.value = null;
    receiverAvatar.value = null;
    receiverName.value = null;
    callStartTime.value = null;
    callDuration.value = 0;

    isMicrophoneEnabled.value = DEFAULT_DEVICE_STATE.MICROPHONE;
    isCameraEnabled.value = DEFAULT_DEVICE_STATE.CAMERA;
    isSpeakerEnabled.value = DEFAULT_DEVICE_STATE.SPEAKER;

    cleanupStatsMonitor();
    callRecordInserted = false;
  };

  const performFullCleanup = () => {
    if (!callRecordInserted && (isCalling.value || isInCall.value) && callType.value) {
      const duration = callDuration.value;
      const recordStatus = isInCall.value
        ? "ended"
        : isCalling.value
          ? "cancelled"
          : "ended";
      insertCallRecord(recordStatus, recordStatus === "ended" ? duration : 0);
    }
    cleanupTimer();
    cleanupCallTimeout();
    cleanupStatsMonitor();
    cleanupMediaStreams();
    cleanupCallManager();
    resetCallState();
  };

  const startCallTimer = () => {
    cleanupTimer();
    callStartTime.value = Date.now();
    timer = window.setInterval(() => {
      if (callStartTime.value) {
        callDuration.value = Math.floor(
          (Date.now() - callStartTime.value) / 1000,
        );
      }
    }, 1000);
  };

  const handleCallConnected = () => {
    if (isInCall.value) {
      if (!callStartTime.value) {
        startCallTimer();
        startLatencyMonitoring();
      }
      return;
    }
    isCalling.value = false;
    isInCall.value = true;
    startCallTimer();
    startLatencyMonitoring();

    // 连接真正建立后，被叫方通知主叫方已接听
    if (callerId.value) {
      const signaling = getSignalingService();
      if (signaling.isConnected) {
        const fromId = receiverId.value || localStorage.getItem("userId") || "";
        signaling.send({
          type: "call_answered" as any,
          from: String(fromId),
          to: String(callerId.value),
          data: {
            status: "answered",
            timestamp: Date.now(),
          },
        });
      }
    }
  };

  // ==========================================
  // 延迟监控
  // ==========================================

  const startLatencyMonitoring = () => {
    cleanupStatsMonitor();

    latencyWarningShown = {
      high: false,
      veryHigh: false,
      packetLoss: false
    };

    statsUpdateTimer = window.setInterval(async () => {
      if (!callManager) return;

      try {
        const stats = await callManager.getStats();
        if (!stats) return;

        const totalLatency = stats.rtt + stats.jitter / 2;
        currentLatency.value = Math.round(totalLatency);

        latencyHistory.push(totalLatency);
        if (latencyHistory.length > MAX_LATENCY_HISTORY) {
          latencyHistory.shift();
        }

        if (latencyHistory.length > 0) {
          const sum = latencyHistory.reduce((a, b) => a + b, 0);
          avgLatency.value = Math.round(sum / latencyHistory.length);
        }

        if (totalLatency > maxLatency.value) {
          maxLatency.value = Math.round(totalLatency);
        }

        if (totalLatency > 500 && !latencyWarningShown.veryHigh) {
          latencyWarningShown.veryHigh = true;
          message.warning("网络延迟极高，通话可能卡顿，请检查网络", 3);
          if (callType.value === "video") {
            handleHighLatency();
          }
        } else if (totalLatency > 300 && !latencyWarningShown.high) {
          latencyWarningShown.high = true;
          message.warning("网络延迟较高，已自动优化通话质量", 3);
          if (callType.value === "video") {
            handleHighLatency();
          }
        }

        if (stats.packetsReceived > 0) {
          const lossRate = stats.packetsLost / (stats.packetsLost + stats.packetsReceived);
          if (lossRate > 0.08 && !latencyWarningShown.packetLoss) {
            latencyWarningShown.packetLoss = true;
            message.warning("网络丢包严重，通话质量可能受影响", 3);
            if (callType.value === "video") {
              handlePacketLoss();
            }
          }
        }
      } catch (error) {
        // 静默处理
      }
    }, 2000);
  };

  const handleHighLatency = () => {
    const quality = latencyStats.value.quality as "excellent" | "good" | "fair" | "poor";

    if (localStream.value) {
      const videoTracks = localStream.value.getVideoTracks();
      videoTracks.forEach((track) => {
        try {
          const qualityPresets: Record<string, { width: number; height: number; frameRate: number }> = {
            excellent: { width: 1280, height: 720, frameRate: 30 },
            good: { width: 640, height: 480, frameRate: 24 },
            fair: { width: 480, height: 360, frameRate: 20 },
            poor: { width: 320, height: 240, frameRate: 15 },
          };
          const preset = qualityPresets[quality] || qualityPresets.good;
          track.applyConstraints({
            width: { ideal: preset.width, max: preset.width },
            height: { ideal: preset.height, max: preset.height },
            frameRate: { ideal: preset.frameRate, max: preset.frameRate },
          }).catch(() => { });
        } catch (e) { /* 忽略 */ }
      });
    }
  };

  const handlePacketLoss = () => {
    if (localStream.value) {
      const videoTracks = localStream.value.getVideoTracks();
      videoTracks.forEach((track) => {
        try {
          track.applyConstraints({
            frameRate: { ideal: 15, max: 20 },
          }).catch(() => { });
        } catch (e) {
          // 忽略
        }
      });
    }
  };

  // ==========================================
  // 设备权限相关
  // ==========================================

  const getErrorMessage = (
    error: any,
    constraints: MediaStreamConstraints,
  ): string => {
    const errorMap: Record<string, string> = {
      NotAllowedError: "请允许访问媒体设备权限",
      PermissionDeniedError: "请允许访问媒体设备权限",
      NotFoundError: "未找到媒体设备",
      DevicesNotFoundError: "未找到媒体设备",
      NotReadableError: "设备被其他应用占用",
      OverconstrainedError: "设备约束条件无法满足",
    };

    if (error.name in errorMap) {
      return errorMap[error.name];
    }
    return error.message || "获取设备权限失败";
  };

  const checkDevicePermissions = async (
    constraints: MediaStreamConstraints,
  ): Promise<boolean> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasAudioInput = devices.some(
        (device) => device.kind === "audioinput",
      );
      const hasVideoInput = devices.some(
        (device) => device.kind === "videoinput",
      );

      if (constraints.audio && !hasAudioInput) {
        message.error("未检测到麦克风设备");
        return false;
      }
      if (constraints.video && !hasVideoInput) {
        message.error("未检测到摄像头设备");
        return false;
      }

      return true;
    } catch (error: any) {
      message.error("设备检测失败: " + (error.message || "未知错误"));
      return false;
    }
  };

  const getMediaStream = async (
    constraints: MediaStreamConstraints,
  ): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // 初始化音频处理器
      if (constraints.audio) {
        try {
          initAudioProcessor(stream);
        } catch (e) {
          // 音频处理器初始化失败不影响通话
          console.warn('音频处理器初始化失败:', e);
        }
      }

      return stream;
    } catch (error: any) {
      const isDeviceBusy =
        error.name === "NotReadableError" ||
        error.message?.includes("Could not start video source");

      if (isDeviceBusy && constraints.video) {
        if (localStream.value) {
          localStream.value.getTracks().forEach((t) => t.stop());
          localStream.value = null;
        }
        if (remoteStream.value) {
          remoteStream.value.getTracks().forEach((t) => t.stop());
          remoteStream.value = null;
        }

        await new Promise((r) => setTimeout(r, 300));

        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (constraints.audio) {
            try {
              initAudioProcessor(stream);
            } catch (e) {
              // 忽略
            }
          }
          return stream;
        } catch (retryError: any) {
          await new Promise((r) => setTimeout(r, 500));
          try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (constraints.audio) {
              try {
                initAudioProcessor(stream);
              } catch (e) {
                // 忽略
              }
            }
            return stream;
          } catch (finalError: any) {
            message.error("摄像头被占用，请关闭其他使用摄像头的程序后重试");
            return null;
          }
        }
      }

      const errorMsg = getErrorMessage(error, constraints);
      message.error(errorMsg);

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        message.info("请在浏览器设置中允许访问摄像头和麦克风");
      }
      return null;
    }
  };

  // ==========================================
  // 核心通话方法
  // ==========================================

  const initializeCall = async (type: "video" | "audio") => {
    const isVideoEnabled = type === "video";
    const constraints = getAdaptiveVideoConstraints(type, isVideoEnabled);

    const hasPermission = await checkDevicePermissions(constraints);
    if (!hasPermission) {
      performFullCleanup();
      return null;
    }

    const stream = await getMediaStream(constraints);
    if (!stream) {
      performFullCleanup();
      return null;
    }

    return stream;
  };

  const createCallManager = (
    userId: string,
    contactId: string,
    type: "video" | "audio",
    stream: MediaStream,
    callerName?: string,
    callerAvatarUrl?: string,
  ): WebRTCCallManager => {
    const options: CallManagerOptions = {
      userId,
      contactId,
      callType: type,
      rtcConfig: RTC_CONFIG as any,
      callerName: callerName || userId,
      callerAvatar: callerAvatarUrl || "",
      onStatusChange: (status) => {
        webRtcStatus.value = status;
        if (status === CallStatus.CONNECTED) {
          handleCallConnected();
        } else if (status === CallStatus.ENDED) {
          if (!callRecordInserted && (isCalling.value || isInCall.value)) {
            const duration = callDuration.value;
            const recordStatus = isInCall.value
              ? "ended"
              : isCalling.value
                ? "cancelled"
                : "ended";
            insertCallRecord(recordStatus, recordStatus === "ended" ? duration : 0);
          }
          resetCallState();
        }
      },
      onRemoteStream: (stream) => {
        remoteStream.value = stream;
        if (speakerVolume.value !== 100) {
          setSpeakerVolume(speakerVolume.value);
        }
      },
      onError: (error) => {
        message.error(error.message);
        performFullCleanup();
      },
    };

    const manager = new WebRTCCallManager(options);
    manager.createLocalStream(stream);
    return manager;
  };

  const startCall = async (
    type: "video" | "audio",
    caller: string,
    receiver: string,
    callerAvatarUrl: string,
    receiverAvatarUrl: string,
    receiverDisplayName: string,
  ) => {
    try {
      performFullCleanup();

      callType.value = type;
      callerId.value = caller;
      receiverId.value = receiver;
      callerAvatar.value = callerAvatarUrl;
      receiverAvatar.value = receiverAvatarUrl;
      receiverName.value = receiverDisplayName;
      isCalling.value = true;
      webRtcStatus.value = CallStatus.RINGING;

      const userStore = useUserStore();
      const callerDisplayName = userStore.user?.nickname || userStore.user?.username || caller;

      const stream = await initializeCall(type);
      if (!stream) {
        performFullCleanup();
        return;
      }

      localStream.value = stream;
      callManager = createCallManager(
        caller,
        receiver,
        type,
        stream,
        callerDisplayName,
        callerAvatarUrl
      );

      const offerSdp = await callManager.createOffer();

      const signaling = getSignalingService();
      if (signaling.isConnected) {
        signaling.sendRaw("call_invite", {
          callerId: caller,
          receiverId: receiver,
          callType: type,
          callerName: callerDisplayName,
          callerAvatar: callerAvatarUrl,
          offer: offerSdp,
        });
      }

      cleanupCallTimeout();
      callTimeoutTimer = window.setTimeout(() => {
        if (webRtcStatus.value !== CallStatus.CONNECTED && isCalling.value) {
          message.warning("对方手机或其他设备可能不在身边，请稍后再试", 3);
          insertCallRecord("missed");
          if (callManager) {
            callManager.endCall();
          }
          performFullCleanup();
        }
      }, CALL_TIMEOUT_MS);
    } catch (error: any) {
      message.error(error.message || "发起通话失败，请稍后重试");
      performFullCleanup();
    }
  };

  const receiveCall = async (
    sdp: any,
    caller: string,
    callerAvatarUrl: string,
    callerDisplayName: string,
    type: "video" | "audio",
  ) => {
    try {
      cleanupTimer();
      cleanupCallTimeout();
      cleanupStatsMonitor();
      cleanupMediaStreams();
      cleanupCallManager();

      const userStore = useUserStore();
      const userIdFromStore = userStore.user?.id;
      const userIdFromStorage = localStorage.getItem("userId");
      const currentUserId = String(userIdFromStore || userIdFromStorage || "");

      callType.value = type;
      callerId.value = caller;
      receiverId.value = currentUserId || null;
      callerAvatar.value = callerAvatarUrl;
      receiverAvatar.value = callerAvatarUrl;
      receiverName.value = callerDisplayName;
      isCalling.value = false;
      isInCall.value = false;
      webRtcStatus.value = CallStatus.RINGING;

      const stream = await initializeCall(type);
      if (!stream) {
        performFullCleanup();
        return;
      }

      localStream.value = stream;

      callManager = createCallManager(
        currentUserId,
        caller,
        type,
        stream
      );

      callManager.receiveCall(sdp);

      // 不在此处强制设置 CONNECTED，等待 WebRTC 连接真正建立后由
      // createCallManager 的 onStatusChange 回调触发 handleCallConnected，
      // 并在 handleCallConnected 中统一发送 call_answered 信令。
      isCalling.value = true;
    } catch (error: any) {
      message.error(error.message || "接收通话失败，请稍后重试");
      performFullCleanup();
    }
  };

  const answerCall = () => {
    cleanupCallTimeout();

    if (callManager) {
      isCalling.value = false;
      isInCall.value = true;
      webRtcStatus.value = CallStatus.CONNECTED;
      startCallTimer();
      startLatencyMonitoring();

      const signaling = getSignalingService();
      if (signaling.isConnected && callerId.value) {
        signaling.send({
          type: "call_answered" as any,
          from: receiverId.value || localStorage.getItem("userId") || "",
          to: callerId.value,
          data: {
            status: "answered",
            timestamp: Date.now()
          }
        });
        console.log("已发送接听确认信令到:", callerId.value);
      }
    }
  };

  const declineCall = () => {
    insertCallRecord("rejected");

    if (callManager) {
      callManager.endCall();
    } else {
      const signaling = getSignalingService();
      if (signaling.isConnected && callerId.value) {
        const fromId = receiverId.value || localStorage.getItem("userId") || "";
        signaling.send({
          type: "end_call" as any,
          from: String(fromId),
          to: String(callerId.value),
          data: { reason: "declined" },
        });
        console.log("已发送拒绝信令到:", callerId.value);
      }
    }

    resetCallState();
    cleanupTimer();
    cleanupCallTimeout();
    cleanupMediaStreams();
    cleanupCallManager();
  };

  const endCall = (skipCallRecord: boolean = false) => {
    if (skipCallRecord) {
      callRecordInserted = true;
    }

    if (!skipCallRecord) {
      const duration = callDuration.value;
      insertCallRecord(duration > 0 ? "ended" : "cancelled", duration);
    }

    if (callManager) {
      callManager.endCall();
    } else {
      const signaling = getSignalingService();
      if (signaling.isConnected) {
        const fromId = receiverId.value || callerId.value || localStorage.getItem("userId") || "";
        const toId = callerId.value === fromId ? receiverId.value : callerId.value;
        if (fromId && toId) {
          signaling.send({
            type: "end_call" as any,
            from: String(fromId),
            to: String(toId),
            data: { reason: "hangup" },
          });
        }
      }
    }

    cleanupMediaStreams();
    cleanupCallManager();
    resetCallState();
    cleanupTimer();
    cleanupCallTimeout();
    cleanupStatsMonitor();
  };

  const insertCallRecord = (
    status: "missed" | "cancelled" | "ended" | "rejected",
    duration: number = 0,
  ) => {
    callRecordInserted = true;

    const contacts = getContacts?.();
    if (!contacts || !callType.value) return;

    const currentUserId = localStorage.getItem("userId") || "";
    const contactId = receiverId.value || callerId.value || "";
    const userStore = useUserStore();
    const user = userStore.user || (userStore as any).userInfo || {};

    const myCallMessage = createCallMessage(
      currentUserId,
      contactId,
      callType.value,
      status,
      duration,
      true,
      {
        nickname: user.nickname,
        username: user.username,
        avatar: user.avatar,
        id: currentUserId,
      },
    );

    insertCallMessageToContact(contacts, contactId, myCallMessage);
    sendCallRecordToServer(contactId, callType.value, status, duration);
  };

  // ==========================================
  // 设备控制方法
  // ==========================================

  const toggleMicrophone = async () => {
    if (!localStream.value) {
      return;
    }

    const newState = !isMicrophoneEnabled.value;
    isMicrophoneEnabled.value = newState;

    localStream.value.getAudioTracks().forEach((track) => {
      track.enabled = newState;
    });

    if (callManager) {
      if (!newState) {
        callManager.replaceAudioTrack(null);
      } else {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              sampleRate: 48000,
              sampleSize: 16,
              channelCount: 1,
              noiseSuppression: audioNoiseReduction.value,
              autoGainControl: true,
            },
          });
          const newAudioTrack = newStream.getAudioTracks()[0];
          if (newAudioTrack) {
            newStream.getTracks().forEach((t) => {
              if (t.kind !== "audio") t.stop();
            });
            callManager.replaceAudioTrack(newAudioTrack);
            // 重新初始化音频处理器
            if (localStream.value) {
              try {
                initAudioProcessor(localStream.value);
              } catch (e) {
                // 忽略
              }
            }
          }
        } catch (error: any) {
          isMicrophoneEnabled.value = false;
          localStream.value.getAudioTracks().forEach((track) => {
            track.enabled = false;
          });
          message.error("无法重新打开麦克风: " + (error.message || "未知错误"));
        }
      }
    }
  };

  const toggleCamera = async () => {
    if (!localStream.value) {
      return;
    }

    const newState = !isCameraEnabled.value;
    isCameraEnabled.value = newState;

    localStream.value.getVideoTracks().forEach((track) => {
      track.enabled = newState;
    });

    if (callManager) {
      if (!newState) {
        callManager.replaceVideoTrack(null);
      } else {
        try {
          const quality = latencyStats.value.quality as "excellent" | "good" | "fair" | "poor";
          const qualityPresets: Record<string, { width: number; height: number; frameRate: number }> = {
            excellent: { width: 1280, height: 720, frameRate: 30 },
            good: { width: 640, height: 480, frameRate: 24 },
            fair: { width: 480, height: 360, frameRate: 20 },
            poor: { width: 320, height: 240, frameRate: 15 },
          };
          const preset = qualityPresets[quality] || qualityPresets.good;
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: preset.width, max: preset.width },
              height: { ideal: preset.height, max: preset.height },
              frameRate: { ideal: preset.frameRate, max: preset.frameRate },
              facingMode: "user",
            },
          });
          const newVideoTrack = newStream.getVideoTracks()[0];
          if (newVideoTrack) {
            newStream.getTracks().forEach((t) => {
              if (t.kind !== "video") t.stop();
            });
            callManager.replaceVideoTrack(newVideoTrack);
          }
        } catch (error: any) {
          isCameraEnabled.value = false;
          localStream.value.getVideoTracks().forEach((track) => {
            track.enabled = false;
          });
          message.error("无法重新打开摄像头: " + (error.message || "未知错误"));
        }
      }
    }
  };

  const toggleSpeaker = () => {
    isSpeakerEnabled.value = !isSpeakerEnabled.value;
  };

  // ==========================================
  // 设备管理方法
  // ==========================================

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      audioInputDevices.value = devices.filter(d => d.kind === 'audioinput');
      audioOutputDevices.value = devices.filter(d => d.kind === 'audiooutput');
      videoInputDevices.value = devices.filter(d => d.kind === 'videoinput');

      if (audioInputDevices.value.length > 0 && !selectedAudioInputId.value) {
        selectedAudioInputId.value = audioInputDevices.value[0].deviceId;
      }
      if (audioOutputDevices.value.length > 0 && !selectedAudioOutputId.value) {
        selectedAudioOutputId.value = audioOutputDevices.value[0].deviceId;
      }
      if (videoInputDevices.value.length > 0 && !selectedVideoInputId.value) {
        selectedVideoInputId.value = videoInputDevices.value[0].deviceId;
      }
    } catch (error) {
      console.warn('Failed to enumerate devices:', error);
    }
  };

  const switchAudioInput = async (deviceId: string) => {
    selectedAudioInputId.value = deviceId;
    if (localStream.value) {
      const audioTrack = localStream.value.getAudioTracks()[0];
      if (audioTrack) {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: { exact: deviceId },
              noiseSuppression: audioNoiseReduction.value,
              autoGainControl: true,
            }
          });
          const newTrack = newStream.getAudioTracks()[0];
          if (newTrack) {
            audioTrack.stop();
            localStream.value.removeTrack(audioTrack);
            localStream.value.addTrack(newTrack);
            if (callManager) {
              callManager.replaceAudioTrack(newTrack);
            }
            // 重新初始化音频处理器
            try {
              initAudioProcessor(localStream.value);
            } catch (e) {
              // 忽略
            }
          }
          newStream.getTracks().forEach(t => {
            if (t !== newTrack) t.stop();
          });
          message.success('已切换到: ' + (audioInputDevices.value.find(d => d.deviceId === deviceId)?.label || ''));
        } catch (error) {
          message.error('切换麦克风失败');
        }
      }
    }
  };

  const switchAudioOutput = async (deviceId: string) => {
    selectedAudioOutputId.value = deviceId;
    try {
      if ('setSinkId' in HTMLAudioElement.prototype) {
        const audioElements = document.querySelectorAll('audio');
        for (const el of audioElements) {
          if (el.srcObject) {
            await (el as any).setSinkId(deviceId);
          }
        }
        message.success('已切换到: ' + (audioOutputDevices.value.find(d => d.deviceId === deviceId)?.label || ''));
      } else {
        message.warning('当前浏览器不支持切换音频输出设备');
      }
    } catch (error) {
      console.warn('Failed to set audio output:', error);
      message.error('切换扬声器失败');
    }
  };

  const switchVideoInput = async (deviceId: string) => {
    selectedVideoInputId.value = deviceId;
    if (localStream.value && isCameraEnabled.value) {
      const videoTrack = localStream.value.getVideoTracks()[0];
      if (videoTrack) {
        try {
          const quality = latencyStats.value.quality as "excellent" | "good" | "fair" | "poor";
          const qualityPresets: Record<string, { width: number; height: number; frameRate: number }> = {
            excellent: { width: 1280, height: 720, frameRate: 30 },
            good: { width: 640, height: 480, frameRate: 24 },
            fair: { width: 480, height: 360, frameRate: 20 },
            poor: { width: 320, height: 240, frameRate: 15 },
          };
          const preset = qualityPresets[quality] || qualityPresets.good;
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: deviceId },
              width: { ideal: preset.width, max: preset.width },
              height: { ideal: preset.height, max: preset.height },
              frameRate: { ideal: preset.frameRate, max: preset.frameRate },
            },
          });
          const newTrack = newStream.getVideoTracks()[0];
          if (newTrack) {
            videoTrack.stop();
            localStream.value.removeTrack(videoTrack);
            localStream.value.addTrack(newTrack);
            if (callManager) {
              callManager.replaceVideoTrack(newTrack);
            }
          }
          newStream.getTracks().forEach(t => {
            if (t !== newTrack) t.stop();
          });
          message.success('已切换到: ' + (videoInputDevices.value.find(d => d.deviceId === deviceId)?.label || ''));
        } catch (error) {
          message.error('切换摄像头失败');
        }
      }
    }
  };

  // ==========================================
  // 屏幕共享功能
  // ==========================================

  const isScreenSharing = ref(false);
  const screenStream = ref<MediaStream | null>(null);

  const startScreenShare = async () => {
    if (!callManager) {
      message.error("通话未建立，无法共享屏幕");
      return;
    }
    try {
      const stream = await callManager.startScreenShare();
      screenStream.value = stream;
      isScreenSharing.value = true;

      stream.getVideoTracks()[0].addEventListener("ended", () => {
        stopScreenShare();
      });

      message.success("屏幕共享已开始");
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log('用户取消了屏幕共享');
        return;
      }
      message.error("屏幕共享失败: " + (error.message || "未知错误"));
    }
  };

  const stopScreenShare = async () => {
    if (!callManager) return;
    try {
      await callManager.stopScreenShare();
      screenStream.value = null;
      isScreenSharing.value = false;
      message.info("屏幕共享已停止");
    } catch (error: any) {
      // 静默处理
    }
  };

  // ==========================================
  // 格式化通话时长
  // ==========================================

  const formattedCallDuration = computed(() => {
    const totalSeconds = callDuration.value;

    if (totalSeconds === 0) {
      return "00:00";
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) {
      return `00:${seconds.toString().padStart(2, "0")}`;
    }

    if (minutes < 60) {
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${remainingMinutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  });

  // ==========================================
  // 延迟统计
  // ==========================================

  const latencyStats = computed(() => ({
    current: currentLatency.value,
    average: avgLatency.value,
    max: maxLatency.value,
    quality:
      currentLatency.value < 150
        ? "excellent"
        : currentLatency.value < 300
          ? "good"
          : currentLatency.value < 500
            ? "fair"
            : "poor",
  }));
  return {
    // 通话状态
    isCalling,
    isInCall,
    callType,
    webRtcStatus,
    isMicrophoneEnabled,
    isCameraEnabled,
    isSpeakerEnabled,
    callerId,
    receiverId,
    callerAvatar,
    receiverAvatar,
    receiverName,
    localStream,
    remoteStream,
    callStartTime,
    callDuration,
    formattedCallDuration,
    timer,
    latencyStats,
    currentLatency,

    // 音量控制
    speakerVolume,
    microphoneVolume,
    autoAdjustMic,
    audioNoiseReduction,
    setSpeakerVolume,
    setMicrophoneVolume,
    setAudioNoiseReduction,
    setAutoAdjustMic,

    // 通话类型切换
    switchCallType,
    handleRemoteSwitchType,

    // 设备管理
    audioInputDevices,
    audioOutputDevices,
    videoInputDevices,
    selectedAudioInputId,
    selectedAudioOutputId,
    selectedVideoInputId,
    selectedAudioInputLabel,
    selectedAudioOutputLabel,
    selectedVideoInputLabel,
    enumerateDevices,
    switchAudioInput,
    switchAudioOutput,
    switchVideoInput,

    // 屏幕共享
    isScreenSharing,
    screenStream,
    startScreenShare,
    stopScreenShare,

    // 通话方法
    startCall,
    receiveCall,
    answerCall,
    declineCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
    toggleSpeaker,
    registerContacts,
  };
});