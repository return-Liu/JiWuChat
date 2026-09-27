// stores/call/types.ts

import type { CallStatus } from '../../untils/webrtcCallManager';

// 定义 LatencyLevel
export type LatencyLevel = 'excellent' | 'good' | 'fair' | 'poor';

// 通话状态机 - 确保使用 export 导出
export type CallState =
    | 'idle'
    | 'ringing'
    | 'connecting'
    | 'connected'
    | 'ended'
    | 'error';

// 使用 export 导出常量
export const VALID_TRANSITIONS = {
    idle: ['ringing', 'connecting', 'error'],
    ringing: ['connecting', 'ended', 'error'],
    connecting: ['connected', 'ended', 'error'],
    connected: ['ended', 'error'],
    ended: ['idle'],
    error: ['idle', 'ended'],
} as const;

// 验证 VALID_TRANSITIONS 的类型
export type ValidTransitions = typeof VALID_TRANSITIONS;

// 通话参与者
export interface CallParticipant {
    id: string;
    name: string;
    avatar: string;
}

// 通话元数据
export interface CallMetadata {
    type: 'video' | 'audio';
    startTime: number | null;
    duration: number;
}

// 媒体流状态
export interface MediaStreamState {
    local: MediaStream | null;
    remote: MediaStream | null;
    screen: MediaStream | null;
}

// 设备状态
export interface DeviceState {
    microphone: boolean;
    camera: boolean;
    speaker: boolean;
}

// 音量控制状态
export interface VolumeState {
    speaker: number;
    microphone: number;
    autoAdjust: boolean;
    noiseReduction: boolean;
}

// 延迟统计
export interface LatencyStats {
    current: number;
    average: number;
    max: number;
    quality: LatencyLevel;
}

// 通话记录
export interface CallRecord {
    id: string;
    contactId: string;
    type: 'video' | 'audio';
    status: 'missed' | 'cancelled' | 'ended' | 'rejected';
    duration: number;
    timestamp: number;
}

// 错误类型
export class CallError extends Error {
    constructor(
        public code: string,
        message: string,
        public context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'CallError';
    }
}