<!-- UpdateModal.vue -->
<template>
  <a-modal
    :open="visible"
    title="群成员更新"
    :footer="null"
    width="560px"
    :mask-closable="true"
    @cancel="handleClose"
  >
    <div class="update-modal-content">
      <div class="update-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab-btn', { active: activeTab === tab.key }]"
          @click="handleTabChange(tab.key)"
        >
          {{ tab.label }}
          <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <div class="update-list" v-loading="loading">
        <div v-if="!loading && filteredUpdates.length === 0" class="empty-updates">
          <p>暂无更新</p>
        </div>
        <div
          v-for="item in filteredUpdates"
          :key="item.id"
          class="update-item"
        >
          <img :src="item.avatar || defaultAvatar" class="update-avatar" @error="handleAvatarError" />
          <div class="update-info">
            <div class="update-name">{{ item.name }}</div>
            <div class="update-desc">{{ item.description }}</div>
          </div>
          <span class="update-time">{{ item.time }}</span>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "ant-design-vue";
import request from "../untils/request";

const props = defineProps<{
  visible: boolean;
  groupId: string;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
}>();

const defaultAvatar = "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png";

const activeTab = ref("all");
const loading = ref(false);
const updates = ref<any[]>([]);

const tabs = computed(() => {
  const counts = getTabCounts();
  return [
    { key: "all", label: "全部", count: counts.all },
    { key: "joined", label: "新加入", count: counts.joined },
    { key: "updated", label: "资料更新", count: counts.updated },
    { key: "online", label: "上线", count: counts.online },
  ];
});

const filteredUpdates = computed(() => {
  if (activeTab.value === "all") return updates.value;
  return updates.value.filter((u) => u.type === activeTab.value);
});

const getTabCounts = () => {
  const counts = { all: 0, joined: 0, updated: 0, online: 0 };
  updates.value.forEach((u) => {
    counts.all++;
    if (u.type === "joined") counts.joined++;
    else if (u.type === "updated") counts.updated++;
    else if (u.type === "online") counts.online++;
  });
  return counts;
};

// 获取更新数据
const fetchUpdates = async () => {
  if (!props.groupId) return;
  loading.value = true;
  try {
    const { data } = await request.get(`/group/${props.groupId}/updates`);
    updates.value = data?.list || [];
  } catch (error) {
    console.error("获取群更新失败:", error);
    message.error("获取更新数据失败");
  } finally {
    loading.value = false;
  }
};

const handleTabChange = (key: string) => {
  activeTab.value = key;
};

const handleClose = () => {
  emit("update:visible", false);
};

const handleAvatarError = (e: Event) => {
  (e.target as HTMLImageElement).src = defaultAvatar;
};

// 监听弹窗打开，加载数据
watch(
  () => props.visible,
  (val) => {
    if (val) {
      activeTab.value = "all";
      fetchUpdates();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.update-modal-content {
  padding: 4px 0;
}

.update-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
}

.tab-btn {
  padding: 6px 16px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.tab-btn:hover {
  background: #f5f5f5;
}

.tab-btn.active {
  background: #1677ff;
  color: #ffffff;
}

.tab-count {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.3);
  padding: 0 6px;
  border-radius: 10px;
  font-weight: 400;
}

.tab-btn.active .tab-count {
  background: rgba(255, 255, 255, 0.25);
}

.tab-btn:not(.active) .tab-count {
  background: #f0f0f0;
  color: #999;
}

.update-list {
  max-height: 360px;
  overflow-y: auto;
  min-height: 100px;
}

.update-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.2s;
}

.update-item:hover {
  background: #fafafa;
}

.update-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.update-info {
  flex: 1;
  min-width: 0;
}

.update-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.update-desc {
  font-size: 13px;
  color: #666;
  margin-top: 2px;
}

.update-time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.empty-updates {
  text-align: center;
  padding: 40px 0;
  color: #999;
}

.update-list::-webkit-scrollbar {
  width: 4px;
}
.update-list::-webkit-scrollbar-track {
  background: transparent;
}
.update-list::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}
</style>