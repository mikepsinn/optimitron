import { describe, expect, it } from "vitest";
import { GOVERNMENT_SCATTER_METRICS } from "./governmentScatterplotMetrics";
import { filterGovernmentScatterMetricOptions } from "./GovernmentScatterMetricPicker";

describe("GovernmentScatterMetricPicker", () => {
  it("returns all metrics when the query is empty", () => {
    expect(filterGovernmentScatterMetricOptions("")).toHaveLength(
      GOVERNMENT_SCATTER_METRICS.length,
    );
  });

  it("matches metrics by label fragments", () => {
    expect(
      filterGovernmentScatterMetricOptions("trials").map((metric) => metric.key),
    ).toContain("clinicalTrials");
    expect(
      filterGovernmentScatterMetricOptions("military/cap").map((metric) => metric.key),
    ).toEqual(["militaryPerCapitaPPP"]);
  });
});
