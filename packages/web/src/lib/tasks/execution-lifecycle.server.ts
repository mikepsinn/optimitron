import {
  AgentExecutorStatus,
  TaskCandidateKind,
  TaskClaimStatus,
  TaskEdgeType,
  TaskExecutionAttemptStatus,
  TaskExecutionMode,
  TaskStatus,
  TaskVerificationMethod,
  TaskVerificationResult,
  type Prisma,
} from "@optimitron/db";
import { isReservedPlanningRootTask } from "@optimitron/db/task-keys";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSourceArtifactVisibilityWhere } from "@/lib/source-artifact-visibility.server";
import { readTaskContext } from "@/lib/tasks/task-context";
import {
  canUserViewInternalTaskContent,
  getTaskAccessWhere,
} from "@/lib/tasks/task-visibility.server";

const ACTIVE_CLAIM_STATUSES = [
  TaskClaimStatus.CLAIMED,
  TaskClaimStatus.IN_PROGRESS,
  TaskClaimStatus.COMPLETED,
];

const MoneySchema = z
  .object({
    currency: z
      .string()
      .regex(/^[a-zA-Z]{3}$/)
      .transform((value) => value.toLowerCase()),
    minorUnits: z.number().int().nonnegative(),
  })
  .strict();

export const StartTaskExecutionSchema = z
  .object({
    agentExecutorId: z.string().min(1).nullable().optional(),
    confidence: z.number().min(0).max(1).nullable().optional(),
    estimatedCost: MoneySchema.nullable().optional(),
    estimatedDurationSeconds: z.number().int().positive().nullable().optional(),
    taskId: z.string().min(1),
  })
  .strict();

export const SubmitTaskArtifactSchema = z
  .object({
    contentAttachmentId: z.string().min(1).optional(),
    documentRevisionId: z.string().min(1).optional(),
    externalUrl: z.string().url().optional(),
    label: z.string().min(1).max(500).nullable().optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
    structuredResult: z.unknown().optional(),
    taskCommentAttachmentId: z.string().min(1).optional(),
    taskExecutionAttemptId: z.string().min(1),
  })
  .strict()
  .superRefine((value, context) => {
    const payloadCount = [
      value.contentAttachmentId,
      value.documentRevisionId,
      value.externalUrl,
      value.structuredResult,
      value.taskCommentAttachmentId,
    ].filter((item) => item !== undefined).length;
    if (payloadCount !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Submit exactly one artifact payload",
      });
    }
  });

export const SubmitTaskForVerificationSchema = z
  .object({
    actualCost: MoneySchema.nullable().optional(),
    actualDurationSeconds: z.number().int().positive(),
    method: z
      .nativeEnum(TaskVerificationMethod)
      .default(TaskVerificationMethod.REVIEWER),
    outputSummary: z.string().min(1).max(20_000),
    taskExecutionAttemptId: z.string().min(1),
  })
  .strict();

