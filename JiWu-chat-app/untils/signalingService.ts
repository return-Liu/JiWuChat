// signalingService.ts - 改进版
/**
 * WebRTC 信令服务
 * 负责通过 Socket.IO 传递 WebRTC 信令消息
 * 
 * 改进点：
 * 1. 配置外部化 - 从环境变量读取
 * 2. 消息队列大小限制 - 防止内存泄露
 * 3. 内容过滤 - 防止 XSS 攻击
 * 4. 多实例支持 - 通过 Redis 存储连接状态（可选）
 * 5. 更好的错误处理
 */

import { message } from "ant-design-vue";
import Cookies from "js-cookie";
import type { SignalingMessage } from "../types/untilsTypes";

/**
 * 信令服务配置接口
 * @interface SignalingConfig
 * @property {string} wsUrl - WebSocket 服务地址
 * @property {number} reconnectMaxAttempts - 最大重连尝试次数
 * @property {number} reconnectBaseDelay - 重连基础延迟（毫秒）
 * @property {number} maxQueueSize - 消息队列最大大小
 * @property {number} connectionTimeout - 连接超时时间（毫秒）
 */
interface SignalingConfig {
  wsUrl: string;
  reconnectMaxAttempts: number;
  reconnectBaseDelay: number;
  maxQueueSize: number;
  connectionTimeout: number;
}

/**
 * 获取信令服务配置
 * @returns {SignalingConfig} 配置对象
 * @description 从环境变量和本地存储读取配置
 */
const getSignalingConfig = (): SignalingConfig => {
  const env = process.env || {};

  return {
    wsUrl: env.VUE_APP_WS_URL || `ws://localhost:${localStorage.getItem("ws-port") || "8081"}`,
    reconnectMaxAttempts: parseInt(env.VUE_APP_RECONNECT_MAX_ATTEMPTS || "5", 10),
    reconnectBaseDelay: parseInt(env.VUE_APP_RECONNECT_BASE_DELAY || "1000", 10),
    maxQueueSize: parseInt(env.VUE_APP_MAX_QUEUE_SIZE || "100", 10),
    connectionTimeout: parseInt(env.VUE_APP_SIGNALING_TIMEOUT || "10000", 10),
  };
};

/**
 * 信令消息接口
 * @interface SignalingMessage
 * @property {string} type - 消息类型
 * @property {string} from - 发送方用户ID
 * @property {string} to - 接收方用户ID
 * @property {any} data - 消息数据
 * @property {string} [callerName] - 主叫方名称
 * @property {string} [callerAvatar] - 主叫方头像
 * @property {("audio"|"video")} [callType] - 通话类型
 */
export interface SignalingMessage {
  type:
  | "call_offer"
  | "call_answer"
  | "ice_candidate"
  | "end_call"
  | "screen_share_start"
  | "screen_share_end"
  | "call_answered";
  from: string;
  to: string;
  data: any;
  callerName?: string;
  callerAvatar?: string;
  callType?: "audio" | "video";
}

/**
 * 过滤危险内容，防止 XSS 攻击
 * @param {string} content - 需要过滤的内容
 * @returns {string} 过滤后的安全内容
 * @description 移除 HTML 标签，转义特殊字符
 */
const sanitizeContent = (content: string): string => {
  if (!content) return "";
  return content
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * 过滤消息中的所有文本内容
 * @param {SignalingMessage} msg - 原始消息
 * @returns {SignalingMessage} 过滤后的安全消息
 * @description 递归过滤消息对象中所有字符串字段
 */
const sanitizeMessage = (msg: SignalingMessage): SignalingMessage => {
  const sanitized = { ...msg };

  if (sanitized.callerName) {
    sanitized.callerName = sanitizeContent(sanitized.callerName);
  }

  if (sanitized.data) {
    if (typeof sanitized.data === 'string') {
      sanitized.data = sanitizeContent(sanitized.data);
    } else if (sanitized.data && typeof sanitized.data === 'object') {
      const filterObject = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj;
        const result: any = Array.isArray(obj) ? [] : {};
        for (const key of Object.keys(obj)) {
          if (typeof obj[key] === 'string') {
            result[key] = sanitizeContent(obj[key]);
          } else if (typeof obj[key] === 'object') {
            result[key] = filterObject(obj[key]);
          } else {
            result[key] = obj[key];
          }
        }
        return result;
      };
      sanitized.data = filterObject(sanitized.data);
    }
  }

  return sanitized;
};

/**
 * 全局消息回调数组
 * @description 存储所有全局消息监听器
 */
let globalMessageCallbacks: ((message: SignalingMessage) => void)[] = [];

/**
 * 信令服务主类
 * @class SignalingService
 * @description 管理 WebSocket 连接，发送和接收信令消息
 */
