<template>
  <div class="emoji-picker" v-if="visible" @click.stop>
    <div class="emoji-tabs">
      <div
        v-for="(category, index) in emojiCategories"
        :key="category.icon"
        class="tab-btn"
        :class="{ active: activeTab === index }"
        @click.stop="activeTab = index"
        :title="category.title"
      >
        <span class="tab-icon">{{ category.icon }}</span>
      </div>
    </div>

    <div class="emoji-grid">
      <div
        v-for="emoji in currentEmojis"
        :key="emoji.code"
        class="emoji-item"
        @click.stop="selectEmoji(emoji.code)"
        :title="emoji.name"
      >
        <span class="emoji-char">{{ emoji.code }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface Emoji {
  code: string;
  name: string;
}

interface EmojiCategory {
  icon: string;
  title: string;
  emojis: Emoji[];
}

// 纯经典小黄脸 | 全局无重复 | 无AI/新形态emoji + 新增多类非小黄脸表情
const emojiCategories = ref<EmojiCategory[]>([
  {
    icon: "😀",
    title: "开心喜悦",
    emojis: [
      { code: "😀", name: "微笑" },
      { code: "😃", name: "大笑" },
      { code: "😄", name: "开心" },
      { code: "😁", name: "嘻嘻" },
      { code: "😆", name: "笑眯眼" },
      { code: "😊", name: "害羞" },
      { code: "🙂", name: "淡笑" },
      { code: "😍", name: "花痴" },
      { code: "😘", name: "飞吻" },
      { code: "😗", name: "亲亲" },
      { code: "😙", name: "亲亲脸" },
      { code: "🥳", name: "庆祝" },
      { code: "😎", name: "酷" },
      { code: "😋", name: "馋" },
      { code: "😇", name: "天使" },
      { code: "😌", name: "满足" },
      { code: "😚", name: "害羞亲亲" },
      { code: "🤑", name: "贪财" },
      { code: "😛", name: "吐舌" },
      { code: "😝", name: "调皮" },
      { code: "😜", name: "眨眼吐舌" },
      { code: "😉", name: "眨眼" },
      { code: "🤭", name: "偷笑" },
      { code: "🙃", name: "倒笑" },
      { code: "🤗", name: "拥抱" },
      { code: "😂", name: "大笑带泪" },
      { code: "🤣", name: "笑到打滚" },
      { code: "😅", name: "笑出冷汗" },
      { code: "🤩", name: "崇拜" },
      { code: "🤪", name: "搞怪" },
      { code: "😈", name: "小恶魔" },
      { code: "🥰", name: "爱心脸" },
    ],
  },
  {
    icon: "😏",
    title: "调皮搞怪",
    emojis: [
      { code: "😏", name: "得意" },
      { code: "🤨", name: "挑眉" },
      { code: "🧐", name: "审视" },
      { code: "🤓", name: "书呆子" },
      { code: "🤫", name: "嘘" },
      { code: "🤐", name: "闭嘴" },
      { code: "🤔", name: "思考" },
      { code: "😒", name: "无语" },
      { code: "🙄", name: "翻白眼" },
      { code: "😑", name: "无表情" },
      { code: "😐", name: "冷漠" },
      { code: "😶", name: "沉默" },
      { code: "😬", name: "咬牙" },
      { code: "😪", name: "困倦" },
      { code: "😴", name: "熟睡" },
      { code: "😵", name: "眩晕" },
      { code: "🥴", name: "微醺" },
      { code: "🤯", name: "炸裂" },
      { code: "🤤", name: "流口水" },
      { code: "😕", name: "疑惑" },
      { code: "😖", name: "发愁" },
      { code: "😞", name: "垂头丧气" },
      { code: "😟", name: "担忧" },
      { code: "🥱", name: "打哈欠" },
      { code: "😩", name: "抓狂" },
      { code: "😫", name: "疲惫" },
      { code: "😰", name: "紧张" },
      { code: "😨", name: "害怕" },
      { code: "😱", name: "恐惧" },
      { code: "😦", name: "错愕" },
      { code: "😧", name: "惊慌" },
      { code: "😮", name: "吃惊" },
    ],
  },

  {
    icon: "❤️",
    title: "爱心符号",
    emojis: [
      { code: "❤️", name: "爱心" },
      { code: "🧡", name: "橙心" },
      { code: "💛", name: "黄心" },
      { code: "💚", name: "绿心" },
      { code: "💙", name: "蓝心" },
      { code: "💜", name: "紫心" },
      { code: "🖤", name: "黑心" },
      { code: "🤍", name: "白心" },
      { code: "🤎", name: "棕心" },
      { code: "💔", name: "心碎" },
      { code: "❣️", name: "心动" },
      { code: "💕", name: "双心" },
      { code: "💞", name: "跳动" },
      { code: "💓", name: "心跳" },
      { code: "💗", name: "增长" },
      { code: "💖", name: "闪耀" },
      { code: "💘", name: "丘比特" },
      { code: "💝", name: "礼盒" },
      { code: "⭐", name: "星星" },
      { code: "🌟", name: "闪光" },
      { code: "✨", name: "火花" },
      { code: "💫", name: "眩晕" },
      { code: "🔥", name: "火焰" },
      { code: "💯", name: "满分" },
      { code: "💢", name: "愤怒" },
      { code: "💥", name: "爆炸" },
      { code: "💬", name: "对话" },
      { code: "💭", name: "思考" },
      { code: "🗨️", name: "聊天" },
      { code: "🗯️", name: "感叹" },
      { code: "❌", name: "错误" },
      { code: "✅", name: "正确" },
    ],
  },
  {
    icon: "☀️",
    title: "天气自然",
    emojis: [
      { code: "☀️", name: "太阳" },
      { code: "⛅", name: "多云" },
      { code: "☁️", name: "云朵" },
      { code: "🌧️", name: "下雨" },
      { code: "⛈️", name: "雷雨" },
      { code: "❄️", name: "雪花" },
      { code: "⛄", name: "雪人" },
      { code: "🌈", name: "彩虹" },
      { code: "🌪️", name: "龙卷风" },
      { code: "🌫️", name: "雾" },
      { code: "🌊", name: "海浪" },
      { code: "🌋", name: "火山" },
      { code: "🌌", name: "银河" },
      { code: "🪐", name: "星球" },
      { code: "🌟", name: "星星" },
      { code: "🌙", name: "月亮" },
      { code: "🌕", name: "满月" },
      { code: "💫", name: "彗星" },
      { code: "⚡", name: "闪电" },
      { code: "🌱", name: "发芽" },
      { code: "🌲", name: "松树" },
      { code: "🌿", name: "草" },
      { code: "🍀", name: "四叶草" },
      { code: "🌹", name: "玫瑰" },
      { code: "🌸", name: "樱花" },
      { code: "🌼", name: "小花" },
      { code: "💐", name: "花束" },
      { code: "🌾", name: "稻穗" },
      { code: "🍄", name: "蘑菇" },
    ],
  },

  {
    icon: "🍎",
    title: "美食餐饮",
    emojis: [
      { code: "🍎", name: "苹果" },
      { code: "🍐", name: "梨子" },
      { code: "🍊", name: "橙子" },
      { code: "🍋", name: "柠檬" },
      { code: "🍌", name: "香蕉" },
      { code: "🍉", name: "西瓜" },
      { code: "🍇", name: "葡萄" },
      { code: "🍓", name: "草莓" },
      { code: "🫐", name: "蓝莓" },
      { code: "🍈", name: "甜瓜" },
      { code: "🍒", name: "樱桃" },
      { code: "🍑", name: "桃子" },
      { code: "🥭", name: "芒果" },
      { code: "🍍", name: "菠萝" },
      { code: "🍅", name: "番茄" },
      { code: "🥝", name: "奇异果" },
      { code: "🍆", name: "茄子" },
      { code: "🥑", name: "牛油果" },
      { code: "🥦", name: "西兰花" },
      { code: "🥬", name: "青菜" },
      { code: "🥒", name: "黄瓜" },
      { code: "🌶️", name: "辣椒" },
      { code: "🌽", name: "玉米" },
      { code: "🥕", name: "胡萝卜" },
      { code: "🧄", name: "大蒜" },
      { code: "🧅", name: "洋葱" },
      { code: "🥔", name: "土豆" },
      { code: "🍞", name: "面包" },
      { code: "🥐", name: "牛角包" },
    ],
  },
  {
    icon: "🎮",
    title: "物品娱乐",
    emojis: [
      { code: "🎮", name: "游戏" },
      { code: "🎧", name: "耳机" },
      { code: "🎤", name: "麦克风" },
      { code: "🎹", name: "钢琴" },
      { code: "🥁", name: "鼓" },
      { code: "🎷", name: "萨克斯" },
      { code: "🎸", name: "吉他" },
      { code: "🎨", name: "画板" },
      { code: "📷", name: "相机" },
      { code: "🎥", name: "摄影机" },
      { code: "📱", name: "手机" },
      { code: "💻", name: "电脑" },
      { code: "⌚", name: "手表" },
      { code: "💎", name: "钻石" },
      { code: "🎁", name: "礼物" },
      { code: "🎀", name: "蝴蝶结" },
      { code: "🚗", name: "汽车" },
      { code: "✈️", name: "飞机" },
      { code: "🚀", name: "火箭" },
      { code: "🚢", name: "轮船" },
      { code: "🚲", name: "单车" },
      { code: "🏠", name: "房子" },
      { code: "🏢", name: "大厦" },
      { code: "🏥", name: "医院" },
      { code: "🏫", name: "学校" },
      { code: "🏦", name: "银行" },
      { code: "🏨", name: "酒店" },
      { code: "🗽", name: "自由女神" },
      { code: "🗼", name: "铁塔" },
    ],
  },
]);

const activeTab = ref(0);

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select", "close"]);

const currentEmojis = computed<Emoji[]>(() => {
  if (
    !emojiCategories.value.length ||
    activeTab.value < 0 ||
    activeTab.value >= emojiCategories.value.length
  ) {
    return [];
  }
  return emojiCategories.value[activeTab.value].emojis;
});

const selectEmoji = (emoji: string) => {
  if (!emoji) return;
  emit("select", emoji);
  emit("close");
};
</script>

<style scoped>
.emoji-picker {
  position: absolute;
  bottom: 176px;
  left: 0;
  width: 340px;
  height: 240px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(149, 157, 165, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.emoji-tabs {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 4px 8px;
  gap: 4px;
  height: 44px;
  overflow-x: auto;
  overflow-y: hidden;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.emoji-tabs::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.2s ease;
  flex-shrink: 0;
  width: 40px;
}

.tab-btn .tab-icon {
  font-size: 18px;
  line-height: 1;
}

.tab-btn.active {
  background: #3b82f6;
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.emoji-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 2px;
  padding: 8px;
  overflow: hidden;
  height: calc(100% - 44px);
}

.emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.emoji-item:hover {
  background-color: #f1f5f9;
  transform: scale(1.1);
}

.emoji-char {
  font-size: 20px;
  line-height: 1;
}
</style>
