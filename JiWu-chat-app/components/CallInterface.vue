<template>
  <div class="call-interface-root" ref="callRoot">
    <Teleport to="body">
      <div
        v-if="isMinimized && (callStore.isCalling || callStore.isInCall)"
        class="call-mini-window"
        @click="restoreCallWindow"
        @mousedown.stop
      >
        <div class="call-mini-content">
          <img :src="callStore.receiverAvatar || defaultAvatar" class="call-mini-avatar" />
          <div class="call-mini-info">
            <span class="call-mini-name">{{ callStore.receiverName || "对方" }}</span>
            <span class="call-mini-status">
              {{ callStore.isInCall ? callStore.formattedCallDuration : "等待接听..." }}
            </span>
          </div>
          <div class="call-mini-indicator" :class="{ 'is-active': callStore.isInCall }"></div>
          <button class="call-mini-hangup" @click.stop="endCall">
            <i class="iconfont icon-guaduan"></i>
          </button>
        </div>
      </div>
    </Teleport>
    <Teleport to="body">
      <div
        v-if="!isMinimized && (callStore.isCalling || callStore.isInCall)"
        class="call-overlay"
        @click.self="closeCallOverlay"
      >
        <div
          class="call-card"
          :class="{
            'is-desktop': isDesktop,
            'is-web': !isDesktop,
          }"
        >
          <div class="call-glow call-glow-1"></div>
          <div class="call-glow call-glow-2"></div>
          <div class="call-glow call-glow-3"></div>

          <div
            v-if="isDesktop && !isAuxiliary"
            class="call-titlebar"
            @mousedown="handleOverlayDrag"
          >
            <span class="call-titlebar-text">
              极物聊天 ·
              {{ callStore.callType === "video" ? "视频通话" : "语音通话" }}
              <template v-if="!callStore.isInCall && callStore.isCalling">
                · 正在呼叫 {{ callStore.receiverName || "对方" }}，请等待接听...
              </template>
              <template v-else-if="callStore.isInCall">
                · {{ callStore.formattedCallDuration }}
              </template>
            </span>
            <div class="call-titlebar-actions">
              <button class="call-titlebar-btn" @click="minimizeCallWindow" title="最小化">
                <i class="iconfont icon-zuixiaohua"></i>
              </button>
              <button class="call-titlebar-btn call-titlebar-close" @click="endCall" title="关闭">
                <i class="iconfont icon-guanbi2"></i>
              </button>
            </div>
          </div>

          <div v-else class="call-header">
            <span class="call-title">
              {{ callStore.callType === "video" ? "视频通话" : "语音通话" }} -
              {{ callStore.receiverName || "对方" }}
              <template v-if="!callStore.isInCall && callStore.isCalling">
                · 正在呼叫 {{ callStore.receiverName || "对方" }}，请等待接听...
              </template>
              <template v-else-if="callStore.isInCall">
                · 通话中 {{ callStore.formattedCallDuration }}
              </template>
            </span>
            <div class="call-header-btns">
              <button
                v-if="callStore.callType === 'video'"
                class="call-header-btn"
                @click="toggleViewMode"
                :title="isWebGridMode ? '切换画中画模式' : '切换宫格模式'"
              >
                <i :class="webViewModeIcon"></i>
              </button>
              <button
                v-if="!isAuxiliary"
                class="call-header-btn"
                @click="minimizeCallWindow"
                title="最小化"
              >
                <i class="iconfont icon-zuixiaohua"></i>
              </button>
              <button v-if="!isAuxiliary" class="call-close-btn" @click="endCall">
                <i class="iconfont icon-guanbi2"></i>
              </button>
            </div>
          </div>

          <div
            v-if="callStore.callType === 'video'"
            class="call-video-wrap"
            :class="{ 'call-video-wrap--grid': isWebGridMode }"
          >
            <template v-if="isDesktop && isGridMode && callStore.isInCall">
              <div class="call-grid-remote">
                <video ref="remoteVideo" autoplay playsinline class="call-grid-video"></video>
                <span class="call-grid-label">{{ callStore.receiverName || "对方" }}</span>
                <div v-if="!isRemoteVideoEnabled" class="call-grid-off">
                  <i class="iconfont icon-shexiangtou_guanbi"></i>
                  <span>对方视频画面已关闭</span>
                </div>
              </div>
              <div class="call-grid-local">
                <video
                  ref="localVideo"
                  autoplay
                  muted
                  playsinline
                  class="call-grid-video"
                  :class="{ 'video-hidden': !callStore.isCameraEnabled }"
                ></video>
                <span class="call-grid-label call-grid-label-me">我</span>
                <div v-if="!callStore.isCameraEnabled" class="call-grid-off">
                  <i class="iconfont icon-shexiangtou_guanbi"></i>
                  <span>视频画面已关闭</span>
                </div>
              </div>
            </template>

            <template v-else-if="!isDesktop && isWebGridMode">
              <div class="call-web-grid-wrapper">
                <div class="call-web-grid-remote">
                  <video ref="remoteVideo" autoplay playsinline class="call-web-grid-video"></video>
                  <span class="call-web-grid-label">{{ callStore.receiverName || "对方" }}</span>
                  <div v-if="!isRemoteVideoEnabled" class="call-web-grid-off">
                    <i class="iconfont icon-shexiangtou_guanbi"></i>
                    <span>对方视频画面已关闭</span>
                  </div>
                </div>
                <div class="call-web-grid-local">
                  <video
                    ref="localVideo"
                    autoplay
                    muted
                    playsinline
                    class="call-web-grid-video"
                    :class="{ 'video-hidden': !callStore.isCameraEnabled }"
                  ></video>
                  <span class="call-web-grid-label call-web-grid-label-me">我</span>
                  <div v-if="!callStore.isCameraEnabled" class="call-web-grid-off">
                    <i class="iconfont icon-shexiangtou_guanbi"></i>
                    <span>视频画面已关闭</span>
                  </div>
                </div>
              </div>
            </template>

            <template v-else>
              <video
                ref="localVideo"
                autoplay
                muted
                playsinline
                class="call-local-video"
                :class="{
                  'call-local-as-full': true,
                  'video-hidden': !callStore.isCameraEnabled,
                }"
              ></video>
              <div v-if="!callStore.isCameraEnabled" class="call-cam-placeholder">
                <i class="iconfont icon-shexiangtou_guanbi"></i>
                <p>视频画面已关闭</p>
              </div>

              <div
                v-if="callStore.isCalling || callStore.isInCall"
                class="call-remote-pip-card"
                :class="{
                  'is-in-call': callStore.isInCall,
                  'is-draggable': isDesktop,
                }"
                :style="isDesktop ? { left: pipPos.x + 'px', top: pipPos.y + 'px' } : {}"
                @mousedown.stop="isDesktop ? startDragPip($event) : null"
              >
                <template v-if="callStore.isInCall">
                  <video
                    ref="remoteVideo"
                    autoplay
                    playsinline
                    class="call-remote-pip-video"
                  ></video>
                  <div v-if="!isRemoteVideoEnabled" class="call-pip-off">
                    <i class="iconfont icon-shexiangtou_guanbi"></i>
                  </div>
                  <div class="call-pip-footer">
                    <img
                      :src="callStore.receiverAvatar || defaultAvatar"
                      class="call-pip-footer-avatar"
                    />
                    <span class="call-pip-footer-name">{{ callStore.receiverName || "对方" }}</span>
                  </div>
                </template>
                <div v-else class="call-pip-calling">
                  <img
                    :src="callStore.receiverAvatar || defaultAvatar"
                    class="call-pip-calling-avatar"
                  />
                  <span class="call-pip-calling-name">{{ callStore.receiverName || "对方" }}</span>
                  <span class="call-pip-calling-status">等待接听...</span>
                </div>
              </div>
            </template>

            <div v-if="isDesktop" class="call-top-bar">
              <div class="call-top-info">
                <span v-if="callStore.isInCall" class="call-duration">{{
                  callStore.formattedCallDuration
                }}</span>
                <span class="call-name">{{ callStore.receiverName || "对方" }}</span>
              </div>
              <div class="call-top-actions">
                <button
                  v-if="callStore.isInCall"
                  class="call-top-btn call-mode-btn"
                  @click="toggleGridMode"
                  :title="isGridMode ? '切换画中画模式' : '切换宫格模式'"
                >
                  <i :class="gridModeIcon"></i>
                  <span class="call-mode-label">{{ isGridMode ? "画中画" : "宫格" }}</span>
                </button>
                <button class="call-top-btn" @click="toggleMenu" ref="menuTrigger">
                  <i class="iconfont icon-caidan"></i>
                </button>
                <button
                  class="call-top-btn"
                  @click="toggleSpeaker"
                  :title="callStore.isSpeakerEnabled ? '关闭扬声器' : '开启扬声器'"
                >
                  <i :class="speakerIcon"></i>
                </button>
              </div>
            </div>
          </div>

          <div v-else class="call-audio-wrap">
            <img :src="callStore.receiverAvatar || defaultAvatar" class="call-audio-avatar" />
            <p class="call-audio-name">{{ callStore.receiverName || "对方" }}</p>
            <p v-if="callStore.isInCall">{{ callStore.formattedCallDuration }}</p>
            <p v-else class="call-audio-status">呼叫中，请等待接听</p>
          </div>

          <div
            v-if="timeoutWarning && !callStore.isInCall"
            class="call-global-tip call-tip-warning"
          >
            <i class="iconfont icon-jinggao"></i>
            <span>{{ timeoutWarning }}</span>
          </div>
          <div class="call-controls">
            <div
              class="call-control-wrapper"
              @mouseenter="showMicHover = true"
              @mouseleave="
                showMicHover = false;
                showMicDropdown = false;
              "
            >
              <button
                @click="toggleMicDropdown"
                :class="{ muted: !callStore.isMicrophoneEnabled, active: showMicDropdown }"
                class="call-control-btn"
              >
                <span class="call-control-icon"><i :class="microphoneIcon"></i></span>
                <span class="call-control-label">麦克风</span>
              </button>
              <div v-if="showMicHover && !showMicDropdown" class="call-device-tooltip">
                选择麦克风设备
              </div>
              <div v-if="showMicDropdown" class="call-device-dropdown" @click.stop>
                <div class="call-device-dropdown-title">
                  <i class="iconfont icon-maikefeng"></i> 麦克风
                </div>
                <div
                  v-for="device in audioInputDevices"
                  :key="device.deviceId"
                  class="call-device-item"
                  :class="{ active: selectedAudioInput === device.deviceId }"
                  @click="selectAudioInput(device.deviceId)"
                >
                  <span class="call-device-name">{{ device.label || device.deviceId }}</span>
                  <i v-if="selectedAudioInput === device.deviceId" class="iconfont icon-gou"></i>
                </div>
                <div class="call-device-divider"></div>
                <div class="call-device-dropdown-title">
                  <i class="iconfont icon-yangshengqi"></i> 扬声器
                </div>
                <div
                  v-for="device in audioOutputDevices"
                  :key="device.deviceId"
                  class="call-device-item"
                  :class="{ active: selectedAudioOutput === device.deviceId }"
                  @click="selectAudioOutput(device.deviceId)"
                >
                  <span class="call-device-name">{{ device.label || device.deviceId }}</span>
                  <i v-if="selectedAudioOutput === device.deviceId" class="iconfont icon-gou"></i>
                </div>
              </div>
            </div>

            <div
              v-if="callStore.callType === 'video'"
              class="call-control-wrapper"
              @mouseenter="showCamHover = true"
              @mouseleave="
                showCamHover = false;
                showCamDropdown = false;
              "
            >
              <button
                @click="toggleCamDropdown"
                :class="{ muted: !callStore.isCameraEnabled, active: showCamDropdown }"
                class="call-control-btn"
              >
                <span class="call-control-icon"><i :class="cameraIcon"></i></span>
                <span class="call-control-label">摄像头</span>
              </button>
              <div v-if="showCamHover && !showCamDropdown" class="call-device-tooltip">
                选择摄像头设备
              </div>
              <div v-if="showCamDropdown" class="call-device-dropdown" @click.stop>
                <div class="call-device-dropdown-title">
                  <i class="iconfont icon-shexiangtou"></i> 摄像头
                </div>
                <div
                  v-for="device in videoInputDevices"
                  :key="device.deviceId"
                  class="call-device-item"
                  :class="{ active: selectedVideoInput === device.deviceId }"
                  @click="selectVideoInput(device.deviceId)"
                >
                  <span class="call-device-name">{{ device.label || device.deviceId }}</span>
                  <i v-if="selectedVideoInput === device.deviceId" class="iconfont icon-gou"></i>
                </div>
              </div>
            </div>
            <button v-if="callStore.isInCall" class="call-control-btn" @click="toggleCallType">
              <span class="call-control-icon">
                <i
                  :class="
                    callStore.callType === 'video'
                      ? 'iconfont icon-yuyintonghua'
                      : 'iconfont icon-shipintonghua'
                  "
                ></i>
              </span>
              <span class="call-control-label">{{
                callStore.callType === "video" ? "语音模式" : "视频模式"
              }}</span>
            </button>

            <button
              v-if="callStore.callType === 'video'"
              @click="toggleViewMode"
              class="call-control-btn"
              :class="{ active: isWebGridMode }"
            >
              <span class="call-control-icon"><i :class="webViewModeIcon"></i></span>
              <span class="call-control-label">{{
                isWebGridMode ? "宫格模式" : "画中画模式"
              }}</span>
            </button>

            <button
              v-if="callStore.isInCall"
              @click="toggleScreenShare"
              class="call-control-btn call-share-btn"
            >
              <span class="call-control-icon"><i class="iconfont icon-pingmugongxiang1"></i></span>
              <span class="call-control-label">共享屏幕</span>
            </button>

            <button
              v-if="callStore.isInCall"
              @click="toggleSpeaker"
              class="call-control-btn"
              :class="{ muted: !callStore.isSpeakerEnabled }"
            >
              <span class="call-control-icon"><i :class="speakerIcon"></i></span>
              <span class="call-control-label">扬声器</span>
            </button>

            <button class="call-control-btn call-hangup-btn" @click="endCall">
              <span class="call-control-icon"><i class="iconfont icon-guaduan"></i></span>
              <span class="call-control-label">挂断</span>
            </button>

            <button class="call-control-btn" @click="toggleMenu" ref="menuTrigger">
              <span class="call-control-icon"><i class="iconfont icon-caidan"></i></span>
              <span class="call-control-label">更多</span>
            </button>
          </div>

          <div v-if="showMenu" class="call-menu-dropdown" @click.stop :style="menuStyle">
            <div class="call-menu-arrow" :style="arrowStyle"></div>

            <div class="call-menu-section">
              <div class="call-menu-section-title">
                <i class="iconfont icon-shezhi"></i> 音频设备
              </div>
              <div class="call-menu-device-item" @click="openDeviceSelector('audioInput')">
                <span><i class="iconfont icon-maikefeng"></i> 麦克风</span>
                <span class="call-menu-device-name">{{
                  selectedInputDeviceLabel || "系统默认"
                }}</span>
                <i class="iconfont icon-xiangyou"></i>
              </div>
              <div class="call-menu-device-item" @click="openDeviceSelector('audioOutput')">
                <span><i class="iconfont icon-yangshengqi"></i> 扬声器</span>
                <span class="call-menu-device-name">{{
                  selectedOutputDeviceLabel || "系统默认"
                }}</span>
                <i class="iconfont icon-xiangyou"></i>
              </div>
              <div
                v-if="callStore.callType === 'video'"
                class="call-menu-device-item"
                @click="openDeviceSelector('videoInput')"
              >
                <span><i class="iconfont icon-shexiangtou"></i> 摄像头</span>
                <span class="call-menu-device-name">{{
                  selectedVideoInputLabel || "系统默认"
                }}</span>
                <i class="iconfont icon-xiangyou"></i>
              </div>
            </div>

            <div class="call-menu-divider"></div>

            <div class="call-menu-section">
              <div class="call-menu-section-title">
                <i class="iconfont icon-yinpinkongzhi"></i> 音视频控制
              </div>
              <div class="call-menu-item" @click="toggleLocalAudio">
                <span> 本地麦克风</span>
                <div class="call-switch" :class="{ active: isLocalAudioEnabled }">
                  <div class="call-switch-thumb"></div>
                </div>
              </div>
              <div class="call-menu-item" @click="toggleRemoteAudio">
                <span><i class="iconfont icon-yinliang"></i> 对方音频</span>
                <div class="call-switch" :class="{ active: isRemoteAudioEnabled }">
                  <div class="call-switch-thumb"></div>
                </div>
              </div>
              <div class="call-menu-item" @click="toggleLocalVideo">
                <span>本地摄像头</span>
                <div class="call-switch" :class="{ active: isLocalVideoEnabled }">
                  <div class="call-switch-thumb"></div>
                </div>
              </div>
              <div class="call-menu-item" @click="toggleRemoteVideo">
                <span><i class="iconfont icon-shipin"></i> 对方视频画面</span>
                <div class="call-switch" :class="{ active: isRemoteVideoEnabled }">
                  <div class="call-switch-thumb"></div>
                </div>
              </div>
            </div>

            <div class="call-menu-divider"></div>

            <div class="call-menu-item" @click="openVolumePanel">
              <span><i class="iconfont icon-yinliang"></i> 音量调节</span>
              <i class="iconfont icon-xiangyou"></i>
            </div>

            <div class="call-menu-divider"></div>

            <div class="call-menu-section">
              <div class="call-menu-section-title"><i class="iconfont icon-xin"></i> 全新功能</div>
              <div
                v-for="feature in newFeatures"
                :key="feature.name"
                class="call-menu-item call-menu-new-feature"
                @click="showComingSoon(feature.name)"
              >
                <span><i :class="feature.icon"></i> {{ feature.name }}</span>
                <span class="call-menu-badge">新</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <div v-if="showVolumePanel" class="call-volume-panel-overlay" @click.self="closeVolumePanel">
      <div class="call-volume-panel">
        <div class="call-volume-panel-header">
          <span class="call-volume-panel-title">音频设置</span>
          <button class="call-volume-panel-close" @click="closeVolumePanel">
            <i class="iconfont icon-guanbi2"></i>
          </button>
        </div>
        <div class="call-volume-panel-body">
          <div class="call-volume-group">
            <div class="call-volume-label">
              <span>扬声器</span>
              <span class="call-volume-device">{{ selectedOutputDeviceLabel || "系统默认" }}</span>
            </div>
            <div class="call-volume-slider-wrap">
              <i class="iconfont icon-yinliang-xiao"></i>
              <input
                type="range"
                min="0"
                max="100"
                :value="speakerVolume"
                class="call-volume-slider"
                @input="onSpeakerVolumeChange"
              />
              <i class="iconfont icon-yinliang-da"></i>
            </div>
            <div class="call-volume-value">{{ speakerVolume }}%</div>
          </div>

          <div class="call-volume-group">
            <div class="call-volume-label">
              <span>麦克风</span>
              <span class="call-volume-device">{{ selectedInputDeviceLabel || "系统默认" }}</span>
            </div>
            <div class="call-volume-slider-wrap">
              <i class="iconfont icon-yinliang-xiao"></i>
              <input
                type="range"
                min="0"
                max="100"
                :value="microphoneVolume"
                class="call-volume-slider"
                @input="onMicrophoneVolumeChange"
              />
              <i class="iconfont icon-yinliang-da"></i>
            </div>
            <div class="call-volume-value">{{ microphoneVolume }}%</div>
          </div>

          <div class="call-volume-option">
            <label class="call-volume-checkbox">
              <input type="checkbox" :checked="autoAdjustMic" @change="onAutoAdjustMicChange" />
              <span class="call-volume-checkbox-custom">
                <i v-if="autoAdjustMic" class="iconfont icon-dagou1"></i>
              </span>
              <span>自动调整麦克风音量</span>
            </label>
            <span class="call-volume-option-hint">根据环境噪声自动调节</span>
          </div>

          <div class="call-volume-option">
            <label class="call-volume-checkbox">
              <input
                type="checkbox"
                :checked="audioNoiseReduction"
                @change="onNoiseReductionChange"
              />
              <span class="call-volume-checkbox-custom">
                <i v-if="audioNoiseReduction" class="iconfont icon-dagou1"></i>
              </span>
              <span>音频降噪</span>
            </label>
            <span class="call-volume-option-hint">使用操作系统提供的音频前处理能力</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCallStore } from "../stores/call";
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from "vue";
import { message } from "ant-design-vue";
import { isElectron, minimizeWindow, isAuxiliaryWindow } from "../untils/electronHelper";
import { getSignalingService } from "../untils/signalingService";

