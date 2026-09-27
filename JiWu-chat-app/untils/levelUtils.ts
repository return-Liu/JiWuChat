/**
 * 群等级头衔工具函数
 */

/**
 * 根据等级获取对应的头衔名称
 * @param level 等级数值
 * @returns 头衔名称
 */
export const getLevelTitle = (level: number): string => {
  if (level >= 91) return "观海听涛";
  if (level >= 81) return "静水流深";
  if (level >= 71) return "与光同行";
  if (level >= 61) return "心怀热忱";
  if (level >= 51) return "向阳而生";
  if (level >= 41) return "稳步前行";
  if (level >= 31) return "初心未改";
  if (level >= 21) return "平凡可贵";
  if (level >= 11) return "慢慢相遇";
  if (level >= 6) return "有幸相逢";
  return "初次见面";
};

/**
 * 判断是否应该显示用户的在线状态
 * @param targetUser 目标用户对象（需要包含onlineVisibility和status字段）
 * @param currentUserId 当前登录用户的ID
 * @param isFriend 当前用户是否是目标用户的好友
 * @returns boolean 是否应该显示在线状态
 */
export const shouldShowOnlineStatus = (
  targetUser: {
    onlineVisibility?: number;
    status?: number;
    id?: number | string;
  },
  currentUserId?: number | string,
  isFriend: boolean = false
): boolean => {
  // 如果没有目标用户信息，不显示
  if (!targetUser) return false;

  // 如果查看的是自己，始终显示真实状态
  if (targetUser.id && currentUserId && String(targetUser.id) === String(currentUserId)) {
    return true;
  }

  const visibility = targetUser.onlineVisibility ?? 0;

  // 0: 所有人可见
  if (visibility === 0) {
    return true;
  }

  // 1: 仅好友可见
  if (visibility === 1) {
    return isFriend;
  }

  // 2: 不显示在线状态
  if (visibility === 2) {
    return false;
  }

  // 默认情况：显示
  return true;
};

/**
 * 获取用户的显示在线状态（考虑隐私设置）
 * @param targetUser 目标用户对象
 * @param currentUserId 当前登录用户的ID
 * @param isFriend 当前用户是否是目标用户的好友
 * @returns boolean 用户是否显示为在线
 */
export const getUserDisplayOnlineStatus = (
  targetUser: {
    onlineVisibility?: number;
    status?: number;
    id?: number | string;
  },
  currentUserId?: number | string,
  isFriend: boolean = false
): boolean => {
  // 首先判断是否应该显示在线状态
  if (!shouldShowOnlineStatus(targetUser, currentUserId, isFriend)) {
    return false;
  }

  // 如果可以显示，则返回真实的在线状态（status === 0 表示在线）
  return targetUser.status === 0;
};
