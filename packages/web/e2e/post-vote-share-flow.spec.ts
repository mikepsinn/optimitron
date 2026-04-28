/**
 * Humanity Management Training: verified voter -> two copy/manual contacts.
 *
 * Run:
 *   pnpm --filter @optimitron/web run e2e -- post-vote-share-flow --reporter=list
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
  messageText: string | null;
  recipientEmail: string | null;
  recipientName: string;
  shareAttemptId: string | null;
  status: string;
  taskId: string | null;
}

function makeUniqueUser(): TestUser {
  const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return {
    email: `pw-training-${nonce}@example.test`,
    name: `Training Sender ${nonce}`,
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

async function completeTrainingContact(page: Page, recipientName: string) {
  const flow = page.getByTestId("humanity-management-training-flow");
  await expect(flow).toHaveAttribute("data-screen", "composer", { timeout: 10_000 });
  await page.locator("#training-recipient-name").fill(recipientName);
  await flow.getByRole("button", { name: "Bossy mode" }).click();
  const messageBox = flow.locator("textarea");
  await expect(messageBox).not.toHaveValue("");
  await flow.getByRole("button", { name: /^Copy$/ }).click();
  await expect(flow).toHaveAttribute("data-screen", "confirm", { timeout: 10_000 });

  const copiedText = await page.evaluate(async () => navigator.clipboard.readText().catch(() => ""));
  expect(copiedText).toContain("sa=");
  expect(copiedText).toContain("invite=");

  await flow.getByRole("button", { name: "I contacted them" }).click();
}

test.describe("humanity management training", () => {
  test("verified voter can share and assign two humans", async ({
    page,
    request,
  }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

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

    const response = await page.goto("/humanity-management-training");
    if ((response?.status() ?? 0) >= 500) {
      test.skip(true, "Needs database");
      return;
    }
    await page.waitForLoadState("domcontentloaded");
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    const flow = page.getByTestId("humanity-management-training-flow");
    await expect(flow).toHaveAttribute("data-screen", "promotion", { timeout: 10_000 });
    await flow.getByRole("button", { name: "Start training" }).click();
    await expect(flow).toHaveAttribute("data-screen", "share", { timeout: 10_000 });
    await flow.getByRole("button", { name: "Copy URL" }).click();
    const referralShareText = await page.evaluate(async () =>
      navigator.clipboard.readText().catch(() => ""),
    );
    expect(referralShareText).toContain("/vote/");
    expect(referralShareText).toContain("sa=");
    await flow.getByRole("button", { name: "Continue" }).click();

    const firstRecipient = `First Friend ${Date.now().toString(36)}`;
    await completeTrainingContact(page, firstRecipient);
    await expect(flow).toHaveAttribute("data-screen", "impact", { timeout: 10_000 });

    const invitationsAfterFirst = await fetchInvitations(page);
    const firstInvitation = invitationsAfterFirst.find((item) => item.recipientName === firstRecipient);
    expect(firstInvitation).toMatchObject({
      recipientEmail: null,
      status: "COPIED",
    });
    expect(firstInvitation?.messageText).toContain("sa=");
    expect(firstInvitation?.shareAttemptId).toBeTruthy();
    expect(firstInvitation?.taskId).toBeTruthy();

    await flow.getByRole("button", { name: "Assign second human" }).click();
    const secondRecipient = `Second Friend ${Date.now().toString(36)}`;
    await completeTrainingContact(page, secondRecipient);
    await expect(flow).toHaveAttribute("data-screen", "complete", { timeout: 10_000 });

    const invitationsAfterSecond = await fetchInvitations(page);
    const secondInvitation = invitationsAfterSecond.find((item) => item.recipientName === secondRecipient);
    expect(secondInvitation).toMatchObject({
      recipientEmail: null,
      status: "COPIED",
    });
    expect(secondInvitation?.taskId).toBeTruthy();
  });
});
