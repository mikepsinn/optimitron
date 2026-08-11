/**
 * copy-snapshot-site-apps.ts
 *
 * Renders every navigable route of the split `apps/*` sites to markdown so
 * page copy is reviewable and diffable without opening a browser.
 *
 * `packages/web` has had this since copy review started (`copy:preview` ->
 * `page.logged-out.md`). The apps/ sites had screenshots only, so copy drift
 * in shared site-kit components landed unreviewed.
 *
 * Output: apps/<app>/app/<route>/page.logged-out.md
 *   /            -> apps/<app>/app/page.logged-out.md
 *   /about       -> apps/<app>/app/about/page.logged-out.md
 *
 * Usage:
 *   pnpm copy:apps                          # every app
 *   pnpm copy:apps acceleratedmedicine      # one app
 *   pnpm copy:apps warondisease --routes=/,/about
 */
import "./lib/load-root-env";

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import {
  getInternalNavigationRoutesForVariant,
  getSiteConfigForVariant,
  VARIANTS,
} from "../packages/site-kit/src/lib/site-config";
import { buildCopyPreviewMarkdown } from "../packages/web/src/lib/copy-preview-markdown";
import { extractVisibleCopyMarkdown } from "./lib/copy-preview-dom";

const repoRoot = path.resolve(__dirname, "..");

/** [appDirectory, devPort, siteVariant] — ports match each app's `dev` script. */
const APPS = [
  ["warondisease", 3010, VARIANTS.WAR_ON_DISEASE],
  ["dfda", 3011, VARIANTS.DFDA],
  ["wishocracy", 3013, VARIANTS.WISHOCRACY],
  ["trialabundancesurvey", 3014, VARIANTS.SURVEY],
  ["curedao", 3015, VARIANTS.CUREDAO],
  ["acceleratedmedicine", 3016, VARIANTS.ACCELERATED_MEDICINE],
];

const args = process.argv.slice(2);
const routeFilter = args
  .find((arg) => arg.startsWith("--routes="))
  ?.slice("--routes=".length)
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);
const requestedApps = args.filter((arg) => !arg.startsWith("--"));
const unknownApps = requestedApps.filter(
  (requested) => !APPS.some(([appName]) => appName === requested),
);
if (unknownApps.length > 0) {
  throw new Error(`Unknown site app(s): ${unknownApps.join(", ")}`);
}
const selectedApps =
  requestedApps.length > 0
    ? APPS.filter(([appName]) => requestedApps.includes(appName))
    : APPS;

function routeToOutputPath(appName, routePath) {
  const segments = routePath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  return path.join(
    repoRoot,
    "apps",
    appName,
    "app",
    ...segments,
    "page.logged-out.md",
  );
}

async function waitForServer(url, child, output) {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(
        `Dev server exited with code ${child.exitCode} / signal ${child.signalCode}.\n${output.join("")}`,
      );
    }
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status >= 200 && response.status < 400) return;
      throw new Error(`Received HTTP ${response.status}`);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`Timed out waiting for ${url}.\n${output.join("")}`);
}

async function headAttribute(page, selector, attribute) {
  return page
    .locator(selector)
    .first()
    .getAttribute(attribute)
    .catch(() => null);
}

async function extractMetadata(page) {
  const title = (await page.title()).replace(/\s+/g, " ").trim();
  return {
    canonical: await headAttribute(page, 'link[rel="canonical"]', "href"),
    description: await headAttribute(
      page,
      'meta[name="description"]',
      "content",
    ),
    openGraphDescription: await headAttribute(
      page,
      'meta[property="og:description"]',
      "content",
    ),
    openGraphImage: await headAttribute(
      page,
      'meta[property="og:image"]',
      "content",
    ),
    openGraphTitle: await headAttribute(
      page,
      'meta[property="og:title"]',
      "content",
    ),
    title: title.length > 0 ? title : null,
    twitterDescription: await headAttribute(
      page,
      'meta[name="twitter:description"]',
      "content",
    ),
    twitterTitle: await headAttribute(
      page,
      'meta[name="twitter:title"]',
      "content",
    ),
  };
}

async function snapshotApp(appName, port, siteVariant) {
  const appDirectory = path.join(repoRoot, "apps", appName);
  const routes = getInternalNavigationRoutesForVariant(siteVariant)
    .map(({ path: routePath }) => routePath)
    .filter((routePath) => !routeFilter || routeFilter.includes(routePath));
  if (routes.length === 0) {
    console.log(`@apps/${appName}: no matching routes, skipped`);
    return;
  }

  const output = [];
  const nextCli = path.join(
    appDirectory,
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  );
  const child = spawn(
    process.execPath,
    [nextCli, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: appDirectory,
      env: {
        ...process.env,
        // Canonical/OG URLs come from NEXT_PUBLIC_BASE_URL (see site-kit
        // lib/url.ts). Pin it to the variant's production origin or the
        // snapshot bakes in whatever NEXTAUTH_URL the local .env happens to
        // hold, and the committed baseline differs per machine.
        NEXT_PUBLIC_BASE_URL: getSiteConfigForVariant(siteVariant).baseUrl,
        NEXT_PUBLIC_SITE_VARIANT: siteVariant,
        PORT: String(port),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout.on("data", (chunk) => output.push(chunk.toString()));
  child.stderr.on("data", (chunk) => output.push(chunk.toString()));

  const baseUrl = `http://127.0.0.1:${port}`;
  const requireFromWeb = createRequire(
    path.join(repoRoot, "packages", "web", "package.json"),
  );
  const { chromium } = requireFromWeb("@playwright/test");
  let browser;

  try {
    await waitForServer(`${baseUrl}/`, child, output);
    browser = await chromium.launch({
      channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || "chrome",
      headless: true,
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    for (const routePath of routes) {
      // Dev-mode first hit compiles the route, so allow a generous timeout and
      // one retry before treating a route as broken.
      let status = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await page.goto(`${baseUrl}${routePath}`, {
            timeout: 120_000,
            waitUntil: "load",
          });
          status = response?.status() ?? null;
          break;
        } catch (error) {
          if (attempt === 1) throw error;
          await page.waitForTimeout(2000);
        }
      }
      await page
        .waitForLoadState("networkidle", { timeout: 20_000 })
        .catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);

      const metadata = await extractMetadata(page);
      // A 5xx or a page with no metadata at all is a broken render. Writing a
      // snapshot from it would replace real copy with "[missing]" placeholders.
      if (
        (status !== null && status >= 500) ||
        (!metadata.title && !metadata.description && !metadata.openGraphTitle)
      ) {
        throw new Error(
          `${appName}${routePath}: broken render (HTTP ${status ?? "?"}) — snapshot NOT written.`,
        );
      }
      const bodyMarkdown = await page.evaluate(extractVisibleCopyMarkdown);
      const outputPath = routeToOutputPath(appName, routePath);
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(
        outputPath,
        buildCopyPreviewMarkdown({
          bodyMarkdown,
          metadata,
          route: routePath,
        }),
        "utf8",
      );
      console.log(`  ${routePath} -> ${path.relative(repoRoot, outputPath)}`);
    }

    await context.close();
    console.log(`@apps/${appName}: wrote ${routes.length} copy snapshots`);
  } finally {
    await browser?.close();
    child.kill("SIGTERM");
    const stopped = await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
    ]);
    if (stopped === false) child.kill("SIGKILL");
  }
}

// CJS entry (repo root has no "type": "module"), so no top-level await.
async function main() {
  for (const [appName, port, siteVariant] of selectedApps) {
    await snapshotApp(appName, port, siteVariant);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
