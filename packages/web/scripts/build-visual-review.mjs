#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { isRedirectOnlyRoutePath } = require("../src/lib/redirects.js");
const webRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(webRoot, "../..");
const screenshotsRoot = path.resolve(webRoot, "screenshots");
const routeManifestPath = path.join(screenshotsRoot, "routes.json");
const beforeScreenshotsRoot = process.env.VISUAL_BEFORE_ROOT
  ? resolveInputPath(process.env.VISUAL_BEFORE_ROOT)
  : null;
const pageLinkBaseUrl = parseOptionalUrl(
  process.env.VISUAL_REVIEW_BASE_URL ??
    (process.env.CI === "true"
      ? null
      : process.env.BASE_URL ?? process.env.NEXTAUTH_URL),
);
const outputRoot = path.resolve(webRoot, "output", "playwright", "review");
const assetRoot = path.join(outputRoot, "assets");
const latestHtmlPath = path.join(outputRoot, "latest.html");
const reviewManifestPath = path.join(outputRoot, "manifest.json");
// 0.2% — covers cross-environment pixel rendering noise (Windows-Chromium-
// local vs Linux-Chromium-CI font hinting + anti-aliasing). Tightened from
// the original 0.5% workaround for live-clock drift (that drift is now
// fixed upstream by freezeClock at e2e/helpers/freeze-clock.ts), then
// raised from 0.1% on 2026-05-15 after side-menu and side-menu-auth
// landed at 0.11% from pure rendering noise. Real UI changes are
// typically >1%. If a class of pages drifts because of a DYNAMIC
// element (clock, counter, randomized content), fix the SOURCE with
// data-volatile or freezeClock — don't keep widening this number.
const diffPixelRatioThreshold = parseNumberEnv(
  "VISUAL_REVIEW_DIFF_RATIO",
  0.002,
);
const pixelmatchThreshold = parseNumberEnv("VISUAL_REVIEW_PIXEL_THRESHOLD", 0.12);
const allowIncompleteReview =
  process.env.VISUAL_REVIEW_ALLOW_INCOMPLETE === "1";
const reviewCommitSha =
  process.env.VISUAL_REVIEW_COMMIT_SHA ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  null;
const reviewGeneratedAt = new Date();
const reviewCacheKey = [
  reviewCommitSha ? shortSha(reviewCommitSha) : "local",
  process.env.GITHUB_RUN_ID ?? null,
  reviewGeneratedAt.getTime(),
]
  .filter(Boolean)
  .join("-");
const routeSpecs = loadRouteSpecs();
const routePaths = new Map(
  [...routeSpecs.entries()].map(([name, spec]) => [name, spec.path]),
);
const authenticatedSnapshotRouteNames = new Set([
  "dashboard",
  "organizations",
  "plaintiffs-manage",
  "settings",
  "side-menu-auth",
  "messages",
  "people-missions",
  "people-missions-romantic",
]);
const markdownDiffCache = new Map();
let imageDiffDependenciesPromise = null;

// PR/branch context for the per-route "Copy context" button. Read from
// env (GitHub Actions sets these on pull_request events). Stays empty for
// local runs — the copy payload still includes route + auth + screenshot
// info; the PR/branch lines are just blank.
const prNumber =
  process.env.VISUAL_REVIEW_PR_NUMBER ?? process.env.PR_NUMBER ?? null;
const headBranch =
  process.env.VISUAL_REVIEW_HEAD_BRANCH ??
  process.env.GITHUB_HEAD_REF ??
  process.env.GITHUB_REF_NAME ??
  null;
const repoSlug =
  process.env.VISUAL_REVIEW_REPO ?? process.env.GITHUB_REPOSITORY ?? null;

const routeOrder = [
  "home",
  "side-menu",
  "side-menu-auth",
  "create-task-dialog-person",
  "dashboard",
  "employees",
  "vote",
  "treaty",
  "treaty-auth",
  "referendum-one-percent-treaty",
  "about",
  "agencies",
  "scoreboard",
  "tools",
  "humanity-v-government",
  "plaintiffs",
  "plaintiffs-auth",
  "plaintiffs-manage",
  "court",
  "donate",
  "endorse",
  "signatories",
  "tasks-index",
  "tasks-index-auth",
  "people",
  "people-auth",
  "people-missions",
  "people-missions-romantic",
  "people-mike",
  "love",
  "missions",
  "missions-auth",
  "messages",
  "questions",
  "feedback",
  "privacy",
  "terms",
  "settings",
  "organizations",
  "organization-iam-public",
  "organization-iam-survey",
  "task-optimize-earth",
  "task-one-percent-treaty",
  "task-signer-canada",
];

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});

async function main() {
  mkdirSync(outputRoot, { recursive: true });
  rmSync(assetRoot, { recursive: true, force: true });

  const screenshots = [
    ...(beforeScreenshotsRoot
      ? collectScreenshots(beforeScreenshotsRoot, "before")
      : []),
    ...collectScreenshots(screenshotsRoot, "after"),
  ];
  const grouped = await analyzeGroups(groupScreenshots(screenshots));
  const html = renderHtml(grouped);
  const manifest = buildReviewManifest(grouped);
  const blockingIssues = getBlockingReviewIssues(grouped, screenshots);

  writeFileSync(latestHtmlPath, html, "utf8");
  writeFileSync(reviewManifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`[visual-review] wrote ${latestHtmlPath}`);
  console.log(`[visual-review] wrote ${reviewManifestPath}`);
  console.log(`[visual-review] screenshots=${screenshots.length}`);
  console.log(
    `[visual-review] changed=${grouped.filter((group) => group.changed).length} unchanged=${grouped.filter((group) => !group.changed).length}`,
  );

  if (!allowIncompleteReview && blockingIssues.length > 0) {
    console.error("[visual-review] incomplete screenshot review:");
    for (const issue of blockingIssues) {
      console.error(`- ${issue}`);
    }
    console.error(
      "[visual-review] Failing so the pull request cannot pass with blind spots. " +
        "Set VISUAL_REVIEW_ALLOW_INCOMPLETE=1 only for intentional local debugging.",
    );
    process.exitCode = 1;
  }
}

function collectScreenshots(root, version) {
  if (!existsSync(root)) {
    return [];
  }

  const files = [];
  for (const projectName of safeReadDir(root, { dirsOnly: true })) {
    const projectDir = path.join(root, projectName);
    for (const entry of safeReadDir(projectDir)) {
      if (!entry.toLowerCase().endsWith(".png")) {
        continue;
      }

      const filePath = path.join(projectDir, entry);
      const assetDir = path.join(assetRoot, version, projectName);
      mkdirSync(assetDir, { recursive: true });
      const assetPath = path.join(assetDir, entry);
      copyFileSync(filePath, assetPath);
      const routeName = entry
        .replace(/\.png$/i, "")
        .replace(/-(default|visual-mobile)$/i, "");
      if (isRedirectOnlyScreenshotRoute(routeName)) {
        continue;
      }
      files.push({
        version,
        projectName,
        routeName,
        fileName: entry,
        assetPath,
        relPath: toPosix(path.relative(outputRoot, assetPath)),
      });
    }
  }

  return files.sort((a, b) => {
    const routeDelta = routeSortIndex(a.routeName) - routeSortIndex(b.routeName);
    if (routeDelta !== 0) {
      return routeDelta;
    }
    return projectSortIndex(a.projectName) - projectSortIndex(b.projectName);
  });
}

function isRedirectOnlyScreenshotRoute(routeName) {
  const manifestPath = routePaths.get(routeName);
  if (manifestPath && isRedirectOnlyRoutePath(manifestPath)) {
    return true;
  }
  const guessedPath =
    routeName === "home" ? "/" : `/${routeName.replace(/-/g, "/")}`;
  return (
    isRedirectOnlyRoutePath(guessedPath) ||
    isRedirectOnlyRoutePath(`/${routeName}`)
  );
}

