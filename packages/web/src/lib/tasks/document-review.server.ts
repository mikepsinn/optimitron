import {
  ContentAccessLevel,
  ContentVisibility,
  Prisma,
  TaskApplicationPolicy,
  TaskCandidateKind,
  TaskClaimPolicy,
  TaskCommentVisibility,
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
  ApplyDocumentProposalInputSchema,
  assertReviewResponseMatchesRequest,
  CreateDocumentProposalInputSchema,
  DecideDocumentRevisionInputSchema,
  DOCUMENT_REVIEW_CONTEXT_KEY,
  DOCUMENT_REVIEW_TASK_KEY_PREFIX,
  DocumentProposalApplicationV1Schema,
  type DocumentProposalSourceCommentV1,
  DocumentProposalV1Schema,
  type DocumentRevisionPin,
  InternalDocumentDecisionV1Schema,
  type InternalDocumentDecisionV1,
  readDocumentProposal,
  readDocumentProposalApplication,
  readInternalDocumentDecision,
  readReviewRequest,
  readReviewResponse,
  RequestDocumentReviewInputSchema,
  type ReviewRequestV1,
  ReviewRequestV1Schema,
  type ReviewResponseV1,
  ReviewResponseV1Schema,
  sameDocumentRevisionPin,
  SubmitDocumentReviewInputSchema,
} from "@/lib/tasks/document-review-contracts";
import {
  DOCUMENT_REVIEW_BINDING_HASH_KEY,
  documentReviewBindingMatches,
  hashDocumentReviewBinding,
} from "@/lib/tasks/document-review-binding.server";
import { invalidateDocumentReviewsForDocument } from "@/lib/tasks/document-review-invalidation.server";
import { createTopLevelTaskCommentInTransaction } from "@/lib/tasks/task-comments.server";
import {
  getTaskAccessWhere,
  getTaskClientAccessWhere,
  isTaskWithinClientAccessBoundary,
  type TaskClientAccessBoundary,
} from "@/lib/tasks/task-visibility.server";

const PROPOSAL_ARTIFACT_KIND = "document-proposal";
const PROPOSAL_APPLICATION_ARTIFACT_KIND = "document-proposal-application";
const REVIEW_RESPONSE_ARTIFACT_KIND = "document-review-response";
const INTERNAL_DECISION_ARTIFACT_KIND = "internal-document-decision";
const REVIEW_DELIVERY_RULE_KEY = "document-review-delivery.v1";

type JsonRecord = Record<string, unknown>;

export type DocumentReviewState =
  | "AWAITING_RESPONSE"
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "REJECTED"
  | "ABSTAINED"
  | "STALE";

export interface DocumentReviewPanelReview {
  request: ReviewRequestV1;
  response: (ReviewResponseV1 & { artifactId: string }) | null;
  reviewTaskId: string;
  reviewer: {
    displayName: string;
    id: string;
  };
  state: DocumentReviewState;
  target: DocumentRevisionPin & {
    body: string;
    stale: boolean;
    title: string;
  };
}

export interface DocumentProposalPreview {
  artifactId: string;
  base: DocumentRevisionPin;
  baseStale: boolean;
  proposed: DocumentRevisionPin & { body: string; title: string };
  sourceComments: DocumentProposalSourceCommentV1[];
  summary: string;
}

