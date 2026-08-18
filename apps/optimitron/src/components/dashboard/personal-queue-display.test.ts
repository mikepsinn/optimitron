import { describe, expect, it } from "vitest";
import {
  deadlineChip,
  formatDuration,
  summarizeIssueSeverities,
} from "./personal-queue-display";

describe("deadlineChip", () => {
  it("marks missed, overdue, and start-now deadlines urgent", () => {
    expect(
      deadlineChip({ deadlineStatus: "missed", timeUntilDueHours: -5 }),
    ).toEqual({ label: "required deadline missed", urgent: true });
    expect(
      deadlineChip({ deadlineStatus: "overdue", timeUntilDueHours: -5 }),
    ).toEqual({ label: "overdue", urgent: true });
    expect(
      deadlineChip({ deadlineStatus: "start_now", timeUntilDueHours: 3 }),
    ).toEqual({ label: "start now to make the deadline", urgent: true });
  });

  it("shows non-urgent chips for expired and dated future deadlines", () => {
    expect(
      deadlineChip({ deadlineStatus: "expired", timeUntilDueHours: -1 }),
    ).toEqual({ label: "expired", urgent: false });
    expect(
      deadlineChip({ deadlineStatus: "future", timeUntilDueHours: 30 }),
    ).toEqual({ label: "due in 30h", urgent: false });
  });

  it("returns no chip without a deadline or without a due time", () => {
    expect(
      deadlineChip({ deadlineStatus: "none", timeUntilDueHours: null }),
    ).toBeNull();
    expect(
      deadlineChip({ deadlineStatus: "future", timeUntilDueHours: null }),
    ).toBeNull();
  });
});

describe("formatDuration", () => {
  it("switches units at the hour and two-day marks", () => {
    expect(formatDuration(0.4)).toBe("under an hour");
    expect(formatDuration(47)).toBe("47h");
    expect(formatDuration(48)).toBe("2d");
    expect(formatDuration(240)).toBe("10d");
  });
});

describe("summarizeIssueSeverities", () => {
  it("counts severities in high/medium/low order and skips absent ones", () => {
    expect(
      summarizeIssueSeverities([
        { code: "a", message: "", severity: "low" },
        { code: "b", message: "", severity: "high" },
        { code: "c", message: "", severity: "low" },
      ]),
    ).toBe("1 high · 2 low");
  });

  it("returns null for no issues", () => {
    expect(summarizeIssueSeverities([])).toBeNull();
  });
});
