const PREVIEW_MANAGED_DATA_PATTERN_SOURCES = [
  "^scripts/sync-managed-data\\.mjs$",
  "^packages/db/prisma/",
  "^packages/db/scripts/sync-managed-data\\.ts$",
  "^packages/db/src/constants\\.ts$",
  "^packages/db/src/managed-data/",
  "^packages/db/src/system-users\\.ts$",
  "^packages/db/src/task-keys\\.ts$",
  "^packages/data/src/datasets/",
  "^packages/data/src/jurisdictions\\.ts$",
  "^packages/data/src/parameters(?:/|\\.ts$)",
  "^apps/optimitron/public/images/leaders/manifest\\.json$",
  "^apps/optimitron/scripts/verify-preview-masking\\.mjs$",
];
const PREVIEW_MEDICAL_REFERENCE_PATTERN_SOURCES = [
  "^packages/data/src/datasets/medical/",
  "^packages/db/src/managed-data/seed-data/",
];

export const PREVIEW_MANAGED_DATA_PATTERNS =
  PREVIEW_MANAGED_DATA_PATTERN_SOURCES.map((source) => new RegExp(source));
export const PREVIEW_MEDICAL_REFERENCE_PATTERNS =
  PREVIEW_MEDICAL_REFERENCE_PATTERN_SOURCES.map((source) => new RegExp(source));

export function getPreviewManagedDataSyncMatches(files) {
  return files
    .filter((file) => !isTestOnlyFile(file))
    .filter((file) => PREVIEW_MANAGED_DATA_PATTERNS.some((pattern) => pattern.test(file)))
    .sort();
}

export function getPreviewMedicalReferenceSyncMatches(files) {
  return files
    .filter((file) => !isTestOnlyFile(file))
    .filter((file) => PREVIEW_MEDICAL_REFERENCE_PATTERNS.some((pattern) => pattern.test(file)))
    .sort();
}

export function shouldSyncPreviewManagedData(files) {
  return getPreviewManagedDataSyncMatches(files).length > 0;
}

export function shouldSyncPreviewMedicalReferenceData(files) {
  return getPreviewMedicalReferenceSyncMatches(files).length > 0;
}

function isTestOnlyFile(file) {
  return file.includes("/__tests__/") || /\.test\.[cm]?[jt]sx?$/u.test(file);
}
