import { TaskClaimPolicy, TaskImpactFrameKey } from "@optimitron/db";
import { describe, expect, it } from "vitest";
import { PolicyModelRunSchemaVersion } from "./policy-model-run";
import { buildImportedTaskBundleFromPolicyModelRun } from "./policy-model-run-to-imported-task-bundle";

describe("buildImportedTaskBundleFromPolicyModelRun", () => {
  it("maps policy-model-run.v1 into the generic task bundle importer shape", () => {
    const draft = buildImportedTaskBundleFromPolicyModelRun({
      artifacts: [
        {
          artifactKey: "manual:treaty-impact",
          artifactType: "MANUAL_SECTION",
          sourceRef: "1-pct-treaty-impact",
          sourceSystem: "MANUAL",
          sourceUrl:
            "https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html",
          title: "1% treaty impact",
        },
      ],
      calculationVersion: "treaty-compiler-v1",
      calculations: [
        {
          displayName: "Treaty expected value",
          formula: "P_SUCCESS * GROSS_VALUE",
          inputs: ["P_SUCCESS", "GROSS_VALUE"],
          key: "calc:treaty-expected-value",
          outputKey: "EXPECTED_VALUE",
          sourceArtifactKeys: ["manual:treaty-impact"],
          unit: "USD",
        },
      ],
      defaultFrameKey: TaskImpactFrameKey.TWENTY_YEAR,
      evidenceClaims: [],
      executionHints: {
        parentTaskDescription: "Secure treaty signature in the United States.",
        parentTaskTitle: "President of the United States signs the 1% Treaty",
        supporterLevers: ["coalition", "media"],
        targetActors: [
          {
            actorKey: "person:president-of-the-united-states",
            claimPolicyHint: TaskClaimPolicy.ASSIGNED_ONLY,
            contactLabel: "White House contact form",
            contactTemplate: "Please complete {{taskTitle}}.",
            contactUrl: "https://www.whitehouse.gov/contact/",
            currentAffiliation: "United States Government",
            displayName: "President of the United States",
            organizationKey: "organization:united-states-government",
            organizationName: "United States Government",
            organizationType: "GOVERNMENT",
            roleTitle: "President",
            role: "decision_maker",
          },
        ],
      },
      frames: [
        {
          adoptionRampYears: 4,
          benefitDurationYears: 20,
          canonical: {
            delayDalysLostPerDay: { base: 10, high: 20, low: 5 },
            delayEconomicValueUsdLostPerDay: {
              base: 1000,
              high: 1200,
              low: 800,
            },
            estimatedCashCostUsd: {
              base: 1_000_000_000,
              high: null,
              low: null,
            },
            estimatedEffortHours: { base: 30 / 3600, high: null, low: null },
            expectedDalysAverted: {
              base: 5_000_000_000,
              high: 6_000_000_000,
              low: 1_000_000_000,
            },
            expectedEconomicValueUsd: {
              base: 800_000_000_000_000,
              high: null,
              low: null,
            },
            medianHealthyLifeYearsEffect: { base: 21.7, high: null, low: null },
            medianIncomeGrowthEffectPpPerYear: {
              base: 8.4,
              high: null,
              low: null,
            },
            successProbability: { base: 0.01, high: 0.1, low: 0.001 },
          },
          evaluationHorizonYears: 20,
          frameKey: TaskImpactFrameKey.TWENTY_YEAR,
          frameSlug: "twenty-year",
          metrics: [
            {
              displayGroup: "operations",
              displayName: "Trial capacity multiplier",
              estimate: { base: 12.3, high: null, low: null },
              key: "trial_capacity_multiplier",
              sourceArtifactKeys: ["manual:treaty-impact"],
              unit: "x",
              valueKind: "numeric",
            },
          ],
          timeToImpactStartDays: 365,
        },
      ],
      generatedAt: "2026-04-09T23:00:00.000Z",
      generator: {
        kind: "manual_python",
        model: "dih_models/parameters.py",
      },
      methodologyKey: "one-percent-treaty-impact-compiler",
      modelKey: "policy:usa-federal:one-percent-treaty",
      parameterSetHash: "sha256:test",
      parameters: [
        {
          description: "Probability that the campaign causes adoption.",
          displayName: "Success probability",
          inputs: [],
          key: "P_SUCCESS",
          keywords: [],
          sourceArtifactKeys: ["manual:treaty-impact"],
          sourceType: "curated",
          unit: "probability",
          value: 0.01,
        },
      ],
      policy: {
        blockingFactors: ["political"],
        counterfactualKey: "current-policy-baseline",
        jurisdictionId: "usa-federal",
        jurisdictionName: "United States",
        policyId: "one-percent-treaty",
        policyName: "1% Treaty",
        policyType: "treaty",
        recommendedTarget: "signs the treaty",
        summary: "Redirect 1% of military spending to pragmatic trials.",
        tags: ["treaty", "clinical-trials"],
      },
      schemaVersion: PolicyModelRunSchemaVersion,
      summary: "Compiled treaty impact model.",
      title: "1% Treaty Impact Model",
    });

    expect(draft.assigneeHint?.displayName).toBe(
      "President of the United States",
    );
    expect(draft.assigneeHint?.contactUrl).toBe(
      "https://www.whitehouse.gov/contact/",
    );
    expect(draft.bundle.task.claimPolicy).toBe(TaskClaimPolicy.ASSIGNED_ONLY);
    expect(draft.bundle.task.title).toBe(
      "President of the United States signs the 1% Treaty",
    );
    expect(draft.bundle.task.contactLabel).toBe("White House contact form");
    expect(draft.bundle.task.contextJson).toMatchObject({
      frameKey: TaskImpactFrameKey.TWENTY_YEAR,
      modelKey: "policy:usa-federal:one-percent-treaty",
      parameterSetHash: "sha256:test",
    });
    expect(draft.bundle.task.contextJson).not.toHaveProperty("generatedAt");
    expect(draft.bundle.impactEstimate.calculationVersion).toBe(
      "treaty-compiler-v1",
    );
    expect(draft.bundle.impactEstimate.formulaText).toBe(
      "EXPECTED_VALUE = P_SUCCESS * GROSS_VALUE",
    );
    expect(draft.bundle.impactEstimate.parameterKeys).toEqual(["P_SUCCESS"]);
    expect(draft.bundle.impactEstimate.frames[0]?.frameSlug).toBe(
      "twenty-year",
    );
    expect(draft.bundle.impactEstimate.frames[0]?.metrics[0]?.metricKey).toBe(
      "trial_capacity_multiplier",
    );
    expect(draft.bundle.sourceArtifacts[0]?.artifactType).toBe(
      "MANUAL_SECTION",
    );
  });
});
