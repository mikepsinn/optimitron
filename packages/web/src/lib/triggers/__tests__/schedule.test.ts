import { describe, expect, it } from "vitest";
import { isScheduleDue } from "../schedule";

describe("triggers/schedule/isScheduleDue", () => {
  it("returns true when never fired before", () => {
    const now = new Date("2026-04-29T12:00:00Z");
    expect(isScheduleDue("0 * * * *", null, now)).toBe(true);
  });

  it("returns true when at least one tick has elapsed since last fire", () => {
    const lastFire = new Date("2026-04-29T11:00:00Z");
    const now = new Date("2026-04-29T12:00:00Z");
    // hourly schedule: 12:00 tick is between (11:00, 12:00]
    expect(isScheduleDue("0 * * * *", lastFire, now)).toBe(true);
  });

  it("returns false when no tick has elapsed since last fire", () => {
    const lastFire = new Date("2026-04-29T12:00:00Z");
    const now = new Date("2026-04-29T12:30:00Z");
    // hourly schedule: next tick is 13:00, not in window
    expect(isScheduleDue("0 * * * *", lastFire, now)).toBe(false);
  });

  it("returns false on invalid cron expression", () => {
    expect(isScheduleDue("not a cron expression", null, new Date())).toBe(false);
  });

  it("respects fine-grained schedules", () => {
    const lastFire = new Date("2026-04-29T12:00:00Z");
    // every 5 min
    const dueAfter5 = new Date("2026-04-29T12:05:00Z");
    const notDueAfter3 = new Date("2026-04-29T12:03:00Z");
    expect(isScheduleDue("*/5 * * * *", lastFire, dueAfter5)).toBe(true);
    expect(isScheduleDue("*/5 * * * *", lastFire, notDueAfter3)).toBe(false);
  });

  it("does not double-fire when only milliseconds have passed since last fire", () => {
    const lastFire = new Date("2026-04-29T12:00:00.000Z");
    const oneSecondLater = new Date("2026-04-29T12:00:01.000Z");
    // Hourly schedule. Last fire was at 12:00:00. Even though 1s elapsed,
    // the next tick is 13:00, well outside the (lastFire, now] window.
    expect(isScheduleDue("0 * * * *", lastFire, oneSecondLater)).toBe(false);
  });
});
