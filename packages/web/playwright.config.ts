import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "html",
  timeout: 120_000,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3001",
    trace: "on-first-retry",
    video: "on",
    viewport: { width: 1920, height: 1080 },
    launchOptions: {
      slowMo: 100,
    },
  },
  projects: [
    {
      name: "demo-recording",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.SKIP_SERVER
    ? undefined
    : {
        // Use `next start` with pre-built output (run `pnpm build` first)
        // This avoids database dependency issues with dev mode
        command: "npx next start --port 3001",
        port: 3001,
        reuseExistingServer: true,
        timeout: 30_000,
      },
});