// ==================== 配置 ====================
const callStore = useCallStore();
const isDesktop = computed(() => isElectron());
// 是否在独立通话窗口内（独立窗口已有 CustomTitleBar，需隐藏内部模拟标题栏）
const isAuxiliary = ref(false);

// ==================== 新功能列表 ====================
const newFeatures = [
  { name: "AI智能降噪", icon: "iconfont icon-jiangzao" },
  { name: "通话质量统计", icon: "iconfont icon-shuju" },
  { name: "端到端加密", icon: "iconfont icon-anquan" },
  { name: "通话记录", icon: "iconfont icon-lishi" },
  { name: "定时提醒", icon: "iconfont icon-naozhong" },
  { name: "文件传输", icon: "iconfont icon-wenjian" },
  { name: "自定义背景", icon: "iconfont icon-beijing" },
  { name: "语音转文字", icon: "iconfont icon-yuyinzhuanwenzi" },
  { name: "AI智能助手", icon: "iconfont icon-zhineng" },
];

// ==================== 视频引用 ====================
const remoteVideo = ref<HTMLVideoElement | null>(null);
const localVideo = ref<HTMLVideoElement | null>(null);
const localVideoPip = ref<HTMLVideoElement | null>(null);
const remoteVideoPip = ref<HTMLVideoElement | null>(null);
const menuTrigger = ref<HTMLElement | null>(null);

