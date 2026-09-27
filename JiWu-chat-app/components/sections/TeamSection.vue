<template>
  <!-- 核心开发人员 -->
  <div v-if="shouldShowSection('anchor-team-overview')">
    <AnchorHeading anchor-id="anchor-team-overview" tag="h1"> 核心开发人员 </AnchorHeading>
    <p>
      极物聊天目前由<strong>独立开发者</strong>一人打造，从零开始构建了完整的前后端体系。
      以下是项目的<strong>核心贡献者</strong>：
    </p>
  </div>

  <SectionDivider />

  <!-- 团队成员 -->
  <div v-if="shouldShowSection('anchor-team-members')">
    <AnchorHeading anchor-id="anchor-team-members"> 团队成员 </AnchorHeading>
    <div v-if="loading" class="team-loading">加载中...</div>
    <div v-else-if="members.length === 0" class="team-empty">暂无团队成员数据</div>
    <div v-else class="team-grid">
      <TeamCard
        v-for="member in members"
        :key="member.name"
        :name="member.name"
        :role="member.role"
        :avatar="member.avatar"
        :desc="member.desc"
        :tags="member.tags"
      />
    </div>
  </div>

  <SectionDivider />

  <!-- 加入我们 -->
  <div v-if="shouldShowSection('anchor-team-join')">
    <AnchorHeading anchor-id="anchor-team-join"> 加入我们 </AnchorHeading>
    <p>
      如果你对即时通讯、Electron、Vue3、Node.js 等技术栈感兴趣，
      欢迎通过下方联系方式加入团队，一起打造更好的极物聊天。
    </p>
    <ul>
      <li>邮箱：2286223728@QQ.com</li>
      <li>官网：https://jiwuchat.com</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import AnchorHeading from "../shared/AnchorHeading.vue";
import SectionDivider from "../shared/SectionDivider.vue";
import TeamCard from "../shared/TeamCard.vue";
import request from "../../untils/request";

defineProps<{
  shouldShowSection: (anchorId: string) => boolean;
}>();

const members = ref<
  Array<{
    name: string;
    role: string;
    avatar: string;
    desc: string;
    tags: string[];
  }>
>([]);

const loading = ref(false);

async function fetchTeamMembers() {
  loading.value = true;
  try {
    const res = await request.get("/about");
    const list = res.data?.data?.team || res.data?.team || [];
    members.value = list.map((m: any) => ({
      name: m.name,
      role: m.role,
      avatar: m.avatar || "/default-avatar.png",
      desc: m.description || m.desc || "",
      tags: Array.isArray(m.tags) ? m.tags : [],
    }));
  } catch {
    members.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchTeamMembers();
});
</script>

<style scoped>
.team-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin: 20px 0;
}

.team-loading,
.team-empty {
  text-align: center;
  padding: 40px 0;
  color: var(--text-secondary);
  font-family: "Alimama", Helvetica, sans-serif;
  font-weight: 500;
}

@media (max-width: 900px) {
  .team-grid {
    grid-template-columns: 1fr;
  }
}
</style>
