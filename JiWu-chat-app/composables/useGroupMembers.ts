import { computed } from "vue";

/**
 * 群成员分类 composable
 * 从群联系人数据中提取群主、管理员、普通成员
 */
export function useGroupMembers(contact: () => any) {
    const groupOwner = computed(() => {
        const c = contact();
        if (!c?.isGroup) return null;

        const cachedOwner = c.cachedOwner;
        if (cachedOwner) return cachedOwner;

        const owner =
            c.owner ||
            c.groupMembers?.find((m: any) => m.id === c.groupOwnerId) ||
            null;

        if (owner && c.isGroup) {
            c.cachedOwner = owner;
        }

        return owner;
    });

    const adminIds = computed(() => {
        const c = contact();
        if (!c?.isGroup || !Array.isArray(c.admin)) return new Set<string>();
        return new Set(c.admin?.map((a: any) => String(a.id)) || []);
    });

    const groupAdmins = computed(() => {
        const c = contact();
        if (!c?.isGroup || !Array.isArray(c.admin)) return [];
        const ownerId = groupOwner.value ? String(groupOwner.value.id) : "";
        return c.admin.filter((a: any) => String(a.id) !== ownerId);
    });

    const normalMembers = computed(() => {
        const c = contact();
        if (!c?.isGroup || !Array.isArray(c.groupMembers)) return [];

        const ownerId = groupOwner.value ? String(groupOwner.value.id) : "";
        const ids = adminIds.value;

        return c.groupMembers.filter((m: any) => {
            const memberId = String(m.id);
            return memberId !== ownerId && !ids.has(memberId);
        });
    });

    const displayedMembers = computed(() => {
        const c = contact();
        if (!Array.isArray(c?.groupMembers)) return [];
        return c.groupMembers.slice(0, 30);
    });

    return {
        groupOwner,
        groupAdmins,
        normalMembers,
        displayedMembers,
    };
}
