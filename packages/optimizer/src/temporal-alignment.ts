/**
 * Temporal Alignment Module
 * 
 * Aligns predictor and outcome time series accounting for:
 * - Onset delay (δ): Time before effect begins
 * - Duration of action (τ): Time window over which effect persists
 * 
 * @see dFDA Spec: "Temporal Alignment" section
 */

import type {
  TimeSeries,
  Measurement,
  PredictorConfig,
  AlignedPair,
} from './types.js';

/**
 * Convert timestamp to Unix milliseconds
 */
export function toUnixMs(timestamp: number | string): number {
  if (typeof timestamp === 'number') {
    // If already in seconds (< year 2100 in seconds), convert to ms
    return timestamp < 4_102_444_800 ? timestamp * 1000 : timestamp;
  }
  return new Date(timestamp).getTime();
}

/**
 * Get measurements within a time window
 */
export function getMeasurementsInWindow(
  measurements: Measurement[],
  windowStart: number,
  windowEnd: number
): Measurement[] {
  return measurements.filter(m => {
    const t = toUnixMs(m.timestamp);
    return t >= windowStart && t <= windowEnd;
  });
}

/**
 * Calculate mean value of measurements
 */
export function meanValue(measurements: Measurement[]): number {
  if (measurements.length === 0) return NaN;
  const sum = measurements.reduce((acc, m) => acc + m.value, 0);
  return sum / measurements.length;
}

/**
 * Outcome-Based Pairing
 * 
 * Used when predictor has a filling value (e.g., zero for "not taken").
 * Creates one pair per outcome measurement.
 * 
 * For each outcome measurement at time t_o:
 *   - Look back δ seconds (onset delay buffer)
 *   - Sample predictor values in window [t_o - δ - τ, t_o - δ]
 *   - If no predictor values, use filling value
 */
export function alignOutcomeBased(
  predictor: TimeSeries,
  outcome: TimeSeries,
  config: PredictorConfig
): AlignedPair[] {
  const pairs: AlignedPair[] = [];
  const δ = config.onsetDelaySeconds * 1000; // Convert to ms
  const τ = config.durationOfActionSeconds * 1000;
  
  // Sort measurements by timestamp
  const predictorMeasurements = [...predictor.measurements].sort(
    (a, b) => toUnixMs(a.timestamp) - toUnixMs(b.timestamp)
  );
  const outcomeMeasurements = [...outcome.measurements].sort(
    (a, b) => toUnixMs(a.timestamp) - toUnixMs(b.timestamp)
  );
  
  // Get tracking boundaries (earliest and latest measurements)
  const predictorTimes = predictorMeasurements.map(m => toUnixMs(m.timestamp));
  const earliestPredictor = Math.min(...predictorTimes);
  const latestPredictor = Math.max(...predictorTimes);
  
  for (const outcomeMeasurement of outcomeMeasurements) {
    const outcomeTime = toUnixMs(outcomeMeasurement.timestamp);
    
    // Calculate predictor sampling window
    const windowEnd = outcomeTime - δ;
    const windowStart = windowEnd - τ;
    
    // Skip if window is before tracking started
    if (windowStart < earliestPredictor && config.fillingType === 'none') {
      continue;
    }
    
    // Get predictor values in window
    const windowMeasurements = getMeasurementsInWindow(
      predictorMeasurements,
      windowStart,
      windowEnd
    );
    
    let predictorValue: number;
    
    if (windowMeasurements.length > 0) {
      predictorValue = meanValue(windowMeasurements);
    } else {
      // Apply filling strategy
      switch (config.fillingType) {
        case 'zero':
          // Only fill with zero if within tracking period
          if (windowEnd >= earliestPredictor && windowStart <= latestPredictor) {
            predictorValue = 0;
          } else {
            continue; // Skip pairs outside tracking period
          }
          break;
        case 'value':
          predictorValue = config.fillingValue ?? 0;
          break;
        case 'none':
          continue; // Skip this pair
        case 'interpolation':
          // TODO: Implement linear interpolation
          continue;
        default:
          continue;
      }
    }
    
    pairs.push({
      predictorValue,
      outcomeValue: outcomeMeasurement.value,
      predictorTimestamp: windowEnd, // Representative timestamp
      outcomeTimestamp: outcomeTime,
    });
  }
  
  return pairs;
}

