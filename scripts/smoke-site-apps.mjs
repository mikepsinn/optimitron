import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getSiteConfigForVariant,
  VARIANTS,
} from "../packages/site-kit/src/lib/site-config.ts";
import {
  forceAnimationsComplete,
  prepareFullPageVisualCapture,
  waitForFonts,
} from "../apps/optimitron/e2e/utils/visual-settle.mjs";
import { freezeClock } from "../apps/optimitron/e2e/helpers/freeze-clock.mjs";
import { signInViaApi } from "../apps/optimitron/e2e/utils/auth-api.mjs";
import { SITE_APP_VISUAL_CAPTURE_VERSION } from "../apps/optimitron/scripts/visual-capture-contract.mjs";
import { runCaptureLane } from "./capture-lane.mjs";
import { getSiteAppScreenshotRoutes } from "./site-app-visual-routes.mjs";

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
  ["courtofhumanity", 4017, VARIANTS.COURT_OF_HUMANITY],
];

const ROUTE_CAPTURE_TIMEOUT_MS = 120_000;
const MAX_LANE_RECYCLES = 3;

/** Raised when a capture exceeds its budget, so a lane knows it can retry. */
class CaptureBudgetExceededError extends Error {}

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

/**
 * A single route capture is a handful of bounded waits, but `page.evaluate`
 * has no timeout, so one wedged renderer stalls the lane forever. Without a
 * budget the job runs until the runner cancels it half an hour later, and the
 * log ends on "capturing <route>" with no error and no indication that the
 * route is the thing that stalled. Bound the whole capture so the failure
 * names the route it happened on.
 *
 * The budget is deliberately far above a healthy capture — the slowest routes
 * settle in a few seconds — so it only ever fires on a genuine stall.
 *
 * @template T
 * @param {string} captureLabel
 * @param {() => Promise<T>} capture
 * @returns {Promise<T>}
 */
