<template>
  <div class="tab-content">
    <div class="content-header">
      <div>
        <h3 class="content-title">通知</h3>
        <p class="content-desc">管理消息提醒方式、提示音和快捷回复等通知偏好</p>
      </div>
    </div>

    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">消息提醒</span>
        <span class="group-desc">控制新消息的提醒方式</span>
      </div>
      <div class="setting-item">
        <div class="item-info">
          <span class="label">接收消息通知</span>
          <span class="desc">开启后新消息会发出提醒</span>
        </div>
        <div
          class="setting-switch"
          :class="{ active: notificationEnabled }"
          @click.stop="notificationEnabled = !notificationEnabled"
        >
          <span class="switch-handle"></span>
        </div>
      </div>

      <div v-if="notificationEnabled" class="setting-item">
        <div class="item-info">
          <span class="label">通知方式</span>
          <span class="desc">{{ getNotificationModeDesc(notificationMode) }}</span>
        </div>
        <a-select
          v-model:value="notificationMode"
          class="setting-select"
          :options="notificationModeOptions"
          :popup-match-select-width="false"
        />
      </div>

      <div v-if="notificationEnabled && notificationMode !== 'dnd'" class="setting-item">
        <div class="item-info">
          <span class="label">消息提示音</span>
          <span class="desc">更换消息通知的提示音</span>
        </div>
        <div class="btn-group">
          <button class="action-btn" @click.stop="showRingtoneSelector = true">更换</button>
          <button class="action-btn" @click.stop="playRing(selectedRing)">试听</button>
        </div>
      </div>

      <div v-if="notificationEnabled && notificationMode !== 'dnd'" class="setting-item">
        <div class="item-info">
          <span class="label">窗口闪烁提醒</span>
          <span class="desc">后台收到消息时任务栏闪烁提示</span>
        </div>
        <div
          class="setting-switch"
          :class="{ active: titleFlashEnabled }"
          @click.stop="titleFlashEnabled = !titleFlashEnabled"
        >
          <span class="switch-handle"></span>
        </div>
      </div>

      <div v-if="notificationEnabled" class="setting-item">
        <div class="item-info">
          <span class="label">通知记录</span>
          <span class="desc">查看历史通知记录</span>
        </div>
        <button class="action-btn" @click.stop="goToNotificationHistory">查看</button>
      </div>
    </div>

    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">快捷回复</span>
        <span class="group-desc">在通知中快速回复消息</span>
      </div>
      <div class="setting-item">
        <div class="item-info">
          <span class="label">启用快捷回复</span>
          <span class="desc">在通知中直接回复消息</span>
        </div>
        <div
          class="setting-switch"
          :class="{ active: quickReplyEnabled }"
          @click.stop="quickReplyEnabled = !quickReplyEnabled"
        >
          <span class="switch-handle"></span>
        </div>
      </div>

      <div v-if="quickReplyEnabled" class="setting-item">
        <div class="item-info">
          <span class="label">常用回复语</span>
          <span class="desc">管理预设的快捷回复内容</span>
        </div>
        <button class="action-btn" @click.stop="showQuickReplyManager = true">编辑</button>
      </div>
    </div>

    <div class="setting-group">
      <div class="group-header">
        <span class="group-title">撤回消息</span>
        <span class="group-desc">自定义撤回消息的显示文本</span>
      </div>
      <div class="setting-item">
        <div class="item-info">
          <span class="label">撤回消息设置</span>
          <span class="desc">自定义撤回消息的显示文本</span>
        </div>
        <button class="action-btn" @click.stop="showRecallSettings = true">编辑</button>
      </div>
    </div>

    <!-- 提示音弹窗 -->
    <a-modal
      v-model:open="showRingtoneSelector"
      title="消息提示音设置"
      width="480px"
      :footer="null"
    >
      <div class="ringtone-selector">
        <div
          v-for="ring in ringtones"
          :key="ring.value"
          class="ring-option"
          :class="{ active: tempSelectedRing === ring.value }"
          @click="tempSelectedRing = ring.value"
        >
          <span>{{ ring.name }}</span>
          <button class="play-btn" @click.stop="playRing(ring.value)">试听</button>
        </div>
      </div>
      <template #footer>
        <div class="modal-footer">
          <button class="btn btn-cancel" @click="showRingtoneSelector = false">取消</button>
          <button class="btn btn-confirm" @click="confirmRingtoneSelection">确认</button>
        </div>
      </template>
    </a-modal>

    <!-- 快捷回复弹窗 -->
    <a-modal v-model:open="showQuickReplyManager" title="快捷回复管理" width="480px" :footer="null">
      <div class="quick-reply-manager">
        <div class="manager-header">
          <button class="btn-add" @click="addQuickReply">+ 添加</button>
          <span class="tip">最多 10 条</span>
        </div>
        <div v-if="quickReplies.length === 0" class="empty-state">暂无快捷回复</div>
        <div v-else class="reply-list">
          <div v-for="(reply, index) in quickReplies" :key="index" class="reply-item">
            <input
              v-model="reply.text"
              placeholder="输入回复内容"
              class="reply-input"
              @blur="saveQuickReplies"
            />
            <button class="btn-delete" @click="removeQuickReply(index)">删除</button>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="modal-footer">
          <button class="btn btn-confirm" @click="showQuickReplyManager = false">完成</button>
        </div>
      </template>
    </a-modal>

    <!-- 撤回消息弹窗 -->
    <a-modal v-model:open="showRecallSettings" title="撤回消息设置" width="480px" :footer="null">
      <div class="recall-settings">
        <div class="preview-text">{{ userNickname }} {{ previewRecallText }}</div>
        <div class="preset-list">
          <div
            v-for="(preset, index) in displayedPresetRecallTexts"
            :key="index"
            class="preset-item"
            :class="{ active: selectedPresetIndex === index }"
            @click="selectPresetRecall(index)"
          >
            {{ preset.self }}
          </div>
        </div>
        <div v-if="presetRecallTexts.length > 5" class="show-more" @click="toggleShowAllPresets">
          {{ showAllPresets ? "收起" : `更多 (${presetRecallTexts.length - 5})` }}
        </div>
      </div>
      <template #footer>
        <div class="modal-footer">
          <button class="btn btn-confirm" @click="showRecallSettings = false">关闭</button>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "#app";