function groupScreenshots(screenshots) {
  const grouped = new Map();
  for (const screenshot of screenshots) {
    const route = grouped.get(screenshot.routeName) ?? new Map();
    const pair = route.get(screenshot.projectName) ?? {
      projectName: screenshot.projectName,
      routeName: screenshot.routeName,
    };
    pair[screenshot.version] = screenshot;
    route.set(screenshot.projectName, pair);
    grouped.set(screenshot.routeName, route);
  }
  return [...grouped.entries()].map(([routeName, projectMap]) => ({
    routeName,
    pairs: [...projectMap.values()].sort(
      (a, b) => projectSortIndex(a.projectName) - projectSortIndex(b.projectName),
    ),
  }));
}

function renderHtml(groups) {
  const generatedAt = reviewGeneratedAt.toISOString();
  const generatedAtCentral = formatCentralTime(reviewGeneratedAt);
  const summary = summarizeGroups(groups);
  const body = groups.length > 0
    ? groups.map(renderRouteGroup).join("\n")
    : `<section class="empty">
        <h2>No visual screenshots found</h2>
        <p>Run <code>pnpm --filter @optimitron/web run e2e -- visual</code>, then regenerate this page.</p>
      </section>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Optimitron Visual Review</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #ffffff;
      --fg: #000000;
      --muted: #555555;
      --line: #000000;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--fg);
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }

    header {
      border-bottom: 1px solid var(--line);
      background: var(--bg);
      padding: 16px 24px;
    }

    h1 {
      margin: 0;
      font-size: 22px;
      letter-spacing: 0;
    }

    .meta {
      margin-top: 4px;
      color: var(--muted);
      font-size: 13px;
    }

    .summary-line {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    main {
      padding: 24px;
    }

    details.route {
      border-top: 1px solid var(--line);
    }

    details.route:first-child {
      border-top: 0;
    }

    summary {
      align-items: center;
      cursor: pointer;
      display: flex;
      gap: 12px;
      justify-content: space-between;
      list-style: none;
      padding: 18px 0;
    }

    summary::-webkit-details-marker {
      display: none;
    }

    summary::before {
      content: "+";
      flex: 0 0 auto;
      font-family: Consolas, "Liberation Mono", monospace;
      font-size: 18px;
      font-weight: 700;
    }

    details[open] > summary::before {
      content: "-";
    }

    .route-title {
      flex: 1 1 auto;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0;
    }

    .pairs {
      display: grid;
      gap: 28px;
      padding: 0 0 40px;
    }

    .pair {
      border: 1px solid var(--line);
    }

    .pair summary {
      align-items: center;
      cursor: pointer;
      display: flex;
      gap: 10px;
      justify-content: space-between;
      margin: 0;
      border-bottom: 1px solid var(--line);
      padding: 8px 10px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0;
      list-style: none;
    }

    .pair summary::-webkit-details-marker {
      display: none;
    }

    .pair summary::before {
      content: "+";
      flex: 0 0 auto;
      font-family: Consolas, "Liberation Mono", monospace;
      font-size: 16px;
      font-weight: 700;
    }

    .pair[open] > summary::before {
      content: "-";
    }

    .pair-screens {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
    }

    @media (min-width: 1200px) {
      .pair-screens.has-pixel-diff {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .pair-screens.has-pixel-diff > figure:nth-child(3) {
        border-left: 1px solid var(--line);
      }
    }

    figure {
      margin: 0;
      background: #ffffff;
    }

    .pair-screens > figure:nth-child(even) {
      border-left: 1px solid var(--line);
    }

    .markdown-diff-figure {
      border-left: 0 !important;
      border-top: 1px solid var(--line);
      grid-column: 1 / -1;
    }

    /* Mobile: per-pair horizontal carousel.
       DOM order stays [before, after, pixel diff, markdown diff]
       (desktop-correct, reviewers want before/after side-by-side).
       On mobile we use CSS order to surface the pixel diff first when
       present: visual order becomes [pixel diff, before, after,
       markdown diff]. Native scroll-snap, no JS. When there is no
       pixel diff, the markdown diff is not promoted. */
    @media (max-width: 768px) {
      .pair-screens {
        display: flex;
        grid-template-columns: none;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-snap-type: x mandatory;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-x pan-y pinch-zoom;
      }
      .pair-screens > figure,
      .pair-screens > .missing {
        flex: 0 0 100%;
        min-width: 100%;
        scroll-snap-align: start;
        scroll-snap-stop: always;
      }
      .pair-screens > .pixel-diff-figure:nth-child(3) {
        order: -1;
      }
      .pair-screens > figure:nth-child(even) {
        border-left: none;
      }
      .pair-screens > figure + figure,
      .pair-screens > .missing + figure,
      .pair-screens > figure + .missing,
      .pair-screens > .missing + .missing {
        border-left: none;
        border-top: 1px solid var(--line);
      }
      .pair-screens figcaption {
        position: sticky;
        top: 0;
        background: #ffffff;
        z-index: 1;
      }
      .pair-screens figcaption::after {
        content: "  · swipe ← → ";
        color: var(--muted);
        font-weight: 400;
        font-size: 11px;
        letter-spacing: 0.04em;
      }
    }

    figcaption {
      border-bottom: 1px solid var(--line);
      padding: 8px 10px;
      font-size: 13px;
      font-weight: 700;
    }

    .pill {
      align-items: center;
      background: #ffffff;
      border: 1px solid var(--line);
      color: var(--fg);
      display: inline-flex;
      font-size: 11px;
      font-weight: 700;
      min-height: 24px;
      padding: 3px 7px;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .pill.changed,
    .pill.missing,
    .pill.error {
      background: #000000;
      color: #ffffff;
    }

    .pill.unchanged {
      border-color: #777777;
      color: var(--muted);
    }

    img {
      display: block;
      width: 100%;
      height: auto;
    }

    figure img {
      cursor: zoom-in;
    }

    .markdown-diff-block {
      background: #ffffff;
      font-family: Consolas, "Liberation Mono", monospace;
      font-size: 12px;
      line-height: 1.45;
      margin: 0;
      max-height: 72vh;
      overflow: auto;
      padding: 12px;
      white-space: pre;
    }

    .markdown-diff-line {
      display: block;
      min-height: 1.45em;
    }

    .markdown-diff-line.added {
      background: #e8f7ee;
      color: #14532d;
    }

    .markdown-diff-line.removed {
      background: #fdecec;
      color: #7f1d1d;
    }

    .markdown-diff-line.header,
    .markdown-diff-line.hunk {
      background: #f5f5f5;
      color: #333333;
      font-weight: 700;
    }

    .lightbox {
      align-items: center;
      background: rgba(0, 0, 0, 0.92);
      cursor: zoom-out;
      display: none;
      inset: 0;
      justify-content: center;
      overflow: auto;
      padding: 24px;
      position: fixed;
      z-index: 100;
    }

    .lightbox.open {
      display: flex;
    }

    .lightbox img {
      cursor: zoom-in;
      display: block;
      height: auto;
      margin: auto;
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
      width: auto;
    }

    .lightbox img.zoomed {
      cursor: zoom-out;
      height: auto;
      margin: 0;
      max-height: none;
      max-width: none;
      width: auto;
    }

    .lightbox-caption {
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      left: 24px;
      max-width: calc(100% - 200px);
      overflow: hidden;
      position: fixed;
      text-overflow: ellipsis;
      text-transform: uppercase;
      top: 16px;
      white-space: nowrap;
    }

    .lightbox-close {
      background: #ffffff;
      border: 0;
      color: #000000;
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 10px;
      position: fixed;
      right: 24px;
      text-transform: uppercase;
      top: 16px;
    }

    .lightbox-hint {
      bottom: 16px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 11px;
      font-weight: 700;
      left: 50%;
      position: fixed;
      text-transform: uppercase;
      transform: translateX(-50%);
    }

    .route-summary-actions {
      align-items: center;
      display: flex;
      flex: 0 0 auto;
      gap: 10px;
    }

    .copy-context-button {
      background: var(--bg);
      border: 1px solid var(--line);
      color: var(--fg);
      cursor: pointer;
      font-family: inherit;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .copy-context-button:hover {
      background: var(--fg);
      color: var(--bg);
    }

    .copy-context-button.copied {
      background: var(--fg);
      color: var(--bg);
    }

    /* Block click bubbling so toggling the route doesn't toggle when you
       click the button. JS also calls stopPropagation, but a CSS hint
       helps keep the button visually distinct from the summary. */
    .copy-context-button:focus-visible {
      outline: 2px solid var(--fg);
      outline-offset: 2px;
    }

    .toolbar {
      align-items: center;
      border-bottom: 1px solid var(--line);
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding: 10px 24px;
      background: var(--bg);
      position: sticky;
      top: 0;
      z-index: 2;
    }

    .toolbar-current-route {
      color: var(--fg);
      flex: 1 1 auto;
      font-size: 13px;
      font-weight: 700;
      overflow: hidden;
      text-align: right;
      text-overflow: ellipsis;
      text-transform: none;
      white-space: nowrap;
    }

    .toolbar-current-route:empty::before {
      color: var(--muted);
      content: "Scroll to see current route";
      font-weight: 400;
      font-style: italic;
    }

    .toolbar input[type="search"] {
      background: var(--bg);
      border: 1px solid var(--line);
      color: var(--fg);
      flex: 1 1 280px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      max-width: 360px;
      min-width: 220px;
      padding: 6px 10px;
    }

    .toolbar-button {
      background: var(--bg);
      border: 1px solid var(--line);
      color: var(--fg);
      cursor: pointer;
      font-family: inherit;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      text-transform: uppercase;
    }

    .toolbar-button:hover {
      background: var(--fg);
      color: var(--bg);
    }

    .toolbar-route-actions {
      align-items: center;
      display: flex;
      gap: 8px;
    }

    .toolbar-page-link {
      align-items: center;
      display: inline-flex;
      min-height: 24px;
      text-decoration: none;
    }

    .toolbar-button:disabled,
    .toolbar-page-link[aria-disabled="true"] {
      border-color: #cccccc;
      color: var(--muted);
      cursor: not-allowed;
    }

    .toolbar-button:disabled:hover,
    .toolbar-page-link[aria-disabled="true"]:hover {
      background: var(--bg);
      color: var(--muted);
    }

    .toolbar-count {
      color: var(--muted);
      font-size: 11px;
      font-weight: 700;
    }

    /* Hidden by search filter — still in DOM (state preserved on clear). */
    details.route[hidden] {
      display: none !important;
    }

    .missing div {
      padding: 24px 10px;
      color: var(--muted);
      font-size: 13px;
    }

    .page-link {
      border: 1px solid var(--line);
      color: var(--fg);
      display: inline-flex;
      font-size: 11px;
      font-weight: 700;
      margin-right: 8px;
      min-height: 24px;
      padding: 3px 7px;
      text-decoration: none;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .page-link:hover {
      background: var(--fg);
      color: var(--bg);
    }

    /* Inline link inside a figcaption — opens the live preview page on
       the Vercel deploy at this route. Sits to the LEFT of the screen-
       name label, sized for a comfortable mobile thumb tap target. */
    .page-link-inline,
    .copy-context-inline {
      align-items: center;
      border: 1px solid var(--line);
      color: var(--fg);
      display: inline-flex;
      font-size: 14px;
      font-weight: 700;
      justify-content: center;
      line-height: 1;
      margin-right: 8px;
      min-height: 28px;
      min-width: 28px;
      text-decoration: none;
      vertical-align: middle;
    }

    .page-link-inline:hover,
    .copy-context-inline:hover {
      background: var(--fg);
      color: var(--bg);
    }

    .copy-context-inline,
    .complain-button {
      background: var(--bg);
      cursor: pointer;
      padding: 0;
    }

    .complain-button {
      align-items: center;
      border: 1px solid var(--line);
      color: var(--fg);
      display: inline-flex;
      font-size: 14px;
      font-weight: 700;
      justify-content: center;
      line-height: 1;
      margin-right: 8px;
      min-height: 28px;
      min-width: 28px;
      text-decoration: none;
      vertical-align: middle;
    }

    .complain-button:hover {
      background: var(--fg);
      color: var(--bg);
    }

    code {
      font-family: Consolas, "Liberation Mono", monospace;
      font-size: 0.95em;
    }

    .empty {
      max-width: 760px;
    }

    @media (max-width: 820px) and (min-width: 769px) {
      .pair-screens {
        grid-template-columns: 1fr;
      }

      figure + figure {
        border-left: 0;
        border-top: 1px solid var(--line);
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>Optimitron Visual Review</h1>
    <div class="meta">
      Generated ${escapeHtml(generatedAtCentral)} Central time (${escapeHtml(generatedAt)} UTC).${reviewCommitSha ? ` Commit ${escapeHtml(shortSha(reviewCommitSha))}.` : ""} ${beforeScreenshotsRoot ? "Left side is the latest main baseline artifact; right side is this pull request." : "No main baseline artifact was available, so this page shows pull request screenshots only."} Changed or missing-baseline pages are expanded; unchanged pages are collapsed but still captured.
    </div>
    <div class="summary-line">
      <span class="pill changed">${summary.changedRoutes} changed</span>
      <span class="pill unchanged">${summary.unchangedRoutes} unchanged</span>
      <span class="pill missing">${summary.missingPairs} missing pairs</span>
      <span class="pill error">${summary.erroredRoutes} errored</span>
    </div>
  </header>
  <div class="toolbar" role="toolbar" aria-label="Visual review controls">
    <input
      type="search"
      id="route-filter"
      placeholder="Filter routes — try 'treaty' or 'dashboard'"
      autocomplete="off"
    />
    <button type="button" class="toolbar-button" data-toolbar-action="expand-all">Expand all</button>
    <button type="button" class="toolbar-button" data-toolbar-action="collapse-all">Collapse all</button>
    <button type="button" class="toolbar-button" data-toolbar-action="expand-changed">Only show changed</button>
    <span class="toolbar-route-actions" aria-label="Current route actions">
      <button type="button" class="toolbar-button copy-context-button" id="toolbar-copy-context" aria-label="Copy context for the current route to clipboard" disabled>Copy context</button>
      <a class="toolbar-button toolbar-page-link" id="toolbar-open-page" aria-label="Open page for the current route" aria-disabled="true" tabindex="-1">Open page</a>
    </span>
    <span class="toolbar-count" id="route-count" aria-live="polite"></span>
    <span class="toolbar-current-route" id="current-route" aria-live="polite"></span>
  </div>
  <main>
    ${body}
  </main>
  <div id="lightbox" class="lightbox" role="dialog" aria-modal="true" aria-hidden="true">
    <button type="button" class="lightbox-close" aria-label="Close (Esc)">Close</button>
    <div class="lightbox-caption" id="lightbox-caption"></div>
    <img id="lightbox-img" alt="">
    <div class="lightbox-hint">Click image to toggle 1:1 zoom · click background or press Esc to close</div>
  </div>
  <script>
    (function () {
      var lightbox = document.getElementById("lightbox");
      var lightboxImg = document.getElementById("lightbox-img");
      var lightboxCaption = document.getElementById("lightbox-caption");
      var closeBtn = lightbox.querySelector(".lightbox-close");

      function open(src, alt) {
        lightboxImg.src = src;
        lightboxImg.alt = alt || "";
        lightboxImg.classList.remove("zoomed");
        lightboxCaption.textContent = alt || "";
        lightbox.classList.add("open");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
      }

      function close() {
        lightbox.classList.remove("open");
        lightbox.setAttribute("aria-hidden", "true");
        lightboxImg.classList.remove("zoomed");
        lightboxImg.removeAttribute("src");
        document.body.style.overflow = "";
      }

      document.addEventListener("click", function (event) {
        var img = event.target.closest("figure img");
        if (img) {
          event.preventDefault();
          open(img.currentSrc || img.src, img.alt);
        }
      });

      lightboxImg.addEventListener("click", function (event) {
        event.stopPropagation();
        lightboxImg.classList.toggle("zoomed");
      });

      closeBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        close();
      });

      lightbox.addEventListener("click", function (event) {
        if (event.target === lightbox) close();
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && lightbox.classList.contains("open")) {
          close();
        }
      });
    })();

    // Toolbar: live route-name filter + expand/collapse all.
    (function () {
      var filter = document.getElementById("route-filter");
      var countEl = document.getElementById("route-count");
      var routes = Array.prototype.slice.call(
        document.querySelectorAll("details.route"),
      );

      function applyFilter() {
        var query = filter.value.trim().toLowerCase();
        var visible = 0;
        for (var i = 0; i < routes.length; i++) {
          var r = routes[i];
          var titleEl = r.querySelector(".route-title");
          var title = titleEl ? titleEl.textContent.toLowerCase() : "";
          var match = query === "" || title.indexOf(query) !== -1;
          if (match) {
            r.removeAttribute("hidden");
            visible += 1;
          } else {
            r.setAttribute("hidden", "");
          }
        }
        countEl.textContent =
          query === ""
            ? routes.length + " routes"
            : visible + " of " + routes.length + " match";
      }

      filter.addEventListener("input", applyFilter);

      document.addEventListener("click", function (event) {
        var button = event.target.closest("[data-toolbar-action]");
        if (!button) return;
        var action = button.getAttribute("data-toolbar-action");
        if (action === "expand-all") {
          for (var i = 0; i < routes.length; i++) {
            if (!routes[i].hasAttribute("hidden")) routes[i].open = true;
          }
        } else if (action === "collapse-all") {
          for (var j = 0; j < routes.length; j++) {
            routes[j].open = false;
          }
        } else if (action === "expand-changed") {
          // Hide unchanged routes entirely so the page only shows what
          // moved vs main. Filter input still works; clearing the input
          // and clicking "Expand all" restores everything.
          var changedCount = 0;
          for (var k = 0; k < routes.length; k++) {
            var isChanged = routes[k].classList.contains("changed");
            if (isChanged) {
              routes[k].removeAttribute("hidden");
              routes[k].open = true;
              changedCount += 1;
            } else {
              routes[k].setAttribute("hidden", "");
              routes[k].open = false;
            }
          }
          countEl.textContent =
            changedCount + " changed (of " + routes.length + ")";
        }
      });

      // Initial count.
      applyFilter();

      // Keyboard shortcut: "/" focuses the filter input (like GitHub).
      document.addEventListener("keydown", function (event) {
        if (
          event.key === "/" &&
          document.activeElement !== filter &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey
        ) {
          event.preventDefault();
          filter.focus();
          filter.select();
        }
      });
    })();

    // "Copy context" button: builds a markdown blob suitable for pasting
    // into a coding agent when complaining about a route, then writes it
    // to the clipboard. Payload includes PR/branch/commit ids, the route
    // + auth state, before/after screenshot URLs, and explicit
    // instructions telling the agent to download + view the screenshots
    // when relevant.
    (function () {
      function formatContext(ctx) {
        var lines = [];
        lines.push("### Visual-review context");
        lines.push("");
        if (ctx.viewing) {
          lines.push("- Viewing: **" + ctx.viewing.toUpperCase() + "** in " + (ctx.projectLabel || ctx.project));
        }
        if (ctx.pr) lines.push("- PR: #" + ctx.pr + (ctx.repo ? " (" + ctx.repo + ")" : ""));
        if (ctx.branch) lines.push("- Branch: \`" + ctx.branch + "\`");
        if (ctx.shortSha) lines.push("- Commit: \`" + ctx.shortSha + "\`" + (ctx.commitSha ? " (" + ctx.commitSha + ")" : ""));
        lines.push("- Route: \`" + ctx.route + "\` (" + ctx.routeLabel + ")");
        if (ctx.routeUrl) lines.push("- Live URL: " + ctx.routeUrl);
        lines.push("- Auth state: " + ctx.authState);
        if (ctx.diffLabel) lines.push("- Diff vs main: " + ctx.diffLabel);
        else if (ctx.status) lines.push("- Diff vs main: " + ctx.status);
        if (ctx.imageUrl) {
          lines.push("- Screenshot: " + ctx.imageUrl);
          lines.push("    curl -sLO " + ctx.imageUrl);
        }
        if (ctx.reviewUrl) lines.push("- Visual review: " + ctx.reviewUrl);
        lines.push("");
        if (ctx.screenshots && ctx.screenshots.length > 0) {
          lines.push("**Screenshots** — please \`curl -o\` these and look at them before responding so you understand what I am seeing:");
          lines.push("");
          for (var i = 0; i < ctx.screenshots.length; i++) {
            var s = ctx.screenshots[i];
            lines.push("- **" + s.project + "** (" + s.diff + ")");
            if (s.beforeUrl) lines.push("  - before (main): " + s.beforeUrl);
            if (s.afterUrl) lines.push("  - after (this PR): " + s.afterUrl);
          }
          lines.push("");
          lines.push("Suggested download commands (run from /tmp or similar):");
          for (var j = 0; j < ctx.screenshots.length; j++) {
            var sj = ctx.screenshots[j];
            if (sj.beforeUrl) lines.push("    curl -sLO " + sj.beforeUrl);
            if (sj.afterUrl) lines.push("    curl -sLO " + sj.afterUrl);
          }
          lines.push("");
        }
        lines.push("**My complaint:**");
        lines.push("> _(replace this line with what looks wrong)_");
        return lines.join("\\n");
      }

      function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(text);
        }
        return new Promise(function (resolve, reject) {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand("copy");
            resolve();
          } catch (err) {
            reject(err);
          } finally {
            document.body.removeChild(ta);
          }
        });
      }

      document.addEventListener("click", function (event) {
        var button = event.target.closest(".copy-context-button");
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        var raw = button.getAttribute("data-context");
        if (!raw) return;
        var prev = button.textContent;
        var ctx;
        try {
          ctx = JSON.parse(raw);
        } catch (err) {
          console.error("[visual-review] bad context payload", err);
          return;
        }
        var formatted = formatContext(ctx);
        copyToClipboard(formatted).then(function () {
          button.textContent = "✓ Copied";
          button.classList.add("copied");
          window.setTimeout(function () {
            button.textContent = prev;
            button.classList.remove("copied");
          }, 1500);
        }, function () {
          button.textContent = "Copy failed";
          window.setTimeout(function () {
            button.textContent = prev;
          }, 1500);
        });
      });

      // Complain button: open a pre-filled GitHub issue URL in a new
      // tab. On mobile the GitHub app (if installed) catches the URL.
      // Title summarizes route + view; body includes the same markdown
      // context as the clipboard payload, plus an explicit complaint
      // placeholder and a back-reference to the originating PR so an
      // agent-watcher workflow can find it.
      document.addEventListener("click", function (event) {
        var button = event.target.closest(".complain-button");
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        var raw = button.getAttribute("data-context");
        if (!raw) return;
        var ctx;
        try {
          ctx = JSON.parse(raw);
        } catch (err) {
          console.error("[visual-review] bad context payload", err);
          return;
        }
        if (!ctx.repo) {
          console.warn("[visual-review] complain: no repo in context");
          return;
        }
        var titleParts = ["Visual review"];
        if (ctx.routeLabel) titleParts.push(ctx.routeLabel);
        if (ctx.viewing) titleParts.push(ctx.viewing);
        if (ctx.projectLabel) titleParts.push(ctx.projectLabel);
        var title = titleParts.join(" — ");
        var body = formatContext(ctx);
        if (ctx.pr) {
          body = "Originating PR: #" + ctx.pr + "\\n\\n" + body;
        }
        var url =
          "https://github.com/" + ctx.repo + "/issues/new" +
          "?title=" + encodeURIComponent(title) +
          "&body=" + encodeURIComponent(body);
        window.open(url, "_blank", "noopener,noreferrer");
      });
    })();

    // Current-route indicator: as the user scrolls through the page, show
    // the title of the route currently anchored at the top of the viewport
    // in the sticky toolbar. Without this, scrolling past a route's
    // expanded screenshots loses context — you can't tell which route you're
    // looking at unless you scroll back up to its title.
    (function () {
      var indicator = document.getElementById("current-route");
      if (!indicator) return;
      var toolbarCopyButton = document.getElementById("toolbar-copy-context");
      var toolbarOpenPage = document.getElementById("toolbar-open-page");
      var routes = Array.prototype.slice.call(
        document.querySelectorAll("details.route"),
      );
      if (routes.length === 0) return;

      function getRouteTitle(route) {
        var titleEl = route.querySelector(".route-title");
        return titleEl ? titleEl.textContent.trim() : "";
      }

      // Account for the sticky toolbar's height when deciding which route
      // is "at the top." The toolbar sits flush with viewport top:0; we
      // use its rendered height as the offset.
      function getToolbarOffset() {
        var toolbar = document.querySelector(".toolbar");
        return toolbar ? toolbar.getBoundingClientRect().height : 0;
      }

      function setCurrentRoute(route) {
        var routeTitle = route ? getRouteTitle(route) : "";
        if (indicator.textContent !== routeTitle) {
          indicator.textContent = routeTitle;
        }

        if (toolbarCopyButton) {
          var sourceCopyButton = route
            ? route.querySelector(".route-summary-actions .copy-context-button")
            : null;
          var context = sourceCopyButton
            ? sourceCopyButton.getAttribute("data-context")
            : "";
          if (context) {
            toolbarCopyButton.disabled = false;
            toolbarCopyButton.setAttribute("data-context", context);
            toolbarCopyButton.setAttribute(
              "aria-label",
              "Copy context for " + routeTitle + " to clipboard",
            );
          } else {
            toolbarCopyButton.disabled = true;
            toolbarCopyButton.removeAttribute("data-context");
            toolbarCopyButton.setAttribute(
              "aria-label",
              "Copy context for the current route to clipboard",
            );
          }
        }

        if (toolbarOpenPage) {
          var routeUrl = route ? route.getAttribute("data-route-url") : "";
          if (routeUrl) {
            toolbarOpenPage.href = routeUrl;
            toolbarOpenPage.target = "_blank";
            toolbarOpenPage.rel = "noreferrer";
            toolbarOpenPage.removeAttribute("aria-disabled");
            toolbarOpenPage.removeAttribute("tabindex");
            toolbarOpenPage.setAttribute(
              "aria-label",
              "Open " + routeTitle + " page",
            );
          } else {
            toolbarOpenPage.removeAttribute("href");
            toolbarOpenPage.setAttribute("aria-disabled", "true");
            toolbarOpenPage.setAttribute("tabindex", "-1");
            toolbarOpenPage.setAttribute(
              "aria-label",
              "Open page for the current route",
            );
          }
        }
      }

      function updateCurrent() {
        var offset = getToolbarOffset();
        var currentRoute = null;
        var firstVisibleRoute = null;
        var lastPastRoute = null;
        for (var i = 0; i < routes.length; i++) {
          // Skip routes hidden by the filter / "only show changed" — they
          // still have getBoundingClientRect but it returns zeros, and a
          // stale title from before filtering would otherwise stick.
          if (routes[i].hasAttribute("hidden")) continue;
          if (!firstVisibleRoute) {
            firstVisibleRoute = routes[i];
          }
          var rect = routes[i].getBoundingClientRect();
          if (rect.top - offset <= 0) {
            lastPastRoute = routes[i];
          }
          // Route is "current" if its top has crossed above the toolbar
          // bottom edge AND its bottom hasn't passed yet.
          if (rect.top - offset <= 0 && rect.bottom > offset) {
            currentRoute = routes[i];
            break;
          }
        }
        if (!currentRoute) {
          currentRoute = lastPastRoute || firstVisibleRoute;
        }
        setCurrentRoute(currentRoute);
      }

      // Throttle scroll handler via requestAnimationFrame.
      var ticking = false;
      function onScroll() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          updateCurrent();
          ticking = false;
        });
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      if (toolbarOpenPage) {
        toolbarOpenPage.addEventListener("click", function (event) {
          if (toolbarOpenPage.getAttribute("aria-disabled") === "true") {
            event.preventDefault();
          }
        });
      }
      // Also update when a route is expanded/collapsed (changes layout).
      document.addEventListener("toggle", onScroll, true);

      // Filter input + toolbar buttons mutate the hidden attribute on routes
      // without firing scroll/toggle. Watch the attribute via MutationObserver
      // so the indicator refreshes regardless of which control changed
      // visibility (filter typing, Expand all, Collapse all, Only show
      // changed).
      if (typeof MutationObserver === "function") {
        var observer = new MutationObserver(onScroll);
        for (var i = 0; i < routes.length; i++) {
          observer.observe(routes[i], {
            attributes: true,
            attributeFilter: ["hidden"],
          });
        }
      }

      updateCurrent();
    })();
  </script>
</body>
</html>
`;
}

