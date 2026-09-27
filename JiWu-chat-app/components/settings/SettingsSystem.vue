<template>
  <div class="tab-content">
    <div class="content-header">
      <div>
        <h3 class="content-title">系统</h3>
        <p class="content-desc">管理缓存、日志上报和账号安全</p>
      </div>
    </div>

    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">存储与日志</span>
        <span class="group-desc">管理缓存数据和日志上报</span>
      </div>
      <div class="setting-item">
        <div class="item-info">
          <span class="label">缓存管理</span>
          <span class="desc">清理应用缓存数据</span>
        </div>
        <button class="action-btn" @click.stop="clearCache">清理</button>
      </div>

      <div class="setting-item">
        <div class="item-info">
          <span class="label">日志上报</span>
          <span class="desc">帮助改进应用体验</span>
        </div>
        <div
          class="setting-switch"
          :class="{ active: logReportingEnabled }"
          @click.stop="logReportingEnabled = !logReportingEnabled"
        >
          <span class="switch-handle"></span>
        </div>
      </div>
    </div>

    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">账号安全</span>
        <span class="group-desc">账号注销等安全操作</span>
      </div>
      <div class="setting-item">
        <div class="item-info">
          <span class="label">注销账号</span>
          <span class="desc danger">注销后所有数据将被清除，此操作不可恢复</span>
        </div>
        <button class="action-btn danger" @click.stop="goToDeleteAccount">确认注销</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "#app";
import { message, Modal } from "ant-design-vue";

const router = useRouter();

const logReportingEnabled = ref(true);

const clearCache = () => {
  Modal.confirm({
    title: "清理缓存",
    content: "确定要清理所有缓存数据吗？",
    okText: "确定",
    cancelText: "取消",
    onOk() {
      message.success("缓存已清理");
    },
  });
};

const goToDeleteAccount = () => router.push("/deleteaccount");

watch(logReportingEnabled, (val) => localStorage.setItem("logReportingEnabled", String(val)));
</script>
