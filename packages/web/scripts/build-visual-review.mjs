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
const beforeScreenshotsRoot = process.env.VISUAL_BEFORE_ROOT
  ? resolveInputPath(process.env.VISUAL_BEFORE_ROOT)
  : null;
const outputRoot = path.resolve(webRoot, "output", "playwright", "review");
const assetRoot = path.join(outputRoot, "assets");
const latestHtmlPath = path.join(outputRoot, "latest.html");
const diffPixelRatioThreshold = parseNumberEnv(
  "VISUAL_REVIEW_DIFF_RATIO",
  0.001,
);
const pixelmatchThreshold = parseNumberEnv("VISUAL_REVIEW_PIXEL_THRESHOLD", 0.12);

const routeOrder = [
  "home",
  "side-menu",
  "side-menu-auth",
  "dashboard",
  "employees",
  "vote",
  "treaty",
  "treaty-auth",
  "why",
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

  writeFileSync(latestHtmlPath, html, "utf8");
  console.log(`[visual-review] wrote ${latestHtmlPath}`);
  console.log(`[visual-review] screenshots=${screenshots.length}`);
  console.log(
    `[visual-review] changed=${grouped.filter((group) => group.changed).length} unchanged=${grouped.filter((group) => !group.changed).length}`,
  );
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
  const generatedAt = new Date().toISOString();
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

    .missing div {
      padding: 24px 10px;
      color: var(--muted);
      font-size: 13px;
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
      Generated ${escapeHtml(generatedAt)}. ${beforeScreenshotsRoot ? "Left side is the latest main baseline artifact; right side is this pull request." : "No main baseline artifact was available, so this page shows pull request screenshots only."} Changed or missing-baseline pages are expanded; unchanged pages are collapsed but still captured.
    </div>
    <div class="summary-line">
      <span class="pill changed">${summary.changedRoutes} changed</span>
      <span class="pill unchanged">${summary.unchangedRoutes} unchanged</span>
      <span class="pill missing">${summary.missingPairs} missing pairs</span>
    </div>
  </header>
  <main>
    ${body}
  </main>
</body>
</html>
`;
}

function renderRouteGroup(group) {
  const pairs = group.pairs.map(renderPair).join("\n");
  const openAttr = group.changed ? " open" : "";
  return `<details class="route ${group.changed ? "changed" : "unchanged"}"${openAttr}>
    <summary>
      <span class="route-title">${escapeHtml(labelRoute(group.routeName))}</span>
      <span class="pill ${group.changed ? "changed" : "unchanged"}">${escapeHtml(routeStatusLabel(group))}</span>
    </summary>
    <div class="pairs">
      ${pairs}
    </div>
  </details>`;
}

function renderPair(pair) {
  return `<article class="pair">
    <h3>
      <span>${escapeHtml(labelProject(pair.projectName))}</span>
      <span class="pill ${escapeHtml(pair.diff.statusClass)}">${escapeHtml(pair.diff.label)}</span>
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
    <img src="${escapeHtml(screenshot.relPath)}" alt="${escapeHtml(`${screenshot.routeName} ${screenshot.projectName} ${label}`)}" loading="lazy">
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
    return {
      ...group,
      changed: changedPairs > 0,
      changedPairs,
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
      changed: true,
      label: `diff error: ${message.slice(0, 60)}`,
      missing: false,
      statusClass: "error",
    };
  }
}

function summarizeGroups(groups) {
  return {
    changedRoutes: groups.filter((group) => group.changed).length,
    unchangedRoutes: groups.filter((group) => !group.changed).length,
    missingPairs: groups.reduce((sum, group) => sum + group.missingPairs, 0),
  };
}

function routeStatusLabel(group) {
  if (!group.changed) {
    return "unchanged";
  }
  const parts = [];
  if (group.changedPairs > 0) {
    parts.push(`${group.changedPairs} changed`);
  }
  if (group.missingPairs > 0) {
    parts.push(`${group.missingPairs} missing`);
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
