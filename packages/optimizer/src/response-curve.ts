import { buildAdaptiveNumericBins } from './adaptive-binning.js';

export interface ResponseCurveBin {
  binIndex: number;
  lowerBound: number;
  upperBound: number;
  isUpperInclusive: boolean;
  count: number;
  predictorMean: number;
  predictorMedian: number;
  outcomeMean: number;
  outcomeStd: number;
  outcomeSem: number;
}

export interface DiminishingReturnsOptions {
  targetBinCount?: number;
  minBinSize?: number;
  minSamples?: number;
  minSlopePointsPerSegment?: number;
  minPreSlope?: number;
  maxPostToPreSlopeRatio?: number;
}

export interface DiminishingReturnsEstimate {
  detected: boolean;
  reason: string | null;
  kneePredictorValue: number | null;
  firstSegmentSlope: number | null;
  secondSegmentSlope: number | null;
  slopeRatio: number | null;
  segmentSlopes: number[];
  bins: ResponseCurveBin[];
  support: {
    sampleCount: number;
    binCount: number;
    minBinCount: number;
    minSlopePointsPerSegment: number;
  };
}

export interface MinimumEffectiveDoseOptions {
  targetBinCount?: number;
  minBinSize?: number;
  minSamples?: number;
  minRelativeGainPercent?: number;
  minAbsoluteGain?: number;
  minZScore?: number;
  minConsecutiveBins?: number;
}

export interface MinimumEffectiveDoseEstimate {
  detected: boolean;
  reason: string | null;
  minimumEffectiveDose: number | null;
  minimumEffectiveDoseRange:
    | { lowerBound: number; upperBound: number; isUpperInclusive: boolean }
    | null;
  baselineOutcomeMean: number | null;
  expectedGainAtDose: number | null;
  expectedRelativeGainPercentAtDose: number | null;
  zScoreAtDose: number | null;
  bins: ResponseCurveBin[];
  support: {
    sampleCount: number;
    binCount: number;
    minBinCount: number;
    minConsecutiveBins: number;
  };
}

export interface ResponseCurveRange {
  lowerBound: number;
  upperBound: number;
  isUpperInclusive: boolean;
}

export interface SaturationRangeOptions {
  targetBinCount?: number;
  minBinSize?: number;
  minSamples?: number;
  minConsecutiveSlopes?: number;
  maxMarginalGainFraction?: number;
  minAbsoluteSlope?: number;
}

export interface SaturationRangeEstimate {
  detected: boolean;
  reason: string | null;
  plateauStartPredictorValue: number | null;
  plateauEndPredictorValue: number | null;
  plateauRange: ResponseCurveRange | null;
  referenceSlope: number | null;
  flatSlopeThreshold: number | null;
  slopes: number[];
  bins: ResponseCurveBin[];
  support: {
    sampleCount: number;
    binCount: number;
    minBinCount: number;
    minConsecutiveSlopes: number;
  };
}

export type ResponseCurveObjective = 'maximize_outcome' | 'minimize_outcome';

export interface SupportConstrainedTargetOptions {
  targetBinCount?: number;
  minBinSize?: number;
  minSamples?: number;
  objective?: ResponseCurveObjective;
  modelOptimalValue?: number | null;
  robustLowerQuantile?: number;
  robustUpperQuantile?: number;
}

export interface SupportConstrainedTargetsEstimate {
  detected: boolean;
  reason: string | null;
  objective: ResponseCurveObjective;
  rawModelOptimalValue: number | null;
  supportConstrainedOptimalValue: number | null;
  supportConstrainedRange: ResponseCurveRange | null;
  robustOptimalValue: number | null;
  robustRange: ResponseCurveRange | null;
  rawWithinObservedRange: boolean | null;
  rawWithinSupportRange: boolean | null;
  deltas: {
    rawToSupportAbsolute: number | null;
    rawToSupportPercent: number | null;
    rawToRobustAbsolute: number | null;
    rawToRobustPercent: number | null;
  };
  bins: ResponseCurveBin[];
  robustBins: ResponseCurveBin[];
  support: {
    sampleCount: number;
    binCount: number;
    robustSampleCount: number;
    robustBinCount: number;
    minBinCount: number;
  };
}

