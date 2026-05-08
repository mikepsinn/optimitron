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
  retries: 0,
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
  webServer: process.env.SKIP_SERVER
    ? undefined
    : {
        command: "npx next start --port 3001",
        port: 3001,
        reuseExistingServer: true,
        timeout: 30_000,
      },
});