// ==================== 状态 ====================
const isMinimized = ref(false);
const showMenu = ref(false);
const isGridMode = ref(true);
const isWebGridMode = ref(true);
const showVolumePanel = ref(false);

const isLocalAudioEnabled = ref(callStore.isMicrophoneEnabled);
const isRemoteAudioEnabled = ref(true);
const isLocalVideoEnabled = ref(callStore.isCameraEnabled);
const isRemoteVideoEnabled = ref(true);

const timeoutWarning = ref("");
const timeoutTimer = ref<number | null>(null);
const warningTimer = ref<number | null>(null);

const pipPos = ref({ x: 20, y: 120 });
let dragStart = { x: 0, y: 0 };
const isDraggingPip = ref(false);

// 设备下拉状态
const showMicHover = ref(false);
const showCamHover = ref(false);
const showMicDropdown = ref(false);
const showCamDropdown = ref(false);

// ==================== 计算属性 ====================
const defaultAvatar = computed(
  () => "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png",
);

const microphoneIcon = computed(() =>
  callStore.isMicrophoneEnabled ? "iconfont icon-maikefeng1" : "iconfont icon-guanbimaikefeng",
);
const cameraIcon = computed(() =>
  callStore.isCameraEnabled ? "iconfont icon-shexiangtou" : "iconfont icon-shexiangtou_guanbi",
);
const speakerIcon = computed(() =>
  callStore.isSpeakerEnabled ? "iconfont icon-yangshengqi" : "iconfont icon-guanbiyangshengqi1",
);
const gridModeIcon = computed(() =>
  isGridMode.value ? "iconfont icon-huazhonghua" : "iconfont icon-gongge",
);
const webViewModeIcon = computed(() =>
  isWebGridMode.value ? "iconfont icon-huazhonghua" : "iconfont icon-gongge",
);

