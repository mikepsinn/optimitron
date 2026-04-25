/**
 * Invite-token attribution: recipient path through the browser.
 *
 * Launch-blocker check. Verifies the URL → localStorage → vote-API plumbing
 * for `?invite=<token>` survives:
 *   1. The server-side redirect from `/vote/<code>` to `/?ref=&invite=#vote`.
 *   2. The landing-page mount effect that captures the token to localStorage.
 *   3. The auth roundtrip (localStorage is preserved across same-origin reloads).
 *   4. The vote POST body actually carrying `inviteToken` to `/api/referendums/<slug>/vote`.
 *   5. A real sender-created invitation converting when a different recipient
 *      account votes through the invite token.
 *
 * The first tests use a fake invite token to isolate browser plumbing. The
 * final test creates a fresh recipient account so the conversion path is
 * repeatable in local and CI databases.
 *
 * Requires: the seeded demo user (`prisma db seed`) and a running web server.
 *
 * Run:
 *   pnpm --filter @optimitron/web exec playwright test e2e/invite-token-attribution.spec.ts --project=default
 */
import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { DEMO_PASSWORD, signInUser, signInViaApi } from "./utils/auth";

const FAKE_INVITE_TOKEN = "pwtest_invite_token_abc123_attribution";
const REF_CODE = "DEMO";
const STORAGE_KEY = "signup_invite_token";
const RECIPIENT_PASSWORD = DEMO_PASSWORD;

interface InvitationApiRecord {
  convertedAt: string | null;
  id: string;
  inviteToken: string;
  recipientEmail: string | null;
  recipientName: string;
  status: string;
  taskId: string | null;
}

interface TestRecipient {
  email: string;
  name: string;
  password: string;
}

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

function makeUniqueRecipient(): TestRecipient {
  const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return {
    email: `pw-recipient-${nonce}@example.test`,
    name: `Playwright Recipient ${nonce}`,
    password: RECIPIENT_PASSWORD,
  };
}

async function createRecipientAccount(
  request: APIRequestContext,
  recipient: TestRecipient,
): Promise<boolean> {
  const response = await request.post("/api/auth/signup", {
    data: {
      email: recipient.email,
      name: recipient.name,
      newsletterSubscribed: false,
      password: recipient.password,
    },
  });

  if (response.status() >= 500) return false;
  expect(response.status()).toBe(201);
  return true;
}

async function createInvitationAsDemo(
  request: APIRequestContext,
  recipient: TestRecipient,
): Promise<InvitationApiRecord | null> {
  const signedIn = await signInViaApi(request);
  if (!signedIn) return null;

  const response = await request.post("/api/referral-invitations", {
    data: {
      contactMethod: "EMAIL",
      messageFormat: "TASK_NOTIFICATION",
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      referendumSlug: "one-percent-treaty",
    },
  });

  if (response.status() >= 500) return null;
  expect(response.status()).toBe(201);

  const payload = (await response.json()) as { invitation: InvitationApiRecord };
  return payload.invitation;
}

async function fetchInvitationById(
  request: APIRequestContext,
  invitationId: string,
): Promise<InvitationApiRecord> {
  const response = await request.get("/api/referral-invitations");
  expect(response.status()).toBe(200);

  const payload = (await response.json()) as { invitations?: InvitationApiRecord[] };
  const invitation = payload.invitations?.find((item) => item.id === invitationId);
  expect(invitation).toBeTruthy();
  return invitation!;
}

async function expectDashboardInvitationStatus(
  page: Page,
  recipientName: string,
  status: "Pending" | "Confirmed",
) {
  const row = page.locator("div.grid").filter({
    has: page.getByText(recipientName, { exact: true }),
  }).first();

  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row.getByText(status, { exact: true })).toBeVisible({ timeout: 15_000 });
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

    const signedIn = await signInViaApi(page.context().request);
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
    const signedIn = await signInViaApi(page.context().request);
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

  test("different recipient voting through invite token converts the invitation and dashboard row", async ({
    page,
    request,
  }) => {
    const recipient = makeUniqueRecipient();
    const invitation = await createInvitationAsDemo(request, recipient);
    if (!invitation) {
      test.skip(true, "Demo credentials or database not available");
      return;
    }

    expect(invitation.status).toBe("PENDING");
    expect(invitation.recipientEmail).toBe(recipient.email);
    expect(invitation.taskId).toBeTruthy();

    const pending = await fetchInvitationById(request, invitation.id);
    expect(pending.status).toBe("PENDING");

    const signedInAsDemoBeforeVote = await signInViaApi(page.context().request);
    if (!signedInAsDemoBeforeVote) {
      test.skip(true, "Demo credentials not available");
      return;
    }

    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText("Earth Optimization Tasks")).toBeVisible({ timeout: 15_000 });
    await expectDashboardInvitationStatus(page, recipient.name, "Pending");

    const recipientCreated = await createRecipientAccount(request, recipient);
    if (!recipientCreated) {
      test.skip(true, "Signup API/database not available");
      return;
    }

    const signedInAsRecipient = await signInUser(page, {
      email: recipient.email,
      password: recipient.password,
    });
    if (!signedInAsRecipient) {
      test.skip(true, "Recipient credentials not available");
      return;
    }

    // The redirect path is covered above; enter through the resolved landing URL
    // here so this test isolates the real conversion + dashboard update.
    const landingUrl =
      `/?ref=${encodeURIComponent(REF_CODE)}&invite=${encodeURIComponent(invitation.inviteToken)}#vote`;
    const response = await page.goto(landingUrl);
    if ((response?.status() ?? 0) >= 500) {
      test.skip(true, "Needs database");
      return;
    }
    await page.waitForLoadState("domcontentloaded");

    const landedUrl = new URL(page.url());
    expect(landedUrl.searchParams.get("invite")).toBe(invitation.inviteToken);

    await page.locator("#vote").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const voteResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/referendums/one-percent-treaty/vote") &&
        res.request().method() === "POST",
      { timeout: 30_000 },
    );

    await completeSliderAndVote(page);

    const voteResponse = await voteResponsePromise;
    expect(voteResponse.status()).toBe(200);
    const votePayload = (await voteResponse.json()) as {
      convertedReferralInvitation?: InvitationApiRecord | null;
    };
    expect(votePayload.convertedReferralInvitation).toMatchObject({
      id: invitation.id,
      status: "CONVERTED",
    });

    const converted = await fetchInvitationById(request, invitation.id);
    expect(converted.status).toBe("CONVERTED");
    expect(converted.convertedAt).toBeTruthy();

    const signedInAsDemo = await signInViaApi(page.context().request);
    if (!signedInAsDemo) {
      test.skip(true, "Demo credentials not available");
      return;
    }

    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText("Earth Optimization Tasks")).toBeVisible({ timeout: 15_000 });
    await expectDashboardInvitationStatus(page, recipient.name, "Confirmed");
  });
});
