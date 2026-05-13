import { defineConfig, devices, type ReporterDescription } from "@playwright/test";
import path from "path";

const screenshotDir = path.resolve(__dirname, "public/img/screenshots");
const outputDir = process.env.PLAYWRIGHT_OUTPUT_DIR
  ? path.resolve(process.env.PLAYWRIGHT_OUTPUT_DIR)
  : screenshotDir;
const isCI = Boolean(process.env.CI);
const enableArgosReporter = process.env.ARGOS_VISUAL === "1";
const reporter: "html" | ReporterDescription[] = enableArgosReporter
  ? [
      ["line"],
      ["html", { open: "never" }],
      [
        "@argos-ci/playwright/reporter",
        {
          buildName: "route-visuals",
          uploadToArgos: isCI,
          ignoreUploadFailures: process.env.ARGOS_IGNORE_UPLOAD_FAILURES === "1",
        },
      ],
    ]
  : isCI
    ? [["line"], ["html", { open: "never" }]]
    : "html";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // 2 retries in CI: the visual-regression suite has hit transient
  // `ECONNRESET` on `/api/auth/csrf` three times in one day (always on
  // `tasks-index-auth` — the first request after sign-in occasionally
  // drops the connection). Retries clear the flake without papering over
  // real failures — each retry uploads its own trace + screenshot.
  retries: isCI ? 2 : 0,
  workers: isCI ? 4 : 4,
  reporter,
  timeout: 120_000,
  snapshotPathTemplate: `${screenshotDir}/{testName}/{arg}{ext}`,
  outputDir,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1920, height: 1080 },
  },
  projects: [
    {
      name: "demo-recording",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
        video: {
          mode: "on",
          size: { width: 1920, height: 1080 },
        },
        // Use headed (full) Chromium for proper CSS rendering in recordings
        headless: false,
        channel: "chromium",
        deviceScaleFactor: 1,
        launchOptions: isCI
          ? undefined
          : {
              slowMo: 80,
            },
      },
    },
    {
      name: "default",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 14"],
      },
    },
    ...(enableArgosReporter
      ? [
          {
            name: "visual-mobile",
            use: {
              ...devices["Desktop Chrome"],
              viewport: { width: 390, height: 844 },
              deviceScaleFactor: 1,
              isMobile: true,
              hasTouch: true,
            },
          },
        ]
      : []),
  ],
  // Server lifecycle ownership:
  //   - Local runs via `pnpm e2e`: run-playwright.mjs probes 3001 first; if a
  //     dev server is responding it sets SKIP_SERVER=1 and Playwright stays out
  //     of the lifecycle entirely. The orchestrator (Claude / human dev) owns
  //     the dev server. Agents NEVER spawn their own — see CLAUDE.md "One dev
  //     server, always running on 3001" and .claude/codex-delegation.md.
  //   - CI runs: SKIP_SERVER is unset, so Playwright spawns its own `next
  //     start` against the production build and tears it down at end. This is
  //     the correct lifecycle in CI because there is no human orchestrator.
  //   - Defensive: `reuseExistingServer: true` makes Playwright probe 3001
  //     even when this block is active. If 3001 already responds, Playwright
  //     leaves it alone (per Playwright docs: "will re-use the existing
  //     server when available" and does NOT tear it down at end). So in the
  //     edge case where SKIP_SERVER is somehow unset locally, the dev server
  //     still survives.
  webServer: process.env.SKIP_SERVER
    ? undefined
    : {
        command: "npx next start --port 3001",
        port: 3001,
        reuseExistingServer: true,
        timeout: 30_000,
      },
});
