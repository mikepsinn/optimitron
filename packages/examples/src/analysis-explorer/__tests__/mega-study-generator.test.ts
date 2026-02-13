import { describe, expect, it } from "vitest";

import {
  buildAsciiDistributionChart,
  buildDistributionBuckets,
  buildFixedWidthDistributionBuckets,
  buildPairBinSummaryRows,
  derivePairQualityWarnings,
  isReportEligiblePredictor,
  selectLagYears,
  slugifyId,
} from "../mega-study-generator.js";
import type { VariableRegistryEntry } from "@optomitron/data";

describe("mega-study-generator helpers", () => {
  it("selectLagYears prefers the smallest shared lag", () => {
    expect(selectLagYears([0, 1, 3], [1, 2, 3])).toBe(1);
    expect(selectLagYears([5, 3], [3, 5])).toBe(3);
  });

  it("selectLagYears falls back to lag=1 when no shared lag includes 1", () => {
    expect(selectLagYears([0, 2], [1, 3])).toBe(1);
  });

  it("slugifyId produces deterministic filesystem-safe IDs", () => {
    expect(slugifyId("outcome.wb.gdp_per_capita_ppp")).toBe("outcome.wb.gdp_per_capita_ppp");
    expect(slugifyId("Predictor Derived / Value")).toBe("predictor-derived-value");
    expect(slugifyId("___A  B___")).toBe("a-b");
  });

  it("derivePairQualityWarnings flags expected quality issues", () => {
    const warnings = derivePairQualityWarnings({
      includedSubjects: 12,
      totalPairs: 300,
      aggregateStatisticalSignificance: 0.6,
      aggregatePredictivePearson: 1.3,
      maxSubjectDirectionalScore: 1.5,
    });

    expect(warnings).toHaveLength(5);
    expect(warnings.join(" ")).toContain("Low subject coverage");
    expect(warnings.join(" ")).toContain("Low aligned-pair count");
    expect(warnings.join(" ")).toContain("Weak aggregate significance");
    expect(warnings.join(" ")).toContain("Directional score exceeds");
    expect(warnings.join(" ")).toContain("subject-level directional scores exceed");
  });

  it("derivePairQualityWarnings returns empty for high-quality signal", () => {
    expect(
      derivePairQualityWarnings({
        includedSubjects: 80,
        totalPairs: 5000,
        aggregateStatisticalSignificance: 0.9,
        aggregatePredictivePearson: 0.2,
        maxSubjectDirectionalScore: 0.9,
        predictorObservedMin: 10,
        predictorObservedMax: 30,
        aggregateValuePredictingHighOutcome: 20,
        aggregateValuePredictingLowOutcome: 15,
        aggregateOptimalDailyValue: 21,
      }),
    ).toEqual([]);
  });

  it("derivePairQualityWarnings flags out-of-range optimal values", () => {
    const warnings = derivePairQualityWarnings({
      includedSubjects: 80,
      totalPairs: 5000,
      aggregateStatisticalSignificance: 0.9,
      aggregatePredictivePearson: 0.2,
      maxSubjectDirectionalScore: 0.9,
      predictorObservedMin: 10,
      predictorObservedMax: 30,
      aggregateValuePredictingHighOutcome: 35,
      aggregateValuePredictingLowOutcome: 12,
      aggregateOptimalDailyValue: 11,
    });

    expect(warnings.join(" ")).toContain("outside the observed predictor range");
  });

  it("buildDistributionBuckets preserves total counts", () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const buckets = buildDistributionBuckets(values, 4, 1);
    expect(buckets.length).toBeGreaterThan(1);
    expect(buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(values.length);
  });

  it("buildPairBinSummaryRows computes outcome summaries", () => {
    const rows = buildPairBinSummaryRows(
      [
        { subjectId: "A", predictorValue: 1, outcomeValue: 10 },
        { subjectId: "A", predictorValue: 2, outcomeValue: 12 },
        { subjectId: "B", predictorValue: 8, outcomeValue: 25 },
        { subjectId: "B", predictorValue: 9, outcomeValue: 27 },
      ],
      2,
    );
    expect(rows.length).toBeGreaterThan(0);
    const maxOutcomeMean = Math.max(...rows.map((row) => row.outcomeMean ?? Number.NEGATIVE_INFINITY));
    expect(maxOutcomeMean).toBeGreaterThan(10);
  });

  it("buildFixedWidthDistributionBuckets returns non-uniform counts for skewed data", () => {
    const buckets = buildFixedWidthDistributionBuckets([0, 0, 0, 0, 10, 20, 30], 4);
    expect(buckets.length).toBeGreaterThan(1);
    const counts = buckets.map((bucket) => bucket.count);
    expect(Math.max(...counts)).toBeGreaterThan(Math.min(...counts));
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(7);
  });

  it("buildAsciiDistributionChart renders labeled bars", () => {
    const chart = buildAsciiDistributionChart("Demo", [
      { lowerBound: 0, upperBound: 1, isUpperInclusive: false, count: 4 },
      { lowerBound: 1, upperBound: 2, isUpperInclusive: true, count: 8 },
    ]);
    expect(chart).toContain("Demo");
    expect(chart).toContain("#");
    expect(chart).toContain("8");
  });

  it("isReportEligiblePredictor excludes non-discretionary predictors", () => {
    const discretionary: VariableRegistryEntry = {
      id: "predictor.test.discretionary",
      label: "Discretionary Predictor",
      description: "test",
      kind: "predictor",
      category: "fiscal",
      unit: "u",
      analysisScopes: ["global_panel"],
      defaultTransforms: ["level"],
      suggestedLagYears: [0],
      source: { provider: "manual", code: "x" },
      coverage: { profileStatus: "unprofiled" },
      isDerived: false,
      isDiscretionary: true,
      tags: [],
      caveats: [],
    };
    const nonDiscretionary: VariableRegistryEntry = {
      ...discretionary,
      id: "predictor.test.non_discretionary",
      isDiscretionary: false,
    };

    expect(isReportEligiblePredictor(discretionary)).toBe(true);
    expect(isReportEligiblePredictor(nonDiscretionary)).toBe(false);
  });
});
