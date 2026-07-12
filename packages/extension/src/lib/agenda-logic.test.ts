import { describe, expect, it } from "vitest";
import {
  compareAgendaTasks,
  isOverdue,
  partitionAgenda,
  selectNextAction,
  snoozeUntil,
  sortAgendaTasks,
  type AgendaTask,
} from "./agenda-logic.js";

// Local-noon anchor so local-day partitioning is deterministic regardless of
// the runner's UTC offset (any offset within ±11h keeps this on the same day).
const NOW = new Date(2026, 6, 10, 12, 0, 0); // 2026-07-10 12:00 local

function task(overrides: Partial<AgendaTask> & { id: string }): AgendaTask {
  return {
    dueAt: null,
    estimatedEffortHours: null,
    ev: null,
    title: overrides.id,
    ...overrides,
  };
}

function localIso(hoursFromNow: number): string {
  return new Date(NOW.getTime() + hoursFromNow * 3_600_000).toISOString();
}

describe("isOverdue", () => {
  it("is true only for dated tasks at or before now", () => {
    expect(isOverdue(task({ id: "a", dueAt: localIso(-1) }), NOW)).toBe(true);
    expect(isOverdue(task({ id: "b", dueAt: NOW.toISOString() }), NOW)).toBe(true);
    expect(isOverdue(task({ id: "c", dueAt: localIso(1) }), NOW)).toBe(false);
    expect(isOverdue(task({ id: "d" }), NOW)).toBe(false);
  });
});

describe("sortAgendaTasks", () => {
  it("orders overdue (earliest first), then future by due, then unscheduled by EV desc", () => {
    const tasks = [
      task({ id: "undated-low", ev: 10 }),
      task({ id: "future-2", dueAt: localIso(4) }),
      task({ id: "overdue-old", dueAt: localIso(-5) }),
      task({ id: "undated-high", ev: 5000 }),
      task({ id: "future-1", dueAt: localIso(2) }),
      task({ id: "overdue-new", dueAt: localIso(-1) }),
    ];
    expect(sortAgendaTasks(tasks, NOW).map((t) => t.id)).toEqual([
      "overdue-old",
      "overdue-new",
      "future-1",
      "future-2",
      "undated-high",
      "undated-low",
    ]);
  });

  it("breaks EV ties among unscheduled tasks by title", () => {
    const tasks = [
      task({ id: "2", title: "Zeta", ev: 100 }),
      task({ id: "1", title: "Alpha", ev: 100 }),
    ];
    expect(sortAgendaTasks(tasks, NOW).map((t) => t.title)).toEqual([
      "Alpha",
      "Zeta",
    ]);
  });

  it("treats missing EV as lowest priority among unscheduled", () => {
    const withEv = task({ id: "with-ev", ev: 1 });
    const withoutEv = task({ id: "no-ev" });
    expect(compareAgendaTasks(withEv, withoutEv, NOW)).toBeLessThan(0);
  });

  it("does not mutate the input array", () => {
    const tasks = [
      task({ id: "b", dueAt: localIso(2) }),
      task({ id: "a", dueAt: localIso(1) }),
    ];
    sortAgendaTasks(tasks, NOW);
    expect(tasks.map((t) => t.id)).toEqual(["b", "a"]);
  });
});

describe("selectNextAction", () => {
  it("returns the top-sorted task", () => {
    const next = selectNextAction(
      [task({ id: "later", dueAt: localIso(3) }), task({ id: "now", dueAt: localIso(-1) })],
      NOW,
    );
    expect(next?.id).toBe("now");
  });

  it("returns null for an empty agenda", () => {
    expect(selectNextAction([], NOW)).toBeNull();
  });
});

describe("partitionAgenda", () => {
  it("splits into overdue / today / later / unscheduled", () => {
    const partition = partitionAgenda(
      [
        task({ id: "overdue", dueAt: localIso(-2) }),
        task({ id: "today", dueAt: localIso(5) }), // 17:00 same local day
        task({ id: "later", dueAt: localIso(30) }), // next local day
        task({ id: "unscheduled" }),
      ],
      NOW,
    );
    expect(partition.overdue.map((t) => t.id)).toEqual(["overdue"]);
    expect(partition.today.map((t) => t.id)).toEqual(["today"]);
    expect(partition.later.map((t) => t.id)).toEqual(["later"]);
    expect(partition.unscheduled.map((t) => t.id)).toEqual(["unscheduled"]);
  });
});

describe("snoozeUntil", () => {
  it("10m adds ten minutes", () => {
    expect(snoozeUntil("10m", NOW).getTime()).toBe(NOW.getTime() + 600_000);
  });

  it("1h adds one hour", () => {
    expect(snoozeUntil("1h", NOW).getTime()).toBe(NOW.getTime() + 3_600_000);
  });

  it("tonight before 20:00 local lands on today 20:00", () => {
    const result = snoozeUntil("tonight", NOW);
    expect(result.getHours()).toBe(20);
    expect(result.getMinutes()).toBe(0);
    expect(result.getDate()).toBe(NOW.getDate());
  });

  it("tonight at/after 20:00 local rolls to tomorrow 09:00", () => {
    const evening = new Date(2026, 6, 10, 21, 15, 0);
    const result = snoozeUntil("tonight", evening);
    expect(result.getHours()).toBe(9);
    expect(result.getDate()).toBe(11);
  });
});
