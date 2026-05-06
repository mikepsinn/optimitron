import {
  SourceArtifactType,
  SourceSystem,
  TaskCategory,
  TaskClaimPolicy,
  TaskDifficulty,
  TaskImpactEstimateKind,
  TaskImpactFrameKey,
  TaskImpactPublicationStatus,
  TaskStatus,
} from "@optimitron/db";
import { SIPRI_WORLD_MILITARY_SPENDING_USD_2024 } from "@optimitron/data/parameters";
import { describe, expect, it } from "vitest";
import type { PolicyModelRunImportDraft } from "./policy-model-run-to-imported-task-bundle";
import {
  buildTreatySignerImportDraft,
  TREATY_DUE_AT,
  type TreatySignerSlot,
} from "./treaty-signer-network";

const sampleUsSignerSlot: TreatySignerSlot = {
  contactEmail: null,
  contactLabel: "White House contact form",
  contactUrl: "https://www.whitehouse.gov/contact/",
  countryCode: "US",
  countryIso3: "USA",
  countryName: "United States",
  decisionMakerLabel: "President of the United States",
  governmentBudgetUsd: 7_000_000_000_000,
  governmentName: "United States Government",
  governmentWebsite: "https://www.whitehouse.gov/",
  leaderImageUrl: null,
  leaderName: "Donald Trump",
  leaderSourceRef: "wikidata:Q22686",
  militaryBudgetUsd: 997_000_000_000,
  officialSourceUrl: "https://www.whitehouse.gov/administration/",
  roleTitle: "President",
  sortOrder: 0,
};

function buildBaseDraft(): PolicyModelRunImportDraft {
  return {
    assigneeHint: {
      actorKey: "person:president-of-the-united-states",
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      contactLabel: "White House contact form",
      contactTemplate: "Please complete {{taskTitle}}.",
      contactUrl: "https://www.whitehouse.gov/contact/",
      currentAffiliation: "United States Government",
      displayName: "President of the United States",
      isPublicFigure: true,
      organizationKey: "organization:united-states-government",
      organizationName: "United States Government",
      organizationType: "GOVERNMENT",
      role: "decision_maker",
      roleTitle: "President",
    },
    bundle: {
      impactEstimate: {
        assumptionsJson: {},
        calculationVersion: "one-percent-treaty-compiler-v1",
        counterfactualKey: "current-policy-baseline",
        estimateKind: TaskImpactEstimateKind.FORECAST,
        frames: [
          {
            adoptionRampYears: 4,
            annualDiscountRate: 0.03,
            benefitDurationYears: 20,
            customFrameLabel: null,
            delayDalysLostPerDayBase: 100,
            delayDalysLostPerDayHigh: 150,
            delayDalysLostPerDayLow: 50,
            delayEconomicValueUsdLostPerDayBase: 10_000_000,
            delayEconomicValueUsdLostPerDayHigh: 12_000_000,
            delayEconomicValueUsdLostPerDayLow: 8_000_000,
            estimatedCashCostUsdBase: 1_000_000_000,
            estimatedCashCostUsdHigh: null,
            estimatedCashCostUsdLow: null,
            estimatedEffortHoursBase: 30 / 3600,
            estimatedEffortHoursHigh: null,
            estimatedEffortHoursLow: null,
            evaluationHorizonYears: 20,
            expectedDalysAvertedBase: 5_000_000_000,
            expectedDalysAvertedHigh: 6_000_000_000,
            expectedDalysAvertedLow: 1_000_000_000,
            expectedEconomicValueUsdBase: 800_000_000_000_000,
            expectedEconomicValueUsdHigh: null,
            expectedEconomicValueUsdLow: null,
            frameKey: TaskImpactFrameKey.TWENTY_YEAR,
            frameSlug: "twenty-year",
            medianHealthyLifeYearsEffectBase: 21.7,
            medianHealthyLifeYearsEffectHigh: null,
            medianHealthyLifeYearsEffectLow: null,
            medianIncomeGrowthEffectPpPerYearBase: 8.4,
            medianIncomeGrowthEffectPpPerYearHigh: null,
            medianIncomeGrowthEffectPpPerYearLow: null,
            metrics: [
              {
                baseValue: 100_000_000,
                displayGroup: "health",
                highValue: null,
                lowValue: null,
                metadataJson: null,
                metricKey: "contribution_lives_saved_per_pct_point",
                summaryStatsJson: null,
                unit: "lives",
                valueJson: null,
              },
              {
                baseValue: 1_000_000_000,
                displayGroup: "operations",
                highValue: null,
                lowValue: null,
                metadataJson: null,
                metricKey: "expected_value_per_hour_usd",
                summaryStatsJson: null,
                unit: "USD/hour",
                valueJson: null,
              },
              {
                baseValue: 12.3,
                displayGroup: "operations",
                highValue: null,
                lowValue: null,
                metadataJson: null,
                metricKey: "trial_capacity_multiplier",
                summaryStatsJson: null,
                unit: "x",
                valueJson: null,
              },
            ],
            successProbabilityBase: 0.01,
            successProbabilityHigh: null,
            successProbabilityLow: null,
            summaryStatsJson: null,
            timeToImpactStartDays: 365,
          },
        ],
        methodologyKey: "one-percent-treaty-impact-compiler",
        parameterSetHash: "sha256:test",
        publicationStatus: TaskImpactPublicationStatus.REVIEWED,
        sourceSystem: SourceSystem.COMBINED,
      },
      sourceArtifacts: [
        {
          artifactType: SourceArtifactType.MANUAL_SECTION,
          contentHash: null,
          externalKey: null,
          payloadJson: {},
          sourceKey: "manual:treaty-impact",
          sourceRef: "manual:treaty-impact",
          sourceSystem: SourceSystem.MANUAL,
          sourceUrl: "https://manual.example/treaty",
          title: "Treaty impact manual",
          versionKey: null,
        },
      ],
      task: {
        assigneeAffiliationSnapshot: "United States Government",
        assigneeOrganizationName: "United States Government",
        assigneeOrganizationSourceRef: "organization:united-states-government",
        assigneeOrganizationType: "GOVERNMENT",
        category: TaskCategory.GOVERNANCE,
        claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
        contactLabel: "White House contact form",
        contactTemplate: "Please complete {{taskTitle}}.",
        contactUrl: "https://www.whitehouse.gov/contact/",
        contextJson: {},
        description: "Base treaty signer task.",
        difficulty: TaskDifficulty.EXPERT,
        dueAt: null,
        estimatedEffortHours: 30 / 3600,
        impactStatement: "Base impact statement.",
        interestTags: ["treaty"],
        roleTitle: "President",
        skillTags: ["diplomacy"],
        status: TaskStatus.ACTIVE,
        taskKey: "policy:usa-federal:one-percent-treaty",
        title: "President of the United States signs the 1% Treaty",
      },
    },
  };
}

