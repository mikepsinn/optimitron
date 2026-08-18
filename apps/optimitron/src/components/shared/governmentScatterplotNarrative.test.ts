import { describe, expect, it } from "vitest";
import { describeGovernmentScatterRelationship } from "./governmentScatterplotNarrative";

describe("governmentScatterplotNarrative", () => {
  it("describes a negative relationship with direction, strength, and correlation", () => {
    const description = describeGovernmentScatterRelationship({
      correlation: -0.58,
      hiddenOutliers: 0,
      pointCount: 18,
      xLabel: "Mil/Trials",
      yLabel: "HALE",
    });

    expect(description).toContain("18 comparable countries");
    expect(description).toContain("lower HALE");
    expect(description).toContain("moderate inverse relationship");
    expect(description).toContain("r=-0.58");
  });

  it("mentions excluded outliers when the filter is enabled", () => {
    const description = describeGovernmentScatterRelationship({
      correlation: 0.74,
      hiddenOutliers: 2,
      pointCount: 12,
      xLabel: "Military/cap PPP",
      yLabel: "GDP Per Capita",
    });

    expect(description).toContain("excluding 2 outliers");
    expect(description).toContain("higher GDP Per Capita");
    expect(description).toContain("strong positive relationship");
    expect(description).toContain("r=0.74");
  });

  it("describes faint correlations cautiously", () => {
    const description = describeGovernmentScatterRelationship({
      correlation: 0.11,
      hiddenOutliers: 0,
      pointCount: 10,
      xLabel: "Debt % GDP",
      yLabel: "HALE",
    });

    expect(description).toContain("faint relationship");
    expect(description).toContain("read cautiously");
    expect(description).toContain("r=0.11");
  });

  it("handles insufficient data", () => {
    const description = describeGovernmentScatterRelationship({
      correlation: null,
      hiddenOutliers: 0,
      pointCount: 1,
      xLabel: "Mil/Trials",
      yLabel: "HALE",
    });

    expect(description).toContain("not enough comparable countries");
    expect(description).toContain("Mil/Trials");
    expect(description).toContain("HALE");
  });
});
