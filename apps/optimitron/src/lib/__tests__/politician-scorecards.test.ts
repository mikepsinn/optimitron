import { describe, expect, it } from "vitest";

import {
  findPoliticianScorecard,
  getPoliticianScorecardData,
} from "@/lib/politician-scorecards";

describe("politician scorecards", () => {
  // The pages rendered an empty list for months when the loader silently
  // returned nothing after the app moved directories.
  it("loads the generated members and presidents", () => {
    const data = getPoliticianScorecardData();

    expect(data.scorecards.length).toBeGreaterThan(0);
    expect(data.presidents.length).toBeGreaterThan(0);
    expect(data.systemWideRatio).toBeGreaterThan(0);
  });

  it("finds a member from a lower-case route segment", () => {
    const [member] = getPoliticianScorecardData().scorecards;

    expect(findPoliticianScorecard(member!.bioguideId.toLowerCase())).toBe(member);
    expect(findPoliticianScorecard("VISUAL0000")).toBeUndefined();
  });
});
