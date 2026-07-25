/**
 * Agent-initiated messages queue here instead of going out.
 *
 * Assigning a task to a person, a comment notification, or a reminder trigger
 * used to reach the recipient's inbox with no human in the loop. Each of those
 * paths now drafts the message as before and then proposes it as an
 * `ExternalActionRequest`, which lands PENDING until a human approves it at
 * /admin/communications. Owner-initiated sends from the web UI are unaffected.
 *
 * The approved payload is the message itself — recipient, subject, text, html,
 * From header — so a draft edited after approval no longer matches the hash the
 * approver signed, and `outbound-message-dispatch.server.ts` refuses it.
 */
import {
  proposeExternalAction,
  type ExternalActionDb,
} from "@/lib/tasks/external-action.server";

export const OUTBOUND_MESSAGE_OPERATION = "outbound_message.email";

/** Long enough to survive a weekend, short enough that stale mail dies. */
export const OUTBOUND_APPROVAL_WINDOW_MS = 72 * 60 * 60 * 1_000;

export interface OutboundMessageApprovalContent {
  communicationId: string;
  from: string | null;
  html: string | null;
  recipientEmail: string;
  subject: string;
  text: string;
}

/**
 * Canonical approval payload. Built here at propose time and rebuilt from live
 * rows at dispatch time — the two must agree byte for byte, so every field
 * that changes what the recipient sees belongs in it.
 */
export function outboundMessageApprovalPayload(
  content: OutboundMessageApprovalContent,
): Record<string, unknown> {
  return {
    communicationId: content.communicationId,
    from: content.from,
    html: content.html,
    recipientEmail: content.recipientEmail.trim().toLowerCase(),
    subject: content.subject,
    text: content.text,
  };
}

export function outboundMessageIdempotencyKey(communicationId: string) {
  return `outbound-message:${communicationId}`;
}

/**
 * Queue a drafted message for human approval. Returns the PENDING request.
 */
export async function proposeOutboundMessage(input: {
  /** Whoever's action produced the draft, when there is one. */
  actorUserId?: string | null;
  content: OutboundMessageApprovalContent;
  /** Caller's open transaction, when the draft was written inside one. */
  db?: ExternalActionDb;
  now?: Date;
  taskId: string;
}) {
  const now = input.now ?? new Date();
  return proposeExternalAction(
    {
      destination: input.content.recipientEmail.trim().toLowerCase(),
      expiresAt: new Date(
        now.getTime() + OUTBOUND_APPROVAL_WINDOW_MS,
      ).toISOString(),
      idempotencyKey: outboundMessageIdempotencyKey(
        input.content.communicationId,
      ),
      operation: OUTBOUND_MESSAGE_OPERATION,
      payload: outboundMessageApprovalPayload(input.content),
      taskId: input.taskId,
    },
    input.actorUserId ?? null,
    { db: input.db, systemProposal: true },
  );
}
