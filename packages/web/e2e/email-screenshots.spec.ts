/**
 * Email template visual coverage.
 *
 * Routes get screenshotted by `visual-regression.spec.ts`. Emails are
 * server-rendered HTML strings — reviewers historically had to set up
 * Resend locally and mail themselves a sample to see how outbound copy
 * actually looks. This spec renders each template with representative
 * sample tokens, sets it as the page content, and screenshots at a
 * conventional 640px-wide email-client width.
 *
 * Output lands in `screenshots/email-{name}/{project}/...` alongside
 * page screenshots. `build-visual-review.mjs` picks it up automatically
 * via its `collectScreenshots` walk.
 *
 * Sample data is intentionally bland — no real user IDs, no production
 * referral codes — so the screenshots are safe to publish even when the
 * preview is connected to production-derived data.
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { test } from "@playwright/test";
import { buildMagicLinkHtml } from "@/lib/email/magic-link-render";
import { buildPostVoteShareHtml } from "@/lib/email/post-vote-share-email";
import { buildReferralFirstConversionHtml } from "@/lib/email/referral-first-conversion-email";
import { buildMonthlyChainDigestHtml } from "@/lib/email/monthly-chain-digest-email";
import { buildTaskAssignmentNotificationEmail } from "@/lib/tasks/task-assignment-notification-email.server";
import { buildTaskCommentNotificationEmail } from "@/lib/tasks/task-comment-notification-email.server";

const SAMPLE_REFERRAL = "https://warondisease.org/vote/SAMPLE";
const SAMPLE_DASHBOARD = "https://warondisease.org/dashboard";
const EMAIL_VIEWPORT = { width: 720, height: 1000 } as const;
const SCREENSHOT_ROOT = path.resolve(process.cwd(), "screenshots");
const STABILIZE_CSS = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
  body { background:#f5f5f5 !important; }
`;

async function captureEmail(
  page: import("@playwright/test").Page,
  name: string,
  html: string,
  testInfo: import("@playwright/test").TestInfo,
) {
  await page.setViewportSize(EMAIL_VIEWPORT);
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: STABILIZE_CSS });
  await page.waitForLoadState("networkidle").catch(() => undefined);

  // Save to `screenshots/{project}/{name}-{project}.png` so the existing
  // `build-visual-review.mjs` picks it up alongside route screenshots.
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
  test("email-magic-link", async ({ page }, testInfo) => {
    const html = buildMagicLinkHtml(
      "https://warondisease.local/api/auth/callback/email?token=SAMPLE",
      "warondisease.local",
      { brandColor: "#111827", buttonText: "#ffffff" },
    );
    await captureEmail(page, "email-magic-link", html, testInfo);
  });

  test("email-post-vote-share", async ({ page }, testInfo) => {
    const html = buildPostVoteShareHtml(SAMPLE_REFERRAL);
    await captureEmail(page, "email-post-vote-share", html, testInfo);
  });

  test("email-referral-first-conversion", async ({ page }, testInfo) => {
    const html = buildReferralFirstConversionHtml({
      voterDisplayName: "Sample Voter",
      dashboardUrl: SAMPLE_DASHBOARD,
      referrerReferralUrl: SAMPLE_REFERRAL,
    });
    await captureEmail(page, "email-referral-first-conversion", html, testInfo);
  });

  test("email-task-assignment", async ({ page }, testInfo) => {
    const built = buildTaskAssignmentNotificationEmail({
      description:
        "The 1% Treaty needs your country's signature. Sign the document, share the link with two people you love, and verify that your local treaty signer has been contacted.\n\nThis is a sample task description rendered into the email template.",
      id: "sample-task-id",
      recipientName: "Sample Assignee",
      replyInstruction:
        "Reply to this email to leave a comment on the task.",
      title: "Sign the 1% Treaty for {country}",
      recipientReferralUrl: SAMPLE_REFERRAL,
    });
    await captureEmail(page, "email-task-assignment", built.html, testInfo);
  });

  test("email-monthly-digest-positive", async ({ page }, testInfo) => {
    const html = buildMonthlyChainDigestHtml({
      monthlyConversionCount: 7,
      totalConversionCount: 19,
      referralUrl: SAMPLE_REFERRAL,
      dashboardUrl: SAMPLE_DASHBOARD,
      monthLabel: "May 2026",
    });
    await captureEmail(page, "email-monthly-digest-positive", html, testInfo);
  });

  test("email-monthly-digest-resend", async ({ page }, testInfo) => {
    const html = buildMonthlyChainDigestHtml({
      monthlyConversionCount: 0,
      totalConversionCount: 0,
      referralUrl: SAMPLE_REFERRAL,
      dashboardUrl: SAMPLE_DASHBOARD,
      monthLabel: "May 2026",
    });
    await captureEmail(page, "email-monthly-digest-resend", html, testInfo);
  });

  test("email-task-comment-notification", async ({ page }, testInfo) => {
    const built = buildTaskCommentNotificationEmail({
      task: { id: "sample-task-id", title: "Sign the 1% Treaty" },
      comment: {
        authorAvatarUrl: null,
        authorName: "Sample Author",
        message:
          "I just signed and forwarded the share message to four of my family members. Two of them have already voted.",
      },
      recipientReason: "You are assigned to this task.",
      replyInstruction: "Reply to this email to leave a comment on the task.",
      recipientReferralUrl: SAMPLE_REFERRAL,
    });
    await captureEmail(
      page,
      "email-task-comment-notification",
      built.html,
      testInfo,
    );
  });
});
