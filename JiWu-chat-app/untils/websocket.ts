import { io, Socket } from "socket.io-client";
import { useUserStore } from "../stores/user";
import { message } from "ant-design-vue";

/**
 * WebSocket 服务类
 * 采用单例模式，整个应用只有一个实例
 * @class WebSocketService
 * @description 管理 Socket.IO 连接，提供消息发送、事件监听等功能
 */
class WebSocketService {
  /** Socket.IO 客户端实例 */
  private socket: Socket | null = null;
  /** 当前重连尝试次数 */
  private reconnectAttempts = 0;
  /** 最大重连尝试次数 */
  private maxReconnectAttempts = 5;
  /** 重连延迟基数 (毫秒) */
  private reconnectDelay = 1000;
  /** 事件监听器映射表: 事件名 -> 回调函数数组 */
  private listeners: Map<string, Function[]> = new Map();
  /** 连接超时定时器 */
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  /** 是否手动断开连接 */
  private isManuallyDisconnected = false;

  /**
   * 建立 WebSocket 连接
   * @returns {Promise<boolean>} 连接是否成功
   * @description 使用用户认证 token 建立连接，支持自动重连
   */
  connect() {
    // 如果已经连接，直接返回
    if (this.socket?.connected) {
      return Promise.resolve(true);
    }

    // 获取用户认证信息
    const userStore = useUserStore();

    // 检查用户是否已认证
    if (!userStore.isAuthenticated || !userStore.token) {
      console.warn("用户未认证，无法建立连接");
      return Promise.reject(new Error("用户未认证"));
    }

    // 构建 WebSocket 服务地址
    const HOST_IP = import.meta.env.VITE_WS_HOST || "localhost";
    const wsPort = localStorage.getItem("ws-port") || "8081";
    const wsUrl = `ws://${HOST_IP}:${wsPort}`;

    return new Promise<boolean>((resolve, reject) => {
      try {
        // 重置手动断开标志
        this.isManuallyDisconnected = false;
        const authToken = userStore.token;

        if (!authToken) {
          throw new Error("Token 为空，无法建立连接");
        }

        // 创建 Socket.IO 连接
        this.socket = io(wsUrl, {
          auth: { token: authToken },
          query: { token: authToken },
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          timeout: 10000,
          autoConnect: true,
        });

        // Socket.IO 底层事件 (静默处理)
        this.socket.io.on("open", () => { });
        this.socket.io.on("close", (reason) => { });
        this.socket.io.on("error", (error) => { });

        // 连接超时检测
        this.connectionTimeout = setTimeout(() => {
          if (!this.socket?.connected) {
            this.handleConnectionError(new Error("连接超时"));
            reject(new Error("连接超时"));
          }
        }, 15000);

        // 设置事件监听器
        this.setupEventListeners(resolve, reject);
      } catch (error) {
        this.handleConnectionError(error);
        reject(error);
      }
    });
  }

  /**
   * 设置事件监听器
   * @param {Function} resolve - 连接成功回调
   * @param {Function} reject - 连接失败回调
   * @private
   * @description 注册所有 Socket.IO 事件监听器
   */
  private setupEventListeners(resolve: Function, reject: Function) {
    if (!this.socket) return;

    // 连接成功事件
    this.socket.on("connect", () => {
      this.reconnectAttempts = 0;
      this.clearTimeout();

      // 安全地获取用户信息
      let userId = null;
      try {
        const auth = this.socket?.auth as any;
        if (auth) {
          userId = auth.user?.id || auth.userId || null;
        }
        if (!userId && this.socket?.handshake) {
          const handshake = this.socket.handshake as any;
          userId = handshake.auth?.user?.id || handshake.auth?.userId || null;
        }
      } catch (error) {
        console.warn("获取用户ID失败:", error);
      }

      // 触发连接成功事件
      this.emit("connected", {
        userId: userId,
        socketId: this.socket?.id,
        timestamp: new Date().toISOString(),
      });

      resolve(true);
      this.emit("connection_status", { connected: true });
    });

    // 断开连接事件
    this.socket.on("disconnect", (reason) => {
      this.emit("disconnected", {
        reason,
        timestamp: new Date().toISOString(),
        willReconnect:
          !this.isManuallyDisconnected && reason !== "io client disconnect",
      });

      this.emit("connection_status", { connected: false, reason });
      this.clearTimeout();

      if (!this.isManuallyDisconnected && reason !== "io client disconnect") {
        this.attemptReconnect();
      }
    });

    // 连接错误事件
    this.socket.on("connect_error", (error) => {
      this.reconnectAttempts++;
      this.emit("connection_status", {
        connected: false,
        error: error.message,
      });

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.handleConnectionError(new Error("达到最大重连次数"));
        message.error("WebSocket 连接失败，请检查网络设置");
        reject(new Error("WebSocket 连接失败，请检查网络设置"));
      }
    });

