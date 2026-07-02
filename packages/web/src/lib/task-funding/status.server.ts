import {
  Prisma,
  TaskFundingPaymentStatus,
  TaskFundingPledgeStatus,
  type PrismaClient,
  type TaskFundingPledgerKind,
  type TaskFundingTargetStatus,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";

export interface TaskFundingPublicSupporter {
  pledgerKind: TaskFundingPledgerKind;
  publicNameSnapshot: string | null;
  committedAmountCents: bigint;
  createdAt: Date;
}

export interface TaskFundingUnitBreakdown {
  unitKey: string;
  totalQuantity: Prisma.Decimal;
  totalCommittedCents: bigint;
  pledgerCount: number;
}

export interface TaskFundingStatus {
  targetUsdCents: bigint;
  committedUsdCents: bigint;
  paidUsdCents: bigint;
  pledgedUsdCents: bigint;
  remainingUsdCents: bigint;
  percentToTarget: number;
  status: TaskFundingTargetStatus;
  pledgerCount: number;
  individualCount: number;
  organizationCount: number;
  latestPledgeAt: Date | null;
  unitBreakdown: TaskFundingUnitBreakdown[];
  publicSupporters?: TaskFundingPublicSupporter[];
}

export interface GetTaskFundingStatusOptions {
  includeSupporters?: boolean;
  limit?: number;
}

type StatusDbWithPayments = Pick<
  PrismaClient,
  "taskFundingPayment" | "taskFundingPledge" | "taskFundingTarget"
>;

function getPercentToTarget(committed: bigint, target: bigint): number {
  if (target <= 0n) return committed > 0n ? 100 : 0;
  return Number((committed * 10_000n) / target) / 100;
}

function clampSupporterLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) return 20;
  return Math.max(0, Math.min(100, Math.trunc(value ?? 20)));
}