describe("treaty signer network", () => {
  it("scales a signer draft by military budget share and injects slot metadata", () => {
    const slot = sampleUsSignerSlot;
    const result = buildTreatySignerImportDraft({
      baseDraft: buildBaseDraft(),
      slot,
    });
    const factor =
      slot.militaryBudgetUsd / SIPRI_WORLD_MILITARY_SPENDING_USD_2024;
    const frame = result.bundle.impactEstimate.frames[0];
    const annualRedirectMetric = frame?.metrics.find(
      (metric) => metric.metricKey === "annual_redirect_amount_usd",
    );
    const unchangedMetric = frame?.metrics.find(
      (metric) => metric.metricKey === "trial_capacity_multiplier",
    );

    expect(result.bundle.task.taskKey).toBe(
      "program:one-percent-treaty:signer:us",
    );
    expect(result.bundle.task.title).toBe("Sign the 1% Treaty");
    expect(result.bundle.task.dueAt?.toISOString()).toBe(
      TREATY_DUE_AT.toISOString(),
    );
    expect(result.bundle.task.description).toContain(
      "United States Government",
    );

    // Parent signer task's actionLink: assignee (head of state) clicks
    // through to sign the treaty. No third-person Wishonia template here —
    // that template moves to the citizen-created reminder subtask.
    expect(result.bundle.task.contactUrl).toBe(
      "https://warondisease.org/treaty",
    );
    expect(result.bundle.task.contactLabel).toBe("Sign the treaty");
    expect(result.bundle.task.contactTemplate).toBeNull();
    expect(frame?.expectedDalysAvertedBase).toBeCloseTo(
      5_000_000_000 * factor,
      3,
    );
    expect(frame?.delayEconomicValueUsdLostPerDayBase).toBeCloseTo(
      10_000_000 * factor,
      3,
    );
    expect(
      frame?.metrics.find(
        (metric) =>
          metric.metricKey === "contribution_lives_saved_per_pct_point",
      )?.baseValue,
    ).toBeCloseTo(100_000_000 * factor, 3);
    expect(annualRedirectMetric?.baseValue).toBeCloseTo(
      slot.militaryBudgetUsd * 0.01,
      3,
    );
    expect(unchangedMetric?.baseValue).toBe(12.3);
    expect(
      result.bundle.sourceArtifacts.some((artifact) =>
        artifact.sourceKey.startsWith(
          "external:sipri:military-expenditure-2024:",
        ),
      ),
    ).toBe(true);
  });
});
