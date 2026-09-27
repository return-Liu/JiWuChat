import { CALL_CONFIG } from '../../../constants/call.config';
import { CallError, type LatencyStats } from '../types';

export interface NetworkMonitorOptions {
    onLatencyChange?: (stats: LatencyStats) => void;
    onWarning?: (type: 'high_latency' | 'very_high_latency' | 'packet_loss', stats: LatencyStats) => void;
    onQualityChange?: (quality: LatencyLevel) => void;
}

export class NetworkMonitor {
    private timer: number | null = null;
    private history: number[] = [];
    private lastWarningTimes: Record<string, number> = {};
    private warningCooldown = 30000; // 30秒冷却
    private currentStats: LatencyStats = {
        current: 0,
        average: 0,
        max: 0,
        quality: 'excellent',
    };

    constructor(private options: NetworkMonitorOptions = {}) { }

    // 开始监控
    start(getStats: () => Promise<any>): void {
        this.stop();
        this.history = [];
        this.lastWarningTimes = {};

        this.timer = window.setInterval(async () => {
            try {
                const stats = await getStats();
                if (!stats) return;

                const totalLatency = stats.rtt + stats.jitter / 2;
                this.updateStats(totalLatency);

                // 检查警告条件
                this.checkWarnings(totalLatency, stats);

                // 触发回调
                this.options.onLatencyChange?.(this.currentStats);
            } catch (error) {
                console.warn('[NetworkMonitor] 更新统计失败:', error);
            }
        }, CALL_CONFIG.STATS.UPDATE_INTERVAL);
    }

    // 停止监控
    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.history = [];
    }

    private updateStats(latency: number): void {
        this.currentStats.current = Math.round(latency);
        this.history.push(latency);

        if (this.history.length > CALL_CONFIG.STATS.HISTORY_MAX) {
            this.history.shift();
        }

        if (this.history.length > 0) {
            const sum = this.history.reduce((a, b) => a + b, 0);
            this.currentStats.average = Math.round(sum / this.history.length);
        }

        if (latency > this.currentStats.max) {
            this.currentStats.max = Math.round(latency);
        }

        // 更新质量评级
        this.currentStats.quality = this.getQualityLevel(latency);
        this.options.onQualityChange?.(this.currentStats.quality);
    }

    private getQualityLevel(latency: number): LatencyLevel {
        if (latency < CALL_CONFIG.LATENCY.EXCELLENT) return 'excellent';
        if (latency < CALL_CONFIG.LATENCY.GOOD) return 'good';
        if (latency < CALL_CONFIG.LATENCY.FAIR) return 'fair';
        return 'poor';
    }

    private checkWarnings(latency: number, stats: any): void {
        const now = Date.now();
        const cooldown = this.warningCooldown;

        // 极高延迟警告
        if (latency > CALL_CONFIG.LATENCY.WARNING_VERY_HIGH) {
            if (now - (this.lastWarningTimes.veryHigh || 0) > cooldown) {
                this.lastWarningTimes.veryHigh = now;
                this.options.onWarning?.('very_high_latency', this.currentStats);
            }
            return;
        }

        // 高延迟警告
        if (latency > CALL_CONFIG.LATENCY.WARNING_HIGH) {
            if (now - (this.lastWarningTimes.high || 0) > cooldown) {
                this.lastWarningTimes.high = now;
                this.options.onWarning?.('high_latency', this.currentStats);
            }
        }

        // 丢包警告
        if (stats.packetsReceived > 0) {
            const lossRate = stats.packetsLost / (stats.packetsLost + stats.packetsReceived);
            if (lossRate > CALL_CONFIG.PACKET_LOSS.WARNING) {
                if (now - (this.lastWarningTimes.packetLoss || 0) > cooldown) {
                    this.lastWarningTimes.packetLoss = now;
                    this.options.onWarning?.('packet_loss', this.currentStats);
                }
            }
        }
    }

    // 获取当前统计
    getStats(): LatencyStats {
        return { ...this.currentStats };
    }

    // 重置统计
    reset(): void {
        this.history = [];
        this.currentStats = {
            current: 0,
            average: 0,
            max: 0,
            quality: 'excellent',
        };
    }

    // 销毁
    destroy(): void {
        this.stop();
        this.history = [];
        this.lastWarningTimes = {};
    }
}