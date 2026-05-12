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

// Gmail-mobile-like wrapper that surrounds the email body in an iframe
// scaled to phone width (~420px). The iframe isolates the email's own
// inline styles from the wrapper chrome. Reviewers on mobile (or desktop
// with narrow viewport) get a faithful rendering of how Gmail's mobile
// app actually displays the email.
//
// Use `?raw=1` to get the bare email HTML (e.g. for the Playwright
// screenshot spec, which page.goto's this URL).
function escapeForSrcdoc(html: string): string {
  return html.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function buildMobilePreviewWrapper(template: string, emailHtml: string): string {
  const safe = escapeForSrcdoc(emailHtml);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<title>Email preview: ${template}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f5f5f5; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .toolbar { background: #fff; border-bottom: 1px solid #e0e0e0; padding: 10px 16px; font-size: 13px; color: #5f6368; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
  .toolbar strong { color: #202124; }
  .toolbar a { color: #1a73e8; text-decoration: none; }
  .toolbar a:hover { text-decoration: underline; }
  .gmail-frame { max-width: 420px; margin: 12px auto; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border-radius: 8px; overflow: hidden; }
  .gmail-frame iframe { width: 100%; height: 80vh; border: 0; display: block; background: #fff; }
  @media (min-width: 640px) {
    .gmail-frame { max-width: 420px; margin: 24px auto; }
  }
</style>
</head>
<body>
<div class="toolbar">
  <span>Email preview · <strong>${template}</strong> · Gmail-mobile width (420px)</span>
  <a href="?raw=1">view raw HTML →</a>
</div>
<div class="gmail-frame">
  <iframe srcdoc="${safe}" title="${template}"></iframe>
</div>
</body>
</html>`;
}

export async function GET(
  request: Request,
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
  const url = new URL(request.url);
  const wantsRaw = url.searchParams.get("raw") === "1";

  const body = wantsRaw ? html : buildMobilePreviewWrapper(template, html);
  return new NextResponse(body, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
