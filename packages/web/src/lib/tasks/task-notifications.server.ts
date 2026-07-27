import { createHash } from "node:crypto";
import { nanoid } from "nanoid";
import {
  EmailLogStatus,
  TaskCommentKind,
  TaskCommentSource,
  TaskCommunicationAudience,
  TaskCommunicationChannel,
  TaskCommunicationDirection,
  TaskCommunicationFormat,
  TaskCommunicationPurpose,
  TaskCommunicationStatus,
  type TaskCommunicationAudience as TaskCommunicationAudienceValue,
  type TaskCommunicationChannel as TaskCommunicationChannelValue,
  type TaskCommunicationFormat as TaskCommunicationFormatValue,
  type TaskCommunicationPurpose as TaskCommunicationPurposeValue,
} from "@optimitron/db/enums";
import type { Prisma } from "@optimitron/db";
import {
  claimEmailLog,
  markEmailLogStatus,
} from "@/lib/email/email-log.server";
import { WAR_ON_DISEASE_REPLY_DOMAIN } from "@optimitron/db/system-identities";
import {
  isEmailScope,
  isTransactionalScope,
  type EmailScope,
} from "@/lib/email/scopes";
import type { SendAuthorization } from "@/lib/email/outbound-authorization.server";
import {
  prepareResendProviderEnvelope,
  ResendDeliveryError,
  sendExternalResendEmail,
  sendPreparedResendEmail,
  sendResendEmail,
  type ResendProviderEnvelope,
} from "@/lib/email/resend";
import { getConfiguredTaskReplyAddress } from "@/lib/email/task-notification";
import { buildUnsubscribeUrl } from "@/lib/email/unsub-url";
import {
  WISHONIA_SIGNATURE_TITLE,
  WISHONIA_TAGLINES,
  type WishoniaSignatureSelection,
} from "@/lib/email/wishonia-signature";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/url";

export interface TaskNotificationMessage {
  html?: string | null;
  subject: string;
  text: string;
}

export interface DraftTaskNotificationInput extends TaskNotificationMessage {
  audience?: TaskCommunicationAudienceValue;
  channel?: TaskCommunicationChannelValue;
  bccEmails?: string[] | null;
  dedupeKey?: string | null;
  emailScope?: EmailScope | null;
  endpointId?: string | null;
  format?: TaskCommunicationFormatValue;
  metadataJson?: Prisma.InputJsonObject | null;
  nextSendAt?: Date | null;
  purpose?: TaskCommunicationPurposeValue;
  recipientEmail?: string | null;
  recipientName?: string | null;
  recipientOrganizationId?: string | null;
  recipientPersonId?: string | null;
  recipientUserId?: string | null;
  referralInvitationId?: string | null;
  senderName?: string | null;
  senderPersonId?: string | null;
  senderUserId?: string | null;
  shareAttemptId?: string | null;
  skipWishoniaSignature?: boolean;
  skipUserSuppressionCheck?: boolean;
  step?: number;
  /**
   * When the caller has already created a TaskComment that represents this
   * outbound message, pass its id here so we don't create a second AGENT
   * audit row in `sendDraftTaskNotification`.
   */
  taskCommentId?: string | null;
  taskId: string;
  templateId?: string | null;
  templateVariantId?: string | null;
  unsubscribeUrl?: string | null;
}

export interface SendTaskNotificationInput extends DraftTaskNotificationInput {
  /** Who said to send this — see `@/lib/email/outbound-authorization.server`. */
  authorization: SendAuthorization;
  from?: string | null;
  now?: Date;
}

export interface SendDraftTaskNotificationInput {
  /** Who said to send this — see `@/lib/email/outbound-authorization.server`. */
  authorization: SendAuthorization;
  communicationId: string;
  from?: string | null;
  now?: Date;
  senderUserId?: string | null;
  /** Immutable provider request approved through ExternalActionRequest. */
  approvedDelivery?: {
    emailLogId: string;
    envelope: ResendProviderEnvelope;
    idempotencyKey: string;
    recipientUserId: string | null;
    scope: EmailScope;
  };
}

type TaskNotificationDb = Pick<Prisma.TransactionClient, "taskCommunication">;
const RESEND_IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1_000;

