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

function postVoteFlow(page: Page) {
  return page.getByTestId("treaty-post-vote-share-flow");
}

async function expectPostVoteScreen(page: Page, screen: string) {
  await expect(postVoteFlow(page)).toHaveAttribute("data-screen", screen, {
    timeout: 15_000,
  });
}

async function clickPostVotePrimary(page: Page) {
  await postVoteFlow(page).locator("button").last().click();
}

async function clickPreVotePrimary(page: Page) {
  await page.getByTestId("treaty-vote-prelude-card").locator("button").last().click();
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
  const prelude = page.getByTestId("treaty-vote-prelude-card");
  if (await prelude.isVisible().catch(() => false)) {
    await expect(prelude).toHaveAttribute("data-screen", "apology", { timeout: 10_000 });
    await clickPreVotePrimary(page);
    await expect(prelude).toHaveAttribute("data-screen", "grandma", { timeout: 10_000 });
    await clickPreVotePrimary(page);
    await expect(prelude).toHaveAttribute("data-screen", "apocalypse", { timeout: 10_000 });
    await clickPreVotePrimary(page);
  }

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

async function continueToMessageComposer(page: Page) {
  await expect(page.getByTestId("treaty-post-vote-overlay")).toBeVisible({ timeout: 15_000 });

  await expect(postVoteFlow(page)).toBeVisible({ timeout: 15_000 });
  if ((await postVoteFlow(page).getAttribute("data-screen")) === "opening") {
    await clickPostVotePrimary(page);
  }

  await expectPostVoteScreen(page, "stakes");
  await clickPostVotePrimary(page);

  if ((await postVoteFlow(page).getAttribute("data-screen")) === "nuclear") {
    await clickPostVotePrimary(page);
  }

  await expectPostVoteScreen(page, "math");
  await clickPostVotePrimary(page);
  await expectPostVoteScreen(page, "neat");
  await clickPostVotePrimary(page);
  await expectPostVoteScreen(page, "twoHumans");
  await clickPostVotePrimary(page);
  await expectPostVoteScreen(page, "perVote");
  await clickPostVotePrimary(page);

  await expectPostVoteScreen(page, "sendMessage");
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
    await continueToMessageComposer(page);

    const recipientName = `Copy Friend ${Date.now().toString(36)}`;
    await page.locator("#post-vote-recipient-name").fill(recipientName);
    await page.getByRole("button", { name: "Bossy mode" }).click();

    const messageBox = page.locator('textarea[placeholder="Enter text..."]');
    await expect(messageBox).not.toHaveValue("");
    await expect(messageBox).not.toHaveValue(/[┌┐└┘│─]/);
    await clickPostVotePrimary(page);
    await expectPostVoteScreen(page, "copyConfirm");

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

    await clickPostVotePrimary(page);
    await expectPostVoteScreen(page, "sendImpact");
  });
});
