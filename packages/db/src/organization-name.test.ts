import { describe, expect, it } from "vitest";
import { normalizeOrganizationName } from "./organization-name.js";
import {
  OrganizationNameKindSchema,
  OrganizationNameSchema,
} from "./zod/index.js";

describe("normalizeOrganizationName", () => {
  it("normalizes case, punctuation, apostrophes, and whitespace", () => {
    expect(
      normalizeOrganizationName("  Meridian  Research Foundation, Inc.  "),
    ).toBe("meridian research foundation inc");
    expect(normalizeOrganizationName("Mike's Research Org")).toBe(
      "mikes research org",
    );
    expect(normalizeOrganizationName("Mike\u2019s Research Org!!!")).toBe(
      "mikes research org",
    );
  });

  it("preserves letters and numbers from non-English organization names", () => {
    expect(normalizeOrganizationName("Institut M\u00e9dical 2.0")).toBe(
      "institut m\u00e9dical 2 0",
    );
    expect(normalizeOrganizationName("Institut Me\u0301dical")).toBe(
      "institut m\u00e9dical",
    );
  });

  it("validates the persisted name kinds and model shape", () => {
    expect(OrganizationNameKindSchema.options).toEqual([
      "LEGAL",
      "DBA",
      "ACRONYM",
      "FORMER",
      "TRANSLATION",
      "OTHER",
    ]);

    expect(
      OrganizationNameSchema.parse({
        id: "organization-name-meridian",
        organizationId: "organization-meridian",
        name: "Meridian Research Foundation Inc",
        normalizedName: "meridian research foundation inc",
        kind: "LEGAL",
        jurisdictionId: null,
        languageCode: "en",
        validFrom: null,
        validUntil: null,
        sourceUrl: "https://example.org/terms",
        sourceRef: "test-organization-name:meridian:legal",
        createdByUserId: "user-mike",
        verifiedByUserId: "user-mike",
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }).kind,
    ).toBe("LEGAL");

    const baseName = {
      id: "organization-name-meridian",
      organizationId: "organization-meridian",
      name: "Meridian Research Foundation Inc",
      kind: "LEGAL" as const,
      jurisdictionId: null,
      languageCode: "en",
      sourceUrl: null,
      sourceRef: null,
      createdByUserId: null,
      verifiedByUserId: null,
      verifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    expect(
      OrganizationNameSchema.safeParse({
        ...baseName,
        normalizedName: "",
        validFrom: null,
        validUntil: null,
      }).success,
    ).toBe(false);
    expect(
      OrganizationNameSchema.safeParse({
        ...baseName,
        normalizedName: "meridian research foundation inc",
        validFrom: new Date("2026-02-01T00:00:00Z"),
        validUntil: new Date("2026-01-01T00:00:00Z"),
      }).success,
    ).toBe(false);
  });
});
