/**
 * Auth-gated page → sign-in → back to the original page.
 *
 * Guards the regression where login drops `callbackUrl` and dumps the user on
 * home/dashboard/sign-in instead of the page that sent them to login.
 *
 * Requires: seeded demo credentials (`prisma db seed`).
 *
 * Run:
 *   pnpm --filter @optimitron/web exec playwright test e2e/auth-callback-roundtrip.spec.ts
 */
import { test, expect } from "@playwright/test";

const TARGET_PATH = "/dashboard?from=auth-callback-roundtrip";

test("auth-gated page -> demo login -> returns to the same callbackUrl", async ({
  page,
}) => {
  const response = await page.goto(TARGET_PATH);
  if ((response?.status() ?? 0) >= 500) {
    test.skip(true, "Needs database");
    return;
  }

  await page.waitForURL(/\/auth\/signin/, { timeout: 15_000 });

  const signInUrl = new URL(page.url());
  expect(signInUrl.pathname).toBe("/auth/signin");
  expect(signInUrl.searchParams.get("callbackUrl")).toBe(TARGET_PATH);

  const demoButton = page.locator("button:has-text('Try Demo')");
  await expect(demoButton).toBeVisible({ timeout: 10_000 });
  await demoButton.click();

  const authOutcome = await Promise.race([
    page
      .waitForURL(
        (url) =>
          url.pathname === "/dashboard" &&
          url.searchParams.get("from") === "auth-callback-roundtrip",
        { timeout: 15_000 },
      )
      .then(() => "returned" as const)
      .catch(() => "timeout" as const),
    page
      .getByText(/Demo account not available/i)
      .waitFor({ state: "visible", timeout: 15_000 })
      .then(() => "demo-missing" as const)
      .catch(() => "timeout" as const),
  ]);

  if (authOutcome === "demo-missing") {
    test.skip(true, "Demo credentials not available");
    return;
  }

  expect(authOutcome).toBe("returned");
  expect(page.url()).not.toMatch(/\/auth\/signin/);

  const landed = new URL(page.url());
  expect(landed.pathname).toBe("/dashboard");
  expect(landed.searchParams.get("from")).toBe("auth-callback-roundtrip");
});
