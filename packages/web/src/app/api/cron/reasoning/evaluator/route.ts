/**
 * Cron: Evaluator — per-slot per-segment aggregation + HoldoutComparison
 * writes. Scheduled every 15 min.
 *
 * For now: iterates recently-written OutcomeRecord rows that lack a
 * chainValueContribution and computes ChainValue + updates posteriors.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateExposure } from "@/lib/reasoning/evaluator.server";
import type { VerifiedHumanLevel } from "@/lib/reasoning/chain-value";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  const processed = await processUnevaluatedOutcomes();
  return NextResponse.json({ ok: true, processed });
}

async function processUnevaluatedOutcomes(): Promise<number> {
  const unevaluated = await prisma.reasoningOutcomeRecord.findMany({
    where: { chainValueContribution: null, outcomeKind: "VOTE" },
    take: 200,
  });
  let count = 0;
  for (const rec of unevaluated) {
    const exposure = rec.variantArmId
      ? await prisma.reasoningVariantExposure.findFirst({
          where: {
            sessionId: rec.sessionId,
            variantArmId: rec.variantArmId,
          },
          orderBy: { exposedAt: "asc" },
        })
      : null;
    const firstSend = await prisma.reasoningOutcomeRecord.findFirst({
      where: {
        sessionId: rec.sessionId,
        outcomeKind: "FIRST_SEND_CONFIRMED",
      },
      orderBy: { recordedAt: "asc" },
    });
    const firstSendWithin60s =
      !!firstSend &&
      Math.abs(firstSend.recordedAt.getTime() - rec.recordedAt.getTime()) <= 60_000;

    const humanLevel: VerifiedHumanLevel =
      rec.verifiedHumanWeight >= 1
        ? "verified"
        : rec.verifiedHumanWeight > 0
          ? "provisional"
          : "suspected-bot";
    await evaluateExposure({
      exposureId: rec.id,
      variantArmId: rec.variantArmId,
      variantSetId: rec.variantSetId,
      slot: rec.slot,
      sessionId: rec.sessionId,
      userId: rec.userId,
      referredByUserId: rec.referredByUserId,
      voteHappened: true,
      humanLevel,
      firstSendWithin60s,
      downstreamVotes: [],
      downstreamSends: [],
      fraudFindings: [],
      qualityPenalty: 0,
      localeKey: rec.localeKey,
      hostKey: exposure?.hostKey ?? rec.hostKey,
      organizationId: exposure?.organizationId ?? rec.organizationId,
      relationshipBucket: exposure?.relationshipBucket ?? rec.relationshipBucket,
      referralSource: exposure?.referralSource ?? null,
      device: exposure?.device ?? null,
      chainDepth:
        exposure?.chainDepth === "deep" ? "deep" : "90s",
      returningVsFirst:
        exposure?.returningVsFirst === "returning" ? "returning" : "first",
      surface: rec.surface,
      policyDecisionId: rec.policyDecisionId ?? "",
      isControlHoldout: rec.isControlHoldout,
      audienceTag: rec.audienceTag,
    });
    count++;
  }
  return count;
}