const speakerVolume = computed(() => callStore.speakerVolume);
const microphoneVolume = computed(() => callStore.microphoneVolume);
const autoAdjustMic = computed(() => callStore.autoAdjustMic);
const audioNoiseReduction = computed(() => callStore.audioNoiseReduction);

const audioInputDevices = computed(() => callStore.audioInputDevices);
const audioOutputDevices = computed(() => callStore.audioOutputDevices);
const videoInputDevices = computed(() => callStore.videoInputDevices);

const selectedAudioInput = computed({
  get: () => callStore.selectedAudioInputId,
  set: (val) => callStore.switchAudioInput(val),
});
const selectedAudioOutput = computed({
  get: () => callStore.selectedAudioOutputId,
  set: (val) => callStore.switchAudioOutput(val),
});
const selectedVideoInput = computed({
  get: () => callStore.selectedVideoInputId,
  set: (val) => callStore.switchVideoInput(val),
});
const selectedInputDeviceLabel = computed(() => callStore.selectedAudioInputLabel);
const selectedOutputDeviceLabel = computed(() => callStore.selectedAudioOutputLabel);
const selectedVideoInputLabel = computed(() => callStore.selectedVideoInputLabel);

// ==================== 菜单位置 ====================
const menuStyle = ref<Record<string, string>>({});
const arrowStyle = ref<Record<string, string>>({});

const updateMenuPosition = () => {
  if (!menuTrigger.value) return;
  const triggerRect = menuTrigger.value.getBoundingClientRect();
  const cardRect = document.querySelector(".call-card")?.getBoundingClientRect();
  if (!cardRect) return;

  const relativeBottom = cardRect.bottom - triggerRect.top + 10;
  const relativeRight = cardRect.right - triggerRect.right + 10;

  menuStyle.value = { bottom: relativeBottom + "px", right: relativeRight + "px" };
  arrowStyle.value = { right: "20px", bottom: "-6px" };
};

// ==================== 设备选择 ====================
const selectAudioInput = (deviceId: string) => {
  callStore.switchAudioInput(deviceId);
  showMicDropdown.value = false;
  showMicHover.value = false;
};
const selectAudioOutput = (deviceId: string) => {
  callStore.switchAudioOutput(deviceId);
  showMicDropdown.value = false;
  showMicHover.value = false;
};
const selectVideoInput = (deviceId: string) => {
  callStore.switchVideoInput(deviceId);
  showCamDropdown.value = false;
  showCamHover.value = false;
};
const toggleMicDropdown = () => {
  showMicDropdown.value = !showMicDropdown.value;
  showCamDropdown.value = false;
};
const toggleCamDropdown = () => {
  showCamDropdown.value = !showCamDropdown.value;
  showMicDropdown.value = false;
};
const openDeviceSelector = (type: string) => {
  showMenu.value = false;
  if (type === "audioInput" || type === "audioOutput") showMicDropdown.value = true;
  else if (type === "videoInput") showCamDropdown.value = true;
};

