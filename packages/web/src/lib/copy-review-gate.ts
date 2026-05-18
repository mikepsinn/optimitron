export interface CopyReviewGateResult {
  publicCopyPaths: string[];
  shouldBlock: boolean;
}

export interface CopyReviewGateInput {
  changedPaths: string[];
  env?: Record<string, string | undefined>;
}

const PUBLIC_COPY_LIB_FILES = new Set([
  "packages/web/src/lib/messaging.ts",
  "packages/web/src/lib/routes.ts",
  "packages/web/src/lib/site.ts",
  "packages/web/src/lib/share-message.ts",
]);

function normalizePath(filePath: string) {
  return filePath.replace(/\\/g, "/");
}

function isTestOrFixturePath(filePath: string) {
  return (
    filePath.includes("/__tests__/") ||
    filePath.includes("/test/") ||
    /\.(test|spec)\.[cm]?[jt]sx?$/.test(filePath)
  );
}

export function isPublicCopyPath(filePath: string) {
  const normalized = normalizePath(filePath);

  if (!normalized.startsWith("packages/web/")) return false;
  if (isTestOrFixturePath(normalized)) return false;

  if (PUBLIC_COPY_LIB_FILES.has(normalized)) return true;

  if (
    normalized.startsWith("packages/web/src/lib/email/") ||
    normalized.startsWith("packages/web/src/lib/tasks/share-templates") ||
    normalized.startsWith("packages/web/src/content/") ||
    normalized.startsWith("packages/web/src/messages/")
  ) {
    return true;
  }

  if (normalized.startsWith("packages/web/src/components/")) {
    return /\.(tsx|md|mdx|json)$/.test(normalized);
  }

  if (normalized.startsWith("packages/web/src/app/")) {
    if (normalized.includes("/api/")) return false;
    return (
      /\/(page|layout|loading|error|not-found|opengraph-image)\.(tsx|ts|md|mdx)$/.test(
        normalized,
      ) || /\.logged-(out|in)\.md$/.test(normalized)
    );
  }

  return false;
}

function isApproved(env: Record<string, string | undefined>) {
  return env.COPY_REVIEW_APPROVED === "1";
}

export function buildCopyReviewGateResult({
  changedPaths,
  env = process.env,
}: CopyReviewGateInput): CopyReviewGateResult {
  const publicCopyPaths = Array.from(
    new Set(changedPaths.map(normalizePath).filter(isPublicCopyPath)),
  );

  return {
    publicCopyPaths,
    shouldBlock: publicCopyPaths.length > 0 && !isApproved(env),
  };
}

export function formatCopyReviewGateMessage(publicCopyPaths: string[]) {
  const fileList = publicCopyPaths.map((filePath) => `  - ${filePath}`).join("\n");

  return `Public copy changed. Commit is blocked until Mike explicitly approves the copy.

Changed public-copy files:
${fileList}

Before approval, give Mike the shortest useful copy brief:

Audience:
Desired action:
Motivation:
Old copy's strategic job:
Why the new copy increases the action:
Manual/source phrase checked:
Minimum question for Mike:

Required local review when applicable:
  pnpm --filter @optimitron/web copy:preview
  pnpm --filter @optimitron/web review:local -- --skip-visual

After Mike approves the copy, commit deliberately.
PowerShell:
  $env:COPY_REVIEW_APPROVED="1"; git commit; Remove-Item Env:COPY_REVIEW_APPROVED
Bash:
  COPY_REVIEW_APPROVED=1 git commit
`;
}
