import assert from "node:assert/strict";
import test from "node:test";
import {
  ensureVercelDiffBase,
  getVercelAppBuildMatches,
  getVercelDiffBase,
  getVercelGitFetchRemotes,
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

test("ignores app-only test and visual-review tooling", () => {
  const files = [
    "apps/optimitron/e2e/visual-regression.spec.ts",
    "apps/optimitron/scripts/build-visual-review.mjs",
    "apps/optimitron/scripts/visual-review-page.mjs",
    "apps/optimitron/src/lib/routes.test.ts",
    "apps/optimitron/src/lib/routes.ts",
    "apps/optimitron/scripts/next-build.mjs",
    "apps/warondisease/tests/navigation.test.ts",
  ];

  assert.deepEqual(getVercelAppBuildMatches("optimitron", files), [
    "apps/optimitron/scripts/next-build.mjs",
    "apps/optimitron/src/lib/routes.ts",
  ]);
  assert.deepEqual(getVercelAppBuildMatches("warondisease", files), []);
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
  assert.equal(
    getVercelDiffBase({}, () => "abcdef1234567890abcdef1234567890abcdef12"),
    "abcdef1234567890abcdef1234567890abcdef12",
  );
  assert.equal(
    getVercelDiffBase(
      { VERCEL_GIT_PREVIOUS_SHA: "not-a-sha" },
      () => null,
    ),
    null,
  );
});

test("fetches a missing Vercel diff base in a shallow clone", () => {
  const sha = "1234567890abcdef1234567890abcdef12345678";
  const calls = [];
  let fetched = false;
  const execFile = (_command, args) => {
    calls.push(args);
    if (args[0] === "fetch") {
      fetched = true;
      return "";
    }
    if (args[0] === "cat-file" && fetched) return "";
    throw new Error("missing commit");
  };

  assert.equal(
    ensureVercelDiffBase(sha, {
      root: "/repo",
      execFile,
      fetchRemotes: ["origin"],
    }),
    sha,
  );
  assert.deepEqual(calls, [
    ["cat-file", "-e", `${sha}^{commit}`],
    ["fetch", "--no-tags", "--depth=1", "origin", sha],
    ["cat-file", "-e", `${sha}^{commit}`],
  ]);
});

test("falls back to the public GitHub remote when Vercel omits origin", () => {
  const sha = "1234567890abcdef1234567890abcdef12345678";
  const fetchRemotes = getVercelGitFetchRemotes({
    VERCEL_GIT_REPO_OWNER: "mikepsinn",
    VERCEL_GIT_REPO_SLUG: "optimitron",
  });
  const fetched = [];
  const execFile = (_command, args) => {
    if (args[0] === "fetch") {
      fetched.push(args[3]);
      if (args[3] === fetchRemotes[1]) return "";
      throw new Error("missing origin");
    }
    if (args[0] === "cat-file" && fetched.length === 2) return "";
    throw new Error("missing commit");
  };

  assert.equal(
    ensureVercelDiffBase(sha, { root: "/repo", execFile, fetchRemotes }),
    sha,
  );
  assert.deepEqual(fetched, [
    "origin",
    "https://github.com/mikepsinn/optimitron.git",
  ]);
});

test("builds safely when a missing Vercel diff base cannot be fetched", () => {
  const execFile = () => {
    throw new Error("missing commit");
  };

  assert.equal(
    ensureVercelDiffBase("1234567890abcdef1234567890abcdef12345678", {
      root: "/repo",
      execFile,
      fetchRemotes: ["origin"],
    }),
    null,
  );
});
