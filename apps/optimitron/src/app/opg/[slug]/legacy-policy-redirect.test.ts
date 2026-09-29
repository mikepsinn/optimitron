import { describe, expect, it } from "vitest";
import { retiredPolicyRedirectPath } from "./legacy-policy-redirect";

describe("retiredPolicyRedirectPath", () => {
  it("sends a retired per-line slug to the current policy for its spending field", () => {
    const policies = [
      { name: "Universal Pre-K (Ages 3-4)" },
      // Benchmark country differs from the retired slug's; the field still matches.
      { name: "National Health Spending: Adopt Japan's Approach", oecdSpendingField: "healthSpendingPerCapitaPpp" },
    ];

    expect(retiredPolicyRedirectPath("veterans-affairs-adopt-south-korea-s-approach", policies)).toBe(
      "/opg/national-health-spending-adopt-japan-s-approach",
    );
  });

  it("sends a retired slug to the policy index when its field has no policy", () => {
    expect(retiredPolicyRedirectPath("labor-adopt-singapore-s-approach", [])).toBe("/opg");
  });

  it.each([
    ["national-randd-spending-adopt-netherlands-s-approach", "rdSpendingPerCapitaPpp"],
    ["public-social-spending-adopt-singapore-s-approach", "socialSpendingPerCapitaPpp"],
  ])("keeps the retired field policy %s reachable", (slug, field) => {
    expect(retiredPolicyRedirectPath(slug, [])).toBe("/opg");
    expect(retiredPolicyRedirectPath(slug, [
      { name: "A successor policy", oecdSpendingField: field },
    ])).toBe("/opg/a-successor-policy");
  });

  it("leaves slugs that were never retired alone", () => {
    expect(retiredPolicyRedirectPath("no-such-policy", [])).toBeNull();
  });
});
