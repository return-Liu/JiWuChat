import request from "./request";
import { message, Modal } from "ant-design-vue";
import { nextTick } from "vue";
import { deleteTemporaryContact } from "./temporaryContactManager";
import { invalidateChatHistoryCache } from "./contactManager";
import type { ChatAreaManagerOptions } from "../types/untilsTypes";
import type { ChatMessage, Contact } from "../types/chatTypes";

/**
 * 处理置顶切换
 * @param val - 切换后的置顶状态值
 * @param options - 聊天区域管理器选项
 */
export const handleTopToggle = (
  val: boolean | string | number,
  options: ChatAreaManagerOptions,
): Promise<void> => {
  if (!options.activeContact.value) return Promise.resolve();
  const booleanVal = Boolean(val);
  options.isTop.value = booleanVal;
  options.emit("toggleTop", options.activeContactId, booleanVal);
  return Promise.resolve();
};

/**
 * 处理免打扰切换
 * @param val - 切换后的免打扰状态值
 * @param options - 聊天区域管理器选项
 */
export const handleMuteToggle = (
  val: boolean | string | number,
  options: ChatAreaManagerOptions,
): Promise<void> => {
  if (!options.activeContact.value) {
    return Promise.resolve();
  }
  const booleanVal = Boolean(val);
  options.isMuted.value = booleanVal;
  options.emit("toggleMute", options.activeContactId, booleanVal);
  options.showContactDrawer.value = false; // 自动关闭抽屉
  return Promise.resolve();
};

/**
 * 更新备注占位符显示
 * @param remarkEditableRef - 备注编辑元素引用
 * @param activeContact - 当前激活的联系人
 */
export const updateRemarkPlaceholder = (
  remarkEditableRef: { value: HTMLElement | null },
  activeContact: { value: Contact | undefined },
): void => {
  if (!remarkEditableRef.value || !activeContact.value) return;

  const remarkElement = remarkEditableRef.value;
  const currentRemark = activeContact.value.remark || "";
  const placeholder = remarkElement.getAttribute("data-placeholder") || "";

  // 清空原有内容，避免重复叠加
  remarkElement.textContent = "";

  if (currentRemark.trim() === "") {
    // 显示占位符
    remarkElement.textContent = placeholder;
    remarkElement.classList.add("remark-placeholder");
  } else {
    // 显示实际备注
    remarkElement.textContent = currentRemark;
    remarkElement.classList.remove("remark-placeholder");
  }
};

/**
 * 备注获取焦点时的处理
 * @param e - 焦点事件
 * @param options - 聊天区域管理器选项
 */
export const handleRemarkFocus = (
  e: FocusEvent,
  options: ChatAreaManagerOptions,
): void => {
  const target = e.target as HTMLElement;
  const placeholder = target.getAttribute("data-placeholder") || "";

  if (target.textContent === placeholder) {
    target.textContent = "";
    target.classList.remove("remark-placeholder");
  }

  options.tempRemark.value = target.textContent || "";
};

/**
 * 备注输入时的处理
 * @param e - 输入事件
 * @param options - 聊天区域管理器选项
 */
export const handleRemarkInput = (
  e: InputEvent,
  options: ChatAreaManagerOptions,
): void => {
  const target = e.target as HTMLElement;
  options.tempRemark.value = target.textContent || "";
};

/**
 * 备注失去焦点时的处理
 * @param e - 失焦事件
 * @param options - 聊天区域管理器选项
 */
export const handleRemarkBlur = (
  e: FocusEvent,
  options: ChatAreaManagerOptions,
): void => {
  const target = e.target as HTMLElement;
  const newRemark = options.tempRemark.value.trim();

  if (newRemark === "") {
    const placeholder = target.getAttribute("data-placeholder") || "";
    target.textContent = placeholder;
    target.classList.add("remark-placeholder");
  } else {
    target.textContent = newRemark;
    target.classList.remove("remark-placeholder");
  }

  if (
    options.activeContact.value &&
    newRemark !== (options.activeContact.value.remark || "")
  ) {
    options.emit("editRemark", options.activeContactId, newRemark);
  }
};

/**
 * 处理备注回车键事件
 * @param e - 键盘事件
 * @param options - 聊天区域管理器选项
 */
export const handleRemarkKeyUp = (
  e: KeyboardEvent,
  options: ChatAreaManagerOptions,
): void => {
  if (e.key === "Enter") {
    const target = e.target as HTMLElement;
    target.blur();
  }
};

/**
 * 保存群公告
 * @param options - 聊天区域管理器选项
 */
