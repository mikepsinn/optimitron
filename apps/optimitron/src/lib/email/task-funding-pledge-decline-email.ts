/**
 * Pledge decline-recovery email. Sent when an off-session pledge charge
 * declines (card error or SCA `authentication_required`): the pledger gets
 * one email with a pay-now link to the task's funding section, where the
 * on-session Checkout succeeds in the cases off-session charges cannot.
 *
 * Dedupe: keyed on `{pledgeId}:{declinedAt}` via the shared EmailLog
 * dedupe-key mechanism, so retries of the charge worker or double-wired call
 * sites send at most one email per decline. A later re-pledge that declines
 * again gets a fresh `declinedAt` and therefore a fresh email — correct,
 * because it is a new decline.
 */

import React from "react";
import { formatDefaultSystemEmailFromHeader } from "@/lib/email/from-address";
import {
  SAMPLE_TASK_ID,
  type EmailPreview,
} from "@/lib/email/preview-envelope";
import type { SendResult } from "@/lib/email/resend";
import { transactionalSend } from "@/lib/email/outbound-authorization.server";
import { sendDedupedEmail } from "@/lib/email/send-deduped-email.server";
import { TaskFundingPledgeDeclineReactEmail } from "@/lib/email/task-funding-pledge-decline-react-email";
import { createLogger } from "@/lib/logger";
import { getBaseUrl } from "@/lib/url";

const log = createLogger("task-funding-pledge-decline-email");

export const TASK_FUNDING_PLEDGE_DECLINE_TEMPLATE_ID =
  "task-funding-pledge-decline";
export const TASK_FUNDING_PLEDGE_DECLINE_SUBJECT =
  "Your pledge card was declined — here's the fix";

/** The task page's pay-now checkout lives in `<section id="funding">`. */
export function getTaskFundingSectionUrl(taskId: string): string {
  return `${getBaseUrl()}/tasks/${encodeURIComponent(taskId)}#funding`;
}

/**
 * One send per decline: the same pledge declined at the same instant never
 * emails twice (EmailLog unique dedupeKey), while a re-pledge that declines
 * later (new declinedAt) legitimately emails again.
 */
export function getPledgeDeclineRecoveryDedupeKey(pledge: {
  declinedAt: Date;
  id: string;
}): string {
  return `${TASK_FUNDING_PLEDGE_DECLINE_TEMPLATE_ID}:${pledge.id}:${pledge.declinedAt.getTime()}`;
}

/** "visa" + "4242" -> "Visa card ending 4242"; missing details -> "saved card". */
export function formatSavedCardLabel(
  cardBrand: string | null | undefined,
  cardLast4: string | null | undefined,
): string {
  const brand = cardBrand?.trim();
  const brandLabel = brand
    ? `${brand.charAt(0).toUpperCase()}${brand.slice(1)}`
    : null;
  const last4 = cardLast4?.trim();
  if (brandLabel && last4) return `${brandLabel} card ending ${last4}`;
  if (last4) return `card ending ${last4}`;
  return "saved card";
}

/** Integer cents -> "$25" / "$25.50". Whole-dollar amounts drop the cents. */
export function formatPledgeAmountLabel(amountCents: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
    style: "currency",
  }).format(amountCents / 100);
}

export interface SendPledgeDeclineRecoveryEmailInput {
  /** The declined charge amount in integer cents. */
  amountCents: number;
  pledge: {
    cardBrand?: string | null;
    cardLast4?: string | null;
    declinedAt: Date;
    id: string;
    /** Drives suppression bookkeeping + unsubscribe URL. Null = cannot send. */
    pledgedByUserId: string | null;
  };
  task: {
    id: string;
    title: string;
  };
  toEmail: string;
}

export type SendPledgeDeclineRecoveryEmailResult =
  | SendResult
  | { status: "duplicate" }
  | { reason: "no_user"; status: "skipped" };

export const TASK_FUNDING_PLEDGE_DECLINE_PREVIEW: EmailPreview = {
  templateId: TASK_FUNDING_PLEDGE_DECLINE_TEMPLATE_ID,
  displayName: "Pledge card declined — pay-now recovery",
  trigger:
    "Fires once per decline when a task funding target fully funds and the off-session charge on a pledger's saved card fails (card declined, expired, or blocked by SCA). Links to the task's funding section where the on-session pay-now checkout succeeds where the saved card could not.",
  scope: "account_security",
  from: () => formatDefaultSystemEmailFromHeader(),
  subject: () => TASK_FUNDING_PLEDGE_DECLINE_SUBJECT,
  skipWishoniaSignature: false,
  renderReact: () =>
    React.createElement(TaskFundingPledgeDeclineReactEmail, {
      amountLabel: "$25",
      cardLabel: "Visa card ending 4242",
      payNowUrl: `https://warondisease.org/tasks/${SAMPLE_TASK_ID}#funding`,
      taskTitle: "Establish the Court of Humanity",
    }),
};

export async function sendPledgeDeclineRecoveryEmail(
  input: SendPledgeDeclineRecoveryEmailInput,
): Promise<SendPledgeDeclineRecoveryEmailResult> {
  const userId = input.pledge.pledgedByUserId;
  if (!userId) {
    // Card-backed pledges are created by signed-in users, so this only
    // happens for legacy/organization rows; there is no User to attach the
    // suppression + unsubscribe machinery to, so we skip rather than throw.
    log.warn("Pledge decline email skipped: pledge has no user", {
      pledgeId: input.pledge.id,
      taskId: input.task.id,
    });
    return { reason: "no_user", status: "skipped" };
  }

  return sendDedupedEmail({
    authorization: transactionalSend("task_funding_pledge_decline"),
    dedupeKey: getPledgeDeclineRecoveryDedupeKey(input.pledge),
    templateId: TASK_FUNDING_PLEDGE_DECLINE_TEMPLATE_ID,
    subject: TASK_FUNDING_PLEDGE_DECLINE_SUBJECT,
    react: React.createElement(TaskFundingPledgeDeclineReactEmail, {
      amountLabel: formatPledgeAmountLabel(input.amountCents),
      cardLabel: formatSavedCardLabel(
        input.pledge.cardBrand,
        input.pledge.cardLast4,
      ),
      payNowUrl: getTaskFundingSectionUrl(input.task.id),
      taskTitle: input.task.title,
    }),
    userId,
    toAddress: input.toEmail,
    scope: "account_security",
    skipWishoniaSignature: false,
  });
}
