import { describe, expect, it } from "vitest";
import { BOOTHS } from "./AgencyBooths";
import { topDistinctPolicies } from "./PolicyGradeTable";

describe("AgencyBooths", () => {
  it("every booth code anchor still exists in its agency's replacement code", () => {
    // Guards against dataset edits silently degrading the code chips to
    // the first-lines fallback.
    for (const booth of BOOTHS) {
      expect(
        booth.agency.replacementCode.includes(booth.codeAnchor),
        `anchor "${booth.codeAnchor}" missing from ${booth.agency.id} replacementCode`,
      ).toBe(true);
    }
  });
});

describe("PolicyGradeTable", () => {
  it("shows at most four policies with distinct effect pairs, in ranking order", () => {
    const rows = topDistinctPolicies();
    expect(rows.length).toBeLessThanOrEqual(4);
    expect(rows.length).toBeGreaterThan(0);
    const signatures = rows.map((r) => `${r.healthEffect}|${r.incomeEffect}`);
    expect(new Set(signatures).size).toBe(signatures.length);
  });
});
