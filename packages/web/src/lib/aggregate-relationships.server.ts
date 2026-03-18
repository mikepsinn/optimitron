import {
  aggregateNOf1VariableRelationships,
  type NOf1VariableRelationship,
} from "@optimitron/optimizer";
import { prisma } from "@/lib/prisma";
import { median } from "@/lib/numeric-utils";

interface AggregationResult {
  aggregated: number;
  errors: string[];
}

interface VariablePair {
  predictorGlobalVariableId: string;
  outcomeGlobalVariableId: string;
}

/**
 * Map a DB NOf1VariableRelationship row to the optimizer's NOf1VariableRelationship type.
 */
function dbRowToOptimizerInput(row: {
  subjectId: string;
  forwardPearsonCorrelation: number;
  reversePearsonCorrelation: number;
  statisticalSignificance: number | null;
  effectSize: number | null;
  numberOfPairs: number;
  valuePredictingHighOutcome: number | null;
  valuePredictingLowOutcome: number | null;
  optimalValue: number | null;
  outcomeFollowUpPercentChangeFromBaseline: number | null;
}): NOf1VariableRelationship {
  return {
    subjectId: row.subjectId,
    forwardPearson: row.forwardPearsonCorrelation,
    reversePearson: row.reversePearsonCorrelation,
    predictivePearson:
      row.forwardPearsonCorrelation - row.reversePearsonCorrelation,
    statisticalSignificance: row.statisticalSignificance ?? 0,
    effectSize: row.effectSize ?? 0,
    numberOfPairs: row.numberOfPairs,
    valuePredictingHighOutcome: row.valuePredictingHighOutcome ?? undefined,
    valuePredictingLowOutcome: row.valuePredictingLowOutcome ?? undefined,
    optimalDailyValue: row.optimalValue ?? undefined,
    outcomeFollowUpPercentChangeFromBaseline:
      row.outcomeFollowUpPercentChangeFromBaseline ?? undefined,
  };
}

/**
 * Aggregate all NOf1VariableRelationship rows into AggregateVariableRelationship rows.
 * Groups by (predictorGlobalVariableId, outcomeGlobalVariableId).
 */
