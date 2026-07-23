import {
  ExternalActionRequestStatus,
  FormSubmissionStatus,
  TaskClaimStatus,
  TaskExecutionAttemptStatus,
  type Prisma,
} from "@optimitron/db";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStartedByUserId } from "@/lib/tasks/execution-lifecycle.server";
import {
  getTaskAccessWhere,
  getTaskClientAccessWhere,
  type TaskClientAccessBoundary,
} from "@/lib/tasks/task-visibility.server";

const MAX_APPROVAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1_000;
const DEFAULT_APPROVAL_WINDOW_MS = 24 * 60 * 60 * 1_000;
const ACTIVE_CLAIM_STATUSES = [
  TaskClaimStatus.CLAIMED,
  TaskClaimStatus.IN_PROGRESS,
  TaskClaimStatus.COMPLETED,
] as const;

const JsonObjectSchema = z.record(z.unknown());

export const ProposeExternalActionSchema = z
  .object({
    destination: z.string().trim().min(1).max(2_000),
    expiresAt: z.string().datetime().optional(),
    idempotencyKey: z.string().trim().min(8).max(500),
    operation: z.string().trim().min(1).max(200),
    payload: JsonObjectSchema,
    taskExecutionAttemptId: z.string().trim().min(1).nullable().optional(),
    taskId: z.string().trim().min(1),
  })
  .strict();

export const DecideExternalActionSchema = z
  .object({
    decision: z.enum(["APPROVE", "REJECT"]),
    externalActionRequestId: z.string().trim().min(1),
  })
  .strict();

export const RecordExternalActionResultSchema = z
  .object({
    externalActionRequestId: z.string().trim().min(1),
    failureMessage: z.string().trim().min(1).max(20_000).nullable().optional(),
    receipt: JsonObjectSchema.nullable().optional(),
    result: z.enum(["EXECUTED", "FAILED"]),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.result === "FAILED" && !value.failureMessage) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "FAILED external actions require failureMessage",
        path: ["failureMessage"],
      });
    }
  });

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function externalActionSelect() {
  return {
    approvedAt: true,
    approvedByUserId: true,
    approvedPayloadHash: true,
    createdAt: true,
    destination: true,
    executedAt: true,
    executionReceiptJson: true,
    expiresAt: true,
    failureMessage: true,
    id: true,
    idempotencyKey: true,
    operation: true,
    payloadHash: true,
    payloadJson: true,
    requestedByAgentExecutorId: true,
    requestedByUserId: true,
    status: true,
    taskExecutionAttemptId: true,
    taskId: true,
  } satisfies Prisma.ExternalActionRequestSelect;
}

async function loadActor(
  tx: Prisma.TransactionClient | typeof prisma,
  actorUserId: string,
) {
  return tx.user.findUnique({
    where: { id: actorUserId },
    select: { personId: true },
  });
}

function approvalExpiry(input: string | undefined, now: Date) {
  const expiresAt = input
    ? new Date(input)
    : new Date(now.getTime() + DEFAULT_APPROVAL_WINDOW_MS);
  if (
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt <= now ||
    expiresAt.getTime() - now.getTime() > MAX_APPROVAL_WINDOW_MS
  ) {
    throw new Error("External action approval must expire within seven days");
  }
  return expiresAt;
}

