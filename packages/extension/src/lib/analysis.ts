/**
 * Convert extension health data to @optomitron/optimizer TimeSeries format
 * and generate all predictor->outcome pairs for analysis.
 */
import type { StorageSchema } from '../types/schema.js';

/** Matches @optomitron/optimizer TimeSeries shape without importing it */
export interface AnalysisTimeSeries {
  variableId: string;
  name: string;
  measurements: Array<{ timestamp: number; value: number }>;
  category?: string;
}

export interface AnalysisPair {
  predictor: AnalysisTimeSeries;
  outcome: AnalysisTimeSeries;
}

/**
 * Convert StorageSchema to an array of TimeSeries, one per variable.
 * Treatments and food are predictors; symptoms are outcomes.
 */
export function dataToAnalysisTimeSeries(data: StorageSchema): {
  predictors: AnalysisTimeSeries[];
  outcomes: AnalysisTimeSeries[];
} {
  const predictors: AnalysisTimeSeries[] = [];
  const outcomes: AnalysisTimeSeries[] = [];

  // Group treatment logs by treatment
  const treatmentMeasurements = new Map<string, { name: string; measurements: Array<{ timestamp: number; value: number }> }>();
  for (const log of data.treatmentLogs) {
    const treatment = data.treatments.find((t) => t.id === log.treatmentId);
    const name = treatment ? `${treatment.name} ${treatment.dose}${treatment.unit}` : log.treatmentId;
    const variableId = `treatment:${name}`;
    if (!treatmentMeasurements.has(variableId)) {
      treatmentMeasurements.set(variableId, { name, measurements: [] });
    }
    treatmentMeasurements.get(variableId)!.measurements.push({
      timestamp: new Date(log.timestamp).getTime(),
      value: log.action === 'done' ? 1 : 0,
    });
  }
  for (const [variableId, { name, measurements }] of treatmentMeasurements) {
    predictors.push({ variableId, name, measurements, category: 'Treatment' });
  }

  // Group food logs by description
  const foodMeasurements = new Map<string, Array<{ timestamp: number; value: number }>>();
  for (const food of data.foodLogs) {
    const variableId = `food:${food.description}`;
    if (!foodMeasurements.has(variableId)) {
      foodMeasurements.set(variableId, []);
    }
    foodMeasurements.get(variableId)!.push({
      timestamp: new Date(food.timestamp).getTime(),
      value: 1,
    });
  }
  for (const [variableId, measurements] of foodMeasurements) {
    const name = variableId.replace('food:', '');
    predictors.push({ variableId, name, measurements, category: 'Food' });
  }

  // Group symptom ratings by symptom
  const symptomMeasurements = new Map<string, { name: string; measurements: Array<{ timestamp: number; value: number }> }>();
  for (const rating of data.symptomRatings) {
    const sym = data.symptomDefinitions.find((s) => s.id === rating.symptomId);
    const name = sym?.name ?? rating.symptomId;
    const variableId = `symptom:${name}`;
    if (!symptomMeasurements.has(variableId)) {
      symptomMeasurements.set(variableId, { name, measurements: [] });
    }
    symptomMeasurements.get(variableId)!.measurements.push({
      timestamp: new Date(rating.timestamp).getTime(),
      value: rating.value,
    });
  }
  for (const [variableId, { name, measurements }] of symptomMeasurements) {
    outcomes.push({ variableId, name, measurements, category: 'Symptom' });
  }

  return { predictors, outcomes };
}

/**
 * Generate all predictor->outcome pair combinations.
 */
export function generateAnalysisPairs(data: StorageSchema): AnalysisPair[] {
  const { predictors, outcomes } = dataToAnalysisTimeSeries(data);
  const pairs: AnalysisPair[] = [];

  for (const predictor of predictors) {
    for (const outcome of outcomes) {
      pairs.push({ predictor, outcome });
    }
  }

  return pairs;
}

/**
 * Calculate the data span in days from the earliest to latest timestamp.
 */
export function calculateDataSpanDays(data: StorageSchema): number {
  const timestamps: number[] = [];
  for (const log of data.treatmentLogs) timestamps.push(new Date(log.timestamp).getTime());
  for (const rating of data.symptomRatings) timestamps.push(new Date(rating.timestamp).getTime());
  for (const food of data.foodLogs) timestamps.push(new Date(food.timestamp).getTime());

  if (timestamps.length < 2) return 0;

  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  return Math.round((max - min) / (1000 * 60 * 60 * 24));
}