function renderRouteGroup(group) {
  const pairs = group.pairs.map(renderPair).join("\n");
  const openAttr = group.changed || group.errored ? " open" : "";
  const routeContext = buildRouteContext(group);
  const contextJson = JSON.stringify(routeContext);
  const routeUrlAttr = routeContext.routeUrl
    ? ` data-route-url="${escapeHtml(routeContext.routeUrl)}"`
    : "";
  const anchorId = `route-${slugifyForAnchor(group.routeName)}`;
  return `<details id="${escapeHtml(anchorId)}" class="route ${group.changed || group.errored ? "changed" : "unchanged"}"${routeUrlAttr}${openAttr}>
    <summary>
      <span class="route-title">${escapeHtml(labelRoute(group.routeName))}</span>
      <span class="route-summary-actions">
        <button
          type="button"
          class="copy-context-button"
          data-context='${escapeJsonForAttr(contextJson)}'
          aria-label="Copy context for this route to clipboard"
        >📋 Copy context</button>
        <span class="pill ${group.errored ? "error" : group.changed ? "changed" : "unchanged"}">${escapeHtml(routeStatusLabel(group))}</span>
      </span>
    </summary>
    <div class="pairs">
      ${pairs}
    </div>
  </details>`;
}

/**
 * Pull together everything a reviewer would want to paste into a coding
 * agent when complaining about a route: PR + commit + branch identifiers,
 * the route's URL, whether the screenshots cover the auth state, and
 * which projects ran. The button's click handler formats this as
 * markdown and writes it to the clipboard.
 */
