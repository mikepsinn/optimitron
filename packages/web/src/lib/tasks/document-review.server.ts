import {
  ContentAccessLevel,
  ContentVisibility,
  Prisma,
  TaskApplicationPolicy,
  TaskCandidateKind,
  TaskClaimPolicy,
  TaskExecutionAttemptStatus,
  TaskExecutionMode,
  TaskStatus,
  TaskVerificationMethod,
  TaskVerificationResult,
} from "@optimitron/db";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import {
  assertDocumentAccess,
  lockContentResources,
} from "@/lib/content-access.server";
import { prisma } from "@/lib/prisma";
import {
  AdoptDocumentRevisionInputSchema,
  ApplyDocumentProposalInputSchema,
  assertReviewResponseMatchesRequest,
  DOCUMENT_REVIEW_CONTEXT_KEY,
  DocumentDecisionV1Schema,
  type DocumentDecisionV1,
  DocumentProposalApplicationV1Schema,
  type DocumentRevisionPin,
  RequestDocumentReviewInputSchema,
  type ReviewRequestV1,
  ReviewRequestV1Schema,
  type ReviewResponseV1,
  ReviewResponseV1Schema,
  readDocumentDecision,
  readReviewRequest,
  readReviewResponse,
  sameDocumentRevisionPin,
  SubmitDocumentReviewInputSchema,
} from "@/lib/tasks/document-review-contracts";
import {
  getTaskAccessWhere,
  getTaskClientAccessWhere,
  isTaskWithinClientAccessBoundary,
  type TaskClientAccessBoundary,
} from "@/lib/tasks/task-visibility.server";
import { readTaskContext } from "@/lib/tasks/task-context";
import {
  DOCUMENT_REVIEW_BINDING_HASH_KEY,
  documentReviewBindingMatches,
  hashDocumentReviewBinding,
} from "@/lib/tasks/document-review-binding.server";

const REVIEW_RESPONSE_ARTIFACT_KIND = "document-review-response";
const PROPOSAL_APPLICATION_ARTIFACT_KIND = "document-proposal-application";
const DOCUMENT_DECISION_ARTIFACT_KIND = "document-decision";

type JsonRecord = Record<string, unknown>;

export type DocumentReviewState =
  | "AWAITING_RESPONSE"
  | "AWAITING_VERIFICATION"
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "REJECTED"
  | "ABSTAINED"
  | "DELIVERY_REJECTED"
  | "STALE";

export interface DocumentReviewPanelReview {
  completed: boolean;
  proposal: (DocumentRevisionPin & { body: string; title: string }) | null;
  request: ReviewRequestV1;
  response: (ReviewResponseV1 & { artifactId: string }) | null;
  reviewTaskId: string;
  required: boolean;
  reviewer: {
    displayName: string;
    email: string | null;
    id: string;
  };
  state: DocumentReviewState;
  target: DocumentRevisionPin & {
    body: string;
    stale: boolean;
    title: string;
  };
  verification: {
    id: string;
    result: TaskVerificationResult;
  } | null;
}

export type DocumentReviewPanelData =
  | {
      authorityTaskId: string;
      decisions: Array<{
        artifactId: string;
        decision: DocumentDecisionV1;
      }>;
      mode: "MANAGER";
      reviews: DocumentReviewPanelReview[];
    }
  | {
      authorityTaskId: string;
      canSubmit: boolean;
      mode: "REVIEWER";
      review: DocumentReviewPanelReview;
    };

export class DocumentReviewError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409,
    readonly code:
      | "DOCUMENT_REVIEW_INVALID"
      | "DOCUMENT_REVIEW_NOT_FOUND"
      | "DOCUMENT_REVIEW_CONFLICT",
  ) {
    super(message);
    this.name = "DocumentReviewError";
  }
}

function notFound(): never {
  throw new DocumentReviewError(
    "Document review not found",
    404,
    "DOCUMENT_REVIEW_NOT_FOUND",
  );
}

function conflict(message: string): never {
  throw new DocumentReviewError(message, 409, "DOCUMENT_REVIEW_CONFLICT");
}

function invalid(message: string): never {
  throw new DocumentReviewError(message, 400, "DOCUMENT_REVIEW_INVALID");
}

function asRecord(value: unknown): JsonRecord | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function taskBoundaryWhere(
  taskId: string,
  boundary?: TaskClientAccessBoundary,
): Prisma.TaskWhereInput {
  const base: Prisma.TaskWhereInput = { deletedAt: null, id: taskId };
  return boundary ? { AND: [base, getTaskClientAccessWhere(boundary)] } : base;
}

async function getManagedAuthorityTask(
  tx: Prisma.TransactionClient,
  authorityTaskId: string,
  actorUserId: string,
  boundary?: TaskClientAccessBoundary,
) {
  const actor = await tx.user.findFirst({
    where: { deletedAt: null, id: actorUserId },
    select: { id: true, personId: true },
  });
  if (!actor) notFound();
  const task = await tx.task.findFirst({
    where: {
      AND: [
        taskBoundaryWhere(authorityTaskId, boundary),
        getTaskAccessWhere({
          action: "MANAGE",
          personId: actor.personId,
          userId: actor.id,
        }),
      ],
    },
    select: {
      category: true,
      contextJson: true,
      id: true,
      isPublic: true,
      jurisdictionId: true,
      ownerOrganizationId: true,
    },
  });
  if (!task) notFound();
  return { actor, task };
}

async function completeDecisionGatedTask(
  tx: Prisma.TransactionClient,
  task: { contextJson: unknown; id: string },
  actorUserId: string,
  completedAt: Date,
) {
  if (!readTaskContext(task.contextJson).requiresDocumentDecision) return;
  await tx.task.updateMany({
    where: {
      deletedAt: null,
      id: task.id,
      status: { not: TaskStatus.VERIFIED },
    },
    data: {
      completedAt,
      status: TaskStatus.VERIFIED,
      verifiedAt: completedAt,
      verifiedByUserId: actorUserId,
    },
  });
}

