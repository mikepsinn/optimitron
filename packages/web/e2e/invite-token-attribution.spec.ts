/**
 * Invite-token attribution: recipient path through the browser.
 *
 * Launch-blocker check. Verifies the URL → localStorage → vote-API plumbing
 * for `?invite=<token>` survives:
 *   1. The server-side redirect from `/vote/<code>` to `/?ref=&invite=#vote`.
 *   2. The landing-page mount effect that captures the token to localStorage.
 *   3. The auth roundtrip (localStorage is preserved across same-origin reloads).
 *   4. The vote POST body actually carrying `inviteToken` to `/api/referendums/<slug>/vote`.
 *
 * Uses a fake invite token. The actual conversion logic
 * (`convertReferralInvitationForVote`) is exhaustively unit-tested in
 * `referral-invitations.server.test.ts`; what this spec uniquely exercises is
 * the cross-cutting browser plumbing that no unit test can catch.
 *
 * Requires: the seeded demo user (`prisma db seed`) and a running web server.
 *
 * Run:
 *   pnpm --filter @optimitron/web exec playwright test e2e/invite-token-attribution.spec.ts --project=default
 */
import { test, expect, type Page } from "@playwright/test";

const FAKE_INVITE_TOKEN = "pwtest_invite_token_abc123_attribution";
const REF_CODE = "DEMO";
const STORAGE_KEY = "signup_invite_token";

async function completeSliderAndVote(page: Page) {
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

async function signInAsDemo(page: Page): Promise<boolean> {
  const ctxRequest = page.context().request;
  const csrfResponse = await ctxRequest.get("/api/auth/csrf");
  if (csrfResponse.status() >= 500) return false;
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
  return signInResponse.status() < 400;
}

test.describe("invite-token attribution path", () => {
  test("/vote/<code>?invite=<token> redirect preserves both ref and invite", async ({ page }) => {
    const response = await page.goto(`/vote/${REF_CODE}?invite=${FAKE_INVITE_TOKEN}`);
    if ((response?.status() ?? 0) >= 500) {
      test.skip(true, "Needs database");
      return;
    }
    await page.waitForLoadState("domcontentloaded");

    const url = new URL(page.url());
    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("ref")).toBe(REF_CODE);
    expect(url.searchParams.get("invite")).toBe(FAKE_INVITE_TOKEN);
    expect(page.url()).toContain("#vote");
  });

  test("invite token from URL is captured in localStorage on landing-page mount", async ({ page }) => {
    const response = await page.goto(`/?invite=${FAKE_INVITE_TOKEN}#vote`);
    if ((response?.status() ?? 0) >= 500) {
      test.skip(true, "Needs database");
      return;
    }
    await page.waitForLoadState("domcontentloaded");

    await page.waitForFunction(
      (key: string) => window.localStorage.getItem(key) !== null,
      STORAGE_KEY,
      { timeout: 10_000 },
    );

    const stored = await page.evaluate(
      (key: string) => window.localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(stored).toBe(FAKE_INVITE_TOKEN);
  });

  test("invite token persists in localStorage across an auth roundtrip", async ({ page }) => {
    const response = await page.goto(`/?invite=${FAKE_INVITE_TOKEN}#vote`);
    if ((response?.status() ?? 0) >= 500) {
      test.skip(true, "Needs database");
      return;
    }
    await page.waitForLoadState("domcontentloaded");

    // Wait for the mount effect to populate localStorage.
    await page.waitForFunction(
      (key: string) => window.localStorage.getItem(key) !== null,
      STORAGE_KEY,
      { timeout: 10_000 },
    );

    const signedIn = await signInAsDemo(page);
    if (!signedIn) {
      test.skip(true, "Demo credentials not available");
      return;
    }

    // Reload after auth — same origin, so localStorage survives.
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    const stillStored = await page.evaluate(
      (key: string) => window.localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(stillStored).toBe(FAKE_INVITE_TOKEN);
  });

  test("vote POST body carries inviteToken end-to-end", async ({ page }) => {
    // Pre-authenticate first so we land on the vote flow as a signed-in user.
    const goCheck = await page.goto("/");
    if ((goCheck?.status() ?? 0) >= 500) {
      test.skip(true, "Needs database");
      return;
    }
    const signedIn = await signInAsDemo(page);
    if (!signedIn) {
      test.skip(true, "Demo credentials not available");
      return;
    }

    // Visit the landing page WITH ?invite= so the mount effect captures it.
    await page.goto(`/?invite=${FAKE_INVITE_TOKEN}#vote`);
    await page.waitForLoadState("domcontentloaded");

    await page.waitForFunction(
      (key: string) => window.localStorage.getItem(key) !== null,
      STORAGE_KEY,
      { timeout: 10_000 },
    );

    await page.locator("#vote").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const voteRequestPromise = page.waitForRequest(
      (req) => req.url().includes("/api/referendums/") && req.method() === "POST",
      { timeout: 30_000 },
    );

    await completeSliderAndVote(page);

    const voteRequest = await voteRequestPromise;
    const body = JSON.parse(voteRequest.postData() ?? "{}") as Record<string, unknown>;
    expect(body.inviteToken).toBe(FAKE_INVITE_TOKEN);
    // ref may be present (from earlier visits via /vote/<code>) but is not
    // required for this test — the named-invite path uses inviteToken directly.
  });
});
