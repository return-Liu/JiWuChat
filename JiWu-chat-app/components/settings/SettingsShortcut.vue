<template>
  <div class="tab-content">
    <div class="content-header">
      <div>
        <h3 class="content-title">快捷键</h3>
        <p class="content-desc">查看和自定义键盘快捷操作</p>
      </div>
    </div>

    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">键盘快捷操作</span>
        <span class="group-desc">查看和修改快捷键组合</span>
      </div>
      <div v-for="shortcut in shortcutList" :key="shortcut.id" class="setting-item">
        <div class="item-info">
          <span class="label">{{ shortcut.name }}</span>
          <span class="desc">{{ shortcut.desc }}</span>
        </div>
        <div class="item-right">
          <kbd class="shortcut-key">{{ shortcut.key }}</kbd>
          <button class="action-btn" @click.stop="editShortcut(shortcut)">修改</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { message } from "ant-design-vue";

const shortcutList = ref([
  { id: 1, name: "打开设置", desc: "快速打开设置面板", key: "Ctrl + ," },
  { id: 2, name: "搜索消息", desc: "全局搜索消息内容", key: "Ctrl + F" },
  { id: 3, name: "新建会话", desc: "发起新的聊天会话", key: "Ctrl + N" },
  { id: 4, name: "发送消息", desc: "快速发送当前输入内容", key: "Enter" },
]);

const editShortcut = (shortcut: any) => {
  message.info(`修改 ${shortcut.name} 快捷键`);
};
</script>
