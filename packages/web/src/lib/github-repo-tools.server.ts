type GitHubJson = Record<string, unknown>;

interface RepoToolInput {
  ref?: string;
  repo: string;
}

export interface SearchRepoInput {
  fileType?: string;
  limit?: number;
  path?: string;
  query: string;
  repo?: string;
}

export interface FileContentInput extends RepoToolInput {
  path: string;
}

export interface ListRepoFilesInput extends RepoToolInput {
  path?: string;
}

const DEFAULT_REPO = "mikepsinn/optimitron";
const DEFAULT_REF = "main";
const CONTENT_CACHE_TTL_MS = 60_000;

const fileContentCache = new Map<
  string,
  { expiresAt: number; value: Record<string, unknown> }
>();

function getDefaultRepo() {
  return normalizeRepo(process.env.GITHUB_DEFAULT_REPO ?? DEFAULT_REPO);
}

function getToken() {
  return process.env.GITHUB_PAT ?? process.env.GITHUB_TOKEN ?? null;
}

function getAllowedRepoPatterns() {
  const configured = process.env.GITHUB_REPO_ALLOWLIST?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (configured?.length) {
    return configured.map((entry) =>
      entry.includes("/") ? entry.toLowerCase() : normalizeRepo(entry),
    );
  }

  return [getDefaultRepo()];
}

function normalizeRepo(repo: string) {
  const trimmed = repo.trim().replace(/^https:\/\/github\.com\//i, "");
  if (!trimmed) {
    throw new Error("repo is required");
  }

  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length === 1) {
    const [owner] = DEFAULT_REPO.split("/");
    return `${owner}/${parts[0]}`.toLowerCase();
  }

  if (parts.length !== 2) {
    throw new Error("repo must be a repository name or owner/repo");
  }

  return `${parts[0]}/${parts[1]}`.toLowerCase();
}

function isRepoAllowed(repo: string) {
  return getAllowedRepoPatterns().some((pattern) => {
    if (pattern === "*" || pattern === repo) return true;
    if (pattern.endsWith("/*")) {
      return repo.startsWith(pattern.slice(0, -1));
    }
    return false;
  });
}

function assertRepoAllowed(repo: string) {
  if (!isRepoAllowed(repo)) {
    throw new Error(
      `Repository ${repo} is not in GITHUB_REPO_ALLOWLIST. Add it explicitly before exposing it through MCP.`,
    );
  }
}

function normalizeGitHubPath(path: string | null | undefined) {
  const normalized = (path ?? "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .join("/");

  if (normalized.split("/").includes("..")) {
    throw new Error("GitHub paths cannot contain '..'");
  }

  return normalized;
}

function encodeRepoPath(path: string) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("%2F");
}

function cleanQualifierValue(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, "") ?? "";
}

function normalizeLimit(value: number | null | undefined, fallback: number, max: number) {
  if (!Number.isFinite(value ?? NaN)) return fallback;
  return Math.max(1, Math.min(max, Math.floor(value as number)));
}

async function githubJson(pathname: string, options: { searchParams?: URLSearchParams } = {}) {
  const url = new URL(pathname, "https://api.github.com");
  if (options.searchParams) {
    url.search = options.searchParams.toString();
  }

  const token = getToken();
  const response = await fetch(url.toString(), {
    headers: {
      accept: "application/vnd.github.text-match+json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      "user-agent": "optimitron-mcp",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 500)}`);
  }

  return {
    body: (await response.json()) as unknown,
    lastModified: response.headers.get("last-modified"),
  };
}

function decodeContent(record: GitHubJson) {
  const encoding = typeof record.encoding === "string" ? record.encoding : null;
  const content = typeof record.content === "string" ? record.content : null;

  if (encoding !== "base64" || !content) {
    throw new Error("GitHub response did not include base64 file content");
  }

  return Buffer.from(content.replace(/\s/g, ""), "base64").toString("utf8");
}

function toFileResult(input: {
  content: string;
  lastModified: string | null;
  record: GitHubJson;
  ref: string;
  repo: string;
}) {
  return {
    content: input.content,
    htmlUrl: typeof input.record.html_url === "string" ? input.record.html_url : null,
    lastModified: input.lastModified,
    name: typeof input.record.name === "string" ? input.record.name : null,
    path: typeof input.record.path === "string" ? input.record.path : null,
    ref: input.ref,
    repo: input.repo,
    sha: typeof input.record.sha === "string" ? input.record.sha : null,
    size: typeof input.record.size === "number" ? input.record.size : null,
  };
}

export async function getFileContent(input: FileContentInput) {
  const repo = normalizeRepo(input.repo);
  assertRepoAllowed(repo);
  const ref = input.ref?.trim() || DEFAULT_REF;
  const path = normalizeGitHubPath(input.path);
  if (!path) throw new Error("path is required");

  const cacheKey = `${repo}:${ref}:${path}`;
  const cached = fileContentCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const { body, lastModified } = await githubJson(
    `/repos/${repo}/contents/${encodeRepoPath(path)}`,
    { searchParams: new URLSearchParams({ ref }) },
  );
  if (Array.isArray(body)) {
    throw new Error(`${path} is a directory. Use listRepoFiles instead.`);
  }

  const record = body as GitHubJson;
  const result = toFileResult({
    content: decodeContent(record),
    lastModified,
    record,
    ref,
    repo,
  });
  fileContentCache.set(cacheKey, {
    expiresAt: Date.now() + CONTENT_CACHE_TTL_MS,
    value: result,
  });
  return result;
}

export async function listRepoFiles(input: ListRepoFilesInput) {
  const repo = normalizeRepo(input.repo);
  assertRepoAllowed(repo);
  const ref = input.ref?.trim() || DEFAULT_REF;
  const path = normalizeGitHubPath(input.path);

  const endpoint = path
    ? `/repos/${repo}/contents/${encodeRepoPath(path)}`
    : `/repos/${repo}/contents`;
  const { body, lastModified } = await githubJson(endpoint, {
    searchParams: new URLSearchParams({ ref }),
  });
  const entries = (Array.isArray(body) ? body : [body]).map((entry) => {
    const record = entry as GitHubJson;
    return {
      downloadUrl:
        typeof record.download_url === "string" ? record.download_url : null,
      htmlUrl: typeof record.html_url === "string" ? record.html_url : null,
      name: typeof record.name === "string" ? record.name : null,
      path: typeof record.path === "string" ? record.path : null,
      sha: typeof record.sha === "string" ? record.sha : null,
      size: typeof record.size === "number" ? record.size : null,
      type: typeof record.type === "string" ? record.type : null,
    };
  });

  return { entries, lastModified, path, ref, repo };
}

function buildSearchQuery(input: SearchRepoInput) {
  const terms = [input.query.trim()];
  const repo = input.repo ? normalizeRepo(input.repo) : getDefaultRepo();
  assertRepoAllowed(repo);
  terms.push(`repo:${repo}`);

  const path = cleanQualifierValue(input.path);
  if (path) terms.push(`path:${path}`);

  const fileType = cleanQualifierValue(input.fileType);
  if (fileType) terms.push(`extension:${fileType.replace(/^\./, "")}`);

  return { query: terms.join(" "), repo };
}

function normalizeTextMatches(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const record = entry as GitHubJson;
      return typeof record.fragment === "string" ? record.fragment : null;
    })
    .filter((entry): entry is string => Boolean(entry));
}

