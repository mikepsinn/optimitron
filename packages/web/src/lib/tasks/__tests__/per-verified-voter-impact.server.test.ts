import { describe, expect, it, vi } from "vitest";
import {
  syncPerVerifiedVoterTaskImpactEstimate,
  type PerVerifiedVoterTaskImpactClient,
} from "../per-verified-voter-impact.server";

describe("syncPerVerifiedVoterTaskImpactEstimate", () => {
  it("replaces only the per-verified-voter estimate set for the task", async () => {
    const taskUpdate = vi.fn().mockResolvedValue({});
    const estimateSetUpdateMany = vi.fn().mockResolvedValue({ count: 2 });
    const estimateSetDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const estimateSetCreate = vi.fn().mockResolvedValue({ id: "estimate_set_1" });
    const frameCreate = vi.fn().mockResolvedValue({ id: "frame_1" });
    const metricCreateMany = vi.fn().mockResolvedValue({ count: 2 });
    const db: PerVerifiedVoterTaskImpactClient = {
      task: { update: taskUpdate },
      taskImpactEstimateSet: {
        create: estimateSetCreate,
        deleteMany: estimateSetDeleteMany,
        updateMany: estimateSetUpdateMany,
      },
      taskImpactFrameEstimate: { create: frameCreate },
      taskImpactMetric: { createMany: metricCreateMany },
    };

    await syncPerVerifiedVoterTaskImpactEstimate(db, "task_1");

    expect(estimateSetUpdateMany).toHaveBeenCalledWith({
      data: { isCurrent: false },
      where: {
        deletedAt: null,
        taskId: "task_1",
      },
    });
    expect(estimateSetDeleteMany).toHaveBeenCalledWith({
      where: {
        calculationVersion: "seed-v1",
        counterfactualKey: "status-quo",
        estimateKind: "FORECAST",
        methodologyKey: "treaty-per-verified-voter-lifetime",
        parameterSetHash: "seed-global-registered-voters",
        sourceSystem: "PARAMETER_CATALOG",
        taskId: "task_1",
      },
    });
    expect(estimateSetDeleteMany).not.toHaveBeenCalledWith({
      where: { taskId: "task_1" },
    });
    expect(taskUpdate).toHaveBeenCalledWith({
      data: { currentImpactEstimateSetId: "estimate_set_1" },
      where: { id: "task_1" },
    });
  });
});