export type DocumentReviewPanelData =
  | {
      authorityTaskId: string;
      decisions: Array<{
        artifactId: string;
        decision: InternalDocumentDecisionV1;
      }>;
      mode: "MANAGER";
      proposals: DocumentProposalPreview[];
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

function requireIdempotencyKey(value: string): string {
  const key = value.trim();
  if (!key) invalid("Idempotency-Key is required");
  return key;
}

function taskBoundaryWhere(
  taskId: string,
  boundary?: TaskClientAccessBoundary,
): Prisma.TaskWhereInput {
  const base: Prisma.TaskWhereInput = { deletedAt: null, id: taskId };
  return boundary ? { AND: [base, getTaskClientAccessWhere(boundary)] } : base;
}

function genuineReviewChildWhere(
  authorityTaskId: string,
): Prisma.TaskWhereInput {
  return {
    AND: [
      {
        contextJson: {
          equals: "optimitron.review-request.v1",
          path: [DOCUMENT_REVIEW_CONTEXT_KEY, "schema"],
        },
      },
      {
        contextJson: {
          equals: authorityTaskId,
          path: [DOCUMENT_REVIEW_CONTEXT_KEY, "authorityTaskId"],
        },
      },
    ],
    deletedAt: null,
    parentTaskId: authorityTaskId,
    taskKey: {
      startsWith: `${DOCUMENT_REVIEW_TASK_KEY_PREFIX}${authorityTaskId}:`,
    },
  };
}

async function assertDocumentPermission(
  tx: Prisma.TransactionClient,
  documentId: string,
  actorUserId: string,
  required: ContentAccessLevel,
) {
  try {
    await assertDocumentAccess(documentId, actorUserId, required, tx);
  } catch {
    notFound();
  }
}

async function lockTaskRow(tx: Prisma.TransactionClient, taskId: string) {
  await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "Task" WHERE "id" = ${taskId} FOR UPDATE
  `;
}

const authorityTaskSelect = {
  category: true,
  contextJson: true,
  id: true,
  isPublic: true,
  jurisdictionId: true,
  ownerOrganizationId: true,
} satisfies Prisma.TaskSelect;

async function getActor(tx: Prisma.TransactionClient, actorUserId: string) {
  const actor = await tx.user.findFirst({
    where: { deletedAt: null, id: actorUserId },
    select: { id: true, personId: true },
  });
  if (!actor?.personId) notFound();
  return { id: actor.id, personId: actor.personId };
}

async function getManagedAuthorityTask(
  tx: Prisma.TransactionClient,
  authorityTaskId: string,
  actorUserId: string,
  boundary?: TaskClientAccessBoundary,
) {
  const actor = await getActor(tx, actorUserId);
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
    select: authorityTaskSelect,
  });
  if (!task) notFound();
  return { actor, task };
}

async function getProposalAuthorityTask(
  tx: Prisma.TransactionClient,
  authorityTaskId: string,
  actorUserId: string,
  boundary?: TaskClientAccessBoundary,
) {
  const actor = await getActor(tx, actorUserId);
  const task = await tx.task.findFirst({
    where: {
      AND: [
        taskBoundaryWhere(authorityTaskId, boundary),
        getTaskAccessWhere({
          action: "COMMENT",
          personId: actor.personId,
          userId: actor.id,
        }),
      ],
    },
    select: authorityTaskSelect,
  });
  if (!task) notFound();
  return { actor, task };
}

const exactRevisionSelect = {
  body: true,
  contentHash: true,
  createdByUser: { select: { personId: true } },
  createdByUserId: true,
  document: {
    select: {
      createdByUserId: true,
      currentRevisionId: true,
      id: true,
      organizationId: true,
      taskId: true,
      version: true,
      visibility: true,
    },
  },
  documentId: true,
  id: true,
  title: true,
  version: true,
} satisfies Prisma.DocumentRevisionSelect;

type ExactRevision = Prisma.DocumentRevisionGetPayload<{
  select: typeof exactRevisionSelect;
}>;

function revisionPin(revision: ExactRevision): DocumentRevisionPin {
  if (!revision.contentHash) notFound();
  return {
    contentHash: revision.contentHash,
    documentId: revision.documentId,
    revisionId: revision.id,
    version: revision.version,
  };
}

async function loadRevisionById(
  tx: Prisma.TransactionClient,
  revisionId: string,
): Promise<ExactRevision> {
  const revision = await tx.documentRevision.findFirst({
    where: {
      deletedAt: null,
      document: { deletedAt: null },
      id: revisionId,
    },
    select: exactRevisionSelect,
  });
  if (!revision?.contentHash) notFound();
  if (
    revision.contentHash !==
    (await sha256CanonicalJson({ body: revision.body, title: revision.title }))
  ) {
    conflict("Document revision integrity check failed");
  }
  return revision;
}

async function loadExactRevision(
  tx: Prisma.TransactionClient,
  pin: DocumentRevisionPin,
): Promise<ExactRevision> {
  const revision = await tx.documentRevision.findFirst({
    where: {
      contentHash: pin.contentHash,
      deletedAt: null,
      document: { deletedAt: null },
      documentId: pin.documentId,
      id: pin.revisionId,
      version: pin.version,
    },
    select: exactRevisionSelect,
  });
  if (!revision?.contentHash) notFound();
  if (
    revision.contentHash !==
    (await sha256CanonicalJson({ body: revision.body, title: revision.title }))
  ) {
    conflict("Document revision integrity check failed");
  }
  return revision;
}

async function loadExactRevisionOrNull(
  tx: Prisma.TransactionClient,
  pin: DocumentRevisionPin,
): Promise<ExactRevision | null> {
  try {
    return await loadExactRevision(tx, pin);
  } catch (error) {
    if (
      error instanceof DocumentReviewError &&
      error.code === "DOCUMENT_REVIEW_NOT_FOUND"
    ) {
      return null;
    }
    throw error;
  }
}

const reviewTaskSelect = {
  applicationPolicy: true,
  assigneePerson: {
    select: { displayName: true, id: true },
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
          contentHash: true,
          documentRevisionId: true,
          id: true,
          metadataJson: true,
          structuredResultJson: true,
          submittedByAgentExecutorId: true,
          submittedByUserId: true,
        },
      },
      executorKind: true,
      executorPersonId: true,
      executorUserId: true,
      id: true,
      metadata: true,
      status: true,
      verifications: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" as const },
        select: {
          id: true,
          method: true,
          result: true,
          reviewerAgentExecutorId: true,
          reviewerUserId: true,
          ruleKey: true,
          selfReviewed: true,
        },
      },
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

type ReviewTask = Prisma.TaskGetPayload<{ select: typeof reviewTaskSelect }>;

const requestedTaskProbeSelect = {
  assigneePersonId: true,
  contextJson: true,
  id: true,
} satisfies Prisma.TaskSelect;

async function hasValidReviewTaskProvenance(
  tx: Prisma.TransactionClient,
  task: ReviewTask,
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
      `${DOCUMENT_REVIEW_TASK_KEY_PREFIX}${request.authorityTaskId}:${request.requestedByUserId}:`,
    ) ||
    !(await documentReviewBindingMatches(task, request))
  ) {
    return false;
  }

  const [requester, authorityTask, revision] = await Promise.all([
    tx.user.findFirst({
      where: { deletedAt: null, id: request.requestedByUserId },
      select: { id: true, personId: true },
    }),
    tx.task.findFirst({
      where: { deletedAt: null, id: request.authorityTaskId },
      select: { jurisdictionId: true, ownerOrganizationId: true },
    }),
    tx.documentRevision.findFirst({
      where: {
        contentHash: request.target.contentHash,
        deletedAt: null,
        document: { deletedAt: null },
        documentId: request.target.documentId,
        id: request.target.revisionId,
        version: request.target.version,
      },
      select: {
        createdByUser: { select: { personId: true } },
        document: { select: { taskId: true } },
      },
    }),
  ]);
  return Boolean(
    requester?.personId &&
    requester.personId !== task.assigneePersonId &&
    authorityTask &&
    revision &&
    authorityTask.ownerOrganizationId === task.ownerOrganizationId &&
    authorityTask.jurisdictionId === task.jurisdictionId &&
    revision.document.taskId === request.authorityTaskId &&
    revision.createdByUser.personId !== task.assigneePersonId,
  );
}

async function findAuthenticReviewResponse(
  task: ReviewTask,
  request: ReviewRequestV1,
  artifactId?: string,
) {
  for (const attempt of task.executionAttempts) {
    if (
      attempt.status !== TaskExecutionAttemptStatus.COMPLETED ||
      attempt.executorKind !== TaskCandidateKind.USER ||
      !attempt.executorUserId ||
      attempt.executorPersonId !== task.assigneePersonId ||
      asRecord(attempt.metadata)?.kind !== REVIEW_RESPONSE_ARTIFACT_KIND
    ) {
      continue;
    }
    const verification = attempt.verifications.find(
      (item) =>
        item.method === TaskVerificationMethod.DETERMINISTIC &&
        item.result === TaskVerificationResult.ACCEPTED &&
        item.ruleKey === REVIEW_DELIVERY_RULE_KEY &&
        item.reviewerUserId === attempt.executorUserId &&
        item.reviewerAgentExecutorId == null &&
        item.selfReviewed,
    );
    if (!verification) continue;

    for (const artifact of attempt.artifacts) {
      if (
        (artifactId && artifact.id !== artifactId) ||
        asRecord(artifact.metadataJson)?.kind !==
          REVIEW_RESPONSE_ARTIFACT_KIND ||
        artifact.submittedByAgentExecutorId != null ||
        artifact.submittedByUserId !== attempt.executorUserId
      ) {
        continue;
      }
      const response = readReviewResponse(artifact.structuredResultJson);
      if (
        !response ||
        response.reviewerUserId !== attempt.executorUserId ||
        response.reviewerPersonId !== task.assigneePersonId ||
        artifact.contentHash !== (await sha256CanonicalJson(response))
      ) {
        continue;
      }
      try {
        assertReviewResponseMatchesRequest(response, request, task.id);
      } catch {
        continue;
      }
      return { artifact, attempt, response, verification };
    }
  }
  return null;
}

async function loadAuthenticReviewArtifact(
  tx: Prisma.TransactionClient,
  artifactId: string,
) {
  const locator = await tx.taskExecutionArtifact.findFirst({
    where: { deletedAt: null, id: artifactId },
    select: {
      taskExecutionAttempt: { select: { taskId: true } },
    },
  });
  if (!locator) notFound();
  const task = await tx.task.findFirst({
    where: {
      deletedAt: null,
      id: locator.taskExecutionAttempt.taskId,
    },
    select: reviewTaskSelect,
  });
  const request = readReviewRequest(task?.contextJson);
  if (
    !task ||
    !request ||
    !(await hasValidReviewTaskProvenance(tx, task, request))
  ) {
    notFound();
  }
  const result = await findAuthenticReviewResponse(task, request, artifactId);
  if (!result) notFound();
  return { ...result, request, task };
}

async function findIdempotentArtifactId(
  tx: Prisma.TransactionClient,
  input: {
    idempotencyKey: string;
    kind: string;
    requestHash: string;
    taskId: string;
  },
): Promise<string | null> {
  const attempts = await tx.taskExecutionAttempt.findMany({
    where: {
      deletedAt: null,
      metadata: {
        equals: input.kind,
        path: ["kind"],
      },
      taskId: input.taskId,
    },
    orderBy: { createdAt: "asc" },
    select: {
      artifacts: {
        where: {
          deletedAt: null,
          metadataJson: { equals: input.kind, path: ["kind"] },
        },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      },
      metadata: true,
    },
  });
  const matching = attempts.filter(
    (attempt) =>
      asRecord(attempt.metadata)?.idempotencyKey === input.idempotencyKey,
  );
  if (matching.length === 0) return null;
  if (
    matching.some(
      (attempt) =>
        asRecord(attempt.metadata)?.requestHash !== input.requestHash,
    )
  ) {
    conflict("Idempotency-Key was already used for different input");
  }
  const artifactIds = matching.flatMap((attempt) =>
    attempt.artifacts.map((artifact) => artifact.id),
  );
  if (artifactIds.length !== 1) {
    conflict("The prior idempotent operation is incomplete");
  }
  return artifactIds[0] ?? null;
}

const artifactWithAttemptSelect = {
  contentHash: true,
  documentRevisionId: true,
  id: true,
  metadataJson: true,
  structuredResultJson: true,
  submittedByAgentExecutorId: true,
  submittedByUserId: true,
  taskExecutionAttempt: {
    select: {
      agentExecutorId: true,
      executorKind: true,
      executorPersonId: true,
      executorUserId: true,
      metadata: true,
      status: true,
      taskId: true,
    },
  },
} satisfies Prisma.TaskExecutionArtifactSelect;

type ArtifactWithAttempt = Prisma.TaskExecutionArtifactGetPayload<{
  select: typeof artifactWithAttemptSelect;
}>;

async function loadArtifactWithAttempt(
  tx: Prisma.TransactionClient,
  artifactId: string,
) {
  const artifact = await tx.taskExecutionArtifact.findFirst({
    where: { deletedAt: null, id: artifactId },
    select: artifactWithAttemptSelect,
  });
  if (!artifact) notFound();
  return artifact;
}

async function readAuthenticProposalArtifact(
  artifact: ArtifactWithAttempt,
  authorityTaskId: string,
) {
  const attempt = artifact.taskExecutionAttempt;
  const proposal = readDocumentProposal(artifact.structuredResultJson);
  if (
    !proposal ||
    proposal.authorityTaskId !== authorityTaskId ||
    artifact.contentHash !== (await sha256CanonicalJson(proposal)) ||
    asRecord(artifact.metadataJson)?.kind !== PROPOSAL_ARTIFACT_KIND ||
    asRecord(attempt.metadata)?.kind !== PROPOSAL_ARTIFACT_KIND ||
    attempt.status !== TaskExecutionAttemptStatus.COMPLETED ||
    attempt.taskId !== authorityTaskId
  ) {
    return null;
  }
  return attempt.executorKind === TaskCandidateKind.USER &&
    attempt.executorUserId === proposal.proposedByUserId &&
    artifact.submittedByUserId === proposal.proposedByUserId &&
    artifact.submittedByAgentExecutorId == null
    ? proposal
    : null;
}

async function readAuthenticApplicationArtifact(
  artifact: ArtifactWithAttempt,
  authorityTaskId: string,
) {
  const attempt = artifact.taskExecutionAttempt;
  const application = readDocumentProposalApplication(
    artifact.structuredResultJson,
  );
  return application &&
    application.authorityTaskId === authorityTaskId &&
    artifact.contentHash === (await sha256CanonicalJson(application)) &&
    asRecord(artifact.metadataJson)?.kind ===
      PROPOSAL_APPLICATION_ARTIFACT_KIND &&
    asRecord(attempt.metadata)?.kind === PROPOSAL_APPLICATION_ARTIFACT_KIND &&
    attempt.status === TaskExecutionAttemptStatus.COMPLETED &&
    attempt.taskId === authorityTaskId &&
    attempt.executorKind === TaskCandidateKind.USER &&
    attempt.executorUserId === application.appliedByUserId &&
    artifact.submittedByUserId === application.appliedByUserId &&
    artifact.submittedByAgentExecutorId == null
    ? application
    : null;
}

async function readAuthenticDecisionArtifact(
  artifact: ArtifactWithAttempt,
  authorityTaskId: string,
) {
  const attempt = artifact.taskExecutionAttempt;
  const decision = readInternalDocumentDecision(artifact.structuredResultJson);
  return decision &&
    decision.authorityTaskId === authorityTaskId &&
    artifact.contentHash === (await sha256CanonicalJson(decision)) &&
    asRecord(artifact.metadataJson)?.kind === INTERNAL_DECISION_ARTIFACT_KIND &&
    asRecord(attempt.metadata)?.kind === INTERNAL_DECISION_ARTIFACT_KIND &&
    attempt.status === TaskExecutionAttemptStatus.COMPLETED &&
    attempt.taskId === authorityTaskId &&
    attempt.executorKind === TaskCandidateKind.USER &&
    attempt.executorUserId === decision.decidedByUserId &&
    attempt.executorPersonId === decision.decidedByPersonId &&
    artifact.submittedByUserId === decision.decidedByUserId &&
    artifact.submittedByAgentExecutorId == null
    ? decision
    : null;
}

async function createCompletedArtifact(input: {
  actor: { id: string; personId: string };
  idempotencyKey: string;
  kind: string;
  label: string;
  now: Date;
  requestHash: string;
  task: { id: string; jurisdictionId: string | null };
  tx: Prisma.TransactionClient;
  value: unknown;
}) {
  const metadata = {
    idempotencyKey: input.idempotencyKey,
    kind: input.kind,
    requestHash: input.requestHash,
  };
  const attempt = await input.tx.taskExecutionAttempt.create({
    data: {
      completedAt: input.now,
      executorKey: `user:${input.actor.id}`,
      executorKind: TaskCandidateKind.USER,
      executorPersonId: input.actor.personId,
      executorUserId: input.actor.id,
      jurisdictionId: input.task.jurisdictionId,
      metadata: jsonValue(metadata),
      startedAt: input.now,
      status: TaskExecutionAttemptStatus.COMPLETED,
      taskId: input.task.id,
    },
    select: { id: true },
  });
  return input.tx.taskExecutionArtifact.create({
    data: {
      contentHash: await sha256CanonicalJson(input.value),
      label: input.label,
      metadataJson: jsonValue(metadata),
      structuredResultJson: jsonValue(input.value),
      submittedByUserId: input.actor.id,
      taskExecutionAttemptId: attempt.id,
    },
    select: { contentHash: true, id: true },
  });
}

async function createPrivateProposalDocument(
  tx: Prisma.TransactionClient,
  input: {
    body: string;
    createdByUserId: string;
    idempotencyKey: string;
    jurisdictionId: string | null;
    requestHash: string;
    title: string;
  },
) {
  const document = await tx.document.create({
    data: {
      createdByUserId: input.createdByUserId,
      idempotencyKey: input.idempotencyKey,
      jurisdictionId: input.jurisdictionId,
      requestHash: input.requestHash,
      searchText: `${input.title}\n${input.body}`,
      taskId: null,
      title: input.title,
      version: 0,
      visibility: ContentVisibility.PRIVATE,
    },
    select: { id: true },
  });
  const contentHash = await sha256CanonicalJson({
    body: input.body,
    title: input.title,
  });
  const revision = await tx.documentRevision.create({
    data: {
      body: input.body,
      contentHash,
      createdByUserId: input.createdByUserId,
      documentId: document.id,
      title: input.title,
      version: 1,
    },
    select: { id: true },
  });
  await tx.document.update({
    where: { id: document.id },
    data: { currentRevisionId: revision.id, version: 1 },
  });
  return {
    contentHash,
    documentId: document.id,
    revisionId: revision.id,
    version: 1,
  } satisfies DocumentRevisionPin;
}

async function snapshotAuthorizedProposalSourceComments(
  tx: Prisma.TransactionClient,
  input: {
    actor: { id: string; personId: string };
    authorityTaskId: string;
    base: DocumentRevisionPin;
    clientAccessBoundary?: TaskClientAccessBoundary;
    sourceCommentIds: string[];
  },
): Promise<DocumentProposalSourceCommentV1[]> {
  const candidateReviewTasks = await tx.task.findMany({
    where: {
      AND: [
        genuineReviewChildWhere(input.authorityTaskId),
        {
          contextJson: {
            equals: input.base.documentId,
            path: [DOCUMENT_REVIEW_CONTEXT_KEY, "target", "documentId"],
          },
        },
        {
          contextJson: {
            equals: input.base.revisionId,
            path: [DOCUMENT_REVIEW_CONTEXT_KEY, "target", "revisionId"],
          },
        },
        ...(input.clientAccessBoundary
          ? [getTaskClientAccessWhere(input.clientAccessBoundary)]
          : []),
      ],
    },
    select: reviewTaskSelect,
  });
  const validTaskIds = new Set([input.authorityTaskId]);
  for (const reviewTask of candidateReviewTasks) {
    const request = readReviewRequest(reviewTask.contextJson);
    if (
      request &&
      sameDocumentRevisionPin(request.target, input.base) &&
      (await hasValidReviewTaskProvenance(tx, reviewTask, request))
    ) {
      validTaskIds.add(reviewTask.id);
    }
  }

  const readComments = () =>
    tx.taskComment.findMany({
      where: {
        deletedAt: null,
        hiddenByCurator: false,
        id: { in: input.sourceCommentIds },
        task: {
          AND: [
            { deletedAt: null, id: { in: [...validTaskIds] } },
            getTaskAccessWhere({
              action: "COMMENT",
              personId: input.actor.personId,
              userId: input.actor.id,
            }),
            ...(input.clientAccessBoundary
              ? [getTaskClientAccessWhere(input.clientAccessBoundary)]
              : []),
          ],
        },
      },
      select: {
        id: true,
        message: true,
        taskId: true,
        version: true,
        visibility: true,
      },
    });
  let comments = await readComments();
  if (comments.length !== input.sourceCommentIds.length) notFound();

  const internalTaskIds = [
    ...new Set(
      comments
        .filter(
          (comment) => comment.visibility === TaskCommentVisibility.INTERNAL,
        )
        .map((comment) => comment.taskId),
    ),
  ];
  if (internalTaskIds.length > 0) {
    const authorizedInternalTasks = await tx.task.count({
      where: {
        AND: [
          { deletedAt: null, id: { in: internalTaskIds } },
          getTaskAccessWhere({
            action: "READ_INTERNAL",
            personId: input.actor.personId,
            userId: input.actor.id,
          }),
          ...(input.clientAccessBoundary
            ? [getTaskClientAccessWhere(input.clientAccessBoundary)]
            : []),
        ],
      },
    });
    if (authorizedInternalTasks !== internalTaskIds.length) notFound();
  }

  await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "TaskComment"
    WHERE "id" IN (${Prisma.join(input.sourceCommentIds)})
    ORDER BY "id"
    FOR UPDATE
  `);
  comments = await readComments();
  if (comments.length !== input.sourceCommentIds.length) notFound();
  const commentsById = new Map(
    comments.map((comment) => [comment.id, comment]),
  );

  return Promise.all(
    input.sourceCommentIds.map(async (commentId) => {
      const comment = commentsById.get(commentId);
      if (!comment) notFound();
      return {
        commentId: comment.id,
        contentHash: await sha256CanonicalJson({
          id: comment.id,
          message: comment.message,
          taskId: comment.taskId,
          version: comment.version,
          visibility: comment.visibility,
        }),
        taskId: comment.taskId,
      };
    }),
  );
}

