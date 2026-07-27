/**
 * Sends a message a human approved — and nothing else.
 *
 * Approving in the UI calls this. It validates the stored immutable envelope
 * against the hash the human approved, then sends that exact envelope. Letting
 * an approval sit past its window means no email.
 *
 * Safe to call twice: the request's APPROVED→terminal write is conditional, the
 * draft is only sent while it is still DRAFT, and the EmailLog dedupe key
 * catches anything that slips past both.
 */
import {
  ExternalActionRequestStatus,
  TaskCommunicationStatus,
} from "@optimitron/db/enums";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  authorizeApprovedSend,
  OutboundApprovalError,
} from "@/lib/email/outbound-authorization.server";
import {
  OUTBOUND_MESSAGE_OPERATION,
  OutboundMessageApprovalPayloadSchema,
  outboundMessageIdempotencyKey,
} from "@/lib/email/outbound-message-approval.server";
import {
  expireExternalActionRequest,
  finalizeApprovedExternalAction,
} from "@/lib/tasks/external-action.server";
import {
  getCommunicationBatchKey,
  getPrivateReviewApprovalContext,
} from "@/lib/tasks/private-review-invitation-contracts";
import {
  evaluatePrivateReviewOutreachSuppression,
  privateReviewTaskMatchesApprovalContext,
} from "@/lib/tasks/private-review-outreach-safety.server";
import {
  releaseRecipientRateLimitSlot,
  reserveRecipientRateLimitSlot,
} from "@/lib/tasks/task-recipient-rate-limit.server";
import { sendDraftTaskNotification } from "@/lib/tasks/task-notifications.server";

const log = createLogger("outbound-message-dispatch");

export type DispatchOutboundMessageResult =
  | { status: "sent"; providerMessageId?: string | null }
  | { status: "already_dispatched" }
  | { status: "expired" }
  | { status: "not_approved" }
  | { status: "retryable"; reason: string }
  | { status: "unsupported_operation" }
  | { status: "failed"; reason: string };

async function recordRetryableFailure(requestId: string, reason: string) {
  await prisma.externalActionRequest.updateMany({
    where: {
      id: requestId,
      status: ExternalActionRequestStatus.APPROVED,
    },
    data: { failureMessage: `retryable:${reason}` },
  });
}