export const VerifyTaskExecutionSchema = z
  .object({
    criterionResults: z.array(
      z
        .object({
          criterion: z.string().min(1),
          evidence: z.string().max(10_000).nullable().optional(),
          passed: z.boolean(),
        })
        .strict(),
    ),
    evidence: z.record(z.unknown()).nullable().optional(),
    note: z.string().max(20_000).nullable().optional(),
    result: z.enum(["ACCEPTED", "REJECTED"]),
    taskVerificationId: z.string().min(1),
  })
  .strict();

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function startTaskExecution(
  rawInput: unknown,
  actorUserId: string,
) {
  const input = StartTaskExecutionSchema.parse(rawInput);
  const actor = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: { personId: true },
  });
  if (!actor) throw new Error("Task not found");

  return prisma.$transaction(async (tx) => {
    const taskAccess = getTaskAccessWhere({
      action: "EXECUTE",
      personId: actor.personId,
      userId: actorUserId,
    });
    const task = await tx.task.findFirst({
      where: {
        deletedAt: null,
        id: input.taskId,
        status: TaskStatus.ACTIVE,
        OR: [
          taskAccess,
          {
            claims: {
              some: {
                deletedAt: null,
                status: { in: [...ACTIVE_CLAIM_STATUSES] },
                userId: actorUserId,
              },
            },
          },
        ],
      },
      select: {
        childTasks: {
          where: {
            deletedAt: null,
            status: { in: [TaskStatus.DRAFT, TaskStatus.ACTIVE] },
          },
          select: { id: true },
          take: 1,
        },
        executionAttempts: {
          where: {
            deletedAt: null,
            OR: [
              {
                status: {
                  in: [
                    TaskExecutionAttemptStatus.QUEUED,
                    TaskExecutionAttemptStatus.RUNNING,
                  ],
                },
              },
              {
                status: TaskExecutionAttemptStatus.COMPLETED,
                verifications: {
                  some: {
                    deletedAt: null,
                    result: TaskVerificationResult.PENDING,
                  },
                },
              },
            ],
          },
          select: { id: true },
          take: 1,
        },
        executionMode: true,
        id: true,
        incomingEdges: {
          where: {
            deletedAt: null,
            edgeType: {
              in: [TaskEdgeType.BLOCKS, TaskEdgeType.DEPENDS_ON],
            },
            fromTask: {
              deletedAt: null,
              status: { not: TaskStatus.VERIFIED },
            },
          },
          select: { id: true },
          take: 1,
        },
        jurisdictionId: true,
        taskKey: true,
      },
    });
    if (!task) throw new Error("Task not found");
    if (isReservedPlanningRootTask(task) || task.childTasks.length > 0) {
      throw new Error("Task is a container and cannot enter execution");
    }
    if (task.incomingEdges.length > 0) throw new Error("Task is blocked");
    if (task.executionAttempts.length > 0) {
      throw new Error(
        "Task already has an active or pending-verification attempt",
      );
    }

    const agent = input.agentExecutorId
      ? await tx.agentExecutor.findFirst({
          where: {
            deletedAt: null,
            id: input.agentExecutorId,
            status: AgentExecutorStatus.ACTIVE,
          },
          select: { agentKey: true, id: true },
        })
      : null;
    if (input.agentExecutorId && !agent)
      throw new Error("Agent executor not found");
    if (agent && task.executionMode === TaskExecutionMode.HUMAN_ONLY) {
      throw new Error("Task requires a human executor");
    }
    if (!agent && task.executionMode === TaskExecutionMode.AGENT_ONLY) {
      throw new Error("Task requires an agent executor");
    }

    const attempt = await tx.taskExecutionAttempt.create({
      data: {
        agentExecutorId: agent?.id ?? null,
        confidence: input.confidence ?? null,
        estimatedCostCurrency: input.estimatedCost?.currency ?? null,
        estimatedCostMinorUnits:
          input.estimatedCost?.minorUnits == null
            ? null
            : BigInt(input.estimatedCost.minorUnits),
        estimatedDurationSeconds: input.estimatedDurationSeconds ?? null,
        executorKey: agent ? agent.agentKey : `user:${actorUserId}`,
        executorKind: agent ? TaskCandidateKind.AGENT : TaskCandidateKind.USER,
        executorPersonId: agent ? null : actor.personId,
        executorUserId: agent ? null : actorUserId,
        jurisdictionId: task.jurisdictionId,
        metadata: { startedByUserId: actorUserId },
        startedAt: new Date(),
        status: TaskExecutionAttemptStatus.RUNNING,
        taskId: task.id,
      },
      select: {
        agentExecutorId: true,
        executorKind: true,
        id: true,
        startedAt: true,
        status: true,
        taskId: true,
      },
    });
    return attempt;
  });
}

async function loadAttemptForContribution(
  tx: Prisma.TransactionClient,
  attemptId: string,
  actorUserId: string,
) {
  const actor = await tx.user.findUnique({
    where: { id: actorUserId },
    select: { personId: true },
  });
  if (!actor) return null;
  return tx.taskExecutionAttempt.findFirst({
    where: {
      deletedAt: null,
      id: attemptId,
      task: {
        deletedAt: null,
        ...getTaskAccessWhere({
          action: "EXECUTE",
          personId: actor.personId,
          userId: actorUserId,
        }),
      },
    },
    select: {
      agentExecutorId: true,
      executorUserId: true,
      id: true,
      status: true,
      task: { select: { contextJson: true, id: true } },
      taskId: true,
    },
  });
}