export async function createDocumentProposal(
  authorityTaskId: string,
  rawInput: unknown,
  actorUserId: string,
  options: {
    clientAccessBoundary?: TaskClientAccessBoundary;
    idempotencyKey: string;
    now?: Date;
  },
) {
  const input = CreateDocumentProposalInputSchema.parse(rawInput);
  const idempotencyKey = requireIdempotencyKey(options.idempotencyKey);
  const now = options.now ?? new Date();
  const requestHash = await sha256CanonicalJson({
    actorUserId,
    authorityTaskId,
    input,
  });

  return prisma.$transaction(async (tx) => {
    const initial = await getProposalAuthorityTask(
      tx,
      authorityTaskId,
      actorUserId,
      options.clientAccessBoundary,
    );
    await lockTaskRow(tx, initial.task.id);
    const { actor, task: authorityTask } = await getProposalAuthorityTask(
      tx,
      authorityTaskId,
      actorUserId,
      options.clientAccessBoundary,
    );
    const existingArtifactId = await findIdempotentArtifactId(tx, {
      idempotencyKey,
      kind: PROPOSAL_ARTIFACT_KIND,
      requestHash,
      taskId: authorityTask.id,
    });
    if (existingArtifactId) {
      const artifact = await loadArtifactWithAttempt(tx, existingArtifactId);
      const proposal = await readAuthenticProposalArtifact(
        artifact,
        authorityTask.id,
      );
      if (!proposal) conflict("The prior proposal artifact is invalid");
      return {
        artifact: { contentHash: artifact.contentHash, id: artifact.id },
        proposal,
      };
    }

    const baseRevision = await loadRevisionById(
      tx,
      input.baseDocumentRevisionId,
    );
    if (baseRevision.document.taskId !== authorityTask.id) notFound();
    await assertDocumentPermission(
      tx,
      baseRevision.documentId,
      actor.id,
      ContentAccessLevel.VIEW,
    );
    await lockContentResources(tx, [
      { id: baseRevision.documentId, type: "document" },
    ]);
    const base = revisionPin(baseRevision);
    const lockedBase = await loadExactRevision(tx, base);
    if (
      lockedBase.document.currentRevisionId !== lockedBase.id ||
      lockedBase.document.version !== lockedBase.version
    ) {
      conflict("The proposal base revision is stale");
    }
    if (lockedBase.title === input.title && lockedBase.body === input.body) {
      invalid("A proposal must change the document");
    }

    const sourceComments = await snapshotAuthorizedProposalSourceComments(tx, {
      actor,
      authorityTaskId: authorityTask.id,
      base,
      clientAccessBoundary: options.clientAccessBoundary,
      sourceCommentIds: input.sourceCommentIds,
    });
    const documentIdempotencyKey = `document-proposal:${await sha256CanonicalJson(
      { actorUserId, authorityTaskId, idempotencyKey },
    )}`;
    const proposalPin = await createPrivateProposalDocument(tx, {
      body: input.body,
      createdByUserId: actor.id,
      idempotencyKey: documentIdempotencyKey,
      jurisdictionId: authorityTask.jurisdictionId,
      requestHash,
      title: input.title,
    });
    const proposal = DocumentProposalV1Schema.parse({
      authorityTaskId: authorityTask.id,
      base,
      proposal: proposalPin,
      proposedAt: now.toISOString(),
      proposedByUserId: actor.id,
      schema: "optimitron.document-proposal.v1",
      sourceComments,
      summary: input.summary,
    });
    const artifact = await createCompletedArtifact({
      actor,
      idempotencyKey,
      kind: PROPOSAL_ARTIFACT_KIND,
      label: "Document revision proposal",
      now,
      requestHash,
      task: authorityTask,
      tx,
      value: proposal,
    });
    return { artifact, proposal };
  });
}

