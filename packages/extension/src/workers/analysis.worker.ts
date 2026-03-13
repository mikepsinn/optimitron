/**
 * Web Worker that runs @optomitron/optimizer analysis on time series pairs.
 * Spawned from the options page to avoid blocking the UI.
 */
import { runFullAnalysis } from '@optomitron/optimizer';
import type { AnalysisPair } from '../lib/analysis.js';

export interface WorkerInput {
  type: 'run-analysis';
  pairs: AnalysisPair[];
}

export interface AnalysisRelationshipResult {
  predictorVariableId: string;
  outcomeVariableId: string;
  predictorName: string;
  outcomeName: string;
  forwardPearson: number;
  reversePearson: number;
  predictivePearson: number;
  effectSize: number;
  statisticalSignificance: number;
  numberOfPairs: number;
  valuePredictingHighOutcome?: number;
  valuePredictingLowOutcome?: number;
  optimalDailyValue?: number;
  outcomeFollowUpPercentChangeFromBaseline?: number;
  evidenceGrade?: string;
  pisScore?: number;
}

export interface WorkerProgress {
  type: 'progress';
  completed: number;
  total: number;
  currentPair: string;
}

export interface WorkerResult {
  type: 'result';
  relationships: AnalysisRelationshipResult[];
  errors: string[];
}

self.onmessage = (event: MessageEvent<WorkerInput>) => {
  if (event.data.type !== 'run-analysis') return;

  const { pairs } = event.data;
  const relationships: AnalysisRelationshipResult[] = [];
  const errors: string[] = [];

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i]!;

    self.postMessage({
      type: 'progress',
      completed: i,
      total: pairs.length,
      currentPair: `${pair.predictor.name} → ${pair.outcome.name}`,
    } satisfies WorkerProgress);

    try {
      const result = runFullAnalysis(
        {
          variableId: pair.predictor.variableId,
          name: pair.predictor.name,
          measurements: pair.predictor.measurements,
          category: pair.predictor.category,
        },
        {
          variableId: pair.outcome.variableId,
          name: pair.outcome.name,
          measurements: pair.outcome.measurements,
          category: pair.outcome.category,
        },
        { analysisMode: 'individual' },
      );

      relationships.push({
        predictorVariableId: pair.predictor.variableId,
        outcomeVariableId: pair.outcome.variableId,
        predictorName: result.predictorName,
        outcomeName: result.outcomeName,
        forwardPearson: result.forwardPearson,
        reversePearson: result.reversePearson,
        predictivePearson: result.predictivePearson,
        effectSize: result.effectSize.percentChange,
        statisticalSignificance: result.pis.score,
        numberOfPairs: result.numberOfPairs,
        valuePredictingHighOutcome: result.optimalValues.valuePredictingHighOutcome,
        valuePredictingLowOutcome: result.optimalValues.valuePredictingLowOutcome,
        optimalDailyValue: result.optimalValues.optimalDailyValue,
        outcomeFollowUpPercentChangeFromBaseline: result.baselineFollowup.followUpPercentChange,
        evidenceGrade: result.pis.evidenceGrade,
        pisScore: result.pis.score,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${pair.predictor.name} → ${pair.outcome.name}: ${message}`);
    }
  }

  self.postMessage({
    type: 'result',
    relationships,
    errors,
  } satisfies WorkerResult);
};