export async function submitTaskArtifact(
  rawInput: unknown,
  actorUserId: string,
) {
  const input = SubmitTaskArtifactSchema.parse(rawInput);
  return prisma.$transaction(async (tx) => {
    const attempt = await loadAttemptForContribution(
      tx,
      input.taskExecutionAttemptId,
      actorUserId,
    );
    if (!attempt || attempt.status !== TaskExecutionAttemptStatus.RUNNING) {
      throw new Error("Task execution attempt not found");
    }

    let contentHash: string;
    if (input.documentRevisionId) {
      const revision = await tx.documentRevision.findFirst({
        where: {
          deletedAt: null,
          document: { deletedAt: null, taskId: attempt.taskId },
          id: input.documentRevisionId,
        },
        select: { body: true, contentHash: true, title: true },
      });
      if (!revision) throw new Error("Artifact not found");
      contentHash =
        revision.contentHash ??
        (await sha256CanonicalJson({
          body: revision.body,
          title: revision.title,
        }));
    } else if (input.contentAttachmentId) {
      const attachment = await tx.contentAttachment.findFirst({
        where: {
          deletedAt: null,
          id: input.contentAttachmentId,
          OR: [
            { document: { deletedAt: null, taskId: attempt.taskId } },
            {
              collectionRecord: {
                deletedAt: null,
                taskId: attempt.taskId,
              },
            },
          ],
        },
        select: { checksumSha256: true },
      });
      if (!attachment) throw new Error("Artifact not found");
      contentHash = attachment.checksumSha256;
    } else if (input.taskCommentAttachmentId) {
      const attachment = await tx.taskCommentAttachment.findFirst({
        where: {
          deletedAt: null,
          id: input.taskCommentAttachmentId,
          taskId: attempt.taskId,
          uploadedAt: { not: null },
        },
        select: { checksumSha256: true },
      });
      if (!attachment) throw new Error("Artifact not found");
      contentHash = attachment.checksumSha256;
    } else if (input.externalUrl) {
      const url = new URL(input.externalUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("External artifact URL must use HTTP or HTTPS");
      }
      contentHash = await sha256CanonicalJson({ externalUrl: url.toString() });
    } else {
      contentHash = await sha256CanonicalJson({
        structuredResult: input.structuredResult,
      });
    }

    return tx.taskExecutionArtifact.create({
      data: {
        contentAttachmentId: input.contentAttachmentId ?? null,
        contentHash,
        documentRevisionId: input.documentRevisionId ?? null,
        externalUrl: input.externalUrl ?? null,
        label: input.label ?? null,
        metadataJson:
          input.metadata == null ? undefined : jsonValue(input.metadata),
        structuredResultJson:
          input.structuredResult === undefined
            ? undefined
            : jsonValue(input.structuredResult),
        submittedByAgentExecutorId: attempt.agentExecutorId,
        submittedByUserId: attempt.agentExecutorId ? null : actorUserId,
        taskCommentAttachmentId: input.taskCommentAttachmentId ?? null,
        taskExecutionAttemptId: attempt.id,
      },
      select: {
        contentHash: true,
        createdAt: true,
        id: true,
        label: true,
        taskExecutionAttemptId: true,
      },
    });
  });
}

export async function submitTaskForVerification(
  rawInput: unknown,
  actorUserId: string,
) {
  const input = SubmitTaskForVerificationSchema.parse(rawInput);
  return prisma.$transaction(async (tx) => {
    const attempt = await loadAttemptForContribution(
      tx,
      input.taskExecutionAttemptId,
      actorUserId,
    );
    if (!attempt || attempt.status !== TaskExecutionAttemptStatus.RUNNING) {
      throw new Error("Task execution attempt not found");
    }
    const artifactCount = await tx.taskExecutionArtifact.count({
      where: { deletedAt: null, taskExecutionAttemptId: attempt.id },
    });
    if (artifactCount === 0) {
      throw new Error("Submit at least one artifact before verification");
    }
    const taskContext = readTaskContext(attempt.task.contextJson);
    const acceptanceCriteria = taskContext.acceptanceCriteria ?? [];
    if (acceptanceCriteria.length === 0) {
      throw new Error("Task has no acceptance criteria snapshot");
    }

    const completedAt = new Date();
    const [updatedAttempt, verification] = await Promise.all([
      tx.taskExecutionAttempt.update({
        where: { id: attempt.id },
        data: {
          actualCostCurrency: input.actualCost?.currency ?? null,
          actualCostMinorUnits:
            input.actualCost?.minorUnits == null
              ? null
              : BigInt(input.actualCost.minorUnits),
          actualDurationSeconds: input.actualDurationSeconds,
          completedAt,
          outputSummary: input.outputSummary,
          status: TaskExecutionAttemptStatus.COMPLETED,
        },
        select: { completedAt: true, id: true, status: true, taskId: true },
      }),
      tx.taskVerification.create({
        data: {
          acceptanceCriteriaSnapshotJson: {
            acceptanceCriteria,
            expectedDeliverable: taskContext.expectedDeliverable ?? null,
          },
          method: input.method,
          result: TaskVerificationResult.PENDING,
          taskExecutionAttemptId: attempt.id,
        },
        select: {
          acceptanceCriteriaSnapshotJson: true,
          id: true,
          method: true,
          result: true,
        },
      }),
    ]);
    return { attempt: updatedAttempt, verification };
  });
}