async function buildProposalPreview(
  tx: Prisma.TransactionClient,
  artifact: ArtifactWithAttempt,
  authorityTaskId: string,
): Promise<DocumentProposalPreview | null> {
  const proposal = await readAuthenticProposalArtifact(
    artifact,
    authorityTaskId,
  );
  if (!proposal) return null;
  const revisions = await Promise.all([
    loadExactRevisionOrNull(tx, proposal.base),
    loadExactRevisionOrNull(tx, proposal.proposal),
  ]);
  const [baseRevision, proposalRevision] = revisions;
  if (!baseRevision || !proposalRevision) return null;
  if (
    proposalRevision.document.taskId != null ||
    proposalRevision.document.visibility !== ContentVisibility.PRIVATE ||
    proposalRevision.document.currentRevisionId !== proposalRevision.id ||
    proposalRevision.document.version !== proposalRevision.version ||
    proposalRevision.document.createdByUserId !== proposal.proposedByUserId ||
    proposalRevision.createdByUserId !== proposal.proposedByUserId
  ) {
    return null;
  }
  return {
    artifactId: artifact.id,
    base: proposal.base,
    baseStale:
      baseRevision.document.currentRevisionId !== baseRevision.id ||
      baseRevision.document.version !== baseRevision.version,
    proposed: {
      ...proposal.proposal,
      body: proposalRevision.body,
      title: proposalRevision.title,
    },
    sourceComments: proposal.sourceComments,
    summary: proposal.summary,
  };
}

