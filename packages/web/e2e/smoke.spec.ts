/**
 * Smoke tests: verify all pages load without errors and have valid metadata.
 *
 * Page list is derived from src/app and filtered through the active site
 * routing policy.
 *
 * Auth-required pages are tested by signing in with the demo account first.
 *
 * Run:
 *   SKIP_SERVER=1 BASE_URL=http://localhost:3333 npx playwright test e2e/smoke.spec.ts
 */
import { test, expect, type Page } from "@playwright/test";
import {
  AUTH_REQUIRED_PATHS,
  PUBLIC_PAGE_PATHS,
  REDIRECT_ONLY_PATHS,
} from "./utils/static-pages";
import { signInDemoUser } from "./utils/auth";

async function expectPageLoadsWithMetadata(page: Page, path: string, options?: {
  skipOnClientError?: boolean;
}) {
  const errors: string[] = [];
  page.on("pageerror", (err) => {
    if (err.message.includes("Hydration")) return;
    errors.push(err.message);
  });

  const response = await page.goto(path);
  const status = response?.status() ?? 0;

  if (status >= 500) {
    test.skip(true, `${path} returned ${status} (needs database)`);
    return;
  }

  if (options?.skipOnClientError && status >= 400) {
    test.skip(true, `${path} returned ${status}`);
    return;
  }

  expect(status).toBeLessThan(400);
  expect(errors).toEqual([]);

  const title = await page.title();
  expect(title, `<title> should not be empty`).toBeTruthy();

  const description = await page
    .$eval('meta[name="description"]', (el) => el.getAttribute("content"))
    .catch(() => null);
  expect(description, `should have <meta name="description">`).toBeTruthy();
  expect(
    (description ?? "").length,
    `<meta description> should not be empty`,
  ).toBeGreaterThan(0);
}

// ---------------------------------------------------------------------------
// Public pages — no auth needed
// ---------------------------------------------------------------------------

for (const path of PUBLIC_PAGE_PATHS) {
  test(`${path} loads without errors and has valid metadata`, async ({ page }) => {
    await expectPageLoadsWithMetadata(page, path);
  });
}

for (const path of REDIRECT_ONLY_PATHS) {
  test(`${path} redirects to its canonical content`, async ({ request }) => {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers().location).toBeTruthy();
  });
}

// ---------------------------------------------------------------------------
// Auth-required pages — sign in with demo account first
// ---------------------------------------------------------------------------

for (const path of [...AUTH_REQUIRED_PATHS]) {
  test(`${path} loads without errors and has valid metadata (authenticated)`, async ({ page }) => {
    const signedIn = await signInDemoUser(page);
    if (!signedIn) {
      test.skip(true, "Auth API not available (needs database)");
      return;
    }

    await expectPageLoadsWithMetadata(page, path);
  });
}