export async function getTaskFundingStatus(
  taskId: string,
  options: GetTaskFundingStatusOptions = {},
  db: StatusDbWithPayments = prisma,
): Promise<TaskFundingStatus> {
  const target = await db.taskFundingTarget.findFirst({
    where: {
      taskId,
      deletedAt: null,
    },
    select: {
      id: true,
      targetAmountCents: true,
      status: true,
    },
  });

  if (!target) {
    throw new Error(`Task funding target not found for task ${taskId}.`);
  }

  const activeWhere = {
    targetId: target.id,
    deletedAt: null,
    status: TaskFundingPledgeStatus.ACTIVE,
  } satisfies Prisma.TaskFundingPledgeWhereInput;
  const paidPaymentWhere = {
    targetId: target.id,
    deletedAt: null,
    status: TaskFundingPaymentStatus.PAID,
  } satisfies Prisma.TaskFundingPaymentWhereInput;

  const [activePledges, unitGroups, paidPayments, paymentAggregate] =
    await Promise.all([
      db.taskFundingPledge.findMany({
        where: activeWhere,
        orderBy: { createdAt: "desc" },
        select: {
          pledgeActorKey: true,
          pledgerKind: true,
          createdAt: true,
        },
      }),
      db.taskFundingPledge.groupBy({
        by: ["unitKey"],
        where: activeWhere,
        orderBy: { unitKey: "asc" },
        _count: { pledgeActorKey: true },
        _sum: {
          committedAmountCents: true,
          unitQuantity: true,
        },
      }),
      db.taskFundingPayment.findMany({
        where: paidPaymentWhere,
        orderBy: { createdAt: "desc" },
        select: {
          donorEmail: true,
          donorOrganizationId: true,
          donorUserId: true,
          id: true,
          createdAt: true,
        },
      }),
      db.taskFundingPayment.aggregate({
        where: paidPaymentWhere,
        _sum: { amountCents: true },
      }),
    ]);

  const actorKinds = new Map<string, TaskFundingPledgerKind>();
  for (const pledge of activePledges) {
    if (!actorKinds.has(pledge.pledgeActorKey)) {
      actorKinds.set(pledge.pledgeActorKey, pledge.pledgerKind);
    }
  }
  const paidPaymentActorKeys = new Set<string>();
  for (const payment of paidPayments) {
    const actorKey = payment.donorOrganizationId
      ? `organization:${payment.donorOrganizationId}`
      : payment.donorUserId
        ? `user:${payment.donorUserId}`
        : payment.donorEmail
          ? `email:${payment.donorEmail}`
          : `payment:${payment.id}`;
    paidPaymentActorKeys.add(actorKey);
    if (!actorKinds.has(actorKey)) {
      actorKinds.set(
        actorKey,
        payment.donorOrganizationId ? "ORGANIZATION" : "PERSON",
      );
    }
  }
  const paidPledgerCount = paidPaymentActorKeys.size;

  let pledgedUsdCents = 0n;
  const unitBreakdown: TaskFundingUnitBreakdown[] = unitGroups.map((group) => {
    const totalCommittedCents = group._sum.committedAmountCents ?? 0n;
    pledgedUsdCents += totalCommittedCents;
    return {
      unitKey: group.unitKey,
      totalQuantity: group._sum.unitQuantity ?? new Prisma.Decimal(0),
      totalCommittedCents,
      pledgerCount: group._count.pledgeActorKey,
    };
  });
  const paidUsdCents = BigInt(paymentAggregate._sum.amountCents ?? 0);
  if (paidUsdCents > 0n) {
    const usdBreakdown = unitBreakdown.find((unit) => unit.unitKey === "usd");
    const paidDollars = new Prisma.Decimal(paidUsdCents.toString()).div(100);
    if (usdBreakdown) {
      usdBreakdown.totalQuantity = usdBreakdown.totalQuantity.plus(paidDollars);
      usdBreakdown.totalCommittedCents += paidUsdCents;
      usdBreakdown.pledgerCount += paidPledgerCount;
    } else {
      unitBreakdown.push({
        unitKey: "usd",
        totalQuantity: paidDollars,
        totalCommittedCents: paidUsdCents,
        pledgerCount: paidPledgerCount,
      });
    }
  }
  const committedUsdCents = pledgedUsdCents + paidUsdCents;

  const targetUsdCents = target.targetAmountCents;
  const remainingUsdCents =
    targetUsdCents > committedUsdCents ? targetUsdCents - committedUsdCents : 0n;
  const actorValues = Array.from(actorKinds.values());
  const latestFundingAt =
    [activePledges[0]?.createdAt, paidPayments[0]?.createdAt]
      .filter((value): value is Date => value instanceof Date)
      .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
  const status: TaskFundingStatus = {
    targetUsdCents,
    committedUsdCents,
    paidUsdCents,
    pledgedUsdCents,
    remainingUsdCents,
    percentToTarget: getPercentToTarget(committedUsdCents, targetUsdCents),
    status: target.status,
    pledgerCount: actorKinds.size,
    individualCount: actorValues.filter((kind) => kind === "PERSON").length,
    organizationCount: actorValues.filter((kind) => kind === "ORGANIZATION").length,
    latestPledgeAt: latestFundingAt,
    unitBreakdown,
  };

  if (options.includeSupporters) {
    const [pledgeSupporters, paymentSupporters] = await Promise.all([
      db.taskFundingPledge.findMany({
        where: {
          ...activeWhere,
          publicDisplay: true,
        },
        orderBy: { createdAt: "desc" },
        take: clampSupporterLimit(options.limit),
        select: {
          pledgerKind: true,
          publicNameSnapshot: true,
          committedAmountCents: true,
          createdAt: true,
        },
      }),
      db.taskFundingPayment.findMany({
        where: {
          ...paidPaymentWhere,
          publicDisplay: true,
        },
        orderBy: { createdAt: "desc" },
        take: clampSupporterLimit(options.limit),
        select: {
          amountCents: true,
          donorOrganizationId: true,
          publicNameSnapshot: true,
          createdAt: true,
        },
      }),
    ]);
    status.publicSupporters = [
      ...pledgeSupporters,
      ...paymentSupporters.map((supporter) => ({
        committedAmountCents: BigInt(supporter.amountCents),
        createdAt: supporter.createdAt,
        pledgerKind: supporter.donorOrganizationId
          ? ("ORGANIZATION" as const)
          : ("PERSON" as const),
        publicNameSnapshot: supporter.publicNameSnapshot,
      })),
    ]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, clampSupporterLimit(options.limit));
  }

  return status;
}