async function assertDocumentPermission(
  documentId: string,
  userId: string,
  access: ContentAccessLevel,
  tx: Prisma.TransactionClient,
) {
  try {
    await assertDocumentAccess(documentId, userId, access, tx);
  } catch {
    notFound();
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function findReviewResponse(
  attempts: Array<{
    artifacts: Array<{
      id: string;
      metadataJson: unknown;
      structuredResultJson: unknown;
      submittedByUserId: string | null;
    }>;
    executorPersonId: string | null;
    executorUserId: string | null;
    status: TaskExecutionAttemptStatus;
    verifications: Array<{
      id: string;
      result: TaskVerificationResult;
      reviewerUserId: string | null;
      selfReviewed: boolean;
    }>;
  }>,
  input: {
    assigneePersonId: string | null;
    request: ReviewRequestV1;
    reviewTaskId: string;
  },
): {
  artifactId: string;
  attemptStatus: TaskExecutionAttemptStatus;
  response: ReviewResponseV1;
  submittedByUserId: string | null;
  verification: {
    id: string;
    result: TaskVerificationResult;
    reviewerUserId: string | null;
    selfReviewed: boolean;
  } | null;
} | null {
  for (const attempt of attempts) {
    for (const artifact of attempt.artifacts) {
      if (
        asRecord(artifact.metadataJson)?.kind !== REVIEW_RESPONSE_ARTIFACT_KIND
      ) {
        continue;
      }
      const response = readReviewResponse(artifact.structuredResultJson);
      if (
        !response ||
        response.reviewTaskId !== input.reviewTaskId ||
        response.reviewerUserId !== artifact.submittedByUserId ||
        attempt.executorUserId !== artifact.submittedByUserId ||
        attempt.executorPersonId !== input.assigneePersonId
      ) {
        continue;
      }
      try {
        assertReviewResponseMatchesRequest(response, input.request);
      } catch {
        continue;
      }
      return {
        artifactId: artifact.id,
        attemptStatus: attempt.status,
        response,
        submittedByUserId: artifact.submittedByUserId,
        verification: attempt.verifications[0] ?? null,
      };
    }
  }
  return null;
}

function validateChecklistResponse(
  response: ReviewResponseV1,
  request: ReviewRequestV1,
) {
  try {
    assertReviewResponseMatchesRequest(response, request);
  } catch (error) {
    invalid(error instanceof Error ? error.message : "Invalid review response");
  }
}

async function loadExactRevision(
  tx: Prisma.TransactionClient,
  pin: DocumentRevisionPin,
) {
  const revision = await tx.documentRevision.findFirst({
    where: {
      contentHash: pin.contentHash,
      deletedAt: null,
      documentId: pin.documentId,
      id: pin.revisionId,
      version: pin.version,
      document: { deletedAt: null },
    },
    select: {
      body: true,
      contentHash: true,
      createdByUser: { select: { personId: true } },
      createdByUserId: true,
      document: {
        select: {
          currentRevisionId: true,
          id: true,
          version: true,
        },
      },
      documentId: true,
      id: true,
      title: true,
      version: true,
    },
  });
  if (!revision?.contentHash) notFound();
  return revision;
}

export async function requestDocumentReview(
  authorityTaskId: string,
  rawInput: unknown,
  actorUserId: string,
  options: {
    clientAccessBoundary?: TaskClientAccessBoundary;
    idempotencyKey: string;
    now?: Date;
  },
) {
  const input = RequestDocumentReviewInputSchema.parse(rawInput);
  const idempotencyKey = options.idempotencyKey.trim();
  if (!idempotencyKey) invalid("Idempotency-Key is required");
  const now = options.now ?? new Date();
  const requestHash = await sha256CanonicalJson({
    authorityTaskId,
    input,
  });
  const taskKey = `document-review:${authorityTaskId}:${actorUserId}:${await sha256CanonicalJson({ idempotencyKey })}`;

  const returnExisting = async () =>
    prisma.$transaction(async (tx) => {
      await getManagedAuthorityTask(
        tx,
        authorityTaskId,
        actorUserId,
        options.clientAccessBoundary,
      );
      const existing = await tx.task.findFirst({
        where: options.clientAccessBoundary
          ? {
              AND: [
                { deletedAt: null, taskKey },
                getTaskClientAccessWhere(options.clientAccessBoundary),
              ],
            }
          : { deletedAt: null, taskKey },
        select: reviewTaskWithResultsSelect,
      });
      const context = asRecord(existing?.contextJson);
      const request = readReviewRequest(existing?.contextJson);
      if (!existing || !request) notFound();
      if (context?.documentReviewRequestHash !== requestHash) {
        conflict("Idempotency-Key was already used for a different review");
      }
      if (!(await hasValidReviewTaskProvenance(tx, existing, request))) {
        conflict("The existing review request binding is invalid");
      }
      return { request, reviewTaskId: existing.id };
    });

  const existing = await prisma.task.findUnique({
    where: { taskKey },
    select: { id: true },
  });
  if (existing) return returnExisting();

  try {
    return await prisma.$transaction(async (tx) => {
      const { actor, task: authorityTask } = await getManagedAuthorityTask(
        tx,
        authorityTaskId,
        actorUserId,
        options.clientAccessBoundary,
      );
      if (
        options.clientAccessBoundary &&
        !isTaskWithinClientAccessBoundary(
          {
            isPublic: false,
            ownerOrganizationId: authorityTask.ownerOrganizationId,
          },
          options.clientAccessBoundary,
        )
      ) {
        notFound();
      }
      const [revision, reviewer] = await Promise.all([
        tx.documentRevision.findFirst({
          where: {
            deletedAt: null,
            id: input.documentRevisionId,
            document: { deletedAt: null },
          },
          select: {
            contentHash: true,
            createdByUser: { select: { personId: true } },
            createdByUserId: true,
            document: {
              select: { currentRevisionId: true, id: true, version: true },
            },
            documentId: true,
            id: true,
            title: true,
            version: true,
          },
        }),
        tx.person.findFirst({
          where: { deletedAt: null, id: input.reviewerPersonId },
          select: {
            displayName: true,
            email: true,
            id: true,
            user: { select: { id: true } },
          },
        }),
      ]);
      if (!revision?.contentHash || !reviewer) notFound();
      if (
        revision.document.currentRevisionId !== revision.id ||
        revision.document.version !== revision.version
      ) {
        conflict("The requested document revision is stale");
      }
      if (
        actor.personId === reviewer.id ||
        reviewer.id === revision.createdByUser.personId ||
        reviewer.user?.id === revision.createdByUserId
      ) {
        invalid("A person cannot review their own document or review request");
      }
      await lockContentResources(tx, [
        { id: revision.documentId, type: "document" },
      ]);
      await assertDocumentPermission(
        revision.documentId,
        actorUserId,
        ContentAccessLevel.FULL_ACCESS,
        tx,
      );
      const duplicateReview = await tx.task.findFirst({
        where: {
          AND: [
            {
              assigneePersonId: reviewer.id,
              deletedAt: null,
              contextJson: {
                equals: authorityTask.id,
                path: [DOCUMENT_REVIEW_CONTEXT_KEY, "authorityTaskId"],
              },
            },
            {
              contextJson: {
                equals: revision.id,
                path: [DOCUMENT_REVIEW_CONTEXT_KEY, "target", "revisionId"],
              },
            },
          ],
        },
        select: { id: true },
      });
      if (duplicateReview) {
        conflict("This person already has a review task for this revision");
      }
      const lockedRevision = await tx.documentRevision.findFirst({
        where: {
          contentHash: revision.contentHash,
          deletedAt: null,
          documentId: revision.documentId,
          id: revision.id,
          version: revision.version,
          document: {
            currentRevisionId: revision.id,
            deletedAt: null,
            version: revision.version,
          },
        },
        select: { id: true },
      });
      if (!lockedRevision) conflict("The requested document revision is stale");

      const request = ReviewRequestV1Schema.parse({
        authorityTaskId,
        checklist: input.checklist,
        instructions: input.instructions,
        requestedAt: now.toISOString(),
        requestedByUserId: actorUserId,
        required: input.required,
        schema: "optimitron.review-request.v1",
        target: {
          contentHash: revision.contentHash,
          documentId: revision.documentId,
          revisionId: revision.id,
          version: revision.version,
        },
      });
      const bindingFields = {
        applicationPolicy: TaskApplicationPolicy.CLOSED,
        assigneePersonId: reviewer.id,
        claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
        createdByUserId: actorUserId,
        executionMode: TaskExecutionMode.HUMAN_ONLY,
        isPublic: false,
        jurisdictionId: authorityTask.jurisdictionId,
        ownerOrganizationId: authorityTask.ownerOrganizationId,
        parentTaskId: authorityTask.id,
        taskKey,
      };
      const bindingHash = await hashDocumentReviewBinding(
        bindingFields,
        request,
      );
      const reviewTask = await tx.task.create({
        data: {
          ...bindingFields,
          category: authorityTask.category,
          contextJson: jsonValue({
            [DOCUMENT_REVIEW_CONTEXT_KEY]: request,
            [DOCUMENT_REVIEW_BINDING_HASH_KEY]: bindingHash,
            documentReviewRequestHash: requestHash,
          }),
          description: input.instructions,
          status: TaskStatus.ACTIVE,
          title: (input.title ?? `Review: ${revision.title}`).slice(0, 300),
        },
        select: { id: true },
      });
      return { request, reviewTaskId: reviewTask.id };
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    return returnExisting();
  }
}

export async function submitDocumentReview(
  reviewTaskId: string,
  rawInput: unknown,
  actorUserId: string,
  options: { clientAccessBoundary?: TaskClientAccessBoundary; now?: Date } = {},
) {
  const input = SubmitDocumentReviewInputSchema.parse(rawInput);
  const now = options.now ?? new Date();
  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findFirst({
      where: { deletedAt: null, id: actorUserId },
      select: { id: true, personId: true },
    });
    const initialTask = await tx.task.findFirst({
      where: taskBoundaryWhere(reviewTaskId, options.clientAccessBoundary),
      select: reviewTaskWithResultsSelect,
    });
    const initialRequest = readReviewRequest(initialTask?.contextJson);
    if (
      !actor?.personId ||
      !initialTask ||
      !initialRequest ||
      !(await hasValidReviewTaskProvenance(tx, initialTask, initialRequest)) ||
      initialTask.parentTaskId !== initialRequest.authorityTaskId ||
      initialTask.assigneePersonId !== actor.personId ||
      initialTask.createdByUserId === actor.id ||
      initialTask.status !== TaskStatus.ACTIVE
    ) {
      notFound();
    }
    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Task" WHERE "id" = ${initialTask.id} FOR UPDATE
    `;
    // The first read authorizes which row may be locked. It is deliberately
    // not used after the lock: another submitter can commit an attempt while
    // this transaction waits, so re-read the task and its response artifacts.
    const task = await tx.task.findFirst({
      where: taskBoundaryWhere(reviewTaskId, options.clientAccessBoundary),
      select: reviewTaskWithResultsSelect,
    });
    const request = readReviewRequest(task?.contextJson);
    if (
      !task ||
      !request ||
      !(await hasValidReviewTaskProvenance(tx, task, request)) ||
      task.parentTaskId !== request.authorityTaskId ||
      task.assigneePersonId !== actor.personId ||
      task.createdByUserId === actor.id ||
      task.status !== TaskStatus.ACTIVE
    ) {
      notFound();
    }
    const revision = await loadExactRevision(tx, request.target);
    if (
      revision.document.currentRevisionId !== revision.id ||
      revision.document.version !== revision.version
    ) {
      conflict("The reviewed document revision is stale");
    }
    if (
      revision.createdByUserId === actor.id ||
      revision.createdByUser.personId === actor.personId
    ) {
      invalid("A person cannot review their own document");
    }
    const priorResponse = findReviewResponse(task.executionAttempts, {
      assigneePersonId: task.assigneePersonId,
      request,
      reviewTaskId: task.id,
    });
    if (
      priorResponse &&
      priorResponse.attemptStatus !== TaskExecutionAttemptStatus.REJECTED
    ) {
      conflict("A review response has already been submitted");
    }

    let proposalDocument: DocumentRevisionPin | undefined;
    if (input.proposal) {
      const proposal = await tx.document.create({
        data: {
          createdByUserId: actor.id,
          searchText: `${input.proposal.title}\n${input.proposal.body}`,
          taskId: task.id,
          title: input.proposal.title,
          version: 0,
          visibility: ContentVisibility.PRIVATE,
        },
        select: { id: true },
      });
      const contentHash = await sha256CanonicalJson(input.proposal);
      const proposalRevision = await tx.documentRevision.create({
        data: {
          body: input.proposal.body,
          contentHash,
          createdByUserId: actor.id,
          documentId: proposal.id,
          title: input.proposal.title,
          version: 1,
        },
        select: { id: true },
      });
      await tx.document.update({
        where: { id: proposal.id },
        data: { currentRevisionId: proposalRevision.id, version: 1 },
      });
      proposalDocument = {
        contentHash,
        documentId: proposal.id,
        revisionId: proposalRevision.id,
        version: 1,
      };
    }

    const response = ReviewResponseV1Schema.parse({
      checklistResponses: input.checklistResponses,
      explanation: input.explanation,
      proposalDocument,
      reviewTaskId: task.id,
      reviewerUserId: actor.id,
      schema: "optimitron.review-response.v1",
      submittedAt: now.toISOString(),
      target: request.target,
      verdict: input.verdict,
    });
    validateChecklistResponse(response, request);
    const responseHash = await sha256CanonicalJson(response);
    const attempt = await tx.taskExecutionAttempt.create({
      data: {
        completedAt: now,
        executorKey: `user:${actor.id}`,
        executorKind: TaskCandidateKind.USER,
        executorPersonId: actor.personId,
        executorUserId: actor.id,
        jurisdictionId: task.jurisdictionId,
        outputSummary: response.explanation,
        startedAt: now,
        status: TaskExecutionAttemptStatus.COMPLETED,
        taskId: task.id,
      },
      select: { id: true },
    });
    const [artifact, verification] = await Promise.all([
      tx.taskExecutionArtifact.create({
        data: {
          contentHash: responseHash,
          label: "Document review response",
          metadataJson: jsonValue({
            kind: REVIEW_RESPONSE_ARTIFACT_KIND,
            proposalDocument: proposalDocument ?? null,
          }),
          structuredResultJson: jsonValue(response),
          submittedByUserId: actor.id,
          taskExecutionAttemptId: attempt.id,
        },
        select: { contentHash: true, id: true },
      }),
      tx.taskVerification.create({
        data: {
          acceptanceCriteriaSnapshotJson: jsonValue({
            checklist: request.checklist,
            expectedDeliverable: "A complete review of the pinned revision",
            reviewRequest: request,
          }),
          method: TaskVerificationMethod.REVIEWER,
          result: TaskVerificationResult.PENDING,
          taskExecutionAttemptId: attempt.id,
        },
        select: { id: true, result: true },
      }),
    ]);
    return { artifact, response, verification };
  });
}

async function createAuditArtifact(input: {
  actor: { id: string; personId: string | null };
  kind: string;
  now: Date;
  task: { id: string; jurisdictionId: string | null };
  tx: Prisma.TransactionClient;
  value: unknown;
}) {
  const attempt = await input.tx.taskExecutionAttempt.create({
    data: {
      completedAt: input.now,
      executorKey: `user:${input.actor.id}`,
      executorKind: TaskCandidateKind.USER,
      executorPersonId: input.actor.personId,
      executorUserId: input.actor.id,
      jurisdictionId: input.task.jurisdictionId,
      metadata: jsonValue({ kind: input.kind }),
      startedAt: input.now,
      status: TaskExecutionAttemptStatus.COMPLETED,
      taskId: input.task.id,
    },
    select: { id: true },
  });
  return input.tx.taskExecutionArtifact.create({
    data: {
      contentHash: await sha256CanonicalJson(input.value),
      label: input.kind,
      metadataJson: jsonValue({ kind: input.kind }),
      structuredResultJson: jsonValue(input.value),
      submittedByUserId: input.actor.id,
      taskExecutionAttemptId: attempt.id,
    },
    select: { contentHash: true, id: true },
  });
}

const reviewTaskWithResultsSelect = {
  applicationPolicy: true,
  assigneePerson: {
    select: { displayName: true, email: true, id: true },
  },
  assigneePersonId: true,
  claimPolicy: true,
  contextJson: true,
  createdByUserId: true,
  executionMode: true,
  executionAttempts: {
    orderBy: { createdAt: "desc" as const },
    select: {
      artifacts: {
        where: { deletedAt: null },
        select: {
          id: true,
          metadataJson: true,
          structuredResultJson: true,
          submittedByUserId: true,
        },
      },
      verifications: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" as const },
        select: {
          id: true,
          result: true,
          reviewerUserId: true,
          selfReviewed: true,
        },
        take: 1,
      },
      executorPersonId: true,
      executorUserId: true,
      status: true,
    },
    where: { deletedAt: null },
  },
  id: true,
  isPublic: true,
  jurisdictionId: true,
  ownerOrganizationId: true,
  parentTaskId: true,
  status: true,
  taskKey: true,
} satisfies Prisma.TaskSelect;

async function hasValidReviewTaskProvenance(
  tx: Prisma.TransactionClient,
  task: Prisma.TaskGetPayload<{ select: typeof reviewTaskWithResultsSelect }>,
  request = readReviewRequest(task.contextJson),
): Promise<boolean> {
  if (
    !request ||
    task.isPublic ||
    task.applicationPolicy !== TaskApplicationPolicy.CLOSED ||
    task.claimPolicy !== TaskClaimPolicy.ASSIGNED_ONLY ||
    task.executionMode !== TaskExecutionMode.HUMAN_ONLY ||
    !task.assigneePersonId ||
    task.createdByUserId !== request.requestedByUserId ||
    task.parentTaskId !== request.authorityTaskId ||
    !task.taskKey?.startsWith(
      `document-review:${request.authorityTaskId}:${request.requestedByUserId}:`,
    )
  ) {
    return false;
  }
  if (!(await documentReviewBindingMatches(task, request))) {
    return false;
  }

  const requester = await tx.user.findFirst({
    where: { deletedAt: null, id: request.requestedByUserId },
    select: { id: true, personId: true },
  });
  if (!requester || requester.personId === task.assigneePersonId) return false;

  const [authorityTask, revision] = await Promise.all([
    tx.task.findFirst({
      where: {
        AND: [
          { deletedAt: null, id: request.authorityTaskId },
          getTaskAccessWhere({
            action: "MANAGE",
            personId: requester.personId,
            userId: requester.id,
          }),
        ],
      },
      select: { jurisdictionId: true, ownerOrganizationId: true },
    }),
    tx.documentRevision.findFirst({
      where: {
        contentHash: request.target.contentHash,
        deletedAt: null,
        documentId: request.target.documentId,
        id: request.target.revisionId,
        version: request.target.version,
        document: { deletedAt: null },
      },
      select: {
        createdByUser: { select: { personId: true } },
        createdByUserId: true,
        documentId: true,
      },
    }),
  ]);
  if (
    !authorityTask ||
    !revision ||
    authorityTask.ownerOrganizationId !== task.ownerOrganizationId ||
    authorityTask.jurisdictionId !== task.jurisdictionId ||
    revision.createdByUser.personId === task.assigneePersonId
  ) {
    return false;
  }
  try {
    await assertDocumentAccess(
      revision.documentId,
      requester.id,
      ContentAccessLevel.FULL_ACCESS,
      tx,
    );
  } catch {
    return false;
  }
  return true;
}

export async function applyDocumentProposal(
  authorityTaskId: string,
  rawInput: unknown,
  actorUserId: string,
  options: { clientAccessBoundary?: TaskClientAccessBoundary; now?: Date } = {},
) {
  const input = ApplyDocumentProposalInputSchema.parse(rawInput);
  const now = options.now ?? new Date();
  return prisma.$transaction(async (tx) => {
    const { actor, task: authorityTask } = await getManagedAuthorityTask(
      tx,
      authorityTaskId,
      actorUserId,
      options.clientAccessBoundary,
    );
    const reviewTask = await tx.task.findFirst({
      where: taskBoundaryWhere(
        input.reviewTaskId,
        options.clientAccessBoundary,
      ),
      select: reviewTaskWithResultsSelect,
    });
    const request = readReviewRequest(reviewTask?.contextJson);
    const result =
      reviewTask && request
        ? findReviewResponse(reviewTask.executionAttempts, {
            assigneePersonId: reviewTask.assigneePersonId,
            request,
            reviewTaskId: reviewTask.id,
          })
        : null;
    if (
      !reviewTask ||
      !request ||
      !(await hasValidReviewTaskProvenance(tx, reviewTask, request)) ||
      request.authorityTaskId !== authorityTask.id ||
      reviewTask.parentTaskId !== authorityTask.id ||
      !result?.response.proposalDocument ||
      result.submittedByUserId == null ||
      result.submittedByUserId === actor.id ||
      result.verification?.result !== TaskVerificationResult.ACCEPTED ||
      result.verification.reviewerUserId == null ||
      result.verification.reviewerUserId === result.submittedByUserId ||
      result.verification.selfReviewed
    ) {
      notFound();
    }
    validateChecklistResponse(result.response, request);
    await lockContentResources(tx, [
      { id: request.target.documentId, type: "document" },
      {
        id: result.response.proposalDocument.documentId,
        type: "document",
      },
    ]);
    await assertDocumentPermission(
      request.target.documentId,
      actor.id,
      ContentAccessLevel.EDIT_CONTENT,
      tx,
    );
    const [baseRevision, proposalRevision] = await Promise.all([
      loadExactRevision(tx, request.target),
      loadExactRevision(tx, result.response.proposalDocument),
    ]);
    if (
      baseRevision.document.currentRevisionId !== baseRevision.id ||
      baseRevision.document.version !== input.expectedDocumentVersion ||
      baseRevision.version !== input.expectedDocumentVersion
    ) {
      conflict(
        "The canonical document changed before the proposal was applied",
      );
    }
    if (
      proposalRevision.document.currentRevisionId !== proposalRevision.id ||
      proposalRevision.document.version !== proposalRevision.version
    ) {
      conflict("The proposed document changed before it was applied");
    }
    const nextVersion = baseRevision.version + 1;
    const resultingContentHash = await sha256CanonicalJson({
      body: proposalRevision.body,
      title: proposalRevision.title,
    });
    const resultingRevision = await tx.documentRevision.create({
      data: {
        body: proposalRevision.body,
        contentHash: resultingContentHash,
        createdByUserId: actor.id,
        documentId: baseRevision.documentId,
        title: proposalRevision.title,
        version: nextVersion,
      },
      select: { id: true },
    });
    const updated = await tx.document.updateMany({
      where: {
        currentRevisionId: baseRevision.id,
        deletedAt: null,
        id: baseRevision.documentId,
        version: input.expectedDocumentVersion,
      },
      data: {
        currentRevisionId: resultingRevision.id,
        searchText: `${proposalRevision.title}\n${proposalRevision.body}`,
        title: proposalRevision.title,
        version: nextVersion,
      },
    });
    if (updated.count !== 1) {
      conflict(
        "The canonical document changed before the proposal was applied",
      );
    }
    await tx.task.updateMany({
      where: {
        deletedAt: null,
        contextJson: {
          equals: request.target.revisionId,
          path: [DOCUMENT_REVIEW_CONTEXT_KEY, "target", "revisionId"],
        },
      },
      data: { status: TaskStatus.STALE },
    });
    const application = DocumentProposalApplicationV1Schema.parse({
      appliedAt: now.toISOString(),
      appliedByUserId: actor.id,
      baseDocument: request.target,
      resultingDocument: {
        contentHash: resultingContentHash,
        documentId: baseRevision.documentId,
        revisionId: resultingRevision.id,
        version: nextVersion,
      },
      reviewArtifactId: result.artifactId,
      reviewTaskId: reviewTask.id,
      schema: "optimitron.document-proposal-application.v1",
      sourceProposalDocument: result.response.proposalDocument,
    });
    const artifact = await createAuditArtifact({
      actor,
      kind: PROPOSAL_APPLICATION_ARTIFACT_KIND,
      now,
      task: authorityTask,
      tx,
      value: application,
    });
    return { application, artifact };
  });
}

export async function adoptDocumentRevision(
  authorityTaskId: string,
  rawInput: unknown,
  actorUserId: string,
  options: {
    clientAccessBoundary?: TaskClientAccessBoundary;
    idempotencyKey: string;
    now?: Date;
  },
) {
  const input = AdoptDocumentRevisionInputSchema.parse(rawInput);
  const idempotencyKey = options.idempotencyKey.trim();
  if (!idempotencyKey) invalid("Idempotency-Key is required");
  const now = options.now ?? new Date();
  return prisma.$transaction(async (tx) => {
    const { actor, task: authorityTask } = await getManagedAuthorityTask(
      tx,
      authorityTaskId,
      actorUserId,
      options.clientAccessBoundary,
    );
    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Task" WHERE "id" = ${authorityTask.id} FOR UPDATE
    `;
    const targetRevision = await tx.documentRevision.findFirst({
      where: {
        deletedAt: null,
        id: input.documentRevisionId,
        document: { deletedAt: null },
      },
      select: {
        contentHash: true,
        createdByUser: { select: { personId: true } },
        createdByUserId: true,
        document: {
          select: { currentRevisionId: true, id: true, version: true },
        },
        documentId: true,
        id: true,
        version: true,
      },
    });
    if (!targetRevision?.contentHash) notFound();
    await lockContentResources(tx, [
      { id: targetRevision.documentId, type: "document" },
    ]);
    if (
      targetRevision.document.currentRevisionId !== targetRevision.id ||
      targetRevision.document.version !== targetRevision.version
    ) {
      conflict("Only the current document revision can be adopted");
    }
    await assertDocumentPermission(
      targetRevision.documentId,
      actor.id,
      ContentAccessLevel.FULL_ACCESS,
      tx,
    );
    const lockedDocument = await tx.document.findFirst({
      where: {
        currentRevisionId: targetRevision.id,
        deletedAt: null,
        id: targetRevision.documentId,
        version: targetRevision.version,
      },
      select: { id: true },
    });
    if (!lockedDocument) {
      conflict("Only the current document revision can be adopted");
    }
    const target: DocumentRevisionPin = {
      contentHash: targetRevision.contentHash,
      documentId: targetRevision.documentId,
      revisionId: targetRevision.id,
      version: targetRevision.version,
    };
    const reviews = await tx.task.findMany({
      where: {
        deletedAt: null,
        parentTaskId: authorityTask.id,
        contextJson: {
          equals: authorityTask.id,
          path: [DOCUMENT_REVIEW_CONTEXT_KEY, "authorityTaskId"],
        },
      },
      select: reviewTaskWithResultsSelect,
    });
    const matchingReviews = (
      await Promise.all(
        reviews.map(async (task) => {
          const request = readReviewRequest(task.contextJson);
          if (
            !request ||
            !sameDocumentRevisionPin(request.target, target) ||
            !(await hasValidReviewTaskProvenance(tx, task, request))
          ) {
            return null;
          }
          return {
            request,
            result: findReviewResponse(task.executionAttempts, {
              assigneePersonId: task.assigneePersonId,
              request,
              reviewTaskId: task.id,
            }),
            task,
          };
        }),
      )
    ).filter((item): item is NonNullable<typeof item> => item != null);
    if (matchingReviews.length === 0) {
      invalid("Request at least one independent review before adoption");
    }
    const waiverMap = new Map(
      input.waivers.map((waiver) => [waiver.reviewTaskId, waiver]),
    );
    if (waiverMap.size !== input.waivers.length) {
      invalid("A review task can only be waived once");
    }
    const matchingTaskIds = new Set(
      matchingReviews.map((item) => item.task.id),
    );
    const unknownWaiver = input.waivers.find(
      (waiver) => !matchingTaskIds.has(waiver.reviewTaskId),
    );
    if (unknownWaiver) invalid("A waiver references an unrelated review task");

    const acceptedReviewArtifactIds: string[] = [];
    const unresolvedRequired: string[] = [];
    for (const item of matchingReviews) {
      const validApproval =
        item.result?.response.verdict === "APPROVE" &&
        item.result.submittedByUserId != null &&
        item.result.submittedByUserId !== actor.id &&
        item.result.submittedByUserId !== targetRevision.createdByUserId &&
        item.result.verification?.result === TaskVerificationResult.ACCEPTED &&
        item.result.verification.reviewerUserId != null &&
        item.result.verification.reviewerUserId !==
          item.result.submittedByUserId &&
        !item.result.verification.selfReviewed;
      if (validApproval && item.result) {
        acceptedReviewArtifactIds.push(item.result.artifactId);
        if (waiverMap.has(item.task.id)) {
          invalid("An accepted approval cannot also be waived");
        }
      } else if (item.request.required && !waiverMap.has(item.task.id)) {
        unresolvedRequired.push(item.task.id);
      }
    }
    if (unresolvedRequired.length > 0) {
      conflict(
        `Required reviews need approval or a reasoned waiver: ${unresolvedRequired.join(", ")}`,
      );
    }
    const unusedWaiver = input.waivers.find((waiver) => {
      const matching = matchingReviews.find(
        (item) => item.task.id === waiver.reviewTaskId,
      );
      return matching != null && !matching.request.required;
    });
    if (unusedWaiver) invalid("Advisory reviews do not require waivers");

    const decision = DocumentDecisionV1Schema.parse({
      acceptedReviewArtifactIds,
      adoptedDocument: target,
      authorityTaskId: authorityTask.id,
      decidedAt: now.toISOString(),
      decidedByUserId: actor.id,
      schema: "optimitron.document-decision.v1",
      waivers: input.waivers,
    });
    const requestHash = await sha256CanonicalJson({
      adoptedDocument: target,
      authorityTaskId: authorityTask.id,
      useAsFundingTerms: input.useAsFundingTerms,
      waivers: input.waivers,
    });
    const existing = await tx.taskExecutionAttempt.findMany({
      where: { deletedAt: null, taskId: authorityTask.id },
      orderBy: { createdAt: "desc" },
      select: {
        artifacts: {
          where: { deletedAt: null },
          select: {
            id: true,
            metadataJson: true,
            structuredResultJson: true,
          },
        },
        metadata: true,
      },
    });
    const governingRevisionIds = new Set<string>([target.revisionId]);
    for (const attempt of existing) {
      if (
        asRecord(attempt.metadata)?.kind !== DOCUMENT_DECISION_ARTIFACT_KIND
      ) {
        continue;
      }
      for (const candidate of attempt.artifacts) {
        if (
          asRecord(candidate.metadataJson)?.kind !==
          DOCUMENT_DECISION_ARTIFACT_KIND
        ) {
          continue;
        }
        const priorDecision = readDocumentDecision(
          candidate.structuredResultJson,
        );
        if (priorDecision?.authorityTaskId === authorityTask.id) {
          governingRevisionIds.add(priorDecision.adoptedDocument.revisionId);
        }
      }
    }
    const configureFundingTerms = async () => {
      if (!input.useAsFundingTerms) return;
      const receipts =
        await import("@/lib/task-funding/contribution-receipts.server");
      await receipts.configureContributionReceiptBindingInTransaction(
        {
          governingDocumentRevisionIds: [...governingRevisionIds],
          taskId: authorityTask.id,
          termsDocumentRevisionId: target.revisionId,
        },
        actor.id,
        tx,
        { clientAccessBoundary: options.clientAccessBoundary },
      );
    };
    let priorDecisionArtifactId: string | null = null;
    for (const attempt of existing) {
      const metadata = asRecord(attempt.metadata);
      const priorDecisionArtifact = attempt.artifacts.find((candidate) => {
        const priorDecision = readDocumentDecision(
          candidate.structuredResultJson,
        );
        return (
          priorDecision != null &&
          sameDocumentRevisionPin(priorDecision.adoptedDocument, target)
        );
      });
      if (priorDecisionArtifact) {
        priorDecisionArtifactId = priorDecisionArtifact.id;
      }
      if (
        metadata?.kind !== DOCUMENT_DECISION_ARTIFACT_KIND ||
        metadata?.idempotencyKey !== idempotencyKey
      ) {
        continue;
      }
      if (metadata.requestHash !== requestHash) {
        conflict("Idempotency-Key was already used for another decision");
      }
      const artifact = attempt.artifacts.find(
        (candidate) =>
          DocumentDecisionV1Schema.safeParse(candidate.structuredResultJson)
            .success,
      );
      if (!artifact) conflict("Existing document decision is incomplete");
      await configureFundingTerms();
      await completeDecisionGatedTask(tx, authorityTask, actor.id, now);
      return {
        artifact: { id: artifact.id },
        decision: DocumentDecisionV1Schema.parse(artifact.structuredResultJson),
      };
    }
    if (priorDecisionArtifactId) {
      conflict(
        `This revision already has an adoption decision (${priorDecisionArtifactId})`,
      );
    }
    const attempt = await tx.taskExecutionAttempt.create({
      data: {
        completedAt: now,
        executorKey: `user:${actor.id}`,
        executorKind: TaskCandidateKind.USER,
        executorPersonId: actor.personId,
        executorUserId: actor.id,
        jurisdictionId: authorityTask.jurisdictionId,
        metadata: jsonValue({
          idempotencyKey,
          kind: DOCUMENT_DECISION_ARTIFACT_KIND,
          requestHash,
        }),
        startedAt: now,
        status: TaskExecutionAttemptStatus.COMPLETED,
        taskId: authorityTask.id,
      },
      select: { id: true },
    });
    const artifact = await tx.taskExecutionArtifact.create({
      data: {
        contentHash: await sha256CanonicalJson(decision),
        label: "Document adoption decision",
        metadataJson: jsonValue({ kind: DOCUMENT_DECISION_ARTIFACT_KIND }),
        structuredResultJson: jsonValue(decision),
        submittedByUserId: actor.id,
        taskExecutionAttemptId: attempt.id,
      },
      select: { contentHash: true, id: true },
    });
    await configureFundingTerms();
    await completeDecisionGatedTask(tx, authorityTask, actor.id, now);
    return { artifact, decision };
  });
}

async function buildPanelReview(
  tx: Prisma.TransactionClient,
  task: Prisma.TaskGetPayload<{ select: typeof reviewTaskWithResultsSelect }>,
): Promise<DocumentReviewPanelReview | null> {
  const request = readReviewRequest(task.contextJson);
  if (
    !request ||
    !task.assigneePerson ||
    !(await hasValidReviewTaskProvenance(tx, task, request))
  ) {
    return null;
  }
  const revision = await loadExactRevision(tx, request.target).catch(
    () => null,
  );
  if (!revision) return null;
  const result = findReviewResponse(task.executionAttempts, {
    assigneePersonId: task.assigneePersonId,
    request,
    reviewTaskId: task.id,
  });
  const proposalPin = result?.response.proposalDocument;
  const proposalRevision =
    proposalPin && result?.submittedByUserId
      ? await tx.documentRevision.findFirst({
          where: {
            contentHash: proposalPin.contentHash,
            createdByUserId: result.submittedByUserId,
            deletedAt: null,
            documentId: proposalPin.documentId,
            id: proposalPin.revisionId,
            version: proposalPin.version,
            document: {
              createdByUserId: result.submittedByUserId,
              currentRevisionId: proposalPin.revisionId,
              deletedAt: null,
              taskId: task.id,
              version: proposalPin.version,
              visibility: ContentVisibility.PRIVATE,
            },
          },
          select: { body: true, contentHash: true, title: true },
        })
      : null;
  const stale =
    task.status === TaskStatus.STALE ||
    revision.document.currentRevisionId !== revision.id ||
    revision.document.version !== revision.version;
  let state: DocumentReviewState;
  if (stale) state = "STALE";
  else if (!result) state = "AWAITING_RESPONSE";
  else if (
    !result.verification ||
    result.verification.result === TaskVerificationResult.PENDING
  ) {
    state = "AWAITING_VERIFICATION";
  } else if (
    result.verification.result !== TaskVerificationResult.ACCEPTED ||
    result.verification.reviewerUserId == null ||
    result.verification.reviewerUserId === result.submittedByUserId ||
    result.verification.selfReviewed
  ) {
    state = "DELIVERY_REJECTED";
  } else {
    state =
      result.response.verdict === "APPROVE"
        ? "APPROVED"
        : result.response.verdict === "CHANGES_REQUESTED"
          ? "CHANGES_REQUESTED"
          : result.response.verdict === "REJECT"
            ? "REJECTED"
            : "ABSTAINED";
  }
  return {
    completed:
      result?.verification?.result === TaskVerificationResult.ACCEPTED ||
      result?.verification?.result === TaskVerificationResult.REJECTED,
    proposal:
      proposalPin && proposalRevision?.contentHash
        ? {
            ...proposalPin,
            body: proposalRevision.body,
            title: proposalRevision.title,
          }
        : null,
    request,
    response: result
      ? { ...result.response, artifactId: result.artifactId }
      : null,
    reviewTaskId: task.id,
    required: request.required,
    reviewer: task.assigneePerson,
    state,
    target: {
      ...request.target,
      body: revision.body,
      stale,
      title: revision.title,
    },
    verification: result?.verification
      ? { id: result.verification.id, result: result.verification.result }
      : null,
  };
}

export async function getPinnedDocumentRevisionForReviewer(
  reviewTaskId: string,
  actorUserId: string,
  options: { clientAccessBoundary?: TaskClientAccessBoundary } = {},
) {
  return prisma.$transaction(async (tx) => {
    const [actor, task] = await Promise.all([
      tx.user.findFirst({
        where: { deletedAt: null, id: actorUserId },
        select: { personId: true },
      }),
      tx.task.findFirst({
        where: taskBoundaryWhere(reviewTaskId, options.clientAccessBoundary),
        select: reviewTaskWithResultsSelect,
      }),
    ]);
    if (!actor?.personId || !task || task.assigneePersonId !== actor.personId) {
      notFound();
    }
    const panel = await buildPanelReview(tx, task);
    if (!panel) notFound();
    return panel.target;
  });
}

/** Exact-revision access for the generic document reader. This grants no
 * document history or later-revision access and creates no ContentAccessGrant. */
export async function hasAssignedDocumentReviewRevisionAccess(input: {
  clientAccessBoundary?: TaskClientAccessBoundary;
  documentId: string;
  revisionId: string;
  userId: string;
}): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findFirst({
      where: { deletedAt: null, id: input.userId },
      select: { personId: true },
    });
    if (!actor?.personId) return false;
    const tasks = await tx.task.findMany({
      where: {
        AND: [
          {
            assigneePersonId: actor.personId,
            deletedAt: null,
            contextJson: {
              equals: input.documentId,
              path: [DOCUMENT_REVIEW_CONTEXT_KEY, "target", "documentId"],
            },
          },
          {
            contextJson: {
              equals: input.revisionId,
              path: [DOCUMENT_REVIEW_CONTEXT_KEY, "target", "revisionId"],
            },
          },
          ...(input.clientAccessBoundary
            ? [getTaskClientAccessWhere(input.clientAccessBoundary)]
            : []),
        ],
      },
      select: reviewTaskWithResultsSelect,
    });
    for (const task of tasks) {
      const request = readReviewRequest(task.contextJson);
      if (
        request?.target.documentId === input.documentId &&
        request.target.revisionId === input.revisionId &&
        (await hasValidReviewTaskProvenance(tx, task, request))
      ) {
        return true;
      }
    }
    return false;
  });
}

