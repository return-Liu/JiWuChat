/**
 * 定价卡片 3D 交互 composable
 * 封装鼠标悬停时的透视旋转 + 光晕跟随效果
 */
import { ref, type Ref } from "vue";

interface GlowColor {
    light: string;
    dark: string;
}

const GLOW_COLORS: Record<string, GlowColor> = {
    base: {
        light: "rgba(180, 180, 200, 0.35)",
        dark: "rgba(180, 180, 200, 0.12)",
    },
    business: {
        light: "rgba(93, 51, 246, 0.45)",
        dark: "rgba(93, 51, 246, 0.18)",
    },
    flagship: {
        light: "rgba(82, 196, 26, 0.35)",
        dark: "rgba(82, 196, 26, 0.12)",
    },
};

export function usePricingCard(isDarkTheme: Ref<boolean>) {
    /** 鼠标移入：3D 旋转 + 光晕跟随 */
    function handleMouseMove(e: MouseEvent, type: string) {
        const card = e.currentTarget as HTMLElement;
        const glow = card.querySelector(".card-glow") as HTMLElement;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(15px)`;

        if (glow) {
            const colors = GLOW_COLORS[type];
            if (colors) {
                const color = isDarkTheme.value ? colors.dark : colors.light;
                glow.style.background = `radial-gradient(circle at ${x}px ${y}px, ${color}, transparent 70%)`;
                glow.style.opacity = "1";
            }
        }
    }

    /** 鼠标移出：复位 */
    function handleMouseLeave(e: MouseEvent, _type: string) {
        const card = e.currentTarget as HTMLElement;
        const glow = card.querySelector(".card-glow") as HTMLElement;
        card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translateZ(0)";
        if (glow) {
            glow.style.opacity = "0";
        }
    }

    return {
        handleMouseMove,
        handleMouseLeave,
    };
}