const DEFAULT_TARGET_BIN_COUNT = 12;
const DEFAULT_MIN_BIN_SIZE = 25;
const DEFAULT_MIN_SAMPLES = 120;
const DEFAULT_MIN_SLOPE_POINTS_PER_SEGMENT = 2;
const DEFAULT_MIN_PRE_SLOPE = 0;
const DEFAULT_MAX_POST_TO_PRE_SLOPE_RATIO = 0.5;

const DEFAULT_MIN_RELATIVE_GAIN_PERCENT = 2;
const DEFAULT_MIN_ABSOLUTE_GAIN = 0;
const DEFAULT_MIN_Z_SCORE = 1;
const DEFAULT_MIN_CONSECUTIVE_BINS = 2;

const DEFAULT_MIN_CONSECUTIVE_FLAT_SLOPES = 2;
const DEFAULT_MAX_MARGINAL_GAIN_FRACTION = 0.2;
const DEFAULT_MIN_ABSOLUTE_FLAT_SLOPE = 0.0001;

const DEFAULT_RESPONSE_OBJECTIVE: ResponseCurveObjective = 'maximize_outcome';
const DEFAULT_ROBUST_LOWER_QUANTILE = 0.1;
const DEFAULT_ROBUST_UPPER_QUANTILE = 0.9;

interface XYPoint {
  predictorValue: number;
  outcomeValue: number;
}

interface KneeCandidate {
  kneeBinIndex: number;
  firstSegmentSlope: number;
  secondSegmentSlope: number;
  slopeRatio: number;
  dropScore: number;
}

interface EffectiveDoseCandidate {
  binIndex: number;
  gain: number;
  relativeGainPercent: number | null;
  zScore: number;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function average(values: number[]): number {
  if (values.length === 0) return NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = average(values);
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
  }
  return sorted[middle] ?? NaN;
}

function toFinitePairs(x: number[], y: number[]): XYPoint[] {
  const points: XYPoint[] = [];
  const length = Math.min(x.length, y.length);
  for (let index = 0; index < length; index++) {
    const predictor = x[index];
    const outcome = y[index];
    if (!isFiniteNumber(predictor) || !isFiniteNumber(outcome)) continue;
    points.push({ predictorValue: predictor, outcomeValue: outcome });
  }
  return points.sort((left, right) => left.predictorValue - right.predictorValue);
}

function inBin(value: number, lower: number, upper: number, isUpperInclusive: boolean): boolean {
  if (isUpperInclusive) return value >= lower && value <= upper;
  return value >= lower && value < upper;
}

function buildResponseCurveBins(
  points: XYPoint[],
  targetBinCount: number,
  minBinSize: number,
): ResponseCurveBin[] {
  if (points.length === 0) return [];

  const predictorValues = points.map((point) => point.predictorValue);
  const adaptiveBins = buildAdaptiveNumericBins(predictorValues, {
    targetBinCount,
    minBinSize,
  });

  const bins: ResponseCurveBin[] = [];
  for (let binIndex = 0; binIndex < adaptiveBins.length; binIndex++) {
    const definition = adaptiveBins[binIndex];
    if (!definition) continue;
    const inRange = points.filter((point) =>
      inBin(
        point.predictorValue,
        definition.lowerBound,
        definition.upperBound,
        definition.isUpperInclusive,
      ),
    );
    if (inRange.length === 0) continue;
    const predictorBinValues = inRange.map((point) => point.predictorValue);
    const outcomeBinValues = inRange.map((point) => point.outcomeValue);
    const outcomeStd = standardDeviation(outcomeBinValues);
    bins.push({
      binIndex,
      lowerBound: definition.lowerBound,
      upperBound: definition.upperBound,
      isUpperInclusive: definition.isUpperInclusive,
      count: inRange.length,
      predictorMean: average(predictorBinValues),
      predictorMedian: median(predictorBinValues),
      outcomeMean: average(outcomeBinValues),
      outcomeStd,
      outcomeSem: outcomeStd / Math.sqrt(inRange.length),
    });
  }
  return bins;
}

