/**
 * Hierarchical contextual bandit over continuous ChainValue reward.
 *
 * One decision per page load per slot:
 *   1. If a pinned AssignmentRule matches context → use it (bypass bandit).
 *   2. Decide holdout (canonical control). If this decision is in-holdout →
 *      serve the canonical arm.
 *   3. Otherwise: hierarchical partial-pooling Thompson sampling over
 *      per-(slot, level, segment) BanditPolicyState posteriors.
 */

import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";

const createId = () => nanoid();
import {
  partialPoolPosterior,
  type ArmStatistics,
  type LevelPosterior,
} from "./chain-value";
import {
  DEFAULT_HOLDOUT_CONFIG,
  resolveHoldoutRate,
  shouldRouteToHoldout,
  type HoldoutConfig,
} from "./holdout.server";
import { buildLevelKeys, buildSegmentKey } from "./segment-key";
import type {
  BanditLevel,
  ReturningVsFirst,
  VariantSlot,
  Surface,
  RelationshipBucket,
} from "./types";

export type AllocatorContext = {
  hostKey: string;
  localeKey: string;
  organizationId: string | null;
  relationshipBucket: RelationshipBucket | null;
  referralSource: string | null;
  device: string | null;
  chainDepth: "90s" | "deep";
  returningVsFirst: ReturningVsFirst;
  surface: Surface;
  audienceTag: string | null;
  sessionId: string;
};

export type ArmPosteriorState = {
  armId: string;
  rewardSum: number;
  rewardSumSq: number;
  count: number;
  lastUpdatedAt?: string;
};

export type AllocatorDecision = {
  policyDecisionId: string;
  armId: string;
  isControlHoldout: boolean;
  holdoutResolutionLevel: BanditLevel | null;
  holdoutRate: number;
};

export type RequestHoldoutDecision = {
  isControlHoldout: boolean;
  holdoutResolutionLevel: BanditLevel;
  holdoutRate: number;
};

/**
 * Primary entry point — called once per page load per slot.
 */
export async function allocate(params: {
  slot: VariantSlot;
  ctx: AllocatorContext;
  activeArmIds: readonly string[];
  canonicalArmId: string;
  holdoutConfig?: HoldoutConfig;
  policyDecisionId?: string;
  requestHoldout?: RequestHoldoutDecision;
}): Promise<AllocatorDecision> {
  const {
    slot,
    ctx,
    activeArmIds,
    canonicalArmId,
    holdoutConfig = DEFAULT_HOLDOUT_CONFIG,
    policyDecisionId = createId(),
    requestHoldout,
  } = params;

  // 1. Check system-level overrides first (R-guard / chain-value-guard
  //    can force 100% canonical).
  const systemState = await prisma.reasoningSystemState.findUnique({
    where: { id: "singleton" },
  });
  if (systemState?.allocatorForceCanonical) {
    return {
      policyDecisionId,
      armId: canonicalArmId,
      isControlHoldout: true,
      holdoutResolutionLevel: "GLOBAL",
      holdoutRate: 1.0,
    };
  }

  // 2. Decide adaptive holdout.
  const holdoutDecision = requestHoldout
    ? requestHoldout
    : await resolveHoldoutForSlot({ slot, ctx, holdoutConfig, policyDecisionId });
  const goesToHoldout = requestHoldout
    ? requestHoldout.isControlHoldout
    : holdoutDecision.isControlHoldout;
  if (goesToHoldout) {
    return {
      policyDecisionId,
      armId: canonicalArmId,
      isControlHoldout: true,
      holdoutResolutionLevel: holdoutDecision.holdoutResolutionLevel,
      holdoutRate: holdoutDecision.holdoutRate,
    };
  }

  // 3. Hierarchical partial-pooling Thompson sampling.
  const posteriorsByLevel = await loadPosteriors(slot, ctx);
  const picked = thompsonPick(activeArmIds, posteriorsByLevel);

  return {
    policyDecisionId,
    armId: picked ?? canonicalArmId,
    isControlHoldout: false,
    holdoutResolutionLevel: holdoutDecision.holdoutResolutionLevel,
    holdoutRate: holdoutDecision.holdoutRate,
  };
}

