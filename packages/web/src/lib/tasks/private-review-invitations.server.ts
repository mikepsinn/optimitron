import {
  TaskClaimPolicy,
  TaskCommunicationAudience,
  TaskCommunicationChannel,
  TaskCommunicationPurpose,
  TaskCommunicationStatus,
  TaskStatus,
  type Prisma,
} from "@optimitron/db";
import { formatShareEmailFromHeader } from "@/lib/email/from-address";
import { proposeOutboundMessage } from "@/lib/email/outbound-message-approval.server";
import { lockContentResources } from "@/lib/content-access.server";
import { prisma } from "@/lib/prisma";
import { readReviewRequest } from "@/lib/tasks/document-review-contracts";
import { documentReviewBindingMatches } from "@/lib/tasks/document-review-binding.server";
import {
  getTaskAccessWhere,
  getTaskClientAccessWhere,
  type TaskClientAccessBoundary,
} from "@/lib/tasks/task-visibility.server";
import {
  buildPrivateReviewInvitationEmail,
  getPrivateReviewSignInUrl,
} from "@/lib/tasks/private-review-invitation-email.server";
import {
  getPrivateReviewBatchKey,
  PRIVATE_REVIEW_INVITATION_SCHEMA,
  PrivateReviewInvitationApprovalContextSchema,
  ProposePrivateReviewInvitationSchema,
} from "@/lib/tasks/private-review-invitation-contracts";
import { evaluatePrivateReviewOutreachSuppression } from "@/lib/tasks/private-review-outreach-safety.server";
import { draftTaskNotification } from "@/lib/tasks/task-notifications.server";

export {
  evaluatePrivateReviewOutreachSuppression,
  type PrivateReviewOutreachSuppressionReason,
} from "@/lib/tasks/private-review-outreach-safety.server";

export const PRIVATE_REVIEW_REMINDER_DELAY_MS = 7 * 24 * 60 * 60 * 1_000;

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() || null;
}

function invitationKey(input: {
  kind: "INVITATION" | "REMINDER";
  recipientPersonId: string;
  revisionId: string;
  taskId: string;
}) {
  return [
    "private-review",
    "v1",
    input.kind.toLowerCase(),
    input.taskId,
    input.recipientPersonId,
    input.revisionId,
  ].join(":");
}

type InvitationLookupDb = Pick<
  Prisma.TransactionClient,
  "externalActionRequest" | "taskCommunication"
>;

async function findExistingInvitation(
  key: string,
  db: InvitationLookupDb = prisma,
) {
  const communication = await db.taskCommunication.findFirst({
    where: {
      deletedAt: null,
      metadataJson: { path: ["reviewInvitationKey"], equals: key },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      metadataJson: true,
      sentAt: true,
      status: true,
    },
  });
  if (!communication) return null;
  const request = await db.externalActionRequest.findUnique({
    where: { idempotencyKey: `outbound-message:v2:${communication.id}` },
    select: { id: true, payloadHash: true, status: true },
  });
  return { communication, request };
}

