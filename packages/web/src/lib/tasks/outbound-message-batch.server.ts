import {
  ExternalActionRequestStatus,
  TaskClaimPolicy,
  TaskCommunicationChannel,
  TaskCommunicationDirection,
  TaskCommunicationStatus,
  TaskStatus,
  type Prisma,
} from "@optimitron/db";
import { z } from "zod";
import { lockContentResources } from "@/lib/content-access.server";
import { dispatchApprovedOutboundMessage } from "@/lib/email/outbound-message-dispatch.server";
import {
  OUTBOUND_MESSAGE_OPERATION,
  OutboundMessageApprovalPayloadSchema,
} from "@/lib/email/outbound-message-approval.server";
import { prisma } from "@/lib/prisma";
import {
  getCommunicationBatchKey,
  getPrivateReviewBatchKey,
  getPrivateReviewApprovalContext,
  privateReviewBatchIdentityMatches,
  PRIVATE_REVIEW_INVITATION_SCHEMA,
  type PrivateReviewBatchIdentity,
} from "@/lib/tasks/private-review-invitation-contracts";
import {
  getTaskAccessWhere,
  getTaskClientAccessWhere,
  type TaskClientAccessBoundary,
} from "@/lib/tasks/task-visibility.server";
import { privateReviewTaskMatchesApprovalContext } from "@/lib/tasks/private-review-outreach-safety.server";

