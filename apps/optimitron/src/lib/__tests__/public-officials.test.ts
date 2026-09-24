import { describe, expect, it } from "vitest";
import { isPublicOfficialPerson } from "@/lib/public-officials";

describe("isPublicOfficialPerson", () => {
  it("counts public figures with an officeholder source key", () => {
    expect(isPublicOfficialPerson({ isPublicFigure: true, sourceRef: "wikidata:Q22686" })).toBe(true);
    expect(isPublicOfficialPerson({ isPublicFigure: true, sourceRef: "Bioguide:S000148" })).toBe(true);
  });

  it("does not count public figures who hold no office", () => {
    expect(isPublicOfficialPerson({ isPublicFigure: true, sourceRef: "wishonia:system" })).toBe(false);
    expect(
      isPublicOfficialPerson({ isPublicFigure: true, sourceRef: "famous-disease-death:steve-jobs" }),
    ).toBe(false);
    expect(isPublicOfficialPerson({ isPublicFigure: true, sourceRef: null })).toBe(false);
  });

  it("does not count officeholder keys on records that are not public figures", () => {
    expect(isPublicOfficialPerson({ isPublicFigure: false, sourceRef: "wikidata:Q22686" })).toBe(false);
  });
});
