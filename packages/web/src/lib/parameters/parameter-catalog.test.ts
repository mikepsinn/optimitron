import { ModelRevisionStatus } from "@optimitron/db/enums";
import { describe, expect, it, vi } from "vitest";
import {
  bootstrapGeneratedParameterCatalog,
  canReadParameterRevision,
  getParameterTrace,
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

  it("does not overwrite an existing database-owned parameter", async () => {
    const tx = {
      parameterDefinition: {
        findMany: vi.fn().mockResolvedValue([
          {
            currentRevisionId: "revision-1",
            deletedAt: null,
            id: "parameter-1",
            key: "A",
          },
        ]),
      },
    };
    const db = {
      $transaction: vi.fn((callback) => callback(tx)),
    };

    await expect(
      bootstrapGeneratedParameterCatalog(
        {
          dryRun: false,
          parameters: { A: { value: 1 } },
        },
        db as never,
      ),
    ).resolves.toMatchObject({
      applied: true,
      createdDefinitionCount: 0,
      createdRevisionCount: 0,
      skippedExistingDefinitionCount: 1,
    });
  });

  it("rejects dangling citation references before bootstrap writes", async () => {
    const db = { $transaction: vi.fn() };

    await expect(
      bootstrapGeneratedParameterCatalog(
        {
          dryRun: false,
          parameters: { A: { sourceRef: "MISSING", value: 1 } },
        },
        db as never,
      ),
    ).rejects.toThrow("references missing citation MISSING");
    expect(db.$transaction).not.toHaveBeenCalled();
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
      sourceArtifacts:
        id === "input"
          ? [
              {
                sourceArtifact: {
                  artifactType: "PARAMETER_SET",
                  contentHash: "catalog-hash",
                  id: "catalog-artifact",
                  payloadJson: { parameters: "large internal payload" },
                  sourceKey: "generated:parameter-set:catalog-hash",
                  sourceRef: "@optimitron/data/parameters",
                  sourceSystem: "PARAMETER_CATALOG",
                  sourceUrl: null,
                  title: "Generated parameter catalog",
                  versionKey: null,
                },
              },
            ]
          : [],
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
    expect(trace.inputs[0]?.revision.sourceArtifacts[0]).not.toHaveProperty(
      "payloadJson",
    );
  });
});
