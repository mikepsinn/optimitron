import {
  SourceArtifactType,
  SourceSystem,
  TaskCategory,
  TaskClaimPolicy,
  TaskImpactEstimateKind,
  TaskImpactFrameKey,
  TaskImpactPublicationStatus,
  TaskStatus,
} from "@optimitron/db";
import { describe, expect, it } from "vitest";
import {
  buildTreatySignerSyncHash,
  canSkipTreatySignerSync,
} from "./treaty-sync";
import type { ImportedTaskBundle } from "./opg-obg-adapters";

function buildBundle(overrides: Partial<ImportedTaskBundle> = {}): ImportedTaskBundle {
  return {
    impactEstimate: {
      assumptionsJson: {
        countryCode: "US",
        value: 1,
      },
      calculationVersion: "one-percent-treaty-compiler-v1",
      counterfactualKey: "current-policy-baseline",
      estimateKind: TaskImpactEstimateKind.FORECAST,
      frames: [
        {
          adoptionRampYears: 4,
          benefitDurationYears: 20,
          customFrameLabel: null,
          delayDalysLostPerDayBase: 1,
          delayDalysLostPerDayHigh: 2,
          delayDalysLostPerDayLow: 0.5,
          delayEconomicValueUsdLostPerDayBase: 10,
          delayEconomicValueUsdLostPerDayHigh: 12,
          delayEconomicValueUsdLostPerDayLow: 8,
          estimatedCashCostUsdBase: 1,
          estimatedCashCostUsdHigh: null,
          estimatedCashCostUsdLow: null,
          estimatedEffortHoursBase: 0.1,
          estimatedEffortHoursHigh: null,
          estimatedEffortHoursLow: null,
          evaluationHorizonYears: 20,
          expectedDalysAvertedBase: 100,
          expectedDalysAvertedHigh: 110,
          expectedDalysAvertedLow: 90,
          expectedEconomicValueUsdBase: 1000,
          expectedEconomicValueUsdHigh: 1100,
          expectedEconomicValueUsdLow: 900,
          frameKey: TaskImpactFrameKey.TWENTY_YEAR,
          frameSlug: "twenty-year",
          medianHealthyLifeYearsEffectBase: 1,
          medianHealthyLifeYearsEffectHigh: null,
          medianHealthyLifeYearsEffectLow: null,
          medianIncomeGrowthEffectPpPerYearBase: 2,
          medianIncomeGrowthEffectPpPerYearHigh: null,
          medianIncomeGrowthEffectPpPerYearLow: null,
          metrics: [
            {
              baseValue: 2,
              displayGroup: "b",
              highValue: null,
              lowValue: null,
              metadataJson: { z: 1, a: 2 },
              metricKey: "z-metric",
              summaryStatsJson: null,
              unit: "USD",
              valueJson: null,
            },
            {
              baseValue: 1,
              displayGroup: "a",
              highValue: null,
              lowValue: null,
              metadataJson: { b: 1, a: 2 },
              metricKey: "a-metric",
              summaryStatsJson: null,
              unit: "USD",
              valueJson: null,
            },
          ],
          successProbabilityBase: 0.1,
          successProbabilityHigh: 0.2,
          successProbabilityLow: 0.01,
          summaryStatsJson: null,
          timeToImpactStartDays: 365,
        },
      ],
      methodologyKey: "one-percent-treaty-impact-compiler",
      parameterSetHash: "sha256:test",
      publicationStatus: TaskImpactPublicationStatus.REVIEWED,
      sourceSystem: SourceSystem.CURATED,
    },
    sourceArtifacts: [
      {
        artifactType: SourceArtifactType.EXTERNAL_SOURCE,
        contentHash: null,
        externalKey: null,
        payloadJson: { z: 1, a: 2 },
        sourceKey: "artifact:z",
        sourceRef: "z",
        sourceSystem: SourceSystem.EXTERNAL,
        sourceUrl: "https://example.com/z",
        title: "Z",
        versionKey: null,
      },
      {
        artifactType: SourceArtifactType.EXTERNAL_SOURCE,
        contentHash: null,
        externalKey: null,
        payloadJson: { b: 1, a: 2 },
        sourceKey: "artifact:a",
        sourceRef: "a",
        sourceSystem: SourceSystem.EXTERNAL,
        sourceUrl: "https://example.com/a",
        title: "A",
        versionKey: null,
      },
    ],
    task: {
      assigneeAffiliationSnapshot: "United States Government",
      assigneeOrganizationName: null,
      assigneeOrganizationSourceRef: null,
      assigneeOrganizationType: null,
      category: TaskCategory.GOVERNANCE,
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      contactLabel: "White House",
      contactTemplate: "Please sign.",
      contactUrl: "https://example.com/contact",
      contextJson: { z: 1, a: 2 },
      description: "Sign the treaty.",
      dueAt: null,
      estimatedEffortHours: 0.1,
      impactStatement: "Redirect military spending.",
      interestTags: ["z-tag", "a-tag"],
      roleTitle: "President",
      skillTags: ["z-skill", "a-skill"],
      status: TaskStatus.ACTIVE,
      taskKey: "program:one-percent-treaty:signer:us",
      title: "Sign the 1% Treaty",
    },
    ...overrides,
  };
}

