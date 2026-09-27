/**
 * 环境配置 - 根据运行环境自动加载对应 .env 文件中的变量
 *
 * Nuxt 会自动根据 NODE_ENV 加载 .env.development / .env.test / .env.production
 * 此处统一导出，其他模块只需 import { BACKEND_URL, WS_HOST } from '~/config'
 */

// 后端 API 地址
export const BACKEND_URL: string =
    import.meta.env.VITE_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:8080";

// WebSocket 服务地址
export const WS_HOST: string =
    import.meta.env.VITE_WS_HOST || "localhost";

// 当前环境
export const NODE_ENV: string =
    import.meta.env.MODE || process.env.NODE_ENV || "development";

// 是否为开发环境
export const IS_DEV: boolean = NODE_ENV === "development";

// 是否为生产环境
export const IS_PROD: boolean = NODE_ENV === "production";
