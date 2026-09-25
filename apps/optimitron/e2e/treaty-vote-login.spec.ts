/**
 * Dashboard sign-out E2E. The treaty vote flow moved to warondisease.org
 * (apps/warondisease), so this app only owns the dashboard part.
 *
 * Requires: seeded database (prisma db seed) for the demo credentials path.
 *
 * Run:
 *   pnpm --filter @optimitron/web exec playwright test e2e/treaty-vote-login.spec.ts
 */
import { test, expect } from "@playwright/test";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./utils/auth";

test("signed-in user can sign out from the dashboard", async ({ page }) => {
  // Sign in via credentials API on the SAME context as `page` so the auth
  // cookie reaches the browser. The top-level `request` fixture lives in a
  // separate context whose cookies don't carry over to `page` navigations.
  const ctxRequest = page.context().request;
  const csrfResponse = await ctxRequest.get("/api/auth/csrf");
  if (csrfResponse.status() >= 500) {
    test.skip(true, "Auth API not available");
    return;
  }
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
  const signInResponse = await ctxRequest.post(
    "/api/auth/callback/credentials",
    {
      form: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        csrfToken,
        json: "true",
      },
    },
  );
  if (signInResponse.status() >= 400) {
    test.skip(true, "Demo credentials not available");
    return;
  }

  const response = await page.goto("/dashboard");
  if ((response?.status() ?? 0) >= 500) {
    test.skip(true, "Needs database");
    return;
  }
  await page.waitForLoadState("domcontentloaded");

  // Confirm we stayed on /dashboard (i.e. the jwt-callback regression is fixed).
  expect(page.url()).toMatch(/\/dashboard/);

  const menuTrigger = page.getByRole("button", { name: "Open menu" });
  await expect(menuTrigger).toBeVisible({ timeout: 10_000 });
  await menuTrigger.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  const signOutButton = dialog.getByRole("button", { name: /Sign Out/i });
  await expect(signOutButton).toBeVisible({ timeout: 10_000 });
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/", { timeout: 10_000 }),
    signOutButton.click(),
  ]);

  // Re-visiting /dashboard should now redirect to /auth/signin.
  await page.goto("/dashboard");
  await page.waitForURL(/\/auth\/signin/, { timeout: 10_000 });
  expect(page.url()).toMatch(/\/auth\/signin/);
});
