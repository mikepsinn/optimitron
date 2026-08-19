/**
 * Smoke test for visual-review-page.mjs.
 * Renders a small synthetic review input, writes output/visual-page-smoke.html,
 * extracts the inline client JS, and runs `node --check` on it.
 *
 * Run: pnpm exec node scripts/visual-review-page.smoke.mjs   (from apps/optimitron)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderReviewHtml } from "./visual-review-page.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "output");
const htmlPath = join(outDir, "visual-page-smoke.html");
const siteAppsHtmlPath = join(outDir, "visual-page-site-apps-smoke.html");
const coverageHtmlPath = join(outDir, "visual-page-coverage-smoke.html");
const clientJsPath = join(outDir, "visual-page-smoke.client.js");

const XSS = 'Home <script>alert("xss")</script> & "quotes" \'single\'';

const input = {
  meta: {
    prNumber: 123,
    shortSha: "abc1234",
    commitSha: "abc1234def5678900000000000000000000000ff",
    headBranch: "feature/eos-showroom-registry",
    repo: "mikepsinn/optimitron",
    generatedAt: "2026-07-05T12:00:00Z",
    generatedAtCentral: "Jul 5, 2026 7:00 AM Central",
    previewBaseUrl: "https://optimitron-git-feature-preview.vercel.app",
    productionBaseUrl: "https://warondisease.org",
    reviewUrl: "https://mikepsinn.github.io/optimitron/pr-123/abc1234/",
    baselineDescription:
      "screenshots vs main @ 871661d, copy vs pre-merge snapshots",
  },
  summary: {
    appCount: 1,
    appRoutes: 3,
    changedRoutes: 1,
    compatibilityRoutes: 1,
    copyOnlyRoutes: 1,
    missingBaselineRoutes: 1,
    unchangedRoutes: 0,
    erroredRoutes: 0,
    totalRoutes: 4,
  },
  coverage: {
    analysisAvailable: true,
    blockingIssues: [],
    changedUiFiles: [],
    complete: true,
    coveredUiFiles: [],
  },
  routes: [
    {
      appId: "optimitron",
      appLabel: "Optimitron",
      captureKind: "app",
      routeName: "home",
      routeLabel: XSS,
      routePath: "/",
      routeUrl:
        "https://optimitron-git-feature-preview.vercel.app/?logout=1&site=optimitron",
      authState: "logged-out",
      changed: true,
      copyChanged: true,
      errored: false,
      statusLabel: "1 viewport changed",
      markdownDiff: {
        addedLines: 3,
        removedLines: 1,
        metaChanges: [
          { field: "title", before: "Old <title>", after: "New & improved" },
        ],
        lines: [
          { kind: "header", text: "--- a/page.logged-out.md" },
          { kind: "header", text: "+++ b/page.logged-out.md" },
          { kind: "hunk", text: "@@ -1,4 +1,6 @@" },
          {
            kind: "context",
            text: " Humanity still has about 121 spare apocalypses.",
          },
          { kind: "del", text: "-Old line" },
          {
            kind: "add",
            text: "+New line with <script>alert(1)</script> markup",
          },
          { kind: "add", text: "+Another added line" },
        ],
      },
      pairs: [
        {
          projectName: "default",
          projectLabel: "Desktop",
          changed: true,
          missing: false,
          errored: false,
          diffLabel: "3.2% changed",
          beforeRelPath: "assets/before/default/home.png",
          afterRelPath: "assets/after/default/home.png",
          diffRelPath: "assets/after/default/home-diff.png",
          beforeWidth: 1440,
          beforeHeight: 4000,
          afterWidth: 1440,
          afterHeight: 4200,
          hunks: [
            {
              before: { yStart: 300, yEnd: 520 },
              after: { yStart: 300, yEnd: 560 },
              kind: "changed",
              pctOfPage: 5.2,
            },
            {
              before: { yStart: 2000, yEnd: 2000 },
              after: { yStart: 2100, yEnd: 2400 },
              kind: "inserted",
              pctOfPage: 7.1,
            },
            {
              before: { yStart: 3600, yEnd: 3700 },
              after: { yStart: 3980, yEnd: 3980 },
              kind: "deleted",
              pctOfPage: 0.3,
            },
          ],
          alignmentAnchors: [
            { beforeY: 0, afterY: 0 },
            { beforeY: 300, afterY: 300 },
            { beforeY: 2000, afterY: 2100 },
            { beforeY: 3600, afterY: 3980 },
            { beforeY: 4000, afterY: 4200 },
          ],
        },
        {
          projectName: "visual-mobile",
          projectLabel: "Mobile",
          changed: false,
          missing: false,
          errored: false,
          diffLabel: "0% changed",
          beforeRelPath: "assets/before/visual-mobile/home.png",
          afterRelPath: "assets/after/visual-mobile/home.png",
          diffRelPath: null,
          beforeWidth: 390,
          beforeHeight: 7000,
          afterWidth: 390,
          afterHeight: 7000,
          hunks: [],
          alignmentAnchors: [
            { beforeY: 0, afterY: 0 },
            { beforeY: 7000, afterY: 7000 },
          ],
        },
      ],
    },
    {
      appId: "optimitron",
      appLabel: "Optimitron",
      captureKind: "app",
      routeName: "calendar",
      routeLabel: "Calendar",
      routePath: "/calendar",
      routeUrl:
        "https://optimitron-git-feature-preview.vercel.app/calendar?login=demo&site=optimitron",
      authState: "demo-logged-in",
      changed: false,
      baselineMissingPairs: 1,
      copyChanged: false,
      errored: false,
      missingPairs: 1,
      statusLabel: "1 baseline missing",
      markdownDiff: null,
      pairs: [
        {
          projectName: "default",
          projectLabel: "Desktop",
          changed: false,
          missing: true,
          errored: false,
          diffLabel: "missing before",
          beforeRelPath: null,
          afterRelPath: "assets/after/default/calendar.png",
          diffRelPath: null,
          beforeWidth: null,
          beforeHeight: null,
          afterWidth: 1440,
          afterHeight: 1200,
          hunks: [],
          alignmentAnchors: [],
        },
      ],
    },
    {
      appId: "optimitron",
      appLabel: "Optimitron",
      captureKind: "app",
      routeName: "prize",
      routeLabel: "Prize",
      routePath: "/prize",
      routeUrl: null,
      authState: "logged-out",
      changed: false,
      copyChanged: true,
      errored: false,
      statusLabel: "copy only — not in the screenshot run",
      markdownDiff: {
        addedLines: 1,
        removedLines: 1,
        metaChanges: [],
        lines: [
          { kind: "hunk", text: "@@ -10,3 +10,3 @@" },
          { kind: "del", text: "-Deposit USDC." },
          { kind: "add", text: "+Deposit USDC. Yield accrues." },
        ],
      },
      pairs: [],
    },
    {
      appId: "dfda",
      appLabel: "dFDA",
      captureKind: "legacy-host",
      routeName: "variant-dfda-home",
      routeLabel: "dfda.earth · Home",
      routePath: "/",
      routeUrl:
        "https://optimitron-git-feature-preview.vercel.app/?logout=1&site=dfda",
      productionUrl: "https://dfda.earth/",
      authState: "logged-out",
      siteVariant: "dfda",
      variantLabel: "dfda.earth",
      changed: false,
      copyChanged: false,
      errored: false,
      statusLabel: "unchanged",
      markdownDiff: null,
      pairs: [],
    },
  ],
};

const siteAppInput = {
  ...input,
  summary: {
    appCount: 7,
    appRoutes: 8,
    changedRoutes: 0,
    compatibilityRoutes: 0,
    copyOnlyRoutes: 0,
    unchangedRoutes: 0,
    erroredRoutes: 0,
    totalRoutes: 8,
  },
  routes: [
    {
      appId: "warondisease",
      appLabel: "War on Disease",
      captureKind: "app",
      routeName: "site-app-warondisease-home",
      routeLabel: "warondisease.org · Home",
      routePath: "/",
      routeUrl: null,
      productionUrl: "https://warondisease.org/",
      authState: "logged-out",
      siteApp: true,
      siteVariant: "warondisease",
      variantLabel: "warondisease.org",
      changed: false,
      copyChanged: false,
      errored: false,
      statusLabel: "captured",
      markdownDiff: null,
      pairs: [],
    },
    {
      appId: "warondisease",
      appLabel: "War on Disease",
      captureKind: "app",
      routeName: "site-app-warondisease-about",
      routeLabel: "warondisease.org · About",
      routePath: "/about",
      routeUrl: null,
      productionUrl: "https://warondisease.org/about",
      authState: "logged-out",
      siteApp: true,
      siteVariant: "warondisease",
      variantLabel: "warondisease.org",
      changed: false,
      copyChanged: false,
      errored: false,
      statusLabel: "captured",
      markdownDiff: null,
      pairs: [],
    },
    {
      appId: "optimitron",
      appLabel: "Optimitron",
      captureKind: "app",
      routeName: "home",
      routeLabel: "optimitron.com · Home",
      routePath: "/",
      routeUrl: null,
      productionUrl: "https://optimitron.com/",
      authState: "logged-out",
      siteVariant: "optimitron",
      variantLabel: "optimitron.com",
      changed: false,
      copyChanged: false,
      errored: false,
      statusLabel: "captured",
      markdownDiff: null,
      pairs: [],
    },
    {
      appId: "dfda",
      appLabel: "dFDA",
      captureKind: "app",
      routeName: "site-app-dfda-home",
      routeLabel: "dfda.earth · Home",
      routePath: "/",
      routeUrl: null,
      productionUrl: "https://dfda.earth/",
      authState: "logged-out",
      siteApp: true,
      siteVariant: "dfda",
      variantLabel: "dfda.earth",
      changed: false,
      copyChanged: false,
      errored: false,
      statusLabel: "captured",
      markdownDiff: null,
      pairs: [],
    },
    {
      appId: "wishocracy",
      appLabel: "Wishocracy",
      captureKind: "app",
      routeName: "site-app-wishocracy-home",
      routeLabel: "wishocracy.org · Home",
      routePath: "/",
      routeUrl: null,
      authState: "logged-out",
      changed: false,
      copyChanged: false,
      errored: false,
      statusLabel: "captured",
      markdownDiff: null,
      pairs: [],
    },
    {
      appId: "trialabundancesurvey",
      appLabel: "Trial Abundance Survey",
      captureKind: "app",
      routeName: "site-app-trialabundancesurvey-home",
      routeLabel: "trialabundancesurvey.org · Home",
      routePath: "/",
      routeUrl: null,
      authState: "logged-out",
      changed: false,
      copyChanged: false,
      errored: false,
      statusLabel: "captured",
      markdownDiff: null,
      pairs: [],
    },
    {
      appId: "curedao",
      appLabel: "CureDAO",
      captureKind: "app",
      routeName: "site-app-curedao-home",
      routeLabel: "curedao.org · Home",
      routePath: "/",
      routeUrl: null,
      authState: "logged-out",
      changed: false,
      copyChanged: false,
      errored: false,
      statusLabel: "captured",
      markdownDiff: null,
      pairs: [],
    },
    {
      appId: "acceleratedmedicine",
      appLabel: "Accelerated Medicine",
      captureKind: "app",
      routeName: "site-app-acceleratedmedicine-home",
      routeLabel: "acceleratedmedicine.org · Home",
      routePath: "/",
      routeUrl: null,
      authState: "logged-out",
      changed: false,
      copyChanged: false,
      errored: false,
      statusLabel: "captured",
      markdownDiff: null,
      pairs: [],
    },
  ],
};

// ---------- render ----------
const html = renderReviewHtml(input);
const siteAppsHtml = renderReviewHtml(siteAppInput);
const coverageHtml = renderReviewHtml({
  ...input,
  summary: { ...input.summary, changedRoutes: 0 },
  coverage: {
    analysisAvailable: true,
    blockingIssues: [
      "apps/optimitron/src/app/tasks/[id]/page.tsx: no required visual state is registered for this changed UI source",
      '<script>alert("coverage")</script>: invalid capture state',
    ],
    changedUiFiles: ["apps/optimitron/src/app/tasks/[id]/page.tsx"],
    complete: false,
    coveredUiFiles: [],
  },
});

mkdirSync(outDir, { recursive: true });
writeFileSync(htmlPath, html, "utf8");
writeFileSync(siteAppsHtmlPath, siteAppsHtml, "utf8");
writeFileSync(coverageHtmlPath, coverageHtml, "utf8");

// ---------- assertions ----------
const failures = [];
function assert(cond, label) {
  if (!cond) failures.push(label);
}

assert(html.startsWith("<!doctype html>"), "starts with doctype");
assert(html.includes('<meta name="viewport"'), "has viewport meta");
assert(html.includes("PR #123 review"), "server-rendered header title");
assert(html.includes('id="review-data"'), "JSON island present");
assert(html.includes('id="noise"'), "noise select present");
assert(html.includes('id="export-btn"'), "export button present");
assert(html.includes('id="copy-review-btn"'), "copy PR comment button present");
assert(html.includes('class="header-tools"'), "mobile header menu present");
assert(
  html.includes('class: "route-tools"'),
  "mobile route controls menu present",
);
assert(html.includes('class: "verdict-more"'), "mobile note menu present");
assert(html.includes('id="shot-lightbox"'), "screenshot lightbox present");
assert(html.includes("Zoom after"), "screenshot zoom action present");
assert(
  html.includes("data-live-toggle"),
  "live-compare toggle keyword in client JS",
);
assert(html.includes("Copy context"), "context copy action present");
assert(html.includes("Open GitHub issue"), "complaint issue action present");
assert(
  html.includes("Originating PR: #"),
  "complaint payload preserves originating PR marker",
);
assert(
  !html.includes('<script>alert("xss")</script>'),
  "route label XSS not raw in HTML",
);
assert(
  !/<script>alert\(1\)<\/script>/.test(html),
  "copy-diff XSS not raw in HTML",
);
assert(html.includes("\\u003c"), "JSON island escapes < sequences");
assert(
  html.includes("1 screenshot difference"),
  "summary chip: screenshot differences",
);
assert(html.includes("1 baseline missing"), "summary chip: baseline missing");
assert(html.includes("1 copy-only"), "summary chip: copy-only");
assert(html.includes("4 routes"), "summary chip: total");
assert(siteAppsHtml.includes("7 apps"), "peer-app summary chip");
assert(
  !html.includes("Visual capture contract failed"),
  "complete review omits coverage failure",
);
assert(
  coverageHtml.includes("0 screenshot differences"),
  "coverage failure preserves screenshot-diff count",
);
assert(
  coverageHtml.includes("capture contract failed · 0/1 UI files"),
  "coverage failure chip",
);
assert(
  coverageHtml.includes("Visual capture contract failed"),
  "coverage failure heading",
);
assert(
  coverageHtml.includes("the visual-review check must fail"),
  "coverage failure explains the gate",
);
assert(
  coverageHtml.includes("apps/optimitron/src/app/tasks/[id]/page.tsx"),
  "coverage failure lists blocking UI file",
);
assert(
  !coverageHtml.includes('<script>alert("coverage")</script>'),
  "coverage file XSS not raw in HTML",
);

// ---------- extract inline JS and node --check it ----------
const scripts = [];
const re = /<script(?![^>]*application\/json)[^>]*>([\s\S]*?)<\/script>/g;
let m;
while ((m = re.exec(html)) !== null) scripts.push(m[1]);
assert(
  scripts.length === 1,
  "exactly one inline client <script> (got " + scripts.length + ")",
);

const clientJs = scripts.join("\n;\n");
writeFileSync(clientJsPath, clientJs, "utf8");

const check = spawnSync(process.execPath, ["--check", clientJsPath], {
  encoding: "utf8",
});
assert(
  check.status === 0,
  "node --check on extracted client JS: " + (check.stderr || "").trim(),
);

// JSON island round-trips
try {
  const island =
    /<script type="application\/json" id="review-data">([\s\S]*?)<\/script>/.exec(
      html,
    );
  const parsed = JSON.parse(island[1]);
  assert(parsed.routes.length === 4, "JSON island round-trips (routes)");
  assert(
    parsed.routes[0].pairs[0].hunks.length === 3,
    "JSON island round-trips (hunks)",
  );
  assert(
    parsed.routes[0].routeLabel === XSS,
    "JSON island preserves raw strings",
  );
} catch (err) {
  failures.push("JSON island parse failed: " + err.message);
}

// ---------- report ----------
const summary = {
  ok: failures.length === 0,
  htmlPath,
  siteAppsHtmlPath,
  coverageHtmlPath,
  htmlBytes: Buffer.byteLength(html, "utf8"),
  clientJsPath,
  clientJsBytes: Buffer.byteLength(clientJs, "utf8"),
  nodeCheckExit: check.status,
  failures,
};
console.log(JSON.stringify(summary, null, 2));
if (failures.length) process.exit(1);
