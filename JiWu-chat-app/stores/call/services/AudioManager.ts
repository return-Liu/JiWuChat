import { CALL_CONFIG, DEFAULT_DEVICE_STATE } from '../../../constants/call.config';
import { CallError } from '../types';

export interface AudioManagerOptions {
    onVolumeChange?: (volume: number) => void;
    onError?: (error: Error) => void;
}

export class AudioManager {
    private audioContext: AudioContext | null = null;
    private gainNodes = new Map<string, GainNode>();
    private audioElements = new Set<HTMLAudioElement>();
    private processor: AudioProcessingService | null = null;
    private isInitialized = false;
    private options: AudioManagerOptions;

    // 状态
    public volume = {
        speaker: CALL_CONFIG.AUDIO.VOLUME.DEFAULT,
        microphone: CALL_CONFIG.AUDIO.VOLUME.DEFAULT,
    };

    public state = {
        noiseReduction: true,
        autoAdjust: true,
    };

    constructor(options: AudioManagerOptions = {}) {
        this.options = options;
    }

    // 初始化音频处理器
    async initialize(stream: MediaStream): Promise<void> {
        try {
            if (this.isInitialized) {
                await this.destroy();
            }

            // 创建音频处理器
            this.processor = new AudioProcessingService();
            await this.processor.initialize(stream, {
                autoAdjust: this.state.autoAdjust,
                noiseReduction: this.state.noiseReduction,
                targetVolume: 60,
            });

            // 监听音量变化
            this.processor.onVolumeChange((volume) => {
                this.options.onVolumeChange?.(volume);
            });

            this.isInitialized = true;
        } catch (error) {
            console.warn('[AudioManager] 初始化失败:', error);
            // 不抛出错误，允许通话继续
        }
    }

    // 获取音频上下文
    private getAudioContext(): AudioContext {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => { });
        }
        return this.audioContext;
    }

    // 设置扬声器音量
    setSpeakerVolume(volume: number, remoteStream?: MediaStream | null): void {
        this.volume.speaker = Math.max(
            CALL_CONFIG.AUDIO.VOLUME.MIN,
            Math.min(CALL_CONFIG.AUDIO.VOLUME.MAX, volume)
        );
        const ratio = this.volume.speaker / CALL_CONFIG.AUDIO.VOLUME.MAX;

        // 查找远程音频元素
        if (remoteStream) {
            const audioElements = document.querySelectorAll('audio');
            for (const el of audioElements) {
                if (el.srcObject === remoteStream) {
                    el.volume = ratio;
                    return;
                }
            }
        }

        // 使用 GainNode
        if (remoteStream) {
            try {
                const audioTracks = remoteStream.getAudioTracks();
                for (const track of audioTracks) {
                    this.applyGainToTrack(track, ratio, 'remote');
                }
            } catch (error) {
                console.warn('[AudioManager] 设置扬声器音量失败:', error);
            }
        }
    }

    // 设置麦克风音量
    async setMicrophoneVolume(volume: number, localStream?: MediaStream | null): Promise<void> {
        this.volume.microphone = Math.max(
            CALL_CONFIG.AUDIO.VOLUME.MIN,
            Math.min(CALL_CONFIG.AUDIO.VOLUME.MAX, volume)
        );
        const ratio = this.volume.microphone / CALL_CONFIG.AUDIO.VOLUME.MAX;

        if (!localStream) return;

        const audioTracks = localStream.getAudioTracks();
        for (const track of audioTracks) {
            try {
                // 尝试应用约束
                await track.applyConstraints({
                    volume: ratio,
                } as any);
            } catch {
                // 降级：使用 GainNode
                this.applyGainToTrack(track, ratio, 'local');
            }
        }
    }

    private applyGainToTrack(track: MediaStreamTrack, gain: number, prefix: string): void {
        try {
            const trackId = `${prefix}_${track.id}`;

            // 清理旧的 GainNode
            if (this.gainNodes.has(trackId)) {
                const oldGain = this.gainNodes.get(trackId)!;
                oldGain.disconnect();
                this.gainNodes.delete(trackId);
            }

            const context = this.getAudioContext();
            const source = context.createMediaStreamSource(new MediaStream([track]));
            const gainNode = context.createGain();
            gainNode.gain.value = gain;

            source.connect(gainNode);
            gainNode.connect(context.destination);

            this.gainNodes.set(trackId, gainNode);
        } catch (error) {
            console.warn('[AudioManager] 应用增益失败:', error);
        }
    }

    // 设置噪声抑制
    async setNoiseReduction(enabled: boolean): Promise<void> {
        this.state.noiseReduction = enabled;

        if (this.processor) {
            try {
                await this.processor.setNoiseReduction(enabled);
            } catch (error) {
                console.warn('[AudioManager] 设置噪声抑制失败:', error);
                this.options.onError?.(new CallError('NOISE_REDUCTION_FAILED', '设置噪声抑制失败'));
            }
        }
    }

    // 设置自动调整麦克风
    async setAutoAdjust(enabled: boolean): Promise<void> {
        this.state.autoAdjust = enabled;

        if (this.processor) {
            try {
                await this.processor.setAutoAdjust(enabled);
            } catch (error) {
                console.warn('[AudioManager] 设置自动调整失败:', error);
                this.options.onError?.(new CallError('AUTO_ADJUST_FAILED', '设置自动调整失败'));
            }
        }
    }

    // 播放音效
    playSound(url: string, loop = false, volume = 0.4): HTMLAudioElement | null {
        try {
            const audio = new Audio(url);
            audio.loop = loop;
            audio.volume = Math.max(0, Math.min(1, volume));

            audio.play().catch((error) => {
                console.warn('[AudioManager] 播放音效失败:', error);
            });

            this.audioElements.add(audio);
            return audio;
        } catch (error) {
            console.warn('[AudioManager] 创建音效失败:', error);
            return null;
        }
    }

    stopSound(audio: HTMLAudioElement | null): void {
        if (!audio) return;
        try {
            audio.pause();
            audio.currentTime = 0;
            audio.src = '';
            this.audioElements.delete(audio);
        } catch (error) {
            console.warn('[AudioManager] 停止音效失败:', error);
        }
    }

    stopAllSounds(): void {
        for (const audio of this.audioElements) {
            try {
                audio.pause();
                audio.currentTime = 0;
                audio.src = '';
            } catch (error) {
                // 忽略
            }
        }
        this.audioElements.clear();
    }

    // 销毁资源
    async destroy(): Promise<void> {
        try {
            this.isInitialized = false;

            // 销毁音频处理器
            if (this.processor) {
                await this.processor.destroy();
                this.processor = null;
            }

            // 清理 GainNodes
            for (const gain of this.gainNodes.values()) {
                try {
                    gain.disconnect();
                } catch (error) {
                    // 忽略
                }
            }
            this.gainNodes.clear();

            // 停止所有音效
            this.stopAllSounds();

            // 关闭 AudioContext
            if (this.audioContext && this.audioContext.state !== 'closed') {
                await this.audioContext.close();
            }
            this.audioContext = null;

            // 重置音量状态
            this.volume.speaker = CALL_CONFIG.AUDIO.VOLUME.DEFAULT;
            this.volume.microphone = CALL_CONFIG.AUDIO.VOLUME.DEFAULT;
        } catch (error) {
            console.warn('[AudioManager] 销毁失败:', error);
        }
    }
}