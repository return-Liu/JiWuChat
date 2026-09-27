// webrtcCallManager.ts - 改进版
/**
 * WebRTC 通话管理器 - 基于 Simple-Peer
 * 
 * 完全封装 Simple-Peer，对外不暴露任何 RTCPeerConnection 相关细节
 * 
 * 改进点：
 * 1. 类型安全 - 扩展 Simple-Peer 类型定义
 * 2. 配置外部化 - 从环境变量读取配置
 * 3. 错误处理细化 - 区分不同错误类型
 * 4. 资源管理 - 防止内存泄露
 * 5. 内容过滤 - 防止 XSS 攻击
 */
import SimplePeer from "simple-peer";
import { getSignalingService } from "./signalingService";
import { message } from "ant-design-vue";
import { getTurnServers } from "../constants/call.config";
import type {
  CallManagerOptions,
  CallStats,
  CallStatus,
  SignalingMessage,
  SignalingMessageType,
} from "../types/untilsTypes";

/**
 * 通话状态枚举
 * @enum {string}
 * @property {string} IDLE - 空闲状态，无通话
 * @property {string} RINGING - 振铃中，等待对方接听
 * @property {string} CONNECTING - 连接建立中
 * @property {string} CONNECTED - 已连接，通话中
 * @property {string} ENDED - 通话已结束
 */
export enum CallStatus {
  IDLE = "idle",
  RINGING = "ringing",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ENDED = "ended",
}

/**
 * 信令消息类型枚举
 * @enum {string}
 * @property {string} CALL_OFFER - 主叫方发送的 offer SDP
 * @property {string} CALL_ANSWER - 被叫方发送的 answer SDP
 * @property {string} CALL_ANSWERED - 对方已接听通知
 * @property {string} ICE_CANDIDATE - ICE 候选者
 * @property {string} END_CALL - 结束通话
 */
export enum SignalingMessageType {
  CALL_OFFER = "call_offer",
  CALL_ANSWER = "call_answer",
  CALL_ANSWERED = "call_answered",
  ICE_CANDIDATE = "ice_candidate",
  END_CALL = "end_call",
}

/**
 * 通话管理器配置选项接口
 * @interface CallManagerOptions
 * @property {string} userId - 当前用户ID
 * @property {string} contactId - 通话对象ID
 * @property {("audio"|"video")} callType - 通话类型
 * @property {RTCConfiguration} [rtcConfig] - 可选的RTC配置
 * @property {function(CallStatus): void} onStatusChange - 状态变更回调
 * @property {function(MediaStream): void} onRemoteStream - 远程流接收回调
 * @property {function(Error): void} onError - 错误处理回调
 * @property {string} [callerName] - 主叫方名称
 * @property {string} [callerAvatar] - 主叫方头像
 * @property {function(CallStats): void} [onStatsUpdate] - 统计信息更新回调
 * @property {number} [timeoutDuration] - 自定义超时时间（毫秒）
 */
export interface CallManagerOptions {
  userId: string;
  contactId: string;
  callType: "audio" | "video";
  rtcConfig?: RTCConfiguration;
  onStatusChange: (status: CallStatus) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onError: (error: Error) => void;
  callerName?: string;
  callerAvatar?: string;
  onStatsUpdate?: (stats: CallStats) => void;
  timeoutDuration?: number;
}

/**
 * 通话统计信息接口
 * @interface CallStats
 * @property {number} rtt - 往返时延（毫秒）
 * @property {number} jitter - 抖动（毫秒）
 * @property {number} packetsLost - 丢包数
 * @property {number} packetsReceived - 接收包数
 * @property {number} packetsSent - 发送包数
 * @property {number} timestamp - 时间戳
 */
export interface CallStats {
  rtt: number;
  jitter: number;
  packetsLost: number;
  packetsReceived: number;
  packetsSent: number;
  timestamp: number;
}

/**
 * 扩展 Simple-Peer 类型，添加对 RTCPeerConnection 的访问
 * 用于获取底层连接对象进行高级操作
 */
