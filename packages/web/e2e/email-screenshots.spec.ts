/**
 * Email template visual coverage.
 *
 * Each template is server-rendered by the `/dev/email/<template>` route
 * (`packages/web/src/app/dev/email/[template]/route.ts`) using bland
 * sample data. The spec navigates the browser to that URL and
 * screenshots — same flow as page screenshots, no direct imports of
 * `*-email.server.ts` modules. This avoids the Playwright transformer
 * bug on `@optimitron/db/dist`'s `export *` syntax that previously
 * knocked this spec out of `MODE_SPECS.visual`.
 *
 * Output lands in `screenshots/{project}/email-{name}-{project}.png`
 * alongside page screenshots. `build-visual-review.mjs` picks it up
 * automatically via its `collectScreenshots` walk.
 *
 * Sample data is intentionally bland — no real user IDs, no production
 * referral codes — so the screenshots are safe to publish even when
 * the preview is connected to production-derived data.
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { freezeClock } from "./helpers/freeze-clock";

const SCREENSHOT_ROOT = path.resolve(process.cwd(), "screenshots");

async function captureEmail(
  page: import("@playwright/test").Page,
  template: string,
  name: string,
  expectedText: string | readonly string[],
  testInfo: import("@playwright/test").TestInfo,
) {
  // Use the project's configured viewport (desktop: 1920x1080,
  // mobile: 390x844 iPhone 14) so the mobile screenshot actually shows the
  // email at a phone width. Previously this spec hardcoded a 720x1000 override
  // which made desktop and mobile screenshots identical and inserted ~60px of
  // empty padding around the React Email 600px container.
  // `?raw=1` returns the bare email HTML; the default route wraps it in a
  // Gmail-mobile preview chrome which we don't want in the visual-regression
  // screenshot.
  const response = await page.goto(`/dev/email/${template}?raw=1`, {
    waitUntil: "domcontentloaded",
  });
  expect(response?.status()).toBeLessThan(400);
  const expectedPhrases = Array.isArray(expectedText)
    ? expectedText
    : [expectedText];
  for (const expectedPhrase of expectedPhrases) {
    await expect(page.locator("body")).toContainText(expectedPhrase);
  }
  await page.waitForLoadState("networkidle").catch(() => undefined);

  const screenshotDir = path.join(SCREENSHOT_ROOT, testInfo.project.name);
  await mkdir(screenshotDir, { recursive: true });
  const filename = `${name}-${testInfo.project.name}.png`;
  const screenshot = await page.screenshot({
    fullPage: true,
    path: path.join(screenshotDir, filename),
  });
  await testInfo.attach(filename, {
    body: screenshot,
    contentType: "image/png",
  });
}

test.describe("email visual coverage", () => {
  test.beforeEach(async ({ page }) => {
    await freezeClock(page);
  });

  test("email-magic-link", async ({ page }, testInfo) => {
    await captureEmail(
      page,
      "magic-link",
      "email-magic-link",
      "Your sign-in link is below.",
      testInfo,
    );
  });

  test("email-post-vote-share", async ({ page }, testInfo) => {
    await captureEmail(
      page,
      "post-vote-share",
      "email-post-vote-share",
      [
        "Forward this message",
        "122 stored apocalypses",
        "COPY THIS MESSAGE",
        "1% Treaty",
      ],
      testInfo,
    );
  });

  test("email-referral-first-conversion", async ({ page }, testInfo) => {
    await captureEmail(
      page,
      "referral-first-conversion",
      "email-referral-first-conversion",
      "Sample Voter just signed",
      testInfo,
    );
  });

  test("email-task-assignment", async ({ page }, testInfo) => {
    await captureEmail(
      page,
      "task-assignment",
      "email-task-assignment",
      "New task for Sample Assignee",
      testInfo,
    );
  });

  test("email-monthly-chain-digest", async ({ page }, testInfo) => {
    await captureEmail(
      page,
      "monthly-chain-digest",
      "email-monthly-chain-digest",
      "7 employees completed",
      testInfo,
    );
  });

  test("email-task-comment-notification", async ({ page }, testInfo) => {
    await captureEmail(
      page,
      "task-comment-notification",
      "email-task-comment-notification",
      "Sample Author commented",
      testInfo,
    );
  });
});
