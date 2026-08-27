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
import {
  isComparableScreenshotChange,
  isNewCopySnapshot,
  isSignificantDimensionChange,
  normalizeVisualReviewMarkdown,
} from "./visual-review-diff.mjs";
import {
  buildChangedFileDiscoveryArgs,
  buildVisualCoverage,
  parseChangedFileDiscoveryOutput,
} from "./visual-review-coverage.mjs";
import {
  getVisualCaptureVersion,
  normalizeVisualRouteManifest,
} from "./visual-capture-contract.mjs";
import { renderReviewHtml } from "./visual-review-page.mjs";
import {
  APP_PREVIEW_LABELS,
  getAppPreviewRouteUrl,
  parseAppPreviewUrls,
} from "../../../scripts/app-preview-urls.mjs";

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
const beforeRouteManifestPath = beforeScreenshotsRoot
  ? path.join(beforeScreenshotsRoot, "routes.json")
  : null;
const beforeCopySnapshotsRoot = process.env.VISUAL_COPY_BEFORE_ROOT
  ? resolveInputPath(process.env.VISUAL_COPY_BEFORE_ROOT)
  : null;
const afterCopySnapshotsRoot = process.env.VISUAL_COPY_AFTER_ROOT
  ? resolveInputPath(process.env.VISUAL_COPY_AFTER_ROOT)
  : null;
const appPreviewUrls = parseAppPreviewUrls(
  process.env.VISUAL_REVIEW_APP_URLS_JSON,
  process.env.VISUAL_REVIEW_BASE_URL,
);
const pageLinkBaseUrl = parseOptionalUrl(
  appPreviewUrls.optimitron ??
    (process.env.CI === "true"
      ? null
      : (process.env.BASE_URL ?? process.env.NEXTAUTH_URL)),
);
const outputRoot = path.resolve(webRoot, "output", "playwright", "review");
const assetRoot = path.join(outputRoot, "assets");
const latestHtmlPath = path.join(outputRoot, "latest.html");
const reviewManifestPath = path.join(outputRoot, "manifest.json");
// 0.2% — covers cross-environment pixel rendering noise (Windows-Chromium-
// local vs Linux-Chromium-CI font hinting + anti-aliasing). Tightened from
// the original 0.5% workaround for live-clock drift (that drift is now
// fixed upstream by freezeClock at e2e/helpers/freeze-clock.mjs), then
// raised from 0.1% on 2026-05-15 after side-menu and side-menu-auth
// landed at 0.11% from pure rendering noise. Real UI changes are
// typically >1%. If a class of pages drifts because of a DYNAMIC
// element (clock, counter, randomized content), fix the SOURCE with
// data-volatile or freezeClock — don't keep widening this number.
const diffPixelRatioThreshold = parseNumberEnv(
  "VISUAL_REVIEW_DIFF_RATIO",
  0.002,
);
const pixelmatchThreshold = parseNumberEnv(
  "VISUAL_REVIEW_PIXEL_THRESHOLD",
  0.12,
);
// Full-page height deltas below this are treated as rendering drift, not a
// change, so a sub-pixel reflow in shared chrome stops force-flagging every
// route with "0% overlap". See isSignificantDimensionChange in
// visual-review-diff.mjs. Width stays exact (fixed viewport).
const dimensionTolerancePx = parseNumberEnv(
  "VISUAL_REVIEW_DIMENSION_TOLERANCE_PX",
  12,
);
const dimensionToleranceRatio = parseNumberEnv(
  "VISUAL_REVIEW_DIMENSION_TOLERANCE_RATIO",
  0.004,
);
const allowIncompleteReview =
  process.env.VISUAL_REVIEW_ALLOW_INCOMPLETE === "1";
const reviewCommitSha =
  process.env.VISUAL_REVIEW_COMMIT_SHA ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  null;
const reviewGeneratedAt = new Date();
const routeManifest = loadRouteManifest(routeManifestPath);
const beforeRouteManifest = beforeRouteManifestPath
  ? loadRouteManifest(beforeRouteManifestPath)
  : null;
