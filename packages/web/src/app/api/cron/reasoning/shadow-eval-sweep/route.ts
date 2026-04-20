/**
 * Cron: sweep DRAFT arms that haven't been shadow-evaluated yet.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runShadowEvaluation } from "@/lib/reasoning/shadow-evaluator.server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  const pending = await prisma.reasoningVariantArm.findMany({
    where: { status: "DRAFT", shadowGatePassed: null },
    take: 50,
  });
  let evaluated = 0;
  for (const arm of pending) {
    await runShadowEvaluation({
      armId: arm.id,
      slot: arm.slot,
      riskTier: arm.riskTier,
      slotKey: arm.slotKey,
      localeKey: arm.localeKey,
    });
    evaluated++;
  }
  return NextResponse.json({ ok: true, evaluated });
}
