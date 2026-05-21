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
