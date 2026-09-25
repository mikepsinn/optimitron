import { describe, expect, it } from "vitest";
import { OPTIMIZE_EARTH_TASK_TREE } from "@optimitron/db/managed-data";
import { TASK_TREE_PATH } from "./landing-data";

describe("TASK_TREE_PATH", () => {
  const byKey = new Map(OPTIMIZE_EARTH_TASK_TREE.map((task) => [task.taskKey, task]));
  const byId = new Map(OPTIMIZE_EARTH_TASK_TREE.map((task) => [task.id, task]));

  it("uses the managed tree's titles", () => {
    for (const node of TASK_TREE_PATH) {
      expect(byKey.get(node.taskKey)?.title, node.taskKey).toBe(node.title);
    }
  });

  it("nests each task under its parent in the managed tree", () => {
    TASK_TREE_PATH.forEach((node, index) => {
      if (node.depth === 0) return;
      const parent = TASK_TREE_PATH.slice(0, index)
        .reverse()
        .find((candidate) => candidate.depth === node.depth - 1);
      const task = byKey.get(node.taskKey);
      const treeParent = task?.parentTaskId ? byId.get(task.parentTaskId) : undefined;
      expect(treeParent?.taskKey, node.taskKey).toBe(parent?.taskKey);
    });
  });
});
