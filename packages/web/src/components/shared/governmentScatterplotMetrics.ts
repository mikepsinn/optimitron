import type { GovernmentMetrics } from "@optimitron/data/datasets/government-report-cards";
import {
  getArmsExportsPerCapitaPPP,
  getGovernmentClinicalTrialSpendingPerCapitaPPP,
  getGovernmentMedicalResearchSpendingPerCapitaPPP,
  getMilitarySpendingPerCapitaPPP,
  getMilitaryToGovernmentClinicalTrialRatio,
  getMilitaryToGovernmentMedicalResearchRatio,
} from "@optimitron/data/datasets/government-spending-ratios";

export type GovernmentScatterMetricKey =
  | "trialRatio"
  | "researchRatio"
  | "bodyCount"
  | "hale"
  | "lifeExpectancy"
  | "gdpPerCapita"
  | "militaryPerCapitaPPP"
  | "medianIncome"
  | "militaryPctGDP"
  | "healthSpending"
  | "govMedicalResearch"
  | "clinicalTrials"
  | "nuclearWarheads"
  | "armsExports"
  | "debtPctGDP"
  | "incarcerationRate"
  | "homicideRate"
  | "drugPrisoners"
  | "policeKillings"
  | "educationPctGDP"
  | "militaryEducationRatio";

type MetricFormat = "compact-number" | "currency" | "percent" | "ratio" | "years";

export interface GovernmentScatterMetric {
  key: GovernmentScatterMetricKey;
  label: string;
  format: MetricFormat;
}

export interface GovernmentScatterPoint {
  code: string;
  name: string;
  x: number;
  y: number;
  bodyCount: number;
}

export const GOVERNMENT_SCATTERPLOT_DEFAULT_X: GovernmentScatterMetricKey =
  "trialRatio";
export const GOVERNMENT_SCATTERPLOT_DEFAULT_Y: GovernmentScatterMetricKey = "hale";

export const GOVERNMENT_SCATTER_METRICS: GovernmentScatterMetric[] = [
  { key: "trialRatio", label: "Mil/Trials", format: "ratio" },
  { key: "researchRatio", label: "Mil/Research", format: "ratio" },
  { key: "bodyCount", label: "Killed", format: "compact-number" },
  { key: "hale", label: "HALE", format: "years" },
  { key: "lifeExpectancy", label: "Life Expectancy", format: "years" },
  { key: "gdpPerCapita", label: "GDP/cap PPP", format: "currency" },
  { key: "militaryPerCapitaPPP", label: "Military/cap PPP", format: "currency" },
  { key: "medianIncome", label: "Median Income PPP", format: "currency" },
  { key: "militaryPctGDP", label: "Military % GDP", format: "percent" },
  { key: "healthSpending", label: "Health/cap PPP", format: "currency" },
  { key: "govMedicalResearch", label: "Gov Med Research/cap PPP", format: "currency" },
  { key: "clinicalTrials", label: "Gov Trials/cap PPP", format: "currency" },
  { key: "nuclearWarheads", label: "Nuclear Warheads", format: "compact-number" },
  { key: "armsExports", label: "Arms Exports/cap PPP", format: "currency" },
  { key: "debtPctGDP", label: "Debt % GDP", format: "percent" },
  { key: "incarcerationRate", label: "Incarceration /100K", format: "compact-number" },
  { key: "homicideRate", label: "Homicide /100K", format: "compact-number" },
  { key: "drugPrisoners", label: "Drug Prisoners", format: "compact-number" },
  { key: "policeKillings", label: "Police Killings/yr", format: "compact-number" },
  { key: "educationPctGDP", label: "Education % GDP", format: "percent" },
  { key: "militaryEducationRatio", label: "Military/Education", format: "ratio" },
];

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const currencyFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
  style: "currency",
  currency: "USD",
});

function interpolate(start: number, end: number, weight: number): number {
  return start + (end - start) * weight;
}

function getPercentile(sortedValues: number[], percentile: number): number | null {
  if (sortedValues.length === 0) {
    return null;
  }

  const position = (sortedValues.length - 1) * percentile;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const lowerValue = sortedValues[lowerIndex];
  const upperValue = sortedValues[upperIndex];

  if (lowerValue === undefined || upperValue === undefined) {
    return null;
  }

  if (lowerIndex === upperIndex) {
    return lowerValue;
  }

  return interpolate(lowerValue, upperValue, position - lowerIndex);
}

function getIqrBounds(values: number[]): { min: number; max: number } | null {
  if (values.length < 4) {
    return null;
  }

  const sortedValues = [...values].sort((a, b) => a - b);
  const q1 = getPercentile(sortedValues, 0.25);
  const q3 = getPercentile(sortedValues, 0.75);

  if (q1 === null || q3 === null) {
    return null;
  }

  const iqr = q3 - q1;
  if (iqr === 0) {
    return null;
  }

  return {
    min: q1 - iqr * 1.5,
    max: q3 + iqr * 1.5,
  };
}

function isWithinBounds(
  value: number,
  bounds: { min: number; max: number } | null,
): boolean {
  if (!bounds) {
    return true;
  }

  return value >= bounds.min && value <= bounds.max;
}