export async function getDocumentReviewPanelData(
  taskId: string,
  actorUserId: string,
  options: { clientAccessBoundary?: TaskClientAccessBoundary } = {},
): Promise<DocumentReviewPanelData | null> {
  return prisma.$transaction(async (tx) => {
    const [actor, requestedTask] = await Promise.all([
      tx.user.findFirst({
        where: { deletedAt: null, id: actorUserId },
        select: { id: true, personId: true },
      }),
      tx.task.findFirst({
        where: taskBoundaryWhere(taskId, options.clientAccessBoundary),
        select: reviewTaskWithResultsSelect,
      }),
    ]);
    if (!actor || !requestedTask) return null;
    const directRequest = readReviewRequest(requestedTask.contextJson);
    if (directRequest && requestedTask.assigneePersonId === actor.personId) {
      const review = await buildPanelReview(tx, requestedTask);
      if (!review) return null;
      return {
        authorityTaskId: directRequest.authorityTaskId,
        canSubmit:
          (review.state === "AWAITING_RESPONSE" ||
            (review.state === "DELIVERY_REJECTED" &&
              review.verification?.result ===
                TaskVerificationResult.REJECTED)) &&
          requestedTask.createdByUserId !== actor.id,
        mode: "REVIEWER",
        review,
      };
    }

    const authorityTaskId = directRequest?.authorityTaskId ?? requestedTask.id;
    const managed = await tx.task.findFirst({
      where: {
        AND: [
          taskBoundaryWhere(authorityTaskId, options.clientAccessBoundary),
          getTaskAccessWhere({
            action: "MANAGE",
            personId: actor.personId,
            userId: actor.id,
          }),
        ],
      },
      select: { id: true },
    });
    if (!managed) return null;
    const reviewTasks = directRequest
      ? [requestedTask]
      : await tx.task.findMany({
          where: {
            deletedAt: null,
            parentTaskId: authorityTaskId,
          },
          orderBy: { createdAt: "asc" },
          select: reviewTaskWithResultsSelect,
        });
    const reviews = (
      await Promise.all(reviewTasks.map((task) => buildPanelReview(tx, task)))
    ).filter((review): review is DocumentReviewPanelReview => review != null);
    const authorityAttempts = directRequest
      ? await tx.taskExecutionAttempt.findMany({
          where: { deletedAt: null, taskId: authorityTaskId },
          orderBy: { createdAt: "desc" },
          select: {
            artifacts: {
              where: { deletedAt: null },
              select: { id: true, structuredResultJson: true },
            },
          },
        })
      : requestedTask.executionAttempts;
    const decisions = authorityAttempts.flatMap((attempt) =>
      attempt.artifacts.flatMap((artifact) => {
        const decision = readDocumentDecision(artifact.structuredResultJson);
        return decision ? [{ artifactId: artifact.id, decision }] : [];
      }),
    );
    return { authorityTaskId, decisions, mode: "MANAGER", reviews };
  });
}
