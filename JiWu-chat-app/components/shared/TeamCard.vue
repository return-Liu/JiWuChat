<template>
  <div class="team-card">
    <div class="team-avatar">
      <img :src="avatar" :alt="name" class="team-avatar-img" />
    </div>
    <div class="team-info">
      <h4 class="team-name">
        {{ name }}
        <span class="team-role-badge">{{ role }}</span>
      </h4>
      <p class="team-desc">{{ desc }}</p>
      <div class="team-tags">
        <span class="team-tag" v-for="tag in tags" :key="tag">{{ tag }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string;
  role: string;
  avatar: string;
  desc: string;
  tags: string[];
}>();
</script>

<style scoped>
.team-card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 24px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  transition: all 0.25s ease;
  background: transparent;
}

.team-card:hover {
  border-color: #5d33f6;
  box-shadow: 0 4px 16px rgba(93, 51, 246, 0.08);
}

.dark .team-card:hover {
  border-color: #8b5cf6;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.12);
}

.team-avatar {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(93, 51, 246, 0.08);
}

.dark .team-avatar {
  background: rgba(139, 92, 246, 0.12);
}

.team-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.team-info {
  flex: 1;
  min-width: 0;
}

.team-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-family: "Alimama", Helvetica, sans-serif;
}

.team-role-badge {
  font-size: 12px;
  font-weight: 600;
  color: #5d33f6;
  background: rgba(93, 51, 246, 0.08);
  padding: 2px 10px;
  border-radius: 4px;
  font-family: "Alimama", Helvetica, sans-serif;
  white-space: nowrap;
}

.dark .team-role-badge {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.12);
}

.team-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 10px;
  line-height: 1.6;
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
}

.team-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.team-tag {
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--bg-hover, rgba(0, 0, 0, 0.04));
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  font-weight: 500;
  font-family: "Alimama", Helvetica, sans-serif;
}
</style>
