import { describe, expect, it } from "vitest";
import { recommendationDirection } from "./recommendation-direction";

describe("recommendationDirection", () => {
  it("keeps maintain recommendations neutral even when model values differ", () => {
    expect(
      recommendationDirection({
        currentSpending: 120,
        optimalSpendingNominal: 100,
        recommendation: "maintain",
      }),
    ).toBe("neutral");
  });

  it("preserves explicit increase and decrease actions", () => {
    expect(
      recommendationDirection({
        currentSpending: 120,
        optimalSpendingNominal: 100,
        recommendation: "increase",
      }),
    ).toBe("increase");
    expect(
      recommendationDirection({
        currentSpending: 80,
        optimalSpendingNominal: 100,
        recommendation: "decrease",
      }),
    ).toBe("decrease");
  });

  it("returns neutral when current and optimal spending match", () => {
    expect(
      recommendationDirection({
        currentSpending: 100,
        optimalSpendingNominal: 100,
        recommendation: "adjust",
      }),
    ).toBe("neutral");
  });
});
