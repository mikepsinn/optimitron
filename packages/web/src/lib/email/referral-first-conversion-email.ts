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

import React from "react";
import { formatDefaultSystemEmailFromHeader } from "@/lib/email/from-address";
import {
  SAMPLE_DASHBOARD_URL,
  SAMPLE_REFERRAL_URL,
  type EmailPreview,
} from "@/lib/email/preview-envelope";
import { ReferralFirstConversionReactEmail } from "@/lib/email/referral-first-conversion-react-email";
import { transactionalSend } from "@/lib/email/outbound-authorization.server";
import { sendDedupedEmail } from "@/lib/email/send-deduped-email.server";
import type { SendResult } from "@/lib/email/resend";

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

export const REFERRAL_FIRST_CONVERSION_PREVIEW: EmailPreview = {
  templateId: REFERRAL_FIRST_CONVERSION_TEMPLATE_ID,
  displayName: "Your first referred voter just signed",
  trigger:
    "Fires exactly once per referrer — when the FIRST human signs the 1% Treaty through their referral link. Per-vote emails get spammy; only the first conversion triggers the email. Subsequent conversions are visible on /dashboard.",
  scope: "onboarding",
  from: () => formatDefaultSystemEmailFromHeader(),
  subject: () => REFERRAL_FIRST_CONVERSION_SUBJECT,
  skipWishoniaSignature: true,
  renderReact: () =>
    React.createElement(ReferralFirstConversionReactEmail, {
      voterDisplayName: "Sample Voter",
      dashboardUrl: SAMPLE_DASHBOARD_URL,
      referrerReferralUrl: SAMPLE_REFERRAL_URL,
    }),
};

export async function sendReferralFirstConversionEmail(
  input: ReferralFirstConversionEmailInput,
): Promise<SendResult | { status: "duplicate" }> {
  return sendDedupedEmail({
    authorization: transactionalSend("referral_first_conversion"),
    dedupeKey: `${REFERRAL_FIRST_CONVERSION_TEMPLATE_ID}:${input.referrerUserId}`,
    templateId: REFERRAL_FIRST_CONVERSION_TEMPLATE_ID,
    subject: REFERRAL_FIRST_CONVERSION_SUBJECT,
    react: React.createElement(ReferralFirstConversionReactEmail, {
      dashboardUrl: input.dashboardUrl,
      referrerReferralUrl: input.referrerReferralUrl,
      voterDisplayName: input.voterDisplayName,
    }),
    userId: input.referrerUserId,
    toAddress: input.referrerEmail,
    scope: "onboarding",
    skipWishoniaSignature: true,
  });
}
