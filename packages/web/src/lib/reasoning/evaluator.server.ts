/**
 * Evaluator — computes ChainValue per exposure and updates bandit posteriors.
 *
 * Runs on cron (every 15 min) and on outcome-write. Writes:
 *   - OutcomeRecord.chainValueContribution (per row)
 *   - BanditPolicyState.armPosteriors (incremental sufficient statistics)
 *   - HoldoutComparison (per arm × segment, rolling window)
 */

import { prisma } from "@/lib/prisma";
import {
  addReward,
  composeChainValue,
  EMPTY_ARM_STATISTICS,
  type ArmStatistics,
  type ChainValueInputs,
  type VerifiedHumanLevel,
} from "./chain-value";
import { sumFraudPenalty, type FraudFinding } from "./fraud.server";
import { buildLevelKeys } from "./segment-key";
import type { ReturningVsFirst, VariantSlot } from "./types";

export type EvaluateExposureInput = {
  exposureId: string;
  variantArmId: string | null;
  variantSetId: string;
  slot: VariantSlot;
  sessionId: string;
  userId: string | null;
  referredByUserId: string | null;
  voteHappened: boolean;
  humanLevel: VerifiedHumanLevel;
  firstSendWithin60s: boolean;
  downstreamVotes: Array<{ depth: number; count: number }>;
  downstreamSends: Array<{ depth: number; count: number }>;
  fraudFindings: readonly FraudFinding[];
  qualityPenalty: number;
  localeKey: string;
  hostKey: string;
  organizationId: string | null;
  relationshipBucket: string | null;
  referralSource: string | null;
  device: string | null;
  chainDepth: "90s" | "deep";
  returningVsFirst: ReturningVsFirst;
  surface: string;
  policyDecisionId: string;
  isControlHoldout: boolean;
  audienceTag: string | null;
};

/**
 * Compute ChainValue for one exposure and update all affected bandit
 * posteriors (GLOBAL → LOCALE → HOST → ORG → BUCKET → SEGMENT).
 */
export async function evaluateExposure(input: EvaluateExposureInput): Promise<number> {
  const fraudPenalty = sumFraudPenalty(input.fraudFindings);
  const chainValueInputs: ChainValueInputs = {
    voteHappened: input.voteHappened,
    humanLevel: input.humanLevel,
    firstSendWithin60s: input.firstSendWithin60s,
    downstreamVotes: input.downstreamVotes,
    downstreamSends: input.downstreamSends,
    fraudPenalty,
    qualityPenalty: input.qualityPenalty,
  };
  const chainValue = composeChainValue(chainValueInputs);

  await prisma.reasoningOutcomeRecord.updateMany({
    where: { sessionId: input.sessionId, variantArmId: input.variantArmId ?? undefined },
    data: {
      chainValueContribution: chainValue,
      fraudPenalty,
      qualityPenalty: input.qualityPenalty,
      verifiedHumanWeight:
        input.humanLevel === "verified"
          ? 1.0
          : input.humanLevel === "provisional"
            ? 0.1
            : 0,
    },
  });

  if (input.variantArmId) {
    await updateBanditPosteriors(input, chainValue);
  }

  return chainValue;
}

/* ================================================================
 * Update posteriors at every level
 * ================================================================ */

async function updateBanditPosteriors(
  input: EvaluateExposureInput,
  reward: number,
): Promise<void> {
  const levelKeys = buildLevelKeys({
    localeKey: input.localeKey,
    hostKey: input.hostKey,
    organizationId: input.organizationId,
    relationshipBucket: input.relationshipBucket,
    referralSource: input.referralSource,
    device: input.device,
    chainDepth: input.chainDepth,
    returningVsFirst: input.returningVsFirst,
    surface: input.surface,
  });

  for (const { level, segmentKey } of levelKeys) {
    await upsertPosteriorIncrement({
      slot: input.slot,
      level,
      segmentKey,
      armId: input.variantArmId!,
      reward,
    });
  }
}

async function upsertPosteriorIncrement(params: {
  slot: VariantSlot;
  level: "GLOBAL" | "LOCALE" | "HOST" | "ORG" | "BUCKET" | "SEGMENT";
  segmentKey: string;
  armId: string;
  reward: number;
}): Promise<void> {
  const existing = await prisma.reasoningBanditPolicyState.findUnique({
    where: {
      slot_level_segmentKey: {
        slot: params.slot,
        level: params.level,
        segmentKey: params.segmentKey,
      },
    },
  });

  const currentPosteriors = parsePosteriorsJson(existing?.armPosteriors);
  const existingArm = currentPosteriors.find((p) => p.armId === params.armId);
  const priorStats: ArmStatistics = existingArm
    ? {
        rewardSum: existingArm.rewardSum,
        rewardSumSq: existingArm.rewardSumSq,
        count: existingArm.count,
      }
    : EMPTY_ARM_STATISTICS;
  const nextStats = addReward(priorStats, params.reward);

  const nextPosteriors = [
    ...currentPosteriors.filter((p) => p.armId !== params.armId),
    {
      armId: params.armId,
      rewardSum: nextStats.rewardSum,
      rewardSumSq: nextStats.rewardSumSq,
      count: nextStats.count,
      lastUpdatedAt: new Date().toISOString(),
    },
  ];

  const nextExposureCount = (existing?.exposureCount ?? 0) + 1;

  if (existing) {
    await prisma.reasoningBanditPolicyState.update({
      where: { id: existing.id },
      data: {
        armPosteriors: nextPosteriors as unknown as object,
        exposureCount: nextExposureCount,
      },
    });
  } else {
    await prisma.reasoningBanditPolicyState.create({
      data: {
        slot: params.slot,
        level: params.level,
        segmentKey: params.segmentKey,
        armPosteriors: nextPosteriors as unknown as object,
        exposureCount: 1,
        explorationRate: 1.0,
      },
    });
  }
}

function parsePosteriorsJson(raw: unknown): Array<{
  armId: string;
  rewardSum: number;
  rewardSumSq: number;
  count: number;
}> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{
    armId: string;
    rewardSum: number;
    rewardSumSq: number;
    count: number;
  }> = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.armId !== "string") continue;
    out.push({
      armId: e.armId,
      rewardSum: Number(e.rewardSum ?? 0),
      rewardSumSq: Number(e.rewardSumSq ?? 0),
      count: Number(e.count ?? 0),
    });
  }
  return out;
}
