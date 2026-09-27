import { message } from "ant-design-vue";
import request from "./request";
import type {
  Friend,
  FriendRequest,
  UserSearchResult,
} from "../types/untilsTypes";

// 发送好友申请
export const sendFriendRequest = async (
  friendId: number,
  remark?: string,
): Promise<FriendRequest> => {
  try {
    const response = await request.post("/friends/request", {
      friendId,
      remark,
    });
    const successMessage = response.data.message;
    message.success(successMessage);
    return response.data.data;
  } catch (error: any) {
    // 增强错误处理逻辑
    let errorMessage = "发送好友申请失败";

    // 优先使用后端返回的具体错误信息
    if (error.response?.data?.data?.message) {
      errorMessage = error.response.data.data.message;
    }

    message.error(errorMessage);
    throw error;
  }
};

// 处理好友申请（接受/拒绝）
export const handleFriendRequest = async (
  requestId: number,
  action: "accept" | "reject",
  remark?: string,
): Promise<FriendRequest> => {
  try {
    const response = await request.post("/friends/request/handle", {
      requestId,
      action,
      remark,
    });

    const messageText =
      action === "accept" ? "已接受好友申请" : "已拒绝好友申请";
    message.success(response.data.message || messageText);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.data?.message || "处理好友申请失败";
    message.error(errorMessage);
    throw error;
  }
};

// 获取好友申请列表
export const getFriendRequests = async (params?: {
  status?: "pending" | "accepted" | "rejected" | "blocked";
  all?: boolean;
}): Promise<FriendRequest[]> => {
  try {
    const response = await request.get("/friends/requests", {
      params: params || {},
    });
    // 返回 requests 数组
    return response.data?.requests || [];
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.data?.message || "获取好友申请列表失败";
    message.error(errorMessage);
    throw error;
  }
};

// 获取好友列表
export const getFriends = async (
  status: "pending" | "accepted" | "rejected" | "blocked" = "accepted",
): Promise<Friend[]> => {
  try {
    const response = await request.get("/friends", { params: { status } });

    // 确保 response.data 是一个数组或有 friendUser 属性的对象
    let rawData: any[] = [];

    if (Array.isArray(response.data)) {
      // 情况1: 直接返回数组
      rawData = response.data;
    } else if (response.data.friendUser) {
      // 情况2: 有 friendUser 属性的对象
      rawData = response.data.friendUser;
    } else if (typeof response.data === 'object') {
      // 情况3: 有数字键的对象（如 {"0": {...}, "1": {...}, ...}）
      const numericKeys = Object.keys(response.data).filter(key => /^\d+$/.test(key));
      if (numericKeys.length > 0) {
        rawData = numericKeys.map(key => response.data[key]);
      }
    }

    // 标准化数据格式，将嵌套的 friendUser 属性提升到顶层
    const friendsData: Friend[] = rawData.map(friend => {
      // 如果存在 friendUser，则将其关键属性提升至顶层
      if (friend.friendUser) {
        return {
          ...friend,
          // 将 friendUser 的属性提升到顶层，便于前端使用
          name: friend.friendUser.nickname,
          avatar: friend.friendUser.avatar,
          bio: friend.friendUser.bio,
          id: friend.friendUser.id,
          userId: friend.friendUser.id,
          friendId: friend.friendUser.id,
          // 保留原始的 remark 信息
          remark: friend.remark || "",
          // 显示名称：备注优先，否则使用昵称
          displayName: friend.remark || friend.friendUser.nickname,
        };
      }

      // 如果没有 friendUser，确保 displayName 存在
      return {
        ...friend,
        displayName: friend.remark || friend.name || '',
      };
    });

    return friendsData;
  } catch (error: any) {
    const errorMessage = error.response?.data?.data?.message || "获取好友列表失败";
    message.error(errorMessage);
    throw error;
  }
};

// 删除好友
export const deleteFriend = async (friendId: number): Promise<void> => {
  try {
    const response = await request.delete(`/friends/${friendId}`);

    message.success(response.data.message || "好友删除成功");
  } catch (error: any) {
    const errorMessage = error.response?.data?.data?.message || "删除好友失败";
    message.error(errorMessage);
    throw error;
  }
};

// 更新好友备注
export const updateFriendRemark = async (
  friendId: number,
  remark: string,
): Promise<Friend> => {
  try {
    const response = await request.put(`/friends/${friendId}/remark`, {
      remark,
    });

    message.success(response.data.message || "好友备注更新成功");
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.data?.message || "更新好友备注失败";
    message.error(errorMessage);
    throw error;
  }
};

// 屏蔽用户
export const blockUser = async (userId: number): Promise<any> => {
  try {
    const response = await request.post("/friends/block", {
      userId,
    });

    // 移除内部的 message 提示，由调用方自行处理
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.data?.message || "屏蔽用户失败";
    throw error;
  }
};

// 取消屏蔽用户
export const unblockUser = async (userId: number): Promise<any> => {
  try {
    const response = await request.post("/friends/unblock", {
      userId,
    });

    // 移除内部的 message 提示，由调用方自行处理
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.data?.message || "取消屏蔽失败";
    throw error;
  }
};