export const ApproveOutboundMessageBatchSchema = z
  .object({
    batchKey: z.string().trim().min(8).max(200),
    requests: z
      .array(
        z
          .object({
            expectedPayloadHash: z.string().trim().min(32).max(256),
            externalActionRequestId: z.string().trim().min(1),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict()
  .superRefine((value, context) => {
    const ids = value.requests.map(
      (request) => request.externalActionRequestId,
    );
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Batch request IDs must be unique",
        path: ["requests"],
      });
    }
  });

/**
 * Approve an exact batch in one database transaction. A missing request,
 * changed hash, expired request, wrong batch key, inaccessible task, or hidden
 * extra draft rolls the whole transaction back.
 */
export async function approveOutboundMessageBatch(
  rawInput: unknown,
  actorUserId: string,
  options?: {
    clientAccessBoundary?: TaskClientAccessBoundary;
    now?: Date;
  },
) {
  const input = ApproveOutboundMessageBatchSchema.parse(rawInput);
  // `input.batchKey` is retained for older clients, but it is never trusted to
  // select or define a batch. The stored authority task and full revision pin do.
  const now = options?.now ?? new Date();
  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findFirst({
      where: { deletedAt: null, id: actorUserId },
      select: { id: true, personId: true },
    });
    if (!actor) throw new Error("Outbound message batch not found");

    const requestIds = input.requests.map(
      (request) => request.externalActionRequestId,
    );
    const expectedHashById = new Map(
      input.requests.map((request) => [
        request.externalActionRequestId,
        request.expectedPayloadHash,
      ]),
    );
    const requests = await tx.externalActionRequest.findMany({
      where: {
        deletedAt: null,
        id: { in: requestIds },
        operation: OUTBOUND_MESSAGE_OPERATION,
        status: ExternalActionRequestStatus.PENDING,
        task: {
          AND: [
            { deletedAt: null },
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
      },
      select: {
        expiresAt: true,
        id: true,
        payloadHash: true,
        payloadJson: true,
        taskId: true,
      },
    });
    if (requests.length !== requestIds.length) {
      throw new Error("Outbound message batch changed or is not accessible");
    }

    const parsedRequests = requests.map((request) => {
      if (request.expiresAt <= now) {
        throw new Error(`Outbound message request ${request.id} has expired`);
      }
      if (expectedHashById.get(request.id) !== request.payloadHash) {
        throw new Error(
          `Outbound message request ${request.id} changed after preview`,
        );
      }
      const payload = OutboundMessageApprovalPayloadSchema.parse(
        request.payloadJson,
      );
      const reviewContext = getPrivateReviewApprovalContext(
        payload.approvalContext,
      );
      if (!reviewContext?.authorityTaskId) {
        throw new Error(
          `Outbound message request ${request.id} is not in this review batch`,
        );
      }
      if (reviewContext.taskId !== request.taskId) {
        throw new Error(
          `Outbound message request ${request.id} has a mismatched task binding`,
        );
      }
      const identity: PrivateReviewBatchIdentity = {
        authorityTaskId: reviewContext.authorityTaskId,
        revision: reviewContext.revision,
      };
      if (!privateReviewBatchIdentityMatches(reviewContext, identity)) {
        throw new Error(
          `Outbound message request ${request.id} has a mismatched batch identity`,
        );
      }
      return { identity, payload, request, reviewContext };
    });

    const batchIdentity = parsedRequests[0]!.identity;
    const batchKey = getPrivateReviewBatchKey(batchIdentity);
    for (const { request, reviewContext } of parsedRequests) {
      if (!privateReviewBatchIdentityMatches(reviewContext, batchIdentity)) {
        throw new Error(
          `Outbound message request ${request.id} is not in this review batch`,
        );
      }
    }

    // A document edit and review-task changes must not cross the batch's final
    // validity check. Dispatch repeats the check because approval and sending
    // are deliberately separate operations.
    await lockContentResources(tx, [
      { id: batchIdentity.revision.documentId, type: "document" },
    ]);
    const taskIds = [
      ...new Set(parsedRequests.map(({ request }) => request.taskId)),
    ].sort();
    for (const taskId of taskIds) {
      await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Task"
        WHERE "id" = ${taskId}
        FOR UPDATE
      `;
    }
    for (const { request, reviewContext } of parsedRequests) {
      if (!(await privateReviewTaskMatchesApprovalContext(reviewContext, tx))) {
        throw new Error(
          `Outbound message request ${request.id} has a stale or inactive review binding`,
        );
      }
    }

    const communicationIds = parsedRequests.map(
      ({ payload }) => payload.communicationId,
    );
    if (new Set(communicationIds).size !== communicationIds.length) {
      throw new Error("Batch contains the same communication more than once");
    }
    const communications = await tx.taskCommunication.findMany({
      where: {
        channel: TaskCommunicationChannel.EMAIL,
        deletedAt: null,
        direction: TaskCommunicationDirection.OUTBOUND,
        id: { in: communicationIds },
        status: TaskCommunicationStatus.DRAFT,
      },
      select: { id: true, metadataJson: true, taskId: true },
    });
    if (communications.length !== communicationIds.length) {
      throw new Error("One or more batch messages are no longer drafts");
    }
    const communicationById = new Map(
      communications.map((communication) => [communication.id, communication]),
    );
    for (const { payload, request } of parsedRequests) {
      const communication = communicationById.get(payload.communicationId);
      if (
        !communication ||
        communication.taskId !== request.taskId ||
        getCommunicationBatchKey(communication.metadataJson) !== batchKey
      ) {
        throw new Error(
          `Outbound message request ${request.id} has a mismatched batch draft`,
        );
      }
    }

    const exactReviewTaskWhere: Prisma.TaskWhereInput = {
      AND: [
        {
          deletedAt: null,
          claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
          isPublic: false,
          parentTaskId: batchIdentity.authorityTaskId,
          status: TaskStatus.ACTIVE,
        },
        getTaskAccessWhere({
          action: "MANAGE",
          personId: actor.personId,
          userId: actor.id,
        }),
        ...(options?.clientAccessBoundary
          ? [getTaskClientAccessWhere(options.clientAccessBoundary)]
          : []),
        {
          contextJson: {
            equals: batchIdentity.authorityTaskId,
            path: ["documentReview", "authorityTaskId"],
          },
        },
        {
          contextJson: {
            equals: batchIdentity.revision.contentHash,
            path: ["documentReview", "target", "contentHash"],
          },
        },
        {
          contextJson: {
            equals: batchIdentity.revision.documentId,
            path: ["documentReview", "target", "documentId"],
          },
        },
        {
          contextJson: {
            equals: batchIdentity.revision.documentRevisionId,
            path: ["documentReview", "target", "revisionId"],
          },
        },
        {
          contextJson: {
            equals: batchIdentity.revision.documentVersion,
            path: ["documentReview", "target", "version"],
          },
        },
      ],
    };
    const allDraftsInBatch = await tx.taskCommunication.findMany({
      where: {
        AND: [
          {
            channel: TaskCommunicationChannel.EMAIL,
            deletedAt: null,
            direction: TaskCommunicationDirection.OUTBOUND,
            metadataJson: { path: ["batchKey"], equals: batchKey },
            status: TaskCommunicationStatus.DRAFT,
            task: exactReviewTaskWhere,
          },
          {
            metadataJson: {
              equals: PRIVATE_REVIEW_INVITATION_SCHEMA,
              path: ["reviewInvitation", "schema"],
            },
          },
          {
            metadataJson: {
              equals: batchIdentity.authorityTaskId,
              path: ["reviewInvitation", "authorityTaskId"],
            },
          },
          {
            metadataJson: {
              equals: batchIdentity.revision.contentHash,
              path: ["reviewInvitation", "revision", "contentHash"],
            },
          },
          {
            metadataJson: {
              equals: batchIdentity.revision.documentId,
              path: ["reviewInvitation", "revision", "documentId"],
            },
          },
          {
            metadataJson: {
              equals: batchIdentity.revision.documentRevisionId,
              path: ["reviewInvitation", "revision", "documentRevisionId"],
            },
          },
          {
            metadataJson: {
              equals: batchIdentity.revision.documentVersion,
              path: ["reviewInvitation", "revision", "documentVersion"],
            },
          },
        ],
      },
      select: { id: true },
    });
    const approvedCommunicationIds = new Set(communicationIds);
    if (
      allDraftsInBatch.length !== communicationIds.length ||
      allDraftsInBatch.some(
        (communication) => !approvedCommunicationIds.has(communication.id),
      )
    ) {
      throw new Error(
        "Approval must include every pending message in the exact batch",
      );
    }

    for (const request of requests) {
      const approved = await tx.externalActionRequest.updateMany({
        where: {
          id: request.id,
          payloadHash: request.payloadHash,
          status: ExternalActionRequestStatus.PENDING,
        },
        data: {
          approvedAt: now,
          approvedByUserId: actorUserId,
          approvedPayloadHash: request.payloadHash,
          status: ExternalActionRequestStatus.APPROVED,
        },
      });
      if (approved.count !== 1) {
        throw new Error(
          `Outbound message request ${request.id} is no longer pending`,
        );
      }
    }

    return {
      batchKey,
      requests: requests.map((request) => ({
        externalActionRequestId: request.id,
        payloadHash: request.payloadHash,
      })),
      status: "approved" as const,
    };
  });
}

/**
 * Approval is atomic; dispatch is intentionally per request. Each send writes
 * its own terminal receipt and a retryable failure never obscures the others.
 */
export async function approveAndDispatchOutboundMessageBatch(
  rawInput: unknown,
  actorUserId: string,
  options?: {
    clientAccessBoundary?: TaskClientAccessBoundary;
    now?: Date;
  },
) {
  const approved = await approveOutboundMessageBatch(
    rawInput,
    actorUserId,
    options,
  );
  const dispatches = [];
  for (const request of approved.requests) {
    dispatches.push({
      externalActionRequestId: request.externalActionRequestId,
      result: await dispatchApprovedOutboundMessage({
        approverUserId: actorUserId,
        externalActionRequestId: request.externalActionRequestId,
        now: options?.now,
      }),
    });
  }
  return { ...approved, dispatches };
}