function buildRouteContext(group) {
  const routeUrl = getRouteUrl(group.routeName);
  const authState = getRouteAuthState(group.routeName);
  const status = group.errored
    ? "errored"
    : group.changed
      ? "changed vs main"
      : "unchanged vs main";
  const sha = reviewCommitSha ? shortSha(reviewCommitSha) : null;
  const reviewBase = getPublishedReviewBase();

  // Per-project before/after screenshot URLs so the coding agent can
  // download and look at them. relPath is the on-disk path inside the
  // latest.html publish dir; the gh-pages site mounts that same tree at
  // pr-N/<sha>/.
  const screenshots = group.pairs.map((pair) => ({
    project: pair.projectName,
    diff: pair.diff?.label ?? "unknown",
    beforeUrl: pair.before && reviewBase ? `${reviewBase}/${pair.before.relPath}` : null,
    afterUrl: pair.after && reviewBase ? `${reviewBase}/${pair.after.relPath}` : null,
  }));

  return {
    pr: prNumber,
    branch: headBranch,
    repo: repoSlug,
    commitSha: reviewCommitSha,
    shortSha: sha,
    route: group.routeName,
    routeLabel: labelRoute(group.routeName),
    routeUrl,
    authState,
    status,
    screenshots,
    reviewUrl: reviewBase
      ? `${reviewBase}/latest.html#route-${slugifyForAnchor(group.routeName)}`
      : null,
  };
}

