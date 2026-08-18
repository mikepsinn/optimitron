import { describe, expect, it } from "vitest";
import { validateDirectTaskImpactInput } from "./task-impact-calculation.server";

describe("validateDirectTaskImpactInput", () => {
  it("accepts finite negative and very large welfare estimates", () => {
    expect(
      validateDirectTaskImpactInput({
        frame: {
          expectedEconomicValueUsdBase: -1e250,
          expectedEconomicValueUsdHigh: 1e300,
          expectedEconomicValueUsdLow: -1e300,
        },
        taskId: "task-1",
      }).frame.expectedEconomicValueUsdHigh,
    ).toBe(1e300);
  });

  it("rejects semantic range and probability violations", () => {
    expect(() =>
      validateDirectTaskImpactInput({
        frame: { successProbabilityBase: 1.1 },
        taskId: "task-1",
      }),
    ).toThrow();
    expect(() =>
      validateDirectTaskImpactInput({
        frame: {
          expectedEconomicValueUsdBase: 10,
          expectedEconomicValueUsdLow: 20,
        },
        taskId: "task-1",
      }),
    ).toThrow("must not exceed");
  });

  it("rejects arbitrary source artifact ids", () => {
    expect(() =>
      validateDirectTaskImpactInput({
        frame: { expectedEconomicValueUsdBase: 42 },
        sourceArtifactIds: ["calculation-source-1"],
        taskId: "task-1",
      }),
    ).toThrow();
  });

  it("accepts inert inline calculation source", () => {
    expect(
      validateDirectTaskImpactInput({
        calculationSource: {
          language: "python",
          source: "print(6 * 7)",
        },
        frame: { expectedEconomicValueUsdBase: 42 },
        taskId: "task-1",
      }).calculationSource,
    ).toMatchObject({
      executionPolicy: "inert",
      language: "python",
      source: "print(6 * 7)",
    });
  });

  it("retains formulas, inert code, and exact parameter references", () => {
    expect(
      validateDirectTaskImpactInput({
        calculationCode: "value = BENEFIT * PROBABILITY",
        calculationLanguage: "python",
        formulaText: "benefit * probability",
        frame: { expectedEconomicValueUsdBase: 12_000 },
        parameterInputs: [
          {
            parameterKey: "BENEFIT",
            revisionId: "revision-1",
            symbol: "BENEFIT",
          },
        ],
        taskId: "task-1",
      }),
    ).toMatchObject({
      calculationLanguage: "python",
      formulaText: "benefit * probability",
      parameterInputs: [{ revisionId: "revision-1" }],
    });
  });

  it("rejects duplicate parameter symbols", () => {
    expect(() =>
      validateDirectTaskImpactInput({
        frame: { expectedEconomicValueUsdBase: 1 },
        parameterInputs: [
          { parameterKey: "A", symbol: "VALUE" },
          { parameterKey: "B", symbol: "VALUE" },
        ],
        taskId: "task-1",
      }),
    ).toThrow("Duplicate input symbol");
  });
});
