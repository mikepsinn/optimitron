import { ModelRevisionStatus } from "@optimitron/db/enums";
import { describe, expect, it, vi } from "vitest";
import {
  canReadParameterRevision,
  getParameterTrace,
  importManualParameterCatalog,
  ParameterRevisionProposalSchema,
} from "./parameter-catalog.server";

describe("parameter catalog authorization", () => {
  it("does not expose unpublished revisions to unrelated callers", () => {
    const draft = {
      proposedByUserId: "user-1",
      status: ModelRevisionStatus.DRAFT,
    };
    expect(
      canReadParameterRevision(draft, { isAdmin: false, userId: null }),
    ).toBe(false);
    expect(
      canReadParameterRevision(draft, { isAdmin: false, userId: "user-1" }),
    ).toBe(true);
    expect(
      canReadParameterRevision(draft, { isAdmin: true, userId: "admin" }),
    ).toBe(true);
    expect(
      canReadParameterRevision(
        { ...draft, status: ModelRevisionStatus.PUBLISHED },
        { isAdmin: false, userId: null },
      ),
    ).toBe(true);
  });

  it("accepts inert inline source for an externally run calculation", () => {
    expect(
      ParameterRevisionProposalSchema.parse({
        calculationSource: {
          language: "python",
          source: "print(6 * 7)",
        },
        description: "Output produced by the linked Python model.",
        key: "PYTHON_MODEL_OUTPUT",
        rationale: "The linked artifact retains the exact model source.",
        sourceType: "CALCULATED",
        unit: "USD",
        value: 42,
      }).calculationSource,
    ).toMatchObject({
      executionPolicy: "inert",
      language: "python",
      source: "print(6 * 7)",
    });
  });

  it("rejects a changed bootstrap instead of reporting a false no-op", async () => {
    const tx = {
      parameterDefinition: {
        findMany: vi.fn().mockResolvedValue([
          {
            currentRevision: {
              id: "revision-1",
              sourceContentHash: "old-hash",
            },
            deletedAt: null,
            key: "A",
          },
        ]),
      },
    };
    const db = {
      $transaction: vi.fn((callback) => callback(tx)),
    };

    await expect(
      importManualParameterCatalog(
        {
          dryRun: false,
          exportData: {
            parameters: { A: { value: 1 } },
            sourceFile: "parameters.py",
          },
          pythonSource: "A = 1",
          summaries: {},
        },
        db as never,
      ),
    ).rejects.toThrow("already diverged");
  });

  it("returns the complete recursive parameter dependency trace", async () => {
    const revision = (
      id: string,
      key: string,
      inputs: Array<{
        inputRevisionId: string;
        position: number;
        symbol: string;
      }>,
    ) => ({
      assumptionsJson: null,
      calculationCode: id === "output" ? "output = INPUT * 2" : null,
      calculationLanguage: id === "output" ? "python" : null,
      confidence: "estimated",
      confidenceIntervalHigh: null,
      confidenceIntervalLow: null,
      conservative: false,
      deletedAt: null,
      description: key,
      displayName: null,
      displayValue: null,
      formulaLatex: null,
      formulaText: id === "output" ? "INPUT * 2" : null,
      id,
      inputs,
      manualRef: null,
      parameter: {
        currentRevisionId: id,
        deletedAt: null,
        key,
      },
      proposedByUserId: null,
      rationale: null,
      revision: 1,
      sourceArtifacts: [],
      sourceContentHash: `${id}-hash`,
      sourceRef: null,
      sourceType: id === "output" ? "CALCULATED" : "EXTERNAL",
      status: ModelRevisionStatus.PUBLISHED,
      unit: "USD",
      value: id === "output" ? 20 : 10,
    });
    const rows = new Map([
      [
        "output",
        revision("output", "OUTPUT", [
          { inputRevisionId: "input", position: 0, symbol: "INPUT" },
        ]),
      ],
      ["input", revision("input", "INPUT", [])],
    ]);
    const db = {
      parameterRevision: {
        findUnique: vi.fn(({ where }) => rows.get(where.id) ?? null),
      },
    };

    const trace = await getParameterTrace(
      { revisionId: "output" },
      { isAdmin: false, userId: null },
      db as never,
    );

    expect(trace).toMatchObject({
      formulaText: "INPUT * 2",
      inputs: [
        {
          symbol: "INPUT",
          revision: { inputs: [], key: "INPUT", value: 10 },
        },
      ],
      key: "OUTPUT",
      value: 20,
    });
  });
});