const routeSpecs = routeManifest.routeSpecs;
const webCaptureProtocolMismatch = Boolean(
  beforeScreenshotsRoot &&
  routeSpecs.size > 0 &&
  routeManifest.captureVersion !== beforeRouteManifest?.captureVersion,
);
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
  "mcp-authorize-admin-user",
  "mcp-authorize-non-admin-user",
  "organizations",
  "organization-iam-public",
  "organization-iam-survey",
  "task-optimize-earth",
  "task-one-percent-treaty",
  "task-signer-canada",
  "task-management-owner",
  "task-management-claimant-admin",
  "task-management-add-subtask",
  "document-review-manager",
  "document-review-reviewer",
  "document-review-stale",
  "legacy-warondisease-home",
  "legacy-warondisease-dashboard-auth",
  "variant-dfda-home",
  "variant-dfda-conditions",
  "variant-dih-home",
  "variant-dih-fund-a-disease",
];

const legacyRouteNameAliases = new Map([
  ["mcp-authorize-consent", "mcp-authorize-admin-user"],
]);

const routeLabelOverrides = new Map([
  ["mcp-authorize-admin-user", "MCP authorize — admin user"],
  ["mcp-authorize-non-admin-user", "MCP authorize — non-admin user"],
]);

// Non-default site variants captured by the variant-delta routes in
// e2e/utils/visual-routes.ts. Keys match SiteKey in src/lib/site.ts.
const VARIANT_DOMAIN_LABELS = {
  optimitron: "optimitron.com",
  warondisease: "warondisease.org",
  warOnDisease: "warondisease.org",
  dfda: "dfda.earth",
  dih: "dih.earth",
  wishocracy: "wishocracy.org",
  trialabundancesurvey: "trialabundancesurvey.org",
  curedao: "curedao.org",
  acceleratedmedicine: "acceleratedmedicine.org",
};

const SITE_APP_ORDER = [
  "warondisease",
  "dfda",
  "wishocracy",
  "trialabundancesurvey",
  "curedao",
  "acceleratedmedicine",
];

const siteAppManifestsByVariant = loadSiteAppRouteManifests(screenshotsRoot);
const beforeSiteAppManifestsByVariant = beforeScreenshotsRoot
  ? loadSiteAppRouteManifests(beforeScreenshotsRoot)
  : new Map();
const incompatibleSiteAppVariants = new Set(
  [...siteAppManifestsByVariant.entries()]
    .filter(
      ([siteVariant, manifest]) =>
        beforeScreenshotsRoot &&
        manifest.captureVersion !==
          (beforeSiteAppManifestsByVariant.get(siteVariant)?.captureVersion ??
            1),
    )
    .map(([siteVariant]) => siteVariant),
);
registerSiteAppRouteSpecs(routeSpecs, routePaths, siteAppManifestsByVariant);

main().catch((error) => {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
  process.exitCode = 1;
});

