import { describe, expect, it } from "vitest";
import {
  buildTreatyParameterExport,
  getTreatyParameterSetHash,
} from "./treaty-parameter-export";

describe("treaty-parameter-export", () => {
  it("builds the treaty parameter export from @optimitron/data", () => {
    const treatyExport = buildTreatyParameterExport();

    expect(treatyExport.sourceFile).toBe(
      "packages/data/src/parameters/parameters-calculations-citations.ts",
    );
    expect(treatyExport.parameters.POLITICAL_SUCCESS_PROBABILITY?.value).toBeGreaterThan(0);
    expect(treatyExport.parameters.TREATY_CAMPAIGN_TOTAL_COST?.value).toBeGreaterThan(0);
    expect(treatyExport.citations["icbl-ottawa-treaty"]?.url).toMatch(/^https?:\/\//);
  });

  it("returns a stable treaty parameter set hash", () => {
    expect(getTreatyParameterSetHash()).toBe(getTreatyParameterSetHash());
    expect(getTreatyParameterSetHash()).toMatch(/^sha256:/);
  });
});