function deriveSegmentSlopes(bins: ResponseCurveBin[]): number[] {
  const slopes: number[] = [];
  for (let index = 0; index < bins.length - 1; index++) {
    const current = bins[index];
    const next = bins[index + 1];
    if (!current || !next) continue;
    const deltaX = next.predictorMean - current.predictorMean;
    if (Math.abs(deltaX) < 1e-12) continue;
    slopes.push((next.outcomeMean - current.outcomeMean) / deltaX);
  }
  return slopes;
}

function pickKneeCandidate(
  slopes: number[],
  minSlopePointsPerSegment: number,
): KneeCandidate | null {
  let bestCandidate: KneeCandidate | null = null;
  for (
    let split = minSlopePointsPerSegment;
    split <= slopes.length - minSlopePointsPerSegment;
    split++
  ) {
    const first = slopes.slice(0, split);
    const second = slopes.slice(split);
    const firstSlope = average(first);
    const secondSlope = average(second);
    if (!isFiniteNumber(firstSlope) || !isFiniteNumber(secondSlope)) continue;
    if (Math.abs(firstSlope) < 1e-12) continue;
    const slopeRatio = secondSlope / firstSlope;
    const dropScore = firstSlope - secondSlope;
    const candidate: KneeCandidate = {
      kneeBinIndex: split,
      firstSegmentSlope: firstSlope,
      secondSegmentSlope: secondSlope,
      slopeRatio,
      dropScore,
    };
    if (!bestCandidate || candidate.dropScore > bestCandidate.dropScore) {
      bestCandidate = candidate;
    }
  }
  return bestCandidate;
}

function createDiminishingReturnsSupport(
  sampleCount: number,
  binCount: number,
  minSlopePointsPerSegment: number,
): DiminishingReturnsEstimate['support'] {
  return {
    sampleCount,
    binCount,
    minBinCount: minSlopePointsPerSegment * 2 + 1,
    minSlopePointsPerSegment,
  };
}

function createNoKneeResult(
  bins: ResponseCurveBin[],
  segmentSlopes: number[],
  reason: string,
  support: DiminishingReturnsEstimate['support'],
): DiminishingReturnsEstimate {
  return {
    detected: false,
    reason,
    kneePredictorValue: null,
    firstSegmentSlope: null,
    secondSegmentSlope: null,
    slopeRatio: null,
    segmentSlopes,
    bins,
    support,
  };
}

