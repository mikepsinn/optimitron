import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  getTaskFundingStatus,
  type TaskFundingStatus,
} from "@/lib/task-funding/status.server";
import { decodeTaskRouteId } from "@/lib/tasks/task-route-id";

export const runtime = "nodejs";

function serializeFundingStatus(status: TaskFundingStatus) {
  return {
    targetUsdCents: status.targetUsdCents.toString(),
    committedUsdCents: status.committedUsdCents.toString(),
    paidUsdCents: status.paidUsdCents.toString(),
    pledgedUsdCents: status.pledgedUsdCents.toString(),
    remainingUsdCents: status.remainingUsdCents.toString(),
    percentToTarget: status.percentToTarget,
    status: status.status,
    pledgerCount: status.pledgerCount,
    individualCount: status.individualCount,
    organizationCount: status.organizationCount,
    latestPledgeAt: status.latestPledgeAt?.toISOString() ?? null,
    unitBreakdown: status.unitBreakdown.map((unit) => ({
      unitKey: unit.unitKey,
      totalQuantity: unit.totalQuantity.toString(),
      totalCommittedCents: unit.totalCommittedCents.toString(),
      pledgerCount: unit.pledgerCount,
    })),
    ...(status.publicSupporters
      ? {
          publicSupporters: status.publicSupporters.map((supporter) => ({
            pledgerKind: supporter.pledgerKind,
            publicNameSnapshot: supporter.publicNameSnapshot,
            committedAmountCents: supporter.committedAmountCents.toString(),
            createdAt: supporter.createdAt.toISOString(),
          })),
        }
      : {}),
  };
}

function parseSupporterLimit(value: string | null) {
  if (value === null) return 20;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 20;
  return Math.max(0, Math.min(100, Math.trunc(parsed)));
}

function isUnauthorized(error: unknown) {
  return error instanceof Error && error.message === "Unauthorized";
}

async function ensureCanReadFundingStatus(taskId: string) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      deletedAt: null,
    },
    select: {
      assigneePersonId: true,
      createdByUserId: true,
      isPublic: true,
    },
  });

  if (!task) {
    return { allowed: false as const, status: 404 };
  }

  if (task.isPublic) {
    return { allowed: true as const };
  }

  const { userId } = await requireAuth();
  const viewer = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      deletedAt: true,
      personId: true,
    },
  });

  if (
    viewer &&
    !viewer.deletedAt &&
    (task.createdByUserId === userId ||
      (task.assigneePersonId !== null &&
        task.assigneePersonId === viewer.personId))
  ) {
    return { allowed: true as const };
  }

  return { allowed: false as const, status: 404 };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let taskId: string | null = null;

  try {
    taskId = decodeTaskRouteId((await context.params).id);
    const access = await ensureCanReadFundingStatus(taskId);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.status === 404 ? "Task not found." : "Unauthorized" },
        { status: access.status },
      );
    }

    const url = new URL(request.url);
    const includeSupporters = url.searchParams.get("includeSupporters") === "1";
    const limit = parseSupporterLimit(url.searchParams.get("limit"));
    const status = await getTaskFundingStatus(taskId, {
      includeSupporters,
      limit,
    });

    return NextResponse.json(serializeFundingStatus(status));
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      error instanceof Error &&
      /Task funding target not found/i.test(error.message)
    ) {
      return NextResponse.json(
        { error: "Task funding target not found." },
        { status: 404 },
      );
    }

    console.error("[TASKS] Failed to load funding status:", {
      error,
      taskId,
    });
    return NextResponse.json(
      { error: "Failed to load funding status." },
      { status: 500 },
    );
  }
}
