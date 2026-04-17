/**
 * Treaty vote → login → dashboard E2E.
 *
 * Regression guard for: unauthenticated user votes via the AuthForm embedded
 * in TreatyVoteFlow, signs in via demo credentials (callbackUrl=/dashboard),
 * and lands on /dashboard — NOT back on /auth/signin.
 *
 * Requires: seeded database (prisma db seed) for the demo credentials path.
 *
 * Run:
 *   pnpm --filter @optimitron/web exec playwright test e2e/treaty-vote-login.spec.ts
 */
import { test, expect, type Page } from "@playwright/test";

async function completeSliderAndVote(page: Page) {
  // Scope to #vote — the landing page has another range slider in a separate
  // "When You Ask People What They" section that would otherwise match.
  const voteSection = page.locator("#vote");
  const slider = voteSection.locator('input[type="range"]');
  await expect(slider).toBeVisible({ timeout: 15_000 });
  await slider.fill("30");

  const submit = voteSection.locator("button:has-text('SUBMIT')");
  await expect(submit).toBeVisible({ timeout: 5_000 });
  await submit.click();

  const yesButton = voteSection.locator("button:has-text('YES')");
  await expect(yesButton).toBeVisible({ timeout: 10_000 });
  await yesButton.click();
}

test("treaty vote → demo login → lands on /dashboard (not /auth/signin)", async ({
  page,
}) => {
  const response = await page.goto("/");
  if ((response?.status() ?? 0) >= 500) {
    test.skip(true, "Needs database");
    return;
  }
  await page.waitForLoadState("domcontentloaded");

  await page.locator("#vote").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  await completeSliderAndVote(page);

  // AuthForm renders the demo button in non-prod. Click it.
  const demoButton = page.locator(
    "button:has-text('Try Demo')",
  );
  await expect(demoButton).toBeVisible({ timeout: 10_000 });
  await demoButton.click();

  // Primary assertion: browser lands on /dashboard, not /auth/signin.
  // This is the bug the user reported: avatar set, but server session
  // missing user.id, so the dashboard bounced them back to login.
  await page.waitForURL(/\/dashboard(\?|$)/, { timeout: 15_000 });
  expect(page.url()).toMatch(/\/dashboard(\?|$)/);
  expect(page.url()).not.toMatch(/\/auth\/signin/);
});

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
        email: "demo@optimitron.org",
        password: "demo1234",
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

  // The main DashboardClient's "SIGN OUT" button is the one rendered on the
  // default host. The ReferendumSiteDashboardClient logout is covered by the
  // unit tests (its surface is only rendered on the treaty host, which needs
  // host-header manipulation unavailable in a generic Playwright run).
  const signOutButton = page.locator(
    "button:has-text('Sign Out'), button:has-text('SIGN OUT')",
  );
  await expect(signOutButton.first()).toBeVisible({ timeout: 10_000 });
  await signOutButton.first().click();

  await page.waitForURL(/\/$|\/(\?|$)/, { timeout: 10_000 });

  // Re-visiting /dashboard should now redirect to /auth/signin.
  await page.goto("/dashboard");
  await page.waitForURL(/\/auth\/signin/, { timeout: 10_000 });
  expect(page.url()).toMatch(/\/auth\/signin/);
});