export interface PreparedTaskNotificationApproval {
  delivery: {
    recipientUserId: string | null;
    scope: EmailScope;
  };
  emailLogId: string;
  envelope: ResendProviderEnvelope;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPlainTextHtml(text: string) {
  return [
    `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111827;">`,
    `<p>${escapeHtml(text).replace(/\n/g, "<br />")}</p>`,
    `</div>`,
  ].join("");
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

function toNormalizedEmailList(emails: string[] | null | undefined) {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const value of emails ?? []) {
    const email = normalizeEmail(value);
    if (!email || seen.has(email)) continue;
    seen.add(email);
    normalized.push(email);
  }

  return normalized;
}

function removeRecipientFromBcc(input: {
  bccEmails: string[] | null;
  recipientEmail: string | null;
}) {
  if (!input.recipientEmail) return input.bccEmails;
  return (
    input.bccEmails?.filter((email) => email !== input.recipientEmail) ?? null
  );
}

function buildTaskCommunicationUnsubscribeUrl(input: {
  communicationId: string;
  unsubscribeToken: string;
}) {
  const url = new URL("/api/task-communications/unsubscribe", getBaseUrl());
  url.searchParams.set("c", input.communicationId);
  url.searchParams.set("t", input.unsubscribeToken);
  return url.toString();
}

function getMetadata(
  input: DraftTaskNotificationInput & {
    unsubscribeToken: string | null;
  },
) {
  return {
    ...(input.metadataJson ?? {}),
    dedupeKey: input.dedupeKey ?? null,
    bccEmails: input.bccEmails ?? null,
    html: input.html ?? null,
    emailScope: input.emailScope ?? null,
    skipWishoniaSignature: input.skipWishoniaSignature ?? false,
    skipUserSuppressionCheck: input.skipUserSuppressionCheck ?? false,
    subject: input.subject,
    text: input.text,
    unsubscribeUrl:
      input.unsubscribeUrl ??
      (input.unsubscribeToken
        ? buildTaskCommunicationUnsubscribeUrl({
            communicationId: "",
            unsubscribeToken: input.unsubscribeToken,
          })
        : null),
  } satisfies Prisma.InputJsonObject;
}

function replaceDraftUnsubscribeUrl(
  metadata: Prisma.InputJsonObject,
  communicationId: string,
  unsubscribeToken: string | null,
) {
  if (!unsubscribeToken) {
    return metadata;
  }

  return {
    ...metadata,
    unsubscribeUrl: buildTaskCommunicationUnsubscribeUrl({
      communicationId,
      unsubscribeToken,
    }),
  } satisfies Prisma.InputJsonObject;
}

/** Exported so the approval dispatcher can rebuild the exact approved bytes. */
export function getStoredMessage(
  metadata: unknown,
): TaskNotificationMessage | null {
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return null;
  }
  const record = metadata as Record<string, unknown>;
  if (typeof record.subject !== "string" || typeof record.text !== "string") {
    return null;
  }

  return {
    html: typeof record.html === "string" ? record.html : null,
    subject: record.subject,
    text: record.text,
  };
}

function getStoredUnsubscribeUrl(metadata: unknown) {
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return null;
  }
  const value = (metadata as Record<string, unknown>).unsubscribeUrl;
  return typeof value === "string" && value.trim() ? value : null;
}

function getStoredReplyTo(metadata: unknown) {
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return null;
  }
  const value = (metadata as Record<string, unknown>).replyTo;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getStoredDedupeKey(metadata: unknown) {
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return null;
  }
  const value = (metadata as Record<string, unknown>).dedupeKey;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getStoredBccEmails(metadata: unknown) {
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return [];
  }

  const value = (metadata as Record<string, unknown>).bccEmails;
  if (!Array.isArray(value)) {
    return [];
  }

  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of value) {
    const normalized = normalizeEmail(typeof raw === "string" ? raw : null);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function getStoredUserEmailOptions(metadata: unknown): {
  emailScope: EmailScope;
  skipWishoniaSignature: boolean;
  skipSuppressionCheck: boolean;
} {
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return {
      emailScope: "task_notifications",
      skipWishoniaSignature: false,
      skipSuppressionCheck: false,
    };
  }

  const record = metadata as Record<string, unknown>;
  return {
    emailScope: isEmailScope(record.emailScope)
      ? record.emailScope
      : "task_notifications",
    skipWishoniaSignature: record.skipWishoniaSignature === true,
    skipSuppressionCheck: record.skipUserSuppressionCheck === true,
  };
}

