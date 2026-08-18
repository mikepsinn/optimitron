import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const anonymizationSql = readFileSync(
  new URL("../../packages/db/prisma/anonymization-updates.sql", import.meta.url),
  "utf8",
);
const verifierScript = readFileSync(
  new URL("../../apps/optimitron/scripts/verify-preview-masking.mjs", import.meta.url),
  "utf8",
);

test("masks private execution payloads without violating immutable-row checks", () => {
  assert.match(
    anonymizationSql,
    /UPDATE public\."TaskExecutionArtifact" SET "externalUrl" = pg_catalog\.concat\('https:\/\/preview\.invalid\/artifact\/', md5\("id"::text\)\)/u,
  );
  assert.match(
    anonymizationSql,
    /UPDATE public\."TaskExecutionArtifact" SET "contentHash" = pg_catalog\.concat\('artifact-content-', md5\("id"::text\)\)/u,
  );

  const verificationDisable = anonymizationSql.indexOf(
    'DISABLE TRIGGER "TaskVerification_protect_evidence"',
  );
  const verificationUpdate = anonymizationSql.indexOf(
    'UPDATE public."TaskVerification"',
  );
  const verificationEnable = anonymizationSql.indexOf(
    'ENABLE TRIGGER "TaskVerification_protect_evidence"',
  );
  assert.notEqual(verificationDisable, -1);
  assert.notEqual(verificationUpdate, -1);
  assert.notEqual(verificationEnable, -1);
  assert.ok(verificationDisable < verificationUpdate);
  assert.ok(verificationUpdate < verificationEnable);

  const actionDisable = anonymizationSql.indexOf(
    'DISABLE TRIGGER "ExternalActionRequest_immutable_payload"',
  );
  const actionUpdate = anonymizationSql.indexOf(
    'UPDATE public."ExternalActionRequest"',
  );
  const actionEnable = anonymizationSql.indexOf(
    'ENABLE TRIGGER "ExternalActionRequest_immutable_payload"',
  );
  assert.notEqual(actionDisable, -1);
  assert.notEqual(actionUpdate, -1);
  assert.notEqual(actionEnable, -1);
  assert.ok(actionDisable < actionUpdate);
  assert.ok(actionUpdate < actionEnable);
  assert.match(
    anonymizationSql,
    /"approvedPayloadHash" = CASE[\s\S]*?'external-action-payload-'/u,
  );
  assert.match(
    anonymizationSql,
    /"operation" = public\.dummy_safe_text\(\)/u,
  );
});

test("verifies the private execution mask shapes without logging values", () => {
  for (const checkName of [
    "TaskExecutionArtifact.privatePayload",
    "TaskVerification.privateEvidence",
    "ExternalActionRequest.privatePayload",
  ]) {
    assert.ok(verifierScript.includes(`name: "${checkName}"`));
  }
  assert.match(
    verifierScript,
    /Sample values are intentionally suppressed to avoid leaking production data into CI logs/u,
  );
});
