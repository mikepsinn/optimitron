import {
  TaskImpactFrameKey,
  TaskImpactPublicationStatus,
} from "@optimitron/db";
import type { BudgetReportJSON } from "@optimitron/obg";
import type { PolicyRecommendation, PolicyReportJSON } from "@optimitron/opg";
import { describe, expect, it } from "vitest";
import {
  buildObgCategoryTaskBundle,
  buildOpgRecommendationTaskBundle,
} from "./opg-obg-adapters";

describe("OPG/OBG task adapters", () => {
  it("preserves core OPG recommendation semantics in the task and impact bundle", () => {
    const recommendation: PolicyRecommendation = {
      evidenceGrade: "A",
      jurisdictionId: "usa-federal",
      policyId: "one-percent-treaty",
      policyImpactScore: 0.92,
      priorityScore: 0.88,
      rationale: "Signing the treaty unlocks large downstream gains.",
      recommendationType: "enact",
      welfareEffect: {
        healthEffect: 0.12,
        healthEffectCIHigh: 0.2,
        healthEffectCILow: 0.05,
        incomeEffect: 0.03,
        incomeEffectCIHigh: 0.04,
        incomeEffectCILow: 0.01,
      },
    };

    const policyReport: PolicyReportJSON = {
      generatedAt: "2026-04-09T00:00:00.000Z",
      jurisdiction: "United States",
      policies: [
        {
          blockingFactors: ["political"],
          bradfordHillScores: { consistency: 0.8 },
          causalConfidenceScore: 0.77,
          category: "treaty",
          currentStatus: "not adopted",
          description: "Commit 1% of military spending to pragmatic trials.",
          evidenceGrade: "A",
          healthEffect: 0.12,
          incomeEffect: 0.03,
          name: "1% Treaty",
          policyImpactScore: 0.92,
          rationale: "High-confidence gains across health and income.",
          recommendationType: "enact",
          recommendedTarget: "signed",
          type: "treaty",
          welfareScore: 0.5,
        },
      ],
    };

    const bundle = buildOpgRecommendationTaskBundle({
      policy: {
        id: "one-percent-treaty",
        isContinuous: false,
        name: "1% Treaty",
        type: "treaty",
        typicalDurationYears: 20,
        typicalOnsetDelayDays: 30,
      },
      policyReport,
      recommendation,
      reportPolicy: policyReport.policies[0],
    });

    expect(bundle.task.taskKey).toBe("opg:usa-federal:one-percent-treaty");
    expect(bundle.task.title).toContain("ENACT");
    expect(bundle.task.contextJson.recommendationType).toBe("enact");
    expect(bundle.impactEstimate.publicationStatus).toBe(TaskImpactPublicationStatus.REVIEWED);
    expect(bundle.impactEstimate.frames[0]?.frameKey).toBe(TaskImpactFrameKey.TWENTY_YEAR);
    expect(
      bundle.impactEstimate.frames[0]?.metrics.find(
        (metric) => metric.metricKey === "opg_policy_impact_score",
      )?.baseValue,
    ).toBe(0.92);
    expect(
      bundle.impactEstimate.frames[0]?.metrics.find(
        (metric) => metric.metricKey === "opg_evidence_grade",
      )?.valueJson,
    ).toBe("A");
    expect(bundle.sourceArtifacts).toHaveLength(2);
  });

  it("preserves core OBG category semantics in the task and impact bundle", () => {
    const budgetReport: BudgetReportJSON = {
      categories: [
        {
          currentSpending: 100_000_000_000,
          currentSpendingRealPerCapita: 300,
          diminishingReturns: {
            elasticity: 0.4,
            marginalReturn: 0.7,
            modelType: "log-linear",
            n: 40,
            outcomeName: "healthy life expectancy",
            r2: 0.61,
          },
          evidenceSource: "OBG generated analysis",
          gap: 25_000_000_000,
          gapPercent: 25,
          id: "public-health",
          name: "Public Health",
          optimalSpendingNominal: 125_000_000_000,
          optimalSpendingPerCapita: 375,
          outcomeMetrics: [],
          recommendation: "increase",
        },
      ],
      generatedAt: "2026-04-09T00:00:00.000Z",
      jurisdiction: "United States",
      topRecommendations: ["Increase Public Health"],
      totalSpendingNominal: 1_000_000_000_000,
    };

    const bundle = buildObgCategoryTaskBundle({
      budgetReport,
      category: budgetReport.categories[0]!,
    });

    expect(bundle.task.taskKey).toBe("obg:united-states:public-health");
    expect(bundle.task.title).toBe("INCREASE Public Health budget");
    expect(bundle.task.contextJson.recommendation).toBe("increase");
    expect(
      bundle.impactEstimate.frames[0]?.metrics.find(
        (metric) => metric.metricKey === "obg_gap_usd",
      )?.baseValue,
    ).toBe(25_000_000_000);
    expect(
      bundle.impactEstimate.frames[0]?.metrics.find(
        (metric) => metric.metricKey === "obg_recommendation",
      )?.valueJson,
    ).toBe("increase");
    expect(bundle.sourceArtifacts.map((artifact) => artifact.sourceKey)).toEqual([
      "obg:category:united-states:public-health",
      "obg:report:united-states:2026-04-09t00-00-00-000z",
    ]);
  });
});
