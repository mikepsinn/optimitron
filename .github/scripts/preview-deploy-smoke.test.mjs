import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(
  new URL("../workflows/smoke-deploy.yml", import.meta.url),
  "utf8",
);
const ciWorkflow = readFileSync(
  new URL("../workflows/ci.yml", import.meta.url),
  "utf8",
);

test("deploy smoke waits for early Vercel events but ignores early GitHub production events", () => {
  const smokeJobHeader = workflow.slice(
    workflow.indexOf("  smoke:"),
    workflow.indexOf("    steps:", workflow.indexOf("  smoke:")),
  );
  const playwrightJobHeader = workflow.slice(
    workflow.indexOf("  playwright-preview:"),
    workflow.indexOf("    steps:", workflow.indexOf("  playwright-preview:")),
  );

  assert.match(
    smokeJobHeader,
    /deployment_status\.state == 'success'/u,
    "GitHub-managed production smoke should start only after deployment succeeds",
  );
  assert.match(
    smokeJobHeader,
    /deployment\.creator\.login == 'vercel\[bot\]' \|\|[\s\S]*?deployment_status\.creator\.login == 'vercel\[bot\]' \|\|[\s\S]*?deployment_status\.state == 'success'/u,
    "early Vercel events should still start while GitHub production events wait for success",
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
});

test("both smoke jobs recognize Vercel status creators on redeploys", () => {
  const waitBlocks = [
    ...workflow.matchAll(
      /- name: Wait for successful deployment URL[\s\S]*?(?=\n      - name:)/gu,
    ),
  ].map((match) => match[0]);

  assert.equal(waitBlocks.length, 2);
  for (const block of waitBlocks) {
    assert.match(
      block,
      /initialStatus\.creator\?\.login/u,
      "CLI redeploy events identify Vercel through the deployment status creator",
    );
  }
});

test("Playwright preview smoke ignores non-Vercel deployment events", () => {
  const playwrightJobHeader = workflow.slice(
    workflow.indexOf("  playwright-preview:"),
    workflow.indexOf("    steps:", workflow.indexOf("  playwright-preview:")),
  );

  assert.match(
    playwrightJobHeader,
    /github\.event\.deployment\.creator\.login == 'vercel\[bot\]'/u,
  );
  assert.match(
    playwrightJobHeader,
    /github\.event\.deployment_status\.creator\.login == 'vercel\[bot\]'/u,
  );
});

test("browser jobs verify preinstalled Chrome without downloading OS packages", () => {
  for (const source of [workflow, ciWorkflow]) {
    assert.doesNotMatch(source, /playwright install-deps/u);
    assert.match(source, /missing_dependencies="\$\(ldd "\$chrome_binary"/u);
  }
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
    /comment\.user\?\.login !== "vercel\[bot\]"[\s\S]*\\\[\(\?:Visit \)\?Preview\\\]/u,
    "smoke jobs should recover the preview alias from both Vercel bot link formats ([Preview] and [Visit Preview])",
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

test("both smoke waiters skip instead of failing when the deployment is an ignored build", () => {
  const skipEmits = [...workflow.matchAll(/setOutput\("state", "skipped"\)/gu)];
  assert.equal(
    skipEmits.length,
    2,
    "both waiters (Smoke deployed URL and Playwright preview smoke) must emit the skipped state for persistently inactive deployments",
  );
  const inactiveCounters = [
    ...workflow.matchAll(/consecutiveInactive \+= 1/gu),
  ];
  assert.equal(
    inactiveCounters.length,
    2,
    "both waiters must confirm persistent inactivity before skipping",
  );
  assert.match(
    workflow,
    /steps\.deployment_status\.outputs\.state != 'skipped'/u,
    "downstream smoke steps must gate on the skipped state",
  );
});

test("preview smoke waits for the merge-ref database sync check", () => {
  const waitBlocks = [
    ...workflow.matchAll(
      /- name: Wait for preview database sync[\s\S]*?(?=\n      - name:)/gu,
    ),
  ].map((match) => match[0]);

  assert.equal(waitBlocks.length, 2);
  for (const block of waitBlocks) {
    assert.match(block, /listPullRequestsAssociatedWithCommit/u);
    assert.match(block, /currentPull\.merge_commit_sha/u);
    assert.match(block, /checkRefs\.add\(currentPull\.merge_commit_sha\)/u);
    assert.match(
      block,
      /filter\(\(run\) => run\.conclusion !== "skipped"\)/u,
      "manual workflow skips must not hide the successful PR database sync",
    );
    assert.match(block, /check\.conclusion === "success"/u);
    assert.doesNotMatch(
      block,
      /\["success", "skipped", "neutral"\]/u,
      "database deployment must succeed before preview smoke runs",
    );
  }
});

test("routes deployment smoke to the deployed app", () => {
  assert.match(
    workflow,
    /- name: Resolve smoke target[\s\S]*?getVercelAppByUrl[\s\S]*?app=\$\{appName\}/u,
  );
  assert.match(
    workflow,
    /if \[ "\$VERCEL_APP" = "optimitron" \]; then[\s\S]*?smoke-deploy\.mjs[\s\S]*?else[\s\S]*?smoke-site-deployment\.mjs/u,
  );
  assert.match(
    workflow,
    /- name: Run Playwright smoke against preview\s+if: .*steps\.target\.outputs\.app == 'optimitron'/u,
    "the Optimitron Playwright suite must run only against its matching app",
  );
});

test("skips unrelated production deployments without invoking failure handlers", () => {
  const targetBlock = workflow.slice(
    workflow.indexOf("- name: Resolve smoke target"),
    workflow.indexOf("- name: Resolve preview smoke scope"),
  );
  const slackStep = workflow.slice(
    workflow.indexOf("- name: Post production failure to Slack"),
    workflow.indexOf("- name: Fail deploy smoke"),
  );

  assert.match(
    targetBlock,
    /const smokeUrls = isProtectedVercelDeploymentUrl && app[\s\S]*?: \[targetUrl\];/u,
    "an unknown protected deployment must retain a URL long enough to emit app=unknown",
  );
  assert.doesNotMatch(
    targetBlock,
    /Cannot resolve a public production domain/u,
    "an unknown project should reach the existing skip step",
  );
  assert.match(
    slackStep,
    /steps\.smoke\.outputs\.exit_code != '' && steps\.smoke\.outputs\.exit_code != '0'/u,
    "Slack should run only when deploy smoke produced a failure result",
  );
});
