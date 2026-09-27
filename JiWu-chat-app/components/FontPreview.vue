<template>
  <div class="font-preview-container">
    <!-- 文字大小调节 -->
    <div class="setting-item">
      <div class="item-info">
        <span class="label">文字大小</span>
        <span class="desc">调整界面文字显示大小</span>
      </div>
      <div class="item-control">
        <button class="size-btn" @click="decreaseFontSize" :disabled="localFontSize <= 12">
          A-
        </button>
        <span class="size-value">{{ localFontSize }}px</span>
        <button class="size-btn" @click="increaseFontSize" :disabled="localFontSize >= 20">
          A+
        </button>
      </div>
    </div>

    <!-- 文字字体选择 -->
    <div class="setting-item">
      <div class="item-info">
        <span class="label">文字字体</span>
        <span class="desc">选择不同字体风格</span>
      </div>
      <a-select
        v-model:value="localFontFamily"
        :options="fontOptions"
        style="width: 160px"
        @change="handleFontFamilyChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useUiSettings } from "../stores/uiSettings";
import type { FontOption } from "../stores/uiSettings";

interface Props {
  modelValue?: {
    fontSize: number;
    fontFamily: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    fontSize: 14,
    fontFamily: "'AlimamaShuHeiTi'",
  }),
});

const emit = defineEmits<{
  (e: "update:modelValue", value: { fontSize: number; fontFamily: string }): void;
}>();

const uiSettingsStore = useUiSettings();

const localFontSize = ref(uiSettingsStore.fontSizeNumber);
const localFontFamily = ref(uiSettingsStore.fontFamily);

const availableFonts = computed(() => uiSettingsStore.availableFonts);

const fontOptions = computed(() => {
  return availableFonts.value.map((font) => ({
    label: font.label,
    value: font.value,
  }));
});

const decreaseFontSize = () => {
  if (localFontSize.value > 12) {
    const newSize = localFontSize.value - 2;
    localFontSize.value = newSize;
    handleFontSizeChange(newSize);
  }
};

const increaseFontSize = () => {
  if (localFontSize.value < 20) {
    const newSize = localFontSize.value + 2;
    localFontSize.value = newSize;
    handleFontSizeChange(newSize);
  }
};

watch(
  () => uiSettingsStore.fontSizeNumber,
  (newValue) => {
    localFontSize.value = newValue;
  },
);

watch(
  () => uiSettingsStore.fontFamily,
  (newValue) => {
    localFontFamily.value = newValue;
  },
);

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue.fontSize !== uiSettingsStore.fontSizeNumber) {
      localFontSize.value = newValue.fontSize;
    }
    if (newValue.fontFamily !== uiSettingsStore.fontFamily) {
      localFontFamily.value = newValue.fontFamily;
    }
  },
  { deep: true },
);

const handleFontSizeChange = (value: number) => {
  uiSettingsStore.setFontSize(String(value));
  emit("update:modelValue", {
    fontSize: value,
    fontFamily: localFontFamily.value,
  });
};

const handleFontFamilyChange = (value: string) => {
  uiSettingsStore.setFontFamily(value);
  emit("update:modelValue", {
    fontSize: localFontSize.value,
    fontFamily: value,
  });
};
</script>

<style scoped lang="scss">
.font-preview-container {
  width: 100%;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .label {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
  }

  .desc {
    font-size: 12px;
    color: var(--text-tertiary);
  }
}

.item-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.size-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  transition: all 0.2s;
}

.size-btn:hover:not(:disabled) {
  background: var(--bg-hover);
}

.size-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.size-value {
  font-size: 14px;
  color: var(--text-primary);
  min-width: 40px;
  text-align: center;
}

:deep(.ant-select-selector) {
  border-radius: 6px !important;
  border-color: var(--border-color) !important;
  background: var(--card-bg) !important;
  box-shadow: none !important;
}

:deep(.ant-select-selector:hover) {
  border-color: var(--color-brand) !important;
}

:deep(.ant-select-focused .ant-select-selector) {
  border-color: var(--color-brand) !important;
}

:deep(.ant-select-selection-item) {
  color: var(--text-primary) !important;
}

:deep(.ant-select-arrow) {
  color: var(--text-secondary) !important;
}
</style>