export function estimateDiminishingReturns(
  x: number[],
  y: number[],
  options: DiminishingReturnsOptions = {},
): DiminishingReturnsEstimate {
  const points = toFinitePairs(x, y);
  const minSamples = Math.max(6, options.minSamples ?? DEFAULT_MIN_SAMPLES);
  const targetBinCount = Math.max(3, options.targetBinCount ?? DEFAULT_TARGET_BIN_COUNT);
  const minBinSize = Math.max(3, options.minBinSize ?? DEFAULT_MIN_BIN_SIZE);
  const minSlopePointsPerSegment = Math.max(
    1,
    options.minSlopePointsPerSegment ?? DEFAULT_MIN_SLOPE_POINTS_PER_SEGMENT,
  );
  const minPreSlope = options.minPreSlope ?? DEFAULT_MIN_PRE_SLOPE;
  const maxPostToPreSlopeRatio =
    options.maxPostToPreSlopeRatio ?? DEFAULT_MAX_POST_TO_PRE_SLOPE_RATIO;

  const bins = buildResponseCurveBins(points, targetBinCount, minBinSize);
  const slopes = deriveSegmentSlopes(bins);
  const support = createDiminishingReturnsSupport(
    points.length,
    bins.length,
    minSlopePointsPerSegment,
  );
  if (points.length < minSamples) {
    return createNoKneeResult(bins, slopes, 'insufficient_samples', support);
  }
  if (bins.length < support.minBinCount) {
    return createNoKneeResult(bins, slopes, 'insufficient_bins', support);
  }

  const candidate = pickKneeCandidate(slopes, minSlopePointsPerSegment);
  if (!candidate) {
    return createNoKneeResult(bins, slopes, 'no_positive_slope_drop_detected', support);
  }

  const kneeBin = bins[candidate.kneeBinIndex];
  if (!kneeBin) {
    return createNoKneeResult(bins, slopes, 'knee_not_locatable', support);
  }
  const detected =
    candidate.firstSegmentSlope >= minPreSlope &&
    candidate.dropScore > 0 &&
    candidate.slopeRatio <= maxPostToPreSlopeRatio;
  return {
    detected,
    reason: detected ? null : 'drop_below_detection_threshold',
    kneePredictorValue: kneeBin.predictorMedian,
    firstSegmentSlope: candidate.firstSegmentSlope,
    secondSegmentSlope: candidate.secondSegmentSlope,
    slopeRatio: candidate.slopeRatio,
    segmentSlopes: slopes,
    bins,
    support,
  };
}

function relativeGainPercent(gain: number, baseline: number): number | null {
  if (!isFiniteNumber(gain) || !isFiniteNumber(baseline) || baseline === 0) return null;
  return (gain / Math.abs(baseline)) * 100;
}

function computeDoseCandidate(
  baselineBin: ResponseCurveBin,
  candidateBin: ResponseCurveBin,
): EffectiveDoseCandidate {
  const gain = candidateBin.outcomeMean - baselineBin.outcomeMean;
  const relGain = relativeGainPercent(gain, baselineBin.outcomeMean);
  const combinedSem = Math.sqrt(
    baselineBin.outcomeSem ** 2 + candidateBin.outcomeSem ** 2,
  );
  const zScore =
    combinedSem > 0 ? gain / combinedSem : gain > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  return {
    binIndex: candidateBin.binIndex,
    gain,
    relativeGainPercent: relGain,
    zScore,
  };
}

function gainThresholdPassed(
  candidate: EffectiveDoseCandidate,
  minAbsoluteGain: number,
  minRelativeGainPercent: number,
  minZScore: number,
): boolean {
  const absoluteEnabled = minAbsoluteGain > 0;
  const relativeEnabled = minRelativeGainPercent > 0;
  const absolutePass = !absoluteEnabled || candidate.gain >= minAbsoluteGain;
  const relativePass = !relativeEnabled || (
    candidate.relativeGainPercent != null &&
    candidate.relativeGainPercent >= minRelativeGainPercent
  );
  const magnitudePass = absoluteEnabled && relativeEnabled
    ? absolutePass || relativePass
    : absoluteEnabled
      ? absolutePass
      : relativeEnabled
        ? relativePass
        : candidate.gain > 0;
  return magnitudePass && candidate.zScore >= minZScore;
}

function createNoMedResult(
  bins: ResponseCurveBin[],
  reason: string,
  support: MinimumEffectiveDoseEstimate['support'],
): MinimumEffectiveDoseEstimate {
  return {
    detected: false,
    reason,
    minimumEffectiveDose: null,
    minimumEffectiveDoseRange: null,
    baselineOutcomeMean: bins[0]?.outcomeMean ?? null,
    expectedGainAtDose: null,
    expectedRelativeGainPercentAtDose: null,
    zScoreAtDose: null,
    bins,
    support,
  };
}