export async function verifyTaskExecution(
  rawInput: unknown,
  actorUserId: string,
) {
  const input = VerifyTaskExecutionSchema.parse(rawInput);
  const actor = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: { isAdmin: true, personId: true },
  });
  if (!actor) throw new Error("Task verification not found");

  return prisma.$transaction(async (tx) => {
    const verification = await tx.taskVerification.findFirst({
      where: {
        deletedAt: null,
        id: input.taskVerificationId,
        result: TaskVerificationResult.PENDING,
        taskExecutionAttempt: {
          deletedAt: null,
          status: TaskExecutionAttemptStatus.COMPLETED,
          task: {
            deletedAt: null,
            OR: [
              getTaskAccessWhere({
                action: "VERIFY",
                personId: actor.personId,
                userId: actorUserId,
              }),
              ...(actor.isAdmin ? [{ isPublic: true }] : []),
            ],
          },
        },
      },
      select: {
        id: true,
        taskExecutionAttempt: {
          select: {
            actualCostCurrency: true,
            actualCostMinorUnits: true,
            actualDurationSeconds: true,
            executorUserId: true,
            id: true,
            taskId: true,
          },
        },
      },
    });
    if (!verification) throw new Error("Task verification not found");

    const accepted = input.result === "ACCEPTED";
    const completedAt = new Date();
    const updatedVerification = await tx.taskVerification.update({
      where: { id: verification.id },
      data: {
        completedAt,
        criterionResultsJson: jsonValue(input.criterionResults),
        evidenceJson:
          input.evidence == null ? undefined : jsonValue(input.evidence),
        note: input.note ?? null,
        result: accepted
          ? TaskVerificationResult.ACCEPTED
          : TaskVerificationResult.REJECTED,
        reviewerUserId: actorUserId,
        selfReviewed:
          verification.taskExecutionAttempt.executorUserId === actorUserId,
      },
      select: {
        completedAt: true,
        id: true,
        result: true,
        selfReviewed: true,
      },
    });

    if (accepted) {
      const attempt = verification.taskExecutionAttempt;
      await tx.task.update({
        where: { id: attempt.taskId },
        data: {
          actualCashCostUsd:
            attempt.actualCostMinorUnits == null ||
            attempt.actualCostCurrency?.toLowerCase() !== "usd"
              ? undefined
              : Number(attempt.actualCostMinorUnits) / 100,
          actualEffortSeconds: attempt.actualDurationSeconds ?? undefined,
          completedAt,
          status: TaskStatus.VERIFIED,
          verifiedAt: completedAt,
          verifiedByUserId: actorUserId,
        },
      });
    } else {
      await Promise.all([
        tx.taskExecutionAttempt.update({
          where: { id: verification.taskExecutionAttempt.id },
          data: { status: TaskExecutionAttemptStatus.REJECTED },
        }),
        tx.task.update({
          where: { id: verification.taskExecutionAttempt.taskId },
          data: {
            completedAt: null,
            status: TaskStatus.ACTIVE,
            verifiedAt: null,
            verifiedByUserId: null,
          },
        }),
      ]);
    }

    return updatedVerification;
  });
}

export async function getTaskAuditTrail(taskId: string, actorUserId: string) {
  if (!(await canUserViewInternalTaskContent(taskId, actorUserId))) {
    throw new Error("Task not found");
  }
  const task = await prisma.task.findFirst({
    where: { deletedAt: null, id: taskId },
    select: {
      claims: {
        where: { deletedAt: null },
        orderBy: { claimedAt: "asc" },
        select: {
          claimedAt: true,
          completedAt: true,
          id: true,
          status: true,
          userId: true,
          verifiedAt: true,
        },
      },
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: {
          authorUserId: true,
          createdAt: true,
          id: true,
          kind: true,
          source: true,
        },
      },
      executionAttempts: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: {
          actualCostCurrency: true,
          actualCostMinorUnits: true,
          actualDurationSeconds: true,
          agentExecutorId: true,
          artifacts: {
            where: { deletedAt: null },
            select: {
              contentHash: true,
              createdAt: true,
              id: true,
              label: true,
            },
          },
          completedAt: true,
          createdAt: true,
          executorKind: true,
          executorUserId: true,
          id: true,
          startedAt: true,
          status: true,
          verifications: {
            where: { deletedAt: null },
            select: {
              completedAt: true,
              createdAt: true,
              id: true,
              method: true,
              result: true,
              reviewerUserId: true,
              selfReviewed: true,
            },
          },
        },
      },
      externalActionRequests: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: {
          approvedAt: true,
          approvedByUserId: true,
          createdAt: true,
          destination: true,
          executedAt: true,
          failureMessage: true,
          id: true,
          operation: true,
          payloadHash: true,
          requestedByAgentExecutorId: true,
          requestedByUserId: true,
          status: true,
          taskExecutionAttemptId: true,
        },
      },
      id: true,
      sourceArtifacts: {
        where: {
          deletedAt: null,
          sourceArtifact: getSourceArtifactVisibilityWhere(actorUserId),
        },
        select: {
          isPrimary: true,
          sourceArtifact: {
            select: {
              artifactType: true,
              contentHash: true,
              externalKey: true,
              id: true,
              sourceKey: true,
              sourceRef: true,
              sourceSystem: true,
              sourceUrl: true,
              title: true,
            },
          },
        },
      },
      status: true,
      title: true,
    },
  });
  if (!task) throw new Error("Task not found");
  return task;
}
