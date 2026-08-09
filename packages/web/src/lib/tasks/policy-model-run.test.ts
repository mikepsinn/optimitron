import { TaskClaimPolicy, TaskImpactFrameKey } from "@optimitron/db";
import { describe, expect, it } from "vitest";
import {
  PolicyModelRunSchema,
  PolicyModelRunSchemaVersion,
  getPolicyModelFrame,
  getPrimaryPolicyModelArtifacts,
} from "./policy-model-run";
import { ParameterExportSchema } from "./parameter-export-to-policy-model";

describe("PolicyModelRunSchema", () => {
  const treatyRun = {
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
      {
        artifactKey: "calc:treaty-run-2026-04-09",
        artifactType: "CALCULATION_RUN",
        sourceSystem: "CURATED",
        title: "Compiled treaty model run",
        versionKey: "2026-04-09",
      },
    ],
    calculationVersion: "treaty-compiler-v1",
    calculations: [
      {
        displayName: "Contribution DALYs per percentage point",
        formula: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS * 0.01",
        inputs: ["DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS"],
        key: "calc:contribution_dalys_per_pct_point",
        outputKey: "CONTRIBUTION_DALYS_PER_PCT_POINT",
        sourceArtifactKeys: ["calc:treaty-run-2026-04-09"],
        unit: "DALYs",
      },
    ],
    defaultFrameKey: TaskImpactFrameKey.TWENTY_YEAR,
    evidenceClaims: [
      {
        claimKey: "claim:treaty-expands-trial-capacity",
        sourceArtifactKeys: ["manual:treaty-impact"],
        supportsKeys: [
          "trial_capacity_multiplier",
          "canonical.expectedDalysAverted",
        ],
        summary:
          "Redirecting 1% of military spending materially expands pragmatic trial capacity.",
      },
    ],
    executionHints: {
      parentTaskDescription:
        "Secure adoption of the 1% treaty in the United States.",
      parentTaskTitle: "United States signs the 1% treaty",
      supporterLevers: ["coalition", "media", "legislation", "public pressure"],
      targetActors: [
        {
          actorKey: "person:president-us",
          claimPolicyHint: TaskClaimPolicy.ASSIGNED_ONLY,
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
        adoptionRampYears: 1,
        benefitDurationYears: 20,
        canonical: {
          delayDalysLostPerDay: { base: 100_000, high: 150_000, low: 50_000 },
          delayEconomicValueUsdLostPerDay: {
            base: 15_000_000_000,
            high: 20_000_000_000,
            low: 10_000_000_000,
          },
          estimatedCashCostUsd: {
            base: 500_000_000,
            high: 750_000_000,
            low: 250_000_000,
          },
          estimatedEffortHours: { base: 0.0083, high: 0.02, low: 0.001 },
          expectedDalysAverted: {
            base: 7_900_000_000,
            high: 10_000_000_000,
            low: 5_000_000_000,
          },
          expectedEconomicValueUsd: {
            base: 1_200_000_000_000_000,
            high: 1_500_000_000_000_000,
            low: 900_000_000_000_000,
          },
          medianHealthyLifeYearsEffect: { base: 0.9, high: 1.2, low: 0.5 },
          medianIncomeGrowthEffectPpPerYear: { base: 0.3, high: 0.5, low: 0.1 },
          successProbability: { base: 0.25, high: 0.4, low: 0.1 },
        },
        evaluationHorizonYears: 20,
        frameKey: TaskImpactFrameKey.TWENTY_YEAR,
        frameSlug: "twenty-year",
        metrics: [
          {
            displayGroup: "operations",
            displayName: "Trial capacity multiplier",
            estimate: { base: 566, high: 650, low: 400 },
            key: "trial_capacity_multiplier",
            sourceArtifactKeys: ["manual:treaty-impact"],
            unit: "multiplier",
            valueKind: "numeric",
          },
          {
            displayGroup: "opg",
            displayName: "Recommendation type",
            key: "opg_recommendation_type",
            sourceArtifactKeys: ["calc:treaty-run-2026-04-09"],
            unit: "recommendation",
            valueJson: "enact",
            valueKind: "categorical",
          },
        ],
        timeToImpactStartDays: 30,
      },
    ],
    generatedAt: "2026-04-09T21:00:00.000Z",
    generator: {
      kind: "hybrid",
      model: "gemini + deterministic policy compiler",
    },
    methodologyKey: "treaty-impact-compiler",
    modelKey: "policy:usa-federal:one-percent-treaty",
    parameterSetHash: "sha256:abc123",
    parameters: [
      {
        chapterUrl:
          "https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html",
        description: "Global military spending in 2024.",
        displayName: "Global Military Spending in 2024",
        key: "GLOBAL_MILITARY_SPENDING_ANNUAL_2024",
        sourceArtifactKeys: ["manual:treaty-impact"],
        sourceType: "external",
        unit: "USD",
        value: 2_720_000_000_000,
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
      recommendedTarget: "signed",
      summary:
        "Redirect 1% of military spending to pragmatic trials and disease eradication.",
      tags: ["treaty", "clinical-trials", "war-on-disease"],
    },
    schemaVersion: PolicyModelRunSchemaVersion,
    summary:
      "Compiled multi-horizon treaty impact model with evidence, parameters, and execution hints.",
    title: "1% Treaty Impact Model",
  };

  it("accepts a compiled treaty-style policy model run", () => {
    const parsed = PolicyModelRunSchema.parse(treatyRun);

    expect(parsed.schemaVersion).toBe(PolicyModelRunSchemaVersion);
    expect(parsed.executionHints?.targetActors[0]?.claimPolicyHint).toBe(
      TaskClaimPolicy.ASSIGNED_ONLY,
    );
    expect(parsed.frames[0]?.metrics[0]?.key).toBe("trial_capacity_multiplier");
  });

  it("selects the requested frame and extracts referenced artifacts", () => {
    const parsed = PolicyModelRunSchema.parse(treatyRun);

    expect(
      getPolicyModelFrame(parsed, TaskImpactFrameKey.TWENTY_YEAR)?.frameSlug,
    ).toBe("twenty-year");
    expect(
      getPrimaryPolicyModelArtifacts(parsed).map(
        (artifact) => artifact.artifactKey,
      ),
    ).toEqual(["manual:treaty-impact", "calc:treaty-run-2026-04-09"]);
  });

  it("preserves unrecognized manual export metadata", () => {
    const parsed = ParameterExportSchema.parse({
      citations: {
        SOURCE: {
          id: "SOURCE",
          customCitationField: "retained",
        },
      },
      parameters: {
        INPUT: {
          customParameterField: { retained: true },
          value: 1,
        },
      },
      sourceFile: "dih_models/parameters.py",
      topLevelMetadata: "retained",
    });

    expect(parsed.parameters.INPUT?.customParameterField).toEqual({
      retained: true,
    });
    expect(parsed.citations.SOURCE?.customCitationField).toBe("retained");
    expect(parsed.topLevelMetadata).toBe("retained");
  });
});
