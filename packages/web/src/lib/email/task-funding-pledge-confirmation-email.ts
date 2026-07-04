/**
 * Pledge confirmation email. Sent once when the card-save Checkout session
 * completes (`checkout.session.completed`, mode "setup"): the card is saved,
 * nothing is charged, and this email is the receipt for that non-charge —
 * without it, a card form followed by silence reads as a failed payment.
 * Carries the one link that matters: the signed one-click cancel URL.
 *
 * Dedupe: keyed on `pledge-confirm:{pledgeId}` via the shared EmailLog
 * dedupe-key mechanism — a pledge saves a card once, so replayed webhook
 * deliveries and double-wired call sites send at most one confirmation.
 */

import React from "react";
import { formatDefaultSystemEmailFromHeader } from "@/lib/email/from-address";
import type { EmailPreview } from "@/lib/email/preview-envelope";
import type { SendResult } from "@/lib/email/resend";
import { sendDedupedEmail } from "@/lib/email/send-deduped-email.server";
import {
  formatPledgeAmountLabel,
  formatSavedCardLabel,
} from "@/lib/email/task-funding-pledge-decline-email";
import { TaskFundingPledgeConfirmationReactEmail } from "@/lib/email/task-funding-pledge-confirmation-react-email";
import { createLogger } from "@/lib/logger";
import { buildPledgeCancelUrl } from "@/lib/task-funding/pledge-cancel-token";

const log = createLogger("task-funding-pledge-confirmation-email");

export const TASK_FUNDING_PLEDGE_CONFIRMATION_TEMPLATE_ID =
  "task-funding-pledge-confirmation";

/**
 * "You pledged $25 to end war and disease". The fixed words are 36 chars and
 * amounts are int4 cents (max "$21,474,836.47", 14 chars), so the subject
 * stays under 60 characters for every chargeable amount.
 */
export function buildPledgeConfirmationSubject(amountCents: number): string {
  return `You pledged ${formatPledgeAmountLabel(amountCents)} to end war and disease`;
}

/**
 * One confirmation per pledge, ever: the EmailLog unique dedupeKey makes
 * webhook replays no-ops. Unlike the decline email there is no timestamp in
 * the key — a pledge's card is saved exactly once.
 */
export function getPledgeConfirmationDedupeKey(pledgeId: string): string {
  return `pledge-confirm:${pledgeId}`;
}

/** Target deadline -> "January 1, 2027". UTC so the label never depends on server TZ. */
export function formatPledgeDeadlineLabel(expiresAt: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(expiresAt);
}

export interface SendPledgeConfirmationEmailInput {
  /** The pledged amount in integer cents. */
  amountCents: number;
  pledge: {
    cardBrand?: string | null;
    cardLast4?: string | null;
    id: string;
    /** Drives suppression bookkeeping + unsubscribe URL. Null = cannot send. */
    pledgedByUserId: string | null;
  };
  target: {
    /** When set, the "never charged after this date" clause renders. */
    expiresAt: Date | null;
  };
  task: {
    id: string;
    title: string;
  };
  toEmail: string;
}

export type SendPledgeConfirmationEmailResult =
  | SendResult
  | { status: "duplicate" }
  | { reason: "no_user"; status: "skipped" };

export const TASK_FUNDING_PLEDGE_CONFIRMATION_PREVIEW: EmailPreview = {
  templateId: TASK_FUNDING_PLEDGE_CONFIRMATION_TEMPLATE_ID,
  displayName: "Pledge confirmation — card saved, nothing charged",
  trigger:
    "Fires once when a pledger's card-save Checkout session completes ($0 setup mode). Confirms the pledge amount, states the charged-only-when-fully-funded deal, and carries the signed one-click cancel link.",
  scope: "account_security",
  from: () => formatDefaultSystemEmailFromHeader(),
  subject: () => buildPledgeConfirmationSubject(2500),
  skipWishoniaSignature: false,
  renderReact: () =>
    React.createElement(TaskFundingPledgeConfirmationReactEmail, {
      amountLabel: "$25",
      cancelUrl:
        "https://warondisease.org/api/task-funding/pledge/cancel?token=SAMPLE",
      cardLabel: "Visa card ending 4242",
      deadlineLabel: "January 1, 2027",
      taskTitle: "Establish the Court of Humanity",
    }),
};

export async function sendPledgeConfirmationEmail(
  input: SendPledgeConfirmationEmailInput,
): Promise<SendPledgeConfirmationEmailResult> {
  const userId = input.pledge.pledgedByUserId;
  if (!userId) {
    // Card-save pledges require sign-in, so this only happens for
    // legacy/organization rows; without a User there is no suppression or
    // unsubscribe bookkeeping to attach, so we skip rather than throw.
    log.warn("Pledge confirmation email skipped: pledge has no user", {
      pledgeId: input.pledge.id,
      taskId: input.task.id,
    });
    return { reason: "no_user", status: "skipped" };
  }

  const cardLast4 = input.pledge.cardLast4?.trim();
  return sendDedupedEmail({
    dedupeKey: getPledgeConfirmationDedupeKey(input.pledge.id),
    templateId: TASK_FUNDING_PLEDGE_CONFIRMATION_TEMPLATE_ID,
    subject: buildPledgeConfirmationSubject(input.amountCents),
    react: React.createElement(TaskFundingPledgeConfirmationReactEmail, {
      amountLabel: formatPledgeAmountLabel(input.amountCents),
      cancelUrl: buildPledgeCancelUrl(input.pledge.id),
      cardLabel: cardLast4
        ? formatSavedCardLabel(input.pledge.cardBrand, cardLast4)
        : null,
      deadlineLabel: input.target.expiresAt
        ? formatPledgeDeadlineLabel(input.target.expiresAt)
        : null,
      taskTitle: input.task.title,
    }),
    userId,
    toAddress: input.toEmail,
    scope: "account_security",
    skipWishoniaSignature: false,
  });
}
