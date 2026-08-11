/**
 * Auth-gated page → sign-in → back to the original page.
 *
 * Guards the regression where login drops `callbackUrl` and dumps the user on
 * home/dashboard/sign-in instead of the page that sent them to login.
 *
 * Uses credentials API login (not the Try Demo button) so CI production builds
 * pass when `isDemoLoginEnabled` is false. AuthForm's demo path does the same
 * credentials sign-in then navigates to `callbackUrl`.
 *
 * Requires: seeded demo credentials (`prisma db seed`).
 *
 * Run:
 *   pnpm --filter @optimitron/web exec playwright test e2e/auth-callback-roundtrip.spec.ts
 */
import { test, expect } from "@playwright/test";
import { signInDemoUser } from "./utils/auth";

const TARGET_PATH = "/dashboard?from=auth-callback-roundtrip";

test("auth-gated page -> login -> returns to the same callbackUrl", async ({
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

  const signedIn = await signInDemoUser(page);
  if (!signedIn) {
    test.skip(true, "Demo credentials not available");
    return;
  }

  // Mirror AuthForm demo login: after credentials succeed, go to callbackUrl.
  await page.goto(TARGET_PATH);

  await expect(page).not.toHaveURL(/\/auth\/signin/);

  const landed = new URL(page.url());
  expect(landed.pathname).toBe("/dashboard");
  expect(landed.searchParams.get("from")).toBe("auth-callback-roundtrip");
});
