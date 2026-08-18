import { describe, expect, it } from "vitest";
import {
  buildScatterRegressionSegment,
  calculateScatterRegressionLine,
  getScatterAxisDomain,
} from "./governmentScatterplotGeometry";

describe("governmentScatterplotGeometry", () => {
  it("pads positive axis domains around the plotted values", () => {
    expect(getScatterAxisDomain([10, 20, 30])).toEqual([8.4, 31.6]);
  });

  it("keeps constant domains readable", () => {
    expect(getScatterAxisDomain([73.9, 73.9])).toEqual([66.51, 81.29]);
  });

  it("calculates a least-squares regression line", () => {
    expect(
      calculateScatterRegressionLine([
        { code: "A", name: "Alpha", x: 1, y: 3, bodyCount: 0 },
        { code: "B", name: "Beta", x: 2, y: 5, bodyCount: 0 },
        { code: "C", name: "Gamma", x: 3, y: 7, bodyCount: 0 },
      ]),
    ).toEqual({ slope: 2, intercept: 1 });
  });

  it("builds a regression segment across the axis domain", () => {
    expect(
      buildScatterRegressionSegment(
        [
          { code: "A", name: "Alpha", x: 1, y: 3, bodyCount: 0 },
          { code: "B", name: "Beta", x: 2, y: 5, bodyCount: 0 },
          { code: "C", name: "Gamma", x: 3, y: 7, bodyCount: 0 },
        ],
        [0, 4],
      ),
    ).toEqual([
      { x: 0, y: 1 },
      { x: 4, y: 9 },
    ]);
  });
});