function asMetadataObject(metadata: unknown): Prisma.InputJsonObject {
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return {};
  }
  return metadata as Prisma.InputJsonObject;
}

function sanitizeMessageIdPart(value: string) {
  return value.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function buildTaskCommunicationMessageId(input: {
  communicationId: string;
  taskId: string;
}) {
  return `<task-${sanitizeMessageIdPart(input.taskId)}-comm-${sanitizeMessageIdPart(
    input.communicationId,
  )}@${WAR_ON_DISEASE_REPLY_DOMAIN}>`;
}

function getStoredMessageId(metadata: unknown) {
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return null;
  }
  const value = (metadata as Record<string, unknown>).messageId;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function getPriorThreadMessageId(input: {
  communicationId: string;
  db?: TaskNotificationDb;
  recipientEmail: string;
  taskId: string;
}) {
  const prior = await (input.db ?? prisma).taskCommunication.findFirst({
    where: {
      channel: TaskCommunicationChannel.EMAIL,
      deletedAt: null,
      direction: TaskCommunicationDirection.OUTBOUND,
      id: { not: input.communicationId },
      recipientEmail: input.recipientEmail,
      status: TaskCommunicationStatus.SENT,
      taskId: input.taskId,
    },
    orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
    select: { metadataJson: true },
  });

  return getStoredMessageId(prior?.metadataJson);
}

function deterministicWishoniaSelection(
  communicationId: string,
): WishoniaSignatureSelection {
  const digest = createHash("sha256").update(communicationId).digest();
  return {
    title: WISHONIA_SIGNATURE_TITLE,
    tagline:
      WISHONIA_TAGLINES[digest.readUInt32BE(4) % WISHONIA_TAGLINES.length]!,
  };
}

/** Resolve and freeze the exact Resend request before asking for approval. */
export async function prepareTaskNotificationForApproval(input: {
  communicationId: string;
  db?: TaskNotificationDb;
  from: string | null;
  taskId: string;
}): Promise<PreparedTaskNotificationApproval> {
  const db = input.db ?? prisma;
  const communication = await db.taskCommunication.findFirst({
    where: {
      deletedAt: null,
      id: input.communicationId,
      status: TaskCommunicationStatus.DRAFT,
      taskId: input.taskId,
    },
    select: {
      id: true,
      metadataJson: true,
      recipientEmail: true,
      recipientUserId: true,
      taskId: true,
    },
  });
  if (!communication || !communication.recipientEmail) {
    throw new Error("Task notification draft not found");
  }

  const storedMessage = getStoredMessage(communication.metadataJson);
  if (!storedMessage) throw new Error("Task notification draft has no message");

  const emailOptions = getStoredUserEmailOptions(communication.metadataJson);
  const emailLogId = `approved-task-email:${communication.id}`;
  const unsubscribeUrl = communication.recipientUserId
    ? isTransactionalScope(emailOptions.emailScope)
      ? null
      : buildUnsubscribeUrl({
          emailLogId,
          scope: emailOptions.emailScope,
          userId: communication.recipientUserId,
        })
    : getStoredUnsubscribeUrl(communication.metadataJson);
  const messageId = buildTaskCommunicationMessageId({
    communicationId: communication.id,
    taskId: communication.taskId,
  });
  const priorMessageId = await getPriorThreadMessageId({
    communicationId: communication.id,
    db,
    recipientEmail: communication.recipientEmail,
    taskId: communication.taskId,
  });
  const replyTo =
    getStoredReplyTo(communication.metadataJson) ??
    getConfiguredTaskReplyAddress(communication.taskId);
  const envelope = prepareResendProviderEnvelope({
    bcc: getStoredBccEmails(communication.metadataJson),
    from: input.from,
    headers: buildThreadHeaders({ messageId, priorMessageId }),
    html: storedMessage.html ?? renderPlainTextHtml(storedMessage.text),
    replyTo,
    scope: emailOptions.emailScope,
    skipWishoniaSignature: emailOptions.skipWishoniaSignature,
    subject: storedMessage.subject,
    text: storedMessage.text,
    to: communication.recipientEmail,
    unsubscribeUrl,
    wishoniaSelection: deterministicWishoniaSelection(communication.id),
  });

  return {
    delivery: {
      recipientUserId: communication.recipientUserId,
      scope: emailOptions.emailScope,
    },
    emailLogId,
    envelope,
  };
}

function buildThreadHeaders(input: {
  messageId: string;
  priorMessageId: string | null;
}) {
  return {
    "Message-ID": input.messageId,
    ...(input.priorMessageId
      ? {
          "In-Reply-To": input.priorMessageId,
          References: input.priorMessageId,
        }
      : {}),
  };
}

async function findExternalOptOut(input: { recipientEmail: string }) {
  return prisma.taskCommunication.findFirst({
    where: {
      cancelledAt: { not: null },
      channel: TaskCommunicationChannel.EMAIL,
      deletedAt: null,
      OR: [
        { metadataJson: { path: ["optOut"], equals: true } },
        { errorMessage: { contains: "unsubscribed", mode: "insensitive" } },
      ],
      recipientEmail: normalizeEmail(input.recipientEmail),
      status: TaskCommunicationStatus.CANCELLED,
      unsubscribeToken: { not: null },
    },
    orderBy: { cancelledAt: "desc" },
    select: { errorMessage: true, id: true, metadataJson: true },
  });
}

export async function draftTaskNotification(input: DraftTaskNotificationInput) {
  const recipientEmail = normalizeEmail(input.recipientEmail);
  const audience = input.audience ?? TaskCommunicationAudience.ASSIGNEE;
  const purpose = input.purpose ?? TaskCommunicationPurpose.ASSIGNMENT;
  const unsubscribeToken =
    recipientEmail && !input.recipientUserId && !input.unsubscribeUrl
      ? nanoid(32)
      : null;
  const adminBccEmails = input.bccEmails ?? null;
  const bccEmails = toNormalizedEmailList(
    removeRecipientFromBcc({
      bccEmails: toNormalizedEmailList(adminBccEmails),
      recipientEmail,
    }),
  );
  const metadataInput = { ...input, bccEmails, unsubscribeToken };
  const initialMetadata = getMetadata(metadataInput);

  const communication = await prisma.taskCommunication.create({
    data: {
      audience,
      channel: input.channel ?? TaskCommunicationChannel.EMAIL,
      direction: TaskCommunicationDirection.OUTBOUND,
      endpointId: input.endpointId ?? null,
      externalUrl: recipientEmail ? `mailto:${recipientEmail}` : null,
      format: input.format ?? TaskCommunicationFormat.DEFAULT,
      metadataJson: initialMetadata,
      nextSendAt: input.nextSendAt ?? null,
      purpose,
      recipientEmail,
      recipientNameSnapshot: input.recipientName ?? null,
      recipientOrganizationId: input.recipientOrganizationId ?? null,
      recipientPersonId: input.recipientPersonId ?? null,
      recipientUserId: input.recipientUserId ?? null,
      referralInvitationId: input.referralInvitationId ?? null,
      senderNameSnapshot: input.senderName ?? null,
      senderPersonId: input.senderPersonId ?? null,
      senderUserId: input.senderUserId ?? null,
      shareAttemptId: input.shareAttemptId ?? null,
      status: TaskCommunicationStatus.DRAFT,
      step: input.step ?? 0,
      taskCommentId: input.taskCommentId ?? null,
      taskId: input.taskId,
      templateId: input.templateId ?? null,
      templateVariantId: input.templateVariantId ?? null,
      unsubscribeToken,
    },
  });

  if (!unsubscribeToken || input.unsubscribeUrl) {
    return communication;
  }

  return prisma.taskCommunication.update({
    where: { id: communication.id },
    data: {
      metadataJson: replaceDraftUnsubscribeUrl(
        initialMetadata,
        communication.id,
        unsubscribeToken,
      ),
    },
  });
}

async function markCommunicationFailed(input: {
  communicationId: string;
  emailLogId?: string | null;
  errorMessage: string;
}) {
  await prisma.taskCommunication.update({
    where: { id: input.communicationId },
    data: {
      errorMessage: input.errorMessage,
      failedAt: new Date(),
      status: TaskCommunicationStatus.FAILED,
      ...(input.emailLogId ? { emailLogId: input.emailLogId } : {}),
    },
  });
}

export async function sendDraftTaskNotification(
  input: SendDraftTaskNotificationInput,
) {
  const now = input.now ?? new Date();
  const communication = await prisma.taskCommunication.findUnique({
    where: { id: input.communicationId },
    include: {
      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!communication || communication.deletedAt) {
    return { status: "not_found" as const };
  }
  if (communication.status !== TaskCommunicationStatus.DRAFT) {
    return { status: "already_processed" as const, communication };
  }
  if (communication.channel !== TaskCommunicationChannel.EMAIL) {
    return { status: "unsupported_channel" as const, communication };
  }
  if (!communication.recipientEmail) {
    return { status: "missing_recipient_email" as const, communication };
  }

  const message = getStoredMessage(communication.metadataJson);
  if (!message) {
    return { status: "missing_message" as const, communication };
  }

  const optedOut = await findExternalOptOut({
    recipientEmail: communication.recipientEmail,
  });
  if (optedOut) {
    await prisma.taskCommunication.update({
      where: { id: communication.id },
      data: {
        cancelledAt: now,
        errorMessage: "Recipient previously unsubscribed from task emails.",
        status: TaskCommunicationStatus.CANCELLED,
      },
    });
    return {
      status: "suppressed" as const,
      reason: "external_opt_out" as const,
    };
  }

  const emailLogId = input.approvedDelivery?.emailLogId ?? nanoid();
  const templateId =
    communication.templateId ??
    `task_notification:${communication.purpose.toLowerCase()}:step_${communication.step}`;
  const dedupeKey =
    getStoredDedupeKey(communication.metadataJson) ??
    [
      "task-notification",
      communication.taskId,
      communication.recipientEmail,
      communication.purpose,
      communication.step,
    ].join(":");
  const claimed = await claimEmailLog({
    dedupeKey,
    id: emailLogId,
    now,
    sendContext: {
      communicationId: communication.id,
      purpose: communication.purpose,
      step: communication.step,
      taskId: communication.taskId,
    } satisfies Prisma.InputJsonObject,
    subject: message.subject,
    templateId,
    toAddress: communication.recipientEmail,
    userId: communication.recipientUserId ?? null,
  });

  if (claimed.duplicate && input.approvedDelivery) {
    const existing = await prisma.emailLog.findUnique({
      where: { id: emailLogId },
      select: {
        createdAt: true,
        errorMessage: true,
        providerMessageId: true,
        status: true,
      },
    });
    if (
      existing &&
      existing.status !== EmailLogStatus.QUEUED &&
      existing.status !== EmailLogStatus.FAILED
    ) {
      return {
        emailLogId,
        providerMessageId: existing.providerMessageId,
        status: "already_sent" as const,
      };
    }
    if (!existing || existing.status === EmailLogStatus.FAILED) {
      return { status: "duplicate" as const };
    }
    if (
      !existing.errorMessage?.startsWith("send_held:") &&
      now.getTime() - existing.createdAt.getTime() >=
        RESEND_IDEMPOTENCY_WINDOW_MS
    ) {
      return {
        reason: "manual_reconciliation_required",
        status: "retryable" as const,
      };
    }
  } else if (claimed.duplicate || !claimed.emailLogId) {
    await prisma.taskCommunication.update({
      where: { id: communication.id },
      data: {
        cancelledAt: now,
        emailLogId: null,
        errorMessage: "Duplicate task notification suppressed.",
        status: TaskCommunicationStatus.CANCELLED,
      },
    });
    return { status: "duplicate" as const };
  }

  const deliveryEmailLogId = input.approvedDelivery
    ? emailLogId
    : claimed.emailLogId!;
  try {
    const approved = input.approvedDelivery;
    const userEmailOptions = approved
      ? null
      : getStoredUserEmailOptions(communication.metadataJson);
    const messageId =
      approved?.envelope.headers?.["Message-ID"] ??
      buildTaskCommunicationMessageId({
        communicationId: communication.id,
        taskId: communication.taskId,
      });
    const priorMessageId = approved
      ? (approved.envelope.headers?.["In-Reply-To"] ?? null)
      : await getPriorThreadMessageId({
          communicationId: communication.id,
          recipientEmail: communication.recipientEmail,
          taskId: communication.taskId,
        });
    const headers = approved
      ? approved.envelope.headers
      : buildThreadHeaders({ messageId, priorMessageId });
    const result = approved
      ? await sendPreparedResendEmail({
          authorization: input.authorization,
          envelope: approved.envelope,
          idempotencyKey: approved.idempotencyKey,
          recipientUserId: approved.recipientUserId,
          scope: approved.scope,
        })
      : communication.recipientUserId
        ? await sendResendEmail({
            authorization: input.authorization,
            emailLogId: deliveryEmailLogId,
            from: input.from ?? undefined,
            html: message.html ?? renderPlainTextHtml(message.text),
            bcc: getStoredBccEmails(communication.metadataJson),
            headers,
            replyTo:
              getConfiguredTaskReplyAddress(communication.taskId) ?? undefined,
            scope: userEmailOptions!.emailScope,
            skipWishoniaSignature: userEmailOptions!.skipWishoniaSignature,
            skipSuppressionCheck: userEmailOptions!.skipSuppressionCheck,
            subject: message.subject,
            text: message.text,
            to: communication.recipientEmail,
            userId: communication.recipientUserId,
          })
        : await sendExternalResendEmail({
            authorization: input.authorization,
            from: input.from ?? undefined,
            html: message.html ?? renderPlainTextHtml(message.text),
            bcc: getStoredBccEmails(communication.metadataJson),
            headers,
            scope: userEmailOptions!.emailScope,
            subject: message.subject,
            text: message.text,
            to: communication.recipientEmail,
            replyTo:
              getConfiguredTaskReplyAddress(communication.taskId) ?? undefined,
            skipWishoniaSignature: userEmailOptions!.skipWishoniaSignature,
            unsubscribeUrl: getStoredUnsubscribeUrl(communication.metadataJson),
          });

    if (result.status !== "sent") {
      // Keep the concrete suppression reason (user_opt_out /
      // outbound_mode_off / recipient_not_allowlisted) visible in the
      // EmailLog + TaskCommunication audit trail.
      const abortReason =
        result.status === "suppressed"
          ? `${result.status}:${result.reason}`
          : result.status;
      if (
        approved &&
        (result.status === "disabled" ||
          (result.status === "suppressed" && result.reason !== "user_opt_out"))
      ) {
        await markEmailLogStatus({
          emailLogId: deliveryEmailLogId,
          errorMessage: `send_held:${abortReason}`,
          status: EmailLogStatus.QUEUED,
        });
        return { reason: abortReason, status: "retryable" as const };
      }
      await markEmailLogStatus({
        emailLogId: deliveryEmailLogId,
        errorMessage: `send_aborted:${abortReason}`,
        status: EmailLogStatus.FAILED,
      });
      await markCommunicationFailed({
        communicationId: communication.id,
        emailLogId: deliveryEmailLogId,
        errorMessage: `send_aborted:${abortReason}`,
      });
      return result;
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.emailLog.update({
        where: { id: deliveryEmailLogId },
        data: {
          errorMessage: null,
          providerMessageId: result.id,
          status: EmailLogStatus.SENT,
        },
      });

      // Reuse the caller-provided taskCommentId if it's already set on the
      // draft (e.g. postTaskCommentAndNotify created the user-visible comment
      // before drafting). Otherwise create the AGENT audit-log comment so
      // there's still a row in the task feed for outbound emails the cron
      // sends without a pre-existing comment.
      let auditCommentId = communication.taskCommentId;
      if (!auditCommentId) {
        const comment = await tx.taskComment.create({
          data: {
            authorUserId: input.senderUserId ?? communication.senderUserId,
            kind: TaskCommentKind.OUTBOUND_MESSAGE,
            message: message.text,
            source: TaskCommentSource.AGENT,
            taskId: communication.taskId,
          },
        });
        auditCommentId = comment.id;
      }

      return tx.taskCommunication.update({
        where: { id: communication.id },
        data: {
          emailLogId: deliveryEmailLogId,
          errorMessage: null,
          metadataJson: {
            ...asMetadataObject(communication.metadataJson),
            inReplyTo: priorMessageId,
            messageId,
            references: priorMessageId ? [priorMessageId] : [],
          } satisfies Prisma.InputJsonObject,
          providerMessageId: result.id,
          sentAt: now,
          status: TaskCommunicationStatus.SENT,
          taskCommentId: auditCommentId,
        },
      });
    });

    return {
      communication: updated,
      emailLogId: deliveryEmailLogId,
      providerMessageId: result.id,
      status: "sent" as const,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      input.approvedDelivery &&
      (!(error instanceof ResendDeliveryError) || error.retryable)
    ) {
      await markEmailLogStatus({
        emailLogId: deliveryEmailLogId,
        errorMessage,
        status: EmailLogStatus.QUEUED,
      }).catch(() => undefined);
      return {
        reason:
          error instanceof ResendDeliveryError ? error.code : errorMessage,
        status: "retryable" as const,
      };
    }
    await markEmailLogStatus({
      emailLogId: deliveryEmailLogId,
      errorMessage,
      status: EmailLogStatus.FAILED,
    });
    await markCommunicationFailed({
      communicationId: communication.id,
      emailLogId: deliveryEmailLogId,
      errorMessage,
    });
    if (input.approvedDelivery && error instanceof ResendDeliveryError) {
      return { reason: error.code, status: "failed" as const };
    }
    throw error;
  }
}

export async function sendTaskNotification(input: SendTaskNotificationInput) {
  const draft = await draftTaskNotification(input);
  return sendDraftTaskNotification({
    authorization: input.authorization,
    communicationId: draft.id,
    from: input.from ?? null,
    now: input.now,
    senderUserId: input.senderUserId ?? null,
  });
}

export async function unsubscribeTaskCommunication(input: {
  communicationId: string;
  token: string;
}) {
  const communication = await prisma.taskCommunication.findFirst({
    where: {
      id: input.communicationId,
      unsubscribeToken: input.token,
      deletedAt: null,
    },
    select: { id: true, metadataJson: true },
  });

  if (!communication) {
    return false;
  }

  const now = new Date();
  await prisma.taskCommunication.update({
    where: { id: communication.id },
    data: {
      cancelledAt: now,
      errorMessage: "Recipient unsubscribed from this task communication.",
      metadataJson: {
        ...asMetadataObject(communication.metadataJson),
        optOut: true,
        optOutAt: now.toISOString(),
      },
      status: TaskCommunicationStatus.CANCELLED,
    },
  });

  return true;
}

function normalizeInReplyToHeader(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.match(/<[^>]+>/)?.[0] ?? trimmed;
}

export async function unsubscribeTaskCommunicationByReply(input: {
  inReplyTo?: string | null;
  recipientEmail: string;
  taskId?: string | null;
}) {
  const recipientEmail = normalizeEmail(input.recipientEmail);
  if (!recipientEmail) {
    return { status: "skipped" as const, reason: "missing_recipient_email" };
  }

  const inReplyTo = normalizeInReplyToHeader(input.inReplyTo);
  // Replies can only target communications that actually reached the recipient,
  // so DRAFT/FAILED rows are excluded — they were never delivered.
  const baseWhere = {
    channel: TaskCommunicationChannel.EMAIL,
    deletedAt: null,
    direction: TaskCommunicationDirection.OUTBOUND,
    recipientEmail,
    status: TaskCommunicationStatus.SENT,
    unsubscribeToken: { not: null },
    ...(input.taskId ? { taskId: input.taskId } : {}),
  } as const;

  // Prefer the exact message the recipient replied to; fall back to the most
  // recent matching row when the inbound headers do not let us pinpoint it.
  const communication =
    (inReplyTo
      ? await prisma.taskCommunication.findFirst({
          where: {
            ...baseWhere,
            metadataJson: { path: ["messageId"], equals: inReplyTo },
          },
          orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
          select: { id: true, metadataJson: true },
        })
      : null) ??
    (await prisma.taskCommunication.findFirst({
      where: baseWhere,
      orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
      select: { id: true, metadataJson: true },
    }));

  if (!communication) {
    return { status: "skipped" as const, reason: "no_matching_communication" };
  }

  const now = new Date();
  await prisma.taskCommunication.update({
    where: { id: communication.id },
    data: {
      cancelledAt: now,
      errorMessage: "Recipient unsubscribed by email reply.",
      metadataJson: {
        ...asMetadataObject(communication.metadataJson),
        optOut: true,
        optOutAt: now.toISOString(),
        optOutVia: "reply",
      } satisfies Prisma.InputJsonObject,
      status: TaskCommunicationStatus.CANCELLED,
    },
  });

  return {
    status: "unsubscribed" as const,
    taskCommunicationId: communication.id,
  };
}