interface SimplePeerWithPC extends SimplePeer.Instance {
  _pc?: RTCPeerConnection;
}

/**
 * 通话配置接口
 * @interface CallConfig
 * @property {string[]} stunServers - STUN 服务器列表
 * @property {Array<{urls: string, username?: string, credential?: string}>} turnServers - TURN 服务器列表
 * @property {number} iceCandidatePoolSize - ICE候选池大小
 * @property {RTCBundlePolicy} bundlePolicy - 捆绑策略
 * @property {RTCRtcpMuxPolicy} rtcpMuxPolicy - RTCP复用策略
 * @property {RTCPeerConnectionOptions["sdpSemantics"]} sdpSemantics - SDP语义
 * @property {RTCIceTransportPolicy} iceTransportPolicy - ICE传输策略
 * @property {number} maxQueueSize - 最大消息队列大小
 * @property {number} statsInterval - 统计信息更新间隔（毫秒）
 * @property {number} connectionTimeout - 连接超时时间（毫秒）
 */
interface CallConfig {
  stunServers: string[];
  turnServers: Array<{
    urls: string;
    username?: string;
    credential?: string;
  }>;
  iceCandidatePoolSize: number;
  bundlePolicy: RTCBundlePolicy;
  rtcpMuxPolicy: RTCRtcpMuxPolicy;
  sdpSemantics: RTCPeerConnectionOptions["sdpSemantics"];
  iceTransportPolicy: RTCIceTransportPolicy;
  maxQueueSize: number;
  statsInterval: number;
  connectionTimeout: number;
}

/**
 * 从环境变量和本地存储加载配置
 * @returns {CallConfig} 配置对象
 * @description 支持从 .env 文件读取配置，也支持从 localStorage 读取 TURN 服务器配置
 */
const getConfig = (): CallConfig => {
  const env = process.env || {};

  return {
    stunServers: (env.VUE_APP_STUN_SERVERS || "stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302,stun:stun.qq.com:3478")
      .split(",")
      .filter(Boolean)
      .map(url => url.trim()),

    turnServers: getTurnServers(),

    iceCandidatePoolSize: parseInt(env.VUE_APP_ICE_CANDIDATE_POOL_SIZE || "10", 10),
    bundlePolicy: (env.VUE_APP_BUNDLE_POLICY as RTCBundlePolicy) || "max-bundle",
    rtcpMuxPolicy: (env.VUE_APP_RTCP_MUX_POLICY as RTCRtcpMuxPolicy) || "require",
    sdpSemantics: (env.VUE_APP_SDP_SEMANTICS as RTCPeerConnectionOptions["sdpSemantics"]) || "unified-plan",
    iceTransportPolicy: (env.VUE_APP_ICE_TRANSPORT_POLICY as RTCIceTransportPolicy) || "all",
    maxQueueSize: parseInt(env.VUE_APP_MAX_QUEUE_SIZE || "100", 10),
    statsInterval: parseInt(env.VUE_APP_STATS_INTERVAL || "2000", 10),
    connectionTimeout: parseInt(env.VUE_APP_CONNECTION_TIMEOUT || "60000", 10),
  };
};

/**
 * 过滤危险内容，防止 XSS 攻击
 * @param {string} content - 需要过滤的内容
 * @returns {string} 过滤后的安全内容
 * @description 移除 HTML 标签，转义特殊字符
 */
