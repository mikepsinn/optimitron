import type { GovernmentScatterPoint } from "./governmentScatterplotMetrics";

export type ScatterAxisDomain = [number, number];

export interface ScatterRegressionLine {
  intercept: number;
  slope: number;
}

export interface ScatterRegressionSegmentPoint {
  x: number;
  y: number;
}

function getSpanPadding(minimum: number, maximum: number): number {
  const span = maximum - minimum;
  if (span > 0) {
    return span * 0.08;
  }

  return Math.max(Math.abs(maximum || minimum) * 0.1, 1);
}

export function getScatterAxisDomain(values: number[]): ScatterAxisDomain | null {
  if (values.length === 0) {
    return null;
  }

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const padding = getSpanPadding(minimum, maximum);
  const domainMinimum = minimum >= 0 ? Math.max(0, minimum - padding) : minimum - padding;

  return [domainMinimum, maximum + padding];
}

export function calculateScatterRegressionLine(
  points: GovernmentScatterPoint[],
): ScatterRegressionLine | null {
  if (points.length < 2) {
    return null;
  }

  const xMean = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const yMean = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const numerator = points.reduce(
    (sum, point) => sum + (point.x - xMean) * (point.y - yMean),
    0,
  );
  const denominator = points.reduce(
    (sum, point) => sum + (point.x - xMean) ** 2,
    0,
  );

  if (denominator === 0) {
    return null;
  }

  const slope = numerator / denominator;
  return { slope, intercept: yMean - slope * xMean };
}

export function buildScatterRegressionSegment(
  points: GovernmentScatterPoint[],
  xDomain: ScatterAxisDomain | null,
): [ScatterRegressionSegmentPoint, ScatterRegressionSegmentPoint] | null {
  const line = calculateScatterRegressionLine(points);
  if (!line || !xDomain) {
    return null;
  }

  const [xStart, xEnd] = xDomain;
  return [
    { x: xStart, y: line.intercept + line.slope * xStart },
    { x: xEnd, y: line.intercept + line.slope * xEnd },
  ];
}
