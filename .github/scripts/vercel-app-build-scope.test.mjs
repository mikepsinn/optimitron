import assert from "node:assert/strict";
import test from "node:test";
import {
  getVercelAppBuildMatches,
  getVercelDiffBase,
} from "./vercel-app-build-scope.mjs";

const apps = [
  "optimitron",
  "warondisease",
  "dfda",
  "wishocracy",
  "trialabundancesurvey",
  "curedao",
  "acceleratedmedicine",
];

test("matches each app and its transitive workspace dependencies", () => {
  assert.deepEqual(
    getVercelAppBuildMatches("warondisease", [
      "apps/warondisease/app/page.tsx",
      "apps/curedao/app/page.tsx",
      "packages/site-kit/src/lib/site-config.ts",
      "packages/chat-ui/src/index.ts",
    ]),
    [
      "apps/warondisease/app/page.tsx",
      "packages/site-kit/src/lib/site-config.ts",
    ],
  );
  assert.deepEqual(
    getVercelAppBuildMatches("acceleratedmedicine", [
      "packages/survey-embed/src/index.ts",
    ]),
    ["packages/survey-embed/src/index.ts"],
  );
  assert.deepEqual(
    getVercelAppBuildMatches("curedao", [
      "packages/survey-embed/src/index.ts",
    ]),
    [],
  );
});

test("keeps Optimitron content inputs without treating it as the default app", () => {
  assert.deepEqual(
    getVercelAppBuildMatches("optimitron", [
      "content/legislation/example.md",
      "docs/canonical-argument-2026-05-20.md",
      "apps/warondisease/app/page.tsx",
    ]),
    [
      "content/legislation/example.md",
      "docs/canonical-argument-2026-05-20.md",
    ],
  );
});

test("ignores global review and documentation changes", () => {
  const files = [
    ".github/workflows/ci.yml",
    ".github/scripts/preview-smoke-scope.mjs",
    "apps/DEPLOYMENT.md",
    "docs/README.md",
    "README.md",
  ];

  for (const app of apps) {
    assert.deepEqual(getVercelAppBuildMatches(app, files), []);
  }
});

test("rebuilds every app for root dependency inputs", () => {
  const files = ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"];

  for (const app of apps) {
    assert.deepEqual(getVercelAppBuildMatches(app, files), files);
  }
});

test("compares with the last successful deployment when Vercel provides it", () => {
  assert.equal(
    getVercelDiffBase({
      VERCEL_GIT_PREVIOUS_SHA: "1234567890abcdef1234567890abcdef12345678",
    }),
    "1234567890abcdef1234567890abcdef12345678",
  );
  assert.equal(getVercelDiffBase({}), "HEAD^");
  assert.equal(
    getVercelDiffBase({ VERCEL_GIT_PREVIOUS_SHA: "not-a-sha" }),
    "HEAD^",
  );
});
