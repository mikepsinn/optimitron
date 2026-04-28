import { expect, type Page, test } from "@playwright/test";

const VOTE_URL =
  "/vote?ref=mike&invite=Uyn3Wl7O_OGdiVyJ4y0-fAhZ&treatyFlow=v1";
const VOTE_INVITE_CODE = "mike";
const VOTE_INVITE_TOKEN = "Uyn3Wl7O_OGdiVyJ4y0-fAhZ";

async function completeSliderAndVote(page: Page): Promise<void> {
  const voteSection = page.locator("#vote");
  const prelude = page.getByTestId("treaty-vote-prelude-card");
  if (await prelude.isVisible().catch(() => false)) {
    await prelude.locator("button").last().click();
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

test.describe("treaty vote yes-click regression", () => {
  test("anonymous visitor reaches post-vote save flow after YES", async ({ page }) => {
    const response = await page.goto(VOTE_URL, {
      waitUntil: "domcontentloaded",
    });
    if ((response?.status() ?? 0) >= 500) {
      test.skip(true, "Needs database");
      return;
    }

    const voteSection = page.locator("#vote");
    await voteSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await completeSliderAndVote(page);

    const pendingVote = await page.evaluate(() =>
      window.localStorage.getItem("pending_treaty_vote"),
    );
    expect(pendingVote).toBeTruthy();

    const parsed = JSON.parse(pendingVote!) as { answer: string };
    expect(parsed.answer).toBe("YES");

    const postVoteOverlay = page.getByTestId("treaty-post-vote-overlay");
    await expect(postVoteOverlay).toBeVisible({ timeout: 15_000 });

    await expect(
      postVoteOverlay.getByRole("button", { name: /(Save|Verify) with Google/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("invite route redirects and preserves invite token into pending vote", async ({
    page,
  }) => {
    const response = await page.goto(
      `/vote/${VOTE_INVITE_CODE}?invite=${VOTE_INVITE_TOKEN}&treatyFlow=v1`,
      {
        waitUntil: "domcontentloaded",
      },
    );
    if ((response?.status() ?? 0) >= 500) {
      test.skip(true, "Needs database");
      return;
    }

    const redirectedUrl = new URL(page.url());
    expect(redirectedUrl.pathname).toBe("/vote");
    expect(redirectedUrl.searchParams.get("ref")).toBe(VOTE_INVITE_CODE);
    expect(redirectedUrl.searchParams.get("invite")).toBe(VOTE_INVITE_TOKEN);
    expect(redirectedUrl.searchParams.get("treatyFlow")).toBe("v1");

    const voteSection = page.locator("#vote");
    await voteSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await completeSliderAndVote(page);

    const pendingVote = await page.evaluate(() =>
      window.localStorage.getItem("pending_treaty_vote"),
    );
    expect(pendingVote).toBeTruthy();

    const parsed = JSON.parse(pendingVote!) as {
      answer: string;
      inviteToken: string | null;
      referredBy: string | null;
    };
    expect(parsed.answer).toBe("YES");
    expect(parsed.inviteToken).toBe(VOTE_INVITE_TOKEN);
    expect(parsed.referredBy).toBe(VOTE_INVITE_CODE);

    const postVoteOverlay = page.getByTestId("treaty-post-vote-overlay");
    await expect(postVoteOverlay).toBeVisible({ timeout: 15_000 });
    await expect(
      postVoteOverlay.getByRole("button", { name: /(Save|Verify) with Google/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
