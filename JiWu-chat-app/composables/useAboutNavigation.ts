import { ref, type Ref } from "vue";

export type Section = "features" | "techstack" | "overview" | "design" | "contribute" | "team";

export interface NavItem {
    label: string;
    anchor: string;
}

export const NAV_MAP: Record<Section, NavItem[]> = {
    features: [
        { label: "功能概览", anchor: "anchor-features-overview" },
        { label: "用户系统", anchor: "anchor-feature-user" },
        { label: "即时消息", anchor: "anchor-feature-message" },
        { label: "联系人 & 群组", anchor: "anchor-feature-contact" },
        { label: "AI 助手 & 音视频", anchor: "anchor-feature-ai-call" },
        { label: "商城 & 社区", anchor: "anchor-feature-mall" },
        { label: "系统功能", anchor: "anchor-feature-system" },
        { label: "多端适配", anchor: "anchor-feature-multiplatform" },
        { label: "后端架构", anchor: "anchor-feature-backend" },
    ],
    techstack: [
        { label: "技术栈概览", anchor: "anchor-tech-overview" },
        { label: "前端技术栈", anchor: "anchor-tech-frontend" },
        { label: "后端技术栈", anchor: "anchor-tech-backend" },
        { label: "工程化工具链", anchor: "anchor-tech-tools" },
        { label: "项目数据", anchor: "anchor-tech-project-stats" },
    ],
    overview: [
        { label: "品牌故事", anchor: "anchor-brand-story" },
        { label: "2026 正向价值年刊", anchor: "anchor-vision" },
        { label: "核心价值观", anchor: "anchor-values" },
        { label: "项目里程碑", anchor: "anchor-milestones" },
        { label: "技术架构", anchor: "anchor-architecture" },
        { label: "联系我们", anchor: "anchor-contact-overview" },
    ],
    design: [
        { label: "设计哲学", anchor: "anchor-philosophy" },
        { label: "设计原则", anchor: "anchor-principles" },
        { label: "视觉设计", anchor: "anchor-visual" },
        { label: "设计工具链", anchor: "anchor-design-tools" },
        { label: "交互设计", anchor: "anchor-interaction" },
        { label: "性能设计", anchor: "anchor-performance" },
        { label: "安全设计", anchor: "anchor-security" },
    ],
    contribute: [
        { label: "参与贡献", anchor: "anchor-contribute-overview" },
        { label: "代码规范", anchor: "anchor-contribute-code-style" },
        { label: "贡献流程", anchor: "anchor-contribute-flow" },
        { label: "项目结构", anchor: "anchor-contribute-structure" },
        { label: "开发环境搭建", anchor: "anchor-contribute-setup" },
        { label: "联系方式", anchor: "anchor-contribute-contact" },
    ],
    team: [
        { label: "核心开发人员", anchor: "anchor-team-overview" },
        { label: "团队成员", anchor: "anchor-team-members" },
        { label: "加入我们", anchor: "anchor-team-join" },
    ],
};

export const SECTION_FIRST_ANCHOR: Record<Section, string> = {
    features: "anchor-features-overview",
    techstack: "anchor-tech-overview",
    overview: "anchor-brand-story",
    design: "anchor-philosophy",
    contribute: "anchor-contribute-overview",
    team: "anchor-team-overview",
};

export function useAboutNavigation(
    containerRef: Ref<HTMLElement | null>,
    currentSection: Ref<Section>,
    activeAnchor: Ref<string>
) {
    const isProgramScroll = ref(false);

    function getNavItems(): NavItem[] {
        return NAV_MAP[currentSection.value] || [];
    }

    function scrollToAnchor(anchorId: string) {
        const el = document.getElementById(anchorId);
        const container = containerRef.value;
        if (!el || !container) return;

        activeAnchor.value = anchorId;
        isProgramScroll.value = true;

        container.scrollTo({ top: el.offsetTop - 40, behavior: "smooth" });

        setTimeout(() => {
            isProgramScroll.value = false;
            calcCurrentAnchor();
        }, 550);
    }

    function calcCurrentAnchor() {
        const container = containerRef.value;
        if (!container) return;

        const scrollTop = container.scrollTop;
        const list = getNavItems();
        let current = list[0]?.anchor || "";

        for (const item of list) {
            const targetDom = document.getElementById(item.anchor);
            if (!targetDom) continue;
            if (targetDom.offsetTop - 60 <= scrollTop) current = item.anchor;
        }

        activeAnchor.value = current;
    }

    function handleScroll() {
        if (isProgramScroll.value) return;
        calcCurrentAnchor();
    }

    function shouldShowSection(anchorId: string): boolean {
        return getNavItems().some((item) => item.anchor === anchorId);
    }

    return {
        getNavItems,
        scrollToAnchor,
        calcCurrentAnchor,
        handleScroll,
        shouldShowSection,
        isProgramScroll,
    };
}