import { describe, expect, it, vi } from "vitest";
import {
  listIterationSourceKeys,
  resolveIterationSource,
} from "../iteration-sources";

describe("triggers/iteration-sources", () => {
  it("registers `none` and `overdue-tasks`", () => {
    expect(listIterationSourceKeys()).toEqual(
      expect.arrayContaining(["none", "overdue-tasks"]),
    );
  });

  it("`none` returns a single synthetic record (one fire, no iteration)", async () => {
    const resolver = resolveIterationSource("none");
    expect(resolver).not.toBeNull();
    const records = await resolver!({} as never);
    expect(records).toHaveLength(1);
    expect(records[0]?.contextKey).toBe("");
    expect(records[0]?.priorSendCount).toBe(0);
  });

  it("null/undefined input falls back to `none`", async () => {
    const fromNull = resolveIterationSource(null);
    const fromUndef = resolveIterationSource(undefined);
    expect(fromNull).not.toBeNull();
    expect(fromUndef).not.toBeNull();
    expect(await fromNull!({} as never)).toHaveLength(1);
  });

  it("unknown key returns null", () => {
    expect(resolveIterationSource("definitely-not-a-real-source")).toBeNull();
  });

  it("`overdue-tasks` queries Task with correct shape", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: "t1",
        taskKey: "demo:1",
        title: "Demo",
        createdByUserId: "u1",
        assigneePersonId: null,
        assigneeOrganizationId: null,
        parentTaskId: null,
        dueAt: new Date("2026-01-01"),
        createdAt: new Date("2026-01-01"),
      },
    ]);
    const resolver = resolveIterationSource("overdue-tasks");
    const records = await resolver!({ task: { findMany } } as never);
    expect(records).toHaveLength(1);
    expect(records[0]?.contextKey).toBe("task");
    expect(records[0]?.record).toMatchObject({ id: "t1", taskKey: "demo:1" });
    // Verify the where clause shape
    expect(findMany).toHaveBeenCalledTimes(1);
    const call = findMany.mock.calls[0]![0]!;
    expect(call.where).toMatchObject({
      deletedAt: null,
      dueAt: { lt: expect.any(Date) },
    });
    expect(call.where.status).toMatchObject({ notIn: expect.arrayContaining(["VERIFIED", "STALE"]) });
  });
});
