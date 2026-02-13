import { describe, expect, it } from "vitest";

import {
  DEFAULT_REPORT_OUTCOME_IDS,
  buildAsciiDistributionChart,
  buildDistributionBuckets,
  buildFetchCacheKey,
  buildFixedWidthDistributionBuckets,
  buildPairTemporalProfileCandidates,
  buildPairBinSummaryRows,
  buildPppPerCapitaSummary,
  derivePairQualityWarnings,
  isPercentGdpUnit,
  isReportEligibleOutcome,
  isReportEligiblePredictor,
  resolvePairTemporalProfile,
  scoreTemporalProfileCandidate,
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

  it("resolvePairTemporalProfile uses predictor temporal metadata when provided", () => {
    const predictor: VariableRegistryEntry = {
      id: "predictor.test.temporal",
      label: "Temporal Predictor",
      description: "test",
      kind: "predictor",
      category: "fiscal",
      unit: "unit",
      analysisScopes: ["global_panel"],
      defaultTransforms: ["level"],
      suggestedLagYears: [0, 1],
      temporalProfile: {
        onsetDelayYears: [2, 4],
        durationYears: [3, 1],
        preferredFillingType: "none",
      },
      source: { provider: "manual", code: "x" },
      coverage: { profileStatus: "unprofiled" },
      isDerived: false,
      isDiscretionary: true,
      tags: [],
      caveats: [],
    };
    const outcome: VariableRegistryEntry = {
      id: "outcome.test.temporal",
      label: "Temporal Outcome",
      description: "test",
      kind: "outcome",
      category: "economic",
      unit: "unit",
      welfareDirection: "higher_better",
      analysisScopes: ["global_panel"],
      defaultTransforms: ["level"],
      suggestedLagYears: [1, 2, 5],
      source: { provider: "manual", code: "y" },
      coverage: { profileStatus: "unprofiled" },
      isDerived: false,
      tags: [],
      caveats: [],
    };

    const resolved = resolvePairTemporalProfile(predictor, outcome);
    expect(resolved).toEqual({
      lagYears: 2,
      durationYears: 1,
      source: "predictor_default",
      fillingType: "none",
      fillingValue: undefined,
    });
  });

  it("resolvePairTemporalProfile falls back to lag metadata + interpolation defaults", () => {
    const predictor: VariableRegistryEntry = {
      id: "predictor.test.fallback",
      label: "Fallback Predictor",
      description: "test",
      kind: "predictor",
      category: "fiscal",
      unit: "unit",
      analysisScopes: ["global_panel"],
      defaultTransforms: ["level"],
      suggestedLagYears: [3],
      source: { provider: "manual", code: "x" },
      coverage: { profileStatus: "unprofiled" },
      isDerived: false,
      isDiscretionary: true,
      tags: [],
      caveats: [],
    };
    const outcome: VariableRegistryEntry = {
      id: "outcome.test.fallback",
      label: "Fallback Outcome",
      description: "test",
      kind: "outcome",
      category: "economic",
      unit: "unit",
      welfareDirection: "higher_better",
      analysisScopes: ["global_panel"],
      defaultTransforms: ["level"],
      suggestedLagYears: [5],
      source: { provider: "manual", code: "y" },
      coverage: { profileStatus: "unprofiled" },
      isDerived: false,
      tags: [],
      caveats: [],
    };

    const resolved = resolvePairTemporalProfile(predictor, outcome);
    expect(resolved).toEqual({
      lagYears: 3,
      durationYears: 1,
      source: "global_fallback",
      fillingType: "interpolation",
    });
  });

  it("resolvePairTemporalProfile prioritizes pair overrides over predictor defaults", () => {
    const predictor: VariableRegistryEntry = {
      id: "predictor.wb.education_expenditure_pct_gdp",
      label: "Education Expenditure (% GDP)",
      description: "test",
      kind: "predictor",
      category: "education",
      unit: "% GDP",
      analysisScopes: ["global_panel"],
      defaultTransforms: ["level"],
      suggestedLagYears: [0, 1, 2, 3, 5],
      temporalProfile: {
        onsetDelayYears: [0],
        durationYears: [1],
        preferredFillingType: "none",
      },
      source: { provider: "manual", code: "x" },
      coverage: { profileStatus: "unprofiled" },
      isDerived: false,
      isDiscretionary: true,
      tags: [],
      caveats: [],
    };
    const outcome: VariableRegistryEntry = {
      id: "outcome.derived.after_tax_median_income_ppp",
      label: "After-Tax Median Income (PPP)",
      description: "test",
      kind: "outcome",
      category: "economic",
      unit: "international $",
      welfareDirection: "higher_better",
      analysisScopes: ["global_panel"],
      defaultTransforms: ["level"],
      suggestedLagYears: [0, 1, 2, 3],
      source: { provider: "manual", code: "y" },
      coverage: { profileStatus: "unprofiled" },
      isDerived: false,
      tags: [],
      caveats: [],
    };

    const resolved = resolvePairTemporalProfile(predictor, outcome);
    expect(resolved).toEqual({
      lagYears: 3,
      durationYears: 5,
      source: "pair_override",
      fillingType: "interpolation",
    });
  });

  it("buildPairTemporalProfileCandidates creates lag/duration combinations from predictor defaults", () => {
    const predictor: VariableRegistryEntry = {
      id: "predictor.test.candidates",
      label: "Candidate Predictor",
      description: "test",
      kind: "predictor",
      category: "fiscal",
      unit: "unit",
      analysisScopes: ["global_panel"],
      defaultTransforms: ["level"],
      suggestedLagYears: [0],
      temporalProfile: {
        onsetDelayYears: [0, 1, 2],
        durationYears: [1, 3],
        preferredFillingType: "interpolation",
      },
      source: { provider: "manual", code: "x" },
      coverage: { profileStatus: "unprofiled" },
      isDerived: false,
      isDiscretionary: true,
      tags: [],
      caveats: [],
    };
    const outcome: VariableRegistryEntry = {
      id: "outcome.test.candidates",
      label: "Candidate Outcome",
      description: "test",
      kind: "outcome",
      category: "economic",
      unit: "unit",
      welfareDirection: "higher_better",
      analysisScopes: ["global_panel"],
      defaultTransforms: ["level"],
      suggestedLagYears: [2, 5],
      source: { provider: "manual", code: "y" },
      coverage: { profileStatus: "unprofiled" },
      isDerived: false,
      tags: [],
      caveats: [],
    };

    const candidates = buildPairTemporalProfileCandidates(predictor, outcome);
    expect(candidates).toEqual([
      {
        lagYears: 2,
        durationYears: 1,
        source: "predictor_default",
        fillingType: "interpolation",
        fillingValue: undefined,
      },
      {
        lagYears: 2,
        durationYears: 3,
        source: "predictor_default",
        fillingType: "interpolation",
        fillingValue: undefined,
      },
    ]);
  });

  it("scoreTemporalProfileCandidate rewards stronger directional and support signals", () => {
    const weak = scoreTemporalProfileCandidate({
      includedSubjects: 12,
      totalPairs: 420,
      aggregateStatisticalSignificance: 0.62,
      aggregatePredictivePearson: 0.05,
    });
    const strong = scoreTemporalProfileCandidate({
      includedSubjects: 150,
      totalPairs: 5200,
      aggregateStatisticalSignificance: 0.91,
      aggregatePredictivePearson: 0.31,
    });

    expect(strong).toBeGreaterThan(weak);
  });

  it("slugifyId produces deterministic filesystem-safe IDs", () => {
    expect(slugifyId("outcome.wb.gdp_per_capita_ppp")).toBe("outcome.wb.gdp_per_capita_ppp");
    expect(slugifyId("Predictor Derived / Value")).toBe("predictor-derived-value");
    expect(slugifyId("___A  B___")).toBe("a-b");
  });

  it("buildFetchCacheKey is deterministic and jurisdiction-order agnostic", () => {
    const keyA = buildFetchCacheKey("predictor.wb.gov_expenditure_pct_gdp", {
      period: { startYear: 1990, endYear: 2023 },
      jurisdictions: ["USA", "CAN", "MEX"],
    });
    const keyB = buildFetchCacheKey("predictor.wb.gov_expenditure_pct_gdp", {
      period: { startYear: 1990, endYear: 2023 },
      jurisdictions: ["MEX", "USA", "CAN", "USA"],
    });
    const keyC = buildFetchCacheKey("predictor.wb.gov_expenditure_pct_gdp", {
      period: { startYear: 1980, endYear: 2023 },
      jurisdictions: ["CAN", "MEX", "USA"],
    });

    expect(keyA).toBe(keyB);
    expect(keyA).not.toBe(keyC);
    expect(keyA).toContain("predictor.wb.gov_expenditure_pct_gdp");
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

  it("isPercentGdpUnit identifies GDP share units", () => {
    expect(isPercentGdpUnit("% GDP")).toBe(true);
    expect(isPercentGdpUnit("% of GDP")).toBe(true);
    expect(isPercentGdpUnit("international $")).toBe(false);
  });

  it("buildPppPerCapitaSummary estimates PPP-equivalent levels for % GDP predictors", () => {
    const alignedPoints = [
      {
        subjectId: "AAA",
        predictorValue: 10,
        outcomeValue: 60,
        predictorTimestamp: new Date("2020-01-01T00:00:00.000Z").getTime(),
      },
      {
        subjectId: "AAA",
        predictorValue: 15,
        outcomeValue: 64,
        predictorTimestamp: new Date("2021-01-01T00:00:00.000Z").getTime(),
      },
      {
        subjectId: "BBB",
        predictorValue: 25,
        outcomeValue: 80,
        predictorTimestamp: new Date("2020-01-01T00:00:00.000Z").getTime(),
      },
      {
        subjectId: "BBB",
        predictorValue: 35,
        outcomeValue: 84,
        predictorTimestamp: new Date("2021-01-01T00:00:00.000Z").getTime(),
      },
    ];
    const predictorBinRows = [
      {
        binIndex: 0,
        label: "[10, 20)",
        lowerBound: 10,
        upperBound: 20,
        isUpperInclusive: false,
        pairs: 2,
        subjects: 1,
        predictorMean: 12.5,
        predictorMedian: 12.5,
        outcomeMean: 62,
        outcomeMedian: 62,
      },
      {
        binIndex: 1,
        label: "[20, 35]",
        lowerBound: 20,
        upperBound: 35,
        isUpperInclusive: true,
        pairs: 2,
        subjects: 1,
        predictorMean: 30,
        predictorMedian: 30,
        outcomeMean: 82,
        outcomeMedian: 82,
      },
    ];
    const gdpSeriesBySubject = new Map([
      [
        "AAA",
        {
          variableId: "outcome.wb.gdp_per_capita_ppp",
          name: "GDP per capita PPP",
          measurements: [
            { timestamp: "2020-01-01T00:00:00.000Z", value: 10000 },
            { timestamp: "2021-01-01T00:00:00.000Z", value: 12000 },
          ],
        },
      ],
      [
        "BBB",
        {
          variableId: "outcome.wb.gdp_per_capita_ppp",
          name: "GDP per capita PPP",
          measurements: [
            { timestamp: "2020-01-01T00:00:00.000Z", value: 20000 },
            { timestamp: "2021-01-01T00:00:00.000Z", value: 22000 },
          ],
        },
      ],
    ]);

    const summary = buildPppPerCapitaSummary(
      alignedPoints,
      predictorBinRows,
      "% GDP",
      gdpSeriesBySubject,
      20,
      19,
    );

    expect(summary).not.toBeNull();
    expect(summary?.samplePairs).toBe(4);
    expect(summary?.medianGdpPerCapitaPpp).toBe(16000);
    expect(summary?.estimatedBestPerCapitaPpp).toBe(3200);
    expect(summary?.bestObservedPerCapitaPppRange).toContain("[");
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

  it("isReportEligibleOutcome defaults to HALE/income levels + growth outcomes", () => {
    const haleOutcome: VariableRegistryEntry = {
      id: "outcome.who.healthy_life_expectancy_years",
      label: "HALE",
      description: "test",
      kind: "outcome",
      category: "health",
      unit: "years",
      welfareDirection: "higher_better",
      analysisScopes: ["global_panel"],
      defaultTransforms: ["level"],
      suggestedLagYears: [0],
      source: { provider: "manual", code: "x" },
      coverage: { profileStatus: "unprofiled" },
      isDerived: false,
      tags: [],
      caveats: [],
    };
    const incomeOutcome: VariableRegistryEntry = {
      ...haleOutcome,
      id: "outcome.derived.after_tax_median_income_ppp",
      label: "After-Tax Median Income (PPP)",
      category: "economic",
      unit: "international $",
    };
    const haleGrowthOutcome: VariableRegistryEntry = {
      ...haleOutcome,
      id: "outcome.derived.healthy_life_expectancy_growth_yoy_pct",
      label: "HALE Growth",
      unit: "% YoY",
    };
    const giniOutcome: VariableRegistryEntry = {
      ...haleOutcome,
      id: "outcome.wb.gini_index",
      label: "Gini",
      welfareDirection: "lower_better",
    };

    expect(DEFAULT_REPORT_OUTCOME_IDS).toContain("outcome.who.healthy_life_expectancy_years");
    expect(DEFAULT_REPORT_OUTCOME_IDS).toContain("outcome.derived.healthy_life_expectancy_growth_yoy_pct");
    expect(DEFAULT_REPORT_OUTCOME_IDS).toContain("outcome.derived.after_tax_median_income_ppp");
    expect(DEFAULT_REPORT_OUTCOME_IDS).toContain("outcome.derived.after_tax_median_income_ppp_growth_yoy_pct");
    expect(isReportEligibleOutcome(haleOutcome)).toBe(true);
    expect(isReportEligibleOutcome(incomeOutcome)).toBe(true);
    expect(isReportEligibleOutcome(haleGrowthOutcome)).toBe(true);
    expect(isReportEligibleOutcome(giniOutcome)).toBe(false);
  });
});