// ==================== 音量控制 ====================
const openVolumePanel = () => {
  showVolumePanel.value = true;
  showMenu.value = false;
};
const closeVolumePanel = () => {
  showVolumePanel.value = false;
};
const onSpeakerVolumeChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  callStore.setSpeakerVolume(parseInt(target.value));
};
const onMicrophoneVolumeChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  callStore.setMicrophoneVolume(parseInt(target.value));
};
const onAutoAdjustMicChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  callStore.setAutoAdjustMic(target.checked);
};
const onNoiseReductionChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  callStore.setAudioNoiseReduction(target.checked);
};

// ==================== 通话控制 ====================
const toggleCallType = async () => {
  if (!callStore.isInCall) {
    message.warning("通话未接通，无法切换");
    return;
  }
  const newType = callStore.callType === "video" ? "audio" : "video";
  await callStore.switchCallType(newType);
};

const toggleLocalAudio = () => callStore.toggleMicrophone();
const toggleRemoteAudio = () => {
  isRemoteAudioEnabled.value = !isRemoteAudioEnabled.value;
  const stream = remoteVideo.value?.srcObject as MediaStream;
  stream?.getAudioTracks().forEach((track) => (track.enabled = isRemoteAudioEnabled.value));
};
const toggleLocalVideo = () => callStore.toggleCamera();
const toggleRemoteVideo = () => {
  isRemoteVideoEnabled.value = !isRemoteVideoEnabled.value;
  const stream = remoteVideo.value?.srcObject as MediaStream;
  stream?.getVideoTracks().forEach((track) => (track.enabled = isRemoteVideoEnabled.value));
};
const toggleSpeaker = () => callStore.toggleSpeaker();
const toggleMenu = () => {
  showMenu.value = !showMenu.value;
  if (showMenu.value) nextTick(() => updateMenuPosition());
};
const toggleViewMode = () => {
  isWebGridMode.value = !isWebGridMode.value;
  nextTick(() => bindStreamsToVideos());
};
const toggleGridMode = () => {
  isGridMode.value = !isGridMode.value;
  nextTick(() => bindStreamsToVideos());
};
const toggleScreenShare = async () => {
  if (!callStore.isInCall) return message.warning("接通后才可开启屏幕共享");
  try {
    callStore.isScreenSharing
      ? await callStore.stopScreenShare()
      : await callStore.startScreenShare();
  } catch (err: any) {
    message.error(err.message || "屏幕共享失败");
  }
};

// ==================== 窗口控制 ====================
const minimizeCallWindow = () => {
  isMinimized.value = true;
  if (isDesktop.value) minimizeWindow();
};
const restoreCallWindow = () => {
  if (isDesktop.value && typeof (window as any).restoreWindow === "function") {
    (window as any).restoreWindow();
  }
  isMinimized.value = false;
};
const closeCallOverlay = () => {};

// ==================== 拖拽 ====================
const startDragPip = (e: MouseEvent) => {
  if (!isDesktop.value) return;
  isDraggingPip.value = true;
  dragStart = { x: e.clientX - pipPos.value.x, y: e.clientY - pipPos.value.y };
  document.addEventListener("mousemove", dragPip);
  document.addEventListener("mouseup", stopDragPip);
};
const dragPip = (e: MouseEvent) => {
  if (!isDraggingPip.value) return;
  pipPos.value.x = e.clientX - dragStart.x;
  pipPos.value.y = e.clientY - dragStart.y;
};
const stopDragPip = () => {
  isDraggingPip.value = false;
  document.removeEventListener("mousemove", dragPip);
  document.removeEventListener("mouseup", stopDragPip);
};
const handleOverlayDrag = () => {};

// ==================== 视频绑定 ====================
const bindStreamsToVideos = () => {
  const remoteStream = callStore.remoteStream;
  const localStream = callStore.localStream;

  // Bind to any video refs that exist (grid / pip / web) to avoid missing bindings
  if (remoteStream) {
    if (remoteVideo.value) remoteVideo.value.srcObject = remoteStream;
    if (remoteVideoPip.value) remoteVideoPip.value.srcObject = remoteStream;
  }

  if (localStream) {
    if (localVideo.value) localVideo.value.srcObject = localStream;
    if (localVideoPip.value) localVideoPip.value.srcObject = localStream;
  }
};

// ==================== 音效 ====================
let hangupAudio: HTMLAudioElement | null = null;
let ringtoneAudio: HTMLAudioElement | null = null;

const playHangupSound = () => {
  try {
    if (hangupAudio) hangupAudio.pause();
    hangupAudio = new Audio("Ringtone/来电挂断铃声.mp3");
    hangupAudio.volume = 0.6;
    hangupAudio.play().catch(() => {});
  } catch {}
};
const playRingtone = () => {
  try {
    if (ringtoneAudio) ringtoneAudio.pause();
    ringtoneAudio = new Audio("Ringtone/来电铃声.wav");
    ringtoneAudio.loop = true;
    ringtoneAudio.volume = 0.7;
    ringtoneAudio.play().catch(() => {});
  } catch {}
};
const stopRingtone = () => {
  if (ringtoneAudio) {
    ringtoneAudio.pause();
    ringtoneAudio.currentTime = 0;
    ringtoneAudio = null;
  }
};

// ==================== 超时 ====================
const CALL_TIMEOUT_DURATION = 60000;
const WARNING_DURATION = 20000;

const clearTimeoutTimers = () => {
  if (warningTimer.value) {
    clearTimeout(warningTimer.value);
    warningTimer.value = null;
  }
  if (timeoutTimer.value) {
    clearTimeout(timeoutTimer.value);
    timeoutTimer.value = null;
  }
};

const startCallTimeoutCountdown = () => {
  clearTimeoutTimers();
  timeoutWarning.value = "";

  warningTimer.value = window.setTimeout(() => {
    if (callStore.isCalling && !callStore.isInCall) {
      timeoutWarning.value = "对方暂时无人接听，请稍后再试";
    }
  }, WARNING_DURATION);

  timeoutTimer.value = window.setTimeout(() => {
    if (callStore.isCalling && !callStore.isInCall) {
      timeoutWarning.value = "";
      playHangupSound();
      callStore.endCall();
    }
  }, CALL_TIMEOUT_DURATION);
};

const endCall = () => {
  isWebGridMode.value = true;
  isGridMode.value = false;
  showMenu.value = false;
  isMinimized.value = false;
  clearTimeoutTimers();
  timeoutWarning.value = "";
  stopRingtone();
  playHangupSound();
  callStore.localStream?.getTracks().forEach((t) => t.stop());
  callStore.remoteStream?.getTracks().forEach((t) => t.stop());
  callStore.endCall();
};

