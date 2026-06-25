import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(
  new URL("../workflows/smoke-deploy.yml", import.meta.url),
  "utf8",
);
const auditScript = readFileSync(
  new URL("./audit-sentry-preview.mjs", import.meta.url),
  "utf8",
);

test("preview smoke fails only for matching Sentry findings, not Sentry API auth failures", () => {
  assert.match(
    auditScript,
    /process\.exitCode = 2;/u,
    "audit infrastructure failures should use exit code 2",
  );
  assert.match(
    workflow,
    /- name: Fail Sentry preview findings[\s\S]*steps\.sentry_audit\.outputs\.exit_code == '1'[\s\S]*run: exit 1/u,
    "workflow should fail only when the audit finds preview errors",
  );
  assert.match(
    workflow,
    /Comment on Sentry preview errors[\s\S]*steps\.sentry_audit\.outputs\.exit_code != '0'/u,
    "workflow should still comment on Sentry audit infrastructure failures",
  );
});
