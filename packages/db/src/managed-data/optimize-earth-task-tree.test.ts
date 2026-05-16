import { describe, expect, it } from "vitest";
import { OPTIMIZE_EARTH_ROOT_TASK_ID } from "../task-keys.js";
import { OPTIMIZE_EARTH_TASK_TREE } from "./optimize-earth-task-tree.js";

describe("OPTIMIZE_EARTH_TASK_TREE", () => {
  const root = OPTIMIZE_EARTH_TASK_TREE.find(
    (task) => task.id === OPTIMIZE_EARTH_ROOT_TASK_ID,
  );

  it("has the root task", () => {
    expect(root).toBeDefined();
  });

  // Regression: without `dueAt` set, `getTaskDelayStats` returns
  // `currentDelayDays = 0`, which zeroes out `currentEconomicValueUsdLost` and
  // `currentHumanLivesLost`. The /tasks page then renders the root row with no
  // deaths-from-delay / wasted-by-delay even though the per-day rates from the
  // impact frame are populated.
  it("has an overdue dueAt so the root row shows non-zero cost of delay", () => {
    // Use a fixed reference instead of `Date.now()` so the assertion does not
    // depend on the wall clock. The root dueAt is intentionally in the past
    // (it's a missed treaty deadline); compare against a clearly post-deadline
    // anchor that pre-dates the test author's typing speed.
    const POST_DEADLINE_ANCHOR = new Date("2025-01-01T00:00:00Z").getTime();
    expect(root?.dueAt).toBeInstanceOf(Date);
    expect(root?.dueAt!.getTime()).toBeLessThan(POST_DEADLINE_ANCHOR);
  });

  it("has parentTaskId null (it's the root)", () => {
    expect(root?.parentTaskId).toBeNull();
  });
});
