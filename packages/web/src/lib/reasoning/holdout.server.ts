/**
 * Adaptive canonical-holdout rate resolution.
 *
 * Every level of the bandit hierarchy has its own holdout rate, chosen
 * adaptively based on segment density, bounded by a hard code-level floor.
 */

import type { BanditLevel } from "./types";

export type HoldoutConfig = {
  /** Rate at the global level; always reserved regardless of segment. */
  globalPct: number;
  /** Rate at the major-segment level (≥ majorThreshold exposures/month). */
  majorSegmentPct: number;
  /** Baseline rate for sparse segments. */
  minorBasePct: number;
  /** Absolute floor — holdout rate clamped to ≥ this. T3-only to lower. */
  absoluteFloorPct: number;
  /** Threshold above which a segment is "major". */
  majorThresholdMonthlyExposures: number;
  /** Target minimum canonical exposures per month for minor segments. */
  minHoldoutExposuresPerMonth: number;
};

export const DEFAULT_HOLDOUT_CONFIG: HoldoutConfig = {
  globalPct: 0.1,
  majorSegmentPct: 0.1,
  minorBasePct: 0.05,
  absoluteFloorPct: 0.05,
  majorThresholdMonthlyExposures: 10_000,
  minHoldoutExposuresPerMonth: 100,
};

export type HoldoutDecision = {
  level: BanditLevel;
  rate: number;
};

/**
 * Resolve the holdout rate for a given segment's expected monthly traffic.
 * Returns the most-specific level that applies, plus the clamped rate.
 */
export function resolveHoldoutRate(
  expectedMonthlyExposures: number,
  config: HoldoutConfig = DEFAULT_HOLDOUT_CONFIG,
): HoldoutDecision {
  if (expectedMonthlyExposures >= config.majorThresholdMonthlyExposures) {
    return {
      level: "SEGMENT",
      rate: clamp(config.majorSegmentPct, config),
    };
  }

  // Minor segment — use the base rate OR the rate needed to produce at
  // least `minHoldoutExposuresPerMonth` canonical samples, whichever is
  // higher. Guards against sparse-segment zero-power holdouts.
  if (expectedMonthlyExposures <= 0) {
    return { level: "GLOBAL", rate: clamp(config.globalPct, config) };
  }
  const targetRate = config.minHoldoutExposuresPerMonth / expectedMonthlyExposures;
  const chosenRate = Math.max(config.minorBasePct, targetRate);
  return {
    level: "SEGMENT",
    rate: clamp(Math.min(chosenRate, 1.0), config),
  };
}

function clamp(rate: number, config: HoldoutConfig): number {
  return Math.max(config.absoluteFloorPct, Math.min(1.0, rate));
}

/**
 * Decide whether this specific allocation decision should route to the
 * canonical control arm (returns true) vs. the bandit (returns false).
 * Deterministic given the decision-id seed — replayable for audit.
 */
export function shouldRouteToHoldout(
  decisionIdSeed: string,
  holdoutRate: number,
): boolean {
  // Hash the seed to a uniform [0, 1) value.
  const hash = fastHash(decisionIdSeed);
  const normalized = hash / 0xffff_ffff;
  return normalized < holdoutRate;
}

function fastHash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
