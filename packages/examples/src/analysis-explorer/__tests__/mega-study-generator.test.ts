import { describe, expect, it } from "vitest";

import {
  DEFAULT_REPORT_OUTCOME_IDS,
  buildAsciiDistributionChart,
  buildDerivedDifferencePerCapitaPpp,
  buildDerivedPercentGdpPerCapitaPpp,
  buildDerivedShareOfVariablePercent,
  buildDistributionBuckets,
  buildFetchCacheKey,
  buildFixedWidthDistributionBuckets,
  buildPairRobustnessSummary,
  buildPairTemporalProfileCandidates,
  buildPairBinSummaryRows,
  buildPppPerCapitaSummary,
  computePairMarginalTradeoffDiagnostics,
  derivePairDataSufficiency,
  derivePairReliability,
  directionFromSignal,
  derivePairQualityTier,
  derivePairQualityWarnings,
  isPercentGdpUnit,
  isReportEligibleOutcome,
  isReportEligiblePredictor,
  resolveActionableOptimalValue,
  resolveDecisionOptimalValue,
  resolveDecisionTargetSource,
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
    expect(warnings.join(" ")).toContain("Low country coverage");
    expect(warnings.join(" ")).toContain("Low aligned-pair count");
    expect(warnings.join(" ")).toContain("Weak significance score");
    expect(warnings.join(" ")).toContain("Direction score is unusually high");
    expect(warnings.join(" ")).toContain("country-level direction scores are unusually high");
  });

  it("derivePairQualityWarnings returns empty for high-quality signal", () => {
    expect(
      derivePairQualityWarnings({
        includedSubjects: 80,
        totalPairs: 5000,
        aggregateStatisticalSignificance: 0.9,
        aggregateForwardPearson: 0.2,
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

  it("derivePairQualityWarnings flags forward-vs-directional sign conflict", () => {
    const warnings = derivePairQualityWarnings({
      includedSubjects: 90,
      totalPairs: 4500,
      aggregateStatisticalSignificance: 0.88,
      aggregateForwardPearson: 0.21,
      aggregatePredictivePearson: -0.12,
      maxSubjectDirectionalScore: 0.8,
    });

    expect(warnings.join(" ")).toContain("Forward and direction signals disagree");
  });

  it("directionFromSignal uses forward sign when directional evidence is sufficient", () => {
    expect(directionFromSignal(0.22, 0.08)).toBe("positive");
    expect(directionFromSignal(-0.31, -0.07)).toBe("negative");
  });

  it("directionFromSignal returns neutral when forward effect or causal direction signal is weak", () => {
    expect(directionFromSignal(0.03, 0.2)).toBe("neutral");
    expect(directionFromSignal(0.2, 0.01)).toBe("neutral");
  });

  it("derivePairDataSufficiency marks high-coverage pairs as sufficient", () => {
    const sufficiency = derivePairDataSufficiency({
      includedSubjects: 120,
      totalPairs: 6000,
      temporalCandidatesWithResults: 8,
      predictorBinCount: 10,
    });

    expect(sufficiency.status).toBe("sufficient");
    expect(sufficiency.reasons).toHaveLength(0);
  });

  it("derivePairDataSufficiency marks low-coverage pairs as insufficient_data", () => {
    const sufficiency = derivePairDataSufficiency({
      includedSubjects: 15,
      totalPairs: 800,
      temporalCandidatesWithResults: 1,
      predictorBinCount: 3,
    });

    expect(sufficiency.status).toBe("insufficient_data");
    expect(sufficiency.reasons.length).toBeGreaterThanOrEqual(3);
  });

  it("derivePairReliability scores stronger, stable signals higher", () => {
    const strong = derivePairReliability({
      includedSubjects: 140,
      totalPairs: 6500,
      aggregateStatisticalSignificance: 0.92,
      aggregatePredictivePearson: 0.12,
      topTemporalScoreDelta: 0.04,
      robustnessDeltaPercent: 8,
      dataSufficiencyStatus: "sufficient",
    });
    const weak = derivePairReliability({
      includedSubjects: 30,
      totalPairs: 1200,
      aggregateStatisticalSignificance: 0.62,
      aggregatePredictivePearson: 0.01,
      topTemporalScoreDelta: 0.002,
      robustnessDeltaPercent: 65,
      dataSufficiencyStatus: "insufficient_data",
    });

    expect(strong.overallScore).toBeGreaterThan(weak.overallScore);
    expect(strong.band).toMatch(/high|moderate/);
    expect(weak.band).toBe("low");
  });

  it("derivePairQualityTier classifies insufficient and exploratory tiers", () => {
    expect(
      derivePairQualityTier({
        includedSubjects: 10,
        totalPairs: 200,
        aggregateStatisticalSignificance: 0.4,
        aggregatePredictivePearson: 0.15,
        temporalStabilityWarning: null,
        robustnessDeltaPercent: 5,
        actionabilityStatus: "exploratory",
      }),
    ).toBe("insufficient");

    expect(
      derivePairQualityTier({
        includedSubjects: 120,
        totalPairs: 5000,
        aggregateStatisticalSignificance: 0.9,
        aggregatePredictivePearson: 0.09,
        temporalStabilityWarning: "close profiles",
        robustnessDeltaPercent: 30,
        actionabilityStatus: "exploratory",
      }),
    ).toBe("exploratory");
  });

  it("derivePairQualityTier returns strong for stable high-confidence actionable signals", () => {
    expect(
      derivePairQualityTier({
        includedSubjects: 160,
        totalPairs: 7000,
        aggregateStatisticalSignificance: 0.93,
        aggregatePredictivePearson: 0.12,
        temporalStabilityWarning: null,
        robustnessDeltaPercent: 8,
        actionabilityStatus: "actionable",
      }),
    ).toBe("strong");
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

    expect(warnings.join(" ")).toContain("outside the seen data range");
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

  it("buildDerivedPercentGdpPerCapitaPpp maps %GDP into per-capita PPP", () => {
    const raw = new Map([
      [
        "predictor.wb.gov_expenditure_pct_gdp",
        [
          { jurisdictionIso3: "AAA", year: 2020, value: 20, source: "x" },
          { jurisdictionIso3: "BBB", year: 2020, value: 30, source: "x" },
        ],
      ],
      [
        "outcome.wb.gdp_per_capita_ppp",
        [
          { jurisdictionIso3: "AAA", year: 2020, value: 10000, source: "y" },
          { jurisdictionIso3: "BBB", year: 2020, value: 20000, source: "y" },
        ],
      ],
    ]);
    const derived = buildDerivedPercentGdpPerCapitaPpp(
      raw,
      "predictor.wb.gov_expenditure_pct_gdp",
      "derived test",
    );

    expect(derived).toHaveLength(2);
    expect(derived[0]?.value).toBe(2000);
    expect(derived[1]?.value).toBe(6000);
  });

  it("buildDerivedShareOfVariablePercent computes sector share within total spending", () => {
    const raw = new Map([
      [
        "predictor.wb.gov_health_expenditure_pct_gdp",
        [
          { jurisdictionIso3: "AAA", year: 2020, value: 4, source: "x" },
          { jurisdictionIso3: "BBB", year: 2020, value: 6, source: "x" },
        ],
      ],
      [
        "predictor.wb.gov_expenditure_pct_gdp",
        [
          { jurisdictionIso3: "AAA", year: 2020, value: 20, source: "y" },
          { jurisdictionIso3: "BBB", year: 2020, value: 30, source: "y" },
        ],
      ],
    ]);
    const share = buildDerivedShareOfVariablePercent(
      raw,
      "predictor.wb.gov_health_expenditure_pct_gdp",
      "predictor.wb.gov_expenditure_pct_gdp",
      "derived share test",
    );

    expect(share).toHaveLength(2);
    expect(share[0]?.value).toBe(20);
    expect(share[1]?.value).toBe(20);
    expect(share[0]?.unit).toBe("% of government expenditure");
  });

  it("buildDerivedDifferencePerCapitaPpp computes non-negative per-capita differences", () => {
    const raw = new Map([
      [
        "predictor.derived.gov_expenditure_per_capita_ppp",
        [
          { jurisdictionIso3: "AAA", year: 2020, value: 5000, source: "x" },
          { jurisdictionIso3: "BBB", year: 2020, value: 4000, source: "x" },
        ],
      ],
      [
        "predictor.derived.military_expenditure_per_capita_ppp",
        [
          { jurisdictionIso3: "AAA", year: 2020, value: 1000, source: "y" },
          { jurisdictionIso3: "BBB", year: 2020, value: 4500, source: "y" },
        ],
      ],
    ]);
    const diff = buildDerivedDifferencePerCapitaPpp(
      raw,
      "predictor.derived.gov_expenditure_per_capita_ppp",
      "predictor.derived.military_expenditure_per_capita_ppp",
      "derived diff test",
    );

    expect(diff).toHaveLength(1);
    expect(diff[0]?.jurisdictionIso3).toBe("AAA");
    expect(diff[0]?.value).toBe(4000);
  });

  it("buildPairRobustnessSummary reports trimmed sensitivity without dropping raw signal", () => {
    const alignedPoints = [
      { subjectId: "A", predictorValue: 1, outcomeValue: 10 },
      { subjectId: "A", predictorValue: 2, outcomeValue: 11 },
      { subjectId: "A", predictorValue: 3, outcomeValue: 12 },
      { subjectId: "B", predictorValue: 4, outcomeValue: 13 },
      { subjectId: "B", predictorValue: 5, outcomeValue: 14 },
      { subjectId: "B", predictorValue: 6, outcomeValue: 15 },
      { subjectId: "C", predictorValue: 7, outcomeValue: 16 },
      { subjectId: "C", predictorValue: 8, outcomeValue: 17 },
      { subjectId: "C", predictorValue: 9, outcomeValue: 18 },
      { subjectId: "D", predictorValue: 1000, outcomeValue: 200 },
    ];
    const padded = [
      ...alignedPoints,
      ...Array.from({ length: 40 }, (_, idx) => ({
        subjectId: `P${idx}`,
        predictorValue: 10 + idx,
        outcomeValue: 20 + idx,
      })),
    ];
    const rows = buildPairBinSummaryRows(padded, 10);
    const summary = buildPairRobustnessSummary(padded, rows, 500, 10, 0.1, 0.9);

    expect(summary.rawPairCount).toBe(padded.length);
    expect(summary.trimmedPairCount).toBeLessThan(summary.rawPairCount);
    expect(summary.retainedFraction).toBeGreaterThan(0.7);
    expect(summary.rawBestObservedRange).toBeTruthy();
    expect(summary.robustBestObservedRange).toBeTruthy();
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

  it("resolveActionableOptimalValue stays raw (not clamped to observed range)", () => {
    const pair = {
      aggregateOptimalDailyValue: 20,
      aggregateValuePredictingHighOutcome: 15,
      predictorObservedMin: 0,
      predictorObservedMax: 10,
    } as Parameters<typeof resolveActionableOptimalValue>[0];

    expect(resolveActionableOptimalValue(pair)).toBe(20);
  });

  it("resolveDecisionOptimalValue prefers support-constrained targets", () => {
    const pair = {
      responseCurve: {
        supportConstrainedTargets: {
          supportConstrainedOptimalValue: 14,
          robustOptimalValue: 12,
        },
      },
    } as Parameters<typeof resolveDecisionOptimalValue>[0];

    expect(resolveDecisionTargetSource(pair)).toBe("support_constrained");
    expect(resolveDecisionOptimalValue(pair)).toBe(14);
  });

  it("resolveDecisionOptimalValue falls back to robust target when support target is unavailable", () => {
    const pair = {
      responseCurve: {
        supportConstrainedTargets: {
          supportConstrainedOptimalValue: null,
          robustOptimalValue: 11,
        },
      },
    } as Parameters<typeof resolveDecisionOptimalValue>[0];

    expect(resolveDecisionTargetSource(pair)).toBe("robust_fallback");
    expect(resolveDecisionOptimalValue(pair)).toBe(11);
  });

  it("resolveDecisionOptimalValue returns null when no supported target exists", () => {
    const pair = {
      aggregateOptimalDailyValue: 20,
      aggregateValuePredictingHighOutcome: 15,
      responseCurve: {
        supportConstrainedTargets: {
          supportConstrainedOptimalValue: null,
          robustOptimalValue: null,
        },
      },
    } as Parameters<typeof resolveDecisionOptimalValue>[0];

    expect(resolveDecisionTargetSource(pair)).toBe("unavailable");
    expect(resolveDecisionOptimalValue(pair)).toBeNull();
  });

  it("resolveDecisionOptimalValue suppresses targets when pair is insufficiency-gated", () => {
    const pair = {
      responseCurve: {
        supportConstrainedTargets: {
          supportConstrainedOptimalValue: 14,
          robustOptimalValue: 12,
        },
      },
      dataSufficiency: {
        status: "insufficient_data",
      },
    } as Parameters<typeof resolveDecisionOptimalValue>[0];

    expect(resolveDecisionTargetSource(pair)).toBe("unavailable");
    expect(resolveDecisionOptimalValue(pair)).toBeNull();
  });

  it("computePairMarginalTradeoffDiagnostics marks near-zero tail gains as no clear marginal gain", () => {
    const pair = {
      dataSufficiency: {
        status: "sufficient",
      },
      predictorBinRows: [
        {
          predictorMedian: 1,
          predictorMean: 1,
          outcomeMean: 10,
        },
        {
          predictorMedian: 2,
          predictorMean: 2,
          outcomeMean: 12,
        },
        {
          predictorMedian: 3,
          predictorMean: 3,
          outcomeMean: 12.02,
        },
        {
          predictorMedian: 4,
          predictorMean: 4,
          outcomeMean: 12.03,
        },
      ],
      responseCurve: {
        diminishingReturns: {
          kneePredictorValue: 2.5,
        },
      },
    } as Parameters<typeof computePairMarginalTradeoffDiagnostics>[0];

    const diagnostics = computePairMarginalTradeoffDiagnostics(pair);
    expect(diagnostics.tailSignal).toBe("near_zero");
    expect(diagnostics.taxpayerReturnBenchmark).toBe("no_clear_marginal_gain");
  });

  it("computePairMarginalTradeoffDiagnostics marks negative tail gains as possible harm", () => {
    const pair = {
      dataSufficiency: {
        status: "sufficient",
      },
      predictorBinRows: [
        {
          predictorMedian: 1,
          predictorMean: 1,
          outcomeMean: 10,
        },
        {
          predictorMedian: 2,
          predictorMean: 2,
          outcomeMean: 12,
        },
        {
          predictorMedian: 3,
          predictorMean: 3,
          outcomeMean: 13,
        },
        {
          predictorMedian: 4,
          predictorMean: 4,
          outcomeMean: 11,
        },
      ],
      responseCurve: {
        diminishingReturns: {
          kneePredictorValue: 2.5,
        },
      },
    } as Parameters<typeof computePairMarginalTradeoffDiagnostics>[0];

    const diagnostics = computePairMarginalTradeoffDiagnostics(pair);
    expect(diagnostics.tailSignal).toBe("negative");
    expect(diagnostics.taxpayerReturnBenchmark).toBe("possible_harm");
  });

  it("computePairMarginalTradeoffDiagnostics marks low-confidence rows as insufficient benchmark", () => {
    const pair = {
      dataSufficiency: {
        status: "sufficient",
      },
      aggregateStatisticalSignificance: 0.6,
      reliability: {
        overallScore: 0.4,
      },
      predictorBinRows: [
        {
          predictorMedian: 1,
          predictorMean: 1,
          outcomeMean: 10,
        },
        {
          predictorMedian: 2,
          predictorMean: 2,
          outcomeMean: 12,
        },
        {
          predictorMedian: 3,
          predictorMean: 3,
          outcomeMean: 13,
        },
        {
          predictorMedian: 4,
          predictorMean: 4,
          outcomeMean: 11,
        },
      ],
      responseCurve: {
        diminishingReturns: {
          kneePredictorValue: 2.5,
        },
      },
    } as Parameters<typeof computePairMarginalTradeoffDiagnostics>[0];

    const diagnostics = computePairMarginalTradeoffDiagnostics(pair);
    expect(diagnostics.tailSignal).toBe("negative");
    expect(diagnostics.taxpayerReturnBenchmark).toBe("insufficient");
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

  it("isReportEligibleOutcome includes core welfare outcomes and direct KPI outcomes", () => {
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
    const educationKpiOutcome: VariableRegistryEntry = {
      ...haleOutcome,
      id: "outcome.wb.primary_completion_rate_pct",
      label: "Primary Completion Rate",
      category: "education",
      unit: "% of relevant age group",
    };
    const securityKpiOutcome: VariableRegistryEntry = {
      ...haleOutcome,
      id: "outcome.wb.battle_related_deaths",
      label: "Battle-Related Deaths",
      category: "safety",
      unit: "deaths (count)",
      welfareDirection: "lower_better",
    };

    expect(DEFAULT_REPORT_OUTCOME_IDS).toContain("outcome.who.healthy_life_expectancy_years");
    expect(DEFAULT_REPORT_OUTCOME_IDS).toContain("outcome.derived.healthy_life_expectancy_growth_yoy_pct");
    expect(DEFAULT_REPORT_OUTCOME_IDS).toContain("outcome.derived.after_tax_median_income_ppp");
    expect(DEFAULT_REPORT_OUTCOME_IDS).toContain("outcome.derived.after_tax_median_income_ppp_growth_yoy_pct");
    expect(DEFAULT_REPORT_OUTCOME_IDS).toContain("outcome.wb.primary_completion_rate_pct");
    expect(DEFAULT_REPORT_OUTCOME_IDS).toContain("outcome.wb.battle_related_deaths");
    expect(isReportEligibleOutcome(haleOutcome)).toBe(true);
    expect(isReportEligibleOutcome(incomeOutcome)).toBe(true);
    expect(isReportEligibleOutcome(haleGrowthOutcome)).toBe(true);
    expect(isReportEligibleOutcome(educationKpiOutcome)).toBe(true);
    expect(isReportEligibleOutcome(securityKpiOutcome)).toBe(true);
    expect(isReportEligibleOutcome(giniOutcome)).toBe(false);
  });
});
