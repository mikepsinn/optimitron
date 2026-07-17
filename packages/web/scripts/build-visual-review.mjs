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
import { extractHunksAndAlignment } from "./visual-review-hunks.mjs";
import { renderReviewHtml } from "./visual-review-page.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { isRedirectOnlyRoutePath } = require("../src/lib/redirects.js");
const webRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(webRoot, "../..");
const screenshotsRoot = process.env.VISUAL_AFTER_ROOT
  ? resolveInputPath(process.env.VISUAL_AFTER_ROOT)
  : path.resolve(webRoot, "screenshots");
const routeManifestPath = path.join(screenshotsRoot, "routes.json");
const beforeScreenshotsRoot = process.env.VISUAL_BEFORE_ROOT
  ? resolveInputPath(process.env.VISUAL_BEFORE_ROOT)
  : null;
const beforeCopySnapshotsRoot = process.env.VISUAL_COPY_BEFORE_ROOT
  ? resolveInputPath(process.env.VISUAL_COPY_BEFORE_ROOT)
  : null;
const afterCopySnapshotsRoot = process.env.VISUAL_COPY_AFTER_ROOT
  ? resolveInputPath(process.env.VISUAL_COPY_AFTER_ROOT)
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
const routeSpecs = loadRouteSpecs();
const routePaths = new Map(
  [...routeSpecs.entries()].map(([name, spec]) => [name, spec.path]),
);
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
  "calendar",
  "employees",
  "vote",
  "treaty",
  "treaty-auth",
  "referendum-one-percent-treaty",
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
  "variant-optimitron-home",
  "variant-optimitron-tasks",
  "variant-dfda-home",
  "variant-dfda-conditions",
  "variant-dih-home",
  "variant-dih-institutes",
];

