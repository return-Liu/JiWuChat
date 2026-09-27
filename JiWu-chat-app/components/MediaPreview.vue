<template>
  <Teleport to="body">
    <transition name="preview-fade">
      <div
        v-if="visible"
        class="preview-container"
        @click.self="closeModal"
        @wheel="handleWheel"
        :class="{ fullscreen: isFullscreen }"
      >
        <div class="preview-header">
          <div class="header-left"></div>
          <div class="header-center">
            <div class="media-info-container" v-if="mediaList.length">
              <div class="main-title">
                <div class="title-content">
                  <span class="group-id" v-if="groupId">#{{ groupId }}</span>
                  <span class="group-name" v-if="groupName" :title="groupName">
                    {{ groupName }}
                  </span>
                </div>
                <div class="media-meta">
                  <span class="media-type">{{ isCurrentMediaImage ? "图片" : "视频" }}</span>
                  <span class="divider"></span>
                  <span class="counter">{{ currentIndex + 1 }}/{{ mediaList.length }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="header-right">
            <button class="close-btn" @click="closeModal" title="关闭">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="preview-body">
          <div class="sidebar" v-if="mediaList.length > 1">
            <div class="thumbnail-container">
              <div
                v-for="(item, index) in mediaList"
                :key="getMediaKey(item, index)"
                class="thumbnail-item"
                :class="{ active: index === currentIndex }"
                @click="switchMedia(index)"
              >
                <div class="thumbnail-inner">
                  <img
                    v-if="isImage(item)"
                    :src="getMediaSrc(item)"
                    :alt="`缩略图 ${index + 1}`"
                    @error="handleThumbError(index)"
                    class="thumbnail-img"
                  />
                  <div v-else class="video-thumbnail">
                    <img
                      :src="getMediaSrc(item)"
                      :alt="`视频缩略图 ${index + 1}`"
                      @error="handleThumbError(index)"
                      class="thumbnail-img"
                    />
                    <div class="video-play-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="white"
                        stroke="white"
                        stroke-width="1"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="preview-main">
            <div v-if="isLoading" class="loading-mask">
              <div class="loading-spinner"></div>
            </div>

            <div v-if="!isLoading && !currentMediaSrc" class="media-error">
              <p class="error-desc">加载失败，请重试</p>
              <button class="retry-btn" @click="switchMedia(currentIndex)">重新加载</button>
            </div>

            <div
              v-if="mediaList.length > 1 && getPrevIndex() !== currentIndex"
              class="nav-preview left-preview"
              @click="prevMedia"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </div>

            <div class="media-wrapper" v-if="currentMediaSrc">
              <img
                v-if="isCurrentMediaImage"
                ref="imageRef"
                class="media-content"
                :src="currentMediaSrc"
                :style="mediaStyle"
                @mousedown="startDrag"
                @touchstart="startDrag"
                @load="handleImageLoad"
                @error="handleMediaError"
                alt="预览图"
              />

              <video
                v-else
                ref="videoRef"
                class="media-content"
                :src="currentMediaSrc"
                :style="mediaStyle"
                @mousedown="startDrag"
                @touchstart="startDrag"
                @loadedmetadata="handleVideoMetadata"
                @error="handleMediaError"
                @play="isVideoPlaying = true"
                @pause="isVideoPlaying = false"
                autoplay
                loop
                muted
                preload="metadata"
                controlsList="nodownload nofullscreen noremoteplayback"
              >
                你的浏览器不支持视频播放
              </video>
            </div>

            <div
              v-if="mediaList.length > 1 && getNextIndex() !== currentIndex"
              class="nav-preview right-preview"
              @click="nextMedia"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        </div>

        <div class="control-bar">
          <div class="control-group left-controls">
            <button
              class="control-btn"
              title="上一张"
              @click="prevMedia"
              :disabled="mediaList.length <= 1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button
              class="control-btn"
              title="下一张"
              @click="nextMedia"
              :disabled="mediaList.length <= 1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <div class="control-group center-controls">
            <button class="control-btn" title="缩小" @click="zoomOut" :disabled="scale <= 0.2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </button>
            <span class="zoom-value">{{ Math.round(scale * 100) }}%</span>
            <button class="control-btn" title="放大" @click="zoomIn" :disabled="scale >= 3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </button>
            <span class="divider"></span>

            <button class="control-btn" title="顺时针旋转90°" @click="rotateRight">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
              </svg>
            </button>
            <button class="control-btn" title="水平翻转" @click="flipHorizontal">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 12h18"></path>
                <path d="M16 5l3 7-3 7"></path>
                <path d="M8 5l-3 7 3 7"></path>
              </svg>
            </button>
            <button class="control-btn" title="垂直翻转" @click="flipVertical">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 3v18"></path>
                <path d="M5 16l7 3 7-3"></path>
                <path d="M5 8l7-3 7 3"></path>
              </svg>
            </button>
            <span class="divider"></span>

            <button class="control-btn" title="重置视图" @click="resetZoom">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
            </button>
            <button
              v-if="!isCurrentMediaImage"
              class="control-btn"
              :title="isVideoPlaying ? '暂停' : '播放'"
              @click="togglePlayPause"
            >
              <svg
                v-if="isVideoPlaying"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
            <button
              v-if="!isCurrentMediaImage"
              class="control-btn"
              :title="isVideoMuted ? '取消静音' : '静音'"
              @click="toggleMute"
            >
              <svg
                v-if="isVideoMuted"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            </button>
          </div>

          <div class="control-group right-controls">
            <button class="control-btn" title="下载" @click="downloadMedia">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            <button class="control-btn" title="复制链接" @click="copyMediaLink">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </button>
            <button class="control-btn" title="全屏/退出全屏" @click="toggleFullscreen">
              <svg
                v-if="!isFullscreen"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
                <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
                <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
                <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
                <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
                <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
                <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
              </svg>
            </button>
            <button
              v-if="isTempMedia"
              class="control-btn delete-btn"
              title="删除当前媒体"
              @click="deleteCurrentMedia"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                ></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { message } from "ant-design-vue";
import { isEditingLock } from "../untils/uiState";

// ==================== 类型定义 ====================
export type MediaItem =
  | string
  | { url: string; type: "image" | "video" }
  | {
      previewUrl?: string;
      url?: string;
      id: string;
      file: File;
      tempFilename?: string;
    };

interface Props {
  visible: boolean;
  image?: MediaItem[];
  video?: MediaItem[];
  currentMediaIndex?: number;
  groupName?: string;
  groupId?: string | number;
  isTempMedia?: boolean;
}

// ==================== Props & Emits ====================
const props = withDefaults(defineProps<Props>(), {
  currentMediaIndex: 0,
  groupName: "",
  groupId: "",
  isTempMedia: false,
  image: () => [],
  video: () => [],
});

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "close"): void;
  (e: "update:currentMediaIndex", value: number): void;
  (e: "delete-media", id: string): void;
}>();