export async function runAggregation(): Promise<AggregationResult> {
  const errors: string[] = [];
  let aggregated = 0;

  // Fetch all n-of-1 rows grouped by predictor+outcome pair
  const rows = await prisma.nOf1VariableRelationship.findMany({
    where: { deletedAt: null },
    select: {
      predictorGlobalVariableId: true,
      outcomeGlobalVariableId: true,
      subjectId: true,
      forwardPearsonCorrelation: true,
      reversePearsonCorrelation: true,
      statisticalSignificance: true,
      effectSize: true,
      numberOfPairs: true,
      valuePredictingHighOutcome: true,
      valuePredictingLowOutcome: true,
      optimalValue: true,
      outcomeFollowUpPercentChangeFromBaseline: true,
      onsetDelay: true,
      durationOfAction: true,
    },
  });

  // Group by (predictor, outcome)
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = `${row.predictorGlobalVariableId}::${row.outcomeGlobalVariableId}`;
    const group = groups.get(key);
    if (group) {
      group.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  for (const [key, groupRows] of groups) {
    try {
      const optimizerInputs = groupRows.map(dbRowToOptimizerInput);
      const result = aggregateNOf1VariableRelationships(optimizerInputs);

      const first = groupRows[0]!;
      const predictorGlobalVariableId = first.predictorGlobalVariableId;
      const outcomeGlobalVariableId = first.outcomeGlobalVariableId;

      // Use median onset/duration from the group
      const medianOnsetDelay = median(groupRows.map((r) => r.onsetDelay));
      const medianDuration = median(groupRows.map((r) => r.durationOfAction));

      await prisma.aggregateVariableRelationship.upsert({
        where: {
          predictorGlobalVariableId_outcomeGlobalVariableId: {
            predictorGlobalVariableId,
            outcomeGlobalVariableId,
          },
        },
        update: {
          forwardPearsonCorrelation: result.aggregateForwardPearson,
          reversePearsonCorrelation: result.aggregateReversePearson,
          effectSize: result.aggregateEffectSize,
          statisticalSignificance: result.aggregateStatisticalSignificance,
          valuePredictingHighOutcome:
            result.aggregateValuePredictingHighOutcome,
          valuePredictingLowOutcome: result.aggregateValuePredictingLowOutcome,
          optimalValue: result.aggregateOptimalDailyValue,
          outcomeFollowUpPercentChangeFromBaseline:
            result.aggregateOutcomeFollowUpPercentChangeFromBaseline,
          predictorImpactScore: result.weightedAveragePIS,
          numberOfUnits: result.numberOfUnits,
          numberOfPairs: result.totalPairs,
          onsetDelay: medianOnsetDelay,
          durationOfAction: medianDuration,
          analyzedAt: new Date(),
        },
        create: {
          predictorGlobalVariableId,
          outcomeGlobalVariableId,
          forwardPearsonCorrelation: result.aggregateForwardPearson,
          reversePearsonCorrelation: result.aggregateReversePearson,
          effectSize: result.aggregateEffectSize,
          statisticalSignificance: result.aggregateStatisticalSignificance,
          valuePredictingHighOutcome:
            result.aggregateValuePredictingHighOutcome,
          valuePredictingLowOutcome: result.aggregateValuePredictingLowOutcome,
          optimalValue: result.aggregateOptimalDailyValue,
          outcomeFollowUpPercentChangeFromBaseline:
            result.aggregateOutcomeFollowUpPercentChangeFromBaseline,
          predictorImpactScore: result.weightedAveragePIS,
          numberOfUnits: result.numberOfUnits,
          numberOfPairs: result.totalPairs,
          onsetDelay: medianOnsetDelay,
          durationOfAction: medianDuration,
          analyzedAt: new Date(),
        },
      });

      aggregated++;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown aggregation error";
      errors.push(`[${key}] ${message}`);
    }
  }

  return { aggregated, errors };
}

/**
 * Re-aggregate only specific predictor-outcome pairs (fire-and-forget after submit).
 */
export async function runAggregationForPairs(
  pairs: VariablePair[],
): Promise<AggregationResult> {
  const errors: string[] = [];
  let aggregated = 0;

  // Deduplicate pairs
  const uniquePairs = new Map<string, VariablePair>();
  for (const pair of pairs) {
    const key = `${pair.predictorGlobalVariableId}::${pair.outcomeGlobalVariableId}`;
    uniquePairs.set(key, pair);
  }

  for (const [key, pair] of uniquePairs) {
    try {
      const rows = await prisma.nOf1VariableRelationship.findMany({
        where: {
          predictorGlobalVariableId: pair.predictorGlobalVariableId,
          outcomeGlobalVariableId: pair.outcomeGlobalVariableId,
          deletedAt: null,
        },
        select: {
          subjectId: true,
          forwardPearsonCorrelation: true,
          reversePearsonCorrelation: true,
          statisticalSignificance: true,
          effectSize: true,
          numberOfPairs: true,
          valuePredictingHighOutcome: true,
          valuePredictingLowOutcome: true,
          optimalValue: true,
          outcomeFollowUpPercentChangeFromBaseline: true,
          onsetDelay: true,
          durationOfAction: true,
        },
      });

      if (rows.length === 0) continue;

      const optimizerInputs = rows.map(dbRowToOptimizerInput);
      const result = aggregateNOf1VariableRelationships(optimizerInputs);

      const medianOnsetDelay = median(rows.map((r) => r.onsetDelay));
      const medianDuration = median(rows.map((r) => r.durationOfAction));

      await prisma.aggregateVariableRelationship.upsert({
        where: {
          predictorGlobalVariableId_outcomeGlobalVariableId: {
            predictorGlobalVariableId: pair.predictorGlobalVariableId,
            outcomeGlobalVariableId: pair.outcomeGlobalVariableId,
          },
        },
        update: {
          forwardPearsonCorrelation: result.aggregateForwardPearson,
          reversePearsonCorrelation: result.aggregateReversePearson,
          effectSize: result.aggregateEffectSize,
          statisticalSignificance: result.aggregateStatisticalSignificance,
          valuePredictingHighOutcome:
            result.aggregateValuePredictingHighOutcome,
          valuePredictingLowOutcome: result.aggregateValuePredictingLowOutcome,
          optimalValue: result.aggregateOptimalDailyValue,
          outcomeFollowUpPercentChangeFromBaseline:
            result.aggregateOutcomeFollowUpPercentChangeFromBaseline,
          predictorImpactScore: result.weightedAveragePIS,
          numberOfUnits: result.numberOfUnits,
          numberOfPairs: result.totalPairs,
          onsetDelay: medianOnsetDelay,
          durationOfAction: medianDuration,
          analyzedAt: new Date(),
        },
        create: {
          predictorGlobalVariableId: pair.predictorGlobalVariableId,
          outcomeGlobalVariableId: pair.outcomeGlobalVariableId,
          forwardPearsonCorrelation: result.aggregateForwardPearson,
          reversePearsonCorrelation: result.aggregateReversePearson,
          effectSize: result.aggregateEffectSize,
          statisticalSignificance: result.aggregateStatisticalSignificance,
          valuePredictingHighOutcome:
            result.aggregateValuePredictingHighOutcome,
          valuePredictingLowOutcome: result.aggregateValuePredictingLowOutcome,
          optimalValue: result.aggregateOptimalDailyValue,
          outcomeFollowUpPercentChangeFromBaseline:
            result.aggregateOutcomeFollowUpPercentChangeFromBaseline,
          predictorImpactScore: result.weightedAveragePIS,
          numberOfUnits: result.numberOfUnits,
          numberOfPairs: result.totalPairs,
          onsetDelay: medianOnsetDelay,
          durationOfAction: medianDuration,
          analyzedAt: new Date(),
        },
      });

      aggregated++;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown aggregation error";
      errors.push(`[${key}] ${message}`);
    }
  }

  return { aggregated, errors };
}
