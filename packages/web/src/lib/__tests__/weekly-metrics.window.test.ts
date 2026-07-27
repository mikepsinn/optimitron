import { describe, expect, it } from "vitest";
import { getWeeklyWindows } from "@/lib/weekly-metrics.server";

// The one piece of real branching logic in the metrics module. An off-by-one
// here silently double-counts or drops a day at the window seam, which
// corrupts every week-over-week delta the loop steers by.
describe("getWeeklyWindows", () => {
  it("makes previous.end exactly current.start with no gap or overlap", () => {
    const ref = new Date("2026-07-27T13:00:00.000Z");
    const { current, previous } = getWeeklyWindows(ref);
    expect(previous.lt.getTime()).toBe(current.gte.getTime());
  });

  it("spans exactly seven days per window", () => {
    const ref = new Date("2026-07-27T13:00:00.000Z");
    const { current, previous } = getWeeklyWindows(ref);
    const week = 7 * 24 * 60 * 60 * 1000;
    expect(current.lt.getTime() - current.gte.getTime()).toBe(week);
    expect(previous.lt.getTime() - previous.gte.getTime()).toBe(week);
  });

  it("ends the current window at the reference instant, exclusive", () => {
    const ref = new Date("2026-07-27T13:00:00.000Z");
    const { current } = getWeeklyWindows(ref);
    expect(current.lt.toISOString()).toBe(ref.toISOString());
  });
});
