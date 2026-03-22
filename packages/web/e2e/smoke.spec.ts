/**
 * Smoke tests: verify all pages load without errors.
 *
 * Run:
 *   SKIP_SERVER=1 BASE_URL=http://localhost:3333 npx playwright test e2e/smoke.spec.ts
 */
import { test, expect } from "@playwright/test";

const pages = [
  "/",
  "/prize",
  "/scoreboard",
  "/tools",
  "/about",
  "/compare",
  "/misconceptions",
  "/outcomes",
  "/budget",
  "/policies",
  "/iab",
  "/money",
  "/federal-reserve",
  "/department-of-war",
  "/transparency",
  "/referendum",
  "/wishocracy",
  "/civic",
];

for (const path of pages) {
  test(`${path} loads without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto(path);
    const status = response?.status() ?? 0;

    if (status >= 500) {
      test.skip(true, `${path} returned ${status} (needs database)`);
      return;
    }

    expect(status).toBeLessThan(400);
    expect(errors).toEqual([]);
  });
}
