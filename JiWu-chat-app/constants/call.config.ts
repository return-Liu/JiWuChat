export const CALL_CONFIG = {
    // 通话超时
    TIMEOUT: {
        CALL: 60000, // 60秒
        ANSWER: 30000, // 30秒
        RECONNECT: 5000, // 5秒
    },

    // 延迟阈值（毫秒）
    LATENCY: {
        EXCELLENT: 150,
        GOOD: 300,
        FAIR: 500,
        WARNING_HIGH: 300,
        WARNING_VERY_HIGH: 500,
    },

    // 丢包率阈值
    PACKET_LOSS: {
        WARNING: 0.08, // 8%
        CRITICAL: 0.15, // 15%
    },

    // 音频配置
    AUDIO: {
        SAMPLE_RATE: {
            HIGH: 48000,
            LOW: 16000,
        },
        VOLUME: {
            DEFAULT: 100,
            MIN: 0,
            MAX: 100,
        },
        GAIN: {
            DEFAULT: 1.0,
            MIN: 0,
            MAX: 1.0,
        },
    },

    // 视频质量预设
    VIDEO_QUALITY: {
        excellent: { width: 1280, height: 720, frameRate: 30, bitrate: 2500000 },
        good: { width: 640, height: 480, frameRate: 24, bitrate: 1000000 },
        fair: { width: 480, height: 360, frameRate: 20, bitrate: 500000 },
        poor: { width: 320, height: 240, frameRate: 15, bitrate: 200000 },
    },

    // 统计配置
    STATS: {
        UPDATE_INTERVAL: 2000, // 2秒
        HISTORY_MAX: 30,
    },

    // 音效路径
    AUDIO_PATHS: {
        RINGTONE: '/Ringtone/来电铃声.wav',
        HANGUP: '/Ringtone/来电挂断铃声.mp3',
    },
} as const;

export type VideoQuality = keyof typeof CALL_CONFIG.VIDEO_QUALITY;
export type LatencyLevel = 'excellent' | 'good' | 'fair' | 'poor';

// ===== WebRTC ICE 服务器配置 =====
// STUN 服务器：用于 NAT 穿透（对称 NAT 下需配合 TURN 使用）
const STUN_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
] as const;

/**
 * 读取 TURN 服务器配置
 * 优先级：localStorage（动态注入） > 环境变量 > 空数组
 *
 * 支持两种配置方式：
 * 1. localStorage: 设置 `turn-server-config`，值可以是单个对象或对象数组
 *    [{ urls: 'turn:xxx:3478', username: 'u', credential: 'p' }]
 * 2. 环境变量: VUE_APP_TURN_SERVERS（JSON 字符串）
 *
 * 注意：对称 NAT / 企业内网 / 防火墙严格环境下，缺少 TURN 会导致通话无法建立。
 */
export const getTurnServers = (): Array<{ urls: string; username?: string; credential?: string }> => {
    // 1. 优先从 localStorage 读取（运行时动态注入，无需改代码）
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem('turn-server-config');
            if (raw) {
                const parsed = JSON.parse(raw);
                const list = Array.isArray(parsed) ? parsed : [parsed];
                const valid = list.filter(
                    (s: any) => s && typeof s.urls === 'string' && s.urls,
                );
                if (valid.length > 0) return valid;
            }
        }
    } catch {
        // 静默处理解析错误
    }

    // 2. 从环境变量读取
    try {
        const env = (process as any)?.env || {};
        const envRaw = env.VUE_APP_TURN_SERVERS;
        if (envRaw) {
            const parsed = JSON.parse(envRaw);
            const list = Array.isArray(parsed) ? parsed : [parsed];
            const valid = list.filter(
                (s: any) => s && typeof s.urls === 'string' && s.urls,
            );
            if (valid.length > 0) return valid;
        }
    } catch {
        // 静默处理解析错误
    }

    return [];
};

// WebRTC 配置（含 STUN + 可选 TURN）
export const RTC_CONFIG = {
    iceServers: [
        ...STUN_SERVERS,
        ...getTurnServers(),
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle' as const,
    rtcpMuxPolicy: 'require' as const,
    sdpSemantics: 'unified-plan' as const,
    iceTransportPolicy: 'all' as const,
};

// 默认设备状态
export const DEFAULT_DEVICE_STATE = {
    MICROPHONE: true,
    CAMERA: true,
    SPEAKER: true,
};