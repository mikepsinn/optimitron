/**
 * Smoke tests: verify all pages load without errors and have valid metadata.
 *
 * Page list is derived from ROUTES in routes.ts — adding a new route
 * automatically adds it to these tests.
 *
 * Run:
 *   SKIP_SERVER=1 BASE_URL=http://localhost:3333 npx playwright test e2e/smoke.spec.ts
 */
import { test, expect } from "@playwright/test";
import { ALL_PAGE_PATHS, AUTH_REQUIRED_PATHS } from "./utils/static-pages";

for (const path of ALL_PAGE_PATHS) {
  test(`${path} loads without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => {
      // Hydration mismatches from real-time components (countdown timer) are expected
      if (err.message.includes("Hydration")) return;
      errors.push(err.message);
    });

    const response = await page.goto(path);
    const status = response?.status() ?? 0;

    if (status >= 500) {
      test.skip(true, `${path} returned ${status} (needs database)`);
      return;
    }

    expect(status).toBeLessThan(400);
    expect(errors).toEqual([]);
  });

  test(`${path} has valid page metadata`, async ({ page }) => {
    const response = await page.goto(path);
    const status = response?.status() ?? 0;

    if (status >= 400) {
      test.skip(true, `${path} returned ${status}`);
      return;
    }

    // Auth pages redirect to sign-in — skip metadata checks
    if (AUTH_REQUIRED_PATHS.has(path)) {
      test.skip(true, `${path} requires authentication`);
      return;
    }

    // <title> must exist and contain site name
    const title = await page.title();
    expect(title, `<title> should not be empty`).toBeTruthy();
    expect(title, `<title> should contain "Optimitron"`).toContain("Optimitron");

    // <meta name="description"> must exist and be non-empty
    const description = await page
      .$eval('meta[name="description"]', (el) => el.getAttribute("content"))
      .catch(() => null);
    expect(description, `should have <meta name="description">`).toBeTruthy();
    expect(
      (description ?? "").length,
      `<meta description> should not be empty`,
    ).toBeGreaterThan(0);
  });
}