    // 服务器错误事件
    this.socket.on("error", (data) => {
      this.emit("server_error", data);
    });

    // 消息相关事件
    this.socket.on("message_sent", (data) => {
      this.emit("message_sent", data);
    });

    this.socket.on("message_recalled", (data) => {
      this.emit("message_recalled", data);
    });

    this.socket.on("message_deleted", (data) => {
      this.emit("message_deleted", data);
    });

    this.socket.on("messages_deleted", (data) => {
      this.emit("messages_deleted", data);
    });

    this.socket.on("latest_messages_received", (data) => {
      this.emit("latest_messages_received", data);
    });

    this.socket.on("chat_history_received", (data) => {
      this.emit("chat_history_received", data);
    });

    this.socket.on("messages_marked_read", (data) => {
      this.emit("messages_marked_read", data);
    });

    this.socket.on("unread_count_update", (data) => {
      this.emit("unread_count_update", data);
    });

    // 群组相关事件
    this.socket.on("group_member_level_updated", (data) => {
      this.emit("group_member_level_updated", data);
    });

    this.socket.on("group_member_title_updated", (data) => {
      this.emit("group_member_title_updated", data);
    });

    this.socket.on("group_info_updated", (data) => {
      this.emit("group_info_updated", data);
    });

    this.socket.on("group_member_removed", (data) => {
      this.emit("group_member_removed", data);
    });

    this.socket.on("group_application_received", (data) => {
      this.emit("group_application_received", data);
    });

    // 好友相关事件
    this.socket.on("friend_request_sent", (data) => {
      this.emit("friend_request_sent", data);
    });

    this.socket.on("friend_request_accepted", (data) => {
      this.emit("friend_request_accepted", data);
    });

    this.socket.on("friend_request_rejected", (data) => {
      this.emit("friend_request_rejected", data);
    });

    // 其他事件
    this.socket.on("typing_status", (data) => {
      this.emit("typing_status", data);
    });

    this.socket.on("upload_progress", (data) => {
      this.emit("upload_progress", data);
    });

    // 业务事件映射表 - 将服务器事件映射到本地事件
    const eventMappings: Record<string, string> = {
      group_invite: "group_invite",
      receive_private_message: "private_message",
      receive_group_message: "group_message",
      message_sent: "message_sent",
      message_recalled: "message_recalled",
      message_deleted: "message_deleted",
      messages_deleted: "messages_deleted",
      latest_messages_received: "latest_messages_received",
      chat_history_received: "chat_history_received",
      group_member_level_updated: "group_member_level_updated",
      group_member_title_updated: "group_member_title_updated",
      friend_request_sent: "friend_request_sent",
      friend_request_accepted: "friend_request_accepted",
      friend_request_rejected: "friend_request_rejected",
      group_info_updated: "group_info_updated",
      group_member_removed: "group_member_removed",
      typing_status: "typing_status",
      group_application_received: "group_application_received",
      upload_progress: "upload_progress",
      // 群邀请相关事件
      new_group_invitation: "new_group_invitation",
      invitation_accepted: "invitation_accepted",
      invitation_rejected: "invitation_rejected",
      messages_marked_read: "messages_marked_read",
      unread_count_update: "unread_count_update",
      friend_status_changed: "friend_status_changed",
    };

