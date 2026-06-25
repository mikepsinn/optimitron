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

test("deploy smoke waits for a successful deployment URL instead of skipping early deployment events", () => {
  const smokeJobHeader = workflow.slice(
    workflow.indexOf("  smoke:"),
    workflow.indexOf("    steps:", workflow.indexOf("  smoke:")),
  );
  const playwrightJobHeader = workflow.slice(
    workflow.indexOf("  playwright-preview:"),
    workflow.indexOf("    steps:", workflow.indexOf("  playwright-preview:")),
  );

  assert.doesNotMatch(
    smokeJobHeader,
    /deployment_status\.state == 'success'/u,
    "the HTTP smoke job should start for early Vercel deployment events and wait",
  );
  assert.doesNotMatch(
    playwrightJobHeader,
    /deployment_status\.state == 'success'/u,
    "the Playwright smoke job should start for early Vercel deployment events and wait",
  );
  assert.match(
    workflow,
    /- name: Wait for successful deployment URL[\s\S]*id: deployment_status[\s\S]*listDeploymentStatuses/u,
  );
  assert.match(
    workflow,
    /BASE_URL: \$\{\{ steps\.deployment_status\.outputs\.environment_url \}\}/u,
  );
  assert.match(
    workflow,
    /PREVIEW_URL: \$\{\{ steps\.deployment_status\.outputs\.environment_url \}\}/u,
  );
});
