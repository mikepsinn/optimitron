import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const WORKFLOW = fileURLToPath(
  new URL("../workflows/ci.yml", import.meta.url),
);

test("verifies preview masking after preview managed-data sync", () => {
  const workflow = readFileSync(WORKFLOW, "utf8");

  const anonymizeIndex = workflow.indexOf(
    "- name: Apply preview database anonymization",
  );
  const syncIndex = workflow.indexOf("- name: Sync preview managed data");
  const reapplyIndex = workflow.indexOf(
    "- name: Re-apply preview database anonymization after managed data",
  );
  const verifyIndex = workflow.indexOf(
    "- name: Verify preview masking applied to rows",
  );

  assert.notEqual(anonymizeIndex, -1, "anonymization step is missing");
  assert.notEqual(syncIndex, -1, "preview managed-data sync step is missing");
  assert.notEqual(reapplyIndex, -1, "post-sync anonymization step is missing");
  assert.notEqual(verifyIndex, -1, "preview masking verification step is missing");

  assert.ok(
    anonymizeIndex < syncIndex,
    "preview database anonymization should run before managed-data sync",
  );
  assert.ok(
    syncIndex < verifyIndex,
    "preview masking verification must run after managed-data sync so rows created by the sync are sampled",
  );
  assert.ok(
    syncIndex < reapplyIndex,
    "preview database anonymization should re-run after managed-data sync",
  );
  assert.ok(
    reapplyIndex < verifyIndex,
    "preview masking verification must run after the post-sync anonymization pass",
  );
});

test("keeps visual review status pending until the Pages URL is live", () => {
  const workflow = readFileSync(WORKFLOW, "utf8");

  const prepareIndex = workflow.indexOf(
    "- name: Prepare per-PR visual review directory",
  );
  const pendingIndex = workflow.indexOf(
    "- name: Post Visual review pending status",
  );
  const publishIndex = workflow.indexOf(
    "- name: Publish visual review to gh-pages",
  );
  const waitIndex = workflow.indexOf("- name: Wait for visual review page");
  const finalStatusIndex = workflow.indexOf(
    "- name: Post Visual review commit status",
  );
  const failIndex = workflow.indexOf(
    "- name: Fail if visual review page is unavailable",
  );

  assert.notEqual(prepareIndex, -1, "visual review prepare step is missing");
  assert.notEqual(pendingIndex, -1, "visual review pending status is missing");
  assert.notEqual(publishIndex, -1, "visual review publish step is missing");
  assert.notEqual(waitIndex, -1, "visual review wait step is missing");
  assert.notEqual(finalStatusIndex, -1, "visual review final status is missing");
  assert.notEqual(failIndex, -1, "visual review failure gate is missing");

  assert.ok(
    prepareIndex < pendingIndex,
    "visual review target URL should be prepared before posting pending status",
  );
  assert.ok(
    pendingIndex < publishIndex,
    "Visual review status should be pending while gh-pages publish runs",
  );
  assert.ok(
    publishIndex < waitIndex,
    "workflow should wait for Pages only after publishing to gh-pages",
  );
  assert.ok(
    waitIndex < finalStatusIndex,
    "final Visual review status should be posted after the live-page wait",
  );
  assert.ok(
    finalStatusIndex < failIndex,
    "failure status should be posted before failing the job",
  );

  assert.match(
    workflow,
    /review_url=https:\/\/mikepsinn\.github\.io\/optimitron\/pr-\$\{\{ github\.event\.pull_request\.number \}\}\/latest\//,
  );
  assert.match(
    workflow,
    /target_url="\$\{\{ steps\.prepare_pages\.outputs\.review_url \}\}"/,
  );
  assert.match(
    workflow,
    /expected_sha="\$\{\{ steps\.prepare_pages\.outputs\.short_sha \}\}"/,
  );
  assert.match(
    workflow,
    /grep -q "\$expected_sha" \/tmp\/visual-review-latest\.html/,
  );
  assert.match(workflow, /state: 'pending'/);
  assert.match(workflow, /state: available \? 'success' : 'failure'/);
  assert.match(workflow, /max_attempts=60/);
  assert.match(workflow, /sleep 10/);
});
