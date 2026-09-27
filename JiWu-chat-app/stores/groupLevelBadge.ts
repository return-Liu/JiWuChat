import { defineStore } from "pinia";

/**
 * 群等级徽章样式 Store
 * 统一管理群等级徽章的 CSS 类名,根据等级和角色返回对应的样式类
 */
export const useGroupLevelBadgeStore = defineStore("groupLevelBadge", () => {
  /**
   * 根据纯等级数值获取对应的颜色类名（默认头衔）
   * @param level 等级数值 (1-100+)
   * @returns CSS 类名
   */
  const getLevelBadgeColorClass = (level: number): string => {
    if (level >= 91) return "badge-sea-waves";
    if (level >= 81) return "badge-quiet-deep";
    if (level >= 71) return "badge-with-light";
    if (level >= 61) return "badge-warm-heart";
    if (level >= 51) return "badge-sun-life";
    if (level >= 41) return "badge-steady-go";
    if (level >= 31) return "badge-keep-heart";
    if (level >= 21) return "badge-ordinary";
    if (level >= 11) return "badge-slow-meet";
    if (level >= 6) return "badge-lucky-meet";
    return "badge-first-meet";
  };

  /**
   * 根据纯等级数值获取自定义头衔的颜色类名
   * 使用与默认头衔完全不同的色系
   * @param level 等级数值 (1-100+)
   * @returns CSS 类名
   */
  const getCustomLevelBadgeColorClass = (level: number): string => {
    if (level >= 91) return "badge-custom-sea-waves";
    if (level >= 81) return "badge-custom-quiet-deep";
    if (level >= 71) return "badge-custom-with-light";
    if (level >= 61) return "badge-custom-warm-heart";
    if (level >= 51) return "badge-custom-sun-life";
    if (level >= 41) return "badge-custom-steady-go";
    if (level >= 31) return "badge-custom-keep-heart";
    if (level >= 21) return "badge-custom-ordinary";
    if (level >= 11) return "badge-custom-slow-meet";
    if (level >= 6) return "badge-custom-lucky-meet";
    return "badge-custom-first-meet";
  };

  /**
   * 根据等级、角色和头衔类型获取完整的徽章 CSS 类名
   * @param level 等级数值
   * @param role 角色类型 ('owner' | 'admin' | 'member')
   * @param titleType 头衔类型 ('default' | 'custom' | 'owner' | 'admin')
   * @returns 完整的 CSS 类名字符串
   */
  const getLevelBadgeClass = (
    level: number,
    role: string,
    titleType: string = "default",
  ): string => {
    // 根据头衔类型返回对应的样式类
    if (titleType === "owner") return "badge-owner";
    if (titleType === "admin") return "badge-admin";
    
    // 自定义头衔使用独立的等级颜色方案
    if (titleType === "custom") {
      return getCustomLevelBadgeColorClass(level);
    }
    
    // 默认头衔使用标准等级颜色
    return getLevelBadgeColorClass(level);
  };

  return {
    getLevelBadgeColorClass,
    getCustomLevelBadgeColorClass,
    getLevelBadgeClass,
  };
});
