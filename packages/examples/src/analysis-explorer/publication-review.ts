import {
  formatAnalysisPublicationReview,
  reviewAnalysisPublication,
  type AnalysisPublicationReview,
  type AnalysisPublicationReviewInput,
} from '@optomitron/agent';
import type { MegaStudyApiPayload } from './mega-study-generator.js';

export interface MegaStudyPublicationReviewOptions {
  apiKey?: string;
  model?: string;
  topRowsPerOutcome?: number;
}

function sortPairsForReview(payload: MegaStudyApiPayload) {
  return [...payload.pairs].sort((left, right) => {
    const leftRisk =
      Number(left.diagnostics.dataSufficiencyStatus !== 'sufficient') * 10 +
      Number(left.diagnostics.qualityTier === 'insufficient') * 8 +
      Number(left.diagnostics.reliabilityBand === 'low') * 5 +
      Number(left.diagnostics.extrapolative) * 3 +
      Number(left.diagnostics.outsideBestObservedBin) * 2;
    const rightRisk =
      Number(right.diagnostics.dataSufficiencyStatus !== 'sufficient') * 10 +
      Number(right.diagnostics.qualityTier === 'insufficient') * 8 +
      Number(right.diagnostics.reliabilityBand === 'low') * 5 +
      Number(right.diagnostics.extrapolative) * 3 +
      Number(right.diagnostics.outsideBestObservedBin) * 2;
    return rightRisk - leftRisk || right.diagnostics.reliabilityScore - left.diagnostics.reliabilityScore;
  });
}

function isPublishableOutcomeRow(
  row: MegaStudyApiPayload['outcomes'][number]['rows'][number],
  pair: MegaStudyApiPayload['pairs'][number] | undefined,
): boolean {
  if (!pair) return false;
  if (row.publicationEligible != null) return row.publicationEligible;
  if (pair.diagnostics.publicationEligible != null) return pair.diagnostics.publicationEligible;
  if (row.dataSufficiencyStatus !== 'sufficient') return false;
  if (row.qualityTier === 'insufficient') return false;
  if (row.reliabilityBand === 'low') return false;
  if (pair.targets.decisionTargetSource === 'unavailable') return false;
  if (
    (pair.diagnostics.modelExtrapolative != null || pair.diagnostics.modelOutsideBestObservedBin != null) &&
    (pair.diagnostics.extrapolative || pair.diagnostics.outsideBestObservedBin)
  ) {
    return false;
  }
  return true;
}

function selectTopRowsForReview(
  outcome: MegaStudyApiPayload['outcomes'][number],
  pairById: Map<string, MegaStudyApiPayload['pairs'][number]>,
  topRowsPerOutcome: number,
) {
  return outcome.rows
    .filter((row) => isPublishableOutcomeRow(row, pairById.get(row.pairId)))
    .slice(0, topRowsPerOutcome);
}

function getPublishedRiskFlags(pair: MegaStudyApiPayload['pairs'][number]) {
  const hasSplitModelFlags =
    pair.diagnostics.modelExtrapolative != null ||
    pair.diagnostics.modelOutsideBestObservedBin != null;
  if (!hasSplitModelFlags && pair.targets.decisionTargetSource !== 'unavailable') {
    return {
      extrapolative: false,
      outsideBestObservedBin: false,
    };
  }
  return {
    extrapolative: pair.diagnostics.extrapolative,
    outsideBestObservedBin: pair.diagnostics.outsideBestObservedBin,
  };
}

