import { ref } from "vue";

// 当某些 UI 进入编辑模式时设置为 true，用来全局禁止进入全屏等操作
export const isEditingLock = ref(false);