export async function resolveHoldoutForSlot(params: {
  slot: VariantSlot;
  ctx: AllocatorContext;
  holdoutConfig?: HoldoutConfig;
  policyDecisionId: string;
}): Promise<RequestHoldoutDecision> {
  const {
    slot,
    ctx,
    holdoutConfig = DEFAULT_HOLDOUT_CONFIG,
    policyDecisionId,
  } = params;
  const segmentKey = buildSegmentKey(ctx);
  const expected = await estimateMonthlyExposures(slot, segmentKey);
  const holdoutDecision = resolveHoldoutRate(expected, holdoutConfig);
  return {
    isControlHoldout: shouldRouteToHoldout(policyDecisionId, holdoutDecision.rate),
    holdoutResolutionLevel: holdoutDecision.level,
    holdoutRate: holdoutDecision.rate,
  };
}

/* ================================================================
 * Segment-key + posterior loading
 * ================================================================ */

async function estimateMonthlyExposures(
  slot: VariantSlot,
  segmentKey: string,
): Promise<number> {
  const state = await prisma.reasoningBanditPolicyState.findUnique({
    where: {
      slot_level_segmentKey: {
        slot,
        level: "SEGMENT",
        segmentKey,
      },
    },
  });
  return state?.exposureCount ?? 0;
}

type LevelPosteriorsByArm = Map<string, LevelPosterior[]>;

async function loadPosteriors(
  slot: VariantSlot,
  ctx: AllocatorContext,
): Promise<LevelPosteriorsByArm> {
  const levelKeys = buildLevelKeys(ctx) as Array<{
    level: BanditLevel;
    segmentKey: string;
  }>;

  const rows = await prisma.reasoningBanditPolicyState.findMany({
    where: {
      slot,
      OR: levelKeys.map((k) => ({ level: k.level, segmentKey: k.segmentKey })),
    },
  });

  const byArm: LevelPosteriorsByArm = new Map();
  for (const row of rows) {
    const posteriors = row.armPosteriors as unknown;
    if (!Array.isArray(posteriors)) continue;
    for (const p of posteriors) {
      if (!p || typeof p !== "object") continue;
      const arm = p as Partial<ArmPosteriorState>;
      if (typeof arm.armId !== "string") continue;
      const stats: ArmStatistics = {
        rewardSum: Number(arm.rewardSum ?? 0),
        rewardSumSq: Number(arm.rewardSumSq ?? 0),
        count: Number(arm.count ?? 0),
      };
      const list = byArm.get(arm.armId) ?? [];
      list.push({ level: row.level, stats });
      byArm.set(arm.armId, list);
    }
  }
  return byArm;
}

/* ================================================================
 * Thompson sampling pick
 * ================================================================ */

function thompsonPick(
  activeArmIds: readonly string[],
  posteriorsByArm: LevelPosteriorsByArm,
): string | null {
  if (activeArmIds.length === 0) return null;

  let best: string | null = null;
  let bestSample = Number.NEGATIVE_INFINITY;

  for (const armId of activeArmIds) {
    const levels = posteriorsByArm.get(armId) ?? [];
    const pooled = partialPoolPosterior(levels);
    // Draw from Normal(pooled.mean, sqrt(pooled.variance)).
    const stddev = Math.sqrt(
      Number.isFinite(pooled.variance) ? pooled.variance : 1e6,
    );
    const sample = pooled.mean + stddev * sampleStandardNormal();
    if (sample > bestSample) {
      bestSample = sample;
      best = armId;
    }
  }
  return best;
}

/**
 * Box-Muller draw from standard Normal(0, 1).
 * Deterministic replay isn't needed here — decision id is persisted for audit;
 * re-sampling is expected behavior under continuous reward Thompson.
 */
function sampleStandardNormal(): number {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
