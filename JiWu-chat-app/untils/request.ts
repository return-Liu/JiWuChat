import axios from "axios";
import Cookies from "js-cookie";
import { message } from "ant-design-vue";

// 扩展 Axios 配置类型
declare module "axios" {
  interface AxiosRequestConfig {
    disableAutoMessage?: boolean;
  }
}

// 获取基础接口地址
const getBaseURL = () => {
  try {
    return localStorage.getItem("api-url") || "http://localhost:8080";
  } catch {
    return "http://localhost:8080";
  }
};

// 创建实例
const request = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
});

// 请求去重/取消机制
const pendingMap = new Map<string, AbortController>();
const getKey = (config: any) =>
  [
    config.method,
    config.url,
    JSON.stringify(config.params),
    JSON.stringify(config.data),
  ].join("&");

// 添加/移除 pending 请求
const addPending = (config: any) => {
  const key = getKey(config);
  pendingMap.get(key)?.abort();
  pendingMap.set(key, new AbortController());
  config.signal = pendingMap.get(key)!.signal;
};
const removePending = (config: any) => pendingMap.delete(getKey(config));

// 取消所有请求
export const cancelAllRequests = () => {
  pendingMap.forEach((ctrl) => ctrl.abort());
  pendingMap.clear();
};

// 请求拦截器
request.interceptors.request.use((config) => {
  config.baseURL = getBaseURL();
  const token = Cookies.get("token") || (() => { try { return localStorage.getItem("token"); } catch { return null; } })();
  token && (config.headers.Authorization = `Bearer ${token}`);
  addPending(config);
  return config;
});

// 响应拦截器
request.interceptors.response.use(
  (res) => {
    removePending(res.config);
    res.data?.message &&
      !res.config.disableAutoMessage &&
      message.success(res.data.message);
    return res.data;
  },
  (err) => {
    err.config && removePending(err.config);
    if (axios.isCancel(err)) return Promise.reject(err);

    // 错误提示已移除，由调用方自行处理
    if (err.response) {
      switch (err.response.status) {
        case 401:
          // 仅清除 Cookie 中的 token，不直接跳转
          // 由 auth 中间件或调用方统一处理登出逻辑，避免与 userStore 状态不一致
          Cookies.remove("token");
          // 如果不在登录页，跳转到登录页
          if (typeof window !== "undefined" && !window.location.href.includes("/login")) {
            window.location.href = "/login";
          }
          break;
      }
    }
    return Promise.reject(err);
  },
);

export default request;