export async function proposeExternalAction(
  rawInput: unknown,
  actorUserId: string,
  options?: { clientAccessBoundary?: TaskClientAccessBoundary },
) {
  const input = ProposeExternalActionSchema.parse(rawInput);
  const payloadHash = await sha256CanonicalJson({
    destination: input.destination,
    operation: input.operation,
    payload: input.payload,
  });
  const now = new Date();
  const expiresAt = approvalExpiry(input.expiresAt, now);

  return prisma.$transaction(async (tx) => {
    const actor = await loadActor(tx, actorUserId);
    if (!actor) throw new Error("Task not found");

    const task = await tx.task.findFirst({
      where: {
        AND: [
          ...(options?.clientAccessBoundary
            ? [getTaskClientAccessWhere(options.clientAccessBoundary)]
            : []),
        ],
        deletedAt: null,
        id: input.taskId,
        OR: [
          getTaskAccessWhere({
            action: "EXECUTE",
            personId: actor.personId,
            userId: actorUserId,
          }),
          ...(input.taskExecutionAttemptId
            ? [
                {
                  claims: {
                    some: {
                      deletedAt: null,
                      executionAttempts: {
                        some: {
                          deletedAt: null,
                          id: input.taskExecutionAttemptId,
                        },
                      },
                      status: { in: [...ACTIVE_CLAIM_STATUSES] },
                      userId: actorUserId,
                    },
                  },
                } satisfies Prisma.TaskWhereInput,
              ]
            : []),
        ],
      },
      select: { id: true },
    });
    if (!task) throw new Error("Task not found");

    const attempt = input.taskExecutionAttemptId
      ? await tx.taskExecutionAttempt.findFirst({
          where: {
            deletedAt: null,
            id: input.taskExecutionAttemptId,
            OR: [
              { executorUserId: actorUserId },
              {
                metadata: {
                  equals: actorUserId,
                  path: ["startedByUserId"],
                },
              },
              {
                taskClaim: {
                  deletedAt: null,
                  status: { in: [...ACTIVE_CLAIM_STATUSES] },
                  userId: actorUserId,
                },
              },
            ],
            status: {
              in: [
                TaskExecutionAttemptStatus.RUNNING,
                TaskExecutionAttemptStatus.COMPLETED,
              ],
            },
            taskId: task.id,
          },
          select: { agentExecutorId: true, id: true },
        })
      : null;
    if (input.taskExecutionAttemptId && !attempt) {
      throw new Error("Task execution attempt not found");
    }

    const request = await tx.externalActionRequest.upsert({
      where: { idempotencyKey: input.idempotencyKey },
      create: {
        destination: input.destination,
        expiresAt,
        idempotencyKey: input.idempotencyKey,
        operation: input.operation,
        payloadHash,
        payloadJson: jsonValue(input.payload),
        requestedByAgentExecutorId: attempt?.agentExecutorId ?? null,
        requestedByUserId: attempt?.agentExecutorId ? null : actorUserId,
        status: ExternalActionRequestStatus.PENDING,
        taskExecutionAttemptId: attempt?.id ?? null,
        taskId: task.id,
      },
      update: {},
      select: externalActionSelect(),
    });
    const sameRequest =
      request.taskId === task.id &&
      request.taskExecutionAttemptId === (attempt?.id ?? null) &&
      request.payloadHash === payloadHash &&
      request.destination === input.destination &&
      request.operation === input.operation;
    if (!sameRequest) {
      throw new Error(
        "External action idempotency key was already used for different content",
      );
    }
    return request;
  });
}

/** MANAGE access for the actor, intersected with the delegated client's
 * grant boundary when the call arrives via an OAuth token. */
function actionTaskWhere(
  actor: { personId: string | null },
  actorUserId: string,
  clientAccessBoundary?: TaskClientAccessBoundary,
): Prisma.TaskWhereInput {
  const manageWhere = getTaskAccessWhere({
    action: "MANAGE",
    personId: actor.personId,
    userId: actorUserId,
  });
  return {
    deletedAt: null,
    AND: [
      manageWhere,
      ...(clientAccessBoundary
        ? [getTaskClientAccessWhere(clientAccessBoundary)]
        : []),
    ],
  };
}

export async function listExternalActionRequestsForHuman(input: {
  actorUserId: string;
  clientAccessBoundary?: TaskClientAccessBoundary;
  limit?: number | null;
  status?: ExternalActionRequestStatus | null;
  taskId?: string | null;
}) {
  const actor = await loadActor(prisma, input.actorUserId);
  if (!actor) return [];
  const taskWhere = actionTaskWhere(
    actor,
    input.actorUserId,
    input.clientAccessBoundary,
  );
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.externalActionRequest.updateMany({
      where: {
        deletedAt: null,
        expiresAt: { lte: now },
        status: ExternalActionRequestStatus.PENDING,
        task: taskWhere,
      },
      data: { status: ExternalActionRequestStatus.EXPIRED },
    });
    await tx.formSubmission.updateMany({
      where: {
        status: FormSubmissionStatus.DRAFT,
        externalActionRequest: {
          is: {
            deletedAt: null,
            expiresAt: { lte: now },
            status: ExternalActionRequestStatus.EXPIRED,
            task: taskWhere,
          },
        },
      },
      data: { status: FormSubmissionStatus.CANCELLED },
    });
  });
  return prisma.externalActionRequest.findMany({
    where: {
      deletedAt: null,
      status: input.status ?? undefined,
      taskId: input.taskId ?? undefined,
      task: taskWhere,
    },
    orderBy: { createdAt: "desc" },
    select: externalActionSelect(),
    take: Math.min(Math.max(input.limit ?? 100, 1), 500),
  });
}

