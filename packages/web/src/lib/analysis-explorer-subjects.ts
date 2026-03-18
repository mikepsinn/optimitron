import type { PairStudyResult } from "@optimitron/optimizer";

import type {
  EvidenceGrade,
  ExplorerDirectionAgreement,
  ExplorerSubjectAggregateComparison,
  ExplorerSubjectDrilldown,
  ExplorerSubjectQualityGate,
  ExplorerSubjectQualityReason,
  ExplorerSubjectQualityThresholds,
  ExplorerSubjectRankingMetrics,
  ExplorerSubjectSummary,
} from "./analysis-explorer-types";
import { clamp01, finiteOrNull } from "./numeric-utils";

const DEFAULT_SUBJECT_QUALITY_THRESHOLDS: ExplorerSubjectQualityThresholds = {
  minimumPairs: 10,
  minAbsForwardPearson: 0.05,
  minAbsPredictivePearson: 0.05,
  minAbsPercentChange: 0.25,
};

function absOrZero(value: number | null | undefined): number {
  return value == null || !Number.isFinite(value) ? 0 : Math.abs(value);
}

function toEvidenceWeight(grade: EvidenceGrade | undefined): number {
  switch (grade) {
    case "A":
      return 1;
    case "B":
      return 0.85;
    case "C":
      return 0.7;
    case "D":
      return 0.55;
    case "F":
      return 0.35;
    default:
      return 0.6;
  }
}

function toDirection(value: number | null, epsilon: number = 0.02): -1 | 0 | 1 {
  if (value == null || !Number.isFinite(value)) return 0;
  if (value >= epsilon) return 1;
  if (value <= -epsilon) return -1;
  return 0;
}

function resolveDirectionAgreement(
  subjectPredictive: number | null,
  aggregatePredictive: number | null,
): ExplorerDirectionAgreement {
  const subjectDirection = toDirection(subjectPredictive);
  const aggregateDirection = toDirection(aggregatePredictive);

  if (subjectDirection === 0 || aggregateDirection === 0) {
    if (subjectDirection === aggregateDirection) return "insufficient";
    return "mixed";
  }
  return subjectDirection === aggregateDirection ? "aligned" : "reversed";
}

function evaluateSubjectQualityGate(
  subject: ExplorerSubjectSummary,
  thresholds: ExplorerSubjectQualityThresholds,
): ExplorerSubjectQualityGate {
  const reasons: ExplorerSubjectQualityReason[] = [];

  if (subject.numberOfPairs < thresholds.minimumPairs) {
    reasons.push({
      code: "coverage.low_pairs",
      message: `Only ${subject.numberOfPairs} aligned pairs (minimum ${thresholds.minimumPairs}).`,
      observed: subject.numberOfPairs,
      threshold: thresholds.minimumPairs,
    });
  }

  const forwardAbs = absOrZero(subject.forwardPearson);
  const predictiveAbs = absOrZero(subject.predictivePearson);
  const percentAbs = absOrZero(subject.percentChangeFromBaseline);

  const hasCorrelationSignal =
    forwardAbs >= thresholds.minAbsForwardPearson ||
    predictiveAbs >= thresholds.minAbsPredictivePearson;
  const hasPercentSignal = percentAbs >= thresholds.minAbsPercentChange;

  if (!hasCorrelationSignal && !hasPercentSignal) {
    reasons.push({
      code: "signal.weak",
      message:
        "Forward/predictive correlations and percent-change effect are all below minimum strength thresholds.",
    });
  }

  if (subject.forwardPearson == null && subject.predictivePearson == null) {
    reasons.push({
      code: "signal.missing_correlations",
      message: "Forward and predictive correlations are both unavailable.",
    });
  }

  return {
    passed: reasons.length === 0,
    thresholds,
    reasons,
  };
}