describe("treaty-sync", () => {
  it("hashes the signer payload stably regardless of ordering noise", () => {
    const bundleA = buildBundle();
    const bundleB = buildBundle({
      impactEstimate: {
        ...buildBundle().impactEstimate,
        frames: [
          {
            ...buildBundle().impactEstimate.frames[0]!,
            metrics: [...buildBundle().impactEstimate.frames[0]!.metrics].reverse(),
          },
        ],
      },
      sourceArtifacts: [...buildBundle().sourceArtifacts].reverse(),
      task: {
        ...buildBundle().task,
        interestTags: [...buildBundle().task.interestTags].reverse(),
        skillTags: [...buildBundle().task.skillTags].reverse(),
      },
    });

    expect(
      buildTreatySignerSyncHash({
        assigneeOrganizationId: "org-1",
        assigneePersonId: "person-1",
        bundle: bundleA,
        parentTaskId: "parent-1",
        sortOrder: 1,
      }),
    ).toBe(
      buildTreatySignerSyncHash({
        assigneeOrganizationId: "org-1",
        assigneePersonId: "person-1",
        bundle: bundleB,
        parentTaskId: "parent-1",
        sortOrder: 1,
      }),
    );
  });

  it("skips signer sync only when the stored sync state still matches", () => {
    const syncHash = buildTreatySignerSyncHash({
      assigneeOrganizationId: "org-1",
      assigneePersonId: "person-1",
      bundle: buildBundle(),
      parentTaskId: "parent-1",
      sortOrder: 3,
    });

    expect(
      canSkipTreatySignerSync({
        assigneeOrganizationId: "org-1",
        assigneePersonId: "person-1",
        existingTask: {
          assigneeOrganizationId: "org-1",
          assigneePersonId: "person-1",
          contextJson: { treatySignerSyncHash: syncHash },
          currentImpactEstimateSet: {
            parameterSetHash: "sha256:test",
          },
          deletedAt: null,
          parentTaskId: "parent-1",
          sortOrder: 3,
        },
        parameterSetHash: "sha256:test",
        parentTaskId: "parent-1",
        sortOrder: 3,
        syncHash,
      }),
    ).toBe(true);

    expect(
      canSkipTreatySignerSync({
        assigneeOrganizationId: "org-1",
        assigneePersonId: "person-1",
        existingTask: {
          assigneeOrganizationId: "org-1",
          assigneePersonId: "person-1",
          contextJson: { treatySignerSyncHash: syncHash },
          currentImpactEstimateSet: {
            parameterSetHash: "sha256:test",
          },
          deletedAt: null,
          parentTaskId: "parent-1",
          sortOrder: 4,
        },
        parameterSetHash: "sha256:test",
        parentTaskId: "parent-1",
        sortOrder: 3,
        syncHash,
      }),
    ).toBe(false);
  });
});