async function main() {
  mkdirSync(outputRoot, { recursive: true });
  rmSync(assetRoot, { recursive: true, force: true });

  const beforeScreenshots = beforeScreenshotsRoot
    ? collectScreenshots(beforeScreenshotsRoot, "before")
    : [];
  const screenshots = [
    ...beforeScreenshots.filter(isCompatibleBaselineScreenshot),
    ...collectScreenshots(screenshotsRoot, "after"),
  ];
  const grouped = appendCopyOnlyGroups(
    await analyzeGroups(groupScreenshots(screenshots)),
  );
  const coverage = buildVisualCoverage({
    afterCaptures: screenshots.filter(
      (screenshot) => screenshot.version === "after",
    ),
    changedFiles: loadChangedFiles(),
    routes: [...routeSpecs.entries()].map(([name, spec]) => ({
      name,
      ...spec,
    })),
  });
  const html = renderHtml(grouped, coverage);
  const manifest = buildReviewManifest(grouped, coverage);
  const blockingIssues = getBlockingReviewIssues(
    grouped,
    screenshots,
    coverage,
  );

  writeFileSync(latestHtmlPath, html, "utf8");
  writeFileSync(reviewManifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`[visual-review] wrote ${latestHtmlPath}`);
  console.log(`[visual-review] wrote ${reviewManifestPath}`);
  console.log(`[visual-review] screenshots=${screenshots.length}`);
  console.log(
    `[visual-review] changed=${grouped.filter((group) => group.changed).length} unchanged=${grouped.filter((group) => !group.changed).length}`,
  );
  console.log(
    `[visual-review] UI coverage=${coverage.coveredUiFiles.length}/${coverage.changedUiFiles.length} changed source files`,
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
      const legacyRouteName = entry
        .replace(/\.png$/i, "")
        .replace(/-(default|visual-mobile)$/i, "");
      const routeName =
        version === "before"
          ? (legacyRouteNameAliases.get(legacyRouteName) ?? legacyRouteName)
          : legacyRouteName;
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
    const routeDelta =
      routeSortIndex(a.routeName) - routeSortIndex(b.routeName);
    if (routeDelta !== 0) {
      return routeDelta;
    }
    return projectSortIndex(a.projectName) - projectSortIndex(b.projectName);
  });
}

function isRedirectOnlyScreenshotRoute(routeName) {
  const siteAppRoute = getSiteAppRoute(routeName);
  if (siteAppRoute) {
    return siteAppRoute.routeName.endsWith("-redirect");
  }

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
      (a, b) =>
        projectSortIndex(a.projectName) - projectSortIndex(b.projectName),
    ),
  }));
}

function renderHtml(groups, coverage) {
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
  return renderReviewHtml(buildReviewPageInput(groups, coverage));
}

/**
 * Adapter: map the analyzed screenshot groups onto the data contract
 * expected by renderReviewHtml (scripts/visual-review-page.mjs). Routes are
 * ordered by app and capture kind. The rail applies review priority within
 * each app while preserving routeOrder for equal-priority routes.
 */
function buildReviewPageInput(groups, coverage) {
  const reviewBase = getPublishedReviewBase();
  const routes = groups.map((group) => buildReviewPageRoute(group));
  return {
    meta: {
      prNumber,
      shortSha: reviewCommitSha ? shortSha(reviewCommitSha) : null,
      commitSha: reviewCommitSha,
      headBranch,
      generatedAt: reviewGeneratedAt.toISOString(),
      generatedAtCentral: formatCentralTime(reviewGeneratedAt),
      previewBaseUrl: pageLinkBaseUrl ? pageLinkBaseUrl.toString() : null,
      productionBaseUrl: "https://warondisease.org",
      reviewUrl: reviewBase ? `${reviewBase}/latest.html` : null,
      repo: repoSlug,
      baselineDescription: buildBaselineDescription(),
    },
    summary: {
      changedRoutes: routes.filter((route) => route.changed).length,
      copyOnlyRoutes: routes.filter(
        (route) => route.copyChanged && !route.changed && !route.errored,
      ).length,
      missingBaselineRoutes: routes.filter(
        (route) => route.baselineMissingPairs > 0,
      ).length,
      unchangedRoutes: routes.filter(
        (route) =>
          !route.changed &&
          !route.copyChanged &&
          !route.errored &&
          route.missingPairs === 0,
      ).length,
      appCount: new Set(
        routes
          .filter((route) => route.captureKind === "app")
          .map((route) => route.appId),
      ).size,
      appRoutes: routes.filter((route) => route.captureKind === "app").length,
      compatibilityRoutes: routes.filter(
        (route) => route.captureKind === "legacy-host",
      ).length,
      erroredRoutes: routes.filter((route) => route.errored).length,
      totalRoutes: routes.length,
    },
    coverage,
    routes,
  };
}

