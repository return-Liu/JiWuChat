/**
 * 环境配置 composable
 * 封装 localStorage 读写、API/WS 地址管理
 */
import { ref, computed } from "vue";
import { message } from "ant-design-vue";

const STORAGE_KEYS = {
    apiUrl: "api-url",
    wsUrl: "ws-url",
    envType: "env-type",
} as const;

const DEFAULTS = {
    apiUrl: "http://localhost:8080",
    wsUrl: "ws://localhost:8081",
    envType: "dev",
} as const;

/** localStorage 安全读写 */
const storage = {
    get(key: string, defaultValue = ""): string {
        if (typeof window === "undefined") return defaultValue;
        try {
            return localStorage.getItem(key) || defaultValue;
        } catch {
            return defaultValue;
        }
    },
    set(key: string, value: string): boolean {
        if (typeof window === "undefined") return false;
        try {
            localStorage.setItem(key, value);
            return true;
        } catch {
            return false;
        }
    },
};

export function useEnvConfig(onSave?: (apiUrl: string) => void) {
    const apiUrl = ref("");
    const wsUrl = ref("");
    const envType = ref("dev");
    const visible = ref(false);

    const isValid = computed(() => apiUrl.value.trim() !== "" && wsUrl.value.trim() !== "");

    /** 从 localStorage 加载配置 */
    function load() {
        apiUrl.value = storage.get(STORAGE_KEYS.apiUrl, DEFAULTS.apiUrl);
        wsUrl.value = storage.get(STORAGE_KEYS.wsUrl, DEFAULTS.wsUrl);
        envType.value = storage.get(STORAGE_KEYS.envType, DEFAULTS.envType);
    }

    /** 打开配置弹窗 */
    function open() {
        load();
        visible.value = true;
    }

    /** 关闭配置弹窗 */
    function close() {
        visible.value = false;
    }

    /** 重置为默认值 */
    function reset() {
        apiUrl.value = DEFAULTS.apiUrl;
        wsUrl.value = DEFAULTS.wsUrl;
        envType.value = DEFAULTS.envType;
        message.info("已恢复默认");
    }

    /** 保存配置 */
    function save() {
        if (!isValid.value) {
            message.error("API 和 WS 地址不能为空");
            return;
        }
        storage.set(STORAGE_KEYS.apiUrl, apiUrl.value);
        storage.set(STORAGE_KEYS.wsUrl, wsUrl.value);
        storage.set(STORAGE_KEYS.envType, envType.value);
        onSave?.(apiUrl.value);
        visible.value = false;
        message.success("保存成功");
    }

    return {
        apiUrl,
        wsUrl,
        envType,
        visible,
        isValid,
        load,
        open,
        close,
        reset,
        save,
    };
}
