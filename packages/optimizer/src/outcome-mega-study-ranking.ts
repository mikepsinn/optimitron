import { z } from 'zod';

import type { AggregateVariableRelationship } from './types.js';

export const OutcomeMegaStudySchemaVersion = '2026-02-13';

export const OutcomeEvidenceGradeSchema = z.enum(['A', 'B', 'C', 'D', 'F']);
export type OutcomeEvidenceGrade = z.infer<typeof OutcomeEvidenceGradeSchema>;

export const MultipleTestingMethodSchema = z.enum([
  'benjamini_hochberg',
  'bonferroni',
  'none',
]);
export type MultipleTestingMethod = z.infer<typeof MultipleTestingMethodSchema>;

export interface OutcomeRankingCandidate {
  outcomeId: string;
  predictorId: string;
  predictorLabel?: string;
  aggregateVariableRelationship: AggregateVariableRelationship;
  pValue?: number;
  evidenceGrade?: OutcomeEvidenceGrade;
  qualityPenalty?: number;
}

export const OutcomeMegaStudyRankingRowSchema = z.object({
  rank: z.number().int().min(1),
  outcomeId: z.string().min(1),
  predictorId: z.string().min(1),
  predictorLabel: z.string().optional(),
  score: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  rawPValue: z.number().min(0).max(1),
  adjustedPValue: z.number().min(0).max(1),
  significant: z.boolean(),
  evidenceGrade: OutcomeEvidenceGradeSchema.optional(),
  qualityPenalty: z.number().min(0).max(1),
  aggregateEffectSize: z.number(),
  aggregatePredictivePearson: z.number(),
  aggregateForwardPearson: z.number(),
  numberOfUnits: z.number().int().min(0),
  totalPairs: z.number().int().min(0),
});
export type OutcomeMegaStudyRankingRow = z.infer<typeof OutcomeMegaStudyRankingRowSchema>;

export const OutcomeMegaStudyRankingSchema = z.object({
  schemaVersion: z.string().min(1).default(OutcomeMegaStudySchemaVersion),
  outcomeId: z.string().min(1),
  multipleTesting: z.object({
    method: MultipleTestingMethodSchema,
    alpha: z.number().min(0).max(1),
    tests: z.number().int().min(0),
  }),
  rows: z.array(OutcomeMegaStudyRankingRowSchema),
});
export type OutcomeMegaStudyRanking = z.infer<typeof OutcomeMegaStudyRankingSchema>;

export interface RankPredictorsForOutcomeInput {
  outcomeId: string;
  candidates: OutcomeRankingCandidate[];
  multipleTestingMethod?: MultipleTestingMethod;
  alpha?: number;
}

export interface BuildOutcomeMegaStudiesInput {
  candidates: OutcomeRankingCandidate[];
  multipleTestingMethod?: MultipleTestingMethod;
  alpha?: number;
}

const GRADE_WEIGHT: Record<OutcomeEvidenceGrade, number> = {
  A: 1.0,
  B: 0.8,
  C: 0.6,
  D: 0.4,
  F: 0.2,
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function maxAbs(values: number[]): number {
  if (values.length === 0) return 1;
  const maxValue = Math.max(...values.map(value => Math.abs(value)));
  return maxValue > 0 ? maxValue : 1;
}

function inferRawPValue(candidate: OutcomeRankingCandidate): number {
  if (typeof candidate.pValue === 'number' && Number.isFinite(candidate.pValue)) {
    return clamp01(candidate.pValue);
  }
  return clamp01(1 - candidate.aggregateVariableRelationship.aggregateStatisticalSignificance);
}

function inferConfidence(candidate: OutcomeRankingCandidate, rawPValue: number): number {
  const significance = clamp01(1 - rawPValue);
  const units = 1 - Math.exp(-candidate.aggregateVariableRelationship.numberOfUnits / 20);
  const pairs = 1 - Math.exp(-candidate.aggregateVariableRelationship.totalPairs / 300);
  const directional = clamp01(
    Math.abs(candidate.aggregateVariableRelationship.aggregatePredictivePearson),
  );
  return clamp01(0.45 * significance + 0.20 * units + 0.20 * pairs + 0.15 * directional);
}

function scoreCandidate(
  candidate: OutcomeRankingCandidate,
  confidence: number,
  effectDenominator: number,
  predictiveDenominator: number,
): number {
  const effect = Math.abs(candidate.aggregateVariableRelationship.aggregateEffectSize) / effectDenominator;
  const predictive =
    Math.abs(candidate.aggregateVariableRelationship.aggregatePredictivePearson) / predictiveDenominator;
  const evidence = candidate.evidenceGrade ? GRADE_WEIGHT[candidate.evidenceGrade] : confidence;
  const qualityPenalty = clamp01(candidate.qualityPenalty ?? 0);
  const rawScore = 0.40 * effect + 0.25 * predictive + 0.25 * confidence + 0.10 * evidence;
  return clamp01(rawScore * (1 - qualityPenalty));
}

export function adjustPValues(
  pValues: number[],
  method: MultipleTestingMethod,
): number[] {
  if (method === 'none') {
    return pValues.map(clamp01);
  }

  const m = pValues.length;
  if (m === 0) return [];

  if (method === 'bonferroni') {
    return pValues.map(p => clamp01(p * m));
  }

  const indexed = pValues
    .map((p, index) => ({ p: clamp01(p), index }))
    .sort((a, b) => a.p - b.p);

  const adjustedSorted = indexed.map((entry, i) => (entry.p * m) / (i + 1));
  for (let i = adjustedSorted.length - 2; i >= 0; i--) {
    adjustedSorted[i] = Math.min(adjustedSorted[i] ?? 1, adjustedSorted[i + 1] ?? 1);
  }

  const adjusted = new Array<number>(m).fill(1);
  indexed.forEach((entry, i) => {
    adjusted[entry.index] = clamp01(adjustedSorted[i] ?? 1);
  });
  return adjusted;
}

function rankRows(rows: OutcomeMegaStudyRankingRow[]): OutcomeMegaStudyRankingRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.adjustedPValue !== b.adjustedPValue) return a.adjustedPValue - b.adjustedPValue;
    return a.predictorId.localeCompare(b.predictorId);
  });

  return sorted.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

