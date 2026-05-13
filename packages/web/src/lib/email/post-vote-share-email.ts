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

import React from "react";
import { formatShareEmailFromHeader } from "@/lib/email/from-address";
import { PostVoteShareReactEmail } from "@/lib/email/post-vote-share-react-email";
import {
  SAMPLE_REFERRAL_URL,
  type EmailPreview,
} from "@/lib/email/preview-envelope";
import { sendDedupedEmail } from "@/lib/email/send-deduped-email.server";
import type { SendResult } from "@/lib/email/resend";

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

export const POST_VOTE_SHARE_PREVIEW: EmailPreview = {
  templateId: POST_VOTE_SHARE_TEMPLATE_ID,
  displayName: "You just voted — forward this",
  trigger:
    "Fires the moment a YES vote on the 1% Treaty referendum is recorded. The email IS the share kit — voter opens it, forwards it, and sends more humans to the survey. Dedupe-keyed on voteId so re-votes don't double-send.",
  scope: "onboarding",
  from: () => formatShareEmailFromHeader("Sample Voter"),
  subject: () => POST_VOTE_SHARE_SUBJECT,
  skipWishoniaSignature: true,
  renderReact: () =>
    React.createElement(PostVoteShareReactEmail, {
      referralUrl: SAMPLE_REFERRAL_URL,
    }),
};

export async function sendPostVoteShareEmail(
  input: PostVoteShareEmailInput,
): Promise<SendResult | { status: "duplicate" }> {
  return sendDedupedEmail({
    dedupeKey: `${POST_VOTE_SHARE_TEMPLATE_ID}:${input.voteId}`,
    templateId: POST_VOTE_SHARE_TEMPLATE_ID,
    subject: POST_VOTE_SHARE_SUBJECT,
    react: React.createElement(PostVoteShareReactEmail, {
      referralUrl: input.referralUrl,
    }),
    userId: input.userId,
    toAddress: input.toAddress,
    scope: "onboarding",
    skipWishoniaSignature: true,
  });
}
