import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(
  new URL("../workflows/ci.yml", import.meta.url),
  "utf8",
);

function jobRuns(job, github, overrides = {}) {
  const block = workflow.match(
    new RegExp(
      `^  ${job}:\\r?\\n([\\s\\S]*?)(?=^  [a-z][\\w-]*:|$(?![\\s\\S]))`,
      "m",
    ),
  )?.[1];
  assert.ok(block, `Missing job ${job}`);
  const expression = block.match(
    /    if: >-\r?\n((?:      [^\r\n]+\r?\n)+)/u,
  )?.[1];
  assert.ok(expression, `Missing folded condition for ${job}`);
  const needs = {
    changes: {
      outputs: { web: "true", site_apps: "false", web_deploy: "true" },
    },
    "web-validate": { result: "success" },
    "site-apps-validate": { result: "success" },
    ...overrides,
  };
  // These workflow expressions use the same boolean/string semantics as JS.
  const evaluate = new Function(
    "github",
    "needs",
    "fromJSON",
    "always",
    `return (${expression.replace(/needs\.([\w-]+)/gu, 'needs["$1"]')});`,
  );
  return evaluate(github, needs, JSON.parse, () => true);
}

test("main-base and stacked PRs can reach branch-specific preview synchronization", () => {
  const trigger = workflow.match(
    /^  pull_request:\r?\n([\s\S]*?)(?=^  \w+:)/mu,
  )?.[1];
  assert.notEqual(trigger, undefined);
  assert.doesNotMatch(
    trigger,
    /^\s+(?:branches|branches-ignore):/mu,
    "a base-branch filter strands stacked preview smoke waiting for an absent job",
  );
  for (const base of ["main", "feature/court-mcp-oauth"]) {
    assert.equal(
      jobRuns("sync-preview-managed-data", {
        event_name: "pull_request",
        ref: "refs/pull/346/merge",
        base_ref: base,
      }),
      true,
    );
  }
  assert.match(workflow, /PREVIEW_GIT_BRANCH: \$\{\{ github\.head_ref \}\}/u);
});

test("preview synchronization still requires relevant changes and successful validation", () => {
  const github = { event_name: "pull_request", ref: "refs/pull/346/merge" };
  for (const job of ["web-validate", "site-apps-validate"]) {
    assert.equal(
      jobRuns("sync-preview-managed-data", github, {
        [job]: { result: "failure" },
      }),
      false,
    );
  }
  assert.equal(
    jobRuns("sync-preview-managed-data", github, {
      changes: { outputs: { web: "false", site_apps: "false" } },
    }),
    false,
  );
  assert.equal(
    jobRuns("sync-preview-managed-data", github, {
      changes: { outputs: { web: "false", site_apps: "true" } },
    }),
    true,
  );
  assert.equal(
    jobRuns("sync-preview-managed-data", { event_name: "workflow_dispatch" }),
    false,
  );
});

test("stacked PR eligibility never grants production deployment or data synchronization", () => {
  assert.match(workflow, /^  push:\r?\n    branches: \[main\]/mu);
  for (const job of ["sync-production-managed-data", "deploy-production"]) {
    for (const ref of [
      "refs/heads/main",
      "refs/heads/feature/court-mcp",
      "refs/pull/346/merge",
    ]) {
      assert.equal(jobRuns(job, { event_name: "pull_request", ref }), false);
    }
    for (const event_name of ["push", "workflow_dispatch"]) {
      assert.equal(
        jobRuns(job, { event_name, ref: "refs/heads/feature/court-mcp" }),
        false,
      );
      assert.equal(jobRuns(job, { event_name, ref: "refs/heads/main" }), true);
    }
  }
});