import { useUserStore } from "../../stores/user";
import { message } from "ant-design-vue";
import {
  getCustomRecallText,
  saveCustomRecallText,
  PRESET_RECALL_TEXTS,
} from "../../untils/contactManager";

const router = useRouter();
const userStore = useUserStore();

// ===== 通知相关 =====
const notificationEnabled = ref(true);
const notificationMode = ref<
  | "sound-only"
  | "system-only"
  | "sound-and-system"
  | "sound-and-statusbar"
  | "statusbar-only"
  | "desktop-only"
  | "sound-and-desktop"
  | "dnd"
>("sound-and-system");

const notificationModeOptions = [
  { value: "sound-only", label: "仅声音提醒" },
  { value: "system-only", label: "仅应用内弹窗" },
  { value: "statusbar-only", label: "仅状态栏显示" },
  { value: "desktop-only", label: "仅桌面弹窗" },
  { value: "sound-and-system", label: "声音 + 应用内" },
  { value: "sound-and-statusbar", label: "声音 + 状态栏" },
  { value: "sound-and-desktop", label: "声音 + 桌面弹窗" },
  { value: "dnd", label: "免打扰模式" },
];

const getNotificationModeDesc = (mode: string) => {
  const descMap: Record<string, string> = {
    "sound-only": "仅播放提示音",
    "system-only": "仅应用内弹窗",
    "sound-and-system": "提示音 + 应用内弹窗",
    "sound-and-statusbar": "提示音 + 状态栏显示",
    "statusbar-only": "仅状态栏显示",
    "desktop-only": "仅桌面弹窗",
    "sound-and-desktop": "提示音 + 桌面弹窗",
    dnd: "免打扰，不提醒",
  };
  return descMap[mode] || "";
};

const titleFlashEnabled = ref(true);
const selectedRing = ref("/messageRingtone/水滴-短信提示音 - 天天鈴聲.mp3");
const ringtones = ref([
  { name: "水滴声", value: "/messageRingtone/水滴-短信提示音 - 天天鈴聲.mp3" },
]);

