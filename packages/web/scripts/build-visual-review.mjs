#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const webRoot = process.cwd();
const screenshotsRoot = path.resolve(webRoot, "screenshots");
const outputRoot = path.resolve(webRoot, "output", "playwright", "review");
const latestHtmlPath = path.join(outputRoot, "latest.html");

const routeOrder = [
  "home",
  "tasks-index",
  "task-optimize-earth",
  "task-one-percent-treaty",
  "task-signer-canada",
  "endorse",
  "humanity-v-government",
];

main();

function main() {
  mkdirSync(outputRoot, { recursive: true });

  const screenshots = collectScreenshots();
  const grouped = groupScreenshots(screenshots);
  const html = renderHtml(grouped);

  writeFileSync(latestHtmlPath, html, "utf8");
  console.log(`[visual-review] wrote ${latestHtmlPath}`);
  console.log(`[visual-review] screenshots=${screenshots.length}`);
}

function collectScreenshots() {
  if (!existsSync(screenshotsRoot)) {
    return [];
  }

  const files = [];
  for (const projectName of safeReadDir(screenshotsRoot)) {
    const projectDir = path.join(screenshotsRoot, projectName);
    for (const entry of safeReadDir(projectDir)) {
      if (!entry.toLowerCase().endsWith(".png")) {
        continue;
      }

      const filePath = path.join(projectDir, entry);
      const routeName = entry
        .replace(/\.png$/i, "")
        .replace(/-(default|visual-mobile)$/i, "");
      files.push({
        projectName,
        routeName,
        fileName: entry,
        relPath: toPosix(path.relative(outputRoot, filePath)),
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
    const group = grouped.get(screenshot.routeName) ?? [];
    group.push(screenshot);
    grouped.set(screenshot.routeName, group);
  }
  return [...grouped.entries()].map(([routeName, shots]) => ({ routeName, shots }));
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

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(420px, 100%), 1fr));
      gap: 20px;
      align-items: start;
    }

    figure {
      margin: 0;
      border: 1px solid var(--line);
      background: #ffffff;
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

    code {
      font-family: Consolas, "Liberation Mono", monospace;
      font-size: 0.95em;
    }

    .empty {
      max-width: 760px;
    }
  </style>
</head>
<body>
  <header>
    <h1>Optimitron Visual Review</h1>
    <div class="meta">
      Generated ${escapeHtml(generatedAt)}. This fallback artifact shows captured PR screenshots. Use Argos on the PR for before/after diffs and changed-only review.
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
  const shots = group.shots.map(renderFigure).join("\n");
  return `<section>
    <h2>${escapeHtml(labelRoute(group.routeName))}</h2>
    <div class="grid">
      ${shots}
    </div>
  </section>`;
}

function renderFigure(screenshot) {
  return `<figure>
    <figcaption>${escapeHtml(labelProject(screenshot.projectName))}</figcaption>
    <img src="${escapeHtml(screenshot.relPath)}" alt="${escapeHtml(`${screenshot.routeName} ${screenshot.projectName}`)}" loading="lazy">
  </figure>`;
}

function safeReadDir(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() || entry.isFile())
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
