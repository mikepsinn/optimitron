import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const WORKFLOW = fileURLToPath(new URL("../workflows/ci.yml", import.meta.url));

test("creates complete visual baselines for every main push", () => {
  const workflow = readFileSync(WORKFLOW, "utf8");
  const changesJobStart = workflow.indexOf("  changes:");
  const changesJobEnd = workflow.indexOf("  leak-scan:");
  assert.notEqual(changesJobStart, -1, "changes job is missing");
  assert.notEqual(changesJobEnd, -1, "changes job boundary is missing");

  const changesJob = workflow.slice(changesJobStart, changesJobEnd);
  assert.match(
    changesJob,
    /- name: Treat main pushes as full visual baselines\s+id: main\s+if: \$\{\{ github\.event_name == 'push' && github\.ref == 'refs\/heads\/main' \}\}[\s\S]*?web_files_changed=true[\s\S]*?site_apps_changed=true/u,
  );
  assert.match(
    changesJob,
    /- name: Detect web-impacting changes\s+id: filter\s+if: \$\{\{ github\.event_name == 'pull_request' \}\}/u,
  );

  const mainBaselineStart = workflow.indexOf("  main-visual-baseline:");
  const prVisualReviewStart = workflow.indexOf("  web-visual-review:");
  assert.notEqual(mainBaselineStart, -1, "main baseline job is missing");
  assert.notEqual(prVisualReviewStart, -1, "PR visual review job is missing");
  const mainBaselineJob = workflow.slice(
    mainBaselineStart,
    prVisualReviewStart,
  );
  assert.match(mainBaselineJob, /name: web-visual-review/u);
  assert.match(mainBaselineJob, /pattern: site-app-visual-\*/u);
  assert.match(mainBaselineJob, /name: main-visual-baseline/u);

  const nonPrReviewStep = workflow.slice(
    workflow.indexOf("- name: Build visual review index"),
    workflow.indexOf("- name: Summarize visual review"),
  );
  assert.match(
    nonPrReviewStep,
    /VISUAL_REVIEW_ALLOW_INCOMPLETE: "1"/u,
    "full non-PR captures must not require PR changed-file analysis",
  );

  const siteAppBuildStart = workflow.indexOf("  site-apps-build:");
  const siteAppBuildEnd = workflow.indexOf("  site-apps-validate:");
  const siteAppBuild = workflow.slice(siteAppBuildStart, siteAppBuildEnd);
  assert.match(
    siteAppBuild,
    /SITE_APP_SCREENSHOT_ROOT: apps\/optimitron\/output\/playwright\/site-app-screenshots/u,
  );
  assert.match(
    siteAppBuild,
    /- name: Upload @apps\/\$\{\{ matrix\.app \}\} visual screenshots\s+uses: actions\/upload-artifact@v6/u,
    "main runs must upload site-app screenshots as well as PR runs",
  );
});

test("deploys Optimitron production only when its build inputs change", () => {
  const workflow = readFileSync(WORKFLOW, "utf8");
  const changesJob = workflow.slice(
    workflow.indexOf("  changes:"),
    workflow.indexOf("  leak-scan:"),
  );
  const deployJob = workflow.slice(workflow.indexOf("  deploy-production:"));

  assert.match(
    changesJob,
    /web_deploy: \$\{\{ steps\.manual\.outputs\.web_deploy \|\| steps\.production\.outputs\.web_deploy \|\| 'false' \}\}/u,
  );
  assert.match(
    changesJob,
    /- name: Detect Optimitron production deployment scope[\s\S]*?getVercelPreviewBuildMatches/u,
  );
  assert.match(deployJob, /needs: \[changes, web-validate\]/u);
  assert.match(
    deployJob,
    /fromJSON\(needs\.changes\.outputs\.web_deploy \|\| 'false'\) == true/u,
  );
  assert.match(
    workflow,
    /group: \$\{\{ github\.workflow \}\}-\$\{\{ github\.ref \}\}-\$\{\{ github\.event_name == 'pull_request' && 'pull-request' \|\| github\.run_id \}\}/u,
    "main pushes must not cancel a deploy-worthy predecessor",
  );
  assert.match(
    deployJob,
    /concurrency:\s+group: optimitron-production\s+cancel-in-progress: false\s+queue: max/u,
    "production deployments must run in FIFO order",
  );
});

