import { describe, expect, it } from "vitest";
import { FEATURED_PUBLIC_SYSTEMS } from "./OptimizedPublicAdministration";
import { POLICY_ROW_LIMIT, topDistinctPolicies } from "./PolicyGradeTable";

describe("OptimizedPublicAdministration", () => {
  it("every featured system's code anchor still exists in its agency's replacement code", () => {
    // Guards against dataset edits silently degrading the code chips to
    // the first-lines fallback.
    for (const system of FEATURED_PUBLIC_SYSTEMS) {
      expect(
        system.agency.replacementCode.includes(system.codeAnchor),
        `anchor "${system.codeAnchor}" missing from ${system.agency.id} replacementCode`,
      ).toBe(true);
    }
  });
});

describe("PolicyGradeTable", () => {
  it("shows at most the row limit, named structural reforms only", () => {
    const rows = topDistinctPolicies();
    expect(rows.length).toBeLessThanOrEqual(POLICY_ROW_LIMIT);
    expect(rows.length).toBeGreaterThan(0);
    // Template benchmark rows ("Category: Adopt Country X's Approach") are
    // generator filler and must never reach the exhibit.
    for (const row of rows) {
      expect(row.name).not.toMatch(/: Adopt .+'s Approach$/);
    }
  });
});
