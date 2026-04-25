/**
 * Emailed referral invitation: /send composer -> mocked provider send.
 *
 * Uses RESEND_MOCK_SEND=1 so the browser path is deterministic and does not
 * depend on a live Resend key.
 *
 * Run:
 *   RESEND_MOCK_SEND=1 pnpm --filter @optimitron/web exec playwright test e2e/email-invite.spec.ts --project=default --reporter=list
 */
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { DEMO_PASSWORD, signInUser } from "./utils/auth";

interface TestUser {
  email: string;
  name: string;
  password: string;
}

interface InvitationApiRecord {
  id: string;
  recipientEmail: string | null;
  recipientEmailProviderMessageId: string | null;
  recipientEmailStep: number;
  recipientName: string;
  sentAt: string | null;
  shareAttemptId: string | null;
  status: string;
  taskId: string | null;
}

function makeUniqueUser(): TestUser {
  const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return {
    email: `pw-email-invite-${nonce}@example.test`,
    name: `Email Invite Sender ${nonce}`,
    password: DEMO_PASSWORD,
  };
}

async function createUserAccount(
  request: APIRequestContext,
  user: TestUser,
): Promise<boolean> {
  const response = await request.post("/api/auth/signup", {
    data: {
      email: user.email,
      name: user.name,
      newsletterSubscribed: false,
      password: user.password,
    },
  });

  if (response.status() >= 500) return false;
  expect(response.status()).toBe(201);
  return true;
}

async function fetchInvitations(page: Page): Promise<InvitationApiRecord[]> {
  const response = await page.context().request.get("/api/referral-invitations");
  expect(response.status()).toBe(200);
  const payload = (await response.json()) as { invitations?: InvitationApiRecord[] };
  return payload.invitations ?? [];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test.describe("emailed referral invitation", () => {
  test("signed-in sender can email an invite through the /send composer", async ({
    page,
    request,
  }) => {
    const user = makeUniqueUser();
    const created = await createUserAccount(request, user);
    if (!created) {
      test.skip(true, "Signup API/database not available");
      return;
    }

    const signedIn = await signInUser(page, {
      email: user.email,
      password: user.password,
    });
    if (!signedIn) {
      test.skip(true, "Fresh user credentials not available");
      return;
    }

    const response = await page.goto("/send", { waitUntil: "domcontentloaded" });
    if ((response?.status() ?? 0) >= 500) {
      test.skip(true, "Send route dependencies not available");
      return;
    }
    await expect(page.locator("#invite-recipient-name")).toBeEditable({
      timeout: 15_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);

    const recipientName = `Email Friend ${Date.now().toString(36)}`;
    const recipientEmail = `email-friend-${Date.now().toString(36)}@example.test`;

    await page.locator("#invite-recipient-name").fill(recipientName);
    await page.locator("#invite-recipient-email").fill(recipientEmail);
    await expect(page.locator("#invite-recipient-name")).toHaveValue(recipientName);
    await expect(page.locator("#invite-recipient-email")).toHaveValue(recipientEmail);

    await page.getByRole("button", {
      name: new RegExp(`Send email to ${escapeRegExp(recipientEmail)} for me`, "i"),
    }).click();

    await expect(page.getByRole("button", { name: /^Sent$/ })).toBeVisible({
      timeout: 15_000,
    });

    await expect.poll(async () => {
      const invitation = (await fetchInvitations(page)).find(
        (item) => item.recipientEmail === recipientEmail,
      );
      return invitation?.status ?? "missing";
    }, { timeout: 15_000 }).toBe("SENT");

    const invitation = (await fetchInvitations(page)).find(
      (item) => item.recipientEmail === recipientEmail,
    );
    expect(invitation).toBeTruthy();
    expect(invitation).toMatchObject({
      recipientEmail,
      recipientEmailStep: 1,
      recipientName,
      status: "SENT",
    });
    expect(invitation?.recipientEmailProviderMessageId).toMatch(/^mock_resend_/);
    expect(invitation?.sentAt).toBeTruthy();
    expect(invitation?.shareAttemptId).toBeTruthy();
    expect(invitation?.taskId).toBeTruthy();
  });
});
