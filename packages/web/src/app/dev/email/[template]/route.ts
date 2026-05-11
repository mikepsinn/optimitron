import { NextResponse } from "next/server";
import { buildMagicLinkHtml } from "@/lib/email/magic-link-render";
import { buildMonthlyChainDigestHtml } from "@/lib/email/monthly-chain-digest-email";
import { buildPostVoteShareHtml } from "@/lib/email/post-vote-share-email";
import { buildReferralFirstConversionHtml } from "@/lib/email/referral-first-conversion-email";
import { buildTaskAssignmentNotificationEmail } from "@/lib/tasks/task-assignment-notification-email.server";
import { buildTaskCommentNotificationEmail } from "@/lib/tasks/task-comment-notification-email.server";

// `/dev/email/<template>` — server-side renders each email template with
// representative sample tokens and returns the raw HTML. Replaces the
// Playwright spec's direct imports of `*-email.server.ts` modules (which
// hit a transformer bug on `@optimitron/db/dist`'s `export *`) — the
// spec now uses `page.goto('/dev/email/<template>')` and screenshots
// the rendered page like any other route.
//
// Gated to non-production: returns 404 on prod to avoid exposing email
// internals + sample copy publicly.

const SAMPLE_REFERRAL = "https://warondisease.org/vote/SAMPLE";
const SAMPLE_DASHBOARD = "https://warondisease.org/dashboard";

const renderers: Record<string, () => string> = {
  "magic-link": () =>
    buildMagicLinkHtml(
      "https://warondisease.local/api/auth/callback/email?token=SAMPLE",
      "warondisease.local",
      { brandColor: "#111827", buttonText: "#ffffff" },
    ),
  "post-vote-share": () => buildPostVoteShareHtml(SAMPLE_REFERRAL),
  "referral-first-conversion": () =>
    buildReferralFirstConversionHtml({
      voterDisplayName: "Sample Voter",
      dashboardUrl: SAMPLE_DASHBOARD,
      referrerReferralUrl: SAMPLE_REFERRAL,
    }),
  "task-assignment": () =>
    buildTaskAssignmentNotificationEmail({
      description:
        "The 1% Treaty needs your country's signature. Sign the document, share the link with two people you love, and verify that your local treaty signer has been contacted.\n\nThis is a sample task description rendered into the email template.",
      id: "sample-task-id",
      recipientName: "Sample Assignee",
      replyInstruction: "Reply to this email to leave a comment on the task.",
      title: "Sign the 1% Treaty for {country}",
      recipientReferralUrl: SAMPLE_REFERRAL,
    }).html,
  "monthly-digest-positive": () =>
    buildMonthlyChainDigestHtml({
      monthlyConversionCount: 7,
      totalConversionCount: 19,
      referralUrl: SAMPLE_REFERRAL,
      dashboardUrl: SAMPLE_DASHBOARD,
      monthLabel: "May 2026",
    }),
  "monthly-digest-resend": () =>
    buildMonthlyChainDigestHtml({
      monthlyConversionCount: 0,
      totalConversionCount: 0,
      referralUrl: SAMPLE_REFERRAL,
      dashboardUrl: SAMPLE_DASHBOARD,
      monthLabel: "May 2026",
    }),
  "task-comment-notification": () =>
    buildTaskCommentNotificationEmail({
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
    }).html,
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ template: string }> },
) {
  if (process.env.VERCEL_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { template } = await params;
  const renderer = renderers[template];
  if (!renderer) {
    const available = Object.keys(renderers).join(", ");
    return new NextResponse(
      `Unknown email template: "${template}". Available: ${available}`,
      { status: 404, headers: { "content-type": "text/plain" } },
    );
  }

  const html = renderer();
  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