export async function applyDocumentProposal(
  authorityTaskId: string,
  rawInput: unknown,
  actorUserId: string,
  options: {
    clientAccessBoundary?: TaskClientAccessBoundary;
    idempotencyKey: string;
    now?: Date;
  },
) {
  const input = ApplyDocumentProposalInputSchema.parse(rawInput);
  const idempotencyKey = requireIdempotencyKey(options.idempotencyKey);
  const now = options.now ?? new Date();
  const requestHash = await sha256CanonicalJson({
    actorUserId,
    authorityTaskId,
    input,
  });

  return prisma.$transaction(async (tx) => {
    const initial = await getManagedAuthorityTask(
      tx,
      authorityTaskId,
      actorUserId,
      options.clientAccessBoundary,
    );
    await lockTaskRow(tx, initial.task.id);
    const { actor, task: authorityTask } = await getManagedAuthorityTask(
      tx,
      authorityTaskId,
      actorUserId,
      options.clientAccessBoundary,
    );
    const existingArtifactId = await findIdempotentArtifactId(tx, {
      idempotencyKey,
      kind: PROPOSAL_APPLICATION_ARTIFACT_KIND,
      requestHash,
      taskId: authorityTask.id,
    });
    if (existingArtifactId) {
      const artifact = await loadArtifactWithAttempt(tx, existingArtifactId);
      const application = await readAuthenticApplicationArtifact(
        artifact,
        authorityTask.id,
      );
      if (!application) conflict("The prior proposal application is invalid");
      return {
        application,
        artifact: { contentHash: artifact.contentHash, id: artifact.id },
      };
    }

    const proposalArtifact = await loadArtifactWithAttempt(
      tx,
      input.proposalArtifactId,
    );
    const proposal = await readAuthenticProposalArtifact(
      proposalArtifact,
      authorityTask.id,
    );
    if (!proposal) notFound();
    if (proposal.base.documentId === proposal.proposal.documentId) {
      invalid("A proposal must be a separate private document");
    }

    await lockContentResources(tx, [
      { id: proposal.base.documentId, type: "document" },
      { id: proposal.proposal.documentId, type: "document" },
    ]);
    await assertDocumentPermission(
      tx,
      proposal.base.documentId,
      actor.id,
      ContentAccessLevel.FULL_ACCESS,
    );
    const [baseRevision, proposalRevision] = await Promise.all([
      loadExactRevision(tx, proposal.base),
      loadExactRevision(tx, proposal.proposal),
    ]);
    if (
      baseRevision.document.taskId !== authorityTask.id ||
      baseRevision.document.currentRevisionId !== baseRevision.id ||
      baseRevision.document.version !== baseRevision.version
    ) {
      conflict("The canonical document changed before proposal application");
    }
    if (
      proposalRevision.document.taskId != null ||
      proposalRevision.document.visibility !== ContentVisibility.PRIVATE ||
      proposalRevision.document.currentRevisionId !== proposalRevision.id ||
      proposalRevision.document.version !== proposalRevision.version ||
      proposalRevision.document.createdByUserId !== proposal.proposedByUserId ||
      proposalRevision.createdByUserId !== proposal.proposedByUserId
    ) {
      conflict("The proposed document changed before application");
    }
    if (proposalRevision.contentHash === baseRevision.contentHash) {
      invalid("A proposal must change the document");
    }

    let currentComments: DocumentProposalSourceCommentV1[];
    try {
      currentComments = await snapshotAuthorizedProposalSourceComments(tx, {
        actor,
        authorityTaskId: authorityTask.id,
        base: proposal.base,
        clientAccessBoundary: options.clientAccessBoundary,
        sourceCommentIds: proposal.sourceComments.map(
          (comment) => comment.commentId,
        ),
      });
    } catch (error) {
      if (
        error instanceof DocumentReviewError &&
        error.code === "DOCUMENT_REVIEW_NOT_FOUND"
      ) {
        conflict("A proposal source comment is no longer available");
      }
      throw error;
    }
    if (
      (await sha256CanonicalJson(currentComments)) !==
      (await sha256CanonicalJson(proposal.sourceComments))
    ) {
      conflict("A proposal source comment changed before application");
    }

    const nextVersion = baseRevision.version + 1;
    const resultingRevision = await tx.documentRevision.create({
      data: {
        body: proposalRevision.body,
        contentHash: proposalRevision.contentHash,
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
        version: baseRevision.version,
      },
      data: {
        currentRevisionId: resultingRevision.id,
        searchText: `${proposalRevision.title}\n${proposalRevision.body}`,
        title: proposalRevision.title,
        version: nextVersion,
      },
    });
    if (updated.count !== 1) {
      conflict("The canonical document changed before proposal application");
    }
    await invalidateDocumentReviewsForDocument(tx, baseRevision.documentId);

    const resultingDocument: DocumentRevisionPin = {
      contentHash: proposalRevision.contentHash as string,
      documentId: baseRevision.documentId,
      revisionId: resultingRevision.id,
      version: nextVersion,
    };
    const application = DocumentProposalApplicationV1Schema.parse({
      appliedAt: now.toISOString(),
      appliedByUserId: actor.id,
      authorityTaskId: authorityTask.id,
      base: proposal.base,
      proposalArtifact: {
        artifactId: proposalArtifact.id,
        contentHash: proposalArtifact.contentHash,
      },
      resultingDocument,
      schema: "optimitron.document-proposal-application.v1",
      sourceProposalDocument: proposal.proposal,
    });
    const artifact = await createCompletedArtifact({
      actor,
      idempotencyKey,
      kind: PROPOSAL_APPLICATION_ARTIFACT_KIND,
      label: "Applied document revision proposal",
      now,
      requestHash,
      task: authorityTask,
      tx,
      value: application,
    });
    return { application, artifact };
  });
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
  const idempotencyKey = requireIdempotencyKey(options.idempotencyKey);
  const now = options.now ?? new Date();
  const requestHash = await sha256CanonicalJson({
    actorUserId,
    authorityTaskId,
    input,
  });
  const taskKey = `${DOCUMENT_REVIEW_TASK_KEY_PREFIX}${authorityTaskId}:${actorUserId}:${await sha256CanonicalJson(
    { idempotencyKey },
  )}`;

  return prisma.$transaction(async (tx) => {
    const initial = await getManagedAuthorityTask(
      tx,
      authorityTaskId,
      actorUserId,
      options.clientAccessBoundary,
    );
    await lockTaskRow(tx, initial.task.id);
    const { actor, task: authorityTask } = await getManagedAuthorityTask(
      tx,
      authorityTaskId,
      actorUserId,
      options.clientAccessBoundary,
    );
    const existing = await tx.task.findFirst({
      where: {
        AND: [
          { deletedAt: null, taskKey },
          ...(options.clientAccessBoundary
            ? [getTaskClientAccessWhere(options.clientAccessBoundary)]
            : []),
        ],
      },
      select: reviewTaskSelect,
    });
    if (existing) {
      const request = readReviewRequest(existing.contextJson);
      if (
        !request ||
        asRecord(existing.contextJson)?.documentReviewRequestHash !==
          requestHash ||
        !(await hasValidReviewTaskProvenance(tx, existing, request))
      ) {
        conflict("Idempotency-Key was already used for a different review");
      }
      return { request, reviewTaskId: existing.id };
    }
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
      loadRevisionById(tx, input.documentRevisionId),
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
    if (!reviewer || revision.document.taskId !== authorityTask.id) notFound();
    if (!reviewer.email && !reviewer.user) {
      invalid("Reviewer needs an email address or linked account to sign in");
    }
    await lockContentResources(tx, [
      { id: revision.documentId, type: "document" },
    ]);
    await assertDocumentPermission(
      tx,
      revision.documentId,
      actor.id,
      ContentAccessLevel.FULL_ACCESS,
    );
    const target = revisionPin(revision);
    const lockedRevision = await loadExactRevision(tx, target);
    if (
      lockedRevision.document.currentRevisionId !== lockedRevision.id ||
      lockedRevision.document.version !== lockedRevision.version
    ) {
      conflict("The requested document revision is stale");
    }
    if (
      reviewer.id === actor.personId ||
      reviewer.id === lockedRevision.createdByUser.personId
    ) {
      invalid("A person cannot review their own request or document revision");
    }
    const duplicateCandidates = await tx.task.findMany({
      where: {
        AND: [
          genuineReviewChildWhere(authorityTask.id),
          {
            assigneePersonId: reviewer.id,
          },
          {
            contextJson: {
              equals: target.revisionId,
              path: [DOCUMENT_REVIEW_CONTEXT_KEY, "target", "revisionId"],
            },
          },
        ],
      },
      select: reviewTaskSelect,
    });
    let hasAuthenticDuplicate = false;
    for (const candidate of duplicateCandidates) {
      const candidateRequest = readReviewRequest(candidate.contextJson);
      if (
        candidateRequest &&
        sameDocumentRevisionPin(candidateRequest.target, target) &&
        (await hasValidReviewTaskProvenance(tx, candidate, candidateRequest))
      ) {
        hasAuthenticDuplicate = true;
        break;
      }
    }
    if (hasAuthenticDuplicate) {
      conflict("This person already has a review task for this revision");
    }

    const request = ReviewRequestV1Schema.parse({
      authorityTaskId: authorityTask.id,
      instructions: input.instructions,
      requestedAt: now.toISOString(),
      requestedByUserId: actor.id,
      schema: "optimitron.review-request.v1",
      target,
    });
    const bindingFields = {
      applicationPolicy: TaskApplicationPolicy.CLOSED,
      assigneePersonId: reviewer.id,
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      createdByUserId: actor.id,
      executionMode: TaskExecutionMode.HUMAN_ONLY,
      isPublic: false,
      jurisdictionId: authorityTask.jurisdictionId,
      ownerOrganizationId: authorityTask.ownerOrganizationId,
      parentTaskId: authorityTask.id,
      taskKey,
    };
    const bindingHash = await hashDocumentReviewBinding(bindingFields, request);
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
        title: `Review: ${lockedRevision.title}`.slice(0, 300),
      },
      select: { id: true },
    });
    return { request, reviewTaskId: reviewTask.id };
  });
}

