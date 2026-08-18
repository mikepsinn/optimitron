import { describe, expect, it, vi } from "vitest";
import {
  syncPerVerifiedVoterTaskImpactEstimate,
  type PerVerifiedVoterTaskImpactClient,
} from "../per-verified-voter-impact.server";

describe("syncPerVerifiedVoterTaskImpactEstimate", () => {
  it("upserts the per-verified-voter estimate set and marks it current", async () => {
    const taskUpdate = vi.fn().mockResolvedValue({});
    const estimateSetUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const estimateSetUpsert = vi.fn().mockResolvedValue({ id: "estimate_set_1" });
    const frameUpsert = vi.fn().mockResolvedValue({ id: "frame_1" });
    const metricUpsert = vi.fn().mockResolvedValue({});
    const metricUpdateMany = vi.fn().mockResolvedValue({ count: 0 });
    const db: PerVerifiedVoterTaskImpactClient = {
      task: { update: taskUpdate },
      taskImpactEstimateSet: {
        updateMany: estimateSetUpdateMany,
        upsert: estimateSetUpsert,
      },
      taskImpactFrameEstimate: { upsert: frameUpsert },
      taskImpactMetric: {
        updateMany: metricUpdateMany,
        upsert: metricUpsert,
      },
    };

    await syncPerVerifiedVoterTaskImpactEstimate(db, "task_1");

    expect(estimateSetUpsert).toHaveBeenCalledWith({
      where: {
        taskId_estimateKind_sourceSystem_calculationVersion_methodologyKey_parameterSetHash_counterfactualKey:
          {
            calculationVersion: "seed-v1",
            counterfactualKey: "status-quo",
            estimateKind: "FORECAST",
            methodologyKey: "treaty-per-verified-voter-lifetime",
            parameterSetHash: "seed-global-registered-voters",
            sourceSystem: "PARAMETER_CATALOG",
            taskId: "task_1",
          },
      },
      create: expect.objectContaining({
        isCurrent: true,
        taskId: "task_1",
      }),
      update: expect.objectContaining({
        deletedAt: null,
        isCurrent: true,
      }),
      select: {
        id: true,
      },
    });
    expect(estimateSetUpdateMany).toHaveBeenCalledWith({
      data: { isCurrent: false },
      where: {
        NOT: {
          id: "estimate_set_1",
        },
        deletedAt: null,
        isCurrent: true,
        taskId: "task_1",
      },
    });
    expect(frameUpsert).toHaveBeenCalledWith({
      where: {
        taskImpactEstimateSetId_frameSlug: {
          frameSlug: "lifetime",
          taskImpactEstimateSetId: "estimate_set_1",
        },
      },
      create: expect.objectContaining({
        frameSlug: "lifetime",
        taskImpactEstimateSetId: "estimate_set_1",
      }),
      update: expect.objectContaining({
        deletedAt: null,
      }),
      select: {
        id: true,
      },
    });
    expect(metricUpsert).toHaveBeenCalledTimes(2);
    expect(metricUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          taskImpactFrameEstimateId_metricKey: {
            metricKey: "lives_saved_if_success",
            taskImpactFrameEstimateId: "frame_1",
          },
        },
        update: expect.objectContaining({
          deletedAt: null,
        }),
      }),
    );
    expect(metricUpdateMany).toHaveBeenCalledWith({
      data: {
        deletedAt: expect.any(Date),
      },
      where: {
        deletedAt: null,
        metricKey: {
          notIn: [
            "lives_saved_if_success",
            "suffering_hours_if_success",
          ],
        },
        taskImpactFrameEstimateId: "frame_1",
      },
    });
    expect(taskUpdate).toHaveBeenCalledWith({
      data: { currentImpactEstimateSetId: "estimate_set_1" },
      where: { id: "task_1" },
    });
  });
});
