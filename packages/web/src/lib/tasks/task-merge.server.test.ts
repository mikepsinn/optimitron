import { TaskStatus } from "@optimitron/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const modelNames = [
    "agentTaskLease",
    "collectionRecord",
    "collectionRelation",
    "courtCase",
    "courtCaseRemedy",
    "datingDatePlan",
    "document",
    "externalActionRequest",
    "referralInvitation",
    "shareAttempt",
    "task",
    "taskApplication",
    "taskCandidateMatch",
    "taskClaim",
    "taskComment",
    "taskCommentAttachment",
    "taskCommunication",
    "taskCommunicationEndpoint",
    "taskCommunicationTemplate",
    "taskDistributionAttempt",
    "taskEdge",
    "taskExecutionAttempt",
    "taskFundingPayment",
    "taskFundingTarget",
    "taskImpactEstimateSet",
    "taskManager",
    "taskMarketplaceListing",
    "taskPayout",
    "taskSourceArtifact",
  ] as const;

  type ModelMock = {
    count: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };

  const makeTx = () => {
    const tx = {} as Record<(typeof modelNames)[number], ModelMock> & {
      $queryRaw: ReturnType<typeof vi.fn>;
    };
    for (const name of modelNames) {
      tx[name] = {
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      };
    }
    // FOR UPDATE row lock: default to both rows still live.
    tx.$queryRaw = vi.fn().mockResolvedValue([{ id: "a" }, { id: "b" }]);
    // The guarded duplicate soft-delete (data carries deletedAt) must report
    // one affected row so the liveness check passes; other task.updateMany
    // calls (child re-parent) keep the count:0 default.
    tx.task.updateMany.mockImplementation(
      async (args: { data?: { deletedAt?: unknown } }) =>
        args?.data?.deletedAt != null ? { count: 1 } : { count: 0 },
    );
    return tx;
  };

  const state = { tx: makeTx() };
  const transaction = vi.fn(
    async (callback: (tx: unknown) => Promise<unknown>) => callback(state.tx),
  );
  return { makeTx, state, transaction };
});

vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: h.transaction },
}));

import { mergeTask } from "./task-merge.server";

interface SeededTask {
  contextJson?: unknown;
  currentImpactEstimateSetId?: string | null;
  parentTaskId?: string | null;
  taskKey?: string | null;
}

function seedTasks(map: Record<string, SeededTask>) {
  h.state.tx.task.findFirst.mockImplementation(
    async (args: { where: { id: string } }) => {
      const row = map[args.where.id];
      if (!row) return null;
      return {
        contextJson: row.contextJson ?? null,
        currentImpactEstimateSetId: row.currentImpactEstimateSetId ?? null,
        id: args.where.id,
        parentTaskId: row.parentTaskId ?? null,
        taskKey: row.taskKey ?? null,
      };
    },
  );
  h.state.tx.task.findUnique.mockImplementation(
    async (args: { where: { id: string } }) => {
      const row = map[args.where.id];
      return row ? { parentTaskId: row.parentTaskId ?? null } : null;
    },
  );
}

function expectNoWrites() {
  for (const [name, model] of Object.entries(h.state.tx)) {
    if (name === "$queryRaw") continue;
    const delegate = model as { update: unknown; updateMany: unknown };
    expect(delegate.update).not.toHaveBeenCalled();
    expect(delegate.updateMany).not.toHaveBeenCalled();
  }
}