export function estimateMinimumEffectiveDose(
  x: number[],
  y: number[],
  options: MinimumEffectiveDoseOptions = {},
): MinimumEffectiveDoseEstimate {
  const points = toFinitePairs(x, y);
  const targetBinCount = Math.max(3, options.targetBinCount ?? DEFAULT_TARGET_BIN_COUNT);
  const minBinSize = Math.max(3, options.minBinSize ?? DEFAULT_MIN_BIN_SIZE);
  const minSamples = Math.max(6, options.minSamples ?? DEFAULT_MIN_SAMPLES);
  const minRelativeGainPercent =
    options.minRelativeGainPercent ?? DEFAULT_MIN_RELATIVE_GAIN_PERCENT;
  const minAbsoluteGain = options.minAbsoluteGain ?? DEFAULT_MIN_ABSOLUTE_GAIN;
  const minZScore = options.minZScore ?? DEFAULT_MIN_Z_SCORE;
  const minConsecutiveBins = Math.max(
    1,
    options.minConsecutiveBins ?? DEFAULT_MIN_CONSECUTIVE_BINS,
  );

  const bins = buildResponseCurveBins(points, targetBinCount, minBinSize);
  const minBinCount = minConsecutiveBins + 1;
  const support: MinimumEffectiveDoseEstimate['support'] = {
    sampleCount: points.length,
    binCount: bins.length,
    minBinCount,
    minConsecutiveBins,
  };
  if (points.length < minSamples) {
    return createNoMedResult(bins, 'insufficient_samples', support);
  }
  if (bins.length < minBinCount) {
    return createNoMedResult(bins, 'insufficient_bins', support);
  }

  const baseline = bins[0];
  if (!baseline) {
    return createNoMedResult(bins, 'missing_baseline_bin', support);
  }
  for (let start = 1; start <= bins.length - minConsecutiveBins; start++) {
    const window = bins.slice(start, start + minConsecutiveBins);
    const candidates = window.map((bin) => computeDoseCandidate(baseline, bin));
    const allPassed = candidates.every((candidate) =>
      gainThresholdPassed(
        candidate,
        minAbsoluteGain,
        minRelativeGainPercent,
        minZScore,
      ),
    );
    if (!allPassed) continue;
    const firstBin = bins[start];
    const firstCandidate = candidates[0];
    if (!firstBin || !firstCandidate) continue;
    return {
      detected: true,
      reason: null,
      minimumEffectiveDose: firstBin.predictorMedian,
      minimumEffectiveDoseRange: {
        lowerBound: firstBin.lowerBound,
        upperBound: firstBin.upperBound,
        isUpperInclusive: firstBin.isUpperInclusive,
      },
      baselineOutcomeMean: baseline.outcomeMean,
      expectedGainAtDose: firstCandidate.gain,
      expectedRelativeGainPercentAtDose: firstCandidate.relativeGainPercent,
      zScoreAtDose: firstCandidate.zScore,
      bins,
      support,
    };
  }
  return createNoMedResult(bins, 'no_consistent_effective_dose_detected', support);
}

function toRange(bin: ResponseCurveBin): ResponseCurveRange {
  return {
    lowerBound: bin.lowerBound,
    upperBound: bin.upperBound,
    isUpperInclusive: bin.isUpperInclusive,
  };
}

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0] ?? NaN;
  const clampedQ = Math.max(0, Math.min(1, q));
  const position = clampedQ * (sorted.length - 1);
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  if (lowerIndex === upperIndex) return sorted[lowerIndex] ?? NaN;
  const lower = sorted[lowerIndex] ?? NaN;
  const upper = sorted[upperIndex] ?? NaN;
  const weight = position - lowerIndex;
  return lower + (upper - lower) * weight;
}

function percentDelta(from: number, to: number): number | null {
  if (!isFiniteNumber(from) || !isFiniteNumber(to)) return null;
  if (Math.abs(from) < 1e-12) return null;
  return ((to - from) / Math.abs(from)) * 100;
}

