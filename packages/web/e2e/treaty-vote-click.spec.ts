import { expect, type Page, test } from "@playwright/test";

const VOTE_URL =
  "/vote?ref=mike&invite=Uyn3Wl7O_OGdiVyJ4y0-fAhZ&treatyFlow=v1";
const VOTE_INVITE_CODE = "mike";
const VOTE_INVITE_TOKEN = "Uyn3Wl7O_OGdiVyJ4y0-fAhZ";

async function completeSliderAndVote(page: Page): Promise<void> {
  const voteSection = page.locator("#vote");
  const slider = voteSection.locator('input[type="range"]');
  await expect(slider).toBeVisible({ timeout: 15_000 });

  const submit = voteSection.locator("button:has-text('SUBMIT')");
  for (const targetRatio of [0.3, 0.25, 0.35]) {
    const box = await slider.boundingBox();
    expect(box, "slider track should have geometry").not.toBeNull();
    if (!box) return;

    const y = box.y + box.height / 2;
    const targetX = box.x + box.width * targetRatio;
    const startX = box.x + box.width / 2;

    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(targetX, y, { steps: 12 });
    await page.mouse.up();

    if (await submit.isVisible({ timeout: 1_500 }).catch(() => false)) {
      break;
    }
  }

  await expect(submit).toBeVisible({ timeout: 10_000 });
  const scrollYBeforeSubmit = await page.evaluate(() => window.scrollY);
  await submit.click();

  const yesButton = voteSection.locator("button:has-text('YES')");
  await expect(yesButton).toBeVisible({ timeout: 10_000 });
  const maxSubmitScrollDelta = await page.evaluate(
    (scrollYBeforeSubmit) =>
      new Promise<number>((resolve) => {
        const startedAt = performance.now();
        let maxDelta = 0;

        const sample = () => {
          maxDelta = Math.max(
            maxDelta,
            Math.abs(window.scrollY - scrollYBeforeSubmit),
          );

          if (performance.now() - startedAt >= 700) {
            resolve(maxDelta);
            return;
          }

          requestAnimationFrame(sample);
        };

        requestAnimationFrame(sample);
      }),
    scrollYBeforeSubmit,
  );
  expect(
    maxSubmitScrollDelta,
    "submitting the allocation slider should not auto-scroll the page",
  ).toBeLessThan(80);
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

    const postVoteRedirect = page.getByTestId("treaty-post-vote-redirect");
    await expect(postVoteRedirect).toBeVisible({ timeout: 15_000 });
    await expect(
      postVoteRedirect.getByRole("button", { name: /(Save|Verify) with Google/i }),
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

    const postVoteRedirect = page.getByTestId("treaty-post-vote-redirect");
    await expect(postVoteRedirect).toBeVisible({ timeout: 15_000 });
    await expect(
      postVoteRedirect.getByRole("button", { name: /(Save|Verify) with Google/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
