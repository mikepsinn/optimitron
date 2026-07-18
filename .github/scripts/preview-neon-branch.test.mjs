import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertDirectNeonConnectionUri,
  expectedPreviewBranchName,
  selectExactPreviewBranch,
} from "./preview-neon-branch.mjs";

const project = { id: "project-1", name: "Optimitron" };
const resolverScript = readFileSync(
  new URL("./resolve-preview-neon-env.mjs", import.meta.url),
  "utf8",
);

test("selects only the exact preview child branch", () => {
  const selected = selectExactPreviewBranch(
    [
      { project, branch: { id: "raw", name: "feature/example", parent_id: "main" } },
      { project, branch: { id: "fuzzy", name: "preview-feature-example", parent_id: "main" } },
      { project, branch: { id: "suffix", name: "team/feature/example", parent_id: "main" } },
      { project, branch: { id: "exact", name: "preview/feature/example", parent_id: "main" } },
    ],
    "feature/example",
  );

  assert.equal(expectedPreviewBranchName("feature/example"), "preview/feature/example");
  assert.equal(selected.branch.id, "exact");
});

test("rejects fuzzy matches, root branches, and duplicate exact matches", () => {
  assert.throws(
    () =>
      selectExactPreviewBranch(
        [{ project, branch: { name: "preview-feature-example", parent_id: "main" } }],
        "feature/example",
      ),
    /named exactly/u,
  );
  assert.throws(
    () =>
      selectExactPreviewBranch(
        [{ project, branch: { name: "preview/feature/example", parent_id: null } }],
        "feature/example",
      ),
    /Refusing Neon root branch/u,
  );
  assert.throws(
    () =>
      selectExactPreviewBranch(
        [
          { project, branch: { name: "preview/feature/example", parent_id: "main" } },
          { project: { id: "project-2" }, branch: { name: "preview/feature/example", parent_id: "main" } },
        ],
        "feature/example",
      ),
    /ambiguous/u,
  );
});

test("rejects pooled migration targets", () => {
  const direct =
    "postgresql://user:pass@ep-example.us-east-2.aws.neon.tech/neondb";
  assert.equal(assertDirectNeonConnectionUri(direct), direct);
  assert.throws(
    () =>
      assertDirectNeonConnectionUri(
        "postgresql://user:pass@ep-example-pooler.us-east-2.aws.neon.tech/neondb",
      ),
    /pooled connection URI/u,
  );
});

test("resolver cannot bypass exact branch selection", () => {
  assert.match(
    resolverScript,
    /listBranches\(project\.id, expectedBranchName\)/u,
  );
  assert.match(resolverScript, /limit: "10000"[\s\S]*?search/u);
  assert.match(resolverScript, /assertDirectNeonConnectionUri/u);
  assert.doesNotMatch(resolverScript, /configuredBranchId/u);
  assert.doesNotMatch(resolverScript, /normalizeBranchName|scoreBranch/u);
});
