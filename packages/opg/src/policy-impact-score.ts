import { z } from 'zod';
import type { FullAnalysisResult } from '@optomitron/optimizer';
import {
  SATURATION_CONSTANTS,
  saturation,
  scoreZFactor,
} from '@optomitron/optimizer';

export const PolicyImpactScoreSchema = z.object({
  score: z.number().min(-1).max(1),
  effectMagnitude: z.number().min(0).max(1),
  effectDirection: z.number().min(-1).max(1),
  confidence: z.number().min(0).max(1),
  sampleSizeFactor: z.number().min(0).max(1),
  sampleSize: z.number().min(0),
});

export type PolicyImpactScore = z.infer<typeof PolicyImpactScoreSchema>;

export interface PolicyImpactScoreConfig {
  sampleSizeSaturation?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function confidenceFromPValue(pValue: number): number {
  if (!Number.isFinite(pValue)) return 0;
  return clamp(1 - pValue, 0, 1);
}

function sampleSizeFactor(sampleSize: number, saturationParam: number): number {
  if (!Number.isFinite(sampleSize) || sampleSize <= 0) return 0;
  return saturation(sampleSize, saturationParam);
}

function effectDirection(absoluteChange: number): number {
  if (!Number.isFinite(absoluteChange) || absoluteChange === 0) return 0;
  return absoluteChange > 0 ? 1 : -1;
}

export function calculatePolicyImpactScore(
  result: FullAnalysisResult,
  config: PolicyImpactScoreConfig = {},
): PolicyImpactScore {
  const effectMagnitude = scoreZFactor(result.effectSize.zScore);
  const direction = effectDirection(result.effectSize.absoluteChange);
  const confidence = confidenceFromPValue(result.pValue);
  const sampleSize = Number.isFinite(result.numberOfPairs) ? result.numberOfPairs : 0;
  const sampleSizeFactorValue = sampleSizeFactor(
    sampleSize,
    config.sampleSizeSaturation ?? SATURATION_CONSTANTS.N_PAIRS_SIG,
  );
  const rawScore = direction * effectMagnitude * confidence * sampleSizeFactorValue;
  const score = clamp(rawScore, -1, 1);

  return {
    score,
    effectMagnitude,
    effectDirection: direction,
    confidence,
    sampleSizeFactor: sampleSizeFactorValue,
    sampleSize,
  };
}
