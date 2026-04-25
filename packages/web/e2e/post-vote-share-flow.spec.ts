/**
 * Post-vote share flow: verified voter -> copy-only invitation.
 *
 * Launch-readiness check for the browser path after a signed-in user votes.
 * Uses a fresh account per run so the referendum vote unique constraint does
 * not make this spec order-dependent.
 *
 * Run:
 *   pnpm --filter @optimitron/web exec playwright test e2e/post-vote-share-flow.spec.ts --project=default --reporter=list
 */
import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
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
    email: `pw-post-vote-${nonce}@example.test`,
    name: `Post Vote Sender ${nonce}`,
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

async function continueToSendName(page: Page) {
  await expect(
    page.getByText("I'm very sorry to bother you, but this is kind of the most important thing in the universe"),
  ).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Fine", exact: true }).click();
  await page.getByRole("button", { name: "Okay, go on", exact: true }).click();
  await page.getByRole("button", { name: "Go on", exact: true }).click();
  await page.getByRole("button", { name: "Okay, I buy it", exact: true }).click();
  await page.getByRole("button", { name: "Neat", exact: true }).click();
  await page.getByRole("button", { name: "Okay, two humans", exact: true }).click();
  await page.getByRole("button", { name: "Show me mine", exact: true }).click();

  await expect(page.getByText("Who do you want to tell first?")).toBeVisible({ timeout: 10_000 });
}

async function fetchInvitations(page: Page): Promise<InvitationApiRecord[]> {
  const response = await page.context().request.get("/api/referral-invitations");
  expect(response.status()).toBe(200);
  const payload = (await response.json()) as { invitations?: InvitationApiRecord[] };
  return payload.invitations ?? [];
}

test.describe("post-vote share flow", () => {
  test("verified voter can complete the copy-only invite loop", async ({
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

    const response = await page.goto("/");
    if ((response?.status() ?? 0) >= 500) {
      test.skip(true, "Needs database");
      return;
    }
    await page.waitForLoadState("domcontentloaded");

    await page.locator("#vote").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await completeSliderAndVote(page);
    await continueToSendName(page);

    const recipientName = `Copy Friend ${Date.now().toString(36)}`;
    await page.locator("#post-vote-recipient-name").fill(recipientName);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Assign the task" }).click();

    const firstName = recipientName.split(" ")[0];
    const messageBox = page.locator('textarea[placeholder="Enter text..."]');
    await expect(messageBox).toHaveValue(new RegExp(`Here's ${firstName}'s task assignment`));
    await page.getByRole("button", { name: /^Copy$/ }).first().click();

    await expect(
      page.getByText(new RegExp(`Now paste it into your texts, WhatsApp, email, Signal.*${firstName} fastest\\.`)),
    ).toBeVisible({ timeout: 10_000 });

    const copiedText = await page.evaluate(async () => navigator.clipboard.readText().catch(() => ""));
    expect(copiedText).toContain("sa=");
    expect(copiedText).toContain("invite=");

    const invitations = await fetchInvitations(page);
    const invitation = invitations.find((item) => item.recipientName === recipientName);
    expect(invitation).toBeTruthy();
    expect(invitation).toMatchObject({
      recipientEmail: null,
      status: "COPIED",
    });
    expect(invitation?.messageText).toContain("sa=");
    expect(invitation?.shareAttemptId).toBeTruthy();
    expect(invitation?.taskId).toBeTruthy();

    await page.getByRole("button", { name: "I sent it" }).click();

    await expect(
      page.getByText(`When ${firstName} votes: +1 lifetime of suffering prevented.`),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Inverse Kills Score:")).toBeVisible();
  });
});