const showComingSoon = (featureName: string) => {
  showMenu.value = false;
  message.info(`「${featureName}」功能即将上线，敬请期待！`);
};

// ==================== 点击外部关闭 ====================
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (
    !target.closest(".call-menu-dropdown") &&
    !target.closest(".call-top-btn") &&
    !target.closest(".call-header-btn") &&
    !target.closest(".call-control-btn") &&
    !target.closest(".call-device-dropdown") &&
    !target.closest(".call-volume-panel")
  ) {
    showMenu.value = false;
    showMicDropdown.value = false;
    showCamDropdown.value = false;
    showMicHover.value = false;
    showCamHover.value = false;
  }
};

// ==================== Watch ====================
watch(showMenu, (val) => {
  if (val) {
    nextTick(() => updateMenuPosition());
    document.addEventListener("click", handleClickOutside);
  } else document.removeEventListener("click", handleClickOutside);
});
watch(
  () => callStore.isMicrophoneEnabled,
  (val) => (isLocalAudioEnabled.value = val),
);
watch(
  () => callStore.isCameraEnabled,
  (val) => (isLocalVideoEnabled.value = val),
);
watch(
  () => callStore.isCalling,
  (isCalling) => {
    if (isCalling && !callStore.isInCall) {
      startCallTimeoutCountdown();
      playRingtone();
    } else {
      clearTimeoutTimers();
      timeoutWarning.value = "";
      stopRingtone();
    }
  },
);
watch(
  () => callStore.isInCall,
  (isInCall) => {
    if (isInCall) {
      clearTimeoutTimers();
      timeoutWarning.value = "";
      stopRingtone();
    }
  },
);
watch(
  () => callStore.remoteStream,
  (stream) => {
    if (!stream) return;
    if (remoteVideo.value) remoteVideo.value.srcObject = stream;
    if (remoteVideoPip.value) remoteVideoPip.value.srcObject = stream;
    isRemoteAudioEnabled.value = true;
    isRemoteVideoEnabled.value = true;
  },
  { immediate: true },
);
watch(
  () => callStore.localStream,
  (stream) => {
    if (!stream) return;
    if (localVideo.value) localVideo.value.srcObject = stream;
    if (localVideoPip.value) localVideoPip.value.srcObject = stream;
  },
  { immediate: true },
);
watch(
  () => callStore.isInCall,
  (val) => {
    if (!val && !callStore.isCalling) isMinimized.value = false;
  },
);

// ==================== 生命周期 ====================
onMounted(async () => {
  // 检测是否在独立通话窗口内
  isAuxiliary.value = await isAuxiliaryWindow();

  callStore.enumerateDevices();
  window.addEventListener("resize", () => {
    if (showMenu.value) updateMenuPosition();
  });
  navigator.mediaDevices.addEventListener("devicechange", callStore.enumerateDevices);
  const signaling = getSignalingService();
  if (signaling) {
    signaling.onMessage((msg: any) => {
      if (msg.type === "call_type_switch" && msg.data?.newType)
        callStore.handleRemoteSwitchType(msg.data.newType);
    });
  }
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("mousemove", dragPip);
  document.removeEventListener("mouseup", stopDragPip);
  window.removeEventListener("resize", () => {
    if (showMenu.value) updateMenuPosition();
  });
  navigator.mediaDevices.removeEventListener("devicechange", callStore.enumerateDevices);
  clearTimeoutTimers();
  if (hangupAudio) hangupAudio.pause();
  if (ringtoneAudio) ringtoneAudio.pause();
  if (callStore.isCalling || callStore.isInCall) callStore.endCall();
});
</script>

<style scoped>
/* ============================================================
   1. 最小化悬浮窗
   ============================================================ */
.call-mini-window {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  background: linear-gradient(145deg, #ffffff, #f5f7ff);
  border-radius: 14px;
  padding: 10px 14px;
  min-width: 200px;
  box-shadow: 0 4px 20px rgba(50, 70, 150, 0.12);
  cursor: pointer;
  border: 1px solid rgba(180, 200, 255, 0.2);
  transition: all 0.3s ease;
  user-select: none;
}
.call-mini-window:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(50, 70, 150, 0.18);
}
.call-mini-content {
  display: flex;
  align-items: center;
  gap: 10px;
}
.call-mini-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #eef1f5;
  flex-shrink: 0;
}
.call-mini-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.call-mini-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.call-mini-status {
  font-size: 11px;
  color: #999;
  line-height: 1.3;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}
.call-mini-hangup {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #e53935;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s ease;
  font-size: 14px;
}
.call-mini-hangup:hover {
  background: #c62828;
  transform: scale(1.1);
}

/* ============================================================
   2. 覆盖层和卡片 - 整体背景优化
   ============================================================ */
.call-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: overlayFadeIn 0.3s ease;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(12px);
  }
}

/* 卡片 */
.call-card {
  position: relative;
  width: min(720px, 95vw);
  background: linear-gradient(160deg, #eef3ff 0%, #e0e8ff 30%, #d5deff 60%, #e4eaff 100%);
  background-size: 200% 200%;
  animation: gradientShift 12s ease-in-out infinite alternate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transform: scale(1);
  transition: transform 0.3s ease;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
}

/* 装饰光晕 */
.call-glow {
  position: absolute;
  pointer-events: none;
  z-index: 0;
  border-radius: 50%;
}

.call-glow-1 {
  top: -30%;
  left: -15%;
  width: 60%;
  height: 60%;
  background: radial-gradient(ellipse, rgba(130, 160, 255, 0.15) 0%, transparent 70%);
  animation: glowFloat 8s ease-in-out infinite alternate;
}

.call-glow-2 {
  bottom: -30%;
  right: -15%;
  width: 60%;
  height: 60%;
  background: radial-gradient(ellipse, rgba(180, 140, 255, 0.12) 0%, transparent 70%);
  animation: glowFloat 10s ease-in-out infinite alternate-reverse;
}

.call-glow-3 {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50%;
  height: 50%;
  background: radial-gradient(ellipse, rgba(200, 180, 255, 0.06) 0%, transparent 70%);
  animation: glowFloat 14s ease-in-out infinite alternate;
}

@keyframes glowFloat {
  0% {
    transform: translate(0, 0) scale(1);
  }
  100% {
    transform: translate(5%, 5%) scale(1.1);
  }
}

/* 确保所有子元素在光晕之上 */
.call-card > * {
  position: relative;
  z-index: 1;
}

.call-card.is-web {
  width: min(920px, 96vw);
  max-height: 92vh;
}

/* ============================================================
   3. 标题栏
   ============================================================ */
.call-titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 18px;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.25);
  -webkit-app-region: drag;
  cursor: move;
  flex-shrink: 0;
}
.call-titlebar-text {
  font-size: 12px;
  color: #4a5578;
  font-weight: 500;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
}
.call-titlebar-actions {
  display: flex;
  -webkit-app-region: no-drag;
  gap: 2px;
}
.call-titlebar-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: #6a7a9a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-size: 16px;
}
.call-titlebar-btn:hover {
  background: rgba(100, 130, 220, 0.1);
  color: #333;
}
.call-titlebar-close:hover {
  background: #e53935 !important;
  color: #fff !important;
}

