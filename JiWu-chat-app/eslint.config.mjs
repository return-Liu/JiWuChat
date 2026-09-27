import { defineConfig } from "@antfu/eslint-config";

export default defineConfig({
  vue: true,
  typescript: true,
  rules: {
    "no-console": "warn",
    "vue/multi-word-component-names": "off",
    "vue/no-v-html": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "unused-imports/no-unused-vars": "warn",
  },
  ignores: ["node_modules", "dist", ".nuxt", ".output", "release", "public"],
});
