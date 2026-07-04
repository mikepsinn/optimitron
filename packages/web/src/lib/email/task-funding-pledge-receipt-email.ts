/**
 * Pledge charge-receipt email. Sent once when an off-session pledge charge
 * SUCCEEDS: the target fully funded, the saved card was charged as pledged,
 * and the pledger gets a receipt naming the amount, the card, and the
 * bank-statement descriptor — the cheapest chargeback prevention there is.
 *
 * Dedupe: keyed on `pledge-receipt:{pledgeId}` via the shared EmailLog
 * dedupe-key mechanism. A pledge fulfills at most once, so the key carries
 * no timestamp — the sync confirm path and a replayed webhook settlement can
 * both fire the send and at most one email goes out.
 *
 * Statement descriptor: no `statement_descriptor` is configured anywhere in
 * this codebase (verified by grep), so Stripe applies the account default.
 * The call site passes `charge.calculated_statement_descriptor` — the final
 * string Stripe computed for the actual charge — and the copy falls back to
 * stating the account-default fact when the lookup failed.
 */

import React from "react";
import { formatDefaultSystemEmailFromHeader } from "@/lib/email/from-address";
import {
  SAMPLE_TASK_ID,
  type EmailPreview,
} from "@/lib/email/preview-envelope";
import type { SendResult } from "@/lib/email/resend";
import { sendDedupedEmail } from "@/lib/email/send-deduped-email.server";
import {
  formatPledgeAmountLabel,
  formatSavedCardLabel,
  getTaskFundingSectionUrl,
} from "@/lib/email/task-funding-pledge-decline-email";
import { TaskFundingPledgeReceiptReactEmail } from "@/lib/email/task-funding-pledge-receipt-react-email";
import { createLogger } from "@/lib/logger";

const log = createLogger("task-funding-pledge-receipt-email");

export const TASK_FUNDING_PLEDGE_RECEIPT_TEMPLATE_ID =
  "task-funding-pledge-receipt";

/**
 * Subjects get scanned, not read. This bounds only the variable part — the
 * task title — so the full subject ("Receipt: $X charged for <title>") can
 * still run to ~90 characters; clients truncate the tail of the title, and
 * the amount and "Receipt:" lead always survive because they come first.
 */
export const PLEDGE_RECEIPT_SUBJECT_TITLE_MAX_LENGTH = 60;

export function truncateTaskTitleForSubject(title: string): string {
  const normalized = title.trim().replace(/\s+/gu, " ");
  if (normalized.length <= PLEDGE_RECEIPT_SUBJECT_TITLE_MAX_LENGTH) {
    return normalized;
  }
  return `${normalized
    .slice(0, PLEDGE_RECEIPT_SUBJECT_TITLE_MAX_LENGTH - 1)
    .trimEnd()}…`;
}

export function buildPledgeReceiptSubject(
  amountCents: number,
  taskTitle: string,
): string {
  return `Receipt: ${formatPledgeAmountLabel(amountCents)} charged for ${truncateTaskTitleForSubject(taskTitle)}`;
}

/**
 * One receipt per pledge, ever. A successful charge is a terminal pledge
 * transition (ACTIVE -> FULFILLED happens at most once), so no timestamp in
 * the key — unlike declines, which can legitimately recur per re-pledge.
 */
export function getPledgeReceiptDedupeKey(pledgeId: string): string {
  return `pledge-receipt:${pledgeId}`;
}

export interface SendPledgeChargeReceiptEmailInput {
  /** The charged amount in integer cents. */
  amountCents: number;
  pledge: {
    cardBrand?: string | null;
    cardLast4?: string | null;
    id: string;
    /** Drives suppression bookkeeping + unsubscribe URL. Null = cannot send. */
    pledgedByUserId: string | null;
  };
  /** `charge.calculated_statement_descriptor`; null when the lookup failed. */
  statementDescriptor: string | null;
  task: {
    id: string;
    title: string;
  };
  toEmail: string;
}

export type SendPledgeChargeReceiptEmailResult =
  | SendResult
  | { status: "duplicate" }
  | { reason: "no_user"; status: "skipped" };

export const TASK_FUNDING_PLEDGE_RECEIPT_PREVIEW: EmailPreview = {
  templateId: TASK_FUNDING_PLEDGE_RECEIPT_TEMPLATE_ID,
  displayName: "Pledge charged — receipt",
  trigger:
    "Fires once per pledge when a task funding target fully funds and the off-session charge on the pledger's saved card succeeds (sync confirm or webhook settlement — both funnel through the same success transition). Names the amount, card, and bank-statement descriptor so the pledger recognizes the charge instead of disputing it.",
  scope: "account_security",
  from: () => formatDefaultSystemEmailFromHeader(),
  subject: () =>
    buildPledgeReceiptSubject(2500, "Establish the Court of Humanity"),
  skipWishoniaSignature: false,
  renderReact: () =>
    React.createElement(TaskFundingPledgeReceiptReactEmail, {
      amountLabel: "$25",
      cardLabel: "Visa card ending 4242",
      fundingUrl: `https://warondisease.org/tasks/${SAMPLE_TASK_ID}#funding`,
      // No statement_descriptor is configured in this codebase, so the
      // preview shows the honest account-default fallback rather than an
      // invented descriptor string. Real sends quote the descriptor Stripe
      // computed for the actual charge.
      statementDescriptor: null,
      taskTitle: "Establish the Court of Humanity",
    }),
};

export async function sendPledgeChargeReceiptEmail(
  input: SendPledgeChargeReceiptEmailInput,
): Promise<SendPledgeChargeReceiptEmailResult> {
  const userId = input.pledge.pledgedByUserId;
  if (!userId) {
    // Card-backed pledges are created by signed-in users, so this only
    // happens for legacy/organization rows; there is no User to attach the
    // suppression + unsubscribe machinery to, so we skip rather than throw.
    log.warn("Pledge receipt email skipped: pledge has no user", {
      pledgeId: input.pledge.id,
      taskId: input.task.id,
    });
    return { reason: "no_user", status: "skipped" };
  }

  return sendDedupedEmail({
    dedupeKey: getPledgeReceiptDedupeKey(input.pledge.id),
    templateId: TASK_FUNDING_PLEDGE_RECEIPT_TEMPLATE_ID,
    subject: buildPledgeReceiptSubject(input.amountCents, input.task.title),
    react: React.createElement(TaskFundingPledgeReceiptReactEmail, {
      amountLabel: formatPledgeAmountLabel(input.amountCents),
      cardLabel: formatSavedCardLabel(
        input.pledge.cardBrand,
        input.pledge.cardLast4,
      ),
      fundingUrl: getTaskFundingSectionUrl(input.task.id),
      statementDescriptor: input.statementDescriptor,
      taskTitle: input.task.title,
    }),
    userId,
    toAddress: input.toEmail,
    scope: "account_security",
    skipWishoniaSignature: false,
  });
}