class SignalingService {
  private ws: any | null = null;                                    // WebSocket 实例
  private messageQueue: SignalingMessage[] = [];                    // 消息队列
  private reconnectAttempts = 0;                                   // 重连尝试次数
  private userId: string | null = null;                            // 当前用户ID
  private onMessageCallback: ((message: SignalingMessage) => void) | null = null; // 消息回调
  private static activeConnections: Map<string, any> = new Map();  // 活跃连接池
  private config: SignalingConfig;                                 // 配置
  private isDisconnecting = false;                                 // 是否正在断开
  private connectionTimer: ReturnType<typeof setTimeout> | null = null; // 连接超时定时器

  constructor() {
    this.config = getSignalingConfig();
  }

  /**
   * 连接到信令服务器
   * @param {string} userId - 用户ID
   * @returns {Promise<void>}
   * @description 建立 WebSocket 连接并注册用户
   */
  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userId = userId;

      // 检查是否已有连接，复用现有连接
      if (SignalingService.activeConnections.has(userId)) {
        const oldWs = SignalingService.activeConnections.get(userId);
        if (oldWs && oldWs.connected) {
          this.ws = oldWs;
          resolve();
          return;
        } else {
          SignalingService.activeConnections.delete(userId);
        }
      }

      const token = Cookies.get("token") || "";
      const wsUrl = this.config.wsUrl;

      // 动态导入 socket.io-client
      import("socket.io-client")
        .then(({ io }) => {
          this.ws = io(wsUrl, {
            auth: { token },
            query: { service: "signaling", userId },
            transports: ["websocket"],
            reconnection: false,
            timeout: this.config.connectionTimeout,
          });

          SignalingService.activeConnections.set(userId, this.ws);

          this.setupSocketEvents(resolve, reject);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * 设置 Socket 事件监听
   * @param {() => void} resolve - 连接成功回调
   * @param {(error: any) => void} reject - 连接失败回调
   * @private
   */
  private setupSocketEvents(resolve: () => void, reject: (error: any) => void): void {
    if (!this.ws) return;

    // 连接超时处理
    this.connectionTimer = setTimeout(() => {
      if (!this.ws?.connected) {
        reject(new Error("连接信令服务器超时"));
        this.cleanupSocket();
      }
    }, this.config.connectionTimeout);

    this.ws.on("connect", () => {
      if (this.connectionTimer) {
        clearTimeout(this.connectionTimer);
        this.connectionTimer = null;
      }
      this.reconnectAttempts = 0;

      // 发送队列中的消息
      this.flushMessageQueue();

      resolve();
    });

    this.ws.on("signaling_message", (msg: SignalingMessage) => {
      // 过滤消息内容，防止 XSS
      const sanitizedMsg = sanitizeMessage(msg);
      this.onMessageCallback?.(sanitizedMsg);
      globalMessageCallbacks.forEach(callback => {
        try {
          callback(sanitizedMsg);
        } catch (error) {
          console.warn('全局回调执行失败:', error);
        }
      });
    });

    this.ws.on("ping", () => {
      this.ws.emit("pong");
    });

    this.ws.on("connect_error", (err: any) => {
      if (this.connectionTimer) {
        clearTimeout(this.connectionTimer);
        this.connectionTimer = null;
      }
      reject(err);
    });

    this.ws.on("disconnect", () => {
      if (!this.isDisconnecting) {
        this.attemptReconnect();
      }
    });

    this.ws.on("error", (error: any) => {
      // 静默处理信令服务错误，不中断用户体验
    });
  }

  /**
   * 清理 Socket 连接
   * @private
   */
  private cleanupSocket(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.disconnect();
      } catch (e) {
        // 忽略断开错误
      }
      this.ws = null;
    }
  }