// ==================== 响应式状态 ====================
const scale = ref(1);
const position = ref({ x: 0, y: 0 });
const rotation = ref(0);
const flip = ref({ x: 1, y: 1 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const isLoading = ref(true);
const mediaSize = ref({ width: 0, height: 0 });
const imageRef = ref<HTMLImageElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const isFullscreen = ref(false);
const isVideoPlaying = ref(false);
const isVideoMuted = ref(false);

// ==================== 核心计算属性 (已修复) ====================

/**
 * 修复1: 合并 image 和 video 数组，而不是二选一
 */
const mediaList = computed(() => {
  // 合并所有媒体项
  const allItems = [...(props.image || []), ...(props.video || [])];

  if (allItems.length === 0) return [];

  return allItems
    .map((item: any) => {
      if (!item) return null;

      // 处理字符串类型
      if (typeof item === "string") {
        const isVideo = /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)$/i.test(item);
        return { url: item, type: isVideo ? "video" : "image" } as MediaItem;
      }

      // 处理临时文件对象 (包含 previewUrl, id, file)
      if ("previewUrl" in item && "id" in item && item.file) {
        const isVideo = item.file.type.startsWith("video/");
        return {
          url: item.previewUrl || item.url || "",
          type: isVideo ? "video" : "image",
          id: item.id,
          file: item.file,
          tempFilename: item.tempFilename,
        } as MediaItem;
      }

      // 处理普通对象 (包含 url, type)
      if ("url" in item && item.url) {
        return item;
      }

      // 如果无法识别，返回 null 过滤掉
      return null;
    })
    .filter((item): item is MediaItem => item !== null);
});

/**
 * 当前索引
 */
const currentIndex = computed(() => {
  const idx = props.currentMediaIndex || 0;
  const maxIdx = mediaList.value.length - 1;
  return Math.max(0, Math.min(idx, maxIdx));
});

/**
 * 当前媒体项
 */
const currentMedia = computed(() => {
  if (mediaList.value.length === 0) {
    return { url: "", type: "image" } as MediaItem;
  }
  return mediaList.value[currentIndex.value] || { url: "", type: "image" };
});

/**
 * 修复2: 获取当前媒体的完整 URL
 */
const currentMediaSrc = computed(() => {
  if (!currentMedia.value) return "";

  const item = currentMedia.value;

  // 如果是字符串
  if (typeof item === "string") {
    return item;
  }

  // 如果是对象，优先使用 previewUrl (临时文件)，其次 url
  if (typeof item === "object") {
    // 临时文件有 previewUrl
    if ("previewUrl" in item && item.previewUrl) {
      return item.previewUrl;
    }
    // 普通对象有 url
    if ("url" in item && item.url) {
      return item.url;
    }
  }

  return "";
});

/**
 * 判断当前媒体是否为图片
 */
const isCurrentMediaImage = computed(() => {
  if (!currentMedia.value) return true;

  if (typeof currentMedia.value === "string") {
    return !/\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)$/i.test(currentMedia.value);
  }

  if (typeof currentMedia.value === "object" && "type" in currentMedia.value) {
    return currentMedia.value.type === "image";
  }

  return true;
});

