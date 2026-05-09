import { describe, expect, it } from "vitest";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { selectTreatyPresidentManagementTasks } from "./president-management";

// Regression guard for the president-management task list. Do not delete or
// weaken these tests without Mike's explicit approval: the dashboard and
// /employees page must keep showing the treaty signer task list.

function task(id: string, taskKey: string | null = null): TaskCardTask {
  return {
    id,
    taskKey,
    title: id,
  } as TaskCardTask;
}

describe("selectTreatyPresidentManagementTasks", () => {
  it("finds the treaty parent even when a database still has the legacy root id", () => {
    const treatyParent = task("1-pct-treaty", "program:one-percent-treaty:ratify");
    const signerTask = task(
      "1-pct-treaty-signer-ca",
      "program:one-percent-treaty:signer:ca",
    );

    const result = selectTreatyPresidentManagementTasks({
      allTasks: [signerTask],
      topLevelTasks: [
        {
          ...task(
            "win-earth-optimization-prize",
            "program:earth-optimization-prize:win",
          ),
          childTasks: [treatyParent],
        },
      ],
    });

    expect(result.treatyProgram).toBe(treatyParent);
    expect(result.signerTasks).toEqual([signerTask]);
  });
});