const sanitizeContent = (content: string): string => {
  if (!content) return "";
  // 移除 HTML 标签
  return content
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * 分类错误类型，用于生成友好的错误提示
 * @param {Error} error - 原始错误对象
 * @returns {string} 错误类型字符串
 * @description 根据错误消息内容匹配不同的错误类型
 */
const classifyError = (error: Error): string => {
  const message = error.message?.toLowerCase() || "";

  if (message.includes("permission") || message.includes("denied")) {
    return "PERMISSION_DENIED";
  }
  if (message.includes("not found") || message.includes("notfound")) {
    return "DEVICE_NOT_FOUND";
  }
  if (message.includes("connection failed") || message.includes("failed to connect")) {
    return "CONNECTION_FAILED";
  }
  if (message.includes("negotiation")) {
    return "NEGOTIATION_FAILED";
  }
  if (message.includes("timeout")) {
    return "TIMEOUT";
  }
  if (message.includes("ice failed")) {
    return "ICE_FAILED";
  }
  if (message.includes("not readable") || message.includes("notreadable")) {
    return "DEVICE_BUSY";
  }
  return "UNKNOWN";
};

/**
 * 获取用户友好的错误消息
 * @param {string} errorType - 错误类型
 * @returns {string} 友好的错误提示文本
 */
const getFriendlyErrorMessage = (errorType: string): string => {
  const errorMessages: Record<string, string> = {
    PERMISSION_DENIED: "请允许访问摄像头和麦克风权限",
    DEVICE_NOT_FOUND: "未检测到麦克风或摄像头设备",
    CONNECTION_FAILED: "P2P连接失败，可能是网络限制或防火墙阻止",
    NEGOTIATION_FAILED: "媒体协商失败，请检查设备兼容性",
    TIMEOUT: "连接超时，对方可能不在线",
    ICE_FAILED: "ICE连接失败，请检查网络环境",
    DEVICE_BUSY: "设备被其他应用占用，请关闭后重试",
    UNKNOWN: "通话连接异常，请稍后重试",
  };
  return errorMessages[errorType] || errorMessages.UNKNOWN;
};

/**
 * WebRTC 通话管理器主类
 * @class WebRTCCallManager
 * @description 封装 Simple-Peer，提供完整的通话管理功能
 */
export class WebRTCCallManager {
  private peer: SimplePeerWithPC | null = null;           // Simple-Peer 实例
  private localStream: MediaStream | null = null;         // 本地媒体流
  private screenStream: MediaStream | null = null;        // 屏幕共享流
  private signaling = getSignalingService();              // 信令服务
  private isInitiator = false;                           // 是否为主叫方
  private isSharingScreen = false;                       // 是否正在屏幕共享
  private options: CallManagerOptions;                   // 配置选项
  private statsInterval: number | null = null;           // 统计定时器
  private config: CallConfig;                            // 配置
  private isCleaningUp = false;                          // 是否正在清理
  private messageQueue: any[] = [];                      // 消息队列
  private connectionTimeoutId: ReturnType<typeof setTimeout> | null = null; // 连接超时定时器

  /**
   * 构造函数
   * @param {CallManagerOptions} options - 配置选项
   */
  constructor(options: CallManagerOptions) {
    this.options = options;
    this.config = getConfig();
  }

  /**
   * 获取 ICE 服务器列表
   * @returns {RTCIceServer[]} ICE 服务器数组
   * @description 合并 STUN 和 TURN 服务器配置
   */
  getIceServers(): RTCIceServer[] {
    const servers: RTCIceServer[] = [];

    // 添加 STUN 服务器
    this.config.stunServers.forEach(url => {
      servers.push({ urls: url });
    });

    // 添加 TURN 服务器
    this.config.turnServers.forEach(turn => {
      if (turn.username && turn.credential) {
        servers.push({
          urls: turn.urls,
          username: turn.username,
          credential: turn.credential,
        });
      } else {
        servers.push({ urls: turn.urls });
      }
    });

    return servers;
  }

  /**
   * 获取 RTC 配置对象
   * @returns {RTCConfiguration} RTC 配置
   * @private
   */
  private getRTCConfig(): RTCConfiguration {
    return {
      iceServers: this.getIceServers(),
      iceCandidatePoolSize: this.config.iceCandidatePoolSize,
      bundlePolicy: this.config.bundlePolicy,
      rtcpMuxPolicy: this.config.rtcpMuxPolicy,
      sdpSemantics: this.config.sdpSemantics,
      iceTransportPolicy: this.config.iceTransportPolicy,
    };
  }

  /**
   * 创建本地媒体流
   * @param {MediaStream} stream - 媒体流
   * @returns {Promise<void>}
   * @description 设置本地流，通常从 getUserMedia 获取
   */
  async createLocalStream(stream: MediaStream): Promise<void> {
    this.localStream = stream;
    console.log('本地流已创建，轨道数:', stream.getTracks().length);
  }

  /**
   * 清理媒体流资源
   * @param {MediaStream | null} stream - 需要清理的媒体流
   * @private
   * @description 停止所有音视频轨道
   */
  private cleanupStream(stream: MediaStream | null): void {
    if (!stream) return;
    stream.getTracks().forEach(track => {
      try {
        track.stop();
      } catch (e) {
        // 忽略停止错误
      }
    });
  }

  /**
   * 开始通话（主叫方）
   * @returns {Promise<void>}
   * @throws {Error} 如果正在清理或本地流未初始化
   */
  async startCall(): Promise<void> {
    if (this.isCleaningUp) {
      throw new Error("通话正在清理中，请稍后重试");
    }

    if (!this.localStream) {
      throw new Error("本地流未初始化");
    }

    this.isInitiator = true;
    this.createPeer();
  }

  /**
   * 创建 Offer 并返回 SDP
   * @returns {Promise<any>} SDP Offer 对象
   * @description 先创建 Peer 生成 offer，拿到 SDP 后返回
   * 用于在 call_invite 消息中携带
   */
  async createOffer(): Promise<any> {
    if (this.isCleaningUp) {
      throw new Error("通话正在清理中，请稍后重试");
    }

    if (!this.localStream) {
      throw new Error("本地流未初始化");
    }

    this.isInitiator = true;

    return new Promise((resolve, reject) => {
      try {
        this.peer = new SimplePeer({
          initiator: true,
          stream: this.localStream!,
          trickle: true,
          config: this.getRTCConfig(),
        }) as SimplePeerWithPC;

        const timeoutDuration = this.options.timeoutDuration || this.config.connectionTimeout;
        this.connectionTimeoutId = setTimeout(() => {
          if (this.peer && !this.peer.connected) {
            this.handlePeerError(new Error('连接超时，对方可能不在线'));
          }
        }, timeoutDuration);

        let offerResolved = false;

        this.peer.on("signal", (data: any) => {
          if (!offerResolved && data.type === "offer") {
            offerResolved = true;
            resolve(data);
            return;
          }
          let type = SignalingMessageType.ICE_CANDIDATE;
          if (data.type === "answer") {
            type = SignalingMessageType.CALL_ANSWER;
          }
          this.sendSignalingMessage({ type, signal: data });
        });

        this.peer.on("stream", (s: MediaStream) => {
          this.options.onRemoteStream(s);
        });

        this.peer.on("connect", () => {
          this.options.onStatusChange(CallStatus.CONNECTED);
          this.startStatsMonitoring();
        });

        this.peer.on("close", () => {
          this.stopStatsMonitoring();
          this.options.onStatusChange(CallStatus.ENDED);
        });

        this.peer.on("error", (e: Error) => {
          this.handlePeerError(e);
        });

        this.setupSignalingListener();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 接收通话（被叫方）
   * @param {any} sdp - 对方发送的 SDP Offer
   * @returns {Promise<void>}
   * @description 被叫方收到邀请后调用，传入对方 SDP
   */
  async receiveCall(sdp: any): Promise<void> {
    if (this.isCleaningUp) {
      throw new Error("通话正在清理中，请稍后重试");
    }

    if (!this.localStream) {
      throw new Error("本地流未初始化");
    }

    console.log('被叫方开始接收通话');
    this.isInitiator = false;
    this.createPeer();
    this.peer?.signal(sdp);
  }

  /**
   * 接收 Answer（主叫方）
   * @param {any} sdp - 对方发送的 SDP Answer
   * @returns {Promise<void>}
   * @description 主叫方收到对方的 Answer 后调用
   */
  async receiveAnswer(sdp: any): Promise<void> {
    if (this.isCleaningUp) {
      throw new Error("通话正在清理中，请稍后重试");
    }

    if (!this.localStream) {
      throw new Error("本地流未初始化");
    }

    console.log('主叫方收到 Answer');
    this.isInitiator = true;
    this.createPeer();
    this.peer?.signal(sdp);
  }

  /**
   * 创建 Peer 实例
   * @private
   * @description 创建 Simple-Peer 实例并设置所有事件监听
   */
  private createPeer(): void {
    if (this.isCleaningUp) {
      console.warn('正在清理中，无法创建 Peer');
      return;
    }

    try {
      this.peer = new SimplePeer({
        initiator: this.isInitiator,
        stream: this.localStream!,
        trickle: true,
        config: this.getRTCConfig(),
      }) as SimplePeerWithPC;

      const timeoutDuration = this.options.timeoutDuration || this.config.connectionTimeout;
      this.connectionTimeoutId = setTimeout(() => {
        if (this.peer && !this.peer.connected) {
          this.handlePeerError(new Error('连接超时，对方可能不在线'));
        }
      }, timeoutDuration);

      this.setupPeerEvents();
      this.setupSignalingListener();
    } catch (error) {
      this.handlePeerError(error);
    }
  }

  /**
   * 设置 Peer 事件监听
   * @private
   * @description 监听连接状态、流、信令等事件
   */
  private setupPeerEvents(): void {
    if (!this.peer) return;

    const pc = this.peer._pc;
    if (pc) {
      // 监听 ICE 连接状态变化
      pc.addEventListener('iceconnectionstatechange', () => {
        if (pc.iceConnectionState === 'failed') {
          this.handlePeerError(new Error('ICE 连接失败，请检查网络环境'));
        }
      });

      // 监听连接状态变化
      pc.addEventListener('connectionstatechange', () => {
        if (pc.connectionState === 'connected') {
          if (this.connectionTimeoutId) {
            clearTimeout(this.connectionTimeoutId);
            this.connectionTimeoutId = null;
          }
        } else if (pc.connectionState === 'failed') {
          this.handlePeerError(new Error('WebRTC 连接失败'));
        }
      });
    }

    // SimplePeer 信令事件
    this.peer.on("signal", (data: any) => {
      let type = SignalingMessageType.ICE_CANDIDATE;
      if (data.type === "offer") {
        type = SignalingMessageType.CALL_OFFER;
      } else if (data.type === "answer") {
        type = SignalingMessageType.CALL_ANSWER;
      }

      this.sendSignalingMessage({ type, signal: data });
    });

    // 远程流接收事件
    this.peer.on("stream", (s: MediaStream) => {
      this.options.onRemoteStream(s);
    });

    // 连接建立事件
    this.peer.on("connect", () => {
      this.options.onStatusChange(CallStatus.CONNECTED);
      this.startStatsMonitoring();
    });

    // 连接关闭事件
    this.peer.on("close", () => {
      this.stopStatsMonitoring();
      this.options.onStatusChange(CallStatus.ENDED);
    });

    // 错误事件
    this.peer.on("error", (e: Error) => {
      this.handlePeerError(e);
    });
  }

  /**
   * 处理 Peer 错误
   * @param {any} error - 错误对象
   * @private
   * @description 分类错误并显示友好的提示信息
   */
  private handlePeerError(error: any): void {
    this.stopStatsMonitoring();

    const errorType = classifyError(error);
    const friendlyMessage = getFriendlyErrorMessage(errorType);

    this.cleanupConnection();

    message.error(friendlyMessage);
    this.options.onError(new Error(friendlyMessage));
  }

  /**
   * 设置信令监听器
   * @private
   * @description 监听来自信令服务的消息
   */
  private setupSignalingListener(): void {
    this.signaling.onMessage(async (msg: SignalingMessage) => {
      if (msg.from !== this.options.contactId) {
        return;
      }

      try {
        await this.handleSignalingMessage(msg.data);
      } catch (error) {
        const errorType = classifyError(error instanceof Error ? error : new Error(String(error)));
        const friendlyMessage = getFriendlyErrorMessage(errorType);
        message.error(friendlyMessage);
        this.options.onError(new Error(friendlyMessage));
      }
    });
  }

  /**
   * 处理信令消息
   * @param {any} data - 信令数据
   * @private
   * @description 根据消息类型处理不同的信令
   */
  private async handleSignalingMessage(data: any): Promise<void> {
    if (!this.peer) {
      return;
    }

    if (!data || !data.type) {
      return;
    }

    switch (data.type) {
      case SignalingMessageType.CALL_OFFER:
        if (!this.isInitiator) {
          this.peer.signal(data.signal);
        }
        break;

      case SignalingMessageType.CALL_ANSWER:
        if (this.isInitiator) {
          this.peer.signal(data.signal);
        }
        break;

      case SignalingMessageType.CALL_ANSWERED:
        break;

      case SignalingMessageType.ICE_CANDIDATE:
        try {
          this.peer.signal(data.signal);
        } catch (error) {
          // ICE 候选处理失败，不中断通话
        }
        break;

      case SignalingMessageType.END_CALL:
        await this.endCall();
        break;
    }
  }

  /**
   * 发送信令消息
   * @param {any} message - 消息内容
   * @private
   * @description 对消息进行过滤和封装后发送
   */
  private sendSignalingMessage(message: any): void {
    try {
      const sanitizedData = {
        ...message,
        ...(message.callerName && { callerName: sanitizeContent(message.callerName) }),
      };

      const signalingMessage: SignalingMessage = {
        type: sanitizedData.type,
        from: this.options.userId,
        to: this.options.contactId,
        data: sanitizedData,
      };

      if (message.type === SignalingMessageType.CALL_OFFER) {
        if (this.options.callerName) {
          (signalingMessage as any).callerName = sanitizeContent(this.options.callerName);
        }
        if (this.options.callerAvatar) {
          (signalingMessage as any).callerAvatar = this.options.callerAvatar;
        }
        (signalingMessage as any).callType = this.options.callType;
      }

      if (message.type === SignalingMessageType.CALL_ANSWER) {
        (signalingMessage as any).callType = this.options.callType;
      }

      this.signaling.send(signalingMessage);
      console.log('发送信令:', message.type);
    } catch (error) {
      console.error('发送信令消息失败:', error);
      if (this.messageQueue.length < this.config.maxQueueSize) {
        this.messageQueue.push(message);
      } else {
        console.warn('消息队列已满，丢弃消息');
      }
    }
  }

  /**
   * 开始统计信息监控
   * @private
   * @description 定时获取通话质量统计信息
   */
  private startStatsMonitoring(): void {
    this.stopStatsMonitoring();

    this.statsInterval = window.setInterval(async () => {
      if (!this.peer) return;

      try {
        const stats = await this.getStats();
        if (stats) {
          this.options.onStatsUpdate?.(stats);
        }
      } catch (error) {
        // 静默处理统计错误
      }
    }, this.config.statsInterval);
  }

  /**
   * 停止统计信息监控
   * @private
   */
  private stopStatsMonitoring(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  /**
   * 获取通话统计信息
   * @returns {Promise<CallStats | null>} 统计信息对象
   * @description 从 RTCPeerConnection 获取网络质量数据
   */
  async getStats(): Promise<CallStats | null> {
    if (!this.peer) return null;

    try {
      const pc = this.peer._pc;
      if (!pc) return null;

      const stats = await pc.getStats();

      let rtt = 0;
      let jitter = 0;
      let packetsLost = 0;
      let packetsReceived = 0;
      let packetsSent = 0;

      stats.forEach((report: any) => {
        if (report.type === "candidate-pair" && report.state === "succeeded") {
          if (report.currentRoundTripTime) {
            rtt = Math.max(rtt, report.currentRoundTripTime * 1000);
          }
        }

        if (report.type === "inbound-rtp" && report.kind === "audio") {
          if (report.jitter) {
            jitter = Math.max(jitter, report.jitter * 1000);
          }
          if (report.packetsLost !== undefined) {
            packetsLost += report.packetsLost;
          }
          if (report.packetsReceived !== undefined) {
            packetsReceived += report.packetsReceived;
          }
        }

        if (report.type === "outbound-rtp" && report.kind === "audio") {
          if (report.packetsSent !== undefined) {
            packetsSent += report.packetsSent;
          }
        }
      });

      return {
        rtt: Math.round(rtt),
        jitter: Math.round(jitter),
        packetsLost,
        packetsReceived,
        packetsSent,
        timestamp: Date.now(),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取当前延迟
   * @returns {Promise<number>} 延迟值（毫秒）
   * @description RTT + Jitter/2 的估算值
   */
  async getCurrentLatency(): Promise<number> {
    const stats = await this.getStats();
    if (!stats) return 0;
    return stats.rtt + stats.jitter / 2;
  }

  /**
   * 添加媒体轨道
   * @param {MediaStreamTrack} track - 媒体轨道
   * @returns {Promise<void>}
   * @description 向通话添加新的媒体轨道（如屏幕共享）
   */
  async addTrack(track: MediaStreamTrack): Promise<void> {
    if (!this.peer || !this.localStream) {
      console.warn("通话未建立，无法添加媒体轨道");
      return;
    }

    try {
      this.peer.addTrack(track, this.localStream);
    } catch (error) {
      console.error("添加媒体轨道失败:", error);
    }
  }

  /**
   * 移除媒体轨道
   * @param {MediaStreamTrack} track - 媒体轨道
   * @returns {Promise<void>}
   */
  async removeTrack(track: MediaStreamTrack): Promise<void> {
    if (!this.peer) {
      console.warn("通话未建立，无法移除媒体轨道");
      return;
    }

    try {
      track.enabled = false;
    } catch (error) {
      console.error("移除媒体轨道失败:", error);
    }
  }

  /**
   * 切换音频静音状态
   * @param {boolean} mute - true 为静音，false 为取消静音
   * @returns {Promise<void>}
   */
  async toggleAudio(mute: boolean): Promise<void> {
    if (!this.localStream) {
      throw new Error("本地流不存在");
    }

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !mute;
    } else {
      console.warn("未检测到音频设备");
    }
  }

  /**
   * 切换视频开关状态
   * @param {boolean} off - true 为关闭视频，false 为开启视频
   * @returns {Promise<void>}
   */
  async toggleVideo(off: boolean): Promise<void> {
    if (!this.localStream) {
      throw new Error("本地流不存在");
    }

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !off;
    } else {
      console.warn("未检测到视频设备");
    }
  }

  /**
   * 替换视频轨道
   * @param {MediaStreamTrack | null} newTrack - 新的视频轨道
   * @description 支持切换摄像头或切换到屏幕共享
   */
  replaceVideoTrack(newTrack: MediaStreamTrack | null): void {
    if (!this.peer || !this.localStream) {
      console.warn("通话未建立，无法切换视频");
      return;
    }

    const oldTrack = this.localStream.getVideoTracks()[0];
    if (oldTrack) {
      this.localStream.removeTrack(oldTrack);
      oldTrack.stop();

      try {
        const pc = this.peer._pc;
        const sender = pc?.getSenders?.()?.find(
          (s: RTCRtpSender) => s.track?.kind === "video",
        );
        if (sender && newTrack) {
          sender.replaceTrack(newTrack);
        } else if (sender && !newTrack) {
          sender.replaceTrack(null);
        }
      } catch (e) {
        try {
          if (oldTrack) {
            this.peer?.removeTrack(oldTrack, this.localStream!);
          }
          if (newTrack) {
            this.peer?.addTrack(newTrack, this.localStream!);
          }
        } catch (error) {
          console.error("切换视频失败:", error);
        }
      }
    }

    if (newTrack) {
      this.localStream.addTrack(newTrack);
    }
  }

  /**
   * 替换音频轨道
   * @param {MediaStreamTrack | null} newTrack - 新的音频轨道
   */
  replaceAudioTrack(newTrack: MediaStreamTrack | null): void {
    if (!this.peer || !this.localStream) {
      console.warn("通话未建立，无法切换音频");
      return;
    }

    const oldTrack = this.localStream.getAudioTracks()[0];
    if (oldTrack) {
      this.localStream.removeTrack(oldTrack);
      oldTrack.stop();

      try {
        const pc = this.peer._pc;
        const sender = pc?.getSenders?.()?.find(
          (s: RTCRtpSender) => s.track?.kind === "audio",
        );
        if (sender && newTrack) {
          sender.replaceTrack(newTrack);
        } else if (sender && !newTrack) {
          sender.replaceTrack(null);
        }
      } catch (e) {
        try {
          if (oldTrack) {
            this.peer?.removeTrack(oldTrack, this.localStream!);
          }
          if (newTrack) {
            this.peer?.addTrack(newTrack, this.localStream!);
          }
        } catch (error) {
          console.error("切换音频失败:", error);
        }
      }
    }

    if (newTrack) {
      this.localStream.addTrack(newTrack);
    }
  }

  /**
   * 获取本地媒体流
   * @returns {MediaStream | null} 本地流对象
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * 开始屏幕共享
   * @returns {Promise<MediaStream>} 屏幕共享流
   * @throws {Error} 如果已在共享中或用户取消选择
   */
  async startScreenShare(): Promise<MediaStream> {
    if (this.isSharingScreen) {
      throw new Error("已在屏幕共享中");
    }

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      this.isSharingScreen = true;

      if (this.peer && this.screenStream) {
        this.screenStream.getTracks().forEach((track) => {
          this.peer?.addTrack(track, this.screenStream!);
        });
      }

      this.screenStream.getVideoTracks()[0]?.addEventListener("ended", () => {
        this.stopScreenShare();
      });

      console.log("屏幕共享已开始");
      return this.screenStream;
    } catch (error: any) {
      if (error.name === "AbortError" || error.message?.includes("abort")) {
        throw error;
      }
      console.error("屏幕共享失败:", error);
      throw new Error(error.message || "屏幕共享失败");
    }
  }

  /**
   * 停止屏幕共享
   * @returns {Promise<void>}
   */
  async stopScreenShare(): Promise<void> {
    if (!this.isSharingScreen || !this.screenStream) {
      return;
    }

    try {
      this.screenStream.getTracks().forEach((track) => {
        track.stop();
        if (this.peer) {
          track.enabled = false;
        }
      });

      this.screenStream = null;
      this.isSharingScreen = false;
      console.log("屏幕共享已停止");
    } catch (error) {
      console.error("停止屏幕共享失败:", error);
    }
  }

  /**
   * 清理连接资源
   * @private
   * @description 释放所有资源，包括媒体流、Peer连接、定时器等
   */
  private cleanupConnection(): void {
    if (this.isCleaningUp) return;
    this.isCleaningUp = true;

    try {
      if (this.connectionTimeoutId) {
        clearTimeout(this.connectionTimeoutId);
        this.connectionTimeoutId = null;
      }

      this.stopStatsMonitoring();

      this.cleanupStream(this.localStream);
      this.localStream = null;

      this.cleanupStream(this.screenStream);
      this.screenStream = null;
      this.isSharingScreen = false;

      if (this.peer) {
        try {
          this.peer.destroy();
        } catch (e) {
          // 忽略销毁错误
        }
        this.peer = null;
      }

      this.messageQueue = [];
      this.options.onStatusChange(CallStatus.ENDED);
    } finally {
      this.isCleaningUp = false;
    }
  }

  /**
   * 结束通话
   * @returns {void}
   * @description 发送结束信令并清理所有资源
   */
  endCall(): void {
    try {
      try {
        this.sendSignalingMessage({
          type: SignalingMessageType.END_CALL,
        });
      } catch (e) {
        // 忽略发送失败
      }

      this.cleanupConnection();
    } catch (error) {
      console.error("结束通话时发生错误:", error);
      this.isCleaningUp = false;
      this.cleanupConnection();
    }
  }

  /**
   * 销毁管理器
   * @returns {void}
   * @description 彻底清理所有资源
   */
  destroy(): void {
    this.stopStatsMonitoring();
    this.endCall();
  }
}

export default WebRTCCallManager;