// 简体中文语言包 - index 页面 (头部 + 底部 + 搜索面板)
export default {
    header: {
        brand: "极物聊天",
        search: {
            placeholder: "搜索",
            shortcut: "Ctrl K",
            modalPlaceholder: "搜索文档、功能...",
            esc: "ESC",
            navigate: "导航",
            select: "选择",
            close: "关闭",
            noResults: "没有找到相关内容",
        },
        nav: {
            home: "首页",
            start: "开始",
            pricing: "定价",
            chat: "体验项目",
            jiwu_story: "极物聊天故事",
            changelog: "更新日志",
        },
        eco: {
            label: "生态",
            circle: "极物圈",
            electron: "极物聊天(Electron)",
            admin: "极物后台系统",
        },
        lang: {
            zh: "简体中文",
            en: "English",
        },
        theme: {
            light: "日间模式",
            dark: "夜间模式",
        },
    },
    footer: {
        copyright: "© {year} 极物聊天 版权所有",
    },
    // 搜索索引 - 用于搜索面板匹配
    searchIndex: {
        // 导航标签
        "首页": "header.nav.home",
        "开始": "header.nav.start",
        "定价": "header.nav.pricing",
        "体验项目": "header.nav.chat",
        "极物聊天故事": "header.nav.jiwu_story",
        "更新日志": "header.nav.changelog",
        // 生态
        "生态": "header.eco.label",
        "极物圈": "header.eco.circle",
        "极物聊天Electron": "header.eco.electron",
        "极物后台系统": "header.eco.admin",
        // 语言
        "简体中文": "header.lang.zh",
        "English": "header.lang.en",
        "语言切换": "header.lang.zh",
        "中英文切换": "header.lang.zh",
        // 主题
        "日间模式": "header.theme.light",
        "夜间模式": "header.theme.dark",
        "主题切换": "header.theme.light",
        "暗黑模式": "header.theme.dark",
        // 搜索
        "搜索": "header.search.placeholder",
        "搜索文档": "header.search.modalPlaceholder",
        "搜索功能": "header.search.modalPlaceholder",
        // 其他
        "GitHub": "GitHub",
        "下载": "download",
        "Web体验": "web",
        "极物聊天": "header.brand",
        "聊天": "header.nav.experience",
        "首页导航": "header.nav.home",
        "开始导航": "header.nav.start",
        "定价导航": "header.nav.pricing",
        "关于": "header.nav.about",
        "版权": "footer.copyright",
    },
};
