import { describe, expect, it } from "vitest";
import { getPolicyEvidence } from "./policy-evidence-map";

describe("policy evidence relevance", () => {
  it("does not pass off healthcare-system or narcotics-policy evidence as trial funding evidence", () => {
    const evidence = getPolicyEvidence("Pragmatic Clinical Trial Funding Reform", "health_research", "Fund drug research and pragmatic clinical trials");
    expect(evidence.experiments).toEqual([]);
    expect(evidence.comparison).toBeNull();
  });
  it("still links decriminalization to the relevant observed interventions", () => {
    const evidence = getPolicyEvidence("Shift Drug Policy from Criminal to Health Approach", "health", "Decriminalize personal use");
    expect(evidence.comparison?.type).toBe("drug");
    expect(evidence.experiments.some((entry) => entry.computed.policy === "Drug Decriminalization")).toBe(true);
  });
});
