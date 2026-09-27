import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useUserStore } from "../../stores/user";

// Mock 依赖
vi.mock("../../untils/request", () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

vi.mock("js-cookie", () => ({
    default: {
        get: vi.fn(() => null),
        set: vi.fn(),
        remove: vi.fn(),
    },
}));

vi.mock("vue-router", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
    }),
}));

vi.mock("../../untils/signalingService", () => ({
    getSignalingService: () => ({
        connect: vi.fn().mockResolvedValue(true),
    }),
}));

describe("useUserStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        // 清除 localStorage
        localStorage.clear();
    });

    it("初始状态应该是未登录", () => {
        const store = useUserStore();
        expect(store.isAuthenticated).toBe(false);
        expect(store.user).toBeNull();
        expect(store.token).toBeNull();
    });

    it("login 应该设置 token", () => {
        const store = useUserStore();
        store.login("test-token-123");

        expect(store.token).toBe("test-token-123");
        expect(store.isAuthenticated).toBe(true);
    });

    it("logout 应该清除状态", async () => {
        const store = useUserStore();
        store.login("test-token-123");

        // logout 内部调用 router.push，可能抛异常但不影响状态清除
        try {
            await store.logout();
        } catch {
            // 忽略 router 相关错误
        }

        expect(store.token).toBeNull();
        expect(store.user).toBeNull();
        expect(store.isAuthenticated).toBe(false);
    });

    it("userNickname 应该返回昵称或用户名", () => {
        const store = useUserStore();
        expect(store.userNickname).toBe("未登录用户");

        store.setUser({
            id: 1,
            username: "test",
            nickname: "测试用户",
            email: "test@test.com",
            status: 0,
            phone: "",
        });

        expect(store.userNickname).toBe("测试用户");
    });

    it("userAvatar 应该返回默认头像", () => {
        const store = useUserStore();
        expect(store.userAvatar).toContain("cube.elemecdn.com");
    });
});
