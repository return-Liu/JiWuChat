import { ref } from "vue";

/**
 * GitHub 更新日志数据源
 *
 * 通过 GitHub REST API 拉取仓库的 commit 记录，解析成 Conventional Commits 格式
 * 用于前端「更新日志」页面展示，替代后端 /updatelogs 数据库接口。
 *
 * 数据格式示例（Conventional Commits）：
 *   feat(chat): 为聊天面板统一添加滚动边缘渐隐效果
 *   fix(login): 修复登录时 token 过期未跳转的问题
 */

// ===== 仓库配置 =====
const GITHUB_OWNER = "return-Liu";
const GITHUB_REPO = "JiWu_Chat";
// 可选：私有仓库需要 token（通过环境变量注入，勿硬编码）
const GITHUB_TOKEN = "";

const GITHUB_API_BASE = "https://api.github.com";

/** Conventional Commits 类型 → 中文标签 + 颜色 */
const COMMIT_TYPE_MAP: Record<string, { label: string; color: string }> = {
    feat: { label: "新功能", color: "#2da44e" },
    fix: { label: "修复", color: "#d73a49" },
    perf: { label: "性能优化", color: "#8250df" },
    refactor: { label: "重构", color: "#bf8700" },
    style: { label: "样式", color: "#57606a" },
    docs: { label: "文档", color: "#0969da" },
    test: { label: "测试", color: "#1f883d" },
    build: { label: "构建", color: "#6e7781" },
    chore: { label: "杂项", color: "#6e7781" },
    ci: { label: "CI", color: "#6e7781" },
    revert: { label: "回滚", color: "#cf222e" },
};

export interface GithubCommit {
    sha: string;
    shortSha: string;
    type: string;
    scope: string | null;
    subject: string;
    message: string;
    author: string;
    authorAvatar: string;
    date: string;
    url: string;
    typeLabel: string;
    typeColor: string;
}

/** 解析 Conventional Commits 消息 */
function parseCommitMessage(message: string): {
    type: string;
    scope: string | null;
    subject: string;
} {
    const trimmed = message.trim();
    // 匹配 feat(scope): subject / fix: subject 等
    const match = trimmed.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/s);

    if (match) {
        return {
            type: match[1],
            scope: match[2] || null,
            subject: match[3].trim(),
        };
    }

    // 非标准格式：整个 message 作为 subject，type 归为 chore
    return {
        type: "chore",
        scope: null,
        subject: trimmed,
    };
}

/** 将 GitHub API 返回的 commit 转为统一结构 */
function mapCommit(raw: any): GithubCommit {
    const fullMessage = raw?.commit?.message || "";
    const { type, scope, subject } = parseCommitMessage(fullMessage);
    const typeInfo = COMMIT_TYPE_MAP[type] || COMMIT_TYPE_MAP.chore;
    const sha = raw?.sha || "";

    return {
        sha,
        shortSha: sha.slice(0, 8),
        type,
        scope,
        subject,
        message: fullMessage,
        author: raw?.commit?.author?.name || raw?.author?.login || "未知",
        authorAvatar: raw?.author?.avatar_url || "",
        date: raw?.commit?.author?.date || raw?.commit?.committer?.date || "",
        url: raw?.html_url || "",
        typeLabel: typeInfo.label,
        typeColor: typeInfo.color,
    };
}

/** 拉取 GitHub commits */
async function fetchCommits(
    owner: string,
    repo: string,
    options: { per_page?: number; page?: number } = {},
): Promise<GithubCommit[]> {
    const { per_page = 30, page = 1 } = options;
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=${per_page}&page=${page}`;

    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
    };
    if (GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
        throw new Error(`GitHub API 请求失败: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return (data || []).map(mapCommit);
}

/** 配置仓库信息（供运行时覆盖占位符） */
export function useGithubChangelog() {
    const commits = ref<GithubCommit[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const hasMore = ref(false);
    const page = ref(1);
    const perPage = 30;

    /** 加载 commits（支持分页） */
    const load = async (reset = true) => {
        if (reset) {
            page.value = 1;
            commits.value = [];
        }

        loading.value = true;
        error.value = null;

        try {
            const list = await fetchCommits(GITHUB_OWNER, GITHUB_REPO, {
                per_page: perPage,
                page: page.value,
            });

            if (reset) {
                commits.value = list;
            } else {
                commits.value = [...commits.value, ...list];
            }

            hasMore.value = list.length === perPage;
        } catch (err) {
            error.value = err instanceof Error ? err.message : "加载更新日志失败";
        } finally {
            loading.value = false;
        }
    };

    /** 加载更多 */
    const loadMore = async () => {
        page.value += 1;
        await load(false);
    };

    return {
        commits,
        loading,
        error,
        hasMore,
        load,
        loadMore,
        GITHUB_OWNER,
        GITHUB_REPO,
    };
}
