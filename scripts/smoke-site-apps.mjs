import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const apps = [
  ["warondisease", 4010],
  ["dfda", 4011],
  ["wishocracy", 4013],
  ["trialabundancesurvey", 4014],
  ["curedao", 4015],
  ["acceleratedmedicine", 4016],
];

const screenshotRoutes = [
  ["home", "/"],
  ["about", "/about"],
  ["faq", "/faq"],
  ["contact", "/contact"],
  ["terms", "/terms"],
  ["privacy", "/privacy"],
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

const screenshotRoot = process.env.SITE_APP_SCREENSHOT_ROOT?.trim();

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

async function captureScreenshots(appName, baseUrl) {
  if (!screenshotRoot) {
    return;
  }

  const requireFromWeb = createRequire(
    path.resolve("packages", "web", "package.json"),
  );
  const { chromium } = requireFromWeb("@playwright/test");
  const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || "chrome",
    headless: true,
  });

  try {
    for (const [projectName, contextOptions] of screenshotProjects) {
      const outputDirectory = path.resolve(screenshotRoot, projectName);
      await mkdir(outputDirectory, { recursive: true });
      const context = await browser.newContext(contextOptions);
      const page = await context.newPage();

      try {
        for (const [routeName, routePath] of screenshotRoutes) {
          const url = new URL(routePath, baseUrl).toString();
          const response = await page.goto(url, {
            timeout: 30_000,
            waitUntil: "load",
          });
          if (!response || response.status() >= 400) {
            throw new Error(
              `${url} returned HTTP ${response?.status() ?? "unknown"}`,
            );
          }
          await page.evaluate(() => document.fonts.ready);
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
    }
  } finally {
    await browser.close();
  }

  console.log(
    `@apps/${appName}: captured ${screenshotRoutes.length * screenshotProjects.length} screenshots`,
  );
}

async function smokeApp(appName, port) {
  const output = [];
  const appDirectory = path.resolve("apps", appName);
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
    await captureScreenshots(appName, baseUrl);
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

for (const [appName, port] of selectedApps) {
  await smokeApp(appName, port);
}
