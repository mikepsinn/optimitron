import { describe, expect, it } from "vitest";
import {
  getStartOfZonedDayUtc,
  getZonedDateKey,
  getZonedDateTimeUtc,
  parseDateKey,
  shiftDateKey,
} from "./time-zone";

describe("time-zone helpers", () => {
  it("converts Chicago wall time to UTC during daylight saving time", () => {
    expect(
      getZonedDateTimeUtc(
        {
          day: 14,
          hour: 8,
          minute: 30,
          month: 7,
          second: 0,
          year: 2026,
        },
        "America/Chicago",
      ).toISOString(),
    ).toBe("2026-07-14T13:30:00.000Z");
  });

  it("uses the midnight offset on a DST transition day", () => {
    expect(
      getStartOfZonedDayUtc(
        { day: 8, month: 3, year: 2026 },
        "America/Chicago",
      ).toISOString(),
    ).toBe("2026-03-08T06:00:00.000Z");
  });

  it("validates and shifts date keys without relying on the host time zone", () => {
    expect(parseDateKey("2026-02-29")).toBeNull();
    expect(shiftDateKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(
      getZonedDateKey(new Date("2026-07-14T02:00:00.000Z"), "America/Chicago"),
    ).toBe("2026-07-13");
  });
});
