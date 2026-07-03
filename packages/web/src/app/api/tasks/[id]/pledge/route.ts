import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { ForbiddenError } from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";
import { assertCanPledgeForOrganization } from "@/lib/task-funding/permissions.server";
import { createOrReplaceTaskFundingPledge } from "@/lib/task-funding/pledges.server";
import type { TaskFundingStatus } from "@/lib/task-funding/status.server";

export const runtime = "nodejs";

const centsString = z.string().regex(/^[1-9][0-9]*$/);
const decimalQuantity = z.string().regex(/^[0-9]+(\.[0-9]{1,3})?$/);
const base = z.object({
  pledgerKind: z.enum(["PERSON", "ORGANIZATION"]),
  organizationId: z.string().min(1).optional(),
  publicDisplay: z.boolean().default(false),
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
  termsVersion: z.string().trim().max(128).optional(),
  termsNote: z.string().trim().max(1000).optional(),
  mode: z.enum(["replace", "increment"]).default("replace"),
});

const PledgeBodySchema = z.discriminatedUnion("unitKind", [
  base.extend({ unitKind: z.literal("USD"), amountCents: centsString }),
  base.extend({
    unitKind: z.literal("COMMERCE_OFFER"),
    offerKey: z.string().trim().min(1).max(128),
    variantKey: z.string().trim().max(128).optional(),
    quantity: decimalQuantity,
  }),
]);

type PledgeResult = Awaited<
  ReturnType<typeof createOrReplaceTaskFundingPledge>
>;

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
  };
}

function serializePledge(pledge: PledgeResult["pledge"]) {
  return {
    id: pledge.id,
    targetId: pledge.targetId,
    status: pledge.status,
    pledgerKind: pledge.pledgerKind,
    unitKey: pledge.unitKey,
    unitQuantity: pledge.unitQuantity.toString(),
    unitAmountCentsSnapshot:
      pledge.unitAmountCentsSnapshot === null
        ? null
        : pledge.unitAmountCentsSnapshot.toString(),
    committedAmountCents: pledge.committedAmountCents.toString(),
    publicDisplay: pledge.publicDisplay,
    updatedAt: pledge.updatedAt.toISOString(),
  };
}

function serializeThresholdTransition(
  transition: PledgeResult["thresholdTransition"],
) {
  return {
    triggered: transition.triggered,
    thresholdMetAt: transition.thresholdMetAt?.toISOString() ?? null,
  };
}

function isUnauthorized(error: unknown) {
  return error instanceof Error && error.message === "Unauthorized";
}

function isConflict(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /idempotency|target is closed/i.test(error.message);
}

function isMissingTarget(error: unknown) {
  return (
    error instanceof Error &&
    /Task funding target not found|Task not found/i.test(error.message)
  );
}

function isInvalidPledge(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /must be|required|not active|missing.*price|requires a variant|does not match|does not have an active person|Organization not found|Pledging user not found/i.test(
    error.message,
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let taskId: string | null = null;
  let userId: string | null = null;

  try {
    const auth = await requireAuth();
    userId = auth.userId;
    taskId = (await context.params).id;
    const parsed = PledgeBodySchema.safeParse(
      await request.json().catch(() => null),
    );

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid pledge payload." },
        { status: 400 },
      );
    }

    const body = parsed.data;
    if (body.mode === "increment") {
      return NextResponse.json(
        { error: "Increment pledges are not supported yet." },
        { status: 400 },
      );
    }

    if (body.pledgerKind === "ORGANIZATION") {
      if (!body.organizationId) {
        return NextResponse.json(
          { error: "organizationId is required." },
          { status: 400 },
        );
      }
      await assertCanPledgeForOrganization(userId, body.organizationId);
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const target = await prisma.taskFundingTarget.findFirst({
      where: {
        taskId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json(
        { error: "Task funding target not found." },
        { status: 404 },
      );
    }

    const conversionInput =
      body.unitKind === "USD"
        ? {
            unitKind: "USD" as const,
            amountCents: body.amountCents,
          }
        : {
            unitKind: "COMMERCE_OFFER" as const,
            offerKey: body.offerKey,
            variantKey: body.variantKey,
            quantity: body.quantity,
          };

    const result = await createOrReplaceTaskFundingPledge({
      taskId,
      pledgerKind: body.pledgerKind,
      pledgerOrganizationId: body.organizationId,
      pledgedByUserId: userId,
      publicDisplay: body.publicDisplay,
      idempotencyKey: body.idempotencyKey,
      termsVersion: body.termsVersion,
      termsNote: body.termsNote,
      mode: body.mode,
      conversionInput,
    });

    return NextResponse.json({
      pledge: serializePledge(result.pledge),
      fundingStatus: serializeFundingStatus(result.fundingStatus),
      thresholdTransition: serializeThresholdTransition(
        result.thresholdTransition,
      ),
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (isMissingTarget(error)) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    if (isConflict(error)) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Conflict." },
        { status: 409 },
      );
    }

    if (isInvalidPledge(error)) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid pledge." },
        { status: 400 },
      );
    }

    console.error("[TASKS] Failed to record funding pledge:", {
      error,
      taskId,
      userId,
    });
    return NextResponse.json(
      { error: "Failed to record funding pledge." },
      { status: 500 },
    );
  }
}
