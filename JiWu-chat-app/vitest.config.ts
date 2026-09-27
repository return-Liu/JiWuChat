import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        globals: true,
        environment: "jsdom",
        include: ["tests/**/*.test.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["stores/**/*.ts", "untils/**/*.ts", "composables/**/*.ts"],
        },
    },
    resolve: {
        alias: {
            "~": path.resolve(__dirname),
            "@": path.resolve(__dirname),
        },
    },
});
