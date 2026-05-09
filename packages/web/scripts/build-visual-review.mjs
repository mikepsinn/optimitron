#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, "../..");
const screenshotsRoot = path.resolve(webRoot, "screenshots");
const beforeScreenshotsRoot = process.env.VISUAL_BEFORE_ROOT
  ? resolveInputPath(process.env.VISUAL_BEFORE_ROOT)
  : null;
const outputRoot = path.resolve(webRoot, "output", "playwright", "review");
const assetRoot = path.join(outputRoot, "assets");
const latestHtmlPath = path.join(outputRoot, "latest.html");

const routeOrder = [
  "home",
  "side-menu",
  "side-menu-auth",
  "dashboard",
  "employees",
  "tasks-index",
  "task-optimize-earth",
  "task-one-percent-treaty",
  "task-signer-canada",
  "endorse",
  "plaintiffs",
  "humanity-v-government",
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
  const grouped = groupScreenshots(screenshots);
  const html = renderHtml(grouped);

  writeFileSync(latestHtmlPath, html, "utf8");
  console.log(`[visual-review] wrote ${latestHtmlPath}`);
  console.log(`[visual-review] screenshots=${screenshots.length}`);
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

    main {
      padding: 24px;
    }

    section {
      border-top: 1px solid var(--line);
      padding: 24px 0 40px;
    }

    section:first-child {
      border-top: 0;
      padding-top: 0;
    }

    h2 {
      margin: 0 0 16px;
      font-size: 18px;
      letter-spacing: 0;
    }

    .pairs {
      display: grid;
      gap: 28px;
    }

    .pair {
      border: 1px solid var(--line);
    }

    .pair h3 {
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
      Generated ${escapeHtml(generatedAt)}. ${beforeScreenshotsRoot ? "Left side is the latest main baseline artifact; right side is this pull request." : "No main baseline artifact was available, so this page shows pull request screenshots only."} Use Argos on the PR for changed-only review when available.
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
  return `<section>
    <h2>${escapeHtml(labelRoute(group.routeName))}</h2>
    <div class="pairs">
      ${pairs}
    </div>
  </section>`;
}

function renderPair(pair) {
  return `<article class="pair">
    <h3>${escapeHtml(labelProject(pair.projectName))}</h3>
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