function slugifyForAnchor(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Escape a JSON string so it survives unscathed inside a single-quoted
 * HTML attribute. `&` → `&amp;` so the browser doesn't re-encode it,
 * `'` → `&apos;` so the attribute doesn't terminate early. */
function escapeJsonForAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/'/g, "&apos;");
}

function renderPair(pair) {
  const routeUrl = getRouteUrl(pair.routeName);
  const markdownDiff = buildMarkdownDiff(pair);
  const hasPixelDiff = Boolean(pair.diff?.diffRelPath);
  // Default: mobile pairs open, desktop pairs collapsed.
  const isMobile = pair.projectName === "visual-mobile";
  const openAttr = isMobile ? " open" : "";
  return `<details class="pair" data-project="${escapeHtml(pair.projectName)}"${openAttr}>
    <summary>
      <span>${escapeHtml(labelProject(pair.projectName))}</span>
      <span>
        ${routeUrl ? `<a class="page-link" href="${escapeHtml(routeUrl)}" target="_blank" rel="noreferrer">Open page</a>` : ""}
        <span class="pill ${escapeHtml(pair.diff.statusClass)}">${escapeHtml(pair.diff.label)}</span>
      </span>
    </summary>
    <div class="pair-screens${hasPixelDiff ? " has-pixel-diff" : ""}">
      ${renderFigure(pair.before, "Before: main", routeUrl, buildScreenContext(pair, "before", pair.before?.relPath))}
      ${renderFigure(pair.after, "After: pull request", routeUrl, buildScreenContext(pair, "after", pair.after?.relPath))}
      ${pair.diff?.diffRelPath ? renderDiffFigure(pair.diff.diffRelPath, pair.routeName, pair.projectName, routeUrl, buildScreenContext(pair, "diff", pair.diff.diffRelPath)) : ""}
      ${markdownDiff ? renderMarkdownDiffFigure(markdownDiff, routeUrl, buildScreenContext(pair, "markdown-diff", null)) : ""}
    </div>
  </details>`;
}

