<template>
  <section class="changelog-page">
    <div class="changelog-layout">
      <aside class="changelog-sidebar">
        <h3 class="changelog-sidebar-title">版本列表</h3>
        <div v-if="loading" class="changelog-loading">加载中...</div>
        <ul v-else class="changelog-version-nav">
          <li
            class="changelog-version-item"
            :class="{ active: selectedVersion === '' }"
            @click="selectVersion('')"
          >
            全部版本
          </li>
          <li
            v-for="v in versions"
            :key="v"
            class="changelog-version-item"
            :class="{ active: selectedVersion === v }"
            @click="selectVersion(v)"
          >
            {{ v }}
          </li>
        </ul>
      </aside>
      <main class="changelog-main">
        <UpdateLogList
          :key="selectedVersion"
          ref="changelogListRef"
          :show-header="false"
          :admin-mode="false"
        />
      </main>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import UpdateLogList from "../../components/UpdateLogList.vue";
import request from "../../untils/request";

const versions = ref<string[]>([]);
const selectedVersion = ref("");
const changelogListRef = ref<InstanceType<typeof UpdateLogList> | null>(null);
const loading = ref(false);

async function fetchVersions() {
  loading.value = true;
  try {
    const res = await request.get("/updatelog");
    const list = Array.isArray(res.data) ? res.data : res.data?.logs || [];
    const vList = ([...new Set(list.map((l: any) => String(l.version)))] as string[]).sort((a, b) =>
      b.localeCompare(a),
    );
    versions.value = vList;
  } catch {
    versions.value = [];
  } finally {
    loading.value = false;
  }
}

function selectVersion(version: string) {
  selectedVersion.value = version;
  changelogListRef.value?.selectTag?.(version);
}

onMounted(() => {
  fetchVersions();
});
</script>

<style scoped>
.changelog-page {
  padding: 0;
  min-height: calc(100vh - 200px);
}

.changelog-layout {
  display: flex;
  gap: 0;
  height: 100%;
}

.changelog-sidebar {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-color);
  padding: 24px 16px;
  overflow-y: auto;
}

.changelog-sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 16px;
  padding: 0 8px;
}

.changelog-version-nav {
  list-style: none;
  padding: 0;
  margin: 0;
}

.changelog-version-item {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}

.changelog-version-item:hover {
  color: #5d33f6;
}

.changelog-version-item.active {
  color: #5d33f6;
  font-weight: 600;
}

.changelog-loading {
  padding: 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

.changelog-main {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
}
</style>
