import zh from "../locales/zh";
import en from "../locales/en";

export default defineI18nConfig(() => ({
    legacy: false,
    globalInjection: true,
    locale: "zh",
    fallbackLocale: "zh",
    messages: {
        zh,
        en,
    },
}));
