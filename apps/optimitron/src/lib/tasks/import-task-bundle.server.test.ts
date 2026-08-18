import { describe, expect, it, vi } from "vitest";
import { syncImpactParameterInputs } from "./import-task-bundle.server";

describe("syncImpactParameterInputs", () => {
  it("pins current parameter revisions in deterministic key order", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const createMany = vi.fn().mockResolvedValue({ count: 2 });
    const tx = {
      parameterDefinition: {
        findMany: vi.fn().mockResolvedValue([
          { currentRevisionId: "revision-b", key: "B" },
          { currentRevisionId: "revision-a", key: "A" },
        ]),
      },
      taskImpactEstimateInput: { createMany, deleteMany },
    };

    await expect(
      syncImpactParameterInputs(tx as never, "estimate-1", ["B", "A", "B"]),
    ).resolves.toEqual({ linked: 2, missingKeys: [] });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { taskImpactEstimateSetId: "estimate-1" },
    });
    expect(createMany).toHaveBeenCalledWith({
      data: [
        {
          parameterRevisionId: "revision-a",
          position: 0,
          symbol: "A",
          taskImpactEstimateSetId: "estimate-1",
        },
        {
          parameterRevisionId: "revision-b",
          position: 1,
          symbol: "B",
          taskImpactEstimateSetId: "estimate-1",
        },
      ],
    });
  });
});
