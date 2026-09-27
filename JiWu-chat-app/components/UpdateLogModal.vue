<template>
  <div v-if="visible" class="modal-mask">
    <div class="modal-wrapper">
      <div class="modal-container">
        <div class="modal-header">
          <span>{{ isEdit ? "编辑" : "新增" }}</span>
          <button class="close-btn" @click="handleCancel">×</button>
        </div>

        <div class="modal-body">
          <!-- 标题 -->
          <div class="field">
            <label>标题 <span style="color: red">*</span></label>
            <input v-model="formState.title" placeholder="请输入标题" />
          </div>

          <!-- 摘要 -->
          <div class="field">
            <label>摘要</label>
            <input v-model="formState.summary" placeholder="请输入摘要" />
          </div>

          <!-- 版本号 -->
          <div class="field">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="formState.autoGenerateVersion"
                @change="handleAutoGenerateChange"
              />
              自动生成版本号
            </label>
          </div>

          <div class="field" v-if="formState.autoGenerateVersion">
            <label>版本类型</label>
            <div class="btn-group">
              <button
                v-for="type in versionTypes"
                :key="type.value"
                :class="{ active: formState.versionType === type.value }"
                @click="formState.versionType = type.value"
              >
                {{ type.label }}
              </button>
            </div>
          </div>

          <div class="field" v-else>
            <label>版本号 <span style="color: red">*</span></label>
            <input v-model="formState.version" placeholder="v1.2.3" />
          </div>

          <!-- 更新类型 -->
          <div class="field">
            <label>更新类型</label>
            <div class="btn-group">
              <button
                v-for="type in updateTypes"
                :key="type.value"
                :class="{ active: formState.updateType === type.value }"
                @click="formState.updateType = type.value"
              >
                {{ type.label }}
              </button>
            </div>
          </div>

          <!-- 平台 -->
          <div class="field">
            <label>平台</label>
            <div class="btn-group">
              <button
                v-for="platform in platformOptions"
                :key="platform.value"
                :class="{ active: formState.platform === platform.value }"
                @click="formState.platform = platform.value"
              >
                {{ platform.label }}
              </button>
            </div>
          </div>

          <!-- 标签颜色 -->
          <div class="field">
            <label>标签颜色</label>
            <div class="color-list">
              <button
                v-for="c in colorOptions"
                :key="c.value"
                class="color-option"
                :style="{ background: c.value }"
                :class="{ active: formState.tagColor === c.value }"
                @click="formState.tagColor = c.value"
              />
            </div>
          </div>

          <!-- 重要标记 -->
          <div class="field">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formState.isImportant" />
              标记为重要
            </label>
          </div>

          <!-- 封面图 -->
          <div class="field">
            <label>封面图（最多6张）</label>
            <CoverUpload
              :model-value="coverPreviewUrls"
              :max-count="6"
              @upload="handleCoverUpload"
              @remove="removeCover"
            />
            <!-- ✅ 修复：添加图片预览 -->
            <div v-if="coverPreviewUrls.length" class="cover-preview-list">
              <div v-for="(url, idx) in coverPreviewUrls" :key="idx" class="cover-preview-item">
                <img :src="url" alt="封面图" />
                <button class="remove-cover-btn" @click="removeCover(idx)">×</button>
              </div>
            </div>
          </div>

          <!-- 内容 -->
          <div class="field">
            <label>内容 <span style="color: red">*</span></label>
            <textarea
              v-model="formState.content"
              rows="8"
              placeholder="支持 #PC客户端 和 #安卓版 自动分栏"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" @click="handleCancel">取消</button>
          <button class="submit-btn" @click="handleOk" :disabled="loading">
            {{ loading ? "提交中" : "确定" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { message } from "ant-design-vue";
import request from "../untils/request";
// import CoverUpload from "./CoverUpload.vue"; // 如果有这个组件

const COVER_SEPARATOR = "|||";

const props = defineProps<{
  visible: boolean;
  editingLog?: any | null;
  currentVersion?: string;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "success"): void;
  (e: "cancel"): void;
}>();

// 常量配置
const colorOptions = [
  { value: "#0969da" },
  { value: "#1a7f37" },
  { value: "#9a6700" },
  { value: "#cf222e" },
  { value: "#8250df" },
];

const versionTypes = [
  { value: "major", label: "主版本" },
  { value: "minor", label: "次版本" },
  { value: "patch", label: "修订版" },
];

const updateTypes = [
  { value: "feature", label: "新功能" },
  { value: "optimization", label: "优化" },
  { value: "fix", label: "修复" },
  { value: "other", label: "其他" },
];

const platformOptions = [
  { value: "all", label: "所有平台" },
  { value: "web", label: "PC客户端" },
  { value: "mobile", label: "安卓版" },
];

// 状态
const loading = ref(false);
const coverPreviewUrls = ref<string[]>([]);

const formState = reactive({
  version: "",
  title: "",
  summary: "",
  content: "",
  updateType: "other",
  tagColor: "#0969da",
  isImportant: false,
  coverImage: "", // ✅ 保留这个字段用于存储
  autoGenerateVersion: true,
  versionType: "patch",
  platform: "all",
});

const isEdit = computed(() => !!props.editingLog);

// ✅ 修复：监听弹窗打开，重置表单
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      if (props.editingLog) {
        // 编辑模式 - 填充数据
        const log = props.editingLog;
        Object.assign(formState, {
          version: log.version || "",
          title: log.title || "",
          summary: log.summary || "",
          content: log.content || "",
          updateType: log.updateType || "other",
          tagColor: log.tagColor || "#0969da",
          isImportant: log.isImportant || false,
          coverImage: log.coverImage || "",
          autoGenerateVersion: false,
          versionType: "patch",
          platform: log.platform || "all",
        });
        // ✅ 解析封面图
        coverPreviewUrls.value = (log.coverImage || "").split(COVER_SEPARATOR).filter(Boolean);
      } else {
        // 新增模式 - 重置表单
        Object.assign(formState, {
          version: props.currentVersion || "",
          title: "",
          summary: "",
          content: "",
          updateType: "other",
          tagColor: "#0969da",
          isImportant: false,
          coverImage: "",
          autoGenerateVersion: true,
          versionType: "patch",
          platform: "all",
        });
        coverPreviewUrls.value = [];
      }
    }
  },
  { immediate: true, deep: true }, // ✅ 添加 deep: true
);