/* ============================================================
   4. Web端标题栏
   ============================================================ */
.call-header {
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  flex-shrink: 0;
}
.call-header-btns {
  display: flex;
  gap: 6px;
  align-items: center;
}
.call-header-btn {
  background: transparent;
  border: none;
  color: #6a7a9a;
  cursor: pointer;
  font-size: 18px;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.call-header-btn:hover {
  background: rgba(100, 130, 220, 0.1);
  color: #333;
}
.call-title {
  color: #3a4a6a;
  font-size: 15px;
  font-weight: 600;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);
}
.call-close-btn {
  background: transparent;
  border: none;
  color: #6a7a9a;
  cursor: pointer;
  font-size: 18px;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.call-close-btn:hover {
  background: #e53935;
  color: #fff;
}

/* ============================================================
   5. 超时警告 - 底部显示，无背景
   ============================================================ */
.call-global-tip {
  padding: 8px 18px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 20;
  position: relative;
  flex-shrink: 0;
  margin-top: auto;
}
.call-global-tip .iconfont {
  font-size: 18px;
}
.call-tip-warning {
  color: #000;
}
.call-tip-warning .iconfont {
  color: #000;
}

/* ============================================================
   6. 视频区域
   ============================================================ */
.call-video-wrap {
  width: 100%;
  flex: 1;
  position: relative;
  background: rgba(20, 30, 60, 0.12);
  min-height: 300px;
  padding: 10px;
  box-sizing: border-box;
  backdrop-filter: blur(2px);
}
.call-video-wrap--grid {
  padding: 0;
}

.call-local-video {
  position: absolute;
  inset: 10px;
  width: calc(100% - 20px);
  height: calc(100% - 20px);
  object-fit: cover;
  border-radius: 12px;
  border: none;
  z-index: 1;
  pointer-events: none;
  background: rgba(20, 30, 60, 0.1);
}
.call-local-video.video-hidden {
  opacity: 0;
}

/* 桌面端宫格 */
.call-grid-remote {
  flex: 1;
  position: relative;
  overflow: hidden;
}
.call-grid-local {
  width: 30%;
  min-width: 180px;
  border-left: 2px solid rgba(255, 255, 255, 0.08);
  position: relative;
  overflow: hidden;
}
.call-grid-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.call-grid-video.video-hidden {
  opacity: 0;
}
.call-grid-label {
  position: absolute;
  bottom: 12px;
  left: 12px;
  padding: 4px 14px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}
.call-grid-label-me {
  background: rgba(74, 124, 247, 0.5);
}
.call-grid-off {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #8899bb;
  font-size: 12px;
}
.call-grid-off .iconfont {
  font-size: 28px;
  color: #6677aa;
}

/* Web端宫格 */
.call-web-grid-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
}
.call-web-grid-remote {
  flex: 1;
  border-right: 2px solid rgba(255, 255, 255, 0.08);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.call-web-grid-local {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.call-web-grid-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  inset: 0;
}
.call-web-grid-video.video-hidden {
  opacity: 0;
}
.call-web-grid-label {
  position: absolute;
  bottom: 12px;
  left: 12px;
  padding: 4px 14px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 2;
}
.call-web-grid-label-me {
  background: rgba(74, 124, 247, 0.5);
}
.call-web-grid-off {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #8899bb;
  font-size: 12px;
  z-index: 2;
}
.call-web-grid-off .iconfont {
  font-size: 28px;
  color: #6677aa;
}

/* 对方小窗 */
.call-remote-pip-card {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 160px;
  height: 210px;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  background: rgba(20, 25, 50, 0.4);
  z-index: 3;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.call-remote-pip-card.is-in-call {
  background: rgba(10, 15, 30, 0.5);
}
.call-remote-pip-card.is-draggable {
  cursor: move;
  z-index: 10;
}
.call-remote-pip-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.call-pip-calling {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 100%;
  background: rgba(20, 25, 50, 0.2);
}
.call-pip-calling-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.08);
}
.call-pip-calling-name {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}
.call-pip-calling-status {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}
.call-pip-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
}
.call-pip-footer-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.call-pip-footer-name {
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 110px;
  font-weight: 500;
}
.call-pip-off {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}
.call-pip-off .iconfont {
  font-size: 28px;
  color: #6677aa;
}

/* 摄像头占位 */
.call-cam-placeholder {
  position: absolute;
  inset: 10px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6677aa;
  gap: 12px;
  background: rgba(20, 30, 60, 0.12);
  border-radius: 12px;
  backdrop-filter: blur(4px);
}
.call-cam-placeholder .iconfont {
  font-size: 48px;
  color: #445577;
}

/* ============================================================
   7. 顶部操作栏（桌面端）
   ============================================================ */
.call-top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 14px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.4), transparent);
  z-index: 8;
  pointer-events: none;
}
.call-top-bar .call-top-btn {
  pointer-events: auto;
}
.call-top-info {
  display: flex;
  align-items: center;
  gap: 14px;
}
.call-name {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
.call-duration {
  color: #7cb8ff;
  font-family: monospace;
  padding: 3px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  font-size: 13px;
}
.call-top-actions {
  display: flex;
  gap: 6px;
}
.call-top-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: all 0.25s ease;
}
.call-top-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.call-mode-btn {
  width: auto;
  padding: 0 14px;
  border-radius: 18px;
  gap: 6px;
}
.call-mode-label {
  font-size: 11px;
}

/* ============================================================
   8. 语音区域
   ============================================================ */
.call-audio-wrap {
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  flex: 1;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(4px);
}
.call-audio-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
}
.call-audio-name {
  color: #3a4a6a;
  font-size: 20px;
  margin: 0;
  font-weight: 600;
}
.call-audio-status {
  color: #6677aa;
  font-size: 14px;
}

/* ============================================================
   9. 底部控制栏
   ============================================================ */
