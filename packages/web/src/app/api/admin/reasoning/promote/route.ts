import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  armId: z.string(),
  toStatus: z.enum(["ACTIVE", "REVIEW", "RETIRED", "FROZEN"]),
  rationale: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ ok: false, error: "not-authorized" }, { status: 403 });
  }
  const body = bodySchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ ok: false, error: "invalid-body" }, { status: 400 });
  }

  const arm = await prisma.reasoningVariantArm.findUnique({
    where: { id: body.data.armId },
  });
  if (!arm) {
    return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  }

  const fromStatus = arm.status;
  await prisma.reasoningVariantArm.update({
    where: { id: arm.id },
    data: { status: body.data.toStatus },
  });
  await prisma.reasoningPromotionDecision.create({
    data: {
      armId: arm.id,
      fromStatus,
      toStatus: body.data.toStatus,
      tier: arm.riskTier,
      actorKind: "HUMAN",
      actorUserId: session.user.id,
      chainValueEvidence: {},
      fraudEvidence: {},
      rGuardSnapshot: {},
      chainValueGuardSnapshot: {},
      topologyGateState: "MANUAL",
      rationale: body.data.rationale,
    },
  });

  return NextResponse.json({ ok: true });
}
