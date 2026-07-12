import { describe, expect, it } from "vitest";
import { isQuietHours, isWithinWindow, zonedHHMM } from "./quiet-hours.js";

// America/Chicago is UTC-6 (CST) on 2026-01-15 and UTC-5 (CDT) on 2026-07-15.
// Fixed UTC instants keep these assertions independent of the runner's zone.

describe("zonedHHMM", () => {
  it("converts a UTC instant to Chicago wall time (CST, UTC-6)", () => {
    expect(zonedHHMM(new Date("2026-01-15T05:45:00Z"), "America/Chicago")).toBe(
      "23:45",
    );
  });

  it("converts a UTC instant to Chicago wall time (CDT, UTC-5)", () => {
    expect(zonedHHMM(new Date("2026-07-15T13:00:00Z"), "America/Chicago")).toBe(
      "08:00",
    );
  });

  it("renders midnight as 00, not 24", () => {
    expect(zonedHHMM(new Date("2026-01-15T06:00:00Z"), "America/Chicago")).toBe(
      "00:00",
    );
  });
});

describe("isWithinWindow", () => {
  it("handles a window that wraps midnight", () => {
    expect(isWithinWindow("23:30", "23:30", "08:30")).toBe(true);
    expect(isWithinWindow("00:15", "23:30", "08:30")).toBe(true);
    expect(isWithinWindow("08:29", "23:30", "08:30")).toBe(true);
    expect(isWithinWindow("08:30", "23:30", "08:30")).toBe(false); // end exclusive
    expect(isWithinWindow("12:00", "23:30", "08:30")).toBe(false);
    expect(isWithinWindow("23:29", "23:30", "08:30")).toBe(false);
  });

  it("handles a non-wrapping window", () => {
    expect(isWithinWindow("10:00", "09:00", "17:00")).toBe(true);
    expect(isWithinWindow("17:00", "09:00", "17:00")).toBe(false);
  });
});

describe("isQuietHours (23:30–08:30 America/Chicago)", () => {
  it("is quiet at 23:45 Chicago winter time", () => {
    // 23:45 CST = 05:45 UTC next day
    expect(isQuietHours(new Date("2026-01-16T05:45:00Z"))).toBe(true);
  });

  it("is quiet at 02:00 Chicago summer time", () => {
    // 02:00 CDT = 07:00 UTC
    expect(isQuietHours(new Date("2026-07-15T07:00:00Z"))).toBe(true);
  });

  it("ends exactly at 08:30 Chicago", () => {
    // 08:29 CDT = 13:29 UTC → quiet; 08:30 CDT = 13:30 UTC → not quiet
    expect(isQuietHours(new Date("2026-07-15T13:29:00Z"))).toBe(true);
    expect(isQuietHours(new Date("2026-07-15T13:30:00Z"))).toBe(false);
  });

  it("is not quiet midday Chicago", () => {
    // 12:00 CST = 18:00 UTC
    expect(isQuietHours(new Date("2026-01-15T18:00:00Z"))).toBe(false);
  });
});