export const saveGroupRule = (options: ChatAreaManagerOptions): void => {
  if (!options.activeContact.value || !options.tempGroupRule.value.trim()) {
    message.warning("群公告内容不能为空");
    return;
  }
  options.emit(
    "updateGroupRule",
    String(options.activeContactId),
    options.tempGroupRule.value.trim(),
  );
  options.isEditingRule.value = false;
};

/**
 * 更多设置相关操作
 * @param command - 命令字符串
 * @param options - 聊天区域管理器选项
 */
export const handleMoreActionCommand = async (
  command: string,
  options: ChatAreaManagerOptions,
): Promise<void> => {
  if (!options.activeContact.value) return;

  const isCurrentUserContact =
    String(options.activeContact.value.id).trim() ===
    String(options.currentUserId).trim();

  switch (command) {
    case "clearHistory":
      message.info("删除聊天记录功能暂未开放，敬请期待");
      break;

    case "deleteFriend":
      if (isCurrentUserContact) {
        message.warning("无法删除自己的账号!");
        return;
      }
      Modal.confirm({
        title: "删除好友",
        content: "确定要删除该好友吗?删除后将无法接收对方消息!",
        okText: "确定",
        cancelText: "取消",
        okType: "danger",
        async onOk() {
          const pureId = String(options.activeContactId).replace("friend_", "");
          try {
            await request.delete(`/friends/${pureId}`);
            options.emit("deleteFriend", options.activeContactId);
            await nextTick();
            options.showContactDrawer.value = false;
          } catch (error: any) {
            const errorMessage =
              error.response?.data?.data?.message || "删除好友失败";
            message.error(errorMessage);
          }
        },
        onCancel() {
          message.info("已取消删除操作");
        },
      });
      break;

    case "quitGroup":
      Modal.confirm({
        title: "退出群聊",
        content: "确定要退出该群聊吗?退出后将无法接收群消息!",
        okText: "确定",
        cancelText: "取消",
        okType: "danger",
        async onOk() {
          const pureId = String(options.activeContactId).replace("group_", "");
          try {
            await request.post(`/group/${pureId}/quit`);
            options.emit("quitGroup", String(options.activeContactId));
            await nextTick();
            options.showContactDrawer.value = false;
          } catch (error: any) {
            const errorMessage =
              error.response?.data?.data?.message || "退出群聊失败";
            message.error(errorMessage);
          }
        },
        onCancel() {
          message.info("已取消退出操作");
        },
      });
      break;

    case "dissolveGroup":
      Modal.confirm({
        title: "解散群聊",
        content: "确定要解散该群聊吗?解散后所有成员都将被移出,且无法恢复!",
        okText: "确定",
        cancelText: "取消",
        okType: "danger",
        async onOk() {
          const pureId = String(options.activeContactId).replace("group_", "");
          try {
            await request.delete(`/group/${pureId}`);
            options.emit("dissolveGroup", String(options.activeContactId));
            await nextTick();
            options.showContactDrawer.value = false;
          } catch (error: any) {
            const errorMessage =
              error.response?.data?.data?.message || "解散群聊失败";
            message.error(errorMessage);
          }
        },
        onCancel() {
          message.info("已取消解散操作");
        },
      });
      break;

    case "deleteTemporaryContact":
      if (isCurrentUserContact) {
        message.warning("无法删除自己的会话!");
        return;
      }
      Modal.confirm({
        title: "删除临时对话",
        content: "确定要删除该临时对话吗?删除后将无法接收对方消息!",
        okText: "确定",
        cancelText: "取消",
        okType: "danger",
        async onOk() {
          const contactId = Number(String(options.activeContactId).replace("friend_", ""));
          try {
            await deleteTemporaryContact(contactId);
            options.emit("deleteTemporaryContact", options.activeContactId);
            await nextTick();
            options.showContactDrawer.value = false;
          } catch (error: any) {
            const errorMessage =
              error.response?.data?.message || "删除临时对话失败";
            message.error(errorMessage);
          }
        },
        onCancel() {
          message.info("已取消删除操作");
        },
      });
      break;
  }
};

/**
 * 发送消息
 * @param options - 聊天区域管理器选项
 */
export const sendMessage = (options: ChatAreaManagerOptions): void => {
  if (!options.newMessage.value.trim() || !options.activeContact.value) return;
  options.emit(
    "sendMessage",
    options.activeContact.value.id,
    options.newMessage.value,
  );
  options.newMessage.value = "";
};

/**
 * 处理回车事件
 * @param event - 键盘事件
 * @param options - 聊天区域管理器选项
 */
export const handleEnterKey = (
  event: KeyboardEvent,
  options: ChatAreaManagerOptions,
): void => {
  if (event.shiftKey) return;
  event.preventDefault();
  sendMessage(options);
};