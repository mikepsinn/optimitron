import { describe, expect, it } from "vitest";
import {
  buildExtensionAgenda,
  toExtensionAgendaTask,
  type ExtensionAgendaSourceTask,
} from "./agenda";

const NOW = new Date("2026-07-10T17:00:00.000Z");

function source(
  overrides: Partial<ExtensionAgendaSourceTask> & { id: string },
): ExtensionAgendaSourceTask {
  return { title: overrides.id, ...overrides };
}

function hoursFromNow(hours: number): Date {
  return new Date(NOW.getTime() + hours * 3_600_000);
}

describe("toExtensionAgendaTask", () => {
  it("prefers the marginal frame EV over the direct frame", () => {
    const task = toExtensionAgendaTask(
      source({
        id: "a",
        marginalImpactFrame: { expectedEconomicValueUsdBase: 900 },
        selectedImpactFrame: { expectedEconomicValueUsdBase: 100 },
      }),
    );
    expect(task.ev).toBe(900);
  });

  it("falls back to the direct frame, then null", () => {
    expect(
      toExtensionAgendaTask(
        source({
          id: "a",
          marginalImpactFrame: null,
          selectedImpactFrame: { expectedEconomicValueUsdBase: 100 },
        }),
      ).ev,
    ).toBe(100);
    expect(toExtensionAgendaTask(source({ id: "b" })).ev).toBeNull();
  });

  it("serializes Date dueAt to ISO and keeps null", () => {
    expect(
      toExtensionAgendaTask(source({ id: "a", dueAt: NOW })).dueAt,
    ).toBe("2026-07-10T17:00:00.000Z");
    expect(toExtensionAgendaTask(source({ id: "b" })).dueAt).toBeNull();
  });
});

describe("buildExtensionAgenda", () => {
  it("orders overdue asc, then future asc, then unscheduled by EV desc", () => {
    const agenda = buildExtensionAgenda(
      [
        source({ id: "undated-low", marginalImpactFrame: { expectedEconomicValueUsdBase: 5 } }),
        source({ id: "future-late", dueAt: hoursFromNow(6) }),
        source({ id: "overdue-old", dueAt: hoursFromNow(-4) }),
        source({ id: "undated-high", marginalImpactFrame: { expectedEconomicValueUsdBase: 5000 } }),
        source({ id: "future-soon", dueAt: hoursFromNow(1) }),
        source({ id: "overdue-new", dueAt: hoursFromNow(-1) }),
      ],
      NOW,
    );
    expect(agenda.tasks.map((t) => t.id)).toEqual([
      "overdue-old",
      "overdue-new",
      "future-soon",
      "future-late",
      "undated-high",
      "undated-low",
    ]);
  });

  it("pins the top task as nextAction and lists overdue as reminders", () => {
    const agenda = buildExtensionAgenda(
      [
        source({ id: "future", dueAt: hoursFromNow(2) }),
        source({ id: "overdue", dueAt: hoursFromNow(-2) }),
      ],
      NOW,
    );
    expect(agenda.nextAction?.id).toBe("overdue");
    expect(agenda.reminders.map((t) => t.id)).toEqual(["overdue"]);
  });

  it("returns an empty agenda for no tasks", () => {
    const agenda = buildExtensionAgenda([], NOW);
    expect(agenda.nextAction).toBeNull();
    expect(agenda.tasks).toEqual([]);
    expect(agenda.reminders).toEqual([]);
  });
});
