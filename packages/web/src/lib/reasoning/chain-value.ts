/**
 * Pure ChainValue composition — the single reward the optimizer maximizes.
 *
 * ChainValue(exposure) =
 *     verified_human_weight × vote_happened
 *   + a · first_send_within_60s
 *   + b · Σ downstream_verified_votes × DOWNSTREAM_DECAY^depth
 *   + c · Σ downstream_sends × SEND_DECAY^depth
 *   − fraud_penalty
 *   − quality_penalty
 *
 * Pure — no DB, no async. Unit-tested.
 * Inputs arrive already-aggregated; this module composes the formula.
 */

export type ChainValueCoefficients = {
  /** Weight on first-send-within-60s. */
  a: number;
  /** Weight on downstream verified votes (depth-decayed). */
  b: number;
  /** Weight on downstream sends (depth-decayed). */
  c: number;
  /** Decay per chain hop for downstream votes. */
  downstreamDecay: number;
  /** Decay per chain hop for downstream sends. */
  sendDecay: number;
  /** Cutoff depth beyond which decayed contributions are treated as 0. */
  decayDepthCutoff: number;
};

export const DEFAULT_CHAIN_VALUE_COEFFICIENTS: ChainValueCoefficients = {
  a: 0.3,
  b: 0.8,
  c: 0.1,
  downstreamDecay: 0.7,
  sendDecay: 0.5,
  decayDepthCutoff: 10,
};

/**
 * Three-level verified-human weighting:
 *   1.0 — verified via World ID or equivalent PoP
 *   0.1 — self-claimed, email+cookie confirmed (provisional; upgrades on verify)
 *   0   — suspected bot (failed dedup, velocity anomaly, pattern match)
 */
export type VerifiedHumanLevel = "verified" | "provisional" | "suspected-bot";

export function verifiedHumanWeight(level: VerifiedHumanLevel): number {
  switch (level) {
    case "verified":
      return 1.0;
    case "provisional":
      return 0.1;
    case "suspected-bot":
      return 0;
  }
}

export type DelayedReward = {
  /** Hops from the crediting exposure to the downstream event. */
  depth: number;
  /** Count of events at this depth. */
  count: number;
};

export type ChainValueInputs = {
  voteHappened: boolean;
  humanLevel: VerifiedHumanLevel;
  firstSendWithin60s: boolean;
  downstreamVotes: readonly DelayedReward[];
  downstreamSends: readonly DelayedReward[];
  /** Sum of fraud penalties applied to this exposure (non-negative). */
  fraudPenalty: number;
  /** Sum of quality penalties applied to this exposure (non-negative). */
  qualityPenalty: number;
};

/**
 * Compose the ChainValue for a single exposure.
 * Output can be negative when penalties dominate — this is intentional
 * and is why the allocator uses a continuous-reward bandit, not Bernoulli.
 */
export function composeChainValue(
  inputs: ChainValueInputs,
  coefficients: ChainValueCoefficients = DEFAULT_CHAIN_VALUE_COEFFICIENTS,
): number {
  const humanFactor = verifiedHumanWeight(inputs.humanLevel);
  const voteTerm = inputs.voteHappened ? humanFactor : 0;
  const sendTerm = inputs.firstSendWithin60s ? coefficients.a : 0;

  const downstreamVoteTerm =
    coefficients.b *
    sumDecayed(inputs.downstreamVotes, coefficients.downstreamDecay, coefficients.decayDepthCutoff);

  const downstreamSendTerm =
    coefficients.c *
    sumDecayed(inputs.downstreamSends, coefficients.sendDecay, coefficients.decayDepthCutoff);

  return (
    voteTerm +
    sendTerm +
    downstreamVoteTerm +
    downstreamSendTerm -
    Math.max(0, inputs.fraudPenalty) -
    Math.max(0, inputs.qualityPenalty)
  );
}

function sumDecayed(
  events: readonly DelayedReward[],
  decay: number,
  cutoffDepth: number,
): number {
  let sum = 0;
  for (const { depth, count } of events) {
    if (!Number.isFinite(depth) || !Number.isFinite(count) || count <= 0) continue;
    if (depth > cutoffDepth) continue;
    sum += count * Math.pow(decay, Math.max(0, depth));
  }
  return sum;
}

/* ================================================================
 * Aggregation helpers used by Evaluator
 * ================================================================ */

export type ArmStatistics = {
  rewardSum: number;
  rewardSumSq: number;
  count: number;
};

export const EMPTY_ARM_STATISTICS: ArmStatistics = {
  rewardSum: 0,
  rewardSumSq: 0,
  count: 0,
};

/**
 * Accumulate one reward into sufficient statistics. Never stores the raw
 * reward — posterior state is constant-size per arm.
 */
export function addReward(
  stats: ArmStatistics,
  reward: number,
): ArmStatistics {
  return {
    rewardSum: stats.rewardSum + reward,
    rewardSumSq: stats.rewardSumSq + reward * reward,
    count: stats.count + 1,
  };
}

export function posteriorMean(stats: ArmStatistics): number {
  if (stats.count === 0) return 0;
  return stats.rewardSum / stats.count;
}

/**
 * Bessel-corrected sample variance. Returns 0 for count ≤ 1 to avoid
 * division by zero; Thompson sampling uses a wide prior in that case.
 */
export function posteriorVariance(stats: ArmStatistics): number {
  if (stats.count <= 1) return 0;
  const mean = posteriorMean(stats);
  const biased = stats.rewardSumSq / stats.count - mean * mean;
  const corrected = biased * (stats.count / (stats.count - 1));
  return Math.max(0, corrected);
}

/**
 * Posterior standard error of the mean.
 */
export function posteriorStdError(stats: ArmStatistics): number {
  if (stats.count === 0) return Number.POSITIVE_INFINITY;
  return Math.sqrt(posteriorVariance(stats) / stats.count);
}

/* ================================================================
 * Partial-pooling across hierarchy levels
 * ================================================================ */

export type LevelPosterior = {
  level: "GLOBAL" | "LOCALE" | "HOST" | "ORG" | "BUCKET" | "SEGMENT";
  stats: ArmStatistics;
};

/**
 * Combine level-specific arm posteriors via empirical-Bayes partial
 * pooling: weighted average of means, weights ∝ 1/variance.
 *
 * When a level has no data, it contributes a wide-variance prior
 * (down-weights its contribution to the pooled mean).
 */
export function partialPoolPosterior(
  levels: readonly LevelPosterior[],
): { mean: number; variance: number; totalCount: number } {
  if (levels.length === 0) {
    return { mean: 0, variance: Number.POSITIVE_INFINITY, totalCount: 0 };
  }

  let sumMeansTimesInvVar = 0;
  let sumInvVar = 0;
  let totalCount = 0;

  for (const { stats } of levels) {
    if (stats.count === 0) continue;
    const mean = posteriorMean(stats);
    const variance = posteriorVariance(stats);
    // Guard against zero variance — use a tiny floor.
    const invVar = 1 / Math.max(variance, 1e-9);
    sumMeansTimesInvVar += mean * invVar;
    sumInvVar += invVar;
    totalCount += stats.count;
  }

  if (sumInvVar === 0) {
    return { mean: 0, variance: Number.POSITIVE_INFINITY, totalCount: 0 };
  }

  const pooledMean = sumMeansTimesInvVar / sumInvVar;
  const pooledVariance = 1 / sumInvVar;

  return { mean: pooledMean, variance: pooledVariance, totalCount };
}
