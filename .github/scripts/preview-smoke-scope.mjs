const PREVIEW_SMOKE_PATTERN_SOURCES = [
  "^apps/optimitron/",
  "^packages/",
  "^scripts/",
  "^package\\.json$",
  "^pnpm-lock\\.yaml$",
  "^pnpm-workspace\\.yaml$",
  "^turbo\\.json$",
  "^tsconfig(?:\\.[^/]+)?\\.json$",
  "^vitest(?:\\.[^/]+)?\\.[cm]?[jt]s$",
  "^playwright(?:\\.[^/]+)?\\.[cm]?[jt]s$",
];
const VERCEL_PREVIEW_BUILD_PATTERN_SOURCES = [
  "^apps/optimitron/",
  "^packages/",
  "^content/",
  "^docs/canonical-argument-2026-05-20\\.md$",
  "^scripts/",
  "^package\\.json$",
  "^pnpm-lock\\.yaml$",
  "^pnpm-workspace\\.yaml$",
  "^tsconfig\\.base\\.json$",
  "^eslint\\.config\\.mjs$",
  "^\\.npmrc$",
  "^\\.env\\.example$",
];

export const PREVIEW_SMOKE_PATTERNS = PREVIEW_SMOKE_PATTERN_SOURCES.map(
  (source) => new RegExp(source),
);
export const VERCEL_PREVIEW_BUILD_PATTERNS =
  VERCEL_PREVIEW_BUILD_PATTERN_SOURCES.map((source) => new RegExp(source));

export function getPreviewSmokeMatches(files) {
  return files
    .filter((file) => !isTestOnlyFile(file))
    .filter((file) => PREVIEW_SMOKE_PATTERNS.some((pattern) => pattern.test(file)))
    .sort();
}

export function shouldRunPreviewSmoke(files) {
  return getPreviewSmokeMatches(files).length > 0;
}

// Mirrors apps/optimitron/vercel.json. Unlike smoke scope, test-only changes
// still count because Vercel builds them.
export function getVercelPreviewBuildMatches(files) {
  return files
    .filter((file) =>
      VERCEL_PREVIEW_BUILD_PATTERNS.some((pattern) => pattern.test(file)),
    )
    .sort();
}

export function shouldPreparePreviewDatabase(files) {
  return getVercelPreviewBuildMatches(files).length > 0;
}

function isTestOnlyFile(file) {
  return (
    file.includes("/__tests__/") ||
    /\.(?:spec|test)\.[cm]?[jt]sx?$/u.test(file)
  );
}
