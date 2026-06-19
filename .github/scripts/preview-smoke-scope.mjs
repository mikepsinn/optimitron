const PREVIEW_SMOKE_PATTERN_SOURCES = [
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

export const PREVIEW_SMOKE_PATTERNS = PREVIEW_SMOKE_PATTERN_SOURCES.map(
  (source) => new RegExp(source),
);

export function getPreviewSmokeMatches(files) {
  return files
    .filter((file) => !isTestOnlyFile(file))
    .filter((file) => PREVIEW_SMOKE_PATTERNS.some((pattern) => pattern.test(file)))
    .sort();
}

export function shouldRunPreviewSmoke(files) {
  return getPreviewSmokeMatches(files).length > 0;
}

function isTestOnlyFile(file) {
  return (
    file.includes("/__tests__/") ||
    /\.(?:spec|test)\.[cm]?[jt]sx?$/u.test(file)
  );
}