export async function proposePrivateReviewInvitation(
  rawInput: unknown,
  actorUserId: string,
  options?: {
    clientAccessBoundary?: TaskClientAccessBoundary;
    now?: Date;
  },
) {
  const input = ProposePrivateReviewInvitationSchema.parse(rawInput);
  const now = options?.now ?? new Date();
  const actor = await prisma.user.findFirst({
    where: { deletedAt: null, id: actorUserId },
    select: {
      id: true,
      person: { select: { displayName: true } },
      personId: true,
    },
  });
  if (!actor) throw new Error("Task not found");

  const task = await prisma.task.findFirst({
    where: {
      AND: [
        { deletedAt: null, id: input.taskId },
        getTaskAccessWhere({
          action: "MANAGE",
          personId: actor.personId,
          userId: actor.id,
        }),
        ...(options?.clientAccessBoundary
          ? [getTaskClientAccessWhere(options.clientAccessBoundary)]
          : []),
      ],
    },
    select: {
      applicationPolicy: true,
      assigneePerson: {
        select: {
          displayName: true,
          email: true,
          id: true,
          user: { select: { email: true, id: true } },
        },
      },
      assigneePersonId: true,
      claimPolicy: true,
      contextJson: true,
      createdByUserId: true,
      executionMode: true,
      id: true,
      isPublic: true,
      jurisdictionId: true,
      ownerOrganizationId: true,
      parentTaskId: true,
      status: true,
      taskKey: true,
    },
  });
  if (!task) throw new Error("Task not found");
  if (
    task.isPublic ||
    task.claimPolicy !== TaskClaimPolicy.ASSIGNED_ONLY ||
    task.status !== TaskStatus.ACTIVE
  ) {
    throw new Error(
      "Private review invitations require an active private ASSIGNED_ONLY task",
    );
  }
  if (
    task.assigneePersonId !== input.recipientPersonId ||
    task.assigneePerson?.id !== input.recipientPersonId
  ) {
    throw new Error("Reviewer must be the task's assigned Person");
  }
  if (task.assigneePerson.user?.id === actorUserId) {
    throw new Error("A manager cannot invite themself as the reviewer");
  }
  const recipientEmail = normalizeEmail(
    task.assigneePerson.email ?? task.assigneePerson.user?.email,
  );
  if (!recipientEmail)
    throw new Error("Assigned reviewer has no email address");

  const reviewRequest = readReviewRequest(task.contextJson);
  if (
    !reviewRequest ||
    !(await documentReviewBindingMatches(task, reviewRequest)) ||
    reviewRequest.target.documentId !== input.revision.documentId ||
    reviewRequest.target.revisionId !== input.revision.documentRevisionId ||
    reviewRequest.target.version !== input.revision.documentVersion ||
    reviewRequest.target.contentHash !== input.revision.contentHash
  ) {
    throw new Error(
      "Invitation revision must exactly match the task's document review request",
    );
  }
  const batchKey = getPrivateReviewBatchKey({
    authorityTaskId: reviewRequest.authorityTaskId,
    revision: input.revision,
  });

  const revision = await prisma.documentRevision.findFirst({
    where: {
      contentHash: input.revision.contentHash,
      deletedAt: null,
      document: {
        currentRevisionId: input.revision.documentRevisionId,
        deletedAt: null,
        version: input.revision.documentVersion,
      },
      documentId: input.revision.documentId,
      id: input.revision.documentRevisionId,
      version: input.revision.documentVersion,
    },
    select: {
      document: { select: { currentRevisionId: true, version: true } },
      id: true,
    },
  });
  if (
    !revision ||
    revision.document.currentRevisionId !== revision.id ||
    revision.document.version !== input.revision.documentVersion
  ) {
    throw new Error("Pinned document revision is no longer current");
  }

  const key = invitationKey({
    kind: input.kind,
    recipientPersonId: input.recipientPersonId,
    revisionId: input.revision.documentRevisionId,
    taskId: input.taskId,
  });
  // A fast lookup avoids changing idempotent replay into a suppression result,
  // but only the post-lock lookup is authoritative enough to return.
  const existingBeforeLock = await findExistingInvitation(key);
  if (!existingBeforeLock) {
    const suppressionReason = await evaluatePrivateReviewOutreachSuppression({
      now,
      recipientEmail,
      recipientPersonId: input.recipientPersonId,
      taskId: input.taskId,
    });
    if (suppressionReason) {
      return { reason: suppressionReason, status: "suppressed" as const };
    }
  }
  const senderName = actor.person?.displayName?.trim() || null;
  return prisma.$transaction(async (tx) => {
    // Lock documents before tasks everywhere these invitation batches are
    // frozen. This serializes a generic document edit with the final current-
    // revision check and keeps the lock order consistent with batch approval.
    await lockContentResources(tx, [
      { id: input.revision.documentId, type: "document" },
    ]);
    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Task" WHERE "id" = ${input.taskId} FOR UPDATE
    `;

    const lockedTask = await tx.task.findFirst({
      where: {
        AND: [
          { deletedAt: null, id: input.taskId },
          getTaskAccessWhere({
            action: "MANAGE",
            personId: actor.personId,
            userId: actor.id,
          }),
          ...(options?.clientAccessBoundary
            ? [getTaskClientAccessWhere(options.clientAccessBoundary)]
            : []),
        ],
      },
      select: {
        applicationPolicy: true,
        assigneePerson: {
          select: {
            displayName: true,
            email: true,
            id: true,
            user: { select: { email: true, id: true } },
          },
        },
        assigneePersonId: true,
        claimPolicy: true,
        contextJson: true,
        createdByUserId: true,
        executionMode: true,
        id: true,
        isPublic: true,
        jurisdictionId: true,
        ownerOrganizationId: true,
        parentTaskId: true,
        status: true,
        taskKey: true,
      },
    });
    if (!lockedTask) throw new Error("Task not found");
    if (
      lockedTask.isPublic ||
      lockedTask.claimPolicy !== TaskClaimPolicy.ASSIGNED_ONLY ||
      lockedTask.status !== TaskStatus.ACTIVE
    ) {
      throw new Error(
        "Private review invitations require an active private ASSIGNED_ONLY task",
      );
    }
    if (
      lockedTask.assigneePersonId !== input.recipientPersonId ||
      lockedTask.assigneePerson?.id !== input.recipientPersonId
    ) {
      throw new Error("Reviewer must be the task's assigned Person");
    }
    if (lockedTask.assigneePerson.user?.id === actorUserId) {
      throw new Error("A manager cannot invite themself as the reviewer");
    }
    const lockedRecipientEmail = normalizeEmail(
      lockedTask.assigneePerson.email ?? lockedTask.assigneePerson.user?.email,
    );
    if (!lockedRecipientEmail) {
      throw new Error("Assigned reviewer has no email address");
    }
    const lockedReviewRequest = readReviewRequest(lockedTask.contextJson);
    if (
      !lockedReviewRequest ||
      !(await documentReviewBindingMatches(lockedTask, lockedReviewRequest)) ||
      lockedReviewRequest.target.documentId !== input.revision.documentId ||
      lockedReviewRequest.target.revisionId !==
        input.revision.documentRevisionId ||
      lockedReviewRequest.target.version !== input.revision.documentVersion ||
      lockedReviewRequest.target.contentHash !== input.revision.contentHash
    ) {
      throw new Error(
        "Invitation revision must exactly match the task's document review request",
      );
    }
    const lockedRevision = await tx.documentRevision.findFirst({
      where: {
        contentHash: input.revision.contentHash,
        deletedAt: null,
        document: {
          currentRevisionId: input.revision.documentRevisionId,
          deletedAt: null,
          version: input.revision.documentVersion,
        },
        documentId: input.revision.documentId,
        id: input.revision.documentRevisionId,
        version: input.revision.documentVersion,
      },
      select: {
        document: { select: { currentRevisionId: true, version: true } },
        id: true,
      },
    });
    if (
      !lockedRevision ||
      lockedRevision.document.currentRevisionId !== lockedRevision.id ||
      lockedRevision.document.version !== input.revision.documentVersion
    ) {
      throw new Error("Pinned document revision is no longer current");
    }
    const lockedBatchKey = getPrivateReviewBatchKey({
      authorityTaskId: lockedReviewRequest.authorityTaskId,
      revision: input.revision,
    });
    if (lockedBatchKey !== batchKey) {
      throw new Error("Review invitation batch changed while drafting");
    }
    const approvalContext = PrivateReviewInvitationApprovalContextSchema.parse({
      authorityTaskId: lockedReviewRequest.authorityTaskId,
      batchKey: lockedBatchKey,
      kind: input.kind,
      recipientPersonId: input.recipientPersonId,
      revision: input.revision,
      schema: PRIVATE_REVIEW_INVITATION_SCHEMA,
      taskId: input.taskId,
    });

    const lockedExisting = await findExistingInvitation(key, tx);
    if (lockedExisting) {
      return {
        communicationId: lockedExisting.communication.id,
        externalActionRequestId: lockedExisting.request?.id ?? null,
        payloadHash: lockedExisting.request?.payloadHash ?? null,
        status: "existing" as const,
      };
    }
    if (input.kind === "REMINDER") {
      const original = await findExistingInvitation(
        invitationKey({
          kind: "INVITATION",
          recipientPersonId: input.recipientPersonId,
          revisionId: input.revision.documentRevisionId,
          taskId: input.taskId,
        }),
        tx,
      );
      if (
        !original?.communication.sentAt ||
        original.communication.status !== TaskCommunicationStatus.SENT
      ) {
        throw new Error("A reminder requires a successfully sent invitation");
      }
      const reminderEligibleAt = new Date(
        original.communication.sentAt.getTime() +
          PRIVATE_REVIEW_REMINDER_DELAY_MS,
      );
      if (reminderEligibleAt > now) {
        throw new Error(
          `Review reminder is not allowed before ${reminderEligibleAt.toISOString()}`,
        );
      }
    }

    const email = buildPrivateReviewInvitationEmail({
      kind: input.kind,
      recipientName: lockedTask.assigneePerson.displayName,
      signInUrl: getPrivateReviewSignInUrl(input.taskId),
    });
    const draft = await draftTaskNotification(
      {
        audience: TaskCommunicationAudience.ASSIGNEE,
        channel: TaskCommunicationChannel.EMAIL,
        dedupeKey: key,
        emailScope: "task_notifications",
        html: email.html,
        metadataJson: {
          batchKey: lockedBatchKey,
          notificationKind: "private_document_review",
          reviewInvitation:
            approvalContext as unknown as Prisma.InputJsonObject,
          reviewInvitationKey: key,
        } satisfies Prisma.InputJsonObject,
        purpose:
          input.kind === "REMINDER"
            ? TaskCommunicationPurpose.REMINDER
            : TaskCommunicationPurpose.INVITATION,
        recipientEmail: lockedRecipientEmail,
        recipientName: lockedTask.assigneePerson.displayName,
        recipientPersonId: input.recipientPersonId,
        recipientUserId: lockedTask.assigneePerson.user?.id ?? null,
        senderName,
        senderUserId: actorUserId,
        skipWishoniaSignature: true,
        step: input.kind === "REMINDER" ? 1 : 0,
        subject: email.subject,
        taskId: input.taskId,
        text: email.text,
      },
      tx,
    );
    const request = await proposeOutboundMessage({
      actorUserId,
      approvalContext,
      communicationId: draft.id,
      db: tx,
      from: senderName ? formatShareEmailFromHeader(senderName) : null,
      now,
      taskId: input.taskId,
    });

    return {
      communicationId: draft.id,
      externalActionRequestId: request.id,
      payloadHash: request.payloadHash,
      status: "pending_approval" as const,
    };
  });
}