export async function decideExternalActionRequest(
  rawInput: unknown,
  actorUserId: string,
  options?: { clientAccessBoundary?: TaskClientAccessBoundary },
) {
  const input = DecideExternalActionSchema.parse(rawInput);
  return prisma.$transaction(async (tx) => {
    const actor = await loadActor(tx, actorUserId);
    if (!actor) throw new Error("External action request not found");
    const request = await tx.externalActionRequest.findFirst({
      where: {
        deletedAt: null,
        id: input.externalActionRequestId,
        status: ExternalActionRequestStatus.PENDING,
        task: actionTaskWhere(
          actor,
          actorUserId,
          options?.clientAccessBoundary,
        ),
        OR: [
          { requestedByUserId: actorUserId },
          {
            taskExecutionAttempt: {
              metadata: {
                equals: actorUserId,
                path: ["startedByUserId"],
              },
            },
          },
        ],
      },
      select: externalActionSelect(),
    });
    if (!request) throw new Error("External action request not found");

    const now = new Date();
    // Guard every PENDING → terminal transition with a conditional write so
    // two concurrent decisions can't both land (last-wins would let a
    // rejection silently overwrite an approval, or vice versa).
    const decided = await tx.externalActionRequest.updateMany({
      where: {
        deletedAt: null,
        id: request.id,
        status: ExternalActionRequestStatus.PENDING,
      },
      data:
        request.expiresAt <= now
          ? { status: ExternalActionRequestStatus.EXPIRED }
          : input.decision === "APPROVE"
            ? {
                approvedAt: now,
                approvedByUserId: actorUserId,
                approvedPayloadHash: request.payloadHash,
                status: ExternalActionRequestStatus.APPROVED,
              }
            : { status: ExternalActionRequestStatus.REJECTED },
    });
    if (decided.count === 0) {
      throw new Error("External action request is no longer pending");
    }
    if (request.expiresAt <= now || input.decision === "REJECT") {
      await tx.formSubmission.updateMany({
        where: { externalActionRequestId: request.id },
        data: { status: FormSubmissionStatus.CANCELLED },
      });
    }

    return tx.externalActionRequest.findUniqueOrThrow({
      where: { id: request.id },
      select: externalActionSelect(),
    });
  });
}

export async function recordExternalActionResult(
  rawInput: unknown,
  actorUserId: string,
) {
  const input = RecordExternalActionResultSchema.parse(rawInput);
  return prisma.$transaction(async (tx) => {
    const actor = await loadActor(tx, actorUserId);
    if (!actor) throw new Error("External action request not found");
    const request = await tx.externalActionRequest.findFirst({
      where: {
        deletedAt: null,
        id: input.externalActionRequestId,
        task: { deletedAt: null },
        OR: [
          { requestedByUserId: actorUserId },
          {
            requestedByAgentExecutorId: { not: null },
            taskExecutionAttempt: {
              deletedAt: null,
              metadata: {
                equals: actorUserId,
                path: ["startedByUserId"],
              },
            },
          },
        ],
      },
      select: {
        ...externalActionSelect(),
        taskExecutionAttempt: {
          select: { agentExecutorId: true, metadata: true },
        },
      },
    });
    if (!request) throw new Error("External action request not found");
    if (
      request.status === ExternalActionRequestStatus.EXECUTED ||
      request.status === ExternalActionRequestStatus.FAILED
    ) {
      return request;
    }
    if (request.status !== ExternalActionRequestStatus.APPROVED) {
      throw new Error("External action request is not approved");
    }
    if (
      !request.approvedPayloadHash ||
      request.approvedPayloadHash !== request.payloadHash
    ) {
      throw new Error("External action approval does not match its payload");
    }

    const now = new Date();
    if (request.expiresAt <= now) {
      const expired = await tx.externalActionRequest.update({
        where: { id: request.id },
        data: { status: ExternalActionRequestStatus.EXPIRED },
        select: externalActionSelect(),
      });
      await tx.formSubmission.updateMany({
        where: { externalActionRequestId: request.id },
        data: { status: FormSubmissionStatus.CANCELLED },
      });
      return expired;
    }

    const agentExecutorId =
      request.requestedByAgentExecutorId ===
        request.taskExecutionAttempt?.agentExecutorId &&
      getStartedByUserId(request.taskExecutionAttempt?.metadata) === actorUserId
        ? request.requestedByAgentExecutorId
        : null;
    const update = {
      executedAt: now,
      executedByAgentExecutorId: agentExecutorId,
      executedByUserId: agentExecutorId ? null : actorUserId,
      executionReceiptJson:
        input.receipt == null ? undefined : jsonValue(input.receipt),
      failureMessage: input.result === "FAILED" ? input.failureMessage : null,
      status:
        input.result === "EXECUTED"
          ? ExternalActionRequestStatus.EXECUTED
          : ExternalActionRequestStatus.FAILED,
    } satisfies Prisma.ExternalActionRequestUncheckedUpdateManyInput;
    const claimed = await tx.externalActionRequest.updateMany({
      where: {
        approvedPayloadHash: request.payloadHash,
        id: request.id,
        status: ExternalActionRequestStatus.APPROVED,
      },
      data: update,
    });
    const terminal = await tx.externalActionRequest.findUnique({
      where: { id: request.id },
      select: externalActionSelect(),
    });
    if (!terminal) throw new Error("External action request not found");
    if (
      claimed.count === 0 &&
      terminal.status !== ExternalActionRequestStatus.EXECUTED &&
      terminal.status !== ExternalActionRequestStatus.FAILED
    ) {
      throw new Error("External action request is no longer executable");
    }
    await tx.formSubmission.updateMany({
      where: { externalActionRequestId: request.id },
      data:
        terminal.status === ExternalActionRequestStatus.EXECUTED
          ? {
              status: FormSubmissionStatus.SUBMITTED,
              submittedAt: terminal.executedAt,
            }
          : { status: FormSubmissionStatus.FAILED },
    });
    return terminal;
  });
}
