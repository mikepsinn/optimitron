/**
 * Landing page conversion funnel E2E tests.
 *
 * Tests the full flow: slider → vote → auth → share → evidence → prize reveal.
 *
 * Requires: seeded database (prisma db seed) for auth-dependent tests.
 *
 * Run:
 *   pnpm --filter @optimitron/web exec playwright test e2e/landing-funnel.spec.ts
 */
import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helper: complete the slider + submit flow
// ---------------------------------------------------------------------------

async function completeSlider(page: import("@playwright/test").Page) {
  // Wait for slider to be visible
  const slider = page.locator('input[type="range"]');
  await expect(slider).toBeVisible({ timeout: 15_000 });

  // Drag slider to 30% (military)
  await slider.fill("30");

  // Verify allocation display updated
  await expect(page.locator("text=30%").first()).toBeVisible();
  await expect(page.locator("text=70%").first()).toBeVisible();

  // Click SUBMIT
  const submitButton = page.locator("button:has-text('SUBMIT')");
  await expect(submitButton).toBeVisible({ timeout: 5_000 });
  await submitButton.click();
}

// ---------------------------------------------------------------------------
// Helper: complete the YES vote after slider submit
// ---------------------------------------------------------------------------

async function voteYes(page: import("@playwright/test").Page) {
  // Wait for reality check card to animate in
  const yesButton = page.locator("button:has-text('YES')");
  await expect(yesButton).toBeVisible({ timeout: 10_000 });
  await yesButton.click();
}

// ---------------------------------------------------------------------------
// Helper: sign in via credentials API (from voter-prize.spec.ts pattern)
// ---------------------------------------------------------------------------

async function signInViaApi(request: import("@playwright/test").APIRequestContext) {
  const csrfResponse = await request.get("/api/auth/csrf");
  if (csrfResponse.status() >= 500) return false;

  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const signInResponse = await request.post(
    "/api/auth/callback/credentials",
    {
      form: {
        email: "demo@thinkbynumbers.org",
        password: "demo1234",
        csrfToken,
        json: "true",
      },
    },
  );

  return signInResponse.status() < 400;
}

// ---------------------------------------------------------------------------
// 1. Slider → vote → auth card appears (unauthenticated)
// ---------------------------------------------------------------------------

