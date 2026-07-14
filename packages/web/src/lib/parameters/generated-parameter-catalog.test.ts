import { citations, parameters } from "@optimitron/data/parameters";
import { describe, expect, it } from "vitest";
import { compileGeneratedParameterCatalog } from "./generated-parameter-catalog";

describe("compileGeneratedParameterCatalog", () => {
  it("retains calculation metadata and orders dependencies", async () => {
    const catalog = await compileGeneratedParameterCatalog({
      OUTPUT: {
        computeExpr: "(INPUT * 2)",
        confidence: "high",
        description: "Output",
        formula: "INPUT * 2",
        inputs: ["INPUT"],
        parameterName: "OUTPUT",
        peerReviewed: true,
        sourceLastUpdated: "2026-07",
        sourceType: "calculated",
        unit: "USD",
        value: 20,
      },
      INPUT: {
        confidenceInterval: [8, 12],
        distribution: "normal",
        parameterName: "INPUT",
        unit: "USD",
        value: 10,
      },
    });

    expect(catalog.parameters.map((parameter) => parameter.key)).toEqual([
      "INPUT",
      "OUTPUT",
    ]);
    expect(catalog.parameters[1]).toMatchObject({
      calculationCode: "(INPUT * 2)",
      calculationLanguage: "javascript-expression",
      confidence: "high",
      peerReviewed: true,
      sourceLastUpdated: "2026-07",
    });
    expect(catalog.counts).toEqual({
      total: 2,
      calculated: 1,
      withCalculationCode: 1,
      snapshotCalculated: 0,
      withDistribution: 1,
    });
  });

  it("rejects missing dependencies", async () => {
    await expect(
      compileGeneratedParameterCatalog({
        OUTPUT: { inputs: ["MISSING"], value: 1 },
      }),
    ).rejects.toThrow("missing input MISSING");
  });

  it("rejects unsupported uncertainty distributions", async () => {
    await expect(
      compileGeneratedParameterCatalog({
        INPUT: { distribution: "bell-curve", value: 1 },
      }),
    ).rejects.toThrow();
  });

  it("does not invent metadata for plain numeric constants", async () => {
    const catalog = await compileGeneratedParameterCatalog({
      DAYS_PER_YEAR: { parameterName: "DAYS_PER_YEAR", value: 365 },
    });

    expect(catalog.parameters[0]).toMatchObject({
      confidence: "unspecified",
      description: "unspecified",
      unit: "unspecified",
      value: 365,
    });
  });

  it("preserves unsupported calculations as explicit snapshots", async () => {
    const catalog = await compileGeneratedParameterCatalog({
      INPUT: { value: 2.9 },
      OUTPUT: {
        formula: "truncate INPUT",
        inputs: ["INPUT"],
        sourceType: "calculated",
        value: 2,
      },
    });

    expect(
      catalog.parameters.find((parameter) => parameter.key === "OUTPUT"),
    ).toMatchObject({
      calculationCode: null,
      calculationLanguage: null,
      formulaText: "truncate INPUT",
    });
  });

  it("content-addresses cited source metadata", async () => {
    const build = (title: string) =>
      compileGeneratedParameterCatalog(
        { INPUT: { sourceRef: "SOURCE", value: 10 } },
        { SOURCE: { title, URL: "https://example.org/source" } },
      );

    const first = await build("First title");
    const second = await build("Corrected title");

    expect(first.catalogContentHash).not.toBe(second.catalogContentHash);
    expect(first.parameters[0]?.sourceContentHash).not.toBe(
      second.parameters[0]?.sourceContentHash,
    );
  });

  it("keeps catalog identity stable across declaration order", async () => {
    const first = await compileGeneratedParameterCatalog({
      A: { value: 1 },
      B: { value: 2 },
    });
    const second = await compileGeneratedParameterCatalog({
      B: { value: 2 },
      A: { value: 1 },
    });

    expect(first.catalogContentHash).toBe(second.catalogContentHash);
  });

  it("compiles the complete copied manual catalog", async () => {
    const catalog = await compileGeneratedParameterCatalog(
      parameters,
      citations,
    );
    const snapshots = catalog.parameters
      .filter(
        (parameter) =>
          parameter.sourceType === "CALCULATED" &&
          parameter.calculationCode === null,
      )
      .map((parameter) => parameter.key)
      .sort();

    expect(catalog.counts).toEqual({
      total: 872,
      calculated: 445,
      withCalculationCode: 436,
      snapshotCalculated: 9,
      withDistribution: 312,
    });
    expect(Object.keys(catalog.citations)).toHaveLength(184);
    expect(snapshots).toEqual([
      "CURRENT_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME",
      "DESTRUCTIVE_ECONOMY_25PCT_YEAR",
      "DESTRUCTIVE_ECONOMY_35PCT_YEAR",
      "DESTRUCTIVE_ECONOMY_50PCT_YEAR",
      "PEACE_DIVIDEND_CONFLICT_REDUCTION",
      "TREATY_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME",
      "WAR_TRIAL_REDIRECT_DISEASE_PLEADING_CUTOFF_YEAR",
      "WAR_TRIAL_REDIRECT_EXCESS_MILITARY_SPENDING_ABOVE_1900_FREEZE",
      "WISHONIA_TRAJECTORY_CUMULATIVE_LIFETIME_INCOME",
    ]);
    expect(
      catalog.parameters.find(
        (parameter) =>
          parameter.key === "DFDA_EFFICACY_LAG_ELIMINATION_DEATHS_AVERTED",
      )?.calculationCode,
    ).toMatch(/^Math\.trunc\(/);
  });
});
