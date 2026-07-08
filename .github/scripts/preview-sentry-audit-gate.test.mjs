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
    /listDeployments[\s\S]*vercel\[bot\]/u,
    "deployment-status events from GitHub environments should resolve the Vercel deployment for the SHA",
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

test("deploy smoke can recover the Vercel preview URL from the PR comment", () => {
  assert.match(
    workflow,
    /getCombinedStatusForRef[\s\S]*status\.context === "Vercel"/u,
    "smoke jobs should handle Vercel commit statuses when no Vercel deployment record is available",
  );
  assert.match(
    workflow,
    /listPullRequestsAssociatedWithCommit[\s\S]*issues\.listComments/u,
    "smoke jobs should find the PR before reading Vercel bot comments",
  );
  assert.match(
    workflow,
    /comment\.user\?\.login !== "vercel\[bot\]"[\s\S]*\\\[Preview\\\]/u,
    "smoke jobs should recover the preview alias from the Vercel bot Preview link",
  );
});

test("deploy smoke treats inactive Vercel deployment events as recoverable", () => {
  assert.doesNotMatch(
    workflow,
    /terminalFailures = new Set\(\["failure", "error", "inactive"\]\)/u,
    "inactive deployment events can be superseded by an active Vercel commit status",
  );
  assert.match(
    workflow,
    /state === "inactive"[\s\S]*resolveVercelStatusPreviewUrl/u,
    "smoke jobs should recover the active Vercel preview URL before failing inactive deployment events",
  );
});
