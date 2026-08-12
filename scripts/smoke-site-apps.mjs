import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getInternalNavigationRoutesForVariant,
  getSiteConfigForVariant,
  VARIANTS,
} from "../packages/site-kit/src/lib/site-config.ts";
import {
  forceAnimationsComplete,
  prepareFullPageVisualCapture,
} from "../packages/web/e2e/utils/visual-settle.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const apps = [
  ["warondisease", 4010, VARIANTS.WAR_ON_DISEASE],
  ["dfda", 4011, VARIANTS.DFDA],
  ["wishocracy", 4013, VARIANTS.WISHOCRACY],
  ["trialabundancesurvey", 4014, VARIANTS.SURVEY],
  ["curedao", 4015, VARIANTS.CUREDAO],
  ["acceleratedmedicine", 4016, VARIANTS.ACCELERATED_MEDICINE],
];

const screenshotProjects = [
  ["default", { viewport: { width: 1440, height: 900 } }],
  [
    "visual-mobile",
    {
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 844 },
    },
  ],
];

const screenshotRootInput = process.env.SITE_APP_SCREENSHOT_ROOT?.trim();
const screenshotRoot = screenshotRootInput
  ? path.resolve(repoRoot, screenshotRootInput)
  : undefined;

const requestedApps = process.argv.slice(2);
const unknownApps = requestedApps.filter(
  (requestedApp) => !apps.some(([appName]) => appName === requestedApp),
);

if (unknownApps.length > 0) {
  throw new Error(`Unknown site app(s): ${unknownApps.join(", ")}`);
}

const selectedApps =
  requestedApps.length > 0
    ? apps.filter(([appName]) => requestedApps.includes(appName))
    : apps;

async function waitForHomePage(url, child, output) {
  const deadline = Date.now() + 45_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(
        `Server exited with code ${child.exitCode} and signal ${child.signalCode}.\n${output.join("")}`,
      );
    }

    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status >= 200 && response.status < 400) {
        return response.status;
      }
      throw new Error(`Received HTTP ${response.status}`);
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (Date.now() >= deadline) {
        throw new Error(`${error.message}\n${output.join("")}`);
      }
    }
  }

  throw new Error(`Timed out waiting for ${url}.\n${output.join("")}`);
}

function getScreenshotRoutes(siteVariant) {
  const routes = getInternalNavigationRoutesForVariant(siteVariant).map(
    ({ label, path: routePath }) => ({
      label,
      routeName:
        routePath === "/"
          ? "home"
          : routePath
              .replace(/^\/+|\/+$/g, "")
              .replaceAll("/", "-")
              .replace(/[^a-z0-9-]+/gi, "-")
              .toLowerCase(),
      routePath,
    }),
  );

  if (siteVariant === VARIANTS.WAR_ON_DISEASE) {
    routes.push({
      label: "Shared campaign plan",
      routeName: "the-plan",
      routePath: "/the-plan",
    });
  }

  if (siteVariant === VARIANTS.ACCELERATED_MEDICINE) {
    routes.push({
      label: "Legacy About redirect",
      routeName: "about-redirect",
      routePath: "/about",
    });
  }

  if (siteVariant === VARIANTS.SURVEY) {
    routes.push({
      label: "Partner embed",
      routeName: "embed",
      routePath: "/embed?embed=1&visual=1",
    });
  }

  return routes;
}

async function captureScreenshots(appName, siteVariant, baseUrl) {
  if (!screenshotRoot) {
    return;
  }

  const screenshotRoutes = getScreenshotRoutes(siteVariant);
  const requireFromWeb = createRequire(
    path.join(repoRoot, "packages", "web", "package.json"),
  );
  const { chromium } = requireFromWeb("@playwright/test");
  const manifestDirectory = path.resolve(screenshotRoot, "site-app-manifests");
  await mkdir(manifestDirectory, { recursive: true });
  await writeFile(
    path.join(manifestDirectory, `${appName}.json`),
    `${JSON.stringify(
      {
        version: 1,
        appName,
        domain: getSiteConfigForVariant(siteVariant).domain,
        routes: screenshotRoutes,
      },
      null,
      2,
    )}\n`,
  );
  const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || "chrome",
    headless: true,
  });

  try {
    await Promise.all(
      screenshotProjects.map(async ([projectName, contextOptions]) => {
        const outputDirectory = path.resolve(screenshotRoot, projectName);
        await mkdir(outputDirectory, { recursive: true });
        const context = await browser.newContext(contextOptions);
        const page = await context.newPage();

        try {
          for (const { routeName, routePath } of screenshotRoutes) {
            const pageUrl = new URL(routePath, baseUrl);
            if (appName === "acceleratedmedicine" && routeName === "home") {
              pageUrl.searchParams.set("visual", "1");
            }
            const url = pageUrl.toString();
            const response = await page.goto(url, {
              timeout: 30_000,
              waitUntil: "load",
            });
            if (!response || response.status() >= 400) {
              throw new Error(
                `${url} returned HTTP ${response?.status() ?? "unknown"}`,
              );
            }
            await page
              .waitForLoadState("networkidle", { timeout: 15_000 })
              .catch(() => {});
            await page.waitForSelector(".animate-pulse.bg-muted", {
              state: "detached",
              timeout: 15_000,
            });
            await page.evaluate(() => document.fonts.ready);
            await forceAnimationsComplete(page);
            await prepareFullPageVisualCapture(page);
            await forceAnimationsComplete(page);
            await page.screenshot({
              animations: "disabled",
              fullPage: true,
              path: path.join(
                outputDirectory,
                `site-app-${appName}-${routeName}.png`,
              ),
            });
          }
        } finally {
          await context.close();
        }
      }),
    );
  } finally {
    await browser.close();
  }

  console.log(
    `@apps/${appName}: captured ${screenshotRoutes.length * screenshotProjects.length} screenshots`,
  );
}

async function smokeApp(appName, port, siteVariant) {
  const output = [];
  const appDirectory = path.join(repoRoot, "apps", appName);
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
    [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: appDirectory,
      env: { ...process.env, PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  child.stdout.on("data", (chunk) => output.push(chunk.toString()));
  child.stderr.on("data", (chunk) => output.push(chunk.toString()));

  try {
    const baseUrl = `http://127.0.0.1:${port}/`;
    const status = await waitForHomePage(baseUrl, child, output);
    console.log(`@apps/${appName}: HTTP ${status}`);
    await captureScreenshots(appName, siteVariant, baseUrl);
  } finally {
    child.kill("SIGTERM");
    const stopped = await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
    ]);
    if (stopped === false) {
      child.kill("SIGKILL");
    }
  }
}

for (const [appName, port, siteVariant] of selectedApps) {
  await smokeApp(appName, port, siteVariant);
}