function getMetricFormat(key: GovernmentScatterMetricKey): MetricFormat {
  return (
    GOVERNMENT_SCATTER_METRICS.find((metric) => metric.key === key)?.format ??
    "compact-number"
  );
}

export function getGovernmentScatterMetricValue(
  government: GovernmentMetrics,
  key: GovernmentScatterMetricKey,
): number | null {
  switch (key) {
    case "trialRatio":
      return getMilitaryToGovernmentClinicalTrialRatio(government);
    case "researchRatio":
      return getMilitaryToGovernmentMedicalResearchRatio(government);
    case "bodyCount":
      return government.militaryDeathsCaused.value;
    case "hale":
      return government.hale?.value ?? null;
    case "lifeExpectancy":
      return government.lifeExpectancy.value;
    case "gdpPerCapita":
      return government.gdpPerCapita.value;
    case "militaryPerCapitaPPP":
      return getMilitarySpendingPerCapitaPPP(government);
    case "medianIncome":
      return government.medianIncome?.value ?? null;
    case "militaryPctGDP":
      return government.militaryPctGDP.value;
    case "healthSpending":
      return government.healthSpendingPerCapita.value;
    case "govMedicalResearch":
      return getGovernmentMedicalResearchSpendingPerCapitaPPP(government);
    case "clinicalTrials":
      return getGovernmentClinicalTrialSpendingPerCapitaPPP(government);
    case "nuclearWarheads":
      return government.nuclearWarheads.value;
    case "armsExports":
      return getArmsExportsPerCapitaPPP(government);
    case "debtPctGDP":
      return government.debtPctGDP.value;
    case "incarcerationRate":
      return government.incarcerationRate.value;
    case "homicideRate":
      return government.homicideRate.value;
    case "drugPrisoners":
      return government.drugPrisoners?.value ?? null;
    case "policeKillings":
      return government.policeKillingsAnnual?.value ?? null;
    case "educationPctGDP":
      return government.educationSpendingPctGDP?.value ?? null;
    case "militaryEducationRatio":
      return government.militaryToEducationRatio?.value ?? null;
  }
}

export function formatGovernmentScatterMetricValue(
  key: GovernmentScatterMetricKey,
  value: number,
): string {
  switch (getMetricFormat(key)) {
    case "currency":
      return currencyFormatter.format(value);
    case "percent":
      return `${value.toFixed(1)}%`;
    case "ratio":
      return value >= 1000
        ? `${Math.round(value).toLocaleString()}:1`
        : `${value.toFixed(value >= 100 ? 0 : 1)}:1`;
    case "years":
      return `${value.toFixed(1)} yrs`;
    case "compact-number":
      return compactNumberFormatter.format(value);
  }
}

export function buildGovernmentScatterplotData(
  governments: GovernmentMetrics[],
  xKey: GovernmentScatterMetricKey,
  yKey: GovernmentScatterMetricKey,
): GovernmentScatterPoint[] {
  return governments
    .map((government) => ({
      code: government.code,
      name: government.name,
      x: getGovernmentScatterMetricValue(government, xKey),
      y: getGovernmentScatterMetricValue(government, yKey),
      bodyCount: government.militaryDeathsCaused.value,
    }))
    .filter(
      (
        point,
      ): point is GovernmentScatterPoint & { x: number; y: number; bodyCount: number } =>
        point.x !== null && point.y !== null,
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filterGovernmentScatterOutliers(
  points: GovernmentScatterPoint[],
): GovernmentScatterPoint[] {
  const xBounds = getIqrBounds(points.map((point) => point.x));
  const yBounds = getIqrBounds(points.map((point) => point.y));

  if (!xBounds && !yBounds) {
    return points;
  }

  return points.filter(
    (point) =>
      isWithinBounds(point.x, xBounds) && isWithinBounds(point.y, yBounds),
  );
}

export function calculatePearsonCorrelation(
  points: GovernmentScatterPoint[],
): number | null {
  if (points.length < 2) {
    return null;
  }

  const xMean = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const yMean = points.reduce((sum, point) => sum + point.y, 0) / points.length;

  let numerator = 0;
  let xVariance = 0;
  let yVariance = 0;

  for (const point of points) {
    const xDiff = point.x - xMean;
    const yDiff = point.y - yMean;
    numerator += xDiff * yDiff;
    xVariance += xDiff * xDiff;
    yVariance += yDiff * yDiff;
  }

  if (xVariance === 0 || yVariance === 0) {
    return null;
  }

  return numerator / Math.sqrt(xVariance * yVariance);
}

export function describeCorrelation(correlation: number | null): string {
  if (correlation === null) {
    return "Need at least two comparable countries";
  }
  if (correlation >= 0.7) {
    return "Strong positive";
  }
  if (correlation >= 0.3) {
    return "Moderate positive";
  }
  if (correlation > -0.3) {
    return "Weak / mixed";
  }
  if (correlation > -0.7) {
    return "Moderate negative";
  }
  return "Strong negative";
}
