/**
 * Post-vote forward email. Triggered the moment a user's YES vote on the
 * 1% Treaty is recorded. The email IS the share kit — the user opens it,
 * hits forward, types two recipients, and sends.
 *
 * The HTML body is intentionally designed to forward gracefully: a tiny
 * eyebrow tag for the original recipient, then the "I love you" message
 * verbatim with the user's referral URL inline, then a single big button.
 * When the user hits Forward, mail clients preserve the message body, so
 * the recipient sees the share text as if their friend wrote it.
 *
 * Dedupe: keyed on the `voteId`, so re-votes don't double-send.
 */

import { nanoid } from "nanoid";
import {
  claimEmailLog,
  markEmailLogStatus,
} from "@/lib/email/email-log.server";
import { sendResendEmail, type SendResult } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/magic-link-render";
import { buildShareMessage } from "@/lib/share-message";

interface PostVoteShareEmailInput {
  /** ReferendumVote.id — used as dedupe scope. */
  voteId: string;
  /** Recipient's `User.id`. */
  userId: string;
  /** Recipient's email address. */
  toAddress: string;
  /** The voter's personal referral URL — built via `buildUserReferralUrl`,
   * so the shape is `${baseUrl}/vote/${handle | referralCode}` (e.g.
   * `https://warondisease.org/vote/@alice`). */
  referralUrl: string;
}

export const POST_VOTE_SHARE_TEMPLATE_ID = "post-vote-share";
export const POST_VOTE_SHARE_SUBJECT = "End war and disease";

export function buildPostVoteShareMessageText(referralUrl: string): string {
  return buildShareMessage(referralUrl);
}

export function buildPostVoteShareHtml(referralUrl: string): string {
  const escapedUrl = escapeHtml(referralUrl);
  const message = escapeHtml(buildPostVoteShareMessageText(referralUrl));
  return `
    <div style="padding:32px 16px;font-family:Arial,sans-serif;color:#111827;max-width:640px;margin:0 auto;">
      <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#71717a;text-transform:uppercase;letter-spacing:0.14em;font-weight:700;">
        You voted. Now forward this to two humans you love.
      </p>
      <p style="margin:0 0 24px;font-size:18px;line-height:1.7;font-weight:700;">
        ${message}
      </p>
      <a
        href="${escapedUrl}"
        style="display:inline-block;background:#111827;color:#ffffff;padding:16px 32px;text-decoration:none;font-weight:900;border:2px solid #111827;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;"
      >
        End war and disease
      </a>
      <p style="margin:32px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
        Hit forward, paste two email addresses in the To: line, send. 32
        doubling rounds × 2 referrals each = 4,300,000,000 humans reached.
      </p>
    </div>
  `;
}

export function buildPostVoteShareText(referralUrl: string): string {
  return [
    "You voted. Now forward this to two humans you love.",
    "",
    buildPostVoteShareMessageText(referralUrl),
    "",
    `End war and disease: ${referralUrl}`,
    "",
    "Hit forward, paste two email addresses, send. 32 doubling rounds × 2 referrals each = 4,300,000,000 humans reached.",
  ].join("\n");
}

export async function sendPostVoteShareEmail(
  input: PostVoteShareEmailInput,
): Promise<SendResult | { status: "duplicate" }> {
  const emailLogId = nanoid();
  const dedupeKey = `${POST_VOTE_SHARE_TEMPLATE_ID}:${input.voteId}`;
  const now = new Date();

  const claimed = await claimEmailLog({
    dedupeKey,
    id: emailLogId,
    now,
    subject: POST_VOTE_SHARE_SUBJECT,
    templateId: POST_VOTE_SHARE_TEMPLATE_ID,
    toAddress: input.toAddress,
    userId: input.userId,
  });

  if (claimed.duplicate || !claimed.emailLogId) {
    return { status: "duplicate" };
  }

  try {
    const result = await sendResendEmail({
      emailLogId: claimed.emailLogId,
      html: buildPostVoteShareHtml(input.referralUrl),
      scope: "onboarding",
      skipWishoniaSignature: true,
      subject: POST_VOTE_SHARE_SUBJECT,
      text: buildPostVoteShareText(input.referralUrl),
      to: input.toAddress,
      userId: input.userId,
    });

    if (result.status === "sent") {
      await markEmailLogStatus({
        emailLogId: claimed.emailLogId,
        providerMessageId: result.id,
        status: "SENT",
      });
    } else {
      await markEmailLogStatus({
        emailLogId: claimed.emailLogId,
        errorMessage: `send_aborted:${result.status}`,
        status: "FAILED",
      });
    }
    return result;
  } catch (error) {
    await markEmailLogStatus({
      emailLogId: claimed.emailLogId,
      errorMessage: error instanceof Error ? error.message : String(error),
      status: "FAILED",
    });
    throw error;
  }
}
