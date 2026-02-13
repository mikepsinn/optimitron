/**
 * Adaptive numeric binning for visualization and cohort summaries.
 *
 * Produces contiguous bins that:
 * - follow the empirical distribution (quantile seeds)
 * - respect optional anchor breakpoints
 * - enforce a minimum sample size per bin by merging undersized bins
 */

export interface NumericBin {
  lowerBound: number;
  upperBound: number;
  count: number;
  isUpperInclusive: boolean;
}

export interface AdaptiveBinningOptions {
  targetBinCount?: number;
  minBinSize?: number;
  anchors?: number[];
  roundTo?: number;
  minEdgeGap?: number;
}

const DEFAULT_TARGET_BINS = 10;
const DEFAULT_MIN_BIN_SIZE = 30;
const DEFAULT_MIN_EDGE_GAP = 1e-6;

function finiteSorted(values: number[]): number[] {
  return values.filter(Number.isFinite).sort((a, b) => a - b);
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const idx = (sorted.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo] ?? NaN;
  const loVal = sorted[lo] ?? NaN;
  const hiVal = sorted[hi] ?? NaN;
  return loVal + (hiVal - loVal) * (idx - lo);
}

function roundStep(value: number, step: number): number {
  if (!Number.isFinite(step) || step <= 0) return value;
  return Math.round(value / step) * step;
}

function uniqueEdges(values: number[], minGap: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const edges: number[] = [];
  for (const value of sorted) {
    const last = edges[edges.length - 1];
    if (last == null || Math.abs(value - last) >= minGap) {
      edges.push(value);
    }
  }
  return edges;
}

function buildCandidateEdges(sorted: number[], options: Required<AdaptiveBinningOptions>): number[] {
  const min = sorted[0] ?? NaN;
  const max = sorted[sorted.length - 1] ?? NaN;
  const rawEdges: number[] = [min, max];

  if (options.targetBinCount > 1) {
    for (let i = 1; i < options.targetBinCount; i++) {
      rawEdges.push(quantile(sorted, i / options.targetBinCount));
    }
  }

  for (const anchor of options.anchors) {
    if (anchor > min && anchor < max) {
      rawEdges.push(anchor);
    }
  }

  const rounded = rawEdges.map(edge => roundStep(edge, options.roundTo));
  const clamped = rounded
    .map(edge => Math.min(max, Math.max(min, edge)))
    .filter(Number.isFinite);

  const edges = uniqueEdges([min, ...clamped, max], options.minEdgeGap);
  if ((edges[0] ?? NaN) > min) edges.unshift(min);
  if ((edges[edges.length - 1] ?? NaN) < max) edges.push(max);
  return edges;
}

function edgesToBins(edges: number[], sorted: number[]): NumericBin[] {
  if (edges.length < 2) return [];

  const bins: NumericBin[] = [];
  let startIdx = 0;
  for (let i = 0; i < edges.length - 1; i++) {
    const lower = edges[i] ?? NaN;
    const upper = edges[i + 1] ?? NaN;
    const isLast = i === edges.length - 2;

    let endIdx = startIdx;
    while (endIdx < sorted.length) {
      const value = sorted[endIdx] ?? NaN;
      if (isLast ? value <= upper : value < upper) {
        endIdx++;
      } else {
        break;
      }
    }

    bins.push({
      lowerBound: lower,
      upperBound: upper,
      count: endIdx - startIdx,
      isUpperInclusive: isLast,
    });

    startIdx = endIdx;
  }

  return bins;
}

function undersizedIndex(bins: NumericBin[], minBinSize: number): number {
  return bins.findIndex(bin => bin.count < minBinSize);
}

function boundaryToRemove(bins: NumericBin[], idx: number): number {
  if (idx <= 0) return 1;
  if (idx >= bins.length - 1) return bins.length - 1;

  const mergeLeft = (bins[idx - 1]?.count ?? 0) + (bins[idx]?.count ?? 0);
  const mergeRight = (bins[idx]?.count ?? 0) + (bins[idx + 1]?.count ?? 0);
  return mergeLeft <= mergeRight ? idx : idx + 1;
}

/**
 * Build adaptive bins for a numeric array.
 */
export function buildAdaptiveNumericBins(
  values: number[],
  options: AdaptiveBinningOptions = {},
): NumericBin[] {
  const sorted = finiteSorted(values);
  if (sorted.length === 0) return [];

  const configured: Required<AdaptiveBinningOptions> = {
    targetBinCount: Math.max(1, Math.floor(options.targetBinCount ?? DEFAULT_TARGET_BINS)),
    minBinSize: Math.max(1, Math.floor(options.minBinSize ?? DEFAULT_MIN_BIN_SIZE)),
    anchors: options.anchors ?? [],
    roundTo: options.roundTo ?? 0,
    minEdgeGap: options.minEdgeGap ?? DEFAULT_MIN_EDGE_GAP,
  };

  const min = sorted[0] ?? NaN;
  const max = sorted[sorted.length - 1] ?? NaN;
  if (min === max) {
    return [{ lowerBound: min, upperBound: max, count: sorted.length, isUpperInclusive: true }];
  }

  const edges = buildCandidateEdges(sorted, configured);
  if (edges.length < 2) {
    return [{ lowerBound: min, upperBound: max, count: sorted.length, isUpperInclusive: true }];
  }

  let bins = edgesToBins(edges, sorted);
  while (bins.length > 1) {
    const idx = undersizedIndex(bins, configured.minBinSize);
    if (idx === -1) break;
    const removeAt = boundaryToRemove(bins, idx);
    edges.splice(removeAt, 1);
    bins = edgesToBins(edges, sorted);
  }

  return bins;
}
