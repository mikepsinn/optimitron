import { TaskClaimPolicy, TaskImpactFrameKey } from "@optimitron/db";
import { describe, expect, it } from "vitest";
import {
  ParameterExportSchema,
  buildPolicyModelRunFromParameterExport,
} from "./parameter-export-to-policy-model";

describe("buildPolicyModelRunFromParameterExport", () => {
  it("compiles parameter exports into policy-model-run.v1", () => {
    const rawExport = ParameterExportSchema.parse({
      citations: {
        "sipri-global-military-spending": {
          id: "sipri-global-military-spending",
          title: "SIPRI military expenditure database",
          url: "https://example.com/sipri",
        },
      },
      sourceFile: "dih_models/parameters.py",
      parameters: {
        GLOBAL_MILITARY_SPENDING_ANNUAL_2024: {
          value: 2_720_000_000_000,
          formatted: "$2.72T",
          unit: "USD",
          description: "Global military spending in 2024.",
          displayName: "Global Military Spending in 2024",
          sourceType: "external",
          sourceRef: "sipri-global-military-spending",
          sourceUrl: "https://example.com/sipri",
          chapterUrl:
            "https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html",
        },
        DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS: {
          value: 7_940_000_000,
          formatted: "7.94 billion DALYs",
          unit: "DALYs",
          description: "DALYs averted by eliminating both bottlenecks.",
          displayName: "DALYs from timeline shift",
          sourceType: "calculated",
          formula: "TRIAL_CAPACITY_DALYS + EFFICACY_LAG_DALYS",
          chapterUrl:
            "https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html",
        },
        DFDA_TRIAL_CAPACITY_MULTIPLIER: {
          value: 566,
          formatted: "566x",
          unit: "multiplier",
          description: "Trial capacity multiplier after redirect.",
          displayName: "Trial Capacity Multiplier",
          sourceType: "calculated",
          chapterUrl:
            "https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html",
        },
        TREATY_IMPLEMENTATION_PROBABILITY: {
          value: 0.25,
          formatted: "25%",
          unit: "probability",
          description: "Implementation probability.",
          displayName: "Implementation Probability",
          sourceType: "definition",
          confidenceInterval: [0.1, 0.4],
          chapterUrl:
            "https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html",
        },
      },
    });

    const run = buildPolicyModelRunFromParameterExport(rawExport, {
      blockingFactors: ["political"],
      counterfactualKey: "current-policy-baseline",
      defaultFrameKey: TaskImpactFrameKey.TWENTY_YEAR,
      evidenceClaims: [
        {
          claimKey: "claim:trial-capacity-expands",
          sourceArtifactKeys: [
            "manual-section:https://manual.warondisease.org/knowledge/economics/1-pct-treaty-impact.html",
          ],
          supportsKeys: [],
          summary: "The treaty meaningfully expands pragmatic trial capacity.",
        },
      ],
      executionHints: {
        parentTaskDescription: "Secure adoption of the 1% treaty in the United States.",
        parentTaskTitle: "United States signs the 1% treaty",
        supporterLevers: ["coalition", "media"],
        targetActors: [
          {
            actorKey: "person:president-us",
            claimPolicyHint: TaskClaimPolicy.ASSIGNED_ONLY,
            displayName: "President of the United States",
            role: "decision_maker",
          },
        ],
      },
      frames: [
        {
          adoptionRampYears: 1,
          annualDiscountRate: 0.03,
          benefitDurationYears: 20,
          canonicalBindings: {
            expectedDalysAverted: {
              parameterKey: "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS",
            },
            successProbability: {
              parameterKey: "TREATY_IMPLEMENTATION_PROBABILITY",
            },
          },
          evaluationHorizonYears: 20,
          frameKey: TaskImpactFrameKey.TWENTY_YEAR,
          frameSlug: "twenty-year",
          metricBindings: [
            {
              displayGroup: "operations",
              displayName: "Trial capacity multiplier",
              key: "trial_capacity_multiplier",
              parameterKey: "DFDA_TRIAL_CAPACITY_MULTIPLIER",
              valueKind: "numeric",
            },
          ],
          timeToImpactStartDays: 30,
        },
      ],
      generatedAt: "2026-04-09T22:00:00.000Z",
      generator: {
        kind: "manual_python",
        model: "dih_models/parameters.py",
      },
      calculationVersion: "dih-parameter-export-v1",
      methodologyKey: "dih-parameter-export",
      modelKey: "policy:usa-federal:one-percent-treaty",
      parameterSetHash: "sha256:test",
      policy: {
        jurisdictionId: "usa-federal",
        jurisdictionName: "United States",
        policyId: "one-percent-treaty",
        policyName: "1% Treaty",
        policyType: "treaty",
        recommendedTarget: "signed",
        summary: "Redirect 1% of military spending to pragmatic trials.",
        tags: ["treaty", "clinical-trials"],
      },
      summary: "Treaty impact compiled from parameter export.",
      title: "1% Treaty Impact Model",
    });

    expect(run.parameters).toHaveLength(4);
    expect(run.calculationVersion).toBe("dih-parameter-export-v1");
    expect(run.calculations.map((calc) => calc.outputKey)).toContain(
      "DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS",
    );
    expect(run.frames[0]?.canonical.expectedDalysAverted.base).toBe(7_940_000_000);
    expect(run.frames[0]?.canonical.successProbability.low).toBe(0.1);
    expect(run.frames[0]?.metrics[0]?.key).toBe("trial_capacity_multiplier");
    expect(run.executionHints?.targetActors[0]?.claimPolicyHint).toBe(
      TaskClaimPolicy.ASSIGNED_ONLY,
    );
    expect(run.artifacts.map((artifact) => artifact.artifactType)).toContain("PARAMETER_SET");
    expect(run.artifacts.map((artifact) => artifact.artifactType)).toContain("CALCULATION_RUN");
    expect(run.artifacts.map((artifact) => artifact.artifactType)).toContain("MANUAL_SECTION");
    expect(run.artifacts.map((artifact) => artifact.artifactType)).toContain("EXTERNAL_SOURCE");
    expect(run.artifacts.find((artifact) => artifact.sourceRef === "sipri-global-military-spending")?.title).toBe(
      "SIPRI military expenditure database",
    );
    expect(run.artifacts.find((artifact) => artifact.artifactType === "CALCULATION_RUN")).toMatchObject({
      artifactKey: "calculation-run:policy:usa-federal:one-percent-treaty:sha256:test",
      versionKey: "sha256:test",
    });
    expect(run.calculations[0]?.sourceArtifactKeys).toContain(
      "calculation-run:policy:usa-federal:one-percent-treaty:sha256:test",
    );
  });
});