test("vote page: slider -> vote -> auth card appears", async ({ page }) => {
  const response = await page.goto("/vote");
  if ((response?.status() ?? 0) >= 500) {
    test.skip(true, "Needs database");
    return;
  }
  await page.waitForLoadState("domcontentloaded");

  // Scroll to the vote section
  await page.locator("#vote").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Complete slider flow
  await completeSlider(page);

  // Wait for reality check + question
  await expect(
    page.locator("text=Should all nations").first(),
  ).toBeVisible({ timeout: 10_000 });

  // Vote YES
  await voteYes(page);

  // Auth card should appear (has "Verify" or "Sign In" text)
  await expect(
    page.locator("text=/verify|sign in/i").first(),
  ).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// 2. Vote persists in localStorage across navigation
// ---------------------------------------------------------------------------

test("vote page: vote persists in localStorage", async ({ page }) => {
  const response = await page.goto("/vote");
  if ((response?.status() ?? 0) >= 500) {
    test.skip(true, "Needs database");
    return;
  }
  await page.waitForLoadState("domcontentloaded");

  // Scroll to vote and complete flow
  await page.locator("#vote").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await completeSlider(page);
  await voteYes(page);

  // Verify localStorage has pending vote
  const pendingVote = await page.evaluate(() =>
    localStorage.getItem("pending_treaty_vote"),
  );
  expect(pendingVote).toBeTruthy();

  const parsed = JSON.parse(pendingVote!) as { answer: string };
  expect(parsed.answer).toBe("YES");

  // Navigate away
  await page.goto("/about");
  await page.waitForLoadState("domcontentloaded");

  // Navigate back
  await page.goto("/vote");
  await page.waitForLoadState("domcontentloaded");

  // Scroll to vote section — slider should NOT be visible (already voted)
  await page.locator("#vote").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);

  // The slider should be gone, reality check + vote should be showing
  const slider = page.locator('input[type="range"]');
  await expect(slider).not.toBeVisible({ timeout: 5_000 });
});

// ---------------------------------------------------------------------------
// 3. Authenticated user sees share card after voting
// ---------------------------------------------------------------------------

test("vote page: authenticated user reaches training after voting", async ({
  page,
  request,
}) => {
  // Sign in via API first
  const signedIn = await signInViaApi(request);
  if (!signedIn) {
    test.skip(true, "Auth API not available");
    return;
  }

  const response = await page.goto("/vote");
  if ((response?.status() ?? 0) >= 500) {
    test.skip(true, "Needs database");
    return;
  }
  await page.waitForLoadState("domcontentloaded");

  // Clear any existing localStorage vote state for a clean test
  await page.evaluate(() => localStorage.removeItem("pending_treaty_vote"));
  await page.reload();
  await page.waitForLoadState("domcontentloaded");

  // Complete vote flow
  await page.locator("#vote").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await completeSlider(page);
  await voteYes(page);

  await expect(page).toHaveURL(/\/dashboard(?:[?#]|$)/, {
    timeout: 15_000,
  });
});

// ---------------------------------------------------------------------------
// 4. VoteValueReveal shows parameter values
// ---------------------------------------------------------------------------

test("landing: VoteValueReveal shows parameter values", async ({ page }) => {
  const response = await page.goto("/");
  if ((response?.status() ?? 0) >= 500) {
    test.skip(true, "Needs database");
    return;
  }
  await page.waitForLoadState("domcontentloaded");

  // Scroll to VoteValueReveal — look for the heading
  const heading = page.locator("text=What Your Vote Could Be Worth").first();
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toBeVisible({ timeout: 10_000 });

  // Verify key parameter values are rendered (not hardcoded "100,000")
  // VOTE_TOKEN_POTENTIAL_VALUE is ~$193k, so look for "$" + large number
  const voteValue = page.locator("text=/\\$\\d{2,3}k|\\$\\d{3},\\d{3}/").first();
  await expect(voteValue).toBeVisible({ timeout: 5_000 });

  // Verify annual return is visible (from PRIZE_POOL_ANNUAL_RETURN ~17.4%)
  await expect(
    page.locator("text=/17\\.\\d%|Annual/").first(),
  ).toBeVisible({ timeout: 5_000 });

  // Verify "See the Full Math" CTA exists and links to /prize
  const mathCta = page.locator('a:has-text("See the Full Math")');
  await expect(mathCta).toBeVisible();
  await expect(mathCta).toHaveAttribute("href", "/prize");

  // Verify "Earn VOTE Points" CTA exists and links to #vote
  const earnCta = page.locator('a:has-text("Earn VOTE Points")');
  await expect(earnCta).toBeVisible();
  await expect(earnCta).toHaveAttribute("href", "#vote");
});

// ---------------------------------------------------------------------------
// 5. Vote flow captures referral code
// ---------------------------------------------------------------------------

test("landing: vote flow captures referral code from URL", async ({
  page,
}) => {
  const response = await page.goto("/vote?ref=testuser");
  if ((response?.status() ?? 0) >= 500) {
    test.skip(true, "Needs database");
    return;
  }
  await page.waitForLoadState("domcontentloaded");

  // Complete vote flow
  await page.locator("#vote").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await completeSlider(page);
  await voteYes(page);

  // Verify localStorage pendingVote has the referral code
  const pendingVote = await page.evaluate(() =>
    localStorage.getItem("pending_treaty_vote"),
  );
  expect(pendingVote).toBeTruthy();

  const parsed = JSON.parse(pendingVote!) as { referredBy: string | null };
  expect(parsed.referredBy).toBe("testuser");
});
