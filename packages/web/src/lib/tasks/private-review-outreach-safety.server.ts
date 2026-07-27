import {
  TaskCandidateMatchStatus,
  TaskClaimPolicy,
  TaskExecutionAttemptStatus,
  TaskStatus,
  type Prisma,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { readReviewRequest } from "@/lib/tasks/document-review-contracts";
import { documentReviewBindingMatches } from "@/lib/tasks/document-review-binding.server";
import { findExternalRecipientSuppression } from "@/lib/tasks/external-recipient-suppression.server";
import type { PrivateReviewInvitationApprovalContext } from "@/lib/tasks/private-review-invitation-contracts";
import { recipientWithinRateLimits } from "@/lib/tasks/task-recipient-rate-limit.server";

export type PrivateReviewOutreachSuppressionReason =
  | "review_completed"
  | "recipient_replied"
  | "recipient_declined"
  | "recipient_rate_limited"
  | "external_opt_out"
  | "complaint"
  | "hard_bounce"
  | "provider_suppressed";

type PrivateReviewBindingDb = Pick<
  Prisma.TransactionClient,
  "documentRevision" | "task"
>;

/** Re-check the live private task and pinned revision immediately before send. */
export async function privateReviewTaskMatchesApprovalContext(
  context: PrivateReviewInvitationApprovalContext,
  db: PrivateReviewBindingDb = prisma,
) {
  const [task, revision] = await Promise.all([
    db.task.findFirst({
      where: { deletedAt: null, id: context.taskId },
      select: {
        applicationPolicy: true,
        assigneePersonId: true,
        claimPolicy: true,
        contextJson: true,
        createdByUserId: true,
        executionMode: true,
        isPublic: true,
        jurisdictionId: true,
        ownerOrganizationId: true,
        parentTaskId: true,
        status: true,
        taskKey: true,
      },
    }),
    db.documentRevision.findFirst({
      where: {
        contentHash: context.revision.contentHash,
        deletedAt: null,
        document: { deletedAt: null },
        documentId: context.revision.documentId,
        id: context.revision.documentRevisionId,
        version: context.revision.documentVersion,
      },
      select: {
        document: { select: { currentRevisionId: true, version: true } },
        id: true,
      },
    }),
  ]);
  if (
    !task ||
    !revision ||
    task.isPublic ||
    task.claimPolicy !== TaskClaimPolicy.ASSIGNED_ONLY ||
    task.status !== TaskStatus.ACTIVE ||
    task.assigneePersonId !== context.recipientPersonId ||
    revision.document.currentRevisionId !== revision.id ||
    revision.document.version !== context.revision.documentVersion
  ) {
    return false;
  }
  const request = readReviewRequest(task.contextJson);
  return Boolean(
    request &&
    (await documentReviewBindingMatches(task, request)) &&
    request.target.documentId === context.revision.documentId &&
    request.target.revisionId === context.revision.documentRevisionId &&
    request.target.version === context.revision.documentVersion &&
    request.target.contentHash === context.revision.contentHash,
  );
}

/**
 * Shared pre-send safety decision. The dispatcher repeats this immediately
 * before sending so a reply or completion that arrives after approval wins.
 */
export async function evaluatePrivateReviewOutreachSuppression(input: {
  communicationId?: string;
  now?: Date;
  recipientEmail: string;
  recipientPersonId: string;
  taskId: string;
}): Promise<PrivateReviewOutreachSuppressionReason | null> {
  const now = input.now ?? new Date();
  const [task, reply, externalSuppression, withinRateLimits] =
    await Promise.all([
      prisma.task.findFirst({
        where: { deletedAt: null, id: input.taskId },
        select: {
          executionAttempts: {
            where: {
              deletedAt: null,
              status: TaskExecutionAttemptStatus.COMPLETED,
            },
            select: { id: true },
            take: 1,
          },
          contextJson: true,
          status: true,
        },
      }),
      prisma.taskComment.findFirst({
        where: {
          authorPersonId: input.recipientPersonId,
          deletedAt: null,
          source: "EMAIL_REPLY",
          taskId: input.taskId,
        },
        select: { id: true },
      }),
      findExternalRecipientSuppression({
        recipientEmail: input.recipientEmail,
        recipientPersonId: input.recipientPersonId,
      }),
      recipientWithinRateLimits(input.recipientEmail, now, {
        excludeCommunicationId: input.communicationId,
      }),
    ]);

  const reviewRequest = readReviewRequest(task?.contextJson);
  const candidate = await prisma.taskCandidateMatch.findFirst({
    where: {
      candidatePersonId: input.recipientPersonId,
      deletedAt: null,
      status: {
        in: [
          TaskCandidateMatchStatus.DECLINED,
          TaskCandidateMatchStatus.REJECTED,
        ],
      },
      taskId: reviewRequest?.authorityTaskId ?? input.taskId,
    },
    select: { id: true },
  });

  if (
    !task ||
    task.status === TaskStatus.VERIFIED ||
    task.executionAttempts.length > 0
  ) {
    return "review_completed";
  }
  if (reply) return "recipient_replied";
  if (candidate) return "recipient_declined";
  if (externalSuppression) return externalSuppression.reason;
  if (!withinRateLimits) return "recipient_rate_limited";
  return null;
}
