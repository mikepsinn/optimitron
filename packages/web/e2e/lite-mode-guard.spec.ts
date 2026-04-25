/**
 * Lite-mode route guards: demo/embed surfaces must not mount the full treaty
 * post-vote referral send loop.
 *
 * Run:
 *   pnpm --filter @optimitron/web exec playwright test e2e/lite-mode-guard.spec.ts --project=default --reporter=list
 */
import { expect, test, type Page } from "@playwright/test";

const FULL_SEND_LOOP_TEXT = [
  "I'm very sorry to bother you, but this is kind of the most important thing in the universe",
  "Who do you want to tell first?",
];

async function expectNoFullPostVoteSendLoop(page: Page) {
  for (const text of FULL_SEND_LOOP_TEXT) {
    await expect(page.getByText(text)).toHaveCount(0);
  }

  await expect(page.locator("#post-vote-recipient-name")).toHaveCount(0);
  await expect(page.locator("#post-vote-recipient-email")).toHaveCount(0);
}

test.describe("lite-mode route guards", () => {
  test("/demo renders presentation mode without the full post-vote send loop", async ({
    page,
  }) => {
    const response = await page.goto("/demo", {
      timeout: 120_000,
      waitUntil: "domcontentloaded",
    });
    if ((response?.status() ?? 0) >= 500) {
      test.skip(true, "Demo route dependencies not available");
      return;
    }

    await expect(page.locator('[data-testid^="slide-"]').first()).toBeVisible({
      timeout: 60_000,
    });
    await expectNoFullPostVoteSendLoop(page);
  });

  test("/reasoning/embed denies missing org tokens without the full post-vote send loop", async ({
    page,
  }) => {
    const response = await page.goto("/reasoning/embed", {
      waitUntil: "domcontentloaded",
    });
    if ((response?.status() ?? 0) >= 500) {
      test.skip(true, "Embed route dependencies not available");
      return;
    }

    await expect(page.getByText(/^Embed denied:/)).toBeVisible();
    await expectNoFullPostVoteSendLoop(page);
  });
});