.call-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 10px 12px 14px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  flex-wrap: wrap;
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}
.call-control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: transparent;
  border: none;
  color: #5a6a8a;
  cursor: pointer;
  padding: 4px 8px;
  min-width: 50px;
  transition: all 0.25s ease;
  border-radius: 10px;
  position: relative;
}
.call-control-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.call-control-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.25s ease;
  flex-shrink: 0;
}
.call-control-icon .iconfont {
  font-size: 18px;
  color: #556688;
  line-height: 1;
}
.call-control-label {
  font-size: 9px;
  color: #6a7a9a;
  white-space: nowrap;
  line-height: 1.2;
  display: block;
  text-align: center;
  max-width: 52px;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 5px;
  font-weight: 500;
}
.call-control-btn.muted .call-control-icon {
  background: rgba(255, 220, 220, 0.3);
}
.call-control-btn.muted .call-control-icon .iconfont {
  color: #e53935;
}
.call-control-btn:hover .call-control-label {
  color: #3a4a6a;
}

.call-control-btn.active .call-control-icon {
  background: rgba(130, 160, 255, 0.25);
}
.call-control-btn.active .call-control-icon .iconfont {
  color: #4a7cf7;
}
.call-control-btn.active .call-control-label {
  color: #4a7cf7;
}

/* 挂断按钮 */
.call-hangup-btn .call-control-icon {
  background: #e53935;
}
.call-hangup-btn .call-control-icon .iconfont {
  color: #fff !important;
}

/* 共享屏幕 */
.call-share-btn .call-control-icon {
  background: rgba(74, 124, 247, 0.1);
}
.call-share-btn .call-control-icon .iconfont {
  color: #4a7cf7;
}
.call-share-btn:hover .call-control-icon {
  background: rgba(74, 124, 247, 0.2);
}

/* ============================================================
   10. 设备提示和下拉
   ============================================================ */
.call-device-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 4px 14px;
  border-radius: 8px;
  font-size: 11px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 50;
}
.call-device-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.8);
}

.call-device-dropdown {
  position: absolute;
  bottom: 68px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 180px;
  max-width: 260px;
  max-height: 300px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 14px;
  padding: 8px 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  z-index: 40;
}
.call-device-dropdown-title {
  padding: 6px 16px;
  font-size: 11px;
  color: #8899bb;
  font-weight: 600;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.call-device-dropdown-title .iconfont {
  font-size: 13px;
}
.call-device-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  color: #333;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.call-device-item:hover {
  background: rgba(180, 200, 240, 0.1);
}
.call-device-item.active {
  background: rgba(74, 124, 247, 0.1);
  color: #4a7cf7;
}
.call-device-item .iconfont {
  color: #4a7cf7;
  font-size: 14px;
}
.call-device-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.call-device-divider {
  height: 1px;
  margin: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
}

/* ============================================================
   11. 菜单下拉
   ============================================================ */
.call-menu-dropdown {
  position: absolute;
  min-width: 220px;
  max-height: 450px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 14px;
  padding: 6px 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  z-index: 100;
  bottom: auto;
  top: auto;
  left: auto;
  right: auto;
}
.call-menu-arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.92);
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  transform: rotate(45deg);
  z-index: 101;
}
.call-menu-section {
  padding: 4px 0;
}
.call-menu-section-title {
  padding: 6px 16px;
  font-size: 11px;
  color: #8899bb;
  font-weight: 600;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.call-menu-section-title .iconfont {
  font-size: 13px;
}
.call-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  color: #333;
  font-size: 13px;
  cursor: pointer;
  gap: 12px;
  transition: background 0.15s ease;
}
.call-menu-item:hover {
  background: rgba(180, 200, 240, 0.08);
}
.call-menu-item .iconfont {
  font-size: 14px;
  color: #6a7a9a;
}
.call-menu-item span {
  display: flex;
  align-items: center;
  gap: 8px;
}
.call-menu-item span .iconfont {
  font-size: 15px;
}
.call-menu-device-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 16px;
  color: #333;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.call-menu-device-item:hover {
  background: rgba(180, 200, 240, 0.08);
}
.call-menu-device-item .call-menu-device-name {
  color: #8899bb;
  font-size: 12px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.call-menu-device-item .iconfont {
  font-size: 12px;
  color: #aabbcc;
}
.call-menu-divider {
  height: 1px;
  margin: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
}
.call-switch {
  width: 36px;
  height: 20px;
  background: #d0d8e8;
  border-radius: 10px;
  position: relative;
  flex-shrink: 0;
  transition: all 0.3s ease;
  cursor: pointer;
}
.call-switch.active {
  background: linear-gradient(135deg, #7c9aff, #4a7cf7);
}
.call-switch-thumb {
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
}
.call-switch.active .call-switch-thumb {
  left: 18px;
}

.call-menu-badge {
  background: linear-gradient(135deg, #c084fc, #8b5cf6, #7c3aed);
  color: #fff;
  font-size: 9px;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}
.call-menu-new-feature:hover {
  background: rgba(180, 200, 240, 0.08);
}

/* ============================================================
   12. 音量面板
   ============================================================ */
.call-volume-panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: rgba(30, 40, 80, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.call-volume-panel {
  width: 380px;
  background: linear-gradient(160deg, #f0f4ff 0%, #e4eaff 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 12px 56px rgba(50, 70, 150, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.call-volume-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.2);
}
.call-volume-panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #3a4a6a;
}
.call-volume-panel-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #8899bb;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s ease;
}
.call-volume-panel-close:hover {
  background: rgba(180, 200, 240, 0.1);
  color: #333;
}
.call-volume-panel-body {
  padding: 22px;
}
.call-volume-group {
  margin-bottom: 20px;
}
.call-volume-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #3a4a6a;
  margin-bottom: 8px;
}
.call-volume-device {
  font-size: 12px;
  color: #8899bb;
}
.call-volume-slider-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}
.call-volume-slider-wrap .iconfont {
  color: #8899bb;
  font-size: 16px;
}
.call-volume-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #d0d8e8;
  border-radius: 2px;
  outline: none;
}
.call-volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c9aff, #4a7cf7);
  cursor: pointer;
}
.call-volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c9aff, #4a7cf7);
  cursor: pointer;
  border: none;
}
.call-volume-value {
  text-align: right;
  font-size: 13px;
  color: #6677aa;
  margin-top: 4px;
  font-weight: 500;
}
.call-volume-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  flex-wrap: wrap;
}
.call-volume-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #3a4a6a;
}
.call-volume-checkbox input[type="checkbox"] {
  display: none;
}
.call-volume-checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #c0c8d8;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
  background: #fff;
  position: relative;
}
.call-volume-checkbox input:checked + .call-volume-checkbox-custom {
  background: linear-gradient(135deg, #7c9aff, #4a7cf7);
  border-color: #4a7cf7;
}
.call-volume-checkbox-custom .iconfont {
  color: #fff;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.call-volume-checkbox input:checked + .call-volume-checkbox-custom .iconfont {
  opacity: 1;
}
.call-volume-option-hint {
  font-size: 12px;
  color: #8899bb;
  margin-left: auto;
}
</style>