// 搜索用户
export const searchUsers = async (
  keyword: string,
): Promise<UserSearchResult[]> => {
  try {
    const response = await request.get("/friends/search", {
      params: { keyword },
    });
    return response.data.users;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.data?.message ||
      error.response?.data?.message ||
      "搜索用户失败";
    message.error(errorMessage);
    throw error;
  }
};

// 获取用户详细信息
export const getUserInfo = async (
  userId: number,
): Promise<UserSearchResult> => {
  try {
    const response = await request.get(`/users/${userId}`);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.data?.message || "获取用户信息失败";
    message.error(errorMessage);
    throw error;
  }
};

// 检查是否已经是好友
export const checkFriendship = async (friendId: number): Promise<boolean> => {
  try {
    const response = await request.get(`/friends/check/${friendId}`);
    return response.data.isFriend;
  } catch (error: any) {
    // 如果检查失败，默认认为不是好友
    return false;
  }
};

// 获取好友关系详情
export const getFriendshipDetail = async (
  friendId: number,
): Promise<{ relationship: string }> => {
  try {
    const response = await request.get(`/friends/relationship/${friendId}`);
    return response.data;
  } catch (error: any) {
    // 如果获取失败，默认为普通关系
    return { relationship: "normal" };
  }
};

// 获取好友申请详情
export const getFriendRequestDetail = async (
  requestId: number,
): Promise<FriendRequest> => {
  try {
    const response = await request.get(`/friends/request/${requestId}`);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.data?.message || "获取申请详情失败";
    message.error(errorMessage);
    throw error;
  }
};

// 获取待处理的好友申请数量
export const getPendingRequestsCount = async (): Promise<number> => {
  try {
    const requests = await getFriendRequests({ status: "pending" });
    return requests.length;
  } catch (error) {
    return 0;
  }
};

// 撤回好友申请
export const cancelFriendRequest = async (requestId: number): Promise<void> => {
  try {
    const response = await request.delete(`/friends/request/${requestId}`);
    message.success(response.data.message || "已撤回好友申请");
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.data?.message || "撤回好友申请失败";
    message.error(errorMessage);
    throw error;
  }
};

// 删除好友申请（支持所有状态）
export const deleteFriendRequest = async (requestId: number): Promise<void> => {
  try {
    const response = await request.delete(
      `/friends/request/delete/${requestId}`,
    );
    message.success(response.data.message || "已删除好友申请");
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.data?.message || "删除好友申请失败";
    message.error(errorMessage);
    throw error;
  }
};

/**
 * 通用好友数据处理工具
 * @param options - 配置选项
 * @param options.friendIds - 需要筛选的好友ID列表（可选），如果提供则只返回这些好友
 * @param options.groupMemberIds - 群成员ID列表（可选），用于标记是否在群内
 * @param options.invitedFriendIds - 已邀请的好友ID列表（可选），用于标记是否已邀请
 * @param options.status - 好友状态，默认为 'accepted'
 * @returns 处理后的好友数据数组
 */
export interface ProcessedFriend {
  id: string | number;
  name?: string;
  nickname?: string;
  avatar: string;
  signature?: string;
  remark?: string;
  isInGroup?: boolean;
  isInvited?: boolean;
  allowStrangerInvite?: boolean;
  [key: string]: any; // 允许其他字段
}

export interface FetchFriendsOptions {
  friendIds?: number[];
  groupMemberIds?: (string | number)[];
  invitedFriendIds?: number[];
  status?: "pending" | "accepted" | "rejected" | "blocked";
}

export const fetchAndProcessFriends = async (
  options: FetchFriendsOptions = {},
): Promise<ProcessedFriend[]> => {
  const {
    friendIds,
    groupMemberIds = [],
    invitedFriendIds = [],
    status = "accepted",
  } = options;

  try {
    const friendsData = await getFriends(status);
    const groupMemberIdSet = new Set(groupMemberIds.map((id) => String(id)));

    let processedFriends = (friendsData || []).map((item: any) => {
      const userInfo = item.friendUser || {};
      const friendId = String(item.friendId || userInfo.id || "");
      const numId = Number(friendId);
      const isInvited = invitedFriendIds.includes(numId);

      return {
        id: friendId,
        name: userInfo.nickname || userInfo.username || "未知用户",
        nickname: userInfo.nickname || userInfo.username || "未知用户",
        avatar:
          userInfo.avatar ||
          "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png",
        signature: userInfo.signature || "",
        remark: item.remark || "",
        isInGroup: groupMemberIdSet.has(friendId),
        isInvited: isInvited,
        allowStrangerInvite: userInfo.allowStrangerInvite ?? true,
        ...userInfo, // 保留原始用户信息
      };
    });

    // 如果提供了 friendIds，则进行筛选
    if (friendIds && friendIds.length > 0) {
      processedFriends = processedFriends.filter((friend: ProcessedFriend) => {
        const fid = Number(friend.id);
        return friendIds.includes(fid);
      });
    }

    return processedFriends;
  } catch (error) {
    console.error("获取好友信息失败:", error);
    message.error("获取好友信息失败");
    return [];
  }
};