function buildBaselineDescription() {
  const copyRef = getBaselineRef();
  const copyRefLabel = /^[0-9a-f]{40}$/i.test(copyRef)
    ? shortSha(copyRef)
    : copyRef;
  const skippedBaselines = [];
  if (webCaptureProtocolMismatch) {
    skippedBaselines.push(
      `intentional web baseline refresh: capture ownership protocol v${beforeRouteManifest?.captureVersion} -> v${routeManifest.captureVersion}`,
    );
  }
  if (incompatibleSiteAppVariants.size > 0) {
    skippedBaselines.push(
      `site-app capture protocol changed: ${[...incompatibleSiteAppVariants].join(", ")}`,
    );
  }
  const screenshotBaseline = beforeScreenshotsRoot
    ? skippedBaselines.length > 0
      ? `baseline skipped for ${skippedBaselines.join("; ")}`
      : "screenshots vs main baseline artifact"
    : "no screenshot baseline artifact";

  return [screenshotBaseline, `copy vs ${copyRefLabel}`].join(" · ");
}

function isCompatibleBaselineScreenshot(screenshot) {
  const siteVariant = getSiteAppVariantFromRouteName(screenshot.routeName);
  if (siteVariant) {
    return !incompatibleSiteAppVariants.has(siteVariant);
  }
  return !webCaptureProtocolMismatch;
}

function isRouteBaselineSkippedForCaptureProtocol(routeName) {
  const siteVariant = getSiteAppVariantFromRouteName(routeName);
  return siteVariant
    ? incompatibleSiteAppVariants.has(siteVariant)
    : webCaptureProtocolMismatch;
}