function selectBestBin(
  bins: ResponseCurveBin[],
  objective: ResponseCurveObjective,
): ResponseCurveBin | null {
  if (bins.length === 0) return null;
  let best = bins[0] ?? null;
  for (let index = 1; index < bins.length; index++) {
    const candidate = bins[index];
    if (!candidate || !best) continue;
    const candidateScore = candidate.outcomeMean;
    const bestScore = best.outcomeMean;
    const better =
      objective === 'maximize_outcome'
        ? candidateScore > bestScore
        : candidateScore < bestScore;
    if (better) {
      best = candidate;
      continue;
    }
    if (candidateScore === bestScore && candidate.count > best.count) {
      best = candidate;
      continue;
    }
    if (
      candidateScore === bestScore &&
      candidate.count === best.count &&
      candidate.binIndex < best.binIndex
    ) {
      best = candidate;
    }
  }
  return best;
}

function createNoSaturationResult(
  bins: ResponseCurveBin[],
  slopes: number[],
  reason: string,
  support: SaturationRangeEstimate['support'],
): SaturationRangeEstimate {
  return {
    detected: false,
    reason,
    plateauStartPredictorValue: null,
    plateauEndPredictorValue: null,
    plateauRange: null,
    referenceSlope: null,
    flatSlopeThreshold: null,
    slopes,
    bins,
    support,
  };
}

export function estimateSaturationRange(
  x: number[],
  y: number[],
  options: SaturationRangeOptions = {},
): SaturationRangeEstimate {
  const points = toFinitePairs(x, y);
  const targetBinCount = Math.max(3, options.targetBinCount ?? DEFAULT_TARGET_BIN_COUNT);
  const minBinSize = Math.max(3, options.minBinSize ?? DEFAULT_MIN_BIN_SIZE);
  const minSamples = Math.max(6, options.minSamples ?? DEFAULT_MIN_SAMPLES);
  const minConsecutiveSlopes = Math.max(
    1,
    options.minConsecutiveSlopes ?? DEFAULT_MIN_CONSECUTIVE_FLAT_SLOPES,
  );
  const maxMarginalGainFraction =
    options.maxMarginalGainFraction ?? DEFAULT_MAX_MARGINAL_GAIN_FRACTION;
  const minAbsoluteSlope = options.minAbsoluteSlope ?? DEFAULT_MIN_ABSOLUTE_FLAT_SLOPE;

  const bins = buildResponseCurveBins(points, targetBinCount, minBinSize);
  const slopes = deriveSegmentSlopes(bins);
  const support: SaturationRangeEstimate['support'] = {
    sampleCount: points.length,
    binCount: bins.length,
    minBinCount: minConsecutiveSlopes + 1,
    minConsecutiveSlopes,
  };
  if (points.length < minSamples) {
    return createNoSaturationResult(bins, slopes, 'insufficient_samples', support);
  }
  if (bins.length < support.minBinCount) {
    return createNoSaturationResult(bins, slopes, 'insufficient_bins', support);
  }

  const positiveSlopes = slopes.filter((slope) => slope > 0).sort((a, b) => a - b);
  if (positiveSlopes.length === 0) {
    return createNoSaturationResult(bins, slopes, 'no_positive_reference_slope', support);
  }
  const referenceSlope = percentile(positiveSlopes, 0.75);
  if (!isFiniteNumber(referenceSlope) || referenceSlope <= 0) {
    return createNoSaturationResult(bins, slopes, 'no_positive_reference_slope', support);
  }
  const flatSlopeThreshold = Math.max(
    Math.abs(referenceSlope) * Math.max(0, maxMarginalGainFraction),
    Math.max(0, minAbsoluteSlope),
  );

  let plateauStartSlopeIndex: number | null = null;
  for (let start = 0; start <= slopes.length - minConsecutiveSlopes; start++) {
    let isFlatRun = true;
    for (let offset = 0; offset < minConsecutiveSlopes; offset++) {
      const slope = slopes[start + offset];
      if (slope == null || Math.abs(slope) > flatSlopeThreshold) {
        isFlatRun = false;
        break;
      }
    }
    if (isFlatRun) {
      plateauStartSlopeIndex = start;
      break;
    }
  }
  if (plateauStartSlopeIndex == null) {
    return createNoSaturationResult(bins, slopes, 'no_plateau_zone_detected', support);
  }

  let plateauEndSlopeIndex = plateauStartSlopeIndex + minConsecutiveSlopes - 1;
  while (plateauEndSlopeIndex + 1 < slopes.length) {
    const nextSlope = slopes[plateauEndSlopeIndex + 1];
    if (nextSlope == null || Math.abs(nextSlope) > flatSlopeThreshold) break;
    plateauEndSlopeIndex += 1;
  }

  const startBin = bins[plateauStartSlopeIndex + 1];
  const endBin = bins[plateauEndSlopeIndex + 1];
  if (!startBin || !endBin) {
    return createNoSaturationResult(bins, slopes, 'plateau_not_locatable', support);
  }

  return {
    detected: true,
    reason: null,
    plateauStartPredictorValue: startBin.predictorMedian,
    plateauEndPredictorValue: endBin.predictorMedian,
    plateauRange: {
      lowerBound: startBin.lowerBound,
      upperBound: endBin.upperBound,
      isUpperInclusive: endBin.isUpperInclusive,
    },
    referenceSlope,
    flatSlopeThreshold,
    slopes,
    bins,
    support,
  };
}

