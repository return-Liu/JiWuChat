<template>
  <div class="code-block">
    <i class="iconfont icon-fuzhi1 copy-btn" title="复制代码" @click="copyCode"></i>
    <pre><code><slot /></code></pre>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: "copy"): void;
}>();

async function copyCode() {
  const slotContent = useSlots().default?.();
  let codeText = "";

  if (slotContent) {
    // 提取文本内容
    const extractText = (nodes: any[]): string => {
      let text = "";
      for (const node of nodes) {
        if (typeof node === "string") {
          text += node;
        } else if (node.children) {
          text += extractText(Array.isArray(node.children) ? node.children : [node.children]);
        }
      }
      return text;
    };
    codeText = extractText(slotContent);
  }

  await navigator.clipboard.writeText(codeText.trim());
  emit("copy");
}
</script>

<style scoped>
.code-block {
  position: relative;
  border-radius: 8px;
  padding: 16px 20px;
  margin: 14px 0;
  overflow-x: auto;
  border: 1px solid var(--border-color);
  background: transparent !important;
}

.copy-btn {
  position: absolute;
  top: 3px;
  right: 5px;
  font-size: 18px;
  color: var(--text-secondary);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.24s ease,
    color 0.2s;
  z-index: 2;
  user-select: none;
}

.code-block:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  color: #5d33f6;
}

.code-block pre {
  margin: 0;
  line-height: 1.65;
}

.code-block code {
  font-family: "Alimama", Helvetica, sans-serif;
  font-size: 13px;
  color: var(--text-primary);
  background: transparent;
  padding: 0;
  font-weight: 500;
}
</style>