function buildReviewPageRoute(group) {
  const markdownDiff = buildMarkdownDiff(group.routeName);
  const siteAppRoute = getSiteAppRoute(group.routeName);
  const ownership = getRouteOwnership(group.routeName, siteAppRoute);
  const routePath =
    routePaths.get(group.routeName) ?? siteAppRoute?.routePath ?? null;
  const siteVariant =
    siteAppRoute?.siteVariant ?? getRouteSiteVariant(group.routeName);
  return {
    appId: ownership.appId,
    appLabel: ownership.appLabel,
    captureKind: ownership.captureKind,
    routeName: group.routeName,
    routeLabel: siteAppRoute
      ? `${getVariantDomainLabel(siteVariant)} · ${siteAppRoute.routeLabel}`
      : labelOwnedRoute(group.routeName, ownership.appId),
    routePath,
    routeUrl: siteAppRoute
      ? getAppPreviewRouteUrl(
          appPreviewUrls,
          siteVariant,
          routePath,
          getRouteAuthState(group.routeName),
        )
      : getRouteUrl(group.routeName),
    productionUrl: getProductionRouteUrl(routePath, ownership.appId),
    authState: getRouteAuthState(group.routeName),
    siteApp: Boolean(siteAppRoute),
    siteVariant,
    variantLabel: siteVariant ? getVariantDomainLabel(siteVariant) : null,
    changed: group.changed,
    baselineMissingPairs: group.baselineMissingPairs,
    baselineSkippedForCaptureProtocol:
      isRouteBaselineSkippedForCaptureProtocol(group.routeName),
    copyChanged: Boolean(markdownDiff),
    errored: group.errored,
    missingPairs: group.missingPairs,
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
    const changedPairs = pairs.filter((pair) =>
      isComparableScreenshotChange(pair.diff),
    ).length;
    const missingPairs = pairs.filter((pair) => pair.diff.missing).length;
    const baselineMissingPairs = pairs.filter(
      (pair) => pair.diff.missing && !pair.before && pair.after,
    ).length;
    const erroredPairs = pairs.filter((pair) => pair.diff.errored).length;
    analyzed.push({
      ...group,
      baselineMissingPairs,
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
      baselineMissingPairs: 0,
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
      changed: false,
      label: "missing before",
      missing: true,
      statusClass: "missing",
    };
  }
  if (pair.before && !pair.after) {
    return {
      changed: false,
      label: "missing after",
      missing: true,
      statusClass: "missing",
    };
  }
  if (!pair.before || !pair.after) {
    return {
      changed: false,
      label: "missing",
      missing: true,
      statusClass: "missing",
    };
  }

  try {
    const { PNG, pixelmatch } = await loadImageDiffDependencies();
    const before = PNG.sync.read(readFileSync(pair.before.assetPath));
    const after = PNG.sync.read(readFileSync(pair.after.assetPath));
    const dimensionChanged = isSignificantDimensionChange(before, after, {
      tolerancePx: dimensionTolerancePx,
      toleranceRatio: dimensionToleranceRatio,
    });
    const compareWidth = Math.min(before.width, after.width);
    const compareHeight = Math.min(before.height, after.height);
    const beforeData = getComparableImageData(
      before,
      compareWidth,
      compareHeight,
    );
    const afterData = getComparableImageData(
      after,
      compareWidth,
      compareHeight,
    );
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
        const extracted = extractHunksAndAlignment({
          before,
          after,
          noiseFloorPct: 0,
        });
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
      const diffAssetPath = path.join(
        afterDir,
        buildDiffFileName(pair.after.fileName),
      );
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
        ...buildDimensionExtraRegions(
          before.width,
          before.height,
          compareWidth,
          compareHeight,
        ),
      ];
      afterRegions = [
        ...afterRegions,
        ...buildDimensionExtraRegions(
          after.width,
          after.height,
          compareWidth,
          compareHeight,
        ),
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
    data.set(
      image.data.subarray(sourceStart, sourceStart + rowLength),
      y * rowLength,
    );
  }
  return data;
}

function buildDimensionExtraRegions(
  width,
  height,
  compareWidth,
  compareHeight,
) {
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
      const minPixels = Math.max(3, Math.ceil(tileWidth * tileHeight * 0.006));
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

  return selected.filter(Boolean).map((region) => ({
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
  const isNewSnapshot = isNewCopySnapshot(before, generatedAfter);
  if (before === null && !isNewSnapshot) {
    markdownDiffCache.set(snapshot.repoRelativePath, null);
    return null;
  }

  const after = generatedAfter ?? readFileSync(workingPath, "utf8");
  const normalizedBefore = normalizeVisualReviewMarkdown(
    before ?? "",
    snapshot.repoRelativePath,
  );
  const normalizedAfter = normalizeVisualReviewMarkdown(
    after,
    snapshot.repoRelativePath,
  );
  const lines = buildUnifiedMarkdownDiffLines(
    normalizedBefore,
    normalizedAfter,
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
    label: isNewSnapshot
      ? `Text snapshot: ${snapshot.fileName} (new snapshot)`
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
    path.join("apps", "optimitron", "src", "app", ...segments, fileName),
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

function loadChangedFiles() {
  const envJson = process.env.VISUAL_REVIEW_CHANGED_FILES_JSON?.trim();
  if (envJson) {
    let parsed;
    try {
      parsed = JSON.parse(envJson);
    } catch (error) {
      throw new TypeError(
        "VISUAL_REVIEW_CHANGED_FILES_JSON must be a JSON array of file paths",
        { cause: error },
      );
    }
    if (
      !Array.isArray(parsed) ||
      parsed.some((entry) => typeof entry !== "string")
    ) {
      throw new TypeError(
        "VISUAL_REVIEW_CHANGED_FILES_JSON must be a JSON array of file paths",
      );
    }
    return parsed;
  }

  try {
    const output = execFileSync(
      "git",
      buildChangedFileDiscoveryArgs(getBaselineRef()),
      {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
    return parseChangedFileDiscoveryOutput(output);
  } catch {
    console.warn(
      "[visual-review] changed-file analysis unavailable; screenshot coverage cannot be proven",
    );
    return null;
  }
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
      const className =
        line.kind === "add" || line.kind === "added"
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
  const baseName = path
    .basename(fileName, ".png")
    .replace(/-(before|after)$/i, "");
  return `${baseName}-diff.png`;
}

function summarizeGroups(groups) {
  const ownership = groups.map((group) =>
    getRouteOwnership(group.routeName, getSiteAppRoute(group.routeName)),
  );
  return {
    changedRoutes: groups.filter((group) => group.changed).length,
    copyOnlyRoutes: groups.filter(
      (group) =>
        !group.changed &&
        !group.errored &&
        Boolean(buildMarkdownDiff(group.routeName)),
    ).length,
    erroredRoutes: groups.filter((group) => group.errored).length,
    missingBaselineRoutes: groups.filter(
      (group) => group.baselineMissingPairs > 0,
    ).length,
    appCount: new Set(
      ownership
        .filter(({ captureKind }) => captureKind === "app")
        .map(({ appId }) => appId),
    ).size,
    appRoutes: ownership.filter(({ captureKind }) => captureKind === "app")
      .length,
    compatibilityRoutes: ownership.filter(
      ({ captureKind }) => captureKind === "legacy-host",
    ).length,
    unchangedRoutes: groups.filter(
      (group) =>
        !group.changed &&
        !group.errored &&
        group.missingPairs === 0 &&
        !buildMarkdownDiff(group.routeName),
    ).length,
    missingPairs: groups.reduce((sum, group) => sum + group.missingPairs, 0),
  };
}

function buildReviewManifest(groups, coverage) {
  const reviewBase = getPublishedReviewBase();
  return {
    version: 2,
    generatedAt: reviewGeneratedAt.toISOString(),
    generatedAtCentral: formatCentralTime(reviewGeneratedAt),
    commitSha: reviewCommitSha,
    shortSha: reviewCommitSha ? shortSha(reviewCommitSha) : null,
    prNumber,
    headBranch,
    repo: repoSlug,
    previewBaseUrl: pageLinkBaseUrl ? pageLinkBaseUrl.toString() : null,
    reviewUrl: reviewBase ? `${reviewBase}/latest.html` : null,
    baselineDescription: buildBaselineDescription(),
    summary: summarizeGroups(groups),
    coverage,
    routes: groups.map((group) => {
      const markdownDiff = buildMarkdownDiff(group.routeName);
      const copyChanged = Boolean(markdownDiff);
      const siteAppRoute = getSiteAppRoute(group.routeName);
      const ownership = getRouteOwnership(group.routeName, siteAppRoute);
      const siteVariant =
        siteAppRoute?.siteVariant ?? getRouteSiteVariant(group.routeName);
      const routePath =
        routePaths.get(group.routeName) ?? siteAppRoute?.routePath ?? null;
      return {
        appId: ownership.appId,
        appLabel: ownership.appLabel,
        captureKind: ownership.captureKind,
        routeName: group.routeName,
        routeLabel: siteAppRoute
          ? `${getVariantDomainLabel(siteVariant)} · ${siteAppRoute.routeLabel}`
          : labelOwnedRoute(group.routeName, ownership.appId),
        routePath,
        routeUrl: siteAppRoute
          ? getAppPreviewRouteUrl(
              appPreviewUrls,
              siteVariant,
              routePath,
              getRouteAuthState(group.routeName),
            )
          : getRouteUrl(group.routeName),
        authState: getRouteAuthState(group.routeName),
        siteApp: Boolean(siteAppRoute),
        siteVariant,
        baselineMissingPairs: group.baselineMissingPairs,
        baselineSkippedForCaptureProtocol:
          isRouteBaselineSkippedForCaptureProtocol(group.routeName),
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

function getBlockingReviewIssues(groups, screenshots, coverage) {
  const issues = [...coverage.blockingIssues];
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
  if (!group.changed && !group.errored && group.missingPairs === 0) {
    return "unchanged";
  }
  const parts = [];
  if (group.changedPairs > 0) {
    parts.push(`${group.changedPairs} changed`);
  }
  if (group.baselineMissingPairs > 0) {
    parts.push(`${group.baselineMissingPairs} baseline missing`);
  }
  const currentMissingPairs = group.missingPairs - group.baselineMissingPairs;
  if (currentMissingPairs > 0) {
    parts.push(`${currentMissingPairs} current missing`);
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
  if (index !== -1) {
    return index;
  }

  const siteAppRoute = getSiteAppRoute(routeName);
  if (!siteAppRoute) {
    return routeOrder.length;
  }

  const appIndex = SITE_APP_ORDER.indexOf(siteAppRoute.siteVariant);
  const routeIndex = getSiteAppRoutes(siteAppRoute.siteVariant).findIndex(
    (route) => route.routeName === siteAppRoute.routeName,
  );
  return routeOrder.length + appIndex * 100 + routeIndex;
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
  const override = routeLabelOverrides.get(routeName);
  if (override) {
    return override;
  }
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

function loadRouteManifest(manifestPath) {
  if (!manifestPath || !existsSync(manifestPath)) {
    const manifest = normalizeVisualRouteManifest(null);
    return { ...manifest, routeSpecs: new Map() };
  }

  try {
    const parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
    const manifest = normalizeVisualRouteManifest(parsed);

    const routeSpecs = new Map(
      manifest.routes
        .filter(
          (entry) =>
            entry &&
            typeof entry.name === "string" &&
            typeof entry.path === "string",
        )
        .map((entry) => [
          entry.name,
          {
            appId: typeof entry.appId === "string" ? entry.appId : null,
            appLabel:
              typeof entry.appLabel === "string" ? entry.appLabel : null,
            captureKind:
              entry.captureKind === "app" ||
              entry.captureKind === "legacy-host"
                ? entry.captureKind
                : null,
            path: entry.path,
            authenticated: entry.authenticated === true,
            activationSelector:
              typeof entry.activationSelector === "string"
                ? entry.activationSelector
                : "",
            covers: Array.isArray(entry.covers)
              ? entry.covers.filter((filePath) => typeof filePath === "string")
              : [],
            required: entry.required === true,
            requiredProjects: Array.isArray(entry.requiredProjects)
              ? entry.requiredProjects.filter(
                  (projectName) => typeof projectName === "string",
                )
              : [],
            siteVariant:
              typeof entry.siteVariant === "string" ? entry.siteVariant : null,
          },
        ]),
    );
    return { ...manifest, routeSpecs };
  } catch (error) {
    console.warn(
      `[visual-review] Could not read route manifest at ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
    const manifest = normalizeVisualRouteManifest(null);
    return { ...manifest, routeSpecs: new Map() };
  }
}

function getPublishedReviewBase() {
  return prNumber
    ? `https://mikepsinn.github.io/optimitron/pr-${prNumber}/latest`
    : null;
}

function getRouteAuthState(routeName) {
  if (
    routeSpecs.get(routeName)?.authenticated ||
    isAuthenticatedMarkdownRoute(routeName)
  ) {
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

function getSiteAppRoute(routeName) {
  const siteVariant = getSiteAppVariantFromRouteName(routeName);
  if (siteVariant) {
    const prefix = `site-app-${siteVariant}-`;
    const siteAppRouteName = routeName.slice(prefix.length);
    const route = getSiteAppRoutes(siteVariant).find(
      (candidate) => candidate.routeName === siteAppRouteName,
    );
    if (route) {
      return {
        ...route,
        routeName: siteAppRouteName,
        siteVariant,
      };
    }
  }
  return null;
}

function getSiteAppVariantFromRouteName(routeName) {
  return (
    SITE_APP_ORDER.find((siteVariant) =>
      routeName.startsWith(`site-app-${siteVariant}-`),
    ) ?? null
  );
}

function getSiteAppRoutes(siteVariant) {
  return siteAppManifestsByVariant.get(siteVariant)?.routes ?? [];
}

function loadSiteAppRouteManifests(root) {
  const manifests = new Map();
  const manifestDirectory = path.join(root, "site-app-manifests");

  for (const fileName of safeReadDir(manifestDirectory)) {
    if (!fileName.toLowerCase().endsWith(".json")) {
      continue;
    }

    const manifestPath = path.join(manifestDirectory, fileName);
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      if (
        !manifest ||
        !SITE_APP_ORDER.includes(manifest.appName) ||
        !Array.isArray(manifest.routes)
      ) {
        throw new Error("invalid manifest shape");
      }

      const routes = manifest.routes
        .filter(
          (route) =>
            route &&
            typeof route.label === "string" &&
            typeof route.routeName === "string" &&
            typeof route.routePath === "string",
        )
        .map((route) => ({
          authenticated: route.authenticated === true,
          authRole:
            typeof route.authRole === "string" ? route.authRole : null,
          covers: Array.isArray(route.covers)
            ? route.covers.filter((filePath) => typeof filePath === "string")
            : [],
          routeLabel: route.label,
          routeName: route.routeName,
          routePath: route.routePath,
        }));
      if (routes.length === 0) {
        throw new Error("manifest contains no routes");
      }
      manifests.set(manifest.appName, {
        captureVersion: getVisualCaptureVersion(manifest),
        routes,
      });
    } catch (error) {
      console.warn(
        `[visual-review] Could not read site-app route manifest at ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return manifests;
}

function registerSiteAppRouteSpecs(specs, paths, manifests) {
  for (const [siteVariant, manifest] of manifests) {
    for (const route of manifest.routes) {
      const name = `site-app-${siteVariant}-${route.routeName}`;
      specs.set(name, {
        activationSelector: "body",
        appId: siteVariant,
        appLabel: getAppLabel(siteVariant),
        authenticated: route.authenticated,
        authRole: route.authRole,
        captureKind: "app",
        covers: route.covers,
        path: route.routePath,
        required: true,
        requiredProjects: ["default", "visual-mobile"],
        siteVariant,
      });
      paths.set(name, route.routePath);
    }
  }
}

function getVariantDomainLabel(siteVariant) {
  return VARIANT_DOMAIN_LABELS[siteVariant] ?? siteVariant;
}

function getAppLabel(appId) {
  return APP_PREVIEW_LABELS[appId] ?? (appId === "dih" ? "DIH" : appId);
}

function getRouteOwnership(routeName, siteAppRoute = null) {
  const routeSpec = routeSpecs.get(routeName);
  const fallbackVariant =
    siteAppRoute?.siteVariant ?? getRouteSiteVariant(routeName);
  const fallbackAppId =
    fallbackVariant === "warOnDisease"
      ? "warondisease"
      : (fallbackVariant ?? "optimitron");
  const appId = routeSpec?.appId ?? fallbackAppId;
  const captureKind =
    routeSpec?.captureKind ??
    (/^(?:legacy-|variant-(?:dfda|dih)-)/u.test(routeName)
      ? "legacy-host"
      : "app");
  return {
    appId,
    appLabel: routeSpec?.appLabel ?? getAppLabel(appId),
    captureKind,
  };
}

function labelOwnedRoute(routeName, appId) {
  const prefixPattern = new RegExp(`^(?:variant|legacy)-${appId}-`, "u");
  const rest = routeName.replace(prefixPattern, "");
  return `${getVariantDomainLabel(appId)} · ${labelRoute(rest)}`;
}

function getProductionRouteUrl(routePath, appId) {
  if (!routePath) return null;
  const origin = appId
    ? `https://${getVariantDomainLabel(appId)}`
    : "https://warondisease.org";
  return new URL(routePath, origin).toString();
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
  // Clear a previously selected variant when a reviewer returns to a default
  // route. Production custom domains ignore this review-only override.
  url.searchParams.set("site", siteVariant ?? "reset");
  return url.toString();
}

function parseOptionalUrl(value) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    console.warn(
      `[visual-review] Ignoring invalid page link base URL: ${value}`,
    );
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
