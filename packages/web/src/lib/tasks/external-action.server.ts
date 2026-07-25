import {
  ExternalActionRequestStatus,
  FormSubmissionStatus,
  TaskClaimStatus,
  TaskExecutionAttemptStatus,
  type Prisma,
} from "@optimitron/db";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { upsertWishoniaUser } from "@optimitron/db";
import { WISHONIA_EMAIL } from "@optimitron/db/system-identities";
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

/**
 * Structural client so callers can run inside their own transaction. Comparing
 * the whole `PrismaClient` and `TransactionClient` types makes TypeScript
 * expand the entire generated schema at every call site.
 */
export type ExternalActionDb = Pick<
  Prisma.TransactionClient,
  | "externalActionRequest"
  | "formSubmission"
  | "person"
  | "task"
  | "taskExecutionAttempt"
  | "user"
>;

/**
 * `ExternalActionRequest_requester_check` demands exactly one requester, and
 * some system proposals have no actor at all — an inbound email reply arrives
 * from a Person with no session, a scheduled trigger fires with no user. Those
 * are attributed to the Wishonia system user, which is who is really asking.
 */
async function resolveSystemRequesterUserId(tx: ExternalActionDb) {
  const existing = await tx.user.findFirst({
    where: { email: WISHONIA_EMAIL },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await upsertWishoniaUser(tx);
  return created.user.id;
}

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
  tx: Pick<Prisma.TransactionClient, "user">,
  actorUserId: string,
) {
  return tx.user.findUnique({
    where: { id: actorUserId },
    select: { isAdmin: true, personId: true },
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

export interface ProposeExternalActionOptions {
  clientAccessBoundary?: TaskClientAccessBoundary;
  /** Run inside a caller's already-open transaction instead of a new one. */
  db?: ExternalActionDb;
  /**
   * For internal server paths that have already decided the side effect should
   * exist — the outbound-message gate, which queues every agent-initiated email
   * here instead of sending it. Skips the actor's EXECUTE check because there
   * may be no actor at all (an inbound email reply has no signed-in user).
   *
   * This is not a bypass: the request still lands PENDING, so it grants the
   * ability to ASK a human, never the ability to act.
   */
  systemProposal?: boolean;
}

export async function proposeExternalAction(
  rawInput: unknown,
  actorUserId: string | null,
  options?: ProposeExternalActionOptions,
) {
  const input = ProposeExternalActionSchema.parse(rawInput);
  const payloadHash = await sha256CanonicalJson({
    destination: input.destination,
    operation: input.operation,
    payload: input.payload,
  });
  const now = new Date();
  const expiresAt = approvalExpiry(input.expiresAt, now);

  const run = async (tx: ExternalActionDb) => {
    // System proposals have no actor to check — an inbound email reply has no
    // signed-in user. Everything else keeps the original EXECUTE gate.
    const actorId = options?.systemProposal ? null : actorUserId;
    if (!options?.systemProposal && !actorId) {
      throw new Error("Task not found");
    }
    const actor = actorId ? await loadActor(tx, actorId) : null;
    if (actorId && !actor) throw new Error("Task not found");

    const task = await tx.task.findFirst({
      where: {
        AND: [
          ...(options?.clientAccessBoundary
            ? [getTaskClientAccessWhere(options.clientAccessBoundary)]
            : []),
        ],
        deletedAt: null,
        id: input.taskId,
        ...(actorId
          ? {
              OR: [
                getTaskAccessWhere({
                  action: "EXECUTE",
                  personId: actor?.personId ?? null,
                  userId: actorId,
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
                            userId: actorId,
                          },
                        },
                      } satisfies Prisma.TaskWhereInput,
                    ]
                  : []),
              ],
            }
          : {}),
      },
      select: { id: true },
    });
    if (!task) throw new Error("Task not found");

    const attempt = input.taskExecutionAttemptId
      ? await tx.taskExecutionAttempt.findFirst({
          where: {
            deletedAt: null,
            id: input.taskExecutionAttemptId,
            ...(actorId
              ? {
                  OR: [
                    { executorUserId: actorId },
                    {
                      metadata: {
                        equals: actorId,
                        path: ["startedByUserId"],
                      },
                    },
                    {
                      taskClaim: {
                        deletedAt: null,
                        status: { in: [...ACTIVE_CLAIM_STATUSES] },
                        userId: actorId,
                      },
                    },
                  ],
                }
              : {}),
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
        requestedByUserId: attempt?.agentExecutorId
          ? null
          : (actorUserId ?? (await resolveSystemRequesterUserId(tx))),
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
  };

  return options?.db ? run(options.db) : prisma.$transaction(run);
}

/** MANAGE access for the actor, intersected with the delegated client's
 * grant boundary when the call arrives via an OAuth token.
 *
 * Platform admins reach every task: they are the humans on the hook for what
 * this app mails out, and an approval queue only one person can clear is an
 * approval queue nobody clears. The delegated client's grant boundary still
 * applies to them — being an admin does not widen a token someone issued. */
function actionTaskWhere(
  actor: { isAdmin: boolean; personId: string | null },
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
      ...(actor.isAdmin ? [] : [manageWhere]),
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
  /** Narrow to one operation in the query, so the limit cannot crowd it out. */
  operation?: string | null;
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
      operation: input.operation ?? undefined,
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
        // Anyone with MANAGE access on the task can decide, plus admins.
        // Restricting approval to the original requester made the queue
        // unusable for the exact case it exists for: an agent proposes, a
        // human decides.
        task: actionTaskWhere(
          actor,
          actorUserId,
          options?.clientAccessBoundary,
        ),
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
    return writeTerminalExternalActionResult(tx, request, {
      executedAt: now,
      executedByAgentExecutorId: agentExecutorId,
      executedByUserId: agentExecutorId ? null : actorUserId,
      failureMessage: input.failureMessage ?? null,
      receipt: input.receipt ?? null,
      result: input.result,
    });
  });
}

/**
 * The one PENDING→terminal execution write. Conditional on the request still
 * being APPROVED with its approval pinned to the current payload hash, so a
 * retry or a concurrent dispatcher cannot execute the same request twice.
 */
async function writeTerminalExternalActionResult(
  tx: ExternalActionDb,
  request: { id: string; payloadHash: string },
  input: {
    executedAt: Date;
    executedByAgentExecutorId?: string | null;
    executedByUserId?: string | null;
    failureMessage?: string | null;
    receipt?: Record<string, unknown> | null;
    result: "EXECUTED" | "FAILED";
  },
) {
  const claimed = await tx.externalActionRequest.updateMany({
    where: {
      approvedPayloadHash: request.payloadHash,
      id: request.id,
      status: ExternalActionRequestStatus.APPROVED,
    },
    data: {
      executedAt: input.executedAt,
      executedByAgentExecutorId: input.executedByAgentExecutorId ?? null,
      executedByUserId: input.executedByUserId ?? null,
      executionReceiptJson:
        input.receipt == null ? undefined : jsonValue(input.receipt),
      failureMessage: input.result === "FAILED" ? input.failureMessage : null,
      status:
        input.result === "EXECUTED"
          ? ExternalActionRequestStatus.EXECUTED
          : ExternalActionRequestStatus.FAILED,
    } satisfies Prisma.ExternalActionRequestUncheckedUpdateManyInput,
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
}

/**
 * Terminal write for a server-side dispatcher that just performed (or failed
 * to perform) an approved side effect. Unlike `recordExternalActionResult`
 * there is no untrusted actor to authorize: the dispatcher runs in-process,
 * only after `authorizeApprovedSend` re-verified the payload hash.
 */
export async function finalizeApprovedExternalAction(input: {
  /**
   * Who is on the hook for this side effect — the approver. Required: the
   * `ExternalActionRequest_execution_check` constraint refuses a terminal row
   * with no executor, and an audit trail that cannot name one is worthless.
   */
  executedByUserId: string;
  externalActionRequestId: string;
  failureMessage?: string | null;
  now?: Date;
  receipt?: Record<string, unknown> | null;
  result: "EXECUTED" | "FAILED";
}) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.externalActionRequest.findFirst({
      where: { deletedAt: null, id: input.externalActionRequestId },
      select: externalActionSelect(),
    });
    if (!request) throw new Error("External action request not found");
    if (
      request.status === ExternalActionRequestStatus.EXECUTED ||
      request.status === ExternalActionRequestStatus.FAILED
    ) {
      return request;
    }
    return writeTerminalExternalActionResult(tx, request, {
      executedAt: input.now ?? new Date(),
      executedByUserId: input.executedByUserId,
      failureMessage: input.failureMessage ?? null,
      receipt: input.receipt ?? null,
      result: input.result,
    });
  });
}

/** Mark an approval that outlived its window, cancelling any linked draft. */
export async function expireExternalActionRequest(
  externalActionRequestId: string,
) {
  return prisma.$transaction(async (tx) => {
    await tx.externalActionRequest.updateMany({
      where: {
        id: externalActionRequestId,
        status: {
          in: [
            ExternalActionRequestStatus.APPROVED,
            ExternalActionRequestStatus.PENDING,
          ],
        },
      },
      data: { status: ExternalActionRequestStatus.EXPIRED },
    });
    await tx.formSubmission.updateMany({
      where: { externalActionRequestId },
      data: { status: FormSubmissionStatus.CANCELLED },
    });
    return tx.externalActionRequest.findUniqueOrThrow({
      where: { id: externalActionRequestId },
      select: externalActionSelect(),
    });
  });
}
