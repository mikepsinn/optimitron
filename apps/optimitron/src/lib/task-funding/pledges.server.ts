import {
  Prisma,
  TaskFundingEventType,
  TaskFundingPledgeStatus,
  TaskFundingTargetStatus,
  type PrismaClient,
  type TaskFundingPledge,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import {
  resolvePledgeConversion,
  type TaskFundingConversionInput,
} from "./conversion.server";
import { assertCanPledgeForOrganization } from "./permissions.server";
import {
  getTaskFundingStatus,
  type TaskFundingStatus,
} from "./status.server";

export interface CreateOrReplaceTaskFundingPledgeInput {
  taskId: string;
  pledgerKind: "PERSON" | "ORGANIZATION";
  pledgerPersonId?: string;
  pledgerOrganizationId?: string;
  pledgedByUserId: string;
  publicDisplay: boolean;
  idempotencyKey?: string;
  termsVersion?: string;
  termsNote?: string;
  mode: "replace" | "increment";
  conversionInput: TaskFundingConversionInput;
}

export interface TaskFundingThresholdTransition {
  triggered: boolean;
  thresholdMetAt: Date | null;
}

export interface CreateOrReplaceTaskFundingPledgeResult {
  pledge: TaskFundingPledge;
  fundingStatus: TaskFundingStatus;
  thresholdTransition: TaskFundingThresholdTransition;
}

type FundingPledgeDb = Pick<
  PrismaClient,
  | "$transaction"
  | "organization"
  | "taskFundingEvent"
  | "taskFundingPledge"
  | "taskFundingTarget"
  | "user"
>;

interface ResolvedActor {
  pledgeActorKey: string;
  pledgerPersonId: string | null;
  pledgerOrganizationId: string | null;
  publicNameSnapshot: string | null;
}

const CLOSED_TARGET_STATUSES = new Set<string>([
  TaskFundingTargetStatus.CANCELLED,
  TaskFundingTargetStatus.EXPIRED,
]);

function normalizeOptional(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toPledgeEventJson(
  pledge: Pick<
    TaskFundingPledge,
    | "committedAmountCents"
    | "id"
    | "pledgeActorKey"
    | "status"
    | "unitKey"
    | "unitQuantity"
  >,
): Prisma.InputJsonValue {
  return {
    committedAmountCents: pledge.committedAmountCents.toString(),
    pledgeActorKey: pledge.pledgeActorKey,
    pledgeId: pledge.id,
    status: pledge.status,
    unitKey: pledge.unitKey,
    unitQuantity: pledge.unitQuantity.toString(),
  };
}

// Pledges that cross a funding threshold read the committed total and then write,
// so concurrent pledgers on the same target conflict under SERIALIZABLE and Postgres
// cancels all but one as a pivot. Retrying immediately makes every loser re-collide in
// lockstep, so the randomized delay - not the attempt count - is what actually breaks
// the tie. Full jitter over an exponential ceiling, capped so a pledge never stalls.
const SERIALIZABLE_MAX_ATTEMPTS = 6;
const SERIALIZABLE_RETRY_BASE_DELAY_MS = 15;
const SERIALIZABLE_RETRY_MAX_DELAY_MS = 250;

function serializableRetryDelayMs(attempt: number): number {
  const ceiling = Math.min(
    SERIALIZABLE_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1),
    SERIALIZABLE_RETRY_MAX_DELAY_MS,
  );
  return Math.random() * ceiling;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// A serialization failure reaches us in two different shapes depending on where
// Postgres aborts the transaction. A conflict raised by a statement comes back as a
// PrismaClientKnownRequestError with code P2034, but one raised while committing
// escapes as a raw DriverAdapterError whose `code` is undefined and whose SQLSTATE
// only appears as `cause.originalCode`. Both are retryable, so match on either.
const RETRYABLE_SQL_STATES = new Set(["40001", "40P01"]);

function isSerializationConflict(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && typeof current === "object" && current !== null; depth += 1) {
    const candidate = current as { code?: unknown; originalCode?: unknown; cause?: unknown };
    if (candidate.code === "P2034") {
      return true;
    }
    if (
      typeof candidate.code === "string" &&
      RETRYABLE_SQL_STATES.has(candidate.code)
    ) {
      return true;
    }
    if (
      typeof candidate.originalCode === "string" &&
      RETRYABLE_SQL_STATES.has(candidate.originalCode)
    ) {
      return true;
    }
    current = candidate.cause;
  }
  return false;
}

function isUniqueConstraintConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

async function resolveActor(
  tx: Prisma.TransactionClient,
  input: CreateOrReplaceTaskFundingPledgeInput,
): Promise<ResolvedActor> {
  if (input.pledgerKind === "PERSON") {
    const user = await tx.user.findUnique({
      where: { id: input.pledgedByUserId },
      select: {
        deletedAt: true,
        id: true,
        personId: true,
        person: {
          select: {
            deletedAt: true,
            displayName: true,
            id: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new Error("Pledging user not found.");
    }
    if (!user.person || user.person.deletedAt) {
      throw new Error("Pledging user does not have an active person profile.");
    }
    if (input.pledgerPersonId && input.pledgerPersonId !== user.person.id) {
      throw new Error("Person pledge actor does not match the pledging user.");
    }

    return {
      pledgeActorKey: `person:${user.person.id}`,
      pledgerPersonId: user.person.id,
      pledgerOrganizationId: null,
      publicNameSnapshot: user.person.displayName,
    };
  }

  if (!input.pledgerOrganizationId) {
    throw new Error("pledgerOrganizationId is required for organization pledges.");
  }

  const organization = await tx.organization.findUnique({
    where: { id: input.pledgerOrganizationId },
    select: {
      deletedAt: true,
      id: true,
      name: true,
    },
  });

  if (!organization || organization.deletedAt) {
    throw new Error("Organization not found.");
  }

  return {
    pledgeActorKey: `organization:${organization.id}`,
    pledgerPersonId: null,
    pledgerOrganizationId: organization.id,
    publicNameSnapshot: organization.name,
  };
}

async function createOrReplaceInsideTransaction(
  tx: Prisma.TransactionClient,
  input: CreateOrReplaceTaskFundingPledgeInput,
): Promise<CreateOrReplaceTaskFundingPledgeResult> {
  const target = await tx.taskFundingTarget.findFirst({
    where: {
      taskId: input.taskId,
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
      targetAmountCents: true,
      thresholdMetAt: true,
    },
  });

  if (!target) {
    throw new Error(`Task funding target not found for task ${input.taskId}.`);
  }
  if (CLOSED_TARGET_STATUSES.has(target.status)) {
    throw new Error("Task funding target is closed.");
  }

  const [actor, conversion] = await Promise.all([
    resolveActor(tx, input),
    resolvePledgeConversion(input.conversionInput, tx),
  ]);

  if (input.idempotencyKey) {
    const existingIdempotency = await tx.taskFundingPledge.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true },
    });
    if (existingIdempotency) {
      throw new Error("Task funding pledge idempotency key has already been used.");
    }
  }

  const existingPledge = await tx.taskFundingPledge.findUnique({
    where: {
      targetId_pledgeActorKey_unitKey: {
        targetId: target.id,
        pledgeActorKey: actor.pledgeActorKey,
        unitKey: conversion.unitKey,
      },
    },
    select: {
      committedAmountCents: true,
      id: true,
      pledgeActorKey: true,
      status: true,
      unitKey: true,
      unitQuantity: true,
    },
  });

  const pledge = await tx.taskFundingPledge.upsert({
    where: {
      targetId_pledgeActorKey_unitKey: {
        targetId: target.id,
        pledgeActorKey: actor.pledgeActorKey,
        unitKey: conversion.unitKey,
      },
    },
    create: {
      targetId: target.id,
      pledgerKind: input.pledgerKind,
      pledgeActorKey: actor.pledgeActorKey,
      pledgedByUserId: input.pledgedByUserId,
      pledgerPersonId: actor.pledgerPersonId,
      pledgerOrganizationId: actor.pledgerOrganizationId,
      publicDisplay: input.publicDisplay,
      publicNameSnapshot: actor.publicNameSnapshot,
      unitKey: conversion.unitKey,
      unitQuantity: conversion.unitQuantity,
      unitAmountCentsSnapshot: conversion.unitAmountCentsSnapshot,
      committedAmountCents: conversion.committedAmountCents,
      conversionVersion: conversion.conversionVersion,
      conversionSource: conversion.conversionSource,
      commerceOfferId: conversion.commerceOfferId,
      commerceOfferVariantId: conversion.commerceOfferVariantId,
      termsVersion: normalizeOptional(input.termsVersion),
      termsNote: normalizeOptional(input.termsNote),
      status: TaskFundingPledgeStatus.ACTIVE,
      idempotencyKey: normalizeOptional(input.idempotencyKey),
    },
    update: {
      pledgerKind: input.pledgerKind,
      pledgedByUserId: input.pledgedByUserId,
      pledgerPersonId: actor.pledgerPersonId,
      pledgerOrganizationId: actor.pledgerOrganizationId,
      publicDisplay: input.publicDisplay,
      publicNameSnapshot: actor.publicNameSnapshot,
      unitQuantity: conversion.unitQuantity,
      unitAmountCentsSnapshot: conversion.unitAmountCentsSnapshot,
      committedAmountCents: conversion.committedAmountCents,
      conversionVersion: conversion.conversionVersion,
      conversionSource: conversion.conversionSource,
      commerceOfferId: conversion.commerceOfferId,
      commerceOfferVariantId: conversion.commerceOfferVariantId,
      termsVersion: normalizeOptional(input.termsVersion),
      termsNote: normalizeOptional(input.termsNote),
      status: TaskFundingPledgeStatus.ACTIVE,
      idempotencyKey: normalizeOptional(input.idempotencyKey),
      cancelledAt: null,
      cancelledByUserId: null,
      cancellationReason: null,
      deletedAt: null,
    },
  });

  await tx.taskFundingEvent.create({
    data: {
      targetId: target.id,
      pledgeId: pledge.id,
      eventType: existingPledge
        ? TaskFundingEventType.PLEDGE_UPDATED
        : TaskFundingEventType.PLEDGE_CREATED,
      actorUserId: input.pledgedByUserId,
      beforeJson: existingPledge ? toPledgeEventJson(existingPledge) : undefined,
      afterJson: toPledgeEventJson(pledge),
      metadata: {
        mode: "replace",
      },
    },
  });

  const aggregate = await tx.taskFundingPledge.aggregate({
    where: {
      targetId: target.id,
      deletedAt: null,
      status: TaskFundingPledgeStatus.ACTIVE,
    },
    _sum: {
      committedAmountCents: true,
    },
  });
  const committedUsdCents = aggregate._sum.committedAmountCents ?? 0n;

  let thresholdTransition: TaskFundingThresholdTransition = {
    triggered: false,
    thresholdMetAt: target.thresholdMetAt,
  };

  if (
    target.status === TaskFundingTargetStatus.OPEN &&
    target.thresholdMetAt === null &&
    committedUsdCents >= target.targetAmountCents
  ) {
    const thresholdMetAt = new Date();
    const transition = await tx.taskFundingTarget.updateMany({
      where: {
        id: target.id,
        status: TaskFundingTargetStatus.OPEN,
        thresholdMetAt: null,
      },
      data: {
        status: TaskFundingTargetStatus.THRESHOLD_MET,
        thresholdMetAt,
        thresholdMetByPledgeId: pledge.id,
      },
    });

    if (transition.count === 1) {
      await tx.taskFundingEvent.create({
        data: {
          targetId: target.id,
          pledgeId: pledge.id,
          eventType: TaskFundingEventType.THRESHOLD_MET,
          dedupeKey: `threshold-met:${target.id}`,
          actorUserId: input.pledgedByUserId,
          metadata: {
            committedAmountCents: committedUsdCents.toString(),
            targetAmountCents: target.targetAmountCents.toString(),
          },
        },
      });
      thresholdTransition = {
        triggered: true,
        thresholdMetAt,
      };
    }
  }

  return {
    pledge,
    fundingStatus: await getTaskFundingStatus(input.taskId, {}, tx),
    thresholdTransition,
  };
}

async function runWithSerializableRetry<T>(
  db: FundingPledgeDb,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= SERIALIZABLE_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await db.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (isSerializationConflict(error) && attempt < SERIALIZABLE_MAX_ATTEMPTS) {
        lastError = error;
        await sleep(serializableRetryDelayMs(attempt));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function createOrReplaceTaskFundingPledge(
  input: CreateOrReplaceTaskFundingPledgeInput,
  db: FundingPledgeDb = prisma,
): Promise<CreateOrReplaceTaskFundingPledgeResult> {
  if (input.mode === "increment") {
    throw new Error("Task funding pledge increment mode is not supported yet.");
  }

  if (input.pledgerKind === "ORGANIZATION") {
    if (!input.pledgerOrganizationId) {
      throw new Error("pledgerOrganizationId is required for organization pledges.");
    }
    await assertCanPledgeForOrganization(
      input.pledgedByUserId,
      input.pledgerOrganizationId,
    );
  }

  try {
    return await runWithSerializableRetry(db, (tx) =>
      createOrReplaceInsideTransaction(tx, input),
    );
  } catch (error) {
    if (isUniqueConstraintConflict(error) && input.idempotencyKey) {
      throw new Error("Task funding pledge idempotency key has already been used.");
    }
    throw error;
  }
}
