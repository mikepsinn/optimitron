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
import path from "node:path";
import process from "node:process";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const webRoot = process.cwd();
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
const diffPixelRatioThreshold = parseNumberEnv(
  "VISUAL_REVIEW_DIFF_RATIO",
  0.001,
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
const routePaths = loadRoutePaths();

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
  "dashboard",
  "employees",
  "vote",
  "treaty",
  "treaty-auth",
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
  "questions",
  "feedback",
  "settings",
  "organizations",
  "organization-iam-public",
  "task-optimize-earth",
  "task-one-percent-treaty",
  "task-signer-canada",
];

main();

function main() {
  mkdirSync(outputRoot, { recursive: true });
  rmSync(assetRoot, { recursive: true, force: true });

  const screenshots = [
    ...(beforeScreenshotsRoot
      ? collectScreenshots(beforeScreenshotsRoot, "before")
      : []),
    ...collectScreenshots(screenshotsRoot, "after"),
  ];
  const grouped = analyzeGroups(groupScreenshots(screenshots));
  const html = renderHtml(grouped);
  const blockingIssues = getBlockingReviewIssues(grouped, screenshots);

  writeFileSync(latestHtmlPath, html, "utf8");
  console.log(`[visual-review] wrote ${latestHtmlPath}`);
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
      position: sticky;
      top: 0;
      z-index: 1;
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

    .pair h3 {
      align-items: center;
      display: flex;
      gap: 10px;
      justify-content: space-between;
      margin: 0;
      border-bottom: 1px solid var(--line);
      padding: 8px 10px;
      font-size: 15px;
      letter-spacing: 0;
    }

    .comparison {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
    }

    figure {
      margin: 0;
      background: #ffffff;
    }

    figure + figure {
      border-left: 1px solid var(--line);
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

    .toolbar input[type="search"] {
      background: var(--bg);
      border: 1px solid var(--line);
      color: var(--fg);
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      min-width: 240px;
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

    code {
      font-family: Consolas, "Liberation Mono", monospace;
      font-size: 0.95em;
    }

    .empty {
      max-width: 760px;
    }

    @media (max-width: 820px) {
      .comparison {
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
    <span class="toolbar-count" id="route-count" aria-live="polite"></span>
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
        if (ctx.pr) lines.push("- PR: #" + ctx.pr + (ctx.repo ? " (" + ctx.repo + ")" : ""));
        if (ctx.branch) lines.push("- Branch: \`" + ctx.branch + "\`");
        if (ctx.shortSha) lines.push("- Commit: \`" + ctx.shortSha + "\`" + (ctx.commitSha ? " (" + ctx.commitSha + ")" : ""));
        lines.push("- Route: \`" + ctx.route + "\` (" + ctx.routeLabel + ")");
        if (ctx.routeUrl) lines.push("- Live URL: " + ctx.routeUrl);
        lines.push("- Auth state: " + ctx.authState);
        lines.push("- Diff vs main: " + ctx.status);
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
        var ctx;
        try {
          ctx = JSON.parse(raw);
        } catch (err) {
          console.error("[visual-review] bad context payload", err);
          return;
        }
        var formatted = formatContext(ctx);
        copyToClipboard(formatted).then(function () {
          var prev = button.textContent;
          button.textContent = "✓ Copied";
          button.classList.add("copied");
          window.setTimeout(function () {
            button.textContent = prev;
            button.classList.remove("copied");
          }, 1500);
        }, function () {
          button.textContent = "Copy failed";
          window.setTimeout(function () {
            button.textContent = "📋 Copy context";
          }, 1500);
        });
      });
    })();
  </script>
</body>
</html>
`;
}

function renderRouteGroup(group) {
  const pairs = group.pairs.map(renderPair).join("\n");
  const openAttr = group.changed || group.errored ? " open" : "";
  const contextJson = JSON.stringify(buildRouteContext(group));
  const anchorId = `route-${slugifyForAnchor(group.routeName)}`;
  return `<details id="${escapeHtml(anchorId)}" class="route ${group.changed || group.errored ? "changed" : "unchanged"}"${openAttr}>
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
  const isAuthed = /-auth(\b|$)/.test(group.routeName) || group.routeName.endsWith("-auth");
  const status = group.errored
    ? "errored"
    : group.changed
      ? "changed vs main"
      : "unchanged vs main";
  const sha = reviewCommitSha ? shortSha(reviewCommitSha) : null;
  const reviewBase =
    prNumber && sha
      ? `https://mikepsinn.github.io/optimitron/pr-${prNumber}/${sha}`
      : null;

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
    authState: isAuthed ? "authenticated" : "logged-out",
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
  return `<article class="pair">
    <h3>
      <span>${escapeHtml(labelProject(pair.projectName))}</span>
      <span>
        ${routeUrl ? `<a class="page-link" href="${escapeHtml(routeUrl)}" target="_blank" rel="noreferrer">Open page</a>` : ""}
        <span class="pill ${escapeHtml(pair.diff.statusClass)}">${escapeHtml(pair.diff.label)}</span>
      </span>
    </h3>
    <div class="comparison">
      ${renderFigure(pair.before, "Before: main")}
      ${renderFigure(pair.after, "After: pull request")}
    </div>
  </article>`;
}

function renderFigure(screenshot, label) {
  if (!screenshot) {
    return `<figure class="missing">
    <figcaption>${escapeHtml(label)}</figcaption>
    <div>Not captured</div>
  </figure>`;
  }
  return `<figure>
    <figcaption>${escapeHtml(label)}</figcaption>
    <img src="${escapeHtml(`${screenshot.relPath}?v=${encodeURIComponent(reviewCacheKey)}`)}" alt="${escapeHtml(`${screenshot.routeName} ${screenshot.projectName} ${label}`)}" loading="lazy">
  </figure>`;
}

function analyzeGroups(groups) {
  return groups.map((group) => {
    const pairs = group.pairs.map((pair) => ({
      ...pair,
      diff: comparePair(pair),
    }));
    const changedPairs = pairs.filter((pair) => pair.diff.changed).length;
    const missingPairs = pairs.filter((pair) => pair.diff.missing).length;
    const erroredPairs = pairs.filter((pair) => pair.diff.errored).length;
    return {
      ...group,
      changed: changedPairs > 0,
      changedPairs,
      errored: erroredPairs > 0,
      erroredPairs,
      missingPairs,
      pairs,
    };
  });
}

function comparePair(pair) {
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

    const diffPixels = pixelmatch(
      before.data,
      after.data,
      null,
      before.width,
      before.height,
      { threshold: pixelmatchThreshold },
    );
    const totalPixels = before.width * before.height;
    const ratio = totalPixels > 0 ? diffPixels / totalPixels : 0;
    const changed = ratio > diffPixelRatioThreshold;
    return {
      changed,
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

function summarizeGroups(groups) {
  return {
    changedRoutes: groups.filter((group) => group.changed).length,
    erroredRoutes: groups.filter((group) => group.errored).length,
    unchangedRoutes: groups.filter((group) => !group.changed && !group.errored).length,
    missingPairs: groups.reduce((sum, group) => sum + group.missingPairs, 0),
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

function loadRoutePaths() {
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
        .map((entry) => [entry.name, entry.path]),
    );
  } catch (error) {
    console.warn(
      `[visual-review] Could not read route manifest at ${routeManifestPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return new Map();
  }
}

function getRouteUrl(routeName) {
  if (!pageLinkBaseUrl) {
    return null;
  }

  const routePath = routePaths.get(routeName);
  if (!routePath) {
    return null;
  }

  return new URL(routePath, pageLinkBaseUrl).toString();
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