export async function dispatchApprovedOutboundMessage(input: {
  /** The approver — recorded as the executor on the terminal request row. */
  approverUserId: string;
  externalActionRequestId: string;
  now?: Date;
}): Promise<DispatchOutboundMessageResult> {
  const now = input.now ?? new Date();
  const request = await prisma.externalActionRequest.findFirst({
    where: { deletedAt: null, id: input.externalActionRequestId },
    select: {
      destination: true,
      id: true,
      operation: true,
      payloadJson: true,
      status: true,
      taskId: true,
    },
  });
  if (!request) return { status: "failed", reason: "request_not_found" };
  if (request.operation !== OUTBOUND_MESSAGE_OPERATION) {
    return { status: "unsupported_operation" };
  }
  if (
    request.status === ExternalActionRequestStatus.EXECUTED ||
    request.status === ExternalActionRequestStatus.FAILED
  ) {
    return { status: "already_dispatched" };
  }
  if (request.status === ExternalActionRequestStatus.EXPIRED) {
    return { status: "expired" };
  }
  if (request.status !== ExternalActionRequestStatus.APPROVED) {
    return { status: "not_approved" };
  }

  const parsedPayload = OutboundMessageApprovalPayloadSchema.safeParse(
    request.payloadJson,
  );
  if (!parsedPayload.success) {
    await finalizeApprovedExternalAction({
      executedByUserId: input.approverUserId,
      externalActionRequestId: request.id,
      failureMessage: "invalid_outbound_message_payload",
      now,
      result: "FAILED",
    });
    return { status: "failed", reason: "invalid_payload" };
  }
  const payload = parsedPayload.data;
  if (request.destination !== payload.envelope.to[0]) {
    await finalizeApprovedExternalAction({
      executedByUserId: input.approverUserId,
      externalActionRequestId: request.id,
      failureMessage: "destination_does_not_match_provider_envelope",
      now,
      result: "FAILED",
    });
    return { status: "failed", reason: "destination_mismatch" };
  }

  const communication = await prisma.taskCommunication.findFirst({
    where: {
      id: payload.communicationId,
      taskId: request.taskId,
    },
    select: {
      deletedAt: true,
      emailLogId: true,
      id: true,
      metadataJson: true,
      providerMessageId: true,
      recipientEmail: true,
      recipientPersonId: true,
      senderUserId: true,
      status: true,
    },
  });
  if (!communication || communication.deletedAt) {
    await finalizeApprovedExternalAction({
      executedByUserId: input.approverUserId,
      externalActionRequestId: request.id,
      failureMessage: "task_scoped_draft_not_found",
      now,
      result: "FAILED",
    });
    return { status: "failed", reason: "draft_not_found" };
  }

  const reviewContext = getPrivateReviewApprovalContext(
    payload.approvalContext,
  );
  if (reviewContext) {
    const liveBindingMatches =
      await privateReviewTaskMatchesApprovalContext(reviewContext);
    if (
      !liveBindingMatches ||
      reviewContext.taskId !== request.taskId ||
      reviewContext.recipientPersonId !== communication.recipientPersonId ||
      reviewContext.batchKey !==
        getCommunicationBatchKey(communication.metadataJson) ||
      !communication.recipientEmail
    ) {
      await finalizeApprovedExternalAction({
        executedByUserId: input.approverUserId,
        externalActionRequestId: request.id,
        failureMessage: "private_review_invitation_binding_mismatch",
        now,
        result: "FAILED",
      });
      return { status: "failed", reason: "review_binding_mismatch" };
    }
    const suppressionReason = await evaluatePrivateReviewOutreachSuppression({
      communicationId: communication.id,
      now,
      recipientEmail: communication.recipientEmail,
      recipientPersonId: communication.recipientPersonId,
      taskId: request.taskId,
    });
    if (suppressionReason) {
      await prisma.taskCommunication.updateMany({
        where: {
          id: communication.id,
          status: TaskCommunicationStatus.DRAFT,
        },
        data: {
          cancelledAt: now,
          errorMessage: `Review invitation suppressed: ${suppressionReason}.`,
          status: TaskCommunicationStatus.CANCELLED,
        },
      });
      await finalizeApprovedExternalAction({
        executedByUserId: input.approverUserId,
        externalActionRequestId: request.id,
        failureMessage: `suppressed:${suppressionReason}`,
        now,
        result: "FAILED",
      });
      return {
        status: "failed",
        reason: `suppressed:${suppressionReason}`,
      };
    }
  }

  let authorization;
  try {
    authorization = await authorizeApprovedSend({
      destination: request.destination,
      externalActionRequestId: request.id,
      now,
      operation: request.operation,
      payload,
    });
  } catch (error) {
    if (error instanceof OutboundApprovalError) {
      if (error.code === "expired") {
        await expireExternalActionRequest(request.id);
        return { status: "expired" };
      }
      await finalizeApprovedExternalAction({
        executedByUserId: input.approverUserId,
        externalActionRequestId: request.id,
        failureMessage: error.message,
        now,
        result: "FAILED",
      });
      return { status: "failed", reason: error.code };
    }
    throw error;
  }

  if (communication.status === TaskCommunicationStatus.SENT) {
    await finalizeApprovedExternalAction({
      executedByUserId: input.approverUserId,
      externalActionRequestId: request.id,
      now,
      receipt: {
        emailLogId: communication.emailLogId,
        providerMessageId: communication.providerMessageId,
        taskCommunicationId: communication.id,
      },
      result: "EXECUTED",
    });
    return { status: "already_dispatched" };
  }

  let recipientRateLimitReserved = false;
  if (reviewContext) {
    const reservation = await reserveRecipientRateLimitSlot({
      communicationId: communication.id,
      emailLogId: payload.emailLogId,
      now,
      recipientEmail: communication.recipientEmail!,
      recipientUserId: payload.delivery.recipientUserId,
      subject: payload.envelope.subject,
      taskId: request.taskId,
    });
    if (reservation.status === "rate_limited") {
      // A retry may already own an older QUEUED reservation. It lost the live
      // cap to a newer send, so close that held slot with the draft.
      await releaseRecipientRateLimitSlot({
        communicationId: communication.id,
        emailLogId: payload.emailLogId,
        reason: "recipient_rate_limited",
      });
      await prisma.taskCommunication.updateMany({
        where: {
          id: communication.id,
          status: TaskCommunicationStatus.DRAFT,
        },
        data: {
          cancelledAt: now,
          errorMessage: "Review invitation suppressed: recipient_rate_limited.",
          status: TaskCommunicationStatus.CANCELLED,
        },
      });
      await finalizeApprovedExternalAction({
        executedByUserId: input.approverUserId,
        externalActionRequestId: request.id,
        failureMessage: "suppressed:recipient_rate_limited",
        now,
        result: "FAILED",
      });
      return {
        status: "failed",
        reason: "suppressed:recipient_rate_limited",
      };
    }
    if (reservation.status === "conflict") {
      await finalizeApprovedExternalAction({
        executedByUserId: input.approverUserId,
        externalActionRequestId: request.id,
        failureMessage: "recipient_rate_limit_reservation_conflict",
        now,
        result: "FAILED",
      });
      return { status: "failed", reason: "rate_limit_reservation_conflict" };
    }
    recipientRateLimitReserved = reservation.status === "reserved";
  }

  const releaseRecipientReservation = async (reason: string) => {
    if (!recipientRateLimitReserved) return;
    await releaseRecipientRateLimitSlot({
      communicationId: communication.id,
      emailLogId: payload.emailLogId,
      reason,
    });
  };

  try {
    // Approval, authorization, and quota reservation can take long enough for
    // an ordinary document edit to supersede the pinned revision. Repeat the
    // live binding check at the last practical boundary before provider I/O.
    if (
      reviewContext &&
      !(await privateReviewTaskMatchesApprovalContext(reviewContext))
    ) {
      await releaseRecipientReservation("review_binding_mismatch");
      await prisma.taskCommunication.updateMany({
        where: {
          id: communication.id,
          status: TaskCommunicationStatus.DRAFT,
        },
        data: {
          cancelledAt: now,
          errorMessage:
            "Review invitation cancelled because its document revision is no longer current.",
          status: TaskCommunicationStatus.CANCELLED,
        },
      });
      await finalizeApprovedExternalAction({
        executedByUserId: input.approverUserId,
        externalActionRequestId: request.id,
        failureMessage: "private_review_invitation_binding_mismatch",
        now,
        result: "FAILED",
      });
      return { status: "failed", reason: "review_binding_mismatch" };
    }

    const result = await sendDraftTaskNotification({
      approvedDelivery: {
        emailLogId: payload.emailLogId,
        envelope: payload.envelope,
        idempotencyKey: outboundMessageIdempotencyKey(payload.communicationId),
        recipientUserId: payload.delivery.recipientUserId,
        scope: payload.delivery.scope,
      },
      authorization,
      communicationId: communication.id,
      now,
      senderUserId: communication.senderUserId,
    });

    if (result.status === "sent") {
      await finalizeApprovedExternalAction({
        executedByUserId: input.approverUserId,
        externalActionRequestId: request.id,
        now,
        receipt: {
          emailLogId: result.emailLogId,
          providerMessageId: result.providerMessageId ?? null,
          taskCommunicationId: communication.id,
        },
        result: "EXECUTED",
      });
      return { status: "sent", providerMessageId: result.providerMessageId };
    }

    if (result.status === "already_sent") {
      await finalizeApprovedExternalAction({
        executedByUserId: input.approverUserId,
        externalActionRequestId: request.id,
        now,
        receipt: {
          emailLogId: result.emailLogId,
          providerMessageId: result.providerMessageId ?? null,
          taskCommunicationId: communication.id,
        },
        result: "EXECUTED",
      });
      return { status: "already_dispatched" };
    }

    if (result.status === "retryable") {
      await recordRetryableFailure(request.id, result.reason);
      return { status: "retryable", reason: result.reason };
    }

    // The draft left DRAFT without this call sending it — usually a concurrent
    // dispatcher that already closed the request, in which case
    // finalizeApprovedExternalAction returns the terminal row untouched. If it
    // left DRAFT some other way, close the request here rather than leaving it
    // APPROVED with its draft already consumed until the window expires.
    if (result.status === "already_processed") {
      if (result.communication.status === TaskCommunicationStatus.SENT) {
        await finalizeApprovedExternalAction({
          executedByUserId: input.approverUserId,
          externalActionRequestId: request.id,
          now,
          receipt: {
            emailLogId: result.communication.emailLogId,
            providerMessageId: result.communication.providerMessageId,
            taskCommunicationId: result.communication.id,
          },
          result: "EXECUTED",
        });
        return { status: "already_dispatched" };
      }
      await releaseRecipientReservation("draft_already_processed");
      await finalizeApprovedExternalAction({
        executedByUserId: input.approverUserId,
        externalActionRequestId: request.id,
        failureMessage: "draft_already_processed",
        now,
        result: "FAILED",
      });
      return { status: "already_dispatched" };
    }

    const reason =
      result.status === "suppressed"
        ? `suppressed:${result.reason}`
        : result.status;
    await releaseRecipientReservation(reason);
    await finalizeApprovedExternalAction({
      executedByUserId: input.approverUserId,
      externalActionRequestId: request.id,
      failureMessage: reason,
      now,
      result: "FAILED",
    });
    return { status: "failed", reason };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    log.error("Approved outbound message failed to dispatch", {
      error,
      externalActionRequestId: request.id,
    });
    await recordRetryableFailure(request.id, reason);
    return { status: "retryable", reason };
  }
}
