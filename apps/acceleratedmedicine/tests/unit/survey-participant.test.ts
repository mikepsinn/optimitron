import { describe, expect, it } from "vitest";

import { surveyParticipantSchema } from "@optimitron/site-kit/lib/survey-participant";
import { normalizeUsRegionCode } from "@optimitron/site-kit/lib/us-states";

const base = {
  countryCode: "US",
  regionCode: "MO",
  role: "patient-or-caregiver",
  story: "",
  updates: false,
};

describe("normalizeUsRegionCode", () => {
  it.each([
    ["MO", "MO"],
    ["mo", "MO"],
    ["US-MO", "MO"],
    ["Missouri", "MO"],
    [" missouri ", "MO"],
    ["District of Columbia", "DC"],
    ["Puerto Rico", "PR"],
  ])("maps %j to %s", (input, expected) => {
    expect(normalizeUsRegionCode(input)).toBe(expected);
  });

  it("returns null for anything that is not a US region", () => {
    for (const value of [
      "",
      "   ",
      "Show Me State",
      "Ontario",
      "US-",
      "ZZ",
      undefined,
      null,
    ]) {
      expect(normalizeUsRegionCode(value)).toBeNull();
    }
  });
});

describe("surveyParticipantSchema regionCode", () => {
  it("stores the bare code when a US answer arrives as a name or prefixed code", () => {
    expect(
      surveyParticipantSchema.parse({ ...base, regionCode: "Missouri" })
        .regionCode,
    ).toBe("MO");
    expect(
      surveyParticipantSchema.parse({ ...base, regionCode: "US-MO" })
        .regionCode,
    ).toBe("MO");
  });

  it("rejects a US answer without a known region, on the regionCode path", () => {
    for (const regionCode of ["", "Show Me State"]) {
      const result = surveyParticipantSchema.safeParse({ ...base, regionCode });
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0]?.path).toEqual(["regionCode"]);
    }
  });

  it("keeps free text for other countries and leaves it optional", () => {
    expect(
      surveyParticipantSchema.parse({
        ...base,
        countryCode: "CA",
        regionCode: "Ontario",
      }).regionCode,
    ).toBe("Ontario");
    expect(
      surveyParticipantSchema.safeParse({
        ...base,
        countryCode: "CA",
        regionCode: "",
      }).success,
    ).toBe(true);
  });
});