export function buildMegaStudyPublicationReviewInput(
  payload: MegaStudyApiPayload,
  topRowsPerOutcome = 3,
): AnalysisPublicationReviewInput {
  const pairById = new Map(payload.pairs.map((pair) => [pair.pairId, pair]));
  const referencedPairIds = new Set(
    payload.outcomes.flatMap((outcome) =>
      selectTopRowsForReview(outcome, pairById, topRowsPerOutcome).map((row) => row.pairId),
    ),
  );
  const riskyPairIds = new Set(
    sortPairsForReview(payload)
      .filter((pair) =>
        pair.diagnostics.dataSufficiencyStatus !== 'sufficient' ||
        pair.diagnostics.qualityTier === 'insufficient' ||
        pair.diagnostics.reliabilityBand === 'low' ||
        pair.diagnostics.extrapolative ||
        pair.diagnostics.outsideBestObservedBin,
      )
      .slice(0, 8)
      .map((pair) => pair.pairId),
  );
  const highlightedPairIds = new Set([...referencedPairIds, ...riskyPairIds]);

  return {
    reportKind: 'mega-study-api',
    reportTitle: 'Analysis Explorer Mega Study',
    generatedAt: payload.generatedAt,
    overview: {
      outcomeCount: payload.outcomes.length,
      pairCount: payload.pairs.length,
      extrapolativePairCount: payload.pairs.filter((pair) => pair.diagnostics.extrapolative).length,
      outsideBestObservedBinCount: payload.pairs.filter((pair) => pair.diagnostics.outsideBestObservedBin).length,
      insufficientPairCount: payload.pairs.filter((pair) => pair.diagnostics.dataSufficiencyStatus !== 'sufficient').length,
      lowReliabilityPairCount: payload.pairs.filter((pair) => pair.diagnostics.reliabilityBand === 'low').length,
    },
    outcomes: payload.outcomes.map((outcome) => ({
      outcomeId: outcome.outcomeId,
      outcomeLabel: outcome.outcomeLabel,
      topRecommendations: selectTopRowsForReview(outcome, pairById, topRowsPerOutcome).map((row) => ({
        rank: row.rank,
        predictorId: row.predictorId,
        predictorLabel: row.predictorLabel,
        score: row.score,
        confidence: row.confidence,
        adjustedPValue: row.adjustedPValue,
        pairId: row.pairId,
        qualityTier: row.qualityTier,
        dataSufficiencyStatus: row.dataSufficiencyStatus,
        reliabilityBand: row.reliabilityBand,
        reliabilityScore: row.reliabilityScore,
      })),
    })),
    highlightedPairs: payload.pairs
      .filter((pair) => highlightedPairIds.has(pair.pairId))
      .map((pair) => {
        const publishedRisk = getPublishedRiskFlags(pair);
        return {
          pairId: pair.pairId,
          predictorLabel: pair.predictor.label,
          outcomeLabel: pair.outcome.label,
          decisionBest: pair.targets.decisionBest,
          modelBest: pair.targets.modelBest,
          decisionTargetSource: pair.targets.decisionTargetSource,
          evidenceGrade: pair.diagnostics.evidenceGrade,
          qualityTier: pair.diagnostics.qualityTier,
          dataSufficiencyStatus: pair.diagnostics.dataSufficiencyStatus,
          reliabilityBand: pair.diagnostics.reliabilityBand,
          reliabilityScore: pair.diagnostics.reliabilityScore,
          significance: pair.diagnostics.significance,
          directionalScore: pair.diagnostics.directionalScore,
          extrapolative: publishedRisk.extrapolative,
          outsideBestObservedBin: publishedRisk.outsideBestObservedBin,
        };
      }),
  };
}

export async function reviewMegaStudyApiPayload(
  payload: MegaStudyApiPayload,
  options: MegaStudyPublicationReviewOptions = {},
): Promise<{
  formatted: string;
  input: AnalysisPublicationReviewInput;
  review: AnalysisPublicationReview;
}> {
  const input = buildMegaStudyPublicationReviewInput(payload, options.topRowsPerOutcome);
  const review = await reviewAnalysisPublication({
    apiKey: options.apiKey,
    input,
    model: options.model,
  });

  return {
    formatted: formatAnalysisPublicationReview(review),
    input,
    review,
  };
}