function renderDiffFigure(diffRelPath, routeName, projectName, routeUrl, screenContext) {
  return `<figure class="pixel-diff-figure">
    ${renderFigcaption("diff", routeUrl, screenContext)}
    <img src="${escapeHtml(`${diffRelPath}?v=${encodeURIComponent(reviewCacheKey)}`)}" alt="${escapeHtml(`${routeName} ${projectName} diff overlay`)}" loading="lazy">
  </figure>`;
}

function renderMarkdownDiffFigure(markdownDiff, routeUrl, screenContext) {
  return `<figure class="markdown-diff-figure">
    ${renderFigcaption(markdownDiff.label, routeUrl, screenContext)}
    <pre class="markdown-diff-block" aria-label="${escapeHtml(markdownDiff.label)}">${renderMarkdownDiffLines(markdownDiff.lines)}</pre>
  </figure>`;
}

function renderFigure(screenshot, label, routeUrl, screenContext) {
  if (!screenshot) {
    return `<figure class="missing">
    ${renderFigcaption(label, routeUrl, screenContext)}
    <div>Not captured</div>
  </figure>`;
  }
  return `<figure>
    ${renderFigcaption(label, routeUrl, screenContext)}
    <img src="${escapeHtml(`${screenshot.relPath}?v=${encodeURIComponent(reviewCacheKey)}`)}" alt="${escapeHtml(`${screenshot.routeName} ${screenshot.projectName} ${label}`)}" loading="lazy">
  </figure>`;
}

// Figcaption with optional preview-page link (↗) and copy-context button
// (📋) on the LEFT of the screen-name label. Sticky on mobile so it stays
// visible while you swipe-scroll within a tall card. The copy button
// gives reviewers a per-screen payload to paste into a coding agent.
function renderFigcaption(label, routeUrl, screenContext) {
  let inner = "";
  if (routeUrl) {
    inner += `<a class="page-link-inline" href="${escapeHtml(routeUrl)}" target="_blank" rel="noreferrer" aria-label="Open ${escapeHtml(label)} page on preview deploy">↗</a>`;
  }
  if (screenContext) {
    const json = JSON.stringify(screenContext);
    const jsonAttr = escapeJsonForAttr(json);
    inner += `<button type="button" class="copy-context-button copy-context-inline" data-context='${jsonAttr}' aria-label="Copy context for ${escapeHtml(label)} to clipboard">📋</button>`;
    if (screenContext.repo) {
      inner += `<button type="button" class="complain-button" data-context='${jsonAttr}' aria-label="Open a GitHub issue to complain about ${escapeHtml(label)}">💬</button>`;
    }
  }
  inner += escapeHtml(label);
  return `<figcaption>${inner}</figcaption>`;
}

/**
 * Build the per-screen "Copy context" payload — what a reviewer pastes
 * into a coding agent when complaining about ONE specific view (diff /
 * before / after) of ONE specific pair (project × route). Narrower than
 * buildRouteContext, which covers the whole route group across projects.
 */
function buildScreenContext(pair, viewing, relPath) {
  const routeUrl = getRouteUrl(pair.routeName);
  const authState = getRouteAuthState(pair.routeName);
  const sha = reviewCommitSha ? shortSha(reviewCommitSha) : null;
  const reviewBase = getPublishedReviewBase();
  const imageUrl = relPath && reviewBase ? `${reviewBase}/${relPath}` : null;
  return {
    pr: prNumber,
    branch: headBranch,
    repo: repoSlug,
    commitSha: reviewCommitSha,
    shortSha: sha,
    route: pair.routeName,
    routeLabel: labelRoute(pair.routeName),
    routeUrl,
    authState,
    project: pair.projectName,
    projectLabel: labelProject(pair.projectName),
    viewing,
    diffLabel: pair.diff?.label,
    imageUrl,
    reviewUrl: reviewBase
      ? `${reviewBase}/latest.html#route-${slugifyForAnchor(pair.routeName)}`
      : null,
  };
}

async function analyzeGroups(groups) {
  const analyzed = [];
  for (const group of groups) {
    const pairs = await Promise.all(
      group.pairs.map(async (pair) => ({
        ...pair,
        diff: await comparePair(pair),
      })),
    );
    const changedPairs = pairs.filter((pair) => pair.diff.changed).length;
    const missingPairs = pairs.filter((pair) => pair.diff.missing).length;
    const erroredPairs = pairs.filter((pair) => pair.diff.errored).length;
    analyzed.push({
      ...group,
      changed: changedPairs > 0,
      changedPairs,
      errored: erroredPairs > 0,
      erroredPairs,
      missingPairs,
      pairs,
    });
  }
  return analyzed;
}

function loadImageDiffDependencies() {
  if (!imageDiffDependenciesPromise) {
    imageDiffDependenciesPromise = Promise.all([
      import("pixelmatch"),
      import("pngjs"),
    ]).then(([pixelmatchModule, pngjsModule]) => {
      const pngjs = pngjsModule.default ?? pngjsModule;
      return {
        PNG: pngjs.PNG,
        pixelmatch: pixelmatchModule.default ?? pixelmatchModule,
      };
    });
  }
  return imageDiffDependenciesPromise;
}