    // 批量注册事件监听器
    Object.entries(eventMappings).forEach(([serverEvent, localEvent]) => {
      this.socket!.on(serverEvent, (data) => {
        this.emit(localEvent, data);
      });
    });

    // 重连相关事件
    this.socket.on("reconnect", (attemptNumber) => {
      this.emit("reconnected", {
        attemptNumber,
        timestamp: new Date().toISOString(),
      });
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      this.emit("reconnect_attempt", { attemptNumber });
    });

    this.socket.on("reconnect_error", (error) => {
      this.emit("reconnect_error", error);
    });

    this.socket.on("reconnect_failed", () => {
      this.emit("reconnect_failed", { timestamp: new Date().toISOString() });
      message.warning("WebSocket 重连失败，请刷新页面重试");
    });
  }

  /**
   * 尝试重连
   * @private
   * @description 使用指数退避策略进行重连
   */
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        if (!this.isManuallyDisconnected) {
          this.connect().catch(() => { });
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  /**
   * 处理连接错误
   * @param {any} error - 错误对象
   * @private
   */
  private handleConnectionError(error: any) {
    this.clearTimeout();
    this.emit("connection_error", error);
  }

  /**
   * 清除超时定时器
   * @private
   */
  private clearTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  /**
   * 通用请求方法 (带超时控制)
   * @template T
   * @param {string} emitEvent - 发送的事件名
   * @param {string} listenEvent - 监听的事件名
   * @param {any} data - 请求数据
   * @param {number} timeout - 超时时间(毫秒)
   * @returns {Promise<T>} 响应数据
   * @private
   * @description 发送请求并等待响应，支持超时控制
   */
  private async requestWithTimeout<T>(
    emitEvent: string,
    listenEvent: string,
    data?: any,
    timeout: number = 15000,
  ): Promise<T> {
    if (!this.socket?.connected) {
      try {
        await this.connect();
      } catch (error) {
        throw new Error("WebSocket 连接失败");
      }
    }

    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error("WebSocket 未连接"));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error(`${emitEvent} 超时`));
        cleanup();
      }, timeout);

      const handler = (response: any) => {
        clearTimeout(timeoutId);
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message || "操作失败"));
        }
        cleanup();
      };

      const errorHandler = (error: any) => {
        clearTimeout(timeoutId);
        reject(error);
        cleanup();
      };

      const cleanup = () => {
        this.off(listenEvent, handler);
        this.off("error", errorHandler);
      };

      this.on(listenEvent, handler);
      this.on("error", errorHandler);
      this.socket.emit(emitEvent, data);
    });
  }

  // ========== 公共 API 方法 ==========

  /**
   * 发送群聊邀请
   * @param {any} data - 邀请数据
   * @returns {Promise<boolean>} 是否发送成功
   */
  async sendGroupInvite(data: any): Promise<boolean> {
    try {
      const response = await this.requestWithTimeout(
        "send_group_invite",
        "group_invite_sent",
        data,
        10000,
      );
      return true;
    } catch (error) {
      message.error("群聊邀请发送失败");
      return false;
    }
  }

  /**
   * 请求最新消息列表
   * @returns {Promise<any>} 最新消息数据
   */
  async requestLatestMessages(): Promise<any> {
    return this.requestWithTimeout(
      "request_latest_messages",
      "latest_messages_received",
    );
  }

  /**
   * 请求聊天历史记录
   * @param {Object} data - 请求参数
   * @param {string|number} data.targetId - 目标ID
   * @param {("private"|"group")} data.type - 聊天类型
   * @param {number} data.page - 页码
   * @param {number} data.limit - 每页数量
   * @returns {Promise<any>} 聊天历史数据
   */
  async requestChatHistory(data: {
    targetId: string | number;
    type: "private" | "group";
    page?: number;
    limit?: number;
  }): Promise<any> {
    return this.requestWithTimeout(
      "request_chat_history",
      "chat_history_received",
      {
        targetId: data.targetId,
        type: data.type,
        page: data.page || 1,
        limit: data.limit || 20,
      },
    );
  }

  /**
   * 发送消息
   * @param {string} event - 事件名称
   * @param {any} data - 消息数据
   * @returns {Promise<any>} 发送结果
   * @description 通用消息发送方法，支持回调确认
   */
  sendMessage(event: string, data: any): Promise<any> {
    if (!this.socket?.connected) {
      return Promise.reject(new Error("WebSocket 未连接"));
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit(event, data, (response: any) => {
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response?.message || "发送失败"));
        }
      });
    });
  }

  /**
   * 注册事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @description 支持多个回调函数监听同一事件
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);

    // 如果是连接状态事件，立即返回当前状态
    if (event === "connection_status") {
      callback({ connected: this.isConnected(), socket: this.socket });
    }
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 要移除的回调函数
   */
  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {any} data - 事件数据
   * @description 执行所有注册的回调函数
   */
  emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件 ${event} 回调执行错误:`, error);
        }
      });
    }
  }

  /**
   * 检查连接状态
   * @returns {boolean} 是否已连接
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * 获取连接状态信息
   * @returns {Object} 连接状态对象
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      socketId: this.socket?.id || null,
    };
  }

  /**
   * 发送输入状态
   * @param {Object} data - 输入状态数据
   * @param {string} data.targetId - 目标用户ID
   * @param {boolean} data.isTyping - 是否正在输入
   */
  sendTypingStatus(data: { targetId: string; isTyping: boolean }) {
    if (!this.socket?.connected) {
      return;
    }

    try {
      this.socket.emit("typing_status", data);
    } catch (error) {
      // 静默处理发送失败
    }
  }

  /**
   * 断开连接
   * @description 手动断开 WebSocket 连接，停止自动重连
   */
  disconnect() {
    this.isManuallyDisconnected = true;
    this.clearTimeout();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * 强制重连
   * @returns {Promise<void>} 重连结果
   * @description 断开当前连接并重新建立
   */
  forceReconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.socket = null;
    return this.connect();
  }
}

// ============ 导出单例 ============
/**
 * WebSocket 服务单例实例
 * @description 全局唯一的 WebSocket 服务实例
 */
export const websocketService = new WebSocketService();

// ============ 客户端初始化 ============
if (typeof window !== 'undefined') {
  /**
   * 初始化 WebSocket 连接
   * @description 延迟初始化，确保 DOM 和 Store 准备就绪
   */
  const initWebSocket = () => {
    try {
      const userStore = useUserStore();

      // 如果用户已认证，建立连接
      if (userStore.token && userStore.isAuthenticated) {
        websocketService.connect().catch(() => {
          // 静默处理连接失败
        });
      }

      // 监听用户认证状态变化
      userStore.$subscribe((mutation, state) => {
        if (state.token && state.isAuthenticated) {
          // 用户已认证，建立连接
          websocketService.connect().catch(() => { });
        } else if (!state.token) {
          // 用户未认证，断开连接
          websocketService.disconnect();
        }
      });
    } catch (error) {
      console.warn('WebSocket 初始化失败:', error);
    }
  };

  // 使用 nextTick 确保应用已完全加载
  if (document.readyState === 'complete') {
    setTimeout(initWebSocket, 500);
  } else {
    window.addEventListener('load', () => {
      setTimeout(initWebSocket, 500);
    });
  }

  // 页面关闭前断开连接
  window.addEventListener("beforeunload", () => {
    websocketService.disconnect();
  });
}