// Non-default site variants captured by the variant-delta routes in
// e2e/utils/visual-routes.ts. Keys match SiteKey in src/lib/site.ts.
const VARIANT_DOMAIN_LABELS = {
  optimitron: "optimitron.com",
  dfda: "dfda.earth",
  dih: "dih.earth",
};

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
  const grouped = appendCopyOnlyGroups(
    await analyzeGroups(groupScreenshots(screenshots)),
  );
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
  if (groups.length === 0) {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Optimitron Visual Review</title>
</head>
<body>
<h1>No visual screenshots found</h1>
<p>Run <code>pnpm --filter @optimitron/web run e2e -- visual</code>, then regenerate this page.</p>
</body>
</html>
`;
  }
  return renderReviewHtml(buildReviewPageInput(groups));
}

/**
 * Adapter: map the analyzed screenshot groups onto the data contract
 * expected by renderReviewHtml (scripts/visual-review-page.mjs). Routes are
 * ordered changed -> copy-only -> unchanged; the sort is stable, so
 * routeOrder is preserved within each rank.
 */
function buildReviewPageInput(groups) {
  const reviewBase = getPublishedReviewBase();
  const routes = groups.map((group) => buildReviewPageRoute(group));
  // Changed variant routes rank 0 with everything else (they must surface);
  // unchanged variant routes park below Unchanged in their own rail group.
  const rank = (route) =>
    route.changed || route.errored
      ? 0
      : route.copyChanged
        ? 1
        : route.siteVariant
          ? 3
          : 2;
  routes.sort((a, b) => rank(a) - rank(b));
  return {
    meta: {
      prNumber,
      shortSha: reviewCommitSha ? shortSha(reviewCommitSha) : null,
      commitSha: reviewCommitSha,
      headBranch,
      generatedAt: reviewGeneratedAt.toISOString(),
      generatedAtCentral: formatCentralTime(reviewGeneratedAt),
      previewBaseUrl: pageLinkBaseUrl ? pageLinkBaseUrl.toString() : null,
      productionBaseUrl: "https://optimitron.com",
      reviewUrl: reviewBase ? `${reviewBase}/latest.html` : null,
      repo: repoSlug,
      baselineDescription: buildBaselineDescription(),
    },
    summary: {
      changedRoutes: routes.filter((route) => route.changed).length,
      copyOnlyRoutes: routes.filter((route) => rank(route) === 1).length,
      unchangedRoutes: routes.filter((route) => rank(route) === 2).length,
      variantRoutes: routes.filter((route) => route.siteVariant).length,
      erroredRoutes: routes.filter((route) => route.errored).length,
      totalRoutes: routes.length,
    },
    routes,
  };
}

function buildBaselineDescription() {
  const copyRef = getBaselineRef();
  const copyRefLabel = /^[0-9a-f]{40}$/i.test(copyRef)
    ? shortSha(copyRef)
    : copyRef;
  return [
    beforeScreenshotsRoot
      ? "screenshots vs main baseline artifact"
      : "no screenshot baseline artifact",
    `copy vs ${copyRefLabel}`,
  ].join(" · ");
}

function buildReviewPageRoute(group) {
  const markdownDiff = buildMarkdownDiff(group.routeName);
  const routePath = routePaths.get(group.routeName) ?? null;
  const siteVariant = getRouteSiteVariant(group.routeName);
  return {
    routeName: group.routeName,
    routeLabel: siteVariant
      ? labelVariantRoute(group.routeName, siteVariant)
      : labelRoute(group.routeName),
    routePath,
    routeUrl: getRouteUrl(group.routeName),
    authState: getRouteAuthState(group.routeName),
    siteVariant,
    variantLabel: siteVariant ? getVariantDomainLabel(siteVariant) : null,
    changed: group.changed,
    copyChanged: Boolean(markdownDiff),
    errored: group.errored,
    statusLabel: reviewStatusLabel(group, markdownDiff),
    markdownDiff,
    pairs: group.pairs.map((pair) => buildReviewPagePair(pair)),
  };
}

function buildReviewPagePair(pair) {
  return {
    projectName: pair.projectName,
    projectLabel: labelProject(pair.projectName),
    changed: Boolean(pair.diff?.changed),
    missing: Boolean(pair.diff?.missing),
    errored: Boolean(pair.diff?.errored),
    diffLabel: pair.diff?.label ?? null,
    beforeRelPath: pair.before?.relPath ?? null,
    afterRelPath: pair.after?.relPath ?? null,
    diffRelPath: pair.diff?.diffRelPath ?? null,
    beforeWidth: pair.diff?.beforeWidth ?? null,
    beforeHeight: pair.diff?.beforeHeight ?? null,
    afterWidth: pair.diff?.afterWidth ?? null,
    afterHeight: pair.diff?.afterHeight ?? null,
    hunks: pair.diff?.hunks ?? [],
    alignmentAnchors: pair.diff?.alignmentAnchors ?? [],
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

function appendCopyOnlyGroups(groups) {
  const representedRoutes = new Set(groups.map((group) => group.routeName));
  for (const routeName of routePaths.keys()) {
    if (representedRoutes.has(routeName) || !buildMarkdownDiff(routeName)) {
      continue;
    }
    groups.push({
      routeName,
      changed: false,
      changedPairs: 0,
      errored: false,
      erroredPairs: 0,
      missingPairs: 0,
      pairs: [],
    });
  }
  return groups.sort(
    (a, b) => routeSortIndex(a.routeName) - routeSortIndex(b.routeName),
  );
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
    const dimensionChanged =
      before.width !== after.width || before.height !== after.height;
    const compareWidth = Math.min(before.width, after.width);
    const compareHeight = Math.min(before.height, after.height);
    const beforeData = getComparableImageData(before, compareWidth, compareHeight);
    const afterData = getComparableImageData(after, compareWidth, compareHeight);
    const diffData = new Uint8Array(compareWidth * compareHeight * 4);
    const diffPixels = pixelmatch(
      beforeData,
      afterData,
      diffData,
      compareWidth,
      compareHeight,
      { threshold: pixelmatchThreshold },
    );
    const totalPixels = compareWidth * compareHeight;
    const ratio = totalPixels > 0 ? diffPixels / totalPixels : 0;
    const changedByPixels = ratio > diffPixelRatioThreshold;
    const changed = dimensionChanged || changedByPixels;
    let hunks = [];
    let alignmentAnchors = buildDefaultAlignmentAnchors(before, after);
    if (changed) {
      try {
        const extracted = extractHunksAndAlignment({ before, after, noiseFloorPct: 0 });
        hunks = extracted.hunks;
        alignmentAnchors = extracted.alignmentAnchors;
      } catch (error) {
        console.warn(
          `[visual-review] hunk extraction failed for ${pair.routeName}/${pair.projectName}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    // Only write the diff PNG when there's an actual diff to highlight -
    // saving thousands of empty diff PNGs is wasted disk + asset upload time.
    let diffRelPath = null;
    let beforeRegions = [];
    let afterRegions = [];
    if (changedByPixels) {
      const afterDir = path.dirname(pair.after.assetPath);
      const diffPng = new PNG({ width: compareWidth, height: compareHeight });
      diffPng.data = Buffer.from(diffData);
      const diffAssetPath = path.join(afterDir, buildDiffFileName(pair.after.fileName));
      writeFileSync(diffAssetPath, PNG.sync.write(diffPng));
      diffRelPath = toPosix(path.relative(outputRoot, diffAssetPath));
      beforeRegions = buildDiffRegions(
        diffData,
        compareWidth,
        compareHeight,
        before.width,
        before.height,
      );
      afterRegions = buildDiffRegions(
        diffData,
        compareWidth,
        compareHeight,
        after.width,
        after.height,
      );
    }
    if (dimensionChanged) {
      beforeRegions = [
        ...beforeRegions,
        ...buildDimensionExtraRegions(before.width, before.height, compareWidth, compareHeight),
      ];
      afterRegions = [
        ...afterRegions,
        ...buildDimensionExtraRegions(after.width, after.height, compareWidth, compareHeight),
      ];
    }
    return {
      changed,
      alignmentAnchors,
      beforeRegions,
      beforeHeight: before.height,
      beforeWidth: before.width,
      dimensionChanged,
      diffRelPath,
      afterRegions,
      afterHeight: after.height,
      afterWidth: after.width,
      hunks,
      label: dimensionChanged
        ? `${before.width}x${before.height} -> ${after.width}x${after.height}; ${formatPercent(ratio)} overlap`
        : `${formatPercent(ratio)} changed`,
      missing: false,
      regions: dimensionChanged ? [] : beforeRegions,
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

function buildDefaultAlignmentAnchors(before, after) {
  return [
    { beforeY: 0, afterY: 0 },
    { beforeY: before.height, afterY: after.height },
  ];
}

function getComparableImageData(image, width, height) {
  if (image.width === width && image.height === height) {
    return image.data;
  }

  const data = new Uint8Array(width * height * 4);
  const rowLength = width * 4;
  for (let y = 0; y < height; y += 1) {
    const sourceStart = y * image.width * 4;
    data.set(image.data.subarray(sourceStart, sourceStart + rowLength), y * rowLength);
  }
  return data;
}

function buildDimensionExtraRegions(width, height, compareWidth, compareHeight) {
  const regions = [];
  if (height > compareHeight) {
    regions.push({
      height: roundPercent(((height - compareHeight) / height) * 100),
      left: 0,
      top: roundPercent((compareHeight / height) * 100),
      width: 100,
    });
  }
  if (width > compareWidth) {
    regions.push({
      height: 100,
      left: roundPercent((compareWidth / width) * 100),
      top: 0,
      width: roundPercent(((width - compareWidth) / width) * 100),
    });
  }
  return regions;
}

function buildDiffRegions(
  diffData,
  compareWidth,
  compareHeight,
  frameWidth = compareWidth,
  frameHeight = compareHeight,
) {
  if (compareWidth <= 0 || compareHeight <= 0) {
    return [];
  }

  const tileSize = getDiffRegionTileSize(compareWidth, compareHeight);
  const columns = Math.ceil(compareWidth / tileSize);
  const rows = Math.ceil(compareHeight / tileSize);
  const tileCounts = new Uint32Array(columns * rows);

  for (let y = 0; y < compareHeight; y += 1) {
    const tileY = Math.floor(y / tileSize);
    for (let x = 0; x < compareWidth; x += 1) {
      const index = (y * compareWidth + x) * 4;
      if (!isPixelmatchDiffPixel(diffData, index)) {
        continue;
      }
      const tileX = Math.floor(x / tileSize);
      tileCounts[tileY * columns + tileX] += 1;
    }
  }

  const dirtyTiles = new Uint8Array(columns * rows);
  for (let tileY = 0; tileY < rows; tileY += 1) {
    for (let tileX = 0; tileX < columns; tileX += 1) {
      const index = tileY * columns + tileX;
      const tileWidth = Math.min(tileSize, compareWidth - tileX * tileSize);
      const tileHeight = Math.min(tileSize, compareHeight - tileY * tileSize);
      const minPixels = Math.max(
        3,
        Math.ceil(tileWidth * tileHeight * 0.006),
      );
      if (tileCounts[index] >= minPixels) {
        dirtyTiles[index] = 1;
      }
    }
  }

  const regions = collectDirtyTileRegions(dirtyTiles, tileCounts, {
    columns,
    height: compareHeight,
    rows,
    tileSize,
    width: compareWidth,
  });
  return compactDiffRegions(regions, frameWidth, frameHeight);
}

function isPixelmatchDiffPixel(data, index) {
  const red = data[index];
  const green = data[index + 1];
  const blue = data[index + 2];
  const alpha = data[index + 3];
  return alpha > 0 && red >= 180 && green <= 150 && blue <= 170;
}

function getDiffRegionTileSize(width, height) {
  const shortSide = Math.min(width, height);
  return Math.max(16, Math.min(48, Math.round(shortSide / 28)));
}

function collectDirtyTileRegions(
  dirtyTiles,
  tileCounts,
  { columns, height, rows, tileSize, width },
) {
  const seen = new Uint8Array(dirtyTiles.length);
  const regions = [];
  const stack = [];

  for (let start = 0; start < dirtyTiles.length; start += 1) {
    if (!dirtyTiles[start] || seen[start]) {
      continue;
    }

    stack.length = 0;
    stack.push(start);
    seen[start] = 1;

    let minColumn = columns;
    let maxColumn = 0;
    let minRow = rows;
    let maxRow = 0;
    let changedPixels = 0;

    while (stack.length > 0) {
      const current = stack.pop();
      const column = current % columns;
      const row = Math.floor(current / columns);
      minColumn = Math.min(minColumn, column);
      maxColumn = Math.max(maxColumn, column);
      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);
      changedPixels += tileCounts[current];

      for (const next of getNeighborTileIndexes(column, row, columns, rows)) {
        if (!dirtyTiles[next] || seen[next]) {
          continue;
        }
        seen[next] = 1;
        stack.push(next);
      }
    }

    const padding = Math.max(4, Math.round(tileSize * 0.25));
    regions.push({
      changedPixels,
      bottom: Math.min(height, (maxRow + 1) * tileSize + padding),
      left: Math.max(0, minColumn * tileSize - padding),
      right: Math.min(width, (maxColumn + 1) * tileSize + padding),
      top: Math.max(0, minRow * tileSize - padding),
    });
  }

  return regions;
}

function getNeighborTileIndexes(column, row, columns, rows) {
  const neighbors = [];
  if (column > 0) {
    neighbors.push(row * columns + column - 1);
  }
  if (column + 1 < columns) {
    neighbors.push(row * columns + column + 1);
  }
  if (row > 0) {
    neighbors.push((row - 1) * columns + column);
  }
  if (row + 1 < rows) {
    neighbors.push((row + 1) * columns + column);
  }
  return neighbors;
}

function compactDiffRegions(regions, width, height) {
  const maxRegions = 14;
  const sortedRegions = regions
    .filter((region) => region.changedPixels >= 3)
    .sort((a, b) => b.changedPixels - a.changedPixels);

  if (sortedRegions.length === 0) {
    return [];
  }

  const selected = sortedRegions.slice(0, maxRegions);
  if (sortedRegions.length > maxRegions) {
    selected.push(mergeDiffRegions(sortedRegions.slice(maxRegions)));
  }

  return selected
    .filter(Boolean)
    .map((region) => ({
      height: roundPercent(((region.bottom - region.top) / height) * 100),
      left: roundPercent((region.left / width) * 100),
      top: roundPercent((region.top / height) * 100),
      width: roundPercent(((region.right - region.left) / width) * 100),
    }));
}

function mergeDiffRegions(regions) {
  if (regions.length === 0) {
    return null;
  }

  return regions.reduce(
    (merged, region) => ({
      changedPixels: merged.changedPixels + region.changedPixels,
      bottom: Math.max(merged.bottom, region.bottom),
      left: Math.min(merged.left, region.left),
      right: Math.max(merged.right, region.right),
      top: Math.min(merged.top, region.top),
    }),
    {
      changedPixels: 0,
      bottom: 0,
      left: Number.POSITIVE_INFINITY,
      right: 0,
      top: Number.POSITIVE_INFINITY,
    },
  );
}

function roundPercent(value) {
  return Math.round(value * 100) / 100;
}

function buildMarkdownDiff(routeName) {
  const snapshot = getMarkdownSnapshot(routeName);
  if (!snapshot) {
    return null;
  }

  if (markdownDiffCache.has(snapshot.repoRelativePath)) {
    return markdownDiffCache.get(snapshot.repoRelativePath);
  }

  const generatedAfter = readCopySnapshot(
    afterCopySnapshotsRoot,
    snapshot.artifactRelativePath,
  );
  const workingPath = path.join(repoRoot, snapshot.repoRelativePath);
  if (generatedAfter === null && !existsSync(workingPath)) {
    markdownDiffCache.set(snapshot.repoRelativePath, null);
    return null;
  }

  const generatedBefore = readCopySnapshot(
    beforeCopySnapshotsRoot,
    snapshot.artifactRelativePath,
  );
  const gitBefore = readMainFile(snapshot.repoRelativePath);
  const before = generatedBefore ?? gitBefore;
  const isNewRoute = before === null && isNewRouteSnapshot(snapshot);
  if (before === null && !isNewRoute) {
    markdownDiffCache.set(snapshot.repoRelativePath, null);
    return null;
  }

  const after = generatedAfter ?? readFileSync(workingPath, "utf8");
  const lines = buildUnifiedMarkdownDiffLines(
    before ?? "",
    after,
    snapshot.repoRelativePath,
  );
  const addedLines = lines.filter((line) => line.kind === "add").length;
  const removedLines = lines.filter((line) => line.kind === "del").length;
  if (addedLines === 0 && removedLines === 0) {
    markdownDiffCache.set(snapshot.repoRelativePath, null);
    return null;
  }
  const diff = {
    addedLines,
    fileName: snapshot.fileName,
    label: isNewRoute
      ? `Text snapshot: ${snapshot.fileName} (new route)`
      : `Text diff: ${snapshot.fileName}`,
    lines,
    metaChanges: [],
    removedLines,
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
    artifactRelativePath: toPosix(path.join(...segments, fileName)),
    fileName,
    repoRelativePath,
  };
}

function isAuthenticatedMarkdownRoute(routeName) {
  return (
    routeSpecs.get(routeName)?.authenticated === true ||
    /-auth(\b|$)/.test(routeName) ||
    routeName.endsWith("-auth")
  );
}

function isNewRouteSnapshot(snapshot) {
  const pageSourcePath = toPosix(
    path.posix.join(path.posix.dirname(snapshot.repoRelativePath), "page.tsx"),
  );
  return readMainFile(pageSourcePath) === null;
}

function readCopySnapshot(root, relativePath) {
  if (!root) return null;
  const candidate = path.resolve(root, relativePath);
  const relative = path.relative(root, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  try {
    return readFileSync(candidate, "utf8");
  } catch {
    return null;
  }
}

let cachedBaselineRef;
/**
 * Ref the copy snapshots are diffed against. Overridable for local variant
 * demos (VISUAL_REVIEW_BASELINE_REF=HEAD~1); defaults to the merge-base with
 * origin/main so PR branches diff against where they forked, and falls back
 * to local `main` for checkouts without the remote ref.
 */
function getBaselineRef() {
  if (cachedBaselineRef !== undefined) return cachedBaselineRef;
  const envRef = process.env.VISUAL_REVIEW_BASELINE_REF?.trim();
  if (envRef) {
    cachedBaselineRef = envRef;
    return cachedBaselineRef;
  }
  for (const candidate of [["merge-base", "origin/main", "HEAD"]]) {
    try {
      cachedBaselineRef = execFileSync("git", candidate, {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      return cachedBaselineRef;
    } catch {
      // fall through
    }
  }
  cachedBaselineRef = "main";
  return cachedBaselineRef;
}

function readMainFile(repoRelativePath) {
  try {
    return execFileSync(
      "git",
      ["show", `${getBaselineRef()}:${repoRelativePath}`],
      {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
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
        lines.push({ kind: "add", text: `+${row.text}` });
      } else if (row.kind === "remove") {
        lines.push({ kind: "del", text: `-${row.text}` });
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
      const className = line.kind === "add" || line.kind === "added"
        ? "added"
        : line.kind === "del" || line.kind === "removed"
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
    copyOnlyRoutes: groups.filter(
      (group) =>
        !group.changed &&
        !group.errored &&
        Boolean(buildMarkdownDiff(group.routeName)),
    ).length,
    erroredRoutes: groups.filter((group) => group.errored).length,
    unchangedRoutes: groups.filter(
      (group) =>
        !group.changed &&
        !group.errored &&
        !buildMarkdownDiff(group.routeName),
    ).length,
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
    routes: groups.map((group) => {
      const markdownDiff = buildMarkdownDiff(group.routeName);
      const copyChanged = Boolean(markdownDiff);
      const siteVariant = getRouteSiteVariant(group.routeName);
      return {
        routeName: group.routeName,
        routeLabel: siteVariant
          ? labelVariantRoute(group.routeName, siteVariant)
          : labelRoute(group.routeName),
        routePath: routePaths.get(group.routeName) ?? null,
        routeUrl: getRouteUrl(group.routeName),
        authState: getRouteAuthState(group.routeName),
        siteVariant,
        changed: group.changed,
        copyChanged,
        errored: group.errored,
        changedPairs: group.changedPairs,
        missingPairs: group.missingPairs,
        erroredPairs: group.erroredPairs,
        statusLabel: reviewStatusLabel(group, markdownDiff),
        reviewUrl: reviewBase
          ? `${reviewBase}/latest.html#route=${encodeURIComponent(group.routeName)}`
          : null,
        projects: group.pairs.map((pair) => ({
          projectName: pair.projectName,
          projectLabel: labelProject(pair.projectName),
          changed: Boolean(pair.diff?.changed),
          missing: Boolean(pair.diff?.missing),
          errored: Boolean(pair.diff?.errored),
          diffLabel: pair.diff?.label ?? null,
        })),
      };
    }),
  };
}

function reviewStatusLabel(group, markdownDiff) {
  if (!markdownDiff) return routeStatusLabel(group);
  if (group.pairs.length === 0) return "copy changed - no screenshot";
  if (!group.changed && !group.errored) return "copy changed";
  return routeStatusLabel(group);
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

function formatStylePercent(value) {
  const bounded = Math.max(0, Math.min(100, value));
  return `${bounded.toFixed(2).replace(/\.?0+$/, "")}%`;
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
            siteVariant:
              typeof entry.siteVariant === "string" ? entry.siteVariant : null,
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
  return prNumber
    ? `https://mikepsinn.github.io/optimitron/pr-${prNumber}/latest`
    : null;
}

function getRouteAuthState(routeName) {
  if (routeSpecs.get(routeName)?.authenticated || isAuthenticatedMarkdownRoute(routeName)) {
    return "demo-logged-in";
  }
  return "logged-out";
}

// Manifest first; filename-prefix fallback covers baseline screenshots
// captured before the manifest carried siteVariant.
function getRouteSiteVariant(routeName) {
  const fromManifest = routeSpecs.get(routeName)?.siteVariant;
  if (fromManifest) {
    return fromManifest;
  }
  const match = /^variant-([a-z0-9]+)-/i.exec(routeName);
  return match && VARIANT_DOMAIN_LABELS[match[1]] ? match[1] : null;
}

function getVariantDomainLabel(siteVariant) {
  return VARIANT_DOMAIN_LABELS[siteVariant] ?? siteVariant;
}

function labelVariantRoute(routeName, siteVariant) {
  const rest = routeName.replace(`variant-${siteVariant}-`, "");
  return `${getVariantDomainLabel(siteVariant)} · ${labelRoute(rest)}`;
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
  const siteVariant = getRouteSiteVariant(routeName);
  if (siteVariant) {
    // Honored on local hosts only (middleware ?site= override); harmless
    // elsewhere.
    url.searchParams.set("site", siteVariant);
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
