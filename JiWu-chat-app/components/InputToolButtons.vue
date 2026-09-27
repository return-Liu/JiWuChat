<template>
  <div class="input-tools-left">
    <!-- 表情包 -->
    <div class="tooltip-wrapper">
      <div
        class="input-tool-btn clickable-text"
        :class="{ disabled: disabled }"
        @mouseenter="showTooltip('emoji')"
        @mouseleave="hideTooltip"
        @click="$emit('click')"
      >
        <i class="iconfont icon-a-087_biaoqing tool-icon"></i>
      </div>
      <transition name="tooltip-fade">
        <div v-if="visibleTooltip === 'emoji'" class="custom-tooltip">
          <div class="tooltip-arrow"></div>
          表情包
        </div>
      </transition>
    </div>

    <!-- 图片 -->
    <div class="tooltip-wrapper">
      <div
        class="input-tool-btn clickable-text"
        :class="{ disabled: disabled }"
        @mouseenter="showTooltip('image')"
        @mouseleave="hideTooltip"
        @click="$emit('select-media')"
      >
        <i class="iconfont icon-a-087_zhaopian tool-icon"></i>
      </div>
      <transition name="tooltip-fade">
        <div v-if="visibleTooltip === 'image'" class="custom-tooltip">
          <div class="tooltip-arrow"></div>
          图片
        </div>
      </transition>
    </div>

    <!-- 语音 -->
    <div class="tooltip-wrapper">
      <div
        class="input-tool-btn clickable-text"
        :class="{ disabled: disabled }"
        @mouseenter="showTooltip('voice')"
        @mouseleave="hideTooltip"
        @click="$emit('voice-message')"
      >
        <i class="iconfont icon-a-087_yuyin-14 tool-icon"></i>
      </div>
      <transition name="tooltip-fade">
        <div v-if="visibleTooltip === 'voice'" class="custom-tooltip">
          <div class="tooltip-arrow"></div>
          语音
        </div>
      </transition>
    </div>

    <!-- 文件 -->
    <div class="tooltip-wrapper">
      <div
        class="input-tool-btn clickable-text"
        :class="{ disabled: disabled }"
        @mouseenter="showTooltip('file')"
        @mouseleave="hideTooltip"
        @click="$emit('select-file')"
      >
        <i class="iconfont icon-a-087_wenjian tool-icon"></i>
      </div>
      <transition name="tooltip-fade">
        <div v-if="visibleTooltip === 'file'" class="custom-tooltip">
          <div class="tooltip-arrow"></div>
          文件
        </div>
      </transition>
    </div>

    <!-- 截图下拉菜单 -->
    <!-- <div class="dropdown-wrapper" ref="dropdownWrapperRef">
      <div
        class="input-tool-btn clickable-text"
        :class="{ disabled: disabled }"
        @click="toggleDropdown"
      >
        <i class="iconfont icon-5jietu-1 tool-icon"></i>
        <i
          class="iconfont icon-jiantou_down dropdown-arrow tool-icon"
          :class="{ 'arrow-rotated': isDropdownVisible }"
        ></i>
      </div>

      <transition name="dropdown-fade">
        <div v-if="isDropdownVisible" class="custom-dropdown-menu" @click.stop>
          <div class="dropdown-arrow-pointer"></div>
          <div class="custom-dropdown-item" @click="handleScreenCapture">
            <div class="dropdown-item-content">
              <i class="iconfont icon-5jietu-1 dropdown-icon tool-icon"></i>
              <span class="dropdown-text">截图</span>
              <span class="dropdown-shortcut">Ctrl + Alt + A</span>
            </div>
          </div>
        </div>
      </transition>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

interface Props {
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

defineEmits<{
  (e: "click"): void;
  (e: "select-media"): void;
  (e: "voice-message"): void;
  (e: "select-file"): void;
  (e: "screen-capture"): void;
}>();

const isDropdownVisible = ref(false);
const dropdownWrapperRef = ref<HTMLElement | null>(null);
const visibleTooltip = ref<string | null>(null);

const toggleDropdown = () => {
  isDropdownVisible.value = !isDropdownVisible.value;
};

const closeDropdown = () => {
  isDropdownVisible.value = false;
};

const handleScreenCapture = () => {
  closeDropdown();
  // 由父组件处理具体逻辑
};

const showTooltip = (type: string) => {
  if (!props.disabled) {
    visibleTooltip.value = type;
  }
};

const hideTooltip = () => {
  visibleTooltip.value = null;
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownWrapperRef.value && !dropdownWrapperRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
};

const handleEscKey = (event: KeyboardEvent) => {
  if (event.key === "Escape") closeDropdown();
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleEscKey);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleEscKey);
});
</script>

<style scoped>
.input-tools-left {
  display: flex;
  gap: 3px;
}

.input-tool-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #5f5f5f;
}

.input-tool-btn:hover {
  background-color: var(--theme-light);
}

.tool-icon {
  font-size: 26px;
}

.input-tool-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.tooltip-wrapper {
  position: relative;
}

.custom-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.75);
  color: #ffffff;
  font-size: 12px;
  border-radius: 6px;
  white-space: nowrap;
  z-index: 1001;
  pointer-events: none;
}

.tooltip-arrow {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid rgba(0, 0, 0, 0.75);
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.15s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}

.dropdown-arrow {
  font-size: 12px;
  margin-left: 2px;
  transition: transform 0.2s;
}

.arrow-rotated {
  transform: rotate(180deg);
}

.dropdown-wrapper {
  position: relative;
}

.custom-dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  min-width: 240px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  padding: 8px 0;
  z-index: 1000;
}

.dropdown-arrow-pointer {
  position: absolute;
  bottom: -6px;
  left: 12px;
  width: 12px;
  height: 12px;
  background: #ffffff;
  transform: rotate(45deg);
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.05);
}

.custom-dropdown-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.custom-dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dropdown-icon {
  font-size: 18px;
}

.dropdown-text {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.dropdown-shortcut {
  font-size: 12px;
  color: #999;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
}
</style>
