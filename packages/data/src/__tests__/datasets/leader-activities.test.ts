import { describe, expect, it } from "vitest";
import { LEADER_ACTIVITIES } from "../../datasets/leader-activities";

describe("leader activity dataset", () => {
  it("exports structured activity records from @optimitron/data", () => {
    expect(LEADER_ACTIVITIES.length).toBeGreaterThan(0);
    expect(LEADER_ACTIVITIES.every((activity) => activity.countryCode.length === 2)).toBe(true);
    expect(LEADER_ACTIVITIES.every((activity) => activity.activitySlug.length > 0)).toBe(true);
    expect(LEADER_ACTIVITIES.every((activity) => activity.sourceUrl.startsWith("https://"))).toBe(true);
  });

  it("covers multiple governments and keeps the dataset generic", () => {
    const countries = new Set(LEADER_ACTIVITIES.map((activity) => activity.countryCode));
    const datasetJson = JSON.stringify(LEADER_ACTIVITIES);

    expect(countries.has("US")).toBe(true);
    expect(countries.has("RU")).toBe(true);
    expect(datasetJson.toLowerCase()).not.toContain("taskkey");
  });
});
