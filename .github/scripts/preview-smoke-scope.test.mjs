import assert from "node:assert/strict";
import test from "node:test";
import {
  getPreviewSmokeMatches,
  shouldRunPreviewSmoke,
} from "./preview-smoke-scope.mjs";

test("skips database-gated preview smoke scope for workflow-only deployment plumbing", () => {
  const files = [
    ".github/workflows/ci.yml",
    ".github/workflows/smoke-deploy.yml",
    ".github/scripts/preview-smoke-scope.mjs",
  ];

  assert.equal(shouldRunPreviewSmoke(files), false);
  assert.deepEqual(getPreviewSmokeMatches(files), []);
});

test("runs preview smoke for app, database, and shared package changes", () => {
  const files = [
    "packages/web/src/app/tasks/page.tsx",
    "packages/db/prisma/schema.prisma",
    "packages/data/src/parameters/parameters.ts",
  ];

  assert.equal(shouldRunPreviewSmoke(files), true);
  assert.deepEqual(getPreviewSmokeMatches(files), files.sort());
});

test("runs preview smoke for package manager and build configuration changes", () => {
  const files = [
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "turbo.json",
    "tsconfig.base.json",
    "playwright.config.ts",
  ];

  assert.equal(shouldRunPreviewSmoke(files), true);
  assert.deepEqual(getPreviewSmokeMatches(files), files.sort());
});

test("ignores test-only files under runtime paths", () => {
  const files = [
    "packages/web/e2e/smoke.spec.ts",
    "packages/db/src/__tests__/seed.integration.test.ts",
  ];

  assert.equal(shouldRunPreviewSmoke(files), false);
  assert.deepEqual(getPreviewSmokeMatches(files), []);
});