/**
 * Predictor-Based Pairing
 * 
 * Used when predictor has no filling value.
 * Creates one pair per predictor measurement.
 * 
 * For each predictor measurement at time t_p:
 *   - Look forward δ seconds (onset delay)
 *   - Sample outcome values in window [t_p + δ, t_p + δ + τ]
 *   - Skip if no outcome values in window
 */
export function alignPredictorBased(
  predictor: TimeSeries,
  outcome: TimeSeries,
  config: PredictorConfig
): AlignedPair[] {
  const pairs: AlignedPair[] = [];
  const δ = config.onsetDelaySeconds * 1000;
  const τ = config.durationOfActionSeconds * 1000;
  
  // Sort measurements by timestamp
  const predictorMeasurements = [...predictor.measurements].sort(
    (a, b) => toUnixMs(a.timestamp) - toUnixMs(b.timestamp)
  );
  const outcomeMeasurements = [...outcome.measurements].sort(
    (a, b) => toUnixMs(a.timestamp) - toUnixMs(b.timestamp)
  );
  
  for (const predictorMeasurement of predictorMeasurements) {
    const predictorTime = toUnixMs(predictorMeasurement.timestamp);
    
    // Calculate outcome sampling window
    const windowStart = predictorTime + δ;
    const windowEnd = windowStart + τ;
    
    // Get outcome values in window
    const windowMeasurements = getMeasurementsInWindow(
      outcomeMeasurements,
      windowStart,
      windowEnd
    );
    
    // Skip if no outcome measurements in window
    if (windowMeasurements.length === 0) {
      continue;
    }
    
    const outcomeValue = meanValue(windowMeasurements);
    
    pairs.push({
      predictorValue: predictorMeasurement.value,
      outcomeValue,
      predictorTimestamp: predictorTime,
      outcomeTimestamp: (windowStart + windowEnd) / 2, // Midpoint
    });
  }
  
  return pairs;
}

/**
 * Main alignment function - chooses strategy based on config
 */
export function alignTimeSeries(
  predictor: TimeSeries,
  outcome: TimeSeries,
  config: PredictorConfig
): AlignedPair[] {
  if (config.fillingType === 'none') {
    return alignPredictorBased(predictor, outcome, config);
  }
  return alignOutcomeBased(predictor, outcome, config);
}

/**
 * Optimize onset delay and duration to maximize correlation
 * 
 * Grid search over physiologically plausible ranges to find
 * parameters that yield strongest correlation.
 */
export function optimizeTemporalParameters(
  predictor: TimeSeries,
  outcome: TimeSeries,
  baseConfig: PredictorConfig,
  options: {
    delayRange?: [number, number];  // [min, max] in seconds
    durationRange?: [number, number];
    delaySteps?: number;
    durationSteps?: number;
    correlationFn: (pairs: AlignedPair[]) => number;
  }
): {
  optimalDelay: number;
  optimalDuration: number;
  optimalCorrelation: number;
  searchResults: Array<{ delay: number; duration: number; correlation: number }>;
} {
  const {
    delayRange = [0, 86400],         // 0 to 24 hours
    durationRange = [3600, 604800],  // 1 hour to 7 days
    delaySteps = 10,
    durationSteps = 10,
    correlationFn,
  } = options;
  
  const searchResults: Array<{ delay: number; duration: number; correlation: number }> = [];
  let optimalDelay = baseConfig.onsetDelaySeconds;
  let optimalDuration = baseConfig.durationOfActionSeconds;
  let optimalCorrelation = -Infinity;
  
  const delayStep = (delayRange[1] - delayRange[0]) / delaySteps;
  const durationStep = (durationRange[1] - durationRange[0]) / durationSteps;
  
  for (let d = delayRange[0]; d <= delayRange[1]; d += delayStep) {
    for (let τ = durationRange[0]; τ <= durationRange[1]; τ += durationStep) {
      const config: PredictorConfig = {
        ...baseConfig,
        onsetDelaySeconds: d,
        durationOfActionSeconds: τ,
      };
      
      const pairs = alignTimeSeries(predictor, outcome, config);
      
      if (pairs.length < 30) continue; // Minimum pairs for reliable correlation
      
      const correlation = Math.abs(correlationFn(pairs));
      
      searchResults.push({ delay: d, duration: τ, correlation });
      
      if (correlation > optimalCorrelation) {
        optimalCorrelation = correlation;
        optimalDelay = d;
        optimalDuration = τ;
      }
    }
  }
  
  return {
    optimalDelay,
    optimalDuration,
    optimalCorrelation,
    searchResults,
  };
}
