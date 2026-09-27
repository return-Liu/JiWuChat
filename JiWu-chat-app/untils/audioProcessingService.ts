/**
 * 音频处理服务
 * 使用操作系统和浏览器原生能力进行音频处理
 */
export class AudioProcessingService {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private gainNode: GainNode | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;

    // 音量分析
    private volumeHistory: number[] = [];
    private readonly VOLUME_HISTORY_SIZE = 20;
    private targetVolume = 0.6;
    private isAutoAdjustEnabled = false;
    private isNoiseReductionEnabled = false;

    // 降噪参数
    private readonly SMOOTHING_FACTOR = 0.3;
    private readonly MIN_GAIN = 0.3;
    private readonly MAX_GAIN = 2.0;

    // 运行状态
    private isRunning = false;
    private checkInterval: number | null = null;
    private onVolumeCallback: ((volume: number) => void) | null = null;

    constructor() { }

    /**
     * 初始化音频处理
     */
    async initialize(stream: MediaStream, options?: {
        autoAdjust?: boolean;
        noiseReduction?: boolean;
        targetVolume?: number;
    }): Promise<void> {
        this.isAutoAdjustEnabled = options?.autoAdjust ?? false;
        this.isNoiseReductionEnabled = options?.noiseReduction ?? false;
        this.targetVolume = options?.targetVolume ?? 0.6;

        // 1. 使用操作系统音频处理能力
        await this.applyOperatingSystemAudioProcessing(stream);

        // 2. 设置 Web Audio 分析器
        await this.setupAudioAnalyzer(stream);

        this.isRunning = true;

        if (this.isAutoAdjustEnabled) {
            this.startVolumeMonitoring();
        }
    }

    /**
     * 应用操作系统音频前处理
     */
    private async applyOperatingSystemAudioProcessing(stream: MediaStream): Promise<void> {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) return;

        const track = audioTracks[0];

        const constraints: MediaTrackConstraints = {
            noiseSuppression: this.isNoiseReductionEnabled,
            echoCancellation: true,
            autoGainControl: this.isAutoAdjustEnabled,
        };

        try {
            await track.applyConstraints(constraints);
        } catch (e) {
            // 降级处理
            try {
                await track.applyConstraints({
                    noiseSuppression: this.isNoiseReductionEnabled,
                    echoCancellation: true,
                    autoGainControl: this.isAutoAdjustEnabled,
                });
            } catch (e2) {
                // 最低配置
                await track.applyConstraints({
                    noiseSuppression: this.isNoiseReductionEnabled,
                });
            }
        }
    }

    /**
     * 设置音频分析器
     */
    private async setupAudioAnalyzer(stream: MediaStream): Promise<void> {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.sourceNode = this.audioContext.createMediaStreamSource(stream);
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 1.0;
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.8;

            this.sourceNode.connect(this.analyser);
            this.analyser.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);

        } catch (e) {
            // Web Audio 不可用，仅依赖操作系统处理
        }
    }

    /**
     * 开始音量监控
     */
    private startVolumeMonitoring(): void {
        if (!this.analyser) return;

        this.checkInterval = window.setInterval(() => {
            this.checkVolumeAndAdjust();
        }, 100);
    }

    /**
     * 检查音量并自动调整
     */
    private checkVolumeAndAdjust(): void {
        if (!this.analyser || !this.gainNode || !this.isAutoAdjustEnabled) return;

        try {
            const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            const rms = Math.sqrt(sum / dataArray.length);
            const volume = rms / 255;

            this.volumeHistory.push(volume);
            if (this.volumeHistory.length > this.VOLUME_HISTORY_SIZE) {
                this.volumeHistory.shift();
            }

            const avgVolume = this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length;

            if (this.onVolumeCallback) {
                this.onVolumeCallback(avgVolume);
            }

            if (this.volumeHistory.length >= 10) {
                const currentGain = this.gainNode.gain.value;
                const targetGain = this.calculateTargetGain(avgVolume);
                const newGain = currentGain + (targetGain - currentGain) * this.SMOOTHING_FACTOR;
                this.gainNode.gain.value = Math.max(this.MIN_GAIN, Math.min(this.MAX_GAIN, newGain));
            }

        } catch (e) {
            // 静默处理
        }
    }

    /**
     * 计算目标增益
     */
    private calculateTargetGain(currentVolume: number): number {
        if (currentVolume < 0.001) {
            return this.gainNode?.gain.value || 1.0;
        }
        const targetGain = this.targetVolume / currentVolume;
        return Math.max(this.MIN_GAIN, Math.min(this.MAX_GAIN, targetGain));
    }

    /**
     * 设置自动调整开关
     */
    setAutoAdjust(enabled: boolean): void {
        this.isAutoAdjustEnabled = enabled;

        if (enabled && !this.checkInterval) {
            this.startVolumeMonitoring();
        } else if (!enabled && this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            if (this.gainNode) {
                this.gainNode.gain.value = 1.0;
            }
        }
    }

    /**
     * 设置降噪开关
     */
    async setNoiseReduction(enabled: boolean): Promise<void> {
        this.isNoiseReductionEnabled = enabled;

        if (this.sourceNode) {
            try {
                const stream = this.sourceNode.mediaStream;
                const audioTracks = stream.getAudioTracks();
                if (audioTracks.length > 0) {
                    await audioTracks[0].applyConstraints({
                        noiseSuppression: enabled,
                        echoCancellation: true,
                        autoGainControl: this.isAutoAdjustEnabled,
                    });
                }
            } catch (e) {
                // 忽略错误
            }
        }
    }

    /**
     * 设置目标音量
     */
    setTargetVolume(volume: number): void {
        this.targetVolume = Math.max(0.1, Math.min(1, volume / 100));
    }

    /**
     * 设置音量变化回调
     */
    onVolumeChange(callback: (volume: number) => void): void {
        this.onVolumeCallback = callback;
    }

    /**
     * 获取当前音量
     */
    getCurrentVolume(): number {
        if (this.volumeHistory.length === 0) return 0;
        return this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length;
    }

    /**
     * 销毁资源
     */
    destroy(): void {
        this.isRunning = false;

        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        if (this.gainNode) {
            try {
                this.gainNode.disconnect();
            } catch (e) { }
            this.gainNode = null;
        }

        if (this.analyser) {
            try {
                this.analyser.disconnect();
            } catch (e) { }
            this.analyser = null;
        }

        if (this.sourceNode) {
            try {
                this.sourceNode.disconnect();
            } catch (e) { }
            this.sourceNode = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(() => { });
            this.audioContext = null;
        }

        this.volumeHistory = [];
        this.onVolumeCallback = null;
    }

    isActive(): boolean {
        return this.isRunning;
    }
}