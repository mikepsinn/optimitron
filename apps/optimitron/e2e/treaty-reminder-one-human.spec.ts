/**
 * Treaty reminder composer: one-human mode creates a tracked invite task.
 *
 * Run:
 *   pnpm --filter @optimitron/web run e2e -- treaty-reminder-one-human --reporter=list
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

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeUniqueUser(): TestUser {
  const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return {
    email: `pw-one-human-${nonce}@example.test`,
    name: `One Human Sender ${nonce}`,
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

test.describe("treaty reminder one-human mode", () => {
  test("dashboard composer creates a tracked invitation task when copying", async ({
    page,
    request,
  }) => {
    await page.addInitScript(() => {
      const openedShareUrls: string[] = [];
      Object.defineProperty(window, "__openedShareUrls", {
        configurable: true,
        value: openedShareUrls,
      });
      window.open = ((url?: string | URL | undefined) => {
        openedShareUrls.push(String(url ?? ""));
        return null;
      }) as typeof window.open;
    });
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

    const response = await page.goto("/dashboard");
    if ((response?.status() ?? 0) >= 500) {
      test.skip(true, "Needs database");
      return;
    }
    await page.waitForLoadState("domcontentloaded");

    const inviteSection = page.locator("#referral-invitations");
    const oneHumanButton = inviteSection.getByRole("button", { name: "One human" });
    await expect(oneHumanButton).toBeVisible({ timeout: 10_000 });
    await oneHumanButton.click();

    const recipientFirstName = "E2e";
    const recipientName = `${recipientFirstName} Human ${Date.now().toString(36)}`;
    await inviteSection.getByLabel("Name").fill(recipientName);
    await inviteSection.getByLabel("Email optional").fill("one-human@example.test");
    const draftMessage = inviteSection.getByLabel(
      `Reminder message for ${recipientFirstName}`,
    );
    const origin = await page.evaluate(() => window.location.origin);
    await expect(draftMessage).toHaveValue(new RegExp(`${escapeRegex(origin)}/vote/`));
    await expect(draftMessage).not.toHaveValue(/\[generated referral link\]/);
    await expect(draftMessage).not.toHaveValue(/invite=/);

    await inviteSection.getByRole("button", { name: /Create Task \+ Copy/i }).click();
    await expect(
      inviteSection.getByRole("button", { name: /Task Copied/i }),
    ).toBeVisible({ timeout: 10_000 });

    const copiedText = await page.evaluate(async () =>
      navigator.clipboard.readText().catch(() => ""),
    );
    expect(copiedText).toContain("invite=");
    expect(copiedText).toContain("sa=");

    const invitations = await fetchInvitations(page);
    const invitation = invitations.find(
      (item) => item.recipientName === recipientName,
    );
    expect(invitation).toMatchObject({
      recipientEmail: "one-human@example.test",
      status: "COPIED",
    });
    expect(invitation?.messageText).toContain("sa=");
    expect(invitation?.shareAttemptId).toBeTruthy();
    expect(invitation?.taskId).toBeTruthy();

    await inviteSection.getByRole("button", { name: "One more" }).click();
    const directRecipientFirstName = "Whats";
    const directRecipientName = `${directRecipientFirstName} App ${Date.now().toString(36)}`;
    await inviteSection.getByLabel("Name").fill(directRecipientName);

    await expect(
      inviteSection.getByLabel(`Reminder message for ${directRecipientFirstName}`),
    ).toHaveValue(new RegExp(`${escapeRegex(origin)}/vote/`));
    await inviteSection.getByRole("button", { name: "WhatsApp" }).click();

    await expect
      .poll(async () =>
        page.evaluate(() => (window as unknown as { __openedShareUrls?: string[] }).__openedShareUrls ?? []),
      )
      .toHaveLength(1);
    const openedShareUrls = await page.evaluate(() =>
      (window as unknown as { __openedShareUrls?: string[] }).__openedShareUrls ?? [],
    );
    expect(openedShareUrls[0]).toContain("https://wa.me/?text=");
    expect(decodeURIComponent(openedShareUrls[0] ?? "")).toContain("invite=");
    expect(decodeURIComponent(openedShareUrls[0] ?? "")).toContain("sa=");

    const directInvitations = await fetchInvitations(page);
    const directInvitation = directInvitations.find(
      (item) => item.recipientName === directRecipientName,
    );
    expect(directInvitation).toMatchObject({
      recipientName: directRecipientName,
      status: "COPIED",
    });
    expect(directInvitation?.messageText).toContain("invite=");
    expect(directInvitation?.messageText).toContain("sa=");
    expect(directInvitation?.shareAttemptId).toBeTruthy();
    expect(directInvitation?.taskId).toBeTruthy();
  });
});
