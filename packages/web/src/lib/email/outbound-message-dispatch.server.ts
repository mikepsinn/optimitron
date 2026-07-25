/**
 * Sends a message a human approved — and nothing else.
 *
 * Approving in the UI calls this. It rebuilds the outbound payload from the
 * live draft, re-hashes it, and refuses to dispatch unless that hash still
 * matches what the approver signed. Editing a draft after approval, or letting
 * an approval sit past its window, means no email.
 *
 * Safe to call twice: the request's APPROVED→terminal write is conditional, the
 * draft is only sent while it is still DRAFT, and the EmailLog dedupe key
 * catches anything that slips past both.
 */
import { ExternalActionRequestStatus } from "@optimitron/db/enums";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  authorizeApprovedSend,
  OutboundApprovalError,
} from "@/lib/email/outbound-authorization.server";
import {
  OUTBOUND_MESSAGE_OPERATION,
  outboundMessageApprovalPayload,
} from "@/lib/email/outbound-message-approval.server";
import {
  expireExternalActionRequest,
  finalizeApprovedExternalAction,
} from "@/lib/tasks/external-action.server";
import {
  getStoredMessage,
  sendDraftTaskNotification,
} from "@/lib/tasks/task-notifications.server";

const log = createLogger("outbound-message-dispatch");

export type DispatchOutboundMessageResult =
  | { status: "sent"; providerMessageId?: string | null }
  | { status: "already_dispatched" }
  | { status: "expired" }
  | { status: "not_approved" }
  | { status: "unsupported_operation" }
  | { status: "failed"; reason: string };

function readPayloadString(payload: unknown, key: string): string | null {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
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

  const communicationId = readPayloadString(
    request.payloadJson,
    "communicationId",
  );
  if (!communicationId) {
    return { status: "failed", reason: "payload_missing_communication" };
  }

  const communication = await prisma.taskCommunication.findUnique({
    where: { id: communicationId },
    select: {
      deletedAt: true,
      id: true,
      metadataJson: true,
      recipientEmail: true,
      senderUserId: true,
    },
  });
  if (!communication || communication.deletedAt) {
    return { status: "failed", reason: "draft_not_found" };
  }
  const message = getStoredMessage(communication.metadataJson);
  if (!message || !communication.recipientEmail) {
    return { status: "failed", reason: "draft_missing_message" };
  }

  // Rebuild what is about to go out, from the live draft, and let
  // authorizeApprovedSend compare it to the approved hash.
  const from = readPayloadString(request.payloadJson, "from");
  const livePayload = outboundMessageApprovalPayload({
    communicationId: communication.id,
    from,
    html: message.html ?? null,
    recipientEmail: communication.recipientEmail,
    subject: message.subject,
    text: message.text,
  });

  let authorization;
  try {
    authorization = await authorizeApprovedSend({
      destination: request.destination,
      externalActionRequestId: request.id,
      now,
      operation: request.operation,
      payload: livePayload,
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

  try {
    const result = await sendDraftTaskNotification({
      authorization,
      communicationId: communication.id,
      from,
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

    // Already-processed drafts mean a concurrent dispatch won the race; the
    // conditional terminal write below is what actually decides.
    if (result.status === "already_processed") {
      return { status: "already_dispatched" };
    }

    const reason =
      result.status === "suppressed"
        ? `suppressed:${result.reason}`
        : result.status;
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
    await finalizeApprovedExternalAction({
      executedByUserId: input.approverUserId,
      externalActionRequestId: request.id,
      failureMessage: reason,
      now,
      result: "FAILED",
    });
    return { status: "failed", reason };
  }
}