describe("mergeTask", () => {
  beforeEach(() => {
    h.state.tx = h.makeTx();
    h.transaction.mockClear();
  });

  it("refuses identical ids without writing", async () => {
    const report = await mergeTask({
      canonicalTaskId: "t1",
      duplicateTaskId: "t1",
    });

    expect(report.refused).toContain("must be different");
    expectNoWrites();
  });

  it("refuses when the duplicate task is missing or deleted", async () => {
    seedTasks({ can: {} });

    const report = await mergeTask({
      canonicalTaskId: "can",
      duplicateTaskId: "gone",
    });

    expect(report.refused).toContain("Duplicate task not found");
    expectNoWrites();
  });

  it("refuses when the canonical task is missing or deleted", async () => {
    seedTasks({ dup: {} });

    const report = await mergeTask({
      canonicalTaskId: "gone",
      duplicateTaskId: "dup",
    });

    expect(report.refused).toContain("Canonical task not found");
    expectNoWrites();
  });

  it("refuses reserved planning root tasks by id and by key", async () => {
    seedTasks({ can: {}, "optimize-earth": {} });
    const byId = await mergeTask({
      canonicalTaskId: "can",
      duplicateTaskId: "optimize-earth",
    });
    expect(byId.refused).toContain("reserved planning root");

    seedTasks({ dup: {}, planner: { taskKey: "planner:person:user_1" } });
    const byKey = await mergeTask({
      canonicalTaskId: "planner",
      duplicateTaskId: "dup",
    });
    expect(byKey.refused).toContain("reserved planning root");
    expectNoWrites();
  });

  it("refuses when both tasks have a funding target, before any re-point", async () => {
    seedTasks({ can: {}, dup: {} });
    h.state.tx.taskFundingTarget.findUnique.mockImplementation(
      async (args: { where: { taskId: string } }) =>
        args.where.taskId === "dup"
          ? { deletedAt: null, id: "ft_dup" }
          : { id: "ft_can" },
    );

    const report = await mergeTask({
      canonicalTaskId: "can",
      duplicateTaskId: "dup",
    });

    expect(report.refused).toContain("TaskFundingTarget");
    expectNoWrites();
  });

  it("ignores a soft-deleted duplicate-side funding target", async () => {
    seedTasks({ can: {}, dup: {} });
    h.state.tx.taskFundingTarget.findUnique.mockImplementation(
      async (args: { where: { taskId: string } }) =>
        args.where.taskId === "dup"
          ? { deletedAt: new Date("2026-01-01"), id: "ft_dup" }
          : { id: "ft_can" },
    );

    const report = await mergeTask({
      canonicalTaskId: "can",
      duplicateTaskId: "dup",
    });

    expect(report.refused).toBeUndefined();
    expect(report.movedCounts.fundingTarget).toBe(0);
    expect(h.state.tx.taskFundingTarget.updateMany).not.toHaveBeenCalled();
  });

  it("refuses when the canonical is a deep descendant of the duplicate", async () => {
    seedTasks({
      can: { parentTaskId: "mid" },
      dup: {},
      mid: { parentTaskId: "dup" },
    });

    const report = await mergeTask({
      canonicalTaskId: "can",
      duplicateTaskId: "dup",
    });

    expect(report.refused).toContain("descendant");
    expectNoWrites();
  });

  it("re-parents a direct-child canonical to the duplicate's parent before moving children", async () => {
    seedTasks({
      can: { parentTaskId: "dup" },
      dup: { parentTaskId: "grand" },
      grand: {},
    });

    const report = await mergeTask({
      canonicalTaskId: "can",
      duplicateTaskId: "dup",
    });

    expect(report.refused).toBeUndefined();
    expect(h.state.tx.task.update).toHaveBeenCalledWith({
      where: { id: "can" },
      data: { parentTaskId: "grand" },
    });
    expect(h.state.tx.task.updateMany).toHaveBeenCalledWith({
      where: { deletedAt: null, id: { not: "can" }, parentTaskId: "dup" },
      data: { parentTaskId: "can" },
    });
  });

  it("nulls the canonical parent when duplicate and canonical are each other's parents", async () => {
    seedTasks({
      can: { parentTaskId: "dup" },
      dup: { parentTaskId: "can" },
    });

    const report = await mergeTask({
      canonicalTaskId: "can",
      duplicateTaskId: "dup",
    });

    expect(report.refused).toBeUndefined();
    expect(h.state.tx.task.update).toHaveBeenCalledWith({
      where: { id: "can" },
      data: { parentTaskId: null },
    });
  });

  it("refuses to merge away a keyed (managed/trigger) duplicate task", async () => {
    seedTasks({
      can: { taskKey: null },
      dup: { taskKey: "program:x" },
    });

    const report = await mergeTask({
      canonicalTaskId: "can",
      duplicateTaskId: "dup",
    });

    expect(report.refused).toContain("managed/trigger taskKey");
    expectNoWrites();
  });

  it("guards the duplicate soft-delete with a liveness re-check and records provenance", async () => {
    seedTasks({
      can: { contextJson: { mergedFromTaskIds: ["older"] }, taskKey: "program:keep" },
      dup: { contextJson: { foo: 1 }, taskKey: null },
    });

    const report = await mergeTask({
      canonicalTaskId: "can",
      duplicateTaskId: "dup",
    });

    expect(report.refused).toBeUndefined();
    // The duplicate is soft-deleted via a deletedAt:null-guarded updateMany so
    // a concurrent delete aborts the transaction instead of double-deleting.
    expect(h.state.tx.task.updateMany).toHaveBeenCalledWith({
      where: { deletedAt: null, id: "dup" },
      data: {
        contextJson: { foo: 1, mergedIntoTaskId: "can" },
        deletedAt: expect.any(Date),
        status: TaskStatus.STALE,
      },
    });
    // The canonical keeps its own taskKey (no transfer) and gains provenance.
    const canonicalUpdate = (
      h.state.tx.task.update.mock.calls as Array<
        [{ data: Record<string, unknown>; where: { id: string } }]
      >
    ).find(([call]) => call.where.id === "can");
    expect(canonicalUpdate?.[0].data).not.toHaveProperty("taskKey");
    expect(canonicalUpdate?.[0].data.contextJson).toEqual({
      mergedFromTaskIds: ["older", "dup"],
    });
  });

  it("aborts the transaction when the duplicate was concurrently deleted", async () => {
    seedTasks({ can: {}, dup: {} });
    // The guarded soft-delete matches zero live rows → concurrent modification.
    h.state.tx.task.updateMany.mockImplementation(
      async (args: { data?: { deletedAt?: unknown } }) =>
        args?.data?.deletedAt != null ? { count: 0 } : { count: 0 },
    );

    await expect(
      mergeTask({ canonicalTaskId: "can", duplicateTaskId: "dup" }),
    ).rejects.toThrow("concurrently modified");
  });

  it("refuses when a task row lock cannot be acquired for both tasks", async () => {
    seedTasks({ can: {}, dup: {} });
    h.state.tx.$queryRaw.mockResolvedValue([{ id: "can" }]);

    const report = await mergeTask({
      canonicalTaskId: "can",
      duplicateTaskId: "dup",
    });

    expect(report.refused).toContain("concurrent operation");
  });

  it("soft-deletes duplicate<->canonical self-edges and skips unique edge collisions", async () => {
    seedTasks({ can: {}, dup: {} });
    h.state.tx.taskEdge.findMany.mockImplementation(
      async (args: { where: Record<string, unknown> }) => {
        if (args.where.fromTaskId === "can") {
          return [{ edgeType: "BLOCKS", toTaskId: "x" }];
        }
        if (args.where.fromTaskId === "dup") {
          return [
            { edgeType: "BLOCKS", id: "e_self", toTaskId: "can" },
            { edgeType: "BLOCKS", id: "e_collide", toTaskId: "x" },
            { edgeType: "BLOCKS", id: "e_move", toTaskId: "y" },
          ];
        }
        if (args.where.toTaskId === "dup") {
          return [{ edgeType: "RELATES_TO", fromTaskId: "can", id: "e_self_in" }];
        }
        return [];
      },
    );

    const report = await mergeTask({
      canonicalTaskId: "can",
      duplicateTaskId: "dup",
    });

    expect(h.state.tx.taskEdge.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["e_self"] } },
      data: { deletedAt: expect.any(Date) },
    });
    expect(h.state.tx.taskEdge.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["e_move"] } },
      data: { fromTaskId: "can" },
    });
    expect(h.state.tx.taskEdge.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["e_self_in"] } },
      data: { deletedAt: expect.any(Date) },
    });
    expect(h.state.tx.taskEdge.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: expect.arrayContaining(["e_collide"]) } },
      }),
    );
    expect(report.droppedSelfEdges).toBe(2);
    expect(report.movedCounts.outgoingEdges).toBe(1);
    expect(report.skippedCollisions.outgoingEdges).toBe(1);
    expect(report.movedCounts.incomingEdges).toBe(0);
  });

  it("moves only non-colliding claims; canonical-side soft-deleted rows still occupy the unique slot", async () => {
    seedTasks({ can: {}, dup: {} });
    h.state.tx.taskClaim.findMany.mockImplementation(
      async (args: { where: Record<string, unknown> }) => {
        if (args.where.taskId === "can") {
          // No deletedAt filter on the canonical side: this row may be
          // soft-deleted and still blocks (taskId, userId) uniqueness.
          expect(args.where).not.toHaveProperty("deletedAt");
          return [{ userId: "u1" }];
        }
        return [
          { id: "c_collide", userId: "u1" },
          { id: "c_move", userId: "u2" },
        ];
      },
    );

    const report = await mergeTask({
      canonicalTaskId: "can",
      duplicateTaskId: "dup",
    });

    expect(h.state.tx.taskClaim.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["c_move"] } },
      data: { taskId: "can" },
    });
    expect(report.movedCounts.claims).toBe(1);
    expect(report.skippedCollisions.claims).toBe(1);
  });

  it("moves application-linked comments with their application via the null-then-restore dance", async () => {
    seedTasks({ can: {}, dup: {} });
    h.state.tx.taskApplication.findMany.mockImplementation(
      async (args: { where: Record<string, unknown> }) => {
        if (args.where.taskId === "can") {
          return [{ applicantPersonId: null, applicantUserId: "u1" }];
        }
        return [
          { applicantPersonId: null, applicantUserId: "u1", id: "a_collide" },
          { applicantPersonId: "p2", applicantUserId: null, id: "a_move" },
        ];
      },
    );
    h.state.tx.taskComment.findMany.mockResolvedValue([
      { id: "cm1", taskApplicationId: "a_move" },
    ]);
    h.state.tx.taskComment.count.mockResolvedValue(2);

    const report = await mergeTask({
      canonicalTaskId: "can",
      duplicateTaskId: "dup",
    });

    expect(h.state.tx.taskComment.findMany).toHaveBeenCalledWith({
      where: { taskApplicationId: { in: ["a_move"] }, taskId: "dup" },
      select: { id: true, taskApplicationId: true },
    });
    const commentUpdateCalls = h.state.tx.taskComment.updateMany.mock
      .calls as Array<[{ data: Record<string, unknown> }]>;
    expect(commentUpdateCalls[0][0]).toEqual({
      where: { id: { in: ["cm1"] } },
      data: { taskApplicationId: null },
    });
    expect(h.state.tx.taskApplication.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["a_move"] } },
      data: { taskId: "can" },
    });
    expect(commentUpdateCalls[1][0]).toEqual({
      where: { id: { in: ["cm1"] } },
      data: { taskApplicationId: "a_move", taskId: "can" },
    });
    // Detach → move application → re-attach ordering keeps the compound
    // NoAction FK [taskApplicationId, taskId] valid at every statement.
    const detachOrder =
      h.state.tx.taskComment.updateMany.mock.invocationCallOrder[0];
    const applicationMoveOrder =
      h.state.tx.taskApplication.updateMany.mock.invocationCallOrder[0];
    const reattachOrder =
      h.state.tx.taskComment.updateMany.mock.invocationCallOrder[1];
    expect(detachOrder).toBeLessThan(applicationMoveOrder);
    expect(applicationMoveOrder).toBeLessThan(reattachOrder);
    // Free comments move separately; colliding-application comments stay.
    expect(h.state.tx.taskComment.updateMany).toHaveBeenCalledWith({
      where: { deletedAt: null, taskApplicationId: null, taskId: "dup" },
      data: { taskId: "can" },
    });
    expect(h.state.tx.taskComment.count).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        taskApplicationId: { in: ["a_collide"] },
        taskId: "dup",
      },
    });
    expect(report.movedCounts.applications).toBe(1);
    expect(report.skippedCollisions.applications).toBe(1);
    expect(report.movedCounts.comments).toBe(1);
    expect(report.skippedCollisions.comments).toBe(2);
  });

  it("leaves a payout behind when its claim collided and stayed on the duplicate", async () => {
    seedTasks({ can: {}, dup: {} });
    h.state.tx.taskClaim.findMany.mockImplementation(
      async (args: { where: Record<string, unknown> }) =>
        args.where.taskId === "can"
          ? [{ userId: "u1" }]
          : [{ id: "claim_collide", userId: "u1" }],
    );

    await mergeTask({ canonicalTaskId: "can", duplicateTaskId: "dup" });

    // The collided claim's payout must not move to the canonical.
    expect(h.state.tx.taskPayout.updateMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        taskId: "dup",
        NOT: { taskClaimId: { in: ["claim_collide"] } },
      },
      data: { taskId: "can" },
    });
    expect(h.state.tx.taskPayout.count).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        taskId: "dup",
        taskClaimId: { in: ["claim_collide"] },
      },
    });
  });

  it("moves all payouts unconstrained when no claim collided", async () => {
    seedTasks({ can: {}, dup: {} });

    await mergeTask({ canonicalTaskId: "can", duplicateTaskId: "dup" });

    expect(h.state.tx.taskPayout.updateMany).toHaveBeenCalledWith({
      where: { deletedAt: null, taskId: "dup" },
      data: { taskId: "can" },
    });
  });

  it("canonical adopts the duplicate's current impact estimate set only when it has none", async () => {
    seedTasks({
      can: { currentImpactEstimateSetId: null },
      dup: { currentImpactEstimateSetId: "set_1" },
    });
    h.state.tx.taskImpactEstimateSet.findMany.mockImplementation(
      async (args: { where: Record<string, unknown> }) =>
        args.where.taskId === "dup"
          ? [
              {
                calculationVersion: "v1",
                counterfactualKey: "cf",
                estimateKind: "EX_ANTE",
                id: "set_1",
                methodologyKey: "m",
                parameterSetHash: "h",
                sourceSystem: "OPTIMITRON",
              },
            ]
          : [],
    );

    await mergeTask({ canonicalTaskId: "can", duplicateTaskId: "dup" });

    // The duplicate's @unique back-pointer clears before the set moves.
    expect(h.state.tx.task.update).toHaveBeenCalledWith({
      where: { id: "dup" },
      data: { currentImpactEstimateSetId: null },
    });
    expect(h.state.tx.task.update).toHaveBeenCalledWith({
      where: { id: "can" },
      data: { currentImpactEstimateSetId: "set_1" },
    });
    expect(h.state.tx.taskImpactEstimateSet.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["set_1"] } },
      data: { taskId: "can" },
    });
  });

  it("demotes the duplicate's current impact estimate set when the canonical keeps its own", async () => {
    seedTasks({
      can: { currentImpactEstimateSetId: "set_can" },
      dup: { currentImpactEstimateSetId: "set_1" },
    });
    h.state.tx.taskImpactEstimateSet.findMany.mockImplementation(
      async (args: { where: Record<string, unknown> }) =>
        args.where.taskId === "dup"
          ? [
              {
                calculationVersion: "v1",
                counterfactualKey: "cf",
                estimateKind: "EX_ANTE",
                id: "set_1",
                methodologyKey: "m",
                parameterSetHash: "h",
                sourceSystem: "OPTIMITRON",
              },
            ]
          : [],
    );

    await mergeTask({ canonicalTaskId: "can", duplicateTaskId: "dup" });

    expect(h.state.tx.task.update).not.toHaveBeenCalledWith({
      where: { id: "can" },
      data: { currentImpactEstimateSetId: "set_1" },
    });
    expect(h.state.tx.taskImpactEstimateSet.updateMany).toHaveBeenCalledWith({
      where: { id: "set_1" },
      data: { isCurrent: false },
    });
  });

  it("demotes the duplicate's primary endpoint only when the canonical already has one", async () => {
    seedTasks({ can: {}, dup: {} });
    h.state.tx.taskCommunicationEndpoint.findFirst.mockResolvedValue({
      id: "ep_can",
    });

    await mergeTask({ canonicalTaskId: "can", duplicateTaskId: "dup" });

    expect(h.state.tx.taskCommunicationEndpoint.updateMany).toHaveBeenCalledWith(
      {
        where: { deletedAt: null, isPrimary: true, taskId: "dup" },
        data: { isPrimary: false },
      },
    );
    expect(h.state.tx.taskCommunicationEndpoint.updateMany).toHaveBeenCalledWith(
      {
        where: { deletedAt: null, taskId: "dup" },
        data: { taskId: "can" },
      },
    );
  });
});
