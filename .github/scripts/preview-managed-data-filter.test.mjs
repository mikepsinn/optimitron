import assert from "node:assert/strict";
import test from "node:test";
import {
  getPreviewManagedDataSyncMatches,
  getPreviewMedicalReferenceSyncMatches,
  shouldSyncPreviewMedicalReferenceData,
  shouldSyncPreviewManagedData,
} from "./preview-managed-data-filter.mjs";

test("skips preview managed-data sync for copy and UI-only changes", () => {
  const files = [
    "AGENTS.md",
    "packages/web/src/app/endorse/page.logged-out.md",
    "packages/web/src/components/shared/ParameterValue.tsx",
    "packages/web/scripts/build-visual-review.mjs",
  ];

  assert.equal(shouldSyncPreviewManagedData(files), false);
  assert.deepEqual(getPreviewManagedDataSyncMatches(files), []);
});

test("runs preview managed-data sync for database and managed-data changes", () => {
  const files = [
    "packages/db/prisma/schema.prisma",
    "packages/db/src/managed-data/managed-task-triggers.ts",
    "packages/data/src/parameters/parameters-calculations-citations.ts",
  ];

  assert.equal(shouldSyncPreviewManagedData(files), true);
  assert.deepEqual(getPreviewManagedDataSyncMatches(files), files.sort());
});

test("runs preview managed-data sync for masking and leader-data inputs", () => {
  const files = [
    "packages/web/scripts/verify-preview-masking.mjs",
    "packages/web/public/images/leaders/manifest.json",
    "packages/data/src/datasets/government-leaders.ts",
  ];

  assert.equal(shouldSyncPreviewManagedData(files), true);
});

test("ignores test-only files under managed-data inputs", () => {
  const files = [
    "packages/db/src/managed-data/optimize-earth-task-tree.test.ts",
    "packages/db/src/__tests__/seed.integration.test.ts",
  ];

  assert.equal(shouldSyncPreviewManagedData(files), false);
  assert.deepEqual(getPreviewManagedDataSyncMatches(files), []);
});

test("only runs preview medical reference seed for medical dataset inputs", () => {
  assert.equal(
    shouldSyncPreviewMedicalReferenceData([
      "packages/db/src/managed-data/managed-seed-data.ts",
      "packages/db/prisma/schema.prisma",
    ]),
    false,
  );

  const medicalFiles = [
    "packages/data/src/datasets/medical/conditions.ts",
    "packages/db/src/managed-data/seed-data/global-variables.ts",
  ];
  assert.equal(shouldSyncPreviewMedicalReferenceData(medicalFiles), true);
  assert.deepEqual(
    getPreviewMedicalReferenceSyncMatches(medicalFiles),
    medicalFiles.sort(),
  );
});
