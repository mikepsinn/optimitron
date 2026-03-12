import { describe, expect, it } from "vitest";
import {
  HEALTH_VARIABLE_NAME,
  HAPPINESS_VARIABLE_NAME,
  buildDailyCheckInHistory,
  dailyCheckInInputSchema,
  getUtcDayBounds,
  profileSnapshotInputSchema,
  summarizeNumericValues,
} from "@/lib/profile";

describe("profile schemas", () => {
  it("normalizes blank census fields to null", () => {
    const result = profileSnapshotInputSchema.parse({
      city: "  ",
      countryCode: " US ",
      householdSize: "",
      timeZone: "",
    });

    expect(result.city).toBeNull();
    expect(result.countryCode).toBe("US");
    expect(result.householdSize).toBeNull();
    expect(result.timeZone).toBeNull();
  });

  it("rejects partial profile coordinates", () => {
    const result = profileSnapshotInputSchema.safeParse({
      latitude: 30.2,
    });

    expect(result.success).toBe(false);
  });

  it("validates daily check-in ratings", () => {
    const result = dailyCheckInInputSchema.parse({
      healthRating: "4",
      happinessRating: 5,
      note: "Feeling solid.",
    });

    expect(result.healthRating).toBe(4);
    expect(result.happinessRating).toBe(5);
  });
});

describe("profile utilities", () => {
  it("returns UTC day bounds", () => {
    const { start, end } = getUtcDayBounds(new Date("2026-03-11T18:45:10.000Z"));

    expect(start.toISOString()).toBe("2026-03-11T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-12T00:00:00.000Z");
  });

  it("summarizes numeric values", () => {
    expect(summarizeNumericValues([1, 3, 5, 7])).toEqual({
      count: 4,
      max: 7,
      mean: 4,
      median: 4,
      min: 1,
      standardDeviation: Math.sqrt(5),
      uniqueCount: 4,
      variance: 5,
    });
  });

  it("builds check-in history with one row per day", () => {
    const history = buildDailyCheckInHistory([
      {
        globalVariableName: HEALTH_VARIABLE_NAME,
        note: "Morning check-in",
        startTime: "2026-03-11T12:00:00.000Z",
        value: 4,
      },
      {
        globalVariableName: HAPPINESS_VARIABLE_NAME,
        startTime: "2026-03-11T12:05:00.000Z",
        value: 5,
      },
      {
        globalVariableName: HEALTH_VARIABLE_NAME,
        startTime: "2026-03-10T12:00:00.000Z",
        value: 3,
      },
    ]);

    expect(history).toEqual([
      {
        date: "2026-03-11",
        happinessRating: 5,
        healthRating: 4,
        note: "Morning check-in",
      },
      {
        date: "2026-03-10",
        happinessRating: null,
        healthRating: 3,
        note: null,
      },
    ]);
  });
});