async function comparePair(pair) {
  if (!pair.before && pair.after) {
    return {
      changed: true,
      label: "missing before",
      missing: true,
      statusClass: "missing",
    };
  }
  if (pair.before && !pair.after) {
    return {
      changed: true,
      label: "missing after",
      missing: true,
      statusClass: "missing",
    };
  }
  if (!pair.before || !pair.after) {
    return {
      changed: true,
      label: "missing",
      missing: true,
      statusClass: "missing",
    };
  }

  try {
    const { PNG, pixelmatch } = await loadImageDiffDependencies();
    const before = PNG.sync.read(readFileSync(pair.before.assetPath));
    const after = PNG.sync.read(readFileSync(pair.after.assetPath));
    if (before.width !== after.width || before.height !== after.height) {
      return {
        changed: true,
        label: `${before.width}x${before.height} -> ${after.width}x${after.height}`,
        missing: false,
        statusClass: "changed",
      };
    }

    const diffData = new Uint8Array(before.width * before.height * 4);
    const diffPixels = pixelmatch(
      before.data,
      after.data,
      diffData,
      before.width,
      before.height,
      { threshold: pixelmatchThreshold },
    );
    const totalPixels = before.width * before.height;
    const ratio = totalPixels > 0 ? diffPixels / totalPixels : 0;
    const changed = ratio > diffPixelRatioThreshold;
    // Only write the diff PNG when there's an actual diff to highlight -
    // saving thousands of empty diff PNGs is wasted disk + asset upload time.
    let diffRelPath = null;
    if (changed) {
      const afterDir = path.dirname(pair.after.assetPath);
      const diffPng = new PNG({ width: before.width, height: before.height });
      diffPng.data = Buffer.from(diffData);
      const diffAssetPath = path.join(afterDir, buildDiffFileName(pair.after.fileName));
      writeFileSync(diffAssetPath, PNG.sync.write(diffPng));
      diffRelPath = toPosix(path.relative(outputRoot, diffAssetPath));
    }
    return {
      changed,
      diffRelPath,
      label: `${formatPercent(ratio)} changed`,
      missing: false,
      statusClass: changed ? "changed" : "unchanged",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      changed: false,
      errored: true,
      label: `diff error: ${message.slice(0, 60)}`,
      missing: false,
      statusClass: "error",
    };
  }
}

function buildMarkdownDiff(pair) {
  const snapshot = getMarkdownSnapshot(pair.routeName);
  if (!snapshot) {
    return null;
  }

  if (markdownDiffCache.has(snapshot.repoRelativePath)) {
    return markdownDiffCache.get(snapshot.repoRelativePath);
  }

  const workingPath = path.join(repoRoot, snapshot.repoRelativePath);
  if (!existsSync(workingPath)) {
    markdownDiffCache.set(snapshot.repoRelativePath, null);
    return null;
  }

  const before = readMainFile(snapshot.repoRelativePath);
  if (before === null) {
    markdownDiffCache.set(snapshot.repoRelativePath, null);
    return null;
  }

  const after = readFileSync(workingPath, "utf8");
  const diff = {
    fileName: snapshot.fileName,
    label: `Text diff: ${snapshot.fileName}`,
    lines: buildUnifiedMarkdownDiffLines(before, after, snapshot.repoRelativePath),
    repoRelativePath: snapshot.repoRelativePath,
  };
  markdownDiffCache.set(snapshot.repoRelativePath, diff);
  return diff;
}

