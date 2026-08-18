import { describe, expect, it } from "vitest";

import { compareTaskListValues } from "./task-list-sort";

describe("compareTaskListValues", () => {
  it("uses the task title to stabilize tied primary sort values", () => {
    const alpha = { id: "task-a", title: "Alpha" };
    const bravo = { id: "task-b", title: "Bravo" };

    expect(
      [bravo, alpha]
        .sort((a, b) => compareTaskListValues(a, b, 100, 100, "desc"))
        .map((item) => item.title),
    ).toEqual(["Alpha", "Bravo"]);
  });

  it("uses stable task keys before generated IDs for duplicate titles", () => {
    const first = { id: "z-generated", taskKey: "task-a", title: "Same" };
    const second = { id: "a-generated", taskKey: "task-b", title: "Same" };

    expect(
      [second, first]
        .sort((a, b) => compareTaskListValues(a, b, 100, 100, "desc"))
        .map((item) => item.taskKey),
    ).toEqual(["task-a", "task-b"]);
  });
});
