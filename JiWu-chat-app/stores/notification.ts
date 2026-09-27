import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Contact } from "../types/chatTypes";
import type { MessagePageOptions } from "../untils/messageManager";

export interface NotificationHistoryItem {
  id: string;
  messageId: string;
  senderName: string;
  avatar: string;
  content: string;
  time: string;
  timestamp: number;
  contactId: string;
  contact: Contact;
  msg: any;
  isRead: boolean;
}

/**
 * 通知与音频管理 Store
 * 负责处理自定义通知和消息提示音
 */
export const useNotificationStore = defineStore("notification", () => {
  // ==========================================
  // 内部状态
  // ==========================================
  
  let currentAudioInstance: HTMLAudioElement | null = null;
  let lastRingtoneUrl: string = "";
  let isAudioReady: boolean = false; // 标记音频是否已就绪

  const notifiedMessageIds = new Set<string>();
  const MAX_NOTIFIED_IDS = 100;

  // 任务栏闪烁相关
  let flashInterval: number | null = null;
  let originalTitle: string = typeof document !== "undefined" ? document.title : "";
  let isFlashing: boolean = false;
  let flashCount: number = 0;
  const MAX_FLASH_COUNT = 10; // 最多闪烁10次

  // 桌面角标数字
  const unreadBadgeCount = ref(0);
  const APP_NAME = "极物聊天";

  // 通知历史记录
  const notificationHistory = ref<NotificationHistoryItem[]>([]);
  const MAX_HISTORY_ITEMS = 200; // 最多保存200条历史记录

  // 消息分组聚合相关
  interface GroupedNotification {
    contactId: string;
    senderName: string;
    avatar: string;
    messages: Array<{
      content: string;
      time: string;
      msg: any;
    }>;
    firstMessageTime: number;
    lastUpdateTime: number;
    timeoutId?: number;
  }
  
  const groupedNotifications = new Map<string, GroupedNotification>();
  const GROUPING_TIME_WINDOW = 5000; // 5秒时间窗口

  // 定期清理已通知的消息ID集合,防止内存泄漏
  if (typeof window !== "undefined") {
    setInterval(() => {
      if (notifiedMessageIds.size > MAX_NOTIFIED_IDS) {
        const idsArray = Array.from(notifiedMessageIds);
        notifiedMessageIds.clear();
        idsArray.slice(-50).forEach(id => notifiedMessageIds.add(id));
      }
    }, 300000);

    // 应用启动时预加载默认音频
    setTimeout(() => {
      try {
        const defaultUrl = "/messageRingtone/水滴-短信提示音 - 天天鈴聲.mp3";
        getOrCreateAudio(defaultUrl);
        console.log('[音频] 默认提示音已预加载');
      } catch (e) {
        console.warn('[音频] 预加载失败:', e);
      }
    }, 1000);
  }

  // ==========================================
  // 辅助函数
  // ==========================================

  /**
   * 检查是否应该显示通知(去重)
   */
  const shouldShowNotification = (messageId?: string): boolean => {
    if (!messageId) return true;
    if (notifiedMessageIds.has(messageId)) return false;
    notifiedMessageIds.add(messageId);
    return true;
  };

  /**
   * 获取或创建音频实例
   */
  const getOrCreateAudio = (url: string): HTMLAudioElement => {
    if (!currentAudioInstance || lastRingtoneUrl !== url) {
      if (currentAudioInstance) {
        currentAudioInstance.pause();
        currentAudioInstance = null;
      }
      
      isAudioReady = false; // 重置就绪状态
      
      const a = new Audio(url);
      a.preload = "auto";
      
      // 从localStorage读取音量设置
      const savedVolume = typeof window !== "undefined" ? localStorage.getItem("notificationSoundVolume") : null;
      a.volume = savedVolume ? Number(savedVolume) / 100 : 0.5;
      
      // 预加载音频，确保可以快速播放
      a.load();
      
      // 监听加载完成事件
      a.addEventListener('canplaythrough', () => {
        isAudioReady = true;
        console.log('[音频] 预加载完成，可以立即播放');
      }, { once: false }); // 改为false，因为URL可能变化需要重新监听
      
      // 监听加载错误
      a.addEventListener('error', (e) => {
        isAudioReady = false;
        console.error('[音频] 加载失败:', e);
      });
      
      // 监听播放结束，重置就绪状态以便下次完整播放
      a.addEventListener('ended', () => {
        isAudioReady = true; // 播放结束后仍然保持就绪状态
        console.log('[音频] 播放完成');
      });
      
      currentAudioInstance = a;
      lastRingtoneUrl = url;
    }
    return currentAudioInstance;
  };

  /**
   * 获取通知预览长度配置
   */
  const getNotificationPreviewLength = (): number => {
    if (typeof window === "undefined") return 50;
    const saved = localStorage.getItem("notificationPreviewLength");
    return saved ? Number(saved) : 50;
  };

  /**
   * 检查是否启用消息分组
   */
  const isGroupingEnabled = (): boolean => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("notificationGroupingEnabled");
    return saved !== "false"; // 默认启用
  };

  /**
   * 获取桌面通知停留时间配置（毫秒）
   */
  const getNotificationDuration = (): number | null => {
    if (typeof window === "undefined") return 5000;
    const saved = localStorage.getItem("notificationDuration");
    const durationMap: Record<string, number | null> = {
      short: 3000,
      medium: 5000,
      long: 10000,
      manual: null, // null表示不自动关闭
    };
    return saved ? durationMap[saved] : 5000;
  };

  /**
   * 获取通知主题样式
   */
  const getNotificationTheme = (): "light" | "dark" | "system" => {
    if (typeof window === "undefined") return "system";
    const saved = localStorage.getItem("notificationTheme");
    return (saved as "light" | "dark" | "system") || "system";
  };

  /**
   * 格式化并截断消息内容
   */
  const formatMessageContent = (msg: any): string => {
    let contentText = "";
    if (msg.messageType === "text") {
      contentText = msg.content;
    } else if (msg.messageType === "image") {
      contentText = "[图片]";
    } else if (msg.messageType === "video") {
      contentText = "[视频]";
    } else if (msg.messageType === "voice") {
      contentText = "[语音]";
    } else if (msg.messageType === "group_invite_pending") {
      contentText = "[群聊邀请]";
    } else {
      contentText = "[新消息]";
    }

    // 根据配置的预览长度截断
    const maxLength = getNotificationPreviewLength();
    if (contentText.length > maxLength) {
      contentText = contentText.substring(0, maxLength) + "...";
    }

    return contentText;
  };

  /**
   * 处理消息分组聚合
   */
  const handleGroupedNotification = (
    msg: any,
    contact: Contact,
    options: MessagePageOptions,
  ) => {
    const contactId = String(contact.id);
    const now = Date.now();

    // 检查是否有现有的分组
    const existingGroup = groupedNotifications.get(contactId);

    if (existingGroup && (now - existingGroup.lastUpdateTime) < GROUPING_TIME_WINDOW) {
      // 更新现有分组
      const contentText = formatMessageContent(msg);
      existingGroup.messages.push({
        content: contentText,
        time: msg.time || new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        msg,
      });
      existingGroup.lastUpdateTime = now;

      // 清除之前的定时器
      if (existingGroup.timeoutId) {
        clearTimeout(existingGroup.timeoutId);
      }

      // 设置新的定时器，在时间窗口结束后显示通知
      existingGroup.timeoutId = window.setTimeout(() => {
        flushGroupedNotification(contactId, options);
      }, GROUPING_TIME_WINDOW);

      console.log(`[消息分组] 联系人 ${contactId} 的消息已聚合，当前共 ${existingGroup.messages.length} 条`);
    } else {
      // 创建新分组或刷新旧分组
      const contentText = formatMessageContent(msg);
      const senderName = msg.sender?.nickname || msg.sender?.username || "未知用户";
      const avatar = msg.sender?.avatar || contact.avatar;

      // 如果存在旧分组，先刷新它
      if (existingGroup && existingGroup.timeoutId) {
        clearTimeout(existingGroup.timeoutId);
        flushGroupedNotification(contactId, options);
      }

      // 创建新分组
      groupedNotifications.set(contactId, {
        contactId,
        senderName,
        avatar,
        messages: [{
          content: contentText,
          time: msg.time || new Date().toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          msg,
        }],
        firstMessageTime: now,
        lastUpdateTime: now,
      });

      // 设置定时器
      const timeoutId = window.setTimeout(() => {
        flushGroupedNotification(contactId, options);
      }, GROUPING_TIME_WINDOW);

      groupedNotifications.get(contactId)!.timeoutId = timeoutId;
    }
  };

  /**
   * 刷新分组通知（时间窗口结束后显示）
   */
  const flushGroupedNotification = (
    contactId: string,
    options: MessagePageOptions,
  ) => {
    const group = groupedNotifications.get(contactId);
    if (!group) return;

    // 清除定时器
    if (group.timeoutId) {
      clearTimeout(group.timeoutId);
    }

    // 构建聚合后的通知内容
    let aggregatedContent = "";
    const messageCount = group.messages.length;

    if (messageCount === 1) {
      // 单条消息，直接显示
      aggregatedContent = group.messages[0].content;
    } else if (messageCount <= 3) {
      // 2-3条消息，显示所有内容
      aggregatedContent = group.messages.map(m => m.content).join(" | ");
      // 再次检查总长度
      const maxLength = getNotificationPreviewLength();
      if (aggregatedContent.length > maxLength) {
        aggregatedContent = aggregatedContent.substring(0, maxLength) + "...";
      }
    } else {
      // 超过3条，显示第一条+数量提示
      const firstContent = group.messages[0].content;
      const remainingCount = messageCount - 1;
      aggregatedContent = `${firstContent} 等${remainingCount}条新消息`;
      const maxLength = getNotificationPreviewLength();
      if (aggregatedContent.length > maxLength) {
        aggregatedContent = aggregatedContent.substring(0, maxLength) + "...";
      }
    }

    // 格式化时间（使用最后一条消息的时间）
    const lastMessage = group.messages[group.messages.length - 1];
    const timeStr = lastMessage.time;

    // 调用组件方法添加聚合通知
    if (options.notificationComponentRef?.value) {
      options.notificationComponentRef.value.addCustomNotification({
        senderName: group.senderName,
        avatar: group.avatar,
        content: aggregatedContent,
        time: timeStr,
        contactId: group.contactId,
        msg: lastMessage.msg,
        contact: options.contacts.find(c => String(c.id) === contactId) || {} as Contact,
        options,
        messageCount: messageCount, // 传递消息数量用于徽章显示
      });
    }

    // 添加到通知历史记录（只记录最后一次）
    addToNotificationHistory({
      messageId: lastMessage.msg.id,
      senderName: group.senderName,
      avatar: group.avatar,
      content: aggregatedContent,
      time: timeStr,
      contactId: group.contactId,
      contact: options.contacts.find(c => String(c.id) === contactId) || {} as Contact,
      msg: lastMessage.msg,
    });

    // 清理分组
    groupedNotifications.delete(contactId);

    console.log(`[消息分组] 联系人 ${contactId} 的 ${messageCount} 条消息已显示`);
  };

  /**
   * 更新桌面角标数字
   */
  const updateUnreadBadge = (count: number) => {
    unreadBadgeCount.value = count;
    
    if (typeof document !== "undefined") {
      if (count > 0) {
        document.title = `(${count}) ${APP_NAME}`;
      } else {
        document.title = APP_NAME;
      }
    }
  };

  /**
   * 增加未读数
   */
  const incrementUnreadBadge = () => {
    updateUnreadBadge(unreadBadgeCount.value + 1);
  };

  /**
   * 减少未读数
   */
  const decrementUnreadBadge = () => {
    const newCount = Math.max(0, unreadBadgeCount.value - 1);
    updateUnreadBadge(newCount);
  };

  /**
   * 清除未读数
   */
  const clearUnreadBadge = () => {
    updateUnreadBadge(0);
  };

  /**
   * 添加通知到历史记录
   */
  const addToNotificationHistory = (data: Omit<NotificationHistoryItem, "id" | "timestamp" | "isRead">) => {
    const historyItem: NotificationHistoryItem = {
      ...data,
      id: `history_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      timestamp: Date.now(),
      isRead: false,
    };

    notificationHistory.value.unshift(historyItem);

    // 限制历史记录数量
    if (notificationHistory.value.length > MAX_HISTORY_ITEMS) {
      notificationHistory.value = notificationHistory.value.slice(0, MAX_HISTORY_ITEMS);
    }

    // 同时更新角标
    incrementUnreadBadge();
  };

  /**
   * 标记通知为已读
   */
  const markNotificationAsRead = (historyId: string) => {
    const item = notificationHistory.value.find(n => n.id === historyId);
    if (item && !item.isRead) {
      item.isRead = true;
      decrementUnreadBadge();
    }
  };

  /**
   * 标记所有通知为已读
   */
  const markAllNotificationsAsRead = () => {
    const unreadCount = notificationHistory.value.filter(n => !n.isRead).length;
    notificationHistory.value.forEach(n => {
      n.isRead = true;
    });
    updateUnreadBadge(Math.max(0, unreadBadgeCount.value - unreadCount));
  };

  /**
   * 清除通知历史记录
   */
  const clearNotificationHistory = (days?: number) => {
    if (days) {
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
      const removedItems = notificationHistory.value.filter(n => n.timestamp < cutoffTime);
      const unreadRemoved = removedItems.filter(n => !n.isRead).length;
      
      notificationHistory.value = notificationHistory.value.filter(n => n.timestamp >= cutoffTime);
      updateUnreadBadge(Math.max(0, unreadBadgeCount.value - unreadRemoved));
    } else {
      notificationHistory.value = [];
      clearUnreadBadge();
    }
  };

  /**
   * 获取指定时间范围内的通知历史
   */
  const getNotificationHistoryByTimeRange = (hours: number = 24) => {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    return notificationHistory.value.filter(n => n.timestamp >= cutoffTime);
  };

  // ==========================================
  // 主要方法
  // ==========================================

  /**
   * 显示自定义通知组件
   */
  const showCustomNotification = (
    msg: any,
    contact: Contact,
    options: MessagePageOptions,
  ) => {
    try {
      if (!options.notificationComponentRef?.value) {
        console.warn("[自定义通知] 通知组件未初始化");
        return;
      }

      if (!shouldShowNotification(msg.id)) return;

      // 检查是否启用消息分组
      if (isGroupingEnabled()) {
        // 使用消息分组逻辑
        handleGroupedNotification(msg, contact, options);
      } else {
        // 不使用分组，直接显示单条通知（原有逻辑）
        const contentText = formatMessageContent(msg);
        const timeStr =
          msg.time ||
          new Date().toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          });

        const senderName =
          msg.sender?.nickname || msg.sender?.username || "未知用户";
        const avatar = msg.sender?.avatar || contact.avatar;

        options.notificationComponentRef.value.addCustomNotification({
          senderName,
          avatar,
          content: contentText,
          time: timeStr,
          contactId: String(contact.id),
          msg,
          contact,
          options,
        });

        addToNotificationHistory({
          messageId: msg.id,
          senderName,
          avatar,
          content: contentText,
          time: timeStr,
          contactId: String(contact.id),
          contact,
          msg,
        });
      }
    } catch (err) {
      console.error("[自定义通知] 显示错误:", err);
    }
  };

  /**
   * 显示状态栏通知
   */
  const showStatusBarNotification = (
    msg: any,
    contact: Contact,
    options: MessagePageOptions,
  ) => {
    try {
      if (!options.statusBarNotificationRef?.value) {
        console.warn("[状态栏通知] 通知组件未初始化");
        return;
      }

      // 状态栏通知不进行去重，每次收到新消息都显示
      // if (!shouldShowNotification(msg.id)) return;

      // 使用统一的格式化函数
      const contentText = formatMessageContent(msg);

      // 获取发送者信息
      const senderName =
        msg.sender?.nickname || msg.sender?.username || "未知用户";
      const avatar = msg.sender?.avatar || contact.avatar;

      // 调用组件方法添加通知
      options.statusBarNotificationRef.value.showStatusBarNotification({
        senderName,
        avatar,
        content: contentText,
        contactId: String(contact.id),
        msg,
        contact,
        options,
      });
    } catch (err) {
      console.error("[状态栏通知] 显示错误:", err);
    }
  };

  /**
   * 显示桌面通知（浏览器原生 Notification API）
   */
  const showDesktopNotification = (
    msg: any,
    contact: Contact,
    options: MessagePageOptions,
  ) => {
    try {
      // 检查浏览器是否支持 Notification API
      if (!("Notification" in window)) {
        console.warn("[桌面通知] 浏览器不支持 Notification API");
        return;
      }

      // 检查并请求权限
      if (Notification.permission === "denied") {
        console.warn("[桌面通知] 用户已拒绝通知权限");
        return;
      }

      if (Notification.permission !== "granted") {
        // 异步请求权限，不阻塞当前流程
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            // 权限授予后，再次尝试显示通知
            showDesktopNotification(msg, contact, options);
          } else {
            console.warn("[桌面通知] 用户未授予通知权限");
          }
        });
        return;
      }

      // 使用统一的格式化函数
      const contentText = formatMessageContent(msg);

      // 获取发送者信息
      const senderName =
        msg.sender?.nickname || msg.sender?.username || "未知用户";
      const icon = msg.sender?.avatar || contact.avatar;

      // 获取停留时间配置
      const duration = getNotificationDuration();

      // 创建桌面通知
      const notification = new Notification(senderName, {
        body: contentText,
        icon: icon,
        tag: `msg_${contact.id}_${msg.id}`, // 使用唯一tag避免重复
        requireInteraction: duration === null, // manual模式需要手动关闭
        silent: false,
      });

      // 如果不是手动关闭模式，设置自动关闭定时器
      if (duration !== null) {
        setTimeout(() => {
          notification.close();
        }, duration);
      }

      // 点击通知时的处理
      notification.onclick = () => {
        window.focus();
        if (options.router) {
          options.router.push("/message");
        }
        notification.close();
      };
    } catch (err) {
      console.error("[桌面通知] 显示错误:", err);
    }
  };

  /**
   * 播放消息提示音
   */
  const playMessageSound = () => {
    try {
      const url =
        typeof window !== "undefined"
          ? localStorage.getItem("messageRingTone") ||
            "/messageRingtone/水滴-短信提示音 - 天天鈴聲.mp3"
          : "/messageRingtone/水滴-短信提示音 - 天天鈴聲.mp3";
      
      const audio = getOrCreateAudio(url);
      
      // 关键优化：确保音频完全停止并重置
      audio.pause();
      audio.currentTime = 0;
      
      // 如果音频还未就绪，等待就绪后再播放
      if (!isAudioReady) {
        console.log('[音频] 音频未就绪，等待加载完成...');
        
        // 创建一个Promise等待音频就绪
        const waitForReady = new Promise<void>((resolve) => {
          const onReady = () => {
            audio.removeEventListener('canplaythrough', onReady);
            resolve();
          };
          audio.addEventListener('canplaythrough', onReady, { once: true });
          
          // 设置超时，避免无限等待
          setTimeout(() => {
            audio.removeEventListener('canplaythrough', onReady);
            console.warn('[音频] 等待就绪超时，尝试直接播放');
            resolve();
          }, 2000);
        });
        
        waitForReady.then(() => {
          // 再次确保从头开始
          audio.currentTime = 0;
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.error('[音频] 播放失败:', error.name, error.message);
              
              if (error.name === 'NotAllowedError') {
                console.warn('[音频] 浏览器阻止了自动播放，需要用户交互');
              }
            });
          }
        });
        
        return;
      }
      
      // 音频已就绪，立即播放
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('[音频] 播放失败:', error.name, error.message);
          
          // 如果是自动播放策略限制，尝试用户交互后播放
          if (error.name === 'NotAllowedError') {
            console.warn('[音频] 浏览器阻止了自动播放，需要用户交互');
          }
        });
      }
    } catch (err) {
      console.error("[音频] 播放提示音错误", err);
    }
  };

  /**
   * 清除指定联系人的通知防抖状态
   */
  const clearNotificationDebounce = (contactId: string): void => {
    // 此方法保留用于向后兼容,但不再使用防抖机制
  };

  /**
   * 启动任务栏闪烁
   */
  const startTitleFlash = () => {
    if (typeof document === "undefined") return;
    if (isFlashing) return;
    
    isFlashing = true;
    flashCount = 0;
    originalTitle = document.title;
    
    flashInterval = window.setInterval(() => {
      flashCount++;
      
      if (flashCount >= MAX_FLASH_COUNT) {
        stopTitleFlash();
        return;
      }
      
      // 交替显示"【新消息】"和原始标题
      document.title = flashCount % 2 === 0 ? originalTitle : "【新消息】" + originalTitle;
    }, 1000);
  };

  /**
   * 停止任务栏闪烁
   */
  const stopTitleFlash = () => {
    if (typeof document === "undefined") return;
    if (flashInterval) {
      clearInterval(flashInterval);
      flashInterval = null;
    }
    
    isFlashing = false;
    flashCount = 0;
    document.title = originalTitle;
  };

  /**
   * 窗口获得焦点时停止闪烁
   */
  const handleWindowFocus = () => {
    stopTitleFlash();
  };

  // 监听窗口焦点事件
  if (typeof window !== "undefined") {
    window.addEventListener("focus", handleWindowFocus);
  }

  return {
    showCustomNotification,
    showStatusBarNotification,
    showDesktopNotification,
    playMessageSound,
    clearNotificationDebounce,
    startTitleFlash,
    stopTitleFlash,
    // 桌面角标相关
    unreadBadgeCount,
    updateUnreadBadge,
    incrementUnreadBadge,
    decrementUnreadBadge,
    clearUnreadBadge,
    // 通知历史相关
    notificationHistory,
    addToNotificationHistory,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotificationHistory,
    getNotificationHistoryByTimeRange,
  };
});
