import { CallError } from '../types';

export interface DeviceManagerOptions {
    onDeviceChange?: (devices: DeviceList) => void;
    onError?: (error: Error) => void;
}

export interface DeviceList {
    audioInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
}

export class DeviceManager {
    private devices: DeviceList = {
        audioInputs: [],
        audioOutputs: [],
        videoInputs: [],
    };

    private selectedDevices = {
        audioInput: '',
        audioOutput: '',
        videoInput: '',
    };

    private isListening = false;
    private options: DeviceManagerOptions;

    constructor(options: DeviceManagerOptions = {}) {
        this.options = options;
    }

    // 枚举设备
    async enumerate(): Promise<DeviceList> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            this.devices = {
                audioInputs: devices.filter(d => d.kind === 'audioinput'),
                audioOutputs: devices.filter(d => d.kind === 'audiooutput'),
                videoInputs: devices.filter(d => d.kind === 'videoinput'),
            };

            // 自动选择默认设备
            if (!this.selectedDevices.audioInput && this.devices.audioInputs.length > 0) {
                this.selectedDevices.audioInput = this.devices.audioInputs[0].deviceId;
            }
            if (!this.selectedDevices.audioOutput && this.devices.audioOutputs.length > 0) {
                this.selectedDevices.audioOutput = this.devices.audioOutputs[0].deviceId;
            }
            if (!this.selectedDevices.videoInput && this.devices.videoInputs.length > 0) {
                this.selectedDevices.videoInput = this.devices.videoInputs[0].deviceId;
            }

            this.options.onDeviceChange?.(this.devices);
            return this.devices;
        } catch (error) {
            console.warn('[DeviceManager] 枚举设备失败:', error);
            this.options.onError?.(new CallError('ENUMERATE_DEVICES_FAILED', '枚举设备失败'));
            throw error;
        }
    }

    // 检查权限
    async checkPermissions(constraints: MediaStreamConstraints): Promise<boolean> {
        try {
            await this.enumerate();

            const hasAudio = this.devices.audioInputs.length > 0;
            const hasVideo = this.devices.videoInputs.length > 0;

            if (constraints.audio && !hasAudio) {
                throw new CallError('NO_AUDIO_DEVICE', '未检测到麦克风设备');
            }
            if (constraints.video && !hasVideo) {
                throw new CallError('NO_VIDEO_DEVICE', '未检测到摄像头设备');
            }

            return true;
        } catch (error) {
            if (error instanceof CallError) throw error;
            throw new CallError('PERMISSION_CHECK_FAILED', '权限检查失败', { error });
        }
    }

    // 获取媒体流
    async getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
        try {
            // 应用选中的设备
            const finalConstraints: MediaStreamConstraints = { ...constraints };

            if (constraints.audio && this.selectedDevices.audioInput) {
                finalConstraints.audio = {
                    ...(typeof constraints.audio === 'object' ? constraints.audio : {}),
                    deviceId: { exact: this.selectedDevices.audioInput },
                };
            }

            if (constraints.video && this.selectedDevices.videoInput) {
                finalConstraints.video = {
                    ...(typeof constraints.video === 'object' ? constraints.video : {}),
                    deviceId: { exact: this.selectedDevices.videoInput },
                };
            }

            return await navigator.mediaDevices.getUserMedia(finalConstraints);
        } catch (error: any) {
            console.warn('[DeviceManager] 获取媒体流失败:', error);
            throw this.wrapError(error);
        }
    }

    // 切换音频输入设备
    async switchAudioInput(deviceId: string): Promise<void> {
        this.selectedDevices.audioInput = deviceId;
        this.options.onDeviceChange?.(this.devices);
    }

    // 切换音频输出设备
    async switchAudioOutput(deviceId: string): Promise<void> {
        this.selectedDevices.audioOutput = deviceId;
        this.options.onDeviceChange?.(this.devices);

        // 尝试应用到所有音频元素
        try {
            if ('setSinkId' in HTMLAudioElement.prototype) {
                const audioElements = document.querySelectorAll('audio');
                for (const el of audioElements) {
                    if (el.srcObject) {
                        await (el as any).setSinkId(deviceId);
                    }
                }
            }
        } catch (error) {
            console.warn('[DeviceManager] 切换音频输出失败:', error);
            // 不抛出错误，某些浏览器不支持
        }
    }

    // 切换视频输入设备
    async switchVideoInput(deviceId: string): Promise<void> {
        this.selectedDevices.videoInput = deviceId;
        this.options.onDeviceChange?.(this.devices);
    }

    // 获取设备标签
    getDeviceLabel(deviceId: string): string {
        const allDevices = [
            ...this.devices.audioInputs,
            ...this.devices.audioOutputs,
            ...this.devices.videoInputs,
        ];
        const device = allDevices.find(d => d.deviceId === deviceId);
        return device?.label || '系统默认';
    }

    private wrapError(error: any): CallError {
        const errorMap: Record<string, string> = {
            NotAllowedError: '请允许访问媒体设备权限',
            PermissionDeniedError: '请允许访问媒体设备权限',
            NotFoundError: '未找到媒体设备',
            NotReadableError: '设备被其他应用占用',
            OverconstrainedError: '设备约束条件无法满足',
            AbortError: '操作被取消',
        };

        const message = errorMap[error.name] || error.message || '获取设备失败';
        return new CallError(`DEVICE_${error.name || 'UNKNOWN'}`, message, { error });
    }

    // 开始监听设备变化
    startListening(): void {
        if (this.isListening) return;

        navigator.mediaDevices.addEventListener('devicechange', this.handleDeviceChange);
        this.isListening = true;
    }

    // 停止监听
    stopListening(): void {
        if (!this.isListening) return;

        navigator.mediaDevices.removeEventListener('devicechange', this.handleDeviceChange);
        this.isListening = false;
    }

    private handleDeviceChange = (): void => {
        this.enumerate().catch(() => { });
    };

    // 获取当前设备列表
    getDevices(): DeviceList {
        return { ...this.devices };
    }

    // 获取选中的设备
    getSelectedDevices() {
        return { ...this.selectedDevices };
    }

    // 销毁
    destroy(): void {
        this.stopListening();
        this.devices = {
            audioInputs: [],
            audioOutputs: [],
            videoInputs: [],
        };
    }
}