function getMarkdownSnapshot(routeName) {
  const routePath = routePaths.get(routeName);
  if (!routePath) {
    return null;
  }

  const fileName = isAuthenticatedMarkdownRoute(routeName)
    ? "page.logged-in.md"
    : "page.logged-out.md";
  const pathname = routePath.split(/[?#]/, 1)[0] ?? "/";
  const segments = pathname === "/" ? [] : pathname.split("/").filter(Boolean);
  const repoRelativePath = toPosix(
    path.join("packages", "web", "src", "app", ...segments, fileName),
  );
  return {
    fileName,
    repoRelativePath,
  };
}

function isAuthenticatedMarkdownRoute(routeName) {
  return (
    authenticatedSnapshotRouteNames.has(routeName) ||
    /-auth(\b|$)/.test(routeName) ||
    routeName.endsWith("-auth")
  );
}

function readMainFile(repoRelativePath) {
  try {
    return execFileSync("git", ["show", `main:${repoRelativePath}`], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

function buildUnifiedMarkdownDiffLines(before, after, repoRelativePath) {
  const beforeLines = splitDiffLines(before);
  const afterLines = splitDiffLines(after);
  const ops = diffLineOps(beforeLines, afterLines);
  const rows = buildDiffRows(ops);
  const lines = [
    { kind: "header", text: `--- main/${repoRelativePath}` },
    { kind: "header", text: `+++ working-tree/${repoRelativePath}` },
  ];
  const changeIndexes = rows
    .map((row, index) => (row.kind === "equal" ? -1 : index))
    .filter((index) => index >= 0);

  if (changeIndexes.length === 0) {
    lines.push({ kind: "context", text: " No text changes." });
    return lines;
  }

  for (const hunk of buildUnifiedHunks(rows, changeIndexes)) {
    lines.push({
      kind: "hunk",
      text: `@@ -${formatUnifiedRange(hunk.oldStart, hunk.oldCount)} +${formatUnifiedRange(hunk.newStart, hunk.newCount)} @@`,
    });
    for (const row of hunk.rows) {
      if (row.kind === "add") {
        lines.push({ kind: "added", text: `+${row.text}` });
      } else if (row.kind === "remove") {
        lines.push({ kind: "removed", text: `-${row.text}` });
      } else {
        lines.push({ kind: "context", text: ` ${row.text}` });
      }
    }
  }

  return lines;
}

function splitDiffLines(value) {
  const normalized = String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (normalized.length === 0) {
    return [];
  }
  return normalized.endsWith("\n")
    ? normalized.slice(0, -1).split("\n")
    : normalized.split("\n");
}

function diffLineOps(beforeLines, afterLines) {
  const oldLength = beforeLines.length;
  const newLength = afterLines.length;
  const width = newLength + 1;
  const lcs = new Uint32Array((oldLength + 1) * width);

  for (let i = oldLength - 1; i >= 0; i -= 1) {
    for (let j = newLength - 1; j >= 0; j -= 1) {
      const index = i * width + j;
      if (beforeLines[i] === afterLines[j]) {
        lcs[index] = lcs[(i + 1) * width + j + 1] + 1;
      } else {
        lcs[index] = Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1]);
      }
    }
  }

  const ops = [];
  let oldIndex = 0;
  let newIndex = 0;
  while (oldIndex < oldLength && newIndex < newLength) {
    if (beforeLines[oldIndex] === afterLines[newIndex]) {
      ops.push({ kind: "equal", text: beforeLines[oldIndex] });
      oldIndex += 1;
      newIndex += 1;
    } else if (
      lcs[(oldIndex + 1) * width + newIndex] >=
      lcs[oldIndex * width + newIndex + 1]
    ) {
      ops.push({ kind: "remove", text: beforeLines[oldIndex] });
      oldIndex += 1;
    } else {
      ops.push({ kind: "add", text: afterLines[newIndex] });
      newIndex += 1;
    }
  }

  while (oldIndex < oldLength) {
    ops.push({ kind: "remove", text: beforeLines[oldIndex] });
    oldIndex += 1;
  }
  while (newIndex < newLength) {
    ops.push({ kind: "add", text: afterLines[newIndex] });
    newIndex += 1;
  }

  return ops;
}

function buildDiffRows(ops) {
  const rows = [];
  let oldLine = 1;
  let newLine = 1;
  for (const op of ops) {
    const row = {
      ...op,
      newLine: op.kind === "remove" ? null : newLine,
      newLineBefore: newLine,
      oldLine: op.kind === "add" ? null : oldLine,
      oldLineBefore: oldLine,
    };
    rows.push(row);
    if (op.kind !== "add") {
      oldLine += 1;
    }
    if (op.kind !== "remove") {
      newLine += 1;
    }
  }
  return rows;
}

function buildUnifiedHunks(rows, changeIndexes, contextLineCount = 3) {
  const hunks = [];
  let changeCursor = 0;
  while (changeCursor < changeIndexes.length) {
    let start = Math.max(0, changeIndexes[changeCursor] - contextLineCount);
    let end = Math.min(
      rows.length - 1,
      changeIndexes[changeCursor] + contextLineCount,
    );
    changeCursor += 1;

    while (
      changeCursor < changeIndexes.length &&
      changeIndexes[changeCursor] <= end + contextLineCount + 1
    ) {
      end = Math.min(
        rows.length - 1,
        changeIndexes[changeCursor] + contextLineCount,
      );
      changeCursor += 1;
    }

    const hunkRows = rows.slice(start, end + 1);
    hunks.push({
      newCount: hunkRows.filter((row) => row.kind !== "remove").length,
      newStart: getHunkStart(hunkRows, "new"),
      oldCount: hunkRows.filter((row) => row.kind !== "add").length,
      oldStart: getHunkStart(hunkRows, "old"),
      rows: hunkRows,
    });
  }
  return hunks;
}

function getHunkStart(rows, side) {
  const lineKey = side === "old" ? "oldLine" : "newLine";
  const beforeKey = side === "old" ? "oldLineBefore" : "newLineBefore";
  const firstLine = rows.find((row) => row[lineKey] !== null)?.[lineKey];
  if (typeof firstLine === "number") {
    return firstLine;
  }
  const before = rows[0]?.[beforeKey] ?? 1;
  return Math.max(0, before - 1);
}

function formatUnifiedRange(start, count) {
  if (count === 1) {
    return String(start);
  }
  return `${start},${count}`;
}

function renderMarkdownDiffLines(lines) {
  return lines
    .map((line) => {
      const className = line.kind === "added"
        ? "added"
        : line.kind === "removed"
          ? "removed"
          : line.kind === "hunk"
            ? "hunk"
            : line.kind === "header"
              ? "header"
              : "context";
      return `<span class="markdown-diff-line ${className}">${escapeHtml(line.text)}</span>`;
    })
    .join("");
}

function buildDiffFileName(fileName) {
  const baseName = path.basename(fileName, ".png").replace(/-(before|after)$/i, "");
  return `${baseName}-diff.png`;
}

function summarizeGroups(groups) {
  return {
    changedRoutes: groups.filter((group) => group.changed).length,
    erroredRoutes: groups.filter((group) => group.errored).length,
    unchangedRoutes: groups.filter((group) => !group.changed && !group.errored).length,
    missingPairs: groups.reduce((sum, group) => sum + group.missingPairs, 0),
  };
}

function buildReviewManifest(groups) {
  const reviewBase = getPublishedReviewBase();
  return {
    version: 1,
    generatedAt: reviewGeneratedAt.toISOString(),
    generatedAtCentral: formatCentralTime(reviewGeneratedAt),
    commitSha: reviewCommitSha,
    shortSha: reviewCommitSha ? shortSha(reviewCommitSha) : null,
    prNumber,
    headBranch,
    repo: repoSlug,
    previewBaseUrl: pageLinkBaseUrl ? pageLinkBaseUrl.toString() : null,
    reviewUrl: reviewBase ? `${reviewBase}/latest.html` : null,
    summary: summarizeGroups(groups),
    routes: groups.map((group) => ({
      routeName: group.routeName,
      routeLabel: labelRoute(group.routeName),
      routePath: routePaths.get(group.routeName) ?? null,
      routeUrl: getRouteUrl(group.routeName),
      authState: getRouteAuthState(group.routeName),
      changed: group.changed,
      errored: group.errored,
      changedPairs: group.changedPairs,
      missingPairs: group.missingPairs,
      erroredPairs: group.erroredPairs,
      statusLabel: routeStatusLabel(group),
      reviewUrl: reviewBase
        ? `${reviewBase}/latest.html#route-${slugifyForAnchor(group.routeName)}`
        : null,
      projects: group.pairs.map((pair) => ({
        projectName: pair.projectName,
        projectLabel: labelProject(pair.projectName),
        changed: Boolean(pair.diff?.changed),
        missing: Boolean(pair.diff?.missing),
        errored: Boolean(pair.diff?.errored),
        diffLabel: pair.diff?.label ?? null,
      })),
    })),
  };
}

function getBlockingReviewIssues(groups, screenshots) {
  const issues = [];
  const afterCount = screenshots.filter(
    (screenshot) => screenshot.version === "after",
  ).length;

  if (afterCount === 0) {
    issues.push("no pull-request screenshots were captured");
  }

  for (const group of groups) {
    // A route the PR no longer captures (route deleted, renamed, or
    // unenrolled from visual review) intentionally has no after-screenshot.
    // The baseline survives from the main branch artifact but is not a gap.
    const routeRemovedFromPr =
      routePaths.size > 0 && !routePaths.has(group.routeName);
    for (const pair of group.pairs) {
      if (pair.before && !pair.after && !routeRemovedFromPr) {
        issues.push(
          `${group.routeName}/${pair.projectName}: missing pull-request screenshot`,
        );
      }
      if (pair.diff.errored) {
        issues.push(
          `${group.routeName}/${pair.projectName}: ${pair.diff.label}`,
        );
      }
    }
  }

  return issues;
}

function routeStatusLabel(group) {
  if (!group.changed && !group.errored) {
    return "unchanged";
  }
  const parts = [];
  if (group.changedPairs > 0) {
    parts.push(`${group.changedPairs} changed`);
  }
  if (group.missingPairs > 0) {
    parts.push(`${group.missingPairs} missing`);
  }
  if (group.erroredPairs > 0) {
    parts.push(`${group.erroredPairs} errored`);
  }
  return parts.join(" / ");
}

function safeReadDir(dir, { dirsOnly = false } = {}) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) =>
        dirsOnly ? entry.isDirectory() : entry.isDirectory() || entry.isFile(),
      )
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

function routeSortIndex(routeName) {
  const index = routeOrder.indexOf(routeName);
  return index === -1 ? routeOrder.length : index;
}

function projectSortIndex(projectName) {
  if (projectName === "default") {
    return 0;
  }
  if (projectName === "visual-mobile") {
    return 1;
  }
  return 2;
}

function labelRoute(routeName) {
  return routeName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function labelProject(projectName) {
  if (projectName === "default") {
    return "Desktop";
  }
  if (projectName === "visual-mobile") {
    return "Mobile";
  }
  return projectName;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatPercent(value) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: value >= 0.01 ? 1 : 2,
    minimumFractionDigits: value > 0 && value < 0.01 ? 2 : 0,
    style: "percent",
  }).format(value);
}

function formatCentralTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    second: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "short",
    year: "numeric",
  }).format(date);
}

function shortSha(value) {
  return String(value).slice(0, 12);
}

function loadRouteSpecs() {
  if (!existsSync(routeManifestPath)) {
    return new Map();
  }

  try {
    const parsed = JSON.parse(readFileSync(routeManifestPath, "utf8"));
    if (!Array.isArray(parsed)) {
      return new Map();
    }

    return new Map(
      parsed
        .filter((entry) => (
          entry &&
          typeof entry.name === "string" &&
          typeof entry.path === "string"
        ))
        .map((entry) => [
          entry.name,
          {
            path: entry.path,
            authenticated: entry.authenticated === true,
          },
        ]),
    );
  } catch (error) {
    console.warn(
      `[visual-review] Could not read route manifest at ${routeManifestPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return new Map();
  }
}

function getPublishedReviewBase() {
  const sha = reviewCommitSha ? shortSha(reviewCommitSha) : null;
  return prNumber && sha
    ? `https://mikepsinn.github.io/optimitron/pr-${prNumber}/${sha}`
    : null;
}

function getRouteAuthState(routeName) {
  if (routeSpecs.get(routeName)?.authenticated || isAuthenticatedMarkdownRoute(routeName)) {
    return "demo-logged-in";
  }
  return "logged-out";
}

function getRouteUrl(routeName) {
  if (!pageLinkBaseUrl) {
    return null;
  }

  const routePath = routePaths.get(routeName);
  if (!routePath) {
    return null;
  }

  const url = new URL(routePath, pageLinkBaseUrl);
  const authState = getRouteAuthState(routeName);
  if (authState === "demo-logged-in") {
    url.searchParams.set("login", "demo");
    url.searchParams.delete("logout");
  } else {
    url.searchParams.set("logout", "1");
    url.searchParams.delete("login");
  }
  return url.toString();
}

function parseOptionalUrl(value) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    console.warn(`[visual-review] Ignoring invalid page link base URL: ${value}`);
    return null;
  }
}

function parseNumberEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function resolveInputPath(value) {
  if (path.isAbsolute(value)) {
    return value;
  }
  const packageRelative = path.resolve(webRoot, value);
  if (existsSync(packageRelative)) {
    return packageRelative;
  }
  return path.resolve(repoRoot, value);
}
