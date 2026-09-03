import { defineConfig } from "@playwright/test"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const suiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

export function createSurveyAuthConfig(appRoot: string, siteVariant: string) {
  const require = createRequire(path.join(appRoot, "package.json"))
  const baseURL = process.env.NEXTAUTH_URL || "http://127.0.0.1:3001"
  const database = new URL(process.env.DATABASE_URL || "postgresql://localhost/missing")
  const localHosts = ["localhost", "127.0.0.1", "[::1]"]
  if (
    !localHosts.includes(new URL(baseURL).hostname) ||
    !localHosts.includes(database.hostname) ||
    !/(^|[_-])test($|[_-])|auth_e2e/u.test(database.pathname.slice(1))
  ) {
    throw new Error("Auth E2E requires a loopback web server and a local test database.")
  }

  const outbox = path.join(appRoot, "output/playwright/auth/mail.jsonl")
  process.env.AUTH_E2E_OUTBOX = outbox
  process.env.AUTH_E2E_APP = path.basename(path.resolve(appRoot))
  const preload = pathToFileURL(path.join(suiteRoot, "tests/e2e/capture-email.mjs")).href
  const next = require.resolve("next/dist/bin/next")

  return defineConfig({
    testDir: path.join(suiteRoot, "tests/e2e"),
    testMatch: "auth-email.spec.ts",
    workers: 1,
    retries: 0,
    timeout: 60_000,
    expect: { timeout: 15_000 },
    reporter: "list",
    outputDir: path.join(appRoot, "output/playwright/auth/results"),
    projects: [
      { name: "desktop" },
      { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    ],
    use: {
      baseURL,
      channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || "chrome",
      viewport: { width: 1280, height: 720 },
      // Traces can contain single-use tokens and session cookies.
      trace: "off",
      video: "off",
      screenshot: "off",
    },
    webServer: {
      cwd: appRoot,
      command: `node --import "${preload}" "${next}" ${process.env.AUTH_E2E_DEV === "1" ? "dev" : "start"} --hostname 127.0.0.1 --port ${new URL(baseURL).port || "3001"}`,
      url: `${baseURL}/api/auth/providers`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        DATABASE_URL: process.env.DATABASE_URL!,
        NEXTAUTH_URL: baseURL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "local-auth-e2e-secret-not-for-production",
        NEXT_PUBLIC_SITE_VARIANT: siteVariant,
        RESEND_API_KEY: "re_auth_e2e_no_real_delivery",
        AUTH_E2E_OUTBOX: outbox,
      },
    },
  })
}
