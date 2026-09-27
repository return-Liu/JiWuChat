import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useVersionStore = defineStore('version', () => {
    const isBeta = ref(false);
    const versionType = ref<'stable' | 'beta'>('stable');

    // 设置为体验版
    const setBeta = () => {
        isBeta.value = true;
        versionType.value = 'beta';
        localStorage.setItem('is_beta_version', 'true');
    };

    // 设置为正式版
    const setStable = () => {
        isBeta.value = false;
        versionType.value = 'stable';
        localStorage.setItem('is_beta_version', 'false');
    };

    // 初始化版本状态
    const initVersion = () => {
        const isBetaStored = localStorage.getItem('is_beta_version');
        if (isBetaStored === 'true') {
            isBeta.value = true;
            versionType.value = 'beta';
        } else {
            isBeta.value = false;
            versionType.value = 'stable';
        }
    };

    // 获取版本标签
    const versionLabel = computed(() => {
        return isBeta.value ? '体验版' : '正式版';
    });

    return {
        isBeta,
        versionType,
        versionLabel,
        setBeta,
        setStable,
        initVersion,
    };
});