// 方法
const handleAutoGenerateChange = () => {
  if (formState.autoGenerateVersion) {
    formState.version = "";
  } else {
    formState.version = props.currentVersion || formState.version;
  }
};

// ✅ 修复：封面图上传处理
const handleCoverUpload = async (files: FileList) => {
  // 检查数量限制
  if (coverPreviewUrls.value.length + files.length > 6) {
    message.warning("最多只能上传6张图片");
    return;
  }

  const fd = new FormData();
  for (let i = 0; i < files.length; i++) {
    fd.append("covers", files[i]);
  }

  try {
    const res = await request.post("/updatelogs/upload-cover", fd);
    const urls = res.data?.urls || res.data?.data?.urls || [];
    const singleUrl = res.data?.url || res.data?.data?.url;

    if (urls.length > 0) {
      urls.forEach((item: any) => {
        const u = typeof item === "string" ? item : item.url;
        if (u && coverPreviewUrls.value.length < 6) {
          coverPreviewUrls.value.push(u);
        }
      });
      message.success(`成功上传 ${urls.length} 张图片`);
    } else if (singleUrl) {
      coverPreviewUrls.value.push(singleUrl);
      message.success("上传成功");
    } else {
      message.error("上传失败");
    }
  } catch (error) {
    console.error("上传失败:", error);
    message.error("上传失败");
  }
};

// ✅ 修复：移除封面图
const removeCover = (index: number) => {
  coverPreviewUrls.value.splice(index, 1);
};

// ✅ 修复：提交表单
const handleOk = async () => {
  // 验证必填字段
  if (!formState.title || !formState.title.trim()) {
    return message.warning("请输入标题");
  }

  if (!formState.content || !formState.content.trim()) {
    return message.warning("请输入内容");
  }

  if (!formState.autoGenerateVersion && !formState.version) {
    return message.warning("请输入版本号");
  }

  loading.value = true;
  try {
    // ✅ 构建 payload
    const payload = {
      version: formState.version,
      title: formState.title.trim(),
      summary: formState.summary.trim(),
      content: formState.content.trim(),
      updateType: formState.updateType,
      tagColor: formState.tagColor,
      isImportant: formState.isImportant,
      platform: formState.platform,
      coverImage: coverPreviewUrls.value.join(COVER_SEPARATOR),
    };

    let response;
    if (isEdit.value && props.editingLog?.id) {
      response = await request.put(`/updatelogs/${props.editingLog.id}`, payload);
    } else {
      response = await request.post("/updatelogs", payload);
    }

    message.success(isEdit.value ? "修改成功" : "创建成功");
    emit("success");
    emit("update:visible", false);
  } catch (error: any) {
    console.error("操作失败:", error);
    message.error(error?.message || "操作失败");
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  emit("update:visible", false);
  emit("cancel");
};
</script>

<style lang="scss" scoped>
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-container {
  background: var(--card-bg);
  border-radius: 8px;
  width: 580px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
  flex-shrink: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-tertiary);
  padding: 0 4px;
  line-height: 1;

  &:hover {
    color: var(--text-primary);
  }
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--bg-tertiary);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;

    &:hover {
      background: var(--text-tertiary);
    }
  }

  scrollbar-width: thin;
  scrollbar-color: var(--border-color) var(--bg-tertiary);
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.field {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 6px;
    color: var(--text-primary);
  }

  input,
  textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 13px;
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: var(--purple-color);
    }
  }

  textarea {
    resize: vertical;
    min-height: 120px;
    font-family: inherit;
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: normal !important;
  cursor: pointer;
  color: var(--text-primary);

  input {
    width: auto !important;
  }
}

.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  button {
    padding: 5px 12px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 12px;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--bg-hover);
    }

    &.active {
      background: var(--purple-color);
      border-color: var(--purple-color);
      color: #fff;

      &:hover {
        opacity: 0.85;
      }
    }
  }
}

.color-list {
  display: flex;
  gap: 8px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.05);
  }

  &.active {
    border-color: var(--text-primary);
    transform: scale(1.1);
  }
}

// 封面图预览样式
.cover-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.cover-preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--border-color);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .remove-cover-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    border: none;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba(0, 0, 0, 0.8);
    }
  }
}

.cancel-btn,
.submit-btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.cancel-btn {
  background: var(--bg-tertiary);
  color: var(--text-primary);

  &:hover:not(:disabled) {
    background: var(--bg-hover);
  }
}

.submit-btn {
  background: var(--purple-color);
  color: #fff;

  &:hover:not(:disabled) {
    opacity: 0.85;
  }
}

@media (max-width: 768px) {
  .modal-container {
    width: 100%;
    max-height: 95vh;
    margin: 10px;
    border-radius: 8px;
  }

  .modal-body {
    padding: 16px;
  }
}
</style>
