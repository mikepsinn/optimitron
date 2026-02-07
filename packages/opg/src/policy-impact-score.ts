import type { FullAnalysisResult } from '@optomitron/optimizer';

export interface PolicyImpactScore {
  score: number;
  bradfordHillTotal: number;
  effectDirection: number;
  statisticalSignificance: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function statisticalSignificanceFromPValue(pValue: number): number {
  if (!Number.isFinite(pValue)) return 0;
  return clamp(1 - pValue, 0, 1);
}

function effectDirection(correlation: number): number {
  if (!Number.isFinite(correlation) || correlation === 0) return 0;
  return correlation > 0 ? 1 : -1;
}

function bradfordHillTotal(bh: FullAnalysisResult['bradfordHill']): number {
  return (
    bh.strength +
    bh.consistency +
    bh.temporality +
    (bh.gradient ?? 0) +
    bh.plausibility +
    bh.coherence +
    bh.experiment +
    bh.analogy
  );
}

export function computePolicyImpactScore(result: FullAnalysisResult): PolicyImpactScore {
  const bradfordHillScore = bradfordHillTotal(result.bradfordHill);
  const direction = effectDirection(result.forwardPearson);
  const statisticalSignificance = statisticalSignificanceFromPValue(result.pValue);
  const score = bradfordHillScore * direction * statisticalSignificance;

  return {
    score,
    bradfordHillTotal: bradfordHillScore,
    effectDirection: direction,
    statisticalSignificance,
  };
}
