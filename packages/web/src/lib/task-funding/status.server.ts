import {
  Prisma,
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

type StatusDb = Pick<PrismaClient, "taskFundingPledge" | "taskFundingTarget">;

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
  db: StatusDb = prisma,
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

  const [activePledges, unitGroups] = await Promise.all([
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
  ]);

  const actorKinds = new Map<string, TaskFundingPledgerKind>();
  for (const pledge of activePledges) {
    if (!actorKinds.has(pledge.pledgeActorKey)) {
      actorKinds.set(pledge.pledgeActorKey, pledge.pledgerKind);
    }
  }

  let committedUsdCents = 0n;
  const unitBreakdown: TaskFundingUnitBreakdown[] = unitGroups.map((group) => {
    const totalCommittedCents = group._sum.committedAmountCents ?? 0n;
    committedUsdCents += totalCommittedCents;
    return {
      unitKey: group.unitKey,
      totalQuantity: group._sum.unitQuantity ?? new Prisma.Decimal(0),
      totalCommittedCents,
      pledgerCount: group._count.pledgeActorKey,
    };
  });

  const targetUsdCents = target.targetAmountCents;
  const remainingUsdCents =
    targetUsdCents > committedUsdCents ? targetUsdCents - committedUsdCents : 0n;
  const actorValues = Array.from(actorKinds.values());
  const status: TaskFundingStatus = {
    targetUsdCents,
    committedUsdCents,
    remainingUsdCents,
    percentToTarget: getPercentToTarget(committedUsdCents, targetUsdCents),
    status: target.status,
    pledgerCount: actorKinds.size,
    individualCount: actorValues.filter((kind) => kind === "PERSON").length,
    organizationCount: actorValues.filter((kind) => kind === "ORGANIZATION").length,
    latestPledgeAt: activePledges[0]?.createdAt ?? null,
    unitBreakdown,
  };

  if (options.includeSupporters) {
    status.publicSupporters = await db.taskFundingPledge.findMany({
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
    });
  }

  return status;
}