test("verifies preview masking after preview managed-data sync", () => {
  const workflow = readFileSync(WORKFLOW, "utf8");
  const previewJobStart = workflow.indexOf("  sync-preview-managed-data:");
  const previewJobEnd = workflow.indexOf("  deploy-production:");
  assert.notEqual(previewJobStart, -1, "preview database job is missing");
  assert.notEqual(previewJobEnd, -1, "production job boundary is missing");
  const previewJob = workflow.slice(previewJobStart, previewJobEnd);

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
  assert.notEqual(
    verifyIndex,
    -1,
    "preview masking verification step is missing",
  );

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

  assert.match(
    previewJob,
    /repository: \$\{\{ github\.event\.pull_request\.head\.repo\.full_name \}\}[\s\S]*?ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}[\s\S]*?persist-credentials: false/u,
  );
  assert.doesNotMatch(
    previewJob,
    /NEON_BRANCH_ID: \$\{\{ vars\.NEON_BRANCH_ID \}\}/u,
  );
  assert.match(
    previewJob,
    /const filenames = files\.map\(\(file\) => file\.filename\);/u,
  );
  assert.match(
    previewJob,
    /const shouldSync = shouldPrepare && matches\.length > 0;/u,
  );
  const configStep = previewJob.slice(
    previewJob.indexOf("- name: Check Preview database sync configuration"),
    previewJob.indexOf("- name: Enable Corepack"),
  );
  assert.match(configStep, /if: .*should_prepare == 'true'/u);
  assert.match(
    configStep,
    /IS_FORK: .*head\.repo\.full_name != github\.repository/u,
  );
  assert.match(
    configStep,
    /if \[ "\$IS_FORK" = "true" \]; then[\s\S]*?exit 0/u,
  );
  assert.match(configStep, /missing NEON_API_KEY[\s\S]*?exit 1/u);
  assert.match(
    previewJob,
    /- name: Apply preview database migrations[\s\S]*?DATABASE_URL="\$DATABASE_URL_UNPOOLED" pnpm db:deploy/u,
  );
  assert.doesNotMatch(previewJob, /PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK/u);

  const initialMaskStep = previewJob.slice(
    previewJob.indexOf("- name: Apply preview database anonymization"),
    previewJob.indexOf("- name: Sync preview managed data"),
  );
  const verifyStep = previewJob.slice(
    previewJob.indexOf("- name: Verify preview masking applied to rows"),
    previewJob.indexOf("- name: Summarize preview database sync"),
  );
  assert.match(initialMaskStep, /should_prepare[\s\S]*?configured/u);
  assert.doesNotMatch(initialMaskStep, /should_sync/u);
  assert.match(verifyStep, /should_prepare[\s\S]*?configured/u);
  assert.doesNotMatch(verifyStep, /should_sync/u);
  assert.match(
    previewJob,
    /- name: Sync preview managed data\s+if: steps\.preview_data_changes\.outputs\.should_sync == 'true'/u,
  );
  assert.match(
    previewJob,
    /- name: Re-apply preview database anonymization after managed data\s+if: steps\.preview_data_changes\.outputs\.should_sync == 'true'/u,
  );
});

test("keeps visual review status pending until the Pages URL is live", () => {
  const workflow = readFileSync(WORKFLOW, "utf8");
  const visualReviewJobIndex = workflow.indexOf("  web-visual-review:");

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

  assert.notEqual(visualReviewJobIndex, -1, "web-visual-review job is missing");
  assert.notEqual(prepareIndex, -1, "visual review prepare step is missing");
  assert.notEqual(pendingIndex, -1, "visual review pending status is missing");
  assert.notEqual(publishIndex, -1, "visual review publish step is missing");
  assert.notEqual(waitIndex, -1, "visual review wait step is missing");
  assert.notEqual(
    finalStatusIndex,
    -1,
    "visual review final status is missing",
  );
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
    /web-visual-review:[\s\S]*?timeout-minutes: 35[\s\S]*?- name: Prepare per-PR visual review directory/,
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
  assert.match(
    workflow,
    /- name: Post Visual review pending status[\s\S]*?continue-on-error: true[\s\S]*?uses: actions\/github-script@v8/,
  );
  assert.match(
    workflow,
    /- name: Post Visual review commit status[\s\S]*?continue-on-error: true[\s\S]*?uses: actions\/github-script@v8/,
  );
  assert.match(workflow, /keep_files: false/);
  assert.match(workflow, /force_orphan: true/);
  assert.match(workflow, /max_attempts=180/);
  assert.match(workflow, /sleep 10/);
  assert.doesNotMatch(
    workflow,
    /createDeployment/,
    "visual review should use commit statuses, not a GitHub deployment that retriggers deploy smoke",
  );
});

test("does not retain older screenshot revisions for the current PR", () => {
  const workflow = readFileSync(WORKFLOW, "utf8");
  const carryStepStart = workflow.indexOf(
    "- name: Carry forward open PRs' review pages, prune closed ones",
  );
  const carryStepEnd = workflow.indexOf(
    "- name: Publish visual review to gh-pages",
  );

  assert.notEqual(carryStepStart, -1, "visual review carry step is missing");
  assert.notEqual(carryStepEnd, -1, "visual review publish step is missing");

  const carryStep = workflow.slice(carryStepStart, carryStepEnd);
  assert.match(
    carryStep,
    /CURRENT_PR_NUMBER: \$\{\{ github\.event\.pull_request\.number \}\}/u,
  );
  assert.match(
    carryStep,
    /if \[ "\$pr_number" = "\$CURRENT_PR_NUMBER" \]; then[\s\S]*?continue/u,
  );
  const currentPrBranchIndex = carryStep.indexOf(
    'if [ "$pr_number" = "$CURRENT_PR_NUMBER" ]; then',
  );
  const currentPrContinueIndex = carryStep.indexOf(
    "continue",
    currentPrBranchIndex,
  );
  const normalCopyIndex = carryStep.lastIndexOf(
    'cp -Rn "$existing" "$publish_root/"',
  );
  assert.ok(
    currentPrBranchIndex >= 0 &&
      currentPrContinueIndex > currentPrBranchIndex &&
      currentPrContinueIndex < normalCopyIndex,
    "current PR must be skipped before the normal carry-forward copy",
  );
});

