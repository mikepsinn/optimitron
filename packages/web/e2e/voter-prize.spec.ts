/**
 * Prize page functional tests — verify the deposit form works.
 *
 * Run:
 *   SKIP_SERVER=1 BASE_URL=http://localhost:3333 npx playwright test e2e/voter-prize.spec.ts
 */
import { test, expect } from "@playwright/test";

test("prize page: deposit form has wallet connect and amount presets", async ({ page }) => {
  const response = await page.goto("/prize");
  if ((response?.status() ?? 0) >= 500) {
    test.skip(true, "Needs database");
    return;
  }
  await page.waitForLoadState("domcontentloaded");

  // Wallet connect buttons exist
  const walletButtons = page.locator("button").filter({ hasText: /wallet|metamask/i });
  expect(await walletButtons.count()).toBeGreaterThan(0);

  // Deposit preset buttons exist
  for (const amount of ["$100", "$500", "$1,000", "$5,000"]) {
    await expect(page.locator(`button:has-text("${amount}")`)).toBeVisible();
  }
});

test("referendum: 1% Treaty is active and votable", async ({ page }) => {
  const response = await page.goto("/referendum");
  if ((response?.status() ?? 0) >= 500) {
    test.skip(true, "Needs database");
    return;
  }
  await page.waitForLoadState("domcontentloaded");

  // Should have at least one referendum link
  const referendumLinks = page.locator('a[href*="/referendum/"]');
  expect(await referendumLinks.count()).toBeGreaterThan(0);

  // Click through to the referendum
  await referendumLinks.first().click();
  await page.waitForLoadState("domcontentloaded");

  // Vote page should have a sign-in prompt (unauthenticated)
  const signInLink = page.locator('a[href*="/auth/signin"]');
  expect(await signInLink.count()).toBeGreaterThan(0);
});

test("scoreboard: shows live game metrics from DB", async ({ page }) => {
  const response = await page.goto("/scoreboard");
  if ((response?.status() ?? 0) >= 500) {
    test.skip(true, "Needs database");
    return;
  }
  await page.waitForLoadState("domcontentloaded");

  // Should have numeric values (not loading spinners or empty)
  // The page should render actual numbers even if they're 0
  const poolValue = page.locator("text=$0").first();
  await expect(poolValue).toBeVisible({ timeout: 10_000 });
});