// ==================== 辅助方法 ====================

const isImage = (item: MediaItem): boolean => {
  if (!item) return false;

  if (typeof item === "string") {
    return !/\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)$/i.test(item);
  }

  if (typeof item === "object") {
    // 如果有 type 字段
    if ("type" in item) {
      return item.type === "image";
    }
    // 如果有 file 字段，根据 file type 判断
    if ("file" in item && item.file) {
      return item.file.type.startsWith("image/");
    }
  }

  return true;
};

const getMediaSrc = (item: MediaItem): string => {
  if (!item) return "";

  if (typeof item === "string") return item;

  if (typeof item === "object") {
    // 优先 previewUrl (临时文件)
    if ("previewUrl" in item && item.previewUrl) {
      return item.previewUrl;
    }
    // 其次 url
    if ("url" in item && item.url) {
      return item.url;
    }
  }

  return "";
};

const getMediaKey = (item: MediaItem, index: number) => {
  if (typeof item === "object" && item !== null && "id" in item) {
    return item.id;
  }
  if (typeof item === "object" && item !== null && "url" in item) {
    return `${item.url}-${index}`;
  }
  return `${String(item)}-${index}`;
};

const getPrevIndex = () => {
  if (mediaList.value.length <= 1) return currentIndex.value;
  return (currentIndex.value - 1 + mediaList.value.length) % mediaList.value.length;
};

const getNextIndex = () => {
  if (mediaList.value.length <= 1) return currentIndex.value;
  return (currentIndex.value + 1) % mediaList.value.length;
};

// ==================== 媒体样式 ====================

