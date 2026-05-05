import { describe, expect, it } from "vitest";
import { selectActionableTreatyTasks } from "./treaty-dashboard-tasks";

const PARENT_ID = "treaty-task-id";

function makeSubtask(input: {
  id: string;
  taskKey: string;
  status?: string;
  sortOrder?: number | null;
}) {
  return {
    id: input.id,
    parentTaskId: PARENT_ID,
    status: input.status ?? "ACTIVE",
    sortOrder: input.sortOrder ?? 0,
    taskKey: input.taskKey,
  };
}

describe("selectActionableTreatyTasks", () => {
  it("excludes the :completeTraining gate from nextTasks even when sortOrder would put it first", () => {
    // Regression: production stored the completeTraining task with
    // sortOrder=30 (drift from old blueprint), which made it sort before
    // the assignSecondHuman subtask and surface as the dashboard's
    // "Your next task" — landing the user on the literal description
    // "You don't action this one directly."
    const tasks = [
      makeSubtask({
        id: "complete-id",
        taskKey: "program:one-percent-treaty:user:u1:completeTraining",
        sortOrder: 30,
      }),
      makeSubtask({
        id: "sign-id",
        taskKey: "program:one-percent-treaty:user:u1:signTreatyPersonally",
        sortOrder: 0,
      }),
      makeSubtask({
        id: "share-id",
        taskKey: "program:one-percent-treaty:user:u1:shareReferralUrl",
        sortOrder: 10,
      }),
    ];
    const { nextTasks } = selectActionableTreatyTasks({
      createdPrivateTasks: tasks,
      treatyTaskId: PARENT_ID,
    });
    expect(nextTasks.map((t) => t.id)).toEqual(["sign-id", "share-id"]);
  });

  it("excludes the :completeTraining gate from completedTasks (not a user-facing item)", () => {
    const tasks = [
      makeSubtask({
        id: "complete-id",
        taskKey: "program:one-percent-treaty:user:u1:completeTraining",
        status: "VERIFIED",
        sortOrder: 50,
      }),
      makeSubtask({
        id: "sign-id",
        taskKey: "program:one-percent-treaty:user:u1:signTreatyPersonally",
        status: "VERIFIED",
        sortOrder: 0,
      }),
    ];
    const { completedTasks } = selectActionableTreatyTasks({
      createdPrivateTasks: tasks,
      treatyTaskId: PARENT_ID,
    });
    expect(completedTasks.map((t) => t.id)).toEqual(["sign-id"]);
  });

  it("orders the actionable next tasks by sortOrder ascending", () => {
    const tasks = [
      makeSubtask({ id: "phone", taskKey: "x:phoneScript", sortOrder: 20 }),
      makeSubtask({
        id: "sign",
        taskKey: "x:signTreatyPersonally",
        sortOrder: 0,
      }),
      makeSubtask({
        id: "share",
        taskKey: "x:shareReferralUrl",
        sortOrder: 10,
      }),
      makeSubtask({
        id: "first",
        taskKey: "x:assignFirstHuman",
        sortOrder: 30,
      }),
    ];
    const { nextTasks } = selectActionableTreatyTasks({
      createdPrivateTasks: tasks,
      treatyTaskId: PARENT_ID,
    });
    expect(nextTasks.map((t) => t.id)).toEqual([
      "sign",
      "share",
      "phone",
      "first",
    ]);
  });

  it("filters out the parent treaty task itself even if it appears in createdPrivateTasks", () => {
    const tasks = [
      makeSubtask({ id: PARENT_ID, taskKey: "x:parent" }),
      makeSubtask({
        id: "sign",
        taskKey: "x:signTreatyPersonally",
        sortOrder: 0,
      }),
    ];
    const { nextTasks } = selectActionableTreatyTasks({
      createdPrivateTasks: tasks,
      treatyTaskId: PARENT_ID,
    });
    expect(nextTasks.map((t) => t.id)).toEqual(["sign"]);
  });

  it("filters out STALE tasks", () => {
    const tasks = [
      makeSubtask({
        id: "stale",
        taskKey: "x:phoneScript",
        status: "STALE",
        sortOrder: 0,
      }),
      makeSubtask({
        id: "sign",
        taskKey: "x:signTreatyPersonally",
        sortOrder: 10,
      }),
    ];
    const { nextTasks, completedTasks } = selectActionableTreatyTasks({
      createdPrivateTasks: tasks,
      treatyTaskId: PARENT_ID,
    });
    expect(nextTasks.map((t) => t.id)).toEqual(["sign"]);
    expect(completedTasks).toEqual([]);
  });

  it("filters out tasks with a different parent (not in this treaty tree)", () => {
    const tasks = [
      {
        ...makeSubtask({ id: "other", taskKey: "x:other" }),
        parentTaskId: "different-parent",
      },
      makeSubtask({ id: "sign", taskKey: "x:signTreatyPersonally" }),
    ];
    const { nextTasks } = selectActionableTreatyTasks({
      createdPrivateTasks: tasks,
      treatyTaskId: PARENT_ID,
    });
    expect(nextTasks.map((t) => t.id)).toEqual(["sign"]);
  });
});