export async function submitDocumentReview(
  reviewTaskId: string,
  rawInput: unknown,
  actorUserId: string,
  options: {
    clientAccessBoundary?: TaskClientAccessBoundary;
    idempotencyKey: string;
    now?: Date;
  },
) {
  const input = SubmitDocumentReviewInputSchema.parse(rawInput);
  const idempotencyKey = requireIdempotencyKey(options.idempotencyKey);
  const now = options.now ?? new Date();
  const requestHash = await sha256CanonicalJson({
    actorUserId,
    input,
    reviewTaskId,
  });

  return prisma.$transaction(async (tx) => {
    const actor = await getActor(tx, actorUserId);
    const initialTask = await tx.task.findFirst({
      where: taskBoundaryWhere(reviewTaskId, options.clientAccessBoundary),
      select: reviewTaskSelect,
    });
    const initialRequest = readReviewRequest(initialTask?.contextJson);
    if (
      !initialTask ||
      !initialRequest ||
      initialTask.assigneePersonId !== actor.personId ||
      initialTask.createdByUserId === actor.id ||
      !(await hasValidReviewTaskProvenance(tx, initialTask, initialRequest))
    ) {
      notFound();
    }
    await lockTaskRow(tx, initialTask.id);
    const task = await tx.task.findFirst({
      where: taskBoundaryWhere(reviewTaskId, options.clientAccessBoundary),
      select: reviewTaskSelect,
    });
    const request = readReviewRequest(task?.contextJson);
    if (
      !task ||
      !request ||
      task.assigneePersonId !== actor.personId ||
      task.createdByUserId === actor.id ||
      !(await hasValidReviewTaskProvenance(tx, task, request))
    ) {
      notFound();
    }

    const existingArtifactId = await findIdempotentArtifactId(tx, {
      idempotencyKey,
      kind: REVIEW_RESPONSE_ARTIFACT_KIND,
      requestHash,
      taskId: task.id,
    });
    if (existingArtifactId) {
      const existing = await findAuthenticReviewResponse(
        task,
        request,
        existingArtifactId,
      );
      if (!existing) conflict("The prior review response is invalid");
      return {
        artifact: {
          contentHash: existing.artifact.contentHash,
          id: existing.artifact.id,
        },
        comment: { id: existing.response.comment.id },
        response: existing.response,
        verification: {
          id: existing.verification.id,
          result: existing.verification.result,
        },
      };
    }
    if (await findAuthenticReviewResponse(task, request)) {
      conflict("A review response has already been submitted");
    }
    if (task.status !== TaskStatus.ACTIVE) {
      conflict("The review task is no longer active");
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
      invalid("A person cannot review their own document revision");
    }

    const comment = await createTopLevelTaskCommentInTransaction(tx, {
      authorUserId: actor.id,
      message: input.explanation,
      taskId: task.id,
    });
    const commentHash = await sha256CanonicalJson({
      authorNameSnapshot: comment.authorNameSnapshot,
      authorOrganizationId: comment.authorOrganizationId,
      authorPersonId: comment.authorPersonId,
      authorUserId: comment.authorUserId,
      createdAt: comment.createdAt.toISOString(),
      editedAt: comment.editedAt?.toISOString() ?? null,
      id: comment.id,
      message: comment.message,
      taskId: comment.taskId,
      version: comment.version,
    });
    const response = ReviewResponseV1Schema.parse({
      comment: { contentHash: commentHash, id: comment.id },
      explanation: input.explanation,
      reviewerPersonId: actor.personId,
      reviewerUserId: actor.id,
      reviewTaskId: task.id,
      schema: "optimitron.review-response.v1",
      submittedAt: now.toISOString(),
      target: request.target,
      verdict: input.verdict,
    });
    assertReviewResponseMatchesRequest(response, request, task.id);
    const metadata = {
      idempotencyKey,
      kind: REVIEW_RESPONSE_ARTIFACT_KIND,
      requestHash,
    };
    const attempt = await tx.taskExecutionAttempt.create({
      data: {
        completedAt: now,
        executorKey: `user:${actor.id}`,
        executorKind: TaskCandidateKind.USER,
        executorPersonId: actor.personId,
        executorUserId: actor.id,
        jurisdictionId: task.jurisdictionId,
        metadata: jsonValue(metadata),
        outputSummary: response.explanation,
        startedAt: now,
        status: TaskExecutionAttemptStatus.COMPLETED,
        taskId: task.id,
      },
      select: { id: true },
    });
    const artifact = await tx.taskExecutionArtifact.create({
      data: {
        contentHash: await sha256CanonicalJson(response),
        label: "Document review response",
        metadataJson: jsonValue(metadata),
        structuredResultJson: jsonValue(response),
        submittedByUserId: actor.id,
        taskExecutionAttemptId: attempt.id,
      },
      select: { contentHash: true, id: true },
    });
    const verification = await tx.taskVerification.create({
      data: {
        acceptanceCriteriaSnapshotJson: jsonValue({
          expectedDeliverable:
            "A reasoned verdict from the assigned reviewer on the exact revision",
          reviewRequest: request,
        }),
        completedAt: now,
        criterionResultsJson: jsonValue([
          {
            criterion:
              "Assigned reviewer submitted a reasoned exact-revision verdict",
            evidence: {
              artifactContentHash: artifact.contentHash,
              artifactId: artifact.id,
              commentContentHash: commentHash,
              commentId: comment.id,
            },
            passed: true,
          },
        ]),
        evidenceJson: jsonValue({
          artifactContentHash: artifact.contentHash,
          artifactId: artifact.id,
          commentContentHash: commentHash,
          commentId: comment.id,
        }),
        method: TaskVerificationMethod.DETERMINISTIC,
        result: TaskVerificationResult.ACCEPTED,
        reviewerUserId: actor.id,
        ruleKey: REVIEW_DELIVERY_RULE_KEY,
        ruleVersion: "1",
        selfReviewed: true,
        taskExecutionAttemptId: attempt.id,
      },
      select: { id: true, result: true },
    });
    const completed = await tx.task.updateMany({
      where: {
        deletedAt: null,
        id: task.id,
        status: TaskStatus.ACTIVE,
      },
      data: {
        completedAt: now,
        status: TaskStatus.VERIFIED,
        verifiedAt: now,
        verifiedByUserId: null,
      },
    });
    if (completed.count !== 1) {
      conflict("The review task changed before submission");
    }
    return {
      artifact,
      comment: { id: comment.id },
      response,
      verification,
    };
  });
}