async function withCaptureBudget(captureLabel, capture) {
  let timer;
  try {
    return await Promise.race([
      capture(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new CaptureBudgetExceededError(
                `Timed out after ${ROUTE_CAPTURE_TIMEOUT_MS}ms capturing ${captureLabel}. ` +
                  `The page stopped responding partway through capture.`,
              ),
            ),
          ROUTE_CAPTURE_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

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

async function assertWarOnDiseaseHome(page) {
  const bodyText = await page.locator("body").innerText();
  if (/bottom line/i.test(bodyText)) {
    throw new Error("War on Disease home still renders 'Bottom Line'");
  }
  if (/donate now/i.test(bodyText)) {
    throw new Error("War on Disease home still renders 'Donate Now'");
  }
  if (await page.locator('a[href="/soldiers"]').count()) {
    throw new Error("War on Disease navigation still links to Soldiers");
  }

  // The footer /donate link is hidden for now (SHOW_DONATE_LINKS in site-kit).
  if (await page.locator('footer a[href="/donate"]').count()) {
    throw new Error("War on Disease footer still links to /donate");
  }
  if (await page.locator('script[src*="promotion-bar.js"]').count()) {
    throw new Error("War on Disease still loads the floating promotion bar");
  }
}

async function verifyWarOnDiseaseHome(baseUrl) {
  const requireFromWeb = createRequire(
    path.join(repoRoot, "apps", "optimitron", "package.json"),
  );
  const { chromium } = requireFromWeb("@playwright/test");
  const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || "chrome",
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.goto(baseUrl, { timeout: 30_000, waitUntil: "load" });
    await assertWarOnDiseaseHome(page);
  } finally {
    await browser.close();
  }
}

async function captureScreenshots(appName, siteVariant, baseUrl) {
  if (!screenshotRoot) {
    return;
  }

  const screenshotRoutes = getSiteAppScreenshotRoutes(appName, siteVariant);
  const requireFromWeb = createRequire(
    path.join(repoRoot, "apps", "optimitron", "package.json"),
  );
  const { chromium } = requireFromWeb("@playwright/test");
  const manifestDirectory = path.resolve(screenshotRoot, "site-app-manifests");
  await mkdir(manifestDirectory, { recursive: true });
  await writeFile(
    path.join(manifestDirectory, `${appName}.json`),
    `${JSON.stringify(
      {
        version: 2,
        captureVersion: SITE_APP_VISUAL_CAPTURE_VERSION,
        appName,
        domain: getSiteConfigForVariant(siteVariant).domain,
        routes: screenshotRoutes,
      },
      null,
      2,
    )}\n`,
  );
  // A browser wears out. Something in it accumulates as pages are captured
  // until a `page.evaluate` stops returning, and `evaluate` has no timeout, so
  // the lane hangs instead of failing. Captured pixels, not captures, seem to
  // be what is spent: the narrow viewport renders pages several times taller
  // and exhausts a browser after a dozen or so routes, while the wide one gets
  // through all of them. Freezing `Date` without Playwright's clock bought
  // roughly nine times more headroom but did not remove the ceiling.
  //
  // So give each project its own browser and let a lane rebuild itself. When a
  // capture exceeds its budget the lane discards the browser, starts a fresh
  // one, and retries that route; a wedged browser is unusable afterwards, and
  // a new one starts with a full allowance. Recycles are capped so a genuinely
  // broken page still fails the run rather than looping.
  await Promise.all(
    screenshotProjects.map(async ([projectName, contextOptions]) => {
      const outputDirectory = path.resolve(screenshotRoot, projectName);
      await mkdir(outputDirectory, { recursive: true });
      const needsAuthentication = screenshotRoutes.some(
        ({ authenticated }) => authenticated,
      );

      async function openLane() {
        const browser = await chromium.launch({
          channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || "chrome",
          headless: true,
        });
        try {
          const loggedOutContext = await browser.newContext({
            ...contextOptions,
            baseURL: baseUrl,
          });
          const authenticatedContext = await browser.newContext({
            ...contextOptions,
            baseURL: baseUrl,
          });
          const loggedOutPage = await loggedOutContext.newPage();
          const authenticatedPage = await authenticatedContext.newPage();
          await Promise.all([
            freezeClock(loggedOutPage),
            freezeClock(authenticatedPage),
          ]);
          if (
            needsAuthentication &&
            !(await signInViaApi(authenticatedContext.request))
          ) {
            throw new Error(
              `@apps/${appName}: managed demo user could not sign in for authenticated screenshots`,
            );
          }
          return {
            authenticatedPage,
            close: () => browser.close().catch(() => {}),
            loggedOutPage,
          };
        } catch (error) {
          // Swallow the close failure so the error that caused the cleanup is
          // the one that surfaces; a browser that failed to open may well fail
          // to close too.
          await browser.close().catch(() => {});
          throw error;
        }
      }

      await runCaptureLane({
        routes: screenshotRoutes,
        openLane,
        isRecoverable: (error) => error instanceof CaptureBudgetExceededError,
        maxRecycles: MAX_LANE_RECYCLES,
        onRecycle: ({ routeName }, recycles) => {
          console.warn(
            `@apps/${appName}: ${projectName}/${routeName} stopped responding; ` +
              `restarting the browser and retrying it ` +
              `(recycle ${recycles} of ${MAX_LANE_RECYCLES})`,
          );
        },
        captureRoute: async (
          {
            authenticated,
            expectNotFound,
            routeName,
            routePath,
            captureSelector,
            openMenu,
          },
          lane,
        ) => {
          const page = authenticated
            ? lane.authenticatedPage
            : lane.loggedOutPage;
          const pageUrl = new URL(routePath, baseUrl);
          if (appName === "acceleratedmedicine" && routeName === "home") {
            pageUrl.searchParams.set("visual", "1");
          }
          const captureLabel = `${projectName}/${routeName}`;
          await withCaptureBudget(captureLabel, async () => {
            const url = pageUrl.toString();
            console.log(`@apps/${appName}: capturing ${captureLabel}`);
            const response = await page.goto(url, {
              timeout: 30_000,
              waitUntil: "load",
            });
            const status = response?.status() ?? 0;
            const statusIsExpected = expectNotFound
              ? status === 404
              : status >= 200 && status < 400;
            if (!response || !statusIsExpected) {
              throw new Error(
                `${url} returned HTTP ${response?.status() ?? "unknown"}${expectNotFound ? " (expected 404)" : ""}`,
              );
            }
            if (authenticated) {
              const expectedPath = pageUrl.pathname;
              const actualPath = new URL(page.url()).pathname;
              if (actualPath !== expectedPath) {
                throw new Error(
                  `${url} redirected to ${page.url()} instead of rendering its authenticated state`,
                );
              }
            }
            await page
              .waitForLoadState("networkidle", { timeout: 15_000 })
              .catch(() => {});
            await page.waitForSelector(".animate-pulse.bg-muted", {
              state: "detached",
              timeout: 15_000,
            });
            if (!(await waitForFonts(page))) {
              console.warn(
                `@apps/${appName}: font readiness timed out for ${captureLabel}`,
              );
            }
            await forceAnimationsComplete(page);
            await prepareFullPageVisualCapture(page);
            await forceAnimationsComplete(page);
            if (openMenu) {
              const menuTrigger = page.getByRole("button", {
                name: "Toggle menu",
              });
              await menuTrigger.click();
              const menuDialog = page.getByRole("dialog", {
                name: "Navigation Menu",
              });
              await menuDialog.waitFor({ state: "visible" });
              await menuDialog
                .getByRole("button", { name: "Log Out" })
                .waitFor({ state: "visible" });
              await forceAnimationsComplete(page);
            }
            const screenshotPath = path.join(
              outputDirectory,
              `site-app-${appName}-${routeName}.png`,
            );
            if (captureSelector) {
              const target = page.locator(captureSelector).first();
              await target.scrollIntoViewIfNeeded();
              await target.screenshot({
                animations: "disabled",
                path: screenshotPath,
              });
            } else {
              await page.screenshot({
                animations: "disabled",
                fullPage: true,
                path: screenshotPath,
              });
            }
            console.log(`@apps/${appName}: captured ${captureLabel}`);
          });
        },
      });
    }),
  );

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
      env: {
        ...process.env,
        PORT: String(port),
        ...(screenshotRoot ? { SITE_APP_VISUAL_FIXTURES: "1" } : {}),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  child.stdout.on("data", (chunk) => output.push(chunk.toString()));
  child.stderr.on("data", (chunk) => output.push(chunk.toString()));

  try {
    const baseUrl = `http://127.0.0.1:${port}/`;
    const status = await waitForHomePage(baseUrl, child, output);
    console.log(`@apps/${appName}: HTTP ${status}`);
    if (appName === "warondisease") {
      await verifyWarOnDiseaseHome(baseUrl);
    }
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
