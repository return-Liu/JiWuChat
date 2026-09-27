import { reactive, computed } from "vue";
import { message, Modal } from "ant-design-vue";
import request from "../untils/request";

/**
 * 群成员右键菜单操作 composable
 * @param options.groupId - 群ID（computed 或 ref）
 * @param options.isGroupOwner - 是否群主
 * @param options.isGroupAdmin - 是否管理员
 * @param options.groupOwner - 群主信息
 * @param options.groupAdmins - 管理员列表
 * @param options.onRefresh - 操作成功后刷新回调
 * @param options.onSendMessage - 发送消息回调
 * @param options.onViewProfile - 查看资料回调
 */
export function useGroupMemberActions(options: {
    groupId: () => string;
    isGroupOwner: () => boolean;
    isGroupAdmin: () => boolean;
    groupOwner: () => any;
    groupAdmins: () => any[];
    onRefresh?: () => void;
    onSendMessage?: (member: any) => void;
    onViewProfile?: (memberId: number) => void;
}) {
    const contextMenu = reactive({
        visible: false,
        x: 0,
        y: 0,
        member: null as any,
    });

    const showGroupManagement = computed(
        () => options.isGroupOwner() || options.isGroupAdmin(),
    );

    const isTargetOwner = computed(
        () => contextMenu.member?.id === options.groupOwner()?.id,
    );

    const isTargetAdmin = computed(() =>
        options.groupAdmins().some((a: any) => a.id === contextMenu.member?.id),
    );

    const handleMemberContextMenu = (event: MouseEvent, member: any) => {
        contextMenu.visible = true;
        contextMenu.x = event.clientX;
        contextMenu.y = event.clientY;
        contextMenu.member = member;
    };

    const closeContextMenu = () => {
        contextMenu.visible = false;
        contextMenu.member = null;
    };

    const handleContextMenuAction = async (action: string) => {
        const member = contextMenu.member;
        if (!member) return;
        closeContextMenu();

        const memberId = Number(member.id);
        const groupId = options.groupId();

        switch (action) {
            case "profile":
                options.onViewProfile?.(memberId);
                break;
            case "message":
                options.onSendMessage?.(member);
                break;
            case "setAdmin":
                try {
                    await request.put(`/group/${groupId}/admin/${memberId}`);
                    message.success("已设为管理员");
                    options.onRefresh?.();
                } catch (e: any) {
                    message.error(e.response?.data?.message || "操作失败");
                }
                break;
            case "removeAdmin":
                try {
                    await request.delete(`/group/${groupId}/admin/${memberId}`);
                    message.success("已取消管理员");
                    options.onRefresh?.();
                } catch (e: any) {
                    message.error(e.response?.data?.message || "操作失败");
                }
                break;
            case "transferOwner":
                Modal.confirm({
                    title: "转让群主",
                    content: `确定将群主转让给 ${member.nickname || member.name} 吗？`,
                    okText: "确定",
                    cancelText: "取消",
                    async onOk() {
                        try {
                            await request.put(`/group/${groupId}/transfer`, { newOwnerId: memberId });
                            message.success("群主已转让");
                            options.onRefresh?.();
                        } catch (e: any) {
                            message.error(e.response?.data?.message || "操作失败");
                        }
                    },
                });
                break;
            case "kick":
                Modal.confirm({
                    title: "移出群聊",
                    content: `确定将 ${member.nickname || member.name} 移出群聊吗？`,
                    okText: "确定",
                    cancelText: "取消",
                    async onOk() {
                        try {
                            await request.delete(`/group/${groupId}/members/${memberId}`);
                            message.success("已移出群聊");
                            options.onRefresh?.();
                        } catch (e: any) {
                            message.error(e.response?.data?.message || "操作失败");
                        }
                    },
                });
                break;
        }
    };

    return {
        contextMenu,
        showGroupManagement,
        isTargetOwner,
        isTargetAdmin,
        handleMemberContextMenu,
        closeContextMenu,
        handleContextMenuAction,
    };
}