function createNoSupportTargetResult(
  bins: ResponseCurveBin[],
  robustBins: ResponseCurveBin[],
  objective: ResponseCurveObjective,
  reason: string,
  sampleCount: number,
  robustSampleCount: number,
  minBinCount: number,
): SupportConstrainedTargetsEstimate {
  return {
    detected: false,
    reason,
    objective,
    rawModelOptimalValue: null,
    supportConstrainedOptimalValue: null,
    supportConstrainedRange: null,
    robustOptimalValue: null,
    robustRange: null,
    rawWithinObservedRange: null,
    rawWithinSupportRange: null,
    deltas: {
      rawToSupportAbsolute: null,
      rawToSupportPercent: null,
      rawToRobustAbsolute: null,
      rawToRobustPercent: null,
    },
    bins,
    robustBins,
    support: {
      sampleCount,
      binCount: bins.length,
      robustSampleCount,
      robustBinCount: robustBins.length,
      minBinCount,
    },
  };
}

export function deriveSupportConstrainedTargets(
  x: number[],
  y: number[],
  options: SupportConstrainedTargetOptions = {},
): SupportConstrainedTargetsEstimate {
  const points = toFinitePairs(x, y);
  const targetBinCount = Math.max(3, options.targetBinCount ?? DEFAULT_TARGET_BIN_COUNT);
  const minBinSize = Math.max(3, options.minBinSize ?? DEFAULT_MIN_BIN_SIZE);
  const minSamples = Math.max(6, options.minSamples ?? DEFAULT_MIN_SAMPLES);
  const objective = options.objective ?? DEFAULT_RESPONSE_OBJECTIVE;
  const robustLowerQuantile = options.robustLowerQuantile ?? DEFAULT_ROBUST_LOWER_QUANTILE;
  const robustUpperQuantile = options.robustUpperQuantile ?? DEFAULT_ROBUST_UPPER_QUANTILE;
  const minBinCount = 2;

  const bins = buildResponseCurveBins(points, targetBinCount, minBinSize);
  if (points.length < minSamples) {
    return createNoSupportTargetResult(
      bins,
      [],
      objective,
      'insufficient_samples',
      points.length,
      0,
      minBinCount,
    );
  }
  if (bins.length < minBinCount) {
    return createNoSupportTargetResult(
      bins,
      [],
      objective,
      'insufficient_bins',
      points.length,
      0,
      minBinCount,
    );
  }

  const bestBin = selectBestBin(bins, objective);
  if (!bestBin) {
    return createNoSupportTargetResult(
      bins,
      [],
      objective,
      'no_supported_optimal_detected',
      points.length,
      0,
      minBinCount,
    );
  }

  const supportConstrainedOptimalValue = bestBin.predictorMedian;
  const supportConstrainedRange = toRange(bestBin);
  const rawModelOptimalValue = isFiniteNumber(options.modelOptimalValue)
    ? options.modelOptimalValue
    : supportConstrainedOptimalValue;

  const observedLowerBound = bins[0]?.lowerBound;
  const observedUpperBound = bins[bins.length - 1]?.upperBound;
  const rawWithinObservedRange =
    rawModelOptimalValue == null ||
    observedLowerBound == null ||
    observedUpperBound == null
      ? null
      : rawModelOptimalValue >= observedLowerBound && rawModelOptimalValue <= observedUpperBound;
  const rawWithinSupportRange =
    rawModelOptimalValue == null
      ? null
      : inBin(
          rawModelOptimalValue,
          supportConstrainedRange.lowerBound,
          supportConstrainedRange.upperBound,
          supportConstrainedRange.isUpperInclusive,
        );

  const predictorsSorted = points
    .map((point) => point.predictorValue)
    .sort((left, right) => left - right);
  const lowerThreshold = percentile(
    predictorsSorted,
    Math.max(0, Math.min(1, robustLowerQuantile)),
  );
  const upperThreshold = percentile(
    predictorsSorted,
    Math.max(0, Math.min(1, robustUpperQuantile)),
  );
  const trimmedPoints =
    isFiniteNumber(lowerThreshold) &&
    isFiniteNumber(upperThreshold) &&
    lowerThreshold < upperThreshold
      ? points.filter(
          (point) =>
            point.predictorValue >= lowerThreshold &&
            point.predictorValue <= upperThreshold,
        )
      : points;

  const robustBins = buildResponseCurveBins(trimmedPoints, targetBinCount, minBinSize);
  const robustBestBin =
    trimmedPoints.length >= minBinSize && robustBins.length >= minBinCount
      ? selectBestBin(robustBins, objective)
      : null;
  const robustOptimalValue = robustBestBin?.predictorMedian ?? null;
  const robustRange = robustBestBin ? toRange(robustBestBin) : null;

  const rawToSupportAbsolute =
    rawModelOptimalValue == null || supportConstrainedOptimalValue == null
      ? null
      : rawModelOptimalValue - supportConstrainedOptimalValue;
  const rawToRobustAbsolute =
    rawModelOptimalValue == null || robustOptimalValue == null
      ? null
      : rawModelOptimalValue - robustOptimalValue;

  return {
    detected: true,
    reason: null,
    objective,
    rawModelOptimalValue,
    supportConstrainedOptimalValue,
    supportConstrainedRange,
    robustOptimalValue,
    robustRange,
    rawWithinObservedRange,
    rawWithinSupportRange,
    deltas: {
      rawToSupportAbsolute,
      rawToSupportPercent:
        rawModelOptimalValue == null || supportConstrainedOptimalValue == null
          ? null
          : percentDelta(supportConstrainedOptimalValue, rawModelOptimalValue),
      rawToRobustAbsolute,
      rawToRobustPercent:
        rawModelOptimalValue == null || robustOptimalValue == null
          ? null
          : percentDelta(robustOptimalValue, rawModelOptimalValue),
    },
    bins,
    robustBins,
    support: {
      sampleCount: points.length,
      binCount: bins.length,
      robustSampleCount: trimmedPoints.length,
      robustBinCount: robustBins.length,
      minBinCount,
    },
  };
}
