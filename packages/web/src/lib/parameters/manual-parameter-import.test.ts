import { describe, expect, it } from "vitest";
import { compileManualParameterCatalog } from "./manual-parameter-import";

describe("compileManualParameterCatalog", () => {
  it("retains lossless metadata and orders dependencies", async () => {
    const catalog = await compileManualParameterCatalog(
      {
        schemaVersion: "manual-parameters.v2",
        sourceFile: "dih_models/parameters.py",
        sourceContentHash: "source-hash",
        parameters: {
          OUTPUT: {
            value: 20,
            unit: "USD",
            description: "Output",
            sourceType: "calculated",
            formula: "INPUT * 2",
            computeExpr: "(INPUT * 2.0)",
            inputs: ["INPUT"],
            lastUpdated: "2026-07",
            peerReviewed: true,
            sourceStartLine: 20,
            sourceEndLine: 30,
            definitionSource: "OUTPUT = Parameter(...)\n",
            rawProperties: { hideCi: false },
            confidence: "high",
          },
          INPUT: {
            value: 10,
            unit: "USD",
            description: "Input",
            sourceType: "external",
            distribution: "normal",
            confidenceInterval: [8, 12],
            inputs: [],
          },
        },
        citations: {},
      },
      {
        INPUT: { mean: 10, std: 1, p5: 8, p50: 10, p95: 12 },
      },
    );

    expect(catalog.parameters.map((parameter) => parameter.key)).toEqual([
      "INPUT",
      "OUTPUT",
    ]);
    expect(catalog.parameters[1]).toMatchObject({
      calculationCode: "OUTPUT = Parameter(...)\n",
      calculationLanguage: "python",
      confidence: "high",
      peerReviewed: true,
      sourceLastUpdated: "2026-07",
      sourceStartLine: 20,
    });
    expect(catalog.counts).toEqual({
      total: 2,
      calculated: 1,
      withCalculationCode: 1,
      snapshotCalculated: 0,
      withDistribution: 1,
      withSummaryStats: 1,
    });
  });

  it("rejects missing dependencies", async () => {
    await expect(
      compileManualParameterCatalog({
        sourceFile: "parameters.py",
        parameters: {
          OUTPUT: { value: 1, inputs: ["MISSING"] },
        },
      }),
    ).rejects.toThrow("missing input MISSING");
  });

  it("does not invent metadata for plain numeric constants", async () => {
    const catalog = await compileManualParameterCatalog({
      sourceFile: "parameters.py",
      parameters: { DAYS_PER_YEAR: { value: 365 } },
    });

    expect(catalog.parameters[0]).toMatchObject({
      confidence: "unspecified",
      description: "unspecified",
      unit: "unspecified",
      value: 365,
    });
  });

  it("preserves exported calculation code without executing it", async () => {
    const catalog = await compileManualParameterCatalog(
      {
        sourceFile: "parameters.py",
        parameters: {
          INPUT: { value: 2.9 },
          OUTPUT: {
            computeExpr: "INPUT",
            definitionSource: "OUTPUT = Parameter(int(INPUT))",
            inputs: ["INPUT"],
            sourceType: "calculated",
            value: 2,
          },
        },
      },
      {},
    );

    expect(
      catalog.parameters.find((parameter) => parameter.key === "OUTPUT"),
    ).toMatchObject({
      calculationCode: "OUTPUT = Parameter(int(INPUT))",
      calculationLanguage: "python",
    });
  });

  it("content-addresses the full export and cited source metadata", async () => {
    const build = (title: string) =>
      compileManualParameterCatalog({
        citations: { SOURCE: { title, url: "https://example.org/source" } },
        parameters: {
          INPUT: { sourceRef: "SOURCE", value: 10 },
        },
        sourceContentHash: "same-python-source",
        sourceFile: "parameters.py",
      });

    const first = await build("First title");
    const second = await build("Corrected title");

    expect(first.sourceContentHash).toBe(second.sourceContentHash);
    expect(first.exportContentHash).not.toBe(second.exportContentHash);
    expect(first.parameters[0]?.sourceContentHash).not.toBe(
      second.parameters[0]?.sourceContentHash,
    );
    expect(first.parameterSetHash).not.toBe(second.parameterSetHash);
  });

  it("does not change the parameter-set identity when declarations are reordered", async () => {
    const first = await compileManualParameterCatalog({
      parameters: { A: { value: 1 }, B: { value: 2 } },
      sourceFile: "parameters.py",
    });
    const second = await compileManualParameterCatalog({
      parameters: { B: { value: 2 }, A: { value: 1 } },
      sourceFile: "parameters.py",
    });

    expect(first.parameterSetHash).toBe(second.parameterSetHash);
  });
});