test("publishes every site-app screenshot in the PR visual review", () => {
  const workflow = readFileSync(WORKFLOW, "utf8");
  const siteAppBuildIndex = workflow.indexOf("  site-apps-build:");
  const uploadIndex = workflow.indexOf(
    "- name: Upload @apps/${{ matrix.app }} visual screenshots",
  );
  const visualReviewJobIndex = workflow.indexOf("  web-visual-review:");
  const downloadIndex = workflow.indexOf(
    "- name: Download site-app visual screenshots",
  );
  const buildIndex = workflow.indexOf(
    "- name: Build visual review index",
    visualReviewJobIndex,
  );

  assert.notEqual(siteAppBuildIndex, -1, "site-app build job is missing");
  assert.notEqual(uploadIndex, -1, "site-app screenshot upload is missing");
  assert.notEqual(visualReviewJobIndex, -1, "web visual-review job is missing");
  assert.notEqual(downloadIndex, -1, "site-app screenshot download is missing");
  assert.notEqual(buildIndex, -1, "visual-review build step is missing");
  assert.ok(siteAppBuildIndex < uploadIndex);
  assert.ok(uploadIndex < visualReviewJobIndex);
  assert.ok(visualReviewJobIndex < downloadIndex);
  assert.ok(
    downloadIndex < buildIndex,
    "site-app screenshots must be downloaded before the review HTML is built",
  );
  assert.match(
    workflow,
    /pattern: site-app-visual-\*[\s\S]*?merge-multiple: true/u,
  );
  assert.match(
    workflow,
    /fromJSON\(needs\.changes\.outputs\.web \|\| 'false'\) == true \|\| fromJSON\(needs\.changes\.outputs\.site_apps \|\| 'false'\) == true/u,
    "an apps-only PR should still publish its visual review",
  );
});

test("prefers the exact PR-base visual artifact regardless of overall run status", () => {
  const workflow = readFileSync(WORKFLOW, "utf8");
  const baselineStepStart = workflow.indexOf(
    "- name: Resolve main visual baseline",
  );
  const baselineStepEnd = workflow.indexOf("- name: Resolve PR preview URL");
  assert.notEqual(baselineStepStart, -1, "visual baseline step is missing");
  assert.notEqual(
    baselineStepEnd,
    -1,
    "visual baseline step boundary is missing",
  );
  const baselineStep = workflow.slice(baselineStepStart, baselineStepEnd);

  assert.match(
    baselineStep,
    /base_sha="\$\{\{ github\.event\.pull_request\.base\.sha \}\}"/u,
  );
  assert.match(baselineStep, /--commit "\$base_sha"/u);
  assert.doesNotMatch(
    baselineStep,
    /mapfile -t run_candidates < <\(/u,
    "process substitution must not hide a failed GitHub run query",
  );
  assert.match(baselineStep, /exact_run_candidates="\$\(/u);
  assert.match(baselineStep, /fallback_run_candidates="\$\(/u);
  assert.match(
    baselineStep,
    /if \[ -n "\$run_candidates_output" \]; then\s+mapfile -t run_candidates/u,
    "an empty successful query should leave the candidate array empty",
  );
  assert.doesNotMatch(
    baselineStep,
    /--status success/u,
    "an unrelated failed job must not hide a usable visual artifact",
  );

  const exactBaseQuery = baselineStep.indexOf('--commit "$base_sha"');
  const fallbackQuery = baselineStep.indexOf("--limit 20");
  assert.ok(
    exactBaseQuery < fallbackQuery,
    "the exact PR-base run should be tried before recent-main fallbacks",
  );
  assert.match(
    baselineStep,
    /VISUAL_REVIEW_BASELINE_COMMIT_SHA=\$baseline_sha/u,
  );
  assert.match(
    baselineStep,
    /VISUAL_REVIEW_REQUESTED_BASE_COMMIT_SHA=\$base_sha/u,
  );
  assert.match(baselineStep, /VISUAL_REVIEW_BASELINE_RUN_ID=\$run_id/u);
  assert.match(
    baselineStep,
    /for artifact_name in main-visual-baseline web-visual-review/u,
    "complete main baselines should take precedence over legacy web-only artifacts",
  );
});