function buildAggregateComparison(
  study: PairStudyResult,
  subject: ExplorerSubjectSummary,
): ExplorerSubjectAggregateComparison {
  const aggregateForward = finiteOrNull(study.evidence.forwardPearson);
  const aggregatePredictive = finiteOrNull(study.evidence.predictivePearson);
  const aggregatePercent = finiteOrNull(study.evidence.percentChangeFromBaseline);

  const subjectForward = finiteOrNull(subject.forwardPearson);
  const subjectPredictive = finiteOrNull(subject.predictivePearson);
  const subjectPercent = finiteOrNull(subject.percentChangeFromBaseline);

  return {
    aggregateForwardPearson: aggregateForward,
    aggregatePredictivePearson: aggregatePredictive,
    aggregatePercentChangeFromBaseline: aggregatePercent,
    forwardPearsonDelta:
      aggregateForward == null || subjectForward == null ? null : subjectForward - aggregateForward,
    predictivePearsonDelta:
      aggregatePredictive == null || subjectPredictive == null
        ? null
        : subjectPredictive - aggregatePredictive,
    percentChangeFromBaselineDelta:
      aggregatePercent == null || subjectPercent == null ? null : subjectPercent - aggregatePercent,
    directionAgreement: resolveDirectionAgreement(subjectPredictive, aggregatePredictive),
  };
}

function buildRankingMetrics(
  subject: ExplorerSubjectSummary,
  qualityGate: ExplorerSubjectQualityGate,
): ExplorerSubjectRankingMetrics {
  const pairCoverageScore = clamp01(subject.numberOfPairs / Math.max(1, qualityGate.thresholds.minimumPairs * 2));
  const signalStrengthScore = clamp01(
    0.45 * absOrZero(subject.predictivePearson) +
      0.35 * absOrZero(subject.forwardPearson) +
      0.20 * Math.min(1, absOrZero(subject.percentChangeFromBaseline) / 10),
  );
  const evidenceGradeWeight = toEvidenceWeight(subject.evidenceGrade);

  const rawScore = clamp01(
    0.40 * signalStrengthScore + 0.35 * pairCoverageScore + 0.25 * evidenceGradeWeight,
  );
  const qualityMultiplier = qualityGate.passed ? 1 : 0.65;

  return {
    score: clamp01(rawScore * qualityMultiplier),
    pairCoverageScore,
    signalStrengthScore,
    evidenceGradeWeight,
  };
}

function compareSubjectDrilldowns(
  a: ExplorerSubjectDrilldown,
  b: ExplorerSubjectDrilldown,
): number {
  if (a.qualityGate.passed !== b.qualityGate.passed) {
    return a.qualityGate.passed ? -1 : 1;
  }
  if (a.ranking.score !== b.ranking.score) {
    return b.ranking.score - a.ranking.score;
  }
  if (a.summary.numberOfPairs !== b.summary.numberOfPairs) {
    return b.summary.numberOfPairs - a.summary.numberOfPairs;
  }
  return a.summary.subjectId.localeCompare(b.summary.subjectId);
}

export function buildSubjectDrilldowns(
  study: PairStudyResult,
  subjects: ExplorerSubjectSummary[],
  thresholds: Partial<ExplorerSubjectQualityThresholds> = {},
): ExplorerSubjectDrilldown[] {
  const resolvedThresholds: ExplorerSubjectQualityThresholds = {
    ...DEFAULT_SUBJECT_QUALITY_THRESHOLDS,
    ...thresholds,
  };

  return subjects
    .map(subject => {
      const qualityGate = evaluateSubjectQualityGate(subject, resolvedThresholds);
      const ranking = buildRankingMetrics(subject, qualityGate);
      const aggregateComparison = buildAggregateComparison(study, subject);

      return {
        summary: subject,
        qualityGate,
        aggregateComparison,
        ranking,
      } satisfies ExplorerSubjectDrilldown;
    })
    .sort(compareSubjectDrilldowns);
}