export async function decideDocumentRevision(
  authorityTaskId: string,
  rawInput: unknown,
  actorUserId: string,
  options: {
    clientAccessBoundary?: TaskClientAccessBoundary;
    idempotencyKey: string;
    now?: Date;
  },
) {
  const input = DecideDocumentRevisionInputSchema.parse(rawInput);
  const idempotencyKey = requireIdempotencyKey(options.idempotencyKey);
  const now = options.now ?? new Date();
  const requestHash = await sha256CanonicalJson({
    actorUserId,
    authorityTaskId,
    input,
  });

  return prisma.$transaction(async (tx) => {
    const initial = await getManagedAuthorityTask(
      tx,
      authorityTaskId,
      actorUserId,
      options.clientAccessBoundary,
    );
    await lockTaskRow(tx, initial.task.id);
    const { actor, task: authorityTask } = await getManagedAuthorityTask(
      tx,
      authorityTaskId,
      actorUserId,
      options.clientAccessBoundary,
    );
    const existingArtifactId = await findIdempotentArtifactId(tx, {
      idempotencyKey,
      kind: INTERNAL_DECISION_ARTIFACT_KIND,
      requestHash,
      taskId: authorityTask.id,
    });
    if (existingArtifactId) {
      const artifact = await loadArtifactWithAttempt(tx, existingArtifactId);
      const decision = await readAuthenticDecisionArtifact(
        artifact,
        authorityTask.id,
      );
      if (!decision) conflict("The prior internal decision is invalid");
      return {
        artifact: { contentHash: artifact.contentHash, id: artifact.id },
        decision,
      };
    }

    const targetRevision = await loadRevisionById(tx, input.documentRevisionId);
    if (targetRevision.document.taskId !== authorityTask.id) notFound();
    await lockContentResources(tx, [
      { id: targetRevision.documentId, type: "document" },
    ]);
    await assertDocumentPermission(
      tx,
      targetRevision.documentId,
      actor.id,
      ContentAccessLevel.FULL_ACCESS,
    );
    const target = revisionPin(targetRevision);
    const lockedTarget = await loadExactRevision(tx, target);
    if (
      lockedTarget.document.currentRevisionId !== lockedTarget.id ||
      lockedTarget.document.version !== lockedTarget.version
    ) {
      conflict("Only the current document revision can be decided");
    }

    const reviewed = await loadAuthenticReviewArtifact(
      tx,
      input.reviewArtifactId,
    );
    if (
      reviewed.request.authorityTaskId !== authorityTask.id ||
      reviewed.task.status !== TaskStatus.VERIFIED ||
      !sameDocumentRevisionPin(reviewed.response.target, target)
    ) {
      notFound();
    }
    if (
      actor.personId === reviewed.response.reviewerPersonId ||
      lockedTarget.createdByUser.personId === reviewed.response.reviewerPersonId
    ) {
      invalid("The decision requires an independent review");
    }
    if (input.action === "ADOPT" && reviewed.response.verdict !== "APPROVE") {
      conflict("Adoption requires an APPROVE verdict");
    }

    const priorArtifacts = await tx.taskExecutionArtifact.findMany({
      where: {
        deletedAt: null,
        taskExecutionAttempt: {
          deletedAt: null,
          metadata: {
            equals: INTERNAL_DECISION_ARTIFACT_KIND,
            path: ["kind"],
          },
          taskId: authorityTask.id,
        },
      },
      select: artifactWithAttemptSelect,
    });
    for (const priorArtifact of priorArtifacts) {
      const prior = await readAuthenticDecisionArtifact(
        priorArtifact,
        authorityTask.id,
      );
      if (prior && sameDocumentRevisionPin(prior.target, target)) {
        conflict("This revision already has an internal decision");
      }
    }

    const decision = InternalDocumentDecisionV1Schema.parse({
      action: input.action,
      authorityTaskId: authorityTask.id,
      decidedAt: now.toISOString(),
      decidedByPersonId: actor.personId,
      decidedByUserId: actor.id,
      reason: input.action === "ADOPT" ? (input.reason ?? null) : input.reason,
      review: {
        artifactId: reviewed.artifact.id,
        contentHash: reviewed.artifact.contentHash,
        reviewerPersonId: reviewed.response.reviewerPersonId,
        verdict: reviewed.response.verdict,
      },
      schema: "optimitron.internal-document-decision.v1",
      scope: "INTERNAL",
      target,
    });
    const artifact = await createCompletedArtifact({
      actor,
      idempotencyKey,
      kind: INTERNAL_DECISION_ARTIFACT_KIND,
      label:
        decision.action === "ADOPT"
          ? "Internal document adoption"
          : "Internal document rejection",
      now,
      requestHash,
      task: authorityTask,
      tx,
      value: decision,
    });
    return { artifact, decision };
  });
}