const playRing = (url: string) => {
  const audio = new Audio(url);
  audio.volume = 0.8;
  audio.play().catch(() => message.warning("播放失败"));
};

const showRingtoneSelector = ref(false);
const tempSelectedRing = ref("");

const confirmRingtoneSelection = () => {
  if (tempSelectedRing.value) {
    selectedRing.value = tempSelectedRing.value;
    localStorage.setItem("messageRingTone", selectedRing.value);
    message.success("提示音已设置");
    showRingtoneSelector.value = false;
  }
};

const goToNotificationHistory = () => router.push("/notification-history");

// ===== 快捷回复 =====
const quickReplyEnabled = ref(false);
const quickReplies = ref<Array<{ text: string }>>([]);
const showQuickReplyManager = ref(false);

const addQuickReply = () => {
  if (quickReplies.value.length >= 10) {
    message.warning("最多可添加10条快捷回复");
    return;
  }
  quickReplies.value.push({ text: "" });
};

const removeQuickReply = (index: number) => {
  quickReplies.value.splice(index, 1);
  saveQuickReplies();
};

const saveQuickReplies = () => {
  const validReplies = quickReplies.value.filter((r) => r.text.trim() !== "");
  if (typeof window !== "undefined") {
    localStorage.setItem("quickReplies", JSON.stringify(validReplies));
  }
};

// ===== 撤回消息设置 =====
const presetRecallTexts = ref(PRESET_RECALL_TEXTS);
const selectedPresetIndex = ref(0);
const userNickname = computed(() => userStore.userNickname || "我");
const previewRecallText = ref("");
const showAllPresets = ref(false);
const showRecallSettings = ref(false);

const displayedPresetRecallTexts = computed(() => {
  if (showAllPresets.value || presetRecallTexts.value.length <= 5) {
    return presetRecallTexts.value;
  }
  return presetRecallTexts.value.slice(0, 5);
});

const toggleShowAllPresets = () => (showAllPresets.value = !showAllPresets.value);

const selectPresetRecall = (index: number) => {
  selectedPresetIndex.value = index;
  const p = presetRecallTexts.value[index];
  previewRecallText.value = p.self;
  saveCustomRecallText(p.self, p.others);
};

const loadRecallSettings = () => {
  const saved = getCustomRecallText();
  const idx = presetRecallTexts.value.findIndex(
    (p) => p.self === saved.self && p.others === saved.others,
  );
  selectedPresetIndex.value = idx === -1 ? 0 : idx;
  previewRecallText.value = presetRecallTexts.value[selectedPresetIndex.value].self;
};

// ===== 生命周期 =====
onMounted(() => {
  if (typeof window !== "undefined") {
    titleFlashEnabled.value = localStorage.getItem("titleFlashEnabled") !== "false";
    notificationEnabled.value = localStorage.getItem("notificationEnabled") !== "false";
    notificationMode.value = (localStorage.getItem("notificationMode") ||
      "sound-and-system") as any;
    selectedRing.value =
      localStorage.getItem("messageRingTone") || "/messageRingtone/水滴-短信提示音 - 天天鈴聲.mp3";
    quickReplyEnabled.value = localStorage.getItem("quickReplyEnabled") === "true";

    const savedQuickReplies = localStorage.getItem("quickReplies");
    if (savedQuickReplies) {
      try {
        quickReplies.value = JSON.parse(savedQuickReplies);
      } catch {
        quickReplies.value = [];
      }
    }
  }

  loadRecallSettings();
});

// Watch 保存
watch(titleFlashEnabled, (val) => localStorage.setItem("titleFlashEnabled", String(val)));
watch(notificationEnabled, (val) => localStorage.setItem("notificationEnabled", String(val)));
watch(notificationMode, (val) => localStorage.setItem("notificationMode", val));
watch(selectedRing, (val) => localStorage.setItem("messageRingTone", val));
watch(quickReplyEnabled, (val) => localStorage.setItem("quickReplyEnabled", String(val)));
</script>