const mediaStyle = computed(() => ({
  maxWidth: "100%",
  maxHeight: "calc(100vh - 88px)",
  transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${scale.value}) rotate(${rotation.value}deg) scaleX(${flip.value.x}) scaleY(${flip.value.y})`,
  transformOrigin: "center center",
  transition: isDragging.value ? "none" : "transform 0.2s",
  objectFit: "contain",
  cursor: scale.value > 1 ? "grab" : "default",
}));

// ==================== 操作方法 ====================

const zoomIn = () => {
  if (scale.value < 3) {
    scale.value = Math.round((scale.value + 0.2) * 10) / 10;
  }
};

const zoomOut = () => {
  if (scale.value > 0.2) {
    scale.value = Math.round((scale.value - 0.2) * 10) / 10;
  }
};

const resetZoom = () => {
  scale.value = 1;
  position.value = { x: 0, y: 0 };
  rotation.value = 0;
  flip.value = { x: 1, y: 1 };
};

const rotateRight = () => {
  rotation.value = (rotation.value + 90) % 360;
};

const flipHorizontal = () => {
  flip.value.x = flip.value.x === 1 ? -1 : 1;
};

const flipVertical = () => {
  flip.value.y = flip.value.y === 1 ? -1 : 1;
};

const togglePlayPause = () => {
  if (videoRef.value) {
    if (isVideoPlaying.value) {
      videoRef.value.pause();
    } else {
      videoRef.value.play();
    }
  }
};

const toggleMute = () => {
  if (videoRef.value) {
    isVideoMuted.value = !isVideoMuted.value;
    videoRef.value.muted = isVideoMuted.value;
  }
};

const toggleFullscreen = () => {
  if (isEditingLock.value) {
    message.info("正在编辑中，无法进入全屏");
    return;
  }
  const container = document.querySelector(".preview-container");
  if (!isFullscreen.value) {
    container?.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
  isFullscreen.value = !isFullscreen.value;
};

// ==================== 切换媒体 (修复3: 增强稳定性) ====================

const switchMedia = (index: number) => {
  if (mediaList.value.length === 0) return;

  // 确保索引在有效范围内
  const targetIndex = Math.max(0, Math.min(index, mediaList.value.length - 1));

  // 如果索引没有变化，强制重新加载
  if (targetIndex === currentIndex.value) {
    // 强制刷新当前媒体
    isLoading.value = true;
    // 重置视频状态
    if (videoRef.value) {
      videoRef.value.pause();
      videoRef.value.currentTime = 0;
    }
    isVideoPlaying.value = false;
    // 重新加载
    setTimeout(() => {
      isLoading.value = false;
    }, 100);
    return;
  }

  // 更新索引
  emit("update:currentMediaIndex", targetIndex);

  // 重置缩放和位置
  resetZoom();

  // 显示加载状态
  isLoading.value = true;

  // 重置视频状态
  isVideoPlaying.value = false;
  isVideoMuted.value = false;

  // 如果之前有视频，暂停它
  if (videoRef.value) {
    videoRef.value.pause();
    videoRef.value.currentTime = 0;
  }
};

const prevMedia = () => {
  if (mediaList.value.length <= 1) return;
  switchMedia(getPrevIndex());
};

const nextMedia = () => {
  if (mediaList.value.length <= 1) return;
  switchMedia(getNextIndex());
};

// ==================== 其他操作 ====================

const deleteCurrentMedia = () => {
  if ("id" in currentMedia.value && currentMedia.value.id) {
    emit("delete-media", currentMedia.value.id);
    if (mediaList.value.length > 1) {
      const newIndex = currentIndex.value > 0 ? currentIndex.value - 1 : 0;
      switchMedia(newIndex);
    } else {
      closeModal();
    }
  }
};

const closeModal = () => {
  if (videoRef.value) {
    videoRef.value.pause();
  }
  if (isFullscreen.value) {
    document.exitFullscreen().catch(() => {});
  }
  emit("update:visible", false);
  emit("close");
  resetZoom();
  isFullscreen.value = false;
  isLoading.value = false;
  isVideoPlaying.value = false;
};

const downloadMedia = () => {
  if (!currentMediaSrc.value) return;
  try {
    const link = document.createElement("a");
    link.href = currentMediaSrc.value;
    let fileName = "media";
    if ("file" in currentMedia.value && currentMedia.value.file) {
      fileName = currentMedia.value.file.name;
    } else {
      const urlParts = currentMediaSrc.value.split("/");
      fileName = urlParts[urlParts.length - 1] || "media";
    }
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("下载失败:", error);
    alert("下载失败，请重试");
  }
};

const copyMediaLink = async () => {
  if (!currentMediaSrc.value) return;
  try {
    await navigator.clipboard.writeText(currentMediaSrc.value);
    alert("链接已复制到剪贴板");
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = currentMediaSrc.value;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    alert("链接已复制到剪贴板");
  }
};

// ==================== 拖拽功能 ====================

const startDrag = (e: MouseEvent | TouchEvent) => {
  if (scale.value <= 1) return;
  isDragging.value = true;
  const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
  const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
  dragStart.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y,
  };
  document.addEventListener("mousemove", handleDragMove);
  document.addEventListener("mouseup", stopDrag);
  document.addEventListener("touchmove", handleDragMove);
  document.addEventListener("touchend", stopDrag);
};

const handleDragMove = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;
  const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
  const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
  position.value = {
    x: clientX - dragStart.value.x,
    y: clientY - dragStart.value.y,
  };
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", handleDragMove);
  document.removeEventListener("mouseup", stopDrag);
  document.removeEventListener("touchmove", handleDragMove);
  document.removeEventListener("touchend", stopDrag);
};

// ==================== 滚轮缩放 ====================

const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  const newScale = Math.max(0.2, Math.min(3, scale.value + delta));
  scale.value = Math.round(newScale * 10) / 10;
};

// ==================== 媒体加载事件 ====================

const handleImageLoad = () => {
  if (imageRef.value) {
    mediaSize.value = {
      width: imageRef.value.naturalWidth,
      height: imageRef.value.naturalHeight,
    };
  }
  isLoading.value = false;
};

const handleVideoMetadata = () => {
  if (videoRef.value) {
    mediaSize.value = {
      width: videoRef.value.videoWidth,
      height: videoRef.value.videoHeight,
    };
    videoRef.value.muted = isVideoMuted.value;
    videoRef.value
      .play()
      .then(() => {
        isVideoPlaying.value = true;
      })
      .catch(() => {
        // 自动播放被阻止，静默处理
      });
  }
  isLoading.value = false;
};

const handleMediaError = () => {
  isLoading.value = false;
  console.error("媒体加载失败:", currentMediaSrc.value);
};

const handleThumbError = (index: number) => {
  console.warn(`缩略图 ${index + 1} 加载失败`);
};

// ==================== 键盘事件 ====================

const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.visible) return;

  // 防止在输入框中触发
  const target = e.target as HTMLElement;
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

  switch (e.key) {
    case "Escape":
      e.preventDefault();
      closeModal();
      break;
    case "ArrowLeft":
      e.preventDefault();
      prevMedia();
      break;
    case "ArrowRight":
      e.preventDefault();
      nextMedia();
      break;
    case "+":
    case "=":
      e.preventDefault();
      zoomIn();
      break;
    case "-":
      e.preventDefault();
      zoomOut();
      break;
    case "0":
      e.preventDefault();
      resetZoom();
      break;
    case " ":
      e.preventDefault();
      if (!isCurrentMediaImage.value) {
        togglePlayPause();
      }
      break;
    case "r":
    case "R":
      e.preventDefault();
      rotateRight();
      break;
    case "h":
    case "H":
      e.preventDefault();
      flipHorizontal();
      break;
    case "v":
    case "V":
      e.preventDefault();
      flipVertical();
      break;
  }
};

// ==================== 全屏变化事件 ====================

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

// ==================== 监听器 ====================

// 监听索引变化
watch(
  () => props.currentMediaIndex,
  (newIndex, oldIndex) => {
    if (newIndex !== oldIndex && mediaList.value.length > 0) {
      isLoading.value = true;
      isVideoPlaying.value = false;
      if (videoRef.value) {
        videoRef.value.pause();
        videoRef.value.currentTime = 0;
      }
    }
  },
);

// 监听媒体列表变化
watch(
  mediaList,
  (newList) => {
    if (newList.length === 0) {
      // 没有媒体，关闭预览
      closeModal();
      return;
    }

    // 如果当前索引超出范围，重置到第一个
    if (currentIndex.value >= newList.length) {
      emit("update:currentMediaIndex", 0);
      resetZoom();
    }
  },
  { deep: true },
);

// 监听可见性变化
watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      isLoading.value = false;
      isVideoPlaying.value = false;
      if (videoRef.value) {
        videoRef.value.pause();
      }
      resetZoom();
    } else {
      if (mediaList.value.length > 0) {
        isLoading.value = true;
        // 如果当前没有媒体，重置到第一个
        if (currentIndex.value >= mediaList.value.length) {
          emit("update:currentMediaIndex", 0);
        }
      }
    }
  },
);

// ==================== 生命周期 ====================

onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("fullscreenchange", handleFullscreenChange);

  // 如果可见且有媒体，加载
  if (props.visible && mediaList.value.length > 0) {
    isLoading.value = true;
  }
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  stopDrag();
  if (videoRef.value) {
    videoRef.value.pause();
  }
  if (isFullscreen.value) {
    document.exitFullscreen().catch(() => {});
  }
});

// ==================== 暴露方法 ====================

defineExpose({
  switchMedia,
  prevMedia,
  nextMedia,
  resetZoom,
  zoomIn,
  zoomOut,
});
</script>

<style scoped>
/* ==================== 全局重置 ==================== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

button {
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
  font-size: inherit;
}

/* ==================== 容器 ==================== */
.preview-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #fff;
}

/* ==================== 过渡动画 ==================== */
.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.2s;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}

/* ==================== 头部 ==================== */
.preview-header {
  height: 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10;
}

.header-left,
.header-right {
  width: 40px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.media-info-container {
  text-align: center;
}

.title-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.group-id {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.group-name {
  font-size: 14px;
  color: #ccc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.media-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.media-meta .divider {
  width: 1px;
  height: 10px;
  background: rgba(255, 255, 255, 0.2);
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
  color: #ccc;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* ==================== 主体 ==================== */
.preview-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ==================== 侧边栏缩略图 ==================== */
.sidebar {
  width: 80px;
  background: rgba(0, 0, 0, 0.6);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  padding: 12px 0;
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar::-webkit-scrollbar {
  width: 3px;
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.thumbnail-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 8px;
}

.thumbnail-item {
  border-radius: 8px;
  overflow: hidden;
  opacity: 0.6;
  transition: all 0.2s;
  border: 2px solid transparent;
  cursor: pointer;
}

.thumbnail-item.active {
  opacity: 1;
  border-color: #007aff;
}

.thumbnail-item:hover {
  opacity: 0.9;
}

.thumbnail-inner {
  width: 64px;
  height: 64px;
  position: relative;
  border-radius: 6px;
  overflow: hidden;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ==================== 主预览区 ==================== */
.preview-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 16px;
}

.media-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.media-content {
  cursor: grab;
  user-select: none;
  max-width: 100%;
  max-height: calc(100vh - 88px);
}

.media-content:active {
  cursor: grabbing;
}

/* ==================== 导航按钮 ==================== */
.nav-preview {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0.4;
  transition: all 0.2s;
  cursor: pointer;
  z-index: 10;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
}

.nav-preview:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.5);
}

.left-preview {
  left: 20px;
}

.right-preview {
  right: 20px;
}

/* ==================== 加载状态 ==================== */
.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ==================== 错误状态 ==================== */
.media-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #888;
}

.error-desc {
  font-size: 14px;
}

.retry-btn {
  padding: 6px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  font-size: 13px;
  color: #ccc;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
}

.retry-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* ==================== 底部控制栏 ==================== */
.control-bar {
  height: 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.8);
  flex-shrink: 0;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
  color: #ccc;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.zoom-value {
  font-size: 13px;
  color: #ccc;
  min-width: 40px;
  text-align: center;
}

.control-bar .divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 4px;
}

.delete-btn:hover {
  color: #ff6b6b;
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }

  .thumbnail-inner {
    width: 48px;
    height: 48px;
  }

  .nav-preview {
    width: 32px;
    height: 32px;
  }

  .group-name {
    max-width: 180px;
    font-size: 12px;
  }

  .control-btn {
    width: 28px;
    height: 28px;
  }

  .control-btn svg {
    width: 16px;
    height: 16px;
  }
}
</style>