export function rankPredictorsForOutcome(
  input: RankPredictorsForOutcomeInput,
): OutcomeMegaStudyRanking {
  const method = input.multipleTestingMethod ?? 'benjamini_hochberg';
  const alpha = clamp01(input.alpha ?? 0.05);
  const selected = input.candidates.filter(candidate => candidate.outcomeId === input.outcomeId);
  if (selected.length === 0) {
    return OutcomeMegaStudyRankingSchema.parse({
      outcomeId: input.outcomeId,
      multipleTesting: { method, alpha, tests: 0 },
      rows: [],
    });
  }

  const rawPValues = selected.map(inferRawPValue);
  const adjusted = adjustPValues(rawPValues, method);
  const effectDenominator = maxAbs(
    selected.map(candidate => candidate.aggregateVariableRelationship.aggregateEffectSize),
  );
  const predictiveDenominator = maxAbs(
    selected.map(candidate => candidate.aggregateVariableRelationship.aggregatePredictivePearson),
  );

  const rows = selected.map((candidate, index) => {
    const rawPValue = rawPValues[index] ?? 1;
    const adjustedPValue = adjusted[index] ?? 1;
    const confidence = inferConfidence(candidate, rawPValue);
    const score = scoreCandidate(
      candidate,
      confidence,
      effectDenominator,
      predictiveDenominator,
    );

    return {
      rank: 0,
      outcomeId: candidate.outcomeId,
      predictorId: candidate.predictorId,
      predictorLabel: candidate.predictorLabel,
      score,
      confidence,
      rawPValue,
      adjustedPValue,
      significant: adjustedPValue <= alpha,
      evidenceGrade: candidate.evidenceGrade,
      qualityPenalty: clamp01(candidate.qualityPenalty ?? 0),
      aggregateEffectSize: candidate.aggregateVariableRelationship.aggregateEffectSize,
      aggregatePredictivePearson:
        candidate.aggregateVariableRelationship.aggregatePredictivePearson,
      aggregateForwardPearson:
        candidate.aggregateVariableRelationship.aggregateForwardPearson,
      numberOfUnits: candidate.aggregateVariableRelationship.numberOfUnits,
      totalPairs: candidate.aggregateVariableRelationship.totalPairs,
    } satisfies OutcomeMegaStudyRankingRow;
  });

  return OutcomeMegaStudyRankingSchema.parse({
    outcomeId: input.outcomeId,
    multipleTesting: { method, alpha, tests: selected.length },
    rows: rankRows(rows),
  });
}

export function buildOutcomeMegaStudies(
  input: BuildOutcomeMegaStudiesInput,
): OutcomeMegaStudyRanking[] {
  const outcomeIds = [...new Set(input.candidates.map(candidate => candidate.outcomeId))];
  return outcomeIds
    .map(outcomeId =>
      rankPredictorsForOutcome({
        outcomeId,
        candidates: input.candidates,
        alpha: input.alpha,
        multipleTestingMethod: input.multipleTestingMethod,
      }),
    )
    .sort((a, b) => a.outcomeId.localeCompare(b.outcomeId));
}

