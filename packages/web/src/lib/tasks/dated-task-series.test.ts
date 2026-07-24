import { describe, expect, it } from "vitest";
import { getSupersededDatedTaskIds } from "./dated-task-series";

describe("getSupersededDatedTaskIds", () => {
  it("supersedes past recurrence rows when a newer instance exists", () => {
    const superseded = getSupersededDatedTaskIds(
      [
        {
          dueAt: "2026-07-23T14:00:00.000Z",
          id: "sleep-23",
          parentTaskId: "health",
          taskKey: "personal:health:sleep-window-2026-07-23",
          title: "Sleep eight hours",
        },
        {
          dueAt: "2026-07-24T14:00:00.000Z",
          id: "sleep-24",
          parentTaskId: "health",
          taskKey: "personal:health:sleep-window-2026-07-24",
          title: "Sleep 8 hours",
        },
      ],
      new Date("2026-07-24T16:00:00.000Z"),
    );

    expect([...superseded]).toEqual(["sleep-23"]);
  });

  it("does not hide an earlier instance before its due time", () => {
    const superseded = getSupersededDatedTaskIds(
      [
        {
          dueAt: "2026-07-24T22:00:00.000Z",
          id: "medication-24",
          parentTaskId: "health",
          taskKey: "personal:health:medication-2026-07-24",
          title: "Take medication",
        },
        {
          dueAt: "2026-07-25T22:00:00.000Z",
          id: "medication-25",
          parentTaskId: "health",
          taskKey: "personal:health:medication-2026-07-25",
          title: "Take medication",
        },
      ],
      new Date("2026-07-24T16:00:00.000Z"),
    );

    expect([...superseded]).toEqual([]);
  });
});