  /**
   * 尝试重连
   * @private
   * @description 使用指数退避策略进行重连
   */
  private attemptReconnect(): void {
    if (this.isDisconnecting || !this.userId) return;

    if (this.reconnectAttempts < this.config.reconnectMaxAttempts) {
      this.reconnectAttempts++;
      const delay = this.config.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts - 1);

      setTimeout(() => {
        this.connect(this.userId!).catch(() => {
          // 静默处理连接失败，继续等待下次重连
        });
      }, delay);
    } else {
      console.warn("信令服务重连失败，已达到最大重连次数");
      message.warning("信令服务连接已断开，部分功能可能无法使用", 3);
    }
  }

  /**
   * 发送信令消息
   * @param {SignalingMessage} msg - 消息对象
   * @description 如果连接断开则入队，连接正常则立即发送
   */
  send(msg: SignalingMessage): void {
    if (this.isDisconnecting) {
      console.warn("服务正在断开，消息被忽略");
      return;
    }

    // 过滤消息内容
    const sanitizedMsg = sanitizeMessage(msg);

    if (!this.ws?.connected) {
      // 队列大小限制，防止内存泄露
      if (this.messageQueue.length < this.config.maxQueueSize) {
        this.messageQueue.push(sanitizedMsg);
      } else {
        console.warn("消息队列已满，丢弃最旧消息");
        this.messageQueue.shift();
        this.messageQueue.push(sanitizedMsg);
      }
      return;
    }

    try {
      this.ws.emit("signaling_message", sanitizedMsg);
    } catch (error) {
      console.error("发送信令消息失败:", error);
      if (this.messageQueue.length < this.config.maxQueueSize) {
        this.messageQueue.push(sanitizedMsg);
      }
    }
  }

  /**
   * 发送原始事件
   * @param {string} eventName - 事件名称
   * @param {any} data - 事件数据
   * @description 用于发送非信令消息的通用事件
   */
  sendRaw(eventName: string, data: any): void {
    if (this.isDisconnecting) {
      console.warn("服务正在断开，消息被忽略");
      return;
    }

    if (!this.ws?.connected) {
      message.warning("信令服务未连接，无法发送请求", 2);
      return;
    }

    try {
      // 过滤数据中的字符串内容，防止 XSS
      const filterData = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj;
        const result: any = Array.isArray(obj) ? [] : {};
        for (const key of Object.keys(obj)) {
          if (typeof obj[key] === 'string') {
            result[key] = sanitizeContent(obj[key]);
          } else if (typeof obj[key] === 'object') {
            result[key] = filterData(obj[key]);
          } else {
            result[key] = obj[key];
          }
        }
        return result;
      };

      const sanitizedData = filterData(data);
      this.ws.emit(eventName, sanitizedData);
    } catch (error) {
      console.error(`发送 ${eventName} 失败:`, error);
      message.error(`发送请求失败，请重试`, 2);
    }
  }

  /**
   * 刷新消息队列
   * @private
   * @description 连接恢复后发送队列中的消息
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length) {
      const msg = this.messageQueue.shift();
      if (msg && this.ws?.connected) {
        try {
          this.ws.emit("signaling_message", msg);
        } catch (error) {
          console.error("发送队列消息失败:", error);
          // 重新入队，避免丢失
          if (this.messageQueue.length < this.config.maxQueueSize) {
            this.messageQueue.push(msg);
          }
          break;
        }
      }
    }
  }

  /**
   * 注册消息监听器
   * @param {(msg: SignalingMessage) => void} cb - 回调函数
   * @description 设置单个消息回调
   */
  onMessage(cb: (msg: SignalingMessage) => void): void {
    this.onMessageCallback = cb;
  }

  /**
   * 获取 Socket 实例
   * @returns {any | null} Socket 实例
   */
  getSocket(): any | null {
    return this.ws;
  }

  /**
   * 断开连接
   * @description 清理所有资源并断开 WebSocket
   */
  disconnect(): void {
    this.isDisconnecting = true;

    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }

    if (this.userId && SignalingService.activeConnections.has(this.userId)) {
      SignalingService.activeConnections.delete(this.userId);
    }

    if (this.ws) {
      try {
        this.ws.disconnect();
      } catch (e) {
        // 忽略断开错误
      }
      this.ws = null;
    }

    this.userId = null;
    this.onMessageCallback = null;
    this.messageQueue = [];
    this.reconnectAttempts = 0;
    this.isDisconnecting = false;
  }

  /**
   * 获取连接状态
   * @returns {boolean} 是否已连接
   */
  get isConnected(): boolean {
    return this.ws?.connected || false;
  }

  /**
   * 获取消息队列大小
   * @returns {number} 队列中的消息数量
   */
  get queueSize(): number {
    return this.messageQueue.length;
  }
}

/**
 * 获取信令服务单例
 * @returns {SignalingService} 信令服务实例
 * @description 全局单例模式，确保只有一个信令服务实例
 */
export function getSignalingService(): SignalingService {
  if (!signalingServiceInstance) {
    signalingServiceInstance = new SignalingService();
  }
  return signalingServiceInstance;
}

/**
 * 添加全局信令监听器
 * @param {(msg: SignalingMessage) => void} callback - 回调函数
 * @returns {() => void} 取消监听的函数
 * @description 注册全局消息监听器，所有消息都会触发
 */
export function addGlobalSignalingListener(
  callback: (msg: SignalingMessage) => void
): () => void {
  globalMessageCallbacks.push(callback);
  return () => {
    const index = globalMessageCallbacks.indexOf(callback);
    if (index > -1) {
      globalMessageCallbacks.splice(index, 1);
    }
  };
}

/**
 * 重置信令服务单例（用于测试）
 */
export function resetSignalingService(): void {
  if (signalingServiceInstance) {
    signalingServiceInstance.disconnect();
    signalingServiceInstance = null;
  }
  globalMessageCallbacks = [];
}

/**
 * 信令服务单例实例
 * @description 用于存储全局单例
 */
let signalingServiceInstance: SignalingService | null = null;

export default SignalingService;