export async function searchRepo(input: SearchRepoInput) {
  if (!input.query?.trim()) {
    throw new Error("query is required");
  }

  const { query } = buildSearchQuery(input);
  const searchParams = new URLSearchParams({
    per_page: String(normalizeLimit(input.limit, 10, 25)),
    q: query,
  });

  const { body } = await githubJson("/search/code", { searchParams });
  const record = body as GitHubJson;
  const items = Array.isArray(record.items) ? record.items : [];

  return {
    query,
    results: items.map((item) => {
      const result = item as GitHubJson;
      const repository = result.repository as GitHubJson | undefined;
      return {
        htmlUrl: typeof result.html_url === "string" ? result.html_url : null,
        name: typeof result.name === "string" ? result.name : null,
        path: typeof result.path === "string" ? result.path : null,
        repo:
          repository && typeof repository.full_name === "string"
            ? repository.full_name
            : null,
        sha: typeof result.sha === "string" ? result.sha : null,
        textMatches: normalizeTextMatches(result.text_matches),
      };
    }),
    totalCount:
      typeof record.total_count === "number" ? record.total_count : items.length,
  };
}

const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "PUT", "DELETE"]);

export interface CallGitHubApiInput {
  /// Optional JSON body for non-GET requests. Strings are sent verbatim
  /// (raw markdown for issue/PR bodies); objects are JSON.stringify'd.
  body?: unknown;
  method?: string;
  /// Path on api.github.com starting with `/`, e.g. `/repos/mikepsinn/optimitron/issues`.
  path: string;
  /// Optional query-string params. Keys with null/undefined values are dropped.
  query?: Record<string, string | number | boolean | null | undefined>;
}

/**
 * Generic pass-through to api.github.com using the server-side token.
 * Admin-only at the MCP layer (see TOOL_SCOPES). Repo-allowlist enforced on
 * any path that targets `/repos/<owner>/<repo>/...` so a stolen admin
 * session can't escape to repos outside `GITHUB_REPO_ALLOWLIST`.
 *
 * Non-repo paths (e.g. `/user`, `/octocat`, `/search/code`) are allowed
 * without further filtering — the token's fine-grained scopes are the
 * authoritative gate. Configure the PAT with no `Administration`,
 * `Webhooks`, `Workflows: Write`, or secrets permissions; see
 * docs/MCP_SERVER.md for the recommended permission matrix.
 */
export async function callGitHubApi(input: CallGitHubApiInput) {
  const method = (input.method ?? "GET").toUpperCase();
  if (!ALLOWED_METHODS.has(method)) {
    throw new Error(
      `Unsupported HTTP method '${method}'. Use one of ${[...ALLOWED_METHODS].join(", ")}.`,
    );
  }

  const path = input.path?.trim();
  if (!path?.startsWith("/")) {
    throw new Error("path must start with '/' (e.g. /repos/mikepsinn/optimitron/issues)");
  }

  const repoMatch = path.match(/^\/repos\/([^/]+)\/([^/?#]+)/);
  if (repoMatch) {
    const repo = `${repoMatch[1]!}/${repoMatch[2]!}`.toLowerCase();
    assertRepoAllowed(repo);
  }

  const url = new URL(path, "https://api.github.com");
  if (input.query) {
    for (const [key, value] of Object.entries(input.query)) {
      if (value === null || value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }

  const token = getToken();
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": "optimitron-mcp",
    "x-github-api-version": "2022-11-28",
  };
  if (token) headers.authorization = `Bearer ${token}`;

  let serializedBody: string | undefined;
  if (input.body !== undefined && method !== "GET") {
    if (typeof input.body === "string") {
      serializedBody = input.body;
    } else {
      serializedBody = JSON.stringify(input.body);
      headers["content-type"] = "application/json";
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    ...(serializedBody !== undefined ? { body: serializedBody } : {}),
  });

  const text = await response.text();
  let body: unknown = text;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      // Non-JSON response (e.g. raw text, empty 204) — pass through as string.
    }
  }

  return {
    body,
    method,
    ok: response.ok,
    status: response.status,
    url: url.toString(),
  };
}