async function buildPanelReview(
  tx: Prisma.TransactionClient,
  task: ReviewTask,
): Promise<DocumentReviewPanelReview | null> {
  const request = readReviewRequest(task.contextJson);
  if (
    !request ||
    !task.assigneePerson ||
    !(await hasValidReviewTaskProvenance(tx, task, request))
  ) {
    return null;
  }
  const revision = await loadExactRevisionOrNull(tx, request.target);
  if (!revision) return null;
  const result = await findAuthenticReviewResponse(task, request);
  const stale =
    task.status === TaskStatus.STALE ||
    revision.document.currentRevisionId !== revision.id ||
    revision.document.version !== revision.version;
  const state: DocumentReviewState = stale
    ? "STALE"
    : !result
      ? "AWAITING_RESPONSE"
      : result.response.verdict === "APPROVE"
        ? "APPROVED"
        : result.response.verdict === "CHANGES_REQUESTED"
          ? "CHANGES_REQUESTED"
          : result.response.verdict === "REJECT"
            ? "REJECTED"
            : "ABSTAINED";
  return {
    request,
    response: result
      ? { ...result.response, artifactId: result.artifact.id }
      : null,
    reviewTaskId: task.id,
    reviewer: task.assigneePerson,
    state,
    target: {
      ...request.target,
      body: revision.body,
      stale,
      title: revision.title,
    },
  };
}

export async function getDocumentReviewPanelData(
  taskId: string,
  actorUserId: string,
  options: { clientAccessBoundary?: TaskClientAccessBoundary } = {},
): Promise<DocumentReviewPanelData | null> {
  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findFirst({
      where: { deletedAt: null, id: actorUserId },
      select: { id: true, personId: true },
    });
    const requestedTaskProbe = await tx.task.findFirst({
      where: taskBoundaryWhere(taskId, options.clientAccessBoundary),
      select: requestedTaskProbeSelect,
    });
    if (!actor?.personId || !requestedTaskProbe) return null;
    const directRequest = readReviewRequest(requestedTaskProbe.contextJson);
    if (
      directRequest &&
      requestedTaskProbe.assigneePersonId === actor.personId
    ) {
      const requestedReviewTask = await tx.task.findFirst({
        where: taskBoundaryWhere(taskId, options.clientAccessBoundary),
        select: reviewTaskSelect,
      });
      if (!requestedReviewTask) return null;
      const review = await buildPanelReview(tx, requestedReviewTask);
      if (!review) return null;
      return {
        authorityTaskId: review.request.authorityTaskId,
        canSubmit:
          review.state === "AWAITING_RESPONSE" &&
          requestedReviewTask.status === TaskStatus.ACTIVE &&
          requestedReviewTask.createdByUserId !== actor.id,
        mode: "REVIEWER",
        review,
      };
    }

    const authorityTaskId =
      directRequest?.authorityTaskId ?? requestedTaskProbe.id;
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
    const reviewTasks = await tx.task.findMany({
      where: {
        AND: [
          genuineReviewChildWhere(authorityTaskId),
          ...(options.clientAccessBoundary
            ? [getTaskClientAccessWhere(options.clientAccessBoundary)]
            : []),
        ],
      },
      orderBy: { createdAt: "asc" },
      select: reviewTaskSelect,
    });
    const reviews = (
      await Promise.all(reviewTasks.map((task) => buildPanelReview(tx, task)))
    ).filter((review): review is DocumentReviewPanelReview => review != null);

    const operationArtifacts = (kind: string) =>
      tx.taskExecutionArtifact.findMany({
        where: {
          deletedAt: null,
          taskExecutionAttempt: {
            deletedAt: null,
            metadata: { equals: kind, path: ["kind"] },
            taskId: authorityTaskId,
          },
        },
        orderBy: { createdAt: "desc" as const },
        select: artifactWithAttemptSelect,
      });
    const [decisionArtifacts, proposalArtifacts, applicationArtifacts] =
      await Promise.all([
        operationArtifacts(INTERNAL_DECISION_ARTIFACT_KIND),
        operationArtifacts(PROPOSAL_ARTIFACT_KIND),
        operationArtifacts(PROPOSAL_APPLICATION_ARTIFACT_KIND),
      ]);
    const decisions: Array<{
      artifactId: string;
      decision: InternalDocumentDecisionV1;
    }> = [];
    for (const artifact of decisionArtifacts) {
      const decision = await readAuthenticDecisionArtifact(
        artifact,
        authorityTaskId,
      );
      if (decision) decisions.push({ artifactId: artifact.id, decision });
    }
    const appliedProposalArtifactIds = new Set<string>();
    for (const artifact of applicationArtifacts) {
      const application = await readAuthenticApplicationArtifact(
        artifact,
        authorityTaskId,
      );
      if (application) {
        appliedProposalArtifactIds.add(application.proposalArtifact.artifactId);
      }
    }
    const proposals: DocumentProposalPreview[] = [];
    for (const artifact of proposalArtifacts) {
      if (appliedProposalArtifactIds.has(artifact.id)) continue;
      const preview = await buildProposalPreview(tx, artifact, authorityTaskId);
      if (preview) proposals.push(preview);
    }
    return {
      authorityTaskId,
      decisions,
      mode: "MANAGER",
      proposals,
      reviews,
    };
  });
}
