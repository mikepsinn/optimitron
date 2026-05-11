/**
 * Shared dedupe-send wrapper. Centralizes the claim/send/mark dance that
 * every one-shot triggered email follows: claim an `EmailLog` row by
 * dedupe key, attempt the Resend call, and write the terminal status
 * (`SENT` with provider id, `FAILED` with `send_aborted:<reason>` for
 * non-sent results, or `FAILED` with the error message for thrown errors).
 *
 * Use this for any email that has a one-shot dedupe scope. Bulk / queue
 * paths that need a different status protocol (e.g. task notifications,
 * which also update a `TaskCommunication` row in the same transaction)
 * should keep their bespoke wrapper.
 */
import { nanoid } from "nanoid";
import {
  claimEmailLog,
  markEmailLogStatus,
} from "@/lib/email/email-log.server";
import { sendResendEmail, type SendResult } from "@/lib/email/resend";

interface SendDedupedEmailInput {
  /** Dedupe scope. Two calls with the same `dedupeKey` will only send once. */
  dedupeKey: string;
  /** Stable template id stored on the EmailLog row, also used in logs. */
  templateId: string;
  /** Subject line stored on the EmailLog + delivered via Resend. */
  subject: string;
  /** Plain-text body. */
  text: string;
  /** HTML body. */
  html: string;
  /** Recipient's `User.id` — feeds suppression + unsubscribe URL. */
  userId: string;
  /** Recipient's email address. */
  toAddress: string;
  /** Resend scope (drives suppression + unsubscribe link). */
  scope: Parameters<typeof sendResendEmail>[0]["scope"];
  /**
   * Triggered transactional emails authored on behalf of a real human
   * (forward-friendly share, first-conversion ping) suppress the generic
   * Wishonia sign-off because the body owns the voice.
   */
  skipWishoniaSignature?: boolean;
}

export async function sendDedupedEmail(
  input: SendDedupedEmailInput,
): Promise<SendResult | { status: "duplicate" }> {
  const emailLogId = nanoid();
  const now = new Date();

  const claimed = await claimEmailLog({
    dedupeKey: input.dedupeKey,
    id: emailLogId,
    now,
    subject: input.subject,
    templateId: input.templateId,
    toAddress: input.toAddress,
    userId: input.userId,
  });

  if (claimed.duplicate || !claimed.emailLogId) {
    return { status: "duplicate" };
  }

  try {
    const result = await sendResendEmail({
      emailLogId: claimed.emailLogId,
      html: input.html,
      scope: input.scope,
      skipWishoniaSignature: input.skipWishoniaSignature,
      subject: input.subject,
      text: input.text,
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
      // disabled / suppressed — terminal, not a retryable failure, but we
      // still mark FAILED so the row doesn't sit in QUEUED forever and so
      // operators can see why nothing went out.
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
