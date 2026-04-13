import { describe, expect, it } from "vitest";
import { GOVERNMENTS, getGovernmentMetrics } from "@optimitron/data";
import {
  GOVERNMENT_SCATTERPLOT_DEFAULT_X,
  GOVERNMENT_SCATTERPLOT_DEFAULT_Y,
  buildGovernmentScatterplotData,
  calculatePearsonCorrelation,
  describeCorrelation,
  filterGovernmentScatterOutliers,
  formatGovernmentScatterMetricValue,
  getGovernmentScatterMetricValue,
} from "./governmentScatterplotMetrics";

describe("governmentScatterplotMetrics", () => {
  it("extracts the default metric pair values", () => {
    const singapore = getGovernmentMetrics("SG");
    expect(singapore).toBeDefined();
    expect(
      getGovernmentScatterMetricValue(singapore!, GOVERNMENT_SCATTERPLOT_DEFAULT_X),
    ).toBeGreaterThan(0);
    expect(
      getGovernmentScatterMetricValue(singapore!, GOVERNMENT_SCATTERPLOT_DEFAULT_Y),
    ).toBe(73.9);
  });

  it("extracts military spending per capita PPP", () => {
    const us = getGovernmentMetrics("US");

    expect(us).toBeDefined();
    expect(
      getGovernmentScatterMetricValue(us!, "militaryPerCapitaPPP"),
    ).toBeCloseTo((3.4 / 100) * 80_035, 4);
  });

  it("extracts normalized government research, trial, and export values", () => {
    const us = getGovernmentMetrics("US");

    expect(us).toBeDefined();
    expect(
      getGovernmentScatterMetricValue(us!, "govMedicalResearch"),
    ).toBeCloseTo(((47_100_000_000 / 886_000_000_000) * (3.4 / 100) * 80_035), 4);
    expect(
      getGovernmentScatterMetricValue(us!, "clinicalTrials"),
    ).toBeCloseTo(((810_000_000 / 886_000_000_000) * (3.4 / 100) * 80_035), 4);
    expect(
      getGovernmentScatterMetricValue(us!, "armsExports"),
    ).toBeCloseTo(((23_800_000_000 / 886_000_000_000) * (3.4 / 100) * 80_035), 4);
  });

  it("builds comparable scatterplot points for the default metric pair", () => {
    const points = buildGovernmentScatterplotData(
      GOVERNMENTS,
      GOVERNMENT_SCATTERPLOT_DEFAULT_X,
      GOVERNMENT_SCATTERPLOT_DEFAULT_Y,
    );

    expect(points.length).toBe(GOVERNMENTS.length);
    expect(points[0]?.name).toBe("Australia");
    expect(points.at(-1)?.name).toBe("United States");
  });

  it("filters outliers with an IQR rule across both axes", () => {
    const points = [
      { code: "A", name: "Alpha", x: 1, y: 1, bodyCount: 1 },
      { code: "B", name: "Beta", x: 2, y: 2, bodyCount: 2 },
      { code: "C", name: "Gamma", x: 3, y: 3, bodyCount: 3 },
      { code: "D", name: "Delta", x: 4, y: 4, bodyCount: 4 },
      { code: "E", name: "Extreme", x: 100, y: 3, bodyCount: 5 },
    ];

    expect(filterGovernmentScatterOutliers(points).map((point) => point.code)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);
  });

  it("keeps small point sets unchanged when IQR filtering is not meaningful", () => {
    const points = [
      { code: "A", name: "Alpha", x: 1, y: 1, bodyCount: 1 },
      { code: "B", name: "Beta", x: 2, y: 2, bodyCount: 2 },
      { code: "C", name: "Gamma", x: 50, y: 50, bodyCount: 3 },
    ];

    expect(filterGovernmentScatterOutliers(points)).toEqual(points);
  });

  it("formats and summarizes correlation output", () => {
    const points = buildGovernmentScatterplotData(
      GOVERNMENTS,
      GOVERNMENT_SCATTERPLOT_DEFAULT_X,
      GOVERNMENT_SCATTERPLOT_DEFAULT_Y,
    );
    const correlation = calculatePearsonCorrelation(points);

    expect(correlation).not.toBeNull();
    expect(formatGovernmentScatterMetricValue("trialRatio", 51500)).toBe("51,500:1");
    expect(formatGovernmentScatterMetricValue("militaryPerCapitaPPP", 2721.19)).toBe("$2.7K");
    expect(formatGovernmentScatterMetricValue("hale", 73.1)).toBe("73.1 yrs");
    expect(describeCorrelation(correlation)).toMatch(
      /Strong|Moderate|Weak/,
    );
  });
});
