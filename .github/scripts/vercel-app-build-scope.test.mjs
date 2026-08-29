import assert from "node:assert/strict";
import test from "node:test";
import {
  ensureVercelDiffBase,
  ensureVercelProductionDiffBase,
  getVercelAppBuildMatches,
  shouldAutoBuildPreview,
  getVercelDiffBase,
  getVercelGitFetchRemotes,
  getOptimitronProductionDeployMatches,
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
    getVercelAppBuildMatches("curedao", ["packages/survey-embed/src/index.ts"]),
    [],
  );
});

test("keeps Optimitron content inputs without treating docs as app inputs", () => {
  assert.deepEqual(
    getVercelAppBuildMatches("optimitron", [
      "content/legislation/example.md",
      "docs/strategy-note.md",
      "apps/warondisease/app/page.tsx",
      "packages/site-kit/src/lib/site-config.ts",
    ]),
    ["content/legislation/example.md"],
  );
});

test("keeps production database operation inputs in deployment scope", () => {
  const files = [
    "scripts/sync-managed-data.mjs",
    "scripts/unrelated-maintenance.mjs",
    "docs/strategy-note.md",
  ];

  assert.deepEqual(getVercelAppBuildMatches("optimitron", files), []);
  assert.deepEqual(getOptimitronProductionDeployMatches(files), [
    "scripts/sync-managed-data.mjs",
  ]);
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

test("uses the previous SHA for production deployments", () => {
  assert.equal(
    getVercelDiffBase({
      VERCEL_GIT_COMMIT_REF: "main",
      VERCEL_GIT_PREVIOUS_SHA: "1234567890abcdef1234567890abcdef12345678",
    }),
    "1234567890abcdef1234567890abcdef12345678",
  );
  assert.equal(
    getVercelDiffBase({}, () => "abcdef1234567890abcdef1234567890abcdef12"),
    "abcdef1234567890abcdef1234567890abcdef12",
  );
  assert.equal(
    getVercelDiffBase({ VERCEL_GIT_PREVIOUS_SHA: "not-a-sha" }, () => null),
    null,
  );
});

test("compares previews with main so canceled commits cannot hide changes", () => {
  const mergeBase = "abcdef1234567890abcdef1234567890abcdef12";
  assert.equal(
    getVercelDiffBase(
      {
        VERCEL_GIT_COMMIT_REF: "feature/example",
        VERCEL_GIT_PREVIOUS_SHA: "1234567890abcdef1234567890abcdef12345678",
      },
      () => mergeBase,
    ),
    mergeBase,
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
    if (args[0] === "merge-base" && fetched) return "";
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
    ["merge-base", "--is-ancestor", sha, "HEAD"],
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
    if (args[0] === "merge-base" && fetched.length === 2) return "";
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

test("rejects a previous Vercel SHA outside the current branch history", () => {
  const sha = "1234567890abcdef1234567890abcdef12345678";
  const calls = [];
  const execFile = (_command, args) => {
    calls.push(args);
    if (args[0] === "cat-file") return "";
    throw new Error("not an ancestor");
  };

  assert.equal(
    ensureVercelDiffBase(sha, {
      root: "/repo",
      execFile,
      fetchRemotes: ["origin"],
    }),
    null,
  );
  assert.deepEqual(calls, [
    ["cat-file", "-e", `${sha}^{commit}`],
    ["merge-base", "--is-ancestor", sha, "HEAD"],
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

test("fetches main to scope a branch's first Vercel deployment", () => {
  const mergeBase = "1234567890abcdef1234567890abcdef12345678";
  let fetched = false;
  const calls = [];
  const execFile = (_command, args) => {
    calls.push(args);
    if (args[0] === "fetch") {
      fetched = true;
      return "";
    }
    if (args[0] === "merge-base" && fetched) return mergeBase;
    throw new Error("missing production ref");
  };

  assert.equal(
    ensureVercelProductionDiffBase({
      root: "/repo",
      execFile,
      fetchRemotes: ["origin"],
      currentBranch: "feature/example",
    }),
    mergeBase,
  );
  assert.deepEqual(calls, [
    ["merge-base", "HEAD", "origin/main"],
    ["merge-base", "HEAD", "main"],
    ["fetch", "--no-tags", "--depth=100", "origin", "feature/example"],
    ["fetch", "--no-tags", "--depth=100", "origin", "main"],
    ["merge-base", "HEAD", "FETCH_HEAD"],
  ]);
});

test("does not compare a production deployment with its own HEAD", () => {
  let called = false;
  assert.equal(
    ensureVercelProductionDiffBase({
      currentBranch: "main",
      execFile: () => {
        called = true;
        return "";
      },
    }),
    null,
  );
  assert.equal(called, false);
});

test("ignores copy-review snapshots as build inputs", () => {
  assert.deepEqual(
    getVercelAppBuildMatches("warondisease", [
      "apps/warondisease/app/soldiers/page.logged-out.md",
      "apps/warondisease/emails/promo.email.md",
      "apps/warondisease/app/soldiers/page.tsx",
    ]),
    ["apps/warondisease/app/soldiers/page.tsx"],
  );
  assert.deepEqual(
    getVercelAppBuildMatches("acceleratedmedicine", [
      "apps/acceleratedmedicine/app/page.logged-out.md",
    ]),
    [],
  );
  // Optimitron serves its own snapshots at runtime (MCP getPageContent), so
  // a snapshot-only change there must still deploy.
  assert.deepEqual(
    getVercelAppBuildMatches("optimitron", [
      "apps/optimitron/src/app/treaty/page.logged-out.md",
    ]),
    ["apps/optimitron/src/app/treaty/page.logged-out.md"],
  );
});

test("gates preview builds behind the allowlist with commit-message opt-in", () => {
  const preview = { VERCEL_ENV: "preview" };
  for (const appName of ["optimitron", "warondisease", "acceleratedmedicine"]) {
    assert.equal(shouldAutoBuildPreview(appName, preview).build, true);
  }
  assert.equal(shouldAutoBuildPreview("dfda", preview).build, false);
  assert.equal(
    shouldAutoBuildPreview("dfda", {
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_MESSAGE: "Fix condition page [preview:dfda]",
    }).build,
    true,
  );
  assert.equal(
    shouldAutoBuildPreview("curedao", {
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_MESSAGE: "Rebrand shared footer [preview:all]",
    }).build,
    true,
  );
  assert.equal(
    shouldAutoBuildPreview("wishocracy", {
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_MESSAGE: "Ship [preview:dfda] only",
    }).build,
    false,
  );
  // Production and non-Vercel runs are never gated.
  assert.equal(
    shouldAutoBuildPreview("dfda", { VERCEL_ENV: "production" }).build,
    true,
  );
  assert.equal(shouldAutoBuildPreview("dfda", {}).build, true);
});
