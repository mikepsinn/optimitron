/**
 * Agent-initiated messages queue here instead of going out.
 *
 * Assigning a task to a person, a comment notification, or a reminder trigger
 * used to reach the recipient's inbox with no human in the loop. Each of those
 * paths now draft the message as before and then propose it as an
 * `ExternalActionRequest`, which stays PENDING until a task manager approves
 * it on the task. Owner-initiated sends from the web UI are unaffected.
 *
 * The approved payload is the exact provider envelope — recipients, headers,
 * subject, text, and HTML. Dispatch sends that immutable snapshot rather than
 * rebuilding it from mutable task state.
 */
import { TaskCommunicationStatus } from "@optimitron/db/enums";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { prepareTaskNotificationForApproval } from "@/lib/tasks/task-notifications.server";
import {
  proposeExternalAction,
  type ExternalActionDb,
} from "@/lib/tasks/external-action.server";

export const OUTBOUND_MESSAGE_OPERATION = "outbound_message.email";

/** Long enough to survive a weekend, short enough that stale mail dies. */
export const OUTBOUND_APPROVAL_WINDOW_MS = 72 * 60 * 60 * 1_000;

const ResendProviderEnvelopeSchema = z
  .object({
    bcc: z.array(z.string().min(1)).optional(),
    from: z.string().min(1),
    headers: z.record(z.string()).optional(),
    html: z.string(),
    replyTo: z.string().min(1).optional(),
    subject: z.string(),
    text: z.string(),
    to: z.tuple([z.string().min(1)]),
  })
  .strict();

export const OutboundMessageApprovalPayloadSchema = z
  .object({
    /**
     * Human-readable, immutable context shown beside the exact provider
     * envelope at approval time. The provider never receives this object.
     */
    approvalContext: z.record(z.unknown()).optional(),
    communicationId: z.string().min(1),
    delivery: z
      .object({
        recipientUserId: z.string().min(1).nullable(),
        scope: z.enum([
          "all",
          "onboarding",
          "task_notifications",
          "magic_link",
          "account_security",
        ]),
      })
      .strict(),
    emailLogId: z.string().min(1),
    envelope: ResendProviderEnvelopeSchema,
    version: z.union([z.literal(2), z.literal(3)]),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.version === 3 && !value.approvalContext) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Version 3 outbound approvals require approvalContext",
        path: ["approvalContext"],
      });
    }
    if (value.version === 2 && value.approvalContext) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Version 2 outbound approvals cannot include approvalContext",
        path: ["approvalContext"],
      });
    }
  });

export type OutboundMessageApprovalPayload = z.infer<
  typeof OutboundMessageApprovalPayloadSchema
>;

/**
 * Canonical approval payload. The exact provider envelope is resolved once at
 * propose time and dispatched without rebuilding it from mutable state.
 */
export function outboundMessageApprovalPayload(
  payload: OutboundMessageApprovalPayload,
): Record<string, unknown> {
  return OutboundMessageApprovalPayloadSchema.parse(payload);
}

export function outboundMessageIdempotencyKey(communicationId: string) {
  return `outbound-message:v2:${communicationId}`;
}

/**
 * Queue a drafted message for human approval. Returns the PENDING request.
 *
 * If proposing throws, the draft is marked FAILED before the error propagates.
 * A draft left at DRAFT with no request behind it is invisible to the approval
 * queue and never retried — a message that silently goes nowhere is exactly the
 * failure mode this whole gate exists to avoid.
 */
export async function proposeOutboundMessage(input: {
  /** Whoever's action produced the draft, when there is one. */
  actorUserId?: string | null;
  /** Immutable non-provider context the human must see before approval. */
  approvalContext?: Record<string, unknown> | null;
  communicationId: string;
  /** Caller's open transaction, when the draft was written inside one. */
  db?: ExternalActionDb;
  from?: string | null;
  now?: Date;
  taskId: string;
}) {
  const now = input.now ?? new Date();
  try {
    const prepared = await prepareTaskNotificationForApproval({
      communicationId: input.communicationId,
      db: input.db,
      from: input.from ?? null,
      taskId: input.taskId,
    });
    const payload = outboundMessageApprovalPayload({
      ...(input.approvalContext
        ? { approvalContext: input.approvalContext }
        : {}),
      communicationId: input.communicationId,
      delivery: prepared.delivery,
      emailLogId: prepared.emailLogId,
      envelope: prepared.envelope,
      version: input.approvalContext ? 3 : 2,
    });
    return await proposeExternalAction(
      {
        destination: prepared.envelope.to[0],
        expiresAt: new Date(
          now.getTime() + OUTBOUND_APPROVAL_WINDOW_MS,
        ).toISOString(),
        idempotencyKey: outboundMessageIdempotencyKey(input.communicationId),
        operation: OUTBOUND_MESSAGE_OPERATION,
        payload,
        taskId: input.taskId,
      },
      input.actorUserId ?? null,
      { db: input.db, systemProposal: true },
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    // Best effort: inside a caller transaction poisoned by the original error
    // this write also fails, and the draft rolls back with everything else.
    await (input.db ?? prisma).taskCommunication
      .updateMany({
        where: {
          id: input.communicationId,
          status: TaskCommunicationStatus.DRAFT,
        },
        data: {
          errorMessage: `approval_request_failed: ${reason}`,
          failedAt: now,
          status: TaskCommunicationStatus.FAILED,
        },
      })
      .catch(() => undefined);
    throw error;
  }
}
