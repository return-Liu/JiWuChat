<template>
  <div class="cover-upload">
    <div class="cover-gallery">
      <div v-for="(img, idx) in modelValue" :key="idx" class="cover-item">
        <img :src="img" alt="封面图" />
        <button class="remove-btn" @click="removeCover(idx)">×</button>
      </div>
      <div v-if="modelValue.length < maxCount" class="upload-trigger" @click="triggerUpload">
        <span class="plus-icon">+</span>
        <span class="upload-text">上传封面</span>
        <span class="count-text">{{ modelValue.length }}/{{ maxCount }}</span>
      </div>
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileChange"
      multiple
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { message } from "ant-design-vue";

const props = defineProps<{
  modelValue: string[];
  maxCount?: number;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void;
  (e: "upload", files: FileList): void;
  (e: "remove", index: number): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);

const triggerUpload = () => {
  if (props.modelValue.length >= (props.maxCount || 6)) {
    return message.warning(`最多上传${props.maxCount || 6}张封面图`);
  }
  fileInput.value?.click();
};

const handleFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length === 0) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith("image/")) {
      message.warning(`"${file.name}" 不是图片文件`);
      input.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.warning(`"${file.name}" 超过5MB限制`);
      input.value = "";
      return;
    }
  }

  emit("upload", files);
  input.value = "";
};

const removeCover = (index: number) => {
  emit("remove", index);
};
</script>

<style lang="scss" scoped>
.cover-upload {
  margin-top: 4px;
}

.cover-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cover-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #ddd;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .remove-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    border: none;
    font-size: 14px;
    line-height: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;

    &:hover {
      background: #e53935;
    }
  }
}

.upload-trigger {
  width: 100px;
  height: 100px;
  border: 2px dashed #ccc;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  background: #fafafa;

  &:hover {
    border-color: #4a7cf7;
    background: #f0f5ff;

    .plus-icon {
      color: #4a7cf7;
    }
  }

  .plus-icon {
    font-size: 24px;
    color: #999;
    transition: color 0.2s;
  }

  .upload-text {
    font-size: 12px;
    color: #666;
  }

  .count-text {
    font-size: 11px;
    color: #999;
  }
}
</style>
