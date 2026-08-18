import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getVercelPreviewBuildMatches,
  getPreviewSmokeMatches,
  shouldPreparePreviewDatabase,
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
    "apps/optimitron/src/app/tasks/page.tsx",
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
    "apps/optimitron/e2e/smoke.spec.ts",
    "packages/db/src/__tests__/seed.integration.test.ts",
  ];

  assert.equal(shouldRunPreviewSmoke(files), false);
  assert.deepEqual(getPreviewSmokeMatches(files), []);
});

test("prepares a database exactly for files in the Vercel preview build scope", () => {
  const files = [
    ".env.example",
    ".npmrc",
    "content/campaigns/treaty.md",
    "docs/canonical-argument-2026-05-20.md",
    "eslint.config.mjs",
    "package.json",
    "apps/optimitron/e2e/visual-review-page.spec.ts",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "scripts/render-pages-to-markdown.ts",
    "tsconfig.base.json",
  ];

  assert.equal(shouldPreparePreviewDatabase(files), true);
  assert.deepEqual(getVercelPreviewBuildMatches(files), files.sort());
});

test("keeps the Vercel ignore command on the shared scope matcher", () => {
  const vercelConfig = JSON.parse(
    readFileSync(
      new URL("../../apps/optimitron/vercel.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(
    vercelConfig.ignoreCommand,
    "node ../../.github/scripts/vercel-ignore-build.mjs",
  );
  assert.ok(vercelConfig.ignoreCommand.length <= 256);
});

test("does not resolve a preview database when Vercel skips the PR", () => {
  const files = [
    ".github/workflows/ci.yml",
    ".github/scripts/preview-smoke-scope.mjs",
    "docs/PREVIEW_DATA_PRIVACY.md",
    "README.md",
    "tsconfig.json",
  ];

  assert.equal(shouldPreparePreviewDatabase(files), false);
  assert.deepEqual(getVercelPreviewBuildMatches(files), []);
});
