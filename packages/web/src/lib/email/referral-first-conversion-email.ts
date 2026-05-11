/**
 * Referral-first-conversion email. Sent exactly once to a referrer — the
 * moment the FIRST human signs the 1% Treaty through their referral link.
 *
 * Per-vote real-time feedback emails get spammy fast (5 referrals = 5
 * basically-identical emails in 10 minutes). The first conversion is the
 * one that matters: it's the proof point that the referral chain is real,
 * and the strongest reinforcement to keep sharing. Subsequent conversions
 * live on `/dashboard` as a counter.
 *
 * Dedupe: keyed on the referrer's user id, so even after many converted
 * referrals only the first triggers an email.
 */

import { nanoid } from "nanoid";
import {
  claimEmailLog,
  markEmailLogStatus,
} from "@/lib/email/email-log.server";
import { sendResendEmail, type SendResult } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/magic-link-render";
import {
  buildShareFooterHtml,
  buildShareFooterText,
} from "@/lib/email/share-footer";

interface ReferralFirstConversionEmailInput {
  /** Referrer's `User.id` (the user whose link converted). */
  referrerUserId: string;
  /** Referrer's email address. */
  referrerEmail: string;
  /** Display name of the human who just voted. */
  voterDisplayName: string;
  /** URL pointing at the referrer's dashboard so they can see ongoing stats. */
  dashboardUrl: string;
  /** The referrer's own personal referral URL, embedded in the share footer. */
  referrerReferralUrl: string;
}

export const REFERRAL_FIRST_CONVERSION_TEMPLATE_ID = "referral-first-conversion";
export const REFERRAL_FIRST_CONVERSION_SUBJECT = "Your link worked.";

export function buildReferralFirstConversionHtml(
  input: Pick<
    ReferralFirstConversionEmailInput,
    "voterDisplayName" | "dashboardUrl" | "referrerReferralUrl"
  >,
): string {
  const escapedDashboard = escapeHtml(input.dashboardUrl);
  const escapedName = escapeHtml(input.voterDisplayName);
  return `
    <div style="padding:32px 16px;font-family:Arial,sans-serif;color:#111827;max-width:640px;margin:0 auto;">
      <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#71717a;text-transform:uppercase;letter-spacing:0.14em;font-weight:700;">
        Your link worked. Round 1 of 32.
      </p>
      <p style="margin:0 0 16px;font-size:24px;line-height:1.4;font-weight:900;">
        ${escapedName} just signed the 1% Treaty through your link.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;font-weight:700;">
        The math: 32 doubling rounds × 2 referrals each = 4,300,000,000
        humans — every adult on Earth.
      </p>
      <p style="margin:0 0 28px;font-size:16px;line-height:1.7;font-weight:700;">
        The chain breaks the moment voters stop reaching 2 each. Your job:
        keep going, and make sure ${escapedName} keeps going too. If everyone
        in the chain averages just 2 conversions, every human alive votes.
      </p>
      <a
        href="${escapedDashboard}"
        style="display:inline-block;background:#111827;color:#ffffff;padding:16px 32px;text-decoration:none;font-weight:900;border:2px solid #111827;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;"
      >
        Open dashboard
      </a>
      <p style="margin:32px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
        Live conversion counts are on your dashboard. We only email on the
        first conversion — no per-vote pings.
      </p>
      ${buildShareFooterHtml(input.referrerReferralUrl)}
    </div>
  `;
}

export function buildReferralFirstConversionText(
  input: Pick<
    ReferralFirstConversionEmailInput,
    "voterDisplayName" | "dashboardUrl" | "referrerReferralUrl"
  >,
): string {
  return [
    "Your link worked. Round 1 of 32.",
    "",
    `${input.voterDisplayName} just signed the 1% Treaty through your link.`,
    "",
    "The math: 32 doubling rounds × 2 referrals each = 4,300,000,000 humans — every adult on Earth.",
    "",
    `The chain breaks the moment voters stop reaching 2 each. Your job: keep going, and make sure ${input.voterDisplayName} keeps going too. If everyone in the chain averages just 2 conversions, every human alive votes.`,
    "",
    `Open dashboard: ${input.dashboardUrl}`,
    "",
    "Live conversion counts are on your dashboard. We only email on the first conversion — no per-vote pings.",
    buildShareFooterText(input.referrerReferralUrl),
  ].join("\n");
}

export async function sendReferralFirstConversionEmail(
  input: ReferralFirstConversionEmailInput,
): Promise<SendResult | { status: "duplicate" }> {
  const emailLogId = nanoid();
  const dedupeKey = `${REFERRAL_FIRST_CONVERSION_TEMPLATE_ID}:${input.referrerUserId}`;
  const now = new Date();

  const claimed = await claimEmailLog({
    dedupeKey,
    id: emailLogId,
    now,
    subject: REFERRAL_FIRST_CONVERSION_SUBJECT,
    templateId: REFERRAL_FIRST_CONVERSION_TEMPLATE_ID,
    toAddress: input.referrerEmail,
    userId: input.referrerUserId,
  });

  if (claimed.duplicate || !claimed.emailLogId) {
    return { status: "duplicate" };
  }

  try {
    const result = await sendResendEmail({
      emailLogId: claimed.emailLogId,
      html: buildReferralFirstConversionHtml(input),
      scope: "onboarding",
      skipWishoniaSignature: true,
      subject: REFERRAL_FIRST_CONVERSION_SUBJECT,
      text: buildReferralFirstConversionText(input),
      to: input.referrerEmail,
      userId: input.referrerUserId,
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
