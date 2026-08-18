interface GovernmentScatterNarrativeArgs {
  correlation: number | null;
  hiddenOutliers: number;
  pointCount: number;
  xLabel: string;
  yLabel: string;
}

type RelationshipStrength = "strong" | "moderate" | "modest" | "faint";

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

function describeStrength(correlation: number): RelationshipStrength {
  const absoluteCorrelation = Math.abs(correlation);

  if (absoluteCorrelation >= 0.6) {
    return "strong";
  }
  if (absoluteCorrelation >= 0.35) {
    return "moderate";
  }
  if (absoluteCorrelation >= 0.2) {
    return "modest";
  }
  return "faint";
}

function describeDirection(correlation: number): "positive" | "inverse" {
  return correlation >= 0 ? "positive" : "inverse";
}

function describeTendency(
  correlation: number,
  xLabel: string,
  yLabel: string,
): string {
  if (correlation >= 0) {
    return `countries with higher ${xLabel} generally also have higher ${yLabel}`;
  }

  return `countries with higher ${xLabel} generally have lower ${yLabel}`;
}

function describeStrengthContext(strength: RelationshipStrength): string {
  switch (strength) {
    case "strong":
      return "with a clear overall pattern in the dots";
    case "moderate":
      return "clear enough to notice, even though it is far from a perfect rule";
    case "modest":
      return "real, but still loose and noisy rather than tight";
    case "faint":
      return "weak and noisy, so it should be read cautiously";
  }
}

export function describeGovernmentScatterRelationship({
  correlation,
  hiddenOutliers,
  pointCount,
  xLabel,
  yLabel,
}: GovernmentScatterNarrativeArgs): string {
  if (correlation === null || pointCount < 2) {
    return `There are not enough comparable countries to describe the relationship between ${xLabel} and ${yLabel} yet.`;
  }

  const scope =
    hiddenOutliers > 0
      ? `Across ${pointCount} countries after excluding ${hiddenOutliers} ${pluralize(hiddenOutliers, "outlier")}`
      : `Across ${pointCount} comparable countries`;

  const strength = describeStrength(correlation);
  if (strength === "faint") {
    return `${scope}, there is only a faint relationship between ${xLabel} and ${yLabel}. The dots hint that higher ${xLabel} comes with ${correlation >= 0 ? "higher" : "lower"} ${yLabel}, but the pattern is ${describeStrengthContext(strength)} (r=${correlation.toFixed(2)}).`;
  }

  return `${scope}, ${describeTendency(correlation, xLabel, yLabel)}. This is a ${strength} ${describeDirection(correlation)} relationship, ${describeStrengthContext(strength)} (r=${correlation.toFixed(2)}).`;
}
