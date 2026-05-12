import { describe, expect, it } from "vitest";
import { ReferendumKind, ReferendumStatus } from "../generated/prisma/client.js";
import {
  HUMANITY_V_GOVERNMENT_CASE_SLUG,
  HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
  MANAGED_HUMANITY_V_GOVERNMENT_CASE,
  MANAGED_HUMANITY_V_GOVERNMENT_VERDICT,
} from "./managed-humanity-v-government.js";

describe("managed Humanity v Government data", () => {
  it("defines the court case verdict as a court-case referendum", () => {
    expect(MANAGED_HUMANITY_V_GOVERNMENT_CASE.slug).toBe(
      HUMANITY_V_GOVERNMENT_CASE_SLUG,
    );
    expect(MANAGED_HUMANITY_V_GOVERNMENT_CASE.juryReferendumSlug).toBe(
      HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
    );
    expect(MANAGED_HUMANITY_V_GOVERNMENT_VERDICT).toMatchObject({
      slug: HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
      kind: ReferendumKind.COURT_CASE,
      status: ReferendumStatus.ACTIVE,
    });
    expect(MANAGED_HUMANITY_V_GOVERNMENT_VERDICT.question).toContain(
      "full damages",
    );
    expect(MANAGED_HUMANITY_V_GOVERNMENT_VERDICT.question).toContain(
      "$2.74 million",
    );
  });
});
