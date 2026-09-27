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
const GITHUB_REPO = "JiWuChat";
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

// ==================== GitHub Release 数据源 ====================

/** GitHub Release 附件（安装包等） */
export interface GithubReleaseAsset {
    id: number;
    name: string;
    size: number;
    downloadUrl: string;
    contentType: string;
    createdAt: string;
}

/** GitHub Release 结构 */
export interface GithubRelease {
    id: number;
    tag_name: string;
    name: string;
    body: string;
    draft: boolean;
    prerelease: boolean;
    published_at: string;
    html_url: string;
    author: string;
    authorAvatar: string;
    assets: GithubReleaseAsset[];
}

/** 从 Release 正文中提取的标题（用于右侧目录导航） */
export interface ReleaseHeading {
    level: number;
    text: string;
    anchor: string;
}

/** 拉取 GitHub Releases */
async function fetchReleases(
    owner: string,
    repo: string,
    options: { per_page?: number } = {},
): Promise<GithubRelease[]> {
    const { per_page = 100 } = options;
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/releases?per_page=${per_page}`;

    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
    };
    if (GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
        throw new Error(`GitHub Release API 请求失败: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return (data || []).map((r: any) => ({
        id: r.id,
        tag_name: r.tag_name || "",
        name: r.name || r.tag_name || "",
        body: r.body || "",
        draft: !!r.draft,
        prerelease: !!r.prerelease,
        published_at: r.published_at || r.created_at || "",
        html_url: r.html_url || "",
        author: r.author?.login || "",
        authorAvatar: r.author?.avatar_url || "",
        assets: (r.assets || []).map((a: any) => ({
            id: a.id,
            name: a.name || "",
            size: a.size || 0,
            downloadUrl: a.browser_download_url || "",
            contentType: a.content_type || "",
            createdAt: a.created_at || "",
        })),
    }));
}

/** 从 Markdown 正文中提取标题（h1~h4），用于目录导航 */
function extractHeadings(markdown: string): ReleaseHeading[] {
    if (!markdown) return [];
    const headings: ReleaseHeading[] = [];
    const lines = markdown.split("\n");
    const seen = new Map<string, number>();

    for (const line of lines) {
        const match = line.match(/^(#{1,4})\s+(.+)$/);
        if (!match) continue;
        const level = match[1].length;
        const text = match[2].trim().replace(/[*_`~]/g, "");
        if (!text) continue;

        // 生成唯一 anchor
        let anchor = text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
            .replace(/^-+|-+$/g, "");
        const count = seen.get(anchor) || 0;
        seen.set(anchor, count + 1);
        if (count > 0) {
            anchor = `${anchor}-${count}`;
        }

        headings.push({ level, text, anchor });
    }
    return headings;
}

/** 组合式函数：拉取 GitHub Release 并支持目录导航 */
export function useGithubReleases() {
    const releases = ref<GithubRelease[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const selectedTag = ref("");
    const headings = ref<ReleaseHeading[]>([]);

    /** 加载 Releases */
    const loadReleases = async () => {
        loading.value = true;
        error.value = null;

        try {
            const list = await fetchReleases(GITHUB_OWNER, GITHUB_REPO);
            releases.value = list.filter((r) => !r.draft);

            // 默认选中最新版本
            if (releases.value.length > 0 && !selectedTag.value) {
                selectedTag.value = releases.value[0].tag_name;
            }
            updateHeadings();
        } catch (err) {
            error.value = err instanceof Error ? err.message : "加载更新日志失败";
        } finally {
            loading.value = false;
        }
    };

    /** 根据选中版本更新目录 */
    const updateHeadings = () => {
        const current = releases.value.find((r) => r.tag_name === selectedTag.value);
        headings.value = current ? extractHeadings(current.body) : [];
    };

    /** 选择版本 */
    const selectRelease = (tag: string) => {
        selectedTag.value = tag;
        updateHeadings();
    };

    return {
        releases,
        loading,
        error,
        selectedTag,
        headings,
        loadReleases,
        selectRelease,
        GITHUB_OWNER,
        GITHUB_REPO,
    };
}

// ==================== GitHub Release 附件（下载安装包） ====================

/** 从文件名推断平台标签（用于下载下拉框展示） */
function inferPlatformLabel(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".exe")) return "Windows";
    if (lower.endsWith(".dmg") || lower.endsWith(".zip")) return "macOS";
    if (
        lower.endsWith(".appimage") ||
        lower.endsWith(".deb") ||
        lower.endsWith(".rpm")
    ) {
        return "Linux";
    }
    return "安装包";
}

/** 组合式函数：拉取最新 Release 的附件（安装包），用于首页下载 */
export function useGithubReleaseAssets() {
    const assets = ref<GithubReleaseAsset[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    /** 加载最新 Release 的附件 */
    const loadAssets = async () => {
        loading.value = true;
        error.value = null;

        try {
            const list = await fetchReleases(GITHUB_OWNER, GITHUB_REPO, { per_page: 5 });
            // 取第一个非草稿的 Release 的附件
            const latest = list.find((r) => !r.draft);
            assets.value = latest?.assets || [];
        } catch (err) {
            error.value = err instanceof Error ? err.message : "加载下载列表失败";
        } finally {
            loading.value = false;
        }
    };

    return {
        assets,
        loading,
        error,
        loadAssets,
        inferPlatformLabel,
        GITHUB_OWNER,
        GITHUB_REPO,
    };
}
